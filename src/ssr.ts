import type { Page, SSROptions, SSRResult } from './types.js';
import { createLogger } from './logger.js';
import {
  CircuitBreaker,
  shouldRetry,
  calculateBackoff,
  DEFAULT_CIRCUIT_OPTIONS,
  type CircuitBreakerOptions,
  type RetryOptions,
  type SSRResilienceOptions,
} from './circuit-breaker.js';

const DEFAULT_SSR_URL = 'http://127.0.0.1:13714/render';
const DEFAULT_TIMEOUT = 2000;
const logger = createLogger({ prefix: 'express-inertia:ssr' });

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  baseDelayMs: 200,
  maxDelayMs: 2000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(endpoint: string, options?: Partial<SSRResilienceOptions>): CircuitBreaker {
  const key = options?.circuitBreaker ? `${endpoint}:${JSON.stringify(options.circuitBreaker)}` : endpoint;
  let breaker = circuitBreakers.get(key);
  if (!breaker) {
    const cbOptions: Required<CircuitBreakerOptions> = {
      ...DEFAULT_CIRCUIT_OPTIONS,
      ...options?.circuitBreaker,
    };
    breaker = new CircuitBreaker(cbOptions);
    circuitBreakers.set(key, breaker);
  }
  return breaker;
}

export function resetAllCircuitBreakers(): void {
  for (const breaker of circuitBreakers.values()) {
    breaker.reset();
  }
  circuitBreakers.clear();
}

/**
 * Executes Server-Side Rendering (SSR) for the given Inertia page.
 * Returns head elements and rendered HTML body, or null if SSR is disabled or fails.
 */
export async function renderSSR(
  page: Page,
  options?: boolean | SSROptions
): Promise<SSRResult | null> {
  if (!options) {
    return null;
  }

  const ssrConfig: SSROptions = typeof options === 'boolean' ? { enabled: options } : options;

  if (ssrConfig.enabled === false) {
    return null;
  }

  // Use custom render function if provided
  if (typeof ssrConfig.render === 'function') {
    try {
      return await renderWithRetry(async () => {
        return await ssrConfig.render!(page);
      }, ssrConfig.retry, page.component);
    } catch (err) {
      if (ssrConfig.fallback === false) {
        throw err;
      }
      logger.warn('Custom SSR render failed, falling back to client-side', {
        error: (err as Error).message,
        component: page.component,
      });
      return null;
    }
  }

  const endpoint = ssrConfig.url || DEFAULT_SSR_URL;
  const timeout = ssrConfig.timeout || DEFAULT_TIMEOUT;
  const retryOptions: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...ssrConfig.retry,
  };
  const breaker = getCircuitBreaker(endpoint, ssrConfig);

  try {
    const result = await breaker.execute(() =>
      renderWithRetry(
        () => renderHttpSSR(page, endpoint, timeout),
        retryOptions,
        page.component
      )
    );
    return result;
  } catch (err) {
    if (ssrConfig.fallback === false) {
      throw err;
    }
    logger.warn('SSR rendering failed, falling back to client rendering', {
      endpoint,
      component: page.component,
      error: (err as Error).message,
    });
    return null;
  }
}

async function renderHttpSSR(
  page: Page,
  endpoint: string,
  timeout: number
): Promise<SSRResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let pageJson: string;
  try {
    pageJson = JSON.stringify(page);
  } catch (err: any) {
    throw new Error(`Failed to serialize page for SSR: ${err.message}`);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: pageJson,
    signal: controller.signal,
  });

  clearTimeout(timer);

  if (!response.ok) {
    throw new Error(`SSR server responded with status: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as SSRResult;
  return {
    head: Array.isArray(data.head) ? data.head : [],
    body: typeof data.body === 'string' ? data.body : '',
  };
}

async function renderWithRetry<T>(
  fn: () => Promise<T>,
  retryOptions?: Partial<RetryOptions>,
  context?: string
): Promise<T> {
  const options: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptions,
  };

  let lastError: any;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      if (attempt >= options.maxRetries) {
        break;
      }

      const statusCode = err.status || err.response?.status;
      if (!shouldRetry(err, statusCode, options.retryableStatusCodes)) {
        break;
      }

      const delay = calculateBackoff(attempt, options.baseDelayMs, options.maxDelayMs);
      logger.warn('SSR request failed, retrying', {
        attempt: attempt + 1,
        maxRetries: options.maxRetries,
        delayMs: Math.round(delay),
        error: err.message,
        component: context,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

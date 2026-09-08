export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /**
   * Number of consecutive failures before opening the circuit.
   * @default 5
   */
  failureThreshold: number;
  /**
   * Time in milliseconds before transitioning from OPEN to HALF_OPEN.
   * @default 30000
   */
  cooldownMs: number;
  /**
   * Time in milliseconds to wait in HALF_OPEN before succeeding.
   * @default 1000
   */
  probeDelayMs: number;
}

export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   * @default 2
   */
  maxRetries: number;
  /**
   * Base delay in milliseconds for exponential backoff.
   * @default 200
   */
  baseDelayMs: number;
  /**
   * Maximum delay in milliseconds between retries.
   * @default 2000
   */
  maxDelayMs: number;
  /**
   * HTTP status codes that should trigger a retry.
   * @default [408, 429, 500, 502, 503, 504]
   */
  retryableStatusCodes: number[];
}

export interface SSRResilienceOptions {
  circuitBreaker?: Partial<CircuitBreakerOptions>;
  retry?: Partial<RetryOptions>;
}

export const DEFAULT_CIRCUIT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  cooldownMs: 30_000,
  probeDelayMs: 1000,
};

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  baseDelayMs: 200,
  maxDelayMs: 2000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

const circuitBreakers = new Map<string, CircuitBreaker>();

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private openedAt = 0;
  private probeTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingProbe: Promise<void> | null = null;

  constructor(private options: Required<CircuitBreakerOptions> = DEFAULT_CIRCUIT_OPTIONS) {}

  getState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() - this.openedAt >= this.options.cooldownMs) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();

    if (state === 'OPEN') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    if (this.probeTimer) {
      clearTimeout(this.probeTimer);
      this.probeTimer = null;
    }
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }

  async allowProbe<T>(fn: () => Promise<T>): Promise<T> {
    if (this.getState() !== 'HALF_OPEN') {
      throw new Error('Circuit breaker is not in HALF_OPEN state');
    }

    if (this.pendingProbe) {
      return this.pendingProbe.then(() => fn());
    }

    this.pendingProbe = new Promise<void>((resolve) => {
      this.probeTimer = setTimeout(() => {
        this.pendingProbe = null;
        resolve();
      }, this.options.probeDelayMs);
    });

    return this.pendingProbe.then(() => fn());
  }

  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.openedAt = 0;
    if (this.probeTimer) {
      clearTimeout(this.probeTimer);
      this.probeTimer = null;
    }
    this.pendingProbe = null;
  }
}

export function shouldRetry(
  error: any,
  statusCode: number | undefined,
  retryableStatusCodes: number[]
): boolean {
  if (error?.name === 'AbortError' || error?.name === 'TypeError') {
    return true;
  }

  if (typeof statusCode === 'number' && retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

export function resetAllCircuitBreakers(): void {
  for (const breaker of circuitBreakers.values()) {
    breaker.reset();
  }
  circuitBreakers.clear();
}

export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exponential + jitter, maxDelayMs);
}

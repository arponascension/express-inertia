import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderSSR, resetAllCircuitBreakers } from '../src/ssr.js';
import type { Page } from '../src/types.js';

const mockPage: Page = {
  component: 'Home',
  props: { title: 'SSR Page' },
  url: '/',
  version: '1.0',
};

describe('SSR Resilience', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
    vi.restoreAllMocks();
  });

  it('retries on transient failures', async () => {
    let attempts = 0;
    const mockFetch = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new TypeError('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ head: ['<title inertia>SSR</title>'], body: '<div>SSR</div>' }),
      });
    });

    global.fetch = mockFetch as any;

    const result = await renderSSR(mockPage, {
      enabled: true,
      url: 'http://localhost:13714/render',
      timeout: 5000,
      retry: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
    });

    expect(result).not.toBeNull();
    expect(result?.body).toBe('<div>SSR</div>');
    expect(attempts).toBe(3);
  });

  it('does not retry on 400 errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    global.fetch = mockFetch as any;

    const result = await renderSSR(mockPage, {
      enabled: true,
      url: 'http://localhost:13714/render',
      timeout: 5000,
      retry: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 },
    });

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('opens circuit breaker after repeated failures', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch as any;

    const options = {
      enabled: true,
      url: 'http://localhost:13714/render',
      timeout: 5000,
      retry: { maxRetries: 0, baseDelayMs: 10, maxDelayMs: 100 },
      circuitBreaker: { failureThreshold: 2, cooldownMs: 60000 },
    };

    for (let i = 0; i < 2; i++) {
      await renderSSR(mockPage, options);
    }

    const result = await renderSSR(mockPage, options);
    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('falls back to null on custom render error when fallback is true', async () => {
    const failingRender = async () => {
      throw new Error('Render crash');
    };

    const result = await renderSSR(mockPage, {
      enabled: true,
      render: failingRender,
      fallback: true,
      retry: { maxRetries: 0 },
    });

    expect(result).toBeNull();
  });

  it('throws on custom render error when fallback is false', async () => {
    const failingRender = async () => {
      throw new Error('Render crash');
    };

    await expect(
      renderSSR(mockPage, {
        enabled: true,
        render: failingRender,
        fallback: false,
        retry: { maxRetries: 0 },
      })
    ).rejects.toThrow('Render crash');
  });
});

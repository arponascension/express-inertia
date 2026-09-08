import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  shouldRetry,
  calculateBackoff,
  DEFAULT_CIRCUIT_OPTIONS,
  DEFAULT_RETRY_OPTIONS,
  resetAllCircuitBreakers,
} from '../src/circuit-breaker.js';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
  });

  it('starts in CLOSED state', () => {
    const breaker = new CircuitBreaker();
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('transitions to OPEN after threshold failures', async () => {
    const breaker = new CircuitBreaker({ ...DEFAULT_CIRCUIT_OPTIONS, failureThreshold: 3 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(fn);
      } catch {}
    }

    expect(breaker.getState()).toBe('CLOSED');

    try {
      await breaker.execute(fn);
    } catch {}

    expect(breaker.getState()).toBe('OPEN');
  });

  it('rejects immediately when OPEN', async () => {
    const breaker = new CircuitBreaker({ ...DEFAULT_CIRCUIT_OPTIONS, failureThreshold: 1 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    try {
      await breaker.execute(fn);
    } catch {}

    expect(breaker.getState()).toBe('OPEN');

    await expect(breaker.execute(() => Promise.resolve('ok'))).rejects.toThrow('Circuit breaker is open');
  });

  it('transitions to HALF_OPEN after cooldown', async () => {
    const breaker = new CircuitBreaker({
      ...DEFAULT_CIRCUIT_OPTIONS,
      failureThreshold: 1,
      cooldownMs: 100,
    });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    try {
      await breaker.execute(fn);
    } catch {}

    expect(breaker.getState()).toBe('OPEN');

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(breaker.getState()).toBe('HALF_OPEN');
  });

  it('transitions back to CLOSED on successful probe', async () => {
    const breaker = new CircuitBreaker({
      ...DEFAULT_CIRCUIT_OPTIONS,
      failureThreshold: 1,
      cooldownMs: 100,
      probeDelayMs: 50,
    });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    try {
      await breaker.execute(fn);
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(breaker.getState()).toBe('HALF_OPEN');

    await breaker.execute(() => Promise.resolve('ok'));

    expect(breaker.getState()).toBe('CLOSED');
  });

  it('resets to CLOSED', async () => {
    const breaker = new CircuitBreaker({ ...DEFAULT_CIRCUIT_OPTIONS, failureThreshold: 1 });
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    try {
      await breaker.execute(fn);
    } catch {}

    expect(breaker.getState()).toBe('OPEN');

    breaker.reset();

    expect(breaker.getState()).toBe('CLOSED');
    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe('ok');
  });
});

describe('shouldRetry', () => {
  it('retries on AbortError', () => {
    expect(shouldRetry(Object.assign(new Error('aborted'), { name: 'AbortError' }), undefined, DEFAULT_RETRY_OPTIONS.retryableStatusCodes)).toBe(true);
  });

  it('retries on network TypeError', () => {
    expect(shouldRetry(new TypeError('fetch failed'), undefined, DEFAULT_RETRY_OPTIONS.retryableStatusCodes)).toBe(true);
  });

  it('retries on retryable status codes', () => {
    expect(shouldRetry(new Error('server error'), 503, DEFAULT_RETRY_OPTIONS.retryableStatusCodes)).toBe(true);
    expect(shouldRetry(new Error('server error'), 500, DEFAULT_RETRY_OPTIONS.retryableStatusCodes)).toBe(true);
  });

  it('does not retry on 4xx errors', () => {
    expect(shouldRetry(new Error('bad request'), 400, DEFAULT_RETRY_OPTIONS.retryableStatusCodes)).toBe(false);
    expect(shouldRetry(new Error('not found'), 404, DEFAULT_RETRY_OPTIONS.retryableStatusCodes)).toBe(false);
  });
});

describe('calculateBackoff', () => {
  it('increases exponentially with jitter', () => {
    const base = 100;
    const max = 5000;

    const d0 = calculateBackoff(0, base, max);
    expect(d0).toBeGreaterThanOrEqual(base);
    expect(d0).toBeLessThanOrEqual(base * 2);

    const d1 = calculateBackoff(1, base, max);
    expect(d1).toBeGreaterThanOrEqual(base * 2);
    expect(d1).toBeLessThanOrEqual(base * 3);
  });

  it('caps at maxDelayMs', () => {
    const delay = calculateBackoff(10, 100, 500);
    expect(delay).toBeLessThanOrEqual(500);
  });
});

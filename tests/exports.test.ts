import { describe, it, expect } from 'vitest';
import * as pkg from '../src/index.js';

describe('package entry point exports', () => {
  it('exposes the middleware API with an alias default export', () => {
    expect(typeof pkg.createInertia).toBe('function');
    expect(pkg.inertia).toBe(pkg.createInertia);
    expect(typeof pkg.requestIdMiddleware).toBe('function');
    expect(typeof (pkg as any).default).toBe('function');
    expect((pkg as any).default).toBe(pkg.createInertia);
  });

  it('exposes engine helpers and the default engine instance', () => {
    expect(typeof pkg.createInertiaEngine).toBe('function');
    expect(typeof pkg.clearEngineCache).toBe('function');
    expect(pkg.inertiaEngine).toBeDefined();
  });

  it('exposes all prop helpers and type guards', () => {
    for (const name of [
      'lazy',
      'always',
      'defer',
      'merge',
      'optional',
      'isLazy',
      'isAlways',
      'isDeferred',
      'isMerge',
      'isOptional',
      'resolveProps',
    ]) {
      expect((pkg as any)[name]).toBeTypeOf('function');
    }
  });

  it('exposes utility helpers and defaults', () => {
    for (const name of [
      'escapeHtmlAttr',
      'serializePage',
      'safeStringify',
      'validateComponentName',
      'sanitizeViewData',
      'generateSriHash',
    ]) {
      expect((pkg as any)[name]).toBeTypeOf('function');
    }
    expect(pkg.DEFAULT_COMPONENT_NAME_PATTERN).toBeInstanceOf(RegExp);
    expect(pkg.DEFAULT_SECURITY_OPTIONS).toBeDefined();
  });

  it('exposes the SSR and circuit breaker API', () => {
    for (const name of [
      'renderSSR',
      'resetAllCircuitBreakers',
      'CircuitBreaker',
      'shouldRetry',
      'calculateBackoff',
    ]) {
      expect((pkg as any)[name]).toBeTypeOf('function');
    }
  });

  it('exposes the Vite integration API', () => {
    expect(typeof pkg.createViteHelper).toBe('function');
    expect(typeof pkg.inertiaVitePlugin).toBe('function');
    expect(typeof pkg.ViteHelper).toBe('function');
    expect(pkg.defaultViteHelper).toBeDefined();
  });

  it('exposes the directives and prefetch APIs', () => {
    expect(typeof pkg.compileBladeDirectives).toBe('function');
    expect(typeof pkg.registerDirective).toBe('function');
    expect(typeof pkg.clearCustomDirectives).toBe('function');
    expect(typeof pkg.createPrefetchHelper).toBe('function');
    expect(typeof pkg.PrefetchHelper).toBe('function');
  });

  it('exposes the logger API', () => {
    for (const name of ['createLogger', 'getGlobalLogger', 'setGlobalLogger']) {
      expect((pkg as any)[name]).toBeTypeOf('function');
    }
  });
});
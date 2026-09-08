import { createInertia } from './middleware.js';

export { createInertia, createInertia as inertia, requestIdMiddleware } from './middleware.js';
export default createInertia;

export {
  createInertiaEngine,
  inertiaEngine,
  clearEngineCache,
  type TemplateLocals,
} from './engine.js';

export {
  createViteHelper,
  defaultViteHelper,
  ViteHelper,
  inertiaVitePlugin,
  type ViteManifest,
  type ViteManifestChunk,
  type InertiaVitePlugin,
  type InertiaVitePluginOptions,
} from './vite.js';

export {
  compileBladeDirectives,
  registerDirective,
} from './directives.js';

export {
  lazy,
  always,
  defer,
  merge,
  optional,
  isLazy,
  isAlways,
  isDeferred,
  isMerge,
  isOptional,
  resolveProps,
  escapeHtmlAttr,
  serializePage,
  safeStringify,
  validateComponentName,
  sanitizeViewData,
  generateSriHash,
  DEFAULT_COMPONENT_NAME_PATTERN,
} from './utils.js';

export {
  renderSSR,
  resetAllCircuitBreakers,
} from './ssr.js';

export {
  createPrefetchHelper,
  PrefetchHelper,
  type PrefetchOptions,
  type PrefetchEntry,
} from './prefetch.js';

export {
  CircuitBreaker,
  shouldRetry,
  calculateBackoff,
  type CircuitBreakerOptions,
  type RetryOptions,
  type SSRResilienceOptions,
} from './circuit-breaker.js';

export {
  createLogger,
  getGlobalLogger,
  setGlobalLogger,
  type Logger,
  type LoggerOptions,
} from './logger.js';

export type {
  Page,
  PageProps,
  InertiaOptions,
  InertiaRequestHelper,
  InertiaResponseHandler,
  SSROptions,
  SSRResult,
  ViteConfig,
  DirectiveHandler,
  BladeEngineOptions,
  LazyProp,
  AlwaysProp,
  DeferredProp,
  MergeProp,
  OptionalProp,
  PropCallback,
  SecurityOptions,
} from './types.js';

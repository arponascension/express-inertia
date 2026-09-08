import type { Request, Response, NextFunction } from 'express';
import type { CircuitBreakerOptions, RetryOptions, SSRResilienceOptions } from './circuit-breaker.js';

/**
 * Standard Inertia Page Object sent to client-side adapters.
 */
export interface Page<TProps extends PageProps = PageProps> {
  component: string;
  props: TProps;
  url: string;
  version: string | null;
  encryptHistory?: boolean;
  clearHistory?: boolean;
  deferredProps?: Record<string, string[]>;
  mergeProps?: string[];
}

/**
 * Inertia Page Props map.
 */
export type PageProps = Record<string, any>;

/**
 * Callback function or Promise returning a prop value.
 */
export type PropCallback<T = any> = (req?: Request) => T | Promise<T>;

/**
 * Validation options for component names and view paths.
 */
export interface SecurityOptions {
  /**
   * Whether to validate component names to prevent path traversal.
   * @default true
   */
  validateComponentNames?: boolean;
  /**
   * Allowed characters for component names. Defaults to alphanumeric, slashes, hyphens, and underscores.
   */
  componentNamePattern?: RegExp;
}

/**
 * Special Prop Wrapper types
 */
export interface LazyProp<T = any> {
  __inertia_lazy: true;
  callback: PropCallback<T>;
}

export interface AlwaysProp<T = any> {
  __inertia_always: true;
  value: T | PropCallback<T>;
}

export interface DeferredProp<T = any> {
  __inertia_deferred: true;
  callback: PropCallback<T>;
  group?: string;
}

export interface MergeProp<T = any> {
  __inertia_merge: true;
  value: T | PropCallback<T>;
}

export interface OptionalProp<T = any> {
  __inertia_optional: true;
  callback: PropCallback<T>;
}

/**
 * Server-Side Rendering configuration.
 */
export interface SSROptions {
  /**
   * Whether SSR is enabled.
   * @default false
   */
  enabled?: boolean;
  /**
   * SSR rendering endpoint URL.
   * @default 'http://127.0.0.1:13714/render'
   */
  url?: string;
  /**
   * Custom SSR render function (overrides HTTP endpoint).
   */
  render?: (page: Page) => Promise<SSRResult> | SSRResult;
  /**
   * Timeout in milliseconds for SSR request.
   * @default 2000
   */
  timeout?: number;
  /**
   * Fallback to client-side rendering if SSR fails.
   * @default true
   */
  fallback?: boolean;
  /**
   * Circuit breaker configuration for SSR endpoint.
   */
  circuitBreaker?: Partial<CircuitBreakerOptions>;
  /**
   * Retry configuration for SSR requests.
   */
  retry?: Partial<RetryOptions>;
}

/**
 * Result returned by SSR server.
 */
export interface SSRResult {
  head: string[];
  body: string;
}

/**
 * Vite Helper configuration options.
 */
export interface ViteConfig {
  /**
   * Path to the Vite manifest.json file in production.
   * Auto-detected if omitted (checks public/build/.vite/manifest.json and public/build/manifest.json).
   */
  manifestPath?: string;
  /**
   * Public directory path containing compiled assets.
   * @default 'public'
   */
  publicDir?: string;
  /**
   * Build subdirectory name inside publicDir.
   * @default 'build'
   */
  buildDir?: string;
  /**
   * Development server URL.
   * @default 'http://localhost:5173'
   */
  devServerUrl?: string;
  /**
   * Path to the hot file created by Vite dev server.
   * @default 'public/hot' or 'hot'
   */
  hotFile?: string;
  /**
   * Custom base URL path for assets.
   * @default '/build/'
   */
  base?: string;
  /**
   * Override for manifest data. Useful in edge runtimes where fs is unavailable.
   * If provided, manifestPath and fs access are bypassed.
   */
  manifest?: Record<string, any>;
  /**
   * Override for dev detection. Useful in edge runtimes where fs is unavailable.
   * Return true if the Vite dev server should be considered active.
   */
  isDev?: boolean;
  /**
   * Override for dev server URL. Useful in edge runtimes where hot file is unavailable.
   */
  devServerUrlOverride?: string;
}

/**
 * Configuration options for the Inertia Express middleware.
 */
export interface InertiaOptions {
  /**
   * Name of the root view template (e.g. 'base.ejs', 'app.ejs', 'base').
   * @default 'base.ejs'
   */
  rootView?: string;
  /**
   * Version of current assets. Can be a string, or a function/promise resolving to a string.
   * If version mismatches client `X-Inertia-Version`, a 409 Conflict is returned for full reload.
   */
  version?: string | (() => string | Promise<string>);
  /**
   * Server-Side Rendering configuration or boolean.
   */
  ssr?: boolean | SSROptions;
  /**
   * Shared props available across all responses. Can be an object or function taking the Request.
   */
  shared?: PageProps | ((req: Request) => PageProps | Promise<PageProps>);
  /**
   * Default history encryption setting.
   */
  encryptHistory?: boolean;
  /**
   * Vite helper configuration.
   */
  vite?: ViteConfig;
  /**
   * Inertia protocol version for HTML initial page payload.
   * - 2 (default): Outputs clean `<script data-page="app" type="application/json">`
   * - 1: Outputs `<div id="app" data-page="..."></div>` attribute format
   * @default 2
   */
  inertiaVersion?: 1 | 2;
  /**
   * Whether @inertia should automatically render the root container `<div id="app"></div>`.
   * Set to `false` if you write `<div id="app"></div>` manually in your root template.
   * @default true
   */
  rootElement?: boolean | string;
  /**
   * Custom view data passed to the root template view locals.
   */
  viewData?: Record<string, any> | ((req: Request) => Record<string, any> | Promise<Record<string, any>>);
  /**
   * Security configuration options.
   */
  security?: SecurityOptions;
}

/**
 * Context and helper methods available on `res.inertia`.
 */
export interface InertiaResponseHandler {
  /**
   * Render an Inertia response.
   * @param component Name of the client-side component (e.g., 'Users/Index').
   * @param props Page props passed to the component.
   * @param viewData Extra data passed only to the root template (not to the frontend component).
   */
  (component: string, props?: PageProps, viewData?: Record<string, any>): Promise<void>;

  /**
   * Explicit render method.
   */
  render(component: string, props?: PageProps, viewData?: Record<string, any>): Promise<void>;

  /**
   * Alias for the callable render method.
   */
  inertia(component: string, props?: PageProps, viewData?: Record<string, any>): Promise<void>;

  /**
   * Share props for the current request.
   */
  share(keyOrObject: string | PageProps, value?: any): InertiaResponseHandler;

  /**
   * Retrieve currently shared props.
   */
  getShared(key?: string): any;

  /**
   * Perform an external redirect or full page reload.
   * Returns a 409 Conflict with X-Inertia-Location header for Inertia requests,
   * or a standard redirect for full requests.
   */
  location(url: string): void;

  /**
   * Redirect back to the previous page with 303 status code.
   */
  back(fallbackUrl?: string): void;

  /**
   * Set asset version for the current request.
   */
  version(version: string | (() => string | Promise<string>)): InertiaResponseHandler;

  /**
   * Set custom root view for the current response.
   */
  rootView(view: string): InertiaResponseHandler;

  /**
   * Enable/disable history encryption for this response (Inertia v2).
   */
  encryptHistory(encrypt?: boolean): InertiaResponseHandler;

  /**
   * Clear history for this response (Inertia v2).
   */
  clearHistory(clear?: boolean): InertiaResponseHandler;

  /**
   * Attach a flash message to the response.
   */
  withFlash(key: string, value: any): InertiaResponseHandler;

  /**
   * Semantic POST form submission helper.
   */
  postForm(component: string, props?: PageProps, viewData?: Record<string, any>): Promise<void>;

  /**
   * Semantic PUT form submission helper.
   */
  putForm(component: string, props?: PageProps, viewData?: Record<string, any>): Promise<void>;

  /**
   * Semantic PATCH form submission helper.
   */
  patchForm(component: string, props?: PageProps, viewData?: Record<string, any>): Promise<void>;

  /**
   * Semantic DELETE form submission helper.
   */
  deleteForm(component: string, props?: PageProps, viewData?: Record<string, any>): Promise<void>;
}

/**
 * Context available on `req.inertia`.
 */
export interface InertiaRequestHelper {
  /**
   * True if the current request is an Inertia AJAX request.
   */
  isInertia: boolean;
  /**
   * Target component if partial reload is requested.
   */
  partialComponent: string | null;
  /**
   * Array of prop keys requested for partial reload.
   */
  partialData: string[];
  /**
   * Array of prop keys to reset during partial reload.
   */
  resetData: string[];
  /**
   * Client-supplied asset version.
   */
  version: string | null;
}

/**
 * Custom Blade Directive Handler.
 */
export type DirectiveHandler = (args: string, locals: Record<string, any>) => string;

/**
 * Custom View Engine Options for Blade EJS.
 */
export interface BladeEngineOptions {
  /**
   * Enable template caching.
   * Defaults to true when the Vite dev server is not running (i.e. build mode),
   * matching the same auto-detection as the `@vite` directive.
   */
  cache?: boolean;
  /**
   * Vite helper configuration.
   */
  vite?: ViteConfig;
  /**
   * Custom Blade directives.
   */
  directives?: Record<string, DirectiveHandler>;
  /**
   * Inertia protocol version for initial HTML payload (1 or 2).
   * @default 2
   */
  inertiaVersion?: 1 | 2;
  /**
   * Whether to render the root container `<div id="app"></div>` automatically.
   * Set to `false` if writing `<div id="app"></div>` manually in your HTML.
   * @default true
   */
  rootElement?: boolean | string;
  /**
   * Pre-compiled template string. Useful in edge runtimes where fs is unavailable.
   * When provided, the engine will not read from the filesystem.
   */
  templateSource?: string;
  /**
   * Custom template compiler. Receives the raw template source and returns a compiled EJS string.
   * Useful for custom preprocessing before Blade directive compilation.
   */
  compileTemplate?: (source: string) => string;
}

declare global {
  namespace Express {
    interface Request {
      inertia: InertiaRequestHelper;
    }
    interface Response {
      inertia: InertiaResponseHandler;
    }
  }
}

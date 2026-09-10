import fs from 'fs';
import ejs from 'ejs';
import type { BladeEngineOptions, Page, SSRResult } from './types.js';
import { compileBladeDirectives } from './directives.js';
import { createViteHelper, ViteHelper } from './vite.js';
import { serializePage, escapeHtmlAttr } from './utils.js';

export interface TemplateLocals extends Record<string, any> {
  page?: Page;
  ssr?: SSRResult | null;
  _csrf?: string;
  csrfToken?: string;
  routes?: any;
}

/**
 * Registry of all engine instance caches for bulk clearing.
 */
const engineCaches: Set<Map<string, ejs.TemplateFunction>> = new Set();
const engineTimestamps: Set<Map<string, number>> = new Set();

const TEMPLATE_SOURCE_KEY = '__express_inertia_template_source__';

/**
 * Creates an Express view engine with Blade directive support and built-in Inertia/Vite helpers.
 */
export function createInertiaEngine(options?: BladeEngineOptions) {
  const viteHelper: ViteHelper = options?.vite ? createViteHelper(options.vite) : createViteHelper();
  const shouldCache = options?.cache ?? !viteHelper.isDev();

  const inertiaVersion = options?.inertiaVersion ?? 2;
  const defaultRootElement = options?.rootElement ?? true;

  const templateCache = new Map<string, ejs.TemplateFunction>();
  const templateTimestamps = new Map<string, number>();
  engineCaches.add(templateCache);
  engineTimestamps.add(templateTimestamps);

  return function inertiaBladeEngine(
    filePath: string,
    rawOptions: Record<string, any>,
    callback: (err: Error | null, html?: string) => void
  ) {
    try {
      const template = options?.templateSource;
      const hasTemplateSource = template !== undefined;
      const cacheKey = hasTemplateSource ? TEMPLATE_SOURCE_KEY : filePath;

      let compiledTemplate: ejs.TemplateFunction | undefined;
      let templateMtimeMs = -1;

      if (hasTemplateSource) {
        compiledTemplate = templateCache.get(cacheKey);
      } else if (shouldCache) {
        compiledTemplate = templateCache.get(cacheKey);
      } else {
        try {
          templateMtimeMs = fs.statSync(filePath).mtimeMs;
        } catch {
          templateMtimeMs = 0;
        }
        if (templateTimestamps.get(cacheKey) === templateMtimeMs) {
          compiledTemplate = templateCache.get(cacheKey);
        }
      }

      if (!compiledTemplate) {
        const templateSource = template !== undefined ? template : fs.readFileSync(filePath, 'utf-8');
        const compiledSource = options?.compileTemplate
          ? options.compileTemplate(templateSource)
          : compileBladeDirectives(templateSource, options?.directives);

        compiledTemplate = ejs.compile(compiledSource, {
          filename: filePath,
          cache: false,
          async: false,
        });

        templateCache.set(cacheKey, compiledTemplate);
        if (!hasTemplateSource) {
          templateTimestamps.set(cacheKey, templateMtimeMs);
        }
      }

      const locals: TemplateLocals = { ...rawOptions };
      const page: Page | undefined = locals.page;
      const ssr: SSRResult | null | undefined = locals.ssr;
      const effectiveVersion = locals.inertiaVersion ?? inertiaVersion;
      const shouldRenderRootElement = locals.rootElement ?? defaultRootElement;

      // Provide standard Inertia and Blade helpers
      locals.inertiaScript = (id: string = 'app') => {
        if (!page) return '';
        const jsonSafe = JSON.stringify(page).replace(/</g, '\\u003c');
        return `<script data-page="${id}" type="application/json">${jsonSafe}</script>`;
      };

      locals.inertiaData = locals.inertiaScript;

      locals.inertia = (idOrOptions: string | boolean = 'app', version?: 1 | 2) => {
        const id = typeof idOrOptions === 'string' ? idOrOptions : 'app';
        const renderElement = typeof idOrOptions === 'boolean' ? idOrOptions : (shouldRenderRootElement !== false);
        const ver = version ?? effectiveVersion;

        if (!page) {
          return renderElement ? `<div id="${id}"></div>` : '';
        }

        const ssrBody = ssr && ssr.body ? ssr.body : '';

        // Official @inertiajs SSR servers return a fully-wrapped payload
        // (`<script data-page="...">` + `<div data-server-rendered id="app">`) that
        // already includes the page data and root element, so pass it through untouched.
        const ssrFullBody = /<div[^>]*data-server-rendered/.test(ssrBody);

        // Inertia v1: data-page attribute on root div
        if (ver === 1) {
          const pageData = serializePage(page);
          return renderElement ? `<div id="${id}" data-page="${pageData}">${ssrBody}</div>` : '';
        }

        // Inertia v2:
        const jsonSafe = JSON.stringify(page).replace(/</g, '\\u003c');
        const scriptTag = `<script data-page="${id}" type="application/json">${jsonSafe}</script>`;

        if (ssrFullBody) {
          return ssrBody;
        }

        if (!renderElement) {
          return scriptTag;
        }

        return `<div id="${id}">${ssrBody}</div>\n${scriptTag}`;
      };

      locals.inertiaHead = () => {
        if (ssr && Array.isArray(ssr.head) && ssr.head.length > 0) {
          return ssr.head.join('\n');
        }
        return '';
      };

      locals.vite = (entrypoints: string | string[]) => {
        return viteHelper.renderTags(entrypoints);
      };

      locals.viteReactRefresh = () => {
        return viteHelper.renderReactRefresh();
      };

      locals.csrf = () => {
        const token =
          locals._csrf ||
          locals.csrfToken ||
          (typeof locals.req?.csrfToken === 'function' ? locals.req.csrfToken() : '') ||
          '';
        return token ? `<input type="hidden" name="_token" value="${escapeHtmlAttr(token)}">` : '';
      };

      locals.json = (value: any) => {
        return JSON.stringify(value);
      };

      if (!locals.routes) {
        locals.routes = (_group?: string) => {
          if (locals.routeConfig || locals.ziggy) {
            const routesData = JSON.stringify(locals.routeConfig || locals.ziggy).replace(/</g, '\\u003c');
            return `<script>const Ziggy = ${routesData};</script>`;
          }
          return '';
        };
      }

      const html = compiledTemplate(locals);
      callback(null, html);
    } catch (err: unknown) {
      callback(err instanceof Error ? err : new Error(String(err)));
    }
  };
}

/**
 * Default Inertia Blade EJS engine instance.
 */
export const inertiaEngine = createInertiaEngine();

/**
 * Clear all template engine caches (useful during testing or hot reloading).
 */
export function clearEngineCache(): void {
  for (const cache of engineCaches) {
    cache.clear();
  }
  for (const timestamps of engineTimestamps) {
    timestamps.clear();
  }
}

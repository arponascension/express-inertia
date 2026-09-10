import type { Request, Response } from 'express';
import type {
  InertiaOptions,
  InertiaResponseHandler,
  Page,
  PageProps,
  SSRResult,
  SecurityOptions,
} from './types.js';
import { resolveProps } from './utils.js';
import { renderSSR } from './ssr.js';
import {
  validateComponentName,
  DEFAULT_COMPONENT_NAME_PATTERN,
  DEFAULT_SECURITY_OPTIONS,
  sanitizeViewData,
  safeStringify,
} from './utils.js';

export function createInertiaResponse(
  req: Request,
  res: Response,
  options: InertiaOptions,
  globalSharedProps: PageProps = {}
): InertiaResponseHandler {
  const requestSharedProps: PageProps = {};
  let currentRootView = options.rootView || 'base.ejs';
  let currentVersion = options.version;
  let historyEncryption: boolean | undefined = options.encryptHistory;
  let clearHistorySetting: boolean | undefined;
  const flashMessages: Record<string, any> = {};

  async function resolveVersionValue(): Promise<string | null> {
    if (!currentVersion) {
      return null;
    }
    if (typeof currentVersion === 'function') {
      const result = await currentVersion();
      return result || null;
    }
    return currentVersion;
  }

  const renderFn = async (
    component: string,
    props: PageProps = {},
    viewData: Record<string, any> = {}
  ): Promise<void> => {
    // 0. Validate component name to prevent path traversal
    const securityOptions: SecurityOptions = options.security ?? DEFAULT_SECURITY_OPTIONS;
    if (securityOptions.validateComponentNames !== false) {
      const pattern = securityOptions.componentNamePattern ?? DEFAULT_COMPONENT_NAME_PATTERN;
      validateComponentName(component, pattern);
    }

    // 1. Resolve dynamic global shared props if function
    let dynamicGlobal: PageProps = {};
    if (typeof options.shared === 'function') {
      dynamicGlobal = await options.shared(req);
    } else if (options.shared) {
      dynamicGlobal = options.shared;
    }

    const allProps = {
      ...globalSharedProps,
      ...dynamicGlobal,
      ...requestSharedProps,
      ...Object.keys(flashMessages).length > 0 ? { flash: flashMessages } : {},
      ...props,
    };

    // 2. Resolve asset version
    const version = await resolveVersionValue();

    // 3. Resolve props (handle lazy, always, defer, merge, promises, closures)
    const { resolvedProps, deferredProps, mergeProps } = await resolveProps(
      allProps,
      req,
      component
    );

    // 4. Construct Inertia Page object
    const pageUrl = req.originalUrl || req.url;
    const page: Page = {
      component,
      props: resolvedProps,
      url: pageUrl,
      version,
    };

    if (historyEncryption !== undefined) {
      page.encryptHistory = historyEncryption;
    }
    if (clearHistorySetting !== undefined) {
      page.clearHistory = clearHistorySetting;
    }
    if (deferredProps) {
      page.deferredProps = deferredProps;
    }
    if (mergeProps) {
      page.mergeProps = mergeProps;
    }

    // 5. Handle Inertia AJAX Request vs First/Full Page Load
    if (req.header('X-Inertia')) {
      res.setHeader('X-Inertia', 'true');
      res.setHeader('Vary', 'Accept, X-Inertia');

      if (historyEncryption) {
        res.setHeader('X-Inertia-Encrypt-History', 'true');
      }
      if (clearHistorySetting) {
        res.setHeader('X-Inertia-Clear-History', 'true');
      }

      res.status(200).setHeader('Content-Type', 'application/json').send(safeStringify(page));
      return;
    }

    // 6. First/Full Page Load (HTML with base template)
    let ssrResult: SSRResult | null = null;
    if (options.ssr) {
      ssrResult = await renderSSR(page, options.ssr);
    }

    let globalViewData: Record<string, any> = {};
    if (typeof options.viewData === 'function') {
      globalViewData = await options.viewData(req);
    } else if (options.viewData) {
      globalViewData = options.viewData;
    }

    const shouldSanitizeViewData = securityOptions.sanitizeViewData !== false;
    const sanitizedViewData = shouldSanitizeViewData ? sanitizeViewData(viewData) : viewData;
    const sanitizedGlobalViewData = shouldSanitizeViewData ? sanitizeViewData(globalViewData) : globalViewData;

    const templateData = {
      ...res.locals,
      ...sanitizedGlobalViewData,
      ...sanitizedViewData,
      page,
      ssr: ssrResult,
      inertiaVersion: options.inertiaVersion,
      rootElement: options.rootElement,
      req,
    };

    // Render root template using Express res.render
    res.setHeader('Vary', 'Accept, X-Inertia');
    res.render(currentRootView, templateData);
  };

  // Create callable handler function
  const handler = renderFn as InertiaResponseHandler;
  handler.render = renderFn;
  handler.inertia = renderFn;

  handler.share = (keyOrObject: string | PageProps, value?: any) => {
    if (typeof keyOrObject === 'string') {
      requestSharedProps[keyOrObject] = value;
    } else if (typeof keyOrObject === 'object' && keyOrObject !== null) {
      Object.assign(requestSharedProps, keyOrObject);
    }
    return handler;
  };

  handler.getShared = (key?: string) => {
    if (key) {
      return requestSharedProps[key] ?? globalSharedProps[key];
    }
    return { ...globalSharedProps, ...requestSharedProps };
  };

  handler.location = (url: string) => {
    if (req.header('X-Inertia')) {
      res.setHeader('X-Inertia-Location', url);
      res.status(409).end();
    } else {
      res.redirect(url);
    }
  };

  handler.back = (fallbackUrl: string = '/') => {
    const referer = req.header('Referer') || fallbackUrl;
    res.redirect(303, referer);
  };

  handler.version = (ver: string | (() => string | Promise<string>)) => {
    currentVersion = ver;
    return handler;
  };

  handler.rootView = (view: string) => {
    currentRootView = view;
    return handler;
  };

  handler.encryptHistory = (encrypt: boolean = true) => {
    historyEncryption = encrypt;
    return handler;
  };

  handler.clearHistory = (clear: boolean = true) => {
    clearHistorySetting = clear;
    return handler;
  };

  handler.withFlash = (key: string, value: any) => {
    flashMessages[key] = value;
    return handler;
  };

  handler.postForm = (component: string, props?: PageProps, viewData?: Record<string, any>) => {
    return renderFn(component, props, viewData);
  };

  handler.putForm = (component: string, props?: PageProps, viewData?: Record<string, any>) => {
    return renderFn(component, props, viewData);
  };

  handler.patchForm = (component: string, props?: PageProps, viewData?: Record<string, any>) => {
    return renderFn(component, props, viewData);
  };

  handler.deleteForm = (component: string, props?: PageProps, viewData?: Record<string, any>) => {
    return renderFn(component, props, viewData);
  };

  return handler;
}

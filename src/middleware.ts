import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { InertiaOptions, PageProps, SecurityOptions } from './types.js';
import { createInertiaResponse } from './response.js';
import { DEFAULT_COMPONENT_NAME_PATTERN, DEFAULT_SECURITY_OPTIONS } from './utils.js';

/**
 * Creates the Inertia Express middleware.
 *
 * @example
 * ```ts
 * import express from 'express';
  * import inertia from '@arponascension/express-inertia';
 *
 * const app = express();
 * app.use(inertia({
 *   rootView: 'base.ejs',
 *   version: '1.0.0',
 *   shared: (req) => ({
 *     user: req.user,
 *     flash: req.flash?.() || {},
 *   }),
 * }));
 * ```
 */
export function createInertia(options: InertiaOptions = {}): RequestHandler {
  const globalShared: PageProps = typeof options.shared === 'object' && options.shared !== null
    ? options.shared
    : {};

  return async function inertiaMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const isInertia = Boolean(req.header('X-Inertia'));
      const versionHeader = req.header('X-Inertia-Version') || null;
      const partialComponent = req.header('X-Inertia-Partial-Component') || null;
      const partialDataHeader = req.header('X-Inertia-Partial-Data');
      const resetDataHeader = req.header('X-Inertia-Reset');

      const partialData = partialDataHeader
        ? partialDataHeader.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const resetData = resetDataHeader
        ? resetDataHeader.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // Attach req.inertia helper
      req.inertia = {
        isInertia,
        version: versionHeader,
        partialComponent,
        partialData,
        resetData,
      };

      // Attach res.inertia response handler
      res.inertia = createInertiaResponse(req, res, options, { ...globalShared });

      // Validate component names on Inertia requests to prevent path traversal
      const securityOptions: SecurityOptions = options.security ?? DEFAULT_SECURITY_OPTIONS;
      if (securityOptions.validateComponentNames !== false && isInertia) {
        const pattern = securityOptions.componentNamePattern ?? DEFAULT_COMPONENT_NAME_PATTERN;
        const requestedPartialComponent = req.header('X-Inertia-Partial-Component');
        if (requestedPartialComponent && !pattern.test(requestedPartialComponent)) {
          res.setHeader('X-Inertia-Location', req.originalUrl || req.url);
          res.status(409).end();
          return;
        }
      }

      // Asset Version Check:
      // On Inertia requests with version mismatch, return 409 Conflict so the
      // client performs a full page reload (applies to all HTTP methods per the
      // Inertia protocol, not just GET).
      if (isInertia && options.version) {
        let currentVersion: string | null = null;
        if (typeof options.version === 'function') {
          currentVersion = await options.version();
        } else {
          currentVersion = options.version;
        }

        if (versionHeader && currentVersion && versionHeader !== currentVersion) {
          res.setHeader('X-Inertia-Location', req.originalUrl || req.url);
          res.status(409).end();
          return;
        }
      }

      // Automatically convert 301/302 redirects to 303 See Other on PUT/PATCH/DELETE
      const originalRedirect = res.redirect.bind(res);
      res.redirect = function (this: Response, ...args: any[]): any {
        const method = req.method.toUpperCase();
        const isInertiaMethod = method === 'PUT' || method === 'PATCH' || method === 'DELETE';

        if (isInertia && isInertiaMethod) {
          if (args.length === 1) {
            // res.redirect(url) -> default to 303
            return originalRedirect(303, args[0]);
          } else if (args.length === 2 && typeof args[0] === 'number') {
            // res.redirect(302, url) -> convert 301/302 to 303
            const status = args[0] === 301 || args[0] === 302 ? 303 : args[0];
            return originalRedirect(status, args[1]);
          }
        }

        return (originalRedirect as any)(...args);
      } as any;

      next();
    } catch (err) {
      next(err);
    }
  };
}

export default createInertia;

/**
 * Middleware that assigns a unique request ID for correlation across logs.
 * Uses X-Request-ID header if present, otherwise generates a short ID.
 */
export function requestIdMiddleware(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.id = req.header('X-Request-ID') || generateRequestId();
    next();
  };
}

function generateRequestId(): string {
  return randomUUID();
}

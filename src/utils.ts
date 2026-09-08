import type { Request } from 'express';
import type {
  PageProps,
  PropCallback,
  LazyProp,
  AlwaysProp,
  DeferredProp,
  MergeProp,
  OptionalProp,
  Page,
  SecurityOptions,
} from './types.js';

/**
 * Marks a prop as lazy. Lazy props are ONLY evaluated during partial reloads
 * when specifically requested in the `only` array by the client.
 */
export function lazy<T = any>(callback: PropCallback<T>): LazyProp<T> {
  return {
    __inertia_lazy: true,
    callback,
  };
}

/**
 * Marks a prop as always included. Always props are evaluated and returned
 * on every request, including partial reloads, even if not explicitly requested.
 */
export function always<T = any>(value: T | PropCallback<T>): AlwaysProp<T> {
  return {
    __inertia_always: true,
    value,
  };
}

/**
 * Marks a prop as deferred (Inertia v2).
 */
export function defer<T = any>(
  callback: PropCallback<T>,
  options?: { group?: string }
): DeferredProp<T> {
  return {
    __inertia_deferred: true,
    callback,
    group: options?.group,
  };
}

/**
 * Marks a prop as mergeable (Inertia v2).
 */
export function merge<T = any>(value: T | PropCallback<T>): MergeProp<T> {
  return {
    __inertia_merge: true,
    value,
  };
}

/**
 * Marks a prop as optional.
 */
export function optional<T = any>(callback: PropCallback<T>): OptionalProp<T> {
  return {
    __inertia_optional: true,
    callback,
  };
}

export function isLazy(val: any): val is LazyProp {
  return val && typeof val === 'object' && val.__inertia_lazy === true;
}

export function isAlways(val: any): val is AlwaysProp {
  return val && typeof val === 'object' && val.__inertia_always === true;
}

export function isDeferred(val: any): val is DeferredProp {
  return val && typeof val === 'object' && val.__inertia_deferred === true;
}

export function isMerge(val: any): val is MergeProp {
  return val && typeof val === 'object' && val.__inertia_merge === true;
}

export function isOptional(val: any): val is OptionalProp {
  return val && typeof val === 'object' && val.__inertia_optional === true;
}

/**
 * Evaluates and resolves all props (promises, functions, lazy, always, merge, deferred)
 * based on current Inertia request context and partial reload headers.
 */
export async function resolveProps(
  rawProps: PageProps,
  req: Request,
  component: string
): Promise<{
  resolvedProps: PageProps;
  deferredProps?: Record<string, string[]>;
  mergeProps?: string[];
}> {
  const isPartial =
    req.header('X-Inertia-Partial-Component') === component &&
    Boolean(req.header('X-Inertia-Partial-Data'));

  const partialKeys = isPartial
    ? (req.header('X-Inertia-Partial-Data') || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  const resolvedProps: PageProps = {};
  const deferredMap: Record<string, string[]> = {};
  const mergeKeys: string[] = [];

  for (const [key, rawValue] of Object.entries(rawProps)) {
    // Collect merge props
    if (isMerge(rawValue)) {
      mergeKeys.push(key);
    }

    // Collect deferred props
    if (isDeferred(rawValue)) {
      const group = rawValue.group || 'default';
      if (!deferredMap[group]) {
        deferredMap[group] = [];
      }
      deferredMap[group].push(key);
    }

    if (isPartial) {
      const isRequested = partialKeys.includes(key);
      const isAlwaysIncluded = isAlways(rawValue);

      // In partial reload, only include if explicitly requested or marked as always
      if (!isRequested && !isAlwaysIncluded) {
        continue;
      }
    } else {
      // In full request, lazy and deferred props are omitted.
      // Optional props are still included on initial load.
      if (isLazy(rawValue) || isDeferred(rawValue)) {
        continue;
      }
    }

    // Resolve prop value
    resolvedProps[key] = await unwrapValue(rawValue, req);
  }

  return {
    resolvedProps,
    deferredProps: Object.keys(deferredMap).length > 0 ? deferredMap : undefined,
    mergeProps: mergeKeys.length > 0 ? mergeKeys : undefined,
  };
}

/**
 * Unwraps closures, promises, and wrapper objects to get the actual value.
 */
export async function unwrapValue(val: any, req: Request): Promise<any> {
  if (val === null || val === undefined) {
    return val;
  }

  // Handle wrapper types
  if (isLazy(val)) {
    val = val.callback;
  } else if (isAlways(val)) {
    val = val.value;
  } else if (isDeferred(val)) {
    val = val.callback;
  } else if (isMerge(val)) {
    val = val.value;
  } else if (isOptional(val)) {
    val = val.callback;
  }

  // If function / closure, execute it
  if (typeof val === 'function') {
    val = val(req);
  }

  // If promise, await it
  if (val && typeof val.then === 'function') {
    val = await val;
  }

  return val;
}

/**
 * Escapes characters for HTML attribute insertion to prevent XSS.
 */
export function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Serializes Page object safely for data-page HTML attribute.
 */
export function serializePage(page: Page): string {
  return escapeHtmlAttr(safeStringify(page));
}

/**
 * Safely stringifies an object, replacing circular references with null.
 */
export function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return null;
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Default pattern for safe component names: alphanumeric, hyphens, and underscores,
 * optionally separated by single forward slashes. Blocks path traversal sequences
 * like `..`, leading/trailing slashes, and consecutive slashes.
 */
export const DEFAULT_COMPONENT_NAME_PATTERN = /^[\w-]+(?:\/[\w-]+)*$/;

/**
 * Validates a component name to prevent path traversal and injection attacks.
 * Throws a TypeError if the name contains suspicious characters.
 */
export function validateComponentName(
  component: string,
  pattern: RegExp = DEFAULT_COMPONENT_NAME_PATTERN
): void {
  if (!pattern.test(component)) {
    throw new TypeError(
      `Invalid component name "${component}". Component names must match the pattern ${pattern}.`
    );
  }
}

/**
 * Recursively sanitizes viewData by stripping functions and undefined values.
 * Only plain objects and primitive values are preserved.
 */
export function sanitizeViewData(data: Record<string, any>): Record<string, any> {
  const seen = new WeakSet();

  function sanitize(value: any): any {
    if (typeof value === 'function' || value === undefined) {
      return undefined;
    }

    if (value === null || typeof value !== 'object' || Buffer.isBuffer(value)) {
      return value;
    }

    if (seen.has(value)) {
      return undefined;
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => sanitize(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      const cleaned = sanitize(val);
      if (cleaned !== undefined) {
        sanitized[key] = cleaned;
      }
    }
    return sanitized;
  }

  return sanitize(data) as Record<string, any>;
}

/**
 * Generates a Subresource Integrity (SRI) hash for a given string.
 * Returns the base64-encoded SHA-384 hash prefixed with 'sha384-'.
 */
export async function generateSriHash(content: string | Buffer): Promise<string> {
  const crypto = await import('node:crypto');
  const hash = crypto.createHash('sha384').update(content);
  return `sha384-${hash.digest('base64')}`;
}


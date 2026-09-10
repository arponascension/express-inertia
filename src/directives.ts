import type { DirectiveHandler } from './types.js';

const customDirectives: Record<string, DirectiveHandler> = {};

/**
 * Escape a string for safe interpolation inside a single-quoted JS string literal.
 */
function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Register a global custom Blade directive.
 * @param name Directive name without the @ (e.g. 'datetime' for @datetime($date))
 * @param handler Function returning the compiled EJS string or HTML
 */
export function registerDirective(name: string, handler: DirectiveHandler): void {
  customDirectives[name] = handler;
}

/**
 * Remove all globally registered custom directives.
 * Useful for tests and hot-reload scenarios that need an isolated registry.
 */
export function clearCustomDirectives(): void {
  for (const name of Object.keys(customDirectives)) {
    delete customDirectives[name];
  }
}

/**
 * Compiles Blade-style directives and Blade-style component tags into valid EJS syntax.
 */
export function compileBladeDirectives(
  templateSource: string,
  localDirectives?: Record<string, DirectiveHandler>
): string {
  let compiled = templateSource;

  // <x-inertia ... /> or <x-inertia ...></x-inertia>
  compiled = compiled.replace(
    /<x-inertia(\s[^>]*)?\s*(\/|><\/x-inertia>)/gi,
    (_match, attrs) => {
      const idMatch = attrs?.match(/id=(?:"([^"]*)"|'([^']*)')/);
      const id = idMatch ? (idMatch[1] || idMatch[2]) : undefined;
      return id ? `<%- inertia('${escapeJsString(id)}') %>` : `<%- inertia() %>`;
    }
  );

  // <x-inertia-script ... /> or <x-inertia-data ... />
  compiled = compiled.replace(
    /<x-inertia-(?:script|data)(\s[^>]*)?\s*(\/|><\/x-inertia-(?:script|data)>)/gi,
    (_match, attrs) => {
      const idMatch = attrs?.match(/id=(?:"([^"]*)"|'([^']*)')/);
      const id = idMatch ? (idMatch[1] || idMatch[2]) : undefined;
      return id ? `<%- inertiaScript('${escapeJsString(id)}') %>` : `<%- inertiaScript() %>`;
    }
  );

  // <x-inertia-head /> or <x-inertiaHead />
  compiled = compiled.replace(
    /<x-inertia-head\s*(?:\/>|><\/x-inertia-head>)|<x-inertiaHead\s*(?:\/>|><\/x-inertiaHead>)/gi,
    '<%- inertiaHead() %>'
  );

  // <x-vite src="..." /> or <x-vite entries="..." />
  compiled = compiled.replace(
    /<x-vite(\s[^>]*)?\s*(?:\/>|><\/x-vite>)/gi,
    (_match, attrs) => {
      const srcMatch = attrs?.match(/(?:src|entries)=(?:"([^"]*)"|'([^']*)')/);
      const val = srcMatch ? (srcMatch[1] || srcMatch[2]) : '';
      if (val.startsWith('[') && val.endsWith(']')) {
        return `<%- vite(${val}) %>`;
      }
      return `<%- vite('${escapeJsString(val)}') %>`;
    }
  );

  // <x-vite-react-refresh /> or <x-viteReactRefresh />
  compiled = compiled.replace(
    /<x-vite-react-refresh\s*(?:\/>|><\/x-vite-react-refresh>)|<x-viteReactRefresh\s*(?:\/>|><\/x-viteReactRefresh>)/gi,
    '<%- viteReactRefresh() %>'
  );

  // <x-csrf />
  compiled = compiled.replace(/<x-csrf\s*(?:\/>|><\/x-csrf>)/gi, '<%- csrf() %>');

  // <x-routes ... />
  compiled = compiled.replace(
    /<x-routes(\s[^>]*)?\s*(?:\/>|><\/x-routes>)/gi,
    (_match, attrs) => {
      const groupMatch = attrs?.match(/group=(?:"([^"]*)"|'([^']*)')/);
      const group = groupMatch ? (groupMatch[1] || groupMatch[2]) : undefined;
      return group ? `<%- routes('${escapeJsString(group)}') %>` : `<%- routes() %>`;
    }
  );

  // 2. Built-in Blade Directives
  // @inertiaHead (must match before @inertia)
  compiled = compiled.replace(/@inertiaHead\b/g, '<%- inertiaHead() %>');

  // @inertiaScript or @inertiaData
  compiled = compiled.replace(/@(inertiaScript|inertiaData)(\([^)]*\))?(?!\w)/g, (_match, _d, args) => {
    return args ? `<%- inertiaScript${args} %>` : `<%- inertiaScript() %>`;
  });

  // @inertia or @inertia(...)
  compiled = compiled.replace(/@inertia(\([^)]*\))?(?!\w)/g, (_match, args) => {
    return args ? `<%- inertia${args} %>` : `<%- inertia() %>`;
  });

  // @viteReactRefresh (must match before @vite)
  compiled = compiled.replace(/@viteReactRefresh\b/g, '<%- viteReactRefresh() %>');

  // @vite(...)
  compiled = compiled.replace(/@vite\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g, (_match, args) => {
    return `<%- vite(${args.trim()}) %>`;
  });

  // @csrf
  compiled = compiled.replace(/@csrf\b/g, '<%- csrf() %>');

  // @routes or @routes(...)
  compiled = compiled.replace(/@routes(\([^)]*\))?(?!\w)/g, (_match, args) => {
    return args ? `<%- routes${args} %>` : `<%- routes() %>`;
  });

  // @json(...)
  compiled = compiled.replace(/@json\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g, (_match, args) => {
    return `<%- json(${args.trim()}) %>`;
  });

  // 3. User Registered Custom Directives
  const allDirectives = { ...customDirectives, ...(localDirectives || {}) };
  for (const [name, handler] of Object.entries(allDirectives)) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`@${escapedName}(\\([^)]*(?:\\([^)]*\\)[^)]*)*\\))?(?!\\w)`, 'g');
    compiled = compiled.replace(pattern, (_match, args) => {
      return handler(args ? args.slice(1, -1).trim() : '', {});
    });
  }

  return compiled;
}

# express-inertia 🚀

[![npm version](https://img.shields.io/npm/v/@arponascension/express-inertia.svg)](https://npmjs.com/package/@arponascension/express-inertia)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/badge/bundle_minified-40KB-green.svg)](https://github.com/Arpon/express-inertia)

**Next-generation Inertia.js adapter and middleware for Express.js** with Blade-style EJS directives, Vite integration, SSR resilience, security hardening, and first-class TypeScript support.

---

## ✨ Why express-inertia?

| Feature | Benefit |
|---|---|
| Blade-style EJS | Write Laravel Blade syntax (`@inertia`, `@vite`, `@csrf`) directly in `.ejs` templates |
| Zero-config Vite | Auto HMR in dev, hashed `manifest.json` in production |
| SSR Resilience | Circuit breaker, retries with backoff, graceful client-side fallback |
| Security Hardened | Component name validation, viewData sanitization, SRI hash generation |
| Form Helpers | Semantic `postForm`, `putForm`, `patchForm`, `deleteForm` with flash messages |
| Prefetch Ready | Generate `<link rel="prefetch">` / `<link rel="preload">` from Vite manifest |
| Edge Compatible | Works on Cloudflare Workers, Vercel Edge, Netlify Edge via injected manifest/config |
| Structured Logging | Pluggable logger abstraction with request correlation IDs |

---

## 📦 Installation

```bash
npm install @arponascension/express-inertia ejs
```

Peer dependencies:

```bash
npm install express
```

---

## 🚀 Quick Start

### 1. Configure Express Server

```ts
import express from 'express';
import path from 'path';
import { inertia, createInertiaEngine } from 'express-inertia';

const app = express();

// Blade-compatible EJS View Engine
app.engine('ejs', createInertiaEngine());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse request bodies & serve static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inertia Middleware
app.use(
  inertia({
    rootView: 'base.ejs',
    version: '0.1.0',
    shared: (req) => ({
      appName: 'My Express App',
      auth: { user: (req as any).user || null },
    }),
  })
);

// Routes
app.get('/', (req, res) => {
  res.inertia('Home', { title: 'Welcome Home' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

### 2. Create Root View (`views/base.ejs`)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= page?.props?.title || 'App' %></title>

    @inertiaHead
    @viteReactRefresh
    @vite('src/main.tsx')
  </head>
  <body>
    @inertia
    @csrf
  </body>
</html>
```

---

## 🏷️ Blade Directives & Components

Write Laravel Blade-style syntax inside EJS templates:

| Directive | Component Tag | Output |
|---|---|---|
| `@inertia` | `<x-inertia />` | Renders `<div id="app"></div><script data-page="app" type="application/json">` |
| `@inertia('root')` | `<x-inertia id="root" />` | Custom root ID |
| `@inertiaScript` | `<x-inertia-script />` | JSON script only (manual root container) |
| `@inertiaHead` | `<x-inertia-head />` | Injects SSR `<head>` tags |
| `@vite('src/main.ts')` | `<x-vite src="src/main.ts" />` | Dev HMR or production manifest |
| `@viteReactRefresh` | `<x-vite-react-refresh />` | React Fast Refresh preamble |
| `@csrf` | `<x-csrf />` | CSRF hidden input |
| `@routes` | `<x-routes />` | Ziggy / route definitions |
| `@json(myVar)` | — | Safely stringifies a JS object |

### Custom Directives

```ts
import { registerDirective } from 'express-inertia';

registerDirective('uppercase', (args) => `<%= (${args}).toUpperCase() %>`);
```

---

## ⚡ Response API

### `res.inertia(component, props?, viewData?)`

Renders an Inertia response. In AJAX requests it returns JSON; on full page loads it renders the root template.

```ts
app.get('/users', (req, res) => {
  res.inertia('Users/Index', {
    users: await getUsers(),
  }, {
    metaTitle: 'User Directory', // viewData: passed to base.ejs only
  });
});
```

### Form Helpers

Semantic form submission helpers with automatic method semantics:

```ts
app.post('/login', (req, res) => {
  res.inertia.postForm('Dashboard', { user: req.body.user });
});

app.put('/profile', (req, res) => {
  res.inertia.putForm('Profile', { name: req.body.name });
});

app.patch('/settings', (req, res) => {
  res.inertia.patchForm('Settings', { theme: req.body.theme });
});

app.delete('/account', (req, res) => {
  res.inertia.deleteForm('Goodbye');
});
```

### Flash Messages

```ts
res.inertia
  .withFlash('success', 'Profile updated!')
  .inertia('Dashboard');
```

### Redirect Helpers

```ts
// External redirect / full reload
res.inertia.location('https://stripe.com/checkout');

// Back to referrer (303 See Other)
res.inertia.back('/dashboard');
```

### History Encryption (Inertia v2)

```ts
res.inertia.encryptHistory(true);
res.inertia.clearHistory(true);
res.inertia('SecretReport');
```

---

## 🔄 Prop Helpers

```ts
import { lazy, always, defer, merge, optional } from 'express-inertia';

app.get('/dashboard', (req, res) => {
  res.inertia('Dashboard', {
    summary: await getSummary(),

    // Omitted on initial load; fetched only when explicitly reloaded
    heavyReport: lazy(async () => calculateComplexMetrics()),

    // Always included, even on partial reloads of other keys
    announcements: always(async () => getLatestAnnouncements()),

    // Inertia v2: appends to existing client-side list
    feed: merge(async () => getFeedItems()),

    // Inertia v2: fetched in background after initial render
    chartData: defer(async () => getChartData(), { group: 'analytics' }),

    // Inertia v2: included on initial load, then treated as optional on updates
    extraSetting: optional(() => getExtraSetting()),
  });
});
```

---

## ⚡ Vite Integration

Auto-detects Vite dev server via hot file. Reads `manifest.json` in production.

```ts
app.use(
  inertia({
    vite: {
      publicDir: 'public',
      buildDir: 'build',
      devServerUrl: 'http://localhost:5173',
      hotFile: 'public/hot',
      base: '/build/',
    },
  })
);
```

### Prefetch Helpers

```ts
import { createPrefetchHelper } from 'express-inertia';

const prefetch = createPrefetchHelper(viteHelper);

// In your base template:
<%= prefetch.prefetch('src/Pages/Dashboard.tsx') %>
// <link rel="prefetch" href="/build/assets/Dashboard.abc1234.js">

<%= prefetch.preload('src/main.ts') %>
// <link rel="preload" href="/build/assets/main.abc1234.js">
```

---

## 🌐 Server-Side Rendering (SSR)

With built-in resilience:

```ts
app.use(
  inertia({
    ssr: {
      enabled: true,
      url: 'http://127.0.0.1:13714/render',
      timeout: 2000,
      fallback: true,
      retry: { maxRetries: 2, baseDelayMs: 200, maxDelayMs: 2000 },
      circuitBreaker: { failureThreshold: 5, cooldownMs: 30000 },
    },
  })
);
```

Or custom render function:

```ts
app.use(
  inertia({
    ssr: {
      enabled: true,
      render: async (page) => {
        return {
          head: [`<title>${page.props.title}</title>`],
          body: '<div id="app">...</div>',
        };
      },
    },
  })
);
```

---

## 🔒 Security

### Component Name Validation

Prevents path traversal and injection attacks:

```ts
app.use(
  inertia({
    security: {
      validateComponentNames: true,
      componentNamePattern: /^[\w\/-]+$/,
    },
  })
);
```

### ViewData Sanitization

Automatically strips functions and undefined values from template data.

### SRI Hash Generation

```ts
import { generateSriHash } from 'express-inertia';

const hash = await generateSriHash(assetContent);
// sha384-abc123...
```

---

## 🧪 Structured Logging

Replace `console.warn` with a pluggable logger:

```ts
import { createLogger, setGlobalLogger } from 'express-inertia';
import pino from 'pino';

setGlobalLogger(createLogger({ prefix: 'my-app', logger: pino() }));
```

### Request Correlation IDs

```ts
import { requestIdMiddleware } from 'express-inertia';

app.use(requestIdMiddleware());
app.use(inertia());
```

Correlates logs across the request lifecycle using `X-Request-ID` or auto-generated IDs.

---

## 🌍 Edge Runtime Compatibility

Works on Cloudflare Workers, Vercel Edge, and Netlify Edge by bypassing Node.js `fs`/`path`:

```ts
const viteHelper = createViteHelper({
  manifest: await fetch('/build/.vite/manifest.json').then(r => r.json()),
  base: '/build/',
  isDev: false,
});

app.engine('ejs', createInertiaEngine({
  templateSource: await fetch('/templates/base.ejs').then(r => r.text()),
  vite: { manifest: await getManifest() },
}));
```

---

## 🛡️ Resilience

### Circuit Breaker (SSR)

Prevents cascade failures when the SSR endpoint is down:

```ts
import { CircuitBreaker, resetAllCircuitBreakers } from 'express-inertia';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 30000,
  probeDelayMs: 1000,
});
```

### Retry with Exponential Backoff

```ts
import { calculateBackoff } from 'express-inertia';

const delay = calculateBackoff(attempt, 200, 2000);
```

---

## 🎯 Performance

- **Tree-shakeable**: Import only what you need
- **Template caching**: Compiled EJS templates cached in development
- **Lazy props**: Defer expensive computations until needed
- **Prefetching**: Preload likely navigation targets
- **Minified bundle**: ~40KB gzipped main entry

---

## 📚 API Reference

### Middleware

| Export | Description |
|---|---|
| `inertia(options?)` | Express middleware factory |
| `createInertia(options?)` | Same as `inertia`, explicit name |
| `requestIdMiddleware()` | Assigns `req.id` for log correlation |
| `createInertiaEngine(options?)` | EJS view engine with Blade support |
| `inertiaEngine` | Default engine instance |

### Prop Helpers

| Export | Description |
|---|---|
| `lazy(fn)` | Omit on initial load |
| `always(fn)` | Always include |
| `defer(fn, opts?)` | Inertia v2 deferred prop |
| `merge(fn)` | Inertia v2 merge prop |
| `optional(fn)` | Inertia v2 optional prop |
| `resolveProps(props, req, isInertia)` | Resolve all prop wrappers |

### Utilities

| Export | Description |
|---|---|
| `validateComponentName(name, pattern?)` | Prevent path traversal |
| `sanitizeViewData(data)` | Strip functions from template data |
| `serializePage(page)` | Safe JSON serialization for HTML attributes |
| `safeStringify(obj)` | Circular-reference-safe JSON.stringify |
| `generateSriHash(content)` | SHA-384 SRI hash |
| `createLogger(opts?)` | Pluggable structured logger |
| `setGlobalLogger(logger)` | Replace global logger |
| `getGlobalLogger()` | Get current global logger |

### Resilience

| Export | Description |
|---|---|
| `CircuitBreaker` | CLOSED/OPEN/HALF_OPEN state machine |
| `shouldRetry(error, status, codes)` | Retry decision helper |
| `calculateBackoff(attempt, base, max)` | Exponential backoff with jitter |
| `resetAllCircuitBreakers()` | Bulk reset for testing |

### Vite

| Export | Description |
|---|---|
| `createViteHelper(config?)` | Vite asset resolver |
| `inertiaVitePlugin(opts?)` | Auto write/remove hot file |
| `createPrefetchHelper(viteHelper)` | Prefetch/preload generator |

---

## 🧪 Testing

```bash
npm test
```

Run the full test suite with Vitest (89 tests across 14 suites).

---

## 📄 License

MIT © [Arpon](https://github.com/Arpon)

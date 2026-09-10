# Express-Inertia — Inertia.js Middleware, Adapter & SSR for Express.js

[![npm version](https://img.shields.io/npm/v/@arponascension/express-inertia.svg)](https://npmjs.com/package/@arponascension/express-inertia)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/arponascension/express-inertia/actions/workflows/ci.yml/badge.svg)](https://github.com/arponascension/express-inertia/actions)
[![Bundle Size](https://img.shields.io/badge/bundle_minified-40KB-green.svg)](https://github.com/arponascension/express-inertia)

**@arponascension/express-inertia** is a production-ready **Inertia.js adapter for Express.js**. It brings the official [Inertia.js](https://inertiajs.com) protocol to **Node.js and Express** apps so you can build modern **single-page applications (SPAs)** with **Vue 3**, **React**, or **Svelte** using classic server-side routing and controllers — without the complexity of a REST API or a client-side router.

It ships with a **Blade-style EJS template engine**, **zero-config Vite** integration (HMR in development, hashed `manifest.json` in production), **server-side rendering (SSR)** with circuit-breaker resilience, **security hardening**, **edge-runtime support** (Cloudflare Workers, Vercel Edge, Netlify Edge), and **first-class TypeScript** types — all in a tree-shakeable ~40KB bundle.

> New to Inertia.js? Read [What is Inertia.js?](#what-is-inertiajs) or the [official documentation](https://inertiajs.com/docs).

---

## Table of Contents

- [What is Inertia.js?](#what-is-inertiajs)
- [Why use Inertia.js with Express?](#why-use-inertiajs-with-express)
- [Features](#features)
- [Installation](#installation)
- [Quick Start: Express + Inertia + Vue 3](#quick-start-express--inertia--vue-3)
- [Using Inertia.js with React](#using-inertiajs-with-react)
- [Blade-style EJS Directives for Express](#blade-style-ejs-directives-for-express)
- [Vite Integration for Express](#vite-integration-for-express)
- [Server-Side Rendering (SSR) for SEO](#server-side-rendering-ssr-for-seo)
- [Response API: `res.inertia()`](#response-api-resinertia)
- [Prop Helpers (Lazy, Deferred, Merge)](#prop-helpers-lazy-deferred-merge)
- [Security Hardening](#security-hardening)
- [Structured Logging](#structured-logging)
- [Edge Runtime Compatibility](#edge-runtime-compatibility)
- [Resilience: Circuit Breaker & Retry](#resilience-circuit-breaker--retry)
- [Performance](#performance)
- [API Reference](#api-reference)
- [FAQ](#faq)
- [Compatibility Matrix](#compatibility-matrix)
- [Testing](#testing)
- [Resources & Ecosystem](#resources--ecosystem)
- [License](#license)

---

## What is Inertia.js?

[Inertia.js](https://inertiajs.com) is a protocol (by [Jonathan Reinink](https://twitter.com/reinink)) for building **modern single-page applications (SPAs)** with **classic server-side routing and controllers**. Instead of building a JSON API and a separate JavaScript frontend, you keep writing server-side routes and controllers exactly as you do today — but render your pages with **Vue**, **React**, or **Svelte** components.

Inertia requests return plain JSON to the client (no full page reloads); real full-page visits return your server-rendered HTML template. Page components, props, versions, and partial reloads are all handled automatically by the Inertia protocol.

**express-inertia** is the Inertia.js server-side adapter for **Express.js** / **Node.js** — the Node equivalent of the official [Laravel](https://inertiajs.com/docs/getting-started) and [Rails](https://github.com/inertiajs/inertia-rails) adapters. The client side stays 100% compatible with the official `@inertiajs/vue3`, `@inertiajs/react`, and `@inertiajs/svelte` packages.

## Why use Inertia.js with Express?

- **No API layer, no client router** — classic MVC controllers on the server, components on the client.
- **SEO-friendly** — full-page visits serve real HTML; enable **SSR** to pre-render pages for search engine indexing.
- **Fast navigation** — Inertia requests are small JSON payloads with automatic prop merging, lazy evaluation, and deferred data.
- **One codebase** — policies, validation, and DB queries stay where they belong, in your Express routes.

## Features

| Feature | What you get |
|---|---|
| **Blade-style EJS directives** | Write Laravel Blade syntax (`@inertia`, `@vite`, `@csrf`, `@inertiaHead`) directly inside `.ejs` templates |
| **Zero-config Vite integration** | Automatic HMR in development; hashed `manifest.json` asset resolution in production |
| **Server-side rendering (SSR)** | Express + Inertia SSR endpoint proxying with retry/backoff and **circuit breaker** fallback to client rendering |
| **Security hardening** | Component name validation against path traversal, `viewData` sanitization, SRI hash generation |
| **Form helpers** | Semantic `postForm`, `putForm`, `patchForm`, `deleteForm` with flash messages |
| **Prefetch & preload** | Auto-generate `<link rel="prefetch">` / `<link rel="preload">` tags from the Vite manifest |
| **Edge compatible** | Works on Cloudflare Workers, Vercel Edge, Netlify Edge via injected manifest/config (no `fs`) |
| **Structured logging** | Pluggable logger abstraction with request correlation IDs (`X-Request-ID`) |
| **TypeScript first** | Full type definitions, ESM + CJS builds, tree-shakeable ~40KB bundle |

---

## Installation

**Requirements:** Node.js `>=18` (the runtime globals `fetch`, `AbortController`, `crypto.randomUUID`, and `fs.rmSync` are used by the SSR and middleware layers). Express `^4.18 || ^5` is a peer dependency.

```bash
npm install @arponascension/express-inertia ejs express

# Choose one client adapter — Vue 3:
npm install @inertiajs/vue3 vue
npm install -D vite @vitejs/plugin-vue

# Or React:
npm install @inertiajs/react react react-dom
npm install -D vite @vitejs/plugin-react
```

Peer dependencies:

```bash
npm install express
```

---

## Quick Start: Express + Inertia + Vue 3

### 1. Configure the Express Inertia middleware

```ts
import express from 'express';
import path from 'path';
import { inertia, createInertiaEngine } from '@arponascension/express-inertia';

const app = express();

// Blade-compatible EJS view engine for Express
app.engine('ejs', createInertiaEngine());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse request bodies and serve static files
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inertia.js middleware for Express
app.use(
  inertia({
    rootView: 'base.ejs',
    version: '1.0.0',
    shared: (req) => ({
      appName: 'My Express App',
      auth: { user: (req as any).user || null },
    }),
  })
);

// Classic server-side routes
app.get('/', (req, res) => {
  res.inertia('Home', { title: 'Welcome Home' });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

### 2. Create the root view (`views/base.ejs`)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title inertia><%= page?.props?.title || 'App' %></title>

    @inertiaHead
    @vite('src/main.ts')
  </head>
  <body>
    @inertia
    @csrf
  </body>
</html>
```

### 3. Configure the Vue 3 client (`src/main.ts`)

```ts
import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';

createInertiaApp({
  resolve: (name) => import(`./Pages/${name}.vue`),
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) }).use(plugin).mount(el);
  },
});
```

### 4. Configure Vite (`vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { inertiaVitePlugin } from '@arponascension/express-inertia/vite';

export default defineConfig({
  plugins: [vue(), inertiaVitePlugin()],
  base: '/build/',
  build: { manifest: true, outDir: 'public/build' },
});
```

Start Express and Vite in separate terminals during development; `inertiaVitePlugin()` writes `public/hot` so the EJS root view automatically uses the Vite dev server. Run `vite build` before production deployment to write `public/build/.vite/manifest.json`.

## Using Inertia.js with React

Install the React client adapter, configure the React client (`src/main.tsx`):

```tsx
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

createInertiaApp({
  resolve: (name) => import(`./Pages/${name}.tsx`),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
```

For React, use a `.tsx` entrypoint in the root view and include `@viteReactRefresh` before `@vite`:

```html
@viteReactRefresh
@vite('src/main.tsx')
```

Replace the Vue plugin with `@vitejs/plugin-react` in `vite.config.ts` and keep the same `inertiaVitePlugin()`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { inertiaVitePlugin } from '@arponascension/express-inertia/vite';

export default defineConfig({
  plugins: [react(), inertiaVitePlugin()],
  base: '/build/',
  build: { manifest: true, outDir: 'public/build' },
});
```

---

## Blade-style EJS Directives for Express

Write Laravel Blade-style syntax inside EJS templates, powered by a custom Express view engine:

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

### Custom directives

```ts
import { registerDirective } from '@arponascension/express-inertia';

registerDirective('uppercase', (args) => `<%= (${args}).toUpperCase() %>`);
```

---

## Vite Integration for Express

Auto-detects the Vite dev server via the hot file (`public/hot`) and reads `manifest.json` in production:

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

### Prefetch and preload helpers

```ts
import { createPrefetchHelper } from '@arponascension/express-inertia';

const prefetch = createPrefetchHelper(viteHelper);

// In your base template:
<%= prefetch.prefetch('src/Pages/Dashboard.vue') %>
// <link rel="prefetch" href="/build/assets/Dashboard.abc1234.js">

<%= prefetch.preload('src/main.ts') %>
// <link rel="preload" href="/build/assets/main.abc1234.js">
```

---

## Server-Side Rendering (SSR) for SEO

**Server-side rendering (SSR) pre-renders your JavaScript pages on the server, so visitors and search engines receive fully rendered HTML** — better indexability, faster first paint, and a better core-web-vitals story. Inertia's official SSR server is a Node.js background process; `express-inertia` proxies render requests to it (default `http://127.0.0.1:13714/render`) with **retries, exponential backoff, a circuit breaker, and graceful client-side fallback** if SSR fails.

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

Or pass a custom in-process render function (no HTTP endpoint needed):

```ts
app.use(
  inertia({
    ssr: {
      enabled: true,
      render: async (page) => {
        return {
          head: [`<title inertia>${page.props.title}</title>`],
          body: '<div id="app">...</div>',
        };
      },
    },
  })
);
```

Set up the SSR server for your client framework following the [official Inertia.js SSR guide](https://inertiajs.com/docs/v3/advanced/server-side-rendering).

---

## Response API: `res.inertia()`

### `res.inertia(component, props?, viewData?)`

Renders an Inertia response. In AJAX (X-Inertia) requests it returns JSON; on full page loads it renders the root template with `viewData` passed only to the template:

```ts
app.get('/users', (req, res) => {
  res.inertia('Users/Index', {
    users: await getUsers(),
  }, {
    metaTitle: 'User Directory', // viewData: passed to base.ejs only
  });
});
```

### Form helpers

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

### Flash messages

```ts
res.inertia
  .withFlash('success', 'Profile updated!')
  .inertia('Dashboard');
```

### Redirect helpers

```ts
// External redirect / full reload (409 + X-Inertia-Location)
res.inertia.location('https://stripe.com/checkout');

// Back to referrer (303 See Other)
res.inertia.back('/dashboard');
```

### History encryption (Inertia v2)

```ts
res.inertia.encryptHistory(true);
res.inertia.clearHistory(true);
res.inertia('SecretReport');
```

---

## Prop Helpers (Lazy, Deferred, Merge)

Fine-grained control over what props are sent to the client:

```ts
import { lazy, always, defer, merge, optional } from '@arponascension/express-inertia';

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

## Security Hardening

### Component name validation

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

### ViewData sanitization

Automatically strips functions and `undefined` values from template data. Independently configurable from component name validation via `sanitizeViewData`:

```ts
app.use(
  inertia({
    security: {
      validateComponentNames: false, // allow arbitrary component names
      sanitizeViewData: true, // still sanitize view data (default)
    },
  })
);
```

Set `sanitizeViewData: false` to preserve functions and `undefined` values in template locals (e.g. when passing helper functions to your root view by design).

### SRI hash generation

```ts
import { generateSriHash } from '@arponascension/express-inertia';

const hash = await generateSriHash(assetContent);
// sha384-abc123...
```

---

## Structured Logging

Replace `console.warn` with a pluggable logger:

```ts
import { createLogger, setGlobalLogger } from '@arponascension/express-inertia';
import pino from 'pino';

setGlobalLogger(createLogger({ prefix: 'my-app', logger: pino() }));
```

### Request correlation IDs

```ts
import { requestIdMiddleware } from '@arponascension/express-inertia';

app.use(requestIdMiddleware());
app.use(inertia());
```

Correlates logs across the request lifecycle using `X-Request-ID` or auto-generated IDs.

---

## Edge Runtime Compatibility

Works on Cloudflare Workers, Vercel Edge, and Netlify Edge by bypassing Node.js `fs`/`path` — inject the manifest, config, and template source directly:

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

## Resilience: Circuit Breaker & Retry

### Circuit breaker (SSR)

Prevents cascade failures when the SSR endpoint is down:

```ts
import { CircuitBreaker, resetAllCircuitBreakers } from '@arponascension/express-inertia';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 30000,
  probeDelayMs: 1000,
});
```

### Retry with exponential backoff

```ts
import { calculateBackoff } from '@arponascension/express-inertia';

const delay = calculateBackoff(attempt, 200, 2000);
```

---

## Performance

- **Tree-shakeable**: import only what you need (ESM + CJS dual builds)
- **Template caching**: compiled EJS templates cached (mtime-based in development, ejs `cache: true` in production)
- **Lazy props**: defer expensive computations until needed
- **Prefetching**: preload likely navigation targets from the Vite manifest
- **Minified bundle**: ~40KB main entry

---

## API Reference

### Middleware

| Export | Description |
|---|---|
| `inertia(options?)` | Inertia.js Express middleware factory |
| `createInertia(options?)` | Same as `inertia`, explicit name |
| `requestIdMiddleware()` | Assigns `req.id` for log correlation |
| `createInertiaEngine(options?)` | EJS view engine with Blade support |
| `inertiaEngine` | Default engine instance |

### Prop helpers

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
| `CircuitBreaker` | CLOSED / OPEN / HALF_OPEN state machine |
| `shouldRetry(error, status, codes)` | Retry decision helper |
| `calculateBackoff(attempt, base, max)` | Exponential backoff with jitter |
| `resetAllCircuitBreakers()` | Bulk reset for testing |

### Vite

| Export | Description |
|---|---|
| `createViteHelper(config?)` | Vite asset resolver |
| `inertiaVitePlugin(opts?)` | Auto write/remove the Vite hot file |
| `createPrefetchHelper(viteHelper)` | Prefetch/preload tag generator |

---

## FAQ

### What is Inertia.js?

Inertia.js is a protocol for building modern single-page applications (SPAs) using classic server-side routing and controllers, without building an API. Server routes render Vue, React, or Svelte page components; navigation between pages uses small JSON responses instead of full page reloads.

### How do I use Inertia.js with Express?

Install `@arponascension/express-inertia`, register the `inertia()` middleware (plus the `createInertiaEngine()` EJS view engine), and return `res.inertia('Component', { props })` from your routes. See the [Quick Start](#quick-start-express--inertia--vue-3) above.

### Does express-inertia support Vue 3, React, and Svelte?

Yes — the client side uses the official `@inertiajs/vue3`, `@inertiajs/react`, and `@inertiajs/svelte` packages, so whichever framework you use with Vite works with this adapter.

### Does express-inertia support server-side rendering (SSR)?

Yes. Enable `ssr: { enabled: true }` and point it at the official Inertia SSR server (or pass a custom `render` function). SSR is protected by retries, exponential backoff, and a circuit breaker with client-side fallback.

### What template engine does express-inertia use?

EJS, extended with Laravel Blade-style directives (`@inertia`, `@vite`, `@csrf`, `@inertiaHead`, and more). A custom `createInertiaEngine()` is provided so templates load through Express's normal view engine mechanism.

### Is express-inertia compatible with edge runtimes?

Yes. Provide `manifest`/`isDev`/`devServerUrlOverride` and a `templateSource` so no Node.js `fs` or `path` access is required — it runs on Cloudflare Workers, Vercel Edge, and Netlify Edge.

### Which versions of Node.js and Express are supported?

Node.js `>=18` (tested on 18, 20, 22, 25.8.x) and Express `^4.18 || ^5`. See the [compatibility matrix](#compatibility-matrix).

---

## Compatibility Matrix

The following versions are exercised by the integration suite. Test your application before upgrading a major version.

| Dependency | Supported | Tested |
|---|---|---|
| Node.js | >= 18 | 18, 20, 22, 25.8.x |
| Express | ^4.18 \|\| ^5 | 4.22.x |
| `@inertiajs/core` | 2.x | 2.3.27 |
| Vue | 3.x | 3.5.42 |

---

## Testing

```bash
npm test
```

Run the full test suite with [Vitest](https://vitest.dev). The suite includes Vue/Inertia protocol integration coverage and a real Vite production-manifest build.

```bash
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint
npm run test:coverage # Coverage report (v8)
```

---

## Resources & Ecosystem

- [Inertia.js Documentation](https://inertiajs.com/docs) — the official protocol, client setup, and SSR guide
- [inertiajs/inertia](https://github.com/inertiajs/inertia) — the official client library monorepo (Vue, React, Svelte)
- [Express.js](https://expressjs.com) — the Node.js web framework this adapter targets
- [Vite](https://vite.dev) — the frontend build tool used for HMR and production bundles
- [CHANGELOG.md](./CHANGELOG.md) — release notes
- [CONTRIBUTING.md](./CONTRIBUTING.md) — how to contribute

Looking for Inertia.js on another framework? Official adapters exist for [Laravel](https://inertiajs.com/docs/getting-started) and [Rails](https://github.com/inertiajs/inertia-rails), and community adapters cover Fastify, Hono, and more.

---

## License

MIT © [Arpon Ascension](https://github.com/arponascension/)
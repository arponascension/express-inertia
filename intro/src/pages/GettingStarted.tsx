import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Toc from '../components/Toc'

const toc = [
  { id: 'requirements', label: 'Requirements' },
  { id: 'install', label: 'Installation' },
  { id: 'setup', label: 'Server setup' },
  { id: 'root-view', label: 'Root view template' },
  { id: 'client', label: 'Client setup' },
  { id: 'vite', label: 'Vite integration' },
  { id: 'versioning', label: 'Asset versioning' },
  { id: 'ssr', label: 'Server-side rendering' },
  { id: 'security', label: 'Security' },
]

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-16 mb-4 scroll-mt-20 font-display text-4xl font-semibold tracking-tight text-primary"
    >
      <a
        href={`#${id}`}
        onClick={(e) => {
          e.preventDefault()
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }}
        className="heading-anchor-link mr-2 select-none"
      >
        #
      </a>
      {children}
    </h2>
  )
}

function P({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={['mb-4 text-base leading-relaxed text-secondary', className].join(' ')}>
      {children}
    </p>
  )
}

export default function GettingStarted() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <article className="mx-auto min-w-0 max-w-3xl">
        <h1 className="mb-4 mt-8 font-display text-4xl font-semibold tracking-tight text-primary lg:text-5xl">
          Getting Started
        </h1>
        <p className="mb-8 text-lg leading-normal text-secondary">
          Set up Express-Inertia in your Express application in under five
          minutes.
        </p>

        <H2 id="requirements">Requirements</H2>
        <ul className="mb-6 space-y-2 text-base text-secondary">
          <li>Node.js 18 or higher</li>
          <li>Express 4.18+ or Express 5</li>
          <li>
            A frontend Inertia adapter — <code>@inertiajs/react</code>,{' '}
            <code>@inertiajs/vue3</code>, or <code>@inertiajs/svelte</code>
          </li>
        </ul>

        <H2 id="install">Installation</H2>
        <CodeBlock filename="Terminal">
{`npm install @arponascension/express-inertia`}
        </CodeBlock>
        <P>
          That's it. The only runtime dependency is <code>ejs</code> for the
          view engine; Express is a peer dependency.
        </P>

        <H2 id="setup">Server setup</H2>
        <P>
          Express-Inertia requires two things: a view engine and middleware.
          Here's the minimal Express setup:
        </P>
        <CodeBlock filename="app.js" showLineNumbers>
{`const express = require('express')
const { createInertiaEngine } = require('@arponascension/express-inertia/engine')
const { inertia } = require('@arponascension/express-inertia')

const app = express()

// 1. Register the EJS engine with Blade directive support
app.engine('ejs', createInertiaEngine())
app.set('view engine', 'ejs')   // let res.render('base') resolve views/base.ejs
app.set('views', 'views')       // template directory

// 2. Register the Inertia middleware
app.use(inertia({
  rootView: 'base',      // -> views/base.ejs ('base.ejs' is the default)
  version: '1.0.0',      // asset version for cache busting
}))

// 3. Define routes using res.inertia()
app.get('/', (req, res) => {
  res.inertia('Home', { title: 'Hello World' })
})

app.listen(3000)`}
        </CodeBlock>

        <Callout type="note">
          <code>createInertiaEngine()</code> compiles Blade-style directives
          like <code>@inertia</code>, <code>@vite</code>, and <code>@csrf</code>{' '}
          into EJS syntax automatically.
        </Callout>

        <H2 id="root-view">Root view template</H2>
        <P>
          Create the root EJS template that Inertia uses for full-page visits.
          This is the only HTML your server renders:
        </P>
        <CodeBlock filename="views/base.ejs" showLineNumbers>
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>

  <!-- Vite asset tags (dev HMR or production manifest) -->
  @vite('src/app.tsx')
</head>
<body>
  <!-- Inertia root element + page data -->
  @inertia
</body>
</html>`}
        </CodeBlock>
        <P>
          The <code>@inertia</code> directive renders the root{' '}
          <code>&lt;div&gt;</code> element and embeds the page data as a JSON
          script tag.
        </P>

        <Callout type="note">
          Inertia v2 uses a <code>&lt;script&gt;</code> tag for page data
          instead of a <code>data-page</code> attribute. You can opt into the
          page 1 payload with <code>inertiaVersion: 1</code> in the options.
        </Callout>

        <H2 id="client">Client setup</H2>
        <P>
          On the frontend, initialize the Inertia client adapter. Here's an
          example with React:
        </P>
        <CodeBlock filename="src/app.tsx" showLineNumbers>
{`import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true })
    return pages[\`./Pages/\${name}.tsx\`]
  },

  setup({ App, props, el }) {
    createRoot(el).render(<App {...props} />)
  },
})`}
        </CodeBlock>

        <P className="mt-4">And the same in Vue:</P>
        <CodeBlock filename="src/app.ts" showLineNumbers>
{`import { createInertiaApp } from '@inertiajs/vue3'
import { createApp, h } from 'vue'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true })
    return pages[\`./Pages/\${name}.vue\`]
  },

  setup({ App, props, el }) {
    createApp({ render: () => h(App, props) }).mount(el)
  },
})`}
        </CodeBlock>

        <H2 id="vite">Vite integration</H2>
        <P>
          For Vite dev HMR and production asset resolution, add the Inertia
          plugin to your Vite config:
        </P>
        <CodeBlock filename="vite.config.ts" showLineNumbers>
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { inertiaVitePlugin } from '@arponascension/express-inertia/vite'

export default defineConfig({
  plugins: [react(), inertiaVitePlugin()],
})`}
        </CodeBlock>
        <P>
          Tune asset resolution in the engine — the middleware itself does not
          read the <code>vite</code> option:
        </P>
        <CodeBlock filename="app.js">
{`app.engine('ejs', createInertiaEngine({
  vite: {
    publicDir: 'public',
    buildDir: 'build',
    base: '/build/',
  },
}))`}
        </CodeBlock>

        <Callout type="note">
          In development, <code>inertiaVitePlugin()</code> writes a{' '}
          <code>hot</code> file that signals the Vite dev server. In
          production, assets are resolved from the build manifest instead.
        </Callout>

        <H2 id="versioning">Asset versioning</H2>
        <P>
          Set a version string — or a function — to trigger automatic cache
          invalidation. When versions don't match, the server returns a 409 so
          the client reloads the page:
        </P>
        <CodeBlock filename="app.js">
{`const { readFileSync } = require('fs')

// A static version
app.use(inertia({ version: '1.0.0' }))

// Or fingerprint a built asset (its filename embeds the Vite hash)
app.use(inertia({
  version: () => {
    const manifest = JSON.parse(readFileSync('public/build/.vite/manifest.json', 'utf8'))
    return manifest['resources/js/app.tsx']?.file
  },
}))

// Or compute it asynchronously
app.use(inertia({
  version: async () => {
    const crypto = require('node:crypto')
    return crypto
      .createHash('sha256')
      .update(readFileSync('public/build/.vite/manifest.json'))
      .digest('hex')
  },
}))`}
        </CodeBlock>

        <H2 id="ssr">Server-side rendering</H2>
        <P>
          Optional SSR comes with a circuit breaker, retries, and graceful
          fallback to client rendering:
        </P>
        <CodeBlock filename="app.js">
{`app.use(inertia({
  ssr: {
    enabled: true,
    url: 'http://127.0.0.1:13714/render',   // SSR endpoint
    timeout: 2000,                           // ms
    fallback: true,                          // render client-side on failure
    circuitBreaker: {
      failureThreshold: 5,
      cooldownMs: 30000,
    },
  },
}))`}
        </CodeBlock>

        <H2 id="security">Security</H2>
        <P>
          Security hardening is enabled by default. Validation prevents
          template path traversal, and view data is sanitized before rendering:
        </P>
        <CodeBlock filename="app.js">
{`app.use(inertia({
  security: {
    validateComponentNames: true,
    componentNamePattern: /^[\\w-]+(\\/[\\w-]+)*$/,
    sanitizeViewData: true,
  },
}))`}
        </CodeBlock>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/tutorial"
            className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 font-display text-base font-bold text-white transition-colors hover:bg-blue-40"
          >
            Full Tutorial
          </Link>
          <Link
            to="/api"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 font-display text-base font-bold text-primary shadow-secondary-button-stroke transition-colors hover:bg-gray-40/5"
          >
            API Reference
          </Link>
        </div>
      </article>

      <Toc sections={toc} />
    </div>
  )
}
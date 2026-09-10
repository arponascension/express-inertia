import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Toc from '../components/Toc'

const toc = [
  { id: 'how-it-works', label: 'How SSR works' },
  { id: 'start-server', label: 'Start an SSR server' },
  { id: 'express', label: 'Wire it into Express' },
  { id: 'resilience', label: 'Retries & circuit breaker' },
  { id: 'head', label: 'Meta tags & titles' },
  { id: 'seo', label: 'SEO checklist' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
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

function P({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-base leading-relaxed text-secondary">{children}</p>
}

function Item({ children }: { children: ReactNode }) {
  return <li className="mb-2 text-base leading-relaxed text-secondary">{children}</li>
}

interface OptionTableProps {
  headings: string[]
  rows: ReactNode[][]
}

function OptionTable({ headings, rows }: OptionTableProps) {
  return (
    <div className="mb-6 overflow-x-auto rounded-2xl border border-border bg-wash">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-card">
            {headings.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-start font-display text-xs font-bold uppercase tracking-wide text-tertiary"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-card/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const code = (s: string) => <code className="text-[13px] text-link">{s}</code>

export default function Ssr() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <article className="mx-auto min-w-0 max-w-3xl">
        <h1 className="mb-4 mt-8 font-display text-4xl font-semibold tracking-tight text-primary lg:text-5xl">
          Server-Side Rendering &amp; SEO
        </h1>
        <p className="mb-8 text-lg leading-normal text-secondary">
          Server-side rendering turns every full page load into searchable,
          immediately-visible HTML. This guide shows how to run an Inertia SSR
          server behind Express-inertia, make it resilient, manage head tags,
          and optimize the result for search engines.
        </p>

        <H2 id="how-it-works">How SSR works</H2>
        <P>
          Express-inertia proxies each full page load to an SSR endpoint (or an
          in-process render function) and bakes the rendered HTML into the root
          template:
        </P>
        <ol className="mb-4 ml-5 list-decimal space-y-2">
          <Item>
            A browser requests a URL without the{' '}
            <code className="text-link">X-Inertia</code> header, so Express
            renders a full HTML document.
          </Item>
          <Item>
            The raw <code className="text-link">Page</code> — its component,
            props, URL, and version — is POSTed to the SSR endpoint (default{' '}
            {code('http://127.0.0.1:13714/render')}) or passed to your{' '}
            <code className="text-link">render(page)</code> function.
          </Item>
          <Item>
            The SSR server renders the page in Node and replies with{' '}
            {code('{ head: string[], body: string }')}. The body is a fully
            self-contained document fragment: a{' '}
            {code('<div data-server-rendered>')} root that already contains the
            serialized page data.
          </Item>
          <Item>
            In the root template, the <code className="text-link">@inertia</code>{' '}
            directive detects <code className="text-link">data-server-rendered</code> and
            passes the body through untouched, while{' '}
            <code className="text-link">@inertiaHead</code> injects the{' '}
            <code className="text-link">head</code> tags.
          </Item>
        </ol>
        <P>
          Inertia JSON visits (history/back-forward navigation) never go through
          SSR — and they don't need to. Crawlers always perform full loads, so a
          healthy SSR path means every page a search engine requests arrives
          server-rendered.
        </P>
        <Callout type="note" title="No client changes needed">
          When the server-rendered body contains a{' '}
          <code className="text-link">&lt;div data-server-rendered&gt;</code>{' '}
          element, the Inertia client adapter (react, vue3, svelte) hydrates in
          place instead of re-rendering — it checks for the attribute in its own{' '}
          <code className="text-link">createInertiaApp</code> setup. Your client
          entry point stays exactly as it is.
        </Callout>

        <H2 id="start-server">Start an SSR server</H2>
        <P>
          The official Inertia framework ships the SSR server; it's the same one
          Laravel, Rails, and others use. Create an entry point that mirrors
          your app entry but renders with{' '}
          <code className="text-link">createServer</code>:
        </P>
        <CodeBlock filename="resources/js/ssr.jsx">
{`import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/react/server'
import ReactDOMServer from 'react-dom/server'

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
      return pages[\`./pages/\${name}.tsx\`]
    },
    setup: ({ App, props }) => <App {...props} />,
    // Per-page <title>, baked into ssr.head (see "Meta tags & titles")
    title: (title) => (title ? \`\${title} · Acme\` : 'Acme'),
  })
)`}
        </CodeBlock>
        <P>Vue 3 uses the equivalent entry with <code className="text-link">@vue/server-renderer</code>:</P>
        <CodeBlock filename="resources/js/ssr.js">
{`import { createSSRApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import createServer from '@inertiajs/vue3/server'
import { renderToString } from '@vue/server-renderer'

createServer((page) =>
  createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.vue', { eager: true })
      return pages[\`./pages/\${name}.vue\`]
    },
    setup: ({ App, props, plugin }) =>
      createSSRApp({ render: () => h(App, props) }).use(plugin),
  })
)`}
        </CodeBlock>
        <P>
          By default <code className="text-link">createServer</code> listens on{' '}
          <code className="text-link">0.0.0.0:13714</code> and exposes{' '}
          {code('POST /render')} plus {code('GET /health')}, {code('/404')}, and{' '}
          {code('/shutdown')}. Pass an options object to change it, for example{' '}
          {code('createServer(fn, { port: 13715, host: "127.0.0.1", cluster: true })')} —
          cluster mode forks one worker per CPU core.
        </P>
        <P>
          Point Vite at the entry so <code className="text-link">npm run build</code>{' '}
          emits a Node bundle:
        </P>
        <CodeBlock filename="vite.config.ts">
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { inertiaVitePlugin } from '@arponascension/express-inertia/vite'

export default defineConfig({
  plugins: [react(), inertiaVitePlugin()],
  ssr: { noExternal: true }, // bundle everything (incl. React) for Node
  build: {
    outDir: 'public/ssr',
    ssr: 'resources/js/ssr.jsx', // build the server entry
  },
})`}
        </CodeBlock>
        <CodeBlock filename="package.json">
{`"scripts": {
  "dev": "vite",
  "build": "vite build",
  "ssr": "node public/ssr/ssr.js"
}`}
        </CodeBlock>
        <P>
          Run the server whenever the app is running — in production under a
          process manager. Verify it with{' '}
          {code('curl http://127.0.0.1:13714/health')} ({code('{"status":"OK"}')}).
        </P>
        <Callout type="note" title="SSR during development">
          Two options: rebuild and restart the SSR server when the frontend
          changes (add it to a file watcher), or — if you use the official{' '}
          <code className="text-link">@inertiajs/vite</code> plugin instead of{' '}
          <code className="text-link">inertiaVitePlugin()</code> — point{' '}
          <code className="text-link">{`ssr.url`}</code> at the dev server's own{' '}
          <code className="text-link">/__inertia_ssr</code> endpoint and SSR runs
          through Vite with HMR.
        </Callout>

        <H2 id="express">Wire it into Express</H2>
        <P>
          Add the <code className="text-link">ssr</code> option to the middleware.
          The default URL matches the official SSR server, so a minimal config
          often looks like this:
        </P>
        <CodeBlock filename="app.js">
{`const { inertia } = require('@arponascension/express-inertia')

app.use(inertia({
  ssr: {
    // url defaults to http://127.0.0.1:13714/render
    timeout: 2000,   // abort and fall back if the server is slow (ms)
    fallback: true,  // render client-side when SSR fails
  },
}))`}
        </CodeBlock>
        <P>
          Prefer no separate process? Supply{' '}
          <code className="text-link">render(page)</code> to render in-process.
          It runs inside your Express server and returns the same{' '}
          {code('{ head, body }')} shape:
        </P>
        <CodeBlock filename="app.js">
{`app.use(inertia({
  ssr: {
    render: async (page) => {
      // e.g. call the render function your SSR entry would have called
      return { head: ['<title>Acme</title>'], body: '<div id="app">…</div>' }
    },
  },
}))`}
        </CodeBlock>
        <Callout type="note" title="Retries apply, the breaker does not">
          In-process rendering keeps the retry/backoff behavior but is not
          protected by the circuit breaker — the breaker wraps only the HTTP
          endpoint.
        </Callout>

        <H2 id="resilience">Retries &amp; the circuit breaker</H2>
        <P>
          SSR failures never break your site. With{' '}
          <code className="text-link">fallback: true</code> (the default) a failed
          render returns <code className="text-link">null</code>, the template falls back to
          the client-rendered shell, and the next full load tries SSR again.
        </P>
        <P>Before giving up, a request is retried with exponential backoff and jitter:</P>
        <OptionTable
          headings={['Retry option', 'Default', 'Description']}
          rows={[
            ['maxRetries', code('2'), 'Additional attempts after the first (3 total)'],
            ['baseDelayMs', code('200'), 'Initial backoff; doubles per attempt'],
            ['maxDelayMs', code('2000'), 'Backoff cap'],
            ['retryableStatusCodes', code('[408, 429, 500, 502, 503, 504]'), 'HTTP statuses that trigger a retry'],
            ['—', '—', 'Timeouts (AbortError) and network errors (TypeError) are retried too'],
          ]}
        />
        <P>
          The circuit breaker tracks each endpoint. After{' '}
          {code('failureThreshold: 5')} consecutive failures it opens: SSR is
          skipped fast (no requests) for the {code('cooldownMs: 30000')}{' '}
          window, a single probe is let through, and a success closes it again.
        </P>
        <OptionTable
          headings={['Breaker option', 'Default', 'Description']}
          rows={[
            ['failureThreshold', code('5'), 'Consecutive failures before the circuit opens'],
            ['cooldownMs', code('30000'), 'How long the circuit stays open'],
            ['probeDelayMs', code('1000'), 'Delay before the half-open probe fires'],
            ['—', '—', 'One breaker per endpoint; reset all with resetAllCircuitBreakers()'],
          ]}
        />
        <P>
          Use <code className="text-link">{`fallback: false`}</code> only if you want SSR
          failures to surface as errors instead of silently degrading — handy in
          tests or when SSR is mandatory.
        </P>

        <H2 id="head">Meta tags, titles &amp; Open Graph</H2>
        <P>
          Render the SSR head tags in the root template with the{' '}
          <code className="text-link">@inertiaHead</code> directive:
        </P>
        <CodeBlock filename="views/base.ejs" showLineNumbers>
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  @inertiaHead
  @vite('resources/js/app.tsx')
</head>
<body>
  @inertia
</body>
</html>`}
        </CodeBlock>
        <P>
          <code className="text-link">@inertiaHead</code> outputs the{' '}
          <code className="text-link">ssr.head</code> array the SSR server returned,
          one tag per line. In React those tags come from the{' '}
          <code className="text-link">title</code> callback on{' '}
          <code className="text-link">createInertiaApp</code> (in the SSR entry)
          plus the <code className="text-link">{'<Head>'}</code> component
          inside your pages:
        </P>
        <CodeBlock filename="resources/js/pages/Products/Show.tsx">
{`import { Head } from '@inertiajs/react'

export default function Product({ product }) {
  return (
    <>
      <Head title={\`\${product.name} · Acme\`}>
        <meta name="description" content={product.summary} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.summary} />
        <meta property="og:type" content="product" />
        <link rel="canonical" href={\`/products/\${product.id}\`} />
      </Head>
      {/* page content */}
    </>
  )
}`}
        </CodeBlock>
        <Callout type="pitfall" title="@inertiaHead needs SSR">
          Without SSR, <code className="text-link">@inertiaHead</code> renders an
          empty string — meta tags then exist only in the browser DOM after the
          client starts. Any page that must be index-friendly should go through
          the SSR path.
        </Callout>

        <H2 id="seo">SEO checklist</H2>
        <ul className="mb-4 ml-5 list-disc space-y-2">
          <Item>
            <strong>Server-render index-critical routes.</strong> SSR delivers
            content and head tags in the first bytes; client-side-only shells
            rely on the crawler executing JavaScript.
          </Item>
          <Item>
            <strong>One unique title and meta description per page.</strong>{' '}
            Use the <code className="text-link">title</code> callback for the
            site suffix and <code className="text-link">{'<Head>'}</code> for the
            page-specific description.
          </Item>
          <Item>
            <strong>Add Open Graph / Twitter tags and a canonical link</strong>{' '}
            to each page's head.
          </Item>
          <Item>
            <strong>Return real 404s.</strong> On full loads the status code you
            set is preserved, so{' '}
            {code("res.status(404).inertia('Errors/NotFound', {...})")} makes
            crawlers see a genuine 404. (X-Inertia JSON responses always return
            200 — that's the protocol.)
          </Item>
          <Item>
            <strong>Serve sitemap.xml and robots.txt</strong> as plain Express
            routes that send markup directly:
          </Item>
        </ul>
        <CodeBlock filename="app.js">
{`app.get('/sitemap.xml', (req, res) => {
  const origin = 'https://acme.com'
  const paths = ['/', '/products', '/products/1', '/about']
  const urls = paths
    .map((p) => '<url><loc>' + origin + p + '</loc></url>')
    .join('')
  res
    .type('application/xml')
    .send('<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      urls + '</urlset>')
})

app.get('/robots.txt', (req, res) => {
  res
    .type('text/plain')
    .send('User-agent: *\\nAllow: /\\nSitemap: https://acme.com/sitemap.xml')
})`}
        </CodeBlock>
        <ul className="mb-4 ml-5 list-disc space-y-2">
          <Item>
            <strong>Add structured data</strong> (JSON-LD) for products,
            articles, and organizations via <code className="text-link">{'<Head>'}</code>.
          </Item>
          <Item>
            <strong>Keep authenticated pages out of the index.</strong> Set{' '}
            {code('<meta name="robots" content="noindex, nofollow">')}{' '}
            conditionally for dashboards and account pages.
          </Item>
          <Item>
            <strong>Keep initial props lean.</strong> Everything in the page
            payload is serialized into the document; move heavy data behind{' '}
            <code className="text-link">lazy()</code> or{' '}
            <code className="text-link">defer()</code>.
          </Item>
          <Item>
            <strong>Cache hot pages</strong> by caching the result of an
            in-process <code className="text-link">render(page)</code> keyed on
            component + URL.
          </Item>
        </ul>

        <H2 id="troubleshooting">Troubleshooting</H2>
        <table className="mb-6 w-full text-sm">
          <tbody className="divide-y divide-border">
            <tr>
              <td className="py-3 pr-4 align-top font-medium text-primary">Pages render client-side only</td>
              <td className="py-3 align-top text-secondary">
                Check {code('curl http://127.0.0.1:13714/health')}, that the
                port matches your <code className="text-link">ssr.url</code>, and
                watch for <code className="text-link">{`express-inertia:ssr`}</code>{' '}
                log lines.
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 align-top font-medium text-primary">SSR repeatedly skipped</td>
              <td className="py-3 align-top text-secondary">
                The circuit is open — the endpoint failed 5 times and now
                cooldowns for 30s. Fix the SSR server or raise the breaker's
                failureThreshold.
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 align-top font-medium text-primary">Rendered HTML has no styles</td>
              <td className="py-3 align-top text-secondary">
                The SSR body contains markup only; keep{' '}
                <code className="text-link">@vite('resources/js/app.tsx')</code>{' '}
                in <code className="text-link">{'<head>'}</code> beside{' '}
                <code className="text-link">@inertiaHead</code>.
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 align-top font-medium text-primary">Head is empty</td>
              <td className="py-3 align-top text-secondary">
                The request wasn't a full load, the SSR server returned no head,
                or the request hit the fallback path. Hard-reload after starting
                the server.
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 align-top font-medium text-primary">Port already in use</td>
              <td className="py-3 align-top text-secondary">
                Only one SSR server may bind 13714 — don't run dev and prod
                instances on the same host, or pass{' '}
                <code className="text-link">{`{ port }`}</code> to{' '}
                <code className="text-link">createServer</code> and mirror it in{' '}
                <code className="text-link">ssr.url</code>.
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/getting-started#ssr"
            className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 font-display text-base font-bold text-white transition-colors hover:bg-blue-40"
          >
            Getting Started: SSR
          </Link>
          <Link
            to="/api#ssr"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 font-display text-base font-bold text-primary shadow-secondary-button-stroke transition-colors hover:bg-gray-40/5"
          >
            API Reference: SSR &amp; resilience
          </Link>
        </div>
      </article>

      <Toc sections={toc} />
    </div>
  )
}
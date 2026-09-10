import { ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import CodeBlock from '../components/CodeBlock'
import BrowserChrome from '../components/BrowserChrome'

/* ------------------------------------------------------------------ */
/* Building blocks mirroring react.dev's HomeContent                   */
/* ------------------------------------------------------------------ */

function Section({
  children,
  background = null as 'left' | 'right' | null,
}: {
  children: ReactNode
  background?: 'left' | 'right' | null
}) {
  return (
    <div
      className={[
        'mx-auto flex w-full flex-col',
        background === null && 'max-w-7xl',
        background === 'left' &&
          'border-t border-primary/10 bg-gradient-left',
        background === 'right' &&
          'border-t border-primary/5 bg-gradient-right',
      ].join(' ')}
    >
      <div className="mx-auto my-20 flex w-full grow flex-col items-center gap-2 lg:my-32">
        {children}
      </div>
    </div>
  )
}

function Header({ children }: { children: ReactNode }) {
  return (
    <h2 className="max-w-3xl text-4xl font-display font-semibold tracking-tight text-primary lg:max-w-xl lg:text-5xl">
      {children}
    </h2>
  )
}

function Para({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-3xl text-center text-lg leading-normal text-secondary lg:text-xl">
      {children}
    </p>
  )
}

function Center({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-5 lg:text-center">
      {children}
    </div>
  )
}

function FullBleed({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-col">{children}</div>
}

interface ExampleLayoutProps {
  filename: string
  code: ReactNode
  preview: ReactNode
}

function ExampleLayout({ filename, code, preview }: ExampleLayoutProps) {
  return (
    <div className="mt-12 mb-2 w-full px-5 lg:my-16 lg:px-10 lg:pe-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center lg:flex-row lg:rounded-2xl lg:bg-card lg:shadow-inner-border">
        <div className="w-full grow lg:-my-5 lg:rounded-2xl lg:bg-wash lg:shadow-nav">
          <div className="w-full rounded-t-2xl border-b border-border">
            <h3 className="mx-5 my-2 select-none text-start text-sm text-tertiary">
              {filename}
            </h3>
          </div>
          <div className="p-0">{code}</div>
        </div>
        <div className="flex w-full grow justify-center p-2.5 lg:-my-20 lg:p-10">
          {preview}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Interactive previews                                                */
/* ------------------------------------------------------------------ */

const profileVideos = [
  { id: 1, title: 'Video title', description: 'Video description', color: 'bg-blue-10' },
  { id: 2, title: 'Video title', description: 'Video description', color: 'bg-purple-10' },
  { id: 3, title: 'Video title', description: 'Video description', color: 'bg-green-10' },
]

function ProfilePreview() {
  const [liked, setLiked] = useState(false)
  return (
    <BrowserChrome domain="localhost:3000/users/1" live>
      <div className="p-6 sm:p-10">
        <div className="mb-4 flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-40 to-blue-60 text-center font-display text-3xl font-semibold text-white leading-[4rem]">
            A
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-primary">
              Arpon Ascension
            </p>
            <p className="text-sm text-tertiary">Software Engineer</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-secondary">
          Building <span className="font-semibold text-primary">Express-Inertia</span> — the
          Inertia.js adapter for Express. Props come straight from this server route.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              liked
                ? 'bg-highlight text-link'
                : 'bg-brand text-white hover:bg-blue-40'
            }`}
          >
            {liked ? '✓ Following' : '+ Follow'}
          </button>
          <span className="rounded-full bg-card px-5 py-2 text-sm font-bold text-primary shadow-secondary-button-stroke">
            Message
          </span>
        </div>
      </div>
    </BrowserChrome>
  )
}

function SearchableListPreview() {
  const [text, setText] = useState('')
  const query = text.trim().toLowerCase()
  const rows = profileVideos.filter(
    (v) => !query || v.title.toLowerCase().includes(query)
  )

  return (
    <BrowserChrome domain="localhost:3000/tasks" live>
      <div className="p-6 sm:p-10">
        <h1 className="mb-1 font-display text-2xl font-bold text-primary">My tasks</h1>
        <p className="mb-6 text-sm text-secondary">Props from your Express controller</p>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search tasks…"
          className="mb-4 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-primary placeholder:text-gray-30 focus:border-link focus:outline-none"
        />
        <ul className="space-y-3">
          {rows.map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className={`h-10 w-14 rounded-lg ${v.color}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">{v.title}</p>
                <p className="text-xs text-tertiary">{v.description}</p>
              </div>
              <span className="text-[11px] text-gray-30">{v.id === 1 ? 'Pending' : 'Done'}</span>
            </li>
          ))}
        </ul>
      </div>
    </BrowserChrome>
  )
}

function TemplatePreview() {
  return (
    <BrowserChrome domain="localhost:3000/" live>
      <div className="p-6 sm:p-10">
        <div className="mb-8 flex gap-3 border-b-2 border-card pb-4">
          <span className="font-display text-sm font-bold text-brand">Express-Inertia</span>
          <span className="text-sm text-tertiary">Getting started</span>
          <span className="text-sm text-tertiary">API</span>
          <span className="ml-auto rounded-full bg-card px-3 py-1 text-xs text-tertiary">
            dev
          </span>
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-primary">
          Hello from a server route
        </h1>
        <p className="text-sm text-secondary">This HTML was rendered by the root view.</p>
        <div className="mt-6 rounded-xl bg-highlight p-4 font-mono text-xs text-secondary">
          <span className="text-link">@inertia</span> → &lt;div id="app"&gt; + JSON script tag
        </div>
      </div>
    </BrowserChrome>
  )
}

function VitePreview() {
  return (
    <BrowserChrome domain="localhost:5173" live>
      <div className="p-6 sm:p-10">
        <div className="flex items-center gap-2">
          <svg className="h-8 w-8" viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-primary">app.tsx</p>
            <p className="text-xs text-primary">
              served by the <span className="text-brand">hot</span> file
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-link">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            HMR
          </span>
        </div>
        <div className="mt-6 space-y-2 rounded-xl bg-card p-4 font-mono text-xs text-secondary">
          <p className="text-tertiary"># manifest.json (production)</p>
          <p>
            <span className="text-[#cf222e]">"app.tsx"</span> →{' '}
            <span className="text-[#0a3069]">"/build/assets/app-Ul3a4jsz.js"</span>
          </p>
        </div>
      </div>
    </BrowserChrome>
  )
}

function MethodCard({
  tag,
  title,
  copy,
  points,
}: {
  tag: string
  title: string
  copy: string
  points: string[]
}) {
  return (
    <div className="relative w-full lg:w-1/2">
      <div className="mx-auto w-full overflow-hidden rounded-2xl bg-wash shadow-nav">
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-gray-20" />
          <span className="h-3 w-3 rounded-full bg-gray-20" />
          <span className="h-3 w-3 rounded-full bg-gray-20" />
          <div className="ml-2 rounded-md bg-highlight px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-link">
            {tag}
          </div>
        </div>
        <div className="bg-gradient-right p-5 sm:p-8">
          <h4 className="mb-3 font-display text-3xl font-semibold text-primary">
            {title}
          </h4>
          <p className="mb-5 text-lg leading-normal text-secondary">{copy}</p>
          <ul className="space-y-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-secondary">
                <svg className="mt-1 h-4 w-4 shrink-0 text-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function CommunityMarquee() {
  const items = ['Express', 'Inertia.js', 'React', 'Vue 3', 'Svelte', 'Vite', 'SSR', 'TypeScript']
  const row = (
    <div className="flex shrink-0 items-center gap-12 pr-12">
      {items.map((item) => (
        <span
          key={item}
          className="whitespace-nowrap font-display text-3xl font-semibold text-gray-30 transition-colors hover:text-primary lg:text-4xl"
        >
          {item}
        </span>
      ))}
    </div>
  )

  return (
    <FullBleed>
      <div className="relative w-full overflow-hidden py-10">
        <div className="flex w-max animate-marquee">
          {row}
          {row}
          {row}
          {row}
        </div>
      </div>
    </FullBleed>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="bg-wash font-text text-primary">
      {/* Hero */}
      <div className="px-0">
        <div className="mx-5 mb-20 mt-16 flex flex-col justify-center lg:mb-32 lg:mt-24">
          <svg
            viewBox="0 0 100 100"
            className="mx-auto mb-4 w-24 self-center text-sm lg:w-28"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hero-atom-g" x1="0" y1="0" x2="0" y2="100">
                <stop offset="0%" stopColor="#149ECA" />
                <stop offset="100%" stopColor="#087EA4" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="13" fill="url(#hero-atom-g)" />
            <g fill="none" stroke="url(#hero-atom-g)" strokeWidth="6.5">
              <ellipse rx="42" ry="19" cx="50" cy="50" />
              <ellipse rx="42" ry="19" cx="50" cy="50" transform="rotate(120 50 50)" />
              <ellipse rx="42" ry="19" cx="50" cy="50" transform="rotate(240 50 50)" />
            </g>
          </svg>

          <h1 className="self-center text-center font-display text-5xl font-semibold leading-snug text-primary lg:text-6xl">
            Express-Inertia
          </h1>

          <p className="mx-auto max-w-lg self-center py-1 text-center font-display text-4xl leading-snug text-secondary md:max-w-full">
            The adapter that powers single-page apps from your Express server.
          </p>

          <div className="mt-5 flex w-full flex-col gap-2 self-center sm:w-auto sm:flex-row">
            <Link
              to="/getting-started"
              className="inline-flex w-full items-center justify-center rounded-full bg-brand px-8 py-4 text-center font-display text-lg font-bold text-white transition-colors hover:bg-blue-40 sm:w-auto"
            >
              Learn Express-Inertia
            </Link>
            <Link
              to="/api"
              className="inline-flex w-full items-center justify-center rounded-full px-8 py-4 text-center font-display text-lg font-bold text-primary shadow-secondary-button-stroke transition-colors hover:bg-gray-40/5 sm:w-auto"
            >
              API Reference
            </Link>
          </div>
        </div>
      </div>

      {/* 1 — Server routes */}
      <Section background="left">
        <Center>
          <Header>Create SPAs from server routes</Header>
          <Para>
            Build a single-page application the classic way: server-side routing
            and controllers. Create an Express route, call{' '}
            <code className="font-mono text-sm">res.inertia()</code> with a
            component name and props, and Inertia renders it on the client — no
            REST endpoints, no client router, no CORS.
          </Para>
        </Center>
        <ExampleLayout
          filename="routes/users.js"
          code={
            <CodeBlock noShadow>
{`const { inertia } = require('@arponascension/express-inertia')

router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id)

  // A page, not an API endpoint
  res.inertia('Users/Profile', {
    user: {
      id: user.id,
      name: user.name,
      bio: user.bio,
    },
  })
})`}
            </CodeBlock>
          }
          preview={<ProfilePreview />}
        />

        <Center>
          <Para>
            Clicking a link inside an Inertia app is a smart navigation: the
            server is asked only for the JSON of that page, and the DOM updates
            in place. When your assets change, a 409 response forces a clean
            full-page reload automatically.
          </Para>
        </Center>
      </Section>

      {/* 2 — Blade templates */}
      <Section background="right">
        <Center>
          <Header>Write views with Blade templates</Header>
          <Para>
            Your root view is a single EJS template enriched with Blade-style
            directives. <code className="font-mono text-sm">@inertia</code>{' '}
            embeds the page data,{' '}
            <code className="font-mono text-sm">@vite</code> renders dev HMR or
            production tags, <code className="font-mono text-sm">@csrf</code>{' '}
            injects a hidden CSRF field — all compiled to plain EJS for you.
          </Para>
        </Center>
        <ExampleLayout
          filename="views/base.ejs"
          code={
            <CodeBlock noShadow>
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My App</title>

  <!-- Dev HMR or production manifest -->
  @vite('resources/js/app.tsx')
</head>
<body>
  <!-- Root element + JSON page data -->
  @inertia
</body>
</html>`}
            </CodeBlock>
          }
          preview={<TemplatePreview />}
        />
        <Center>
          <Para>
            This markup syntax is called Blade — it keeps the HTML close to
            server-side concerns like asset tags, CSRF, and Ziggy routes, so
            your client code stays focused on components.
          </Para>
        </Center>
      </Section>

      {/* 3 — Interactivity */}
      <Section background="left">
        <Center>
          <Header>Add interactivity with your framework</Header>
          <Para>
            Express-Inertia is framework-agnostic. Pair it with{' '}
            <code className="font-mono text-sm">@inertiajs/react</code>,{' '}
            <code className="font-mono text-sm">@inertiajs/vue3</code>, or{' '}
            <code className="font-mono text-sm">@inertiajs/svelte</code> —
            declaring a component in a route swaps it in with the props your
            controller provided.
          </Para>
        </Center>
        <ExampleLayout
          filename="resources/js/app.tsx"
          code={
            <CodeBlock noShadow>
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
          }
          preview={<SearchableListPreview />}
        />
        <Center>
          <Para>
            Type into the search box — client-side state, still fed by
            server-provided props. The same skills you already use, on the same
            stack you already run.
          </Para>
        </Center>
      </Section>

      {/* 4 — Vite */}
      <Section background="right">
        <Center>
          <Header>Go full-stack with Vite</Header>
          <Para>
            First-class Vite support out of the box. In development, a hot file
            signals the dev server for instant HMR; in production, assets are
            resolved from the Vite manifest with SRI hashing available.
          </Para>
        </Center>
        <ExampleLayout
          filename="vite.config.ts"
          code={
            <CodeBlock noShadow>
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { inertiaVitePlugin } from '@arponascension/express-inertia/vite'

export default defineConfig({
  plugins: [react(), inertiaVitePlugin()],
})`}
            </CodeBlock>
          }
          preview={<VitePreview />}
        />
        <Center>
          <Para>
            The artifact is just an HTML page and a manifest — any host that can
            serve static files can run the result.
          </Para>
        </Center>
      </Section>

      {/* 5 — Every frontend */}
      <Section background="left">
        <Center>
          <Header>Use the best from every frontend</Header>
          <Para>
            React, Vue, and Svelte are all first-class. The server speaks one
            protocol; every framework adapter understands it. Choose per team,
            per repo, or per page.
          </Para>
        </Center>
        <div className="mx-auto mt-16 flex w-full max-w-7xl flex-col gap-5 px-5 lg:mb-28 lg:mt-20 lg:flex-row">
          <MethodCard
            tag="React"
            title="Stay true to the web"
            copy="Component-driven pages with @inertiajs/react, plus optional server-side rendering for fast first paint."
            points={[
              'JSX components mapped to server routes',
              'Inline SSR with retries and graceful client-side fallback',
              'React Fast Refresh in development',
            ]}
          />
          <MethodCard
            tag="Vue 3 · Svelte"
            title="Go reactive with a Svelte or Vue app"
            copy="@inertiajs/vue3 and @inertiajs/svelte speak the same protocol — deferred and merge props included."
            points={[
              'Inertia v2 deferred props load in the background',
              'Merge and lazy prop helpers for partial reloads',
              'Server-rendered head tags via @inertiaHead',
            ]}
          />
        </div>
        <Center>
          <Para>
            One adapter, every framework. Your team can ship to any frontend
            without giving up server-side routing.
          </Para>
        </Center>
      </Section>

      {/* 6 — Inertia v2 future */}
      <Section background="right">
        <div className="flex w-full max-w-7xl flex-col gap-5 px-5 lg:flex-row">
          <div className="flex w-full max-w-3xl flex-col items-start justify-start lg:ps-5 lg:pe-10">
            <Header>Upgrade when the future is ready</Header>
            <Para>
              Inertia v2 support is built in: deferred props, merge props, lazy
              evaluation, and encrypted history are all available today — with
              graceful fallbacks if you keep serving page 1 payloads.
            </Para>
            <div className="order-last pt-5 text-start">
              <Para>
                The protocol is versioned, so older clients keep working while
                new features roll out page by page.
              </Para>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="w-full overflow-hidden rounded-2xl bg-wash shadow-nav">
              <div className="border-b border-border bg-card px-5 py-3">
                <p className="font-display text-sm font-bold text-tertiary">
                  Prop helpers
                </p>
              </div>
              <ul className="divide-y divide-border px-5">
                {[
                  { name: 'lazy()', desc: 'Resolve only on explicit partial reloads' },
                  { name: 'defer()', desc: 'Fetch in the background after first render' },
                  { name: 'merge()', desc: 'Append to the existing client-side list' },
                  { name: 'always()', desc: 'Include on every partial reload' },
                  { name: 'optional()', desc: 'Optional on updates, required initially' },
                ].map((p) => (
                  <li key={p.name} className="flex items-baseline justify-between gap-4 py-3.5">
                    <code className="shrink-0 font-mono text-sm font-semibold text-link">
                      {p.name}
                    </code>
                    <span className="text-end text-sm text-secondary">{p.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* 7 — Community + CTA */}
      <Section background="left">
        <div className="w-full">
          <Center>
            <Header>Powering modern server-driven UIs</Header>
            <Para>
              Express-inertia wires Express, Inertia.js, and your favorite
              frontend into one coherent stack — the pieces developers already
              reach for.
            </Para>
          </Center>
          <CommunityMarquee />
          <Center>
            <Para>
              Getting started takes minutes: install one package, register the
              middleware, and replace <code className="font-mono text-sm">res.render()</code> with{' '}
              <code className="font-mono text-sm">res.inertia()</code>.
            </Para>
          </Center>
        </div>

        <div className="mb-6 mt-20 max-w-4xl px-5 text-center">
          <Center>
            <Header>Welcome to the Express-Inertia community</Header>
            <Link
              to="/getting-started"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-brand px-8 py-4 font-display text-lg font-bold text-white transition-colors hover:bg-blue-40"
            >
              Get Started
            </Link>
          </Center>
        </div>
      </Section>
    </div>
  )
}
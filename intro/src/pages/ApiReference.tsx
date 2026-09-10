import { ReactNode } from 'react'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Toc from '../components/Toc'

const toc = [
  { id: 'exports', label: 'Package exports' },
  { id: 'middleware', label: 'Middleware' },
  { id: 'response', label: 'Response (res.inertia)' },
  { id: 'props', label: 'Prop helpers' },
  { id: 'engine', label: 'View engine' },
  { id: 'vite', label: 'Vite helper' },
  { id: 'ssr', label: 'SSR & resilience' },
  { id: 'security', label: 'Security' },
  { id: 'prefetch', label: 'Prefetch' },
  { id: 'logging', label: 'Logging' },
  { id: 'request', label: 'Request (req.inertia)' },
]

const code = (s: string) => (
  <code className="text-[13px] text-link">{s}</code>
)

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

function Signature({ signature, description }: { signature: string; description: string }) {
  return (
    <div className="mb-6">
      <CodeBlock>{signature}</CodeBlock>
      <P>{description}</P>
    </div>
  )
}

interface OptionTableProps {
  headings: string[]
  rows: (ReactNode)[][]
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

export default function ApiReference() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13rem] xl:gap-10">
      <article className="mx-auto min-w-0 max-w-3xl">
        <h1 className="mb-4 mt-8 font-display text-4xl font-semibold tracking-tight text-primary lg:text-5xl">
          API Reference
        </h1>
        <p className="mb-8 text-lg leading-normal text-secondary">
          Complete reference for{' '}
          <code className="text-link">@arponascension/express-inertia</code>.
        </p>

        <H2 id="exports">Package exports</H2>
        <P>
          The package ships three sub-path exports, each with CJS and ESM
          builds:
        </P>
        <OptionTable
          headings={['Export path', 'Contents']}
          rows={[
            [code('"." (main)'), 'Middleware, prop helpers, security, SSR, logging, prefetch, directives, Vite helpers, types'],
            [code('"./vite"'), 'ViteHelper class and inertiaVitePlugin for vite.config.ts'],
            [code('"./engine"'), 'EJS view engine factory for app.engine()'],
          ]}
        />

        <H2 id="middleware">Middleware</H2>
        <Signature
          signature="createInertia(options?: InertiaOptions): RequestHandler"
          description="Default export. Creates middleware that attaches req.inertia and res.inertia to every request and handles the Inertia protocol headers."
        />
        <Signature
          signature="inertia(options?: InertiaOptions): RequestHandler"
          description="Named alias of createInertia."
        />
        <Signature
          signature="requestIdMiddleware(): RequestHandler"
          description="Assigns req.id from the X-Request-ID header or generates a UUID."
        />

        <h3 className="mb-3 mt-8 font-display text-2xl font-semibold text-primary">
          InertiaOptions
        </h3>
        <OptionTable
          headings={['Option', 'Default', 'Description']}
          rows={[
            ['rootView', code('"base.ejs"'), 'Root EJS template name'],
            ['version', code('undefined'), 'Asset version — a string or a function returning string / Promise<string>'],
            ['ssr', code('undefined'), 'SSR configuration (boolean or SSROptions)'],
            ['shared', code('undefined'), 'Global props shared with every Inertia response'],
            ['encryptHistory', code('undefined'), 'Inertia v2 history encryption'],
            ['vite', code('undefined'), 'ViteConfig — consumed by createInertiaEngine(), the middleware itself ignores it'],
            ['inertiaVersion', code('2'), 'Protocol version for the HTML page payload'],
            ['rootElement', code('true'), 'Render the root <div> automatically; false outputs the JSON script tag only (custom id is set via @inertia(id))'],
            ['viewData', code('undefined'), 'Extra data passed only to the root template'],
            ['security', code('defaults'), 'Security hardening settings'],
          ]}
        />

        <H2 id="response">Response handler (res.inertia)</H2>
        <Signature
          signature="res.inertia(component: string, props?, viewData?): Promise<void>"
          description="Render an Inertia response. On X-Inertia AJAX requests it returns JSON; on full page loads it renders the root template with SSR support."
        />
        <OptionTable
          headings={['Method', 'Signature', 'Description']}
          rows={[
            ['render / inertia', code('render(component, props?, viewData?)'), 'Aliases for the callable'],
            ['share', code('share(key | object, value?)'), 'Share props for this request'],
            ['getShared', code('getShared(key?)'), 'Props set via share() and the initial shared object — NOT values resolved by a function shared option'],
            ['location', code('location(url)'), 'External redirect via 409 + X-Inertia-Location'],
            ['back', code('back(fallbackUrl?)'), 'Redirect back (303)'],
            ['version', code('version(v)'), 'Override the asset version for this response'],
            ['rootView', code('rootView(view)'), 'Override the root template for this response'],
            ['encryptHistory', code('encryptHistory(encrypt?)'), 'Inertia v2 history encryption'],
            ['clearHistory', code('clearHistory(clear?)'), 'Inertia v2 clear browser history'],
            ['withFlash', code('withFlash(key, value)'), 'Attach a flash message'],
            ['postForm / putForm / patchForm / deleteForm', code('postForm(...args)'), 'Form helpers for each HTTP verb'],
          ]}
        />

        <H2 id="props">Prop helpers</H2>
        <Signature
          signature="lazy<T>(callback: PropCallback<T>): LazyProp<T>"
          description="Omitted on initial load; only resolved on partial reloads when explicitly requested."
        />
        <Signature
          signature="always<T>(value: T | PropCallback<T>): AlwaysProp<T>"
          description="Always included, even on partial reloads of other keys."
        />
        <Signature
          signature="defer<T>(callback, options?: { group?: string }): DeferredProp<T>"
          description="Inertia v2 deferred prop — fetched in the background after the initial render."
        />
        <Signature
          signature="merge<T>(value: T | PropCallback<T>): MergeProp<T>"
          description="Inertia v2 merge prop — appends to the existing client-side list."
        />
        <Signature
          signature="optional<T>(callback: PropCallback<T>): OptionalProp<T>"
          description="Included on initial load, treated as optional on updates."
        />
        <Signature
          signature="resolveProps(rawProps, req, component): Promise<{ resolvedProps, deferredProps?, mergeProps? }>"
          description="Resolves all prop wrappers based on the current Inertia request context."
        />
        <P>
          Type guards: <code>isLazy</code>, <code>isAlways</code>,{' '}
          <code>isDeferred</code>, <code>isMerge</code>, <code>isOptional</code>.
        </P>

        <H2 id="engine">View engine</H2>
        <Signature
          signature="createInertiaEngine(options?: BladeEngineOptions): Engine"
          description="Creates an Express-compatible EJS engine with Blade directive support."
        />
        <Signature
          signature="inertiaEngine: Engine"
          description="Pre-configured engine with default options."
        />
        <Signature
          signature="clearEngineCache(): void"
          description="Clears all compiled template caches."
        />
        <h3 className="mb-3 mt-8 font-display text-2xl font-semibold text-primary">
          Blade directives
        </h3>
        <OptionTable
          headings={['Directive', 'Output']}
          rows={[
            ['@inertia', 'Renders <div id="app"> + the JSON script tag'],
            ["@inertia('root')", 'Custom root element id'],
            ['@inertiaScript', 'JSON script tag only'],
            ['@inertiaHead', 'SSR head tags'],
            ["@vite('src/main.ts')", 'Dev HMR or production manifest tags'],
            ['@viteReactRefresh', 'React Fast Refresh preamble'],
            ['@csrf', 'CSRF hidden input'],
            ['@routes', 'Ziggy route definitions'],
            ['@json(value)', 'JSON.stringify output'],
            ['<x-inertia … />', 'Component form of @inertia (id attribute sets the root element id)'],
            ['<x-vite src="…" />', 'Component form of @vite (src or entries attribute)'],
            ['<x-inertia-script id="…" />', 'Component form of @inertiaScript'],
          ]}
        />
        <P>
          Custom directives (via <code>registerDirective()</code> or the
          engine's <code>directives</code> option) receive the raw argument
          text — <code>{'@hello(\'World\')'}</code> passes{' '}
          <code>{`'World'`}</code> including quotes — and return compiled EJS
          markup.
        </P>

        <H2 id="vite">Vite helper ("./vite")</H2>
        <Signature
          signature="new ViteHelper(config?: ViteConfig)"
          description="Resolves Vite assets and renders dev or production tags."
        />
        <Signature
          signature="createViteHelper(config?: ViteConfig): ViteHelper"
          description="Factory function."
        />
        <Signature
          signature="defaultViteHelper: ViteHelper"
          description="Default singleton instance."
        />
        <Signature
          signature="inertiaVitePlugin(options?: InertiaVitePluginOptions): InertiaVitePlugin"
          description="Vite plugin that writes/removes the hot file for dev-server detection."
        />
        <h3 className="mb-3 mt-8 font-display text-2xl font-semibold text-primary">
          ViteHelper methods
        </h3>
        <OptionTable
          headings={['Method', 'Returns', 'Description']}
          rows={[
            ['isDev()', code('boolean'), 'Checks the hot file or isDev config'],
            ['getDevServerUrl()', code('string'), 'Reads from the hot file or config'],
            ['getBasePath()', code('string'), 'Production asset base path (ends with /)'],
            ['manifestExists()', code('boolean'), 'Checks if the production manifest exists'],
            ['getManifest()', code('ViteManifest'), 'Loads and caches manifest.json'],
            ['renderTags(entrypoints)', code('string'), 'Generates script/link tags for dev or production'],
            ['renderReactRefresh()', code('string'), 'React Fast Refresh preamble (dev only)'],
            ['generateSriHashForAsset(path)', code('Promise<string>'), 'SHA-384 SRI hash for an asset file'],
          ]}
        />

        <H2 id="ssr">SSR and resilience</H2>
        <Signature
          signature="renderSSR(page, options?): Promise<SSRResult | null>"
          description="Proxies the page to an SSR endpoint or custom render function. Returns null on failure when fallback is enabled."
        />
        <Signature
          signature="class CircuitBreaker(options?: CircuitBreakerOptions)"
          description="CLOSED/OPEN/HALF_OPEN state machine with execute(), allowProbe(), and reset() methods."
        />
        <Signature
          signature="shouldRetry(error, statusCode, retryableStatusCodes): boolean"
          description="Determines if an error is retryable."
        />
        <Signature
          signature="calculateBackoff(attempt, baseDelayMs, maxDelayMs): number"
          description="Exponential backoff with jitter."
        />
        <Signature
          signature="resetAllCircuitBreakers(): void"
          description="Resets all cached circuit breakers."
        />
        <h3 className="mb-3 mt-8 font-display text-2xl font-semibold text-primary">
          SSROptions
        </h3>
        <OptionTable
          headings={['Option', 'Default', 'Description']}
          rows={[
            ['enabled', code('true'), 'SSR runs whenever the ssr option is set; pass false to disable'],
            ['url', code('"http://127.0.0.1:13714/render"'), 'SSR endpoint URL'],
            ['render', code('undefined'), 'Custom in-process render function overriding HTTP'],
            ['timeout', code('2000'), 'SSR request timeout (ms)'],
            ['fallback', code('true'), 'Fall back to client rendering on SSR failure'],
            ['circuitBreaker', code('{}'), 'Partial CircuitBreakerOptions'],
            ['retry', code('{}'), 'Partial RetryOptions'],
          ]}
        />

        <H2 id="security">Security</H2>
        <Signature
          signature="validateComponentName(component, pattern?): void"
          description="Throws TypeError if the name fails the pattern check."
        />
        <Signature
          signature="sanitizeViewData(data): Record"
          description="Recursively strips functions and undefined values from template data."
        />
        <Signature
          signature="escapeHtmlAttr(str): string"
          description={'Escapes &, ", \', <, > for safe HTML attribute insertion.'}
        />
        <Signature
          signature="serializePage(page): string"
          description="JSON-stringify and HTML-escape for the data-page attribute."
        />
        <Signature
          signature="safeStringify(obj): string"
          description="Circular-reference-safe JSON.stringify (circular refs become null)."
        />
        <Signature
          signature="generateSriHash(content): Promise<string>"
          description="SHA-384 Subresource Integrity hash."
        />

        <H2 id="prefetch">Prefetch</H2>
        <Signature
          signature="new PrefetchHelper(viteHelper: ViteHelper)"
          description="Generates prefetch/preload link tags."
        />
        <Signature
          signature="createPrefetchHelper(viteHelper): PrefetchHelper"
          description="Factory function."
        />
        <P>
          Methods: <code>prefetch(entries, options?)</code> and{' '}
          <code>preload(entries, options?)</code>.
        </P>

        <H2 id="logging">Logging</H2>
        <Signature
          signature="createLogger(options?: LoggerOptions): Logger"
          description="Creates a prefixed console logger or wraps an existing one."
        />
        <Signature
          signature="setGlobalLogger(logger: Logger): void"
          description="Replaces the global logger used by all internal modules."
        />
        <Signature
          signature="getGlobalLogger(): Logger"
          description="Returns the current global logger."
        />
        <P>
          Logger interface: <code>{'{ warn, error, info, debug }'}</code> — each
          taking <code>(message, meta?)</code>.
        </P>

        <H2 id="request">Request helper (req.inertia)</H2>
        <OptionTable
          headings={['Property', 'Type', 'Description']}
          rows={[
            ['isInertia', code('boolean'), 'Is this an Inertia AJAX request?'],
            ['version', code('string | null'), 'Client-supplied asset version'],
            ['partialComponent', code('string | null'), 'Target component for a partial reload'],
            ['partialData', code('string[]'), 'Requested prop keys for a partial reload'],
            ['resetData', code('string[]'), 'Prop keys to reset'],
          ]}
        />

        <Callout type="note">
          For the full <code>ViteConfig</code>, <code>BladeEngineOptions</code>,{' '}
          <code>SecurityOptions</code>, <code>CircuitBreakerOptions</code>, and{' '}
          <code>RetryOptions</code> defaults, see the README or the TypeScript
          declarations in{' '}
          <code>node_modules/@arponascension/express-inertia/dist</code>.
        </Callout>
      </article>

      <Toc sections={toc} />
    </div>
  )
}
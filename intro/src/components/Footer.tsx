import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Docs',
    links: [
      { label: 'Getting Started', to: '/getting-started' },
      { label: 'Instant tutorial', to: '/tutorial' },
      { label: 'API Reference', to: '/api' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: 'https://github.com/arponascension/express-inertia' },
      { label: 'npm', href: 'https://www.npmjs.com/package/@arponascension/express-inertia' },
      { label: 'Issues', href: 'https://github.com/arponascension/express-inertia/issues' },
    ],
  },
  {
    title: 'More',
    links: [
      { label: 'Author', href: 'https://github.com/arponascension' },
      { label: 'Inertia.js', href: 'https://inertiajs.com' },
      { label: 'Express', href: 'https://expressjs.com' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gray-90 text-gray-30">
      <div className="footer-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-2xl lg:max-w-md">
            <div className="mb-5 flex items-center gap-2.5">
              <svg viewBox="0 0 100 100" className="h-9 w-9" aria-hidden="true">
                <circle cx="50" cy="50" r="13" fill="#58C4DC" />
                <g fill="none" stroke="#149ECA" strokeWidth="6.5">
                  <ellipse rx="42" ry="19" cx="50" cy="50" />
                  <ellipse rx="42" ry="19" cx="50" cy="50" transform="rotate(120 50 50)" />
                  <ellipse rx="42" ry="19" cx="50" cy="50" transform="rotate(240 50 50)" />
                </g>
              </svg>
              <span className="font-display text-[17px] font-semibold text-white">
                Express-Inertia
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-30">
              The server-side Inertia.js adapter for Express. Connect your
              Express routes and controllers directly to React, Vue, or Svelte
              components — no API layer required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-16">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-3 font-display text-sm font-bold text-gray-20">
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) =>
                    'to' in link ? (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          className="text-sm text-gray-30 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-30 transition-colors hover:text-white"
                        >
                          {link.label}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start gap-2 border-t border-gray-80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-30">
            Copyright © {new Date().getFullYear()} Arpon. Licensed under the MIT License.
          </p>
          <p className="text-xs text-gray-30">
            Built with{' '}
            <a
              href="https://react.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-20 transition-colors hover:text-white"
            >
              React
            </a>{' '}
            and{' '}
            <a
              href="https://inertiajs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-20 transition-colors hover:text-white"
            >
              Inertia
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
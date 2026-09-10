import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/getting-started', label: 'Learn Express-Inertia' },
  { to: '/tutorial', label: 'Tutorial' },
  { to: '/api', label: 'API Reference' },
]

function LogoIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true">
      <defs>
        <linearGradient id="react-logo-g" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0%" stopColor="#149ECA" />
          <stop offset="100%" stopColor="#087EA4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="13" fill="url(#react-logo-g)" />
      <g fill="none" stroke="url(#react-logo-g)" strokeWidth="6.5">
        <ellipse rx="42" ry="19" cx="50" cy="50" />
        <ellipse rx="42" ry="19" cx="50" cy="50" transform="rotate(120 50 50)" />
        <ellipse rx="42" ry="19" cx="50" cy="50" transform="rotate(240 50 50)" />
      </g>
    </svg>
  )
}

export default function Navbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-wash/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="mr-2 inline-flex items-center justify-center rounded-md p-2 text-tertiary hover:bg-card hover:text-primary lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/" className="group inline-flex items-center gap-2.5">
            <span className="group-hover:opacity-90 transition-opacity">
              <LogoIcon />
            </span>
            <span className="font-display text-[17px] font-semibold tracking-tight text-primary">
              Express<span className="text-brand">-Inertia</span>
            </span>
          </Link>
        </div>

        <div className="hidden items-center lg:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium leading-5 transition-colors',
                  isActive
                    ? 'text-brand hover:bg-card/60'
                    : 'text-primary hover:bg-card',
                ].join(' ')}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.npmjs.com/package/@arponascension/express-inertia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium leading-none text-secondary transition-colors hover:border-gray-30 hover:text-primary"
          >
            v1.5.1
          </a>
          <a
            href="https://github.com/arponascension/express-inertia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full p-2 text-tertiary transition-colors hover:bg-card hover:text-primary"
            aria-label="GitHub repository"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
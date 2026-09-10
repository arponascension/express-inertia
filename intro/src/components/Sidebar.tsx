import { Link, useLocation } from 'react-router-dom'

const sections = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Home' },
      { to: '/getting-started', label: 'Getting Started' },
    ],
  },
  {
    title: 'Learn Express-Inertia',
    items: [
      { to: '/getting-started#setup', label: 'Server setup' },
      { to: '/getting-started#root-view', label: 'Root view template' },
      { to: '/getting-started#client', label: 'Client setup' },
      { to: '/getting-started#vite', label: 'Vite integration' },
      { to: '/getting-started#versioning', label: 'Asset versioning' },
      { to: '/getting-started#ssr', label: 'Server-side rendering' },
      { to: '/getting-started#security', label: 'Security' },
    ],
  },
  {
    title: 'Tutorial',
    items: [
      { to: '/tutorial#project', label: 'Project structure' },
      { to: '/tutorial#setup', label: 'Configure Express' },
      { to: '/tutorial#routes', label: 'CRUD routes' },
      { to: '/tutorial#components', label: 'React components' },
      { to: '/tutorial#shared', label: 'Shared props' },
      { to: '/tutorial#partial', label: 'Partial reloads' },
      { to: '/tutorial#run', label: 'Run the app' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { to: '/ssr', label: 'SSR & SEO' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { to: '/api#exports', label: 'Package exports' },
      { to: '/api#middleware', label: 'Middleware' },
      { to: '/api#response', label: 'Response' },
      { to: '/api#props', label: 'Prop helpers' },
      { to: '/api#engine', label: 'View engine' },
      { to: '/api#vite', label: 'Vite helper' },
      { to: '/api#ssr', label: 'SSR & resilience' },
      { to: '/api#security', label: 'Security' },
      { to: '/api#request', label: 'Request helper' },
    ],
  },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()

  const isActive = (to: string) => {
    const path = to.split('#')[0]
    const hash = to.split('#')[1] ?? ''
    if (hash) {
      return location.pathname === path && location.hash === `#${hash}`
    }
    return location.pathname === path && !location.hash
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed top-14 bottom-0 z-40 w-[280px] overflow-y-auto border-r border-border bg-wash px-4 py-8',
          'transition-transform duration-200 lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:bg-wash',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="space-y-0 px-2">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-2 mt-6 flex flex-col gap-2 font-display text-sm font-bold leading-normal text-primary first:mt-0">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={`block border-0 border-l-2 py-1.5 pl-4 pr-2 text-[15px] leading-relaxed transition-colors ${
                          active
                            ? 'border-link font-semibold text-link'
                            : 'border-transparent text-secondary hover:text-primary'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  label: string
}

export default function Toc({ sections }: { sections: TocItem[] }) {
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <nav className="sticky top-24 hidden max-h-[calc(100vh-6rem)] overflow-y-auto px-2 xl:block">
      <h4 className="mb-3 font-display text-sm font-bold leading-normal text-tertiary">
        On this page
      </h4>
      <ul className="space-y-1.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault()
                document
                  .getElementById(s.id)
                  ?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`block border-l-2 py-1 pl-3 text-[13px] leading-snug transition-colors ${
                active === s.id
                  ? 'border-link font-medium text-link'
                  : 'border-transparent text-tertiary hover:text-primary'
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
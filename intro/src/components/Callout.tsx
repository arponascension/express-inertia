import { ReactNode } from 'react'

interface CalloutProps {
  type?: 'note' | 'pitfall'
  title?: string
  children: ReactNode
}

export default function Callout({ type = 'note', title, children }: CalloutProps) {
  const isPitfall = type === 'pitfall'

  return (
    <div
      className={[
        'my-8 rounded-2xl border-t-4 px-5 py-4',
        isPitfall ? 'border-red-40 bg-red-5' : 'border-link bg-blue-5',
      ].join(' ')}
    >
      <div
        className={[
          'mb-2 flex items-center gap-2 font-display text-base font-bold leading-tight',
          isPitfall ? 'text-red-60' : 'text-blue-60',
        ].join(' ')}
      >
        <span>{isPitfall ? '⚠' : '💡'}</span>
        <span>{title ?? (isPitfall ? 'Pitfall' : 'Note')}</span>
      </div>
      <div className="text-sm leading-relaxed text-primary">{children}</div>
    </div>
  )
}
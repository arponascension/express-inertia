import { ReactNode } from 'react'

interface BrowserChromeProps {
  domain?: string
  children: ReactNode
  footer?: ReactNode
  live?: boolean
}

export default function BrowserChrome({
  domain = 'localhost:3000',
  children,
  footer,
  live = false,
}: BrowserChromeProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-wash shadow-nav">
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-gray-20" />
        <span className="h-3 w-3 rounded-full bg-gray-20" />
        <span className="h-3 w-3 rounded-full bg-gray-20" />
        <div className="mx-2 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-wash px-3 py-1.5 text-xs text-gray-30">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="truncate"> https://{domain}</span>
        </div>
        {live && (
          <span className="flex items-center gap-1 rounded-full bg-green-5 px-2 py-0.5 text-[10px] font-semibold text-green-50">
            <span className="h-1.5 w-1.5 rounded-full bg-green-50" />
            LIVE
          </span>
        )}
      </div>
      <div className="relative">
        {children}
        {footer && (
          <div className="border-t border-border bg-card px-4 py-2 text-xs text-tertiary">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
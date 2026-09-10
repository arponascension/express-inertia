import { useState } from 'react'
import { highlight } from '../lib/highlight'

interface CodeBlockProps {
  filename?: string
  language?: string
  children: string
  showLineNumbers?: boolean
  noShadow?: boolean
}

export default function CodeBlock({
  filename,
  children,
  showLineNumbers = false,
  noShadow = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const code = children.replace(/\n+$/, '')
  const lines = code.split('\n')

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-2xl bg-wash font-mono',
        noShadow ? '' : 'shadow-nav',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="select-none text-xs text-tertiary">
          {filename ?? ''}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs text-tertiary opacity-0 transition-opacity hover:text-primary focus:outline-none group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed text-primary">
        {showLineNumbers ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  <td className="select-none pr-4 text-right align-top text-xs text-gray-30 w-8">
                    {i + 1}
                  </td>
                  <td className="whitespace-pre align-top">
                    {highlight(line || ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre p-0">{highlight(code)}</pre>
        )}
      </div>
    </div>
  )
}
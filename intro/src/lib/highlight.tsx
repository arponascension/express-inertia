import { ReactNode } from 'react'

const KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'import',
  'from',
  'export',
  'default',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'new',
  'class',
  'extends',
  'async',
  'await',
  'try',
  'catch',
  'finally',
  'typeof',
  'instanceof',
  'in',
  'of',
  'null',
  'undefined',
  'true',
  'false',
  'this',
  'super',
  'require',
  'module',
  'throw',
  'delete',
  'void',
  'static',
  'get',
  'set',
  'interface',
  'type',
  'enum',
  'implements',
  'public',
  'private',
  'protected',
  'readonly',
  'keyof',
  'as',
  'is',
  'satisfies',
  'unknown',
  'never',
  'any',
  'string',
  'number',
  'boolean',
])

const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`|\b\d[\w.]*\b|\b[A-Za-z_$][\w$]*\b)/g

export function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let match: RegExpExecArray | null

  TOKEN_RE.lastIndex = 0
  while ((match = TOKEN_RE.exec(code)) !== null) {
    if (match.index > last) {
      out.push(code.slice(last, match.index))
    }

    const token = match[0]
    let cls = ''

    if (token.startsWith('//') || token.startsWith('/*')) {
      cls = 'tok-comment'
    } else if (
      code[match.index] === "'" ||
      code[match.index] === '"' ||
      code[match.index] === '`'
    ) {
      cls = 'tok-string'
    } else if (/^\d/.test(token)) {
      cls = 'tok-number'
    } else if (KEYWORDS.has(token)) {
      cls = 'tok-keyword'
    } else {
      const after = code.slice(match.index + token.length).trimStart()
      if (after.startsWith('(')) {
        cls = 'tok-function'
      } else if (/^[A-Z]/.test(token)) {
        cls = 'tok-type'
      } else {
        cls = 'tok-variable'
      }
    }

    out.push(
      <span key={key++} className={cls}>
        {token}
      </span>
    )
    last = match.index + token.length
  }

  if (last < code.length) {
    out.push(code.slice(last))
  }

  return out
}
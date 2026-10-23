import { Fragment, type ReactNode } from 'react'

/** Découpe le texte en paragraphes (lignes vides) puis en lignes — sans rien modifier au texte. */
export function splitBody(body: string): string[][] {
  return body
    .split(/\n[ \t]*\n+/)
    .map((p) => p.split('\n'))
    .filter((lines) => lines.some((l) => l.trim()))
}

export const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length

const MARKERS: Record<string, 'strong' | 'em' | 's'> = { '*': 'strong', _: 'em', '~': 's' }
const isWordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c)
const isSpace = (c: string | undefined) => !c || /\s/.test(c)

/**
 * Interprète la mise en forme saisie dans WhatsApp (*gras*, _italique_, ~barré~) :
 * les mots restent identiques, seuls les symboles de mise en forme deviennent un style.
 */
export function inline(text: string, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = []
  let buf = ''
  let i = 0
  while (i < text.length) {
    const c = text[i]
    const tag = MARKERS[c]
    if (tag && !isWordChar(text[i - 1]) && !isSpace(text[i + 1])) {
      let j = text.indexOf(c, i + 2)
      while (j !== -1 && (isSpace(text[j - 1]) || isWordChar(text[j + 1]))) j = text.indexOf(c, j + 1)
      if (j !== -1) {
        if (buf) out.push(buf)
        buf = ''
        const Tag = tag
        out.push(<Tag key={`${keyPrefix}${i}`}>{inline(text.slice(i + 1, j), `${keyPrefix}${i}-`)}</Tag>)
        i = j + 1
        continue
      }
    }
    buf += c
    i++
  }
  if (buf) out.push(buf)
  return out
}

/** Version texte brut (sans symboles de mise en forme), pour les attributs d'accessibilité. */
export function plain(text: string): string {
  const walk = (nodes: ReactNode[]): string =>
    nodes
      .map((n) => {
        if (typeof n === 'string') return n
        if (n && typeof n === 'object' && 'props' in n) {
          const ch = (n as { props: { children: ReactNode } }).props.children
          return walk(Array.isArray(ch) ? ch : [ch])
        }
        return ''
      })
      .join('')
  return walk(inline(text))
}

export function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {inline(l)}
        </Fragment>
      ))}
    </>
  )
}


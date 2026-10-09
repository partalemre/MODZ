// Text measuring and fitting for hand-laid Svg, close enough to lay out without a renderer.

const NARROW = 'iljtf.,:;|!\'` ()[]'
const WIDE = 'mwMW@%'
const NARROW_EM = 0.3
const WIDE_EM = 0.82
const CAPITAL_EM = 0.64
const LOWER_EM = 0.55
export const MONO_EM = 0.6

// About 7.6 CSS px per cell the desktop reports; it errs small so a drawing never runs off the edge.
const PX_PER_COLUMN = 7.6

export function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function measure(text: string, size: number, isMono = false): number {
  if (isMono) return [...text].length * size * MONO_EM

  return [...text].reduce((sum, char) => {
    if (NARROW.includes(char)) return sum + size * NARROW_EM
    if (WIDE.includes(char)) return sum + size * WIDE_EM

    return sum + size * (char >= 'A' && char <= 'Z' ? CAPITAL_EM : LOWER_EM)
  }, 0)
}

// The text cut with … so it fits `width`; '' when not even one character does.
export function fit(text: string, width: number, font: { size: number; isMono?: boolean }): string {
  const { size, isMono = false } = font
  if (measure(text, size, isMono) <= width) return text
  const chars = [...text]
  while (chars.length > 0 && measure(`${chars.join('')}…`, size, isMono) > width) chars.pop()

  return chars.length === 0 ? '' : `${chars.join('').trimEnd()}…`
}

// Words laid into at most `maxLines` lines of `width`; the last line ends in … when text is left over.
export function wrap(text: string, box: { width: number; size: number; maxLines: number }): string[] {
  const lines: string[] = []
  let line = ''
  const words = text.split(/\s+/).filter(Boolean)
  for (const [index, word] of words.entries()) {
    const tried = line === '' ? word : `${line} ${word}`
    if (measure(tried, box.size) <= box.width || line === '') {
      line = tried
      continue
    }
    lines.push(line)
    line = word
    if (lines.length === box.maxLines - 1) {
      line = words.slice(index).join(' ')
      break
    }
  }
  if (line !== '') lines.push(line)

  return lines.map(part => fit(part, box.width, { size: box.size }))
}

export function widthFor(columns: number | undefined, range: { min: number; max: number }): number {
  const fromCells = Math.floor((columns ?? 0) * PX_PER_COLUMN)

  return Math.max(range.min, Math.min(range.max, fromCells))
}

export function eyebrow(text: string): string {
  return escape(text.toLocaleUpperCase('tr'))
}

// Text helpers shared by the band, the panel and the terminal rows.

const TARGET_MAX = 40
const KILO = 1e3
const MEGA = 1e6
const COST_WIDE = 10
const SECOND = 1000
const MINUTE_S = 60
const HOUR_S = 3600
const EM_NARROW = 0.3
const EM_WIDE = 0.72
const EM_BODY = 0.56

export const xml = (s: string): string =>
  s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

export const clip = (s: string, max: number): string => (s.length > max ? s.slice(0, Math.max(1, max - 1)) + '…' : s)

// Rough advance of system UI text, in em; good enough to size a text's slot.
const charEm = (ch: string): number => {
  if (/[\s.,:;'|!il1ıİ()[\]]/.test(ch)) return EM_NARROW
  if (/[A-ZÇĞÖŞÜА-ЯЁmwшщжюМШЩЖЮ@%]/.test(ch)) return EM_WIDE
  return EM_BODY
}

export const textWidth = (s: string, size: number): number => [...s].reduce((w, ch) => w + charEm(ch) * size, 0)

// Cuts `s` to fit `maxW` pixels, with an ellipsis when it had to cut.
export const fitText = (s: string, size: number, maxW: number): string => {
  if (textWidth(s, size) <= maxW) return s
  let out = ''
  for (const ch of s) {
    if (textWidth(out + ch + '…', size) > maxW) break
    out += ch
  }
  return out + '…'
}

export const fmtTokens = (n: number): string => {
  if (n >= MEGA) return `${(n / MEGA).toFixed(1)}M`
  if (n >= KILO) return `${Math.round(n / KILO)}k`
  return `${Math.round(n)}`
}

export const fmtCost = (usd: number): string => `$${usd < COST_WIDE ? usd.toFixed(2) : usd.toFixed(1)}`

export const fmtTime = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / SECOND))
  const h = Math.floor(s / HOUR_S)
  const m = Math.floor((s % HOUR_S) / MINUTE_S)
  const ss = String(s % MINUTE_S).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export const modelName = (id: string): string => {
  const m = /(fable|mythos|opus|sonnet|haiku)-(\d+)(?:-(\d{1,2})(?!\d))?/i.exec(id)
  const [, family = '', major = '', minor] = m ?? []
  if (!family) return id.replace(/^claude-/, '').replace(/\[.*\]$/, '') || '—'
  return `${family.charAt(0).toUpperCase()}${family.slice(1).toLowerCase()} ${major}${minor ? '.' + minor : ''}`
}

export const norm = (s: string): string => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

// `mcp__server__tool` reads as `tool`; built-ins keep their name.
export const toolName = (tool: string): string => (tool.startsWith('mcp__') ? tool.split('__').at(-1) || tool : tool)

const lastSegments = (path: string): string => path.split('/').filter(Boolean).slice(-2).join('/')

const TARGET_KEYS = ['command', 'pattern', 'query', 'description', 'subject', 'skill', 'prompt'] as const

// What a tool call works on, in a few characters: a file, a command's first line, a host.
export function toolTarget(input: Record<string, unknown>): string {
  const str = (key: string): string => (typeof input[key] === 'string' ? String(input[key]).trim() : '')
  const path = str('file_path') || str('notebook_path') || str('path')
  if (path) return clip(lastSegments(path), TARGET_MAX)
  const url = str('url')
  if (url) return clip(/^[a-z]+:\/\/([^/?#]+)/i.exec(url)?.[1] ?? url, TARGET_MAX)
  const key = TARGET_KEYS.find(k => str(k))
  return key ? clip(str(key).split('\n')[0] ?? '', TARGET_MAX) : ''
}

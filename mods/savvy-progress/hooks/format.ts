// Text helpers shared by the band, the panel and the terminal rows.
import { t } from './i18n'

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

// Cuts from the start, so a path keeps its end: "…/hooks/" rather than "src/mo…".
export const fitStart = (s: string, size: number, maxW: number): string => {
  if (textWidth(s, size) <= maxW) return s
  const chars = [...s]
  while (chars.length && textWidth('…' + chars.join(''), size) > maxW) chars.shift()
  return chars.length ? '…' + chars.join('') : ''
}

// A monospace face gives every character the same advance, a little over half an em.
const MONO_EM = 0.62

export const monoWidth = (s: string, size: number): number => [...s].length * MONO_EM * size

/** Cuts monospace text to `maxW` pixels, at its end or, for a path, at its start. */
export const fitMono = (s: string, opts: { size: number; maxW: number; isFromStart?: boolean }): string => {
  const room = Math.floor(opts.maxW / (MONO_EM * opts.size))
  const chars = [...s]
  if (chars.length <= room) return s
  if (room < 2) return ''
  return opts.isFromStart ? '…' + chars.slice(-(room - 1)).join('') : chars.slice(0, room - 1).join('') + '…'
}

// A fixed-decimal number in the interface language's decimal mark ("1,5" in Turkish).
export const fixed = (n: number, digits: number): string => n.toFixed(digits).replace('.', t().decimal)

export const fmtTokens = (n: number): string => {
  if (n >= MEGA) return `${fixed(n / MEGA, 1)}M`
  if (n >= KILO) return `${Math.round(n / KILO)}k`
  return `${Math.round(n)}`
}

export const fmtCost = (usd: number): string => `$${usd < COST_WIDE ? fixed(usd, 2) : fixed(usd, 1)}`

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
// The open card has room for a whole path or a long command line; the history row has not.
const DETAIL_MAX = 160
// Folders kept before a file's name when a path is shortened.
const PATH_DEPTH = 3

type Aim = { path: string; url: string; text: string }

// What a call points at, before it is cut for a row or a card.
const aimOf = (input: Record<string, unknown>): Aim => {
  const str = (key: string): string => (typeof input[key] === 'string' ? String(input[key]).trim() : '')
  const key = TARGET_KEYS.find(k => str(k))
  return {
    path: str('file_path') || str('notebook_path') || str('path'),
    url: str('url'),
    text: key ? str(key).split('\n')[0] ?? '' : '',
  }
}

// What a tool call works on, in a few characters: a file, a command's first line, a host.
export function toolTarget(input: Record<string, unknown>): string {
  const aim = aimOf(input)
  if (aim.path) return clip(lastSegments(aim.path), TARGET_MAX)
  if (aim.url) return clip(/^[a-z]+:\/\/([^/?#]+)/i.exec(aim.url)?.[1] ?? aim.url, TARGET_MAX)
  return clip(aim.text, TARGET_MAX)
}

/** The same aim at full length: the whole path, the whole address, the command's first line. */
export const toolDetail = (input: Record<string, unknown>): string => {
  const aim = aimOf(input)
  return clip(aim.path || aim.url || aim.text, DETAIL_MAX)
}

/** A path's last few folders and its name: enough to tell two files apart in a narrow card. */
export const shortPath = (path: string, depth = PATH_DEPTH): string => {
  const parts = path.split('/').filter(Boolean)
  const tail = parts.slice(-depth).join('/')
  return parts.length > depth ? `…/${tail}` : path
}

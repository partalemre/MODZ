// A prompt cache belongs to one model: the first request on another rewrites the whole context, warm clock or not.
// Two ids name the same model when their family and version agree (`claude-opus-5` and `claude-opus-5-20260101`).
// An id with no readable family (`default`, an alias, a gateway's own name) is never called a change: the guard
// holds a send only on a switch it can name.

/** The model the cache was written with, and the one the next send would use, as the engine names them. */
export type ModelSwitch = { from: string; to: string }

const FAMILY = /(fable|opus|sonnet|haiku)-(\d{1,2})(?:-(\d{1,2}))?(?!\d)/

type Parsed = { family: string; version: string }

function parse(id: string): Parsed | null {
  const m = FAMILY.exec(id.toLowerCase().replace(/\[[^\]]*\]/g, '').replace(/[\s.]+/g, '-'))
  if (!m || !m[1] || !m[2]) return null
  return { family: m[1], version: m[3] ? `${m[2]}.${m[3]}` : m[2] }
}

/** `claude-sonnet-4-5-20250929` → `Sonnet 4.5`; an id it cannot read stays as it is. */
export function modelName(id: string): string {
  const p = parse(id)
  if (!p) return id
  return `${p.family.charAt(0).toUpperCase()}${p.family.slice(1)} ${p.version}`
}

/** The switch between the cache's model and the session's, or null when they agree or either cannot be read. */
export function switchOf(cache: string, session: string): ModelSwitch | null {
  const a = parse(cache)
  const b = parse(session)
  if (!a || !b) return null
  if (a.family === b.family && a.version === b.version) return null
  return { from: cache, to: session }
}

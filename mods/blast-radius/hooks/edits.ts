// Which files each chat edited lately, kept in the plugin's store so every session on this
// machine sees the others'. Each session writes only its own key (`edits/<sessionId>`), so two
// sessions writing at once never overwrite each other; a session removes its key when it ends.
// Pure over an injected store, so it is tested without the engine.

export const EDITS_KEY_PREFIX = 'edits/'
// An edit older than this no longer counts as another chat being in the file.
export const EDIT_WINDOW_MS = 30 * 60 * 1000
// One session's log holds at most this many files; the oldest go first.
export const EDITS_CAP = 200
// A key left by a session that ended without saying so (a crash) goes once it is this old.
export const ABANDONED_MS = 24 * 60 * 60 * 1000

export type EditStore = {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  delete: (key: string) => Promise<void>
  keys: () => Promise<string[]>
}

// What one session keeps: its project folder's name and when it last changed each real path.
export type EditLog = { sessionId: string; project: string; edits: Record<string, number> }

export type Edit = { path: string; sessionId: string; project: string; at: number }

export const editsKey = (sessionId: string): string => `${EDITS_KEY_PREFIX}${sessionId}`

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** A stored log, or null when the value is not one (another version's shape, a hand edit). */
export function parseLog(value: unknown): EditLog | null {
  if (!isRecord(value) || typeof value.sessionId !== 'string' || !isRecord(value.edits)) return null
  const edits: Record<string, number> = {}
  for (const [path, at] of Object.entries(value.edits)) if (typeof at === 'number' && Number.isFinite(at)) edits[path] = at

  return { sessionId: value.sessionId, project: typeof value.project === 'string' ? value.project : '', edits }
}

/** The log with this edit added, edits past the window dropped and the newest `EDITS_CAP` kept. */
export function withEdit(log: EditLog | null, edit: Edit): EditLog {
  const since = edit.at - EDIT_WINDOW_MS
  const kept = Object.entries({ ...(log?.edits ?? {}), [edit.path]: edit.at })
    .filter(([, at]) => at >= since)
    .sort((a, b) => b[1] - a[1])
    .slice(0, EDITS_CAP)

  return { sessionId: edit.sessionId, project: edit.project, edits: Object.fromEntries(kept) }
}

export async function recordEdit(store: EditStore, edit: Edit): Promise<void> {
  const key = editsKey(edit.sessionId)
  await store.set(key, withEdit(parseLog(await store.get(key)), edit))
}

const newest = (log: EditLog): number => Math.max(0, ...Object.values(log.edits))

/** The latest edit another session made to `path` within the window, or null. Clears logs long abandoned. */
export async function findClash(store: EditStore, ask: { path: string; sessionId: string; now: number }): Promise<Edit | null> {
  const own = editsKey(ask.sessionId)
  const since = ask.now - EDIT_WINDOW_MS
  let found: Edit | null = null
  for (const key of await store.keys()) {
    if (!key.startsWith(EDITS_KEY_PREFIX) || key === own) continue
    const log = parseLog(await store.get(key))
    if (log === null || newest(log) < ask.now - ABANDONED_MS) {
      await store.delete(key)
      continue
    }
    const at = log.edits[ask.path]
    if (at !== undefined && at >= since && (found === null || at > found.at)) found = { path: ask.path, sessionId: log.sessionId, project: log.project, at }
  }

  return found
}

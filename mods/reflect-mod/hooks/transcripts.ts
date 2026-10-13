// Where this project's past chats are and how much of them `/mine` reads. The engine keeps each chat as
// `<config dir>/projects/<slug>/<session id>.jsonl`, the slug being the project's path with every character
// that is not a letter or a digit turned into '-' (seen on this machine: `/Users/me/.subz-work` is
// `-Users-me--subz-work`). Pure: the file system comes in as `Disk`, bound in the wiring.

/** The last this many chats are read; older ones are not looked at. */
export const MAX_CHATS = 20
/** A chat file over this size is skipped whole: the engine reads no file over 4 MiB at once. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024
/** Of a file read, at most this many characters are scanned (its start), so one long chat cannot crowd out the rest. */
export const MAX_SCAN_CHARS = 1_000_000
/** Paths longer than this get a shortened folder name; the folder is then found by its first characters. */
export const MAX_SLUG = 200

export type DiskEntry = { name: string; kind: 'file' | 'dir' | 'other'; size: number; mtimeMs: number }

export type Disk = {
  exists: (path: string) => Promise<boolean>
  list: (path: string) => Promise<DiskEntry[]>
  read: (path: string) => Promise<string>
}

export type Chat = { id: string; text: string }

export type Recent = { chats: Chat[]; skipped: number; hasFolder: boolean }

export const projectSlug = (root: string): string => root.replace(/[^a-zA-Z0-9]/g, '-')

/** `CLAUDE_CONFIG_DIR` when set, else `~/.claude`. */
export function projectsBase(o: { home: string; configDir?: string }): string {
  const base = o.configDir !== undefined && o.configDir.trim() !== '' ? o.configDir.trim() : `${o.home}/.claude`
  return `${base.replace(/\/+$/, '')}/projects`
}

/** The project's transcript folder, or undefined when it has none yet. */
export async function findFolder(disk: Disk, o: { base: string; root: string }): Promise<string | undefined> {
  const slug = projectSlug(o.root)
  const exact = `${o.base}/${slug}`
  if (await disk.exists(exact)) return exact
  if (slug.length <= MAX_SLUG || !(await disk.exists(o.base))) return undefined
  const head = slug.slice(0, MAX_SLUG)
  const found = (await disk.list(o.base)).find(entry => entry.kind === 'dir' && entry.name.startsWith(head))
  return found === undefined ? undefined : `${o.base}/${found.name}`
}

/** The newest chat files, the running session's own left out: it is not a past chat. */
export function pickChats(entries: DiskEntry[], currentId: string): DiskEntry[] {
  return entries
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.jsonl') && entry.name !== `${currentId}.jsonl`)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, MAX_CHATS)
}

/** Reads the last MAX_CHATS chats, skipping files over MAX_FILE_BYTES and any that will not read. */
export async function readRecent(disk: Disk, o: { folder: string | undefined; currentId: string }): Promise<Recent> {
  if (o.folder === undefined) return { chats: [], skipped: 0, hasFolder: false }
  const picked = pickChats(await disk.list(o.folder), o.currentId)
  const chats: Chat[] = []
  let skipped = 0
  for (const entry of picked) {
    if (entry.size > MAX_FILE_BYTES) {
      skipped += 1
      continue
    }
    // A file that went away or would not read since it was listed counts as skipped, not as a failure.
    const text = await disk.read(`${o.folder}/${entry.name}`).catch(() => undefined)
    if (text === undefined) skipped += 1
    else chats.push({ id: entry.name.replace(/\.jsonl$/, ''), text: text.slice(0, MAX_SCAN_CHARS) })
  }
  return { chats, skipped, hasFolder: true }
}

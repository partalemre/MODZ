// Where this project's past chats are and how much of them `/mine` reads. The engine keeps each chat as
// `<config dir>/projects/<slug>/<session id>.jsonl`, the slug being the project's path with every character
// that is not a letter or a digit turned into '-' (seen on this machine: `/Users/me/.subz-work` is
// `-Users-me--subz-work`). Pure: the file system comes in as `Disk`, bound in the wiring.

/** The last this many chats with the person are read; older ones are not looked at. */
export const MAX_CHATS = 20
/**
 * At most this many files are opened to find them: runs nobody typed in (`claude -p` scripts, agents) are
 * passed over and do not take a chat's place.
 */
export const MAX_LOOKED = 60
/** A chat file over this size is not read whole (the engine reads no file over 4 MiB at once): only its end is. */
export const MAX_FILE_BYTES = 4 * 1024 * 1024
/** How much of a larger chat's end is read: the newest part of a long chat, where its friction is freshest. */
export const TAIL_BYTES = 1_000_000
/** Of a file read, at most this many characters are scanned (its start), so one long chat cannot crowd out the rest. */
export const MAX_SCAN_CHARS = 1_000_000
/** Paths longer than this get a shortened folder name; the folder is then found by its first characters. */
export const MAX_SLUG = 200

export type DiskEntry = { name: string; kind: 'file' | 'dir' | 'other'; size: number; mtimeMs: number }

export type Disk = {
  exists: (path: string) => Promise<boolean>
  list: (path: string) => Promise<DiskEntry[]>
  read: (path: string) => Promise<string>
  /** The file's last `bytes` bytes as text, or undefined when they could not be read. */
  tail: (path: string, bytes: number) => Promise<string | undefined>
}

export type Chat = { id: string; text: string }

/** `partial`: chats only the end of which was read; `skipped`: chats that could not be read at all. */
export type Recent = { chats: Chat[]; partial: number; skipped: number; hasFolder: boolean }

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

/** The newest chat files to look in, the running session's own left out: it is not a past chat. */
export function pickChats(entries: DiskEntry[], currentId: string): DiskEntry[] {
  return entries
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.jsonl') && entry.name !== `${currentId}.jsonl`)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, MAX_LOOKED)
}

/** A tail starts mid-row: everything up to its first line break is a torn row, dropped. */
export const wholeLines = (tail: string): string => {
  const cut = tail.indexOf('\n')
  return cut < 0 ? '' : tail.slice(cut + 1)
}

/** One chat's text: whole when small, its last TAIL_BYTES when large; undefined when neither reads. */
async function readChat(disk: Disk, o: { path: string; size: number }): Promise<{ text: string; isPartial: boolean } | undefined> {
  if (o.size > MAX_FILE_BYTES) {
    // A tail that fails (no `tail`, a timeout) leaves this chat out; the pane counts it as skipped.
    const tail = await disk.tail(o.path, TAIL_BYTES).catch(() => undefined)
    return tail === undefined ? undefined : { text: wholeLines(tail), isPartial: true }
  }
  // A file that went away or would not read since it was listed counts as skipped, not as a failure.
  const text = await disk.read(o.path).catch(() => undefined)
  return text === undefined ? undefined : { text, isPartial: false }
}

export type ReadOpts = { folder: string | undefined; currentId: string; isTalk?: (text: string) => boolean }

/**
 * Reads the last MAX_CHATS chats that `isTalk` accepts (all, without it), each cut to MAX_SCAN_CHARS, the
 * large ones from their end; at most MAX_LOOKED files are opened.
 */
export async function readRecent(disk: Disk, o: ReadOpts): Promise<Recent> {
  if (o.folder === undefined) return { chats: [], partial: 0, skipped: 0, hasFolder: false }
  const recent: Recent = { chats: [], partial: 0, skipped: 0, hasFolder: true }
  for (const entry of pickChats(await disk.list(o.folder), o.currentId)) {
    if (recent.chats.length >= MAX_CHATS) break
    const got = await readChat(disk, { path: `${o.folder}/${entry.name}`, size: entry.size })
    if (got === undefined) {
      recent.skipped += 1
      continue
    }
    const text = got.text.slice(0, MAX_SCAN_CHARS)
    if (o.isTalk !== undefined && !o.isTalk(text)) continue
    if (got.isPartial) recent.partial += 1
    recent.chats.push({ id: entry.name.replace(/\.jsonl$/, ''), text })
  }
  return recent
}

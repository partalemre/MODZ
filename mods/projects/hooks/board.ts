import type { Io } from './collect'
import { lang } from './kit/lang'
import type { Snapshot } from '../types'

// The full board: a plain page on the person's own disk, opened in their browser. No server: the page re-reads
// `data.js` by a script tag, which a file:// page may do, so it follows every new snapshot by itself.

const OPEN_MS = 8000
const PAGE_FILES = ['index.html', 'page.css', 'words.js', 'page.js']
const OPENERS: Record<string, readonly string[]> = { darwin: ['open'], win32: ['cmd', '/c', 'start', ''], linux: ['xdg-open'] }

// `</` could close a script tag in the odd case a prompt holds one; this file is only ever read as a script.
export const dataScript = (snapshot: Snapshot, language: string): string =>
  `window.BOARD=${JSON.stringify({ ...snapshot, language }).replace(/<\//g, '<\\/')};window.onBoard&&window.onBoard();`

export async function writeData(io: Io, own: string, snapshot: Snapshot): Promise<void> {
  await io.write(`${own}/data.js`, dataScript(snapshot, lang()))
}

export async function openBoard(io: Io, spec: { own: string; pluginRoot: string; platform: string }): Promise<void> {
  for (const name of PAGE_FILES) await io.write(`${spec.own}/${name}`, await io.read(`${spec.pluginRoot}/page/${name}`))
  const opener = OPENERS[spec.platform] ?? OPENERS.linux ?? []
  await io.run([...opener, `${spec.own}/index.html`], OPEN_MS)
}

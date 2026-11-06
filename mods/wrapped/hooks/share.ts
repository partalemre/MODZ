import { standalone } from './card'
import type { CardSpec } from './card'
import { H, W } from './film-parts'
import { summaryPic } from './story'
import { panelWords } from './story-words'
import { personaName } from './words'
import type { Shared } from '../types'

// Sharing: one press puts the image on the clipboard, ready to paste anywhere; a second opens a post with the words
// filled in. Nothing is uploaded: the person sends it from their own browser, and masked names stay masked.

const SCALE = 2
const TIMEOUT_MS = 30_000
// The post's address; the words themselves say nothing of projects.
const REPO = 'https://github.com/partalemre/MODZ'
const POST_URL = 'https://x.com/intent/post'

// The session's hands, handed in: the engine follows `$` only within one file.
export type ShareIo = {
  home: () => Promise<unknown>
  write: (path: string, text: string) => Promise<void>
  run: (argv: string[], timeoutMs: number) => Promise<{ exitCode: number }>
}

const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))

// PNG through macOS's own `sips`; elsewhere the SVG stays.
async function savedImage(io: ShareIo, spec: CardSpec): Promise<string> {
  const home = await io.home()
  if (typeof home !== 'string' || home === '') throw new Error('HOME is not set')
  const stem = `${home}/Downloads/wrapped-${spec.wrapped.year}`
  await io.write(`${stem}.svg`, standalone(summaryPic(spec)))
  const ran = await io.run(['sips', '-s', 'format', 'png', '-z', String(H * SCALE), String(W * SCALE), `${stem}.svg`, '--out', `${stem}.png`], TIMEOUT_MS).catch(() => null)

  return ran?.exitCode === 0 ? `${stem}.png` : `${stem}.svg`
}

// shortcut: the clipboard goes through macOS's osascript; elsewhere the file's path is what the person gets.
async function toClipboard(io: ShareIo, path: string): Promise<boolean> {
  if (!path.endsWith('.png')) return false
  const script = `set the clipboard to (read (POSIX file ${JSON.stringify(path)}) as «class PNGf»)`
  const ran = await io.run(['osascript', '-e', script], TIMEOUT_MS).catch(() => null)

  return ran?.exitCode === 0
}

export function postUrl(spec: CardSpec): string {
  const w = spec.wrapped
  const text = panelWords().post(w.year, personaName(w.persona), w.prompts, w.activeDays, w.agentRuns)

  return `${POST_URL}?text=${encodeURIComponent(text)}&url=${encodeURIComponent(REPO)}`
}

export async function copyImage(io: ShareIo, spec: CardSpec): Promise<Shared> {
  try {
    const path = await savedImage(io, spec)

    return { kind: (await toClipboard(io, path)) ? 'copied' : 'copyFailed', path }
  } catch (error) {
    return { kind: 'failed', reason: why(error) }
  }
}

export async function shareOnX(io: ShareIo, spec: CardSpec): Promise<Shared> {
  const copied = await copyImage(io, spec)
  if (copied.kind === 'failed') return copied
  const ran = await io.run(['open', postUrl(spec)], TIMEOUT_MS).catch(() => null)

  return ran?.exitCode === 0 ? { kind: 'posted', path: copied.path } : copied
}

export function sharedLine(shared: Shared): string {
  const t = panelWords()
  if (shared.kind === 'failed') return shared.reason
  if (shared.kind === 'copied') return t.copiedImage(shared.path)

  return shared.kind === 'posted' ? t.sharedX : t.copyFailed(shared.path)
}

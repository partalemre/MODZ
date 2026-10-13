// The caution cards, as views the shared card draws in Amber: an edit to a file another chat
// changed within the window. Pure, so the pane, the band and the terminal share it.

import type { Edit } from './edits'
import type { View } from './view'
import { words } from './words'

const MINUTE_MS = 60 * 1000

export type LineCount = { added: number; removed: number }

export type ClashCard = {
  clash: Edit
  now: number
  // The path as the person reads it: relative to the session folder when inside it.
  shown: string
  // Uncommitted lines in the file now (`git diff --numstat`), or null outside git or unchanged.
  diff: LineCount | null
}

const baseName = (path: string): string => path.split('/').filter(Boolean).pop() ?? path

/** Whole minutes since the other chat's edit; a clock that went back reads as just now. */
export const minutesSince = (at: number, now: number): number => Math.max(0, Math.floor((now - at) / MINUTE_MS))

export function clashView(card: ClashCard): View {
  const said = words().edit
  const { diff } = card

  return {
    tone: 'warn',
    eyebrow: said.eyebrow,
    icon: 'pencil',
    command: '',
    headline: said.headline(baseName(card.shown), minutesSince(card.clash.at, card.now)),
    payload: '',
    isPayloadEmpty: true,
    tail: '',
    context: said.context(card.clash.project),
    fullCommand: null,
    banner: { tone: 'warn', text: said.banner },
    rows: [{ kind: 'item', name: card.shown, tag: diff === null ? '' : 'M', count: '', size: diff === null ? '' : `+${diff.added} −${diff.removed}`, share: null, icon: 'file' }],
    toggleCount: 0,
    action: said.action,
    cancel: said.cancel,
  }
}

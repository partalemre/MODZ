import { words } from './words'

// One quiet line under the prompt, no toast: `REC · 1 secret kept out of the chat`.

const SEPARATOR = ' · '
// null until the first write: after a reload the engine may still draw the old line, so the first one always goes out.
let shown: string | undefined | null = null

export function statusText(spec: { isRecording: boolean; keptCount: number }): string | undefined {
  const said = words()
  const parts = [spec.isRecording ? said.rec : '', spec.keptCount > 0 ? said.keptOut(spec.keptCount) : '']

  return parts.filter(part => part !== '').join(SEPARATOR) || undefined
}

// Whether the line must be written: only when its text changes.
export function isNewStatus(text: string | undefined): boolean {
  if (text === shown) return false
  shown = text

  return true
}

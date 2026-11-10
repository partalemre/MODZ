import { isReadOnly } from './bash'
import { clip } from './pane'
import { words } from './words'

// One turn as the snapshot hooks in register.tsx see it. Armed by each prompt; the first write after it takes
// the snapshot, later writes wait for it. `ref` is the turn's checkpoint once taken; `files` and `tools` what
// the turn did after it.

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])
const PROMPT_LABEL_MAX = 100

export const turn = { isArmed: false, label: '', pending: null as Promise<void> | null, number: 0, ref: null as string | null, files: new Set<string>(), tools: new Set<string>() }

export function armTurn(text: string): void {
  Object.assign(turn, { isArmed: true, label: clip(text.split('\n')[0]?.trim() || words().promptFallback, PROMPT_LABEL_MAX), ref: null })
  turn.number += 1
  turn.files.clear()
  turn.tools.clear()
}

// A file tool, or a Bash command that may write (sed -i, rm, codegen): either can change what an undo brings back.
// A file tool's path joins the turn's files.
export function isWrite(e: object): boolean {
  const call = e as { tool?: unknown; command?: unknown; file_path?: unknown; notebook_path?: unknown }
  const path = call.file_path ?? call.notebook_path
  if (WRITE_TOOLS.has(String(call.tool))) {
    if (typeof path === 'string') turn.files.add(path)

    return true
  }

  return call.tool === 'Bash' && !isReadOnly(String(call.command ?? ''))
}

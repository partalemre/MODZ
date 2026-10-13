import { ERROR_CHARS } from './limits'

// What the note remembers of the conversation's tool calls: the files Claude wrote and the last error. Pure.

// The tools that write a file, and the input field that names it.
const WRITE_FIELDS: Record<string, string> = { Write: 'file_path', Edit: 'file_path', NotebookEdit: 'notebook_path' }

export function touchedPath(tool: string, input: unknown): string | null {
  const field = WRITE_FIELDS[tool]
  if (field === undefined || typeof input !== 'object' || input === null) return null
  const path = (input as Record<string, unknown>)[field]

  return typeof path === 'string' && path !== '' ? path : null
}

// Each file once, in the order Claude first touched it.
export const withFile = (files: readonly string[], path: string): string[] => (files.includes(path) ? [...files] : [...files, path])

// "Bash: npm ERR! missing script: test", one line, cut.
export function errorLine(tool: string, text: string | undefined): string {
  const first = (text ?? '').split('\n').map(line => line.trim()).find(line => line !== '') ?? ''
  const line = first === '' ? tool : `${tool}: ${first}`

  return line.length <= ERROR_CHARS ? line : `${line.slice(0, ERROR_CHARS - 1)}…`
}

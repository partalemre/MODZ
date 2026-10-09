type Input = Record<string, unknown>

type Edit = { old_string?: unknown; new_string?: unknown }

const FILE_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit']

export function isFileTool(input: Input): boolean {
  return typeof input.tool === 'string' && FILE_TOOLS.includes(input.tool)
}

export function pathOf(input: Input): string | null {
  const path = input.file_path ?? input.notebook_path

  return typeof path === 'string' && path !== '' ? path : null
}

function editsOf(input: Input): Edit[] {
  return Array.isArray(input.edits) ? (input.edits as Edit[]) : []
}

// The text the call would put on disk: only what it adds, never what it replaces.
export function fileText(input: Input): string {
  if (input.tool === 'Write') return String(input.content ?? '')
  if (input.tool === 'Edit') return String(input.new_string ?? '')
  if (input.tool === 'NotebookEdit') return String(input.new_source ?? '')

  return editsOf(input)
    .map(edit => String(edit.new_string ?? ''))
    .join('\n')
}

export function patchedFields(input: Input, change: (text: string) => string): Input {
  if (input.tool === 'Write') return { content: change(String(input.content ?? '')) }
  if (input.tool === 'Edit') return { new_string: change(String(input.new_string ?? '')) }
  if (input.tool === 'NotebookEdit') return { new_source: change(String(input.new_source ?? '')) }

  return { edits: editsOf(input).map(edit => ({ ...edit, new_string: change(String(edit.new_string ?? '')) })) }
}

export function resolvePath(base: string, path: string): string {
  if (path.startsWith('/')) return path
  const parts = base.split('/')
  for (const part of path.split('/')) {
    if (part === '..') parts.pop()
    else if (part !== '.' && part !== '') parts.push(part)
  }

  return parts.join('/') || '/'
}

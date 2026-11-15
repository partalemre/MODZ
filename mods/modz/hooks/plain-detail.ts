// What a single tool call's trail adds so a person can follow it, not only watch it: the files a command line
// touches (its own script included), by name and pressable, and what came back, in one short line. Read from the
// call's own input and output by rules: no model call, no tokens.
import type { Lang } from './kit/lang'
import type { StepFile } from './plain-trail'

const FILES_MAX = 4
const RESULT_MAX = 110
// A word that reads as a file: a path or name ending in an extension a project keeps its work in.
const FILE_WORD = /(?:~|\.{1,2})?\/?[\w@.-]+(?:\/[\w@.-]+)*\.(?:tsx?|jsx?|mjs|cjs|json|md|py|sh|html|css|ya?ml|toml|swift|dart|cs|go|rs|txt|svg|png)\b/g
const LEADING_CD = /^\s*cd\s+("([^"]+)"|'([^']+)'|(\/\S+))/

const fieldsOf = (value: unknown): Record<string, unknown> => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {})

/** The folder a command line first moves into, when it names one by its whole path. */
export function folderOf(command: string): string | undefined {
  const moved = LEADING_CD.exec(command)
  const folder = moved?.[2] ?? moved?.[3] ?? moved?.[4]

  return folder?.startsWith('/') === true ? folder.replace(/[;&]+$/, '').replace(/\/$/, '') : undefined
}

/** The files a command line names, its own script's included: whole paths, so each name can be pressed open. */
export function commandFiles(input: unknown): StepFile[] {
  const command = fieldsOf(input).command
  if (typeof command !== 'string') return []
  const folder = folderOf(command)
  const files = (command.match(FILE_WORD) ?? []).flatMap(word => {
    const path = word.startsWith('/') ? word : folder === undefined || word.startsWith('~') ? undefined : `${folder}/${word.replace(/^\.\//, '')}`

    return path === undefined ? [] : [{ name: path.split('/').at(-1) ?? path, path }]
  })

  return files.filter((file, i) => files.findIndex(other => other.path === file.path) === i).slice(0, FILES_MAX)
}

// The words of a call's output, whatever shape the tool gave them.
function textOf(output: unknown): string {
  if (typeof output === 'string') return output
  if (Array.isArray(output)) return output.map(textOf).join('\n')
  const fields = fieldsOf(output)

  return ['stdout', 'stderr', 'text', 'content', 'output', 'result'].map(key => (fields[key] === undefined ? '' : textOf(fields[key]))).filter(Boolean).join('\n')
}

const WORDS = {
  en: { none: 'found nothing', more: (n: number) => `(+${n} more ${n === 1 ? 'line' : 'lines'})` },
  tr: { none: 'hiçbir şey bulamadı', more: (n: number) => `(+${n} satır daha)` },
}

/**
 * What came back from a command or a search, in one line: its first line and how much more there was. Empty
 * where there is nothing to tell (the call still runs, or it is a read or a change, whose row says it all).
 */
export function resultLine(call: { tool: string; output?: unknown }, lang: Lang): string {
  const isSearch = call.tool === 'Grep' || call.tool === 'Glob'
  if ((call.tool !== 'Bash' && !isSearch) || call.output === undefined) return ''
  const words = WORDS[lang === 'tr' ? 'tr' : 'en']
  const lines = textOf(call.output).split('\n').map(line => line.trim()).filter(line => line !== '')
  const first = lines[0]
  if (first === undefined) return isSearch ? `→ ${words.none}` : ''
  const shown = first.length > RESULT_MAX ? `${first.slice(0, RESULT_MAX - 1)}…` : first

  return `→ ${shown}${lines.length > 1 ? ` ${words.more(lines.length - 1)}` : ''}`
}

import { findSecrets } from './detect'
import type { Finding } from './findings'
import { gitSteps, isEnvFile, words } from './git'
import { fileText, isFileTool, pathOf } from './tools'
import { tokenHits } from './vault'
import type { Vault } from './vault'

// What a Bash command would write to a file: a heredoc fed to `cat`/`tee`, or `echo`/`printf` redirected or piped
// to `tee`. Enough for what Claude writes this way; not a shell parser (a script that writes files is not read).

export type BashWrite = { path: string; text: string }

const HEREDOC = /<<-?[ \t]*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1([^\n]*)\n([\s\S]*?)\n[ \t]*\2[ \t]*(?=\n|$)/g
const SEPARATORS = /&&|\|\||;|\n/
// `> file` and `>> file`; not `2>`, `>&2` or `&>`.
const REDIRECT = /(?:^|[^\d&>])1?>>?(?!&)[ \t]*("[^"]*"|'[^']*'|[^\s|;&<>]+)/
const TEE = /\btee\s+(?:-\S+\s+)*("[^"]*"|'[^']*'|[^\s|;&<>-][^\s|;&<>]*)/
const PRINTERS = new Set(['echo', 'printf'])
const DEVICES = /^\/dev\//

const unquote = (word: string): string => word.replace(/^(["'])(.*)\1$/, '$2')

function targetOf(segment: string): string | null {
  const raw = REDIRECT.exec(segment)?.[1] ?? TEE.exec(segment)?.[1]
  if (raw === undefined) return null
  const path = unquote(raw)

  return DEVICES.test(path) ? null : path
}

// The printed words of `echo ... > file`, the redirect and the pipe left out.
function printed(segment: string): string | null {
  const command = segment.split(/\|(?!\|)/)[0] ?? ''
  const before = command.replace(/(?:^|[^\d&>])1?>>?(?!&)[\s\S]*$/, '')
  const tokens = words(before.trim())
  if (!PRINTERS.has(tokens[0] ?? '')) return null

  return tokens.slice(1).filter(word => !/^-[neE]+$/.test(word)).join(' ')
}

export function bashWrites(command: string): BashWrite[] {
  const writes: BashWrite[] = []
  const rest = command.replace(HEREDOC, (match, _quote, _tag, after: string, body: string, offset: number) => {
    const lineStart = command.lastIndexOf('\n', offset) + 1
    const path = targetOf(`${command.slice(lineStart, offset)} ${after}`)
    if (path !== null) writes.push({ path, text: body })

    return after
  })
  for (const segment of rest.split(SEPARATORS)) {
    const path = targetOf(segment)
    const text = path === null ? null : printed(segment)
    if (path !== null && text !== null) writes.push({ path, text })
  }

  return writes
}

// The findings in what a Bash command writes; a .env file is where secrets belong, as for a file write.
export function bashWriteHits(command: string, vault: Vault): Finding[] {
  return bashWrites(command)
    .filter(write => !isEnvFile(write.path))
    .flatMap(write => [...findSecrets(write.text, write.path), ...tokenHits(vault, write.text)].map(secret => ({ ...secret, where: `${write.path}:${secret.line}` })))
}

// The calls the guard reads before they run: a file write outside .env, a Bash command that stages, commits or writes.
export function isGuarded(input: Record<string, unknown>): boolean {
  if (isFileTool(input)) {
    const path = pathOf(input)

    return path !== null && !isEnvFile(path)
  }
  if (input.tool !== 'Bash' || typeof input.command !== 'string') return false

  return gitSteps(input.command).length > 0 || bashWrites(input.command).length > 0
}

// Raised inside another hook's call no `$` call can run: only the text itself is read, and git is never checked.
export function isRiskyAsIs(input: Record<string, unknown>, vault: Vault): boolean {
  if (!isGuarded(input)) return false
  if (isFileTool(input)) return findSecrets(fileText(input), pathOf(input) ?? '').length + tokenHits(vault, fileText(input)).length > 0
  const command = String(input.command)

  return gitSteps(command).length > 0 || bashWriteHits(command, vault).length > 0
}

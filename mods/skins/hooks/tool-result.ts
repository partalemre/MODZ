import { diffCard, terminalCard } from './cards'
import { clipLines, diffstat, shortenPath } from './format'
import type { Look, Meta, SvgElement } from './look'
import { hunksOf } from './svg-diff'
import { shellOutputOf } from './svg-terminal'

const EDITS = new Set(['Edit', 'MultiEdit', 'Write'])

const CLIP_HEAD = 8
const CLIP_TAIL = 4

type ResultProps = { tool: string; output: unknown; isErrored: boolean }

export type ResultCard = { props: ResultProps; columns: number; cwd: () => Promise<string> }

// The desktop's card for a tool result: a diff for an edit, a terminal for a shell
// command; null where the result has neither.
export async function resultCard(look: Look, Svg: SvgElement, { props, columns, cwd }: ResultCard) {
  if (EDITS.has(props.tool) && !props.isErrored) {
    const diff = hunksOf(props.output)

    if (diff !== null) {
      return diffCard(look, { Svg, input: diff, shownPath: shortenPath(diff.path, await cwd()), columns })
    }
  }

  if (props.tool === 'Bash') {
    const shell = shellOutputOf(props.output)

    if (shell !== null) {
      return terminalCard(look, { Svg, output: shell, isErrored: props.isErrored, columns })
    }
  }

  return null
}

// A shell command's output cut to its head and tail; undefined when it stays whole.
export function clippedOutput(props: ResultProps, isClipping: boolean): object | undefined {
  const output = props.output as { stdout?: unknown } | null

  if (!isClipping || props.tool !== 'Bash' || typeof output?.stdout !== 'string') {
    return undefined
  }

  const stdout = clipLines(output.stdout, CLIP_HEAD, CLIP_TAIL)

  return stdout === output.stdout ? undefined : { ...output, stdout }
}

// What a tool row shows at its right edge: its time once it has finished, and the lines it changed.
export const metaOf = (props: { output?: unknown; isRunning: boolean }, ms: number): Meta => ({
  ...(ms >= 0 && !props.isRunning ? { ms } : {}),
  ...(diffstat(props.output) ?? {}),
})

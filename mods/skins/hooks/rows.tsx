import type { TurnStats } from '../types'
import { formatDuration } from './format'
import { spinnerIcon } from './icons'
import type { SpinnerMode } from './icons'
import type { Look, SvgElement, Ui } from './look'
import type { Palette } from './skin'
import { say } from './words'

export type DesktopSpinner = { Svg: SvgElement; mode: SpinnerMode; text: string }

// The desktop's spinner row: an animated icon for what the turn is doing, beside the
// step the desktop names (`Creating notes.md`).
export function desktopSpinnerRow(look: Look, { Svg, mode, text }: DesktopSpinner) {
  const { Box, Text } = look.ui

  return (
    <Box flexDirection="row" columnGap={1} alignItems="center">
      <Svg source={spinnerIcon(mode, look.skin.palette.user)} alt={mode} width={20} height={20} />
      <Text color={look.skin.palette.muted}>{text}</Text>
    </Box>
  )
}

// Your message in a rounded outline sized to what you typed, so it stands apart from
// replies without taking the full width. Images it carried follow below it, drawn by
// Claude Code.
export function promptRow(look: Look, text: string, images?: ReturnType<Ui['Text']>) {
  const { Box, Text } = look.ui

  return (
    <Box flexDirection="column" alignItems="flex-start" marginY={1}>
      <Box borderStyle="round" borderColor={look.skin.palette.muted} paddingX={1} flexShrink={1}>
        <Text color={look.skin.palette.fg}>{text}</Text>
      </Box>
      {images ?? ''}
    </Box>
  )
}

// The letter under the band of light, and the one each side of it, by distance.
const shadeOf = (palette: Palette, distance: number): string => [palette.fg, palette.user][distance] ?? palette.muted

// Runs of letters that share a shade, so each run is one span.
function shadeRuns(palette: Palette, letters: readonly string[], head: number) {
  const runs: { color: string; text: string }[] = []

  for (const [i, letter] of letters.entries()) {
    const color = shadeOf(palette, Math.abs(i - head))
    const last = runs.at(-1)

    if (last?.color === color) {
      last.text += letter
    } else {
      runs.push({ color, text: letter })
    }
  }

  return runs
}

export type Shimmer = { word: string; frame: number; elapsedMs: number }

// The word with a band of light sweeping through it, one letter a frame.
export function spinnerRow(look: Look, { word, frame, elapsedMs }: Shimmer) {
  const { Text } = look.ui
  const { palette } = look.skin
  const letters = [...word]
  const head = (frame % (letters.length + 8)) - 4
  const runs = shadeRuns(palette, letters, head)

  return (
    <Text>
      <Text color={palette.user}>{`${look.icons.frames[frame % look.icons.frames.length] ?? ''} `}</Text>
      {runs.map(run => (
        <Text color={run.color}>{run.text}</Text>
      ))}
      <Text color={palette.muted}>{`…  ${formatDuration(elapsedMs)}`}</Text>
    </Text>
  )
}

export type Footer = { word: string; durationMs: number; stats: TurnStats | undefined }

export function footerRow(look: Look, { word, durationMs, stats }: Footer) {
  const { Text } = look.ui
  const { palette } = look.skin
  const facts = [
    ...(stats === undefined || stats.tools === 0 ? [] : [say().tools(stats.tools)]),
  ]
  const hasDiff = stats !== undefined && stats.added + stats.removed > 0

  return (
    <Text color={palette.muted}>
      <Text color={palette.user}>{`${look.icons.done} `}</Text>
      {`${word} · ${formatDuration(durationMs)}`}
      {facts.length > 0 ? `  ·  ${facts.join('  ·  ')}` : ''}
      {hasDiff ? '  ·  ' : ''}
      {hasDiff ? <Text color={palette.ok}>{`+${stats.added}`}</Text> : ''}
      {hasDiff ? <Text color={palette.err}>{` −${stats.removed}`}</Text> : ''}
    </Text>
  )
}

// A band above Claude Code's own question dialog: the topics it asks about, in the skin.
export function askBand(look: Look, headers: readonly string[]) {
  const { Text } = look.ui
  const { palette } = look.skin

  return (
    <Text color={palette.muted}>
      <Text color={palette.user}>{`${look.icons.prompt} `}</Text>
      {headers.map((header, i) => (
        <Text color={i === 0 ? palette.fg : palette.muted} bold={i === 0}>
          {`${i === 0 ? '' : '  ·  '}${header}`}
        </Text>
      ))}
    </Text>
  )
}

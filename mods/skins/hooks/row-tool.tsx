import type { Kind } from './skin'
import { toolIcon } from './icons'
import type { Call, Look, Meta, SvgElement, Ui } from './look'
import { formatMs } from './format'
import { kindOf, toolLabel } from './tools'

const KIND_LABEL: Readonly<Record<Kind, string>> = {
  read: 'Read',
  write: 'Edit',
  run: 'Run',
  search: 'Search',
  web: 'Web',
  mcp: 'MCP',
  other: 'Other',
}

// The worst thing that happened to any of the calls, else how far along they are.
function status({ skin, icons }: Look, calls: readonly Call[]) {
  if (calls.some(call => call.isInterrupted)) {
    return { glyph: icons.interrupted, color: skin.palette.warn }
  }

  if (calls.some(call => call.isErrored)) {
    return { glyph: icons.err, color: skin.palette.err }
  }

  if (calls.some(call => call.isRunning)) {
    return { glyph: icons.running, color: skin.palette.muted }
  }

  return { glyph: icons.ok, color: skin.palette.ok }
}

// The connector above a node, which ties a turn's calls into one line down the left.
function railLine(look: Look) {
  const { Text } = look.ui

  return <Text color={look.skin.palette.user}>{look.icons.rail}</Text>
}

function node(look: Look, calls: readonly Call[]) {
  const { Text } = look.ui
  const { glyph, color } = status(look, calls)
  const branch = look.prefs.rail && look.surface === 'terminal' ? look.icons.branch : ''

  return (
    <Text color={color}>
      {`${glyph}`}
      <Text color={look.skin.palette.muted}>{`${branch} `}</Text>
    </Text>
  )
}

function metaSpans(look: Look, meta: Meta) {
  const { Text } = look.ui
  const { palette } = look.skin
  const spans = []

  if (meta.added !== undefined && meta.removed !== undefined && meta.added + meta.removed > 0) {
    spans.push(<Text color={palette.ok}>{`+${meta.added}`}</Text>)
    spans.push(<Text color={palette.err}>{` −${meta.removed}`}</Text>)
  }

  if (meta.ms !== undefined) {
    spans.push(<Text color={palette.muted}>{`${spans.length > 0 ? '  ' : ''}${formatMs(meta.ms)}`}</Text>)
  }

  return spans
}

// A line with its facts flush right on the terminal and trailing it on the desktop,
// which lays a row out its own way.
function withMeta(look: Look, main: ReturnType<Ui['Text']>, meta: Meta) {
  const { Box, Text } = look.ui
  const spans = metaSpans(look, meta)

  if (spans.length === 0) {
    return main
  }

  if (look.surface !== 'terminal') {
    return (
      <Text wrap="truncate-end">
        {main}
        {'   '}
        {spans}
      </Text>
    )
  }

  return (
    <Box flexDirection="row">
      <Box flexGrow={1} flexShrink={1}>
        {main}
      </Box>
      <Box flexShrink={0} paddingLeft={2}>
        <Text>{spans}</Text>
      </Box>
    </Box>
  )
}

function stack(look: Look, line: ReturnType<Ui['Text']>) {
  const { Box } = look.ui

  // Box-drawing rails need a monospace font, which only the terminal draws mod text in.
  return look.prefs.rail && look.surface === 'terminal' ? (
    <Box flexDirection="column">
      {railLine(look)}
      {line}
    </Box>
  ) : (
    line
  )
}

type IconLine = { Svg: SvgElement; kind: Kind; calls: readonly Call[]; line: ReturnType<Ui['Text']> }

// On a surface with vector icons, the icon leads the row in place of the status glyph.
function iconRow(look: Look, { Svg, kind, calls, line }: IconLine) {
  const { Box } = look.ui
  const { color } = status(look, calls)
  const source = toolIcon(kind, color, calls.some(call => call.isRunning))

  return (
    <Box flexDirection="row" columnGap={1} alignItems="center">
      <Svg source={source} alt={kind} width={16} height={16} />
      {line}
    </Box>
  )
}

// The desktop row has no status glyph, so a failure or a stop is said in a word, not by colour alone.
function outcomeWord(look: Look, call: Call) {
  const { Text } = look.ui
  if (call.isInterrupted) return <Text color={look.skin.palette.warn}>{'  · durduruldu'}</Text>
  if (call.isErrored) return <Text color={look.skin.palette.err}>{'  · hata'}</Text>

  return null
}

export type ToolLine = { call: Call; kind: Kind; target: string; meta: Meta }

export function toolRow(look: Look, { call, kind, target, meta }: ToolLine) {
  const { Text } = look.ui
  const { palette } = look.skin

  if (look.svg !== undefined) {
    const line = (
      <Text wrap="truncate-end">
        <Text color={palette[kind]} bold>
          {toolLabel(call.tool)}
        </Text>
        <Text color={call.isErrored ? palette.err : palette.muted}>{`  ${target}`}</Text>
        {outcomeWord(look, call)}
      </Text>
    )

    return iconRow(look, { Svg: look.svg, kind, calls: [call], line: withMeta(look, line, meta) })
  }

  const main = (
    <Text wrap="truncate-end">
      {node(look, [call])}
      <Text color={palette[kind]}>{toolLabel(call.tool)}</Text>
      <Text color={call.isErrored ? palette.err : palette.muted}>{`  ${target}`}</Text>
    </Text>
  )

  return stack(look, withMeta(look, main, meta))
}

// A run of reads and searches on one node: `●─ Read 3 · Search 2`.
export function groupRow(look: Look, calls: readonly Call[]) {
  const { Text } = look.ui
  const { palette } = look.skin
  const counts = new Map<Kind, number>()

  for (const call of calls) {
    const kind = kindOf(call.tool) ?? 'other'
    counts.set(kind, (counts.get(kind) ?? 0) + 1)
  }

  const parts = [...counts].flatMap(([kind, count], i) => [
    ...(i === 0 ? [] : [<Text color={palette.muted}>{' · '}</Text>]),
    <Text color={palette[kind]}>{KIND_LABEL[kind]}</Text>,
    <Text color={palette.muted}>{` ${count}`}</Text>,
  ])

  if (look.svg !== undefined) {
    const lead = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other'

    return iconRow(look, { Svg: look.svg, kind: lead, calls, line: <Text wrap="truncate-end">{parts}</Text> })
  }

  return stack(
    look,
    <Text wrap="truncate-end">
      {node(look, calls)}
      {parts}
    </Text>,
  )
}

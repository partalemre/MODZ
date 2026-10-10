// The confirm card, drawn the same in the pane and in the band: Svg parts on desktop,
// the same words as text on the terminal. The safe answer (Vazgeç) holds the focus.

import { EYEBROW, headerSvg, bannerSvg, listSvg } from './svg-card'
import { palette, role, TERMINAL_KEY } from './theme'
import type { Row, View } from './view'

export type Ui = Record<string, any>

export type CardProps = {
  view: View
  // `striking`: Delete was pressed; the rows are struck and the command is about to run.
  phase: 'asking' | 'striking'
  place: 'pane' | 'band'
  isExpanded: boolean
  isLight: boolean
  columns: number
  onRun: () => void
  onCancel: () => void
  onToggle: () => void
}

const CARD_CHROME = 6
const PX_PER_COLUMN = 8
const MIN_WIDTH = 300
const MAX_WIDTH = 720
const BAND_ROWS = 3
const TERMINAL_BAR = 10
// The pane's title already names the mod; the band has no title, so it says who is holding.
const HOLDER = 'Blast Radius bekletiyor'
const STATUS_KEY: Record<string, keyof typeof TERMINAL_KEY> = { A: 'ok', M: 'warn', D: 'danger', R: 'read', C: 'read', U: 'danger' }

export const svgWidth = (columns: number): number => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN))

/** The band shows the first rows only, and says how many it left for the pane. */
function bandRows(rows: Row[]): Row[] {
  if (rows.length <= BAND_ROWS + 1) return rows
  const last = rows[rows.length - 1]
  const more = last?.kind === 'more' ? last.name : `+${rows.length - BAND_ROWS} satır daha`

  return [...rows.slice(0, BAND_ROWS), { kind: 'more', name: more, tag: '', count: '', size: '', share: null, icon: 'file' }]
}

function toggleOf(ui: Ui, props: CardProps) {
  const { Box, Button } = ui
  if (props.place === 'band' || props.view.toggleCount <= 0 || props.phase === 'striking') return null
  const label = props.isExpanded ? 'Daha az göster' : 'Daha fazla göster'

  return (
    <Box key="toggle">
      <Button key="toggle" label={label} hotkey="d" plain dimColor onPress={props.onToggle} />
    </Box>
  )
}

function actions(ui: Ui, props: CardProps, lo: string | undefined) {
  const { Box, Button, Text } = ui
  if (props.phase === 'striking') {
    const doing = props.view.icon === 'trash' ? 'Siliniyor…' : 'Çalıştırılıyor…'

    return <Text key="doing" color={TERMINAL_KEY.danger}>{doing}</Text>
  }

  return (
    <Box key="actions" flexDirection="row" flexWrap="wrap" gap={1} alignItems="center">
      <Button key="run" label={props.view.action.label} hotkey={props.view.action.hotkey} variant="secondary" onPress={props.onRun} />
      <Button key="cancel" label="Vazgeç" hotkey="v" variant="secondary" autoFocus onPress={props.onCancel} />
      {props.place === 'pane' ? null : <Box key="holder" marginLeft={1}><Text {...(lo === undefined ? { dimColor: true } : { color: lo })}>{HOLDER}</Text></Box>}
    </Box>
  )
}

export function desktopCard(ui: Ui, props: CardProps) {
  const { Box, Svg } = ui
  const width = svgWidth(props.columns)
  const { view } = props
  const neutral = palette(props.isLight)
  const rows = props.place === 'band' ? bandRows(view.rows) : view.rows
  const head = headerSvg(view, width)
  const banner = view.banner === null ? null : bannerSvg(view.banner, width)
  const list = listSvg(rows, width, props.phase === 'striking')
  const alt = rows.map(row => [row.name, row.count, row.size].filter(Boolean).join(' ')).join('; ')

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={role('danger', props.isLight).line} backgroundColor={neutral.card} paddingX={2} paddingY={1} gap={1}>
      <Svg key="head" source={head.source} alt={`${view.command} · ${view.payload}${view.tail}`} width={width} height={head.height} />
      {banner === null ? null : <Svg key="banner" source={banner.source} alt={view.banner?.text ?? ''} width={width} height={banner.height} />}
      {rows.length === 0 ? null : <Svg key="list" source={list.source} alt={alt} width={width} height={list.height} isInteractive={props.phase === 'striking' ? true : undefined} />}
      {toggleOf(ui, props)}
      {actions(ui, props, neutral.lo)}
    </Box>
  )
}

const barText = (share: number | null): string => {
  if (share === null) return ''
  const filled = Math.max(share > 0 ? 1 : 0, Math.round(share * TERMINAL_BAR))

  return '━'.repeat(filled) + '─'.repeat(TERMINAL_BAR - filled)
}

/** `A`/`M`/`D` in their role colour, a commit hash dim. */
function tagText(ui: Ui, tag: string) {
  const { Text } = ui
  const role = tag.length <= 2 ? STATUS_KEY[tag.charAt(0)] : undefined

  return role === undefined ? <Text dimColor>{`${tag} `}</Text> : <Text bold color={TERMINAL_KEY[role]}>{`${tag} `}</Text>
}

const DIFF = /^\+(\d+) −(\d+)$/

/** `+61 −12` with the added count in success and the removed one in error; zeros and sizes stay dim. */
function sizeText(ui: Ui, row: Row) {
  const { Text } = ui
  const isFolder = row.kind === 'folder'
  const diff = DIFF.exec(row.size)
  if (diff === null) return <Text bold={isFolder} dimColor={!isFolder}>{row.size}</Text>
  const part = (text: string, count: string | undefined, key: keyof typeof TERMINAL_KEY) =>
    count === '0' ? <Text dimColor>{text}</Text> : <Text color={TERMINAL_KEY[key]}>{text}</Text>

  return <Text>{part(`+${diff[1]}`, diff[1], 'ok')}{part(` −${diff[2]}`, diff[2], 'danger')}</Text>
}

const TERMINAL_INDENT: Record<Row['kind'], string> = { file: '    ', more: '', folder: '▸ ', item: '▸ ' }

function terminalRow(ui: Ui, row: Row, place: { index: number; isStruck: boolean }) {
  const { Box, Text } = ui
  const { index, isStruck } = place
  const isFolder = row.kind === 'folder'
  const strike = isStruck && !isFolder ? { strikethrough: true, dimColor: true } : {}
  const indent = TERMINAL_INDENT[row.kind]

  return (
    <Box key={`r${index}`} flexDirection="row" gap={2}>
      <Box flexGrow={1}>
        <Text wrap="truncate-middle" bold={isFolder} dimColor={row.kind === 'more'} {...strike}>
          {indent}
          {row.tag === '' ? null : tagText(ui, row.tag)}
          {row.name}
        </Text>
      </Box>
      {row.count === '' ? null : <Text dimColor>{row.count}</Text>}
      {row.size === '' ? null : sizeText(ui, row)}
      {row.share === null ? null : <Text dimColor={!isFolder}>{barText(row.share)}</Text>}
    </Box>
  )
}

export function terminalCard(ui: Ui, props: CardProps) {
  const { Box, Text } = ui
  const { view } = props
  const rows = props.place === 'band' ? bandRows(view.rows) : view.rows
  const frame = props.place === 'band' ? { borderStyle: 'single', borderColor: TERMINAL_KEY.danger } : {}

  return (
    <Box flexDirection="column" paddingX={1} {...frame}>
      <Box flexDirection="row" justifyContent="space-between" gap={2}>
        <Text bold color={TERMINAL_KEY.danger}>{`● ${EYEBROW.toLocaleUpperCase('tr')}`}</Text>
        {view.context === '' ? null : <Text dimColor wrap="truncate-start">{view.context}</Text>}
      </Box>
      <Text wrap="truncate-end">
        <Text bold>{view.command}</Text>
        <Text dimColor> · </Text>
        <Text bold {...(view.isPayloadEmpty ? { dimColor: true } : { color: TERMINAL_KEY.danger })}>{view.payload}</Text>
        {view.tail}
      </Text>
      {view.fullCommand === null ? null : <Text dimColor wrap="truncate-end">{`tam komut: ${view.fullCommand}`}</Text>}
      {view.banner === null ? null : <Text color={TERMINAL_KEY[view.banner.tone]}>{`! ${view.banner.text}`}</Text>}
      <Box flexDirection="column" marginTop={1}>{rows.map((row, i) => terminalRow(ui, row, { index: i, isStruck: props.phase === 'striking' }))}</Box>
      {toggleOf(ui, props)}
      <Box marginTop={1}>{actions(ui, props, undefined)}</Box>
    </Box>
  )
}

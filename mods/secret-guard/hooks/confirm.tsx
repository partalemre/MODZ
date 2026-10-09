// The one confirmation card of MODZ (blast-radius, secret-guard): the same file in each mod, keep the copies identical.

// The resolved element table of the surface that draws the dialog.
export type Ui = Record<string, any>

export type CardColumn = { align: 'left' | 'right'; isDim: boolean }

export type CardModel = {
  tone: 'error' | 'warning'
  // `! <title>: <subject>`: what is happening, then to what.
  title: string
  subject: string
  summary: string
  columns: CardColumn[]
  // Every detail row the caller has; the card draws the first ROWS_MAX.
  rows: string[][]
  // How many details there are in all, rows not passed included.
  total: number
}

export const ROWS_MAX = 5
const INDENT = 2
const GAP = 2
const FIRST_MIN = 12
const SUBJECT_MIN = 8

// Cuts the middle so both the head and the file name of a path stay readable.
export function clipMiddle(text: string, width: number): string {
  if (text.length <= width) return text
  if (width <= 1) return '…'.slice(0, width)
  const head = Math.ceil((width - 1) / 2)

  return `${text.slice(0, head)}…${text.slice(text.length - (width - 1 - head))}`
}

// Each column is as wide as its widest cell; the first gives way when the card is too wide.
export function columnWidths(rows: string[][], columns: number, width: number): number[] {
  const widths = Array.from({ length: columns }, (_, index) => Math.max(0, ...rows.map(row => (row[index] ?? '').length)))
  const rest = widths.slice(1).reduce((sum, item) => sum + item + GAP, 0)
  const room = Math.max(FIRST_MIN, width - INDENT - rest)

  return [Math.min(widths[0] ?? 0, room), ...widths.slice(1)]
}

// Cells are padded with spaces: the dialog's surroundings take no Box widths, so columns line up by character.
export function padCell(text: string, column: CardColumn, width: number): string {
  const shown = clipMiddle(text, width)

  return column.align === 'right' ? shown.padStart(width) : shown.padEnd(width)
}

function cellOf(ui: Ui, text: string, column: CardColumn, width: number) {
  const { Text } = ui

  return <Text {...(column.isDim ? { dimColor: true } : {})}>{padCell(text, column, width)}</Text>
}

// One Text per line, the cells inline in it: the dialog's surroundings are counted by the line.
function rowOf(ui: Ui, cells: string[], model: CardModel, widths: number[]) {
  const { Text } = ui
  const gap = ' '.repeat(GAP)
  // A column empty in every row takes no room, its gap included.
  const shown = model.columns.map((column, index) => ({ column, index })).filter(({ index }) => (widths[index] ?? 0) > 0)

  return (
    <Text wrap="truncate-end">
      {shown.flatMap(({ column, index }, place) => [place === 0 ? null : gap, cellOf(ui, cells[index] ?? '', column, widths[index] ?? 0)])}
    </Text>
  )
}

function detailsOf(ui: Ui, model: CardModel, width: number) {
  const { Box, Text } = ui
  const rows = model.rows.slice(0, ROWS_MAX)
  const widths = columnWidths(rows, model.columns.length, width)
  const more = model.total - rows.length

  return (
    <Box flexDirection="column" paddingLeft={INDENT}>
      <Text dimColor wrap="truncate-end">{model.summary}</Text>
      {rows.map(row => rowOf(ui, row, model, widths))}
      {more > 0 && <Text dimColor>{`+${more} daha`}</Text>}
    </Box>
  )
}

export function confirmCard(ui: Ui, model: CardModel, width: number) {
  const { Box, Text } = ui
  const head = `! ${model.title}:`
  const subject = clipMiddle(model.subject.split('\n')[0] ?? '', Math.max(SUBJECT_MIN, width - head.length - 1))

  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end">
        <Text color={model.tone} bold>{head}</Text>
        {` ${subject}`}
      </Text>
      {detailsOf(ui, model, width)}
    </Box>
  )
}

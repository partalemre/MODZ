import type { Look, Ui } from './look'
import { columnWidths, wrapLines } from './markdown'
import type { Table } from './markdown'
import { say } from './words'

const CELL_PAD = 1

const JUSTIFY = { left: 'flex-start', right: 'flex-end', center: 'center' } as const

// The share of the reported width a table may take at its natural size. Past it, the
// table spans its container and splits it between columns in proportion: the desktop
// app reports the window's width, wider than the transcript column a reply sits in.
const NATURAL_SHARE = 0.55

type Columns = { table: Table; widths: readonly number[]; isFluid: boolean }

type GridRow = { cells: readonly string[]; isHeader: boolean; band: string | undefined }

// A fluid column grows from nothing, padding included, so its share counts the padding
// too: by text width alone a narrow column gets less than it needs, or no room at all.
function cellSize({ widths, isFluid }: Columns, i: number) {
  return isFluid
    ? { width: 0, flexGrow: (widths[i] ?? 0) + CELL_PAD * 2, flexShrink: 1 }
    : { width: (widths[i] ?? 0) + CELL_PAD * 2, flexShrink: 0 }
}

function gridRow(look: Look, columns: Columns, { cells, isHeader, band }: GridRow) {
  const { Box, Text } = look.ui
  const { table, widths } = columns

  return (
    <Box flexDirection="row" {...(band === undefined ? {} : { backgroundColor: band })}>
      {cells.map((cell, i) => (
        <Box {...cellSize(columns, i)} flexDirection="column" paddingX={CELL_PAD} alignItems={JUSTIFY[table.align[i] ?? 'left']}>
          {wrapLines(cell, widths[i] ?? 0).map(line => (
            <Text color={look.skin.palette.fg} bold={isHeader} wrap="truncate-end">
              {line}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  )
}

export type TableFit = { maxWidth: number; control?: ReturnType<Ui['Button']> }

// A grid of cells, so columns line up in the terminal's monospace and in the desktop
// app's proportional font alike. `control`, such as a Copy button, sits on the frame's
// top border at the right, as ╭──── Copy ─╮, laid over it from a plain Box around the frame:
// inside the bordered Box, Windows Terminal drew the border over it. Long cells wrap within
// their column in full: the terminal has no tooltip to read a cut cell by.
export function tableRows(look: Look, table: Table, { maxWidth, control }: TableFit) {
  const { Box } = look.ui
  const { palette } = look.skin
  const widths = columnWidths(table, maxWidth - 4, CELL_PAD * 2)
  const natural = widths.reduce((sum, width) => sum + width + CELL_PAD * 2, 2)
  const columns: Columns = { table, widths, isFluid: natural > maxWidth * NATURAL_SHARE }

  return (
    <Box flexDirection="column" marginY={1} {...(columns.isFluid ? { width: '100%' } : { alignSelf: 'flex-start' as const })}>
      <Box flexDirection="column" borderStyle="round" borderColor={palette.muted}>
        {gridRow(look, columns, { cells: table.header, isHeader: true, band: palette.surface })}
        {table.rows.map((cells, i) => gridRow(look, columns, { cells, isHeader: false, band: i % 2 === 1 ? palette.zebra : undefined }))}
      </Box>
      {control === undefined ? (
        ''
      ) : (
        <Box position="absolute" top={0} right={2}>
          {control}
        </Box>
      )}
    </Box>
  )
}

// A table as markdown again, for the clipboard.
export const tableMarkdown = (table: Table): string =>
  [table.header, table.header.map(() => '---'), ...table.rows].map(cells => `| ${cells.join(' | ')} |`).join('\n')

// A Copy button padded to sit on a border line; nothing where nothing can copy.
export function copyButton(look: Look, key: string, text: string) {
  const { Button } = look.ui
  const copy = look.copy

  return copy === undefined ? undefined : <Button key={key} label={` ${say().copy} `} plain dimColor onPress={() => copy(text)} />
}

// A small Copy button under a card or block, flush right; nothing where nothing can copy.
export function copyRow(look: Look, key: string, text: string) {
  const { Box, Button } = look.ui
  const copy = look.copy

  if (copy === undefined) {
    return ''
  }

  return (
    <Box flexDirection="row" justifyContent="flex-end">
      <Button key={key} label={say().copy} plain dimColor onPress={() => copy(text)} />
    </Box>
  )
}

import type { RenderElement } from 'claude-code'

import { codeCard, diffCard, replyRows, terminalCard } from './cards'
import type { Look, SvgElement } from './look'
import type { Table } from './markdown'
import { askBand, desktopSpinnerRow, footerRow, promptRow, spinnerRow } from './rows'
import { groupRow, toolRow } from './row-tool'
import { usageBand } from './row-usage'
import { contextLabel } from './svg-usage'
import { galleryWords } from './gallery-words'
import { say } from './words'

// Every element the skin draws, numbered, from the same builders the transcript uses, so
// a note on #4 is a note on the real thing.

const done = { isRunning: false, isErrored: false, isInterrupted: false }

const TABLE: Table = {
  kind: 'table',
  header: ['Skin', 'Accent', 'Time'],
  align: ['left', 'left', 'right'],
  rows: [
    ['noir', '#f5f5f5', '41s'],
    ['tokyo-night', '#7aa2f7', '2.1s'],
    ['dracula', '#bd93f9', '340ms'],
  ],
}

const CODE = ['// Rate limit per route, keyed by user', 'export function limit(route: string, perMinute = 60) {', '  return (used: number) => used < perMinute', '}'].join('\n')

const DIFF = {
  path: '/work/apps/hub/src/server.ts',
  isNewFile: false,
  hunks: [{ oldStart: 12, newStart: 12, lines: [' const app = fastify()', '-app.listen(7447)', '+app.register(rateLimit, { max: 60 })', '+app.listen(7447)'] }],
}

type Section = readonly [title: string, ...items: RenderElement[]]

function rowSections(look: Look): Section[] {
  const words = galleryWords()

  return [
    [words.prompt, promptRow(look, say().samplePrompt)],
    [
      words.tools,
      toolRow(look, { call: { tool: 'Bash', input: {}, ...done }, kind: 'run', target: 'pnpm test --filter hub', meta: { ms: 2140 } }),
      toolRow(look, { call: { tool: 'Read', input: {}, ...done, isRunning: true }, kind: 'read', target: 'docs/protocols.md', meta: {} }),
      toolRow(look, { call: { tool: 'Edit', input: {}, ...done, isErrored: true }, kind: 'write', target: 'apps/hub/src/server.ts', meta: {} }),
    ],
    [words.group, groupRow(look, [{ tool: 'Read', input: {}, ...done }, { tool: 'Read', input: {}, ...done }, { tool: 'Grep', input: {}, ...done }])],
  ]
}

// The cards and the animated spinners draw only where the surface has vector images.
function terminalSections(look: Look, width: number): Section[] {
  const { Text } = look.ui
  const { palette } = look.skin
  const words = galleryWords()

  return [
    [words.diff, <Text color={palette.muted}>{words.diffNote}</Text>],
    [words.shell, <Text color={palette.muted}>{words.shellNote}</Text>],
    [words.code, <Text color={palette.muted}>{words.codeNote}</Text>],
    [words.table, replyRows(look, { segments: [TABLE], maxWidth: width })],
    [words.spinner, spinnerRow(look, { word: look.skin.spinner[0] ?? 'Working', frame: 3, elapsedMs: 12_000 })],
  ]
}

function desktopSections(look: Look, svg: SvgElement, width: number): Section[] {
  const words = galleryWords()

  return [
    [words.diff, diffCard(look, { Svg: svg, input: DIFF, shownPath: 'apps/hub/src/server.ts', columns: width })],
    [
      words.shellStates,
      terminalCard(look, { Svg: svg, output: { stdout: 'Test Files  12 passed (12)\n     Tests  148 passed (148)', stderr: '', interrupted: false }, isErrored: false, columns: width }),
      terminalCard(look, { Svg: svg, output: { stdout: '', stderr: 'error TS2322: Type string is not assignable to number', interrupted: false }, isErrored: true, columns: width }),
    ],
    [words.code, codeCard(look, { lang: 'ts', code: CODE, Svg: svg, columns: width })],
    [words.table, replyRows(look, { segments: [TABLE], maxWidth: width, Svg: svg })],
    [
      words.spinnerModes,
      desktopSpinnerRow(look, { Svg: svg, mode: 'thinking', text: 'Thinking' }),
      desktopSpinnerRow(look, { Svg: svg, mode: 'tool-use', text: 'Running pnpm test' }),
      desktopSpinnerRow(look, { Svg: svg, mode: 'responding', text: 'Writing the reply' }),
      desktopSpinnerRow(look, { Svg: svg, mode: 'requesting', text: 'Waiting for the model' }),
    ],
  ]
}

function bandSections(look: Look): Section[] {
  const words = galleryWords()

  return [
    [
      words.band,
      usageBand(look, { meters: [{ label: contextLabel(), percent: 42 }, { label: say().fiveHour, percent: 18 }], canCompact: true, compact: () => undefined }),
      usageBand(look, { meters: [{ label: contextLabel(), percent: 85 }, { label: say().fiveHour, percent: 61 }], canCompact: true, compact: () => undefined }),
    ],
    [words.ask, askBand(look, ['Approach', 'Store'])],
    [words.footer, footerRow(look, { word: look.skin.done[0] ?? 'Done', durationMs: 41_000, stats: { tools: 6, added: 18, removed: 3 } })],
  ]
}

export function galleryPane(look: Look, columns: number) {
  const { Box, Text } = look.ui
  const { palette } = look.skin
  const width = Math.max(40, columns - 4)
  const cards = look.svg === undefined ? terminalSections(look, width) : desktopSections(look, look.svg, width)

  return (
    <Box flexDirection="column">
      {[...rowSections(look), ...cards, ...bandSections(look)].map(([title, ...items], i) => (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={palette.muted} bold>{`${i + 1}  ${title}`}</Text>
          {items}
        </Box>
      ))}
    </Box>
  )
}

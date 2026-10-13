import type { ElementTable } from 'claude-code'

import type { FileTree, Theme } from '../types'
import { actionsOf } from './actions'
import { activityChip, footer } from './chrome'
import { costText, turnCost } from './costtext'
import { BRANCH_ROW } from './flash'
import { BRANCH_ICON, TONES } from './git'
import type { Host } from './host'
import { heroOf, heroText, subText } from './now'
import type { RowsProps } from './rows'
import { countSegs, terminalRow } from './rowspec'
import { heroInput, type Room, rowCtx, type Scene, treeWindow } from './scene'
import { jump, search } from './search'
import { mem } from './session'
import { unsized, wantSizes } from './sizes'
import type { Role } from './theme'
import { words } from './words'

type Ui = ElementTable<'terminal'>
type Act = ReturnType<typeof actionsOf>

// The terminal keeps upstream's hues, keyed so a read is blue (Tide) and an edit orange (Kiln).
const TERMINAL_TONE: Record<string, string> = { purple: 'blue', iris: 'purple' }
const SHIMMER = Object.fromEntries(
  Object.keys(TONES).map(k => {
    const v = TONES[TERMINAL_TONE[k] ?? k] ?? TONES[k]
    return [k, { bright: v?.bright ?? [], dim: v?.dim ?? [] }]
  }),
)
const TERMINAL_ROLE: Record<Role, string> = { read: 'suggestion', edit: 'claude', ok: 'success', run: 'permission', warn: 'warning', danger: 'error', plan: 'merged', note: 'subtle', neutral: 'subtle' }
const ADD_COLOR = '#98c379'
const DEL_COLOR = '#e06c75'
// The header, the search row and the body's least rows.
const HEAD_ROWS = 2
const MIN_BODY = 5
// The hover tint: the selection color faded this far toward the panel.
const FAINT_BASE = 0x26
const FAINT_SHARE = 0.3
// The now line names the session's read count beside the turn's from this many columns.
const SESSION_COST_COLS = 70

function faint(hex: string): string {
  const v = parseInt(hex.slice(1), 16)
  const ch = (shift: number) => Math.round(FAINT_BASE + (((v >> shift) & 255) - FAINT_BASE) * FAINT_SHARE)
  return `#${[16, 8, 0].map(x => ch(x).toString(16).padStart(2, '0')).join('')}`
}

function branchTotals(ui: Ui, s: Scene) {
  const { Box, Text } = ui
  const { t, theme } = s
  const totals: [number, number] = t.diff[t.root] ?? [0, 0]
  const rootCounts = countSegs(t.counts[t.root], theme)
  return (
    <Box flexDirection="row" flexShrink={0}>
      {totals[0] > 0 && <Text color={ADD_COLOR}>{` +${totals[0]}`}</Text>}
      {totals[1] > 0 && <Text color={DEL_COLOR}>{` -${totals[1]}`}</Text>}
      {rootCounts.map(c => (
        <Text color={c.c}>{c.t}</Text>
      ))}
      {rootCounts.length === 0 && totals[0] === 0 && totals[1] === 0 && <Text color={theme.muted}>{` ${words().clean}`}</Text>}
    </Box>
  )
}

function terminalBranch(ui: Ui, s: Scene, unicode: boolean) {
  const { Box, Text } = ui
  const { t, theme } = s
  if (!t.top || !t.branch) return null
  const b = t.branch
  const isFlash = s.bright.has(BRANCH_ROW)
  const tone = TONES[t.flashTones[BRANCH_ROW] ?? 'teal']?.solid
  return (
    <Box flexDirection="row" height={1} overflow="hidden">
      <Box flexDirection="row" flexShrink={0}>
        <Text color={isFlash ? (tone ?? theme.accent) : theme.accent}>{(unicode ? BRANCH_ICON.plain : BRANCH_ICON.nerd) + ' '}</Text>
        <Text bold color={isFlash ? (tone ?? (theme.fg || undefined)) : theme.fg || undefined}>
          {b.head}
        </Text>
        {b.ahead > 0 && <Text color="success">{` ↑${b.ahead}`}</Text>}
        {b.behind > 0 && <Text color="warning">{` ↓${b.behind}`}</Text>}
      </Box>
      {b.upstream && (
        <Box flexShrink={1} overflow="hidden">
          <Text color={theme.muted} wrap="truncate-end">{` ${b.upstream}`}</Text>
        </Box>
      )}
      <Box flexGrow={1} />
      {branchTotals(ui, s)}
    </Box>
  )
}

function searchRow(host: Host, ui: Ui, at: { t: FileTree; label?: string; clear: string }) {
  const { Box, Button, Input } = ui
  const { t } = at
  return (
    <Box flexDirection="row" gap={1}>
      <Box flexGrow={1}>
        <Input key="q" {...(at.label ? { label: at.label } : {})} placeholder={words().find} submitLabel={words().findGo} autoFocus value={t.query} onInput={(v: string) => void search(host, v)} onSubmit={(v: string) => void jump(host, v)} />
      </Box>
      {t.query ? <Button key="clear" plain dimColor label={at.clear} onPress={() => void search(host, '')} /> : null}
    </Box>
  )
}

function headRow(ui: Ui, at: { t: FileTree; theme: Theme; unicode: boolean; act: Act }) {
  const { Box, Text, Button } = ui
  const { t, theme, unicode, act } = at
  const header = t.top ? [t.top.split('/').pop() ?? t.top, t.prefix.replace(/\/$/, '')].filter(Boolean).join('/') : t.root.split('/').pop() || t.root
  const icon = (key: keyof Act, glyph: { plain: string; nerd: string }, isDim = true) => <Button key={key} plain dimColor={isDim} label={unicode ? glyph.plain : glyph.nerd} onPress={act[key]} />
  return (
    <Box flexDirection="row">
      <Text bold color={theme.accent} wrap="truncate-start">{header}</Text>
      <Box flexGrow={1} />
      <Box flexDirection="row" gap={2}>
        {icon('up', { plain: '↑', nerd: '\u{f005d}' })}
        {icon('cwd', { plain: '⌂', nerd: '\u{f02dc}' }, !mem.follow)}
        {icon('refresh', { plain: '↻', nerd: '\u{f0450}' })}
        {icon('hidden', t.showHidden ? { plain: '◉', nerd: '\u{f0208}' } : { plain: '○', nerd: '\u{f0209}' }, !t.showHidden)}
        {icon('size', { plain: 'Σ', nerd: '\u{f02ca}' }, !t.showSize)}
        {icon('collapse', { plain: '⊟', nerd: '\u{eac5}' })}
        {t.selected ? icon('unselect', { plain: '⊘', nerd: '\u{f0777}' }, false) : null}
        <Text> </Text>
      </Box>
    </Box>
  )
}

// What reads put into context: this turn's, and the session's when earlier turns read too and the line has room.
function costLabel(s: Scene, width: number): string {
  const turn = turnCost(s.turn)
  const total = s.readTotal
  const said = words()
  const parts = [
    turn ? `${costText(turn)} ${said.tokUnit}` : '',
    total && total.reads > (turn?.reads ?? 0) && width >= SESSION_COST_COLS ? said.costSession(costText(total, true)) : '',
  ]
  return parts.filter(Boolean).join(' · ')
}

function nowLine(ui: Ui, s: Scene, width: number) {
  const { Box, Text } = ui
  const hero = heroOf(heroInput(s))
  const cost = costLabel(s, width)
  return (
    <Box flexDirection="row" height={1} overflow="hidden">
      <Box flexDirection="row" flexShrink={1} overflow="hidden">
        <Text bold color={TERMINAL_ROLE[hero.role]}>{`● ${hero.eyebrow}  `}</Text>
        <Text wrap="truncate-end">{heroText(hero)}</Text>
        <Text dimColor wrap="truncate-end">{` · ${subText(hero)}`}</Text>
      </Box>
      <Box flexGrow={1} />
      {cost ? <Text color={TERMINAL_ROLE.read}>{` ${cost}`}</Text> : null}
    </Box>
  )
}

// Rows above and below the tree: the header and search row, the branch (or the no-repo note), the footer, the now line.
function fixedRows(s: Scene): number {
  const { t } = s
  return HEAD_ROWS + Number(!t.top || Boolean(t.branch)) + Number(Boolean(t.selected || s.latest)) + Number(s.turn.hasRun)
}

export function drawTerminal(host: Host, ui: Ui, frame: { s: Scene; room: Room; home: JSX.Element | null }) {
  const { Box, Text, Client } = ui
  const { s, room, home } = frame
  const { t, theme } = s
  const unicode = mem.glyphSetting === 'plain' || (mem.glyphSetting === 'auto' && mem.noNerd)
  const ctx = rowCtx(s, room.width, unicode)
  const win = treeWindow(s, Math.max(MIN_BODY, room.bodyRows - fixedRows(s)), { toSpec: r => terminalRow(ctx, r), colors: { thumb: theme.accent, track: theme.muted, note: theme.muted } })
  if (t.showSize) wantSizes(host, unsized(t, win.rows))
  const chip = s.latest ? activityChip(ui, s.latest, { unicode, colorOf: tone => TONES[tone]?.solid ?? theme.accent }) : null
  const rows = { rows: win.specs, active: t.cursor, activeBg: theme.selection, hoverBg: faint(theme.selection), tones: SHIMMER, pointer: mem.pointer, ...(win.bar ? { bar: win.bar } : {}) } satisfies RowsProps
  return (
    <Box flexDirection="column" minHeight={Math.max(1, room.bodyRows)} backgroundColor={theme.bg || undefined}>
      {home}
      {headRow(ui, { t, theme, unicode, act: actionsOf(host, t) })}
      {terminalBranch(ui, s, unicode)}
      {!t.top && <Text color={theme.muted}>{unicode ? '± ' : '\u{e702} '}{words().noRepo}</Text>}
      {s.turn.hasRun && nowLine(ui, s, room.width)}
      {searchRow(host, ui, { t, label: '/ ', clear: unicode ? '×' : '\u{f0156}' })}
      <Client key="rows" module="./rows.tsx" props={rows} />
      <Box flexGrow={1} />
      {footer(ui, s, chip)}
    </Box>
  )
}

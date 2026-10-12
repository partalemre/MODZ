import type { ThemeKey } from 'claude-code'

import type { AgentRun, ToolEvent, TouchedFile } from '../types'
import { NOW_H, filesSvg, nowSvg } from './detail-svg'
import { shortPath } from './format'
import { KIND_GLYPH, KIND_KEY, kindOf } from './history'
import type { Kind } from './history'
import { upper } from './lang'
import { t } from './i18n'
import { MIX_H, mixSvg } from './metrics-svg'
import type { MixPart } from './metrics-svg'
import { agoOf, nowOf } from './now'
import type { NowView } from './now'
import { PULSE, pulseSvg, stepsOf } from './pane-svg'
import type { RowContext, Ui } from './rows'
import { filesShown } from './touched'

// The open card's account of the work: what it does this moment, its latest calls as a readable
// list (what, on what, how long ago, how it came back), and the files it read or changed.

const RECENT_SHOWN = 8
const FILES_SHOWN = 6
const KIND_ORDER: Kind[] = ['read', 'edit', 'run', 'agent', 'other']

const NOW_KEY: Record<NowView['state'], ThemeKey | undefined> = { call: undefined, thinking: 'permission', starting: 'permission', done: 'success', failed: 'error' }

const capital = (s: string): string => upper(s.charAt(0)) + s.slice(1)

// The terminal's "now": the verb in the call's colour with its span, the call itself beneath.
function nowText(ui: Ui, now: NowView) {
  const { Box, Text } = ui
  const key = NOW_KEY[now.state] ?? KIND_KEY[now.kind]
  const glyph = now.state === 'call' ? KIND_GLYPH[now.kind] : '●'
  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end">
        <Text color={key}>{`${glyph} `}</Text>
        <Text bold color={key}>{capital(now.verb)}</Text>
        {now.span ? <Text dimColor>{` · ${now.span}`}</Text> : null}
      </Text>
      {now.tool ? (
        <Box flexDirection="row" columnGap={1} paddingLeft={2}>
          <Text bold>{now.tool}</Text>
          <Box flexShrink={1}>
            <Text dimColor wrap={now.isPath ? 'truncate-start' : 'truncate-end'}>{now.target}</Text>
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

export function nowTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg, Text } = ui
  const s = t()
  const now = nowOf(a, ctx.at)
  const steps = stepsOf(a)
  const alt = [now.verb, now.span, now.tool, now.target].filter(Boolean).join(' · ')
  return (
    <Box flexDirection="column" rowGap={ctx.isDesktop ? 1 : 0}>
      <Text bold>{a.status === 'running' ? s.current : s.lastStep}</Text>
      {ctx.isDesktop ? <Svg key="now" source={nowSvg(ctx.inner, now)} alt={alt} width={ctx.inner} height={NOW_H} /> : nowText(ui, now)}
      {steps ? <Text dimColor wrap="truncate-end">{`${s.tasks} ${steps}`}</Text> : null}
    </Box>
  )
}

// How a call came back: ✓ or ✗, … while its agent still runs, — when it never answered.
const outcomeOf = (e: ToolEvent, isLive: boolean): { glyph: string; key: ThemeKey } => {
  if (e.endAt !== undefined) return e.isError ? { glyph: '✗', key: 'error' } : { glyph: '✓', key: 'success' }
  return { glyph: isLive ? '…' : '—', key: 'subtle' }
}

type EventContext = RowContext & { isLive: boolean; index: number }

function eventTree(ui: Ui, e: ToolEvent, ctx: EventContext) {
  const { Box, Text, Svg } = ui
  const kind = kindOf(e.tool)
  const outcome = outcomeOf(e, ctx.isLive)
  const end = e.endAt === undefined && ctx.isLive && ctx.isDesktop
    ? <Svg key="live" source={pulseSvg()} alt={t().isRunning} width={PULSE} height={PULSE} />
    : <Text color={outcome.key}>{outcome.glyph}</Text>
  return (
    <Box key={`ev-${ctx.index}`} flexDirection="row" alignItems="center" columnGap={1}>
      <Text color={KIND_KEY[kind]}>{KIND_GLYPH[kind]}</Text>
      <Box flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end">
          <Text bold>{e.tool}</Text>
          {e.target ? <Text dimColor>{` ${e.target}`}</Text> : null}
        </Text>
      </Box>
      <Box flexShrink={0} flexDirection="row" columnGap={1} alignItems="center">
        <Text dimColor>{agoOf(ctx.at - e.at)}</Text>
        {end}
      </Box>
    </Box>
  )
}

export const mixOf = (history: ToolEvent[]): MixPart[] =>
  KIND_ORDER.map(kind => ({ kind, count: history.filter(e => kindOf(e.tool) === kind).length })).filter(p => p.count > 0)

function mixTree(ui: Ui, parts: MixPart[], ctx: RowContext) {
  const { Box, Text, Svg } = ui
  if (!parts.length) return null
  const s = t()
  const words = parts.map(p => `${s.kinds[p.kind]} ${p.count}`).join(' · ')
  const legend = parts.map((p, i) => (
    <Text key={`k-${p.kind}`}>
      <Text color={KIND_KEY[p.kind]}>{`${KIND_GLYPH[p.kind]} `}</Text>
      <Text dimColor>{`${s.kinds[p.kind]} ${p.count}${i < parts.length - 1 ? '   ' : ''}`}</Text>
    </Text>
  ))
  return (
    <Box flexDirection="column" rowGap={ctx.isDesktop ? 1 : 0}>
      {ctx.isDesktop && <Svg key="mix" source={mixSvg(ctx.inner, parts)} alt={words} width={ctx.inner} height={MIX_H} />}
      <Text wrap="truncate-end">{legend}</Text>
    </Box>
  )
}

/** Its latest calls, the newest last, under the mix of all it did. */
export function historyTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text } = ui
  const s = t()
  const list = a.history ?? []
  const shown = list.slice(-RECENT_SHOWN)
  const hidden = list.length - shown.length
  const isLive = a.status === 'running'
  return (
    <Box flexDirection="column" rowGap={1}>
      <Text bold>{`${s.history} · ${s.tools(list.length)}`}</Text>
      {mixTree(ui, mixOf(list), ctx)}
      <Box flexDirection="column">
        {list.length === 0 && <Text dimColor>{s.noCalls}</Text>}
        {hidden > 0 && <Text dimColor>{s.earlier(hidden)}</Text>}
        {shown.map((e, i) => eventTree(ui, e, { ...ctx, isLive, index: hidden + i }))}
      </Box>
    </Box>
  )
}

const fileWords = (f: TouchedFile): string => {
  const s = t()
  return [f.edits ? `${s.kinds.edit} ${f.edits}` : '', f.reads ? `${s.kinds.read} ${f.reads}` : ''].filter(Boolean).join(' · ')
}

// The terminal's file row: the glyph of what it did most to it, the path, the counts.
function fileText(ui: Ui, f: TouchedFile) {
  const { Text } = ui
  const kind: Kind = f.edits ? 'edit' : 'read'
  const counts = [f.edits ? `${KIND_GLYPH.edit}${f.edits}` : '', f.reads ? `${KIND_GLYPH.read}${f.reads}` : ''].filter(Boolean).join(' ')
  return (
    <Text key={`file-${f.path}`} wrap="truncate-middle">
      <Text color={KIND_KEY[kind]}>{`${KIND_GLYPH[kind]} `}</Text>
      <Text>{shortPath(f.path)}</Text>
      <Text dimColor>{`  ${counts}`}</Text>
    </Text>
  )
}

/** The files it read or changed, the changed ones first; none drawn when it touched none. */
export function filesTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg, Text } = ui
  const all = filesShown(a.files ?? [])
  if (!all.length) return null
  const s = t()
  const shown = all.slice(0, FILES_SHOWN)
  const more = all.length - shown.length
  const drawn = ctx.isDesktop ? filesSvg(ctx.inner, shown) : null
  const alt = shown.map(f => `${f.path} (${fileWords(f)})`).join(', ')
  return (
    <Box flexDirection="column" rowGap={ctx.isDesktop ? 1 : 0}>
      <Text bold>{`${s.files} · ${all.length}`}</Text>
      {drawn ? <Svg key="files" source={drawn.source} alt={alt} width={ctx.inner} height={drawn.height} /> : shown.map(f => fileText(ui, f))}
      {more > 0 && <Text dimColor>{s.moreFiles(more)}</Text>}
    </Box>
  )
}

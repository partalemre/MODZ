// The hold card: a cold send waits above the prompt with its price beside a warm turn's,
// the held text quoted back, and three ways on. Desktop draws Svg; the terminal says it in text.

import type { Elements, RenderElement } from 'claude-code'

import { fmtUsd } from './fmt'
import { COMPARE_H, HEADER_H, compareSvg, headerSvg, warmCaptions } from './hold-svg'
import type { HoldView } from './hold-svg'
import { ICONS } from './icons'
import { iconSvg } from './svg'
import { TERMINAL, palette } from './theme'
import type { Palette } from './theme'
import { bandWords as words } from './ui-words'

export type HoldActions = { pay: () => void; fresh: () => void; status: () => void }
export type HoldOptions = { view: HoldView; actions: HoldActions; isLight: boolean; noColor: boolean; columns: number }

// About 8 px a reported column; the card's border and padding take 6 of them (as in every MODZ card).
const PX_PER_COLUMN = 8
const CARD_CHROME = 6
const MIN_WIDTH = 300
const MAX_WIDTH = 720
const ROW_ICON = 16

/** The card's inner width from the band's columns. */
export const contentWidth = (columns: number): number =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN))

const heldQuote = (view: HoldView): string => `“${view.held}”`
const keepText = (view: HoldView): string => words().keep(view.autoWarm)

function buttons(ui: Elements['desktop'] | Elements['terminal'], actions: HoldActions): RenderElement {
  const { Box, Button } = ui
  const { pay, fresh, status } = words()
  return Box({ flexDirection: 'row', flexWrap: 'wrap', gap: 1, alignItems: 'center', children: [
    Button({ key: 'cache-tax:pay', ...pay, variant: 'secondary', onPress: actions.pay }),
    Button({ key: 'cache-tax:fresh', ...fresh, variant: 'secondary', onPress: actions.fresh }),
    Button({ key: 'cache-tax:status', ...status, plain: true, dimColor: true, onPress: actions.status }),
  ] })
}

function infoRow(ui: Elements['desktop'], glyph: { paths: string; color: string }, children: RenderElement[]): RenderElement {
  const { Box, Svg } = ui
  const { paths, color } = glyph
  return Box({ flexDirection: 'row', gap: 1, alignItems: 'center', children: [
    Box({ flexShrink: 0, children: [Svg({ source: iconSvg(paths, ROW_ICON, color), alt: '', width: ROW_ICON, height: ROW_ICON })] }),
    ...children,
  ] })
}

function desktopInfo(ui: Elements['desktop'], view: HoldView, p: Palette): RenderElement {
  const { Box, Text } = ui
  return Box({ flexDirection: 'column', children: [
    infoRow(ui, { paths: ICONS.pauseCircle, color: p.mid }, [
      Text({ color: p.mid, wrap: 'truncate-end', children: [words().held, Text({ color: p.hi, children: [heldQuote(view)] })] }),
    ]),
    infoRow(ui, { paths: ICONS.shieldCheck, color: p.mid }, [Text({ color: p.mid, children: [keepText(view)] })]),
  ] })
}

export function holdDesktop(ui: Elements['desktop'], o: HoldOptions): RenderElement {
  const { Box, Svg } = ui
  const p = palette(o.isLight)
  const width = contentWidth(o.columns)
  const alt = words().alt(fmtUsd(o.view.coldUsd), fmtUsd(o.view.warmUsd))
  return Box({ key: 'cache-tax:hold', flexDirection: 'column', alignSelf: 'flex-start', gap: 1, paddingX: 2, paddingY: 1, borderStyle: 'round',
    borderColor: p.line, backgroundColor: p.card, children: [
      Svg({ source: headerSvg(width, o.view, p), alt, width, height: HEADER_H }),
      Svg({ source: compareSvg(width, o.view, p), alt: `${words().tokens(o.view.tokens)}, ${o.view.rate}`, width, height: COMPARE_H }),
      desktopInfo(ui, o.view, p),
      buttons(ui, o.actions),
    ] })
}

const BAR_FULL = 24
const BAR_MIN = 1
/** Cells the label and price columns take, and what the rest of a price line needs beside the bar. */
const LABEL_CELLS = 13
const PRICE_CELLS = 6
const LINE_CHROME = 30

/** `━━━━━━╸` scaled to the share, at least one cell. */
export function textBar(share: number, cells: number): string {
  const filled = Math.max(BAR_MIN, Math.round(share * cells))
  return '━'.repeat(Math.max(0, filled - 1)) + '╸'
}

type PriceLine = { label: string; usd: string; color: string | undefined; bar: string }

function priceLine(ui: Elements['terminal'], { label, usd, color, bar }: PriceLine): RenderElement {
  const { Box, Text } = ui
  return Box({ flexDirection: 'row', gap: 1, children: [
    Text({ dimColor: true, children: [label.padEnd(LABEL_CELLS)] }),
    Text({ bold: true, color, children: [usd.padStart(PRICE_CELLS)] }),
    Text({ color, children: [bar] }),
  ] })
}

export function holdTerminal(ui: Elements['terminal'], o: HoldOptions): RenderElement {
  const { Box, Text } = ui
  const warn = o.noColor ? undefined : TERMINAL.warn
  const v = o.view
  const share = v.coldUsd && v.warmUsd !== null ? Math.min(1, v.warmUsd / v.coldUsd) : 0
  const cells = Math.max(BAR_MIN, Math.min(BAR_FULL, o.columns - LINE_CHROME))
  const said = words()
  return Box({ key: 'cache-tax:hold', flexDirection: 'column', paddingX: 1, borderStyle: 'round', borderDimColor: true, children: [
    Text({ bold: true, dimColor: true, children: [said.name] }),
    Text({ bold: true, children: [said.headline] }),
    Text({ dimColor: true, children: [v.reason[0] ?? ''] }),
    priceLine(ui, { label: said.sendNow, usd: fmtUsd(v.coldUsd), color: warn, bar: textBar(1, cells) }),
    priceLine(ui, { label: said.warmTurn, usd: fmtUsd(v.warmUsd), color: undefined, bar: `${textBar(share, cells)} ${warmCaptions(v).at(-1) ?? ''}` }),
    Text({ dimColor: true, children: [`${said.tokens(v.tokens)} ${said.rewritten(v.rate)[0]}`] }),
    Text({ wrap: 'truncate-end', children: [Text({ dimColor: true, children: [`⏸ ${said.held}`] }), heldQuote(v)] }),
    Text({ dimColor: true, children: [`✓ ${keepText(v)}`] }),
    buttons(ui, o.actions),
  ] })
}

// The Ideas pane `/mine` fills: a head (Svg on the desktop, an eyebrow line in text elsewhere), then one
// framed row per idea, or per local candidate when the model's answer was unusable. A rule row saves through
// reflect's own card; the other kinds copy their text.

import type { Elements, RenderElement, RenderSurface } from 'claude-code'

import type { Candidate, Idea, IdeasView } from '../types'
import type { Look } from './card'
import { headSvg } from './ideas-svg'
import { upper } from './lang'
import { mineWords } from './mine-words'
import { MAX_CHATS } from './transcripts'
import { TERMINAL, palette } from './theme'
import type { Palette } from './theme'

export type RowState = 'waiting' | 'known' | 'saved' | undefined

export type PaneActions = { save: (i: number) => void; copy: (i: number, surface: RenderSurface) => void; again: () => void }

export type PaneInput = { view: IdeasView; states: RowState[]; copied: string | null; on: PaneActions }

type Ui = Pick<Elements['terminal'], 'Box' | 'Text' | 'Button'> & { Svg?: Elements['desktop']['Svg'] }
type Level = 'hi' | 'mid' | 'lo'
// A pane has no card frame of its own: its head is as wide as the body, about 8 px a column.
const PX_PER_COLUMN = 8
const MIN_WIDTH = 300
/** How a surface colours: the desktop by hex from the palette, the terminal by theme keys and dim text. */
type Ink = { ui: Ui; p: Palette; isDesktop: boolean }

function tone(ink: Ink, level: Level): { color?: string; dimColor?: boolean } {
  if (ink.isDesktop) return { color: ink.p[level] }
  return level === 'lo' ? { dimColor: true } : {}
}

/** The kind label: a highlight span in Orchid, the pane's one accent. */
const tag = (ink: Ink, label: string): RenderElement => (ink.isDesktop
  ? ink.ui.Text({ backgroundColor: ink.p.role.plan.tint, color: ink.p.role.plan.fg, children: [` ${label} `] })
  : ink.ui.Text({ color: TERMINAL.plan, children: [`[${label}]`] }))

function headOf(view: IdeasView): { headline: string; meta: string } {
  const says = mineWords()
  const { read, partial, skipped } = view.scan
  const meta = [says.read(read), ...(partial > 0 ? [says.partial(partial)] : []), ...(skipped > 0 ? [says.unread(skipped)] : [])].join(' · ')
  if (view.status === 'reading') return { headline: says.reading(MAX_CHATS), meta: '' }
  if (view.status === 'thinking') return { headline: says.thinking, meta }
  if (view.failure === 'read') return { headline: says.unreadable, meta: '' }
  if (!view.scan.hasFolder || view.scan.read === 0) return { headline: says.noChats, meta: view.scan.hasFolder ? meta : '' }
  if (view.ideas.length > 0) return { headline: says.ideasHead(view.ideas.length), meta }
  if (view.failure === 'model' && view.candidates.length > 0) return { headline: says.failedHead(view.candidates.length), meta }
  return { headline: says.empty(view.scan.read), meta }
}

function head(ink: Ink, view: IdeasView, columns: number): RenderElement {
  const { headline, meta } = headOf(view)
  const eyebrow = mineWords().eyebrow
  const isLoading = view.status !== 'done'
  if (ink.isDesktop && ink.ui.Svg) {
    const width = Math.max(MIN_WIDTH, columns * PX_PER_COLUMN)
    const art = headSvg(width, { eyebrow, headline, meta, isLoading }, ink.p)
    return ink.ui.Svg({ source: art.source, alt: [`${eyebrow}: ${headline}`, ...(meta ? [meta] : [])].join(', '), width, height: art.height })
  }
  const { Box, Text } = ink.ui
  return Box({ flexDirection: 'column', children: [
    Text({ children: [Text({ bold: true, color: TERMINAL.plan, children: [`● ${upper(eyebrow)}`] }), Text({ dimColor: true, children: [meta ? `  ${meta}` : ''] })] }),
    Text({ bold: true, wrap: 'wrap', children: [isLoading ? `◐ ${headline}` : headline] }),
  ] })
}

function action(ink: Ink, c: PaneInput, i: number): RenderElement {
  const says = mineWords()
  const idea = c.view.ideas[i] as Idea
  const state = c.states[i]
  if (idea.type !== 'rule') {
    const label = c.copied === idea.text ? says.copied : says.copy
    return ink.ui.Button({ key: `idea-copy:${i}`, label, variant: 'secondary', onPress: press => c.on.copy(i, press.surface) })
  }
  if (state === undefined) return ink.ui.Button({ key: `idea-save:${i}`, label: says.save, variant: 'secondary', onPress: () => c.on.save(i) })
  const text = { waiting: says.waiting, known: says.known, saved: says.saved }[state]
  const check = ink.ui.Text({ color: ink.isDesktop ? ink.p.role.ok.fg : TERMINAL.ok, children: ['✓'] })
  return ink.ui.Text({ ...tone(ink, 'mid'), children: [check, ` ${text}`] })
}

function frame(ink: Ink, o: { key: string; children: RenderElement[] }): RenderElement {
  const colours = ink.isDesktop ? { borderColor: ink.p.line, backgroundColor: ink.p.card } : { borderDimColor: true }
  return ink.ui.Box({ key: o.key, flexDirection: 'column', paddingX: 1, borderStyle: 'round', ...colours, children: o.children })
}

function ideaRow(ink: Ink, c: PaneInput, i: number): RenderElement {
  const { Box, Text } = ink.ui
  const idea = c.view.ideas[i] as Idea
  const says = mineWords()
  return frame(ink, { key: `idea:${i}`, children: [
    Text({ wrap: 'wrap', children: [tag(ink, says.type[idea.type]), ' ', Text({ bold: true, ...tone(ink, 'hi'), children: [idea.text] })] }),
    Text({ wrap: 'wrap', ...tone(ink, 'mid'), children: [idea.why] }),
    Box({ flexDirection: 'row', gap: 1, flexWrap: 'wrap', alignItems: 'center', children: [
      Text({ ...tone(ink, 'lo'), children: [says.seen(idea.count, idea.chats)] }), Box({ flexGrow: 1 }), action(ink, c, i),
    ] }),
  ] })
}

function candidateRow(ink: Ink, cand: Candidate, i: number): RenderElement {
  const says = mineWords()
  return frame(ink, { key: `cand:${i}`, children: [
    ink.ui.Text({ wrap: 'wrap', children: [tag(ink, says.kind[cand.kind]), ' ', ink.ui.Text({ ...tone(ink, 'hi'), children: [cand.sample] })] }),
    ink.ui.Text({ ...tone(ink, 'lo'), children: [says.seen(cand.count, cand.chats)] }),
  ] })
}

function body(ink: Ink, c: PaneInput): RenderElement[] {
  const { view } = c
  if (view.status !== 'done') return []
  const says = mineWords()
  if (view.ideas.length > 0) return view.ideas.map((_, i) => ideaRow(ink, c, i))
  const again = (label: string) => ink.ui.Box({ flexDirection: 'row', children: [ink.ui.Button({ key: 'mine-again', label, variant: 'secondary', onPress: c.on.again })] })
  if (view.failure === 'model' && view.candidates.length > 0) {
    const note = ink.ui.Text({ wrap: 'wrap', ...tone(ink, 'mid'), children: [says.failed] })
    return [note, ...view.candidates.map((cand, i) => candidateRow(ink, cand, i)), again(says.tryAgain)]
  }
  return [again(view.failure === 'read' ? says.tryAgain : says.again)]
}

export function ideasPane(ui: Ui, c: PaneInput, look: Look & { surface: RenderSurface }): RenderElement {
  const ink: Ink = { ui, p: palette(look.isLight), isDesktop: look.surface === 'desktop' && ui.Svg !== undefined }
  return ui.Box({ key: 'reflect:ideas', flexDirection: 'column', gap: 1, children: [head(ink, c.view, look.columns), ...body(ink, c)] })
}

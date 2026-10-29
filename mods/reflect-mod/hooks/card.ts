// The reflect card above the prompt: the proposed rule, where it would go (two rows, the picked
// one in Moss), and the ways on. Desktop draws Svg; every other surface says it in text.

import type { Elements, RenderElement } from 'claude-code'

import type { JustSaved, Learning } from '../types'
import { destSvg, isStackedAt, proposalSvg, savedSvg } from './card-svg'
import { PressRow } from './kit/press'
import { ICONS } from './icons'
import { TERMINAL, palette } from './theme'
import type { Palette } from './theme'
import { words } from './words'

export type Scope = 'global' | 'project'

export type CardActions = {
  pick: (scope: Scope) => void
  save: (scope: Scope) => void
  reword: () => void
  submitReword: (value: string) => void
  cancelReword: () => void
  skip: () => void
}

export type CardInput = {
  l: Learning
  picked: Scope
  isEditing: boolean
  more: number
  paths: Record<Scope, string>
  on: CardActions
}

export type Look = { isLight: boolean; columns: number }
type TextUi = Pick<Elements['terminal'], 'Box' | 'Text' | 'Button'> & { Input?: Elements['terminal']['Input'] }

// About 8 px a reported column; the card's border and padding take 6 of them (as in every MODZ card).
const PX_PER_COLUMN = 8
const CARD_CHROME = 6
const MIN_WIDTH = 300
const MAX_WIDTH = 720
const PERCENT = 100

export const contentWidth = (columns: number): number =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN))

const ROW_ICONS: Record<Scope, string> = { project: ICONS.folder, global: ICONS.globe }
const HOTKEY: Record<Scope, string> = { project: '1', global: '2' }
const other = (scope: Scope): Scope => (scope === 'project' ? 'global' : 'project')

/** "×2 · %95 emin": repeats, and the model's own confidence (none for a rule the person stated). */
export function metaOf(l: Learning): string {
  const parts = l.count > 1 ? [`×${l.count}`] : []
  if (!l.isExplicit) parts.push(words().sure(Math.round(l.confidence * PERCENT)))
  return parts.join(' · ')
}

function actionsRow(ui: TextUi, c: CardInput): RenderElement {
  const { Box, Button, Input } = ui
  const id = c.l.id
  const says = words()
  if (c.isEditing && Input) {
    return Box({ flexDirection: 'row', gap: 1, alignItems: 'center', children: [
      Box({ flexGrow: 1, children: [Input({ key: `reword:${id}`, value: c.l.rule, placeholder: says.rewordPlaceholder, submitLabel: says.rewordSubmit, autoFocus: true, onSubmit: c.on.submitReword })] }),
      Button({ key: `cancel:${id}`, label: says.cancel, plain: true, onPress: c.on.cancelReword }),
    ] })
  }
  return Box({ flexDirection: 'row', gap: 1, flexWrap: 'wrap', alignItems: 'center', children: [
    Button({ key: `save:${id}`, label: says.saveLabel[c.picked], variant: 'primary', hotkey: says.saveKey, onPress: () => c.on.save(c.picked) }),
    Button({ key: `other:${id}`, label: says.saveLabel[other(c.picked)], variant: 'secondary', onPress: () => c.on.save(other(c.picked)) }),
    Button({ key: `edit:${id}`, label: says.reword, plain: true, dimColor: true, hotkey: says.rewordKey, onPress: c.on.reword }),
    Button({ key: `skip:${id}`, label: says.skip, plain: true, dimColor: true, onPress: c.on.skip }),
  ] })
}

// `isStacked`: both rows put the path under the label when either one's path would not fit beside it.
type Dest = { scope: Scope; p: Palette; width: number; isStacked: boolean }

/** Whether either destination's path would not fit beside its label at this width. */
const stacksAt = (c: CardInput, width: number): boolean =>
  isStackedAt((['project', 'global'] as const).map(scope => ({ label: words().rowLabel[scope], path: c.paths[scope] })), width)

// The whole row is the press (kit/press.tsx): the drawing shows the picked row on a wash, the native button over it
// takes the press. A desktop paints no hotkey on that cover, so the digit keys are the terminal's.
function destDesktop(ui: Elements['desktop'], c: CardInput, d: Dest): RenderElement {
  const { scope } = d
  const label = words().rowLabel[scope]
  const art = destSvg(d.width, { icon: ROW_ICONS[scope], label, path: c.paths[scope], isPicked: c.picked === scope, isStacked: d.isStacked }, d.p)
  const drawing = ui.Svg({ source: art.source, alt: `${label}: ${c.paths[scope]}`, width: d.width, height: art.height })

  return PressRow(ui, { box: `dest-${scope}:${c.l.id}`, key: `pick-${scope}:${c.l.id}`, drawing, onPress: () => c.on.pick(scope) })
}

const shell = (ui: Elements['desktop'], p: Palette, children: RenderElement[]): RenderElement =>
  ui.Box({ key: 'reflect:card', flexDirection: 'column', alignSelf: 'flex-start', gap: 1, paddingX: 2, paddingY: 1,
    borderStyle: 'round', borderColor: p.line, backgroundColor: p.card, children })

export function cardDesktop(ui: Elements['desktop'], c: CardInput, look: Look): RenderElement {
  const p = palette(look.isLight)
  const width = contentWidth(look.columns)
  const head = proposalSvg(width, { rule: c.l.rule, said: c.l.said ?? '', meta: metaOf(c.l) }, p)
  const isStacked = stacksAt(c, width)
  const more = c.more > 0 ? [ui.Text({ color: p.lo, children: [words().more(c.more)] })] : []
  return shell(ui, p, [
    ui.Svg({ source: head.source, alt: words().askAlt(c.l.rule), width, height: head.height }),
    ui.Box({ flexDirection: 'column', gap: 0, children: (['project', 'global'] as const).map(scope => destDesktop(ui, c, { scope, p, width, isStacked })) }),
    actionsRow(ui, c),
    ...more,
  ])
}

export function savedDesktop(ui: Elements['desktop'], s: JustSaved, look: Look): RenderElement {
  const p = palette(look.isLight)
  const width = contentWidth(look.columns)
  const title = s.isNew ? words().savedTitle[s.scope] : words().alreadySaved
  const art = savedSvg(width, { title, rule: s.rule, path: s.path, isNew: s.isNew }, p)
  return shell(ui, p, [ui.Svg({ source: art.source, alt: `${title}: “${s.rule}”, ${s.path}`, width, height: art.height })])
}

function destText(ui: TextUi, c: CardInput, scope: Scope): RenderElement {
  const isPicked = c.picked === scope
  return ui.Box({ flexDirection: 'row', gap: 1, children: [
    ui.Text({ color: isPicked ? TERMINAL.ok : undefined, children: [isPicked ? '▸' : ' '] }),
    ui.Button({ key: `pick-${scope}:${c.l.id}`, label: words().rowLabel[scope], plain: true, hotkey: HOTKEY[scope], dimColor: !isPicked, onPress: () => c.on.pick(scope) }),
    ui.Text({ dimColor: !isPicked, children: [c.paths[scope]] }),
  ] })
}

export function cardText(ui: TextUi, c: CardInput): RenderElement {
  const { Box, Text } = ui
  const says = words()
  const count = c.l.count > 1 ? ` ×${c.l.count}` : ''
  const meta = c.l.isExplicit ? '' : `  ${says.sure(Math.round(c.l.confidence * PERCENT))}`
  return Box({ key: 'reflect:card', flexDirection: 'column', paddingX: 1, borderStyle: 'round', borderDimColor: true, children: [
    Text({ children: [Text({ bold: true, children: [says.ask] }), Text({ dimColor: true, children: [meta] })] }),
    Text({ bold: true, wrap: 'wrap', children: [`“${c.l.rule}”${count}`] }),
    ...(c.l.said ? [Text({ dimColor: true, wrap: 'truncate-end', children: [says.said, Text({ italic: true, children: [`“${c.l.said}”`] })] })] : []),
    Text({ dimColor: true, bold: true, children: [says.where] }),
    destText(ui, c, 'project'),
    destText(ui, c, 'global'),
    actionsRow(ui, c),
    ...(c.more > 0 ? [Text({ dimColor: true, children: [says.more(c.more)] })] : []),
  ] })
}

export function savedText(ui: TextUi, s: JustSaved): RenderElement {
  const { Box, Text } = ui
  const says = words()
  const title = s.isNew ? says.savedTitle[s.scope] : says.alreadySaved
  return Box({ key: 'reflect:card', flexDirection: 'column', paddingX: 1, borderStyle: 'round', borderDimColor: true, children: [
    Text({ bold: true, color: TERMINAL.ok, children: [`✓ ${says.saved}`] }),
    Text({ bold: true, children: [title] }),
    Text({ wrap: 'wrap', children: [`“${s.rule}”`] }),
    Text({ dimColor: true, children: [`${s.isNew ? says.addedTo : says.alreadyIn}: ${s.path}`] }),
  ] })
}

// The reflect card above the prompt: the proposed rule, where it would go (two rows, the picked
// one in Moss), and the ways on. Desktop draws Svg; every other surface says it in text.

import type { Elements, RenderElement } from 'claude-code'

import type { JustSaved, Learning } from '../types'
import { pathSvg, proposalSvg, savedSvg } from './card-svg'
import { ICONS } from './icons'
import { iconSvg, measure } from './svg'
import type { Font } from './svg'
import { TERMINAL, palette } from './theme'
import type { Palette } from './theme'

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
const ROW_ICON = 16
const PERCENT = 100
// A destination row's own chrome in px: border, padding, icon, two gaps, the button's padding and hotkey.
const DEST_CHROME = 110
const LABEL_FONT: Font = { size: 14 }
// The path under a stacked row's label lines up with the label: past the icon and its gap.
const DEST_INDENT = 3

export const contentWidth = (columns: number): number =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN))

const ROW_LABEL: Record<Scope, string> = { project: 'Sadece bu proje', global: 'Tüm projelerin' }
const SAVE_LABEL: Record<Scope, string> = { project: 'Bu projeye kaydet', global: 'Tüm projelere kaydet' }
const SAVED_TITLE: Record<Scope, string> = { project: 'Bu projeye kaydedildi', global: 'Tüm projelere kaydedildi' }
const ROW_ICONS: Record<Scope, string> = { project: ICONS.folder, global: ICONS.globe }
const HOTKEY: Record<Scope, string> = { project: '1', global: '2' }
const other = (scope: Scope): Scope => (scope === 'project' ? 'global' : 'project')

/** "×2 · %95 emin": repeats, and the model's own confidence (none for a rule the person stated). */
export function metaOf(l: Learning): string {
  const parts = l.count > 1 ? [`×${l.count}`] : []
  if (!l.isExplicit) parts.push(`%${Math.round(l.confidence * PERCENT)} emin`)
  return parts.join(' · ')
}

function actionsRow(ui: TextUi, c: CardInput): RenderElement {
  const { Box, Button, Input } = ui
  const id = c.l.id
  if (c.isEditing && Input) {
    return Box({ flexDirection: 'row', gap: 1, alignItems: 'center', children: [
      Box({ flexGrow: 1, children: [Input({ key: `reword:${id}`, value: c.l.rule, placeholder: 'Kuralı yeniden yaz', submitLabel: 'güncelle', autoFocus: true, onSubmit: c.on.submitReword })] }),
      Button({ key: `cancel:${id}`, label: 'Vazgeç', plain: true, onPress: c.on.cancelReword }),
    ] })
  }
  return Box({ flexDirection: 'row', gap: 1, flexWrap: 'wrap', alignItems: 'center', children: [
    Button({ key: `save:${id}`, label: SAVE_LABEL[c.picked], variant: 'secondary', hotkey: 'k', onPress: () => c.on.save(c.picked) }),
    Button({ key: `other:${id}`, label: SAVE_LABEL[other(c.picked)], variant: 'secondary', onPress: () => c.on.save(other(c.picked)) }),
    Button({ key: `edit:${id}`, label: 'Yeniden yaz', variant: 'secondary', hotkey: 'y', onPress: c.on.reword }),
    Button({ key: `skip:${id}`, label: 'Kaydetme', plain: true, onPress: c.on.skip }),
  ] })
}

type Dest = { scope: Scope; p: Palette; width: number }

/** What a destination row needs beside its path: its frame and padding, the icon, the gaps and the label button. */
const rowChromeOf = (label: string): number => DEST_CHROME + measure(label, LABEL_FONT)

// The path stays whole: when it and the label do not fit on one line it moves under the label.
function destDesktop(ui: Elements['desktop'], c: CardInput, d: Dest): RenderElement {
  const { Box, Button, Svg } = ui
  const { scope, p } = d
  const isPicked = c.picked === scope
  const tone = p.role.ok
  const path = pathSvg(c.paths[scope], isPicked ? p.hi : p.lo)
  const isStacked = rowChromeOf(ROW_LABEL[scope]) + path.width > d.width
  const pathEl = Svg({ source: path.source, alt: c.paths[scope], width: path.width, height: path.height })
  const pick = [
    Svg({ source: iconSvg(ROW_ICONS[scope], ROW_ICON, isPicked ? tone.fg : p.lo), alt: '', width: ROW_ICON, height: ROW_ICON }),
    Button({ key: `pick-${scope}:${c.l.id}`, label: ROW_LABEL[scope], plain: true, hotkey: HOTKEY[scope], dimColor: !isPicked, onPress: () => c.on.pick(scope) }),
  ]
  const frame = { key: `dest-${scope}:${c.l.id}`, paddingX: 1, borderStyle: 'round', borderColor: isPicked ? tone.line : p.line, backgroundColor: isPicked ? tone.tint : p.card } as const
  if (isStacked) {
    return Box({ ...frame, flexDirection: 'column', children: [
      Box({ flexDirection: 'row', alignItems: 'center', gap: 1, children: pick }),
      Box({ paddingLeft: DEST_INDENT, children: [pathEl] }),
    ] })
  }
  return Box({ ...frame, flexDirection: 'row', alignItems: 'center', gap: 1, children: [...pick, Box({ flexGrow: 1 }), pathEl] })
}

const shell = (ui: Elements['desktop'], p: Palette, children: RenderElement[]): RenderElement =>
  ui.Box({ key: 'reflect:card', flexDirection: 'column', alignSelf: 'flex-start', gap: 1, paddingX: 2, paddingY: 1,
    borderStyle: 'round', borderColor: p.line, backgroundColor: p.card, children })

export function cardDesktop(ui: Elements['desktop'], c: CardInput, look: Look): RenderElement {
  const p = palette(look.isLight)
  const width = contentWidth(look.columns)
  const head = proposalSvg(width, { rule: c.l.rule, said: c.l.said ?? '', meta: metaOf(c.l) }, p)
  const more = c.more > 0 ? [ui.Text({ color: p.lo, children: [`+${c.more} kural daha · /reflect-queue`] })] : []
  return shell(ui, p, [
    ui.Svg({ source: head.source, alt: `Kural olarak kaydedilsin mi? “${c.l.rule}”`, width, height: head.height }),
    ui.Box({ flexDirection: 'column', gap: 0, children: [destDesktop(ui, c, { scope: 'project', p, width }), destDesktop(ui, c, { scope: 'global', p, width })] }),
    actionsRow(ui, c),
    ...more,
  ])
}

export function savedDesktop(ui: Elements['desktop'], s: JustSaved, look: Look): RenderElement {
  const p = palette(look.isLight)
  const width = contentWidth(look.columns)
  const title = s.isNew ? SAVED_TITLE[s.scope] : 'Bu kural zaten kayıtlı'
  const art = savedSvg(width, { title, rule: s.rule, path: s.path, isNew: s.isNew }, p)
  return shell(ui, p, [ui.Svg({ source: art.source, alt: `${title}: “${s.rule}”, ${s.path}`, width, height: art.height })])
}

function destText(ui: TextUi, c: CardInput, scope: Scope): RenderElement {
  const isPicked = c.picked === scope
  return ui.Box({ flexDirection: 'row', gap: 1, children: [
    ui.Text({ color: isPicked ? TERMINAL.ok : undefined, children: [isPicked ? '▸' : ' '] }),
    ui.Button({ key: `pick-${scope}:${c.l.id}`, label: ROW_LABEL[scope], plain: true, hotkey: HOTKEY[scope], dimColor: !isPicked, onPress: () => c.on.pick(scope) }),
    ui.Text({ dimColor: !isPicked, children: [c.paths[scope]] }),
  ] })
}

export function cardText(ui: TextUi, c: CardInput): RenderElement {
  const { Box, Text } = ui
  const count = c.l.count > 1 ? ` ×${c.l.count}` : ''
  const meta = c.l.isExplicit ? '' : `  %${Math.round(c.l.confidence * PERCENT)} emin`
  return Box({ key: 'reflect:card', flexDirection: 'column', paddingX: 1, borderStyle: 'round', borderDimColor: true, children: [
    Text({ children: [Text({ bold: true, color: TERMINAL.ok, children: ['● KURAL OLARAK KAYDEDİLSİN Mİ?'] }), Text({ dimColor: true, children: [meta] })] }),
    Text({ bold: true, wrap: 'wrap', children: [`“${c.l.rule}”${count}`] }),
    ...(c.l.said ? [Text({ dimColor: true, wrap: 'truncate-end', children: ['Söylediğin: ', Text({ italic: true, children: [`“${c.l.said}”`] })] })] : []),
    Text({ dimColor: true, bold: true, children: ['NEREYE'] }),
    destText(ui, c, 'project'),
    destText(ui, c, 'global'),
    actionsRow(ui, c),
    ...(c.more > 0 ? [Text({ dimColor: true, children: [`+${c.more} kural daha · /reflect-queue`] })] : []),
  ] })
}

export function savedText(ui: TextUi, s: JustSaved): RenderElement {
  const { Box, Text } = ui
  const title = s.isNew ? SAVED_TITLE[s.scope] : 'Bu kural zaten kayıtlı'
  return Box({ key: 'reflect:card', flexDirection: 'column', paddingX: 1, borderStyle: 'round', borderDimColor: true, children: [
    Text({ bold: true, color: TERMINAL.ok, children: ['✓ KURAL KAYDEDİLDİ'] }),
    Text({ bold: true, children: [title] }),
    Text({ wrap: 'wrap', children: [`“${s.rule}”`] }),
    Text({ dimColor: true, children: [`${s.isNew ? 'Eklendiği yer' : 'Zaten burada'}: ${s.path}`] }),
  ] })
}

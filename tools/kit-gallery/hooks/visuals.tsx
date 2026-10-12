import type { RenderElement } from 'claude-code'

import { GLYPH, ICON_NAMES } from './kit/icons'
import { arcPart, iconTilePart, place, sparkline, statTile, toPic } from './kit/svg'
import { textEl } from './kit/svg-core'
import { ROLES } from './kit/tokens'
import { Card, Meter, StatRow } from './kit/ui'
import { isText, Pic, Row, Section } from './ctx'
import type { Ctx } from './ctx'

const CELL_W = 72
const CELL_H = 64
const TILE = 36
const NAME_Y = 54
const MICRO = { size: 10.5, weight: 500 }

function iconSheet(width: number): ReturnType<typeof toPic> {
  const perRow = Math.max(1, Math.floor(width / CELL_W))
  const cells = ICON_NAMES.map((name, i) => {
    const x = (i % perRow) * CELL_W
    const y = Math.floor(i / perRow) * CELL_H
    const role = ROLES[i % ROLES.length]
    const tile = place(iconTilePart({ icon: name, role }).body, x + (CELL_W - TILE) / 2, y)
    return tile + textEl({ x: x + CELL_W / 2, y: y + NAME_Y, text: name, paint: 'lo', ...MICRO, anchor: 'middle' })
  })
  const rows = Math.ceil(ICON_NAMES.length / perRow)

  return toPic({ body: cells.join(''), width: perRow * CELL_W, height: rows * CELL_H, alt: `${ICON_NAMES.length} ikon` })
}

export function iconsSection(ctx: Ctx): RenderElement {
  const { ui, width } = ctx
  const { Text } = ui
  const body = isText(ctx)
    ? <Text>{ICON_NAMES.map(name => `${GLYPH[name]} ${name}`).join('  ')}</Text>
    : Pic(ctx, iconSheet(width))
  const neutral = Pic(ctx, toPic(iconTilePart({ icon: 'gauge' })))
  const sizes = [32, 36, 38].map(size => Pic(ctx, toPic(iconTilePart({ icon: 'sparkle', role: 'edit', size }))))

  return Section(ctx, { title: 'İkonlar', meta: `${ICON_NAMES.length} çizim · 24 ızgara · 1.75`, children: Card(ctx, { children: [body, Row(ctx, [neutral, ...sizes])] }) })
}

const SPARK = [3, 5, 4, 8, 7, 11, 9, 14, 13, 18]

export function dataSection(ctx: Ctx): RenderElement {
  const { width } = ctx
  const stats = [
    { label: 'Maliyet', value: '≈$0,33' },
    { label: 'Token', value: '342k', spark: SPARK, role: 'read' as const },
    { label: 'Süre', value: '1:01', unit: 'dk' },
  ]
  const tiles = [
    statTile({ label: 'Testler', value: '41', unit: '/ 42', role: 'ok' }),
    statTile({ label: 'Lint', value: '2', unit: 'hata', role: 'danger' }),
    statTile({ label: 'Bağlam', value: '%84', role: 'warn', width: 160, spark: SPARK }),
  ]
  const sparks = ROLES.slice(0, 4).map(role => Pic(ctx, sparkline({ values: SPARK.map((v, i) => v + ((i * 7) % 5)), role })))

  return Section(ctx, {
    title: 'Sayılar',
    meta: 'stat · sparkline',
    children: Card(ctx, {
      children: [StatRow(ctx, { stats, width }), Row(ctx, tiles.map(tile => Pic(ctx, tile))), Row(ctx, sparks)],
    }),
  })
}

const METERS = [
  { label: 'Tempoda (nötr)', value: 0.38, pace: 0.4 },
  { label: 'Tempodan önde → Amber', value: 0.62, pace: 0.4 },
  { label: '%95 ve üstü → Flare', value: 0.97, pace: 0.9 },
  { label: 'Dolu (asla >%100)', value: 1.4, max: 1 },
  { label: 'Rol rengi, tempo yok', value: 0.55, role: 'ok' as const },
  { label: 'Kahraman (h6)', value: 0.3, pace: 0.5, isHero: true },
  { label: 'Boş', value: 0 },
]

const ARC_GAP = 16
const ARCS = [
  { value: 0, size: 44 },
  { value: 0.35, size: 44 },
  { value: 0.82, size: 44, pace: 0.6 },
  { value: 0.35, size: 72, label: 'Bağlam' },
  { value: 0.97, size: 72, label: '5 saat' },
]

function arcRow(): ReturnType<typeof toPic> {
  let x = 0
  const parts = ARCS.map(o => {
    const part = arcPart(o)
    const body = place(part.body, x, (72 - part.height) / 2)
    x += part.width + ARC_GAP
    return body
  })

  return toPic({ body: parts.join(''), width: x - ARC_GAP, height: 72, alt: 'Halkalar' })
}

export function metersSection(ctx: Ctx): RenderElement {
  const { width } = ctx
  const meters = METERS.map(o => Meter(ctx, { ...o, width }))
  const children = isText(ctx) ? meters : [...meters, Pic(ctx, arcRow())]

  return Section(ctx, { title: 'Ölçerler', meta: 'tempo çentiği · halka', children: Card(ctx, { children }) })
}

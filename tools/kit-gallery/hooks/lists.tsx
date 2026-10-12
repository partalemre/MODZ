import type { RenderElement } from 'claude-code'

import { fileBadge, skeleton, stepCircle, stepDots } from './kit/svg'
import type { StepState } from './kit/svg'
import { ROLES } from './kit/tokens'
import { Card, Highlight, Pill } from './kit/ui'
import { isText, Pic, Row, Section } from './ctx'
import type { Ctx } from './ctx'

const DOTS: { steps: StepState[]; caption: string; role?: 'run' | 'plan' }[] = [
  { steps: ['done', 'done', 'active', 'pending', 'pending'], caption: '3/5 · Testler çalışıyor' },
  { steps: ['done', 'failed', 'skipped', 'pending'], caption: 'Lint başarısız' },
  { steps: ['done', 'done', 'done', 'active'], caption: 'Gözden geçirme', role: 'plan' },
  { steps: ['done', 'done', 'done', 'done'], caption: 'Hepsi bitti' },
]

const EDITS = [
  { name: 'README.md', dir: '', state: 'done' as const },
  { name: 'greet.js', dir: 'src', state: 'done' as const },
  { name: 'cli.js', dir: 'src', state: 'current' as const },
  { name: 'index.js', dir: 'src', state: 'future' as const },
]
const ROW_H = 32

function editRow(ctx: Ctx, edit: (typeof EDITS)[number], i: number): RenderElement {
  const { Box, Text } = ctx.ui
  const circle = stepCircle({ n: i + 1, state: edit.state, role: 'plan', rowHeight: ROW_H, hasRailAbove: i > 0, hasRailBelow: i < EDITS.length - 1 })

  return (
    <Box key={edit.name} flexDirection="row" gap={1} alignItems="center">
      {Pic(ctx, circle)}
      <Text bold={edit.state === 'current'}>{edit.name}</Text>
      {edit.dir ? <Text dimColor>{`${edit.dir} içinde`}</Text> : null}
    </Box>
  )
}

export function stepsSection(ctx: Ctx): RenderElement {
  const { ui } = ctx
  const { Box } = ui
  const dots = DOTS.map(o => Pic(ctx, stepDots(o)))
  const list = <Box flexDirection="column">{EDITS.map((edit, i) => editRow(ctx, edit, i))}</Box>

  return Section(ctx, { title: 'Adımlar', meta: 'noktalar · numaralı daire', children: Card(ctx, { children: [...dots, list] }) })
}

const NAMES = ['client.ts', 'App.tsx', 'train.py', 'NOTES.md', 'todo.txt', 'data.json', 'rows.csv', 'ci.yaml', 'fatura.pdf', 'logo.png', 'deploy.sh', '.gitignore', 'Makefile']

export function filesSection(ctx: Ctx): RenderElement {
  const badges = NAMES.map(name => Pic(ctx, fileBadge({ name })))
  const active = [Pic(ctx, fileBadge({ name: 'client.ts', activity: 'read' })), Pic(ctx, fileBadge({ name: 'client.ts', activity: 'edit' }))]

  return Section(ctx, { title: 'Dosya rozetleri', meta: 'tür · etkinlik', children: Card(ctx, { children: [Row(ctx, badges), Row(ctx, active)] }) })
}

const LABELS: Record<(typeof ROLES)[number], string> = { read: 'Okunuyor', edit: 'Düzenlendi', run: '2 ajan', ok: '3 geçti', warn: 'Bekliyor', danger: '1 başarısız', plan: '3/5' }

export function pillsSection(ctx: Ctx): RenderElement {
  const { ui } = ctx
  const { Text } = ui
  const plain = ROLES.map(role => Pill(ctx, { text: LABELS[role], role }))
  const icons = [
    Pill(ctx, { text: '3 geçti', role: 'ok', icon: 'check' }),
    Pill(ctx, { text: '1 başarısız', role: 'danger', icon: 'x' }),
    Pill(ctx, { text: 'Commit', role: 'ok', icon: 'branch' }),
    Pill(ctx, { text: 'Nötr' }),
  ]
  const spans = (
    <Text>
      <Text>{'Her klip '}</Text>
      {Highlight(ctx, { text: 'yaklaşık $0,45', role: 'warn' })}
      <Text>{' tutuyor; kaynak '}</Text>
      {Highlight(ctx, { text: 'Kie AI', role: 'read' })}
      <Text>.</Text>
    </Text>
  )

  return Section(ctx, { title: 'Pill ve vurgu', meta: '7 rol', children: Card(ctx, { children: [Row(ctx, plain), Row(ctx, icons), spans] }) })
}

const SKELETON_W = 360

export function loadingSection(ctx: Ctx): RenderElement {
  const { ui } = ctx
  const { Text } = ui
  const body = isText(ctx) ? <Text dimColor>◐ Yükleniyor…</Text> : Pic(ctx, skeleton({ width: SKELETON_W }))

  return Section(ctx, { title: 'Yükleniyor', meta: '1.4 sn parıltı', children: Card(ctx, { header: { eyebrow: 'Yükleniyor', width: ctx.width }, children: body }) })
}


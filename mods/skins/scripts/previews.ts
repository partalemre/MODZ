// Renders the README's preview images from the same builders the mod draws with, for a
// dark and a light background. Run from the repo root: `npx tsx scripts/previews.ts`.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { spinnerIcon, toolIcon } from '../hooks/icons'
import type { SpinnerMode } from '../hooks/icons'
import { toLight } from '../hooks/light'
import type { Kind, Palette } from '../hooks/skin'
import { codeSvg } from '../hooks/svg-code'
import { diffSvg } from '../hooks/svg-diff'
import { escape, FONT, MONO } from '../hooks/svg-kit'
import { tableSvg } from '../hooks/svg-table'
import { terminalSvg } from '../hooks/svg-terminal'
import { usageSvg } from '../hooks/svg-usage'
import noir from '../hooks/themes/noir'

const OUT = join(import.meta.dirname, '..', 'docs', 'previews')
const WIDTH = 760

type Built = { source: string; height: number }

// Places a finished SVG document at (x, y) inside another, by nesting it.
const place = (source: string, x: number, y: number): string =>
  source.replace('<svg ', `<svg x="${x}" y="${y}" `)

const text = (x: number, y: number, body: string, color: string): string =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="14" style="fill:${color}">${body}</text>`

function promptPill(label: string, palette: Palette, y: number): { markup: string; height: number } {
  const width = Math.ceil(label.length * 7.6 + 28)

  return {
    markup: `<rect x="0.5" y="${y + 0.5}" width="${width}" height="34" rx="9" fill="none" stroke="${palette.muted}"/>${text(14, y + 22, escape(label), palette.fg)}`,
    height: 34,
  }
}

function toolLine(kind: Kind, tool: string, target: string, meta: string, palette: Palette, y: number, isRunning = false): string {
  return [
    place(toolIcon(kind, isRunning ? palette.muted : palette.ok, isRunning), 0, y),
    text(26, y + 13, `<tspan style="font-weight:600;fill:${palette[kind]}">${tool}</tspan><tspan style="fill:${palette.muted}">  ${escape(target)}</tspan>`, palette.fg),
    meta === '' ? '' : `<text x="${WIDTH}" y="${y + 13}" text-anchor="end" font-family="${MONO}" font-size="12.5" style="fill:${palette.muted}">${meta}</text>`,
  ].join('')
}

// The hero: a turn as the desktop app draws it with the skin on.
function hero(palette: Palette): string {
  const parts: string[] = []
  let y = 4
  const add = (markup: string, height: number, gap = 14) => {
    parts.push(markup)
    y += height + gap
  }

  const prompt = promptPill('add rate limiting to the hub api', palette, y)
  add(prompt.markup, prompt.height, 20)
  add(toolLine('run', 'Bash', 'pnpm test --filter hub', '2.1s', palette, y), 16)
  add(toolLine('read', 'Read', 'apps/hub/src/server.ts', '0.1s', palette, y), 16)
  add(toolLine('write', 'Edit', 'apps/hub/src/server.ts', '+2 −1   0.4s', palette, y), 16, 12)

  const diff = diffSvg(
    {
      path: 'apps/hub/src/server.ts',
      isNewFile: false,
      hunks: [{ oldStart: 12, newStart: 12, lines: [' const app = fastify()', '-app.listen(7447)', '+app.register(rateLimit, { max: 60, timeWindow: "1 minute" })', '+app.listen(7447)'] }],
    },
    'apps/hub/src/server.ts',
    palette,
    WIDTH,
  )
  add(place(diff.source, 0, y), diff.height, 18)
  add(text(0, y + 14, 'Every route is now limited per user:', palette.fg), 18, 10)

  const table = tableSvg(
    {
      kind: 'table',
      header: ['Route', 'Limit', 'Window', 'Store'],
      align: ['left', 'right', 'left', 'left'],
      rows: [
        ['/chat', '60', '1 min', 'memory'],
        ['/upload', '10', '1 min', 'SQLite'],
        ['/search', '120', '5 min', 'memory'],
      ],
    },
    palette,
    WIDTH,
  )
  add(place(table.source, 0, y), table.height, 18)
  add(place(spinnerIcon('responding', palette.user), 0, y - 2) + text(28, y + 13, 'Writing the reply', palette.muted), 18, 4)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${y}" viewBox="0 0 ${WIDTH} ${y}">${parts.join('')}</svg>`
}

function spinners(palette: Palette): string {
  const modes: [SpinnerMode, string][] = [
    ['thinking', 'Thinking'],
    ['tool-use', 'Running a tool'],
    ['responding', 'Writing'],
    ['requesting', 'Waiting'],
  ]
  const items = modes
    .map(([mode, label], i) => place(spinnerIcon(mode, palette.user), i * 180, 4) + text(i * 180 + 28, 19, label, palette.muted))
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="30" viewBox="0 0 ${WIDTH} 30">${items}</svg>`
}

function write(name: string, source: string | Built): void {
  writeFileSync(join(OUT, `${name}.svg`), typeof source === 'string' ? source : source.source)
}

mkdirSync(OUT, { recursive: true })

for (const [theme, palette] of [
  ['dark', noir.palette],
  ['light', noir.light ?? toLight(noir.palette)],
] as const) {
  write(`hero-${theme}`, hero(palette))
  write(`spinners-${theme}`, spinners(palette))
  write(`terminal-${theme}`, terminalSvg({ stdout: ' Test Files  12 passed (12)\n      Tests  148 passed (148)\n   Duration  3.41s', stderr: '', interrupted: false }, false, palette, WIDTH))
  write(`code-${theme}`, codeSvg(['// Rate limit per route, keyed by user', 'export function limit(route: string, perMinute = 60) {', '  const used = new Map<string, number>()', '  return (user: string) => (used.get(user) ?? 0) < perMinute', '}'].join('\n'), 'ts', palette, WIDTH))
  write(`usage-${theme}`, usageSvg([{ label: 'context', percent: 42 }, { label: '5h', percent: 18 }, { label: '7d', percent: 61 }], palette).source)
}

const page = (background: string, theme: string) =>
  `<section style="background:${background};padding:24px;margin:0 0 16px"><h3 style="color:${theme === 'dark' ? '#ededed' : '#151515'};font:600 13px system-ui">${theme}</h3>${['hero', 'spinners', 'terminal', 'code', 'usage'].map(name => `<p><img src="${name}-${theme}.svg"></p>`).join('')}</section>`

writeFileSync(join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>skins previews</title><body style="margin:0">${page('#151515', 'dark')}${page('#ffffff', 'light')}</body>`)

console.log(`wrote previews to ${OUT}`)

# MODZ kit (Tidemark)

The shared drawing kit every MODZ mod uses, implementing [DESIGN.md](../DESIGN.md). This folder is the source of
truth; each mod carries a byte-identical copy in `hooks/kit/`, made by `bin/kit-sync`. Never edit a copy.

```sh
bin/kit-sync filetree secret-guard     # copy into those mods (name under mods/ or .staging/, or a path)
bin/kit-sync                           # refresh every mod that already has hooks/kit
```

The kit is pure: no `$`, no state, no timers (save the render stamp's one counter, below). Svg builders return `{ source, width, height, alt }` (an `SvgPic`)
that spreads into `<Svg {...pic} />`; colours inside are CSS variables for both schemes
(`prefers-color-scheme`), so no hex reaches the markup. Element helpers take `(draw, opts)`, where `draw` is
`{ ui, surface, isLight }` (`DrawCtx`): `ui = $.ui.resolve(e)`, `surface = e.surface`, and `isLight` comes from
`resolveLight`. On the terminal (or any table without `Svg`) they draw glyphs and theme keys instead.

```tsx
import { Card, ButtonRow, Meter, cardInnerWidth } from './kit/ui'
import { resolveLight } from './kit/tokens'

const draw = { ui: $.ui.resolve(e), surface: e.surface, isLight }
const width = cardInnerWidth(e.props.bodyColumns)
return Card(draw, {
  role: 'read',
  header: { icon: 'eye', eyebrow: 'Şu an', meta: '2 dk önce', headline: 'Claude client.ts dosyasını okuyor', width },
  children: [
    Meter(draw, { label: 'Bağlam', value: 0.42, pace: 0.35, width }),
    ButtonRow(draw, { buttons: [{ label: 'Aç', variant: 'primary', onPress: open }] }),
  ],
})
```

Copy is Turkish; labels pass through `toLocaleUpperCase('tr')` (İ stays İ).

## tokens.ts

| Export | Example |
|---|---|
| `palette(isLight)` | `palette(false).roles.read.fg` → `#7FB6E8` |
| `DARK`, `LIGHT`, `ROLES` | `ROLES.map(role => LIGHT.roles[role].tint)` |
| `fileType(name)` | `fileType('src/a.ts')` → `{ kind: 'code', label: 'TS' }` |
| `badgeColors(kind, isLight)` | `<Text color={badgeColors('pdf', isLight).fg}>` |
| `badgePaints(kind)` | `badgePaints('doc')` → `{ fg: 'file-doc', tint: 'file-doc-tint' }` |
| `ROLE_KEY`, `LINE_KEY` | `<Text color={ROLE_KEY.ok}>✓</Text>` (terminal theme keys; meta is `dimColor`) |
| `MOTION` | `` `${MOTION.travelMs}ms ${MOTION.ease}` `` |
| `FONT`, `MONO` | `font-family="${MONO}"` |
| `paintVars(isLight)`, `PAINTS` | `paintVars(true)['read-tint']` → `#E7F0F9` |
| `svgStyle(body?)` | `<style>${svgStyle(body)}</style>`: only the paints `body` names, loops, reduced motion last |
| `resolveLight(hints)` | `resolveLight({ override: await $.env.get('MODZ_THEME'), theme })` (adapted from skins) |

## icons.ts

25 original 24×24 line icons (stroke 1.75 rendered, round caps): trash, shield, key, eye, pencil, check, x, clock,
cube, bookmark, bulb, play, pause, folder, file, branch, terminal, bell, sparkle, list, flag, bolt, gauge, rewind, plug.

| Export | Example |
|---|---|
| `icon(name)` | `` `<g stroke="…">${icon('trash')}</g>` `` |
| `ICON_NAMES`, `ICON_GRID` | `ICON_NAMES.length` → 25 |
| `GLYPH` | `GLYPH.pencil` → `✎` (terminal stand-in) |

## svg.ts (builders; each has a `*Part` twin for composites)

| Builder | Example |
|---|---|
| `textWidth(text, size, weight)` | `textWidth('Mesaj', 13, 600)` → px, measured SF Pro advances |
| `monoWidth`, `fitText`, `wrapText` | `wrapText(s, { max: 300, maxLines: 2, measure: t => textWidth(t, 17, 620) })` |
| `iconTile` | `iconTile({ icon: 'trash', role: 'danger', size: 36 })` (rx 9, tint, 18 px icon) |
| `eyebrow` | `eyebrow({ text: 'Tüm dosyalar', width: 400, hasDot: true, meta: '2 dk önce', hasRule: true })` |
| `headline` | `headline({ text, width: 400, mark: 'yaklaşık $0,45', markRole: 'warn' })` (17/620, ≤2 lines) |
| `bodyPart`, `linesPart` | `bodyPart({ text: sub, width })` (13/400 text.mid) |
| `statTile` | `statTile({ label: 'Token', value: '342k', unit: 'tok', role: 'read', spark: [3, 5, 9] })` |
| `pill` | `pill({ text: '3 geçti', role: 'ok', icon: 'check' })` (h20) |
| `meter` | `meter({ value: 0.62, pace: 0.4, width: 300, label: 'Bağlam' })` (never past 100 %, "dolu") |
| `meterGeometry`, `meterTone`, `percentText` | `meterTone(0.97)` → `'danger'`; `percentText(1.2)` → `'dolu'` |
| `arc` | `arc({ value: 0.35, size: 72, label: 'Bağlam' })` (270°, 20 segments) |
| `stepDots` | `stepDots({ steps: ['done', 'active', 'pending'], caption: '2/3 · Test' })` |
| `stepCircle` | `stepCircle({ n: 3, state: 'current', role: 'plan', rowHeight: 32, hasRailAbove: true })` |
| `fileBadge` | `fileBadge({ name: 'client.ts', activity: 'edit' })` (26×16) |
| `sizeBar` | `sizeBar({ size: 79, total: 286, isStrong: true })` (96×6, share of the total) |
| `sparkline` | `sparkline({ values, role: 'read', width: 96, height: 24 })` |
| `skeleton` | `skeleton({ width: 360, lines: 3 })` (1.4 s shimmer, still under reduced motion) |
| `headerSvg` | `headerSvg({ icon: 'eye', role: 'read', eyebrow: 'Şu an', headline, sub, meta, width })` |
| `statRowSvg` | `statRowSvg({ stats: [{ label: 'Maliyet', value: '≈$0,33' }], width: 600 })` |
| `toPic`, `place`, `TYPE` | `toPic({ body: place(part.body, 8, 0), width, height, alt })` |

## ui.tsx (elements)

| Helper | Example |
|---|---|
| `Card` | `Card(draw, { role, isDanger, header, children })` (round; danger = single + Flare) |
| `HeaderBlock` | `HeaderBlock(draw, { icon: 'clock', role: 'warn', eyebrow: 'Önbellek soğudu', width })` |
| `Eyebrow` | `Eyebrow(draw, { text: 'Tüm dosyalar', meta: 'WEATHER-APP', width })` |
| `ButtonRow` | `ButtonRow(draw, { buttons, isDanger: true })` (one primary; safe gets focus) |
| `Highlight` | `Highlight(draw, { text: 'pnpm', role: 'ok' })` |
| `StatRow` | `StatRow(draw, { stats, width })` |
| `Meter` | `Meter(draw, { value, pace, label, width, cells: 20 })` (terminal `━━━╸┊───`) |
| `Pill` | `Pill(draw, { text: 'Commit', role: 'ok', icon: 'branch' })` |
| `planButtons` | `planButtons(specs, isDanger)` (the pure rules behind ButtonRow) |
| `meterGlyphs` | `meterGlyphs(0.4, 20, 0.7)` → `{ fill: '━━━━━━━╸', rest: '──────', pace: '┊', after: '─────' }` |
| `cardInnerWidth`, `pxWidth`, `isTextSurface`, `toneKey` | `cardInnerWidth(e.props.bodyColumns)` → Svg px inside a card |

## stamp.tsx and same.ts (redraws)

The engine hands out new press handles on every redraw, but the desktop keeps a tree that looks the same as the
one it holds, old handles and all: the first press is refused (`ui_press not handled`) and only the second lands.
Every tree a mod returns with a Button, Input or Select carries a stamp; values that did not change are not written.
Mods that do not vendor the kit carry a byte-identical `hooks/stamp.tsx` (and `hooks/same.ts` where they need it).

| Export | Example |
|---|---|
| `stamped(ui, tree)` | `return stamped(ui, paneTree(ui, view))` (stamp as the root Box's last child, or a column around it) |
| `renderStamp(ui)`, `STAMP_KEY` | `<Box key="render-stamp" display="none"><Text>12</Text></Box>`, a new number each render |
| `isSame(a, b)` | `if (isSame(cards[from], card)) return` (structural, for plain state values) |

## Visual QA

`.staging/kit-gallery` draws every component; `bin/preview .staging/kit-gallery <out>` (and `--theme light`)
renders it. Its `tests/kit.test.ts` checks contrast (WCAG, both themes), meter bounds, text measuring and the
button rules.

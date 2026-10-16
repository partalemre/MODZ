# MODZ kit (Tidemark)

The shared drawing kit every MODZ mod uses, implementing [DESIGN.md](../DESIGN.md). This folder is the source of
truth; each mod carries a byte-identical copy in `hooks/kit/`, made by `bin/kit-sync`. Never edit a copy.

```sh
bin/kit-sync filetree secret-guard     # copy into those mods (name under mods/ or tools/, or a path)
bin/kit-sync                           # refresh every mod that already has hooks/kit
```

The kit is pure: no `$`, no state, no timers (save `pinned`'s map of handles, below). Svg builders return `{ source, width, height, alt }` (an `SvgPic`)
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

## motion.ts, stable.ts and moving.ts (panes in motion)

On the desktop an `isInteractive` Svg is a sandboxed frame the surface keeps while its source is byte-identical and
rebuilds when it changes; a plain Svg is a new `<img>` on every redraw, so its loops restart. `paneMotion()` keeps
each drawing's source per what it shows: its first draw since the pane opened cascades in (45 ms apart, top to
bottom), a changed one sweeps once, an unchanged one keeps its frame and loops. Every source says
`:root{color-scheme:light dark}`, else the frame is painted on an opaque white sheet. A frame swallows clicks, so a
drawing under a press stays a plain Svg. Keep time that ticks (seconds, "2 dk önce" refreshed each tick) out of a
moving drawing unless it really changed: every new source rebuilds the frame and sweeps.

| Export | Example |
|---|---|
| `paneMotion()` | `const motion = paneMotion()` once per pane; `motion.reset()` right before `$.ui.open(...)` |
| `motion.pic(key, pic, opts)` | `<Svg key="head" {...motion.pic('head', pic)} />`; `{ isRow: true }` adds the hover wash |
| `DrawCtx.motion` | `Card({ ui, surface, isLight, motion }, …)`: kit elements move their own Svgs |
| `rings({ cx, cy, r, className })` | under a live dot: rings going out of it, forever |
| `shine({ id, x, y, width, height })` | over a live bar: a light running along it, clipped to the bar |
| `entering`, `delayOf`, `motionCss`, `MOTION_CSS` | a drawing that stages its own pieces (the hub's wordmark) |
| `stableDrawings<T>()` | `kept.draw(key, what, phase => build(phase))`: built again only when `what` changes |

## pin.ts and same.ts (presses that land)

The JSX runtime gives every Button, Input and Select a fresh press handle, and the host releases a drawing's old
handles the moment it redraws. A desktop clicks the tree it last painted, so a click right after any redraw (a
state write, a focus flip, a poll) named a released handle and was dropped (`ui_press not handled`). The host keeps
a handle alive when the next tree carries the same one, so `pinned` gives each element the first handle its site
and key ever got: every tree a surface still holds stays pressable and runs the latest closure. Measured against
the desktop engine over its own control protocol (`tools/desk`). Values that did not change are not written.
Mods that do not vendor the kit carry a byte-identical `hooks/pin.ts` (and `hooks/same.ts` where they need it);
`bin/kit-sync` refreshes those flat copies too.

| Export | Example |
|---|---|
| `pinned(e, tree)` | `return pinned(e, paneTree(ui, view))`, every render hook that draws a Button, Input or Select |
| `isSame(a, b)` | `if (isSame(cards[from], card)) return` (structural, for plain state values) |

## judge.ts

One-shot classification: one of a few labels for a text, or `undefined` when no judgment could be made (the caller
keeps its deterministic default; a judge never throws, blocks or retries). The mod injects the engine's calls. Default
backend: `$.model.complete` with `haiku` on the person's own account, effort low, a 32-token reply, bounded by
`JUDGE_MODEL_TIMEOUT_MS`. TypeSafe Jev (`POST https://api.typesafe.ai/v1/systemone`, a `choice` question, model
`jev-latest`) only when `MODZ_JUDGE=jev` and `TYPESAFE_API_KEY` are both set and the mod passes `fetch`, `sleep` and
`redact`; the text and instructions pass through `redact` first, and the request races `sleep(JUDGE_HTTP_TIMEOUT_MS)`
since `$.http.fetch` takes no timeout. Jev asked for but not usable: the model answers, `isFallback: true`. One call per
judgment. `$.env.get` takes only literal names, so the mod reads the two variables itself.

```ts
const env = { backend: await $.env.get('MODZ_JUDGE'), typesafeKey: await $.env.get('TYPESAFE_API_KEY') }
const io = { complete: r => $.model.complete(r), fetch: (u, i) => $.http.fetch(u, i), sleep: ms => $.clock.sleep(ms), redact, env }
const verdict = (await judge(io, { text, labels: ['allow', 'ask'], instructions: 'Is this command safe here?' }))?.label ?? 'ask'
```

| Export | Example |
|---|---|
| `judge(io, question)` | `await judge(io, { text, labels: ['low', 'high'] })` → `{ label: 'low', source: 'model', isFallback: false }` |
| `JudgeIo`, `JudgeEnv` | `{ complete, env, fetch?, sleep?, redact? }`: Jev needs all of `fetch`, `sleep`, `redact` |
| `JudgeQuestion`, `JudgeAnswer` | `{ text, labels, instructions? }` → `{ label, source: 'model' \| 'jev', isFallback }` |
| `JUDGE_MODEL`, `JUDGE_MODEL_TIMEOUT_MS`, `JUDGE_HTTP_TIMEOUT_MS` | `'haiku'`, 8000, 5000 |
| `JEV_URL`, `JEV_MODEL`, `JEV_BACKEND` | the TypeSafe endpoint, `'jev-latest'`, the `MODZ_JUDGE` value `'jev'` |

Fewer than two labels, a repeated or blank label, a reply naming no label (case and a trailing stop are forgiven), a
failed or aborted call, a non-2xx or non-JSON Jev reply, or a timeout: `undefined`. Tested in
`tools/kit-gallery/tests/judge.test.ts`.

## Visual QA

`tools/kit-gallery` draws every component; `bin/preview tools/kit-gallery <out>` (and `--theme light`)
renders it. Its `tests/kit.test.ts` checks contrast (WCAG, both themes), meter bounds, text measuring and the
button rules.

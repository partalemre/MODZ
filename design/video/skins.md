# Claude Skins — visual spec from video (mod 02)

Source frames: `scratchpad/yt/frames/02-skins/NNN.jpg` (1600×900, one every 2 s).
Timestamp convention: `t = 237 s + (NNN − 1) × 2 s` (001 = segment start).
Frame scale: the desktop recording is zoomed differently per shot. `k` = frame px per CSS px, derived from body-text
cap height (16 px body ⇒ 11.2 px cap). Full-view shots (013–015): k ≈ 1.34. Panel shots (010–011): k ≈ 1.64.
Close-ups (006–008): k ≈ 1.78. CSS sizes below = frame px ÷ k, rounded to a 2/4 px grid.
Orange rounded rectangles/rings drawn around icons, cards and "Show 3 more skins" (007, 010, 013, 014) are the
video editor's call-outs, NOT product UI. Same for the dim/blur "focus" on other regions (008, 009, 012, 013).

---

## 1. Screens and states, in order

| # | t | Best frame | What is shown |
|---|---|---|---|
| S0 | 237 s | 001 | Host on camera (intro). |
| S1 | 239 s | 002 | Title over camera: small orange numeral "02", serif title "Claude Skins", sans subtitle "a new look, same workflow". |
| S2 | 241 s | 003 | Transition: camera shrinks into a squircle with cream glow; background becomes warm black `#1c1b16` with a dot-grid "sound-wave" field. |
| S3 | 243–245 s | 004 (005) | Slide "It reskins how Claude Code shows its work / without really changing your workflow" + terminal promo screenshot in Tokyo Night: tool rows, mini diff, table, spinner, usage band with 3 rings + "Compact"; right column `claude-skins` eyebrow, big "Tokyo Night", command box `> /skin tokyo-night`. Repo `hellosverre/claude-skins`. |
| S4 | 247–249 s | 006 / 007 | Desktop Code tab, close-up of a re-skinned turn: tool row "Run tests and show units source" + pill "✕ 1 failed"; tool row "Edit src/units.js" + pills "1 added", "1 removed", "91 ms"; diff card `src/units.js` "1 line changed"; tool row "Rerun tests" + pill "✓ 3 passed". |
| S5 | 251 s | 008 | Same, focus on the diff card (rest dimmed) — the clean reference for the diff card. |
| S6 | 253 s | 009 | Blur cross-fade to the Skins side panel (Catppuccin selected). |
| S7 | 255 s | 010 | Skins panel: 2×2 skin cards (Noir, Tokyo Night, Dracula, Catppuccin ✓), "Use …" buttons, "In use" ghost, "Show 3 more skins". |
| S8 | 257 s | 011 | After clicking "Use Tokyo Night": Tokyo card gets blue border + check, its button turns into "In use"; Catppuccin back to "Use Catppuccin". Cursor on "In use". |
| S9 | 259 s | 012 | Blur transition to composer: palette image attached, typing "Build m▏". |
| S10 | 261 s | 013 | Full view (k 1.34): sidebar sessions, "Rerun tests ✓ 3 passed", assistant line, usage band (3 rings, Tokyo-blue fill) "5% context used / 20% of 5-hour limit / 43% of 7-day limit", "Compact chat", composer with palette thumbnail + "Build me a skin from this colour palette", footer "+ 🎙 Auto … Opus 5.5 Low". |
| S11 | 263–265 s | 015 (014) | Result: tool row "Make sunset skin" + pill "✓ saved" + "1.1 s"; "Made a sunset skin from your palette and switched to it."; rings re-tinted to Sunset coral; Skins panel shows a 5th card "Sunset" ✓ with "In use". Composer back to placeholder "Type / for commands". |
| S12 | 267–271 s | 016, 017, 018 | Explainer slides: isometric "display" plate over "workflow" plate. 016 "A great first mod / quite safe to start with"; 017 "It only changes the display / and you can customize it to fit your setup"; 018 display plate turns orange with coloured bars. |
| S13 | 273 s | 019 | Host on camera. |

Near-duplicates checked and skipped for detail: 005≈004 (only promo row + command text change), 007≈006
(call-out rings only), 015≈014 (scroll by ~25 px), 017≈016 (headline swap).

---

## 2. Layout breakdown

### 2.1 Tool row (S4/S10/S11) — the core unit
Hierarchy (one horizontal row, vertically centred):
```
[icon disc] gap [Verb (bold, skin colour)] [rest of label (regular, fg)] ……flex…… [pill] [pill] [meta]
```
- Icon disc: 32 px circle (015: 44 frame px; 006: ~56). Fill = skin "surface-tint" (Sunset/Tokyo warm `#38352b`
  for Run, `#372e28` for Edit, `#372029` for Make — i.e. a ~18 % mix of the verb colour into the page bg).
  Glyph 16 px line icon, ~1.5 px stroke, round caps, coloured like the verb but lighter (`#eae2c1`, `#e8b7a0`, `#d57798`).
  Glyphs: Run/Rerun = terminal prompt `>_`; Edit = pencil; Make = paint-brush/sparkle; (promo also: Read = document,
  Bash = `>_`).
- Gap disc→text: 14–16 px.
- Verb: bold/semibold, same size as body (16 px), colour from skin palette (Run/Rerun = yellow, Edit = peach/orange,
  Make = pink). Rest of label regular, near-white fg (`#d8d9e9` Tokyo, `#f4eee4` Sunset). One space between.
- Right cluster: right-aligned to the transcript column edge; gap between pills 8–10 px; meta text ("91 ms", "1.1 s")
  dim gray `#8d8f97`, regular, ~15 px, 8 px left of the last pill.
- Row pitch: 48 px (disc 32 + 16). Transcript column left edge = disc left edge (rows are not indented further).

### 2.2 Status pills ("✕ 1 failed", "1 added", "1 removed", "✓ 3 passed", "✓ saved")
- Height 26 px (015: 35 frame), fully rounded (radius = height/2), padding-x 12 px, no border.
- Text 15 px medium/semibold; optional leading glyph (✕ / ✓) 12 px, 6 px gap.
- Fill = ~20 % tint of semantic colour on page bg; text = light pastel of same hue (palette §3).
- Pills are the only coloured shapes in the row besides the disc → strong scanability.

### 2.3 Diff card (S5 best: 008; also 004 promo, 015)
- Container: transparent fill (= page bg), 1 px border `#3d3d44` (Tokyo) / `#4a4648` (Sunset), radius 12 px,
  full transcript width, overflow hidden (row tints touch the side borders).
- Header row: height ~48 px, padding-x 16 px. Small disc 28 px (edit tint, pencil glyph) → 12 px → file path bold
  near-white `#d8dbf2` → flex → "1 line changed" dim `#8c8d96` regular. 1 px divider below header, colour ≈ border
  but darker (`#2a2a30`).
- Body: monospace 15–16 px, line pitch 28 px (008: 51 frame). Columns: line number (right-aligned, 2 ch, dim
  `#2c2e2d`–`#70726b`) | 16 px | sign column (`−`/`+`, 1 ch) | 12 px | code | flex | right label ("removed"/"added",
  sans 15 px, regular) | 16 px padding.
- Context lines: deliberately de-emphasised — code `#9e9a95` (Sunset) and as low as `#39393b` in the Tokyo close-up,
  i.e. 40–60 % gray, so the 2 changed lines carry all the contrast.
- Removed line: full-width row fill `#30232a`, 3 px left bar `#e982a8`, sign + label pink (`#d489a6`, `#df8fab`),
  code near-white `#d9d6e8`.
- Added line: row fill `#273126`, 3 px left bar `#b2eda9`, sign + label green (`#b5e6af`, `#bbe9b3`), code `#d3dae7`.
  The removed and added lines carry the SAME line number (6) — one-line replacement shown as a pair.
- Promo variant (004): unified gutter with two number columns (old/new), header right shows "+2 −1" in place of
  "1 line changed".

### 2.4 Usage band (S10/S11)
```
(ring) 5%            (ring) 20%              (ring) 43%
       context used         of 5-hour limit         of 7-day limit
[Compact chat]
```
- Three items in a row, column pitch ~170 px (229 frame / 1.34), left aligned with the transcript.
- Ring: Ø 40 px, stroke 5 px, track `#3a3637`, progress arc in skin accent (Sunset `#ec8464`, Tokyo `#7aa2f7`
  family, dimmed in 013 to `#353c4f`). Arc starts at 12 o'clock, runs clockwise, round caps. No text inside.
- Text block 10 px right of ring: value bold 17 px near-white `#faf3e8`; label below regular 14–15 px dim `#989590`.
  The two lines are tight (≈ 1.15 line-height), block vertically centred on the ring.
- Promo variant (004): compact single-line "◔ 72% context  ◔ 18% 5h  ◔ 61% 7d  (Compact)" with 12 px rings.
- "Compact chat": secondary/outline button, height 32–35 px, radius 8 px, 1 px border `#444444`, transparent fill,
  text near-white `#f6f6f1` medium 15 px, padding-x 14 px. Sits 16 px below the band, left aligned.

### 2.5 Skins panel (S7/S8/S11) — right side panel
- Panel bg `#181818` vs transcript `#151515`; 1 px vertical divider `#262626`. Panel padding ~24 px.
- Title "Skins" bold 18 px `#f5f3ef`; 6 px; subtitle "Pick one to recolour tool rows, cards and rings." regular 15 px
  `#8a8b87`; 20 px to grid.
- Grid: 2 columns, column gap 14 px, row gap 18 px (card+button pairs). Card width ~175 px in full view.
- Skin card: radius 14 px, padding 16 px, 1 px border (unselected) = card bg lightened ~12 % (Noir `#484848`,
  Dracula `#3c4050`, Catppuccin `#444050`); card bg = the skin's own background (Noir `#151515`, Tokyo `#1f2235`,
  Dracula `#292b37`, Catppuccin `#252331`, Sunset `#352a28`).
  Content stack: title bold 17 px in skin fg → 12 px → mini row "✎ Edit units.js" → 6 px → mini row ">_ Run tests"
  (glyph 14 px, verb bold in the skin's verb colour, rest skin fg-muted) → 14 px → 6 palette dots.
- Palette dots: Ø ≈ 14 px, centre pitch ≈ 21 px (gap 7), flat fills, no outline. Order = cyan, orange, yellow,
  purple, green, red/pink (Noir = 5 white + 1 red).
- Selected card: border 2 px in skin accent (Tokyo `#84a4ec`, Catppuccin `#c49cf0`, Sunset `#f1835b`) + check badge
  top-right: 24 px filled circle in accent with dark check glyph (`#2b1b42` on purple, `#3d221b` on coral), inset
  16 px from top/right, vertically centred with the title.
- Under each card (8 px gap): full-width button, height 32 px, radius 7 px.
  - Not active → primary light: fill `#ebeae5`, text `#0c0c0e` medium 15 px, label "Use <Skin>".
  - Active → ghost: fill = panel bg, 1 px border `#222222` (barely visible), text `#959594`, label "In use".
- Footer: plain text button "Show 3 more skins" `#8f908c` regular 15 px, 18 px below last row.
- Panel header icons (top-right of window): panel toggle, `>_`, kebab — 18 px, `#494947`.

### 2.6 Composer + attachments (S9–S11)
- Composer: fill `#1f201b` (warm), 1 px border `#42433e`, radius 16 px, padding 16 px; height 60 px empty,
  grows with attachment. Placeholder "Type / for commands" `#878883`.
- Attachment thumbnail: 72×52 px, radius 8 px, 1 px inner border; image = 5 vertical stripes.
- Footer row under composer (outside it): "+", mic, chevron, "Auto" left (`#787976`); "Opus 5.5", "Low" right
  (`#bebfbb`). Not mod UI, but the mod's colours must sit comfortably next to it.
- Sent user message (Sunset skin, 015): outline bubble, transparent fill, 1 px border `#83807b`, radius 10 px,
  padding 10×20 px, text `#f2ece3`.

### 2.7 Session chrome seen around it (not mod UI)
Sidebar `#111111`; selected session row fill `#202020`/`#343434` radius 10 px with coloured status dot; other rows
hollow-circle dots `#4f504e`. Header: session title + tag chip "skins" (fill `#2a2a2a`, text `#7a7b77`, radius 6 px).

### 2.8 Explainer illustrations (S1–S3, S12) — optional hero art
- Slide bg `#1c1b16`; dot grid ≈ 3 px dots, 10 px pitch, `#3a3832`→`#5f5d58` brighter toward the bottom, top edge
  shaped like a soft waveform; host camera in a squircle (radius ≈ 22 % of side) with cream outer glow.
- Headline: transitional serif (Tiempos/Copernicus-like) semibold ~48 px frame, cream `#ebe8db`; sub: geometric
  sans (Outfit/Lexend-like) ~30 px, same cream. Centred over the right 2/3.
- Isometric plates: 2 px cream `#eae8dd` outlines with 1 px dashed vertical guides; active state = orange `#f1601f`
  outline + coloured bars; label "display" in orange, "workflow" with a lock glyph.

---

## 3. Measured palette (hex)

Neutral (desktop Code tab, dark):
| Role | Hex |
|---|---|
| page / transcript bg | `#151515` |
| sidebar bg | `#111111` |
| side panel bg | `#181818` |
| panel divider | `#262626` |
| composer / warm surface | `#1f201b` |
| composer border | `#42433e` |
| fg primary | `#f2ece3` (warm) / `#d8d9e9` (Tokyo cool) |
| fg muted (labels) | `#8a8b87` |
| fg meta (ms, timings) | `#8d8f97` |
| chip / tag bg | `#2a2a2a` |
| light button fill / text | `#ebeae5` / `#0c0c0e` |
| ghost button text | `#959594` |
| outline button border | `#444444` |

Semantic pills (Tokyo/Catppuccin close-up):
| Role | Fill | Text |
|---|---|---|
| failed / removed | `#37282f` | `#d788a4` (peak `#ea9cb6`) |
| added / passed | `#2b392a` / `#2c382c` | `#b7e6b3` (peak `#c9f5c4`) |
| saved (Sunset) | `#2f3527` | `#c2d7a5` |

Diff:
| Role | Hex |
|---|---|
| removed row fill | `#30232a` |
| removed bar | `#e982a8` |
| removed sign / label | `#d489a6` / `#df8fab` |
| added row fill | `#273126` (Sunset `#282c20`) |
| added bar | `#b2eda9` |
| added sign / label | `#b5e6af` / `#bbe9b3` |
| changed code | `#d9d6e8` / `#d3dae7` (Sunset `#ebe8d8`) |
| context code | `#9e9a95` (can drop to `#39393b`) |
| line numbers | `#70726b` (dim to `#2c2e2d`) |
| card border | `#3d3d44` (Sunset `#4a4648`) |
| header divider | `#2a2a30` |

Tool-row verbs and icon discs:
| Role | Verb text | Disc fill | Glyph |
|---|---|---|---|
| Run / Rerun | `#f6ecc6` (Sunset `#f8db96`) | `#38352b` | `#eae2c1` |
| Edit | `#efbba3` | `#372e28` | `#e8b7a0` |
| Make | `#e37096` | `#372029` | `#d57798` |

Rings: track `#3a3637`; fill Sunset `#ec8464`, Tokyo `#7aa2f7`-family (dimmed sample `#353c4f`).

Skin cards (bg / border / title / Edit verb / Run verb / accent):
| Skin | bg | border | title | Edit | Run | accent (selected) |
|---|---|---|---|---|---|---|
| Noir | `#151515` | `#484848` | `#f5f4f4` | `#f6f6f5` | `#f6f5f4` | — |
| Tokyo Night | `#1f2235` | `#2c3c5c`→sel `#84a4ec` | `#cacff3` | `#e9a287` | `#d8b78c` | `#7ba0f0` |
| Dracula | `#292b37` | `#3c4050` | `#fbfefc` | `#efc18f` | `#f8ffb3` | — |
| Catppuccin | `#252331` | `#444050`→sel `#a890cc` | `#d8dbf4` | `#e9b9a7` | `#f9ebcb` | `#c49cf0` |
| Sunset | `#352a28` | sel `#f1835b` | `#faede2` | `#e68e7c` | `#f6d797` | `#f1835b` |

Palette dots (left→right):
- Noir `#eeeeee ×5, #e96271`
- Tokyo Night `#84d4f9 #f49569 #dbae6b #b68ef1 #9fd86d #ed658d`
- Dracula `#8cf3f8 #f6b66e #efff8f #b889f1 #5dff7c #ec4853`
- Catppuccin `#90e3e9 #f3ae85 #f7e1b0 #c49ef1 #abeea1 #e87ea6`
- Sunset `#efb37f #f47f5c #f9d172 #e08dd3 #b8de89 #e84d5f`

Promo panel (terminal, Tokyo Night): bg `#17141f`, border `#343438`, title `#869bdc`, eyebrow `#5a5a6b`,
command text `#aaabbc`, description `#505162`, table head `#494558`.

Video/slide brand: slide bg `#1c1b16`, cream `#ebe8db`, orange `#f1601f` (label `#e26a33`), repo caption `#8c8a80`.

Theme-key mapping for DESIGN.md (which forbids raw hex in mods): failed/removed → `error`, added/passed/saved →
`success`, verbs/accent/rings → skin palette (the skins mod owns its hex palettes by design), meta → `dimColor`.

---

## 4. Motion inferred

- Promo (004→005): tool rows stream in one at a time — the next row appears at ~25 % opacity and settles to 100 %
  within < 2 s; its right meta ("+2 −1 0.4s") appears with it. The command box re-types `/skin dracula` with a
  blinking bar caret → skin switch is command-driven and instant.
- Skin switch (010→011): click "Use Tokyo Night" → selection border + check move to that card, button morphs
  "Use …" ⇄ "In use" (fill → ghost). No layout shift. Implied 150–200 ms colour cross-fade.
- Live re-theme (013→014): after "Make sunset skin", rings, verbs and diff tints in the already-rendered transcript
  change colour in place (Tokyo blue → Sunset coral). New card "Sunset" is appended to the grid, already selected.
- Ring fill is static per render (no spinner); progress would animate as an arc sweep.
- Editorial only: call-out rings draw on (006→007), focus dim/blur (008/009/012), slide cross-fades, isometric
  display plate recolours (017→018).

---

## 5. Interaction model

- `/skin <name>` command and the Skins panel both set the active skin; choice is global and immediate.
- Panel: each card + its button is one choice; primary light button "Use X"; active one shows disabled ghost
  "In use" and the card gets accent border + check. "Show 3 more skins" expands the grid (plain button).
- Custom skin from an image: user attaches a palette image + "Build me a skin from this colour palette" → Claude runs a
  tool row "Make sunset skin" (pill "✓ saved", duration) → skin is saved, appended, and activated.
- Transcript affordances stay the same (workflow unchanged); only colours/icons/cards/rings change.
- "Compact chat" button under the usage band runs compaction.

---

## 6. Build with the drawing API (desktop)

| Part | Build | Notes |
|---|---|---|
| Tool row | `Box flexDirection="row" alignItems="center" columnGap` → `Svg` (disc + glyph, 32×32) → `Text bold color=verb` + `Text color=fg` → `Box flexGrow={1}` → pills → `Text dimColor` meta | Disc must be `Svg` (filled circle + line glyph); a round-border Box can't make a solid circle with centred icon reliably. |
| Status pill | Preferred `Svg` (rounded rect r = h/2, tint fill, text) for exact pill; fallback `Box borderStyle="round" backgroundColor=tint paddingX` + `Text color=pastel` | Box fallback loses full radius and font weight control. |
| Diff card | `Box borderStyle="round" borderColor flexDirection="column"`; header row = `Svg` mini disc + `Text bold` path + spacer + `Text dimColor` "1 line changed"; body = `Code` (diff) | If `Code` can't give per-line tint + 3 px left bar + right "removed/added" label, render the changed-line pair as one `Svg` (mono text, `font-family: ui-monospace`) and keep context lines in `Code`. |
| Usage rings | `Svg` per ring (circle track + `stroke-dasharray` arc, rotate −90°, round caps) + `Box column` with `Text bold` value + `Text dimColor` label | Rings must be Svg. Animate sweep with `isInteractive`. Value size (17 px vs 15 px body) only reachable inside Svg; with Text use bold for hierarchy. |
| Compact chat | `Button variant="secondary" label="Compact chat"` | Matches outline look. |
| Skins panel title/sub | `Text bold` + `Text dimColor` | Title is only slightly larger than body in the video; bold is enough. |
| Skin card | `Box borderStyle="round" borderColor backgroundColor=skin.bg padding flexDirection="column"`; title `Text bold color=skin.fg`; mini rows = small `Svg` glyph + `Text bold`; dots = one `Svg` (6 circles); check badge = `Svg` absolutely positioned (`Box position="absolute" top right`) | Selected border 2 px: Box border is 1 px — compensate with accent colour + check badge, or draw the whole card frame in Svg. |
| Use / In use | `Button` primary (light fill) for "Use X"; `Button plain dimColor` or disabled secondary for "In use" | DESIGN.md allows max one `primary` per panel → use `secondary` for "Use X" and keep the light fill only if the renderer's secondary is light; otherwise accept outline. |
| Show more | `Button plain dimColor` | |
| Promo/explainer art | `Svg` only | Serif headline + isometric plates are illustration, not UI. |

Must be `Svg` to reach video quality: icon discs + glyphs, rings, palette-dot rows, check badges, pills (for true
capsule shape), and any heading bigger than body.

---

## 7. What makes it look premium / weaknesses

Premium details:
1. One accent system per skin, applied everywhere at once (verbs, discs, rings, cards, check badge) — the skin feels
   like a real theme, not a recolour of one widget.
2. Tinted-not-saturated surfaces: pills, discs and diff rows are ~18–20 % tints of their hue on near-black, with
   pastel text — high legibility without neon.
3. Diff card focuses on the change: context code fades to 40–60 % gray, changed pair gets full-width tint + 3 px
   bar + right-aligned word labels ("removed"/"added") instead of colour alone (accessible).
4. Rhythm: 32 px discs on a 48 px row pitch, consistent 12/14/16 px radii, every right cluster aligned to the same
   edge; numbers right-aligned in pills with consistent capsule height.
5. Live preview cards: each skin card shows its own background, two real tool rows and a 6-dot palette, so choosing
   is visual, with a clear selected state (accent border + filled check) and a button that reads its state.

Weaknesses:
- "In use" ghost button is very low contrast (`#959594` on `#181818`, border almost invisible) — weak affordance.
- Context-line dimming down to `#39393b` (Tokyo close-up) fails contrast; keep ≥ `#8a8a8a`.
- Colour-only verb distinction inside cards; Noir palette is 5 identical whites (dots carry no information).
- Ring values lack units in-ring and the three labels have uneven lengths, so columns look ragged.
- Panel width forces 2 columns; long skin names ("Tokyo Night") nearly collide with the check badge.

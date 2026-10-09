# Replay Theater — visual spec from video (mod 09)

Source frames: `scratchpad/yt/frames/09-replay/NNN.jpg` (1600×900, one every 2 s; scratchpad =
`/private/tmp/claude-501/-Users-partalle-Projects-MODZ/70292652-cd27-4e0b-9f15-f1788c692c87/scratchpad`).
Timestamp convention: `t = 609 s + (NNN − 1) × 2 s` (001 = segment start).
Frame scale `k` = frame px per CSS px, from body-text cap height (16 px body ⇒ 11.2 px cap):
full app view 005 k ≈ 1.60 · 014 k ≈ 1.79 · card close-up 006 k ≈ 2.05 · pane close-ups 007, 008, 010, 015–017
k ≈ 1.96. CSS sizes below = frame px ÷ k, rounded to a 2 px grid.
Editorial effects that are NOT product UI: orange rounded call-outs (006 around "Replay edits", 009 around the list,
010 and 017 around the diff), the orange marker swipe + location-pin over the context line in 017, blur/dim focus
(009), the "Replay Theater" label on the tweet (004), and the filmstrip slides (011–013).

---

## 1. Screens and states, in order

| # | t | Best frame | What is shown |
|---|---|---|---|
| S0 | 609 s | 001 | Host on camera; orange pixel numeral "09" assembling from particles. |
| S1 | 611 s | **002** | Title over camera: "09" (orange pixel font), serif "Replay Theater", sans "step through every edit". |
| S2 | 613–615 s | 003 → **004** | Tweet by @ClaudeDevs: "…records every file edit Claude makes in a turn. Run /replay to step through the diffs one at a time in a docked pane." Thumbnail = Anthropic's original **light** sample: magenta "▶ Replay Theater", "step 1 of 5", step chips 1–5 (active filled teal), teal file path, "Edit +1 −1", two diff lines, buttons "◀ Prev [p]", "Next ▶ [n]", "Close [c]" with hotkey hints. |
| S3 | 617 s | **005** | Desktop Code tab, session "Greet to welcome" (tag `replay-app`). User: "Rename the greet function to welcome in every file here…". Transcript: four rows "**Edited** README.md +1 −1 / greet.js / cli.js +2 −2 / index.js", summary with inline code chips and bullets; orange spinner asterisk. |
| S4 | 619 s | **006** | Turn finished → **inline card** above the composer: play disc, eyebrow "REPLAY THEATER", title "4 edits ready to replay", "**Claude:** I renamed greet to welcome in all 4 files, using the Edit tool on each one.", files "README.md · greet.js · cli.js · index.js". Below: light button **Replay edits** (cursor on it) + "or type /replay". |
| S5 | 621 s | **007** | Docked pane open (right ~half of this zoomed view). Summary "4 edits in 4 files" / "6 lines added, 6 removed"; eyebrow "THE EDITS, IN ORDER"; timeline list 1 README.md (selected, magenta) · 2 greet.js in src · 3 cli.js in src · 4 index.js in src, each with +N −N; divider; **EDIT 1 OF 4**, "README.md", "README.md, project root · Edit"; diff `−` `greet(name)` / `+` `welcome(name)` with word highlights; legend Removed / Added / Changed word / Unchanged; buttons **Previous edit** (outline) **Next edit** (light). |
| S6 | 623 s | **008** | Stepped to the last edit: rows 1–3 show gray ✓ discs, row 4 selected; **EDIT 4 OF 4** "index.js", "src/index.js · Edit"; diff with two hunks separated by a blank spacer row: `import { greet } from './greet.js';` → `welcome`, `console.log(greet('station'));` → `welcome`. |
| S7 | 625–627 s | 009, **010** | Editorial focus on list, then diff (010 = largest view of the multi-hunk diff). |
| S8 | 629–633 s | 011–013 | Explainer slides: "Made for code / originally created by Anthropic" (filmstrip of 3 code frames, orange playhead); "Not just for code / not limited to that use case" (frames with pencil icons). |
| S9 | 635 s | **014** | Second demo (k 1.79): session "Tighten my draft" (`coffee-blog`), three "Edited draft.md" rows (+1 −1, +2 −3, +1 −1), summary, inline card "3 edits ready to replay" with a 2-line Claude quote and single file "draft.md"; button + hint. |
| S10 | 637–639 s | **015**, 016 | Pane: "3 edits in 1 file" / "4 lines added, 5 removed"; three rows all "draft.md" (no folder hint = project root); **EDIT 1 OF 3**; prose diff: `Cold brew is what a lot of people like.` → `Cold brew is smoother than iced coffee.` with one continuous phrase highlight per side. |
| S11 | 641 s | **017** | **EDIT 2 OF 3**: row 1 ✓, row 2 selected. Diff shows an unchanged context line `## How to make it` (dim, no sign) then 3 removed lines and 2 added lines, no word highlight (whole lines differ). |

Not shown in the video: an "EDIT 2 OF 4" state of the first demo. By the pattern it is: row 1 ✓ gray disc, row 2
selected (magenta disc "2", tinted row), rows 3–4 hollow numbered discs; eyebrow "EDIT 2 OF 4", title "greet.js",
sub "src/greet.js · Edit".
Near-duplicates checked: 016≈015 (1–2 px scroll), 003 (blur transition), 012 (blur transition).

---

## 2. Layout breakdown

### 2.1 Inline "ready to replay" card (S4, S9) — directly above the composer
```
┌───────────────────────────────────────────────────────────────────────────────┐  bg #1f201b, 1 px #2e2f2a, r 10
│ (▶)  REPLAY THEATER                                                            │  pad 16 top / 15 left
│ 28   4 edits ready to replay                                                   │
│      Claude: I renamed greet to welcome in all 4 files, using the Edit tool…   │
│      README.md · greet.js · cli.js · index.js                                  │
└───────────────────────────────────────────────────────────────────────────────┘
  9
[ Replay edits ]  15  or type /replay
  11
[ composer … ]
```
- Left edge = composer left edge; right edge ≈ 30 CSS short of the composer's right edge (014: card 400–1503 vs
  composer 400–1558 frame px), i.e. transcript text width. Height grows with the quote (2 lines in 014).
- Play disc: 28–30 CSS circle, fill `#3c2833` (magenta at ~18 % on the card), solid play triangle ≈ 11 CSS
  `#d959a4`, optically shifted ~1 px right. Top-aligned with the eyebrow/title pair.
- Text column starts 11 CSS right of the disc. Rhythm (CSS): eyebrow → title 8, title → quote 9, quote → files 12.
- Eyebrow "REPLAY THEATER": ≈ 12 CSS, bold, uppercase, letter-spacing ≈ 0.08 em, `#d168a5`.
- Title: ≈ 17 CSS semibold `#f2f3ee` ("N edits ready to replay").
- Quote: ≈ 15 CSS; "Claude:" semibold `#dadad4`, rest regular `#a5a6a0`; wraps.
- Files: ≈ 14 CSS regular `#767771`, basenames joined by " · " in edit order (deduplicated: "draft.md").
- Button "Replay edits": primary light pill-rect 105×34 CSS, r ≈ 6, fill `#ebeae5`, label `#0c0b07` semibold,
  padding-x 16. Hint "or type /replay" regular `#8f8f8c`, 15 CSS to the right, vertically centred.

### 2.2 Docked pane (S5–S7, S10, S11)
Pane bg `#171813`, 1 px left divider `#2c2c2a`; padding-left 22 CSS, padding-right 24 CSS. Single column:
```
4 edits in 4 files                       ← H1 ≈ 17 semibold #f5f4ee
6 lines added, 6 removed                 ← ≈ 16 semibold; green part #92d697, red part #d47d7e
   20
THE EDITS, IN ORDER                      ← eyebrow ≈ 12 semibold uppercase, tracking 0.08 em, #7b7b76
   10
(1) README.md                     +1 −1  ← selected row
 │
(2) greet.js   in src             +1 −1
 │
(3) cli.js     in src             +2 −2
 │
(4) index.js   in src             +2 −2
   16
──────────────────────────────────────── ← 1 px #2e2f2a
   17
EDIT 1 OF 4                              ← ≈ 12 bold uppercase, tracking 0.1 em, #cf6ba4
   12
README.md                                ← ≈ 16 semibold #f3f3ee
README.md, project root · Edit           ← ≈ 14 regular #a7a7a1   (path or "<name>, project root") · tool name
   10
┌ diff box ──────────────────────────────┐
   14
□ Removed  □ Added  ▮ Changed word  □ Unchanged
   12
[ Previous edit ] 17 [ Next edit ]
```
- **Timeline rows**: pitch ≈ 32 CSS; row height 28 CSS; full content width; selected row fill `#35212c`
  (magenta ~12 % on pane), r ≈ 7 CSS; unselected rows transparent. Row padding-left 6 CSS, right 8 CSS.
  - Disc 20 CSS: *pending* = 1 px ring `#353631`, number `#a8a8a3` regular; *current* = filled `#d858a6`, number
    `#2c0216` bold; *visited* = filled `#3a3934`, check `#a5a49f` (≈ 10 CSS, 1.5 px round stroke).
  - Connector: 1 px vertical `#353631` through disc centres, drawn only in the gaps between discs (rail behind the
    list).
  - Filename 10 CSS after the disc, ≈ 15 CSS; current = bold `#f9f1f3`, others regular `#d9d8d3`.
  - Folder hint " in src" ≈ 13 CSS `#71726c`, 14–16 CSS after the name; omitted for project-root files.
  - Right: `+1` `#8ec691` and `−1` `#c37377` (true minus U+2212), 8 CSS apart, right-aligned, regular.
- **Diff box**: 1 px border `#33342f`, r ≈ 6 CSS, inner bg `#1a1c19`, padding-y 6 CSS, no header, no line numbers.
  - Rows 20 CSS tall, tint spans the full inner width: removed `#362422`, added `#233425`; context (unchanged) rows
    use the box bg with dim text `#757671` and no sign.
  - Sign column 12 CSS from the box edge: `−` `#cf767b`, `+` `#8ad491`; code starts 15 CSS after the sign.
  - Code: monospace ≈ 14 CSS (Cascadia/JetBrains-Mono-like), near-white on tints (`#faf1ed` on removed, `#f1f6eb`
    on added), no syntax colouring.
  - **Changed-word highlight**: rounded (r ≈ 2–3 CSS) background behind exactly the changed span, inset ~1 CSS
    from row top/bottom: removed `#723636`, added `#39683f`. Span = token in code (`greet` → `welcome`, inside
    backticks/braces/parentheses) or the whole changed phrase in prose incl. punctuation ("what a lot of people
    like." → "smoother than iced coffee."). No highlight when entire lines are replaced (017).
  - Hunks: removed lines grouped above added lines; separate hunks divided by one blank 20 CSS spacer row (008).
- **Legend**: swatch 12 CSS square, r 2, 1 px border; label ≈ 14 CSS `#a4a59e`, 6 CSS after swatch; items 16 CSS
  apart, one line. Removed = fill `#35211e` border `#7e5857`; Added = fill `#213022` border `#5a785c`; Changed word =
  borderless split swatch, left half `#61312d`, right half `#325833`; Unchanged = empty, border `#2d2e29`.
- **Buttons**: left-aligned, height 35 CSS, r ≈ 6. "Previous edit" = secondary/outline: transparent, 1 px `#3a3b36`,
  label `#91918b` semibold, ≈ 117 CSS wide (looks disabled on edit 1). "Next edit" = primary/light: fill `#ebeae5`,
  label `#0a0a0a` semibold, ≈ 91 CSS wide. Gap 17 CSS. Labels ≈ 16 CSS.

### 2.3 Typography
UI sans (Segoe-/Inter-like) + one monospace for code. Hierarchy by weight/colour/case more than size:
H1 ≈ 17 semibold › edit title ≈ 16 semibold › body/filenames ≈ 15 › meta ≈ 13–14 › eyebrows ≈ 12 uppercase
bold, wide tracking (gray for structural "THE EDITS, IN ORDER", magenta for "where you are" "EDIT 1 OF 4" /
"REPLAY THEATER"). Counts use real minus `−`.

### 2.4 Iconography
Play triangle (solid), check (round 1.5 px stroke), numbered discs, swatches — all geometric, no outline icon set.
Transcript (host) uses bold "Edited" + gray filename + coloured counts; the mod mirrors that vocabulary.

### 2.5 Host context (not mod UI)
Page `#151515`, sidebar `#111111`, composer `#1f201b`, user bubble `#2a2b26`, tag chip `#2a2b26`/`#8c8d87`,
transcript "Edited" `#d4d4cf`, filename `#8d8e8a`, +N `#8ebe93`, −N `#ad7376`, inline code chip bg `#291e1c` text
`#bf8a8b`.

### 2.6 Explainer illustrations (S8) — optional
Slide bg `#1c1b16` with halftone dots; serif cream headline `#e9e7da`; filmstrip: 2 px cream `#cecbbe` frame with
16 sprocket squares top and bottom, three frames (cream outline, gray lines, one orange `#f06120` line + `</>` or
pencil glyph); active frame orange outline; orange triangular playhead with stem above. Anthropic wordmark under it.

---

## 3. Measured palette (hex)

| Role | Hex |
|---|---|
| pane bg | `#171813` |
| pane divider | `#2c2c2a` |
| card bg / border | `#1f201b` / `#2e2f2a` |
| text primary (H1, titles) | `#f5f4ee` / `#f3f3ee` / `#f2f3ee` |
| text secondary (sub, quote) | `#a7a7a1` / `#a5a6a0` |
| text muted (files, eyebrow gray, folder hint) | `#767771` / `#7b7b76` / `#71726c` |
| filename (unselected / selected) | `#d9d8d3` / `#f9f1f3` |
| accent magenta (eyebrows) | `#cf6ba4` / `#d168a5` |
| accent magenta (disc, play triangle) | `#d858a6` / `#d959a4` |
| number on magenta disc | `#2c0216` |
| selected row tint | `#35212c` |
| play disc tint | `#3c2833` |
| ring / connector | `#353631` |
| pending number | `#a8a8a3` |
| visited disc / check | `#3a3934` / `#a5a49f` |
| divider (hr) | `#2e2f2a` |
| added text (totals / counts) | `#92d697` / `#8ec691` |
| removed text (totals / counts) | `#d47d7e` / `#c37377` |
| diff box border / bg | `#33342f` / `#1a1c19` |
| removed row / word | `#362422` / `#723636` |
| added row / word | `#233425` / `#39683f` |
| − sign / + sign | `#cf767b` / `#8ad491` |
| code on removed / added | `#faf1ed` / `#f1f6eb` |
| context line text | `#757671` |
| legend label | `#a4a59e` |
| legend removed fill/border | `#35211e` / `#7e5857` |
| legend added fill/border | `#213022` / `#5a785c` |
| legend changed (L/R) | `#61312d` / `#325833` |
| legend unchanged border | `#2d2e29` |
| primary button fill / label | `#ebeae5` / `#0a0a0a` |
| secondary button border / label | `#3a3b36` / `#91918b` |
| hint text ("or type /replay") | `#8f8f8c` |

Theme-key mapping for DESIGN.md: added → `success`, removed → `error`, magenta accent → the mod's single accent
key (closest available, e.g. `suggestion`/`claude`), grays → `dimColor`. Diff tints may stay hex inside Svg.

---

## 4. Motion inferred

- 005 → 006: when the turn ends, the inline card + button appear above the composer (no spinner state of its own).
- 006 → 007: clicking "Replay edits" opens the docked pane on the right; the transcript reflows narrower (pane slides
  in from the right, ~200 ms ease-out implied).
- 007 → 008 and 015 → 017: stepping. The selected tint jumps to the next row, the previous disc swaps number → ✓,
  the eyebrow count, title, sub and diff swap together. No intermediate frames → a quick cross-fade (≈ 120–150 ms)
  of the edit section and a slide of the row tint is enough; list does not scroll for ≤ 6 items.
- No idle animation (no shimmer, no pulsing) — the pane is calm; motion only on user action.

---

## 5. Interaction model

- Entry points: the inline card's **Replay edits** button, or the `/replay` command (hint shown next to the button).
- Pane: rows are clickable (jump to that edit; visited ones become ✓). Previous / Next buttons step through edits;
  the original sample binds hotkeys `p` / `n` and `c` (close) — keep them. Previous looks disabled on edit 1;
  on the last edit Next should become disabled or turn into "Close"/"Done" (not shown).
- The edit section always shows exactly one edit; the summary + list stay pinned above it.
- The card describes the turn (Claude's final sentence + touched files) so the user knows what will be replayed.

---

## 6. Build with the drawing API (desktop)

| Part | Build | Notes |
|---|---|---|
| Inline card | `Box borderStyle="round" borderColor="#2e2f2a" backgroundColor="#1f201b" padding flexDirection="row" columnGap` → `Svg` play disc 28×28 → `Box column` [eyebrow, `Text bold` title, `Text` (`Text bold` "Claude:" + `Text dimColor` quote), `Text dimColor` files] | Play disc must be Svg (tinted circle + triangle). |
| Eyebrows | `Svg` text (`letter-spacing:.08em; font-weight:700; text-transform:uppercase`) or `Text bold color=accent` with uppercase string | Tracking is only possible in Svg; Text fallback loses the spaced-caps look. |
| Replay button row | `Box row alignItems="center" columnGap` → `Button variant="primary" label="Replay edits" hotkey="r"` + `Text dimColor` "or type /replay" | |
| Summary | `Text bold` H1 (or `Svg` text for the larger size) + row: `Text bold color=success` + `Text bold color=error` | |
| Timeline row | `Box row alignItems="center" columnGap backgroundColor={selected ? tint : undefined} borderStyle="round" (borderColor = tint) paddingX hover={{backgroundColor:"#1f2019"}}` → `Svg` 20×32 disc + rail segments → `Text bold?` filename → `Text dimColor` "in src" → `Box flexGrow` → `Text color=success` "+1" → `Text color=error` "−1"; onClick → jump | Disc + connector must be Svg (draw top/bottom half-rail segments per row so the rail is continuous across rows; hide top on first, bottom on last). |
| HR | `Box height={1} backgroundColor="#2e2f2a"` | |
| Edit header | eyebrow (as above, magenta) + `Text bold` title + `Text dimColor` "path · Edit" | |
| Diff | Preferred: `Code` with diff language if it supports per-line tints and intra-line highlights. Otherwise **one `Svg`**: rounded box, row `<rect>` tints, sign + `<text font-family=ui-monospace>` with `<rect rx=3>` behind changed spans (measure with fixed char width) | Text+Box fallback: `Box column` of rows (`Box backgroundColor=tint`), `Text color=sign`, code `Text` segments with `backgroundColor` for changed words — exact, but not monospace unless Text renders mono. |
| Legend | `Box row columnGap` of (`Svg` 12×12 swatch + `Text dimColor` label); "Changed word" swatch = Svg with two half rects | |
| Nav buttons | `Button variant="secondary" label="Previous edit" hotkey="p"` + `Button variant="primary" label="Next edit" hotkey="n"` | Disable Previous on first, Next on last. DESIGN.md: one primary per pane — Next is it. |

Must be `Svg` for video quality: play disc, numbered/check discs + rail, spaced-caps eyebrows, legend swatches,
and the diff if `Code` cannot do row tints + rounded intra-line highlights.
Terminal fallback: list rows `› 1 README.md  +1 −1` with `●` current / `✓` visited / `○` pending; diff via `Code`.
Turkish strings per DESIGN.md: "4 dosyada 4 düzenleme", "6 satır eklendi, 6 silindi", "DÜZENLEMELER, SIRAYLA",
"DÜZENLEME 1 / 4", "Önceki", "Sonraki", "Düzenlemeleri oynat", "ya da /replay yaz".

---

## 7. What makes it look premium / weaknesses

Premium details:
1. **Stepper timeline**: numbered discs on a thin rail, three clear states (pending ring → magenta current →
   gray ✓ visited) plus a soft tinted row — you always know where you are and where you've been.
2. **Two-level diff colour**: muted row tints with a stronger rounded highlight on exactly the changed word/phrase,
   near-white code, no syntax noise — the change pops instantly, for code and prose alike.
3. **One accent with a job**: magenta only marks "you are here" (eyebrows, current disc, row tint, play disc);
   green/red only carry data (+/− counts, totals, diff). Everything else is warm gray.
4. **Summary-first hierarchy**: big count line + coloured totals, spaced-caps section eyebrows, a hairline divider
   between overview and detail; generous but consistent 10/16/20 CSS rhythm.
5. **Bridge from transcript**: the inline card (eyebrow + title + Claude's own sentence + file list) and a single
   light primary button with a command hint make the feature discoverable without opening anything automatically.

Weaknesses:
- Previous button at step 1 is only "dim", not clearly disabled; secondary label `#91918b` is low contrast.
- File name repeats three times (row, title, sub-line); the sub-line's "· Edit" tool name adds little.
- No line numbers or surrounding context in most edits — hard to locate the change in the file.
- Legend costs a full line every step and the "Unchanged" swatch is nearly invisible (`#2d2e29` on `#171813`).
- Magenta accent is unrelated to the Claude orange used by the host and other mods; selected-row tint `#35212c`
  is very low contrast against `#171813`.
- No visible hotkey hints in the redesigned pane (the original sample showed `[p] [n] [c]`).

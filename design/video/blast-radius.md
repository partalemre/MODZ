# Blast Radius — video spec (Mod 6, 495–545 s)

Source: `scratchpad/yt/frames/06-blast/NNN.jpg`, 1600×900, one frame every 2 s.
Timestamp = 495 s + (NNN − 1) × 2 s. Anthropic sample mod, shown in the **desktop Code tab, dark theme**.

**Read this first: scale and editor overlays**
- The recording is zoomed in post. All px below are **frame px at 1600 wide**; "≈ CSS" divides by the
  estimated zoom: **frames 007–011, 021, 024–025 ≈ 2.0×** (checked three ways: mono advance 18.5 px/char ≈ 15 px
  font at 0.6 em, body x-height 15 px ≈ 14 px Inter-like font, button 71–73 px ≈ 36 px). Frame 005/022/023 ≈ 1.8×.
- Things that are **video-editor overlays, not UI** (do not build them): the glowing orange outline rings
  (`#da6b3e`, ~3 px + outer glow) around `$ rm -rf build`, `9 files · 286 KB`, `Delete 9 files`, `Cancel`;
  the orange "marker" sweeps behind text (`#5e2e18`–`#75391c`); the ~50 % darkening of the card in 009–011/021
  (a spotlight on the button row); the blur cross-fades (003, 020); the webcam bubble; all of 002, 004, 012–019.
- Uncertain: the darker transcript column while the pane is open (`#0f0f0f` vs normal `#151515`) may be a host
  scrim or the editor. The red strikethrough in 024–025 is drawn with exact UI danger red and dims row text
  but not bars/icons, so it is very likely real UI (see §4).

---

## 1. Screens and states (in order)

| # | Time | Best frame | State | Notes |
|---|------|-----------|-------|-------|
| 0 | 495 | 001 | Talking head | — |
| 1 | 497 | 002 | Editor title card "06 / Blast Radius / it stops before anything gets deleted" | orange pixel-font "06", serif title, geometric sans subtitle; not UI |
| 2 | 501 | 004 | B-roll "Made by Anthropic" (folder + orange shield-check) | not UI |
| 3 | 503–505 | **005** (006 = same + overlay) | **Transcript, tool held.** User bubble "The build folder is stale. Run exactly this, nothing else: rm -rf build". Assistant line "Deleting the stale build folder"; "Running 1 shell command… `$ rm -rf build`"; coral asterisk spinner + "Running…" | host UI, before the pane opens |
| 4 | 507–509 | **007** (008 = overlays) | **Pane open — top of card.** Danger tile + headline, red banner, separator, folder group `build/assets/` (6 files, 234 KB) with 5 file rows, folder `build/assets/fonts/` (1 file, 47 KB) + `inter-var.woff2`. Transcript (left) status now "…Waiting on you…" | the mod |
| 5 | 511–515, 535 | **021** (cleanest), 009–011 | **Pane — bottom of card + footer.** Rows, overflow row `+ 3 more files · 6.3 KB`, card ends; below: plain "Show 3 more", primary **Delete 9 files**, secondary **Cancel**, dim "Held by Blast Radius" | cursor parked on Delete |
| 6 | 517–531 | 012–019 | B-roll (agent → folder, Opus/Fable chips, "Blast Radius" chip with red trash icon in 019) | 019 shows the mod's identity chip: small dark pill, 16 px red trash tile + "Blast Radius" |
| 7 | 537 | 022 | **Pane gone, tool ran.** "Ran 1 shell command `$ rm -rf build`", reply fading in | host UI |
| 8 | 539 | **023** | Reply: "I ran `rm -rf build` and it finished without errors, so the stale build folder is gone." | host UI (orange highlight = editor) |
| 9 | 541–543 | **024** (025 = overlay on Delete) | **Struck-through state.** Every *file* name and the overflow line get a red line-through and dim to ~50 %; folder rows untouched; buttons still visible | edited back in after #8; in real time it sits between the click and the pane closing (or is a hover preview — §4) |

---

## 2. Layout breakdown

### 2.1 Placement
- Right-side **Pane** (not the band). Pane left edge = 1 px divider `#1b1c17` at x=525 (frame 007). Pane bg `#10110c`.
- Inside the pane, an **outer sheet** `#171813`: starts 14 px (≈7 CSS) right of the divider, top at y≈107 (just under
  the app header row), corner ≈17 px (≈8 CSS), runs down past the action row (bottom at y≈717 in 024) and ends
  ~16 px from the right window edge. The card *and* the footer sit inside this sheet.
- No pane title bar. The card is the first thing in the pane.

### 2.2 The card
| Property | Frame px | ≈ CSS |
|---|---|---|
| Box | x 554→1571 (1017 w), top 120 | ~508 w |
| Inset from sheet | 14 left, 13 top | 7 / 6–7 |
| Border | 2 px `#2d2e29` | 1 px |
| Radius | ≈29 | **14** |
| Background | `#1f201b` | |
| Padding | 42 left/top, 41 right, ~56 below last line | **20–21**, bottom ~24 |

### 2.3 Header block (tile + headline)
- **Danger tile:** 76×77 at (596,162). Radius ≈22 (≈11 CSS). Fill `#3c292a` (red-tinted dark). Size ≈ **38 CSS**.
  Icon: Lucide-style `trash-2` (lid, handle, body, two inner vertical strokes), outline, stroke ≈3 frame (≈1.5–2 CSS),
  round caps/joins, 35×36 frame (≈**18 CSS**), colour `#e46d72`, centred.
- **Headline line 1**, x=703 (gap 31 frame ≈ **15 CSS** after the tile), baseline ≈194:
  - `rm -rf build` — **monospace bold**, `#f6f6f3` (x-height 19 frame; ≈15–16 CSS).
  - ` will delete ` — sans regular, `#ababa5`.
  - `9 files · 286 KB` — sans **bold**, danger `#e47177` (cap height 26 frame; ≈17–18 CSS). Middle dot `·` with
    normal spaces.
  - Line reads as one sentence; the command is the subject, the count is the payload.
- **Line 2:** `in demo-app` sans regular `#acaba6` (≈14 CSS), baseline ≈239 (line pitch 45 frame ≈ 22 CSS).
- Text block (168→244) is vertically centred on the tile (162→239), within ~4 px.

### 2.4 Danger banner
| Property | Value |
|---|---|
| Box | x 594→1533 (full content width), y 275→359 → 84 frame tall (≈**42 CSS**) |
| Gap above | 31 frame (≈15 CSS) from line 2 |
| Radius | ≈23 frame (≈**11–12 CSS**) |
| Border | 2 frame (1 CSS) `#553b3c` (measured `#4a2d2f`–`#57393b`) |
| Fill | `#342623` |
| Icon | Lucide `shield-alert` (shield outline + "!"), 28×32 frame (≈14×16 CSS), stroke ≈1.5 CSS, `#eea4a5`, inset 33 frame (≈16 CSS) |
| Text | "None of these are tracked by git, so they can't be restored." sans regular, `#eaa6a7`, body size, x=679 (gap ≈12 CSS after icon), vertically centred |

The banner is **conditional**: it says *why* this delete is dangerous (untracked → unrecoverable). A tracked tree
should show a calmer variant (e.g. neutral banner "All 9 files are tracked by git; restore with `git checkout`").

### 2.5 Separator
1 CSS px line `#282924` (frame 392–394), full content width (596→1530), 34 frame (≈17 CSS) under the banner,
45 frame (≈22 CSS) above the first folder row.

### 2.6 File tree
Four columns, all rows share them (frame 007 x positions):

| Column | Folder row | File row |
|---|---|---|
| Icon | Lucide `folder` outline 33×26 at x=599, `#abaca6` | Lucide `file` (dog-ear) outline 23×30 at x=645 (**indent +46 frame ≈ 23 CSS**), `#7b7c76` (dimmer) |
| Name | x=653 (gap ≈10 CSS), **semibold** `#f8f8f5`, path with trailing slash `build/assets/` | x=690, regular `#e5e5e1`, basename only |
| Count | `6 files` / `1 file` right-aligned at x≈1163, regular `#ababa5` | — (empty) |
| Size | `234 KB` right-aligned at x=1311, **semibold** `#f6f6f1` | `79 KB` right-aligned at x=1311, regular `#acaca7` |
| Bar | x 1338→1530 (192 frame ≈ **96 CSS**), 13 frame tall (≈**6 CSS**), pill ends | same geometry |
| Bar fill | `#d9d4ce` (bright) | `#8e8b86` (mid grey) |
| Bar track | `#2d2e29` | `#2d2e29` |

- **Bar scale is global**: every bar = size ÷ **total delete size** (286 KB), not ÷ largest row.
  Checked: 234→81 %, 79→27.6 %, 47→16.4 %, 26→9.1 % (all ±1 px). Linear, no minimum except the pill cap.
- **Rhythm:** row pitch 55 frame (≈**27–28 CSS**); folder→first file 58; last file→next folder 73 (≈36 CSS, i.e.
  one extra ~9 CSS group gap). No row separators, no zebra.
- **Sorting:** groups by size desc (234, 47); files within a group by size desc (79, 63, 35, 29, 26).
- **Capping:** only 6 file rows are drawn (5 + 1). Folder headers keep their *true* totals (`build/assets/` says
  6 files / 234 KB while showing 5 = 232 KB). The remainder becomes one global line:
  **`+ 3 more files · 6.3 KB`**, regular muted `#abaca6`, left edge aligned with the **folder icon** (not the file
  icon), no bar, ~1 row pitch below the last file. Sum check: 279 + 6.3 ≈ 286 KB.
- Numbers use the same proportional sans (no tabular mono); right alignment hides the width differences.

### 2.7 Footer (outside the card, inside the sheet)
| Element | Geometry (frame 024) | Look |
|---|---|---|
| `Show 3 more` | x=590 = card left edge; 30 frame (≈15 CSS) below the card | **plain button**, medium/semibold, `#aaaba5`, no box |
| Action row | top 632, 28 frame (≈14 CSS) below "Show 3 more"; left = card left | — |
| **Delete 9 files** (primary) | 229×71 frame (≈**115×36 CSS**), radius ≈17 (≈**8 CSS**), padding-x 33 (≈16 CSS) | fill `#ebeae5`, label `#060603` semibold. No border, no glow in the clean frame 021 |
| **Cancel** (secondary) | 145×69, gap 33 (≈16 CSS) after primary | transparent on sheet `#171813`, 1 CSS border `#353631`, label `#f7f8f2` semibold |
| `Held by Blast Radius` | x=1031, 36 frame (≈18 CSS) after Cancel, centred on the row | plain text regular `#abaca6` — attribution of who is holding the tool call |

The primary label repeats the consequence with the number ("Delete **9 files**"), never "OK/Proceed".

### 2.8 Typography hierarchy
Sans renders like Inter/Segoe-class neo-grotesk; mono like Consolas/ui-monospace. Relative sizes (body = 1.0 ≈ 14 CSS):

| Role | Size | Weight | Colour | Case |
|---|---|---|---|---|
| Headline command | ~1.1 (mono) | bold | `#f6f6f3` | as typed |
| Headline count | ~1.25 | bold | `#e47177` | sentence |
| Headline glue "will delete" | ~1.25 | regular | `#ababa5` | sentence |
| Context "in demo-app" | 1.0 | regular | `#acaba6` | — |
| Banner text | 1.0 | regular | `#eaa6a7` | sentence |
| Folder name / folder size | 1.0 | semibold | `#f8f8f5` | path |
| File name | 1.0 | regular | `#e5e5e1` | — |
| Count / file size / overflow | 1.0 | regular | `#ababa5` | — |
| Buttons | 1.0 | semibold | dark / light | sentence |
| Attribution | 1.0 | regular | `#abaca6` | sentence |

No uppercase eyebrows in this card (the sibling Replay Theater pane uses them). No letter-spacing tricks.
Hierarchy comes from **weight + colour**, with only the headline slightly larger.

### 2.9 Iconography
All Lucide-style outline icons, 2 px-at-24 stroke (≈1.5–2 CSS rendered), round caps/joins:
`trash-2` (danger, in tile), `shield-alert` (banner), `folder`, `file`. Only the tile icon has a container.
Colour carries meaning: red family only for danger (tile, count, banner, strike); greys for structure.

---

## 3. Palette (measured, median of flat regions; JPEG ±2)

| Role | Hex | Theme key (DESIGN.md) |
|---|---|---|
| Transcript bg (normal) | `#151515` | host |
| Transcript bg while pane open | `#0f0f0f` | host / maybe editor |
| Pane bg | `#10110c` | host |
| Pane divider | `#1b1c17` | host |
| Outer sheet | `#171813` | — |
| Card bg | `#1f201b` | — |
| Card border | `#2d2e29` | — |
| Separator | `#282924` | — |
| Text primary | `#f6f6f3` / `#f8f8f5` | default |
| Text file name | `#e5e5e1` | default |
| Text muted (counts, sizes, context, attribution, overflow) | `#ababa5` | `dimColor` |
| Icon folder | `#abaca6` | `dimColor` |
| Icon file | `#7b7c76` | `dimColor` (stronger) |
| Danger text / count | `#e47177` | `error` |
| Danger icon | `#e46d72` | `error` |
| Danger tile fill | `#3c292a` | `error` @ ~15 % on card |
| Banner fill | `#342623` | `error` @ ~10 % |
| Banner border | `#553b3c` | `error` @ ~25 % |
| Banner text | `#eaa6a7` | `error` lightened |
| Banner icon | `#eea4a5` | `error` lightened |
| Bar track | `#2d2e29` | — |
| Bar fill — folder | `#d9d4ce` | default text @ ~85 % |
| Bar fill — file | `#8e8b86` | `dimColor` |
| Strike line | `#df7175` | `error` |
| Struck text | `#7e807a` | `dimColor` @ ~50 % |
| Struck size | `#676862` | |
| Primary button fill / label | `#ebeae5` / `#060603` | inverse |
| Secondary button border / label | `#353631` / `#f7f8f2` | |
| User bubble / text (host) | `#2a2b26` / `#fafaf4` | host |
| Inline code chip (host) | `#1e1f1a` / `#c3c2be` | host |
| Spinner asterisk (host) | ≈`#cd756b` | `claude` |
| **Not UI:** editor ring / marker | `#da6b3e` / `#5e2e18` | — |

The whole surface is a **warm olive-black ramp** (`#10110c → #171813 → #1f201b → #2d2e29`), not neutral grey.
The Replay Theater pane (10-build/001) uses the identical ramp, so treat it as the shared "Anthropic sample mod" look.

---

## 4. Motion (inferred)
- **Hold → pane:** the transcript row flips "Running…" → "Waiting on you…" and the pane appears (frames are
  2 s apart, so only the end states are visible). Recommend: sheet fades in + 8 px rise, 180 ms ease-out.
- **Strikethrough (024–025):** red 3-frame (≈1.5 CSS) line through each **file name** and the overflow line,
  overshooting the glyphs by ~8 frame (≈4 CSS) at both ends — so it is a drawn line (pseudo-element / SVG),
  not `text-decoration`. Under it the name dims to ~50 % (`#7e807a`) and the size to `#676862`; icons, bars and
  folder rows stay. Two readings:
  1. confirm transition: click Delete → lines draw left→right one row after another (~200 ms each, ~50 ms stagger),
     then the pane closes and the transcript shows "Ran 1 shell command"; or
  2. hover/focus preview on Delete ("shows you which files would be gone the moment you do that", narration 540 s).
  Build (1); (2) is a cheap extra if the host exposes hover.
- **Focus ring glow:** the orange glow around buttons is the editor's. In the clean frame 021 the primary has no
  ring. Use the host's default focus ring; do not add a glow.
- Pane close after confirm: instant/short fade; the transcript reply streams in normally (022→023).

## 5. Interaction model
1. A `PreToolUse`-style hold catches destructive Bash (`rm -rf`, etc.). The tool call is **blocked**; the turn
   waits ("Waiting on you…").
2. The mod expands the glob/dir on disk, sizes files, checks git tracking, and renders the card.
3. Choices: **Delete 9 files** (allow once, primary, autoFocus recommended *off* for a destructive default — the
   video shows no focus ring), **Cancel** (deny; Claude is told the user declined), **Show 3 more** (expands the
   overflow inline; becomes "Show less").
4. After allow: optional strike animation, pane closes, command runs, transcript continues.
5. Keyboard (recommended): `Enter` = focused button, `Esc` = Cancel, `m` = show more. Default focus on Cancel.

---

## 6. Building it with the drawing API (desktop)

Recommended surface: **Pane** (matches the video). Fallback when the pane is closed: an **AbovePrompt band** with
the same card at band width and the tree capped to 3 rows.

```
Pane
└ Box column  bg #171813  borderStyle round  borderColor #171813  padding 7  gap 14      ← outer sheet
  ├ Box column  bg #1f201b  borderStyle round  borderColor #2d2e29  padding 20  gap 16   ← card
  │ ├ Box row  gap 15  alignItems center
  │ │ ├ Svg  tile 38×38  (rounded rect r11 #3c292a + trash-2 path stroke #e46d72 1.75)
  │ │ └ Box column  gap 2
  │ │   ├ Svg  headline (see below)   — or Text fallback
  │ │   └ Text color #acaba6 "in demo-app"
  │ ├ Box row  bg #342623  borderStyle round  borderColor #553b3c  paddingX 16  paddingY 12  gap 12
  │ │ ├ Svg  shield-alert 16×16 stroke #eea4a5
  │ │ └ Text color #eaa6a7 "None of these are tracked by git, so they can't be restored."
  │ ├ Svg  separator 1 px #282924   (or Box height 1 bg)
  │ ├ (per group) Box column gap 0
  │ │ ├ Box row (folder) : Svg folder 16 | Text bold name | Box grow | Text dim "6 files" | Text bold "234 KB" | Svg bar 96×6
  │ │ └ Box row (file, paddingLeft 23): Svg file 14 | Text name (strikethrough when deleting) | grow | Text dim size | Svg bar
  │ └ Text dim "+ 3 more files · 6.3 KB"
  ├ Button plain  "Show 3 more"  hotkey m
  └ Box row  gap 16  alignItems center
    ├ Button primary   "Delete 9 files"
    ├ Button secondary "Cancel"  autoFocus  hotkey esc
    └ Text dim "Held by Blast Radius"
```

What must be **Svg** to reach the video's quality:
- **Danger tile + trash icon** (rounded tinted square + 1.75-stroke icon) — no glyph equivalent.
- **Banner shield icon, folder and file icons** — Lucide paths at 14–16 px.
- **Size bars** — pill track + fill with exact widths; a fixed-width Svg per row keeps the column aligned.
  (Text `━` bars from DESIGN.md are the terminal fallback.)
- **Headline**, *if* the larger size matters: Text has no font size, so a 1.25× headline (bold mono command +
  grey glue + bold red count) needs an Svg `<text>` line with `<tspan>`s; mono via `font-family: ui-monospace`.
  Acceptable fallback: Text bold, same size as body — hierarchy still reads through weight + red.
- **Strike animation**: Text `strikethrough` gives a static line; the overshooting, staggered, drawn line needs an
  Svg overlay per row (`stroke-dasharray` / `scaleX` with `isInteractive`). Static Text strikethrough + dim colour
  is the acceptable fallback.

Fine as Box/Text/Button: sheet, card, banner box, rows, counts/sizes, footer, buttons.

Column alignment: give count, size and bar Boxes fixed widths (`width`) and `justifyContent="flex-end"`, as in
existing mods; name column flex-grows and truncates (`wrap="truncate-end"`).

---

## 7. What makes it look premium — and weaknesses

**Top 5**
1. **Consequence-first headline**: the exact command, in mono, followed by "will delete **9 files · 286 KB**" in red,
   plus the project. One sentence answers *what, how much, where*.
2. **Global-scale size bars**: every bar is a share of the total delete, so the eye sees where the weight is
   (`build/assets/` = 81 %) without reading numbers.
3. **A specific, causal risk banner**: not "Are you sure?" but "None of these are tracked by git, so they can't be
   restored." — red tint, shield icon, one line.
4. **Quiet, warm ramp with one accent family**: olive-black surfaces, 1 px borders, all colour budget spent on red
   danger; buttons are neutral (light primary, outlined secondary).
5. **Honest overflow + labelled action**: folder totals stay true while rows are capped; "+ 3 more files · 6.3 KB"
   and a primary that names the count ("Delete 9 files"), with "Held by Blast Radius" attribution.

**Weaknesses**
- Primary is a **light, inviting button for a destructive action** and sits first; Cancel is visually weaker.
  Consider danger-tinted primary or default focus on Cancel.
- "Show 3 more" lives *outside* the card, detached from the list it expands.
- File rows have no path context beyond the folder header; long names will truncate the only identifier.
- No keyboard hints shown; no "always allow for build/" option, so repeated cleanups re-prompt.
- Sizes are proportional-width numbers (no tabular figures).
- Struck state keeps buttons live — ambiguous whether deletion is in progress or done.

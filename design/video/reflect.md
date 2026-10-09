# Reflect — video spec (Mod 7, 544–578 s)

Source: `scratchpad/yt/frames/07-reflect/NNN.jpg`, 1600×900, one frame every 2 s.
Timestamp = 544 s + (NNN − 1) × 2 s. Community mod (BayramAnnakov/claude-reflect), **desktop Code tab, dark theme**.

**Scale and overlays**
- Frame 009 shows the whole window at ≈**1.43×** CSS; frames 011–012 are zoomed to ≈**1.8×**; 014 ≈ 1.64×.
  All px below are frame px from **012** unless noted; "≈ CSS" divides by 1.8.
- **Editor overlays (not UI):** orange glow rings `#da6b3e` around the whole card (009), the header+quote (010–011)
  and the "This project only" row (012), plus the right part of the CLAUDE.md diff (014); the dashed call-out boxes
  "this doesn't look good" / "I wish we'd done it this way" (007–008); blur transitions (005, 010, 013); the
  ~50 % dimming of older transcript text (006–012). All of 002–004 and 015–017 are motion graphics.
- **Trigger-word underline on "no"**: same hue as the editor call-outs (`#c17755` vs `#ce7756`), but it persists
  through four different re-layouts of the user bubble (009, 011, 012, 014), which an editor would have to re-track
  by hand. Treat it as **real mod UI, optional** (see §2.1).

---

## 1. Screens and states

| # | Time | Best frame | State |
|---|------|-----------|-------|
| 0 | 544 | 001 | Talking head |
| 1 | 546 | 002 | Editor title card "07 / Reflect / turn corrections into rules" |
| 2 | 550 | 004 | B-roll "Like RLHF, on a micro scale" |
| 3 | 554 | **006** | **Before:** transcript of "Add the dayjs package…" (npm install), then the user's new bubble "no - in this repo we always use pnpm, not npm" in plain white. Composer below |
| 4 | 556–558 | **007**, 008 | **Trigger marked:** "no" turns accent orange with an underline. (Dashed boxes = editor examples of other triggers) |
| 5 | 560 | **009** (full window) | **Band shown:** the Reflect card sits directly **above the composer**, full composer width, buttons beneath it, composer still live |
| 6 | 564–566 | **011** (header/quote clean), **012** (options/buttons clean) | Same band, zoomed — the reference frames for measurement |
| 7 | 570 | **014** | **Saved:** card swaps to "RULE SAVED / Saved for this project"; the host file pane opens on the right with `CLAUDE.md +4`, lines 5–8 highlighted green |
| 8 | 572–576 | 015–017 | B-roll "Choose what Claude reflects on", "Fixed, or done better" |
| 9 | 578 | 018 | Talking head (next mod) |

---

## 2. Layout breakdown

### 2.1 Trigger word in the user bubble (frames 009, 011)
- Word colour ≈`#c4744f` (measured `#c17755`, anti-aliased; likely Claude clay `#d97757` at full strength).
- Underline: solid, 2–3 frame (≈**1.5 CSS**), colour `#c4734d`, **~5 CSS below the baseline** (well clear of
  descenders), spans the word plus ~2 CSS each side. Not dotted, not wavy.
- Only the trigger token is marked; the rest of the message keeps the bubble's white text on `#2a2b26`.

### 2.2 Band card — container
| Property | Frame px (012) | ≈ CSS |
|---|---|---|
| Position | above composer; left/right edges = composer edges (009: 445→1520 vs 444→1522) | full band width |
| Box | x 232→1585, y 165→621 (1353×456) | ~752×253 |
| Border | 1–2 frame, **neutral** `#2f2f2d` | 1 px |
| Radius | ≈22 | **12** |
| Fill | `#1f201b` (same as Blast Radius card) | |
| Padding | 36 left, 35 top, 34–36 right, 33 bottom | **20 / 19 / 20 / 18** |

### 2.3 Header row
- **Icon disc:** 60 frame circle (≈**32–33 CSS**) at (268,200), fill `#2e372f` (green-tinted), containing Lucide
  `bookmark-plus` outline, 20×27 frame (≈11×15 CSS), stroke ≈1.5 CSS, `#9dcfab`.
- **Eyebrow** "SAVE THIS AS A RULE?" at x=352 (gap 25 frame ≈ **14 CSS** after the disc), vertically centred on the
  disc (both centre y≈230). Uppercase, **bold**, cap height 18 frame (≈10 CSS → ~13 CSS font), tracking ≈+0.08 em
  (272 frame for 20 chars), colour **green** `#a1d2ad`.
- **Confidence label** "95% sure": right-aligned to the content edge (x=1549, 36 frame ≈ 20 CSS from the border),
  same baseline as the eyebrow, sentence case, **regular**, grey `#92918d`, ~13–14 CSS. No pill, no icon, no bar.

### 2.4 Body (indented to the eyebrow's left edge, x=352 ≈ 66 CSS from card edge)
| Line | Gap above | Style |
|---|---|---|
| Rule quote `“Use pnpm instead of npm for package management in this project.”` | 43 frame (≈24 CSS) under eyebrow | **semibold**, `#f6f6f3`, cap 23 frame → **~17–18 CSS (largest text on the card)**, typographic curly quotes |
| Provenance `From what you said: “no - in this repo we always use pnpm, not npm”` | 29 frame (≈16 CSS) under quote baseline | ~14.5 CSS regular; label `From what you said:` `#aaa9a2`, the quoted user text **brighter** `#dddbd6` |
| Eyebrow "WHERE IT GOES" | 41 frame (≈23 CSS) | same eyebrow style as header but **neutral grey** `#90908c` |
| Option rows | 17 frame (≈9 CSS) under eyebrow | see 2.5 |

### 2.5 Destination option rows (radio-like)
Both rows: x 351→1550 (≈666 CSS wide), height 73/72 frame (≈**40 CSS**), gap 11 frame (≈**6 CSS**), radius ≈16 frame
(≈**9 CSS**), border 2 frame (1 CSS). Icon inset 26 frame (≈14 CSS), icon ≈16 CSS, label at +23 frame (≈13 CSS)
after icon, path right-aligned with 29 frame (≈16 CSS) inset.

| Part | Selected — "This project only" | Unselected — "All your projects" |
|---|---|---|
| Fill | `#2d372e` (green tint) | `#262722` (one step above card) |
| Border | `#4b5f52` (green-grey) | `#30312c` / `#343530` |
| Icon | Lucide `folder`, `#99d1aa` | Lucide `globe`, `#8f8f89` |
| Label | semibold `#f5f8f2` | semibold-ish `#abaaa4` |
| Path (mono, ~13 CSS) | `weather-station/CLAUDE.md` `#d9ded5` | `~/.claude/CLAUDE.md` `#908f8a` |

No radio dot or check mark: **selection = green tint + green border + green icon + bright text**.
The path makes the abstract choice concrete (exact file that will be edited).

### 2.6 Action row (outside the card, below it)
- Top 18 frame (≈**10 CSS**) under the card, row height 57 frame (≈**32 CSS**), left edge = card left edge.
  Composer follows 22 frame (≈12 CSS) lower.
- Gaps between buttons ≈20–23 frame (≈**12 CSS**). Radius ≈15 frame (≈**8 CSS**). Label padding-x 24–27 frame
  (≈14–15 CSS). Labels semibold ~15 CSS.

| Button | Width (frame) | Look |
|---|---|---|
| **Save for this project** | 296 | **primary**: fill `#ebeae5`, label `#070806` |
| Save for all projects | 288 | **secondary**: transparent on `#151515`, 1 px border `#2f2f2f`–`#323232`, label `#f8f7f5` |
| Reword | 138 | secondary, same |
| Don't save | text only | **plain**: label `#ababa6`, no border |

The primary label mirrors the selected row ("…this project"); the other scope is still one click away as a
secondary. No focus ring is visible on any button.

### 2.7 Saved state (frame 014, card narrower because a pane opened)
- Same card shell (`#1f201b`, border `#2b2b2b`, radius ≈12 CSS), same position above the composer. No buttons.
- Header: **check disc** (same size/fill `#2d372e`, Lucide `check` `#a0ceae`) + eyebrow **"RULE SAVED"** green
  `#a3cdb0` tracked caps.
- Body is **not indented** here — it aligns with the disc's left edge (likely responsive at narrow widths):
  1. Title **"Saved for this project"** semibold `#f7f8f3`, largest size (≈ quote size).
  2. Rule quote, **regular** `#dcddd8`, curly quotes, wraps to 2 lines.
  3. `Added under Learned rules in` **`weather-station/CLAUDE.md`** `. Claude follows it from your next message.` —
     grey `#a4a5a0` with the path in **bold mono** `#ddddd8`.
- Host file pane on the right: header `CLAUDE.md` + green `+4` (`#96c49e`), close ×; mono code with line numbers
  `#64635f`; added lines 5–8 on `#1d2a20` with a 2 CSS green gutter bar `#5cb178`. Written block:
  ```
  <!-- claude-reflect: learned rules (saved from the band; edit freely) -->
  ## Learned rules
  - Use pnpm instead of npm for package management in this project.
  <!-- end claude-reflect -->
  ```

### 2.8 Typography hierarchy (body ≈ 15 CSS = 1.0)
| Role | Rel. size | Weight | Case / tracking | Colour |
|---|---|---|---|---|
| Rule quote / saved title | ~1.15–1.2 | semibold | sentence, curly quotes | `#f6f6f3` |
| Option label, buttons | 1.0 | semibold | sentence | `#f5f8f2` / dim `#abaaa4` |
| Provenance line | ~0.95 | regular | sentence | `#aaa9a2` + `#dddbd6` |
| Confidence "95% sure" | ~0.9 | regular | sentence | `#92918d` |
| Eyebrows | ~0.85 | bold | **UPPERCASE, +0.08 em** | green `#a1d2ad` / grey `#90908c` |
| Paths | ~0.87 | regular (bold in saved state) | mono | per row |

### 2.9 Iconography
Lucide outline, ≈1.5 CSS stroke, round joins: `bookmark-plus` (proposal), `check` (saved) — each inside a
32 CSS **tinted disc**; `folder` (project scope), `globe` (global scope) bare at 16 CSS. Green = the mod's single
accent (positive "learning" semantics), used on: header disc, eyebrow, selected row.

---

## 3. Palette

| Role | Hex | Theme key |
|---|---|---|
| App bg | `#151515` | host |
| Sidebar bg | `#111111`–`#131313` | host |
| User bubble / text | `#2a2b26` / `#f8f9f4` | host |
| Composer | `#1d1e19` (placeholder `#62635e`) | host |
| Trigger word / underline | `#c4744f` / `#c4734d` | `claude` |
| Card fill | `#1f201b` | — |
| Card border | `#2f2f2d` | — |
| Accent disc fill | `#2e372f` | `success` @ ~15 % |
| Accent glyph | `#9dcfab` | `success` |
| Eyebrow (accent) | `#a1d2ad` | `success` |
| Eyebrow (neutral) | `#90908c` | `dimColor` |
| Confidence | `#92918d` | `dimColor` |
| Rule quote | `#f6f6f3` | default |
| Provenance label / quoted text | `#aaa9a2` / `#dddbd6` | `dimColor` / default |
| Selected row fill / border | `#2d372e` / `#4b5f52` | `success` tints |
| Selected icon / label / path | `#99d1aa` / `#f5f8f2` / `#d9ded5` | |
| Unselected row fill / border | `#262722` / `#30312c` | — |
| Unselected icon / label / path | `#8f8f89` / `#abaaa4` / `#908f8a` | `dimColor` |
| Primary btn fill / label | `#ebeae5` / `#070806` | inverse |
| Secondary btn border / label | `#2f2f2f` / `#f8f7f5` | |
| Plain btn label | `#ababa6` | `dimColor` |
| Diff add bg / gutter / "+4" (host pane) | `#1d2a20` / `#5cb178` / `#96c49e` | `success` |
| **Not UI:** editor ring | `#da6b3e` | — |

---

## 4. Motion (inferred)
- Trigger mark appears right after send (006 → 007, ≤2 s): suggest underline drawing left→right, 200 ms.
- Band enters above the composer, pushing nothing (composer stays put; transcript scrolls): suggest 8 px rise +
  fade, 180 ms.
- Save → card content cross-fades to the saved state in place (013 is an editor blur, so the real transition is
  unknown); the file pane opens in parallel with the diff highlight already applied.
- Option row selection: instant fill/border swap; hover = border one step brighter.
- Saved card likely auto-dismisses (DESIGN.md: notifications close themselves); not shown.

## 5. Interaction model
1. User sends a message. Detector: cheap keyword pass ("no", "don't", "I wish…", "this doesn't look good") →
   one cheap-model call to (a) decide it is a durable preference, (b) generalise it into an imperative rule,
   (c) guess scope ("in this repo" → project), (d) return a confidence → "95% sure".
2. Band appears **non-blocking**; the user can keep chatting.
3. Choose scope by clicking a row (or 1/2). Primary button follows the selected row; the other scope is a
   secondary button. **Reword** → edit the rule text (inline field or a follow-up prompt). **Don't save** → dismiss
   and remember not to re-ask for this message.
4. Save writes the rule inside the marker block under `## Learned rules` in the chosen CLAUDE.md (idempotent,
   user-editable), swaps to "RULE SAVED", opens the file at the changed lines. "Claude follows it from your next
   message."
5. Recommended keys: `1`/`2` scope, `Enter` save, `r` reword, `Esc` don't save.

---

## 6. Building it with the drawing API (desktop)
Surface: **AbovePrompt band** (as in the video). Non-blocking, so no Pane needed; the file pane in 014 is the
host's own viewer.

```
AbovePrompt (stack own row above `theirs`)
└ Box column  gap 10
  ├ Box column  bg #1f201b  borderStyle round  borderColor #2f2f2d  padding 20  gap 12   ← card
  │ ├ Box row  alignItems center  gap 14
  │ │ ├ Svg  disc 32×32 (circle #2e372f + bookmark-plus stroke #9dcfab)
  │ │ ├ Svg  eyebrow "SAVE THIS AS A RULE?"  (bold, 13 px, letter-spacing 1, fill #a1d2ad)
  │ │ ├ Box grow
  │ │ └ Text color #92918d "95% sure"
  │ └ Box column  paddingLeft 46  gap 8                         ← indent to eyebrow
  │   ├ Svg  quote line(s) 17 px semibold #f6f6f3   — or Text bold fallback
  │   ├ Box row: Text color #aaa9a2 "From what you said: " + Text "“…”"
  │   ├ Svg  eyebrow "WHERE IT GOES" (#90908c)
  │   ├ Box row  bg #2d372e  borderStyle round  borderColor #4b5f52  paddingX 14 paddingY 10  gap 12  hover
  │   │   Svg folder 16 #99d1aa | Text bold "This project only" | grow | Code/Text mono "weather-station/CLAUDE.md"
  │   └ Box row  bg #262722  borderStyle round  borderColor #30312c  … hover  (globe, dim label, dim path)
  └ Box row  gap 12
    ├ Button primary   "Save for this project"  autoFocus  hotkey enter
    ├ Button secondary "Save for all projects"
    ├ Button secondary "Reword"  hotkey r
    └ Button plain     "Don't save"  hotkey esc
```
Saved state: same card; header Svg = check disc + "RULE SAVED"; body = Text bold title, Text quote, and a Text row
mixing dim text with a bold mono path (or `Markdown` "Added under Learned rules in **`weather-station/CLAUDE.md`**.").

Must be **Svg** for this quality:
- **Eyebrows** (uppercase + letter-spacing + smaller size) — Text cannot track or shrink.
- **Icon discs** (tinted circle + Lucide glyph) and the row icons (folder, globe).
- **Rule quote at 1.15–1.2×** if the size step matters (fallback: Text bold at body size).
- **Trigger-word underline** — only if the host lets a mod decorate transcript text; otherwise skip (it is
  optional and the band alone carries the feature).

Box/Text/Button are enough for: card, option rows (fill + round border + hover), provenance line, paths
(mono via `Code` inline or Text in a mono context), all four buttons.

---

## 7. What makes it look premium — and weaknesses

**Top 5**
1. **Shows its evidence**: the generalised rule is the headline, and directly under it "From what you said: “…”"
   quotes the user — the model's leap from correction to rule is auditable at a glance.
2. **Destination made concrete**: scope options show the real file path in mono, with a quiet green selected state
   instead of a radio dot.
3. **Single accent with meaning**: green only for "learning/saving" (disc, eyebrow, selected row); everything else
   is the warm neutral ramp. Buttons stay neutral.
4. **Typographic system**: tracked uppercase eyebrows ("SAVE THIS AS A RULE?", "WHERE IT GOES") structure the card
   without boxes; the rule quote is the only large text; confidence is a quiet "95% sure" in the corner.
5. **Closure**: the saved state names the file, says when it takes effect ("from your next message"), and the
   diff opens with the exact 4 added lines inside clearly marked, user-editable comment fences.

**Weaknesses**
- Redundant controls: scope rows *and* two scope buttons express the same choice twice.
- Card is tall (≈250 CSS + buttons) for a non-blocking nudge; on short windows it eats most of the transcript.
- "95% sure" has no explanation or threshold; at low confidence it would still look authoritative.
- Body indent (66 CSS) wastes width; the saved state drops it, so the two states don't align.
- Trigger underline uses the same orange as Claude's accent while the card uses green — two accents for one mod.
- No visible keyboard hints or focus state.

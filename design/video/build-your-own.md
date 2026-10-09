# Build your own mod — video spec (643–715 s)

Source: `scratchpad/yt/frames/10-build/NNN.jpg`, 1600×900, one frame every 2 s.
Timestamp = 643 s + (NNN − 1) × 2 s. Desktop Code tab, dark theme.

Scale: full-window frames (010, 011, 013, 023, 025) ≈ **1.43×** CSS; zoomed frames (014, 015, 018, 024) ≈ **2.0×**.
Editor overlays to ignore: orange glow rings `#da6b3e` (around `Relaunch` in 011, the `plugin-authoring` chip in
014/015/018), the orange marker behind "hot reloading" (018), blur transitions (004, 016, 017, 034), all
motion-graphics frames (002–009, 019–022, 026–037).

---

## 1. Screens and states

| # | Time | Best frame | What is shown | Real UI? |
|---|------|-----------|---------------|----------|
| 0 | 643 | **001** | Tail of Mod 9: **Replay Theater** pane (step list + diff) — see §2.6 | yes (mod) |
| 1 | 645–647 | 002–003 | "Entirely modifiable / to your liking" (window outline, a panel lights up orange) | b-roll |
| 2 | 651 | 005 | "Really easy / to make your own": 4 steps **Update → Describe → Tweak → Install** (Update active, orange ring) | b-roll |
| 3 | 653–655 | 006–007 | "Mods need **2.1.287** or newer": timeline older / newer with a check | b-roll |
| 4 | 657–659 | 008–009 | "In the terminal / just type `claude update`": terminal card → `Successfully updated from 2.1.280 to version 2.1.293 ✓` | b-roll |
| 5 | 661–663 | **010**, 011 | Desktop **"Update available"** dialog: Claude asterisk, "A new version of Claude is ready", `Later` / `Relaunch` | host UI |
| 6 | 665 | 012 | Composer with the request: *"build me a Claude Code mod: show every file and page you make for me as a small bubble above my chat box"* | host |
| 7 | 667 | 013 | Sent; session auto-titled **"Artifact bubbles mod"** | host |
| 8 | 669 | **014** | `✳ 📖 Loading skill` `plugin-authoring` (coral spinner) | host |
| 9 | 671 | **015** | `✓ 📖 Loaded skill` `plugin-authoring` | host |
| 10 | 673–677 | 016–**018** | `Wrote 3 files` `+148` `›`, then the **hot-reload question card**: "Turn on hot reloading for this session?" `1 Yes` `2 No` · "Claude is waiting on your answer" | host (AskUserQuestion) |
| 11 | 679–685 | 019–022 | "Hot reloading / the session reloads itself": toggle flips, refresh arrows, a new band appears in the window outline | b-roll |
| 12 | 687 | **023** | Answered **Yes** (Yes filled, card dimmed). The new mod is live: **ARTIFACT RING** band above the composer, 4 bubbles | yes (built mod) |
| 13 | 689 | 024 | User types "make the bubbles bigg…" | host |
| 14 | 691 | **025** | Sent "make the bubbles bigger" → ring re-renders with bigger bubbles (64 → 92 frame px) with no restart | yes |
| 15 | 693–697 | 026–028 | "Temporary by default / a mod Claude builds for you": *this session* has the band, *next session* is empty (dashed), timer badge | b-roll |
| 16 | 699–703 | 029–031 | "Save it as a plugin / and install it" + composer "save it as a plugin and install it" → next session also has the band, green check | b-roll |
| 17 | 705 | 032 | "Mods cost nothing extra / by default" — `$0 extra` pill | b-roll |
| 18 | 707 | 033 | "You need a paid plan / that includes Claude Code" | b-roll |
| 19 | 711–713 | 035–036 | "Uses your Claude usage / when a mod calls a model in the background" — usage bar grows | b-roll |
| 20 | 715 | 037 | "That's all 9 mods" — list of mod chips (icon + name) | b-roll |

Narration facts (VTT): mods need **v2.1.287+** (`claude update` in terminal; desktop shows an update popup);
Claude Code ships a built-in skill **`plugin-authoring`**; Claude then asks whether to turn on **hot reloading for
this session** so the mod appears as soon as it is built; tweak it in plain language; a mod Claude builds is
**temporary by default** — ask Claude to **save it as a plugin and install it** to keep it; no extra cost, but a
paid plan is required and any mod that calls a model in the background spends normal usage.

---

## 2. Layout breakdown

### 2.1 Hot-reload question card (frame 018 ≈ 2.0×; 023 for answered state)
| Part | Frame px | ≈ CSS | Look |
|---|---|---|---|
| Card | x 621→1531, y 284→453 | ~450×84 | fill `#1c1b16`, 1 px border `#2f302b`, radius ≈8–10 |
| Padding | 35 left/top, ~29 bottom | 17 / 14 | |
| Question | cap 23 frame | ~15–16 font | **semibold** `#f4f5f4`, sentence case, ends with "?" |
| Gap question→options | 24 frame | 12 | |
| `1 Yes` / `2 No` | 107×52 / 102×52, gap 16 | ~53×26, gap 8 | outlined 1 px `#363530`, fill = card, radius ≈6; small dim index digit `#8b8a85` (~0.75×) + label `#e4e1de` regular |
| Status | x = No right + 24 frame | +12 | "Claude is waiting / on your answer" two lines, ~0.8×, `#93928d` |

Answered (023): whole card steps back — fill `#181914`, border `#1f1f1f`, question greyed; chosen **Yes** becomes a
**filled chip** `#767772` with dark label `#0e0f0a`; **No** dims to `#696a65`. Digit hotkeys = 1/2.

Rows above it (023, rendered dim as completed steps): `✓` dim green `#535e54` · `📖` book outline · "Loaded skill"
`#454643` · `plugin-authoring` in a **mono chip** (fill `#181818`, text `#5a5a58`). Next line: "Wrote 3 files"
`#464644` + **`+148` green chip** (fill `#181e19`, text `#4a584b`) + chevron `›` (expandable). Full-strength
values of these rows are not visible in any frame. While loading (014) the check is a coral asterisk spinner
(`≈#cd756b`).

### 2.2 "Update available" dialog (frame 010)
Floating card centred over the content column: fill `#262722`, soft shadow, radius ≈10 CSS. Left: Claude asterisk
`#c87c6c` (~20 CSS). Title "Update available" semibold `#f4f5f3`; subtitle "A new version of Claude is ready"
`#b9b8b3`. Buttons bottom-right: `Later` secondary (dark, no fill) and `Relaunch` primary (light fill `#ebeae5`-ish,
dark label). Host UI — only relevant as "check version ≥ 2.1.287 first".

### 2.3 The built mod: ARTIFACT RING band (frames 023 / 025 ≈ 1.43×)
| Part | Frame px | ≈ CSS | Look |
|---|---|---|---|
| Band box | x 444→1523 (= composer width), y 540→739 | ~755×139 | fill **`#060606`** (darker than app `#151515` — an inset "screen"), 1 px border `#202020`–`#232323`, radius ≈12; 8 frame (≈6 CSS) above the composer |
| Live dot | 11 frame at x 470 | 8 | solid `#d47553` (Claude clay), vertically centred on title |
| Title "ARTIFACT RING" | x 492, cap 23 frame | ~16 cap | **pixel / dot-matrix mono font**, uppercase, wide tracking (~0.15 em), `#f7f5ee` |
| Meta "3 artifacts, newest first" | right, cap 14 | ~12 font | mono, `#80807f` |
| `hide` | after meta, gap ~28 frame | | mono, underlined, `#808080` — a link-style plain button |
| Bubble row | centred group, pitch 183 frame | ~128 | 4 bubbles, newest first left→right |
| Bubble (before) | Ø 64 frame | ~45 | ring 1.5 CSS `#d9d9d4`, fill `#141414`, centred Lucide icon `#e0e1dc` (`globe` for .html, `file-text` for .pdf, `file` for .md) |
| Bubble (after "bigger") | Ø 92 frame, icon 34 | ~64, icon 24 | same styling scaled |
| Count badge | 18–25 frame square at ring's top-right (overlapping) | 13–17 | rounded square, near-black red fill (`#160000`–`#230503`), 1 px muted clay border (`#674440`–`#75544d`), clay numeral `#ca785d` ("1", "1", "1", "3") |
| Label | 13 frame below ring | ~9 gap | mono ~12 CSS `#c4c5c2`: `landing.html`, `report.pdf`, `notes.md` |
| INFO bubble | same geometry | | ring, glyph `i`, label **`INFO`** and badge all in clay `#d67044` — the "attention" variant |

This is the mod Claude generated from one sentence: it already uses an Svg-heavy look (pixel font, icon rings,
badges) rather than plain Text.

### 2.4 Composer and chrome (context)
Composer fill `#1e1f1a`, placeholder "Type / for commands", ↵ glyph right; footer row `+ 🎤 Auto … Opus 5.5 Extra high`.
Sidebar `#111111`/`#131313`, selected session `#242424` with a clay dot; header title semibold + project chip
(`#292a25`, text `#cacbc1`).

### 2.5 Typography (host + built mod)
Host: one sans family; question/title semibold, body regular, meta ~0.8× grey; mono for skill names and paths.
Built mod: pixel-mono display title (only place a second display face appears), mono micro-labels, no sans.

### 2.6 Replay Theater pane (frame 001, Anthropic sample — same family as Blast Radius)
Pane/sheet `#171813`. Title "3 edits in 1 file" semibold `#f8f8f3`; summary "4 lines added, 5 removed" in green
`#97d79d` / red `#d78388`. Eyebrow "THE EDITS, IN ORDER" tracked caps `#7d7d78`. Stepper list (row ≈35 CSS):
done = grey disc `#393934` + check `#a7a6a1`; **current = magenta disc `#d959a6` with number, row fill `#35212c`,
bold name**; upcoming = outlined numbered disc; `+1 −1` right-aligned green/red. Divider `#33342f`. Section eyebrow
"EDIT 2 OF 3" magenta `#cf6fa4`; file title semibold; meta "draft.md, project root · Edit" `#acaca6`. Diff block:
removed rows fill `#372322` with red `−`, added rows `#233424` with green `+`, mono text near-white. Legend with
square swatches: Removed / Added / Changed word / Unchanged. Same warm ramp and eyebrow system as Blast Radius /
Reflect — confirms a shared visual language: **warm olive-black ramp, tracked-caps eyebrows, one accent per mod**
(red Blast Radius, green Reflect, magenta Replay, clay Artifact Ring).

---

## 3. Palette (this section)

| Role | Hex |
|---|---|
| App bg / sidebar | `#151515` / `#111111`–`#131313` |
| Selected sidebar row | `#242424` |
| Question card fill / border | `#1c1b16` / `#2f302b` |
| Question card answered fill / border | `#181914` / `#1f1f1f` |
| Question text | `#f4f5f4` |
| Option chip border / index / label | `#363530` / `#8b8a85` / `#e4e1de` |
| Chosen option fill / label | `#767772` / `#0e0f0a` |
| Waiting text | `#93928d` |
| `+148` chip fill / text (dimmed) | `#181e19` / `#4a584b` |
| Update dialog fill / subtitle | `#262722` / `#b9b8b3` |
| Claude asterisk | `#c87c6c`–`#cd756b` |
| Ring band fill / border | `#060606` / `#202020` |
| Ring title / meta | `#f7f5ee` / `#80807f` |
| Bubble ring / fill / icon / label | `#d9d9d4` / `#141414` / `#e0e1dc` / `#c4c5c2` |
| Clay accent (dot, INFO, badge numeral) | `#d47553`–`#d67044` |
| Replay magenta / plum row | `#d959a6` / `#35212c` |
| Diff removed / added rows | `#372322` / `#233424` |
| **Not UI:** editor ring | `#da6b3e` |

## 4. Motion (inferred)
- Skill row: coral asterisk spins while loading → swaps to a check (014 → 015).
- Hot-reload answer: chosen chip fills, card dims to "past" state; the band then appears above the composer without
  a page reload (023). B-roll 019–022 depicts the reload as refresh arrows + a band sliding in.
- Iteration: after "make the bubbles bigger", the ring re-renders in place with larger bubbles (023 → 025); no
  layout jump in the transcript — the band just grows inside its fixed height (bubbles got closer to the title).
- Built mod: the clay live dot suggests a subtle pulse; not verifiable at 2 s sampling.

## 5. Interaction model (authoring flow)
1. Be on **≥ 2.1.287** (terminal `claude update`; desktop shows "Update available → Relaunch").
2. Describe the mod in one sentence in a normal session. Claude loads `plugin-authoring`, writes the hooks module
   (here: 3 files, +148 lines).
3. Claude asks **"Turn on hot reloading for this session?"** — numbered choices (1 Yes / 2 No), turn blocked until
   answered. Yes → the mod mounts live in this session.
4. Tweak by talking ("make the bubbles bigger"); each edit hot-reloads.
5. The mod is **temporary** (session-only) until you say "save it as a plugin and install it"; then it loads in
   every new session.
6. Cost: none by default; background model calls from a mod count as normal usage.

---

## 6. Building with the drawing API

The question card, update dialog, skill rows and "Wrote N files" are **host UI** — do not rebuild them. Reusable
pieces for MODZ:

**Artifact Ring–style band (AbovePrompt)**
```
AbovePrompt
└ Box column  bg #060606  borderStyle round  borderColor #202020  padding 14  gap 10
  ├ Box row  alignItems center  gap 8
  │ ├ Svg  title strip: clay dot + "ARTIFACT RING" pixel-mono text (letter-spacing 3)   ← must be Svg
  │ ├ Box grow
  │ ├ Text dim  "3 artifacts, newest first"
  │ └ Button plain "hide"
  └ Box row  justifyContent center  gap 32
    └ (per item) Box column alignItems center gap 6
       ├ Svg bubble 48×48: circle ring + Lucide icon + badge rect/number (isInteractive for hover/pulse)
       └ Text  "landing.html"  (dim, truncate)
```
Must be **Svg**: pixel/dot-matrix title (no font control in Text), bubble rings + icons, overlapping count badges,
any pulse on the live dot. Text/Box/Button: container, meta line, `hide`, labels.

**Hot-reload-style choice chips** (if a mod needs its own inline question): `Button secondary` with `hotkey "1"`,
label "Yes"; after answer re-render the chosen one as `primary` and the rest `dimColor`. Status text dim to the right.

**Replay-style stepper** (Pane): number/check discs and the plum current-row fill need Svg discs + Box row
`backgroundColor`; +/- counts are Text with `success`/`error`.

---

## 7. What makes this section look premium — and weaknesses

**Top 5**
1. **One-sentence-to-live-UI loop**: describe → skill loads → "Turn on hot reloading?" → the band is on screen
   within the same session, then edited by talking. The flow is the feature.
2. **Clear, numbered blocking question** with an explicit "Claude is waiting on your answer" status and a visibly
   settled answered state (filled chip, dimmed card).
3. **Generated mod has a strong identity**: near-black inset band, pixel display title, outlined icon bubbles,
   clay count badges and a clay "INFO" attention variant — distinct from host chrome but still restrained.
4. **Shared family language across sample mods**: warm olive-black ramp, tracked-caps eyebrows, one accent per mod
   (Replay magenta, Blast red, Reflect green, Ring clay).
5. **Honest lifecycle messaging**: temporary by default, explicit "save as plugin and install", cost and plan
   requirements stated.

**Weaknesses**
- The Artifact Ring band is tall (~139 CSS) for four icons; bigger bubbles after the tweak crowd the title.
- Pixel-font title + mono meta + sans host text = three type voices in one strip.
- Count badges in dark red with clay numerals read as "error" more than "count".
- Hot-reload question is host-styled and terse: it does not say what hot reloading changes or how to undo it.
- "Temporary by default" is only explained in b-roll; nothing in the UI marks a mod as session-only.

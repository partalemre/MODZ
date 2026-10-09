# Filetree: visual spec from the video (Mod 04)

Source frames: `scratchpad/yt/frames/04-filetree/NNN.jpg` (1600×900, one every 2 s). Timestamp t = 365 s + (NNN − 1) × 2 s.
All colors were sampled with PIL from the JPEGs (flat areas averaged, text/icons taken from their most saturated or brightest 3–5% of pixels). Expect about ±3 per channel from JPEG compression.

**Scale.** Frames 005 and 006 show the desktop app at "1×" video scale. From 007 on, the video zooms in by 1.2× (zoomed px ÷ 1.2 = 1× px). Text cap heights suggest 1× video px ≈ 1.55 × CSS px, so the "≈css" numbers below are frame-6 px ÷ 1.55. Treat them as estimates.

**Video-only effects (do not build).** These come from the editor, not the mod: the cream rounded outline (#a09c93 to #f2efe6, about 3 px) and dimming around the element in focus, the blurred transitions (frames 008, 010, 020), the facecam bubble, the title cards, and the explainer slides.

---

## 1. Screens and states in order

| # | t (s) | Frames | Best frame | What is shown |
|---|---|---|---|---|
| A | 365–367 (6:05) | 001–002 | `002.jpg` | Title card: pixel numerals "04" in orange, serif "Filetree", sans subtitle "see which files Claude touches". Video chrome. |
| B | 369–371 | 003–004 | `004.jpg` | Inspiration: a terminal TUI file panel (data-goblin/claude-code-filetree), headline "A really nice file panel / on the right". Video chrome. |
| C | 373 (6:13) | 005 | `005.jpg` | **Idle/thinking.** Pane "Files: weather-app". RIGHT NOW card shows a gray asterisk disc, gray eyebrow, "Claude is thinking", "no files touched yet". Branch row reads "main … clean, nothing changed". Legend has 3 dots. Then the search box, 6 buttons, "CLAUDE TOUCHED 0 FILES / Nothing yet", and ALL FILES (.git, docs). |
| D | 375–377 | 006–007 | `006.jpg` (1×), `007.jpg` (1.2×) | **Reading.** Purple eye disc, purple "RIGHT NOW", "Claude is reading client.test.js", "in tests". Touched list: `JS client.test.js tests [Reading]`. |
| E | 379–381 | 008–009 | `009.jpg` | **Thinking after a read.** Neutral disc, "Claude is thinking", "opened 1 file". The touched pill changes from Reading to **Opened**. |
| F | 383 | 010 | `010.jpg` (dimmed) | **Reading the 2nd file.** "Claude is reading client.js", "in src/api", 2 FILES. |
| G | 385 | 011 | `011.jpg` | **Done, edited.** Orange pencil disc, orange "DONE", "Claude edited 1 file", "src/api/client.js +1 −1". Branch row right side: "+1 −1 · 1 changed". Touched list: `client.test.js tests [Opened]` and `client.js src/api +1 −1 [Edited]`. |
| H | 387–389 | 012–013 | `012.jpg` | **Tree, editing.** src/api carry a gold "1 changed". `client.js` is gold with +1 −1. `tests` folder is orange. The `client.test.js` row has an orange tint, an orange name with shimmer, and an `editing` pill. In 013 a sticky footer shows "● committing…" in green. |
| I | 391 | 014 | `014.jpg` | **Tree, committed.** Both files have green rows, green bold names with shimmer and a `committed` pill. Ancestor folder names (src, api, tests) are green. Footer: "● committed a1c9e42". |
| J | 393–395 | 015–016 | `015.jpg` | **Done, committed.** Green check disc, green "DONE", "Claude committed 2 files", "a1c9e42". Branch row "main ↑1" with ↑1 in teal, then "clean, nothing changed". Touched list: both rows **Committed** in green. |
| K | 397–401 | 017–019 | `018.jpg` | Explainer "Not a developer? still useful across lots of files": an orange outline folder and line icons in a 6×2 grid. Video chrome. |
| L | 403–407 | 020–022 | `021.jpg` | **Second project (non-git) "tax-return-2026".** "CLAUDE TOUCHED 0 FILES / Nothing yet". ALL FILES lists bank-statements, payslips, receipts (expanded: 3 PDFs dated 3 Sep / 12 Aug / 30 Sep), deductions.csv, income.csv, notes.md, tax-return.docx. Every row has a warm gray rounded tint (#373631); this is probably video emphasis. |
| M | 409 | 023 | `023.jpg` | **Reading 3 PDFs at once.** Three adjacent purple rows with purple shimmering names and `reading` pills. The `receipts` folder name is purple. Touched list has 3 files, all **Opened**. |
| N | 411 | 024 | `024.jpg` | **Editing the CSV.** The deductions.csv row is orange with an `editing` pill. Touched list has 4 files; the CSV row is **Edited** with no diffstat. |
| O | 413–415 | 025–026 | `026.jpg` | The chat side gets focus and the pane dims. The tree keeps its tints while the turn is still running. |
| P | 417–419 | 027–028 | `027.jpg` | **Done, non-git.** Orange pencil disc, "DONE", "Claude edited 1 file", "deductions.csv, opened 3 receipts". **No branch row**, and the legend has only 2 dots (Claude read, Claude edited). |
| Q | 421 | 029 | `029.jpg` | **Hover** on a touched row (deductions.csv): a full-width cool-gray rounded tint (#3c4048) under the pointer. |
| R | 423 | 030 | `030.jpg` | Outro. Video chrome. |

---

## 2. Layout, element by element

Numbers are 1× video px from frame 006 unless marked "z" (zoomed, frames 007+). ≈css = 1× ÷ 1.55.

### 2.1 Pane shell
- The right-hand pane is about 600 px wide at 1× (x 990→1590, ≈387 css). It fills the full window height and sits on panel bg **#171813**. The divider against the chat is a dark hairline (#080808 to #181814).
- Header row: "Files: weather-app" at body size, regular weight, text.lo **#91918c**, left at x 1008 (cap 85–100). A ✕ close icon sits at the right edge (#8e8f8a, about 20 px, thin stroke). No eyebrow and no bold.
- Content gutter is 18 px left and 17 px right (≈12 css). Every card is full width (x 1008→1573, 565 px, ≈365 css).
- The vertical rhythm between blocks is a constant **21–22 px (≈14 css)**: header → card → search → button rows → touched card → ALL FILES.

### 2.2 RIGHT NOW card (hero)
- Box: 565×238 at 1× (≈365×154 css). Fill **#1f201b**, 1 px border **#2e2f2a**, radius 24 z ≈ 20 at 1× (**≈12–13 css**). Padding is about 25 px (≈16 css) on all sides.
- Row 1 is an icon disc plus a text stack:
  - **Disc**: circle 62 px at 1× (75 z, **≈40 css**), solid tinted fill that depends on state (see palette), with no border. The glyph is about 30 px at 1× (≈19 css), line style, about 2 px stroke, rounded caps, colored with the state color. Glyphs: thinking = 8-spoke asterisk ✳ (gray), reading = eye, edited = pencil, committed = check.
  - Gap from disc to text: 20 px (≈13 css). The text column starts at x 1117.
  - **Eyebrow** "RIGHT NOW" or "DONE": cap 12–13 px (≈11–12 css font), **bold 700, uppercase, tracking ≈ +0.08–0.1em**. Its color is the state color (gray #ababa5 while thinking).
  - **Title**: cap 21 px (**≈18–19 css font, about 1.3× body**), semibold/bold, text.hi **#f7f7f3**. Sentence case, written as a narrative: "Claude is reading client.test.js", "Claude edited 1 file", "Claude committed 2 files", "Claude is thinking".
  - **Subline**: body size, regular, text.mid **#a6a7a1**. Content: "in tests", "no files touched yet", "opened 1 file", "src/api/client.js +1 −1" (diff in green/rose), "a1c9e42", "deductions.csv, opened 3 receipts".
- **Divider**: 1 px **#2e2f2a**, inset to the content padding (x 1035→1548), about 14 px below the subline.
- **Branch row** (git projects only), about 22 px below the divider:
  - Left: git-branch icon (about 23×25 at 1×, ≈15 css, stroke #517a9c/#7d9dbb steel blue), then a 16 px gap, then the branch name "main" in **bold** text.hi. "↑1" (ahead count) is bold **teal #4ddcb1** with an up arrow.
  - Right-aligned: "clean, nothing changed" in text.mid #a8a8a2. When dirty, it shows "+1 −1 · 1 changed": + is sage **#9bc282**, − is rose **#c96276**, the separator dot is #6f706b, and "1 changed" is bold gold **#dbbb84**.
- **Legend row**, about 47 px below: three items in one row, each a dot (about 12 px at 1×, ≈8 css) plus a label in text.mid at body size. Gap from dot to label is about 11 px and between items about 34 px. Items: purple "Claude read", orange "Claude edited", gold "Not committed". Non-git projects drop the third item.

### 2.3 Search
- Input 565×60 at 1× (≈365×39 css). Fill **#1d1e19**, border 1 px **#2e2f2a**, radius 14 z (**≈8 css**).
- Magnifier icon on the left (about 22 px at 1×, ≈14 css, text.lo #91928d stroke) at x 1028. Placeholder "Find a file" at x 1064, body size, text.lo **#93948f**.

### 2.4 Action buttons (two wrapped rows)
- Row 1: Refresh | Collapse all | Show sizes. Row 2: Up a folder | Back to project | Hide hidden files. All are secondary/outline with **equal weight**.
- Each button is 43 px tall at 1× (≈28 css) with a horizontal padding of 18 px (≈12 css) and radius 12 z (≈6–7 css). Fill is transparent (panel #171813), border 1 px **#3a3b36–#40413c** (one step brighter than card borders), text **#d7d8d5** at body size, regular/medium weight.
- Gap is 11 px (≈7 css) both horizontally and between rows. Rows are left-aligned and wrap as content requires (row 2 is wider).
- In thinking/done states the video dims these (frames 009+). That is the editor's spotlight, not a disabled state.

### 2.5 CLAUDE TOUCHED card
- Box: full width, fill **#151515** (darker than the panel), 1 px border **#272824–#2a2a2a**, radius ≈12 css. Padding is about 22 px top and left.
- Header row: "CLAUDE TOUCHED" on the left and "N FILES" right-aligned. Both use the eyebrow style (bold, uppercase, tracked) in text.lo **#959591**.
- Empty state: "Nothing yet" in text.faint **#7a7a78**, indented to the row text column (x 1058).
- Each row is about 45 px at 1× (54 z) and is **indented about 28 px past the eyebrow** (badge at x 1058 vs eyebrow at 1030):
  `[badge]` 12 px `name` (bold, text.hi #f8f9f5) 12 px `dir hint` (regular, text.lo #90908e, e.g. "tests", "src/api", "receipts"), then a flexible spacer, then optional diffstat "+1 −1" (sage/rose, regular), 16 px, then a **pill**.
- Row order is the order files were touched (first at the top).
- Hover (frame 029): a full-width rounded row tint **#3c4048** (cool gray). Its radius matches the tree rows, it bleeds to the card's inner edge, and the pointer is an arrow.

### 2.6 ALL FILES tree
- Header row (no card): "ALL FILES" on the left at x 1018 and the project name uppercased ("WEATHER-APP", "TAX-RETURN-2026") right-aligned at x 1562. Both use the eyebrow style in text.lo **#93938d**.
- Rows: **45 px pitch at 1× (54 z, ≈29 css)**, no separators, no card.
- Indent per depth is 32 z ≈ 27 at 1× (**≈17 css**). In zoomed coordinates with d = depth: caret at 909 + 32d, folder icon at 943–972 + 32d, name at **993 + 32d**. File rows have no caret. Their badge (44 z wide) ends about 14 px before the name, and the name is at 993 + 32d for a file at depth d (so index.js at depth 1 aligns with folder "api" at depth 1).
- Caret: a small solid triangle ▸/▾ (about 8 px), #8d8e89.
- Folder icon: outline folder about 24×20 at 1× (≈15 css), stroke about 2 px, rounded. Default is steel blue **#698fad / #7a9eba**. It turns gold **#d2c193** while the folder holds uncommitted changes and gray **#4d4e48–#92938d** for hidden folders (.git).
- Names are regular weight text.hi **#f9f8f4**, and hidden entries (.git, .gitignore) use text.lo **#93938f**. Changed or state-carrying names switch to **bold** in the state color (see §3).
- Right meta column, right-aligned at x 1556 z, in text.lo **#949490**:
  - files: mtime ("15:40" for today, "3 Sep" / "12 Aug" / "5 Oct" otherwise)
  - changed files: "+1 −1" (sage/rose)
  - folders holding changes: "**1 changed**" in bold gold #ddbe84
  - files with a live state: the pill replaces the meta
- **State row highlight**: spans the full content width (x 889→1567 z, the same edges as the cards) and the full row height (55 z). Radius 10 z (≈5–6 css). The fill is a low-alpha tint of the state color over the panel (§3). Adjacent highlighted rows touch with no gap (frame 023), and each keeps its own rounded corners.
- Sticky footer, bottom-right of the pane (y ≈ 868 z): "● committing…" in bold green **#63eb8b**, then "● committed" in green with "a1c9e42" in text.lo. The dot is about 12 px.

### 2.7 File-type badges
- Rounded rect 44×28 z (≈24×15 css), radius 6 z (≈3 css), no border. The fill is a dark tint of the type hue (about 12–15% alpha; it brightens over a tinted row, so it really is alpha).
- Label: bold, uppercase, about 0.75× body (cap about 12 at 1×), sans (not mono), centered, colored with the type hue.

| Type | Label | Fill (on panel) | Fill (on state row) | Text |
|---|---|---|---|---|
| JavaScript | `JS` | #302e24 | #4a3c28 (edit row) | #e0cc9f gold |
| PDF | `PDF` | #2c1e20 | #432c3b (read row) | #c25e7b / #ca708a rose |
| CSV | `CSV` | #262c22 (#4a5f3f in touched list over hover) | — | #8eb674 / #adcc97 sage |
| JSON | `{ }` | #262c22 | — | #94bc7c / #a9cb92 green |
| Markdown | `MD` | #242a2e | — | #699ac7 / #87afd2 steel blue |
| Word | `DOC` | #262b2f | — | #5e85af / #8aaecd blue |
| git files | `GIT` | #22221e | — | #949591 neutral gray |

### 2.8 Status pills
- Capsule: 120×28 z (≈65×15 css), with **full radius** (height/2) and no border. Fill is a dark tint of the state hue and the text uses the bright state hue in **semibold**, about 0.9× body. Padding is about 16 z (≈9 css) horizontally.
- **Casing and tense** differ by place. The touched card uses Capitalized past/present: **Reading, Opened, Edited, Committed**. The tree uses lowercase progressive: **reading, editing, committed**.

| Pill | Where | Fill | Text |
|---|---|---|---|
| Reading | touched card | #2a1e30 | #ac73e6 → #bd8aeb |
| Opened | touched card | #2a1e30 | #a872e1 → #bb89ec |
| Edited | touched card | #2e2418 | #e78f49 → #e39c69 |
| Committed | touched card | #1c3020 | #5ce684-ish green |
| reading | tree row (on #2e2333) | #3c2c4c | #ac73e6 → #bc86ed |
| editing | tree row (on #32281e) | #4a3422 | #e59049 → #e49a64 |
| committed | tree row (on #203324) | #284c31 | #5ee987 → #77e899 |

### 2.9 Typography summary
- Font: the host UI sans (Inter-like; single-storey "a" is not used, so it is a two-storey grotesk). **No monospace anywhere in the mod.** The sha "a1c9e42" is sans.
- Scale (1× cap heights → ≈css font size):
  - Title: 21 → **18–19**, 600–700
  - Body and names: 15–16 → **14**, 400; bold for names in the touched list and for state names
  - Eyebrows: 12–13 → **11–12**, 700, uppercase, +0.08em
  - Pills: about 13, 600
  - Badges: about 10.5, 700, uppercase
  - Meta, times and dates: body size, 400, text.lo
- Weight carries the hierarchy: bold for the branch name, touched file names, state file names and "1 changed". Everything else is regular.

### 2.10 Iconography
Line icons, about 2 px stroke at 1×, rounded joins, filled only by their circle disc where one exists:
- eye: 30 px inside a 62 px disc
- pencil: diagonal, with an eraser end
- check
- 8-spoke asterisk
- git-branch: two nodes and a curve
- magnifier
- outline folder: tab top left
- ✕ close
- tree carets: small solid triangles

---

## 3. Measured palette

### Surfaces and lines
| Role | Hex |
|---|---|
| host chat bg | #151515 |
| host sidebar bg | #111111 |
| **pane bg** (warm olive near-black) | **#171813** |
| hero card fill | #1f201b |
| hero card border / divider / search border | #2e2f2a |
| search fill | #1d1e19 |
| button border | #3a3b36 – #40413c |
| touched card fill | #151515 |
| touched card border | #272824 – #2a2a2a |
| row hover (touched list) | #3c4048 |
| row emphasis (frame 021–022, probably video) | #373631 |

### Text
| Role | Hex |
|---|---|
| text.hi (titles, names) | #f7f7f3 – #f9f8f4 |
| button text | #d7d8d5 |
| text.mid (subline, legend, branch status) | #a6a7a1 – #a8a8a2 |
| text.lo (eyebrows, meta, placeholder, hidden, dir hint) | #90908e – #959591 |
| text.faint ("Nothing yet") | #7a7a78 |
| caret, close | #8d8e89 |

### Lifecycle states
| State | Name fg (bold) | Shimmer peak | Eyebrow / pill text | Legend dot | Row tint | Pill fill (row / card) | Disc fill | Disc glyph | Ancestor folder name |
|---|---|---|---|---|---|---|---|---|---|
| thinking | — | — | #ababa5 | — | — | — | #2c2e28 | #a8a9a3 | — |
| read (purple) | #9745e3 | ≈#e8dcff | #a06ad4 – #bd8aeb | #ba71f5 | #2e2333 | #3c2c4c / #2a1e30 | #362b3d | #b88fe5 | #6d3aa2 → #c6aad8 |
| edit (orange) | #e46a26 / #df6e29 | #fef4dd / #f5dfc0 | #e18a48 – #e59049 | #f48c37 | #32281e | #4a3422 / #2e2418 | #3c2c22 | #db894a | #ae5f3b |
| not committed (gold) | #debf82 / #e1cb9b | — | "1 changed" #ddbe84 | #e4c177 | none | — | — | — | #ddc185 (bold); folder icon #d2c193 |
| committed (green) | #43d66f | #e4fee9 | #5ce684 – #77e899 | — | #203324 | #284c31 / #1c3020 | #243e2c | #68d68c | #43975b – #56ab6f |
| ahead ↑N | teal #4ddcb1 | | | | | | | | |
| diff + / − | sage #9bc282 / rose #c96276 | | | | | | | | |
| default folder icon | steel blue #698fad / #7a9eba | | | | | | | | |
| branch icon | #517a9c / #7d9dbb | | | | | | | | |
| footer committed | #68df88, dot #4ff980 | | | | | | | | |

---

## 4. Motion (inferred from 2 s sampling)
1. **Name shimmer.** A narrow light band (3–5 glyphs wide) travels left to right across the name of each row with a live state. Inside the band the glyphs approach a near-white tint of the hue (orange → #fef4dd, green → #e4fee9, purple → near-white lilac). It also runs on the ancestor folder name ("tests", "receipts").
   - Evidence: the band sits at a different character in each row of one frame (desk-c**hair**, lap**top**/.pdf, phone-**bill**), so phases are **staggered per row**. It probably loops on a 1.5–2.5 s period.
   - Committed rows shimmer too, which suggests a "just happened" sweep that later settles.
2. **Row tint fade.** The tint, the pill and the bold colored name appear together when the state starts. They switch hue in place (read → edit → committed) and clear back to the plain row when the turn ends.
3. **Hero card swap.** Disc, eyebrow, title and subline change together on each tool event. The video shows a blur crossfade, but in-app it is probably an instant swap or a short fade.
4. **Footer.** "● committing…" (live dot, probably pulsing) is replaced by "● committed a1c9e42", which then lingers.
5. Counts ("1 FILE" → "2 FILES") and pills (Reading → Opened) update in place. No sliding or reordering animation is visible.

## 5. Interaction model
- The pane is opened next to the chat ("Files: <project>") and closed with ✕. The user is never pushed out of the chat.
- Search filters the tree as you type.
- Buttons:
  - **Refresh**: rescan.
  - **Collapse all**.
  - **Show sizes**: a toggle that swaps the meta column from mtime to size; the label probably flips to "Hide sizes".
  - **Up a folder** / **Back to project**: change the tree root.
  - **Hide hidden files**: a toggle for dotfiles, which are shown dimmed by default.
- Folders expand and collapse on click (caret ▸/▾). Rows are clickable to open a file, and hover tints the row.
- Touched-list rows are clickable and get a hover tint (frame 029); they probably jump to or reveal the file.
- The view is entirely passive and live. It is driven by tool events (Read → "reading/Opened", Edit/Write → "editing/Edited" plus diffstat, a git commit → "committing… / committed" plus sha plus ↑N).
- Non-git projects hide the branch row and the "Not committed" legend item.

---

## 6. How to build it with the drawing API (desktop)

| Part | Build with | Notes |
|---|---|---|
| Pane shell and header | `Box` column, paddingX ≈ 12 css, gap ≈ 14 css. Header: `Box` row with `Text` (text.lo) plus a spacer plus an icon `Button plain` "✕". | Panel bg is the host's; do not paint #171813 unless the host is transparent. |
| Hero card container | `Box` borderStyle round, borderColor #2e2f2a, backgroundColor #1f201b, padding ≈ 16 css. | |
| Hero top row (disc + eyebrow + title + subline) | **Must be Svg** (one Svg about 360×64 css, or Svg disc plus Svg eyebrow/title). | `Text` has no size or tracking. The 18–19 px title and the tracked uppercase eyebrow are the main look, and the tinted disc with a line glyph needs Svg. Subline can stay `Text` (text.mid) under it if Svg height is tight. Use `isInteractive` to crossfade on state change. |
| Divider | `Box` with only a top border (or a 1 px Svg line) in #2e2f2a. | |
| Branch row | `Box` row: Svg branch icon (16 css), `Text bold` "main", `Text` teal "↑1", spacer, `Text` text.mid status (diff spans in sage/rose, "1 changed" bold gold). | Text can do this; only the icon needs Svg. |
| Legend | `Box` row with gap; each item is `Text` "●" in hue plus `Text` text.mid label. | An Svg dot is optional. |
| Search | `Box` row (round border #2e2f2a, bg #1d1e19) containing an Svg magnifier (14 css) and an `Input` with placeholder "Find a file". | If `Input` draws its own frame, drop the Box border. |
| Six action buttons | `Box` flexWrap="wrap" gap ≈ 7; `Button` **secondary** ×6. | Hotkeys: r Refresh, c Collapse, s Sizes, u Up, p Project, h Hidden. Consider merging toggles (see weaknesses). |
| Touched card | `Box` round, bg #151515, border #2a2a2a. Header is a Svg eyebrow pair ("CLAUDE TOUCHED" … "2 FILES"); a `Text bold` uppercase fallback loses tracking and size. | Rows go in the Client module (below) or a column of Boxes with `hover` (bg #3c4048). |
| Touched row | Badge plus name plus dir plus diffstat plus pill. **Badge and pill should be Svg** (radius, smaller bold text). The fallback is `Text` with `backgroundColor` highlight `" JS "` / `" Edited "`, which renders square and at body size. | Name `Text bold` text.hi, dir `Text` text.lo, diff `Text` sage/rose. |
| ALL FILES header | Svg eyebrow pair (left label, right project name). | |
| Tree rows | **`Client` surface module** (`ClientModule`, as in `mods/filetree/hooks/rows.tsx`): `Box`/`Text` per row, `surface.onPointer` for hover/press, `surface.every(TICK_MS)` to advance a `phase` for the shimmer. | The row tint is a `Box backgroundColor` spanning the full width. The shimmer is per-glyph `Text` color: interpolate each char between the hue and its near-white peak by distance from `(phase + rowIndex·k) mod (len + band)`. The caret is a `Text` "▸/▾", and the folder icon is a `Text` glyph or Svg if the Client allows it. **Check whether `surface.elements` exposes `Svg`.** If not, badges and pills inside the tree must be Text highlight spans, which is the main fidelity gap. |
| Footer | `Box` row justifyContent flex-end: `Text` green "●" plus `Text bold` green "committed" plus `Text` text.lo sha. | Pulse the dot via `isInteractive` Svg or by toggling dimColor on a timer. |

**Must be Svg for this quality:** the hero title and eyebrow, the icon discs and glyphs, every uppercase tracked eyebrow, file-type badges, status pills, folder/branch/search icons. **Text is fine for:** subline, legend, branch row text, names, meta, diffstat, footer. **Client module for:** the tree (hover, press, keyboard, shimmer tick, virtualized scroll).

Conflicts with repo rules (`DESIGN.md`, `design/RESEARCH.md`): copy must be Turkish sentence case (e.g. "ŞU AN", "Claude okuyor: client.test.js", "CLAUDE'UN DOKUNDUĞU · 2 DOSYA", "TÜM DOSYALAR"). Hex values belong in Svg/Box only, and terminal theme keys apply (read → `suggestion`, edit → `claude`, committed → `success`, uncommitted → `warning`). RESEARCH.md assigns Tide/Kiln/Moss to read/edit/saved where the video uses purple/orange/green. Pick one and keep the 4-state lifecycle.

---

## 7. What makes it look premium (top 5) and its weaknesses

**Premium details**
1. **One lifecycle color language everywhere.** The same hue drives the legend dot, eyebrow, icon disc, row tint, pill, bold file name and the dimmed ancestor folder name. You learn it once from the legend.
2. **A narrative hero card.** "RIGHT NOW / Claude is reading client.test.js / in tests" reads as a sentence, with a 40 px tinted disc and a line glyph. It is not a log line, and it ends on a satisfying "DONE / Claude committed 2 files / a1c9e42".
3. **Tinted rows that stay quiet but alive.** Low-alpha full-width row tint plus a matching capsule pill plus a slow staggered shimmer on the name. Nothing blinks and nothing is saturated at full strength except small text.
4. **Typographic discipline.** Tracked uppercase gray eyebrows with right-aligned counts ("CLAUDE TOUCHED … 2 FILES", "ALL FILES … WEATHER-APP"), one title size, regular body, bold only for things that changed, and an even ≈14 css rhythm between blocks. Hairline borders sit only one step above their fill.
5. **Tiny tinted type badges instead of icons** (JS gold, PDF rose, CSV/JSON sage, MD/DOC blue, GIT gray), plus a right-aligned meta column that changes meaning by row (time, date, diffstat, "1 changed", pill). The card's past tense (Opened/Edited) against the tree's progressive (reading/editing) also helps.

**Weaknesses to fix**
- **Six equal-weight outline buttons in two rows.** This is heavy chrome above the content, and the toggles (Show sizes, Hide hidden files) do not show their state. Better: one row of 2–3 icon buttons plus an overflow menu, or segmented toggles.
- **Surface hierarchy is inconsistent.** The hero card is lighter than the panel (#1f201b) but the touched card is darker (#151515). The row hover is a cool blue-gray (#3c4048) inside an all-warm palette.
- **Contrast:** the purple name #9745e3 on row #2e2333 is about 3:1, "Nothing yet" #7a7a78 on #151515 is about 4:1, and the dir hints are borderline.
- **Semantics:** committed rows keep shimmering (shimmer should mean "in progress"). The casing and tense switch between card and tree is subtle and could read as inconsistent. The legend repeats on every state.
- **Text handling:** no long-name truncation or middle-ellipsis is shown. Big trees are not shown, so it is unclear whether the touched list scrolls or caps (it should cap at about 5 plus "+N more").

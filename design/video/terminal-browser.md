# Terminal Browser — visual spec from video (mod 08)

Source frames: `scratchpad/yt/frames/08-browser/NNN.jpg` (1600×900, one every 2 s).
Timestamp convention: `t = 579 s + (NNN − 1) × 2 s` (001 = segment start).
The product shots are a macOS terminal running Claude Code CLI (not the desktop app) with the browser drawn inside
the terminal as an image (kitty-graphics unicode placeholders, per the PR text). Terminal cell ≈ 8.6 × 19 frame px
in 004. Editorial overlays (not product UI): orange outline around the pane/window (004, 007, 008), the pop-out zoom
of the browser pane (008), blur transitions (005, 012).
Repo shown: `zenbu-labs/terminal-browser`, PR #113 "Claude code plugin".

---

## 1. Screens and states, in order

| # | t | Best frame | What is shown |
|---|---|---|---|
| S0 | 579–581 s | 001 → 002 | Title over camera: orange "08", serif "Terminal Browser", sans "a real browser beside your chat" (dot-matrix → type resolve). |
| S1 | 583 s | 003 | Zoomed CLI: slash-command menu while typing `/browser` — rows `/browser` (selected, lavender), `/terminal-browser` (match "browser" bold white), `/run`; right column descriptions ("Open a **browser** to t…", "A real **browser** runn… website side by sid…", "Launch and drive th… to confirm a change"). Prompt `❯ /browser` with magenta block cursor. Status line `manual mode on · PR #113` (#113 yellow, underlined link). |
| S2 | 585 s | 004 | Full terminal window: left = Claude Code transcript (`Claude Code v2.1.274`, model line, cwd; `/clear`; `/browser` → `⎿ terminal-browser: Opened terminal-browser`); right = browser pane on its start page `terminal-browser://start` with sections "Pull request", "Running servers", "Recent documents". |
| S3 | 587 s | 005 | Blur zoom; mouse pointer clicks the "#113 Claude code plugin" link. |
| S4 | 589 s | 006 | Pane now shows GitHub PR #113 (dark GitHub): tab strip with inactive tab "terminal-brows…" and active URL tab `github.com/zenbu-labs/terminal-browser/pull/113`; sticky PR header (green "Open" badge, title, branch chips); embedded video player; body text with blue links; right sidebar (Projects, Milestone, Development, 1 participant). Pointer over text. |
| S5 | 591 s | 007 | Zoom out: same page scrolled, inside the full terminal window. Transcript unchanged on the left. |
| S6 | 593 s | 008 | Editorial pop-out of the pane, scrolled to top: GitHub mobile header (hamburger, Octocat, "Sign in"), repo line `zenbu-labs / terminal-browser` Public, Notifications / Fork 140 / Star 3k, tabs Code · Issues 30 · Pull requests 34 · Actions · Projects; "Claude code plugin #113". URL highlighted (editorial). |
| S7 | 595–599 s | 009, 010, 011 | Slides: "Save the time and the headspace / of jumping between Claude and a browser" — Claude window icon ⇄ Browser window icon with two curved arrows, a stopwatch in the middle, an orange dot travelling the loop. 010 Browser outlined orange; 011 "Check every change / to your code or to your design": Claude window has an orange line, Browser main box filled orange-tint. |
| S8 | 601–603 s | 012, 013 | The two windows slide together (012, headline blurred) and merge into one split window with a double orange+cream frame: "Everything stays in one place / a real web browser right beside your chat". Labels "Claude" / "Browser". |
| S9 | 605–607 s | 014, 015 | "Work mainly in the terminal? / then this mod may be for you" + caption "Terminal Browser" / repo. 015: orange `>_` badge pops onto the window's top-left corner. |

Near-duplicates checked: 014≈015 (badge only), 010≈009 (dot/highlight position), 013≈014 (headline + caption).

---

## 2. Layout breakdown

### 2.1 Terminal shell around it (004)
- Window bg `#0b100a` (greenish near-black), titlebar with traffic lights + "✳ Claude Code".
- Split: transcript column left ≈ 47 % of width; browser pane right ≈ 53 %, spanning from the top of the transcript
  area down to just above the prompt rule. Bottom: prompt `❯` row between two 1 px rules (`#4c5048`), then status
  line.
- Status line (mono, `#757973`): `⏸ manual mode on · PR #113 · ← 5 agents`; `#113` yellow `#d5c35e`, underlined
  (hyperlink).

### 2.2 Browser pane frame
- Outer frame/gutter: warm dark `#2c2723`, ~4 px each side around the pane (looks like a floating window inset).
- Chrome strip (height ≈ 1.3 terminal rows, 26 frame px): bg `#222721`, 1 px top highlight `#5a5f59`, 1 px bottom
  separator `#393e38`.
  - Left: reload `⟳` 12 px, `#9a9b96`.
  - Tabs: inactive tab = plain text "terminal-brows…" `#888d8b` (ellipsised ~16 ch); active tab = rounded pill
    (radius ≈ 6 px) fill `#3b403a` with favicon + URL text `#cbd0cd` (start page: the URL is centred, no pill).
  - Right: `+` (new tab), `⋯` (menu) `#9a9b96`; `×` close sits on the outer frame's top-right corner.
- Content: bg `#0c110b` (start page) / page's own bg (GitHub `#081013`), thin scrollbar on the right
  (thumb `#84888c`, ~4 px, rounded).

### 2.3 Start page `terminal-browser://start` (004) — the mod's own UI
Monospace throughout, single column, content padding ≈ 4 cols left/right, generous vertical rhythm:
```
Pull request                                   ← section label, dim
#113 Claude code plugin                        ← link
──────────────────────────────────────────     ← 1 px divider
Running servers
localhost:3306                      com.docke  ← link · right-aligned process (truncated 9 ch)
localhost:4747                           node
… (10 rows)
──────────────────────────────────────────
Recent documents
claude-code-plugin/README.md               2h  ← link · right-aligned relative age
README.md                                  4h
/tmp/plan.html                            27h
```
- Section label: regular, `#868a88`, slightly smaller than rows (≈ 0.9×).
- Link rows: `#7086a4` (peak `#8899c4`) muted steel blue, no underline at rest; row pitch ≈ 1.5 terminal rows.
- Right column: `#919593`, right-aligned to the content edge; truncated without ellipsis.
- Divider: 1 px `#1a1f19`, ≈ 1.3 rows above and below. Label → first row ≈ 1.6 rows.
- Ordering signals priority: current PR first, then live dev servers (with owning process), then recent files.

### 2.4 Rendered web page (006–008)
Real Chromium rendering at the pane's width (GitHub switches to its narrow layout). Sticky PR header: green "Open"
pill `#16b32c` with white text, title bold `#f0f8fb` + `#113` gray `#838b8e`, author link underlined, branch chips
fill `#0c1c2c` text `#4a7ba3`, copy icon. Body text `#e5edf0`, links `#5582a8` underlined. Sidebar labels `#8e9699`,
values `#dbe3e6`, 1 px dividers.

### 2.5 Transcript bits (004)
- Past command rows: `/clear` full-width highlighted bar `#343933`; `/browser` short chip `#303430`; text
  `#cacfc9`.
- Tool output: `⎿ terminal-browser: Opened terminal-browser` `#c4c6c2`.
- Header: "Claude Code" bold `#e7ece6`, version + meta `#747973`.

### 2.6 Slash menu (003)
- Two columns: command (left, ~22 ch) and description (right).
- Selected row: command + description in lavender `#b6b4de`, matched word "browser" bold.
- Unselected rows: gray `#919690`; matched substring bold white `#f7fcf7`.
- Prompt glyph `❯` white; typed text lavender `#b3b1ce`; block cursor magenta `#cc0078`.

### 2.7 Explainer illustrations (009–015)
- Bg `#1c1b16` + dot grid (3 px dots, 10 px pitch, `#3a3832`→`#5f5d58`, brighter toward the bottom, wavy top edge).
- Window icons: 2 px cream `#e4e4d8` outlines, radius ~14 frame px. Claude window: three hollow 10 px circles in a
  title bar separated by a 1 px line; coral asterisk `#cd7a68`; orange chevron `>` `#e36a33`; 4 rounded gray bars
  `#555148` (8 frame px thick); one bar orange `#ee6120` when "a change" happens. Browser window: tab shape, url
  capsule, main box, 3 tiles; main box active = fill `#4d2c19` + 2 px border `#d86c40`.
- Arrows: 2 px `#8a897c` curved, arrowheads open; travelling dot Ø 14 frame px `#ec6018`.
- Stopwatch: cream ring, crown, orange hand.
- Merged window (013): one frame, split by a 2 px vertical cream line; double outline = 3 px orange `#e85c20` outer +
  2 px cream inner with 4 px gap. Labels below ("Claude", "Browser") bold cream sans.
- Badge (015): Ø ≈ 64 frame px orange `#f0601c` circle, black `>_` glyph, overlapping the top-left corner.
- Caption: "Terminal Browser" bold cream `#ebe8dc`; GitHub mark + `zenbu-labs/terminal-browser` `#8c8a81`.

---

## 3. Measured palette (hex)

Terminal + pane:
| Role | Hex |
|---|---|
| terminal bg | `#0b100a` |
| pane outer frame | `#2c2723` |
| chrome strip bg | `#222721` |
| chrome top highlight / bottom separator | `#5a5f59` / `#393e38` |
| active tab pill | `#3b403a` |
| active tab text | `#cbd0cd` |
| inactive tab text | `#888d8b` |
| chrome icons (reload, +, ⋯) | `#9a9b96` |
| start page bg | `#0c110b` |
| section label | `#868a88` |
| link | `#7086a4` (peak `#8899c4`) |
| right meta (process, age) | `#919593` |
| section divider | `#1a1f19` |
| scrollbar thumb | `#84888c` |
| transcript text | `#c4c6c2` |
| dim meta / status | `#757973` |
| past-command highlight | `#343933` |
| status link (#113) | `#d5c35e` |
| slash-menu selected | `#b6b4de` |
| slash-menu unselected | `#919690` |
| match bold | `#f7fcf7` |
| block cursor | `#cc0078` |
| prompt rules | `#4c5048` |

GitHub page (reference only): bg `#081013`, Open `#16b32c`, link `#5582a8`, body `#e5edf0`, branch chip
`#0c1c2c`/`#4a7ba3`.

Slides: bg `#1c1b16`, cream `#e4e4d8`/`#ebe8db`, orange `#ee6120`/`#f0601c`, orange tint fill `#4d2c19`, gray bar
`#555148`, arrow `#8a897c`, coral asterisk `#cd7a68`, caption gray `#8c8a81`.

Theme-key mapping (DESIGN.md): links → `suggestion`; labels/meta → `dimColor`; status link → `warning`;
selection → `claude`/`suggestion` (one accent per mod).

---

## 4. Motion inferred

- `/browser` opens the pane immediately (004 shows it in the same turn as the tool output line).
- Link click → page load inside the pane (005 blur is editorial; in product expect a short load then repaint).
  Tabs: the start page stays as the first (inactive) tab and the clicked URL opens as a new active tab.
- Mouse works inside the pane (pointer visible in 005/006); scrolling is smooth (006→007 page scrolled).
- Slides: travelling dot loops clockwise along the two arrows (≈ 1 lap per 4–6 s), stopwatch hand rotates; active
  highlight alternates between the two windows; the windows translate toward each other and merge (012→013); badge
  scale-pops in (014→015).

---

## 5. Interaction model

- Entry: `/browser` (alias `/terminal-browser`) toggles the pane beside the chat. Status line shows mode and the
  current PR link.
- Start page = launcher: open the current PR, any running localhost server (with owning process), or recent
  documents in one click.
- Pane chrome: reload, tabs (click to switch), `+` new tab, `⋯` menu, `×` close. Real mouse + keyboard into the
  page ("manual mode on" in the status line = the user is driving; Claude can also drive it to verify a change).
- Purpose: check every change (code or design) without leaving the chat; Claude and browser share one place.

---

## 6. Build with the drawing API (desktop)

A real page cannot be rendered with Box/Text/Svg; build the mod's own surfaces and hand the actual browsing to the
desktop app's browser surface (or the system browser) on link press.

| Part | Build | Notes |
|---|---|---|
| Pane container | `Box flexDirection="column" borderStyle="round" borderColor=frame backgroundColor=content` in a side Pane | Frame/gutter colour via borderColor. |
| Chrome strip | `Box flexDirection="row" alignItems="center" backgroundColor=chrome paddingX columnGap`: `Button plain` reload (Svg ⟳ 14 px), tab `Text dimColor` "terminal-brows…", active tab `Box borderStyle="round" backgroundColor=#3b403a-equivalent` + `Text`, `Box flexGrow={1}`, `Button plain` `+`, `⋯`, `×` (hotkeys e.g. `r`, `t`, `w`) | Icons as `Svg` (16 px, 1.5 px stroke) for crispness; `Text` glyph fallback ok. |
| Start page sections | Per section: `Text dimColor` label; rows `Box flexDirection="row" justifyContent="space-between"` with `Button plain` (link colour) on the left and `Text dimColor` meta on the right; divider = `Box height={1}` with backgroundColor, or `Text dimColor` "─" run | No Svg needed. Keep mono feel by using `Code`-styled text only if needed; Text is fine. |
| Pull request link | `Button plain label="#113 Claude code plugin"` | Primary target, first in the list. |
| Running servers | rows from a port scan: `localhost:<port>` + process (truncate 9 ch) | Matches 004 exactly. |
| Recent documents | path + relative age (`2h`, `27h`) | |
| Page view | Out of API scope. Option: `Svg` with an embedded page screenshot (`<image href="data:…">`) if the host allows it; otherwise open in the desktop browser pane and show a one-line "opened in browser" state | Video quality page rendering only exists in terminal via kitty graphics. |
| Status line item | Band row: `Text dimColor` "manual mode on · PR " + `Text color=warning underline-like` "#113" | One line, per DESIGN.md band rules. |
| Explainer/onboarding art | `Svg` (windows, arrows, travelling dot animated with `isInteractive`) | Optional empty state for the pane. |

Must be `Svg` for video quality: chrome icons (reload/plus/kebab/close), favicon, any onboarding illustration; the
page itself can't be matched with these primitives.

---

## 7. What makes it look premium / weaknesses

Premium details:
1. The start page is a useful launcher, not a blank tab: current PR, live dev servers with their process names, and
   recent docs — context the agent already knows.
2. Quiet chrome: one tinted strip, one pill for the active tab, everything else text-level gray — the page content
   dominates.
3. Consistent monospace rhythm with right-aligned meta columns and hairline section dividers.
4. It is a real browser (real GitHub rendering, video player, mouse) inside the terminal — no context switch.
5. Status-line integration (`manual mode on · PR #113` as a clickable link) ties pane, PR and session together.

Weaknesses:
- Link blue `#7086a4` on `#0c110b` is low-contrast and has no hover/focus indication visible.
- Process names hard-truncate at 9 chars ("com.docke", "smolvm-bi") without ellipsis — reads as a bug.
- Narrow pane forces mobile layouts (GitHub mobile header in 008); no width control shown.
- Pane frame/gutter colour (`#2c2723`) clashes slightly with the green-black terminal.
- Terminal-only technique (kitty graphics); on the desktop surface it has to degrade to a launcher.

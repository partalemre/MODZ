# Savvy Progress — visual spec from video (mod 01)

Source frames: `scratchpad/yt/frames/01-savvy/NNN.jpg` (1600×900, one every 2 s; scratchpad =
`/private/tmp/claude-501/-Users-partalle-Projects-MODZ/70292652-cd27-4e0b-9f15-f1788c692c87/scratchpad`).
Timestamp convention: `t = 120 s + (NNN − 1) × 2 s` (001 = segment start; matches the video's "02:02 Mod 1" and
"03:02 How a mod works" chapter marks → frames 002 and 032/033).
Frame scale `k` = frame px per CSS px, from body-text cap height (16 px body ⇒ 11.2 px cap):
full app view (006, 011, 012, 021–030) k ≈ 1.34 · panel zoom (031) k ≈ 1.70 · band close-ups (007, 008) k ≈ 1.76 ·
transcript close-ups (009, 010) k ≈ 1.96. CSS sizes below = frame px ÷ k, rounded to a 2 px grid.
Editorial effects that are NOT product UI: orange rounded call-out rectangles (007, 008, 010, 018–020), the
"pop-out" enlarged card with its own 1 px `#3b3c37` border and shadow (017–020), the dimming of everything except the
panel (011, 012, 017–028: text drops to `#666`, bg stays `#151515`), the giant mascot line-up with labels
"Developer"/"Designer" (022–027) and the crabs flying back into the cards with motion blur (028).

---

## 1. Screens and states, in order

| # | t | Best frame | What is shown |
|---|---|---|---|
| S0 | 120 s | 001 | Intro slide "Here are the ones I've tried and liked" (Tried/Liked/Useful orange ring icons). |
| S1 | 122–124 s | 002 → **003** | Orange pixel-font numeral "01" assembles from particles; serif title "Savvy Progress", sans sub "see every helper at work". |
| S2 | 126–128 s | 004 → **005** | Slide "The right mix / useful, fun and delightful": Venn of "Useful" (icon = orange progress capsule) and "Fun" (sparkle), overlap filled orange. |
| S3 | 130 s | **006** | Desktop Code tab, session "Cold brew launch kit" (tag `brand-launch`). User msg `/savvy-flow:savvy-flow Build the launch kit…`; reply "Here's the plan: four tasks…"; tool line **`savvy-progress · progress  Tasks 0/4`** (last part purple); "3 background agents launched" with `├ └` tree of 3 tasks. No band yet. |
| S4 | 132 s | **007** | Band above composer, close-up: `● Launch kit  [dither ▸ Tasks 1/4 ▸ dim dither … ┃ ……]  25%  🦀  ×4  ✕`. GitHub credit "Savvy Progress by Johnny (@JohnnyVizz)" (video caption). |
| S5 | 134 s | **008** | Same band, `Tasks 2/4`, 50 %: pill has slid right, dense dither behind it. |
| S6 | 136–138 s | 009, 010 | Transcript close-up of the 3-task tree (call-outs on each line). |
| S7 | 140–142 s | **011**, 012 | Agents side panel open (right, 500 frame px ≈ 372 CSS). Title "Agents" ✕; "Launch kit"; tiles Cost ≈$0.25 / Tokens 249k / Time 0:26; "Collapse"; **Running · 1** (Build the landing page, light, 3/5 · Hero copy, green bar 60 %, green dot); **▾ Finished · 2** (Design the launch graphics — medium/blue 4/4 ✓; Research competitor launches — careful/amber 4/4 ✓); **Planned · 1** ("4. Review the whole kit", heavy, "Opus · xhigh · after 1, 2, 3", dimmed mascot, clock icon, no bar). Band still `Tasks 2/4 50%`. 012 = +2 s: Time 0:28, Tokens 254k, card time 0:27. |
| S8 | 144–150 s | 013–016 | Explainer "Subagents / helper Claudes your main agent can spawn": orange invader sprite = main agent, three cream blob sprites = helpers, tool tiles (search / image / layout) move above helpers. |
| S9 | 152–158 s | **017**, 018, 019, 020 | Zoom on running card (pop-out is editorial): 3/5 · Hero copy → **4/5 · Signup**, bar grows, ctx 4 % · 40k → 41k, ≈$0.07 → ≈$0.08, time 0:37 → 0:43; Cost tile ≈$0.27 → ≈$0.28. |
| S10 | 160 s | **021** | Build finished → top of **Finished · 3**; Review moved Planned → **Running · 1** ("0/3 · Brief", heavy red dot, empty bar); Planned group gone. Band pill relabels **`Review 3/4`**, 75 %, dim dither now reaches the end of the track. |
| S11 | 162–172 s | **023** (022, 024), **026** (025), 027 | Mascot reveal (editorial overlay, but this is the cleanest art reference): 4 crabs at ~13 px/unit — brown explorer hat + mallet, green racing cap + chequered flag, chef toque + pan, yellow hard hat + pickaxe. 025/026 swap two of them for "Designer" (crimson beret, palette, brush) and "Developer" (headphones, laptop). 027 composer: "Customize my agent crabs: one designer, one developer". |
| S12 | 174–178 s | 028, **029** (030) | Done: **▾ Finished · 4** (Review heavy 3/3 red bar on top, then Build — now *Developer* mascot, Design — now *Designer* mascot, Research). Band: green dot, green dither full width, green pill **`Done`**, `100%`. |
| S13 | 180 s | **031** | Panel zoom (k 1.70): best reference for card typography and bar/check geometry. |
| S14 | 182 s | 032 | Host on camera ("How a mod works" chapter). |
| S15 | 184–236 s | 033–059 | Explainer slides (§2.8): "How does a mod work?" → "Every time Claude does something" (pills "ran a command", "edited a file") → "A mod listens for events" ({ } mod box) → "One of three things: Watch / Change / Handle" (arched doors) → "Savvy Progress actually uses all three" → Watch: "It watches every helper — the model, the tokens, roughly the cost" (Opus 5.5, # 49k tokens, ≈ $0.12) → Change: "It draws the area above your prompt" / "It adds a progress bar and a side panel" (bar + helper ×2 badge) → Handle: "It draws the whole Agents panel by itself" (mini panel: Cost ≈$0.34 / Tokens 196k / Time 0:18, rows "Opus 5.5 ≈$0.12 / ≈$0.22" with hatted cream mascots) → "You don't need to know any of this" → "Claude Code has a built-in skill: plugin-authoring" → "Describe what you want and Claude builds it". |

Near-duplicates checked and skipped for detail: 012≈011 (numbers tick), 018≈017 (call-out), 020≈019, 022/024≈023,
030≈029, 043≈042, 054≈053 (blur-out).

---

## 2. Layout breakdown

### 2.1 Progress band (above the composer) — S4/S5/S7/S10/S12
One row, vertically centred, no background and no frame (sits on page bg `#151515`). Left edge = composer outer
left edge, right edge = composer outer right edge. Gap band → composer top ≈ 12 CSS (17 frame @1.34).
```
[● 10] 9 [Launch kit (semibold)] 24 [════ track (flex) ════] 22 [25%] 12 [crab 24×16] 22 [×4] 20 [✕]
```
- Status dot: 10 CSS circle, accent fill (purple while running, green when done).
- Title "Launch kit": body size (≈16 CSS), semibold, `#f4f4f4`.
- Track: height ≈ 20 CSS (26 frame @1.34), fully rounded (r = h/2), fill `#2c2c2c`, flex-grows (193 CSS here).
  It is a **dot-matrix**: 5 rows of square cells, pitch ≈ 4 CSS (cell 3 + gap 1; 6.5 frame @1.76).
  Three zones, left → right:
  1. *Done zone* (0 → progress): ~30–40 % of cells lit at random in full accent (`#8f86d8`… `#9085ed`), the rest
     show the track colour.
  2. *In-flight zone* (progress → launched fraction): ~3–5 % of cells lit in dim accent `#4d4a5d`.
  3. *Planned zone*: plain track. Boundary 2↔3 is a **tick**: 2 CSS wide, ≈ 50 % of track height, centred,
     `#5a5a5a`. Tick sits at launched/total (007: 3 of 4 launched → tick at 75 %). When all are launched
     (021) there is no tick and the dim zone runs to the end.
- **Pill** rides the fill head: its right edge = progress position; height = track height; r = h/2; padding-x ≈
  16–18 CSS; fill = accent; label white `#ffffff`, semibold, body size. Label = phase + count:
  `Tasks 1/4` → `Tasks 2/4` → `Review 3/4` (when a dependent/planned phase starts) → `Done` (green pill).
  The dense dither shows only between track start and the pill's left edge.
- `25%`: regular, `#929292`, tabular digits.
- Crab: base Clawd sprite 12×8 units at 2 CSS/unit = 24×16 CSS, body `#d46c54`, eyes = 1-unit dark holes.
  No hat in the band. Walk-in-place (§4).
- `×4` (agent count): regular, `#cbcbc8`.
- `✕` close: 12 CSS glyph, 1.5 px stroke, `#767674`.

### 2.2 Transcript tool line (S3) — host-rendered, but the mod's text
`savvy-progress` (semibold, `#d4d4cf`) ` · progress` (regular, `#8d8e8a`) two spaces `Tasks 0/4` (regular, accent
`#9b94da`). This is the `progress` tool registered by the plugin; its result text is the same "Tasks n/N" label as the
pill.

### 2.3 Agents panel (pane, right dock) — S7/S10/S12/S13
Pane: bg `#171813`, 1 px left divider `#272823`, width ≈ 372 CSS at this window size; padding-x 16 CSS.
Vertical stack (CSS):
```
Agents (pane title, ≈20 px regular, #aeaea9)                       ✕ (12, #a8a9a4)
  31 (baseline→baseline)
Launch kit (semibold ≈16, #f4f4f1)
  14
[ Cost        ] 8 [ Tokens      ] 8 [ Time        ]      ← 3 equal tiles, h 43
[ ≈$0.25      ]   [ 249k        ]   [ 0:26        ]
  18
Collapse (regular body, #aeaea9)                          ← text button, no icon
  24
Running · 1 (regular, #8c8d88)                            ← group header
  ~22
[agent card] … separator … [agent card] …
▾ Finished · 2  (disclosure ▾ 8 px, #afb1ab; label #abaca7)
Planned · 1
```
- **Tiles**: fill `#262722`, no border, radius ≈ 6 CSS, padding 10 CSS top / 10 CSS sides; label "Cost/Tokens/Time"
  ≈ 12 CSS regular `#a5a7a3`; value ≈ 16 CSS semibold `#f4f4f1`, "≈" prefix on cost.
- **Agent card** (row pitch ≈ 72 CSS; content left = panel padding):
  ```
  [mascot 32×32] 10 [Build the landing page (semibold ≈15, #f4f3ef)]                      [status 12]
                    [light (tier colour)] [Opus 5.5 · low (#a7a7a3)]
                    [3/5 · Hero copy (#f0efed)] ………………… [ctx 4% · 38k ≈$0.05 0:25 (#a2a39f)]
                    [══════════ bar 5 px, r full ══════════]
  ─────────────────────────── separator 1 px #2f302b ───────────────────────────
  ```
  - Mascot column 35 CSS (sprite incl. hat/props ≈ 32×31 CSS, 2 CSS/unit), vertically centred on the 3 text lines.
  - Text column starts 10 CSS after mascot; line pitch ≈ 18 / 16.5 CSS; meta lines ≈ 13–14 CSS regular.
  - Line 2: tier word coloured (light / medium / careful / heavy), then model + effort in gray
    ("Opus 5.5 · low", "· medium", "· high", "· xhigh").
  - Line 3 left: step counter + current step name ("3/5 · Hero copy", "0/3 · Brief", "3/3 · Summary"; finished shows
    only "4/4"). Right-aligned to the bar's right end: `ctx 4% · 38k ≈$0.05 0:25` (context %, tokens, cost, elapsed).
  - Bar: 5 CSS tall (7 frame), fully rounded, track `#2c2d28`, fill = tier colour, width = steps done / steps;
    right end stops ≈ 25 CSS before the panel edge (leaves the status column free).
  - Status column (right, top-aligned with the title): running = 8 CSS dot in tier colour (pulsing); finished =
    check 13×10 CSS, ~1.5 px round stroke, green `#5fa877`; planned = clock 13 CSS outline, `#a8a9a4`.
  - Planned card: title prefixed with its order number ("4. Review the whole kit"), line 2
    "heavy Opus · xhigh · after 1, 2, 3" (`after …` = dependencies, `#83847f`), no line 3, no bar, mascot at ~45 %
    opacity.
  - Separator 1 CSS `#2f302b` full content width, 7 CSS below the bar.
- Group ordering: Running (top) → Finished (most recently finished first) → Planned. Empty groups are hidden.

### 2.4 Mascots (pixel crabs) — the key brand element
Base sprite (Claude Code "Clawd"), 12 × 8 units, `B` body `#d46c54` (≈ Clawd `#d77757`), `e` eye (dark, `#151515`):
```
r0  . . B B B B B B B B . .
r1  . . B e B B B B e B . .
r2  B B B B B B B B B B B B        ← arms rows 2–3, 2 units each side
r3  B B B B B B B B B B B B
r4  . . B B B B B B B B . .
r5  . . B B B B B B B B . .
r6  . . B . B . . B . B . .        ← 4 legs: cols 2, 4, 7, 9
r7  . . B . B . . B . B . .
```
Unit = 2 CSS px everywhere (band crab 24×16; card mascot ≈ 32×31 incl. accessories; editorial big crabs 13.25
frame px/unit). Variant "arm raised": the right arm moves from rows 2–3 to rows 0–1 (cols 10–11) when the
crab holds a prop up (flag, mallet, pan, brush).

Accessories by tier (hat colour = tier bar colour — the strongest identity cue):
| Tier (effort) | Hat (rows −1…−4 above r0, cols 1–10) | Prop | Palette |
|---|---|---|---|
| light (low) | green racing cap: dome cols 2–9 rows −3…−2, 1-unit white stripe at col 5, black brim line row −1 with green peak pointing right (col 10) | chequered flag 2×2 (black/white checks) on a 1-unit gray pole at col 11, rows −5…0, right arm raised | cap `#24ac74`, stripe `#f2f2ea`, brim `#242424`, pole `#8c949c` |
| medium (medium) | chef toque: white puff rows −4…−2 (three bumps on top), gray shading; blue band row −1 cols 2–9 with a red 1-unit patch at col 2 | dark pan/spatula held up right (cols 10–12, rows −1…0) + 1-unit yellow spark top-right | `#f2f2ea`, shade `#c8c8c0`, band `#3c8cdc`, patch `#ac5444`, pan `#4c4c44`, spark `#e0b030` |
| careful (high) | yellow hard hat: dome rows −3…−2 cols 3–8, brim row −1 cols 1–10; orange lamp box (2×1) at top centre with a pale-yellow light 1 unit below | gray pickaxe floating at left (cols −3…−1, rows −1…1) with a white sparkle | `#eccc44`, shade `#c49c24`, lamp `#b4741c`, light `#f4dc8c`, pick `#8c949c` |
| heavy (xhigh) | brown explorer hat: dome rows −4…−2 with 4–6 tan dots, red-orange band row −1 cols 1–10 | mallet: blue-gray 2×2 head at cols 10–11 rows −4…−3 on a brown handle, right arm raised | hat `#744424`, brim `#54341c`, dots `#9c6c44`, band `#cc4c34`, head `#7c9cac` |
| custom "Developer" | headphones: dark band row −1 cols 2–9, purple ear cups 1×2 at cols 1 and 10 rows 0–1 | laptop held in front: light-gray slab cols 3–8 rows 3–5, lighter top edge, purple 1-unit logo | band `#3c3c3c`, cups `#8c84ec`, laptop `#b4bcc4`/`#d4d4dc` |
| custom "Designer" | crimson beret rows −2…−1 cols 2–9, darker underside, 1-unit nub on top | brush raised right (handle diagonal to col 12 row −4, blue tip), paint palette left (cols −2…−1 rows 2–3, tan with red + blue dots) | beret `#cc3454`/`#942434`, palette `#dcbc94`, tip `#44ace4` |

### 2.5 Iconography
- Panel ✕, band ✕: thin line cross, 1.5 px, round caps, gray.
- Check: open check mark, round caps, ~1.5 px, green. Clock: circle + two hands, 1.5 px, gray. Disclosure ▾: solid
  small triangle (8 CSS), gray. Running dot: solid circle 8 CSS.
- No icon on "Collapse" (plain text button).

### 2.6 Typography
System UI sans (Segoe-/Inter-like) throughout; no mono in this mod.
Hierarchy (CSS): pane title ≈ 20 regular gray › section/card titles ≈ 15–16 semibold near-white › body/meta ≈ 13–14
regular gray › tile labels ≈ 12 regular gray. Emphasis comes from **weight and colour**, not size (tile values and
card titles are the only semibold white). No uppercase eyebrows inside the mod (the video slides use them, §2.8).
Numbers are not visually tabular in the video, but they tick live — use tabular figures to avoid jitter.

### 2.7 App chrome seen around it (not mod UI)
Sidebar `#111111`, selected session row `#343434` radius ≈ 7 CSS with orange status dot; composer `#1f201b`
(1 px border `#2a2a26`, radius ≈ 10 CSS); user bubble `#2a2b26`; tag chip `#2b2c29`/text `#8c8d87`.

### 2.8 Explainer illustrations (S0–S2, S8, S15) — optional hero art
Slide bg `#1c1b16`; halftone dot field (≈ 3 px dots, 10 px pitch, `#3a3832` → `#666560` brighter toward the bottom,
top edge shaped like a soft waveform). Headline transitional serif (Tiempos/Copernicus-like) semibold cream
`#e9e7da`; sub geometric sans (Outfit-like) cream. Orange `#f06120`. Window/box outlines 2 px cream `#cecbbe`,
radius ≈ 14 px, fill `#1f1e19`. Event pills: fill `#2d2a23`, 2 px border (cream idle, orange `#c97350` when firing),
leading orange line icon (`>_`, file-pen, blob). Signal = 2–3 concentric orange arcs. Doors: arch tiles idle fill
`#333029` cream border; active fill `#522f1b`, orange border + orange label `#e66830`. Tab pills Watch/Change/Handle:
idle 2 px border `#3c3c35` text `#8e8c7f`; active orange border, fill `#362417`, text `#e8662c`, line icon (eye /
pencil / hand). Mini panel: tiles `#2d2a22` with 1 px `#3d3a33` border, bar track `#38372e`, bar `#f25f1f`.
Main-agent sprite = orange invader `#f1601f`; helper sprite = cream blob `#e6e3d0` with two dark eyes.

---

## 3. Measured palette (hex)

Neutral (desktop, dark):
| Role | Hex |
|---|---|
| page bg (band sits on it) | `#151515` |
| sidebar bg | `#111111` |
| pane bg | `#171813` |
| pane left divider | `#272823` |
| tile fill | `#262722` |
| card separator | `#2f302b` |
| bar track (panel) | `#2c2d28` |
| band track | `#2c2c2c` |
| composer fill / border | `#1f201b` / `#2a2a26` |
| text primary (titles, values) | `#f4f4f1` |
| text step line | `#f0efed` |
| text secondary (model, meta, labels) | `#a7a7a3` / `#a2a39f` / `#a5a7a3` |
| text muted (group headers) | `#8c8d88` |
| text faint ("after 1, 2, 3") | `#83847f` |
| pane title / Collapse | `#aeaea9` |
| band % / ×N / ✕ | `#929292` / `#cbcbc8` / `#767674` |

Accent / state:
| Role | Hex |
|---|---|
| running accent (dot, pill, tool-line text) | `#9085ed` (tool line `#9b94da`) |
| dither lit cell (running) | `#8f86d8` |
| dither dim cell (in-flight) | `#4d4a5d` |
| launched tick | `#5a5a5a` |
| done accent (dot, pill, dither) | `#67cb90` |
| pill label | `#ffffff` |
| finished check | `#5fa877` (ink `#599f70`, peak `#6ea484`) |
| clock icon | `#a8a9a4` |

Tiers (bar fill = solid sample; word = measured ink at 13 px, which reads darker because of anti-aliasing —
recommended word colour in brackets):
| Tier | Bar | Word ink | Recommended word |
|---|---|---|---|
| light | `#29ad74` | `#569175` | `#3fbf86` |
| medium | `#438bd5` | `#5d82a8` | `#5b9be0` |
| careful | `#b0751e` | `#977756` | `#c98a2e` |
| heavy | `#c95035` | `#9f5c54` | `#d8664c` |
Running dot = tier colour at 40–100 % opacity (pulse).

Mascot: body `#d46c54` (use Clawd `#d77757`), eyes `#151515`; accessory hexes in §2.4.

Video brand: bg `#1c1b16`, cream `#e9e7da`, orange `#f06120`, surface `#1f1e19`, tile `#2d2a22`.

Theme-key mapping for DESIGN.md (no raw hex in mods): running accent → `suggestion`; done/check/light → `success`;
careful → `warning`; heavy → `error`; medium → `suggestion` (or a second neutral blue if available); crab body →
`claude`; all grays → default/`dimColor`. Hex above is reference only (Svg art may keep fixed hexes).

---

## 4. Motion inferred from consecutive frames

- **Pill slide**: 007 → 008 (2 s) the pill moves from 25 % to 50 % and its label changes in place; implies a
  ~300–400 ms ease-out translate per completed task, dense dither revealed behind it.
- **Dither twinkle**: the lit-cell pattern in the done zone differs between 007 and 008 (≈ half the cells change) →
  cells re-randomise continuously (≈ every 150–300 ms, a few cells at a time), giving a shimmering "matrix" fill.
  On `Done` the whole track goes green with ~35–40 % cells lit.
- **Crab walk-in-place**: crab x is fixed (frames 007/008 bbox identical; 011–029 identical), but leg lengths
  alternate between frames: pair cols 2 & 7 vs pair cols 4 & 9 lifted by 1 unit → 2-frame walk cycle
  (≈ 200–250 ms per frame, inferred). Body does not bob (all four big crabs share the same body/leg baseline);
  in the big render one leg pair is ~½ unit shorter than the other (6 px at 13.25 px/unit), i.e. the lifted pair.
- **Running dot pulse**: same dot sampled across 017→018→019→020 reads `#246148` → `#224f3a` → `#279066` →
  `#28a873` → breathing opacity ≈ 35 % ↔ 100 %, period ~1–2 s.
- **Live counters**: Time tile and running-card time tick every second (0:26 → 0:28); tokens and cost update
  in steps (249k → 254k; ≈$0.27 → ≈$0.28); finished cards freeze their numbers.
- **Bar fill**: card bar steps 3/5 → 4/5 → 5/5 with each step; label "Hero copy" → "Signup" swaps with it.
- **Regrouping**: on finish, the card moves from Running to the top of Finished; a planned card whose dependencies
  are met moves to Running (its numeric prefix "4." drops, mascot goes to full opacity, bar appears at 0). No
  intermediate frames visible → a short (150–200 ms) cross-fade/slide is enough.
- **Done state**: band dot, pill and dither switch purple → green together; label "Done", "100%".
- **Customization**: after the user asks "Customize my agent crabs: one designer, one developer", the light and
  medium mascots are re-dressed in place (029). The fly-in with motion blur (028) is editorial.

---

## 5. Interaction model

- Band: appears when the plugin's `progress` tool reports tasks (Tasks 0/4 in transcript), updates live, stays
  through completion (`Done`). `✕` dismisses it. Clicking the band (title/track/crab) presumably opens the
  Agents panel (not shown explicitly; the panel was opened between 008 and 011).
- Panel: pane-level ✕ closes; "Collapse" is a plain text button (inferred: collapses all cards to one-line rows or
  collapses all groups); "▾ Finished · N" is a disclosure toggle for that group (only Finished has a chevron — it
  is the group that grows). Running/Planned headers are static.
- Cards: no visible hover state; reasonable to make a card clickable to reveal the agent's transcript/output.
- Mascots are user-customizable through plain conversation (role → accessory set); defaults come from the tier.
- Everything else is passive/live — no buttons inside cards.

---

## 6. Build with the drawing API (desktop)

| Part | Build | Notes |
|---|---|---|
| Band row | `Box flexDirection="row" alignItems="center" columnGap={…}` children: dot, title, track, %, crab, ×N, close | Band has no bg/border — do not wrap in a round Box. |
| Status dot | `Svg` 10×10 circle (pulse via `<animate opacity>` when running) or `Text color=accent "●"` | Svg gives exact size + pulse. |
| Title | `Text bold` "Launch kit" | |
| Dither track + pill + tick | **One `Svg`** (width 100 %/flex, height 20): rounded-rect track, cell grid `<rect>`s (5 rows × N), seeded random lit set per zone, tick `<rect>`, pill `<rect rx=10>` + `<text font-weight=600 fill=#fff>` positioned at progress; `isInteractive` for twinkle + pill slide | Must be Svg — a Box/Text bar cannot draw the dot-matrix, the riding pill or the tick. Fallback: `━` glyph bar + bold label. |
| % / ×N | `Text dimColor` / `Text` | |
| Band crab | `Svg` 24×16, `shape-rendering="crispEdges"`, one `<rect>` per lit unit (or a single `<path>`); two leg `<g>` frames toggled with `<animate attributeName="visibility" … repeatCount="indefinite">` | Must be Svg. |
| Close | `Button variant="plain" label="✕"` (hotkey e.g. `x`) | |
| Pane title + ✕ | Pane chrome title "Agents" (or `Text dimColor` + `Button plain ✕`) | |
| "Launch kit" | `Text bold` | |
| Stat tiles | `Box flexDirection="row" columnGap` → 3× `Box flexGrow={1} backgroundColor="#262722" padding` with `Text dimColor` label + `Text bold` value | If `borderStyle="round"` is the only way to round corners, set `borderColor` = tile fill so the border disappears. Value size larger than label only via Svg; bold is enough. |
| Collapse | `Button variant="plain" label="Collapse"` | |
| Group header | `Text dimColor` "Running · 1"; Finished: `Button plain` "▾ Finished · 2" toggling state | |
| Agent card | `Box row columnGap` → `Svg` mascot 32×32 → `Box column flexGrow` [ `Text bold` title; row: `Text color=tier` + `Text dimColor`; `Box row justifyContent="space-between"`: `Text` step + `Text dimColor` meta; `Svg` bar ] → `Svg` status 12×12 | Bar must be Svg (5 px capsule). Status icons Svg (dot pulse, check, clock). |
| Separator | `Box height={1} backgroundColor="#2f302b"` or 1 px `Svg` line | |
| Planned dim | wrap mascot Svg in `<g opacity=".45">`; text `dimColor` | |
| Mascots | `Svg` per agent, viewBox in units (16 × 16 incl. props), `crispEdges`; compose base + hat layer + prop layer; arm-raised variant | Must be Svg. Keep sprites as data (string grids) so roles can be re-dressed. |
| Explainer art (optional) | `Svg` only | Serif headings/eyebrows are slide art, not UI. |

Must be `Svg` to reach video quality: the dither track with riding pill and tick, all crabs/mascots, card progress
bars, status icons (pulsing dot, check, clock), and any text larger than body.
Terminal fallback: band = `● Launch kit ━━━━━━━━──── Görevler 2/4 · %50 · ×4`; panel cards = text rows with
`●/✓/○` status glyphs and `━` bars (DESIGN.md glyph set).

---

## 7. What makes it look premium / weaknesses

Premium details:
1. **Pixel-art identity with meaning**: every agent is a Clawd crab whose hat colour equals its tier bar colour
   (green cap = light, blue band = medium, amber hard hat = careful, red band = heavy), plus role props — instantly
   scannable, delightful, and on-brand.
2. **Dot-matrix progress track**: one 20 px line encodes done / in-flight / planned (bright dither, dim dither,
   tick), with the label pill riding the fill head and a twinkling texture that says "alive" without a spinner.
3. **Narrative progress per agent**: "3/5 · Hero copy" + live ctx/tokens/cost/time on one line, thin 5 px tier bar —
   dense but calm; numbers tick in real time.
4. **Clean information architecture**: Running → Finished → Planned with counts, dependency text "after 1, 2, 3",
   order-numbered planned items, dimmed planned mascot, fixed right status column.
5. **Warm, quiet surfaces**: `#171813` pane, borderless `#262722` tiles, 1 px separators, colour reserved for tier,
   state and the crab — the panel matches the host app instead of looking bolted on.

Weaknesses:
- Tier words at 13 px are low contrast (careful `#977756`, heavy `#9f5c54` on `#171813`); lighten them.
- "medium Opus 5.5 · medium" repeats the same word for tier and effort — confusing; tier/effort vocabularies overlap.
- `25%` duplicates "Tasks 1/4" and `×4` is unlabeled (agents? tasks?) — the band has more numbers than meaning.
- Meta line mixes separators ("ctx 4% · 38k ≈$0.05 0:25"): cost and time lack a "·", time has no unit.
- "Collapse" has no icon/affordance and its scope is unclear; Running/Planned headers are not collapsible while
  Finished is.
- Finished cards keep full saturated bars → the finished list is the most colourful area; consider muting on finish.
- Continuous twinkle + walking crab + pulsing dot = three simultaneous motions near the composer; needs a
  reduced-motion setting (DESIGN.md "Sakin").

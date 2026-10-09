# You Should Know — visual spec from video (mod 03)

Source frames: `scratchpad/yt/frames/03-ysk/NNN.jpg` (1600×900, one every 2 s).
Timestamp convention: `t = 274 s + (NNN − 1) × 2 s` (001 = segment start).
Frame scale `k` (frame px per CSS px, from 16 px body text): full view 007–009 k ≈ 1.34; close-ups 012–017 k ≈ 1.88.
CSS sizes = frame px ÷ k, rounded. Sponsor block 030–045 (Skool "RoboNuggets" community, 332–362 s) ignored;
046 (364 s) is host on camera.
Editorial overlays (not product UI): the orange rounded box around the transcript line in 015/016, the dim/blur
focus on everything except the card (010–017), and the gold glow ring in 017 (documented as an optional "attention"
state because it is worth copying).

---

## 1. Screens and states, in order

| # | t | Best frame | What is shown |
|---|---|---|---|
| S0 | 274–276 s | 001 → 002 | Title over camera: orange "03", serif "You Should Know", sans "the things you might miss". In 001 the title is still a scattered dot-matrix that resolves into type in 002. |
| S1 | 278–280 s | 003 (004) | Slide "Built by Anthropic / a second agent reads what Claude writes" with the @ClaudeDevs post: "We're adding a new plugin to Claude Code: You should Know. It scans Claude's output for important information you might miss…", enable command `/plugin enable cc-plugin-you-should-know@builtin`, and a terminal video where one bullet ("Added automatic retries to the payment call…") is bright among dim lines with a small "Glossed over" callout. |
| S2 | 282–284 s | 005 (006) | Terminal original (zoomed): dim summary lines, then a full-width panel above the prompt: `✦ Heads up · We added automatic retries to the payment call, but a retry could charge a customer twice.` and `1: Learn more   2: Knew this already   0: Dismiss`; `[-]` collapse glyph at top-right. |
| S3 | 286–288 s | 007, 008 | Desktop Code tab (k 1.34), session "Cold brew launch video" / tag "brand-videos": user bubble, "Read 2 files, ran 1 command ›", assistant plan streaming (007 stops at "After it renders", 008 complete). No card yet. |
| S4 | 290–294 s | 009, 010, 011 | Editorial focus + zoom toward the area above the composer (blurred/dimmed body). |
| S5 | 296 s | 012 | **The card** (k 1.88) appears above the composer: lightbulb disc, eyebrow "YOU SHOULD KNOW", title "Each Kling clip costs about $0.45", body "Kie AI charges 90 credits for each 5-second clip."; buttons "Tell me more" (light), "I knew this" (outline), "Dismiss" (plain). |
| S6 | 298 s | 013 | Highlight span appears on title phrase "costs about $0.45". |
| S7 | 300 s | 014 | Second highlight on body phrase "Kie AI". (Clean reference frame for all measurements.) |
| S8 | 302–304 s | 015 (016) | Zoom out; source line "Runs through Kie AI, about 90 credits per clip" boxed in the transcript (editorial) — shows the card is grounded in a specific line Claude wrote. "Tell me more" dimmed (pressed/hover look). |
| S9 | 306 s | 017 | Card with gold attention ring + outer glow. |
| S10 | 308 s | 018 | Slide "Steer what it looks out for / you can tweak this mod": lightbulb node fades in (blurred). |
| S11 | 310–316 s | 019, 020, 021, 022 | Mind-map: node "You Should Know" with 3 curved branches to capsules. 019 empty dashed slots; 020 "Costs" filled + "Customer issues" active (orange); 021 "Automations" active; 022 all three neutral, node ring orange with a pencil edit badge. |
| S12 | 318–322 s | 023, 024, 025 | Slide "It runs a second agent / so it can increase your token usage": card "You Should Know" with orange pixel "Claude" mascot, token bar cream fill; 024 cream "second agent" mascot appears and an orange segment starts; 025 orange segment grows. |
| S13 | 324–330 s | 026, 027, 028 (029) | "Most mods run on code / they don't need an LLM to run": second card "Most mods" with `{}` list Savvy Progress, Claude Skins, Filetree (Filetree blurs in, braces turn orange); 028 status pills "uses an LLM" (orange) vs "✓ no LLM needed" (green). |

Near-duplicates checked: 004≈003, 006≈005, 014≈013 (+1 highlight), 016≈015, 029≈028.

---

## 2. Layout breakdown

### 2.1 Placement
The card lives in the band directly above the composer, after the assistant's final message, left edge aligned to the
composer and transcript column (both at the same x), full column width (it runs past the right edge of the zoomed
frame). Order top→bottom: transcript … → card → 12 px → button row → 16 px → composer.

### 2.2 Card container
- Fill `#1f201b` (same warm surface as the composer — the card reads as part of the input area, not a message).
- Border 1 px `#30302d`. Radius 16 px. No shadow (a glow is used only for the attention state, §2.6).
- Padding 24 px all sides. Height ≈ 120 px for 1-line title + 1-line body.
- Inner layout: `row`, align-items **start**: [icon disc] 16 px [text column].

### 2.3 Icon disc
- Ø 44–46 px filled circle `#3a3428` (amber tinted ~15 % on the card), no border.
- Lightbulb line icon (Lucide `lightbulb`-style): ~14×20 px glyph, 1.5 px stroke, round caps/joins, colour `#dcbb7c`.
- Disc top aligned with the eyebrow cap line (disc centre sits between eyebrow and title).

### 2.4 Text column
1. Eyebrow "YOU SHOULD KNOW": uppercase, bold, ~13 px, letter-spacing ≈ +0.12 em, amber `#e1ba7b`. Sans (same
   family as UI).
2. 8 px.
3. Title: semibold ~21 px (≈ 1.3× body), near-white `#f1f1ed`, one line, sentence case, a concrete fact with a number.
4. 8–10 px.
5. Body: regular ~17 px, muted `#a5a59e`, one line, the evidence/source.

### 2.5 Highlight spans
- Inline marker on key phrases: title "costs about $0.45", body "Kie AI".
- Fill `#87411f` (burnt orange, ≈ 45 % of `#f1601f` on the card), text stays light (`#f8ece2` / `#ffead3`).
- Box hugs the glyphs: padding-x ≈ 4 px, height = line box (≈ 26 px for the title), corner radius 3–4 px.
- Max 1 span per line; phrases chosen = the number (cost) and the source (who charges). They appear sequentially
  (title first, then body) — §4.

### 2.6 Attention state (017)
- Card border stays; outside it a 4 px dark gap, then a 3 px ring `#ddb578` (gold), then an outer glow ~16 px
  fading `#3c3115 → #241f19 → bg`. Radius follows the card (16 + 7 px). Used once when the card first appears.

### 2.7 Button row
- Left aligned with the card, 12 px below it, gap 12 px.
- "Tell me more" — primary light: fill `#ebeae5`, text `#0d0e10` medium ~17 px, height ≈ 40 px, padding-x 18 px,
  radius 10 px.
- "I knew this" — secondary outline: transparent fill, 1 px border `#343434`, text `#f1f0eb` medium, same height/radius.
- "Dismiss" — plain: no fill/border, text `#8f8f8b` regular.
- Pressed/hover (015): primary fill drops to ~`#8a8a86` (dimmed), text unchanged — implies a darken-on-press.
- Terminal equivalent uses number hotkeys 1 / 2 / 0 → map to `hotkey="1"`, `"2"`, `"0"`.

### 2.8 Terminal variant (005)
- Panel: full-width, fill `#171717` on terminal `#080808`, radius ~6 px, padding 1 row × 2 cols.
- Line 1: `✦` lavender `#aba6c6` · "Heads up" gray `#9a9a9a` · " · " gray · message white `#fcfcfc` (mono, wraps).
- Line 2: `1:` `2:` `0:` digits lavender `#bbb4d9`, labels white, 3 spaces between options.
- Top-right `[-]` in `#454545` (collapse to one line).
- Dims nothing else; sits between transcript and prompt rules (`#1c1c1c`).

### 2.9 Explainer slides (S10–S13) — reusable illustration language
- Bg `#1c1b16` + dot grid (3 px dots, 10 px pitch, `#3a3832`→`#5f5d58` toward the bottom, wavy top edge).
- Headline serif semibold, cream `#ebe8db`; sub sans regular, cream.
- Node: Ø ~110 frame px circle, 3 px cream `#ece8dc` ring (active: orange `#f1601f`), inner disc `#3f3826`, gold bulb
  `#e3ba70`; caption "You Should Know" bold cream below. Edit badge: Ø ~44 frame px orange `#f1601f` circle with dark
  pencil, overlapping the ring at 1–2 o'clock.
- Branches: 2 px cream-gray bezier curves from node to each capsule; active branch orange.
- Capsules: height ~100 frame px, full radius, fill `#25251d`, 2 px border `#88887c`; icon (dollar-circle, two users,
  workflow nodes) orange `#e8682f` 1.5 px stroke; label bold cream. Active: fill `#382517`, border `#d8683c`.
  Empty slot: dashed 1 px border, no fill.
- Info cards: fill `#25251d`, 1 px border `#38382c`, radius ~24 frame px. Header row = small bulb disc + bold title.
  Pixel mascots: Claude orange `#f1601f`, second agent cream `#e6e3d0`; labels `#8d8c7e`.
- Token bar: height ~36 frame px, full radius, track `#39362d`, base fill cream `#cdc7b9`, added segment orange
  `#f1601f` (flat join, no gap). 
- Status pills: "uses an LLM" fill `#432b1f`, 2 px border `#d47040`, text `#f0e5d5`; "✓ no LLM needed" fill card,
  2 px border `#447c54`, check `#3e8457`, text `#e8eada`.
- `{}` list glyphs orange `#e16732`; names bold cream.

---

## 3. Measured palette (hex)

Desktop card:
| Role | Hex |
|---|---|
| page / transcript bg | `#151515` |
| sidebar bg | `#111111` |
| card fill (= composer fill) | `#1f201b` |
| card border | `#30302d` |
| icon disc fill | `#3a3428` |
| lightbulb stroke | `#dcbb7c` |
| eyebrow text | `#e1ba7b` (peak `#e3c5a1`) |
| title text | `#f1f1ed` |
| body text | `#a5a59e` |
| highlight span fill | `#87411f` |
| highlight span text | `#f8ece2` / `#ffead3` |
| attention ring | `#ddb578` |
| attention glow | `#3c3115` → `#241f19` |
| primary button fill / text | `#ebeae5` / `#0d0e10` |
| secondary button border / text | `#343434` / `#f1f0eb` |
| plain button text | `#8f8f8b` |
| composer border | `#242420`–`#282828` |
| inline code chip bg | `#181818` |

Terminal variant: bg `#080808`, panel `#171717`, sparkle `#aba6c6`, "Heads up" `#9a9a9a`, message `#fcfcfc`,
option digits `#bbb4d9`, collapse glyph `#454545`, dim transcript `#343434`.

Slides: bg `#1c1b16`, cream `#ebe8db`, orange `#f1601f`, card `#25251d`, card border `#38382c`, node inner `#3f3826`,
capsule border `#88887c`, active capsule fill `#382517`, active border `#d8683c`, bar track `#39362d`, cream fill
`#cdc7b9`, success border `#447c54`, success check `#3e8457`, warm pill fill `#432b1f`, label gray `#8d8c7e`.

Theme-key mapping (DESIGN.md, no raw hex in mods): eyebrow/bulb/highlight → `warning` (amber family) or `claude`;
title → default text; body → `dimColor`; primary/secondary/plain → `Button` variants.

---

## 4. Motion inferred

- Entrance (011→012): card appears in place above the composer with buttons in the same frame (≤ 2 s); likely
  fade + 4–8 px rise. The composer shifts down by the card's height (no overlay).
- Staged emphasis (012→013→014): highlight spans paint in one by one, title first then body, ~2 s apart in the
  edit; in product use a left-to-right marker wipe (scaleX 0→1, 250–300 ms, ease-out) staggered 150 ms.
- Attention (017): one-time gold ring + glow, then it settles back to the plain border (gone in later frames).
- Pressed state (015): primary button darkens.
- Streaming context (007→008): the assistant message finishes first; the card only appears after the turn ends.
- Slides: dot-matrix → serif title resolve (001→002); node fade-in from blur (018); branch draw-on and capsule
  fill-in one by one with the active one orange (019→022); pixel mascot pop-in and bar segment growth (023→025);
  blur-in list item + brace colour change (026→027); pills appear (028).

---

## 5. Interaction model

- Trigger: after Claude finishes a turn, a second (cheap) model reads Claude's output and, only if something
  important was glossed over (cost, risk, side effect), produces one fact card. Never more than one at a time.
- Card actions:
  - "Tell me more" (primary, hotkey `1`) → asks Claude to expand on this point (sends a follow-up prompt).
  - "I knew this" (secondary, hotkey `2`) → dismiss + feedback signal so similar facts are suppressed later.
  - "Dismiss" (plain, hotkey `0`) → hide without feedback.
- Terminal: `[-]` collapses the panel to one line.
- Configurable focus areas: Costs, Customer issues, Automations (editable list — pencil badge on the node).
- Cost transparency: it runs an LLM, so it adds token usage (explicitly called out in the video).

---

## 6. Build with the drawing API (desktop)

| Part | Build | Notes |
|---|---|---|
| Card container | `Box borderStyle="round" borderColor="#30302d"-equivalent backgroundColor padding={24} flexDirection="row" alignItems="flex-start" columnGap={16}` | Radius depends on renderer; acceptable. |
| Icon disc + bulb | `Svg` 44×44 (circle fill + lightbulb path) | Must be Svg. |
| Eyebrow | `Svg` text (uppercase, `letter-spacing` 0.12em, font-size 13, weight 700, amber) | Must be Svg: `Text` has no size or tracking; a `Text bold color` fallback loses the small-caps eyebrow look. |
| Title | Preferred `Svg` (font-size 21, weight 600) with `<tspan>`+`<rect>` for the highlight; fallback `Text bold` with `Text backgroundColor="#87411f"` on the span | Text fallback is same size as body → hierarchy relies on bold only. |
| Body | `Text dimColor` with a nested `Text backgroundColor` span for "Kie AI" | Text highlight has no padding/radius — pad with a leading/trailing space inside the highlighted Text. |
| Buttons | `Button variant="primary" label="Tell me more" hotkey="1"`, `Button variant="secondary" label="I knew this" hotkey="2"`, `Button plain label="Dismiss" hotkey="0"` | One primary per surface (DESIGN.md OK). Put in a sibling `Box flexDirection="row" columnGap={12}` under the card, not inside it. |
| Attention ring | `Svg` overlay (`Box position="absolute"`) animated with `isInteractive` (ring opacity 1→0 over 1.2 s) — optional | Or skip; use the entrance animation only. |
| Terminal variant | `Box backgroundColor` panel + `Text` segments (✦ in `suggestion`, "Heads up ·" `dimColor`, message default) + option line with numbered `Button plain hotkey` | Matches 005 exactly. |
| Settings/explainer art | `Svg` only | Mind-map, token bars, pixel mascots. |

Must be `Svg` to reach video quality: bulb disc, eyebrow, and the title if its larger size + padded/rounded highlight
are wanted.

---

## 7. What makes it look premium / weaknesses

Premium details:
1. Tracked uppercase amber eyebrow over a large plain-language title — reads instantly as an "insight" and is
   distinct from Claude's own prose.
2. The card shares the composer's warm surface (`#1f201b`) and edges, so it feels attached to the input area, calm
   and in-flow — no modal, no toast.
3. Title is a concrete number ("costs about $0.45"); the body names the source ("Kie AI charges 90 credits…") —
   fact + evidence, one line each.
4. Burnt-orange highlight spans on exactly the phrases that matter, with light text kept readable (not neon).
5. Clear three-weight action set (light primary / outline / plain) with 1-2-0 keyboard parity to the terminal.

Weaknesses:
- Body `#a5a59e` on `#1f201b` is fine, but the highlight `#87411f` behind light text drops contrast vs. plain title
  text; keep spans short.
- Disc colour and eyebrow amber differ from the orange highlight → two warm accents competing (amber + burnt orange).
- "Tell me more" is primary even though "Dismiss" is the most frequent action; the plain Dismiss is easy to miss.
- No source link: the card doesn't point back to the line it came from (the video adds that with an editorial box).
- Extra LLM call per turn (token cost) — must be cached, rate-limited and off by default for cheap sessions.

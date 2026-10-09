# Cache Tax: visual spec from the video (Mod 05)

Source frames: `scratchpad/yt/frames/05-cachetax/NNN.jpg` (1600×900, one every 2 s). Timestamp t = 424 s + (NNN − 1) × 2 s.
All colors were sampled with PIL from the JPEGs (flat areas averaged, text/icons taken from their most saturated or brightest 3–5% of pixels). Expect about ±3 per channel.

**Scale.** Frame 019 shows the app at 1× video scale. Frames 020–036 are zoomed **1.3×** ("z" below). Text cap heights put 1× video px at about 1.55 × CSS px, so **≈css ≈ z ÷ 2.0**. In-app body text is about 14 css, and its cap height is 20 z.

**Video-only effects (do not build).** These come from the editor, not the mod:
- the orange-outlined callout box that re-frames the comparison (frames 021–023, 026–029)
- the marker highlight sweeping over words ("51,929 tokens" brown #4a2e24; "always", "ping in 32m" and "warm" in green #2c4a33)
- the orange focus ring on "Pay and send" in 025
- the dimming of everything outside a callout
- the blur transitions
- the GitHub credit chip "Cache Tax by Karan Bansal (karanb192/cache-tax)" (top right, #131312 fill, #919087 text)
- the facecam
- the explainer slides (003–018)

---

## 1. Screens and states in order

| # | t (s) | Frames | Best frame | What is shown |
|---|---|---|---|---|
| A | 424–426 (7:04) | 001–002 | `002.jpg` | Title card: pixel "05" in orange, serif "Cache Tax", "know before a cold send costs you". Video chrome. |
| B | 428–430 | 003–004 | `003.jpg` | "a mod that can actually / Save you money". This is the **brand mark**: an isometric cube with a white outline, a green top face and a ">" prompt chevron on the right face, an orange arrow, then a coin stack. Video chrome, but it is the mod's icon. |
| C | 432–448 | 005–013 | `006.jpg`, `013.jpg` | Explainer: "The prompt cache / short-term memory Claude keeps". Chat column next to a "Prompt cache" card with orange lines and a flame inside a ring timer: "No need to reread…", "Saves your tokens" plus a Usage bar, "About an hour, then it goes cold" (the ring fills, "~1 hour"). |
| D | 450–458 | 014–018 | `017.jpg` | The cache goes **cold**: card stroke and lines turn blue (#6ea0e0-ish) with a snowflake. "Rereads everything / eats into your usage limits": every chat bubble outlines in orange and the Usage bar fills orange. Video chrome, but it sets the semantics (orange = cost, green = warm). |
| E | 460 (7:40) | 019 | `019.jpg` | **Before.** A desktop session whose last turn finished at 1:53 PM. The user is typing "Where were we? Give me a |" and the send button is the host orange (#d06c54). |
| F | 462 | 020 | `020.jpg` | **HOLD card (cold, $0.52).** The host prints an amber system line, "Prompt dropped by a hook: cache-tax: your message is on hold until you choose on the card above the prompt box (cold cache, up to $0.52)." Below it is the Cache Tax card, then the three buttons, then the empty composer. |
| G | 464–468 | 021–023 | `022.jpg` | Callout on the comparison. From frame 023 the cold price shows a **soft glow**. |
| H | 470 | 024 | `024.jpg` | **Best full reference of the hold card**, with the glow on $0.52. |
| I | 472 | 025 | `025.jpg` | Pointer on **Pay and send** (hover/press). |
| J | 474–476 | 026–027 | `027.jpg` | A re-estimate in a later take: **$0.60**, "re-writes up to 60,326 tokens", and the system line updates to "up to $0.60". |
| K | 478–480 | 028–029 | `029.jpg` | A big-context take: **$3.30**, "330,316 tokens", warm turn **$0.17**. The warm bar stays at about 5%. |
| L | 482 | 030 | `030.jpg` | A different conversation (done 2:41 PM). No card shows because the cache is warm. |
| M | 484–486 | 031–032 | `032.jpg` | **/keepwarm** slash command. The menu row reads "/keepwarm  Keep the prompt cache warm: bare for 6h, a window such as 90m, always, off, …". |
| N | 488 | 033 | `033.jpg` | **Status line (warm)** above the composer: [cube, green top] "cache-tax · **warm** · keepwarm 5h42m left · ping in 32m". |
| O | 490 | 034 | `034.jpg` | **Ping chip** above the status line: [cube] "ping  Reply with the single word: warm ↳ ✳ **warm**". The status line now reads "keepwarm 5h10m left · ping in 50m". |
| P | 492–494 | 035–036 | `035.jpg` | Status line extended with "· last ping read 61k $0.03". |

---

## 2. Layout, element by element

Measured in z px (frame 024 / 035). ≈css ≈ z ÷ 2.

### 2.1 Placement
- The card is drawn **in the transcript flow, directly above the prompt box**. It sits at the full width of the chat content column (x 290→1566 z, the same left edge as the composer, **≈638 css**). The host's amber "Prompt dropped by a hook…" system line sits above it. The button row sits **outside and below the card**, left-aligned to the card edge, 16 z (8 css) below it. The composer follows 22 z (11 css) below the buttons.

### 2.2 Hold card container
- Fill **#1f201b** (the same as the composer and user bubbles), border 1 px **#2f302b**, radius 26 z (**≈13 css**).
- Size 1276×462 z (≈638×231 css). Padding is about 40 z (**≈20 css**) left and top and about 28 z at the bottom.

### 2.3 Header (icon + 3-line stack)
- **Cube icon**: 54×58 z (**≈28 css**) at the top-left of the padding box. It is an isometric cube with a white stroke (#fefef9 ≈ #faf9f5, about 2 css, round joins) and a **filled top face whose color is the cache temperature**: cold = terracotta **#d8845c** (asset #d97757), warm = green **#7ac75c** (asset #78b85a), unknown = gray (asset #92928b). The right face carries a white ">" chevron. The asset already exists in `mods/cache-tax/hooks/status-icons.ts` (64×64 viewBox, stroke-width 4).
- The text column starts 30 z (**15 css**) right of the icon.
  - **Eyebrow** "CACHE TAX": cap 15 z (about 0.75× body, **≈10.5–11 css**), **bold, uppercase, tracking ≈ +0.08em**, terracotta **#d18465**.
  - **Title** "Your message is on hold": body size (cap 20 z, ≈14 css), **semibold 600**, text.hi **#f7f7f4**.
  - **Subline** "The prompt cache went cold 6h38m ago.": body size, regular, text.mid **#a9a9a3**. The relative age is a live value.
- Line pitch is about 36–40 z (18–20 css). The icon top aligns with the eyebrow's cap top.

### 2.4 Comparison panel (inset)
- An inset rounded rect at x 326→1532, y 309→485 z (≈603×88 css). Fill **#181914**, which is *darker* than the card. **No border**, radius about 16 z (≈8 css). It sits about 20 z (10 css) below the subline and spans the card's content width (inset 36 z on each side).
- Padding is 26 z left/right (≈13 css) and 32 z top (≈16 css).
- **Two equal columns** (559 z each, ≈280 css) with a gutter of 35 z (**≈17 css**). Each column is a vertical stack:
  - **Label** ("Send it now" / "A warm turn"): cap 16 z (≈0.8× body, ≈12 css), **medium 500**, text.mid **#ababa5**.
  - **Price**: cap 25 z (**≈1.25× body, ≈18 css**), **bold 700**. Cold uses terracotta **#d58360** (core #d28d72); warm uses mint **#87d29c** (#9cd3aa). It sits about 10 css under the label.
  - **Bar**: about 10 z tall (**≈5 css**), full-radius ends, the full column width, about 10 css under the price. Track **#2c2d28**. The cold fill **#d48562** runs to 100%. The warm fill **#88d09b** is **proportional** to warm/cold (28/559 z ≈ 5%; $0.03/$0.52 ≈ 5.8%).
  - **Caption**: body size or a touch smaller, regular, text.mid **#a8a8a1**, about 8 css under the bar. It shows the math: "re-writes up to 51,929 tokens at $10/MTok" or "what it would have cost".

### 2.5 Info rows
- Two rows under the inset, starting about 25 z below it, with a pitch of 47 z (**≈23 css**), left-aligned to the inset edge (x 327). Each row is a 28 z (**≈14 css**) line icon, a 19 z (≈10 css) gap, then text at body size.
  - Row 1: a **pause-in-circle** icon (outline circle plus two bars, stroke text.mid #abaca7), then "On hold: “Where were we? Give me a 2 line recap.”" in brighter text **#dadad4** (≈text.hi) with typographic curly quotes.
  - Row 2: a **shield-check** icon in sage **#88b997**, then "Pay once and keepwarm then holds the cache for 3h00m." in text.mid **#a8a9a3**.

### 2.6 Button row (below the card)
- Three buttons, left-aligned, 16 z below the card, height 58 z (**≈29 css**), radius 12–14 z (**≈6–7 css**), gap 31 z (**≈15 css**):
  1. **Primary** "Pay and send": light fill **#ebeae4**, **bold** near-black text **#080808**, no border, horizontal padding 26 z (13 css). Width 227 z (≈113 css).
  2. **Secondary** "Start fresh": fill **#141515** (darker than the page), 1 px border **#2f2f2f–#333333**, **bold** white text **#f7f7f6**.
  3. **Plain** "Show cache status": no fill, no border, regular weight, text.lo **#949491**.

### 2.7 Status line (warm, band above the prompt)
- One line directly above the composer (about 30 z, 15 css gap). There is no box.
  - Cube icon, about 31×34 z (**≈16–18 css**), green top.
  - Text at body size, text.mid-hi **#d1d1cd–#d7d8d4**, with segments separated by " · ": "cache-tax" · "**warm**" (bold mint **#88cd9c**) · "keepwarm 5h42m left" · "ping in 32m" · "last ping read 61k $0.03".
  - Single color except for the state word.

### 2.8 Ping chip (transient)
- A pill-ish chip above the status line, about 13 z (6 css) gap. It spans x 305→1134 and y 561→624 z (**≈31 css tall**), so its width hugs the content. Fill **#292a25**, 1 px border **#32332e–#363634**, radius about 20 z (≈10–12 css). Inner padding is about 30 z (15 css) on the left.
- Content:
  - cube (≈15 css, green)
  - "ping" in text.lo **#93948e**
  - the ping prompt "Reply with the single word: warm" in text.hi **#fafbf6**
  - a reply-arrow glyph ↳ in text.lo **#949590**
  - the Claude asterisk ✳ (8-spoke, host orange **#cb7056**)
  - the reply "**warm**" in bold mint **#86cb9c**

### 2.9 /keepwarm slash menu (host component, for reference)
- Menu container #1f1f1d with border #282824, and a selected row fill **#2c2d28** (radius about 6 css). The command "/keepwarm" is bold **#fbfbf6** and the description is text.mid **#a0a19c**, truncated with "…". The description lists the argument forms: bare = 6h, a window such as `90m`, `always`, `off`.

### 2.10 Typography summary
- Host UI sans (Inter-like), **no monospace** in the card. Numbers are lining and not visibly tabular.
- Scale:
  - Price: **1.25× body, bold**
  - Title: body, **semibold**
  - Subline, info rows, captions and status: body, regular
  - Labels: **0.8× body, medium**
  - Eyebrow: **0.75× body, bold, uppercase, tracked**
  - Buttons: body, **bold** for primary and secondary, regular for plain
- Copy style: sentence case, short, concrete numbers with units ("6h38m", "51,929 tokens", "$10/MTok", "3h00m", "61k $0.03"), and curly quotes around the held prompt.

### 2.11 Iconography
- **Cube**: the brand and state carrier, with a white stroke and a colored top.
- **Pause-circle** and **shield-check**: line icons, about 2 px stroke at 1×, rounded, 14 css.
- **↳**: the reply glyph.
- **✳**: the host Claude asterisk.
- No emoji. No filled icons except the cube top face.

---

## 3. Measured palette

### Surfaces and lines
| Role | Hex |
|---|---|
| page / chat bg | #151515 |
| sidebar bg | #111111 |
| card fill (= composer, user bubble) | **#1f201b** |
| card border | #2f302b |
| comparison inset fill | **#181914** |
| bar track | #2b2c27 – #2c2d28 |
| ping chip fill / border | #292a25 / #32332e – #363634 |
| secondary button fill / border | #141515 / #2f2f2f – #333333 |
| primary button fill | **#ebeae4** |
| slash menu selected row | #2c2d28 |

### Text
| Role | Hex |
|---|---|
| text.hi (title, held prompt, ping prompt) | #f7f7f4 / #dadad4 / #fafbf6 |
| primary button text | #080808 |
| secondary button text | #f7f7f6 |
| text.mid (subline, labels, captions, keepwarm line) | #a8a8a1 – #ababa5 |
| status line text | #d1d1cd – #d7d8d4 |
| text.lo (plain button, "ping", ↳, timestamps) | #93948e – #949491 |
| host "done 1:53 PM" timestamp | #737371 |
| host hook system line (amber) | #b89964 core / #c9ae7f |

### Semantic colors
| Role | Hex |
|---|---|
| **cold / cost** eyebrow | #d18465 (bright #ce9581) |
| cold price | #d58360 (core #d28d72). With glow: #f1b299 core, halo #231e1a around it |
| cold bar fill | #d48562 |
| cold cube top | #d8845c (asset #d97757) |
| **warm** price | #87d29c (#9cd3aa) |
| warm bar fill | #88d09b |
| warm word (status, ping reply) | #86cb9c – #88cd9c |
| warm cube top | #7ac75c (asset #78b85a) |
| shield-check icon | #88b997 |
| Claude asterisk / host send button | #cb7056 / #d06c54 |

---

## 4. Motion (inferred)
1. **Price glow.** The cold price gets a soft terracotta outer glow (text-shadow about 8–12 css blur, low alpha) and its core lifts from #d28d72 to #f1b299. Frames 020–022 show no glow and 023–029 do. With 2 s sampling that fits either a slow **breathe** loop (period about 2 s, phase-locked to the sampling) or a glow that turns on after mount. Treat it as a gentle 2–3 s breathe, static under reduced motion.
2. **Live re-estimate.** The price, token count and the "up to $X" in the system line change between takes ($0.52 → $0.60 → $3.30). The values are computed from current context size × cache-write rate, and the bars keep their ratio.
3. **Bars** probably grow from 0 on mount (no frame shows it).
4. **Status line countdowns** tick: "keepwarm 5h42m left", "ping in 32m". After each ping, a new segment "last ping read 61k $0.03" is appended.
5. **Ping chip** appears transiently above the status line when a keep-alive ping fires. It shows the request and Claude's one-word reply, then disappears (not seen persisting).
6. Button hover is not visible apart from the video's ring. Assume the host Button hover.

## 5. Interaction model
1. A **UserPromptSubmit hook** checks cache age. If the cache is cold (older than the TTL), it **blocks the prompt** ("Prompt dropped by a hook…") and keeps the text "on hold".
2. The card appears above the composer with the cost of sending now against what a warm turn would have cost.
3. Choices:
   - **Pay and send** (primary): re-submits the held prompt as is and accepts the cache-write cost. Copy notes that keepwarm will then hold the cache for 3h00m.
   - **Start fresh** (secondary): starts a new session or clears the context, so there is no big re-write, and probably carries the held prompt over.
   - **Show cache status** (plain): opens the status details.
4. The composer stays usable, so typing again probably replaces the held prompt.
5. **/keepwarm [6h | 90m | always | off]** schedules cheap keep-alive pings. A status line in the prompt band shows state, time left, the next ping and the last ping's cost. Each ping briefly shows a chip with the ping prompt and the reply.
6. When the cache is warm, no card appears and messages send normally.

---

## 6. How to build it with the drawing API (desktop)

| Part | Build with | Notes |
|---|---|---|
| Card container | `Box` borderStyle round, borderColor #2f302b, backgroundColor #1f201b, paddingX ≈ 20 css / paddingY ≈ 16–20 css, flexDirection column, gap ≈ 10 css. | |
| Header (cube + eyebrow + title + subline) | **Svg** for the cube (existing asset, 28 css) **and** the eyebrow (bold, uppercase, tracked, terracotta). The title can be `Text bold` (body size matches) and the subline `Text` text.mid. | `Text` has no tracking or size, so the eyebrow must be Svg to look right. A fallback is `Text bold` uppercase in #d18465. |
| Comparison inset | `Box` round, backgroundColor #181914, borderColor #181914 (invisible), padding ≈ 13–16 css, flexDirection row, gap ≈ 17 css, with two flexGrow=1 columns. | |
| Label / caption | `Text` text.mid. | |
| **Price** | **Must be Svg**: about 1.25× body, bold, colored. The glow is an SVG `filter` (feGaussianBlur behind the text) animated with a CSS keyframe via `isInteractive`. | `Text bold` in a color is the fallback, but it loses the size step, which is the hero of the card. |
| **Bars** | **Must be Svg**: 5 css tall, rx = 2.5, track #2c2d28, width-proportional fill. Width tracks the column, so use `width="100%"` or measure. A grow-in animation is optional. | Terminal fallback is `━` per DESIGN.md. |
| Info rows | `Box` row with gap ≈ 10: Svg icon (pause-circle 14 css in text.mid; shield-check 14 css in sage) plus `Text`. | The held prompt is `Text` text.hi with curly quotes. |
| Buttons | `Button primary` "Pay and send" (hotkey Enter or `p`), `Button secondary` "Start fresh" (`f`), `Button plain` "Show cache status" (`s`). Wrap them in a `Box` row with gap ≈ 15 css, placed **after** the card Box rather than inside it, to match the video. | If the host primary is the orange accent rather than cream #ebeae4, keep the host style for consistency. Only a custom Svg/Box button can reproduce the cream look. |
| Status line (band) | `Box` row, no border: Svg cube 16–18 css plus `Text` segments joined with " · ". The state word is `Text bold` in success/mint. | Already wired in `register.ts` (`$.ui.resolve(e).Svg({ source: asset.svg, width: 18, height: 18 })`). |
| Ping chip | `Box` round, backgroundColor #292a25, borderColor #363634, paddingX ≈ 12, alignSelf flex-start: Svg cube plus `Text` text.lo "ping" plus `Text` text.hi prompt plus `Text` text.lo "↳" plus `Text` in Claude color "✳" plus `Text bold` mint reply. Auto-dismiss after about 5–8 s. | |
| Host amber hook line | Not drawn by the mod; it is the host's rendering of the blocking reason. Keep the reason short. | |

**Must be Svg for this quality:** the cube (all three placements), the eyebrow, the price numerals (size step plus glow), the bars, and the pause/shield icons. **Text and Box are fine for:** the card, inset, title, subline, labels, captions, info text, status line text and ping chip. A **Client module** is not needed.

Conflicts with repo rules (`DESIGN.md`, `design/RESEARCH.md`):
- Copy must be Turkish sentence case (e.g. eyebrow "ÖNBELLEK SOĞUK", title "Mesajın beklemede", "Şimdi gönder" vs "Sıcakken", buttons "Öde ve gönder" / "Yeni başla" / "Önbellek durumu").
- RESEARCH.md says "no neon or glow", so the price glow must stay very subtle or be dropped.
- At most one primary per card. Turkish money formatting is "$0,52".

---

## 7. What makes it look premium (top 5) and its weaknesses

**Premium details**
1. **The decision is shown as two prices with proportional bars.** Terracotta $0.52 at a full bar against mint $0.03 at a 5% sliver. You understand it in about 200 ms without reading.
2. **Honest, sourced numbers in calm copy.** It gives the exact token count, the rate ($10/MTok), how long ago the cache went cold (6h38m), and the cost of the last ping (61k, $0.03). Nothing is vague and nothing shouts.
3. **One brand mark carries state.** The cube's top face is terracotta when cold and green when warm, and the same mark appears in the card, the status line and the ping chip. The eyebrow takes the cold hue.
4. **A clear three-tier action hierarchy.** A cream primary, an outlined secondary and a plain tertiary, all left-aligned and equally tall. The held prompt is quoted back, so you know nothing was lost.
5. **Layered surfaces with very little chrome.** The card matches the composer fill (#1f201b), the inset is a step darker (#181914) with no border, there is a single 1 px border, and a 13 css radius. The only effect is a soft glow on the cold price.

**Weaknesses to fix**
- **Duplicated, alarming entry.** The host's amber "Prompt dropped by a hook…" line repeats the card's message in warning color and reads like an error. Keep the hook reason minimal.
- **Buttons float outside the card.** They read as detached from it. The primary's cream fill is not the host accent, and "Start fresh" gives no hint of its consequence (clear? new session? keeps the prompt?).
- **The bars are relative only.** Cold is always 100%, so $0.52 and $3.30 look identical. At narrow widths the warm sliver (5%) almost disappears; it needs a minimum visible width.
- **Missing pieces:** no dismiss or ✕, no hotkey hints, and no "always do this" option. The status line can run to six segments and will overflow narrow windows, so it needs priority truncation.
- **Effects and color clash with the house rules:** the glow conflicts with the no-glow rule, and the terracotta eyebrow, price and bar sit very close to the host's Claude orange (#d06c54), so cost red and brand orange blur together.

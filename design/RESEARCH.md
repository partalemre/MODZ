# MODZ design research → "Tidemark" visual language

Scope: 18 mods drawing in the Claude desktop Code tab (Box/Text/Button/Svg/Markdown/Code/Select/Input/Link) and the terminal (monospace, theme keys, no Svg). Copy stays short Turkish sentence case, no emoji (see `../DESIGN.md`); this file adds the visual layer.

## (a) References per surface

**1. Live multi-agent / background progress**
- [Cursor agents sidebar](https://forum.cursor.com/t/dock-menu-bar-badge-count-does-not-match-agents-sidebar-needs-attention-glass/168982): amber dot = needs you, spinner = working, blue dot = finished-unseen; "group by status" builds a *Needs attention* section. → Four-state agent dot; sort by urgency. Lesson from the thread: dock badge and sidebar counted different things; keep one count everywhere.
- [GitHub agents panel](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/manage-agents): global list of running/past sessions; overview shows progress, tokens, length. → Fixed per-agent header: meter · tokens · elapsed.
- [Devin Progress tab](https://docs.devin.ai/work-with-devin/devin-session-tools): shell, IDE and browser steps in one feed; click a step to drill in. → One step feed with a tool-kind chip per row.
- [Buildkite build page](https://buildkite.com/resources/changelog/266-introducing-the-new-build-page-engineered-for-scale-and-flexibility/): state-grouped sidebar, blocked and failed rise to the top, condensed header keeps status visible. → Urgency ordering, sticky one-line status.
- [Railway smart canvas](https://railway.com/changelog/2025-12-05-smart-canvas): failure reason printed on the node itself. → Put the failure cause on the agent row, not behind a click.

**2. Usage / limit meters**
- [Claude usage page](https://claude.ai/settings/usage) ([screenshot walkthrough](https://atlas.utdallas.edu/TDClient/30/Portal/KB/Article/1597/How-to-Check-Your-Claude-Usage)): one bar per window, % plus reset time, capped at 100%. → Percent + "↻ 1:12" pair is the atom.
- [Claude Usage Pace userscript](https://greasyfork.org/de/scripts/575629-claude-usage-pace): adds where linear pace would put you. → **Pace tick** on every meter; color by "ahead of pace", not raw %.
- [Vercel usage](https://vercel.com/docs/pricing/manage-and-optimize-usage): allotment indicator + projected cost per item; spend thresholds trigger alert or pause. → Meter + projection + a hard-stop line.
- [Grafana stat panel](https://grafana.com/docs/grafana/latest/panels-visualizations/visualizations/stat/): one big value, optional sparkline that auto-hides when small, threshold colors value or background. → Stat tile that degrades gracefully.
- [Apple HIG Activity rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings): rings are reserved; don't replicate for other data; keep margin ≥ ring gap. → We use a **segmented arc**, never concentric rings.
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions): minutes reset monthly, storage accrues. → Visually separate resetting meters (arc) from accruing ones (plain number).

**3. File tree with live activity**
- [Zed project panel](https://zed.dev/docs/project-panel): git status tints labels; [PR #20600](https://git.secluded.site/zed/commit/9d2fc691dee41056e19e9c431cb0a745a554121b) moved diagnostics to an icon overlay; [#49802](https://git.secluded.site/zed/commit/94d66ff137e4b417dd81d12d003872d92e5abfa2) adds right-side counts that bubble to folders. Zed admits warnings and modified files share yellow. → **One channel per signal**; avoid hue collisions.
- [VS Code git colors](https://code.visualstudio.com/api/references/theme-color): letter badge + theme color, propagated to parents. → Folder rollup dot.
- [Graphite review](https://graphite.com/docs/review-proposed-changes): tree beside diff, collapses to a TOC strip. → Tree collapses to a minimap of activity ticks.
- [agentsroom Review Mode](https://agentsroom.dev/docs/vibe-coding-review): "Files (3/8 reviewed)" with status colors. → Header count of what changed this turn.

**4. Destructive confirmation & secret guards**
- [Primer ConfirmationDialog](https://primer.style/product/components/confirmation-dialog/guidelines/): title is a specific question (<5 words), no "Are you sure?", 1–3 word verb buttons, focus defaults to Cancel when dangerous.
- [Primer Delete pattern](https://primer.style/product/scenario-patterns/delete/): friction scales with impact (undo → dialog → type-to-confirm); never color alone. → blast-radius escalates.
- [GitHub push protection](https://docs.github.com/en/code-security/concepts/secret-security/about-push-protection): bypass requires a reason (used in tests / false positive / fix later), each with a different consequence. → Allow-once needs a reason Select.
- [GitGuardian ggshield](https://pypi.org/project/ggshield/): file, detector, validity; [open issue](https://gitlab.com/gitlab-org/gitlab/-/issues/451113) asks for line/offset. → Always show path:line + detector, masked value.
- [1Password Watchtower](https://support.1password.com/watchtower/): banner on the affected item; [community ask](https://1password.community/discussion/comment/560112) for generic notifications that leak nothing. → Never echo a secret, even in a notification.

**5. Inline notices / "save as rule"**
- [Linear Triage Intelligence](https://linear.app/blog/how-we-built-triage-intelligence): every suggestion shows where it came from and why; accept / decline / "why". → Notices carry a one-line reason + source.
- [Notion AI via Microsoft HAX](https://www.microsoft.com/en-us/haxtoolkit/example/notion-9b-support-efficient-correction/): staged output, Keep / Try again / Discard; never edits without explicit action. → reflect previews the CLAUDE.md diff, never auto-writes.
- [Primer Banner](https://primer.style/product/components/banner/guidelines): one banner per page, ≤2 actions, primary = suggested path.
- [Raycast Toast](https://developers.raycast.com/api-reference/feedback/toast): one toast mutates Animated → Success/Failure in place. → Notices update in place, never stack.

**6. Diff / replay / step-through**
- [Loom chapters](https://support.atlassian.com/loom/docs/add-a-summary-and-chapters-to-your-video/): chapters listed under the video *and* as ticks on the scrubber. → Edits as ticks on the replay timeline.
- [Playwright trace viewer](https://playwright.dev/docs/trace-viewer): action list + duration timeline + before/after. → Step list synced with scrubber.
- [Graphite stacks](https://graphite.dev/blog/q1-24-seamless-stacking): stack moved from a dropdown to front-and-center. → Plan context always visible above the diff.
- [Reviewable](https://docs.reviewable.io/): any revision pair, "since last look", reviewed-file tracking. → "Seen" state per step.
- [Replit checkpoints](https://docs.replit.com/core-concepts/agent/checkpoints-and-rollbacks): roll back *and forward*; edits after rollback branch. → checkpoint offers Redo.

**7. Plan trackers & test badges**
- [GitHub merge box](https://github.blog/changelog/2024-12-03-improved-pull-request-merge-experience-now-in-public-preview): failing checks float to top, natural sort, durations shown.
- [Playwright HTML report](https://playwright.dev/docs/test-reporters#html-reporter): filter chips passed/failed/flaky/skipped with counts; collapsible steps.
- [Vitest UI](https://vitest.dev/guide/ui): watch-mode dashboard, static HTML twin. → Same badge live and after the fact.
- [Vercel deploy timeline (third-party teardown)](https://blakecrosley.com/guides/design/vercel): complete / active-pulse / error / pending step states.

**8. Tool-call transcript skins**
- [Warp Blocks](https://docs.warp.dev/features/blocks/block-basics): command+output is one atomic unit; failed blocks get a red sidebar; sticky header. → Row = atom; failure marks the chip, not the whole row.
- [Zed agent panel](https://zed.dev/docs/ai/agent-panel): collapsible tool cards; thread exportable as Markdown.
- [Rosé Pine palette](https://github.com/rose-pine/rose-pine-palette): *named roles* (love, gold, pine, foam, iris) identical across Main/Moon/Dawn. → Named roles with paired light/dark values.
- [Catppuccin style guide](https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md), [Tokyo Night](https://github.com/folke/tokyonight.nvim): balanced saturation; four flavors from one role map. → Skin presets swap role hues, never neutrals.
- [Radix Colors scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale): steps for bg / border / solid / text. → Each role gets `fg`, `tint`, `line`.

**9. Desktop notifications**
- [Apple HIG Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications): concise, don't repeat for the same event, prefer actions over "open the app to…".
- [Raycast HUD](https://developers.raycast.com/api-reference/feedback/hud): HUD only confirms; no style. → In-app fallback is one quiet row.

**10. Mascots / status characters**
- [GitHub mascots](https://brand.github.com/graphic-elements/mascots) and [How we illustrate](https://github.blog/engineering/user-experience/how-we-illustrate-at-github): small cast, strict usage rules, no mascot as sub-logo.
- [Duolingo characters](https://design.duolingo.com/illustration/characters): eyes carry the emotion; geometric eyes only; an early crying Duo read as menacing. → Mascot emotes with eyes only.
- [usik/tamagotchi](https://github.com/usik/tamagotchi): mood reacts to agent events (tests pass → happy). [Petdex](https://petdex.crafter.run/about): pet = metadata + sprite sheet. → Mascot state is data driven, sprites are tiny strings.

## (b) Tidemark: the MODZ visual language

**Idea.** Feels like a measuring instrument: warm paper/ink neutrals that sit inside Claude's own chrome, one hairline of role color per element, numbers you read at a glance. The name comes from the high-water line: every meter shows where you *should* be, not just where you are. We avoid the usual mod look on purpose: no neon or glow, no emoji, no rainbow per-tool fills, no twinkling pixel bars, no heavy boxed headers.

**Signature moves**
1. **Eyebrow rule:** 6px role-colored notch + tracked uppercase label + hairline to the edge. Every card opens with one.
2. **Pace tick:** a 1px tick on every meter at the expected position.
3. **Segmented arc:** 270°, 20 segments, for windows that reset. Never concentric rings.
4. **Monogram chips:** 16px rounded squares with one mono glyph, for tool kinds and file types.
5. **Signal bars:** 3/2/1 bars for agent model tier, so tier never needs a color.
6. **Border shape carries meaning:** `round` informs, `single` asks for a consequential decision.

### Palette tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| surface.card | #2C2B28 | #FFFFFF | card fill (host ≈ #262624 / #FAF9F5) |
| surface.track | #3A3834 | #ECE8DF | meter track, skeleton |
| border.subtle | #3A3834 | #E6E1D6 | card border, hairlines |
| border.strong | #7A756C | #948D80 | focus, inputs (≥3:1) |
| text.hi | #F0EEE8 | #1C1B19 | titles, values |
| text.mid | #C2BEB4 | #4F4B44 | body |
| text.lo | #9A968C | #716C62 | meta (≥4.5:1 on card) |

Role colors (`fg` / `tint` / `line`). Every `fg` measured ≥4.5:1 on card and on its tint:

| Role | Name | Dark fg · tint · line | Light fg · tint · line |
|---|---|---|---|
| read | Tide | #7FB6E8 · #1F2D3A · #2F4A63 | #2464A0 · #E7F0F9 · #B9D3EC |
| edit + brand accent | Kiln | #E28C66 · #3A2620 · #6A3E2D | #A94A26 · #FBEDE6 · #EFC6B4 |
| run | Iris | #B19CF3 · #2B2640 · #4A3F75 | #6243C4 · #F0ECFC · #CFC3F3 |
| ok | Moss | #6FC593 · #1C3127 · #2F5A42 | #1F6E43 · #E4F4EA · #B5DEC4 |
| warn | Amber | #E9B949 · #36301A · #66552A | #8A6000 · #FBF2D9 · #EBD48F |
| danger | Flare | #F2727F · #3D2024 · #74343C | #C0263A · #FCE8EA · #F1B9C0 |

Kiln (Claude's clay) means "Claude touched this", so it serves as both the edit color and the brand accent. That frees amber for warn only, which avoids Zed's yellow collision. In filetree, edits move from amber to Kiln.

**Agent states:** working = Iris arc spinner · needs-you = Amber dot + pulse ring · done-unseen = Tide dot · done-seen = text.lo ✓ · failed = Flare ✕ · queued = hollow ○. **Tiers:** signal bars `▮▮▮` / `▮▮▯` / `▮▯▯` in text.mid.

**Theme plumbing.** In Svg, put both palettes in `<style>` with `@media (prefers-color-scheme: dark)` (the pattern savvy-progress already uses). For Box and Text hex, resolve once per render with `resolveLight()` (`mods/skins/hooks/light.ts`). Leave Box backgrounds transparent unless the box is a tinted card. In the terminal, map read→`suggestion`, edit→`claude`, ok→`success`, warn→`warning`, danger→`error`, meta→`dimColor`. Run stays default text with a `$` glyph. Use hex only for chips, and only on truecolor terminals.

### Spacing, radius, type
- **Spacing (cells):** 0 · 1 · 2 · 3. Card: `paddingX 2, paddingY 1, gap 1`. Band row: `paddingX 1`, no border. Pane: header, blank line, then sections at `gap 1`. Svg internals snap to a 4px grid.
- **Radius (Svg):** chip 4 · tile 6 · pill 9 (full) · track ends full. Box only has `round`/`single`.
- **Type via Svg** (`system-ui`; numbers `ui-monospace`, tabular): Display 26/600 (stat values) · Headline 17/600 (pane titles) · Label 12/500 · Eyebrow 10.5/650, +0.09em, uppercase via `toLocaleUpperCase('tr')` (keeps İ) · Micro 10/500 (ticks).
- **Type via Text:** Title = bold text.hi · Body = text.mid · Meta = text.lo · Emphasis = highlight span (tint bg + fg + 1-space pad) · italic only for quoting the user · strikethrough only for undone work · underline only on Link.

### Component inventory
- **Card:** round Box, border.subtle (role.line when it has a role), surface.card. Order: eyebrow → title → body → button row. At most one primary.
- **Eyebrow:** Svg h14: notch 6×6 rx1.5 + label text.lo + hairline; optional right meta ("2 dk önce").
- **Stat tile:** Svg 120×56: eyebrow, Display value, unit in text.mid, optional 12%-opacity area sparkline (hidden <120px wide).
- **Pill / badge:** Svg h18 rx9, tint fill, line stroke, fg 11/600. Inline variant is a Text highlight span `" 42/42 "`.
- **Status dot:** 8px; live = breathe; needs-you = expanding ring.
- **Meter:** track h4 (hero h6) + fill + pace tick (1×10, text.mid). Color: neutral text.mid while on or behind pace, Amber when >10pt ahead or ≥80%, Flare ≥95%. Never draw >100%; show "dolu". Terminal: `━━━━━╸┊────` (`┊` dim marks pace).
- **Segmented arc:** 44px (band) / 72px (pane); stroke 5; lit = role fg; value in the center; max two side by side, ≥8px apart.
- **Step dots:** 8px joined by 1px hairline. Done = Moss filled, active = Iris ring + breathing core, pending = border.strong ring, failed = Flare ✕, skipped = dashed ring. Only the active step shows a label; the rest show it on hover. Terminal: `●─●─◐─○─○`.
- **Monogram chip:** 16×16 rx4, role tint + fg glyph 10/700 mono. Tools: `R` read, `E` edit, `W` write, `$` bash, `S` search, `G` web, `A` agent, `T` todo. **File-type badge:** same shape, neutral, lowercase ext (`ts`, `py`, `md`, `{}` for json). No per-language rainbow; activity color overrides.
- **Mote (mascot), opt-in (`MODZ_MOTE=1`):** pebble silhouette on a 10×8 grid at 2px, outline text.lo, 12% fill, emotes with eyes only. idle (blink every 6s) · working (eyes glance L/R) · waiting (eyes up + Amber spark pixel) · done (`^ ^` + Moss pixel) · error (flat eyes + Flare pixel) · cold/asleep (closed + drifting `z`). One Mote on screen at most; never in danger cards; terminal gets none by default.
- **Button row:** primary is the suggested path. On danger the safe choice gets focus and Enter; the destructive button says verb + object ("12 dosyayı sil") and gets a letter hotkey.
- **States:** *Empty* = eyebrow + one sentence + one action (Mote asleep if enabled). *Loading* = Svg skeleton bars with a 1.4s shimmer, static when reduced motion; a spinner with no text never runs past 2s. *Error* = single border Flare.line, "HATA" eyebrow, cause in one line, "Tekrar dene". *Stale* = values in text.lo plus "· 3 dk önce" (the honesty rule).

### Motion
Tokens: quick 120ms (hover/press) · state 200ms ease-out (color/fill) · travel 320ms `cubic-bezier(.2,.8,.2,1)` (bar width) · breathe 1.8s (opacity 1→.45) · shimmer 1.4s linear. Rules:
- One looping animation per surface. Loops settle within one cycle once work stops.
- No springs or bounces on status. Numbers swap with a ≤120ms crossfade; they never count up.
- Every Svg `<style>` ends with `@media (prefers-reduced-motion: reduce){*{animation:none!important}}`.
- Terminal spinner `◐◓◑◒` runs at ≥250ms per frame, on the active row only.

### Do / don't per surface

| Surface | Do | Don't |
|---|---|---|
| Agents | sort by urgency, failure cause inline, one count everywhere | sort by start time, hide the reason behind a click |
| Meters | % + reset + pace tick, color by pace | color by raw %, show >100%, Apple-style rings |
| File tree | one channel per signal, folder rollup | recolor labels for both git state and diagnostics |
| Confirms | specific question title, Cancel focused, verb+object button, friction scales | "Emin misin?", mascots, Yes/No |
| Secrets | mask (`sk-…9f2A`), path:line, reason to bypass | echo the value anywhere, notifications included |
| Notices | one at a time, reason + source, update in place | stack, auto-apply, steal focus |
| Replay | timeline ticks + step list in sync, plan above diff | autoplay with reduced motion on |
| Tests/plan | failures first, counts on filter chips | green wall that hides one red |
| Tool rows | row = atom, chip carries color, path dir in text.lo | full-row color fills |
| Notifications | ≤4-word outcome title, one per event, sound only when needed | code, secrets, repeat pings |
| Mascot | eyes-only emotion, opt-in, data-driven | decorating danger, more than one on screen |

## (c) Mod concepts

- **savvy-progress.** *Band* (Svg, h22): live dot (or Mote) · "TUR 2:14" · hero meter with pace tick · "3 ajan · 1 seni bekliyor" (Amber dot) · forecast pill "≈ %4 limit". The meter stays hidden under 10%. *Agents panel:* urgency-sorted rows: state dot, signal bars, name, latest tool chip + middle-truncated target, 64px meter, tokens, elapsed. A failure prints its cause in Flare text underneath. Terminal: `◐ tur 2:14 ━━━━╸┊─── 46% · 3 ajan (1 bekliyor)`.
- **skins.** Tool row: monogram chip · verb in role fg · target in text.hi with the directory in text.lo · right meta (lines, ms). A failed bash turns only its chip to Flare and adds a "çıkış 1" pill. Consecutive reads collapse to `R 6 dosya okundu ▸`. Presets remap role hues only: *Tidemark*, *Nocturne* (cool, Tokyo-ish), *Paper* (Dawn-ish), *Mono* (glyph-only, colorblind-safe).
- **you-should-know.** Card with eyebrow by category: PARA / GÜVENLİK / VERİ KAYBI (Amber, Flare, Flare); YARIM İŞ (Iris); ELLE ADIM (Tide); SON TARİH (Amber). Bold one-sentence title, then one "neden" line in text.mid with a source ("yanıtın 3. paragrafı"). "Anladım" (Esc), "Ayrıntı" plain. After 20s it shrinks to a band pill instead of vanishing.
- **filetree.** Indent hairlines, file-type badge, name. Name color is lifecycle only: Tide shimmer while being read → Kiln when edited → Moss when saved → text.hi plus a small ✓ once committed (fades after 10s). Right side shows `+12 −3` in text.lo; folders show a rollup dot. Header: "PROJE · 4 değişti · 2 okunuyor", chips Hepsi / Değişenler.
- **cache-tax.** *Hold card* (Amber line): eyebrow "ÖNBELLEK SOĞUK" (Mote asleep), title "Bu mesaj ~84k token'ı yeniden okuyacak", two stat tiles side by side ("≈ $0,42 şimdi" vs "≈ $0,04 sıcakken"), all-dim TTL arc. Buttons: "Gönder" primary, "Sıcak tut" secondary. *Status row:* `● sıcak · 2:41` with a 12px draining arc, or `○ soğuk · 6 dk`.
- **blast-radius.** Single border, Flare line, faint tint. Eyebrow "GERİ ALINAMAZ", title "12 dosya silinsin mi?". The command sits in a Code block with `rm -rf` as a Flare highlight span. A *radius bar* splits files by directory (`src/ 8 · test/ 3 · .env 1`); sensitive or out-of-repo paths get Amber chips. List ≤5 + "+N daha". "Vazgeç" is focused; "12 dosyayı sil" uses hotkey `d`. Out-of-repo targets escalate to type-the-folder-name. No mascot.
- **reflect.** Iris card, eyebrow "KURAL ÖNERİSİ". Your words quoted in italic text.mid after `›`, then the proposed rule as a Code diff (`+ Testlerde gerçek DB kullan.`), then a destination Select (proje / global CLAUDE.md). Buttons: "Kural olarak kaydet" primary, "Düzenle" (swaps to Input), "Bu sefer değil" plain.
- **replay-theater.** Pane: eyebrow "TEKRAR · TUR 14", Headline path. The Svg scrubber has a Kiln tick per edit, a playhead, and an Iris band above it marking which plan step each edit served. Below: a two-line "neden" card, then the Code diff. Controls: ◂ (←), oynat (space), ▸ (→), speed Select, "3/9". Reduced motion turns autoplay off.
- **terminal-browser.** Address row (single, subtle): domain in text.hi, path in text.lo, status pill "200 · 340ms". Readable Markdown body with numbered links `[1]` as hotkeys. In PR mode, stat tiles show `+120 −34`, `6 dosya`, `checks 5/6`. Dev-server offer: one notice, "localhost:5173 hazır · Göster".
- **hud-pro.** One line, always last: `5s ◔ 46% ↻1:12 · hafta 18% · bağlam 62% · ≈$1,84 · tur 12k`. Each limit gets a 12px segmented arc with a pace tick and stays neutral until it runs ahead of pace. `/hud full` opens a pane of stat tiles with 7-day sparklines.
- **agent-deck-pro.** Header with 4 stat tiles (çalışıyor 3 · bekliyor 1 · 182k token · ≈$0,92) and filter chips with counts. A *swimlane* Svg gives each agent a lane, with segments colored by tool kind (Tide/Kiln/Iris), a "şimdi" hairline, and an Amber notch on lanes that need you. Selecting a lane opens a drawer: last 5 skins rows, message Input, "Durdur" (Flare text), "Yeni ajan" primary.
- **checkpoint.** Vertical step-dot timeline of turns: number, time, first prompt line, `+3 dosya`, tool chips. Undone turns are struck through in text.lo. The confirm card (single, Amber) reads "Tur 12'ye dönülsün mü? 4 dosya değişecek" with a diffstat. Afterwards a band pill offers "Yinele" (roll forward).
- **test-badge.** Band pill: `✓ test 42/42` Moss · `lint 2` Amber · `4 sn önce` text.lo. While running it is an Iris pill with a breathing dot; on failure it becomes `✕ 3/42` Flare, and `t` opens the pane. Pane: filter chips with counts, failures first, each showing `file:line` highlight, first assertion line, duration.
- **secret-guard.** Single border, Flare. Eyebrow "SIZINTI ENGELLENDİ", title "Bu yazımda 1 API anahtarı var". Finding rows: detector chip · `path:12` · masked `sk-…9f2A`. "Anahtarı .env'e taşı" is primary because the safe fix is the suggested path. "Bir kez izin ver" needs a reason Select (test için / yanlış alarm / sonra düzelteceğim). Then "Vazgeç".
- **session-budget.** At 80%, a band row: meter where the budget is the tidemark line, plus "Bütçe %80 · $4,00/$5,00 · bu hızla 25 dk". At 100%, when you send a new prompt, an Amber card with a full arc and "Bütçe doldu", buttons "Dur" primary and "Devam et (+$1)" secondary.
- **done-ping.** macOS notification: title is the outcome in ≤4 words ("Tur bitti", "Onay bekliyor"), subtitle is the project, body is "3 dosya · testler geçti". Never code or secrets, one notification per event, sound only for "needs you". In-app fallback is a band row (Mote done/waiting + pill) that clears on typing. The Dock badge uses the same count as the band.
- **plan-steps.** Band: `●─●─◐─○─○ 3/5 · Testleri yaz`. Card: a vertical step list joined by a hairline. Active step bold with elapsed time; done steps in text.mid with their duration; a failed step shows its reason inline. A revised step gets an Iris "güncellendi" pill.
- **modz.** Pane: eyebrow "MODZ", Headline "18 mod · 15 açık". Mods are grouped Görünüm / Koruma / Ölçüm / Akış. Each row has a 2-letter Kiln monogram tile (`BR`, `HP`), name, one line of description, a version pill, surface badges (masaüstü/terminal), a health dot (validate ✓/✕) and an Aç/Kapat button. Empty and error states follow the inventory above.

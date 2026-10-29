# hud-pro

Puts one quiet line above the prompt with your 5-hour and 7-day limits, the context window and the session cost.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install hud-pro@modz
```

Or in one step: `/plugin install hud-pro --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here, for example `5h 44% · 7d 17%`. The tone turns amber when the 5-hour window passes 80% and red from 95%.

## What you see

```
5h ━━┊─── 32% ↻ 2h 10m   7d ━━━━┊─ 91% ↻ 3d 22h   context ━━──── 41%   ≈$1.23
```

- **Desktop:** one picture line with a pill for each limit and for the session cost: a label (`5-hour`), a thin meter with a pace tick (where you would be if the window were spent evenly), the value, and the time left until it resets. Hovering shows details. In a narrow band the 7-day reset drops first, then the meters shorten, then the labels, and last the meters, the 5-hour reset and the cost.
- **Terminal:** the same information as one line of text. A wide band shows `━━┊───` meters; as it narrows, the bars go first, then the resets and the cost.
- **Colour:** neutral by default. A window 10 points ahead of its pace turns amber, and from 95% red, with its reset kept even in the narrowest band. At 100% the value reads `full`. Context turns amber from 70%.
- **Compact:** when context is at 70% or more and Claude is idle, a small **Compact** button (`s`) appears. It compacts the conversation through the same engine call `/compact` makes.
- **Estimates (marked `~`):** when the 5-hour window is on course to fill within the hour, its pill adds the time it fills, for example `~full 15:40`. When the context is five turns or fewer from compacting, its pill adds `~3 turns`. Nothing is shown without a basis.
- **Toast:** when a plan limit passes 90%, one short toast per window says so, with when it resets.

The line sits beneath other mods' rows without swallowing them, and steps aside while a survey is open.

## Commands

- `/hud` hides or shows the line (remembered across sessions).
- `/hud full` opens a Usage pane: stat tiles for the 5-hour window, 7-day window, context and session cost, each with a pace marker and a sparkline of the last 96 readings, plus the last turn's token counts (input, output, cache, requests).
  - The 5-hour window, when it fills before it resets at its recent rate, says when: `~full at 15:40` (local time, with the weekday when it is not today).
  - A **Context breakdown** card: one bar of the window by category (system prompt, tools, MCP tools, memory files, skills, messages…), the four largest named with their tokens and the rest as "Other", then the free space and the compaction reserve. Under it, a sparkline of the context at the end of the last 12 turns and `~N turns left` until auto-compaction. A **Compact now** button compacts and then shows the result, for example `Compacted 152k → 38k`.
  - A **History** card, in place of the usage card the desktop app no longer shows: over the last **7 days** or **30 days** (two buttons switch), the active days (`5/7`), sessions, total tokens (input, output and cache) and the most used model, beside a small GitHub-style heatmap, a column per week and a row per weekday, each day shaded by its tokens against the range's busiest day. The terminal shows the same in two lines: the figures, then one shaded cell per day (`·░▒▓█`).

## Settings

| Option | Default | Meaning |
|---|---|---|
| `band` | `always` | `always` draws the full line. `alerts` keeps the band empty while everything is calm and draws only a limit or the context that needs a look (amber or red, or a near `~` estimate), without the cost or the **Compact** button. Use it when another mod already shows the cost and a Compact button (ponytail does), or when the desktop's usage ring is enough. |

```json
{ "pluginConfigs": { "hud-pro@skills-dir": { "options": { "band": "alerts" } } } }
```

## Limits

- Rate limits are reported only on a subscription. With an API key the line shows context and cost.
- The cost is the engine's own session total, shown with `≈`. Pace is drawn only for windows with a known length (5-hour and 7-day).
- A fill time needs at least 3 readings spread over 10 minutes within the last hour, read as a least-squares rate; a flat or falling window, or one that resets first, has none. The 7-day window never gets one: an hour's rate says little about a week.
- The turns forecast is the average growth per turn since the last compaction, from at least 3 turns. It counts up to the auto-compaction point once the Usage pane has read the breakdown, and to the full window before that.
- The breakdown is Claude Code's own local estimate (the `summary` count, not the token-count API). It is read only while the Usage pane draws, at most every 20 seconds.
- The history comes from Claude Code's local session transcripts (`~/.claude/projects/**/*.jsonl`, or under `CLAUDE_CONFIG_DIR`), the usage each reply records. Only files touched in the last 30 days are read, only those changed since the last read, and through `awk`, which hands back just the model, id, token counts and time of each reply. The first read of a busy month takes a minute or two in the background; later ones take about a second. They run when the Usage pane opens and at most every 5 minutes while it stays open; the result is kept in the mod's store, so the next session shows it at once.
- Each reply counts once by its id, so a forked or resumed session's copied replies are not counted twice. Subagents' replies count toward their session. A session counts when it got a reply within the range. Days are local days.
- Only this machine's transcripts count: not claude.ai, other machines, or transcripts Claude Code has already cleaned up (after `cleanupPeriodDays`, 30 by default).
- No cost: the transcripts carry tokens per reply but a cost only as a session total without dates, so a 7- or 30-day figure would be a guess.
- When the transcripts cannot be read (no transcript path, an unreadable folder, no `awk`, as on Windows), the card is not shown at all.
- An idle line refreshes once a minute; nothing else runs.

Uses no model tokens of its own: it only reads the usage figures Claude Code already measures. **Compact** and **Compact now** run only when you press them and cost what `/compact` costs.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

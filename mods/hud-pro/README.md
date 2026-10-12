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
- **Compact:** when context is at 70% or more and Claude is idle, a small **Compact** button (`s`) appears. It runs Claude Code's own `/compact`.
- **Toast:** when a plan limit passes 90%, one short toast per window says so, with when it resets.

The line sits beneath other mods' rows without swallowing them, and steps aside while a survey is open.

## Commands

- `/hud` hides or shows the line (remembered across sessions).
- `/hud full` opens a Usage pane: stat tiles for the 5-hour window, 7-day window, context and session cost, each with a pace marker and a sparkline of the last 96 readings, plus the last turn's token counts (input, output, cache, requests).

## Settings

There are no plugin options.

## Limits

- Rate limits are reported only on a subscription. With an API key the line shows context and cost.
- The cost is the engine's own session total, shown with `≈`. Pace is drawn only for windows with a known length (5-hour and 7-day).
- An idle line refreshes once a minute; nothing else runs.

Uses no model tokens: it only reads the usage figures Claude Code already measures.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

# session-budget

Sets a spending budget for the current session, warns you at 80%, and stops to ask before you go past 100%. A spawn brake also asks before a subagent starts when the 5-hour window is nearly full.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install session-budget@modz
```

Or in one step: `/plugin install session-budget --marketplace partalemre/MODZ`.

## What you see

- **At 80%:** a row above the prompt, once per budget: a meter with the budget as its marker line and `Budget 80% · $4.00 / $5.00 · full in ≈25m at this pace`, in amber. The desktop app draws it as a picture; the terminal as `━━━━━━━━┃─` plus text. It closes after 20 seconds or with the close mark.
- **At 100%:** the next prompt you type is held and a question opens, with an amber card above it (`Session budget`, `Budget is full`, spent against the budget). The options are **Stop** (recommended, first) and **Continue anyway**. Stop drops the prompt and shows a red row: `Stopped: budget is full · $5.10 / $5.00 · raise it with /budget`. The prompt you typed is not lost: if the box is empty it is put back, and after `/budget` one Enter sends it. Continue anyway raises the budget by one step ($1, or a fifth of a percent budget) and lets the prompt through; when that step fills, it asks again.

- **Spawn brake:** before a subagent starts (the Agent tool), if the 5-hour window is at 85% or more, or at the pace of the last hour it would fill before it resets, the spawn is held and one question opens: `Spawn brake: 5-hour window at 88%, resets 14:20. Start the subagent anyway?` with **Stop** and **Continue**. Stop refuses that spawn and Claude reads why: `spawn brake: 5-hour window at 88%, resets 14:20`. Continue lets spawns through until the window has moved 5 more points, then it asks again. Spawns started together share one question. No other tool is ever held.

Only prompts you type are held (terminal, Remote Control, or the desktop app's Code tab). Prompts from plugins, peers, schedules and task notifications always go through. If nobody can answer (a `-p` run) or the question is dismissed, the prompt (or the spawn) goes through too. A budget never blocks a turn it can't ask about.

## Commands

| Command | Effect |
|---|---|
| `/budget 20%` (or `/budget 20`) | A budget of 20 points of the 5-hour rate limit, counted from now |
| `/budget $5` (or `5usd`) | A budget of about $5 of session cost, counted from now |
| `/budget` or `/budget status` | Shows the spend so far |
| `/budget off` | Clears the budget |
| `/budget brake 90` | Moves the spawn brake to 90% of the 5-hour window (on at 85% by default); saved across sessions |
| `/budget brake off` | Turns the spawn brake off; saved across sessions. `/budget brake` shows where it stands |
| `/session-budget [on\|off]` | Turns the warning, the check and the spawn brake on or off; the choice is saved across sessions |

## Settings

There are no plugin options.

## Limits

- The 5-hour figure is account-wide: other sessions in the same window count toward it. A session that outlives a 5-hour reset keeps what it spent before the reset and counts from 0 in the new window.
- Rate-limit data exists only on a subscription, and only after the first response of the session. A percent budget set earlier starts counting at the first reading. With an API key, use a `$` budget.
- The budget lives for the session only. The on/off switch and the spawn brake setting are what persist.
- The spawn brake needs 5-hour data too: with an API key, or before the first reading, spawns are never held. The pace needs three readings over ten minutes.

Uses no model tokens: it reads the same usage figures the status line shows.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

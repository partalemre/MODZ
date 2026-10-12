# session-budget

Sets a spending budget for the current session, warns you at 80%, and stops to ask before you go past 100%.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install session-budget@modz
```

Or in one step: `/plugin install session-budget --marketplace partalemre/MODZ`.

## What you see

- **At 80%:** a row above the prompt, once per budget: a meter with the budget as its marker line and `Budget 80% · $4.00 / $5.00 · full in ≈25m at this pace`, in amber. The desktop app draws it as a picture; the terminal as `━━━━━━━━┃─` plus text. It closes after 20 seconds or with the close mark.
- **At 100%:** the next prompt you type is held and a question opens, with an amber card above it (`Session budget`, `Budget is full`, spent against the budget). The options are **Stop** (recommended, first) and **Continue anyway**. Stop drops the prompt and shows a red row: `Stopped: budget is full · $5.10 / $5.00 · raise it with /budget`. The prompt you typed is not lost: if the box is empty it is put back, and after `/budget` one Enter sends it. Continue anyway raises the budget by one step ($1, or a fifth of a percent budget) and lets the prompt through; when that step fills, it asks again.

Only prompts you type are held (terminal, Remote Control, or the desktop app's Code tab). Prompts from plugins, peers, schedules and task notifications always go through. If nobody can answer (a `-p` run) or the question is dismissed, the prompt goes through too. A budget never blocks a turn it can't ask about.

## Commands

| Command | Effect |
|---|---|
| `/budget 20%` (or `/budget 20`) | A budget of 20 points of the 5-hour rate limit, counted from now |
| `/budget $5` (or `5usd`) | A budget of about $5 of session cost, counted from now |
| `/budget` or `/budget status` | Shows the spend so far |
| `/budget off` | Clears the budget |
| `/session-budget [on\|off]` | Turns the warning and the check on or off; the choice is saved across sessions |

## Settings

There are no plugin options.

## Limits

- The 5-hour figure is account-wide: other sessions in the same window count toward it. A session that outlives a 5-hour reset keeps what it spent before the reset and counts from 0 in the new window.
- Rate-limit data exists only on a subscription, and only after the first response of the session. A percent budget set earlier starts counting at the first reading. With an API key, use a `$` budget.
- The budget lives for the session only. The on/off switch is the only thing that persists.

Uses no model tokens: it reads the same usage figures the status line shows.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

# savvy-progress

Shows a progress band above the prompt and one live Agents pane where every subagent is a crab with its own card: watch it work, message it, stop it, or start a new one.

It was built for [savvy-flow](../savvy-flow) and works with any subagent.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install savvy-progress@modz
```

Or in one step: `/plugin install savvy-progress --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here, for example `Tasks 3/4 · 2 running`.

## What you see

**The progress band** above the prompt: the job title, a phase and count pill (`Tasks 2/4`, `Review 3/4`, `Agents 1/3`, `Done`), a thin segmented meter with one segment per task, the percentage, and a `×N` button that opens the pane. It sits above other mods' rows and steps aside while a survey is open.

Numbers come only from what was observed: first the orchestrator's `progress` report, else the main loop's task list (`TodoWrite`, `TaskCreate`, `TaskUpdate`), else the agents started for this request (finished over total). A running agent that reports its own steps adds partial credit, and the percentage is then marked `~`. With nothing to measure it shows `—`, never `0%`. There is no estimated finish time.

**The Agents pane** (`/agents-info`):

- **Header card:** the job name and percentage, a segmented meter, counts (`2 running · 1 done · 1 planned`) and Cost, Tokens, Time and the share of the 5-hour limit.
- **Attention row:** the one agent that most needs a look. Amber when a running agent has been silent for 2 minutes, or one tool has run for 15 minutes; red when an agent failed on its own in the last 10 minutes. An agent you stopped does not count.
- **Timeline** (with two or more agents, `Hide`/`Show`): one strip per agent, a segment per tool call in the colour of its kind (read, edit, run, agent), and a "now" line.
- **Cards** (Running, Finished, Planned): the crab, a name and tier (`Nori · light · Opus 5.5 · low`), the task, a status pill, a progress bar with its percentage, the current work (`> Write src/Hero.tsx`; the first line of its reply when done) and `3 tools · 0:56 · ≈$0.56`. Progress is measured for an agent that reports its steps or task list, and estimated from its activity otherwise (`~45%`, a dashed bar that stays under 90% until it has replied).
- **Opened card** (`Details`): the task given, a **Now** card (the open tool call and its full target), the agent's own steps, its last 8 calls, the files it touched (edited first), chips for time, context, tokens, cost and 5-hour share, and its result. A running agent has a message box (`Message Nori, Enter sends`) and a **Stop Nori** button, which goes through the normal permission chain.
- **New task:** pick an agent type, describe the work, press Enter to start it. Types are the built-ins (general-purpose, Explore, Plan), every type the engine offers the model (from plugins and settings), and files in `.claude/agents/` and `~/.claude/agents/`.
- **Crabs:** each agent gets its own shell colour, eyes and name in arrival order, with a costume for its savvy-flow tier. Only running agents move; reduced-motion settings stop all of it.
- **Home crab:** the pane's own crab stands in the header (and in the empty pane). It sleeps while nothing runs, works while a turn runs (it walks only when no agent's crab does), looks happy after a turn that answered and worried after one that errored or was stopped, then naps again after 10 quiet minutes. Its level pill (`Lv 1` to `Lv 5`, at 10, 50, 200 and 1000 answered turns) counts every answered main-loop turn on this machine. The terminal shows a face instead: `(-_-) zz`, `(•_•)`, `(^_^)`, `(°_°;)`.
- **Other chats:** when another Claude Code session on this machine waits on you (a permission dialog or a question), a card at the very top names it: `shop · Fix the checkout total · waiting 3 min`, up to three, then `+2 more`. Sessions that only work or sit idle are folded under one `Other chats · 2` row at the foot, and only when there are any. The MODZ panel's line adds `· 1 chat waits` while one does.

### How the other chats are found

Each session writes one small heartbeat to this plugin's own store (a JSON file under your Claude Code configuration folder) under its own key, `sessions/<session id>`: the project (the repository's or the folder's name), a title (the first prompt's first line, 40 characters at most, with anything that looks like a key or token masked), what it is doing (`working`, `waiting` or `idle`) and since when. It writes when that changes and once every 30 seconds, reads the other sessions' keys at the same beat, and deletes its key when the session ends. A heartbeat older than 2 minutes belongs to a session that is gone, and whoever reads it deletes it. Nothing leaves the machine.

The pane lists the engine's own agent list (refreshed every second), so an agent that started before the mod loaded still shows correctly. The `progress` and `step` tool calls are not drawn in the transcript; a failed or interrupted call keeps its row.

## Commands

- `/agents-info` opens or closes the Agents pane. The Agents row in the MODZ panel only opens it.

## Tools it adds

- `mcp__savvy-progress__progress`: the orchestrator reports the plan, the phase and the accepted tasks.
- `mcp__savvy-progress__step`: a worker reports its own steps (`done`, `total`, `note`).

## Settings

| Option | Default | Meaning |
|---|---|---|
| `language` | `auto` | `tr`, `en` or `ru`. `auto` follows `MODZ_LANG`, then Claude Code's `language` setting, then the system locale, else English. |
| `crabInBand` | `false` | Shows the home crab at the right of the progress row while the session is idle. It never adds a row of its own: with no progress row there is no crab. |

```json
{ "pluginConfigs": { "savvy-progress": { "options": { "language": "en" } } } }
```

## Limits

- Cost is a rough estimate from token counts and a built-in price table, not a bill.
- The percentage of an agent that reports nothing is an estimate and is marked `~`.
- A permission ask counts as waiting from the dialog until its tool call finishes, so a long command you approved still reads `waiting` until it ends (the engine raises no event for the answer itself). A turn's end always clears it.
- Other chats show up only in sessions that run this mod. A session that is suspended (a sleeping laptop) drops off after 2 minutes and comes back on its next beat.
- The turn count behind the level is read, added to and written back by each session; two sessions finishing in the same instant may count once.

The mod itself makes no model calls; the other chats and the home crab cost no tokens either. The two tools are called by Claude, which adds the cost of those tool calls, and a task you start from **New task** or a message you send runs a real agent at normal cost.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish. Unlike the other mods, this one also follows Claude Code's `language` setting and your system locale when `MODZ_LANG` is not set, and it has Russian too.

## Credits

Adapted from [johnnyvizz/claude-kit](https://github.com/johnnyvizz/claude-kit) (`plugins/savvy-progress`), licensed MIT. The license file is in this folder.

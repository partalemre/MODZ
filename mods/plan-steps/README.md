# plan-steps

Shows the steps of the plan Claude is working through, and which step it is on. Keeps an open plan on disk so it survives `/clear`, compaction and a new session, and shows a card when an answer leaves steps open. Inspired by [planning-with-files](https://github.com/OthmanAdi/planning-with-files).

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install plan-steps@modz
```

Or in one step: `/plugin install plan-steps --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here, for example `3 of 9 steps`, `5 steps · not started` or `3 of 9 steps · waiting`.

## What you see

Open the pane with `/steps`. It never opens by itself.

```
Plan · 3/9 steps · ≈39%               task list
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ≈24m left

✓ Write the types and the state contract       3m
✓ Task list tracking (TodoWrite, TaskCreate)   5m
✓ Markdown plan parser                         4m
◐ Fuzzy step-to-task matching                  6m
  › 3 files: match.test.ts, parse.ts +1
  ● Matching edge cases
○ Draw the pane: header, bar, step list
○ Status line
```

- `✓` is a finished step, dim, with how long it took.
- `◐` is the current step, bold, with its elapsed time. Below it: checked items (`2/5 items`), the files edited while it was current (by the main loop or any subagent), how many agents have finished, and one `●` row for each agent still running.
- `○` is an upcoming step, with its item count if it has items.

On the desktop app the pane is one drawing with a progress meter and numbered circles on a rail; the current step has a breathing ring. The terminal shows the text view above. Long plans scroll to keep the current step in view.

The header shows done/total and a percentage: finished steps count fully, and the step in progress adds the share of its checked items, or half if it has none. When partial credit is included the percentage is marked `≈`. The time left is the average time of the finished steps times the steps remaining; it appears only after 3 finished steps have measured times. Times come only from changes seen in this session.

A status line entry `plan 3/9 · <current step>` shows while the plan is under way. When every step is done it reads `plan 9/9 · done` until your next prompt. A plan that is not under way stays off the status line:

- **Not started** (every step pending): the pane says `not started`.
- **Gone quiet** (no step change, plan edit, file edit or agent on the current step for 30 minutes): the pane says `waiting · 45m ago` in place of the time left, and the line clears until the next piece of work.

`/clear` empties the pane, but an open plan comes back (see below).

### When an answer leaves steps open

When Claude ends a turn with an answer, the turn worked on the plan (a step changed, the plan file was edited, or a file was edited or an agent ran on the current step), and steps are still open, a card shows above the prompt:

```
╭──────────────────────────────────────────────────────╮
│ ≡ PLAN                                     task list │
│ 6 of 9 steps still open                              │
│ Next: Fuzzy step-to-task matching                    │
│                                                      │
│ ●─●─●─○─○─○─○─○─○ 3/9                                │
│                                                      │
│ [Continue the plan] [Mark plan done]  Not now        │
╰──────────────────────────────────────────────────────╯
```

- **Continue the plan** sends Claude a short prompt to go on with the next open step.
- **Mark plan done** stops tracking this plan: no card, no carrying, and it is removed from disk.
- **Not now** hides the card. It also goes away with the next prompt.

No card for a subagent's turn, an interrupted turn, a turn that did not touch the plan, a plan nobody has started yet, or a finished plan. On the desktop app the steps are dots in one drawing; the terminal draws them as text. The card waits while another notification (cache-tax, you-should-know, reflect, session-budget, test-badge) is showing, and while a question is open.

## Keeping the plan across /clear and compaction

An open plan is saved on disk (the plugin's own store), one per project folder, with its steps and their status. It is removed once every step is done or you mark it done, and it is not brought back once it is older than 24 hours (the time of its last change).

When the conversation no longer holds the plan, it gets one short section in the system prompt with the plan's name, how many steps are done, and the open steps:

- after a compaction (`/compact` or automatic) of the main conversation,
- after `/clear`,
- in a new session in the same project, before anything was said.

After `/clear` or in a new session the plan also comes back to the pane, the status line and the MODZ panel. The section is written once per such event and stays the same on each request after it, so the prompt cache keeps working. It is dropped when the plan is finished, marked done, or replaced by a different plan. It is never added for a finished plan. A worktree counts as its own project, so parallel worktrees keep separate plans.

## Where the plan comes from

The mod watches tool calls and reads no model output.

- **Task list:** `TodoWrite`, or `TaskCreate` and `TaskUpdate`, with each item's pending, in-progress or completed status. A subagent's own `TodoWrite` is ignored.
- **Approved plan:** the plan text that `ExitPlanMode` returns once you approve it.
- **Plan file:** a markdown file Claude reads or writes. `docs/**/plans/*.md`, `PLAN.md` and `*.plan.md` always count. Any other `.md` counts only if it has `### Task N:` or `## Step N` headings or at least 3 checkboxes, and it never replaces a named plan file or an approved plan. When the file is edited it is parsed again, so ticked boxes show up.

If both a plan document and a task list exist, the document's steps lead and the tasks give their status, matched by number (`Task 3: ...`) or by shared words. If the tasks match fewer than half of the steps, the task list is shown instead, since that is the live work.

## Commands

- `/steps` opens the pane. (`/plan` is a built-in Claude Code command, so this mod cannot use that name.)

## Settings

- **Hold the finish** (`holdFinish`, off by default). When an answer leaves steps open, the mod asks Claude to go on by itself instead of showing the card, at most 2 times per plan; after that the card shows as usual. This sends prompts without a press, so it is opt-in. Set it in the plugin's options (`/plugin`), or under `pluginConfigs` in `settings.json`.

Makes no model calls. The only thing it adds to the context is the carried-plan section above: at most 600 characters (about 150 input tokens) on each request while it rides, after a compaction, a `/clear` or a new session with an open plan; nothing otherwise. With **Hold the finish** on, each automatic continue is one more turn. Its only timers are a 30-second tick while the pane is open and one 30-minute timer that takes a quiet plan off the status line. The only file reads are re-reads of markdown files Claude has just read or written; the only writes are the saved plan in the plugin's store.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

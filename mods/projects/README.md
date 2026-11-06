# projects

Every project you worked on with Claude Code, in one place: how far along it is, its plans, where it stopped, what it
cost in tokens and which agents ran. `/projects` or the MODZ panel opens the pane; **Open full board** opens the same
thing large in your browser.

## Where each number comes from

- **Percent.** Never invented. `~72%` is Claude's estimate (one small `haiku` call per project, only when you press
  Estimate; it reads the README, progress notes, plans and commits, and goes stale when commits land). `75%` without
  the `~` counts ticked steps in plan files. A plan nobody ticked counts for nothing, and with neither you see `—`.
- **Tokens.** Summed from `<config>/projects/**/*.jsonl`, subagents included. "Spent" is fresh input + cache writes +
  output; cache reads are shown apart.
- **Where it stopped.** The end of the newest session that did real work: closing recap, last reply, last request, task list; plus git.
- **Agents.** Each subagent's transcript and its `.meta.json`.

A project is a git repository (worktrees and inner folders join it), or a folder with plans, above 100k tokens. The
rest is summed in one line. **Hide from the list** removes a row; the list offers it back.

## Cost and privacy

Zero tokens unless you press Estimate. The first read takes a few minutes on a large history, then only changed files
are read. Everything stays on disk in `<config>/modz-projects/`, including your last prompts in `data.js`.

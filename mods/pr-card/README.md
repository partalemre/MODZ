# pr-card

When Claude opens a pull request (with `gh pr create` in the Bash tool, or through the GitHub MCP tool), draws a card in the conversation under that run of commands.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install pr-card@modz
```

## What it shows

- **Desktop app:** the app's own PR pane already shows state, checks, review and merge, so the card shows only what that pane lacks: repository and number, files and `+`/`−` counts, and a row of changed files, largest change first. Until `gh` has told the files, nothing is drawn.
- **Terminal:** state (open, draft, merged, closed), repository and number, title; checks (passed, running or failed, with the names of the failing ones); review decision and mergeability (ready, conflicts, blocked, behind base); the files with the largest changes.

Set `MODZ_LANG=tr` for Turkish.

## How it stays fresh

One `gh pr view` when a PR is first seen, and again on **Refresh**. pr-card runs no poller of its own: where [test-badge](../test-badge) is installed, its CI watch is the one poller of the PR's checks, and the terminal card shows its newer answer (checks, and a PR it saw merged or closed).

At session start and on a resume it looks once for the branch's open PR, so a run that opened it earlier draws its card again.

It uses no model tokens and writes nothing to disk.

## Limits

- A PR opened on the GitHub website is picked up only as the branch's open PR; it has no run of commands to draw under.
- `$.ui.place` rows do not reach the desktop app yet (app 4.16336.0, November 2026), so the card is drawn through the `ToolGroup` row of the run that opened the PR.

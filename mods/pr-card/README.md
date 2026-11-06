# pr-card

When Claude opens a pull request with `gh pr create`, draws a card in the conversation under that run of commands. The Claude desktop app shows its own PR card; this one adds what that card leaves out: CI checks and which ones fail, the review decision, whether the PR can merge, and the files with the largest changes first.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install pr-card@modz
```

## What it shows

- State (open, draft, merged, closed), repository and number, title, files and `+`/`−` counts
- Checks: passed, running or failed, with the names of the failing ones
- Review decision and mergeability (ready, conflicts, blocked, behind base)
- A row of changed files, largest change first

The terminal draws the same facts as text. Set `MODZ_LANG=tr` for Turkish.

## How it stays fresh

One `gh pr view` per PR, each minute while checks run or GitHub is still working out mergeability, otherwise every five minutes. It stops once the PR is merged or closed, and when `gh` is missing. **Refresh** asks at once. Only the three newest open PRs refresh by themselves.

It uses no model tokens and writes nothing to disk. Cards last for the session: a resumed session draws none.

## Limits

- Only PRs opened through `gh pr create` in the Bash tool are seen, not ones opened through the GitHub MCP tool or the GitHub website.
- `$.ui.place` rows do not reach the desktop app yet (app 4.16336.0, November 2026), so the card is drawn through the `ToolGroup` row of the run that opened the PR.

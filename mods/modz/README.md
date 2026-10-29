# modz

The MODZ panel: one live line from every installed mod, and one click to open any mod's own pane.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install modz@modz
```

Or in one step: `/plugin install modz --marketplace partalemre/MODZ`.

Install this first, then the mods you want. Start a new session, or run `/reload-plugins` in an open one.

## What you see

The panel opens on the right when a session starts, and again any time with `/modz`. In the desktop app the prompt footer also carries a dim **MODZ** button beside the mode labels: like the app's own session-rail toggle, one press brings the panel back (over any mod's pane) and the next puts it away. It never takes the keyboard from the prompt.

- **A head card** that leads with what needs you most: a failure, then a warning, then live work. Idle, it says "All quiet". When something leads, a primary button opens that mod's pane (for example "Open Tests").
- **Rows in three sections**, each with the mod's one-line report and an **Open** button. In the terminal the rows also have number keys (`1` to `9`, then `0`).

| Section | Row | Mod |
|---|---|---|
| Work | Agents | `savvy-progress` |
| | Files | `filetree` |
| | Plan | `plan-steps` |
| | Transceiver | `transceiver` |
| Safety | Tests | `test-badge` |
| | Checkpoints | `checkpoint` |
| | Replay | `replay-theater` |
| Meter | Usage | `hud-pro` |
| | Look | `skins` |
| | Mods | `modz` (the catalog below) |

A row shows for a mod the marketplace lists as on, or for a mod that has reported a line. Each mod reports one short line (60 characters at most) with a tone: idle, live, ok, warn or bad. Mods that draw no pane of their own (`blast-radius`, `secret-guard`, `session-budget`, `cache-tax`, `done-ping`, `reflect-mod`, `terminal-browser`) have no row.

**The Mods pane** (the last row, or its tab beside the panel) lists every mod in the marketplace: its version, whether it is on, whether its `plugin.json` could be read (healthy or broken), its group (Look, Safety, Meter, Flow), where it draws (desktop, terminal), and the project it is adapted from. The head says how many are on and whether all are healthy. It reads the marketplace's `marketplace.json` and each mod's `plugin.json` from disk, and says "Catalog could not be read" if it can't find them.

The desktop app draws the panel as pictures; the terminal draws the same as text.

## Commands

- `/modz` opens the panel and brings it forward.
- **MODZ** in the desktop prompt footer shows or hides the panel.

## Settings

| Option | Default | Meaning |
|---|---|---|
| `openOnStart` | `true` | Open the MODZ panel on the right at every session start. |
| `keepReplyLanguage` | `true` | Keep Claude's replies in your language (below). |

The panel's theme follows Claude Code's `theme` setting.

Uses no model tokens. It only reads local files and the lines the other mods report.

## Reply language

Claude's replies can drift to English right after English tool output or a subagent's English report, even when you write in another language ([anthropics/claude-code#96326](https://github.com/anthropics/claude-code/issues/96326)). The hub adds one short line to the model's context for its next reply ("Reply in Turkish, the user's language; keep code, paths and identifiers as they are.") after the first tool result in a turn that reads as English prose. Short output, code, data and output already in your language get nothing, and it never fires twice in one turn.

The language is Claude Code's own `language` setting when you set one, else Turkish when `MODZ_LANG=tr`; with neither (or English) it does nothing. It is a word-count check, no model call. Only Turkish output is recognised as already in your language; for any other `language` the check is on the English alone. Turn it off with `keepReplyLanguage`.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

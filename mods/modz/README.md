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

The panel opens on the right when a session starts, and again any time with `/modz`.

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

## Settings

| Option | Default | Meaning |
|---|---|---|
| `openOnStart` | `true` | Open the MODZ panel on the right at every session start. |

The panel's theme follows Claude Code's `theme` setting.

Uses no model tokens. It only reads local files and the lines the other mods report.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

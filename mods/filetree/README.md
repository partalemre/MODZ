# filetree

Shows a file tree of your project beside the chat, with what Claude is reading, editing or committing right now and every file it has touched this turn.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install filetree@modz
```

Or in one step: `/plugin install filetree --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here: files changed this turn, uncommitted changes, or the last turn's commit.

## What you see

Open the pane with `/filetree`. It does not open by itself; once opened, it comes back when a session restarts.

- **NOW / DONE card** at the top: the file Claude is reading, editing or committing, in one sentence, with the branch, ahead/behind counts, change status and a short colour legend.
- **Touched by Claude:** the files touched this turn, each with a kind badge, its folder and a status label (Reading, Opened, Editing, Edited, Committed).
- **All files:** the full tree for the working folder. The row Claude is in shimmers with a label, and the right column shows the date or the size. Reads are blue, writes orange, commits green, uncommitted changes amber.
- **Git:** per-file status, `+N -N` line counts on modified files, and counts on folders. Commits to another repo (`cd other && git commit`) show as committed there; if git refuses a commit, the reason is shown.
- **Toolbar:** search (it finds folders you have not opened), Collapse, Refresh, and More (size or date column, hidden files, parent folder, back to project, clear selection). With the tree focused: `r` refresh, `c` collapse, `s` size/date, `.` hidden files, `u` parent folder, `p` project, `x` clear selection, `y` copies the relative path (`Y`, the absolute one), arrow keys or `j`/`k` move, Enter opens a file or toggles a folder.
- Click a row to select it; Ctrl-click or Shift-click opens the file in its default app.

The desktop app (Code tab) draws the tree directly. The terminal needs the fullscreen layout (`/tui fullscreen`) and a window at least 110 columns wide.

If a file is selected in the tree when you send a prompt, one line naming it is added to that prompt's context so "this" can mean it. Writing `@path` in a prompt reveals that file in the tree.

## Commands

- `/filetree` opens the tree on the working folder and follows it.
- `/filetree <path>` pins the tree to another folder.

## Settings

| Option | Default | Meaning |
|---|---|---|
| `activity` | `reads and writes` | What shimmers in the tree: `reads and writes`, `writes`, `reads` or `none`. Git status and line counts always show. |
| `glyphs` | `auto` | `auto` uses Nerd Font icons when a Nerd Font is installed (plain Unicode in the desktop app), `nerd` or `plain` forces one. |
| `follow` | `on` | `on` scrolls the tree to the file Claude reads, writes or commits. `off` keeps the view where you put it; highlights still show. |
| `column` | `date` | What the right column shows at session start: `date` or `size`. The header button toggles it. |

## Limits

- Folder sizes come from `du` (a summed listing on Windows), worked out in the background for the rows on screen.
- Outside a git repository it checks once whether one exists; every git call is scoped to the working folder.
- Clicking rows in herdr needs herdr 0.9.1 or later; on older versions the rows ignore the mouse.
- Mods do not load in WSL sessions of the desktop app.

Uses no model tokens beyond the one context line above.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

## Credits

Adapted from [data-goblin/claude-code-filetree](https://github.com/data-goblin/claude-code-filetree), licensed MIT. The license file is in this folder, with the contributors in `ACKNOWLEDGEMENTS.md`.

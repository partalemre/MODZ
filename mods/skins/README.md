# skins

Redraws Claude Code's transcript in a skin: tool calls with icons and timings, edits as diff cards, tables and code as cards, a themed spinner, and `/skin` to change it all live.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install skins@modz
```

Or in one step: `/plugin install skins --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here, under the name Look: the active skin and whether it is drawing light or dark, for example `tidemark · dark`.

## What you see

| Site | Desktop app | Terminal |
|---|---|---|
| Tool calls | A line icon per kind, a spinning ring while it runs, lines changed and time taken | A node on the turn's rail with the same facts |
| Edits | A diff card: file, `+N -M`, numbered changed lines in green and red | Claude Code's own diff |
| Shell commands | A terminal card: status pill, output with stderr apart, long output folded, and a Copy button | Claude Code's own output |
| Tables in replies | An animated card with zebra rows and swatches for colours; Copy gives the markdown | A cell grid with a header band and zebra rows, and the same Copy |
| Code blocks in replies | A card with the language, line numbers, highlighting and a Copy button | Claude Code's own markdown, and a Copy button |
| Spinner | An animated icon per phase: thinking, tool use, writing, waiting | The skin's word with a band of light through it |
| Above the prompt (off by default) | Rings for context and each plan limit, a Compact button, and a nudge to compact from 70% context | Block meters and the same button |
| Turn footer | not drawn on the desktop app | Time, tool count and lines changed |
| Your prompts | A rounded outline sized to what you typed | The same |
| The question dialog | A band naming its topics above Claude Code's own dialog | The same |

Every card rises in row by row and respects reduced motion. A skin only changes what is drawn: the stored conversation, and what the model reads, are untouched. Agents, plan mode and the permission prompt keep Claude Code's own drawing.

There are eight skins, each with a light and a dark palette: `tidemark` (the default, in MODZ's own colours), `noir`, `tokyo-night`, `dracula`, `nord`, `gruvbox`, `catppuccin` and `mono`. On a light Claude Code theme every skin switches to its light palette. With the `auto` theme it follows your terminal's background (`COLORFGBG`) or, failing that, the system's light or dark mode.

## Commands

- `/skin` opens the settings pane (named Look): pick a skin, see a live preview, switch the rail, tables, shimmer, band and icons, and repaint any colour. Repainting a built-in skin saves it as your own `my-<skin>`.
- `/skin gallery` shows every element the skin draws, numbered, to point at when you want one changed.
- `/skin <name>`, `/skin list`, `/skin off` switch skins.
- `/skin rail|tables|shimmer|band|clip on|off` switch a part on or off. `/skin icons unicode|ascii` picks the icon set.
- `/skin pin` gives this folder a look of its own; `/skin unpin` returns it to the default; `/skin share` makes this folder's look the default for the rest. Made skins are shared by every folder.

Your choices are remembered across sessions.

**Ask Claude.** The mod gives Claude a `design` tool (`mcp__skins__design`) and a short guide, so "make me a skin that feels like a sunset" builds one and applies it while you watch.

## Settings

There are no plugin options. Set `SKINS_THEME=light` or `SKINS_THEME=dark` in the `env` block of `~/.claude/settings.json` to choose the palette yourself, for example when you launch with `claude --settings '{"theme":"dark"}'`, which skins cannot see.

## What it can reach

It draws and remembers. It reads the session's directory, your context and plan usage, Claude Code's theme setting and the `SKINS_THEME` and `COLORFGBG` variables, keeps its settings in the mod store, and registers one tool for Claude. It compacts only when you press Compact and copies only when you press Copy. With the `auto` theme it asks the system for its appearance (`defaults read -g AppleInterfaceStyle` on macOS, `gsettings get org.gnome.desktop.interface color-scheme` on GNOME). It makes no network calls and touches no files.

Uses no model tokens unless you ask Claude to design a skin, which is an ordinary turn.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

## Credits

Adapted from [hellosverre/claude-skins](https://github.com/hellosverre/claude-skins), licensed MIT. The license file is in this folder.

# terminal-browser

Opens a real browser in a pane inside Claude Code's terminal UI, so you can preview a site or an HTML document without leaving the session, and Claude can drive it.

It works in the terminal only. On the desktop app it draws nothing and does not register `/browser`, so it never clashes with the desktop's own browser.

## Install

First install the `terminal-browser` program that does the rendering:

```
curl -fsSL https://terminal-browser.sh/install | bash
```

(or `brew install terminal-browser`). Then, in Claude Code:

```
/plugin marketplace add partalemre/MODZ
/plugin install terminal-browser@modz
```

Or in one step: `/plugin install terminal-browser --marketplace partalemre/MODZ`.

If the program is missing, `/browser` says "Install terminal-browser first" and gives the address; if it is too old, it asks you to run `terminal-browser upgrade`.

## What you see

`/browser` opens a pane on the right with a live page drawn as pixels through the kitty graphics protocol. Until the first frame arrives the pane shows the address and "Loading the page...", or the reason the bridge could not start. `/browser` with no address opens the start page.

You can click and type in the page. The mouse position can be slightly off, because Claude Code does not enable pixel-coordinate mouse reporting.

Claude can control the open page with the `terminal-browser` command line program; an `open` tool for it is optional (see Settings).

## Commands

- `/browser` opens the browser, or closes it if it is already open.
- `/browser <url>` opens that address. Hosts with a port work, for example `localhost:3000` and `example.com:8080`.
- `/browser close` closes it.

If the bridge dies, the next `/browser` starts it again.

## Settings

| Option | Default | Meaning |
|---|---|---|
| `agentTool` | `false` | Gives Claude an `open` and a `close` tool for the browser pane. Off by default, because Claude can already open the browser through the `terminal-browser` command line program. |

To turn it on, add this to `~/.claude/settings.json`:

```json
{
  "pluginConfigs": {
    "terminal-browser@modz": { "options": { "agentTool": true } }
  }
}
```

## Requirements and limits

- Your terminal must support the [kitty graphics protocol](https://sw.kovidgoyal.net/kitty/graphics-protocol/) with Unicode placeholders. Ghostty and kitty do, as do terminals built on libghostty such as cmux and supacode. Elsewhere, opening the browser can garble the display.
- Terminal multiplexers rewrite terminal graphics and may break it. tmux does not work through the plugin yet, and herdr is very slow.
- The plugin talks to a local HTTP server to reach the `terminal-browser` program, so your OS may ask whether your terminal may access the local network.
- Claude Code gives the chat area a large minimum width, so the browser sometimes cannot be resized as far as you want.

Makes no model calls and sends no requests off your machine. With `agentTool` on, the two tool definitions add a few tokens to every request.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

## Credits

Adapted from [zenbu-labs/terminal-browser](https://github.com/zenbu-labs/terminal-browser), licensed MIT. The license file is in this folder.

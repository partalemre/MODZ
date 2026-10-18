# done-ping

Sends a notification when a long turn finishes or when Claude is waiting for your permission or your answer, so you can look away while it works.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install done-ping@modz
```

Or in one step: `/plugin install done-ping --marketplace partalemre/MODZ`.

## What you see

Every ping has a title, the project name, and a short body of facts. It never carries code, a command or the text of a reply, so nothing sensitive leaks through it.

- **Turn finished** (main loop, not interrupted, ran at least the threshold): body such as `tests passed · 3 files`, with the test result first. The tests fact comes from a test command Claude ran in that turn. With neither fact, the body says how long it took (`took 1m 1s`).
- **Waiting for approval:** the tool and at most a file name or host (`Edit · app.ts`, `WebFetch · docs.example.com`). A command is never shown; it says `Bash command`.
- **Waiting for an answer:** the first question Claude asked you, without markdown or code.

Where a ping goes, in order:

1. In the desktop app, Claude's own notification (with the Claude icon), when the app allows it without a prompt. If the app reports that you are present, nothing is shown.
2. If the app this session runs in (Claude, Terminal, iTerm, Ghostty) is the frontmost app, no banner is shown.
3. `terminal-notifier`, if you already have it installed in `/opt/homebrew/bin` or `/usr/local/bin`. Nothing is installed for you.
4. A macOS banner through `osascript`, with the sound you chose. Not in the desktop app: macOS files that banner under Script Editor, and clicking it opens Script Editor.
5. If no banner could be shown, a one-line notice above the prompt: a bell tile (green when done, red if the turn's tests failed, amber when waiting), the title, then the facts. It clears itself after 20 seconds or when you send the next prompt. A live notice from session-budget or test-badge takes that line first.

One waiting ping is sent per 15-second burst, and any two pings are at least 10 seconds apart.

## Sound packs

Off by default. Set `soundPack` to `chime`, `soft` or `retro` and each ping also plays one of the mod's own short sounds (under 1.2 seconds): one for a finished turn, another for Claude waiting on you. A pack replaces the banner's own sound, so a ping never rings twice, and it stays quiet whenever the banner does (while you are looking at the session). Where the host has no player (a Linux or Windows terminal) nothing plays and nothing is shown; the debug log says why.

The sounds are synthesized from plain sine and triangle tones by `tools/sounds/make.py` in this repository, with no samples from anywhere else. They are this repository's own work under its MIT licence. Run `python3 -I tools/sounds/make.py` to make them again; the output is the same every time.

## Commands

- `/done-ping` turns the ping on or off (remembered).
- `/done-ping 90`, `/done-ping 2m` or `/done-ping 3min` sets the threshold (remembered).
- `/done-ping test` sends a sample ping, ignoring the focus rule.

## Settings

| Option | Default | Meaning |
|---|---|---|
| `thresholdSeconds` | `60` | A finished turn pings only when it ran at least this long. |
| `pingOnPermission` | `true` | Also ping when Claude asks for permission or asks you a question. |
| `sound` | `Glass` | The banner's sound: a macOS system sound name (Glass, Hero, Ping, Purr, Submarine, Funk, Pop), a path to a sound file, or `none`. A sound pack replaces it. |
| `soundPack` | `off` | `chime`, `soft` or `retro` plays the mod's own sounds, one for done and one for waiting. |
| `quietWhenFocused` | `true` | Skip the banner while the app this session runs in is the frontmost app. |
| `appNotification` | `true` | In the desktop app, use Claude's own notification when it is available without a prompt. |

Set `MODZ_THEME=light` or `MODZ_THEME=dark` in the `env` block of `~/.claude/settings.json` to pin the theme of the notice line.

## Limits

- `osascript` banners carry the Script Editor icon, and macOS may ask you to allow its notifications the first time. `terminal-notifier` or the desktop app's own notification show the right icon.
- If `terminal-notifier` is installed but its notifications are off in System Settings, it fails and the desktop app shows the line above the prompt instead.
- Another session's tab in the same app counts as "looking at the session".
- In auto mode a classifier can settle a permission ask without showing you a dialog, so a waiting ping can occasionally fire with nothing visible to answer.
- Outside the desktop app the banner is macOS only.

Uses no model tokens.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

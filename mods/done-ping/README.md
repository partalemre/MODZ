# done-ping

A notification when Claude needs you: a long turn finished, or Claude is waiting for a permission answer or asking you a question. Zero tokens.

## What you get
Every ping has three parts, and never carries code, a command or a reply's text (so no secret can leak through it):

```
Tur bitti                    <- title: the outcome in at most four words (Tur bitti / Onay bekliyor / Cevap bekliyor)
eliti                        <- subtitle: the project
3 dosya · testler geçti      <- body: facts only; "testler" comes from a test command Claude ran in the turn
```

A waiting ping's body names the tool and, at most, a file name or a host (`Edit · app.ts`, `WebFetch · docs.example.com`, `Bash komutu`).
Where no notification can show, one row above the prompt says it in the MODZ notice style (bell tile, Moss when done, Amber when waiting):
`Tur bitti · 2dk 14sn · 3 dosya değişti · testler geçti`. It clears itself, on ✕, or when you send the next prompt.
`MODZ_THEME=light|dark` pins the row's theme; otherwise it follows the app's color scheme.

- Turn finished (main loop, not interrupted, ran ≥ threshold, default 60 s): subtitle `Bitti · <duration>` (plus `· N dosya değişti` when files changed), body the opening of Claude's reply with markdown removed; with no reply text, `N dosya değişti`, else `Sıra sende`.
- Permission: subtitle `Onay bekliyor: Bash`, body the command (or the file name, URL…).
- Question (AskUserQuestion): subtitle `Soru soruyor`, body the first question.

## How it is delivered, in order
1. **Desktop app (Code tab):** Claude's own notification, with the Claude icon, through the built-in `PushNotification` tool, only when that tool exists and the permission check allows it without a prompt. If the app answers that you are present, nothing is shown. Turn it off with `appNotification: false`.
2. **Quiet while you look:** if the app this session runs in (Claude, Terminal, iTerm, Ghostty: `__CFBundleIdentifier`) is the frontmost app (`lsappinfo`), no banner. Turn off with `quietWhenFocused: false`.
3. **terminal-notifier**, if already installed (`/opt/homebrew/bin` or `/usr/local/bin`; nothing is installed for you): the host app's icon (`-sender`), one banner per project (`-group`).
4. **osascript** `display notification … with title … subtitle … sound name …`. Text is passed as argv items, never spliced into the script.
5. If no banner could be shown, one line above the prompt: `✓ Bitti · 2dk 14sn · Testler geçti…  ✕` (or `!` for waiting), gone after 20 s. It yields to cache-tax, you-should-know, reflect, session-budget and test-badge notices.

Debounce: one waiting ping per 15 s burst, and any two pings at least 10 s apart.

## Commands
- `/done-ping` toggles on/off (remembered).
- `/done-ping 90`, `/done-ping 2m` or `/done-ping 3dk` sets the threshold (remembered).
- `/done-ping test` sends a sample ping, ignoring the focus rule.

## Config (userConfig)
- `thresholdSeconds` (number, 60)
- `pingOnPermission` (boolean, true)
- `sound` (string, `Glass`): a system sound name (Glass, Hero, Ping, Purr, Submarine, Funk, Pop), a file path (played with `afplay`), or `none`. The old default `/System/Library/Sounds/Glass.aiff` still works.
- `quietWhenFocused` (boolean, true)
- `appNotification` (boolean, true)

## Limits (honest)
- osascript banners carry the Script Editor icon; macOS gives no way around that without a helper app. terminal-notifier (if you have it) or the desktop app's own notification show the right icon.
- "Looking at the session" means the host app is frontmost; another session's tab in the same app also counts as looking.
- The *ask* verdict is the permission decision; in auto mode a classifier may settle an ask without showing you a prompt, so a waiting ping can occasionally fire without a visible dialog.
- macOS may need notifications allowed for Script Editor the first time.

## Dev
`claude plugin validate .`, `claude plugin test .` (21 tests).

# checkpoint

Takes a silent snapshot of your project before Claude's first file write of every turn, so you can undo any turn.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install checkpoint@modz
```

Or in one step: `/plugin install checkpoint --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here: how many checkpoints are saved and how long ago the newest was taken.

## What you see

`/checkpoints` opens a pane with a timeline of turns, newest first. Each row has the turn number and age, the first line of your prompt, the number of files the turn touched, and a small letter chip for each kind of tool it used (edit, write, bash, read, search, web, agent, todo). Turns an undo went back past are struck through. The snapshot an undo takes first appears as "Before undo".

**Undo** on a row opens a confirm card: how many files will be restored and how many new files removed, a diffstat with added and removed lines per file, and two buttons.

- **Restore N files** (`r`) goes back to before that turn.
- **Cancel** (`c`) has the focus, so Enter changes nothing.

After an undo, **Redo** brings the files back as they were. Undoing an older turn also rolls back every later turn, because the whole tree returns to the state before it.

On the desktop app the pane is drawn as pictures; in the terminal it is text.

## Commands

| Command | Effect |
|---|---|
| `/checkpoint [on\|off]` | Turns snapshots on or off; a toast confirms, and the choice is kept across sessions |
| `/checkpoints` | Opens the checkpoint pane |

## Settings

There are no plugin options. Set `MODZ_THEME=light` or `MODZ_THEME=dark` in the `env` block of `~/.claude/settings.json` to pin the pane's theme.

## How it works

- After each prompt, the first `Write`, `Edit`, `MultiEdit` or `NotebookEdit` call waits for one snapshot. Writes in parallel wait for the same snapshot, so none of them lands in it.
- In a git repo, the work tree goes into a private index and is committed under `refs/checkpoints/<session>/<time>`. Your branch, `HEAD`, staging area and stash are never touched, and checkpoint refs are not pushed.
- Outside a repo, a shadow repo at `~/.cache/claude-checkpoint/<folder>.git` is used. It never runs on your home folder or `/`.
- `.gitignore` is respected. `node_modules` and files over 5 MB are skipped.
- The newest 30 checkpoints per project are kept; older refs are deleted and git's normal `gc` collects the objects.
- Before an undo, a safety checkpoint of the current state is taken, so the undo can itself be undone. Changed and deleted files come back with `git restore`; files created after the checkpoint are removed. Ignored files and files over 5 MB are left alone.
- If `/usr/bin/git` fails on macOS (the Xcode shim does this until the license is accepted), it falls back to the Command Line Tools git.

## Limits

- Bash commands that write files do not trigger a snapshot. The next turn's snapshot captures their result.
- If Claude runs `git log --all` in a real repo, the `refs/checkpoints/*` commits are listed like any other ref.

Uses no model tokens: it runs plain `git` and adds nothing to the conversation.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

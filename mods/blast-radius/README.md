# blast-radius

Holds a risky shell command before it runs and shows you what it would change, so you decide whether it goes ahead. It also holds an edit to a file another chat on this machine changed in the last half hour.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install blast-radius@modz
```

Or in one step: `/plugin install blast-radius --marketplace partalemre/MODZ`.

## What you see

When Claude calls Bash with one of the commands below, the call stops and a card opens. It shows the command, one plain sentence about what it would throw away, a banner saying whether that can be undone, and the affected files grouped by folder with their sizes. Two buttons answer it:

- **Run anyway** (`r`) lets the command run as written.
- **Keep my work** (`k`) refuses it. It has the focus, so Enter is always the safe answer. Esc and the pane's close mark do the same, and a toast confirms nothing was thrown away.

`d` shows the rest of a long list. Claude is told the command was held and why, and is asked not to retry unless you say so.

| Command | What the card lists |
|---|---|
| `rm -r`, `rm -f`, `rm -rf` | The files it would delete, with sizes, the total, and how many git tracks. Globs and `~` are expanded. |
| `git reset --hard` | Files with uncommitted changes, with added and removed lines. |
| `git checkout -- .`, `git restore .` | Files with unstaged changes. |
| `git clean` | The untracked paths it would remove (from `git clean -n` with the same flags). |
| `git push --force` (also `-f`, `--force-with-lease`, `+ref`) | Commits on the remote branch that your HEAD lacks, which the push would drop. |
| `manage.py migrate`, `db:migrate`, `alembic upgrade`, `prisma migrate` | The pending migrations, from the tool's own status command. |
| any other `migrate` | A note that pending migrations can't be listed for that tool. |

Every other command runs as normal. The card follows `cd dir &&`, `pushd`/`popd` and `git -C dir` on the same line and measures in that folder.

On the desktop app the card is drawn as a picture; in the terminal it is text. In a terminal too narrow for a side pane (under about 144 columns) the card moves into the band above the prompt. Focus the band first (click it, or ctrl+x then tab); letters never answer from the prompt, so a stray keystroke can't delete anything.

## Another chat's edit

When two chats work in the same files, the second one can write over what the first just changed. Each edit that lands (Write, Edit, NotebookEdit, and MultiEdit where the build has it) is noted by the file's real path, so a symlink and its target count as one file. If Claude is about to edit a file that another chat on this machine edited in the last 30 minutes, the edit is held on an amber card:

- The headline says which file and when ("Another chat edited client.ts 12 min ago"); the right of the card names that chat's project folder.
- The file is listed with its uncommitted lines from `git diff --numstat`, when it is in git and has any.
- **Skip this edit** (`s`) has the focus: the edit is refused and Claude is told another chat may still be working on the file. **Edit anyway** (`e`) lets it through.

With nobody there to answer (`claude -p`, the SDK) the edit goes ahead and a line goes to the debug log. If the guard itself fails, the edit goes ahead too: this is a caution, not a lock.

The notes live in the plugin's own store under `~/.claude`, one entry per chat, so two chats never write over each other's. An entry holds at most 200 paths and drops edits older than 30 minutes; a chat removes its entry when it ends, and an entry left by a chat that crashed is removed after a day.

## Limits

- It reads the command text and does not parse shell fully. `$(...)`, aliases, `eval`, `bash -c "..."`, `xargs rm`, `find -delete`, scripts that call `rm`, and wrappers such as `timeout 5 rm` or `doas rm` are not caught.
- Only the first risky part of a command line is measured. **Run anyway** runs the whole line as written.
- One command is held at a time; a second risky call (a subagent's) waits for the first answer.
- If nobody answers within 10 minutes, or you interrupt the turn, the command is refused. If the hook itself fails, a risky command is refused too.
- Only Bash commands and file edits are watched. Other tools are not held.
- The edit guard sees chats on this machine only, and only edits made through Claude's file tools; a file another chat changed with a shell command is not noted.
- Counts are approximate. Sizes come from `du -k` and `wc -c`; a very large tree can take a few seconds to measure.
- The force-push list uses your last fetch of the remote branch; without one it says it can't list the dropped commits.
- Migration status commands (for example `python3 manage.py showmigrations`) load your project's code before you answer.
- Needs `bash`, `git`, `find` and `du` on your `PATH`.
- This is a safety net, not a permission system. Use [permission rules](https://code.claude.com/docs/en/settings) for a hard block.

Uses no model tokens. It has no settings.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

## Credits

Adapted from [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground) (`claude-code/mods/blast-radius`), licensed Apache-2.0. The license file is in this folder.

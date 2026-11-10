# blast-radius

Holds a risky shell command before it runs and shows you what it would change, so you decide whether it goes ahead. It also holds an edit to a file another chat on this machine changed in the last half hour, and, when you write house rules, a command that may break one.

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
| `rm -r`, `rm -f`, `rm -rf` | The files it would delete, with sizes, the total, and how many git tracks. Globs and `~` are expanded. `node_modules`, `dist`, `build`, `.next`, `target`, `__pycache__` and other build output that git ignores runs with no card: the next install or build makes it again. |
| `find … -delete`, `find … -exec rm` | The paths it would delete, from the same `find` with `-print` in its place. |
| `… \| xargs rm`, `xargs rm < list` | A note that the paths come from its input, so they can't be measured: always held. |
| `git reset --hard [ref]` | Files with uncommitted changes, with added and removed lines, and the commits it moves the branch back past. |
| `git checkout [ref] -- paths`, `git checkout path`, `git restore paths`, `git checkout -f`, `git switch -f` | Files with changes there that it would throw away (staged ones too with a ref or `-f`). A plain branch switch matches no changed file and runs. |
| `git clean` | The untracked paths it would remove (from `git clean -n` with the same flags). `git clean -n` itself runs. |
| `git stash drop`, `git stash clear` | The stashes it deletes. |
| `git branch -D` | Commits on the branch that no other branch, remote branch or tag has. |
| `git push --force` (also `-f`, `--force-with-lease`, `+ref`) | Commits on the remote branch that your HEAD lacks, which the push would drop. |
| `git push --delete`, `git push origin :branch` | Commits only that remote branch has. Always held: others may use it. |
| `git worktree remove --force` | Uncommitted and untracked files in that worktree. |
| `> file`, `cp`/`mv` onto a file, `truncate`, `dd of=`, `shred`, `tee` | Existing files whose contents git can't bring back. A missing file, one git has unchanged, a temp file or an ignored log runs with no card; `dd` to a disk is always held. |
| `docker volume rm`, `docker volume prune`, `docker system prune`, `docker compose down -v` | The volumes, or the space per kind, it would remove. |
| `terraform destroy`, `kubectl delete`, `rsync --delete` | The resources (`terraform state list`), objects (`kubectl get`) or files (`rsync --dry-run`) it would remove. |
| `psql`/`mysql`/`sqlite3` with `DROP`, `TRUNCATE` or `DELETE` without `WHERE`; `supabase db reset`, `prisma migrate reset`, `db:drop`, `manage.py flush` | The statement, named: a database can't be measured from here, so it is always held. |
| `manage.py migrate`, `db:migrate`, `alembic upgrade`, `prisma migrate` | The pending migrations, from the tool's own status command. `prisma migrate status` and `migrate --plan` run. |
| any other `migrate` | A note that pending migrations can't be listed for that tool. |

A command that would lose nothing runs with no card. Every other command runs as normal. Blast Radius reads the command inside `bash -c`, `sh -c`, `eval` and `xargs`, and through `sudo`, `env`, `timeout`, `nice`, `ionice`, `nohup` and `VAR=value`; text inside quotes or a heredoc is never read as a command. The card follows `cd dir &&`, `pushd`/`popd` and `git -C dir` on the same line and measures in that folder; on a line with several risky parts, the first that would lose something is the card.

A risky call nobody can answer is refused at once, never held: from a subagent (only the main chat can answer a card) or in a chat with no screen attached (`claude -p`, the SDK, and also a desktop chat left in the background or driven over Remote Control). Claude is told the command and what it would have lost, and to tell you. If it would lose nothing, it runs. A write (`>`, `cp`, `mv`) to a path only known when the command runs, such as `cp "$a" "$b"`, is not measured and runs.

On the desktop app the card is drawn as a picture; in the terminal it is text. In a terminal too narrow for a side pane (under about 144 columns) the card moves into the band above the prompt. Focus the band first (click it, or ctrl+x then tab); letters never answer from the prompt, so a stray keystroke can't delete anything.

## House rules

Write the rules you want Claude to keep in `.claude/house-rules.md` at the project root, one per line or list item, in plain words:

```md
- never touch the production database
- no network calls to *.internal
```

Headings, `<!-- comments -->` and blank lines are not rules. With the file there, each Bash command that Blast Radius didn't hold and that isn't a plain read is put to a judge with your rules as its instructions. Plain reads never are: `ls`, `cat`, `head`, `tail`, `wc`, `pwd`, `echo`, `grep`, `rg`, `which`, `stat`, `file`, `tree`, `du`, `df`, `date`, `whoami`, `git status`, `git diff`, `git log`, `git show` and `git blame`, alone or joined by pipes, `&&` or `;`, with no redirect, `$(...)` or `--output`. The judge answers one of three ways:

- **allow**: the command runs.
- **ask**: the command is held on an amber card that says which rule ("House rule: no network calls to *.internal"; "house rules" when the judge can't name one). **Keep my work** (`k`) has the focus; **Run anyway** (`r`) runs it. With nobody there to answer (a subagent, `claude -p`, the SDK) the command is refused.
- **block**: the command is refused, and Claude reads which rule it breaks.

The verdict for each exact command is kept for the session, and dropped when the rules change. If the judge can't answer (no model, a timeout, a reply it can't read), the command runs and a line goes to the debug log: a judge that failed never stops your work. Up to eight rules, the judge names the rule it matched; with more it answers by kind alone. Rules past 4,000 characters are not sent.

**Token cost:** at most one `haiku` call (effort low, a reply of at most 32 tokens) per Bash command that is neither held by the table nor a plain read, on your own account, and only while `.claude/house-rules.md` exists; a repeated command costs nothing. Without the file this costs nothing.

**TypeSafe Jev (opt-in):** set `MODZ_JUDGE=jev` and `TYPESAFE_API_KEY` in the `env` block of `~/.claude/settings.json` and the judge asks TypeSafe Jev instead of the model. The command and your rules are then sent to `api.typesafe.ai`, after `KEY=value` assignments with secret-looking names, `--token`/`--password` values, URL passwords, bearer tokens and long key-like strings are masked. Without both variables nothing is sent there.

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

Without `.claude/house-rules.md` it uses no model tokens. It has no settings beyond the two Jev variables above.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

## Credits

Adapted from [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground) (`claude-code/mods/blast-radius`), licensed Apache-2.0. The license file is in this folder.

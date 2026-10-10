# checkpoint

Takes a silent snapshot of the project before the first file write of every turn, so any turn can be undone. Zero tokens: plain `git`, no model calls.

## The pane (`/checkpoints`)

A vertical timeline of turns, newest first: a step dot on a rail, `Tur 12 · 21 dk önce`, the prompt's first line, `+4 dosya` and a monogram chip per tool kind the turn used (`E` edit, `W` write, `$` bash, `R` read, `S` search, `G` web, `A` agent, `T` todo). Turns an undo went back past are struck through in a dim color; the snapshot an undo takes first shows as `Geri almadan önce`.
**Geri al** opens a confirm card (single Amber border): `Tur 12 öncesine dönülsün mü? 4 dosya değişecek`, a diffstat (`+27 −40`, per file `+18 −4`, which files are deleted, `+N dosya daha` past five) and **4 dosyayı geri al** (`g`) / **Vazgeç** (`v`, focused, so Enter changes nothing). After the undo, **Yinele** (`y`) goes back to the files as they were. Turn numbers, file counts and tool chips are kept in the plugin store, not in git. `MODZ_THEME=light|dark` pins the pane's theme.

## How it works

- After each prompt, the first `Write` / `Edit` / `MultiEdit` / `NotebookEdit` call waits for one snapshot. Writes in parallel wait for the same snapshot, so none of them lands in it.
- **In a git repo**, the work tree goes into a private index (`GIT_INDEX_FILE=<git dir>/checkpoint.index`), then `git write-tree` → `git commit-tree` (parent `HEAD`) → `git update-ref refs/checkpoints/<session>/<time>`. Your branch, `HEAD`, the staging area and the stash are never touched, and checkpoint refs are not pushed.
- **Not a repo:** a shadow bare repo at `~/.cache/claude-checkpoint/<folder>.git` with `--work-tree=<folder>`. It never runs on your home folder or `/`.
- `.gitignore` is respected. `node_modules` and files over 5 MB are skipped.
- The newest 30 checkpoints per project are kept; older refs are deleted (`update-ref --stdin`). Checkpoint refs get no reflog, so the objects of a dropped checkpoint become unreachable and git's normal `gc` collects them; a shadow repo, which none of your git commands touch, gets `git gc --auto --quiet` after a prune.
- Bash commands that write files do not trigger a snapshot. They are still captured by the next turn's snapshot.
- macOS: if `/usr/bin/git` fails (the Xcode shim does this until `sudo xcodebuild -license accept` has been run), the mod falls back to `/Library/Developer/CommandLineTools/usr/bin/git`.

## Token cost

Zero per turn. The `prompt.submit` and `tool.call` hooks hand the event on unchanged (no `context`, no rewritten tool result), the mod never calls `$.model` or `$.session.append`, and its git commands run through `$.process.run`, which no transcript row records. The commands answer with no text (the toggle confirms in a toast, `/checkpoints` opens a pane), so not even a command output row reaches the model; only the engine's own record of the typed `/checkpoints` remains. One thing the model can still see: if it runs `git log --all` in a real repo, the `refs/checkpoints/*` commits are listed like any other ref.

## Undo

`/checkpoints` opens a pane: `Kontrol noktaları` with the count and the newest one's age, then one row per turn, newest first, each with **Geri al**. Pressing it works out what would change and shows a confirm card in the pane (`Tur 12 öncesine dönülsün mü?`, or the prompt's words for a turn with no number, how many files are restored and removed, up to 5 of them) with **N dosyayı geri al** and **Vazgeç**. On confirm:

1. A safety checkpoint of the current state is taken (`geri almadan önce: …`), so the undo can itself be undone.
2. Changed and deleted files come back with `git restore --source=<checkpoint> --worktree` (index untouched).
3. Files created after the checkpoint are removed. Ignored files and files over 5 MB are left alone.

Undoing an older turn also rolls back every later turn, because the whole tree goes back to the state before that turn.

## Commands

| Command | Effect |
| --- | --- |
| `/checkpoint [on\|off]` | Toggle snapshots (confirmed in a toast); the setting is saved across sessions |
| `/checkpoints` | Open the checkpoint pane |

## Files

- `hooks/git.ts`: locate repo/shadow, snapshot, list, prune, plan/apply restore
- `hooks/pane.tsx`: pane tree and the confirm card
- `hooks/register.tsx`: hooks and commands
- `tests/checkpoint.test.ts`: `claude plugin test .`

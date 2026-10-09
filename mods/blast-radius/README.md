# Blast Radius

> Dayandığı proje: [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground) (`claude-code/mods/blast-radius`), Apache-2.0 (LICENSE korunmuştur). MODZ sürümü: Türkçe arayüz, Tidemark tasarım dili, masaüstünde Svg kart.

A Claude Code mod that holds a risky shell command and shows you what it would change before it runs. We're sharing it as a small, complete example of a mod that pauses a tool call and asks you to decide.

## What this shows

When Claude calls Bash with one of the commands below, Blast Radius stops the call, works out what the command would touch, and opens a pane with a card: the command and its consequence as one headline (`rm -rf build · 9 dosya · 286 KB silinecek`), a risk banner that says why it can't be undone (for example `Bunların hiçbiri git'te değil, geri getirilemez.` when none of the files is tracked), and the files grouped by folder with size bars on one scale (the share of the whole delete). Two buttons answer it: the destructive one names what it does (**9 dosyayı sil**, hotkey `s`), **Vazgeç** (hotkey `v`) refuses it and holds the focus, so Enter is always the safe answer. Closing the pane (Esc or its close mark) is Vazgeç too. After the delete button the listed files are struck through for a moment, then the command runs. Claude sees a refusal and the reason.

| Command | What the pane shows |
|---|---|
| `rm -r`, `rm -f`, `rm -rf` | The files it would delete, grouped by folder, with each file's size, the total, and how many git tracks. Globs and `~` are expanded. |
| `git reset --hard` | The files with uncommitted changes, from `git status --porcelain`, with `+added −removed` lines from `git diff --numstat`. |
| `git checkout -- .`, `git restore .` | The files with unstaged changes. |
| `git clean` | The untracked paths it would remove, from `git clean -n` with the same flags, sized and grouped like `rm`. |
| `git push --force` (also `-f`, `--force-with-lease`, `+ref`) | The commits on the remote branch that your HEAD doesn't have, which the push would drop. |
| `manage.py migrate`, `db:migrate`, `alembic upgrade`, `prisma migrate` | The pending migrations, from the tool's own status command. |
| any other `migrate` | A note that it can't list the pending migrations for that tool. |

Every other command runs as normal. If the command line moves first, with `cd dir &&`, `pushd`/`popd` or `git -C dir`, Blast Radius measures in that folder. A `cd` inside `( ... )` only applies inside the parentheses, as in the shell.

The patterns it demonstrates:

- Holding a `tool.call` until the user answers, and returning `{ deny }` with a reason Claude can act on.
- Drawing the same card in a `Pane`, or in the `AbovePrompt` band when the terminal is too narrow for a pane. The band calls `next(e)` and stacks the card above the other mods' rows, and yields to a survey.
- On desktop the card is drawn with `Svg` (icon tile, headline, banner, size bars, the strike); the terminal gets the same words as text.
- Failing closed: the `tool.call` hook has a `.catch` that refuses a risky command if the hook throws, overruns or is re-entered.
- Measuring with `$.process.run`, passing paths as arguments so nothing in them runs as shell.

## Demo

`rm -rf build` held, with the files it would delete:

![Blast Radius holding rm -rf build in a pane](screenshots/blast-radius-pane.png)

After Cancel, Claude reports that nothing was deleted:

![Claude reports the command was cancelled](screenshots/blast-radius-cancelled.png)

The second try, after Proceed:

![Claude reports the folder was deleted after Proceed](screenshots/blast-radius-proceeded.png)

`git reset --hard` in a 120-column terminal, where the report is drawn in the band above the prompt:

![Blast Radius showing git reset --hard in the band above the prompt](screenshots/blast-radius-band.png)

## How it was built

- **Model:** built with Claude in Claude Code. The test runs and screenshots used Claude Sonnet 5. The mod itself doesn't call a model.
- **Prompt(s):** the mod started as one of ten ideas Claude wrote for mods. This is the idea as written:

  > **Blast Radius.** _See what a command will touch, before it runs._ When Claude runs a risky shell command, like `rm`, `git reset`, or a migration, the mod opens a pane. The pane lists the files and branches the command would change. The developer presses Proceed, or Cancel. It uses `tool.call` to hold the call, and `ui.render` on `Pane`, with `Button` elements. It adds a safety check, and it doesn't remove any, so it's safe to show. _A bigger project,_ because each command needs its own dry run.

  The build prompt, which picked this idea and two others by number:

  > implement 1,2,7. give me zips for them. test them in claude code and get me screenshots of what they look like when used.

- **Transcript:** not shared. The build ran in an internal workspace.
- **Iterations:**
  - A hook has a 10-second budget for its own code, which is far too short to wait for a person. Time spent inside a `$` call doesn't count, so the hold is a loop that waits on `$.process.run(["sleep", "0.25"])` until a button's `onPress` sets the decision.
  - A pane needs room. In a narrow terminal Claude Code doesn't place it, so the mod checks `isPlaced` and draws the report in the `AbovePrompt` band instead.
  - Cancel has the focus when the pane opens, so pressing Enter refuses the command rather than running it.
  - An independent review before release found two problems in the measuring step, both fixed. A file named like a `find` action (for example `-delete`) that a glob matched could be read as an action while measuring, so relative paths now go to `find` with `./` in front. And a `cd` earlier on the command line was ignored, so the wrong folder was measured; the mod now follows `cd` and `git -C`. The same review led to smaller fixes: overlapping holds are queued, and the buttons always answer the command shown; an error while holding refuses the command; `git clean -e`, `src:dst` and `HEAD` force pushes are measured correctly; and sizes use `du -k`, which works on macOS as well as Linux.
  - Tested in Claude Code, before those fixes: `rm -rf build` was held for more than 30 seconds, Cancel kept the files and Proceed deleted them; `git reset --hard` listed the two changed files and Cancel kept them; `git clean -fdx` was held. Force pushes and migrations were checked against the command classifier only, not run. The fixes are covered by tests of the classifier, the measuring step and the hold queue, run with Node against a stand-in for Claude Code; they haven't been re-run in a live session.
  - MODZ redesign: `claude plugin test` covers the classifier, the folder scan, the card's words, Vazgeç, delete-with-strike, the band stacking and failing closed, on the terminal and desktop surfaces; `tests/preview.test.tsx` writes the trees `bin/preview` draws.

## Run it

**Requirements:**

- Claude Code 2.1.287 or later, where mods load by default. The mod was built and tested on 2.1.280, and `claude plugin validate` passes on 2.1.285.
- `bash`, `git`, `find` and `du` on your `PATH`. For migrations, the project's own tool (for example `python3 manage.py showmigrations`).
- For the side pane, a terminal about 144 columns wide or more. Narrower terminals get the band above the prompt.

No environment variables or configuration.

**Steps:**

1. Clone this repository and go to this folder's parent:

   ```bash
   git clone https://github.com/anthropics/claude-code-playground.git
   cd claude-code-playground/claude-code/mods
   ```

2. Check the plugin:

   ```bash
   claude plugin validate ./blast-radius
   ```

3. Try it for one session:

   ```bash
   claude --plugin-dir ./blast-radius
   ```

   Or install it, with the other mods here, from the local marketplace in this folder (see the [mods README](../README.md)):

   ```bash
   claude plugin marketplace add ./
   claude plugin install blast-radius@claude-code-playground-mods --scope user
   ```

   Remove it with `claude plugin uninstall blast-radius@claude-code-playground-mods --scope user`.

4. Ask Claude to run something risky in a throwaway repo, for example "delete the build folder with rm -rf build".

**Using the pane:**

- Press the destructive button's letter (`s` for sil, `z` for a force push, `u` for migrations, `c` for "Yine de çalıştır") or `v` for Vazgeç. You can also click a button, or Tab to it and press Enter. Vazgeç has the focus when the pane opens.
- `d` shows the rest of the list ("3 tane daha göster") and folds it again.
- In the band above the prompt, focus the band first (ctrl+x tab or a click); letters never answer from the prompt, so a stray keystroke can't delete anything.
- Esc or the pane's close mark refuses the command, as Vazgeç does.
- If nobody answers within 10 minutes, the command is refused.
- If you interrupt the turn, the command is refused.

## Notes / limitations

- It reads the command text. It doesn't parse shell fully: `$(...)`, aliases, `eval`, `bash -c "..."`, `xargs rm`, `find -delete`, scripts that call `rm`, and wrappers such as `timeout 5 rm`, `doas rm`, `time -p rm` or `env -i rm` aren't caught.
- Only the first risky part of a command line is measured, and the pane shows the command on one line, cut off if it's long (the full line is shown under the headline when it differs). The delete button runs the whole line as written.
- It follows `cd`, `pushd`, `popd` and `git -C` on the same line. `cd -`, and a folder that doesn't exist, can't be measured; the pane says so and still holds the command. Otherwise it starts from the session's working folder.
- In a narrow terminal the card is drawn in the band above the prompt, above the other mods' rows. While a survey holds the band the card steps aside; the command stays held.
- One command is held at a time. A second risky call, from a subagent for example, waits until the first is answered.
- It only watches the Bash tool. File edits and other tools aren't held.
- The `rm` count is approximate: a path matched twice is counted twice, and a file name with a line break or a tab is not listed. Counts come from `find`, sizes from `wc -c` (bytes; symbolic links count as files with no size). The list holds the 8 biggest folders and up to 30 files in each; the rest is counted in the `+N dosya daha` line. A very large tree can take a few seconds to measure.
- The force-push list uses your last fetch of the remote branch. Without one, it can't list the dropped commits, and it says so. When the push names no remote, it assumes `origin`.
- To list pending migrations, it runs the tool's own status command (for example `python3 manage.py showmigrations`), which loads your project's code before you answer the card. If that fails, the pane says it couldn't list them.
- A few harmless commands are held too, such as a commit whose message contains `; rm -rf`.
- It checks one command at a time. It holds a call, but it doesn't sandbox it: after you press the delete button, the command runs as written.
- This is a safety net, not a permission system. Use [permission rules](https://code.claude.com/docs/en/settings) for a hard block.

## Dependencies

| Name | Version | License (SPDX) | Source |
| --- | --- | --- | --- |
| None | | | |

The mod has no packages to install. It calls tools that are already on the machine (listed under Requirements).

## Third-party notices

Git is a trademark of Software Freedom Conservancy. Python is a registered trademark of the Python Software Foundation. npm is a trademark of npm, Inc. Django is a registered trademark of the Django Software Foundation. Rails and Ruby on Rails are trademarks of David Heinemeier Hansson. Prisma is a trademark of Prisma Data, Inc. Alembic is an open-source project of the SQLAlchemy authors. Use of these names here is descriptive and implies no endorsement.

---

Shared as-is as part of claude-code-playground. Not an official Anthropic product; no support or maintenance is implied. See the root README and LICENSE.

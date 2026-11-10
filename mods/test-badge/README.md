# test-badge

Runs your project's tests and lint in the background after Claude edits source files, and shows the result as one line, with a details pane that says where each failure is.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install test-badge@modz
```

Or in one step: `/plugin install test-badge --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here: the last run's result, and the watched PR's CI.

## What you see

```
[x 3/42 failed] [lint 2 errors] 4s ago  [ Details t ]     failing: red pill, amber lint pill
[v 42/42 passed] [lint clean] 4s ago                      passing: green pill
[* tests running]                                         running: blue pill
```

- **Status line:** the badge stays there and its "ago" refreshes every 15 seconds.
- **Notice above the prompt:** the result for 20 seconds after each run, with **Details** (`t`) when something failed, and a close mark. A live notice from session-budget takes that line first.
- **Details pane** (**Details**, or `/test-badge details`): one sentence with the whole state (`3 tests failing`, `Everything passes`, `No tests run yet`), then two parts. **On this computer:** each check with the command it runs and what happened last, a passed/failed bar, filter chips with counts (All, then only the suites that have failures: Unit tests, Full-flow tests, Code check, Type check), the failures grouped by file (each with the line, the test's name, its first error line, the suite and, for vitest, jest, go and bun, its duration; pressing one opens the file at that line), and a button (`r`) that says what it runs. **On GitHub:** see below.

The sentence is red only for failures, amber for lint errors alone or a run that did not finish. A run that hits the 120-second limit shows `timed out`. Set `MODZ_THEME=light` or `MODZ_THEME=dark` in the `env` block of `~/.claude/settings.json` to pin the theme.

## When it runs

- **Only with your yes.** Before the first automatic run in a folder it asks once, in Claude Code's own question dialog, showing the exact commands (`npm run --silent test`, `npm run --silent lint`). The answer is kept per folder and command; a changed command asks again. Dismissing the question runs nothing and it is not asked again that session. `/test-badge run` and the pane's button are your own ask and never need it.
- Only after a turn in which `Write`, `Edit` or `MultiEdit` (main agent or a subagent) changed a source file (`.ts .tsx .js .py .go .rs .php .rb .java .kt .swift .dart .c .cpp .cs .vue .svelte` and similar). Edits to Markdown, JSON or config files do not trigger it.
- Five seconds after the turn ends; quick turns in a row give one run. A turn that starts first holds it until that turn ends, so it never runs beside Claude's own work.
- One run at a time; a run requested during one waits and runs once afterwards.
- **Where:** in the nearest folder above the last edited file that has its own checks (in a monorepo, the edited package, not the root suite), never above the session's working directory. A configured `testCommand` / `lintCommand` runs in the working directory.
- Each command runs under `nice -n 10` (on Windows through `cmd /c`, with no `nice`, and `python` for `python3`) with a 120-second timeout, with `CI=1` (so vitest and jest do not start watch mode) and `FORCE_COLOR=0`. Tests run first, then lint. A tool that is not installed (exit 127, cmd's "not recognized", Python without pytest) reads as "No test command found", not as a failure.
- **A failed run, offered to your next prompt:** the prompt box shows a dim suggestion, `Fix the failing checks test-badge found` (Tab takes it). Only when you send that suggestion does Claude get the command and its failures as context with it. Nothing is sent otherwise, and there is no model call.

## CI watch

It also follows your pull request's CI on GitHub, through your own `gh` CLI:

- **When it starts:** after a Bash call ran `gh pr create` (the PR is read from its output), after a `git push`, and when the session opens on a branch with an open PR (also on `/test-badge on`). Only in a git repo, with `gh` installed and signed in; otherwise it does nothing and says nothing.
- **How it polls:** `gh pr checks <n> --json name,state,bucket,link` and `gh pr view <n> --json state,title,reviews,comments` (reviews and comments are counted, never read) once a minute, every three minutes after ten polls. It stops when every check is done, the PR is merged or closed, no check reported after five polls, or after 90 minutes. After a push it waits to see a check running before it counts a finish, so the last commit's result is not taken for the new one.
- **Tests pane:** the "On GitHub" part with the PR number and title, a sentence such as `1 of 4 checks failed. 2 new reviews or comments.`, each check with its state (running, passed, failed, skipped) and a **Details** link, and **Open pull request**. A PR with no checks says so and what it means; with no PR followed the part says that too.
- **MODZ panel:** the line reads like `GitHub 3/4 · 1 failing`, beside the test result when both fit in 40 characters.
- **When CI finishes** (only a finish it saw happen, not one already over when the watch began): one notification through your terminal's notification channel (`GitHub checks failed: lint · #12`, `GitHub checks passed · #12 · 4/4`). A red finish also leaves a card above the prompt: **Ask Claude to fix** (`f`) sends Claude the failing checks with their links, **Open pull request** opens it, **Dismiss** closes the card. Nothing is sent until you press.

A cancelled check counts as failed. `/test-badge off` stops the watch too.

## Detection (first match in the folder the run uses)

| Found | Test | Lint |
|---|---|---|
| `package.json` `scripts.test` / `scripts.lint` (npm's placeholder test is ignored) | `npm run --silent test`; `pnpm`, `yarn` or `bun run` when that lockfile exists | the same with `lint` |
| `deno.json(c)` | `deno test` | |
| `pytest.ini`, `conftest.py`, or pytest in `pyproject.toml` / `setup.cfg` / `tox.ini` | `<python> -m pytest -q` | |
| `pyproject.toml` / `setup.py` / `setup.cfg` and a `tests/` (or `test/`) folder, no pytest | `<python> -m unittest discover -s tests -t .` | |
| `go.mod` | `go test ./...` | |
| `Cargo.toml` | `cargo test -q` | |
| `pubspec.yaml` and a `test/` folder | `flutter test` or `dart test`, on the edited files' own tests (`test/a/b_test.dart` for `lib/a/b.dart`) where they exist | |
| `phpunit.xml(.dist)` | `vendor/bin/phpunit` (or `phpunit`) | |
| `build.gradle(.kts)` | `./gradlew test -q` (or `gradle`) | |
| `pom.xml` | `./mvnw -q test` (or `mvn`) | |
| `Package.swift` | `swift test` | |
| `Gemfile` and `.rspec` or `spec/` | `bundle exec rspec` | |
| `phpstan.neon(.dist)` | | `vendor/bin/phpstan analyse --no-progress --no-ansi` |

`<python>` is the project's own: `.venv/bin/python` (uv and plain venvs), `venv/bin/python`, `poetry run python` when `poetry.lock` exists, else `python3`. A venv kept elsewhere (pyenv, conda) is not found; set `testCommand` for it. An Xcode project gets no command (it needs a scheme and a simulator): the pane says "No test command found".

Counts are read from jest, vitest, pytest, unittest, cargo, mocha, node:test, bun, deno, phpunit, rspec, XCTest, Maven, flutter/dart and go output. Lint errors are read from eslint, tsc, flutter/dart analyze and phpstan. Any other tool falls back to its exit code (`tests passed` / `tests failed`, `lint clean` / `lint failed`). Failures are read from the output; no extra command is run. If no parser recognises a failing run's output, its last 6 lines are shown. At most 50 failures per check are kept.

## Commands

| Command | Effect |
|---|---|
| `/test-badge [on\|off]` | Turns it on or off; saved across sessions |
| `/test-badge run` | Runs tests and lint now |
| `/test-badge details` | Opens the details pane |

## Settings

| Option | Default | Meaning |
|---|---|---|
| `testCommand` | empty | Overrides the detected test command, run with `/bin/sh -c` in the project root. Empty means auto-detect. |
| `lintCommand` | empty | Overrides the detected lint command, run the same way. |
| `openCommand` | empty | How a failure row opens its file, for example `cursor -g {file}:{line}` (no shell). Empty means VS Code's `code -g`, then the OS opener. If none starts, `file:line` is copied to the clipboard. |

Uses no model tokens: it runs your own commands (and `gh`) and reads their output. The only prompt it sends is the one you press **Ask Claude to fix** for; the failing output reaches Claude only with a prompt you send from its suggestion. Its CI watch is the one `gh` poller for the PR: [pr-card](../pr-card) reads its answers instead of polling.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

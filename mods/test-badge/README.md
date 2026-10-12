# test-badge

Runs your project's tests and lint in the background after Claude edits source files, and shows the result as one line, with a details pane that says where each failure is.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install test-badge@modz
```

Or in one step: `/plugin install test-badge --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here: the last run's result.

## What you see

```
[x 3/42 failed] [lint 2 errors] 4s ago  [ Details t ]     failing: red pill, amber lint pill
[v 42/42 passed] [lint clean] 4s ago                      passing: green pill
[* tests running]                                         running: blue pill
```

- **Status line:** the badge stays there and its "ago" refreshes every 15 seconds.
- **Notice above the prompt:** the result for 20 seconds after each run, with **Details** (`t`) when something failed, and a close mark. A live notice from session-budget takes that line first.
- **Details pane** (**Details**, or `/test-badge details`): when it ran and how long it took; a headline such as `3 failed · 39 passed` over a passed/failed bar; filter chips with counts (All, then only the suites that have failures: Unit, E2E, Lint, Types); then the failures grouped by file, each with the line, the test's name, its first error line, the suite and, for vitest, jest, go and bun, its duration. **Open** opens the file at that line; **Run again** (`r`) runs again.

The pane's eyebrow is red only for failed tests, amber for lint errors alone or a run that did not finish. A run that hits the 120-second limit shows `timed out`. Set `MODZ_THEME=light` or `MODZ_THEME=dark` in the `env` block of `~/.claude/settings.json` to pin the theme.

## When it runs

- Only after a turn in which `Write`, `Edit` or `MultiEdit` (main agent or a subagent) changed a source file (`.ts .tsx .js .py .go .rs .php .rb .java .kt .swift .dart .c .cpp .cs .vue .svelte` and similar). Edits to Markdown, JSON or config files do not trigger it.
- Five seconds after the turn ends; quick turns in a row give one run.
- One run at a time; a run requested during one waits and runs once afterwards.
- Each command runs under `nice -n 10` with a 120-second timeout, in the session's working directory, with `CI=1` (so vitest and jest do not start watch mode) and `FORCE_COLOR=0`. Tests run first, then lint.

## Detection (first match in the project root)

| Found | Test | Lint |
|---|---|---|
| `package.json` `scripts.test` / `scripts.lint` (npm's placeholder test is ignored) | `npm run --silent test`; `pnpm`, `yarn` or `bun run` when that lockfile exists | the same with `lint` |
| `pytest.ini`, `conftest.py`, or pytest in `pyproject.toml` / `setup.cfg` / `tox.ini` | `python3 -m pytest -q` | |
| `go.mod` | `go test ./...` | |
| `Cargo.toml` | `cargo test -q` | |
| `phpunit.xml(.dist)` | `vendor/bin/phpunit` (or `phpunit`) | |
| `pubspec.yaml` and a `test/` folder | `flutter test` or `dart test` | |
| `phpstan.neon(.dist)` | | `vendor/bin/phpstan analyse --no-progress --no-ansi` |

Counts are read from jest, vitest, pytest, cargo, mocha, node:test, bun, phpunit, flutter/dart and go output. Lint errors are read from eslint, tsc, flutter/dart analyze and phpstan. Any other tool falls back to its exit code (`tests passed` / `tests failed`, `lint clean` / `lint failed`). Failures are read from the output; no extra command is run. If no parser recognises a failing run's output, its last 6 lines are shown. At most 50 failures per check are kept.

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

Uses no model tokens: it runs your own commands and reads their output.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

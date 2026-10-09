# test-badge

After a turn that edited source files, runs the project's tests and lint in the background and shows the result as one line above the prompt, with a details pane that says where each failure is:

```
[✕ 3/42] [lint 2] 4 sn önce  [ Ayrıntı t ] ✕      failing: Flare pill, Amber lint pill, time in a dim color
[✓ test 42/42] [lint temiz] 4 sn önce          ✕      passing: Moss pill
[● test çalışıyor]                                    running: Iris pill with a breathing dot
```

**Ayrıntı** (`t`) opens the details pane: eyebrow `TEST SONUÇLARI`, a headline such as `3 başarısız · 39 geçti` over a passed/failed bar, filter chips with counts (Hepsi / Birim / E2E / Lint / Tip), then the failures grouped by file: a file-type badge and path, and per failure a `dosya:satır` highlight, the test's name, its first error line, the suite and (for vitest, jest, go and bun) its duration. **Aç** opens the file at the line; **Yeniden çalıştır** (`r`) runs again. `MODZ_THEME=light|dark` pins the theme.

Zero tokens: it runs your own commands and reads their output.

## When it runs

- Only after a turn in which `Write`, `Edit` or `MultiEdit` (from the main agent or a subagent) changed a **source** file (`.ts .tsx .js .py .go .rs .php .rb .java .kt .swift .dart .c .cpp .cs .vue .svelte …`). Edits to Markdown, JSON or config files don't trigger it.
- 5s after the turn ends (debounced: quick turns in a row give one run).
- One run at a time. A run requested while one is in progress waits and runs once after it.
- Each command runs under `nice -n 10` with a 120s timeout, in the session's working directory, with `CI=1` (so vitest and jest don't start watch mode) and `FORCE_COLOR=0`. Tests run first, then lint.

## Detection (first match)

| Found in the project root | Test | Lint |
| --- | --- | --- |
| `package.json` `scripts.test` / `scripts.lint` (npm's placeholder test is ignored) | `npm run --silent test`; `pnpm`/`yarn`/`bun run` when that lockfile is present | `… lint` |
| `pytest.ini`, `conftest.py`, or `pytest` mentioned in `pyproject.toml` / `setup.cfg` / `tox.ini` | `python3 -m pytest -q` | |
| `go.mod` | `go test ./...` (counts packages) | |
| `Cargo.toml` | `cargo test -q` | |
| `phpunit.xml(.dist)` | `vendor/bin/phpunit` (or `phpunit`) | |
| `pubspec.yaml` and a `test/` folder | `flutter test` (Flutter SDK in pubspec) or `dart test` | |
| `phpstan.neon(.dist)` | | `vendor/bin/phpstan analyse --no-progress --no-ansi` |

Counts are read from jest, vitest, pytest, cargo, mocha, node:test, bun, phpunit, flutter/dart and go output. Lint errors are read from eslint, tsc, flutter/dart analyze and phpstan. Any other tool falls back to its exit code: `testler geçti` / `testler kaldı`, `lint temiz` / `lint kaldı`. A run that hits the 120s limit shows `zaman aşımı`.

## Where failures are

Failing tests and lint errors are read from the output (no extra command is run) and grouped by suite, then file:

| Suite | From |
| --- | --- |
| birim testler | jest, vitest, pytest, go test, flutter/dart test, bun test, cargo test |
| e2e testler | the same, when the file sits under `e2e/`, `integration_test/`, `cypress/`, `playwright/` or is named `*.e2e.*` |
| lint | eslint (errors only), flutter/dart analyze (errors only) |
| tip denetimi | tsc / vue-tsc, go and dart compile errors |

Each row shows `› line  test name` and, dimmed, the error's first line (or the lint rule). Pressing a row opens the file at that line: the `openCommand` config (e.g. `cursor -g {file}:{line}`, run without a shell), else `code -g`, else the OS opener; if none starts, `file:line` is copied to the clipboard. A failing run whose output no parser recognises shows its last 6 lines instead. At most 50 failures per check are kept.

## Where it shows

- **Status line:** the badge stays there and its "ago" refreshes every 15s.
- **Shared notice line** above the prompt: the result for 20s after each run (`✓` success / `✕` error), with **Ayrıntı** when something failed, and ✕. It uses the shared MODZ notice look (`hooks/notice.tsx`), sits above the other band lines, and ranks 1 on the shared line: any live cache-tax, you-should-know, reflect or session-budget notice takes the line first. The notice stores its expiry, so one whose timer a hot reload dropped stops showing on time.
- **Pane** (`Ayrıntı` or `/test-badge details`): header with when it ran and how long it took, failures by suite and file, and **Yeniden çalıştır**.

## Commands and config

| | |
| --- | --- |
| `/test-badge [on\|off]` | Toggle; saved across sessions |
| `/test-badge run` | Run now |
| `/test-badge details` | Open the details pane |
| `testCommand` / `lintCommand` (plugin config) | Override detection; run with `/bin/sh -c` in the project root |
| `openCommand` (plugin config) | How a failure row opens its file; `{file}` and `{line}` are filled in |

## Files

- `hooks/detect.ts`: command detection and the source-file check
- `hooks/parse.ts`: counts and badge text
- `hooks/failures.ts`, `hooks/lint.ts`, `hooks/text.ts`: where each failure is, per runner
- `hooks/open.ts`: which command opens a failure
- `hooks/view.tsx`: band line and details pane
- `hooks/register.tsx`: hooks, scheduling, status line
- `tests/*.test.ts`: `claude plugin test .` (UI tests run on terminal and desktop)

# secret-guard

Stops secrets before they land on disk or in git. Runs before every Write / Edit / MultiEdit / NotebookEdit and before Bash `git add` / `git commit`, in every permission mode. Zero tokens: plain pattern matching.

## What it catches
- `sk-…` keys (Anthropic `sk-ant-…`, OpenAI-style `sk-…`), Stripe `sk_live_`/`rk_live_`, AWS `AKIA…`/`ASIA…` ids and `aws_secret_access_key = …`, GitHub `ghp_/gho_/ghu_/ghs_/ghr_` and `github_pat_`, `-----BEGIN … PRIVATE KEY-----`.
- Supabase `service_role` JWTs (the JWT payload is decoded locally; `anon` keys pass).
- Any `*KEY / *SECRET / *TOKEN / *PASSWORD` assignment whose value looks random (≥ 12 chars, Shannon entropy ≥ 3.5, a digit or ≥ 24 chars). Placeholders (`your-…`, `xxx`, `example`, `${…}`, `process.env…`, member access like `config.secretKey`) are ignored.
- `git add` of `.env`, `.env.local`, `.env.production` … (templates like `.env.example` are fine), named directly or picked up by `git add .` (`git add -n` dry run). `git commit` scans the staged diff's added lines (plus the unstaged diff for `-a`) and staged `.env*` names. Files staged by `git add` are scanned (≤ 1 MB each, ≤ 300 files).
- Setting keys with a dot (`'done-ping.thresholdSeconds'`) and fake key-like values in test files (`*.test.ts`, `*.spec.js`, `tests/`, `fixtures/`, `__mocks__/`) are not flagged.
- Writing to a `.env*` file itself is never flagged: that is where secrets belong.

## The card
A blocking dialog (Claude Code's own question) with a card above it, in the MODZ "Tidemark" family: single border, Flare for a leak, Amber for an env file.

**Desktop** draws one vector card (the dialog allows 12 rows around it, and an `Svg` counts by its `alt`, so the card stays within 10): a key tile, the eyebrow `SIZINTI ENGELLENDİ`, the headline (`Bu yazımda 2 gizli anahtar var`, `Bu commit'te …`, `Bu eklemede …`; `.env.local git'e ekleniyor` when only an env file is staged) with the file or git command on the right, then one row per finding: a detector chip (`Anthropic`, `Stripe`, `GitHub`, `Supabase`, `AWS`, `Özel anahtar`, or the variable name), `path:satır`, and the masked value as a highlight span. Up to 5 rows, then `+N bulgu daha`.

**Terminal** keeps the text card:

```
! Gizli anahtar: src/lib/supabase.ts
  2 bulgu
  Supabase service_role key  eyJh****  satır 4
  Anthropic API key          sk-a****  satır 9
```

The full secret is never shown, logged, or put in a denial message. The dialog asks `Nasıl devam edilsin?`, the safe fix first, each answer with a line under it saying what it does:

- **Anahtarları .env'e taşı** (`Anahtarı …` for one; "Önerilen"): appends `NAME=value` to the project's `.env` (reusing an entry that already holds the same value, suffixing a taken name), adds `.env` to `.gitignore` in a git repo, and rewrites the write so the code reads the environment: `process.env.NAME` (JS/TS), `os.environ["NAME"]` (Python), `Platform.environment['NAME']` (Dart), `os.Getenv("NAME")` (Go), `ENV["NAME"]` (Ruby), `getenv('NAME')` (PHP), `${NAME}` elsewhere. Claude is told what moved. For git commands and private keys it denies with an instruction for Claude to move the secrets itself.
- **Bir kez izin ver**: runs this one call unchanged.
- **Vazgeç** (or dismissing the dialog, or typing under Other): denies the call with a clear reason.
- `.env` staging with no other finding offers Vazgeç / Bir kez izin ver.

The card follows the theme: Claude Code's `theme` setting (or `MODZ_THEME`), then the terminal, then the system appearance; the vector parts follow `prefers-color-scheme`.

## Commands
`/secret-guard` toggles on/off (remembered).

## Limits (honest)
- Fail-open by design (pack rule: a mod error must never block a turn): if the scan itself crashes, the call goes through and a debug line is logged.
- Only the text a call adds is scanned (Edit's `new_string`, not `old_string`).
- Shell commands other than `git add`/`git commit` (e.g. `echo KEY=… > config.js`) are not scanned.
- `git add` is dry-run from the session's working directory (or `git -C dir`); a `cd` earlier in the same command is not followed.

## Dev
`tsc -p .`, `claude plugin validate .`, `claude plugin test .` (23 tests, previews in `tests/preview.test.tsx` for `bin/preview`; fake keys in tests are assembled from pieces).

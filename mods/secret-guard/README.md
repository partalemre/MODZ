# secret-guard

Stops API keys and tokens before they land in a file or in git, and offers to move them into `.env`.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install secret-guard@modz
```

Or in one step: `/plugin install secret-guard --marketplace partalemre/MODZ`.

## What it checks

It runs before every `Write`, `Edit`, `MultiEdit` and `NotebookEdit`, and before Bash `git add` and `git commit`, in every permission mode.

- `sk-...` keys (Anthropic `sk-ant-...`, OpenAI-style), Stripe `sk_live_` and `rk_live_`, AWS `AKIA...` and `ASIA...` ids and `aws_secret_access_key = ...`, GitHub `ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_` and `github_pat_`, and `-----BEGIN ... PRIVATE KEY-----`.
- Supabase `service_role` JWTs. The payload is decoded locally; `anon` keys pass.
- Any `*KEY`, `*SECRET`, `*TOKEN` or `*PASSWORD` assignment whose value looks random (at least 12 characters, Shannon entropy of 3.5 or more, and a digit or 24 or more characters). Placeholders (`your-...`, `xxx`, `example`, `${...}`, `process.env...`, member access such as `config.secretKey`) are ignored.
- `git add` of `.env`, `.env.local`, `.env.production` and the like, named directly or picked up by `git add .`. Templates such as `.env.example` are fine. `git commit` scans the added lines of the staged diff (plus the unstaged diff for `-a`) and any staged `.env*` names. Files staged by `git add` are scanned, up to 1 MB each and 300 files.

When nobody can answer the question (a subagent's call, or a `-p` run with nothing drawing), the call is denied with the reason and nothing is moved.

Not flagged: writing to a `.env*` file itself (that is where secrets belong), setting keys with a dot such as `done-ping.thresholdSeconds`, and fake key-like values in test files (`*.test.ts`, `*.spec.js`, `tests/`, `fixtures/`, `__mocks__/`): generic assignments, and key shapes whose value says it is fake (`test`, `fake`, `dummy`, `mock`, `sample`, `example`, `fixture`).

## What you see

A blocking question with a card above it: red for a leak, amber for an env file. The card names the file or git command, says what it found (`This write has 2 secret keys`, `This commit has ...`, `.env.local is being added to git`), then lists up to 5 findings, each with a detector chip (Anthropic, Stripe, GitHub, Supabase, AWS, Private key, or the variable name), the line, and the value masked (`eyJh****`). The full secret is never shown, logged, or put in a denial message.

```
LEAK BLOCKED · src/lib/supabase.ts
This write has 2 secret keys
  Supabase service_role key  eyJh****  line 4
  Anthropic API key          sk-a****  line 9
```

The question is "How do you want to go on?", the safe fix first, each answer with a line saying what it does:

- **Move keys to .env** (recommended) appends `NAME=value` to the `.env` at the root of the git repository that holds the file (a worktree's own root, never the session's folder when they differ; outside any repository, the session's folder), reusing an entry that holds the same value and renaming a taken name, adds `.env` to that repository's `.gitignore`, and rewrites the write so the code reads the environment: `process.env.NAME` (JS/TS), `os.environ["NAME"]` (Python), `Platform.environment['NAME']` (Dart), `os.Getenv("NAME")` (Go), `ENV["NAME"]` (Ruby), `getenv('NAME')` (PHP), `${NAME}` elsewhere. Claude is told what moved. For git commands, private keys and test files the call is denied with an instruction for Claude to move the secrets itself.
- **Allow once** runs this one call unchanged.
- **Cancel**, dismissing the question, or typing under Other denies the call with a clear reason.

The desktop app draws the card as a picture; the terminal draws the same words as text. The card follows Claude Code's `theme` setting, or `MODZ_THEME=light|dark` in the `env` block of `~/.claude/settings.json`.

## Secrets you paste into a prompt

A key, token or private key you paste into a prompt never reaches the model. The prompt goes out with `⟦secret:1⟧` in its place (the same value always gets the same number), and the system prompt gets one short note telling Claude that each placeholder is a real secret it uses verbatim and never asks for.

- **Bash**: right before a command runs, each placeholder is replaced with the real value. Any echo of a value in a tool's output is turned back into its placeholder before Claude reads it.
- **Files**: a placeholder is never replaced inside a file. A write that holds one shows the card (the placeholder itself, not the value's first characters); **Move keys to .env** writes the real value to `.env` and the file reads it from the environment. **Allow once**, or a write to a `.env` file, keeps the placeholder as written, and Claude is told so.
- A quiet line under the prompt says `1 secret kept out of the chat`; no toast.
- The values live only in the mod's memory for this session: never in `$.store`, `$.state`, a file or a log. `/clear` forgets them; so does a reload of the mod, after which a command that still names a placeholder is stopped with the reason.

## Recording mode

`/rec` turns recording mode on or off for this session (off by default). While it is on, the line under the prompt says `REC`, and the transcript's prompts, replies, tool calls and tool results draw with keys, `NAME=value` env values and e-mail addresses masked (`●●●●Jk`: at most the last two characters). It only changes what is drawn: the transcript and what Claude reads stay as they were. It builds on whatever the rows below it drew, so it works with skins.

## Commands

- `/secret-guard` turns the scan on or off (remembered). Off, pasted secrets also stay in the prompt as typed.
- `/rec` turns recording mode on or off (this session only).

## Settings

There are no plugin options.

## Limits

- It fails open: if the scan itself crashes, the call goes through and a debug line is logged, because a mod error must never block a turn.
- Only the text a call adds is scanned (`Edit`'s new string, not the old one).
- Shell commands other than `git add` and `git commit` (for example `echo KEY=... > config.js`) are not scanned.
- A placeholder is replaced in Bash commands only, as raw text: Claude quotes it as it would the value (a `$` inside double quotes would still expand). Other tools get the placeholder.
- The screen still draws a tool's own output record as it came (for example a command that prints the real value); recording mode masks it, and Claude only reads the placeholder.
- Recording mode masks what it can see in one string: a key split across differently colored pieces of a row may stay visible.
- `git add` is dry-run from the session's working directory or `git -C dir`; a `cd` earlier in the same command is not followed.

Uses no model tokens: it is plain pattern matching. While the session holds a placeholder, the system prompt carries a three-sentence note (~100 input tokens, counted from its words).

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish.

# effort-router

Shows the effort and model each turn was actually sent with. Optionally, sends a prompt that needs little thought at low effort.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install effort-router@modz
```

Or in one step: `/plugin install effort-router --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) gives it a row, "Effort", in the meter section: the latest turn's effort and a count over the last five turns, such as `high · last 5: 3 high, 2 low`.

## What you see

The Effort pane opens only when you ask for it: from its MODZ row or with `/effort-router`. It lists the last 8 turns, newest first. Each row shows how long ago the turn started, the first line of your prompt (cut to 40 characters, with keys and `NAME=value` pairs masked), the class the router gave it (in route mode), the effort the request went out with, and the model. When the router lowered the effort, the row says what it was lowered from ("low from high"). The head shows the latest turn and what the current mode does. Under it is the mode picker.

Only the main conversation's turns are listed. Subagent requests are never changed or counted.

On the desktop app the head is drawn as a picture; in the terminal it is text. A wide pane shows each turn on one line in columns, a narrow one on two lines.

## Modes

| Mode | What it does | Token cost |
|---|---|---|
| `show` (default) | Records the effort and model of every main-loop request. Nothing is changed. | None |
| `auto` | Also classifies each prompt as `light`, `normal` or `deep`. A `light` turn goes at `low` effort. `normal` and `deep` keep your own setting. The effort is never raised above what you set: `deep` is only shown, and a session already at `low`, on a numeric thinking budget, or on a model without effort is left alone. | At most 1 haiku call per prompt, on your own account (effort low, a 32-token reply, the prompt cut to 2,000 characters) |
| `off` | Does nothing. | None |

In `auto`, these prompts are not classified and keep the previous turn's routing: slash commands, short follow-ups ("yes", "go on", "continue", "ok", "evet", "devam et", "tamam" and the rest of the list in `hooks/route.ts`), prompts that are not yours (task notifications, peers, plugins), and prompts delivered into a turn that is already running. If the classification fails or times out (8 seconds), the effort stays as you set it. A prompt waits for its one classification before it starts, usually about a second.

Pick a mode in the pane. Your pick is kept across sessions and overrides the plugin option `mode` (`show`, `auto` or `off`), which only sets the starting default.

## Settings

| Setting | Effect |
|---|---|
| plugin option `mode` | The starting mode when you have not picked one in the pane |
| `MODZ_LANG=tr` | Turkish interface |
| `MODZ_THEME=light` / `dark` | Pins the pane's theme |
| `MODZ_JUDGE=jev` and `TYPESAFE_API_KEY` | Opt-in: route mode classifies with TypeSafe Jev instead of haiku. The masked prompt then goes to `api.typesafe.ai`. If Jev cannot be used, haiku answers. |

Set them in the `env` block of `~/.claude/settings.json`.

## How it works

At `prompt.submit` (route mode only) the shared MODZ judge (`kit/judge.ts`) picks one of the three classes. Each `turn.start` adds a row. Each main-loop `turn.step` records the effort and model the engine is about to send. In route mode a `light` turn's step is passed on as `next({ ...e, effort: 'low' })`, which the engine allows for `model` and `effort`. Steps that carry an `agentId` pass through untouched.

## Access

Reads: your prompts (the classifier sees only a masked first 2,000 characters). Writes: its own `$.state` and one `$.store` value (`mode`). Network: none, unless you opt in to Jev. Tokens: none in `show`; at most one haiku call per prompt in `auto`.

## Inspiration

[HeyCubit/effortless](https://github.com/HeyCubit/effortless), which routes effort per prompt with a Haiku judge. The Hacker News thread "Anthropic appears to be A/B testing reduced effort levels", where people asked to see the effort a turn really ran at. This mod is an original implementation; no code was taken.

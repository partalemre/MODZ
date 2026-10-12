# savvy-flow

Runs a task as an orchestrated delivery: your session's model plans, owns the design and reviews, and five tiered worker subagents do the implementing.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install savvy-flow@modz
```

Or in one step: `/plugin install savvy-flow --marketplace partalemre/MODZ`.

This is a skill and a set of agents, not a pane or a band, so it adds no line to the MODZ panel. Pair it with [savvy-progress](../savvy-progress) to watch it work.

## What you see

Run `/savvy-flow <task>` (`/savvy-flow:savvy-flow` when it is installed as a plugin). The session model then:

1. Reads the code and breaks the task into briefed, dependency-ordered tasks, each with a tier, and shows you the plan. If the request could lead to materially different work, it asks before delegating.
2. Handles any design decision itself. Workers never invent UI, except `savvy-fable` when you explicitly ask for a design feature.
3. Delegates each task to the cheapest worker that will get it right the first time.
4. Reviews every result adversarially before accepting it, then closes the flow.

In an empty directory it treats the job as a new project: it runs `git init`, writes `docs/SPEC.md`, `docs/PLAN.md`, a short `CLAUDE.md` and a `filemap.md`, and waits for your approval before delegating anything. It never pushes unless asked.

| Agent | Model / effort | For |
|---|---|---|
| `savvy-fable` | Fable / high | The hardest logic and bugs; design features on request |
| `savvy-heavy` | Opus / xhigh | Unfamiliar code, unclear root cause |
| `savvy-careful` | Opus / high | Delicate but well-understood changes |
| `savvy-medium` | Opus / medium | Standard feature work |
| `savvy-light` | Opus / low | Mechanical edits, builds, tests |

`savvy-fable` runs on the Fable model. Without access to it, change `model:` in `agents/savvy-fable.md` (say, to `opus`).

## With savvy-progress

The skill and the agents work fine alone. With savvy-progress installed, the orchestrator reports the plan and accepted tasks to a progress band above the prompt, and each worker reports its steps to the Agents pane. Each planned task's title is reused verbatim as the Agent call's description, which is how the pane ties a run to its task. Without the mod those calls are skipped.

## Commands

- `/savvy-flow <task>` starts the flow.

## Settings

There are no plugin options.

## Cost

This runs real subagents on real models, at the tiers above, so a flow costs far more than a single reply. The orchestrator is meant to run on a strong model at high effort. The plugin adds no hooks of its own and sends no other requests.

## Language

The skill and agent instructions are in English; `MODZ_LANG` does not change them. The savvy-progress pane follows `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json`.

## Credits

Adapted from [johnnyvizz/claude-kit](https://github.com/johnnyvizz/claude-kit) (`plugins/savvy-flow`), licensed MIT. The license file is in this folder.

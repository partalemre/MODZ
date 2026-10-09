# savvy-flow

An orchestrated delivery flow for Claude Code. Run `/savvy-flow <task>` (`/savvy-flow:savvy-flow` when installed as a plugin): the session model plans, owns design, delegates implementation to tiered worker subagents and adversarially reviews what they return.

## What ships

- **Skill** `savvy-flow`: the orchestrator's playbook.
- **Agents** by tier, cheapest that gets the task right first time:

  | Agent | Model / effort | For |
  | --- | --- | --- |
  | `savvy-fable` | Fable / high | the hardest logic and bugs; design features on request |
  | `savvy-heavy` | Opus / xhigh | unfamiliar code, unclear root cause |
  | `savvy-careful` | Opus / high | delicate but well-understood changes |
  | `savvy-medium` | Opus / medium | standard feature work |
  | `savvy-light` | Opus / low | mechanical edits, builds, tests |

  `savvy-fable` runs on the Fable model; without access to it, change `model:` in `agents/savvy-fable.md` (say, to `opus`).

## With savvy-progress

The skill and the agents run fine alone. With the [savvy-progress](../savvy-progress) mod installed, the orchestrator reports the plan and accepted tasks to a progress bar above the prompt (`mcp__savvy-progress__progress`), and each worker reports its own steps to the agents panel (`mcp__savvy-progress__step`, loaded through ToolSearch when it is deferred). Each planned task's `title` is reused verbatim as the Agent call's `description`, which is how the panel ties a run to its task. Without the mod those calls are skipped.

Install instructions are in the [repository README](../../README.md).

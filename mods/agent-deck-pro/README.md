# agent-deck-pro

`/deck` opens a pane of every subagent in the session. It is built for watching many agents run in parallel, and it spends zero tokens: it makes no model call, injects nothing into prompts, and reads only what the engine already routes through the plugin.

## What you see
- **Overview line:** `Ajanlar  1: Genel  2: Gönder` with a dim summary such as `8 ajan · 6 çalışıyor · 2 bitti · en uzun 7 dk · ≈$0,29`.
- **Attention line:** shown only when an agent needs a look. Priority order is an agent that went quiet, then a broken test, then a failure from the last 10 minutes. **Bak** opens that agent.
- **Running agents first**, two lines each:
  - Line 1: the status glyph (`◐◓◑◒` spinner, `!` quiet, `○` waiting), a small face, the agent's **task description** as its name (the subagent type appears only as a dim tag, and only when there is room), its step or phase, and the elapsed time.
  - Line 2: `› <list item in progress> · <last tool + short arg>`, a quiet flag (`sessiz 3 dk`, `Bash 16 dk sürüyor`, `son test kırık`), and `N araç · N dosya · N tok`.
- **Bitenler:** one line per finished agent with its total duration, tools, files and tokens. The list folds after 3 behind `+N daha`.
- **Footer:** total tokens and the most expensive agent with its share, e.g. `en pahalı X ≈$0,11 (%38)`.
- **Desktop:** a control deck drawn in Svg (Tidemark tokens, light and dark): an eyebrow and headline, four stat tiles (Çalışıyor · Bekliyor · token · ≈$), an Amber card for the one agent that needs you with **Bak**, and a swimlane with one lane per agent whose segments are tool calls colored by kind (okuma Tide, düzenleme Kiln, komut Iris), a "şimdi" hairline and an Amber notch on a lane that needs you. Rows carry a status dot, tier bars (haiku/sonnet/opus), the current tool chip and target, phase dots or an `adım 3/7` pill, elapsed time and tokens. A picked row opens a drawer: the last five calls with how they came back, a message field, **Yeni görev** (primary), **Döküm** and **Durdur**. Motion respects `prefers-reduced-motion`. savvy-progress draws the cute progress view; the deck is for steering.

## Step, never a fake percent
1. If the agent keeps its own task list (TodoWrite, or TaskCreate/TaskUpdate), the row shows `adım 3/7`, and line 2 shows the item in progress.
2. Otherwise the row shows a coarse phase inferred from the agent's tools: `●○○○ keşif` (Read/Grep/Glob/Web), `●●○○ düzenleme` (Edit/Write), `●●●○ test` (a Bash test, validate, lint or tsc run), and `●●●● rapor` (a step with no tool call, i.e. the final answer). No percent is ever drawn.

## Smart, for free
- **Quiet:** a running agent with no tool open and nothing heard for 2 minutes. A single tool call that stays open for 15 minutes or more is flagged too.
- **Broken test:** the agent's latest test-like Bash run errored or reported `N fail`. The next passing run clears the flag.
- **Identity:** a face such as `(•ᴗ•)` and a theme color, both picked from the agent's description, so 8 `general-purpose` agents still look different. The expression follows state: `(•_•)` quiet, `(-ᴗ-)` waiting, `(ᵔᴗᵔ)` done, `(×_×)` failed.
- **Card (click a row):** model, ≈cost, the files it edited, and its answer once it is done. Actions sit behind buttons: **Döküm** (transcript), **Mesaj**, **Durdur** and **Yeni görev**.
- **Gönder tab:** an agent-type picker with a task input, plus the team list with **Görev ver**.

## Cost
`≈$` is each subagent step's usage multiplied by a price table in USD per million tokens: opus/fable 5/25, sonnet 3/15, haiku 1/5. Cache reads count at 10% of input and cache writes at 125%. You can override the table with the `prices` option, e.g. `opus=5:25,sonnet=3:15`. A model with no known price shows tokens only.

## Limits (honest)
- Only subagents are listed (the main loop is not an agent).
- If an agent was already finished the first time the deck saw it, it shows no duration, because none was observed.
- Phase comes from tool names, so treat it as coarse.
- **Durdur** goes through the engine's `TaskStop` tool and the normal permission chain.
- Refresh happens through a single 1 s beat that runs only while the pane is open. Nothing runs while it is closed.

## Dev
`claude plugin validate .` and `claude plugin test .` (29 tests: 9 run on both terminal and desktop; `tests/preview.test.tsx` draws the desktop states for `bin/preview`).

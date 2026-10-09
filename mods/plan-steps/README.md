# plan-steps

When the session has a plan, this mod shows its steps and where the work is. It uses no tokens and adds nothing to the context.

```
Plan · 3/9 adım · ~%39               görev listesi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  kalan ~24dk

✓ Tipleri ve durum sözleşmesini yaz            3dk
✓ Görev listesi takibi (TodoWrite, TaskCreate) 5dk
✓ Markdown plan ayrıştırıcısı                  4dk
◐ Adım–görev bulanık eşleştirme                6dk
  › 3 dosya: match.test.ts, parse.ts +1
  ● Eşleştirme kenar durumları
○ Panel çizimi: başlık, çubuk, adım listesi
○ Durum satırı
○ ETA kuralı
○ Testler: terminal ve masaüstü
○ README
```

Status line: `plan 3/9 · Adım–görev bulanık eşleştirme`

On the desktop Code tab the pane is one Tidemark drawing: eyebrow `PLAN` with the plan's source on the right, the headline `3 / 9 adım · ~%39`, an Orchid meter (the ETA beside it only once 3 finished steps were timed), then the steps as numbered circles on a hairline rail: Moss ✓ for done steps with their duration, the current step as a filled Orchid circle with a breathing ring on a tinted row (elapsed time, files, and each running subagent with an Iris dot), and rings for upcoming steps. It follows Claude Code's theme (light, dark, or the system for `auto`). The step circle is the same drawing replay-theater uses (`hooks/ui/steps.ts`). The terminal keeps the text view above.

## Where the plan comes from
The mod watches tool calls. It reads no model output and makes no model calls.
- **Task list:** `TodoWrite`, or `TaskCreate`/`TaskUpdate`, with each item's `pending`/`in_progress`/`completed` status. `TodoWrite` from a subagent is ignored because it is that agent's own list.
- **Approved plan:** the `plan` text that `ExitPlanMode` returns once you approve it.
- **Plan file:** a markdown file the assistant reads or writes. `docs/**/plans/*.md`, `PLAN.md` and `*.plan.md` always count. Any other `.md` counts only if it has `### Task N:` or `## Step N` headings (also `Adım`/`Görev`), or at least 3 checkboxes, and it never replaces a named plan file or an approved plan. Steps come from those headings with their `- [ ]` items, or else from top-level checkboxes (nested ones are the items), or else from the longest list numbered from 1. Fenced code is skipped. When the file is edited, it is parsed again, so ticked boxes show up.

If both a plan document and a task list exist, the document's steps lead and the tasks give their status. A task is matched to a step by its number (`Task 3: …`) or by shared words. A step takes whichever of the two states is further along. If the tasks match fewer than half of the steps, the task list is shown instead, since that is the live work.

## What a step shows
- `✓` done: dim, with how long it took.
- `◐` current: bold, with its elapsed time. Below it: checked items (`2/5 madde`), the files edited while it was in progress (by the main loop or any subagent), how many agents finished, and one `●` row for each agent still running (the description from the `Agent` call). A background agent counts as running until its own loop's turn ends.
- `○` upcoming, with its item count if it has items.

Times come only from status changes seen in this session. A step that was already done when it first appeared has no duration.

The header shows done/total, then progress: done steps count fully and a step in progress adds its checked-item share, or ½ if it has no items. When that partial credit is included, the percentage is marked `~`. The ETA (`kalan ~12dk`) is the average time of the finished steps multiplied by the steps left. It appears only once 3 finished steps have measured times.

Long plans scroll to keep the current step in view, with a little of the done work above it. Hidden rows are summarised as `✓ N adım daha` above and `+N adım daha` below. Long titles are cut with `…`.

## Commands
- `/steps` opens the pane. The mod never opens it by itself. (`/plan` is a built-in Claude Code command, so this mod cannot take that name.)

The status line entry `plan 3/9 · <current step>` shows only while the plan is under way. When every step is done it reads `plan 9/9 · tamam`, and it clears at your next prompt. `/clear` empties everything.

A plan that is not the work under way stays out of the status line, so it never reads a bare `plan 0/5`:
- **Not started** (every step pending, e.g. a plan file that was only read, or a plan just approved): the pane's eyebrow says `başlamadı`, the MODZ card `5 adım · başlamadı` (idle).
- **Gone quiet** (no step change, plan edit, file edit or agent on the current step for 30 minutes): the pane's eyebrow says `bekliyor · 45dk önce` in place of the ETA, the current step stops breathing, the MODZ card reads `3/9 adım · bekliyor` (idle). The next piece of work on the plan brings the line back.

## Performance
- Nothing runs on a timer except a 30-second tick while the pane is open, so elapsed times move, and one 30-minute timer, restarted whenever the plan moves, that takes a quiet plan off the status line.
- The only file reads are re-reads of markdown files the assistant has just read or written.

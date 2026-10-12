# replay-theater

Records the file edits Claude makes in a turn, then lets you step through them one by one as colored diffs. It never blocks, changes or delays an edit.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install replay-theater@modz
```

Or in one step: `/plugin install replay-theater --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here.

## What you see

**An offer card** above the prompt, when a turn that edited files ends: the edit and file counts (`4 edits · 4 files`), the file names, the first sentence of Claude's reply, and **Watch the edits** (`r`) or **Not now**. It sits above the other rows, stays out of the way while a survey is open or a turn is running, and disappears on the next turn.

**The pane**, from the card or `/replay`:

- A header with the age of the turn, `4 edits in 4 files`, the lines added and removed, and the request that started the turn.
- **Edits in order**: numbered circles for each step (the current one filled, finished ones checked, upcoming ones as rings), each with its file, folder and `+N -N`.
- Below, the current step: `Edit 2 / 4`, the file name, the tool (`Edit`), one line saying what the change does, which plan step it served (`Plan step 3/9 · <task>`), and a diff with changed lines and changed words highlighted, plus a legend (Removed, Added, Changed word, Unchanged).
- **Previous** (`p`), **Next** (`n`; **Finish** on the last step) and **Close** (`c`, or Esc).

In the terminal the same information is text, with the diff in Claude Code's own diff colours. If the terminal is too narrow for a pane, the replay is drawn in the band above the prompt. The pane follows Claude Code's `theme` setting.

**What each step does.** The one-line description comes from, in order: the edit call's own `description`; the sentence Claude wrote just before the edit, read from the transcript (main loop and subagents); and, if neither exists, one small model call (see Cost). If none is available the line is left out.

**Plan step.** `TodoWrite`, `TaskCreate`, `TaskUpdate` and `TaskList` are watched; each edit records the item that was `in_progress` when it ran. With no task list there is no plan line.

## Commands

- `/replay` opens the pane for the last turn's edits.

## Settings

There are no plugin options.

## Cost

Usually no model tokens. Only when some steps have neither a description nor a sentence in the transcript, opening the pane for the first time makes one `haiku` request (low effort, 20-second limit) for those steps. The result is cached for that turn, so reopening makes no call.

## Limits

- For `Edit`, the diff is `old_string` to `new_string`; for `Write`, the file's text on disk before the write is read first. Each step shows one line of context around the change and at most 12 lines (`... N more lines`).
- A rejected or failed edit is not recorded.
- State lives in the session and is lost when it ends.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish. The model-written step lines come back in English.

## Credits

Adapted from [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground) (`claude-code/mods/replay-theater`), licensed Apache-2.0. The license file is in this folder.

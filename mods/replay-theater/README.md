# replay-theater

Records the file edits Claude makes in a turn, then lets you step through them one by one as colored diffs. From the same pane you can go back through any earlier turn of this session and through this project's finished sessions, read from the transcripts Claude Code already keeps. It never blocks, changes or delays an edit.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install replay-theater@modz
```

Or in one step: `/plugin install replay-theater --marketplace partalemre/MODZ`.

The MODZ panel (`modz`) shows its line here.

## What you see

Nothing appears on its own: no card is drawn after a turn. The MODZ panel's **Replay** row (under Work) and `/replay` open it.

**The pane**, from `/replay` or the MODZ row:

- A header with the age of the turn, `4 edits in 4 files`, the lines added and removed, and the request that started the turn.
- **Edits in order**: numbered circles for each step (the current one filled, finished ones checked, upcoming ones as rings), each with its file, folder and `+N -N`.
- Below, the current step: `Edit 2 / 4`, the file name, the tool (`Edit`), one line saying what the change does, which plan step it served (`Plan step 3/9 · <task>`), and a diff with changed lines and changed words highlighted, three lines of the file above and below the change where the file before the edit is known, plus a legend (Removed, Added, Changed word, Unchanged).
- **Changes made by commands.** Files changed through Bash (`sed -i`, `>` into a file, `mv`, `cp`, `rm`, `git checkout`, `--write` / `--fix` and similar) are not edits the replay can show. When a turn ran such commands the pane says so plainly above the steps (`2 commands in this turn may have changed files; those changes cannot be replayed.`), also for a turn whose changes were all made that way. A script that writes files under another name is not recognised.
- **Previous** (`p`), **Next** (`n`; **Finish** on the last step), **Turns** (`t`) and **Close** (`c`, or Esc).

**Going back further.** **Turns** lists the turns of this session that edited files, newest first: the prompt that started each one, `Turn 3 · 4 edits · 3 files · 2h ago`, and **Watch** (`1`–`9` for the first nine rows). Watching a turn replays it exactly like the last one (step list, diff, the sentence Claude said before each edit, the plan step); **Finish** brings you back to the turn list. **Past sessions** (`s`) lists this project's newest 20 sessions, each with the date it was last written, its first prompt as a title, and its turns and edits (`This session` is tagged); **Open** shows a session's turns, and **This session** (`t`) goes back to the current one. **More** (`m`) shows the next rows of a long list. The empty pane (no edits yet) has **Past sessions** too.

In the terminal the same information is text, with the diff in Claude Code's own diff colours. If the terminal is too narrow for a pane, the replay is drawn in the band above the prompt. The pane follows Claude Code's `theme` setting.

**What each step does.** The one-line description comes from, in order: the edit call's own `description`; the sentence Claude wrote just before the edit, read from the transcript (main loop and subagents); and, if neither exists, one small model call (see Cost). If none is available the line is left out.

**Plan step.** `TodoWrite`, `TaskCreate`, `TaskUpdate` and `TaskList` are watched; each edit records the item that was `in_progress` when it ran. With no task list there is no plan line.

## Commands

- `/replay` opens the pane for the last turn's edits.
- `/replay turns` opens the list of this session's turns that edited files.
- `/replay sessions` opens the list of this project's sessions.

## Settings

There are no plugin options.

## Cost

Usually no model tokens; going back through earlier turns and sessions never uses any. Only when some steps have neither a description nor a sentence in the transcript, opening the pane for the first time makes one `haiku` request (low effort, 20-second limit) for those steps. The result is cached for that turn, so reopening makes no call.

## Where past edits come from

Nothing extra is recorded for this. Claude Code writes every session's transcript as JSONL in its configuration folder (`~/.claude/projects/<project>/<session>.jsonl`, and each subagent's under `<session>/subagents/`); the session's own `transcript_path` names that folder. The mod only reads it: the person's prompts start turns, and every `Edit`, `MultiEdit`, `Write` and `NotebookEdit` call that did not fail becomes a step, with the text Claude wrote just before it and the `TodoWrite` / `Task` item in progress at the time. A subagent's edits join the turn whose `Agent` call started it.

What a step shows is what the transcript holds, and its note says so:

- **Edit / MultiEdit**: with three lines of the file around the change when the transcript kept the file before it (`originalFile`); otherwise the edited part only (`old_string` to `new_string`), noted `edited part only`.
- **Write**: a new file is all added lines; a rewrite is a real diff when the transcript kept the earlier text, otherwise the new text alone, noted `whole file; earlier text not in transcript`.
- **NotebookEdit**: the cell's new source; a replaced or deleted cell's old text is not recorded.

Reading is lazy and bounded: the list shows each session's line as soon as it is known, reading one transcript at a time; a session's turns are rebuilt only when it is opened, and the last three read are kept while their files do not change. Transcripts up to 4 MiB are read whole and larger ones stream through `dd`; of one over 48 MiB only the last 48 MiB are read, and its row says `only the newest part of a very large transcript was read`. The list lines (title, turns, edits; a few hundred bytes each, for the 20 sessions listed) are kept in the plugin store so the next listing does not read them again. A line that does not parse is skipped. Past turns make no model call.

When the session has no local transcript (its `transcript_path` is empty), the lists say there is nothing to read.

## Limits

- For `Edit` and `MultiEdit` the file on disk is read just before the edit and the change is shown with three lines of it above and below (an `Edit` with `replace_all` shows the changed strings only); for `Write`, the file's text before the write is read first and shown with one line of context. Each step shows at most 12 lines (`... N more lines`).
- A rejected or failed edit is not recorded, live or read back.
- The live replay's state lives in the session; earlier turns and sessions come back from the transcripts for as long as Claude Code keeps them.
- Only the newest 20 sessions are listed.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish. The model-written step lines come back in English.

## Credits

Adapted from [anthropics/claude-code-playground](https://github.com/anthropics/claude-code-playground) (`claude-code/mods/replay-theater`), licensed Apache-2.0. The license file is in this folder.

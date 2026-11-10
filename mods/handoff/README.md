# handoff

Keeps compaction from losing your working context. Before any compaction (your `/compact`, the automatic one, or
the idle one), it writes working notes to disk with no model call; after it, one line offers to put them back. Near
the point where auto-compaction fires, it asks once: compact now (notes kept), or hand off to a fresh chat.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install handoff@modz
```

Or in one step: `/plugin install handoff --marketplace partalemre/MODZ`.

## What you see

- **Before any compaction** of the main conversation (`/compact`, automatic at the engine's threshold, idle compaction
  before the prompt cache runs out, or another mod's): the working notes are written to
  `.claude/handoff/<yyyy-mm-dd-hhmm>-compact.md` before the engine summarizes, with no model call. A compaction never
  takes your context with it unsaved. They are not handed to the next chat: that stays the handoff's job.
- **After a compaction:** one line above the prompt, `Compacted (automatic) · 182k → 24k tokens · working notes saved`
  (sizes when the engine reports them), with **Restore working notes** and **Dismiss**. Only the press puts the notes
  back into this chat, once, as a message Claude reads on its next turn.
- **Near auto-compaction:** one quiet line, `Context is 82% full · auto-compact at 90%`, with **Compact now, keep
  notes**, **Hand off to a fresh chat** and **Not now**. It comes at the `threshold` setting (80%), or five points
  before auto-compaction when that fires sooner. **Not now** waits until the fill has grown another 10 points; if you
  do nothing, the notes are still written when compaction comes. Once the fill drops back (after a compaction), the
  next climb asks again.
- **After a handoff:** the card says `Handoff saved`, where the file is, and to start fresh with `/clear`. The mod never
  runs `/clear` for you. **Show note** opens the Handoff pane.
- **The next chat in the same repo** (after `/clear`, a new `claude` in that folder, or a desktop session in any
  worktree of it) shows `A handoff note is waiting` with **Continue from handoff** and **Not now**. Only a press of
  **Continue from handoff** puts the note in that chat's system prompt, kept for each of its requests; no other
  conversation sees it after that, so an unrelated side chat never takes it. The chat that wrote the note never gets
  it, and a note older than a day is not offered.
- **Another mod's notice** (cache-tax, you-should-know, reflect, session-budget) takes the band first; after ten
  minutes of the same notice the handoff card shows anyway, so a notice left behind cannot hide it for ever.
- **The Handoff pane** (from the MODZ hub's row, the card's **Show note**, or `/handoff show`; it never opens by
  itself): the latest handoff's preview and age, whether the next chat is offered it, and **Don't hand it on** /
  **Hand it to the next chat**, **Write handoff now** and **Delete note** (removes the file and the kept copy); then
  **What it does**, in plain words at this chat's numbers; then **Saved notes**, every other note with its kind and
  age and a **Delete** each. Notes older than 7 days are deleted when a session starts (at most 12 are kept).
- **The MODZ hub:** a row "Handoff" with `Context 42% · note ready`.

## What a note holds

Written to `.claude/handoff/<yyyy-mm-dd-hhmm>.md` in the main repository, even from a worktree, so the note
outlives the worktree (add `.claude/handoff/` to `.gitignore` if you do not
want the notes committed):

- the last three prompts you typed (the goal), trimmed;
- the open steps of the plan, when [plan-steps](../plan-steps) runs;
- the files Claude wrote or edited in this conversation (Write, Edit, NotebookEdit);
- `git status --short --branch`, when the folder is a git repo;
- the last failed tool call, one line;
- with summarizing on, a "where we are / next step" summary of at most 12 lines.

## Commands

| Command | Effect |
|---|---|
| `/handoff` | Writes a handoff note now and prints its path |
| `/handoff show` | Opens the Handoff pane |

## Settings

| Setting | Default | Effect |
|---|---|---|
| `threshold` | `80` | The context fill (in %, 50 to 99) at which the line asks; five points before auto-compaction when that is sooner |
| `summarize` | `true` | Adds the model's short summary to each handoff (never to the notes written at a compaction) |

## Token cost

Nothing automatic calls a model: the notes at a compaction are built from the session alone. **Restore working
notes** adds one note (at most 8,000 characters) to the conversation, once. At most one Haiku call per handoff you
ask for, and only with `summarize` on: it reads the newest 30 messages, cut to 12,000
characters, and writes at most 500 tokens. The call goes through your own session's client. If it fails or is off,
the note is built from the session alone and costs nothing. Handing the note on adds it (at most 8,000 characters)
to the next conversation's system prompt, once.

## Language

The interface and the note's headings are English. Set `MODZ_LANG=tr` in the `env` block of
`~/.claude/settings.json` for Turkish.

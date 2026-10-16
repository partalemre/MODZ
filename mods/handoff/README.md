# handoff

Before the context window fills, writes a handoff note and hands it once to your next fresh chat in this repo, so
you can start clean without losing the thread.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install handoff@modz
```

Or in one step: `/plugin install handoff --marketplace partalemre/MODZ`.

## What you see

- **At the threshold (80% by default):** one card above the prompt, only between turns and never while a question is
  open: `HANDOFF` · `Context is 82% full`, a context meter, and three buttons. **Write handoff** writes the note.
  **Compact instead** runs the same compaction `/compact` does. **Not now** waits until the fill has grown another 10
  points. Once the fill drops back under the threshold (after a compaction), the next climb asks again.
- **After writing:** the card says `Handoff saved`, where the file is, and to start fresh with `/clear`. The mod never
  runs `/clear` for you. **Show note** opens the Handoff pane.
- **The next fresh chat in the same repo** (after `/clear`, or a new `claude` in that folder) gets the note in its
  system prompt, once: the first conversation that has no reply yet takes it and keeps it for each of its requests;
  no other conversation sees it after that. The chat that wrote the note never gets it, and a note older than a day
  is not handed on.
- **The Handoff pane** (from the MODZ hub's row, the card's **Show note**, or `/handoff show`; it never opens by
  itself): the latest note's preview and age, whether the next chat gets it, and **Don't hand it on** /
  **Hand it to the next chat**, **Write handoff now** and **Delete note** (removes the file and the kept copy).
- **The MODZ hub:** a row "Handoff" with `Context 42% · note ready`.

## What a note holds

Written to `.claude/handoff/<yyyy-mm-dd-hhmm>.md` in the repo (add `.claude/handoff/` to `.gitignore` if you do not
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
| `threshold` | `80` | The context fill (in %, 50 to 99) at which the card asks |
| `summarize` | `true` | Adds the model's short summary to each note |

## Token cost

At most one Haiku call per handoff, and only with `summarize` on: it reads the newest 30 messages, cut to 12,000
characters, and writes at most 500 tokens. The call goes through your own session's client. If it fails or is off,
the note is built from the session alone and costs nothing. Handing the note on adds it (at most 8,000 characters)
to the next conversation's system prompt, once.

## Language

The interface and the note's headings are English. Set `MODZ_LANG=tr` in the `env` block of
`~/.claude/settings.json` for Turkish.

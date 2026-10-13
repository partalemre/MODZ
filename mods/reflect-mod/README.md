# reflect-mod

Notices when you correct Claude in a way worth keeping ("use pnpm, not npm") and offers to save it as a rule in your CLAUDE.md.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install reflect-mod@modz
```

Or in one step: `/plugin install reflect-mod --marketplace partalemre/MODZ`.

## What you see

When a prompt of yours looks like a correction or a standing preference, a card appears above the prompt:

- **Save as a rule?**, with the rule itself as the headline, how sure the check was (`95% sure`), and a quote of what you said.
- **Where** lists two rows: *This project only* (`<project>/CLAUDE.md`, key `1`) and *All your projects* (`~/.claude/CLAUDE.md`, key `2`). The row the check suggested is selected.
- **Save to this project** or **Save to all projects** (`s`) follows the selected row. **Rewrite** (`r`) opens a field in the card to reword the rule; where there is no field, the rule is put in an empty prompt box as `remember: <rule>`. **Don't save** skips it.
- After saving, the card says where the rule was added for a few seconds. If more rules are waiting, it shows `+N more rules · /reflect-queue`.

Saving re-reads the target file just before writing and adds one bullet inside a marked section:

```markdown
<!-- claude-reflect: learned rules (saved from the band; edit freely) -->
## Learned rules
- Use pnpm, not npm, in this repo
<!-- end claude-reflect -->
```

A rule already in the file is not added twice, and a file with broken markers is left alone. A saved rule is also added to this session's context, so Claude follows it from your next message. The rule is written in the language you said it in.

Typing `remember: <rule>` skips the check and goes straight to the card.

## Ideas from your past chats

`/mine` looks back over this project's last 20 chats for friction that keeps coming back, and opens an **Ideas** pane with what would fix it. Nothing opens by itself; the pane opens only when you type `/mine`.

- A local filter goes first, with no model call: corrections said again in similar words (the same trigger words as above, English and Turkish), "remember", "always" and "never" asks said more than once, the same tool held or denied again and again (permission prompts, Blast Radius and Secret Guard holds), the same shell command failing, and the same prompt typed again (its first 60 characters). Anything seen at least twice is a candidate, ranked by how often and in how many chats.
- Then one model call turns the 12 strongest candidates into at most 6 ideas, each a **Rule** (a CLAUDE.md line), a **Hook**, a **Skill** or a **Mod**, with a one-line reason and how often it was seen. The counts are always the local ones, never the model's.
- A rule has **Save to CLAUDE.md**: it goes to the card above the prompt, where you pick this project or all projects and save as usual (or rewrite it, or skip it). A rule already in your CLAUDE.md says so instead. Hooks, skills and mods have **Copy**, so you can paste the request to Claude.
- If the model's answer is unusable, the pane shows what repeats, with **Try again**. With nothing repeating it says "No repeating friction found in the last 20 chats".
- When the MODZ hub is on, the pane starts with **← MODZ**.

What is read: the chat files under `~/.claude/projects/<project folder>/` (or under `CLAUDE_CONFIG_DIR`), the newest 20 except the running one. Runs with nothing in them to learn from (scripted `claude -p` runs, agents) do not count toward the 20, and at most 60 files are opened to find them. A file over 4 MiB, which the engine will not read at once, is read from its last 1,000,000 bytes by running `tail -c 1000000 -- <file>` (no shell); its torn first line is dropped, and it is skipped only if `tail` fails. The pane says how many chats were read from the end and how many could not be read. At most a million characters of each file are scanned.

## How it decides

Only your own prompts are looked at: not slash commands, not acknowledgements ("ok", "continue"), not anything over 500 characters, and nothing that looks like a credential. A cheap word filter comes first (English, Turkish and Russian trigger words such as "no", "never", "always", "instead", "hayır", "asla", "her zaman"). With no trigger, no model is called. Rules that are malformed, below 70% confidence, over 200 characters, on several lines, or secret-shaped are dropped, and so is a rule already in your project or global CLAUDE.md.

## Commands

- `/reflect-queue` lists the rules found for this project and globally, with their status (waiting, saved, skipped) and how often each was seen.
- `/reflect-pause` pauses or resumes checking your prompts.
- `/mine` reads your recent chats and opens the Ideas pane (above).

## Settings

There are no plugin options.

## Cost and privacy

This mod calls a model: one small `haiku` request per prompt that passes the word filter, on the session's own client, so it counts toward your Claude usage. The request carries your prompt and Claude's previous reply (up to 1,200 characters of it). Prompts that become a proposed rule are stored, cut to 200 characters, in the plugin's own store until you decide. Saved rules in the session context add a few tokens to later requests.

`/mine` costs one small `haiku` request per run, and none when nothing repeats. The request carries only the candidates: their kind, counts and a sample of at most 140 characters each, 6,000 characters in all; prompts and commands that look like credentials are left out before anything is counted. Your chat files are read on your machine and never sent whole.

## Limits

- Two sessions saving to the same CLAUDE.md in the same instant can lose one of the two bullets; within one session saves are serialized.
- Use this or the Python `claude-reflect` plugin, not both, or every correction would be captured twice.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish. The trigger words stay bilingual in either language.

## Credits

Adapted from [bayramannakov/claude-reflect](https://github.com/bayramannakov/claude-reflect), licensed MIT. The license file is in this folder.

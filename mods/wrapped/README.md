# wrapped

Your year with Claude Code on one card and in a short video, read from the transcripts already on your machine: a persona, prompts, chats, your longest streak, which agents did the most work, what each month went to, how often you stopped Claude and how often it told you that you were right.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install wrapped@modz
```

## Use

`/wrapped` opens the card for this year; `/wrapped 2025` picks another. The first read walks every transcript once, a few minutes on a big archive, and is kept, so the card opens at once afterwards. **Read again** refreshes it.

- **Make the video** builds a vertical story of about 34 seconds, `~/Downloads/wrapped-<year>.mp4`, and opens it: your figures, the crew as the Agents pane's crabs, who did the most work, your hardest single agent run, the year month by month, and your persona. It needs macOS and `ffmpeg` (`brew install ffmpeg`), and takes under a minute. It has no sound.
- **Save image** writes `~/Downloads/wrapped-<year>.png` through macOS's `sips`. Elsewhere you get the `.svg`.
- **Copy text** puts the same figures on the clipboard, for a post.
- **Show names** adds your file and project names and the task your hardest agent had. They stay off the card, the video, the image and the text until you press it; until then projects read Project A, Project B.

## What the figures mean

Nothing leaves your machine and no model tokens are used.

- The card covers the days your transcripts still hold. Claude Code removes transcripts after 30 days unless `cleanupPeriodDays` in your settings keeps them, so the dates at the bottom of the card can start later than January.
- **Agents** are subagent runs with a transcript. Who "did the most" is ranked by tool calls. A crab's costume follows its type's rank unless it has its own (the savvy tiers, Explore).
- **Months** are UTC months, each with its top project by prompts and its busiest agent type by runs.
- **Prompts** are what you typed in main chats. Tool results and system messages do not count.
- **Claude said I was right** counts replies that open a text block with "absolutely right", "You're right" or "haklısın".
- **~$ at API prices** adds up the cost Claude Code recorded per session. It is what the usage would cost on the API, not what you paid on a subscription, and sessions from before Claude Code recorded a cost add nothing.
- **~ novels** is output tokens at about 130,000 tokens a novel, thinking included.
- A time zone off the whole hour can put a prompt in the next hour.

It needs `awk` on your PATH (macOS and Linux have it; on Windows, Git Bash).

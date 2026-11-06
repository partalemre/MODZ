# wrapped

Your year with Claude Code as a story, read from the transcripts already on your machine: a page each for your prompts, your busiest day and weekday, your busiest hour, your top projects, months, tools and models, the lines you added, your crew of agents, your hardest agent run and your persona, ending on one image made to share.

This is the one loud page in MODZ: a year in review earns colour blocks, where the other panes keep DESIGN.md's quiet rule.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install wrapped@modz
```

## Use

`/wrapped` opens the story for this year; `/wrapped 2025` picks another. The first read walks every transcript once, a few minutes on a big archive, and is kept, so it opens at once afterwards. **Read again** refreshes it. **Next** and **Back** turn the pages.

- **Copy image** puts the last page on your clipboard, ready to paste anywhere, and keeps it at `~/Downloads/wrapped-<year>.png`. The clipboard needs macOS; elsewhere you get the `.svg`.
- **Share on X** does the same and opens a post in your browser with the words filled in; press Cmd+V there to add the image. Nothing is uploaded or sent for you.
- **Make the video** builds a vertical story of about a minute at 60 frames a second, 1080×1920, `~/Downloads/wrapped-<year>.mp4`, and opens it. It needs macOS and `ffmpeg` (`brew install ffmpeg`), takes about two minutes and has no sound.
- **Hide names** masks your project and file names and your hardest agent's task everywhere, the pages, image, video and text included: projects read Project A, Project B. They show until you press it, so press it before you share if a name is private. The post's words never name a project.

## What the figures mean

Nothing leaves your machine and no model tokens are used.

- The story covers the days your transcripts still hold. Claude Code removes transcripts after 30 days unless `cleanupPeriodDays` in your settings keeps them, so its dates can start later than January.
- **Agents** are subagent runs with a transcript. Who "did the most" is ranked by tool calls. A crab's costume follows its type's rank unless it has its own (the savvy tiers, Explore).
- **Months** are UTC months, each with its top project by prompts and its busiest agent type by runs.
- **Your busiest day, weekday and hour** count your prompts in your own time zone.
- **Models** count replies by the model that wrote them.
- **Prompts** are what you typed in main chats. Tool results and system messages do not count.
- **Claude said I was right** counts replies that open a text block with "absolutely right", "You're right" or "haklısın".
- **~$ at API prices** adds up the cost Claude Code recorded per session. It is what the usage would cost on the API, not what you paid on a subscription, and sessions from before Claude Code recorded a cost add nothing.
- **~ novels** is output tokens at about 130,000 tokens a novel, thinking included.
- A time zone off the whole hour can put a prompt in the next hour.

It needs `awk` on your PATH (macOS and Linux have it; on Windows, Git Bash).

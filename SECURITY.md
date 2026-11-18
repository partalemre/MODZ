# Security

MODZ mods are Claude Code plugins. A plugin's hooks run on your machine with your user's rights: they see the tool
calls in your sessions and can read files and run commands, like any program you install. The protection is knowing
what runs, choosing when it changes, and keeping the parts you do not need off. This page says how.

## What runs, and how to check it

- **Each mod runs `hooks/bundle.js`.** It is built from the `.ts` files beside it by `bin/modz build` (rollup, pinned
  version). The `bundle-match` check rebuilds every bundle on each push and pull request and fails if a committed
  bundle differs from its source, so the source you read is the code that runs.
- **Check it yourself** on a checkout: `bin/modz build && git status --porcelain` prints nothing when every bundle
  matches.
- **Code from other projects.** Some mods are adapted from other open-source repos, listed in
  [upstreams.json](upstreams.json). Their code is copied into this repo, reviewed, and changes only through a commit
  here; nothing is fetched from those repos at run time.
- **What each mod reads, writes, runs and sends** is in the README table "What each mod can touch". Install only the
  mods you will use.

## Updates are yours to choose

New commits do not reach your machine on their own. Open **Updates** in the modz panel: it says when a new
version is out (a toast tells you too), turns Claude Code's automatic updates for MODZ on or off with one press, and
copies the commands to update by hand:

```sh
claude plugin marketplace update modz
claude plugin update <mod>@modz
```

## Network

Off by default, except where the mod's job needs it:

| Mod | Where | When |
|---|---|---|
| `modz` | GitHub (`git ls-remote` of the MODZ repo: its latest commit, nothing about you) | once a session, to say when an update is ready |
| `savvy-progress` | Open-Meteo (the place, rounded to about a town's width) | only with `MODZ_WEATHER=on` |
| `test-badge`, `pr-card` | GitHub, through your `gh` | when they show CI or pull requests |
| `terminal-browser` | the pages you open, and its own CLI on 127.0.0.1 | when you use it |
| `transceiver` (comes with `modz`) | claude.ai and the private GitHub repo you share | when you use a room or ask another machine |

## Transceiver

Transceiver comes with `modz` and lives in [its own repo](https://github.com/partalemre/transceiver). It links your
own computers, your team and your agents, with no server of its own: rooms are private claude.ai artifacts and a
private GitHub repo you share, reached with your own logins.

- **End-to-end encrypted.** Everything written to a room (messages, agent questions and answers, DMs, the archive,
  even your GitHub login and name) is sealed to the room's members. The repo, its history and claude.ai hold only
  ciphertext. Each computer makes its own key pair, and the secret key never leaves it.
- **Members only.** A new member reads what is written after they join. A removed member gets nothing new.
- **Visible:** who writes and when. Rooms still refuse public repos.
- Messages from others reach your session fenced as untrusted data, not instructions.
- Lines written before encryption are sealed again and squashed out of the room's history. Copies already fetched,
  and old objects GitHub keeps for a while, count as seen.

## Reporting a problem

Open a [private security advisory](https://github.com/partalemre/MODZ/security/advisories/new). Please do not file
security problems as public issues.

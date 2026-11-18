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

New commits do not reach your machine on their own. When one is out, the hub says so (a toast and "update ready" in its
head line). Update by hand after looking at what changed:

```sh
claude plugin marketplace update modz
claude plugin update <mod>@modz
```

Auto-update is opt-in: turn on `keepUpdated` (`claude plugin configure modz`) or choose **Enable auto-update** under
`/plugin` > Marketplaces. An install from before this default changed may already have it on; choose **Disable
auto-update** there to stop it.

## Network

Off by default, except where the mod's job needs it:

| Mod | Where | When |
|---|---|---|
| `modz` | GitHub (`git ls-remote` of the MODZ repo: its latest commit, nothing about you) | once a session, to say when an update is ready |
| `savvy-progress` | Open-Meteo (the place, rounded to about a town's width) | only with `MODZ_WEATHER=on` |
| `blast-radius`, `effort-router` | api.typesafe.ai (Jev) | only with `MODZ_JUDGE=jev` and your own `TYPESAFE_API_KEY` |
| `test-badge`, `pr-card` | GitHub, through your `gh` | when they show CI or pull requests |
| `terminal-browser` | the pages you open, and its own CLI on 127.0.0.1 | when you use it |
| `transceiver` (comes with `modz`) | claude.ai and the private GitHub repo you share | when you use a room or ask another machine |

## Transceiver

Transceiver comes with `modz` and lives in [its own repo](https://github.com/partalemre/transceiver). It links your
own computers, your team and your agents, with no server of its own: rooms are private claude.ai artifacts and a
private GitHub repo you share, reached with your own logins. Only collaborators on that repo can write to a room or
ask your agent, and an answer is worked out on your machine, so secrets stay there. Messages from others reach your
session fenced as untrusted data, not instructions. What is written in a room stays in that repo's history, so keep
secrets out of rooms.

## Reporting a problem

Open a [private security advisory](https://github.com/partalemre/MODZ/security/advisories/new). Please do not file
security problems as public issues.

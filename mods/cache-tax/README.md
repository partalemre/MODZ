# cache-tax

Keeps Claude Code's one-hour prompt cache warm while you take a break, and holds a cold send on a card that shows what rewriting the cache would cost.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install cache-tax@modz
```

Or in one step: `/plugin install cache-tax --marketplace partalemre/MODZ`.

## What you see

**A held send.** If the cache has gone cold and the context is at least 50,000 tokens, your next ordinary message is held once. A card above the prompt shows when the cache went cold, what sending now would cost (the rewrite, as an upper bound) against what a warm turn would have cost, and the held message. Three buttons:

- **Pay and send** (`p`) sends your held message as written and turns keepwarm on for 3 hours.
- **Start fresh** (`n`) runs `/clear` and puts the held message back in the prompt box.
- **Cache status** (`s`) runs `/cache-tax`.

Sending the same message again also pays. Slash commands are never held. Without a band to draw in, the hold is a one-line refusal instead.

**A model change.** A prompt cache belongs to the model that wrote it, so switching models (Opus 5 to Sonnet 5, say) makes the next send rewrite the whole context even when the clock says warm. When the session's model differs from the one the last request used, the same card holds the send with the reason "Model changed (Opus 5 → Sonnet 5): the cache will be rewritten" and the rewrite priced at the new model. The same rules apply: 50,000 tokens or more, held once, `/cache-tax guard warn` only shows the price. Switching back before sending takes the card down. The first prompt of a session has no earlier request to compare with, so only the clock guards it. A model name the mod cannot read as a family and version (an alias such as `default`) never counts as a change.

**A status row** at the bottom of the band, shown only when it means something: keepwarm is on or has stopped, the cache is cold, or a large cache goes cold within 10 minutes. It says `warm`, `cold`, `unknown` or `stopped` in words, so colour is never the only signal.

**Warming.** `/keepwarm` opens a bounded window. After 50 idle minutes inside it, one tool-less request over the session's transcript refreshes the cache. After each ping the mod reads the usage back and stops if the ping read nothing or wrote at least a tenth of what it read. A window belongs to one session and ends at its deadline.

## Commands

```
/keepwarm               keep warm for six hours
/keepwarm 90m           a window of your own (also 2h30m, 6h)
/keepwarm always        a six-hour window at every session start, remembered
/keepwarm 6h every 2m   ping every two minutes (testing knob, minimum 1m, this window only)
/keepwarm status        the window, next ping and last receipt
/keepwarm off           stop, and turn always off
/cache-tax              model, cache state, cold price, keepwarm, guard and this session's cold writes
/cache-tax guard refuse hold a cold send once (default)
/cache-tax guard warn   show the price and send
```

## Settings

There are no plugin options. The guard mode and the `always` switch are set with the commands above and remembered across sessions.

## Cost

This mod calls the model. Each keepwarm ping is a real request: it bills a cache read, a few uncached tokens and whatever the model answers, with no output cap. The prices shown are estimates from list prices, not a measurement from the server, and on a subscription they are a yardstick rather than a bill. A detected cold write arms at least three hours of keepwarm. The held-send card itself costs nothing.

## Limits

- The 50-minute schedule needs a one-hour main cache. Included subscription usage has it by default; for API-key, usage-credit and cloud-provider sessions set `promptCacheTtl` to `"1h"`, because a 50-minute timer cannot protect a five-minute cache.
- The cold or warm state is an estimate from a one-hour clock, not a live check of the server's cache.
- The refusal's token count is an upper bound: the engine's context figure includes the last response's output.
- A ping that reads warm only proves the cache was warm then. Changes to the prompt prefix can invalidate the cache regardless of time.
- The cold-write tally is per session, held in memory, and `/clear` empties it.
- Claude Code must stay running. Mods need Claude Code 2.1.287 or later.
- If the separate hook version (`cache-tax@claude-code-hooks`) is installed too, cold sends are guarded twice. The mod says so once at session start; keep one.

## Language

The interface is English. Set `MODZ_LANG=tr` in the `env` block of `~/.claude/settings.json` for Turkish. Command names and arguments stay English.

## Credits

Adapted from [karanb192/cache-tax](https://github.com/karanb192/cache-tax) (v2.2.1), licensed MIT. The license file is in this folder.

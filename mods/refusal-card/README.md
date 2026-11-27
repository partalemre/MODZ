# refusal-card

When the model's safeguards flag your request and the turn stops, a card above the prompt shows what you asked and offers one press to report it as a false positive. It only fills the prompt box: nothing is sent for you.

## Install

```
/plugin marketplace add partalemre/MODZ
/plugin install refusal-card@modz
```

Or in one step: `/plugin install refusal-card --marketplace partalemre/MODZ`.

## What you see

Claude Code says "…'s safeguards flagged this message. This sometimes happens with safe, normal conversations." and the turn ends. The card above the prompt then shows:

- **Safeguards flagged this turn**, and the request the turn began with, on one line, at most 240 characters.
- **Report a false positive** puts this line in the prompt box and does nothing else:

  ```
  /feedback False positive: the safeguards flagged a normal request and the turn stopped. Request: "…" Category: cyber.
  ```

  The category is there only when the API sent one. Read or edit the line, then press Enter yourself: `/feedback` opens Claude Code's own report form, which asks once more before anything goes to Anthropic. If the prompt box already holds a draft, it is never replaced; a toast asks you to clear it first.
- **Dismiss** closes the card. Your next prompt closes it too.

The card's words follow `MODZ_LANG=tr`; the report itself stays in English, as it goes to Anthropic.

## What it reads

It keys on the engine's own signal for a refused turn (`turn.complete` with `reason: "refusal"`, main conversation only), not on the message text. A subagent's refusal draws no card. When Claude Code is set to switch to another model after a flag, the turn goes on there instead of ending, so there is no card.

It keeps the last request in memory for this session only: nothing is stored, written or logged, and it uses no model tokens.

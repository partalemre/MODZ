// Every line the mod says, in English. The words come here already formatted; words.ts decides which.
// Command names and their arguments stay as typed.

/** `share`: on a subscription, the limit share the send takes, already worded; dollars then follow it. */
export type Guard = { lead: string; tokens: string; rate: string; usd: string; warm: string | null; share: string | null }
export type Times = { span: string; every: string }

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

export const EN = {
  rateUnknown: 'the cache write price',
  guard: (g: Guard): string =>
    (g.share === null
      ? `${g.lead} This send rewrites up to ${g.tokens} tokens at ${g.rate} = ${g.usd}`
      : `${g.lead} This send rewrites up to ${g.tokens} tokens: ${g.share} (${g.usd} at list price)`) +
    (g.warm === null ? '' : ` (a warm turn would be ${g.warm})`) + '.',
  share: (percent: string, isWeekly: boolean): string => `≈${percent}% of the ${isWeekly ? 'weekly' : '5-hour'} limit`,
  noPrice: 'no price for this model',
  coldLead: (ago: string): string => `The cache went cold ${ago} ago.`,
  switchLead: (from: string, to: string): string => `Model changed (${from} → ${to}): the cache will be rewritten.`,
  dropHeld: (usd: string): string => `cache-tax: your message is on hold, choose on the card (cold cache, up to ${usd}).`,
  dropSwitched: (usd: string): string => `cache-tax: your message is on hold, choose on the card (model changed, up to ${usd}).`,
  drop: (guard: string): string =>
    `cache-tax: ${guard} Send again to pay; /keepwarm then keeps the cache warm. Or start over with /clear and a note.`,
  warn: (guard: string): string => `${guard} Sending anyway; /keepwarm keeps the cache warm from here.`,
  paid: (g: { tokens: string; usd: string; auto: string }): string =>
    `Rewrote ${g.tokens} tokens into the cache (${g.usd}). The cache stays warm for ${g.auto} so it is not paid again ` +
    'today; /keepwarm off stops it.',
  paidCold: (g: { tokens: string; usd: string }): string =>
    `Rewrote ${g.tokens} tokens into the cache (${g.usd}). /keepwarm keeps it warm so it is not paid again today.`,
  cap: (pings: number, output: number): string => `; at most ${pings} refreshes, and one that writes over ${output} output tokens ends it`,
  resume: (tokens: string, usd: string): string =>
    `Resuming cold. The first message rewrites ${tokens} tokens, ≈${usd}. ` +
    'If you only need the results, start with /clear and paste a summary.',
  hookTwice: 'The hook version (cache-tax@claude-code-hooks) is installed too, so a cold send is warned about or ' +
    'held twice. Remove it, or run /cache-tax guard warn here.',
  forkWaits: 'keepwarm is on, but there is no conversation to refresh yet, so no refresh goes out until your next ' +
    'message. Send one more message and the refreshes start.',
  firstTurn: ' · waiting for the first turn',
  afterCompact: ' · waiting for the first turn after compaction',
  coldPing: (every: string): string => ` · cold now; first refresh ${every} after the next turn`,
  pingIn: (left: string): string => ` · refresh in ${left}`,
  lastPing: (read: string, usd: string): string => ` · last refresh read ${read} tokens for ${usd}`,
  stopped: (why: string): string => `stopped keeping the cache warm: ${why}`,
  warmFor: (rest: string): string => `keep warm: ${rest}`,
  left: (left: string): string => `${left} left`,
  coldNow: (every: string): string => `. The cache is cold now; the first refresh comes ${every} after the next turn`,
  armedCold: (span: string): string => `the cache stays warm for ${span}`,
  armed: (t: Times): string => `the cache stays warm for ${t.span}: ${t.every} into every pause, a small refresh reads it ` +
    'without rewriting it',
  always: (span: string): string =>
    `keepwarm always on: every session starts with a ${span} window; /keepwarm off turns it off for good`,
  keepwarmCommand: 'Keep the cache warm: 6 hours on its own, a span like 90m, always (or always 24h), off or status (cache-tax)',
  cacheTaxCommand: 'Cache state, cold price and this session’s cold writes; guard warn|refuse (cache-tax)',
  keepwarm: {
    off: 'keepwarm off',
    offAlways: 'keepwarm off; it no longer turns on by itself when a session starts',
    usage: 'keepwarm takes a span (6h, 90m) or always, off, status',
    every: 'every takes a span from 1m to 59m',
    alwaysUsage: 'always takes one window from 1h to 168h, such as always 24h',
  },
  guardMode: {
    usage: '/cache-tax guard takes warn, refuse, or refuse with a dollar floor such as refuse 5',
    floor: (usd: string): string => `guard: hold once at ${usd} or more. A cheaper cold send goes through with its price shown`,
    refuse: 'guard: hold once. A cold send waits with its price, sending it again goes through',
    warn: 'guard: warn only. A cold send goes through with its price shown',
  },
  labels: { state: 'state', context: 'context', cost: 'cold cost', keepwarm: 'keepwarm', even: 'break-even', guard: 'guard', session: 'session' },
  noModel: 'no model seen yet',
  compacted: 'reset by compaction, waiting for the first turn',
  noRequest: 'no request in this session yet',
  coldState: (ago: string): string => `COLD, last request ${ago} ago`,
  warmState: (left: string): string => `warm, ${left} left`,
  context: (tokens: string): string => `${tokens} tokens`,
  cost: (usd: string, warm: string): string => `rewrite ${usd} (warm turn ${warm})`,
  on: (line: string): string => `on, ${line}`,
  stoppedRow: (why: string): string => `stopped, ${why}`,
  offUntilNext: (span: string): string => `off until the next session starts, then on for ${span} (always)`,
  off: (span: string): string => `off (/keepwarm turns it on for ${span})`,
  even: (pings: number, t: Times): string =>
    `at the read price up to ${plural(pings, 'ping costs', 'pings cost')} one cold write; at one ping per ${t.every}, ` +
    `≈${t.span} idle`,
  guardRefuse: 'hold once (/cache-tax guard warn only shows the price)',
  guardWarn: 'warn only (/cache-tax guard refuse holds once)',
  guardFloor: (usd: string): string => `hold once at ${usd} or more, warn below (/cache-tax guard refuse holds any)`,
  underFloor: (floor: string): string => ` It is under your ${floor} floor, so it was not held.`,
  session: (count: number, usd: string): string => `${plural(count, 'cold write', 'cold writes')} paid, ${usd}`,
}

export type Phrases = typeof EN

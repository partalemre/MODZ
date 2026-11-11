// Every line the mod says, in English. The words come here already formatted; words.ts decides which.
// Command names and their arguments stay as typed.

/** `share`: on a subscription, the limit share the send takes, already worded; dollars then follow it. */
export type Guard = { lead: string; tokens: string; rate: string; usd: string; warm: string | null; share: string | null }
export type Times = { span: string; every: string }

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

export const EN = {
  rateUnknown: 'the full re-read price',
  perMillion: (usd: string): string => `$${usd} per million tokens`,
  guard: (g: Guard): string =>
    (g.share === null
      ? `${g.lead} This message makes Claude read up to ${g.tokens} tokens of the chat again at ${g.rate} = ${g.usd}`
      : `${g.lead} This message makes Claude read up to ${g.tokens} tokens of the chat again: ${g.share} (${g.usd} at list prices)`) +
    (g.warm === null ? '' : ` (while the chat is kept ready, a turn costs ${g.warm})`) + '.',
  share: (percent: string, isWeekly: boolean): string => `≈${percent}% of the ${isWeekly ? 'weekly' : '5-hour'} usage allowance`,
  noPrice: 'no price for this model',
  coldLead: (ago: string): string => `This chat stopped being kept ready (cache) ${ago} ago.`,
  switchLead: (from: string, to: string): string => `Model changed (${from} → ${to}): Claude reads the whole chat again.`,
  dropHeld: (usd: string): string => `cache-tax: your message is on hold; choose on the card (the chat is no longer kept ready, up to ${usd}).`,
  dropSwitched: (usd: string): string => `cache-tax: your message is on hold; choose on the card (model changed, up to ${usd}).`,
  drop: (guard: string): string =>
    `cache-tax: ${guard} Send again to pay; /keepwarm then keeps the chat ready. Or start over with /clear and a short note.`,
  warn: (guard: string): string => `${guard} Sending anyway; /keepwarm keeps the chat ready from here.`,
  paid: (g: { tokens: string; usd: string; auto: string }): string =>
    `Claude read ${g.tokens} tokens of the chat again (${g.usd}). The chat stays ready for ${g.auto} so you do not pay this ` +
    'again today; /keepwarm off stops it.',
  paidCold: (g: { tokens: string; usd: string }): string =>
    `Claude read ${g.tokens} tokens of the chat again (${g.usd}). /keepwarm keeps it ready so you do not pay this again today.`,
  cap: (pings: number, output: number): string => `; at most ${pings} refreshes, and one that writes more than ${output} tokens ends it`,
  resume: (tokens: string, usd: string): string =>
    `Picking up a chat that is no longer kept ready. The first message makes Claude read ${tokens} tokens again, ≈${usd}. ` +
    'If you only need the results, start with /clear and paste a summary.',
  hookTwice: 'The older hook version (cache-tax@claude-code-hooks) is installed too, so a message is warned about or ' +
    'held twice. Remove it, or run /cache-tax guard warn here.',
  forkWaits: 'keepwarm is on, but there is no chat to refresh yet, so nothing goes out until your next ' +
    'message. Send one more message and the refreshes start.',
  firstTurn: ' · waiting for the first turn',
  afterCompact: ' · waiting for the first turn after the chat was summarized',
  coldPing: (every: string): string => ` · no longer ready; first refresh ${every} after the next turn`,
  pingIn: (left: string): string => ` · refresh in ${left}`,
  lastPing: (read: string, usd: string): string => ` · last refresh read ${read} tokens for ${usd}`,
  stopped: (why: string): string => `stopped keeping the chat ready: ${why}`,
  warmFor: (rest: string): string => `keeping ready: ${rest}`,
  left: (left: string): string => `${left} left`,
  coldNow: (every: string): string => `. The chat is no longer kept ready; the first refresh comes ${every} after the next turn`,
  armedCold: (span: string): string => `the chat stays ready for ${span}`,
  armed: (t: Times): string => `the chat stays ready for ${t.span}: ${t.every} into every pause, a small refresh keeps it ready ` +
    'without a full re-read',
  always: (span: string): string =>
    `keepwarm always on: every chat starts kept ready for ${span}; /keepwarm off turns it off for good`,
  keepwarmCommand: 'Keep the chat ready (cache) during breaks, so the next message costs less: 6 hours on its own, a span like 90m, always (or always 24h), off or status (cache-tax)',
  cacheTaxCommand: 'Whether the chat is still kept ready, what a message costs once it is not, and this chat’s full re-reads; guard warn|refuse (cache-tax)',
  keepwarm: {
    off: 'keepwarm off',
    offAlways: 'keepwarm off; it no longer turns on by itself when a chat starts',
    usage: 'keepwarm takes a span (6h, 90m) or always, off, status',
    every: 'every takes a span from 1m to 59m',
    alwaysUsage: 'always takes one span from 1h to 168h, such as always 24h',
  },
  guardMode: {
    usage: '/cache-tax guard takes warn, refuse, or refuse with a dollar floor such as refuse 5',
    floor: (usd: string): string => `guard: hold the message once when it costs ${usd} or more. A cheaper one goes through with its price shown`,
    refuse: 'guard: hold the message once. It waits with its price; sending it again goes through',
    warn: 'guard: warn only. The message goes through with its price shown',
  },
  labels: { state: 'kept ready', context: 'chat memory', cost: 'cost', keepwarm: 'keepwarm', even: 'worth it', guard: 'guard', session: 'this chat' },
  noModel: 'no model seen yet',
  compacted: 'started over when the chat was summarized; waiting for the first turn',
  noRequest: 'nothing sent in this chat yet',
  coldState: (ago: string): string => `NO, last call to Claude ${ago} ago`,
  warmState: (left: string): string => `yes, ${left} left`,
  context: (tokens: string): string => `${tokens} tokens`,
  cost: (usd: string, warm: string): string => `full re-read ${usd} (a turn while ready ${warm})`,
  on: (line: string): string => `on, ${line}`,
  stoppedRow: (why: string): string => `stopped, ${why}`,
  offUntilNext: (span: string): string => `off until the next chat starts, then on for ${span} (always)`,
  off: (span: string): string => `off (/keepwarm turns it on for ${span})`,
  even: (pings: number, t: Times): string =>
    `up to ${plural(pings, 'refresh costs', 'refreshes cost')} the same as one full re-read; at one every ${t.every}, ` +
    `that covers ≈${t.span} away`,
  guardRefuse: 'hold once (/cache-tax guard warn only shows the price)',
  guardWarn: 'warn only (/cache-tax guard refuse holds once)',
  guardFloor: (usd: string): string => `hold once at ${usd} or more, warn below (/cache-tax guard refuse holds any)`,
  underFloor: (floor: string): string => ` It costs less than your ${floor} floor, so it was not held.`,
  session: (count: number, usd: string): string => `${plural(count, 'full re-read', 'full re-reads')} paid, ${usd}`,
}

export type Phrases = typeof EN

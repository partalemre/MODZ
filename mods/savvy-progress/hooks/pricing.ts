// USD per million tokens: input, output, cache read, cache write. The engine reports tokens, not money, so the
// panel's cost is an estimate. It reports one cache-write count with no split by lifetime; writes are priced at
// the 1-hour rate (2x input), which Claude Code writes on a subscription.
// The rows are those of mods/cache-tax/hooks/core.ts, the one table both mods keep to (there as cache read, 1h
// write, output; input is half the write). A model with no row has no price: no cost is shown, never a neighbour's.
import { fmtCost } from './format'

type Rates = [number, number, number, number]

// Claude 5 and later, keyed by family and version and matched exactly, so a release not listed has no price.
const PRICES_5: Record<string, Rates> = {
  'fable-5-2': [8, 40, 0.2, 16],
  'mythos-5-2': [8, 40, 0.2, 16],
  'fable-5-1': [10, 50, 0.25, 20],
  'mythos-5-1': [10, 50, 0.25, 20],
  'fable-5': [10, 50, 1, 20],
  'mythos-5': [10, 50, 1, 20],
  'opus-5-5': [4, 20, 0.2, 8],
  'opus-5': [5, 25, 0.5, 10],
  'sonnet-5-5': [2, 10, 0.1, 4],
  'sonnet-5': [2, 10, 0.2, 4],
  'haiku-5-5': [0.1, 0.5, 0.01, 0.2],
}
// "opus-5-5" in claude-opus-5-5, claude-opus-5-5[1m] or us.anthropic.claude-opus-5-5-v1:0; a date suffix is not a
// minor, and a date right after the family (claude-3-5-haiku-20241022) is not a generation.
const GEN_5 = /(fable|mythos|opus|sonnet|haiku)-((?:[5-9]|[1-9]\d)(?:-\d{1,2})?)(?!\d)/

// Earlier models, more specific families first: a model id takes the first row it matches.
const EARLIER: [string | RegExp, Rates][] = [
  // Opus 4 and 4.1 in every spelling (claude-opus-4-1-20250805, claude-opus-4@20250514), never Opus 4.5 and later.
  [/opus-4(?:-[01])?(?:$|[^-\d]|-20\d{6})/, [15, 75, 1.5, 30]],
  ['opus-4', [5, 25, 0.5, 10]],
  ['sonnet', [3, 15, 0.3, 6]],
  ['3-5-haiku', [0.8, 4, 0.08, 1.6]],
  ['haiku-3-5', [0.8, 4, 0.08, 1.6]],
  ['haiku', [1, 5, 0.1, 2]],
]
// Haiku 5.5 is priced by prompt length: a request whose prompt (input, cache reads and
// cache writes together) is over 100,000 tokens pays these prices instead.
const LONG_PROMPT = 100_000
const LONG_PRICES: Record<string, Rates> = { 'haiku-5-5': [0.5, 2.5, 0.05, 1] }
const PER_MILLION = 1e6
const SMALL_WINDOW = 200_000
const LARGE_WINDOW = 1_000_000

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

const priceOf = (model: string, prompt: number): Rates | null => {
  const id = model.toLowerCase().replace(/[\s.]+/g, '-')
  const gen5 = GEN_5.exec(id)
  if (gen5) {
    const key = `${gen5[1]}-${gen5[2]}`
    return (prompt > LONG_PROMPT ? LONG_PRICES[key] : undefined) ?? PRICES_5[key] ?? null
  }
  return EARLIER.find(([family]) => (typeof family === 'string' ? id.includes(family) : family.test(id)))?.[1] ?? null
}

/** Whether the table has a price for the model; without one its cost is not shown. */
export const isPriced = (model: string): boolean => priceOf(model, 0) !== null

// `isRequest` says the usage is one model request, which a prompt-length price is set by;
// a turn's sum is priced at the model's ordinary prices. Null for a model the table does not list.
export const costOf = (model: string, u: Usage, isRequest: boolean): number | null => {
  const prompt = isRequest ? (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) : 0
  const rates = priceOf(model, prompt)
  if (rates === null) return null
  const [i, o, r, w] = rates
  const sum =
    (u.input_tokens || 0) * i +
    (u.output_tokens || 0) * o +
    (u.cache_read_input_tokens || 0) * r +
    (u.cache_creation_input_tokens || 0) * w
  return sum / PER_MILLION
}

/** An agent's cost as its row says it, "≈$0.42"; nothing for a model with no price rather than a guess. */
export const costText = (a: { model: string; costUsd: number }): string => (isPriced(a.model) ? `≈${fmtCost(a.costUsd)}` : '')

/** Every token a request moved: what it read, cached and wrote. */
export const tokensOf = (u: Usage): number =>
  (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)

// Haiku 4.5 and the Claude 3 models have a 200K window; the rest, Haiku 5.5 included, 1M.
export const windowOf = (model: string): number => (/haiku-4|claude-3/i.test(model) ? SMALL_WINDOW : LARGE_WINDOW)

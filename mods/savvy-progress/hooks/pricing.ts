// USD per million tokens: input, output, cache read, cache write. The first row that matches
// a model id wins, so a release sits above its family. The engine reports tokens, not money,
// so the panel's cost is an estimate. It reports one cache-write count with no split by
// lifetime; writes are priced at the 1-hour rate (2x input), which Claude Code writes on a subscription.
type Rates = [number, number, number, number]

const PRICES: [RegExp, Rates][] = [
  [/(fable|mythos)-5-1/, [10, 50, 0.25, 20]],
  [/fable|mythos/, [10, 50, 1, 20]],
  [/opus-5-5/, [4, 20, 0.2, 8]],
  [/opus/, [5, 25, 0.5, 10]],
  [/sonnet-5-5/, [2, 10, 0.1, 4]],
  [/sonnet-5/, [2, 10, 0.2, 4]],
  [/sonnet/, [3, 15, 0.3, 6]],
  [/haiku-5-5/, [0.1, 0.5, 0.01, 0.2]],
  [/haiku/, [1, 5, 0.1, 2]],
]
// Haiku 5.5 is priced by prompt length: a request whose prompt (input, cache reads and
// cache writes together) is over 100,000 tokens pays these prices instead.
const HAIKU_LONG_PROMPT = 100_000
const HAIKU_LONG: Rates = [0.5, 2.5, 0.05, 1]
const DEFAULT_RATES: Rates = [4, 20, 0.2, 8]
const PER_MILLION = 1e6
const SMALL_WINDOW = 200_000
const LARGE_WINDOW = 1_000_000

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

const priceOf = (model: string, prompt: number): Rates => {
  const id = model.toLowerCase()
  if (prompt > HAIKU_LONG_PROMPT && /haiku-5-5/.test(id)) return HAIKU_LONG
  return PRICES.find(([re]) => re.test(id))?.[1] ?? DEFAULT_RATES
}

// `isRequest` says the usage is one model request, which a prompt-length price is set by;
// a turn's sum is priced at the model's ordinary prices.
export const costOf = (model: string, u: Usage, isRequest: boolean): number => {
  const prompt = isRequest ? (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) : 0
  const [i, o, r, w] = priceOf(model, prompt)
  const sum =
    (u.input_tokens || 0) * i +
    (u.output_tokens || 0) * o +
    (u.cache_read_input_tokens || 0) * r +
    (u.cache_creation_input_tokens || 0) * w
  return sum / PER_MILLION
}

/** Every token a request moved: what it read, cached and wrote. */
export const tokensOf = (u: Usage): number =>
  (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)

// Haiku 4.5 and the Claude 3 models have a 200K window; the rest, Haiku 5.5 included, 1M.
export const windowOf = (model: string): number => (/haiku-4|claude-3/i.test(model) ? SMALL_WINDOW : LARGE_WINDOW)

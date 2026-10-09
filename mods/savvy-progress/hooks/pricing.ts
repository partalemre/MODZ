// USD per million tokens: input, output, cache read, cache write (5-minute TTL).
// The engine reports tokens, not money, so the panel's cost is an estimate.
type Rates = [number, number, number, number]

const PRICES: [RegExp, Rates][] = [
  [/fable|mythos/, [10, 50, 0.25, 12.5]],
  [/opus-5-5/, [4, 20, 0.2, 5]],
  [/opus/, [5, 25, 0.5, 6.25]],
  [/sonnet/, [2, 10, 0.2, 2.5]],
  [/haiku/, [1, 5, 0.1, 1.25]],
]
const DEFAULT_RATES: Rates = [4, 20, 0.2, 5]
const PER_MILLION = 1e6
const SMALL_WINDOW = 200_000
const LARGE_WINDOW = 1_000_000

export type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

const priceOf = (model: string): Rates => PRICES.find(([re]) => re.test(model.toLowerCase()))?.[1] ?? DEFAULT_RATES

export const costOf = (model: string, u: Usage): number => {
  const [i, o, r, w] = priceOf(model)
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

export const windowOf = (model: string): number => (/haiku/i.test(model) ? SMALL_WINDOW : LARGE_WINDOW)

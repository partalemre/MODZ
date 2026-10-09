import type { DeckAgent } from '../types'

export type Price = { input: number; output: number }

export type UsageLike = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export type Totals = { agents: number; tokens: number; costUsd: number }

const MILLION = 1_000_000
const CACHE_READ_RATIO = 0.1
const CACHE_WRITE_RATIO = 1.25

// Approximate USD per million tokens by model family; the `prices` option overrides it.
export const DEFAULT_PRICES: Record<string, Price> = {
  opus: { input: 5, output: 25 },
  fable: { input: 5, output: 25 },
  sonnet: { input: 3, output: 15 },
  haiku: { input: 1, output: 5 },
}

export function priceOf(model: string, overrides: Record<string, Price>): Price | null {
  const name = model.toLowerCase()
  const table = { ...DEFAULT_PRICES, ...overrides }
  const family = Object.keys(table).find(key => name.includes(key))

  return family === undefined ? null : (table[family] ?? null)
}

export function costOf(usage: UsageLike, price: Price | null): number {
  if (price === null) return 0
  const input = usage.input_tokens + usage.cache_read_input_tokens * CACHE_READ_RATIO
  const written = usage.cache_creation_input_tokens * CACHE_WRITE_RATIO

  return ((input + written) * price.input + usage.output_tokens * price.output) / MILLION
}

export function addUsage(agent: DeckAgent, spec: { usage: UsageLike; model: string; price: Price | null }): DeckAgent {
  const { usage, model, price } = spec
  const tokens = usage.input_tokens + usage.cache_creation_input_tokens + usage.output_tokens

  return { ...agent, model: agent.model ?? model, tokens: agent.tokens + tokens, costUsd: agent.costUsd + costOf(usage, price) }
}

// Config format: "family=inputUsd:outputUsd,..." per million tokens.
export function parsePrices(text: string): Record<string, Price> {
  const prices: Record<string, Price> = {}
  for (const part of text.split(',')) {
    const [family, spec] = part.split('=').map(piece => piece.trim())
    const [input, output] = (spec ?? '').split(':').map(Number)
    if (family === undefined || family === '' || input === undefined || output === undefined) continue
    if (!Number.isFinite(input) || !Number.isFinite(output)) continue
    prices[family.toLowerCase()] = { input, output }
  }

  return prices
}

export function totalsOf(agents: DeckAgent[]): Totals {
  return {
    agents: agents.length,
    tokens: agents.reduce((sum, agent) => sum + agent.tokens, 0),
    costUsd: agents.reduce((sum, agent) => sum + agent.costUsd, 0),
  }
}

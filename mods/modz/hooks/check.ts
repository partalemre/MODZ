// `/modz check`: what this session's engine answers to the questions the mods live on. A mod that gets no
// answer draws a zero or stays quiet, so a person sees "0" and "nothing happened" with no way to tell why;
// this puts each question and its answer in plain text they can read or send on. Pure text over gathered facts.
import type { EngineInterface } from 'claude-code'

import { pick, type Lang } from './kit/lang'

/** A probe's answer in words, or why none came. */
export type Probe = { isOk: boolean; said: string }
export type CheckFacts = { version: Probe; surfaces: Probe; cost: Probe; model: Probe; system: string; mods: string[] }

const PROBE_MODEL = 'haiku'
const PROBE_TIMEOUT_MS = 20_000
const PROBE_MAX_TOKENS = 8

const EN = {
  title: 'MODZ check: what Claude Code answers in this chat',
  version: 'Claude Code version',
  surfaces: 'Where this chat draws',
  cost: 'Cost reading',
  model: 'Small model (rule and safety checks)',
  system: 'System',
  mods: 'Mods on',
  none: 'none',
  noSurface: 'nowhere: a background or remote chat, panels and cards stay empty here',
  noCost: 'no reading yet: cost shows 0 until one arrives (send one message, then run this again)',
  allOk: 'Everything answered. If a panel is still empty, send this text to the mod author.',
  someFailed: 'The lines marked ✗ are why a panel shows 0 or stays quiet. Send this text to the mod author.',
}

const WORDS: Record<Lang, typeof EN> = {
  en: EN,
  tr: {
    title: 'MODZ sınaması: Claude Code bu sohbette neye cevap veriyor',
    version: 'Claude Code sürümü',
    surfaces: 'Bu sohbetin çizildiği yer',
    cost: 'Maliyet okuması',
    model: 'Küçük model (kural ve güvenlik kontrolleri)',
    system: 'Sistem',
    mods: 'Açık modlar',
    none: 'yok',
    noSurface: 'hiçbir yer: arka plan ya da uzaktan sohbet, paneller ve kartlar burada boş kalır',
    noCost: 'henüz okuma yok: gelene kadar maliyet 0 görünür (bir mesaj gönderip bunu yeniden çalıştır)',
    allOk: 'Hepsi cevap verdi. Bir panel hâlâ boşsa bu metni modun yazarına gönder.',
    someFailed: '✗ işaretli satırlar bir panelin 0 göstermesinin ya da susmasının nedeni. Bu metni modun yazarına gönder.',
  },
}

const line = (label: string, probe: Probe): string => `${probe.isOk ? '✓' : '✗'} ${label}: ${probe.said}`

export function checkText(facts: CheckFacts): string {
  const w = pick(WORDS)
  const probes = [line(w.version, facts.version), line(w.surfaces, facts.surfaces), line(w.cost, facts.cost), line(w.model, facts.model)]
  const isAllOk = [facts.version, facts.surfaces, facts.cost, facts.model].every(probe => probe.isOk)

  return [w.title, '', ...probes, `  ${w.system}: ${facts.system}`, `  ${w.mods}: ${facts.mods.join(', ') || w.none}`, '', isAllOk ? w.allOk : w.someFailed].join('\n')
}

const failed = (cause: unknown): Probe => ({ isOk: false, said: String(cause) })

async function modelProbe($: EngineInterface): Promise<Probe> {
  const reply = await $.model.complete({ model: PROBE_MODEL, prompt: 'Reply with the single word: ok', maxTokens: PROBE_MAX_TOKENS, timeoutMs: PROBE_TIMEOUT_MS })
  if (reply.isAnswered) return { isOk: true, said: PROBE_MODEL }

  return { isOk: false, said: reply.reason === 'api-error' ? `${reply.reason} ${reply.status ?? ''} ${reply.error ?? ''}`.trim() : reply.reason }
}

/** Asks the engine each question once; a question that throws is a line of its own, never a failed command. */
export async function checkFacts($: EngineInterface, mods: string[]): Promise<CheckFacts> {
  const w = pick(WORDS)
  const [version, surfaces, cost, model, os] = await Promise.all([
    $.session.version().then(v => ({ isOk: true, said: v.version }), failed),
    $.session.surfaces().then(list => (list.length > 0 ? { isOk: true, said: list.join(', ') } : { isOk: false, said: w.noSurface }), failed),
    $.session.usage().then(u => (u.cost === undefined ? { isOk: false, said: w.noCost } : { isOk: true, said: `$${u.cost.usd.toFixed(2)}` }), failed),
    modelProbe($).catch(failed),
    $.env.get('OS').catch(() => undefined),
  ])

  return { version, surfaces, cost, model, system: os === 'Windows_NT' ? 'Windows' : 'macOS / Linux', mods }
}

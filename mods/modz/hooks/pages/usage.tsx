// The Usage page, drawn by the hub from what hud-pro keeps, with hud-pro's own pure drawing (pages/index.tsx). It
// hosts the sections session-budget, cache-tax and effort-router publish; every press on it is handed to hud-pro
// through `modz.act` (hud-pro/hooks/page.ts), which does what its own pane's control does.
import type { EngineInterface, RenderElement } from 'claude-code'

import { forecastsFrom } from '../../../hud-pro/hooks/context'
import { setLang } from '../../../hud-pro/hooks/lang'
import { paceOf } from '../../../hud-pro/hooks/pace'
import { paceSection } from '../../../hud-pro/hooks/pace-section'
import { paneTree } from '../../../hud-pro/hooks/pane'
import { pastViewOf } from '../../../hud-pro/hooks/past'
import { isSection } from '../../../hud-pro/hooks/sections'
import { lang } from '../kit/lang'
import type { PageAct, PageSite } from './site'

// State refs live in each file that reads them: the engine follows literals, not imports.
const BEAT = { plugin: 'hud-pro', key: 'beat' } as const
const USAGE = { plugin: 'hud-pro', key: 'usage' } as const
const TURN = { plugin: 'hud-pro', key: 'turn' } as const
const LAST_TURN = { plugin: 'hud-pro', key: 'lastTurn' } as const
const HISTORY = { plugin: 'hud-pro', key: 'history' } as const
const COMPACTING = { plugin: 'hud-pro', key: 'isCompacting' } as const
const CONTEXT_TURNS = { plugin: 'hud-pro', key: 'contextTurns' } as const
const LAST_COMPACT = { plugin: 'hud-pro', key: 'lastCompact' } as const
const LIVE = { plugin: 'hud-pro', key: 'isLive' } as const
const PAST = { plugin: 'hud-pro', key: 'past' } as const
const RANGE = { plugin: 'hud-pro', key: 'pastRange' } as const
const SHARES = { plugin: 'hud-pro', key: 'shares' } as const
const FOCUS = { plugin: 'hud-pro', key: 'focus' } as const
const BREAKDOWN = { plugin: 'hud-pro', key: 'breakdown' } as const
const BUDGET = { plugin: 'session-budget', key: 'section' } as const
const CACHE = { plugin: 'cache-tax', key: 'section' } as const
const EFFORT = { plugin: 'effort-router', key: 'section' } as const

type Ui = Record<string, any>
// hud-pro's own shapes, taken from its functions: its types file would bring its view of every mod's state.
type View = Parameters<typeof paneTree>[1]
type Card = View['card']
type Breakdown = { view: Card['view']; compactAt: number | null } | null
type Range = Parameters<typeof pastViewOf>[1]['range']

const NO_TURN: NonNullable<View['turn']> = { requests: 0, input: 0, output: 0, cacheRead: 0 }
const WEEK: Range = 7

// Pace (hud-pro's own section), then what the other meter mods published; a value that is not a section is left out.
async function sectionsOf($: EngineInterface, o: { usage: View['usage']; history: View['history']; nowMs: number }): Promise<View['sections']['sections']> {
  const published: unknown[] = [(await $.state.get(BUDGET)).value, (await $.state.get(CACHE)).value, (await $.state.get(EFFORT)).value]
  const pace = paceOf({ usage: o.usage, history: o.history, nowMs: o.nowMs })
  const shares = ((await $.state.get(SHARES)).value ?? []) as Parameters<typeof paceSection>[0]['shares']
  const own = o.usage === null ? [] : [paceSection({ pace, shares, nowMs: o.nowMs })]

  return [...own, ...published.filter(isSection)]
}

async function cardOf($: EngineInterface, act: PageAct): Promise<{ card: Card; compactAt: number | null }> {
  const breakdown = ((await $.state.get(BREAKDOWN)).value ?? null) as Breakdown
  const card: Card = {
    view: breakdown?.view ?? null,
    turns: ((await $.state.get(CONTEXT_TURNS)).value ?? []) as Card['turns'],
    lastCompact: ((await $.state.get(LAST_COMPACT)).value ?? null) as Card['lastCompact'],
    isCompacting: (await $.state.get(COMPACTING)).value === true,
    compact: () => act('compact'),
  }

  return { card, compactAt: breakdown?.compactAt ?? null }
}

export async function usagePage($: EngineInterface, ui: Ui, site: PageSite, act: PageAct): Promise<RenderElement> {
  // hud-pro's words read its own language value, which only its own session.start sets: the hub's is the same setting.
  setLang(lang())
  await $.state.get(BEAT)
  const nowMs = await $.clock.now()
  const usage = ((await $.state.get(USAGE)).value ?? null) as View['usage']
  const history = ((await $.state.get(HISTORY)).value ?? []) as View['history']
  const turn = ((await $.state.get(TURN)).value ?? NO_TURN) as NonNullable<View['turn']>
  const { card, compactAt } = await cardOf($, act)
  const choose = (range: Range) => act('range', String(range))
  const view: View = {
    usage,
    history,
    turn: turn.requests > 0 ? turn : ((await $.state.get(LAST_TURN)).value ?? null) as View['turn'],
    columns: site.columns,
    nowMs,
    card,
    isLive: (await $.state.get(LIVE)).value === true,
    forecasts: forecastsFrom({ history, turns: card.turns, usage, compactAt }),
    past: pastViewOf(((await $.state.get(PAST)).value ?? null) as Parameters<typeof pastViewOf>[0], { range: ((await $.state.get(RANGE)).value ?? WEEK) as Range, choose }),
    // A section's button is handed on as hud-pro's pane hands it on, so the mod that owns the section hears it.
    sections: { sections: await sectionsOf($, { usage, history, nowMs }), press: (section, action) => act('press', JSON.stringify([section, action])) },
    focus: ((await $.state.get(FOCUS)).value ?? null) as string | null,
    ...(site.surface !== 'terminal' && 'Svg' in ui ? { svg: ui.Svg } : {}),
  }

  return paneTree(ui, view) as RenderElement
}

import type { AgentRun, CrabMood } from '../types'
import { fmtCost, fmtTokens } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import { FIVE_HOUR, runwayOf, SEVEN_DAY, whenText } from './runway'
import type { Runway } from './runway'
import { CHIP_H, chipCells } from './strip-chips'
import type { Chip } from './strip-chips'
import { drawingOf, fitRow } from './strip-fit'
import type { Slot } from './strip-fit'
import { layoutOf, SCENE_H, sceneSvg } from './strip-scene'
import type { Step } from './strip-scene'
import { talkOf, teamArt, teamFrom } from './strip-team'
import type { Team } from './strip-team'

export { fitRow } from './strip-fit'
import { NO_TALLY, spanText } from './strip-svg'
import type { Tally } from './strip-svg'
import { skyOf } from './sun'
import type { Place } from './sun'
import type { Weather } from './weather'

// The session strip above the prompt (desktop): a living scene over a row of chips. The scene shows the plan as
// a path and the crabs at work; the chips say the session's numbers, and each is a way in to the pane that tells
// the rest: the plan's steps, the Usage pane, the Agents pane, the modz hub.

// What the strip asks of the engine; band.tsx builds it, since `$` is followed only inside the file that got it.
export type StripIo = {
  usage: () => Promise<{ cost?: { usd: number }; rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[] } | undefined>
  now: () => Promise<number>
  // Where the machine is, for the scene's sunrise and sunset; undefined where it cannot be told.
  place: () => Promise<Place | undefined>
  // The weather there as last heard; undefined until it is known, or where it is not asked for.
  weather: () => Promise<Weather | undefined>
  // plan-steps' task list and whether the modz hub runs; undefined where that mod is not loaded.
  plan: () => Promise<unknown>
  isHubOn: () => Promise<boolean>
  // The Usage mod's own forecast for the window it watches (its recent pace), so both say the same moment.
  pace: () => Promise<unknown>
  // Who else works on this project, as the transceiver mod tells it; undefined where that mod is not loaded.
  team: () => Promise<unknown>
  tally: () => Promise<Partial<Tally>>
  agents: () => Promise<readonly AgentRun[]>
  mood: () => Promise<CrabMood>
  // Writes this mod's `teamShown`: the room whose teammate chip is drawn, or null.
  // Drawing is pure (the engine refuses a write made while ui.render runs), so `write` is done just after the draw.
  teamShown: { read: () => Promise<unknown>; write: (value: { roomId: string } | null) => void }
  // Writes this mod's `home`: the hub comes forward, or opens the pane the value names.
  home: (value: { at: number; pane?: string }) => Promise<unknown>
  run: (command: { command: string; args?: string }) => Promise<unknown>
  log: (text: string) => void
  onAgents: () => unknown
}

type Ui = Record<string, any>

// Measured on the desktop (2026-11-14): 93 reported columns in an 823 px slot, 8.85 px each; a hair under, so the
// strip never runs past its card.
const PX_PER_COL = 8.8
const DEFAULT_COLS = 100
const FULL = 100
// The hub's pane keys (each mod's hub.ts) and the command that opens the same pane where the hub is off.
const PLAN_PANE = 'plan'
const USAGE_PANE = 'usage'
const TEAM_PANE = 'transceiver'
// The way to the hub, which the row keeps whole at its right end.
const HUB_CHIP = 'modz'
const COMMAND: Readonly<Record<string, { command: string; args?: string }>> = { [PLAN_PANE]: { command: 'steps' }, [USAGE_PANE]: { command: 'hud', args: 'full' }, [TEAM_PANE]: { command: 'transceiver' } }
// The teammate fits in the room the others leave (strip-fit.ts); of them, only the 5-hour allowance, ranked the same,
// gives way to it.
const TEAM_RANK = 5

type Facts = { cost: number; tally: Tally; crew: AgentRun[]; mood: CrabMood; steps: Step[]; limits: Runway[]; now: number; isHubOn: boolean; team: Team | null }

// Another mod's list, read at the boundary: anything that is not a step is left out.
const stepsFrom = (value: unknown): Step[] =>
  Array.isArray(value)
    ? value.flatMap(one => {
        const step = one as { subject?: unknown; status?: unknown } | null

        return typeof step?.subject === 'string' && typeof step.status === 'string' ? [{ subject: step.subject, status: step.status }] : []
      })
    : []

// Where the Usage mod has measured the window's recent pace, its end moment replaces the average-pace one.
const withPace = (limits: Runway[], pace: unknown): Runway[] => {
  const told = pace as { window?: unknown; fullAt?: unknown } | null | undefined
  if (typeof told?.window !== 'string' || (told.fullAt !== null && typeof told.fullAt !== 'number')) return limits

  return limits.map(run => (run.kind === told.window && run.percent < FULL ? { ...run, endsAt: told.fullAt as number | null } : run))
}

async function factsOf(io: StripIo): Promise<Facts> {
  const usage = await io.usage().catch(() => undefined)
  const now = await io.now()

  return {
    cost: usage?.cost?.usd ?? 0,
    tally: { ...NO_TALLY, ...(await io.tally()) },
    crew: (await io.agents()).filter(a => a.status === 'running'),
    mood: await io.mood(),
    steps: stepsFrom(await io.plan().catch(() => undefined)),
    limits: withPace((usage?.rateLimits ?? []).flatMap(limit => runwayOf(limit, now) ?? []), await io.pace().catch(() => undefined)),
    now,
    isHubOn: await io.isHubOn().catch(() => false),
    team: teamFrom(await io.team().catch(() => undefined)),
  }
}

type Presses = { open: (pane: string) => () => unknown; onAgents: () => unknown; onHub: (() => unknown) | null }

function planSlot(facts: Facts, presses: Presses): Slot[] {
  if (facts.steps.length === 0) return []
  const done = facts.steps.filter(step => step.status === 'completed').length
  const current = facts.steps.find(step => step.status === 'in_progress') ?? facts.steps.find(step => step.status !== 'completed')
  const base = { id: 'plan', label: t().stripPlan, value: `${done}/${facts.steps.length}`, widest: `${facts.steps.length}/${facts.steps.length}` }
  const chip: Chip = current === undefined ? { ...base, note: t().stripPlanDone, tone: 'ok' } : { ...base, note: current.subject }

  return [{ chip, rank: 0, isNoteKept: true, press: presses.open(PLAN_PANE) }]
}

function limitSlot(run: Runway, facts: Facts, presses: Presses): Slot {
  const isWeek = run.kind === SEVEN_DAY
  const base = { id: run.kind, label: isWeek ? t().stripWeek : t().stripFive, value: t().pct(Math.round(run.percent)), widest: widest().percent, meter: run.percent }
  const rank = isWeek ? 2 : 5
  const press = presses.open(USAGE_PANE)
  if (run.percent >= FULL) return { chip: { ...base, note: t().stripFull, tone: 'danger' }, rank, isNoteKept: true, press }
  if (run.endsAt === null) return { chip: base, rank, press }

  return { chip: { ...base, note: t().stripRunsOut(whenText(run.endsAt, facts.now)), tone: 'warn' }, rank, isNoteKept: true, press }
}

// The longest reading each live value can show: its chip is that wide from the start, so the row holds still.
const widest = () => ({ cost: fmtCost(8888.8), tokens: fmtTokens(888_800_000), time: spanText(3_599_000), percent: t().pct(100) })

function slotsOf(facts: Facts, presses: Presses): Slot[] {
  const helpers = facts.crew.filter(a => a.isMain !== true).length
  const { tally: counted } = facts
  const usage = presses.open(USAGE_PANE)
  const windows = [SEVEN_DAY, FIVE_HOUR].flatMap(kind => facts.limits.find(run => run.kind === kind) ?? [])
  const room = widest()

  return [
    ...planSlot(facts, presses),
    { chip: { id: 'cost', label: t().stripCost, value: fmtCost(facts.cost), widest: room.cost }, rank: 1, press: usage },
    { chip: { id: 'tokens', label: t().stripTokens, value: fmtTokens(counted.tokens), widest: room.tokens }, rank: 3, press: usage },
    { chip: { id: 'time', label: t().stripTime, value: spanText(counted.busyMs), widest: room.time, ...(helpers > 0 ? { note: t().crew(helpers) } : {}) }, rank: 4, press: presses.onAgents },
    ...windows.map(run => limitSlot(run, facts, presses)),
    ...(facts.team === null ? [] : [{ chip: { id: 'team', label: '', value: '' }, rank: TEAM_RANK, press: presses.open(TEAM_PANE), art: teamArt(facts.team, facts.now) }]),
    ...(presses.onHub === null ? [] : [{ chip: { id: HUB_CHIP, label: '', value: 'modz', isWordmark: true }, rank: 0, press: presses.onHub }]),
  ]
}

// Which helper agents were seen at work while each step was under way, by the step's words.
// shortcut: kept in the module, so an engine restart forgets it; plan-steps keeps the lasting record.
const worked = new Map<string, Map<string, { name: string; shell: string }>>()

function withCrew(steps: readonly Step[], crew: readonly AgentRun[]): Step[] {
  const current = steps.find(step => step.status === 'in_progress')
  for (const subject of worked.keys()) if (!steps.some(step => step.subject === subject)) worked.delete(subject)
  if (current !== undefined) {
    const seen = worked.get(current.subject) ?? new Map<string, { name: string; shell: string }>()
    for (const a of crew) if (a.isMain !== true) seen.set(a.id, { name: lookOf(a).name, shell: lookOf(a).shell })
    worked.set(current.subject, seen)
  }

  return steps.map(step => ({ ...step, crew: [...(worked.get(step.subject)?.values() ?? [])] }))
}

// Where the crab last stood, so it walks to its new step once, in the draws right after the plan moved on.
const WALK_MS = 3600
const stood = { x: Number.NaN, from: Number.NaN, at: 0 }

function walkFrom(x: number, now: number): number | undefined {
  if (!Number.isNaN(stood.x) && x !== stood.x) {
    stood.from = stood.x
    stood.at = now
  }
  stood.x = x

  return now - stood.at < WALK_MS ? stood.from : undefined
}

function pressesOf(io: StripIo, facts: Facts): Presses {
  const failed = (cause: unknown) => io.log(`a strip chip could not open its pane: ${String(cause)}`)
  // With the hub on, it opens the pane in its one panel (modz hears `home`); else the pane's own command does.
  const viaHub = (pane?: string) => async () => io.home(pane === undefined ? { at: await io.now() } : { at: await io.now(), pane }).catch(failed)
  const viaCommand = (pane: string) => () => {
    const command = COMMAND[pane]

    return command === undefined ? undefined : io.run(command).catch(failed)
  }

  return { open: facts.isHubOn ? viaHub : viaCommand, onAgents: io.onAgents, onHub: facts.isHubOn ? viaHub() : null }
}

/** The strip in words, for a surface that draws no Svg. */
function stripText(facts: Facts): string {
  const done = facts.steps.filter(step => step.status === 'completed').length
  const week = facts.limits.find(run => run.kind === SEVEN_DAY)

  return [
    facts.steps.length === 0 ? '' : `${t().stripPlan} ${done}/${facts.steps.length}`,
    `${t().stripCost} ${fmtCost(facts.cost)}`,
    `${t().stripTokens} ${fmtTokens(facts.tally.tokens)}`,
    `${t().stripTime} ${spanText(facts.tally.busyMs)}`,
    week === undefined ? '' : `${t().stripWeek} ${t().pct(Math.round(week.percent))}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

// A blank that a button paints as nothing at any weight (kit/press.tsx).
const BLANK = '\u3164'

// A chip and the native button centred over it, a little narrower: the app's own rounded hover is the chip's
// only surface, so it has nothing to be out of line with.
function chipPress(ui: Ui, slot: Slot, maxW: number) {
  const { Box, Button, Svg } = ui
  const drawing = drawingOf(slot, maxW)
  const { id } = slot.chip

  return (
    <Box key={`savvy-chip-${id}`} flexShrink={0} alignSelf="flex-start">
      <Svg key={`savvy-chip-pic-${id}`} source={drawing.source} alt={drawing.alt} width={drawing.width} height={CHIP_H} />
      <Box position="absolute" top={0} bottom={0} left={0} right={0} flexDirection="row" alignItems="center" justifyContent="center">
        <Button key={`savvy-chip-press-${id}`} label={BLANK.repeat(chipCells(drawing.width))} plain onPress={slot.press} />
      </Box>
    </Box>
  )
}

// The people (the teammate) and the way to the hub sit at the row's right end, so the row ends where the scene does;
// with neither, the last chip does.
function springAt(row: readonly { slot: Slot }[], hasHub: boolean): number {
  const team = row.findIndex(({ slot }) => slot.art !== undefined)
  if (team > 0) return team
  return hasHub ? row.length : row.length - 1
}

export type StripSite = { isDesktop: boolean; cols: number }

// Said only when it changes, so the write wakes nothing on the strip's every draw.
async function sayShown(io: StripIo, roomId: string | null): Promise<void> {
  const said = (await io.teamShown.read().catch(() => undefined)) as { roomId?: unknown } | null | undefined
  if ((said?.roomId ?? null) === roomId && said !== undefined) return
  io.teamShown.write(roomId === null ? null : { roomId })
}

export async function stripOf(io: StripIo, ui: Ui, site: StripSite) {
  const seen = await factsOf(io)
  const facts = { ...seen, steps: withCrew(seen.steps, seen.crew) }
  if (!site.isDesktop) {
    await sayShown(io, null)
    const { Text } = ui

    return <Text key="savvy-strip" dimColor>{stripText(facts)}</Text>
  }
  const { Box, Svg } = ui
  const width = Math.floor((site.cols || DEFAULT_COLS) * PX_PER_COL)
  const from = facts.steps.length === 0 ? undefined : walkFrom(layoutOf({ width, steps: facts.steps }).stand, facts.now)
  const sky = { ...skyOf(facts.now, await io.place().catch(() => undefined)), weather: await io.weather().catch(() => undefined) }
  // The strip is the session's own: its helpers stand on their rows of the conversation (row-crab.ts).
  const talk = facts.team === null ? {} : { talk: talkOf(facts.team, facts.now) }
  const scene = sceneSvg({ width, crew: facts.crew.filter(a => a.isMain === true), mood: facts.mood, steps: facts.steps, sky, ...(from === undefined ? {} : { from }), ...talk })
  const fitted = fitRow(slotsOf(facts, pressesOf(io, facts)), width)
  const hub = fitted.find(({ slot }) => slot.chip.id === HUB_CHIP)
  const row = fitted.filter(one => one !== hub)
  await sayShown(io, facts.team !== null && row.some(({ slot }) => slot.art !== undefined) ? facts.team.roomId : null)
  const at = springAt(row, hub !== undefined)
  const chips = row.flatMap(({ slot, maxW }, i) => [...(i > 0 && i === at ? [<Box key="savvy-chip-spring" flexGrow={1} />] : []), chipPress(ui, slot, maxW)])

  return (
    <Box key="savvy-strip" flexDirection="column">
      <Svg key="savvy-scene" source={scene.source} alt={scene.alt} width={width} height={SCENE_H} isInteractive />
      <Box key="savvy-chips" flexDirection="row">
        {/* Should the engine's columns run wider than the slot, these chips are clipped; the way to the hub never is. */}
        <Box key="savvy-chips-fit" flexDirection="row" flexGrow={1} flexShrink={1} minWidth={0} overflow="hidden">
          {chips}
          {at === row.length ? <Box key="savvy-chip-spring" flexGrow={1} /> : null}
        </Box>
        {hub === undefined ? null : chipPress(ui, hub.slot, hub.maxW)}
      </Box>
    </Box>
  )
}

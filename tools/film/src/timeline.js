// The film's three tracks, all keyed to layout.js: where the agent walks, where the camera looks, what the captions say.
import { AGENTS, BLAST, CKPT, DESK, END, FILES, HANDOFF, HUD, PLAN, PR, PROJ, SECRET, SKINS, T, TESTS, WALL } from './layout.js'
import { EASE } from './motion.js'
import { INTRO } from './scenes/intro.js'
import { ROW_TIMES } from './scenes/desk.js'
import { STEP_DONE } from './scenes/plan.js'
import { NEWCHAT } from './scenes/people.js'
import { litAt } from './scenes/finale.js'

const center = (r, dy = 0) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 + dy })
const L = EASE.linear
const S = 2.2 // the agent's size once it is out of the chat: big enough to read as the hero
const CHECKS = [0.6, 1.3, 2.1].map(d => T.prChecks + d)

export function crabKeys(a) {
  const row = a.rowAt, ag = a.agentsRow, pip = a.pipSlot, step = a.stepAt
  const k = [
    { t: 0, x: INTRO.x, y: INTRO.y, s: INTRO.s },
    // It looks around, back, then crouches and springs: the beat before it bolts.
    { t: 2.25, x: INTRO.x, y: INTRO.y, s: INTRO.s, face: -1 },
    { t: 2.95, x: INTRO.x, y: INTRO.y, s: INTRO.s, face: 1 },
    { t: 3.3, x: INTRO.x, y: INTRO.y, s: INTRO.s },
    { t: T.dash - 0.05, x: INTRO.x + 10, y: INTRO.y, s: INTRO.s, hop: 46, ease: L },
    { t: T.dash + 1.1, x: 900, y: INTRO.y, s: 4.2, ease: EASE.in },
    { t: T.land, ...row(0), s: 1.5, hop: 260, ease: L },
  ]
  ROW_TIMES.slice(1).forEach((rt, i) => k.push({ t: rt - 0.35, ...row(i), s: 1.5 }, { t: rt - 0.02, ...row(i + 1), s: 1.5, hop: 26, ease: EASE.out }))
  k.push(
    { t: T.toAgents, ...row(3), s: 1.5 },
    { t: T.toAgents + 0.95, x: ag.x - 40, y: row(3).y, s: 1.6 },
    { t: T.press - 0.12, x: ag.x + 22, y: ag.y + ag.h - 5, s: 1.3, hop: 70, ease: L },
    { t: T.paneOpen + 0.3, x: ag.x + 22, y: ag.y + ag.h - 5, s: 1.3 },
    { t: T.paneOpen + 1.0, ...pip, s: 1.6, hop: 90, ease: L },
    // Plan: down onto the step it is working on, then one hop per finished step, like stairs.
    { t: T.toPlan, ...pip, s: 1.6 },
    { t: T.toPlan + 1.0, ...step(2), s: 1.8, hop: 140, ease: L },
  )
  for (let i = 2; i < 5; i++) k.push({ t: STEP_DONE[i] - 0.02, ...step(i), s: 1.8 }, { t: STEP_DONE[i] + 0.32, ...step(i + 1), s: 1.8, hop: 26, ease: L })
  const ground = PLAN.y + PLAN.h + 70
  k.push(
    // Safety: a run along the floor and a leap up to the command it is about to run.
    { t: T.toBlast, ...step(5), s: 1.8 },
    { t: T.toBlast + 0.35, x: PLAN.x + PLAN.w + 30, y: ground, s: S, hop: 40, ease: L },
    { t: T.toBlast + 0.7, x: 4520, y: ground, s: S, ease: L },
    { t: T.bash - 0.1, ...a.bashAt, s: 2.0, hop: 180, ease: L },
    { t: T.held, ...a.bashAt, s: 2.0 },
    { t: T.held + 0.32, x: a.bashAt.x - 30, y: a.bashAt.y, s: 2.0, hop: 34, face: 1, ease: L },
    { t: T.toSecret, x: a.bashAt.x - 30, y: a.bashAt.y, s: 2.0 },
    { t: T.toSecret + 0.45, x: BLAST.x + BLAST.w - 120, y: BLAST.y + 40, s: S, hop: 60, ease: L },
    { t: T.secret - 0.05, ...a.secretAt, s: S, hop: 110, ease: L },
    { t: T.toCkpt + 0.4, ...a.secretAt, s: S },
    { t: T.undo - 0.2, ...a.ckptAt, s: S, hop: 90, ease: L },
    // Undo: it walks backwards while the turn is taken back.
    { t: T.undo + 0.1, ...a.ckptAt, s: S },
    { t: T.undo + 1.8, x: a.ckptAt.x - 300, y: a.ckptAt.y, s: S, face: 1 },
    { t: T.toShip, x: a.ckptAt.x - 300, y: a.ckptAt.y, s: S },
    { t: T.toShip + 0.35, x: CKPT.x + CKPT.w + 50, y: CKPT.y + CKPT.h + 40, s: S, hop: 50, ease: L },
    // Ship: it lands on the Tests card as the run starts, then taps each PR check as it turns green.
    { t: T.tests, ...a.testsAt, s: S, hop: 200, ease: L },
    { t: CHECKS[0] - 0.35, ...a.testsAt, s: S },
    { t: CHECKS[0], ...a.ckAt(0), s: S, hop: 120, ease: L },
    { t: CHECKS[1] - 0.3, ...a.ckAt(0), s: S },
    { t: CHECKS[1], ...a.ckAt(1), s: S, hop: 40, ease: L },
    { t: CHECKS[2] - 0.3, ...a.ckAt(1), s: S },
    { t: CHECKS[2], ...a.ckAt(2), s: S, hop: 40, ease: L },
    // Money: it lands on Limits as the meters start, then naps on the cache card while it stays warm.
    { t: T.toMoney, ...a.ckAt(2), s: S },
    { t: T.toMoney + 0.85, ...a.hudAt, s: S, hop: 170, ease: L },
    { t: T.nap - 1.0, ...a.hudAt, s: S },
    { t: T.nap - 0.1, ...a.napAt, s: S, hop: 140, ease: L },
    { t: T.wake, ...a.napAt, s: S },
    { t: T.wake + 0.3, ...a.napAt, s: S, hop: 30, ease: L },
    // People: it taps the shop row before the board fills, carries the note, then wears each skin.
    { t: T.toPeople, ...a.napAt, s: S },
    { t: T.toPeople + 0.85, ...a.projAt, s: S, hop: 170, ease: L },
    { t: T.handoff - 0.6, ...a.projAt, s: S },
    { t: T.handoff, ...a.handAt, s: S, hop: 130, ease: L },
    { t: T.carry, ...a.handAt, s: S },
    { t: T.carry + 1.5, ...a.chatAt, s: S },
    { t: T.toSkins, ...a.chatAt, s: S },
    { t: T.toSkins + 0.7, ...a.skinsAt, s: S, hop: 160, ease: L },
    // The wall: a sprint along all 22 mods, each lighting as it passes, then up to stand with the crew.
    { t: T.toWall, ...a.skinsAt, s: S },
    { t: T.wall + 0.05, ...a.wallRun[0], s: S, hop: 160, ease: L },
    { t: T.wall + 1.0, ...a.wallRun[1], s: S, ease: L },
    { t: T.toEnd, ...a.wallRun[1], s: S },
    { t: T.word + 0.4, ...a.heroEnd, s: 2.4, hop: 220, ease: L },
    { t: T.word + 1.1, ...a.heroEnd, s: 2.4, face: 1 },
    { t: T.type + 1.78, ...a.heroEnd, s: 2.4 },
    { t: T.type + 2.2, ...a.heroEnd, s: 2.4, hop: 40, ease: L },
    { t: T.end + 1, ...a.heroEnd, s: 2.4 },
  )
  return k
}

const twoUp = (a, b, dy = 0) => ({ x: (a.x + b.x + b.w) / 2, y: (Math.min(a.y, b.y) + Math.max(a.y + a.h, b.y + b.h)) / 2 + dy })

export function cameraKeys(a) {
  const desk = center(DESK), ag = a.agentsRow
  // The Agents shot keeps the hub in frame beside the pane it opened, so nothing is cut at the edge.
  const agentsShot = { x: (ag.x - 30 + AGENTS.x + AGENTS.w) / 2, y: center(AGENTS, 40).y }
  return [
    { t: 0, x: 0, y: 20, z: 1.7 },
    { t: T.dash, x: 0, y: 10, z: 1.82, ease: EASE.out },
    { t: T.land + 0.5, x: desk.x, y: desk.y + 52, z: 1.08 },
    { t: T.toAgents, x: desk.x + 20, y: desk.y + 52, z: 1.1, ease: EASE.out },
    { t: T.press, x: ag.x + 180, y: ag.y + 120, z: 1.95 },
    { t: T.paneOpen + 1.0, ...agentsShot, z: 1.3 },
    { t: T.toPlan, ...agentsShot, z: 1.36, ease: L },
    { t: T.toPlan + 1.0, ...twoUp(PLAN, FILES, 40), z: 1.6 },
    { t: T.toBlast, ...twoUp(PLAN, FILES, 40), z: 1.64, ease: L },
    { t: T.bash + 0.15, ...center(BLAST, 70), z: 1.24 },
    { t: T.held + 0.7, ...center(BLAST, 90), z: 1.42, ease: EASE.out },
    { t: T.toSecret, ...center(BLAST, 90), z: 1.44, ease: L },
    { t: T.secret + 0.3, ...center(SECRET, 60), z: 1.55 },
    { t: T.toCkpt + 0.4, ...center(SECRET, 60), z: 1.58, ease: L },
    { t: T.undo, ...center(CKPT, 70), z: 1.6 },
    { t: T.toShip, ...center(CKPT, 70), z: 1.64, ease: L },
    { t: T.tests + 0.1, ...center(TESTS, 60), z: 1.6 },
    { t: CHECKS[0] - 0.5, ...center(TESTS, 60), z: 1.62, ease: L },
    { t: CHECKS[0] + 0.2, ...center(PR, 60), z: 1.6 },
    { t: T.toMoney, ...center(PR, 60), z: 1.63, ease: L },
    { t: T.toMoney + 0.8, ...center(HUD, 60), z: 1.48 },
    { t: T.budget - 0.4, ...center(HUD, 60), z: 1.5, ease: L },
    { t: T.budget + 0.4, x: HUD.x + HUD.w / 2, y: -40, z: 1.42 },
    { t: T.nap - 0.8, x: HUD.x + HUD.w / 2, y: -40, z: 1.43, ease: L },
    { t: T.nap + 0.1, x: HUD.x + HUD.w / 2, y: 260, z: 1.55 },
    { t: T.toPeople, x: HUD.x + HUD.w / 2, y: 260, z: 1.58, ease: L },
    { t: T.toPeople + 0.8, ...center(PROJ, 60), z: 1.5 },
    { t: T.handoff - 0.6, ...center(PROJ, 60), z: 1.52, ease: L },
    { t: T.handoff + 0.2, ...twoUp(HANDOFF, NEWCHAT, 80), z: 1.22 },
    { t: T.toSkins, ...twoUp(HANDOFF, NEWCHAT, 80), z: 1.25, ease: L },
    { t: T.toSkins + 0.7, ...center(SKINS, 60), z: 1.7 },
    { t: T.toWall, ...center(SKINS, 60), z: 1.73, ease: L },
    { t: T.wall + 0.3, ...center(WALL, 50), z: 1.28 },
    { t: T.toEnd, ...center(WALL, 50), z: 1.31, ease: L },
    { t: T.word + 0.6, x: END.x, y: END.y - 61, z: 1.2 },
    { t: T.end, x: END.x, y: END.y - 61, z: 1.34, ease: L },
  ]
}

// The camera rides with the agent while it runs, and lets go once it lands.
export function follow(path) {
  return t => {
    const w = t < T.dash ? 0 : t < T.dash + 0.6 ? EASE.inOut((t - T.dash) / 0.6) * 0.9 : t < T.land - 0.8 ? 0.9 : t < T.land + 0.3 ? 0.9 * (1 - EASE.inOut((t - T.land + 0.8) / 1.1)) : 0
    if (!w) return null
    const p = path.at(t)
    return { x: p.x + 120, y: p.y - 80, w }
  }
}

// Each line comes in a moment before its beat and stays readable for at least two seconds.
export const CAPTIONS = [
  { in: 1.5, out: 3.5, text: 'Meet your *agent.*' },
  { in: 4.1, out: 6.3, text: 'It moves faster than you can follow.' },
  { in: 8.5, out: 11.0, text: 'MODZ shows you every move.' },
  { in: 12.9, out: 15.6, text: 'See what every agent is doing.' },
  { in: 16.8, out: 18.9, text: "Know the moment it's *done.*" },
  { in: 19.4, out: 23.3, text: 'Follow the plan, step by step.' },
  { in: 25.0, out: 28.4, text: 'It stops the risky ones *first.*' },
  { in: 29.8, out: 32.6, text: 'Keeps your keys out of git.' },
  { in: 34.0, out: 36.7, text: 'Undo any turn.' },
  { in: 37.6, out: 41.9, text: 'Tests and PRs, watched for you.' },
  { in: 43.0, out: 46.3, text: 'Know what it costs, *before* it costs.' },
  { in: 46.7, out: 49.5, text: 'Take a break. The cache stays warm.' },
  { in: 50.1, out: 53.1, text: 'Every project, on one board.' },
  { in: 53.3, out: 56.6, text: 'Hand off before the context fills.' },
  { in: 57.3, out: 59.9, text: 'Make it look like *yours.*' },
  { in: 60.6, out: 64.3, text: 'Install only the ones you need.' },
]

const hops = keys => keys.filter(k => k.hop && k.hop > 60).map(k => ({ t: k.t, kind: 'land' }))
export const cues = keys => [
  { t: 0.3, kind: 'rise' }, { t: T.dash, kind: 'whoosh' }, ...hops(keys),
  ...ROW_TIMES.map(t => ({ t, kind: 'tick' })), { t: T.panelOpen, kind: 'slide' }, { t: T.press, kind: 'press' },
  { t: T.paneOpen, kind: 'open' }, { t: T.ping, kind: 'done' },
  ...STEP_DONE.filter(t => t > 0).map(t => ({ t, kind: 'tick' })),
  { t: T.held, kind: 'slam' }, { t: T.keep, kind: 'press' }, { t: T.secret, kind: 'slam' }, { t: T.moveKey, kind: 'press' },
  { t: T.undo, kind: 'rewind' }, { t: T.tests + 1.8, kind: 'pass' }, ...CHECKS.map(t => ({ t, kind: 'tick' })),
  { t: T.budget, kind: 'tick' }, { t: T.nap, kind: 'nap' }, { t: T.wake, kind: 'tick' }, { t: T.carry - 0.25, kind: 'press' },
  { t: T.carry + 1.75, kind: 'drop' }, { t: T.skin1, kind: 'slide' }, { t: T.skin2, kind: 'slide' },
  ...Array.from({ length: 22 }, (_, i) => ({ t: litAt(i), kind: 'pip' })),
  { t: T.word, kind: 'rise' }, { t: T.type, kind: 'type' }, { t: T.type + 1.8, kind: 'end' },
]

// Builds the world once, then draws any moment on request: window.FILM.render(t). The page never animates on its own.
import { makeCamera } from './camera.js'
import { makeCaptions } from './captions.js'
import { makeCrab, path as crabPath, hopSquash } from './crab.js'
import { T } from './layout.js'
import { seg } from './motion.js'
import { CAPTIONS, cues, cameraKeys, crabKeys, follow } from './timeline.js'
import * as intro from './scenes/intro.js'
import * as desk from './scenes/desk.js'
import * as agents from './scenes/agents.js'
import * as plan from './scenes/plan.js'
import * as safety from './scenes/safety.js'
import * as ship from './scenes/ship.js'
import * as money from './scenes/money.js'
import * as people from './scenes/people.js'
import * as finale from './scenes/finale.js'

const SCENES = [intro, desk, agents, plan, safety, ship, money, people, finale]

const ctx = { anchors: {}, path: null, heroVisible: false }
window.FILM_CTX = ctx
const built = SCENES.map(s => s.build(ctx))
for (const b of built) Object.assign(ctx.anchors, b.anchors)
const keys = crabKeys(ctx.anchors)
ctx.path = crabPath(keys)
const camera = makeCamera(cameraKeys(ctx.anchors), follow(ctx.path))
const captions = makeCaptions(CAPTIONS)
const worldEl = document.getElementById('world')
const overlayEl = document.getElementById('overlay')
const hero = makeCrab(worldEl, 'hero')
const hueAt = built.find(b => b.hueAt).hueAt

// The hero's mood follows the story: worried while held, happy when work lands, asleep on the break.
const MOODS = [
  { from: T.agentsDone, to: T.toPlan, mood: 'happy' },
  { from: T.held, to: T.keep + 0.35, mood: 'worried' },
  { from: T.keep + 0.35, to: T.keep + 1.4, mood: 'happy' },
  { from: T.moveKey + 0.35, to: T.moveKey + 1.2, mood: 'happy' },
  { from: T.prChecks + 2.4, to: T.toMoney, mood: 'happy' },
  { from: T.nap, to: T.wake, mood: 'sleeping' },
  { from: T.carry + 1.75, to: T.toSkins, mood: 'happy' },
  { from: T.type + 1.8, to: T.end + 1, mood: 'happy' },
]
const moodAt = t => MOODS.find(m => t >= m.from && t < m.to)?.mood
const lands = keys.filter(k => k.hop).map(k => k.t)
const landedAt = t => lands.filter(l => l <= t).pop() ?? -1

function render(t) {
  for (const b of built) b.update(t)
  const p = ctx.path.at(t), q = ctx.path.at(t - 1 / 120)
  hero.pose({
    x: p.x, y: p.y, s: p.s, lift: p.lift, walk: ctx.path.dist(t), vx: (p.x - q.x) * 120 / p.s, face: p.face,
    squash: hopSquash(p, t, landedAt(t)), mood: moodAt(t), opacity: ctx.heroVisible ? 1 : 0, hue: hueAt(t), idle: t,
  })
  camera.apply(t, worldEl)
  captions(t)
  // The ending has no captions and its own text sits low: the caption floor lifts away for it.
  overlayEl.style.setProperty('--scrim', (1 - seg(t, T.toEnd, T.word + 0.6)).toFixed(3))
}

window.FILM = { duration: T.end, fps: 60, render, cues: cues(keys), ready: document.fonts.ready }
render(0)

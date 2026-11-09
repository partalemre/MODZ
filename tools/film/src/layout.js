// Where each surface sits in the one continuous world, and when each beat happens. Scenes and the timeline read
// from here, so moving a beat moves the camera, the crab and the captions together.

export const DESK = { x: 1800, y: -430, w: 1460, h: 860 }
export const AGENTS = { x: 3330, y: -400, w: 600, h: 620 }
export const PLAN = { x: 3330, y: 330, w: 560, h: 510 }
export const FILES = { x: 3930, y: 330, w: 470, h: 510 }
export const BLAST = { x: 4700, y: -360, w: 980, h: 640 }
export const SECRET = { x: 5780, y: -360, w: 640, h: 400 }
export const CKPT = { x: 5780, y: 110, w: 640, h: 360 }
export const TESTS = { x: 6700, y: -360, w: 540, h: 400 }
export const PR = { x: 6700, y: 110, w: 540, h: 380 }
export const HUD = { x: 7560, y: -360, w: 700, h: 330 }
export const BUDGET = { x: 7560, y: 30, w: 700, h: 120 }
export const CACHE = { x: 7560, y: 200, w: 700, h: 200 }
export const PROJ = { x: 8580, y: -380, w: 640, h: 440 }
export const HANDOFF = { x: 8580, y: 120, w: 640, h: 320 }
export const SKINS = { x: 9480, y: -380, w: 620, h: 420 }
export const WALL = { x: 10400, y: -330, w: 1320, h: 560 }
export const END = { x: 11060, y: -60 }

export const T = {
  assemble: 0.3, dash: 3.9,
  land: 6.7, panelOpen: 8.3, toAgents: 10.6, press: 12.0, paneOpen: 12.2,
  agentsDone: 16.6, ping: 17.0,
  toPlan: 18.6, planStart: 19.6,
  toBlast: 23.9, bash: 25.0, held: 25.6, keep: 28.0,
  toSecret: 29.1, secret: 30.0, moveKey: 31.8,
  toCkpt: 32.9, undo: 34.4,
  toShip: 37.0, tests: 37.8, prChecks: 39.4,
  toMoney: 42.6, budget: 44.8, nap: 46.7, wake: 49.1,
  toPeople: 49.8, handoff: 53.4, carry: 54.6, toSkins: 57.0, skin1: 57.8, skin2: 58.8,
  toWall: 60.0, wall: 60.4, toEnd: 64.6, word: 65.2, crew: 66.4, type: 67.8,
  end: 72.8,
}

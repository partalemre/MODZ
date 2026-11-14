import { groundY } from './strip-land'

// The strip scene's motion, CSS only. Every loop starts and ends at its rest pose, so a frame that is drawn
// again (the kind of work changed) picks up without a jump. Easing is ease-in-out throughout: nothing snaps,
// nothing races. A reduced-motion setting stills all of it (theme.ts).

const STROLL_S = 24
// The stroll's two walks, as percents of its loop; the crab rests between them.
const WALKS: readonly [number, number][] = [
  [12, 32],
  [58, 78],
]
const STEPS = 10
const SAMPLES = 8

const eased = (f: number): number => f * f * (3 - 2 * f)

type Way = { fromX: number; toX: number; home: number; t0: number; t1: number }

// A walk over the ground as keyframes between two percents of a loop: the crab follows the land's rise and fall,
// slow at both ends. Offsets are from `home`, where the crab is drawn.
const wayFrames = (way: Way): string =>
  Array.from({ length: SAMPLES + 1 }, (_, k) => {
    const x = way.fromX + (way.toX - way.fromX) * eased(k / SAMPLES)
    const at = way.t0 + ((way.t1 - way.t0) * k) / SAMPLES

    return `${at.toFixed(1)}%{transform:translate(${(x - way.home).toFixed(1)}px,${(groundY(x) - groundY(way.home)).toFixed(1)}px)}`
  }).join('')

const WALK_S = { min: 1.2, max: 3.2, perPx: 1 / 200 }

/** The one walk from where the crab stood to where it stands now, and how long it takes. */
export const walkInCss = (fromX: number, home: number): string => {
  const seconds = Math.min(WALK_S.max, WALK_S.min + Math.abs(home - fromX) * WALK_S.perPx)

  return `<style>.walkin{animation:walkin ${seconds.toFixed(2)}s linear both}@keyframes walkin{${wayFrames({ fromX, toX: home, home, t0: 0, t1: 100 })}}</style>`
}

/** The idle stroll: out by `distance`, a long rest, back, a long rest. */
export const strollCss = (home: number, distance: number): string => {
  const [out, back] = WALKS
  if (out === undefined || back === undefined) return ''
  const far = home + distance

  return `<style>@keyframes amble{${wayFrames({ fromX: home, toX: far, home, t0: out[0], t1: out[1] })}${wayFrames({ fromX: far, toX: home, home, t0: back[0], t1: back[1] })}}</style>`
}

// Legs lift only while the stroll walks: one frame per step, the two pairs out of phase.
const legFrames = (isFirstPair: boolean): string =>
  WALKS.flatMap(([from, to]) =>
    Array.from({ length: STEPS + 1 }, (_, k) => {
      const isUp = k < STEPS && (k % 2 === 0) === isFirstPair

      return `${(from + ((to - from) * k) / STEPS).toFixed(1)}%{transform:translateY(${isUp ? -1 : 0}px)}`
    }),
  ).join('')

export const SCENE_CSS = `<style>
.br{animation:br 2.8s ease-in-out infinite}.sl{animation:br 4.6s ease-in-out infinite}
@keyframes br{50%{transform:translateY(-1.5px)}}
.lift{transition:transform .2s cubic-bezier(.2,.8,.2,1)}.who:hover .lift{transform:translateY(-4px)}
.tip{opacity:0;pointer-events:none;transition:opacity .12s ease-out}.who:hover .tip{opacity:1}
.st{transform-box:fill-box;transform-origin:center;transition:transform .18s cubic-bezier(.2,.8,.2,1)}.st:hover{transform:scale(1.6)}
.now{transform-box:fill-box;transform-origin:center;animation:now 2.2s ease-in-out infinite}
@keyframes now{50%{transform:scale(1.35);opacity:.5}}
.d1,.d2,.d3{animation:dot 1.6s ease-in-out infinite}.d2{animation-delay:.2s}.d3{animation-delay:.4s}
@keyframes dot{0%,60%,100%{transform:translateY(0);opacity:.6}30%{transform:translateY(-2.5px);opacity:1}}
.car{animation:car 1.1s steps(1) infinite}@keyframes car{50%{opacity:0}}
.ty1{animation:ty1 2.4s steps(1) infinite}.ty2{animation:ty2 2.4s steps(1) infinite}.ty3{animation:ty3 2.4s steps(1) infinite}
@keyframes ty1{0%,92%{opacity:1}93%,100%{opacity:0}}
@keyframes ty2{0%,24%{opacity:0}25%,92%{opacity:1}93%,100%{opacity:0}}
@keyframes ty3{0%,49%{opacity:0}50%,92%{opacity:1}93%,100%{opacity:0}}
.chk{stroke-dasharray:14;animation:chk .7s cubic-bezier(.2,.8,.2,1) both}@keyframes chk{from{stroke-dashoffset:14}}
.zz{animation:zz 3.4s ease-in infinite}.zz2{animation-delay:-1.7s}
@keyframes zz{0%{transform:translate(0,2px);opacity:0}25%{opacity:.9}100%{transform:translate(5px,-8px);opacity:0}}
.amble{animation:amble ${STROLL_S}s linear infinite}
.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 4s ease-in-out infinite}
@keyframes sway{0%,100%{transform:skewX(-5deg)}50%{transform:skewX(6deg)}}
.drift{animation:drift 46s ease-in-out infinite alternate}.drift2{animation-duration:64s;animation-delay:-20s}
@keyframes drift{to{transform:translateX(18px)}}
.shoot{animation:shoot 13s ease-in infinite}
@keyframes shoot{0%,90%{opacity:0;transform:translate(0,0)}92%{opacity:.9}100%{opacity:0;transform:translate(-70px,26px)}}
.halo{transform-box:fill-box;transform-origin:center;animation:halo 6s ease-in-out infinite}
@keyframes halo{50%{transform:scale(1.12);opacity:.75}}
.tw0,.tw1,.tw2{animation:tw 4.2s ease-in-out infinite}.tw1{animation-delay:-1.4s}.tw2{animation-delay:-2.8s;animation-duration:5.6s}
@keyframes tw{0%,100%{opacity:.9}50%{opacity:.25}}
.fly{animation:fly 9s ease-in-out infinite}.fly1{animation-delay:-3s;animation-duration:11s}.fly2{animation-delay:-6s;animation-duration:13s}
@keyframes fly{0%,100%{transform:translate(0,0);opacity:0}20%{opacity:.9}50%{transform:translate(14px,-9px);opacity:.3}75%{transform:translate(26px,-3px);opacity:.9}}
.wave{transform-box:fill-box;transform-origin:0 50%;animation:wave 2.4s ease-in-out infinite}
@keyframes wave{50%{transform:skewY(-9deg) scaleX(.88)}}
.amble .la{animation:la ${STROLL_S}s steps(1) infinite}.amble .lb{animation:lb ${STROLL_S}s steps(1) infinite}
@keyframes la{0%{transform:translateY(0)}${legFrames(true)}}
@keyframes lb{0%{transform:translateY(0)}${legFrames(false)}}
</style>`

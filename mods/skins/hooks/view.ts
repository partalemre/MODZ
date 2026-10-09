import type { Elements, Frozen, RenderElement, RenderInput, RenderSurface } from 'claude-code'

import type { TurnStats, UsageSnap } from '../types'
import type { Active, Look } from './look'

// The width a drawing is laid out for when its surface reports none.
export const DEFAULT_COLUMNS = 100

// The engine's reach for one drawing, bound in register.tsx: the engine follows `$` only into
// functions of the hooks module's own file, so the render modules get this port instead.
export type View = {
  active(): Promise<Active | null>
  ui(): Elements[RenderSurface]
  // The look for the surface drawing; `isCopying` gives it a clipboard.
  look(active: Active, isCopying?: boolean): Look
  cwd(): Promise<string>
  now(): Promise<number>
  // This call's time, -1 until it has one.
  duration(): Promise<number>
  hasImages(): Promise<boolean>
  frame(): Promise<number>
  startedAt(): Promise<number>
  turns(): Promise<Record<string, TurnStats>>
  usage(): Promise<UsageSnap>
  isCompacting(): Promise<boolean>
  compact(): void
  // The width a reply was drawn at, kept for /skin list.
  drewAt(columns: number | undefined): void
}

// Claude Code's own drawing, of the event as it came or as rewritten.
export type Pass<C extends RenderInput['component']> = (e: Frozen<RenderInput<C>>) => Promise<RenderElement>

export type Drawing<C extends RenderInput['component']> = { view: View; e: Frozen<RenderInput<C>>; pass: Pass<C> }

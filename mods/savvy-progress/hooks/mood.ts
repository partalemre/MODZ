import type { CrabMood, HomeCrab } from '../types'

// The home crab's state machine, its pure half: it sleeps until a turn runs, works through it,
// is happy when the turn answered and worried when it errored or was stopped, then naps again
// once the session has rested a while. Its level counts every answered turn on this machine.

const MINUTE = 60 * 1000
/** How long after a turn ends the crab keeps its happy or worried face before it naps. */
export const REST_MS = 10 * MINUTE
/** Answered turns that open each level after the first: Lv 2 at 10, Lv 3 at 50, Lv 4 at 200, Lv 5 at 1000. */
export const LEVELS = [10, 50, 200, 1000] as const
/** The store key every session counts answered turns under. */
export const TURNS_KEY = 'crab/turns'

export type TurnEnd = 'answer' | 'aborted' | 'refusal' | 'error'

export const restingCrab = (turns: number): HomeCrab => ({ mood: 'sleeping', turns, endedAt: 0 })

export const levelOf = (turns: number): number => 1 + LEVELS.filter(threshold => turns >= threshold).length

export const started = (crab: HomeCrab): HomeCrab => ({ ...crab, mood: 'working' })

/** A main-loop turn ended: an answer counts and cheers it up; anything else worries it. */
export const ended = (crab: HomeCrab, end: { reason: TurnEnd; at: number }): HomeCrab => {
  const isAnswer = end.reason === 'answer'
  return { mood: isAnswer ? 'happy' : 'worried', turns: crab.turns + (isAnswer ? 1 : 0), endedAt: end.at }
}

/** After a long enough rest a happy or worried crab falls asleep; a working one never does. */
export const rested = (crab: HomeCrab, now: number): HomeCrab => {
  const isAwake = crab.mood === 'happy' || crab.mood === 'worried'
  return isAwake && now - crab.endedAt >= REST_MS ? { ...crab, mood: 'sleeping' } : crab
}

/** Whether the session is idle for the crab: anything but a running turn. */
export const isIdleMood = (mood: CrabMood): boolean => mood !== 'working'

/** The count a store holds, read at the boundary: anything but a whole number ≥ 0 counts as none. */
export const turnsFrom = (value: unknown): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0

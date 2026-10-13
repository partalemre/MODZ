import type { TouchRole, TurnLog } from '../types'
import type { Host } from './host'
import { HUB_PANE, hubOf, isSameCard } from './hub'
import { type Attributed, merge, NO_COST } from './readcost'

export const NO_TURN: TurnLog = { isRunning: false, hasRun: false, touches: [], sha: '', committed: 0, costs: {} }
const TOUCH_RANK: Record<TouchRole, number> = { read: 0, edit: 1, commit: 2 }
const TOUCH_LIMIT = 200

// The MODZ main panel's card, from what the pane itself shows: this turn's files, then git.
export async function syncHub(h: Host): Promise<void> {
  const t = await h.tree()
  const turn = await h.turn()
  const changed = (t.counts[t.root] ?? [0, 0, 0]).reduce((a, b) => a + b, 0)
  const edited = turn.touches.filter(x => x.role !== 'read').length
  const shown = hubOf({ isRunning: turn.isRunning, touched: turn.touches.length, hasRepo: Boolean(t.top), changed, edited, sha: turn.sha })
  if (isSameCard(await h.hubCard(), shown)) return
  await h.setHubCard({ pane: HUB_PANE, ...shown, at: await h.now() })
}

// Claude's files this turn, in the order first touched; a later touch can only raise the role.
export async function noteTouches(h: Host, ids: string[], role: TouchRole): Promise<void> {
  if (ids.length === 0) return
  const at = await h.now()
  await h.setTurn(cur => {
    const log = { ...NO_TURN, ...cur, hasRun: true }
    const touches = [...log.touches]
    for (const id of ids) {
      const i = touches.findIndex(x => x.id === id)
      const old = touches[i]
      if (!old) touches.push({ id, role, at })
      else touches[i] = { id, role: TOUCH_RANK[role] > TOUCH_RANK[old.role] ? role : old.role, at }
    }
    return { ...log, touches: touches.slice(-TOUCH_LIMIT) }
  })
  await syncHub(h)
}

export async function noteCommit(h: Host, fields: { sha?: string; committed?: number }): Promise<void> {
  await h.setTurn(cur => ({ ...NO_TURN, ...cur, hasRun: true, ...fields }))
  await syncHub(h)
}

// What reads put into context: by file for this turn, summed for the session.
export async function noteCosts(h: Host, list: readonly Attributed[]): Promise<void> {
  if (list.length === 0) return
  await h.setTurn(cur => {
    const costs = { ...cur.costs }
    for (const { file, cost } of list) costs[file] = merge(costs[file], cost)
    return { ...NO_TURN, ...cur, costs }
  })
  await h.setReadTotal(cur => list.reduce((acc, { cost }) => merge(acc, cost), cur ?? NO_COST))
}

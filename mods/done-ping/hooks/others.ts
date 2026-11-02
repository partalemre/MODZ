import type { OtherNeed } from '../types'

// Other Claude Code sessions on this computer that wait on you, adapted from Atoll92/agent-standup's band (MIT).
// Each session keeps its status in <config dir>/sessions/<pid>.json; one that crashed leaves its file behind, so `ps`
// confirms the process still runs. Only that folder is read, and nothing is sent anywhere.

export const POLL_MS = 4_000
const PS_TIMEOUT_MS = 5_000

type Status = { pid?: unknown; sessionId?: unknown; status?: unknown; waitingFor?: unknown; cwd?: unknown; name?: unknown; nameSource?: unknown; entrypoint?: unknown }

// What the engine lends this module: `$` itself never crosses an import.
export type OthersIo = {
  // CLAUDE_CONFIG_DIR, else ~/.claude.
  configDir: () => Promise<string>
  list: (path: string) => Promise<readonly { name: string; kind: string }[]>
  read: (path: string) => Promise<string>
  run: (argv: string[], init: { timeoutMs: number }) => Promise<{ stdout: string }>
  sessionId: () => Promise<string>
}

// "web-shop · release": the folder, then the name the person gave the session (not one Claude Code derived).
export function whereOf(s: Status): string {
  const folder = (typeof s.cwd === 'string' ? s.cwd : '').split(/[\\/]/).filter(Boolean).pop() ?? 'Claude'
  const isNamed = typeof s.name === 'string' && s.name !== '' && s.nameSource !== 'derived'

  return isNamed ? `${folder} · ${s.name}` : folder
}

// Waiting, not on a dialog the person opened there (/model, /config), and not a `claude -p` run whose asks go to its program.
export function isWaiting(s: Status, self: string): boolean {
  const isOther = typeof s.sessionId === 'string' && s.sessionId !== self
  const isProgram = s.entrypoint === 'sdk-cli'

  return isOther && !isProgram && s.status === 'waiting' && s.waitingFor !== 'dialog open'
}

async function sessionsDir(io: OthersIo): Promise<string> {
  return `${(await io.configDir()).replace(/[\\/]+$/, '')}/sessions`
}

async function statuses(io: OthersIo, dir: string): Promise<Status[]> {
  const entries = await io.list(dir).catch(() => [])
  const names = entries.filter(f => f.kind === 'file' && /^\d+\.json$/.test(f.name)).map(f => f.name)
  // A file being written, or one that is not Claude Code's, reads as null and is skipped.
  const rows = await Promise.all(names.map(name => io.read(`${dir}/${name}`).then(text => JSON.parse(String(text)) as Status).catch(() => null)))

  return rows.filter((row): row is Status => row !== null && typeof row === 'object')
}

async function alive(io: OthersIo, pids: readonly number[]): Promise<Set<number>> {
  if (pids.length === 0) return new Set()
  try {
    // ps exits 1 when none of them runs: nothing is listed then.
    const { stdout } = await io.run(['ps', '-o', 'pid=', '-p', pids.join(',')], { timeoutMs: PS_TIMEOUT_MS })

    return new Set(stdout.split(/\s+/).filter(Boolean).map(Number))
  } catch {
    // No ps (Windows): every file is taken at its word.
    return new Set(pids)
  }
}

async function waitingOthers(io: OthersIo, dir: string): Promise<OtherNeed[]> {
  const self = await io.sessionId()
  const waiting = (await statuses(io, dir)).filter(s => isWaiting(s, self))
  const live = await alive(io, waiting.map(s => Number(s.pid)).filter(pid => Number.isInteger(pid) && pid > 0))

  return waiting
    .filter(s => live.has(Number(s.pid)))
    .map(s => ({ key: `${String(s.sessionId)}:${String(s.waitingFor)}`, where: whereOf(s), isApproval: s.waitingFor === 'permission prompt' }))
}

// Each look returns the waits to show, or null when a newer look already answered (a slow ps can let an older one
// end last, and the row must never go back in time). The session id is read each look: /clear and resume change it.
export function othersWatcher(io: OthersIo): { look: () => Promise<OtherNeed[] | null>; hide: (list: readonly OtherNeed[]) => void } {
  let dir: string | null = null
  let looks = 0
  let applied = 0
  // The waits put away with ✕: each stays away until it ends, so the same session asking again shows.
  let hidden: ReadonlySet<string> = new Set()

  return {
    look: async () => {
      const mine = ++looks
      dir ??= await sessionsDir(io)
      const list = await waitingOthers(io, dir)
      if (mine < applied) return null
      applied = mine
      hidden = new Set([...hidden].filter(key => list.some(need => need.key === key)))

      return list.filter(need => !hidden.has(need.key))
    },
    hide: list => {
      hidden = new Set([...hidden, ...list.map(need => need.key)])
    },
  }
}

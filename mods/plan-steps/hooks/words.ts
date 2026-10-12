import { pick } from './lang'
import type { Lang } from './lang'

// Every word the mod shows the person, English and Turkish. Read through `words()` at draw time, since the
// language is set at session.start. Turkish counts take no plural suffix; English ones do.

type Count = (n: number) => string
type Pair = (done: number, total: number) => string

export type Words = {
  units: { second: string; minute: string; hour: string }
  percent: (value: number, isEstimate: boolean) => string
  left: (duration: string) => string
  headline: Pair
  drawnCount: Pair
  hubDone: Count
  hubUnstarted: Count
  hubWaiting: Pair
  hubLive: Pair
  checks: Pair
  files: Count
  agentsDone: Count
  moreSteps: Count
  moreFiles: Count
  notStarted: string
  waitingSince: (duration: string) => string
  allDone: string
  now: string
  running: string
  emptyLead: string
  emptyHow: string
  tasksLabel: string
  approvedLabel: string
  subagent: string
  stepTitle: Count
  command: string
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

const EN: Words = {
  units: { second: 's', minute: 'm', hour: 'h' },
  percent: (value, isEstimate) => `${isEstimate ? '≈' : ''}${value}%`,
  left: duration => `≈${duration} left`,
  headline: (done, total) => `${done}/${plural(total, 'step', 'steps')}`,
  drawnCount: (done, total) => `${done} / ${plural(total, 'step', 'steps')}`,
  hubDone: total => `${total} of ${total} done`,
  hubUnstarted: total => `${plural(total, 'step', 'steps')} · not started`,
  hubWaiting: (done, total) => `${done} of ${plural(total, 'step', 'steps')} · waiting`,
  hubLive: (done, total) => `${done} of ${plural(total, 'step', 'steps')}`,
  checks: (done, total) => `${done}/${plural(total, 'item', 'items')}`,
  files: n => plural(n, 'file', 'files'),
  agentsDone: n => `${plural(n, 'agent', 'agents')} done`,
  moreSteps: n => plural(n, 'more step', 'more steps'),
  moreFiles: n => `+${plural(n, 'more file', 'more files')}`,
  notStarted: 'not started',
  waitingSince: duration => `waiting · ${duration} ago`,
  allDone: 'done',
  now: 'now',
  running: 'running',
  emptyLead: 'No plan yet',
  emptyHow: 'steps show up here once a task list or an approved plan arrives',
  tasksLabel: 'task list',
  approvedLabel: 'approved plan',
  subagent: 'subagent',
  stepTitle: n => `Step ${n}`,
  command: 'Open the pane that shows the plan steps and where the work is',
}

const TR: Words = {
  units: { second: 'sn', minute: 'dk', hour: 'sa' },
  percent: (value, isEstimate) => `${isEstimate ? '~' : ''}%${value}`,
  left: duration => `kalan ~${duration}`,
  headline: (done, total) => `${done}/${total} adım`,
  drawnCount: (done, total) => `${done} / ${total} adım`,
  hubDone: total => `${total}/${total} bitti`,
  hubUnstarted: total => `${total} adım · başlamadı`,
  hubWaiting: (done, total) => `${done}/${total} adım · bekliyor`,
  hubLive: (done, total) => `${done}/${total} adım`,
  checks: (done, total) => `${done}/${total} madde`,
  files: n => `${n} dosya`,
  agentsDone: n => `${n} ajan bitti`,
  moreSteps: n => `${n} adım daha`,
  moreFiles: n => `+${n} dosya daha`,
  notStarted: 'başlamadı',
  waitingSince: duration => `bekliyor · ${duration} önce`,
  allDone: 'tamam',
  now: 'şimdi',
  running: 'çalışıyor',
  emptyLead: 'Henüz plan yok',
  emptyHow: 'görev listesi ya da onaylı bir plan gelince adımlar burada belirir',
  tasksLabel: 'görev listesi',
  approvedLabel: 'onaylı plan',
  subagent: 'alt ajan',
  stepTitle: n => `Adım ${n}`,
  command: 'Plandaki adımları ve işin nerede olduğunu gösteren paneli aç',
}

const WORDS: Record<Lang, Words> = { en: EN, tr: TR }

export const words = (): Words => pick(WORDS)

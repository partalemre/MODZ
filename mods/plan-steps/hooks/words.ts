import { pick } from './kit/lang'
import type { Lang } from './kit/lang'

// Every word the mod shows the person, English and Turkish. Read through `words()` at draw time, since the
// language is set at session.start. Turkish counts take no plural suffix; English ones do.

type Count = (n: number) => string
type Pair = (done: number, total: number) => string

export type Words = {
  units: { second: string; minute: string; hour: string }
  left: (duration: string) => string
  headline: Pair
  drawnCount: Pair
  drawnPlanned: Count
  hubDone: Count
  hubUnstarted: Count
  hubWaiting: Pair
  hubLive: Pair
  checks: Pair
  files: Count
  agentsDone: Count
  moreSteps: Count
  earlierSteps: Count
  moreFiles: Count
  notStarted: string
  waitingSince: (duration: string) => string
  allDone: string
  now: string
  running: string
  // Above the plain list, when the pane's drawing failed.
  paneFailed: string
  emptyLead: string
  emptyHow: string
  tasksLabel: string
  approvedLabel: string
  subagent: string
  stepTitle: Count
  command: string
  finishEyebrow: string
  finishHeadline: Pair
  finishNext: (title: string) => string
  finishContinue: string
  finishMarkDone: string
  finishNotNow: string
  continuePrompt: (title: string) => string
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

const EN: Words = {
  units: { second: 's', minute: 'm', hour: 'h' },
  left: duration => `≈${duration} left`,
  headline: (done, total) => `${done}/${plural(total, 'step', 'steps')}`,
  drawnCount: (done, total) => (done === total ? `All ${plural(total, 'step', 'steps')} done` : `${done} of ${plural(total, 'step', 'steps')} done`),
  drawnPlanned: total => plural(total, 'step', 'steps'),
  hubDone: total => `${total} of ${total} done`,
  hubUnstarted: total => `${plural(total, 'step', 'steps')} · not started`,
  hubWaiting: (done, total) => `${done} of ${plural(total, 'step', 'steps')} · waiting`,
  hubLive: (done, total) => `${done} of ${plural(total, 'step', 'steps')}`,
  checks: (done, total) => `${done}/${plural(total, 'item', 'items')}`,
  files: n => plural(n, 'file', 'files'),
  agentsDone: n => `${plural(n, 'helper agent', 'helper agents')} done`,
  moreSteps: n => plural(n, 'more step', 'more steps'),
  earlierSteps: n => plural(n, 'earlier step', 'earlier steps'),
  moreFiles: n => `+${plural(n, 'more file', 'more files')}`,
  notStarted: 'not started',
  waitingSince: duration => `waiting · ${duration} ago`,
  allDone: 'done',
  now: 'now',
  running: 'running',
  paneFailed: 'The plan could not be drawn; here is the plain list.',
  emptyLead: 'No plan yet',
  emptyHow: 'steps show up here once a task list or an approved plan arrives',
  tasksLabel: 'task list',
  approvedLabel: 'approved plan',
  subagent: 'helper agent',
  stepTitle: n => `Step ${n}`,
  command: 'Open the panel that shows the plan steps and where the work is',
  finishEyebrow: 'Plan',
  finishHeadline: (open, total) => `${open} of ${plural(total, 'step', 'steps')} still open`,
  finishNext: title => `Next: ${title}`,
  finishContinue: 'Continue the plan',
  finishMarkDone: 'Mark plan done',
  finishNotNow: 'Not now',
  continuePrompt: title => `Continue the plan with the next open step: ${title}. Keep the task list current as you go.`,
}

const TR: Words = {
  units: { second: 'sn', minute: 'dk', hour: 'sa' },
  left: duration => `kalan ~${duration}`,
  headline: (done, total) => `${done}/${total} adım`,
  drawnCount: (done, total) => (done === total ? `${total} adımın hepsi bitti` : `${done}/${total} adım bitti`),
  drawnPlanned: total => `${total} adım`,
  hubDone: total => `${total}/${total} bitti`,
  hubUnstarted: total => `${total} adım · başlamadı`,
  hubWaiting: (done, total) => `${done}/${total} adım · bekliyor`,
  hubLive: (done, total) => `${done}/${total} adım`,
  checks: (done, total) => `${done}/${total} madde`,
  files: n => `${n} dosya`,
  agentsDone: n => `${n} yardımcı ajan bitti`,
  moreSteps: n => `${n} adım daha`,
  earlierSteps: n => `Önceki ${n} adım`,
  moreFiles: n => `+${n} dosya daha`,
  notStarted: 'başlamadı',
  waitingSince: duration => `bekliyor · ${duration} önce`,
  allDone: 'tamam',
  now: 'şimdi',
  running: 'çalışıyor',
  paneFailed: 'Plan çizilemedi, düz liste gösteriliyor.',
  emptyLead: 'Henüz plan yok',
  emptyHow: 'görev listesi ya da onaylı bir plan gelince adımlar burada belirir',
  tasksLabel: 'görev listesi',
  approvedLabel: 'onaylı plan',
  subagent: 'yardımcı ajan',
  stepTitle: n => `Adım ${n}`,
  command: 'Plandaki adımları ve işin nerede olduğunu gösteren paneli aç',
  finishEyebrow: 'Plan',
  finishHeadline: (open, total) => `${open}/${total} adım hâlâ açık`,
  finishNext: title => `Sıradaki: ${title}`,
  finishContinue: 'Plana devam et',
  finishMarkDone: 'Planı bitti say',
  finishNotNow: 'Şimdi değil',
  continuePrompt: title => `Plana sıradaki açık adımla devam et: ${title}. Görev listesini ilerledikçe güncel tut.`,
}

const WORDS: Record<Lang, Words> = { en: EN, tr: TR }

export const words = (): Words => pick(WORDS)

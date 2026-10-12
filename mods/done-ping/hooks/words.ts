import { pick } from './lang'

// Every word the notifications, the fallback band and the command answers show, in English and Turkish.
// Read through `words()` when a ping is built or a command answers: the language is set at session.start.

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

const TR = {
  hours: (hours: number, minutes: number) => `${hours}sa ${minutes}dk`,
  minutes: (minutes: number, seconds: number) => `${minutes}dk ${seconds}sn`,
  seconds: (seconds: number) => `${seconds}sn`,
  testsPassed: 'testler geçti',
  testsFailed: 'testler kaldı',
  files: (count: number) => `${count} dosya`,
  filesChanged: (count: number) => `${count} dosya değişti`,
  took: (duration: string) => `${duration} sürdü`,
  done: 'Tur bitti',
  bashCommand: 'Bash komutu',
  toolPermission: (tool: string) => `${tool} izni`,
  waitingApproval: 'Onay bekliyor',
  waitingAnswer: 'Cevap bekliyor',
  hasQuestion: 'Bir sorusu var',
  testSent: 'done-ping: deneme bildirimi gönderildi',
  usage: 'Kullanım: /done-ping [saniye | 2m | test]',
  thresholdSet: (seconds: number) => `done-ping: ${seconds}sn üstü turlarda bildirir`,
  switched: (isOn: boolean, seconds: number) => `done-ping ${isOn ? 'açık' : 'kapalı'} · eşik ${seconds}sn`,
  help: 'Bildirimi aç/kapat; "/done-ping 90" eşiği ayarlar, "test" bir kez çalar',
}

type Words = typeof TR

const EN: Words = {
  hours: (hours, minutes) => `${hours}h ${minutes}m`,
  minutes: (minutes, seconds) => `${minutes}m ${seconds}s`,
  seconds: seconds => `${seconds}s`,
  testsPassed: 'tests passed',
  testsFailed: 'tests failed',
  files: count => plural(count, 'file', 'files'),
  filesChanged: count => `${plural(count, 'file', 'files')} changed`,
  took: duration => `took ${duration}`,
  done: 'Turn finished',
  bashCommand: 'Bash command',
  toolPermission: tool => `${tool} permission`,
  waitingApproval: 'Waiting for approval',
  waitingAnswer: 'Waiting for an answer',
  hasQuestion: 'Has a question',
  testSent: 'done-ping: test notification sent',
  usage: 'Usage: /done-ping [seconds | 2m | test]',
  thresholdSet: seconds => `done-ping: pings after turns longer than ${seconds}s`,
  switched: (isOn, seconds) => `done-ping ${isOn ? 'on' : 'off'} · threshold ${seconds}s`,
  help: 'Turn the ping on or off; "/done-ping 90" sets the threshold, "test" rings once',
}

export const words = (): Words => pick({ en: EN, tr: TR })

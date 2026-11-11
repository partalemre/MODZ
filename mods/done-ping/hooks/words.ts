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
  stoppedOnError: 'Hatayla durdu',
  refused: 'Claude reddetti',
  bannersOff: 'done-ping: terminal-notifier bildirimleri Sistem Ayarları › Bildirimler bölümünde kapalı; macOS’un yerleşik yolu (osascript) kullanılıyor',
  bashCommand: 'komut çalıştırma izni',
  toolPermission: (tool: string) => `${tool} izni`,
  // Built-in tools by what they do, for a person who never saw the tool's name.
  tools: {
    Edit: 'dosya düzenleme', MultiEdit: 'dosya düzenleme', Write: 'dosya yazma', Read: 'dosya okuma',
    NotebookEdit: 'not defteri düzenleme', Glob: 'dosya arama', Grep: 'dosya arama',
    WebFetch: 'web sayfası', WebSearch: 'web araması', Agent: 'yardımcı ajan', Task: 'yardımcı ajan',
  } as Record<string, string>,
  waitingApproval: 'Onay bekliyor',
  waitingAnswer: 'Cevap bekliyor',
  hasQuestion: 'Bir sorusu var',
  more: (count: number) => `ve ${count} sohbet daha`,
  testSent: 'done-ping: deneme bildirimi gönderildi',
  usage: 'Şöyle yazılır: /done-ping [saniye | 2m | test]',
  thresholdSet: (seconds: number) => `done-ping: ${seconds}sn’den uzun süren turlarda haber verir`,
  switched: (isOn: boolean, seconds: number) => `done-ping ${isOn ? 'açık' : 'kapalı'} · ${seconds}sn’den uzun turlarda`,
  help: 'Bildirimi aç/kapat; "/done-ping 90" bir turun en az ne kadar sürmesi gerektiğini ayarlar, "test" bir kez çalar',
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
  stoppedOnError: 'Stopped on an error',
  refused: 'Claude declined',
  bannersOff: 'done-ping: terminal-notifier notifications are turned off in System Settings › Notifications; using the built-in macOS way (osascript)',
  bashCommand: 'permission to run a command',
  toolPermission: tool => `${tool} permission`,
  tools: {
    Edit: 'file edit', MultiEdit: 'file edit', Write: 'file write', Read: 'file read',
    NotebookEdit: 'notebook edit', Glob: 'file search', Grep: 'file search',
    WebFetch: 'web page', WebSearch: 'web search', Agent: 'helper agent', Task: 'helper agent',
  },
  waitingApproval: 'Waiting for approval',
  waitingAnswer: 'Waiting for an answer',
  hasQuestion: 'Has a question',
  more: count => `and ${plural(count, 'more chat', 'more chats')}`,
  testSent: 'done-ping: test notification sent',
  usage: 'Write it as: /done-ping [seconds | 2m | test]',
  thresholdSet: seconds => `done-ping: tells you when a turn runs longer than ${seconds}s`,
  switched: (isOn, seconds) => `done-ping ${isOn ? 'on' : 'off'} · for turns over ${seconds}s`,
  help: 'Turn the notification on or off; "/done-ping 90" sets how long a turn must run before it tells you, "test" rings once',
}

export const words = (): Words => pick({ en: EN, tr: TR })

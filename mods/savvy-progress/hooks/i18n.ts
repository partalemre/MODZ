// Turkish by default; `auto` follows Claude Code's `language` setting, then the locale.
export type Lang = 'tr' | 'en' | 'ru'

type Strings = {
  pane: string
  cost: string
  tokens: string
  time: string
  collapse: string
  expand: string
  running: string
  finished: string
  planned: string
  empty: string
  emptyTitle: string
  round: string
  failed: string
  aborted: string
  tokensWord: string
  agentsCount: string
  isRunning: string
  isFinished: string
  isPlanned: string
  opened: string
  closed: string
  done: string
  plan: string
  design: string
  tasks: string
  review: string
  agents: string
  busy: string
  total: string
  completed: string
  starting: string
  dismiss: string
  brief: string
  history: string
  result: string
  noCalls: string
  message: string
  messageHint: string
  send: string
  stop: string
  delivered: string
  stopAsked: string
  stopRefused: string
  stopFailed: string
  allDone: string
  context: string
  limit: string
  limitTile: string
  kinds: Record<'read' | 'edit' | 'run' | 'agent' | 'other', string>
  cheerDone: string
  cheerFailed: string
  shareOf: (share: string) => string
  earlier: (n: number) => string
  after: (list: string) => string
  tools: (n: number) => string
  errors: (n: number) => string
  crew: (n: number) => string
  liveCount: (n: number) => string
  endedCount: (n: number) => string
  plannedCount: (n: number) => string
  notDelivered: (reason: string) => string
  pct: (n: number | string) => string
  // The decimal mark numbers are written with: "1,68" in Turkish and Russian, "1.68" in English.
  decimal: string
}

const tr: Strings = {
  pane: 'Ajanlar',
  cost: 'Maliyet',
  tokens: 'Token',
  time: 'Süre',
  collapse: 'Daralt',
  expand: 'Genişlet',
  running: 'Çalışıyor',
  finished: 'Bitti',
  planned: 'Planlı',
  emptyTitle: 'Henüz ajan yok',
  empty: 'Bir alt ajan başlayınca durumu, ilerlemesi ve maliyeti burada görünür.',
  round: 'tur',
  failed: 'hata',
  aborted: 'durduruldu',
  tokensWord: 'token',
  agentsCount: 'ajan',
  isRunning: 'çalışıyor',
  isFinished: 'bitti',
  isPlanned: 'planlı',
  opened: 'Ajanlar paneli açıldı.',
  closed: 'Ajanlar paneli kapandı.',
  done: 'Bitti',
  plan: 'Plan',
  design: 'Tasarım',
  tasks: 'Görevler',
  review: 'Gözden geçirme',
  agents: 'Ajanlar',
  busy: 'çalışıyor',
  total: 'toplam',
  completed: 'tamamlandı',
  starting: 'başlıyor',
  dismiss: 'Kapat',
  brief: 'Görev',
  history: 'İş geçmişi',
  result: 'Sonuç',
  noCalls: 'Henüz araç çağrısı yok.',
  context: 'bağlam',
  limit: '5 saat',
  limitTile: '5 saat payı',
  kinds: { read: 'okuma', edit: 'düzenleme', run: 'komut', agent: 'ajan', other: 'diğer' },
  cheerDone: '(ᵔᴗᵔ) bitirdim',
  cheerFailed: '(×_×) olmadı',
  shareOf: share => `5 saatlik limitin ≈%${share} kadarı`,
  earlier: n => `${n} önceki adım gizli`,
  after: list => `${list} sonrası`,
  tools: n => `${n} araç`,
  errors: n => `${n} hata`,
  crew: n => `${n} ajan`,
  pct: n => `%${n}`,
  decimal: ',',
  message: 'Mesaj',
  messageHint: 'Bu ajana bir şey söyle, Enter gönderir',
  send: 'gönder',
  stop: 'Durdur',
  delivered: 'Mesaj iletildi',
  stopAsked: 'Durdurma istendi',
  stopRefused: 'Durdurma reddedildi',
  stopFailed: 'Bu ajan durdurulamadı',
  allDone: 'Hepsi bitti',
  liveCount: n => `${n} çalışıyor`,
  endedCount: n => `${n} bitti`,
  plannedCount: n => `${n} planlı`,
  notDelivered: reason => `İletilemedi: ${reason}`,
}

const en: Strings = {
  pane: 'Agents',
  cost: 'Cost',
  tokens: 'Tokens',
  time: 'Time',
  collapse: 'Collapse',
  expand: 'Expand',
  running: 'Running',
  finished: 'Finished',
  planned: 'Planned',
  emptyTitle: 'No agents yet',
  empty: 'Once a subagent starts, its status, progress and cost show here.',
  round: 'round',
  failed: 'error',
  aborted: 'stopped',
  tokensWord: 'tokens',
  agentsCount: 'agents',
  isRunning: 'running',
  isFinished: 'finished',
  isPlanned: 'planned',
  opened: 'Agents panel opened.',
  closed: 'Agents panel closed.',
  done: 'Done',
  plan: 'Plan',
  design: 'Design',
  tasks: 'Tasks',
  review: 'Review',
  agents: 'Agents',
  busy: 'running',
  total: 'total',
  completed: 'completed',
  starting: 'starting',
  dismiss: 'Close',
  brief: 'Task',
  history: 'Work history',
  result: 'Result',
  noCalls: 'No tool calls yet.',
  context: 'context',
  limit: '5h',
  limitTile: '5h share',
  kinds: { read: 'read', edit: 'edit', run: 'run', agent: 'agent', other: 'other' },
  cheerDone: '(ᵔᴗᵔ) all done',
  cheerFailed: '(×_×) did not finish',
  shareOf: share => `≈${share}% of the 5h limit`,
  earlier: n => `${n} earlier ${n === 1 ? 'step' : 'steps'} hidden`,
  after: list => `after ${list}`,
  tools: n => `${n} ${n === 1 ? 'tool' : 'tools'}`,
  errors: n => `${n} failed`,
  crew: n => `${n} ${n === 1 ? 'agent' : 'agents'}`,
  pct: n => `${n}%`,
  decimal: '.',
  message: 'Message',
  messageHint: 'Tell this agent something, Enter sends',
  send: 'send',
  stop: 'Stop',
  delivered: 'Message delivered',
  stopAsked: 'Stop requested',
  stopRefused: 'Stop refused',
  stopFailed: 'Could not stop this agent',
  allDone: 'All done',
  liveCount: n => `${n} running`,
  endedCount: n => `${n} finished`,
  plannedCount: n => `${n} planned`,
  notDelivered: reason => `Not delivered: ${reason}`,
}

const ru: Strings = {
  ...en,
  pane: 'Агенты',
  cost: 'Стоимость',
  tokens: 'Токены',
  time: 'Время',
  collapse: 'Свернуть',
  expand: 'Развернуть',
  running: 'Работают',
  finished: 'Завершены',
  planned: 'Запланированы',
  emptyTitle: 'Агентов пока нет',
  empty: 'Когда субагент начнёт работу, его статус, прогресс и стоимость появятся здесь.',
  round: 'раунд',
  failed: 'ошибка',
  aborted: 'остановлен',
  tokensWord: 'токенов',
  agentsCount: 'агентов',
  isRunning: 'работает',
  isFinished: 'завершён',
  isPlanned: 'запланирована',
  opened: 'Панель агентов открыта.',
  closed: 'Панель агентов закрыта.',
  done: 'Готово',
  plan: 'План',
  design: 'Дизайн',
  tasks: 'Задачи',
  review: 'Ревью',
  agents: 'Агенты',
  busy: 'в работе',
  total: 'всего',
  completed: 'готово',
  starting: 'запуск',
  dismiss: 'Закрыть',
  brief: 'Задача',
  history: 'История работы',
  result: 'Результат',
  noCalls: 'Вызовов инструментов пока нет.',
  context: 'контекст',
  limit: '5ч',
  limitTile: 'доля 5ч',
  kinds: { read: 'чтение', edit: 'правка', run: 'команда', agent: 'агент', other: 'другое' },
  cheerDone: '(ᵔᴗᵔ) готово',
  cheerFailed: '(×_×) не вышло',
  shareOf: share => `≈${share}% лимита 5ч`,
  earlier: n => `скрыто ранних шагов: ${n}`,
  after: list => `после ${list}`,
  tools: n => `инструментов: ${n}`,
  errors: n => `ошибок: ${n}`,
  crew: n => `агентов: ${n}`,
  message: 'Сообщение',
  messageHint: 'Скажи агенту что-нибудь, Enter отправит',
  send: 'отправить',
  stop: 'Остановить',
  delivered: 'Сообщение доставлено',
  stopAsked: 'Остановка запрошена',
  stopRefused: 'Остановка отклонена',
  stopFailed: 'Не удалось остановить агента',
  allDone: 'Всё готово',
  liveCount: n => `работают: ${n}`,
  endedCount: n => `завершено: ${n}`,
  plannedCount: n => `в плане: ${n}`,
  notDelivered: reason => `Не доставлено: ${reason}`,
}

const STRINGS: Record<Lang, Strings> = { tr, en, ru }

// Module scope is fine here: session.start sets it again on every (re)load.
let lang: Lang = 'tr'

export const t = (): Strings => STRINGS[lang]

export const setLang = (next: Lang): void => {
  lang = next
}

export const langOf = (value: unknown): Lang | null => {
  if (typeof value !== 'string' || !value.trim()) return null
  if (/^(tr|turk|türk)/i.test(value.trim())) return 'tr'
  if (/^(ru|russian|рус)/i.test(value.trim())) return 'ru'
  return 'en'
}

export const isLang = (v: unknown): v is Lang => v === 'tr' || v === 'en' || v === 'ru'

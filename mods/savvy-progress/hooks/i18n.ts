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
  agentsTile: string
  earlier: (n: number) => string
  after: (list: string) => string
  tools: (n: number) => string
  errors: (n: number) => string
  pct: (n: number) => string
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
  empty: 'Henüz alt ajan yok.',
  round: 'tur',
  failed: 'hata',
  aborted: 'durduruldu',
  tokensWord: 'token',
  agentsCount: 'ajan',
  isRunning: 'çalışıyor',
  isFinished: 'bitti',
  isPlanned: 'planlı',
  opened: 'Ajan paneli açıldı.',
  closed: 'Ajan paneli kapandı.',
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
  agentsTile: 'Ajan',
  earlier: n => `${n} önceki adım gizli`,
  after: list => `${list} sonrası`,
  tools: n => `${n} araç`,
  errors: n => `${n} hata`,
  pct: n => `%${n}`,
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
  empty: 'No subagents yet.',
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
  agentsTile: 'Agents',
  earlier: n => `${n} earlier ${n === 1 ? 'step' : 'steps'} hidden`,
  after: list => `after ${list}`,
  tools: n => `${n} ${n === 1 ? 'tool' : 'tools'}`,
  errors: n => `${n} failed`,
  pct: n => `${n}%`,
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
  empty: 'Субагентов пока нет.',
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
  agentsTile: 'Агенты',
  earlier: n => `скрыто ранних шагов: ${n}`,
  after: list => `после ${list}`,
  tools: n => `инструментов: ${n}`,
  errors: n => `ошибок: ${n}`,
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

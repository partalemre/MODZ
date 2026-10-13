// Every word the panel, the band and the toasts say, in one shape; each language fills it in a
// file of its own (lang-tr.ts, lang-en.ts, lang-ru.ts) and i18n.ts picks one.

export type Lang = 'tr' | 'en' | 'ru'

export type Kinds = Record<'read' | 'edit' | 'run' | 'agent' | 'other', string>

export type Strings = {
  pane: string
  /** The /agents-info line in the slash command menu. */
  command: string
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
  message: string
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
  kinds: Kinds
  cheerFailed: string
  /** Section toggles and the card's disclosure. */
  show: string
  hide: string
  details: string
  /** The open card: what it does now, between calls, and once it ended. */
  current: string
  thinking: string
  lastStep: string
  /** "Komut çalıştırıyor": a call of each kind in progress. */
  doing: Kinds
  /** The files its calls read or changed, and how many more than shown. */
  files: string
  moreFiles: (n: number) => string
  /** The task text cut short, or whole. */
  showAll: string
  showLess: string
  /** A moment in the past: "12 sn önce". */
  ago: (span: string) => string
  /** The timeline: its title and the "now" mark at its right edge. */
  timeline: string
  now: string
  /** The attention line's button: opens the agent it names. */
  look: string
  failedNow: string
  /** "Yeni görev": dispatching an agent from the panel. */
  newTask: string
  agentLabel: string
  taskLabel: string
  taskHint: string
  start: string
  cancel: string
  noTypes: string
  noDescription: string
  spawnFailed: string
  sources: Record<string, string>
  /** The built-in agent types' own one-line descriptions. */
  builtins: Record<string, string>
  shareOf: (share: string) => string
  earlier: (n: number) => string
  after: (list: string) => string
  tools: (n: number) => string
  errors: (n: number) => string
  crew: (n: number) => string
  /** The hub card's running count: "2 ajan", "2 running". */
  hubCrew: (n: number) => string
  liveCount: (n: number) => string
  endedCount: (n: number) => string
  plannedCount: (n: number) => string
  notDelivered: (reason: string) => string
  pct: (n: number | string) => string
  /** A rough span: "3 dk", "40 sn", "2 sa". */
  minutes: (n: number) => string
  seconds: (n: number) => string
  hours: (n: number) => string
  /** A running agent that went quiet, and one whose single tool call has run long. */
  quiet: (span: string) => string
  longTool: (tool: string, span: string) => string
  /** The stop button names its agent: "Nori'yi durdur". */
  stopWho: (name: string) => string
  /** The message field's hint names its agent: "Nori'ye yaz, Enter gönderir". */
  messageTo: (name: string) => string
  /** The card as a conversation: the person's side, the agent at work, and a question after its answer. */
  you: string
  answering: (name: string) => string
  followUp: (name: string) => string
  launched: (name: string) => string
  denied: (reason: string) => string
  // The decimal mark numbers are written with: "1,68" in Turkish and Russian, "1.68" in English.
  decimal: string
}

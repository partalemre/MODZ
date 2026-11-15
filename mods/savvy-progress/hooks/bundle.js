// Built by `bin/modz build` from the files beside it. Never edited by hand.
import { atom, read, update } from 'claude-code';

let current = "en";
const langOf$1 = (value) => typeof value === "string" && /^tr/i.test(value.trim()) ? "tr" : "en";
function setLang$1(value) {
  current = langOf$1(value);
  return current;
}
const upper = (text) => text.toLocaleUpperCase(current);

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const en = {
  pane: "Agents",
  command: "Open or close the Agents panel: running, done and planned helper agents; progress, cost, timeline, quiet-agent warning; message, stop and new task",
  cost: "Cost",
  tokens: "Tokens",
  time: "Time",
  collapse: "Collapse",
  expand: "Expand",
  running: "Running",
  finished: "Finished",
  planned: "Planned",
  emptyTitle: "No agents yet",
  paneFailed: "The pane could not be drawn; here is the plain list.",
  moreAgents: (n) => `+${n} more ${n === 1 ? "agent" : "agents"}`,
  empty: "Hand out a task and a crab gets to work: its status, progress and cost show here live.",
  round: "round",
  failed: "failed",
  aborted: "stopped",
  tokensWord: "tokens",
  agentsCount: "agents",
  isRunning: "running",
  isFinished: "done",
  isPlanned: "planned",
  opened: "Agents panel opened.",
  closed: "Agents panel closed.",
  done: "Done",
  plan: "Plan",
  design: "Design",
  tasks: "Tasks",
  review: "Review",
  agents: "Agents",
  busy: "running",
  total: "total",
  completed: "completed",
  starting: "starting",
  mainName: "Main session",
  mainType: "this chat",
  mainTask: "The work in this chat",
  dismiss: "Close",
  brief: "Task",
  history: "Work history",
  context: "memory",
  limit: "5h allowance",
  limitTile: "of 5h allowance",
  kinds: { read: "read", edit: "edit", run: "run", agent: "agent", other: "other" },
  efforts: { low: "light thinking", medium: "medium thinking", high: "deep thinking", xhigh: "very deep thinking", max: "deepest thinking" },
  cheerFailed: "(×_×) did not finish",
  show: "Show",
  hide: "Hide",
  details: "Details",
  current: "Now",
  thinking: "Thinking",
  lastStep: "Last step",
  doing: { read: "Reading", edit: "Editing", run: "Running a command", agent: "Working with an agent", other: "Using a tool" },
  files: "Files touched",
  moreFiles: (n) => `+${plural(n, "more file", "more files")}`,
  showAll: "Show all",
  showLess: "Show less",
  ago: (span) => `${span} ago`,
  timeline: "Timeline",
  now: "now",
  look: "Look",
  failedNow: "failed",
  newTask: "New task",
  agentLabel: "Agent",
  taskLabel: "Task",
  taskHint: "Describe the work, Enter starts it",
  start: "start",
  cancel: "Cancel",
  noTypes: "No agent types known yet.",
  noDescription: "No description.",
  spawnFailed: "Could not start the agent",
  builtins: { "general-purpose": "Research, search and multi-step work", Explore: "Scans the code fast, changes nothing", Plan: "Plans how the work will be done" },
  sources: { "built-in": "built-in", plugin: "plugin", project: "project", user: "user" },
  shareOf: (share) => `≈${share}% of the 5-hour usage allowance`,
  earlier: (n) => `${plural(n, "earlier step", "earlier steps")} hidden`,
  logOpen: (n) => `Show every step (${n})`,
  logClose: "Close the log",
  log: "Step-by-step log",
  because: "Why",
  after: (list) => `after ${list}`,
  tools: (n) => plural(n, "step", "steps"),
  errors: (n) => `${n} failed`,
  crew: (n) => plural(n, "agent", "agents"),
  stripCost: "cost",
  stripTokens: "tokens",
  stripTime: "agent time",
  stripLast: (cost) => `last turn ${cost}`,
  stripTurns: (n) => plural(n, "turn", "turns"),
  stripPerTurn: (span) => `${span} per turn`,
  stripDoing: { read: "reading", edit: "writing", run: "command", agent: "leading agents", other: "thinking" },
  stripPlan: "plan",
  stripPlanDone: "done",
  stripWeek: "week",
  stripFive: "5 hours",
  stripRunsOut: (when) => `runs out ${when}`,
  stripFull: "used up",
  stripDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  stripResting: { sleeping: "asleep", working: "working", happy: "pleased", worried: "uneasy" },
  stripStep: (n, subject) => `Step ${n}: ${subject}`,
  hubCrew: (n) => `${n} running`,
  pct: (n) => `${n}%`,
  minutes: (n) => `${n} min`,
  seconds: (n) => `${n}s`,
  hours: (n) => `${n} h`,
  quiet: (span) => `quiet ${span}`,
  longTool: (_tool, span) => `one step running ${span}`,
  stopWho: (name) => `Stop ${name}`,
  messageTo: (name) => `Message ${name}, Enter sends`,
  you: "You",
  answering: (name) => `${name} is answering…`,
  followUp: (name) => `Ask ${name} a follow-up, Enter sends`,
  launched: (name) => `${name} got to work`,
  denied: (reason) => `Refused: ${reason}`,
  decimal: ".",
  message: "Message",
  send: "send",
  stop: "Stop",
  delivered: "Message delivered",
  stopAsked: "Stop requested",
  stopRefused: "Stop refused",
  stopFailed: "Could not stop this agent",
  allDone: "All done",
  liveCount: (n) => `${n} running`,
  endedCount: (n) => `${n} done`,
  plannedCount: (n) => `${n} planned`,
  notDelivered: (reason) => `Not delivered: ${reason}`,
  chats: {
    title: "Other chats",
    waitingTitle: "Waiting on you",
    waiting: (span) => span ? `waiting ${span}` : "waiting",
    states: { working: "working", idle: "idle" },
    untitled: "New chat",
    more: (n) => `+${n} more`,
    agentsTitle: "Agents in other chats",
    emptyHere: "No agents in this chat",
    hubWaits: (n) => n === 1 ? "1 chat waits" : `${n} chats wait`,
    hubWorks: (n) => n === 1 ? "1 chat working" : `${n} chats working`
  },
  crab: {
    moods: { sleeping: "napping", working: "working", happy: "happy", worried: "worried" },
    level: (n) => `Lv ${n}`
  }
};

const ru = {
  ...en,
  pane: "Агенты",
  command: "Открыть или закрыть панель агентов: работающие, завершённые и запланированные субагенты; прогресс, стоимость, хронология, предупреждение о молчащем агенте; сообщение, остановка и новая задача",
  cost: "Стоимость",
  tokens: "Токены",
  time: "Время",
  collapse: "Свернуть",
  expand: "Развернуть",
  running: "Работают",
  finished: "Завершены",
  planned: "Запланированы",
  emptyTitle: "Агентов пока нет",
  paneFailed: "Панель не отрисовалась, вот простой список.",
  moreAgents: (n) => `ещё агентов: ${n}`,
  empty: "Дай задачу, и краб возьмётся за дело: статус, прогресс и стоимость появятся здесь.",
  round: "раунд",
  failed: "ошибка",
  aborted: "остановлен",
  tokensWord: "токенов",
  agentsCount: "агентов",
  isRunning: "работает",
  isFinished: "завершён",
  isPlanned: "запланирована",
  opened: "Панель агентов открыта.",
  closed: "Панель агентов закрыта.",
  done: "Готово",
  plan: "План",
  design: "Дизайн",
  tasks: "Задачи",
  review: "Ревью",
  agents: "Агенты",
  busy: "в работе",
  total: "всего",
  completed: "готово",
  starting: "запуск",
  mainName: "Главная сессия",
  mainType: "этот чат",
  mainTask: "Работа в этом чате",
  dismiss: "Закрыть",
  brief: "Задача",
  history: "История работы",
  context: "память",
  limit: "5ч",
  limitTile: "доля 5ч",
  current: "Сейчас",
  thinking: "Думает",
  lastStep: "Последний шаг",
  doing: { read: "Читает", edit: "Правит", run: "Выполняет команду", agent: "Работает с агентом", other: "Использует инструмент" },
  files: "Затронутые файлы",
  moreFiles: (n) => `ещё файлов: ${n}`,
  showAll: "Показать целиком",
  showLess: "Свернуть",
  ago: (span) => `${span} назад`,
  kinds: { read: "чтение", edit: "правка", run: "команда", agent: "агент", other: "другое" },
  efforts: { low: "лёгкое обдумывание", medium: "среднее обдумывание", high: "глубокое обдумывание", xhigh: "очень глубокое обдумывание", max: "самое глубокое обдумывание" },
  cheerFailed: "(×_×) не вышло",
  show: "Показать",
  hide: "Скрыть",
  details: "Подробнее",
  timeline: "Хронология",
  now: "сейчас",
  look: "Открыть",
  failedNow: "упал с ошибкой",
  newTask: "Новая задача",
  agentLabel: "Агент",
  taskLabel: "Задача",
  taskHint: "Опиши работу, Enter запустит",
  start: "запустить",
  cancel: "Отмена",
  noTypes: "Типы агентов пока не известны.",
  noDescription: "Без описания.",
  spawnFailed: "Не удалось запустить агента",
  builtins: { "general-purpose": "Исследование, поиск и многошаговая работа", Explore: "Быстрый поиск по коду, только чтение", Plan: "Составляет план реализации" },
  sources: { "built-in": "встроенный", plugin: "плагин", project: "проект", user: "пользователь" },
  shareOf: (share) => `≈${share}% лимита 5ч`,
  earlier: (n) => `скрыто ранних шагов: ${n}`,
  logOpen: (n) => `Показать все шаги (${n})`,
  logClose: "Закрыть журнал",
  log: "Пошаговый журнал",
  because: "Зачем",
  after: (list) => `после ${list}`,
  tools: (n) => `шагов: ${n}`,
  errors: (n) => `ошибок: ${n}`,
  crew: (n) => `агентов: ${n}`,
  stripCost: "стоимость",
  stripTokens: "токены",
  stripTime: "время агентов",
  stripLast: (cost) => `последний ход ${cost}`,
  stripTurns: (n) => `ходов: ${n}`,
  stripPerTurn: (span) => `${span} за ход`,
  stripDoing: { read: "читает", edit: "пишет", run: "команда", agent: "ведёт агентов", other: "думает" },
  stripPlan: "план",
  stripPlanDone: "готов",
  stripWeek: "неделя",
  stripFive: "5 часов",
  stripRunsOut: (when) => `кончится ${when}`,
  stripFull: "исчерпан",
  stripDays: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
  stripResting: { sleeping: "спит", working: "работает", happy: "доволен", worried: "встревожен" },
  stripStep: (n, subject) => `Шаг ${n}: ${subject}`,
  hubCrew: (n) => `агентов: ${n}`,
  minutes: (n) => `${n} мин`,
  seconds: (n) => `${n} с`,
  hours: (n) => `${n} ч`,
  quiet: (span) => `молчит ${span}`,
  longTool: (_tool, span) => `один шаг идёт ${span}`,
  stopWho: (name) => `Остановить ${name}`,
  messageTo: (name) => `Написать ${name}, Enter отправит`,
  you: "Вы",
  answering: (name) => `${name} отвечает…`,
  followUp: (name) => `Задать ${name} ещё вопрос, Enter отправит`,
  launched: (name) => `${name} взялся за дело`,
  denied: (reason) => `Отклонено: ${reason}`,
  decimal: ",",
  message: "Сообщение",
  send: "отправить",
  stop: "Остановить",
  delivered: "Сообщение доставлено",
  stopAsked: "Остановка запрошена",
  stopRefused: "Остановка отклонена",
  stopFailed: "Не удалось остановить агента",
  allDone: "Всё готово",
  liveCount: (n) => `работают: ${n}`,
  endedCount: (n) => `завершено: ${n}`,
  plannedCount: (n) => `в плане: ${n}`,
  notDelivered: (reason) => `Не доставлено: ${reason}`,
  chats: {
    title: "Другие чаты",
    waitingTitle: "Ждут тебя",
    waiting: (span) => span ? `ждёт ${span}` : "ждёт",
    states: { working: "работает", idle: "свободен" },
    untitled: "Новый чат",
    more: (n) => `+${n} ещё`,
    agentsTitle: "Агенты в других чатах",
    emptyHere: "В этом чате агентов нет",
    hubWaits: (n) => `чатов ждёт: ${n}`,
    hubWorks: (n) => `чатов в работе: ${n}`
  },
  crab: {
    moods: { sleeping: "спит", working: "работает", happy: "доволен", worried: "волнуется" },
    level: (n) => `Ур ${n}`
  }
};

const VOWELS = "aeıioöuü";
const HARMONY = { a: "ı", ı: "ı", e: "i", i: "i", o: "u", u: "u", ö: "ü", ü: "ü" };
const BACK = "aıou";
const lastVowel = (lower) => [...lower].reverse().find((ch) => VOWELS.includes(ch)) ?? "i";
const suffixed = (name, pick) => {
  const lower = name.toLocaleLowerCase("tr");
  const buffer = VOWELS.includes(lower.at(-1) ?? "") ? "y" : "";
  return `${name}'${buffer}${pick(lastVowel(lower))}`;
};
const accusative = (name) => suffixed(name, (vowel) => HARMONY[vowel] ?? "i");
const dative = (name) => suffixed(name, (vowel) => BACK.includes(vowel) ? "a" : "e");
const tr = {
  pane: "Ajanlar",
  command: "Ajanlar panelini aç/kapat: çalışan, biten ve planlı yardımcı ajanlar; ilerleme, maliyet, zaman çizelgesi, sessiz ajan uyarısı; mesaj, durdur ve yeni görev",
  cost: "Maliyet",
  tokens: "Token",
  time: "Süre",
  collapse: "Daralt",
  expand: "Genişlet",
  running: "Çalışıyor",
  finished: "Bitti",
  planned: "Planlı",
  emptyTitle: "Henüz ajan yok",
  paneFailed: "Panel çizilemedi, düz liste gösteriliyor.",
  moreAgents: (n) => `+${n} ajan daha`,
  empty: "Bir görev ver, bir yengeç işe koyulsun: durumu, ilerlemesi ve maliyeti burada canlı görünür.",
  round: "tur",
  failed: "hata",
  aborted: "durduruldu",
  tokensWord: "token",
  agentsCount: "ajan",
  isRunning: "çalışıyor",
  isFinished: "bitti",
  isPlanned: "planlı",
  opened: "Ajanlar paneli açıldı.",
  closed: "Ajanlar paneli kapandı.",
  done: "Bitti",
  plan: "Plan",
  design: "Tasarım",
  tasks: "Görevler",
  review: "Gözden geçirme",
  agents: "Ajanlar",
  busy: "çalışıyor",
  total: "toplam",
  completed: "tamamlandı",
  starting: "başlıyor",
  mainName: "Ana oturum",
  mainType: "bu sohbet",
  mainTask: "Bu sohbetteki iş",
  dismiss: "Kapat",
  brief: "Görev",
  history: "İş geçmişi",
  context: "hafıza",
  limit: "5 saatlik hak",
  limitTile: "5 saatlik haktan",
  kinds: { read: "okuma", edit: "düzenleme", run: "komut", agent: "ajan", other: "diğer" },
  efforts: { low: "az düşünme", medium: "orta düşünme", high: "derin düşünme", xhigh: "çok derin düşünme", max: "en derin düşünme" },
  cheerFailed: "(×_×) olmadı",
  show: "Göster",
  hide: "Gizle",
  details: "Detay",
  current: "Şu an",
  thinking: "Düşünüyor",
  lastStep: "Son adım",
  doing: { read: "Okuyor", edit: "Düzenliyor", run: "Komut çalıştırıyor", agent: "Ajanla çalışıyor", other: "Araç kullanıyor" },
  files: "Dokunduğu dosyalar",
  moreFiles: (n) => `+${n} dosya daha`,
  showAll: "Tamamını göster",
  showLess: "Kısalt",
  ago: (span) => `${span} önce`,
  timeline: "Zaman çizelgesi",
  now: "şimdi",
  look: "Bak",
  failedNow: "hata verdi",
  newTask: "Yeni görev",
  agentLabel: "Ajan",
  taskLabel: "Görev",
  taskHint: "İşi anlat, Enter başlatır",
  start: "başlat",
  cancel: "Vazgeç",
  noTypes: "Henüz bilinen ajan türü yok.",
  noDescription: "Açıklama yok.",
  spawnFailed: "Ajan başlatılamadı",
  builtins: { "general-purpose": "Araştırma, arama ve çok adımlı iş", Explore: "Kodu hızlıca tarar, hiçbir şeyi değiştirmez", Plan: "İşin nasıl yapılacağını planlar" },
  sources: { "built-in": "yerleşik", plugin: "eklenti", project: "proje", user: "kullanıcı" },
  shareOf: (share) => `5 saatlik kullanım hakkının ≈%${share} kadarı`,
  earlier: (n) => `${n} önceki adım gizli`,
  logOpen: (n) => `Tüm adımları göster (${n})`,
  logClose: "Kaydı kapat",
  log: "Adım adım kayıt",
  because: "Neden",
  after: (list) => `${list} sonrası`,
  tools: (n) => `${n} adım`,
  errors: (n) => `${n} hata`,
  crew: (n) => `${n} ajan`,
  stripCost: "maliyet",
  stripTokens: "token",
  stripTime: "ajan süresi",
  stripLast: (cost) => `son tur ${cost}`,
  stripTurns: (n) => `${n} tur`,
  stripPerTurn: (span) => `tur başına ${span}`,
  stripDoing: { read: "okuyor", edit: "yazıyor", run: "komut", agent: "ajan yönetiyor", other: "düşünüyor" },
  stripPlan: "plan",
  stripPlanDone: "tamam",
  stripWeek: "hafta",
  stripFive: "5 saat",
  stripRunsOut: (when) => `${when} biter`,
  stripFull: "doldu",
  stripDays: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  stripResting: { sleeping: "uyuyor", working: "çalışıyor", happy: "keyifli", worried: "tedirgin" },
  stripStep: (n, subject) => `${n}. adım: ${subject}`,
  hubCrew: (n) => `${n} ajan`,
  pct: (n) => `%${n}`,
  minutes: (n) => `${n} dk`,
  seconds: (n) => `${n} sn`,
  hours: (n) => `${n} sa`,
  quiet: (span) => `sessiz ${span}`,
  longTool: (_tool, span) => `tek adım ${span} sürüyor`,
  stopWho: (name) => `${accusative(name)} durdur`,
  messageTo: (name) => `${dative(name)} yaz, Enter gönderir`,
  you: "Sen",
  answering: (name) => `${name} yanıtlıyor…`,
  followUp: (name) => `${dative(name)} devam sorusu sor, Enter gönderir`,
  launched: (name) => `${name} işe koyuldu`,
  denied: (reason) => `Reddedildi: ${reason}`,
  decimal: ",",
  message: "Mesaj",
  send: "gönder",
  stop: "Durdur",
  delivered: "Mesaj iletildi",
  stopAsked: "Durdurma istendi",
  stopRefused: "Durdurma reddedildi",
  stopFailed: "Bu ajan durdurulamadı",
  allDone: "Hepsi bitti",
  liveCount: (n) => `${n} çalışıyor`,
  endedCount: (n) => `${n} bitti`,
  plannedCount: (n) => `${n} planlı`,
  notDelivered: (reason) => `İletilemedi: ${reason}`,
  chats: {
    title: "Diğer sohbetler",
    waitingTitle: "Seni bekliyor",
    waiting: (span) => span ? `${span} bekliyor` : "bekliyor",
    states: { working: "çalışıyor", idle: "boşta" },
    untitled: "Yeni sohbet",
    more: (n) => `+${n} daha`,
    agentsTitle: "Diğer sohbetlerdeki ajanlar",
    emptyHere: "Bu sohbette ajan yok",
    hubWaits: (n) => `${n} sohbet bekliyor`,
    hubWorks: (n) => `${n} sohbet çalışıyor`
  },
  crab: {
    moods: { sleeping: "uyuyor", working: "çalışıyor", happy: "mutlu", worried: "endişeli" },
    level: (n) => `Sv ${n}`
  }
};

const STRINGS = { tr, en, ru };
let lang = "en";
const t = () => STRINGS[lang];
const setLang = (next) => {
  lang = next;
  setLang$1(next);
};
const plainLang = () => lang === "tr" ? "tr" : "en";
const langOf = (value) => {
  if (typeof value !== "string" || !value.trim())
    return null;
  if (/^(tr|turk|türk)/i.test(value.trim()))
    return "tr";
  if (/^(ru|russian|рус)/i.test(value.trim()))
    return "ru";
  return "en";
};
const isLang = (v) => v === "tr" || v === "en" || v === "ru";

const TARGET_MAX = 40;
const KILO = 1000;
const MEGA = 1e6;
const COST_WIDE = 10;
const SECOND$5 = 1000;
const MINUTE_S = 60;
const HOUR_S = 3600;
const EM_NARROW = 0.3;
const EM_WIDE = 0.72;
const EM_BODY = 0.56;
const EM_FULL = 1;
const WIDE = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF01-\uFF60\uFFE0-\uFFE6\u{1F300}-\u{1FAFF}\u{20000}-\u{3FFFD}]/u;
const xml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
const clip$2 = (s, max) => s.length > max ? s.slice(0, Math.max(1, max - 1)) + "…" : s;
const charEm = (ch) => {
  if (WIDE.test(ch))
    return EM_FULL;
  if (/[\s.,:;'|!il1ıİ()[\]]/.test(ch))
    return EM_NARROW;
  if (/[A-ZÇĞÖŞÜА-ЯЁmwшщжюМШЩЖЮ@%]/.test(ch))
    return EM_WIDE;
  return EM_BODY;
};
const textWidth = (s, size) => [...s].reduce((w, ch) => w + charEm(ch) * size, 0);
const fitText = (s, size, maxW) => {
  if (textWidth(s, size) <= maxW)
    return s;
  let out = "";
  for (const ch of s) {
    if (textWidth(out + ch + "…", size) > maxW)
      break;
    out += ch;
  }
  return out + "…";
};
const fitStart = (s, size, maxW) => {
  if (textWidth(s, size) <= maxW)
    return s;
  const chars = [...s];
  while (chars.length && textWidth("…" + chars.join(""), size) > maxW)
    chars.shift();
  return chars.length ? "…" + chars.join("") : "";
};
const MONO_EM$2 = 0.62;
const monoWidth = (s, size) => [...s].length * MONO_EM$2 * size;
const fitMono = (s, opts) => {
  const room = Math.floor(opts.maxW / (MONO_EM$2 * opts.size));
  const chars = [...s];
  if (chars.length <= room)
    return s;
  if (room < 2)
    return "";
  return opts.isFromStart ? "…" + chars.slice(-(room - 1)).join("") : chars.slice(0, room - 1).join("") + "…";
};
const fixed = (n, digits) => n.toFixed(digits).replace(".", t().decimal);
const fmtTokens = (n) => {
  if (n >= MEGA)
    return `${fixed(n / MEGA, 1)}M`;
  if (n >= KILO)
    return `${Math.round(n / KILO)}k`;
  return `${Math.round(n)}`;
};
const fmtCost = (usd) => `$${usd < COST_WIDE ? fixed(usd, 2) : fixed(usd, 1)}`;
const fmtTime = (ms) => {
  const s = Math.max(0, Math.round(ms / SECOND$5));
  const h = Math.floor(s / HOUR_S);
  const m = Math.floor(s % HOUR_S / MINUTE_S);
  const ss = String(s % MINUTE_S).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};
const modelName = (id) => {
  const m = /(fable|mythos|opus|sonnet|haiku)-(\d+)(?:-(\d{1,2})(?!\d))?/i.exec(id);
  const [, family = "", major = "", minor] = m ?? [];
  if (!family)
    return id.replace(/^claude-/, "").replace(/\[.*\]$/, "") || "—";
  return `${family.charAt(0).toUpperCase()}${family.slice(1).toLowerCase()} ${major}${minor ? "." + minor : ""}`;
};
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const toolName = (tool) => tool.startsWith("mcp__") ? tool.split("__").at(-1) || tool : tool;
const lastSegments = (path) => path.split("/").filter(Boolean).slice(-2).join("/");
const TARGET_KEYS = ["command", "pattern", "query", "description", "subject", "skill", "prompt"];
const DETAIL_MAX$1 = 160;
const PATH_DEPTH = 3;
const aimOf = (input) => {
  const str = (key) => typeof input[key] === "string" ? String(input[key]).trim() : "";
  const key = TARGET_KEYS.find((k) => str(k));
  return {
    path: str("file_path") || str("notebook_path") || str("path"),
    url: str("url"),
    text: key ? str(key).split(`
`)[0] ?? "" : ""
  };
};
function toolTarget(input) {
  const aim = aimOf(input);
  if (aim.path)
    return clip$2(lastSegments(aim.path), TARGET_MAX);
  if (aim.url)
    return clip$2(/^[a-z]+:\/\/([^/?#]+)/i.exec(aim.url)?.[1] ?? aim.url, TARGET_MAX);
  return clip$2(aim.text, TARGET_MAX);
}
const toolDetail = (input) => {
  const aim = aimOf(input);
  return clip$2(aim.path || aim.url || aim.text, DETAIL_MAX$1);
};
const shortPath = (path, depth = PATH_DEPTH) => {
  const parts = path.split("/").filter(Boolean);
  const tail = parts.slice(-depth).join("/");
  return parts.length > depth ? `…/${tail}` : path;
};

const DESCRIPTION_MAX = 160;
const DEFAULT_TYPE = "general-purpose";
const TASK_TITLE_MAX = 40;
const BUILTIN_TYPES = [
  { name: DEFAULT_TYPE, description: "Research, search and multi-step work", source: "built-in" },
  { name: "Explore", description: "Fast, read-only code search", source: "built-in" },
  { name: "Plan", description: "Drafts an implementation plan", source: "built-in" }
];
const blankDraft = () => ({ isOpen: false, type: DEFAULT_TYPE });
function parseAgentFile(text, source) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!front)
    return null;
  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, "m").exec(front[1] ?? "")?.[1]?.trim().replace(/^["']|["']$/g, "");
  const name = field("name");
  if (!name)
    return null;
  return { name, description: clip$2(field("description") ?? "", DESCRIPTION_MAX), source };
}
function mergeTypes(current, found) {
  const fresh = found.filter((type, i) => !current.some((c) => c.name === type.name) && found.findIndex((f) => f.name === type.name) === i);
  return fresh.length ? [...current, ...fresh] : current;
}
const chosenOf = (types, draft) => types.find((type) => type.name === draft?.type) ?? types[0];
const describe = (type) => t().builtins[type.name] ?? (type.description || t().noDescription);
const sourceWord = (source) => t().sources[source] ?? source;
const offered = (e) => ({
  name: e.agent,
  description: clip$2(e.description.split(`
`)[0] ?? "", DESCRIPTION_MAX),
  source: e.source
});

const SHELLS = ["#D97757", "#4FA3C7", "#6BB26F", "#B07CC6", "#E07A9A", "#7C93B8", "#4DB6A0", "#B8977A"];
const EYES = ["dot", "tall", "wide", "wink"];
const NAMES = ["Pip", "Mako", "Nori", "Kiko", "Sol", "Fenn", "Coral", "Rio", "Zuzu", "Moss", "Dune", "Juno", "Otto", "Lumi", "Skip", "Nemo"];
const CLAY = SHELLS[0] ?? "#D97757";
const hashOf = (id) => [...id].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0) >>> 0, 7);
const lookAt = (slot) => ({
  shell: SHELLS[slot % SHELLS.length] ?? CLAY,
  eyes: EYES[Math.floor(slot / SHELLS.length) % EYES.length] ?? "dot",
  name: NAMES[slot % NAMES.length] ?? "Pip"
});
const lookOf = (a) => {
  const look = lookAt(a.look ?? hashOf(a.id));
  return a.isMain === true ? { ...look, name: t().mainName } : look;
};
const nextLook = (list) => list.reduce((top, a) => Math.max(top, (a.look ?? -1) + 1), 0);

const textOf = (entry, lang) => entry[lang === "tr" ? 1 : 0];
function fill(template, x = "") {
  const named = x.trim();
  return template.replace(/\[([^\]]*)\]/g, (_, part) => named ? part : "").replace(/\{x\}/g, named);
}
const READ$1 = ["Reading a file[: {x}]", "Bir dosyayı okuyor[: {x}]", "file"];
const SEARCH = ["Searching inside files[ for “{x}”]", "Dosyaların içinde[ “{x}”] arıyor", "arg"];
const TESTS = ["Running the tests", "Testleri çalıştırıyor"];
const BUILD = ["Building the project", "Projeyi derliyor (çalışır hale getiriyor)"];
const INSTALL = ["Installing the packages the project needs", "Projenin ihtiyaç duyduğu paketleri kuruyor"];
const LINT = ["Checking the code against the style rules", "Kodun yazım kurallarına uyduğunu denetliyor"];
const TYPES = ["Checking the code for type errors", "Kodda tip hatası var mı diye denetliyor"];
const FORMAT = ["Tidying the code’s layout", "Kodun biçimini düzeltiyor"];
const SCRIPT = ["Running a script[: {x}]", "Bir betik (küçük program) çalıştırıyor[: {x}]", "first"];
const SHAPE = ["Tidying a command’s output", "Bir komutun çıktısını düzenliyor"];
const PROCESSES = ["Looking at the running programs", "Çalışan programlara bakıyor"];
const DATABASE = ["Querying the database", "Veritabanını sorguluyor"];
const ARCHIVE = ["Working with an archive file", "Arşiv (sıkıştırılmış) dosyasıyla çalışıyor"];
const SERVICE = ["Working with the {x} service", "{x} servisiyle çalışıyor"];
const COMMANDS = {
  cat: READ$1,
  head: READ$1,
  tail: READ$1,
  less: READ$1,
  more: READ$1,
  bat: READ$1,
  grep: SEARCH,
  rg: SEARCH,
  ag: SEARCH,
  ack: SEARCH,
  ls: ["Listing the files in a folder", "Bir klasördeki dosyaları listeliyor"],
  tree: ["Listing the files in a folder", "Bir klasördeki dosyaları listeliyor"],
  find: ["Looking for files", "Dosya arıyor"],
  fd: ["Looking for files", "Dosya arıyor"],
  wc: ["Counting lines", "Satırları sayıyor"],
  diff: ["Comparing two files", "İki dosyayı karşılaştırıyor"],
  sed: ["Reading part of a file[: {x}]", "Bir dosyanın bir bölümünü okuyor[: {x}]", "file"],
  awk: SHAPE,
  sort: SHAPE,
  uniq: SHAPE,
  cut: SHAPE,
  tr: SHAPE,
  xargs: SHAPE,
  tee: SHAPE,
  column: SHAPE,
  jq: ["Reading JSON data", "JSON verisini okuyor"],
  cd: ["Moving to another folder", "Başka bir klasöre geçiyor"],
  pwd: ["Checking which folder it is in", "Hangi klasörde olduğuna bakıyor"],
  mkdir: ["Making a new folder[: {x}]", "Yeni bir klasör oluşturuyor[: {x}]", "file"],
  touch: ["Making an empty file[: {x}]", "Boş bir dosya oluşturuyor[: {x}]", "file"],
  cp: ["Copying files", "Dosya kopyalıyor"],
  mv: ["Moving or renaming files", "Dosya taşıyor ya da adını değiştiriyor"],
  rm: ["Deleting a file[: {x}]", "Dosya siliyor[: {x}]", "file"],
  rmdir: ["Deleting an empty folder", "Boş bir klasörü siliyor"],
  ln: ["Making a shortcut to a file", "Bir dosyaya kısayol oluşturuyor"],
  chmod: ["Changing who may use a file", "Bir dosyanın izinlerini değiştiriyor"],
  chown: ["Changing who owns a file", "Bir dosyanın sahibini değiştiriyor"],
  echo: ["Printing a line of text[: “{x}”]", "Ekrana bir yazı yazdırıyor[: “{x}”]", "arg"],
  printf: ["Printing a line of text[: “{x}”]", "Ekrana bir yazı yazdırıyor[: “{x}”]", "arg"],
  curl: ["Fetching data from the internet[: {x}]", "İnternetten veri alıyor[: {x}]", "host"],
  wget: ["Downloading from the internet[: {x}]", "İnternetten indiriyor[: {x}]", "host"],
  kill: ["Stopping a running program", "Çalışan bir programı durduruyor"],
  pkill: ["Stopping a running program", "Çalışan bir programı durduruyor"],
  killall: ["Stopping a running program", "Çalışan bir programı durduruyor"],
  ps: PROCESSES,
  top: PROCESSES,
  lsof: PROCESSES,
  pgrep: PROCESSES,
  sleep: ["Waiting a moment", "Kısa bir süre bekliyor"],
  open: ["Opening a file or an app", "Bir dosyayı ya da uygulamayı açıyor"],
  which: ["Checking whether a tool is installed", "Bir aracın kurulu olup olmadığına bakıyor"],
  type: ["Checking whether a tool is installed", "Bir aracın kurulu olup olmadığına bakıyor"],
  env: ["Looking at the environment settings", "Ortam ayarlarına bakıyor"],
  printenv: ["Looking at the environment settings", "Ortam ayarlarına bakıyor"],
  date: ["Checking the date and time", "Tarihe ve saate bakıyor"],
  tar: ARCHIVE,
  zip: ARCHIVE,
  unzip: ARCHIVE,
  gzip: ARCHIVE,
  gunzip: ARCHIVE,
  ssh: ["Connecting to another computer", "Başka bir bilgisayara bağlanıyor"],
  scp: ["Copying files to another computer", "Başka bir bilgisayara dosya kopyalıyor"],
  rsync: ["Copying files, only what changed", "Dosyaları kopyalıyor (yalnızca değişenleri)"],
  sqlite3: DATABASE,
  psql: DATABASE,
  mysql: DATABASE,
  du: ["Checking how much disk space is used", "Ne kadar disk alanı kullanıldığına bakıyor"],
  df: ["Checking how much disk space is free", "Ne kadar boş disk alanı olduğuna bakıyor"],
  stat: ["Looking at a file’s details", "Bir dosyanın bilgilerine bakıyor"],
  file: ["Looking at a file’s details", "Bir dosyanın bilgilerine bakıyor"],
  shasum: ["Taking a file’s fingerprint", "Bir dosyanın parmak izini (özetini) alıyor"],
  md5: ["Taking a file’s fingerprint", "Bir dosyanın parmak izini (özetini) alıyor"],
  screencapture: ["Taking a screenshot", "Ekran görüntüsü alıyor"],
  ffmpeg: ["Processing a video or sound file", "Bir video ya da ses dosyasını işliyor"],
  osascript: ["Driving a Mac app with a script", "Bir Mac uygulamasını betikle yönetiyor"],
  tsc: TYPES,
  eslint: LINT,
  biome: LINT,
  ruff: LINT,
  prettier: FORMAT,
  jest: TESTS,
  vitest: TESTS,
  pytest: TESTS,
  mocha: TESTS,
  playwright: TESTS,
  python: SCRIPT,
  python3: SCRIPT,
  node: SCRIPT,
  deno: SCRIPT,
  ruby: SCRIPT,
  bash: SCRIPT,
  sh: SCRIPT,
  zsh: SCRIPT,
  swift: SCRIPT,
  pip: INSTALL,
  pip3: INSTALL,
  uv: INSTALL,
  poetry: INSTALL,
  pod: INSTALL,
  gem: INSTALL,
  brew: ["Installing or updating a tool on this Mac", "Bu Mac’e bir araç kuruyor ya da güncelliyor"],
  make: BUILD,
  xcodebuild: BUILD,
  gradle: BUILD,
  gradlew: BUILD,
  kubectl: ["Working with the servers the app runs on", "Uygulamanın çalıştığı sunucularla çalışıyor"],
  supabase: SERVICE,
  vercel: SERVICE,
  wrangler: SERVICE,
  firebase: SERVICE,
  netlify: SERVICE,
  aws: SERVICE,
  gcloud: SERVICE
};
const GIT = {
  rest: ["Working with the project’s saved history (git)", "Projenin kayıtlı geçmişiyle (git) çalışıyor"],
  sub: {
    status: ["Checking which files have changed", "Hangi dosyaların değiştiğine bakıyor"],
    diff: ["Looking over the changes made", "Yapılan değişiklikleri inceliyor"],
    log: ["Looking at the earlier saved versions", "Daha önce kaydedilmiş sürümlere bakıyor"],
    show: ["Looking at an earlier saved version", "Daha önce kaydedilmiş bir sürüme bakıyor"],
    blame: ["Checking who last changed each line", "Her satırı en son kimin değiştirdiğine bakıyor"],
    add: ["Picking the changes to save", "Kaydedilecek değişiklikleri seçiyor"],
    commit: ["Saving the changes as a new version (commit)", "Değişiklikleri yeni bir sürüm olarak kaydediyor (commit)"],
    push: ["Sending the saved versions to the shared copy (push)", "Kaydedilen sürümleri ortak kopyaya gönderiyor (push)"],
    pull: ["Bringing in what is new in the shared copy", "Ortak kopyadaki yenilikleri alıyor"],
    fetch: ["Checking what is new in the shared copy", "Ortak kopyada ne yeni diye bakıyor"],
    checkout: ["Switching to another line of work (branch)", "Başka bir çalışma dalına (branch) geçiyor"],
    switch: ["Switching to another line of work (branch)", "Başka bir çalışma dalına (branch) geçiyor"],
    branch: ["Looking at the lines of work (branches)", "Çalışma dallarına (branch) bakıyor"],
    merge: ["Joining two lines of work", "İki çalışma dalını birleştiriyor"],
    rebase: ["Moving its saved versions onto the newest code", "Kendi kayıtlarını en güncel kodun üstüne taşıyor"],
    "cherry-pick": ["Copying one saved change onto this branch", "Kaydedilmiş tek bir değişikliği bu dala kopyalıyor"],
    stash: ["Setting unfinished changes aside", "Yarım kalan değişiklikleri kenara koyuyor"],
    reset: ["Taking back the changes picked for saving", "Kayıt için seçilen değişiklikleri geri çekiyor"],
    restore: ["Putting files back as they were (unsaved edits are lost)", "Dosyaları eski haline döndürüyor (kaydedilmemiş değişiklikler silinir)"],
    revert: ["Undoing an earlier saved version", "Daha önce kaydedilmiş bir sürümü geri alıyor"],
    clean: ["Deleting files that were never saved", "Hiç kaydedilmemiş dosyaları siliyor"],
    clone: ["Downloading a project", "Bir projeyi indiriyor"],
    init: ["Starting to keep this folder’s history", "Bu klasörün geçmişini tutmaya başlıyor"],
    worktree: ["Working with a separate copy of the project", "Projenin ayrı bir çalışma kopyasıyla çalışıyor"],
    tag: ["Naming a saved version", "Kaydedilmiş bir sürüme ad veriyor"],
    remote: ["Looking at where the shared copy lives", "Ortak kopyanın nerede durduğuna bakıyor"]
  }
};
const GH = {
  rest: ["Working with GitHub", "GitHub ile çalışıyor"],
  sub: {
    pr: ["Looking at the change requests (PRs) on GitHub", "GitHub’daki değişiklik isteklerine (PR) bakıyor"],
    issue: ["Looking at the open notes (issues) on GitHub", "GitHub’daki açık kayıtlara (issue) bakıyor"],
    run: ["Checking GitHub’s automatic checks", "GitHub’daki otomatik kontrollerin sonucuna bakıyor"],
    workflow: ["Checking GitHub’s automatic checks", "GitHub’daki otomatik kontrollerin sonucuna bakıyor"],
    api: ["Asking GitHub for information", "GitHub’dan bilgi alıyor"],
    repo: ["Looking at a project on GitHub", "GitHub’daki bir projeye bakıyor"],
    release: ["Working with a published version on GitHub", "GitHub’da yayımlanmış bir sürümle çalışıyor"]
  }
};
const PACKAGE = {
  rest: ["Running one of the project’s own jobs[: {x}]", "Projenin hazır işlerinden birini çalıştırıyor[: {x}]"],
  sub: {
    install: INSTALL,
    i: INSTALL,
    add: INSTALL,
    ci: INSTALL,
    update: INSTALL,
    upgrade: INSTALL,
    uninstall: ["Removing a package", "Bir paketi kaldırıyor"],
    remove: ["Removing a package", "Bir paketi kaldırıyor"],
    test: TESTS,
    t: TESTS,
    build: BUILD,
    dev: ["Starting the app to try it out", "Uygulamayı denemek için başlatıyor"],
    start: ["Starting the app", "Uygulamayı başlatıyor"],
    serve: ["Starting the app", "Uygulamayı başlatıyor"],
    lint: LINT,
    typecheck: TYPES,
    "type-check": TYPES,
    check: LINT,
    format: FORMAT,
    publish: ["Publishing the package for everyone", "Paketi herkesin kullanımına yayımlıyor"]
  }
};
const DOCKER = {
  rest: ["Working with a container (a boxed-up app)", "Bir kapsayıcıyla (kutulanmış uygulama) çalışıyor"],
  sub: {
    build: ["Packing the app into a container", "Uygulamayı bir kapsayıcıya paketliyor"],
    run: ["Starting a container (a boxed-up app)", "Bir kapsayıcıyı (kutulanmış uygulama) başlatıyor"],
    ps: ["Looking at the running containers", "Çalışan kapsayıcılara bakıyor"],
    logs: ["Reading a container’s log", "Bir kapsayıcının kayıtlarını okuyor"],
    compose: ["Starting or stopping the app’s containers", "Uygulamanın kapsayıcılarını başlatıyor ya da durduruyor"]
  }
};
const CLAUDE = {
  rest: ["Running a Claude Code command", "Bir Claude Code komutu çalıştırıyor"],
  sub: {
    test: ["Running the mod’s tests", "Modun testlerini çalıştırıyor"],
    validate: ["Checking that the mod follows the rules", "Modun kurallara uyduğunu denetliyor"],
    install: ["Installing a mod", "Bir mod kuruyor"],
    marketplace: ["Looking at where mods are installed from", "Modların kurulduğu kaynağa bakıyor"]
  }
};
const FLUTTER = {
  rest: ["Running a Flutter command", "Bir Flutter komutu çalıştırıyor"],
  sub: {
    run: ["Starting the app on a phone or simulator", "Uygulamayı telefonda ya da simülatörde başlatıyor"],
    build: BUILD,
    test: TESTS,
    analyze: LINT,
    format: FORMAT,
    pub: INSTALL,
    clean: ["Clearing the old build files", "Eski derleme dosyalarını temizliyor"]
  }
};
const TOOLCHAIN = { rest: BUILD, sub: { test: TESTS, run: SCRIPT, install: INSTALL, fmt: FORMAT, clippy: LINT, vet: LINT } };
const FAMILIES = {
  git: GIT,
  gh: GH,
  npm: PACKAGE,
  pnpm: PACKAGE,
  yarn: PACKAGE,
  bun: PACKAGE,
  docker: DOCKER,
  "docker-compose": DOCKER,
  claude: CLAUDE,
  flutter: FLUTTER,
  dart: FLUTTER,
  cargo: TOOLCHAIN,
  go: TOOLCHAIN
};
const SHELL = {
  newBranch: ["Starting a new line of work (branch)[: {x}]", "Yeni bir çalışma dalı (branch) açıyor[: {x}]"],
  hardReset: ["Throwing away the changes not saved yet", "Henüz kaydedilmemiş değişiklikleri siliyor"],
  discard: ["Putting files back as they were (unsaved edits are lost)", "Dosyaları eski haline döndürüyor (kaydedilmemiş değişiklikler silinir)"],
  dropStash: ["Throwing away the changes that were set aside", "Kenara konmuş değişiklikleri siliyor"],
  deleteBranch: ["Deleting a line of work (branch)[: {x}]", "Bir çalışma dalını (branch) siliyor[: {x}]"],
  forcePush: ["Overwriting the shared copy with its own versions", "Ortak kopyanın üzerine kendi kayıtlarını yazıyor"],
  prCreate: ["Opening a change request (PR) on GitHub", "GitHub’da bir değişiklik isteği (PR) açıyor"],
  prMerge: ["Merging a change request (PR) into the main code", "Bir değişiklik isteğini (PR) ana koda birleştiriyor"],
  deleteFolder: ["Deleting a folder and everything in it[: {x}]", "Bir klasörü içindekilerle birlikte siliyor[: {x}]"],
  findDelete: ["Finding files and deleting them", "Dosyaları bulup siliyor"],
  editInPlace: ["Changing a file by a rule[: {x}]", "Bir dosyayı kurala göre değiştiriyor[: {x}]"],
  writeFile: ["Writing into a file[: {x}]", "Bir dosyaya yazıyor[: {x}]"],
  inlineScript: ["Running a short script it just wrote", "O an yazdığı kısa bir betiği çalıştırıyor"],
  ownScript: ["Running the project’s own script[: {x}]", "Projenin kendi betiğini çalıştırıyor[: {x}]"],
  fetchedTool: ["Running the “{x}” tool", "“{x}” aracını çalıştırıyor"],
  unknown: ["Running the “{x}” command", "“{x}” komutunu çalıştırıyor"],
  any: ["Running a terminal command", "Bir terminal komutu çalıştırıyor"],
  then: [", then ", ", sonra "],
  more: [" (+{x} more)", " (+{x} adım daha)"]
};

const STEPS_SHOWN = 2;
const NAME_MAX$1 = 40;
const WRAPPERS = new Set(["sudo", "time", "command", "exec", "nohup", "env", "then", "do", "else", "if", "while", "until", "!"]);
const SILENT = new Set(["cd", "export", "set", "unset", "source", ".", "for", "done", "fi", "true", "false", ":", "[", "[[", "test", "local", "shift", "wait"]);
const FILTERS = new Set(["grep", "rg", "sed", "awk", "head", "tail", "sort", "uniq", "wc", "cut", "tr", "tee", "xargs", "jq", "column", "less", "cat"]);
const FETCHERS = new Set(["npx", "bunx", "uvx", "pipx"]);
const PASS_ON = new Set(["run", "run-script", "exec", "x", "dlx", "-m", "plugin"]);
const INLINE = new Set(["-c", "-e", "-"]);
const PROPER = /^(GitHub|Git\b|Docker|Claude|Flutter|JSON|Python|iOS|Mac)/;
const base = (path) => path.split("/").filter(Boolean).at(-1) ?? path;
const clip$1 = (text) => text.length > NAME_MAX$1 ? `${text.slice(0, NAME_MAX$1 - 1)}…` : text;
const isFlag = (word) => word.startsWith("-");
const withoutHeredocs = (command) => command.replace(/\\\n/g, " ").replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2(?=\s|$)/g, "<<");
function isOpenAt(scan, line, i) {
  const ch = line[i] ?? "";
  if (scan.quote !== "") {
    if (ch === scan.quote && line[i - 1] !== "\\")
      scan.quote = "";
    return false;
  }
  if (ch === '"' || ch === "'" || ch === "`")
    scan.quote = ch;
  else if (ch === "(" || ch === "{")
    scan.depth += 1;
  else if (ch === ")" || ch === "}")
    scan.depth = Math.max(0, scan.depth - 1);
  return scan.quote === "" && scan.depth === 0;
}
function stepsOf$1(command) {
  const line = withoutHeredocs(command);
  const scan = { quote: "", depth: 0 };
  const steps = [[]];
  let word = "";
  const close = (isStepEnd) => {
    steps.at(-1)?.push(word.trim());
    word = "";
    if (isStepEnd)
      steps.push([]);
  };
  for (let i = 0;i < line.length; i += 1) {
    const ch = line[i] ?? "";
    const two = line.slice(i, i + 2);
    if (!isOpenAt(scan, line, i))
      word += ch;
    else if (two === "&&" || two === "||") {
      close(true);
      i += 1;
    } else if (ch === ";" || ch === `
`)
      close(true);
    else if (ch === "|")
      close(false);
    else if (ch === "&" && line[i - 1] !== ">" && line[i + 1] !== ">")
      close(true);
    else
      word += ch;
  }
  close(false);
  return steps.map((pipe) => pipe.filter(Boolean)).filter((pipe) => pipe.length > 0);
}
function wordsOf(command) {
  const found = command.match(/(?:\$\([^)]*\)|"(?:\\.|[^"\\])*"|'[^']*'|\S)+/g) ?? [];
  return found.map((word) => word.replace(/^(['"])([\s\S]*)\1$/, "$2"));
}
function splitRedirects(words) {
  const kept = [];
  let out = "";
  for (let i = 0;i < words.length; i += 1) {
    const word = words[i] ?? "";
    const match = /^\d?>>?(.*)$/.exec(word);
    if (match === null || word.includes(">&")) {
      if (!/^\d?[<>]/.test(word))
        kept.push(word);
      continue;
    }
    const target = match[1] || words[i += 1] || "";
    if (target !== "" && !target.startsWith("/dev/") && !target.startsWith("&"))
      out = target;
  }
  return { kept, out };
}
function callOf(command) {
  const { kept, out } = splitRedirects(wordsOf(command));
  const words = [...kept];
  while (words.length > 0 && (WRAPPERS.has(words[0] ?? "") || /^\w+\+?=/.test(words[0] ?? "")))
    words.shift();
  const [first, ...args] = words;
  return first === undefined || first.startsWith("#") ? null : { name: first, args, out };
}
const namedOf$1 = (kind, args) => {
  const plain = args.filter((arg) => !isFlag(arg) && !/^\d+$/.test(arg));
  if (kind === "first")
    return clip$1(base(plain[0] ?? ""));
  if (kind === "host")
    return /^[a-z]+:\/\/([^/?#]+)/i.exec(plain.find((arg) => arg.includes("://")) ?? "")?.[1] ?? "";
  if (kind === "file")
    return clip$1(base(plain.at(-1) ?? ""));
  return kind === "arg" ? clip$1(plain[0] ?? "") : "";
};
const say = (entry, lang, x = "") => fill(textOf(entry, lang), x);
function familySay(family, args, lang) {
  const words = args.filter((arg) => !isFlag(arg) || arg === "-m");
  const at = words.findIndex((word) => !PASS_ON.has(word));
  const sub = words[at] ?? words[0] ?? "";
  const entry = family.sub[sub] ?? family.sub[words[0] ?? ""] ?? family.rest;
  return say(entry, lang, entry === family.rest ? clip$1(sub) : namedOf$1(entry[2], words.slice(at + 1)));
}
function specialSay(call, lang) {
  const { name, args } = call;
  const has = (...flags) => args.some((arg) => flags.includes(arg));
  const combined = (letter) => args.some((arg) => /^-[a-zA-Z]+$/.test(arg) && arg.includes(letter));
  const second = args.filter((arg) => !isFlag(arg))[1] ?? "";
  if (name === "git" && (args[0] === "checkout" || args[0] === "switch") && has("-b", "-B", "-c"))
    return say(SHELL.newBranch, lang, clip$1(args.filter((arg) => !isFlag(arg))[1] ?? ""));
  if (name === "git" && args[0] === "reset" && has("--hard", "--merge", "--keep"))
    return say(SHELL.hardReset, lang);
  if (name === "git" && args[0] === "checkout" && (has("--", ".") || has("-f", "--force")))
    return say(SHELL.discard, lang);
  if (name === "git" && args[0] === "stash" && (second === "drop" || second === "clear"))
    return say(SHELL.dropStash, lang);
  if (name === "git" && args[0] === "branch" && (has("-D", "--delete") || combined("d")))
    return say(SHELL.deleteBranch, lang, clip$1(args.filter((arg) => !isFlag(arg))[1] ?? ""));
  if (name === "git" && args[0] === "push" && (has("--force", "--force-with-lease") || combined("f")))
    return say(SHELL.forcePush, lang);
  if (name === "gh" && args[0] === "pr" && second === "create")
    return say(SHELL.prCreate, lang);
  if (name === "gh" && args[0] === "pr" && second === "merge")
    return say(SHELL.prMerge, lang);
  if (name === "rm" && (combined("r") || combined("R") || has("--recursive")))
    return say(SHELL.deleteFolder, lang, namedOf$1("file", args));
  if (name === "find" && has("-delete"))
    return say(SHELL.findDelete, lang);
  if (name === "sed" && (has("-i", "--in-place") || args.some((arg) => arg.startsWith("-i"))))
    return say(SHELL.editInPlace, lang, namedOf$1("file", args));
  if (call.out !== "" && (name === "echo" || name === "printf" || name === "cat"))
    return say(SHELL.writeFile, lang, clip$1(base(call.out)));
  return null;
}
function scriptSay(call, lang) {
  const first = call.args[0] ?? "";
  const isRunner = COMMANDS[call.name] === SCRIPT;
  if (isRunner && (call.args.length === 0 || INLINE.has(first) || first === "<<"))
    return say(SHELL.inlineScript, lang);
  if (isRunner && first === "-m")
    return callSay({ ...call, name: call.args[1] ?? "", args: call.args.slice(2) }, lang);
  if (FETCHERS.has(call.name)) {
    const tool = call.args.find((arg) => !isFlag(arg)) ?? "";
    const known = callSay({ name: tool, args: call.args.slice(call.args.indexOf(tool) + 1), out: "" }, lang);
    return known === say(SHELL.unknown, lang, clip$1(base(tool))) ? say(SHELL.fetchedTool, lang, clip$1(tool)) : known;
  }
  return null;
}
function callSay(call, lang) {
  const name = base(call.name);
  if (SILENT.has(name))
    return null;
  const special = specialSay({ ...call, name }, lang) ?? scriptSay({ ...call, name }, lang);
  if (special !== null)
    return special;
  const family = FAMILIES[name];
  if (family !== undefined)
    return familySay(family, call.args, lang);
  const entry = COMMANDS[name];
  if (entry !== undefined)
    return say(entry, lang, entry === SERVICE ? name : namedOf$1(entry[2], call.args));
  if (call.name.includes("/"))
    return say(SHELL.ownScript, lang, clip$1([name, ...call.args.filter((arg) => !isFlag(arg)).slice(0, 1)].join(" ")));
  return say(SHELL.unknown, lang, clip$1(name));
}
function leadOf$1(pipe) {
  const calls = pipe.map(callOf).filter((call) => call !== null);
  return calls.find((call) => !FILTERS.has(base(call.name)) && !SILENT.has(base(call.name))) ?? calls[0] ?? null;
}
const WAITS = new Set(["sleep"]);
const MARKERS = new Set(["echo", "printf"]);
const isWait = (call) => WAITS.has(base(call.name)) || MARKERS.has(base(call.name)) && call.out === "";
function leadsOf(command) {
  const leads = stepsOf$1(command).map((pipe) => leadOf$1(pipe)).filter((call) => call !== null);
  const hasWork = leads.some((call) => !isWait(call) && !SILENT.has(base(call.name)));
  return hasWork ? leads.filter((call) => !isWait(call)) : leads;
}
const lowerFirst = (text, lang) => PROPER.test(text) ? text : text.charAt(0).toLocaleLowerCase(lang) + text.slice(1);
function plainShell(command, lang) {
  const steps = stepsOf$1(command);
  const said = leadsOf(command).map((call) => callSay(call, lang) ?? "");
  const unique = said.filter((text, i) => text !== "" && said.indexOf(text) === i);
  if (unique.length === 0)
    return say(steps.some((pipe) => pipe.some((c) => /^cd\b/.test(c))) ? COMMANDS.cd : SHELL.any, lang);
  const shown = unique.slice(0, STEPS_SHOWN).map((text, i) => i === 0 ? text : lowerFirst(text, lang));
  const more = unique.length - shown.length;
  return shown.join(textOf(SHELL.then, lang)) + (more > 0 ? say(SHELL.more, lang, String(more)) : "");
}

const fieldOf = (input, name) => {
  const value = typeof input === "object" && input !== null ? input[name] : undefined;
  return typeof value === "string" ? value.trim() : "";
};
const PURPOSE_MAX = 96;
function purposeOf(input) {
  const text = (fieldOf(input, "description") || fieldOf(input, "action_summary")).split(`
`)[0]?.trim() ?? "";
  return text.length > PURPOSE_MAX ? `${text.slice(0, PURPOSE_MAX - 1)}…` : text;
}
const REASON_MAX = 160;
function reasonOf(answer) {
  const line = answer.split(`
`).map((part) => part.replace(/[*_`#>]+/g, "").trim()).filter((part) => part !== "").at(-1) ?? "";
  const text = line.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[:：]$/, "").trim();
  return text.length > REASON_MAX ? `${text.slice(0, REASON_MAX - 1)}…` : text;
}

const NAME_MAX = 48;
const EDIT$1 = [["Changing the file {x}", "{x} dosyasını değiştiriyor"], "file_path", "file"];
const TASKS = [["Updating its to-do list", "Yapılacaklar listesini güncelliyor"]];
const HELPER = [["Handing a job to a helper agent[: {x}]", "Bir yardımcı ajana iş veriyor[: {x}]"], "description"];
const BACKGROUND = [["Checking on a command running in the background", "Arka planda çalışan komutun durumuna bakıyor"]];
const STOP = [["Stopping a command running in the background", "Arka planda çalışan komutu durduruyor"]];
const TIMER = [["Setting up work to run later", "Daha sonra çalışacak bir iş ayarlıyor"]];
const TOOLS = {
  Read: [["Reading the file {x}", "{x} dosyasını okuyor"], "file_path", "file"],
  Write: [["Writing the file {x}", "{x} dosyasını yazıyor"], "file_path", "file"],
  Edit: EDIT$1,
  MultiEdit: EDIT$1,
  NotebookEdit: [["Changing the notebook {x}", "{x} not defterini değiştiriyor"], "notebook_path", "file"],
  Glob: [["Looking for files named like “{x}”", "Adı “{x}” kalıbına uyan dosyaları arıyor"], "pattern"],
  Grep: [["Searching inside files for “{x}”", "Dosyaların içinde “{x}” arıyor"], "pattern"],
  LS: [["Listing the files in a folder", "Bir klasördeki dosyaları listeliyor"]],
  WebSearch: [["Searching the web for “{x}”", "İnternette “{x}” arıyor"], "query"],
  WebFetch: [["Reading a web page[: {x}]", "Bir internet sayfasını okuyor[: {x}]"], "url", "host"],
  Agent: HELPER,
  Task: HELPER,
  SubagentHandback: [["Handing its finished report back to the chat that started it", "Bitirdiği işin raporunu kendisini başlatan sohbete teslim ediyor"]],
  SendMessage: [["Sending a message to another agent", "Başka bir ajana mesaj gönderiyor"]],
  TodoWrite: TASKS,
  TaskCreate: TASKS,
  TaskUpdate: TASKS,
  TaskList: TASKS,
  TaskGet: TASKS,
  update_plan: TASKS,
  Skill: [["Loading a ready-made set of instructions[: {x}]", "Hazır bir talimat paketini (skill) yüklüyor[: {x}]"], "skill"],
  ToolSearch: [["Looking for a tool it needs[: {x}]", "İhtiyaç duyduğu aracı arıyor[: {x}]"], "query", "tools"],
  AskUserQuestion: [["Asking you a question", "Sana bir soru soruyor"]],
  EnterPlanMode: [["Starting to write a plan before it acts", "İşe başlamadan önce plan yazmaya geçiyor"]],
  ExitPlanMode: [["Showing you its plan for approval", "Hazırladığı planı onayına sunuyor"]],
  BashOutput: BACKGROUND,
  TaskOutput: BACKGROUND,
  Monitor: BACKGROUND,
  KillShell: STOP,
  TaskStop: STOP,
  Artifact: [["Publishing a page you can open", "Açabileceğin bir sayfa yayımlıyor"]],
  ScheduleWakeup: TIMER,
  CronCreate: TIMER,
  EnterWorktree: [["Making a separate copy of the project to work in", "Çalışmak için projenin ayrı bir kopyasını açıyor"]]
};
const BROWSER = ["Using the browser", "Tarayıcıyı kullanıyor"];
const SERVERS = [
  [/browser|chrome|playwright/i, BROWSER],
  [/computer/i, ["Using the mouse and keyboard on this computer", "Bu bilgisayarda fareyi ve klavyeyi kullanıyor"]],
  [/github/i, ["Working on GitHub", "GitHub üzerinde çalışıyor"]],
  [/context7/i, ["Reading a library’s up-to-date manual", "Bir kütüphanenin güncel kılavuzunu okuyor"]],
  [/\brea\b/i, ["Taking an app apart to see how it works", "Bir uygulamanın içini açıp nasıl çalıştığına bakıyor"]],
  [/simulator/i, ["Using the iPhone simulator", "iPhone simülatörünü kullanıyor"]],
  [/terminal/i, ["Looking at your terminal", "Terminaline bakıyor"]],
  [/ccd_|savvy|modz|skins|transceiver/i, ["Updating what the app shows you", "Uygulamanın sana gösterdiklerini güncelliyor"]]
];
const BROWSER_ACTS = [
  [/navigate|open_url|preview_start/, ["Opening a page in the browser", "Tarayıcıda bir sayfa açıyor"]],
  [/screenshot/, ["Taking a picture of the page", "Sayfanın görüntüsünü alıyor"]],
  [/read_page|get_page|page_text|snapshot|find/, ["Reading the page in the browser", "Tarayıcıdaki sayfayı okuyor"]],
  [/click|press|hover|drag/, ["Clicking on the page", "Sayfada bir yere tıklıyor"]],
  [/type|fill|form_input|select/, ["Typing into the page", "Sayfaya yazı yazıyor"]],
  [/console|network|javascript|evaluate/, ["Checking how the page runs", "Sayfanın nasıl çalıştığını denetliyor"]]
];
const OTHER = {
  service: ["Using the connected “{x}” service", "Bağlı “{x}” servisini kullanıyor"],
  tool: ["Using the “{x}” tool", "“{x}” aracını kullanıyor"],
  command: ["Running a terminal command", "Bir terminal komutu çalıştırıyor"]
};
const fieldsOf = (input) => typeof input === "object" && input !== null ? input : {};
const clip = (text) => text.length > NAME_MAX ? `${text.slice(0, NAME_MAX - 1)}…` : text;
const firstLine = (text) => text.split(`
`)[0]?.trim() ?? "";
function namedOf(value, as) {
  const text = typeof value === "string" ? firstLine(value) : "";
  if (as === "file")
    return text.split("/").filter(Boolean).at(-1) ?? "";
  if (as === "host")
    return /^[a-z]+:\/\/([^/?#]+)/i.exec(text)?.[1] ?? "";
  if (as === "tools")
    return clip(text.replace(/^select:/, "").split(",").map((name) => (name.split("__").at(-1) ?? name).replace(/_+/g, " ").trim()).join(", "));
  return clip(text);
}
function serviceSay(tool, lang) {
  const [, server = "", ...rest] = tool.split("__");
  const name = rest.join(" ");
  const known = SERVERS.find(([pattern]) => pattern.test(server))?.[1];
  if (known === BROWSER)
    return textOf(BROWSER_ACTS.find(([pattern]) => pattern.test(name))?.[1] ?? BROWSER, lang);
  if (known !== undefined)
    return textOf(known, lang);
  const isId = /^[0-9a-f-]{20,}$/i.test(server);
  return fill(textOf(isId ? OTHER.tool : OTHER.service, lang), clip((isId ? name : server).replace(/[_-]+/g, " ")));
}
function plainCall(tool, input, lang) {
  const fields = fieldsOf(input);
  if (tool === "Bash" || tool === "PowerShell") {
    const command = typeof fields.command === "string" ? fields.command : "";
    return command.trim() === "" ? textOf(OTHER.command, lang) : plainShell(command, lang);
  }
  if (tool.startsWith("mcp__"))
    return serviceSay(tool, lang);
  const known = TOOLS[tool];
  if (known === undefined)
    return fill(textOf(OTHER.tool, lang), clip(tool));
  const [entry, field, as] = known;
  const named = field === undefined ? "" : namedOf(fields[field], as);
  const template = textOf(entry, lang);
  return named === "" && /(^|[^[])\{x\}/.test(template.replace(/\[[^\]]*\]/g, "")) ? fill(textOf(OTHER.tool, lang), tool) : fill(template, named);
}

const PRICES_5 = {
  "fable-5-2": [8, 40, 0.2, 16],
  "mythos-5-2": [8, 40, 0.2, 16],
  "fable-5-1": [10, 50, 0.25, 20],
  "mythos-5-1": [10, 50, 0.25, 20],
  "fable-5": [10, 50, 1, 20],
  "mythos-5": [10, 50, 1, 20],
  "opus-5-5": [4, 20, 0.2, 8],
  "opus-5": [5, 25, 0.5, 10],
  "sonnet-5-5": [2, 10, 0.1, 4],
  "sonnet-5": [2, 10, 0.2, 4],
  "haiku-5-5": [0.1, 0.5, 0.01, 0.2]
};
const GEN_5 = /(fable|mythos|opus|sonnet|haiku)-((?:[5-9]|[1-9]\d)(?:-\d{1,2})?)(?!\d)/;
const EARLIER = [
  [/opus-4(?:-[01])?(?:$|[^-\d]|-20\d{6})/, [15, 75, 1.5, 30]],
  ["opus-4", [5, 25, 0.5, 10]],
  ["sonnet", [3, 15, 0.3, 6]],
  ["3-5-haiku", [0.8, 4, 0.08, 1.6]],
  ["haiku-3-5", [0.8, 4, 0.08, 1.6]],
  ["haiku", [1, 5, 0.1, 2]]
];
const LONG_PROMPT = 1e5;
const LONG_PRICES = { "haiku-5-5": [0.5, 2.5, 0.05, 1] };
const PER_MILLION = 1e6;
const SMALL_WINDOW = 200000;
const LARGE_WINDOW = 1e6;
const priceOf = (model, prompt) => {
  const id = model.toLowerCase().replace(/[\s.]+/g, "-");
  const gen5 = GEN_5.exec(id);
  if (gen5) {
    const key = `${gen5[1]}-${gen5[2]}`;
    return (prompt > LONG_PROMPT ? LONG_PRICES[key] : undefined) ?? PRICES_5[key] ?? null;
  }
  return EARLIER.find(([family]) => typeof family === "string" ? id.includes(family) : family.test(id))?.[1] ?? null;
};
const isPriced = (model) => priceOf(model, 0) !== null;
const costOf = (model, u, isRequest) => {
  const prompt = isRequest ? (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0) : 0;
  const rates = priceOf(model, prompt);
  if (rates === null)
    return null;
  const [i, o, r, w] = rates;
  const sum = (u.input_tokens || 0) * i + (u.output_tokens || 0) * o + (u.cache_read_input_tokens || 0) * r + (u.cache_creation_input_tokens || 0) * w;
  return sum / PER_MILLION;
};
const costText = (a) => isPriced(a.model) ? `≈${fmtCost(a.costUsd)}` : "";
const tokensOf = (u) => (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
const windowOf = (model) => /haiku-4|claude-3/i.test(model) ? SMALL_WINDOW : LARGE_WINDOW;

const TOOL = "mcp__savvy-progress__progress";
const STEP_TOOL = "mcp__savvy-progress__step";
const PANE = "savvy-agents";
const HUB_PANE = "agents";
const MAX_RUNS = 200;

const TASK_TOOLS = ["TodoWrite", "TaskCreate", "TaskUpdate"];
const STATUSES = ["pending", "in_progress", "completed"];
const statusOf = (s) => STATUSES.includes(s) ? s : "pending";
const fromTodos = (todos) => {
  if (!Array.isArray(todos))
    return [];
  return todos.filter((todo) => typeof todo?.content === "string" && todo.content.trim()).map((todo, i) => ({ id: `todo-${i + 1}`, title: String(todo.content).trim(), status: statusOf(todo.status) }));
};
const taskIdOf = (result) => {
  const id = result?.task?.id;
  return typeof id === "string" ? id : "";
};
const createTask = (list, call, result) => {
  const id = taskIdOf(result);
  if (!id)
    return list;
  const title = typeof call.subject === "string" && call.subject.trim() ? call.subject.trim() : id;
  return [...list.filter((task) => task.id !== id), { id, title, status: "pending" }];
};
const updateTask = (list, call) => {
  if (call.status === "deleted")
    return list.filter((task) => task.id !== call.taskId);
  return list.map((task) => {
    if (task.id !== call.taskId)
      return task;
    const title = typeof call.subject === "string" && call.subject.trim() ? call.subject.trim() : task.title;
    return { ...task, title, status: call.status ? statusOf(call.status) : task.status };
  });
};
function applyTaskTool(list, call, result) {
  if (call.tool === "TodoWrite")
    return fromTodos(call.todos);
  if (call.tool === "TaskCreate")
    return createTask(list, call, result);
  if (call.tool === "TaskUpdate")
    return updateTask(list, call);
  return list;
}
const countTasks = (list) => ({
  done: list.filter((task) => task.status === "completed").length,
  active: list.filter((task) => task.status === "in_progress").length,
  total: list.length
});
const openTasks = (list) => list.filter((task) => task.status !== "completed");

const BRIEF_MAX = 800;
const ANSWER_MAX = 1500;
const THREAD_MAX = 12;
function addRun(list, spawn) {
  const same = list.filter((a) => spawn.description && norm(a.description) === norm(spawn.description));
  const run = {
    id: spawn.id,
    agentId: spawn.agentId,
    toolUseId: spawn.toolUseId,
    parentId: spawn.parentId,
    type: spawn.type,
    description: spawn.description,
    model: spawn.model,
    effort: spawn.effort,
    brief: spawn.brief?.trim() ? clip$2(spawn.brief.trim(), BRIEF_MAX) : undefined,
    isAsked: spawn.isAsked,
    status: "running",
    startedAt: spawn.at,
    contextTokens: 0,
    contextMax: windowOf(spawn.model),
    tokens: 0,
    costUsd: 0,
    steps: 0,
    round: 1 + same.length,
    look: list.find((a) => a.id === spawn.id)?.look ?? nextLook(list),
    toolCount: 0
  };
  return [...list.filter((a) => a.id !== run.id), run].slice(-MAX_RUNS);
}
const withTurn = (a, turn) => ({ ...a, thread: [...a.thread ?? [], turn].slice(-THREAD_MAX) });
const askedAgain = (a, text, at) => withTurn(a, { from: "you", text: clip$2(text.trim(), BRIEF_MAX), at });
const patchRun = (list, agentId, fn) => list.map((a) => a.agentId === agentId ? fn(a) : a);
const stepUsage = (a, facts) => ({
  ...a,
  model: facts.model,
  effort: typeof facts.effort === "string" ? facts.effort : a.effort,
  status: "running",
  endedAt: undefined,
  endReason: undefined,
  contextTokens: tokensOf(facts.usage),
  contextMax: windowOf(facts.model),
  tokens: a.tokens + tokensOf(facts.usage),
  costUsd: a.costUsd + (costOf(facts.model, facts.usage, true) ?? 0),
  steps: a.steps + 1
});
const endRun = (a, facts) => {
  const isAnswered = facts.reason === "answer";
  const usage = a.steps === 0 ? facts.usage : undefined;
  const model = usage?.model || a.model;
  const answer = facts.answer?.trim() ? clip$2(facts.answer.trim(), ANSWER_MAX) : undefined;
  const told = isAnswered && answer ? withTurn(a, { from: "agent", text: answer, at: facts.at }) : a;
  return {
    ...told,
    status: isAnswered ? "done" : "failed",
    endReason: isAnswered ? undefined : facts.reason,
    endedAt: facts.at,
    answer: answer ?? a.answer,
    ...usage ? { model, tokens: tokensOf(usage), costUsd: costOf(model, usage, false) ?? 0 } : {}
  };
};
const toolActivity = (a, call) => ({
  ...a,
  toolCount: (a.toolCount || 0) + 1,
  lastTool: toolName(String(call.tool ?? "")),
  lastTarget: toolTarget(call) || undefined,
  lastDetail: toolDetail(call) || undefined,
  lastPlain: purposeOf(call) || plainCall(String(call.tool ?? ""), call, plainLang())
});
const ownTasks = (a, call, result) => ({
  ...a,
  todos: applyTaskTool(a.todos ?? [], call, result)
});
const stepReport = (a, input) => {
  const total = Math.max(0, Math.round(input.total ?? a.stepTotal ?? 0));
  const done = Math.max(0, Math.round(input.done ?? a.stepDone ?? 0));
  return { ...a, stepTotal: total, stepDone: total ? Math.min(total, done) : done, stepNote: input.note?.trim() || undefined };
};
const heard = (a, at) => ({ ...a, heardAt: Math.max(a.heardAt ?? 0, at) });
const isRunning = (a) => a.status === "running";
const elapsed = (a, at) => (a.endedAt ?? Math.max(at, a.startedAt)) - a.startedAt;
const ctxOf = (a) => a.contextMax ? Math.min(100, Math.round(a.contextTokens / a.contextMax * 100)) : 0;
const totals = (list, at) => {
  if (!list.length)
    return { cost: 0, tokens: 0, time: 0 };
  const start = Math.min(...list.map((a) => a.startedAt));
  const end = Math.max(...list.map((a) => a.endedAt ?? Math.max(at, a.startedAt)));
  return {
    cost: list.reduce((sum, a) => sum + a.costUsd, 0),
    tokens: list.reduce((sum, a) => sum + a.tokens, 0),
    time: end - start
  };
};

const ENDED = ["completed", "failed", "killed"];
const isEnded = (info) => ENDED.includes(info.status);
const arrival = (info, list, at) => ({
  id: info.id,
  agentId: info.id,
  parentId: info.parentId,
  type: info.type,
  description: info.description,
  model: "",
  status: "running",
  startedAt: at,
  contextTokens: 0,
  contextMax: windowOf(""),
  tokens: 0,
  costUsd: 0,
  steps: 0,
  round: 1,
  look: nextLook(list),
  toolCount: 0
});
const settled = (a, info, at) => ({
  ...a,
  status: info.status === "completed" ? "done" : "failed",
  endReason: info.status === "killed" ? "aborted" : a.endReason,
  endedAt: a.endedAt ?? at
});
const sameWords = (a, info) => a.agentId === undefined && a.status === "running" && a.description === info.description && a.type === info.type;
const adopt = (a, info) => ({ ...a, agentId: info.id, parentId: a.parentId ?? info.parentId });
const reopen = (a) => a.status === "running" || a.endReason === "aborted" ? a : { ...a, status: "running", endReason: undefined, endedAt: undefined };
function reconcile(list, roster, at) {
  let next = list;
  for (const info of roster) {
    const known = next.find((a) => a.agentId === info.id || a.id === info.id);
    const waiting = known ? undefined : next.find((a) => sameWords(a, info));
    if (waiting)
      next = next.map((a) => a === waiting ? adopt(a, info) : a);
    else if (!known && !isEnded(info))
      next = [...next, arrival(info, next, at)].slice(-MAX_RUNS);
    else if (known?.status === "running" && isEnded(info))
      next = next.map((a) => a === known ? settled(a, info, at) : a);
    else if (known && info.status === "waiting" && reopen(known) !== known)
      next = next.map((a) => a === known ? reopen(a) : a);
  }
  return next;
}

const MAIN_ID = "main";
const TITLE_MAX$1 = 80;
const isMain = (a) => a.isMain === true;
const crewOf = (list) => list.filter((a) => !isMain(a));
const titleOf$1 = (prompt) => {
  const line = prompt.split(`
`).find((text) => text.trim())?.trim() ?? "";
  return line.startsWith("/") ? "" : clip$2(line, TITLE_MAX$1);
};
function mainAwake(list, start) {
  const known = list.find(isMain);
  if (known && start.title === undefined)
    return known.status === "running" ? list : list.map((a) => a === known ? reopen(a) : a);
  const description = start.title || known?.description || t().mainTask;
  const spawn = { id: MAIN_ID, agentId: MAIN_ID, type: t().mainType, description, model: known?.model ?? "", at: start.at };
  return addRun(list, spawn).map((a) => a.id === MAIN_ID ? { ...a, isMain: true } : a);
}

const TIER_COLOR = {
  fable: "#7F77DD",
  heavy: "#D85A30",
  careful: "#BA7517",
  medium: "#378ADD",
  light: "#1D9E75",
  other: "#888780"
};
const TIER_MODEL = {
  fable: "Fable · high",
  heavy: "Opus · xhigh",
  careful: "Opus · high",
  medium: "Opus · medium",
  light: "Opus · low"
};
const EFFORT_TIER = {
  max: "heavy",
  xhigh: "heavy",
  high: "careful",
  medium: "medium",
  low: "light"
};
const colorOf = (tier) => TIER_COLOR[tier] ?? "#888780";
const savvyTierOf = (type) => {
  const bare = type.replace(/^[^:]*:/, "");
  const tier = bare.replace(/^savvy-/, "").toLowerCase();
  return bare.startsWith("savvy-") && Object.hasOwn(TIER_MODEL, tier) ? tier : null;
};
const effortTierOf = (effort = "") => Object.hasOwn(EFFORT_TIER, effort) ? EFFORT_TIER[effort] ?? null : null;
const tierOf = (a) => savvyTierOf(a.type) ?? effortTierOf(a.effort) ?? "other";
const costumeOf = (a) => savvyTierOf(a.type) ?? (a.type === "Explore" ? "explore" : tierOf(a));
const effortWord = (effort = "") => t().efforts[effort] ?? effort;
const tierWordOf = (a) => savvyTierOf(a.type) ?? (effortTierOf(a.effort) ? effortWord(a.effort) : a.type);
const plannedTierOf = (tier) => Object.hasOwn(TIER_MODEL, tier) ? tier : "other";

const INK = "#1F1E1D";
const stamp$1 = (f, { x, y, rows, map, cls }) => rows.forEach((row, dy) => [...row].forEach((ch, dx) => map[ch] && f([x + dx, y + dy, 1, 1], map[ch] ?? "", cls)));
const eyesOf = (f, kind) => {
  const isWide = kind === "wide";
  const isTall = kind === "tall";
  const y = isTall ? 11 : 12;
  const h = isTall ? 3 : 2;
  f([isWide ? 8 : 9, y, 2, h], INK);
  if (kind === "wink")
    f([19, 13, 3, 1], INK);
  else
    f([isWide ? 20 : 19, y, 2, h], INK);
};
const crabBody = (f, arm, look) => {
  const c = look.shell;
  f([7, 10, 16, 12], c);
  f([3, 14, 4, 4], c);
  f([23, 14 + (arm.front ?? 0), 4, 4], c, arm.cls);
  if (arm.face)
    arm.face.forEach((box) => f(box, INK));
  else
    eyesOf(f, look.eyes);
  f([7, 22, 2, 4], c, "la");
  f([17, 22, 2, 4], c, "la");
  f([11, 22, 2, 4], c, "lb");
  f([21, 22, 2, 4], c, "lb");
};
const CRAB_CSS = `<style>
.run .la{animation:st .5s steps(1) infinite}.run .lb{animation:st .5s steps(1) infinite -.25s}
.run .bd{animation:bob .5s steps(1) infinite -.125s}
.run g{transform-box:fill-box}
@keyframes st{50%{transform:translateY(-1px)}}@keyframes bob{50%{transform:translateY(1px)}}
.c-fable.run{animation:float 1s ease-in-out infinite}
.c-fable.run .la,.c-fable.run .lb,.c-fable.run .bd{animation:none}
.c-fable.run .ant{animation:blink 1s steps(1) infinite}
.c-fable.run .star{animation:blink .5s steps(1) infinite -.25s}
@keyframes float{50%{transform:translateY(-2px)}}@keyframes blink{50%{opacity:.15}}
.c-heavy.run .it{animation:scan 1s steps(1) infinite}
.c-heavy.run .gl{animation:blink 1s steps(1) infinite -.5s}
@keyframes scan{25%{transform:translate(-1px,1px)}50%{transform:translate(-2px,2px)}75%{transform:translate(-1px,1px)}}
.c-careful.run .it{transform-origin:100% 100%;animation:twist .5s ease-in-out infinite}
@keyframes twist{50%{transform:rotate(-35deg)}}
.c-medium.run .pan{transform-origin:0 50%;animation:tilt 1s ease-in-out infinite}
.c-medium.run .egg{animation:flip 1s ease-in-out infinite}
@keyframes tilt{20%,40%{transform:rotate(-12deg)}}@keyframes flip{30%{transform:translateY(-5px) scaleY(-1)}60%{transform:translateY(0)}}
.c-light.run .la{animation-duration:.25s}.c-light.run .lb{animation-duration:.25s;animation-delay:-.125s}
.c-light.run .flag{transform-origin:0 50%;animation:wave .25s steps(1) infinite}
@keyframes wave{50%{transform:skewY(-12deg) scaleX(.85)}}
.c-explore.run .it{transform-origin:50% 100%;animation:fence .5s ease-in-out infinite}
@keyframes fence{50%{transform:rotate(25deg)}}
@media (prefers-reduced-motion: reduce){.run,.run g{animation:none!important}}
</style>`;
const COSTUMES = {
  fable: (f, t, look) => {
    crabBody(f, {}, look);
    f([6, 7, 18, 1], "#E6E8EE");
    f([5, 8, 1, 14], "#E6E8EE");
    f([24, 8, 1, 14], "#E6E8EE");
    f([6, 22, 18, 1], "#C9CCD2");
    f([6, 8, 18, 14], "rgba(169,214,245,.32)");
    f([8, 9, 2, 1], "#fff");
    f([8, 10, 1, 2], "#fff");
    f([14, 4, 2, 3], "#C9CCD2");
    f([14, 2, 2, 2], t, "ant");
    f([13, 18, 4, 2], t);
    f([27, 3, 1, 3], "#F5C542", "star");
    f([26, 4, 3, 1], "#F5C542", "star");
  },
  heavy: (f, t, look) => {
    crabBody(f, { front: -4, cls: "it" }, look);
    stamp$1(f, { x: 6, y: 3, rows: ["......bbbbbb......", "....bbcbbcbbbb....", "...bbbbbbbbbbbb...", "..bcbbcbbcbbcbbb..", ".bbbbbbbbbbbbbbbb.", "dddddddddddddddddd"], map: { b: "#7A4A26", c: "#A0703F", d: "#5A3519" } });
    f([6, 9, 18, 1], t);
    stamp$1(f, { x: 23, y: 1, rows: [".kkk.", "k...k", "k...k", "k...k", ".kkk."], map: { k: "#3A3A3C" }, cls: "it" });
    f([24, 2, 3, 3], "rgba(169,214,245,.7)", "it");
    f([25, 6, 1, 4], "#7A4A26", "it");
    f([24, 2, 1, 1], "#fff", "gl");
  },
  careful: (f, t, look) => {
    crabBody(f, {}, look);
    stamp$1(f, { x: 6, y: 4, rows: [".....yyyyyyyy.....", "...yyyyyhhyyyyy...", "..yyyyyyhhyyyyyy..", "..yyyyyyhhyyyyyy..", ".yyyyyyyhhyyyyyyy.", "dddddddddddddddddd"], map: { y: "#F5C542", h: "#FBE08A", d: "#C99A1E" } });
    f([13, 5, 4, 2], t);
    stamp$1(f, { x: 0, y: 10, rows: [".s.s", "sss.", ".s..", ".s.."], map: { s: "#8E929A" }, cls: "it" });
  },
  medium: (f, t, look) => {
    crabBody(f, { front: -4, cls: "pan" }, look);
    stamp$1(f, { x: 6, y: 0, rows: ["........lll.......", ".......lllll......", ".wwwwgwwwwwwgwwwww", "wwwwwwwwwwwwwwwwww", "wwwwwwwwwwwwwwwwww", "wwwwwgwwwwwggwwwww", ".wwwwgwwwwwggwwwww", ".dddbbbbbbbbbbbbb.", ".dddbbbbbbbbbbbbb.", ".dddbbbbbbbbbbbbb."], map: { w: "#F4F3EE", l: "#F7F6F2", g: "#D2D1C8", b: t, d: "#B45F43" } });
    f([22, 8, 7, 2], "#4A4A48", "pan");
    f([26, 10, 1, 1], "#4A4A48", "pan");
    f([24, 7, 3, 1], "#F5B731", "egg");
  },
  light: (f, t, look) => {
    crabBody(f, { front: -4 }, look);
    stamp$1(f, { x: 6, y: 5, rows: ["....rrrrrrrrrr....", "..rrrrrrwwrrrrrr..", ".rrrrrrrwwrrrrrrr.", ".rrrrrrrwwrrrrrrr.", ".rrrrrrrwwrrrrrrr.", ".kkkkkkkkkkkkkkkkr"], map: { r: t, w: "#F8F6F1", k: INK } });
    f([25, 1, 1, 9], "#8E929A");
    stamp$1(f, { x: 26, y: 1, rows: ["wkwk", "kwkw", "wkwk"], map: { w: "#F8F6F1", k: INK }, cls: "flag" });
  },
  explore: (f, _t, look) => {
    crabBody(f, {}, look);
    stamp$1(f, { x: 5, y: 3, rows: [".kk..............kk.", ".kkk....kkkk....kkk.", "..kkkkkkkwwkkkkkkk..", "..kkkkkkkkkkkkkkkk..", ".gggggggggggggggggg."], map: { k: "#55514C", w: "#F8F6F1", g: "#F5C542" } });
    f([7, 11, 11, 1], INK);
    f([18, 11, 4, 3], INK);
    f([27, 6, 1, 9], "#C9CCD2", "it");
    f([26, 15, 3, 1], "#7A4A26", "it");
  },
  other: (f, _t, look) => crabBody(f, {}, look)
};
const FACES$1 = {
  sleeping: [[9, 13, 2, 1], [19, 13, 2, 1]],
  working: undefined,
  happy: [[9, 12, 2, 1], [8, 13, 1, 1], [11, 13, 1, 1], [19, 12, 2, 1], [18, 13, 1, 1], [21, 13, 1, 1]],
  worried: [[9, 13, 2, 2], [19, 13, 2, 2]]
};
const SWEAT = "#7FB6E8";
const HAPPY_CLAW = -4;
const moodBody = (f, look, mood) => {
  crabBody(f, { front: mood === "happy" ? HAPPY_CLAW : undefined, face: FACES$1[mood] }, look);
  if (mood !== "worried")
    return;
  f([4, 8, 1, 1], SWEAT);
  f([3, 9, 3, 2], SWEAT);
};
const CRAB_SCALE = 1.1;
const crab$3 = (x, y, opts) => {
  const groups = new Map([["bd", []]]);
  const f = ([cx, cy, w, h], c, cls = "bd") => {
    if (!groups.has(cls))
      groups.set(cls, []);
    groups.get(cls)?.push(`<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${c}"/>`);
  };
  const look = opts.look ?? lookAt(0);
  const draw = COSTUMES[opts.costume] ?? ((g, _t, l) => crabBody(g, {}, l));
  const mood = opts.mood;
  if (mood)
    moodBody(f, look, mood);
  else
    draw(f, colorOf(opts.costume), look);
  const group = (cls) => `<g class="${cls}">${(groups.get(cls) ?? []).join("")}</g>`;
  const props = [...groups.keys()].filter((k) => k !== "bd" && k !== "la" && k !== "lb");
  const body = `<g class="bd">${(groups.get("bd") ?? []).join("")}${props.map(group).join("")}</g>`;
  const walk = opts.isWalking ? " run" : "";
  return `<g transform="translate(${x},${y}) scale(${opts.scale ?? CRAB_SCALE})" opacity="${opts.isDim ? 0.45 : 1}" shape-rendering="crispEdges"><g class="c-${opts.costume}${walk}">${body}${group("la")}${group("lb")}</g></g>`;
};

const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,system-ui,sans-serif";
const MONO = "ui-monospace,'SF Mono',Menlo,monospace";
const NEUTRALS = {
  t: ["#1C1B19", "#F0EEE8"],
  s: ["#4F4B44", "#C2BEB4"],
  m: ["#706B63", "#8E8A80"],
  k: ["#ECE8DF", "#34332F"],
  card: ["#FFFFFF", "#1F1F1C"],
  chip: ["#F6F4EF", "#171715"]
};
const STROKES = {
  ln: ["#E4E0D6", "#2E2E2A"],
  "i-m": ["#706B63", "#8E8A80"],
  "i-s": ["#4F4B44", "#C2BEB4"],
  rk: ["#ECE8DF", "#34332F"]
};
const ROLES = {
  read: { fg: ["#2464A0", "#7FB6E8"], tint: ["#E7F0F9", "#1E2B37"], line: ["#B9D3EC", "#2F4A63"] },
  edit: { fg: ["#A94A26", "#E58A5F"], tint: ["#FBEDE6", "#38251D"], line: ["#EFC6B4", "#6A3E2D"] },
  plan: { fg: ["#A8337F", "#E07BC0"], tint: ["#FBE9F4", "#351F2E"], line: ["#EDBFDC", "#6B3A5C"] },
  run: { fg: ["#6243C4", "#B19CF3"], tint: ["#F0ECFC", "#29243D"], line: ["#CFC3F3", "#4A3F75"] },
  ok: { fg: ["#1F6E43", "#6FC593"], tint: ["#E4F4EA", "#1B2F25"], line: ["#B5DEC4", "#2F5A42"] },
  warn: { fg: ["#8A6000", "#E9B949"], tint: ["#FBF2D9", "#332D19"], line: ["#EBD48F", "#66552A"] },
  danger: { fg: ["#C0263A", "#F2727F"], tint: ["#FCE8EA", "#3B2023"], line: ["#F1B9C0", "#74343C"] }
};
const rulesOf = (side) => {
  const fills = Object.entries(NEUTRALS).map(([cls, pair]) => `.${cls}{fill:${pair[side]}}`);
  const strokes = Object.entries(STROKES).map(([cls, pair]) => `.${cls}{stroke:${pair[side]}}`);
  const roles = Object.entries(ROLES).map(([role, c]) => `.f-${role}{fill:${c.fg[side]}}.b-${role}{fill:${c.tint[side]}}.l-${role}{stroke:${c.line[side]}}.i-${role}{stroke:${c.fg[side]}}`);
  return [...fills, ...strokes, ...roles].join("");
};
const TIDEMARK_CSS = `<style>
${rulesOf(0)}
@media (prefers-color-scheme: dark){${rulesOf(1)}}
.live{animation:p 1.8s ease-in-out infinite}@keyframes p{50%{opacity:.35}}
.chev{transition:transform .16s cubic-bezier(.2,.8,.2,1)}svg:hover .chev{transform:translateX(2px)}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
</style>`;
const paneSvg = (W, H, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${TIDEMARK_CSS}${CRAB_CSS}${body}</svg>`;

const HOME_LOOK = lookAt(0);
const SNOOZE$1 = { x1: 27, y1: 6, x2: 30, y2: 2.6, size1: 4.8, size2: 3.5, min1: 9, min2: 7 };
const snoozeSvg = (x, y, scale) => {
  const big = Math.max(SNOOZE$1.min1, SNOOZE$1.size1 * scale);
  const small = Math.max(SNOOZE$1.min2, SNOOZE$1.size2 * scale);
  const z = (zx, zy, size) => `<text class="m" x="${x + zx * scale}" y="${y + zy * scale}" font-family="${FONT}" font-size="${size}" font-weight="700">z</text>`;
  return z(SNOOZE$1.x1, SNOOZE$1.y1, big) + z(SNOOZE$1.x2, SNOOZE$1.y2, small);
};
const homeCrab = (x, y, opts) => {
  const { mood, isMoving } = opts.home;
  const body = crab$3(x, y, { costume: "other", look: HOME_LOOK, mood, isWalking: isMoving && mood === "working", scale: opts.scale });
  return mood === "sleeping" ? body + snoozeSvg(x, y, opts.scale) : body;
};
const LEVEL_PILL = { h: 16, padX: 7, size: 10 };
const BOLD$6 = 1.06;
const levelWidth = (text) => Math.ceil(textWidth(text, LEVEL_PILL.size) * BOLD$6 + LEVEL_PILL.padX * 2);
const levelPill = (text, x, y) => {
  const w = levelWidth(text);
  const r = (LEVEL_PILL.h - 1) / 2;
  return `<rect class="chip ln" x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${LEVEL_PILL.h - 1}" rx="${r}" stroke-width="1"/><text class="s" x="${x + w / 2}" y="${y + LEVEL_PILL.h / 2 + LEVEL_PILL.size * 0.35}" text-anchor="middle" font-family="${FONT}" font-size="${LEVEL_PILL.size}" font-weight="600" font-variant-numeric="tabular-nums">${xml(text)}</text>`;
};
const FACES = { sleeping: "(-_-) zz", working: "(•_•)", happy: "(^_^)", worried: "(°_°;)" };

const GAP$3 = 3;
const MIN_SEG = 6;
const classOf = (view, i) => {
  const ok = view.done - view.failed;
  if (i < ok)
    return "m";
  if (i < view.done)
    return "f-danger";
  return i < view.done + view.active ? "f-edit" : "k";
};
const RUN_SHARE = 0.34;
const rect = (track, { x, w, cls }) => `<rect class="${cls}" x="${x.toFixed(1)}" y="${track.y}" width="${Math.max(0, w).toFixed(1)}" height="${track.h}" rx="${track.h / 2}"/>`;
const solid = (view, track) => {
  const unit = track.w / Math.max(1, view.units);
  const ok = view.done - view.failed;
  const parts = [rect(track, { x: track.x, w: track.w, cls: "k" })];
  const spans = [[0, ok, "m"], [ok, view.done, "f-danger"], [view.done, view.done + view.active, "f-edit"]];
  for (const [from, to, cls] of spans)
    if (to > from)
      parts.push(rect(track, { x: track.x + from * unit, w: (to - from) * unit, cls }));
  return parts.join("");
};
const running = (track, x, w) => rect(track, { x, w, cls: "k" }) + rect(track, { x, w: w * RUN_SHARE, cls: "f-edit live" });
const meterSvg = (view, track) => {
  const units = view.units;
  if (units < 1)
    return rect(track, { x: track.x, w: track.w, cls: "k" });
  const seg = (track.w - GAP$3 * (units - 1)) / units;
  if (seg < MIN_SEG)
    return solid(view, track);
  return Array.from({ length: units }, (_, i) => {
    const x = track.x + i * (seg + GAP$3);
    const cls = classOf(view, i);
    return cls === "f-edit" ? running(track, x, seg) : rect(track, { x, w: seg, cls });
  }).join("");
};

const PHASES = ["plan", "design", "delegate", "review", "close"];
const TIERS = ["fable", "heavy", "careful", "medium", "light"];
const MAX_TASKS = 200;
const MAX_AFTER = 20;
const MAX_TITLE = 120;
const blankFlow = () => ({
  title: "savvy-flow",
  total: 0,
  done: 0,
  phase: "plan",
  isFinished: false,
  tasks: []
});
const isNewFlow = (prev, input) => !prev || prev.isFinished || input.title !== undefined && clip$2(input.title.trim(), MAX_TITLE) !== prev.title;
const tierName = (v) => {
  const tier = v.replace(/^savvy-/, "").trim().toLowerCase();
  return TIERS.includes(tier) ? tier : "";
};
const cleanTasks = (tasks) => tasks?.filter((task) => task.title?.trim()).slice(0, MAX_TASKS).map((task) => ({
  title: (task.title ?? "").trim(),
  tier: tierName(task.tier ?? ""),
  after: (task.after ?? []).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX_AFTER)
}));
const mergeFlow = (prev, input) => {
  const base = isNewFlow(prev, input) || !prev ? blankFlow() : { ...blankFlow(), ...prev };
  const tasks = cleanTasks(input.tasks) ?? base.tasks;
  const total = Math.min(MAX_TASKS, Math.max(0, Math.round(input.total ?? (input.tasks ? tasks.length : base.total))));
  const done = Math.min(total || 1 / 0, Math.max(0, Math.round(input.done ?? base.done)));
  const phase = input.phase && PHASES.includes(input.phase) ? input.phase : base.phase;
  return {
    title: clip$2(input.title?.trim() || base.title, MAX_TITLE),
    total,
    done,
    phase: input.finished ? "close" : phase,
    isFinished: input.finished === true,
    tasks
  };
};
const plannedOf = (f, list) => {
  if (!f || f.isFinished)
    return [];
  const started = new Set(list.map((a) => norm(a.description)));
  return (f.tasks ?? []).map((task, i) => ({ ...task, n: i + 1 })).filter((task) => !started.has(norm(task.title)));
};

const NEAR_DONE = 0.99;
const PERCENT$2 = 100;
const partialOf = (a) => {
  if (a.status !== "running")
    return null;
  if (a.stepTotal)
    return Math.min(1, (a.stepDone ?? 0) / a.stepTotal);
  const own = countTasks(a.todos ?? []);
  return own.total ? own.done / own.total : null;
};
const creditOf = (list) => {
  const parts = list.map(partialOf).filter((p) => p !== null && p > 0);
  return { sum: parts.reduce((sum, p) => sum + p, 0), isEstimate: parts.length > 0 };
};
const NO_CREDIT = { sum: 0, isEstimate: false };
const ratioOf = ({ done, credit, total, isFinished }) => {
  if (isFinished)
    return 1;
  if (!total)
    return null;
  const ratio = Math.min(NEAR_DONE, (done + credit.sum) / total);
  return ratio > 0 ? ratio : null;
};
const jobAgents = (input) => {
  const { job } = input;
  if (!job || job.isHidden)
    return [];
  return input.agents.filter((a) => job.agentIds.includes(a.id));
};
const agentsTitle = (list) => {
  const first = list[0];
  const name = first ? first.description || first.type : t().agents;
  return list.length > 1 ? `${name} +${list.length - 1}` : name;
};
const reportLabel = (f, running) => {
  const s = t();
  if (f.isFinished)
    return s.done;
  if (f.phase === "plan")
    return s.plan;
  if (f.phase === "design")
    return s.design;
  const word = f.phase === "review" ? s.review : s.tasks;
  if (f.total)
    return `${word} ${f.done}/${f.total}`;
  return running ? `${word} · ${running} ${s.busy}` : word;
};
function reportView(f, list, input) {
  const running = list.filter((a) => a.status === "running");
  const credit = f.total ? creditOf(running) : NO_CREDIT;
  const handed = new Set(list.map((a) => norm(a.description))).size;
  const launched = f.total ? Math.min(f.total, Math.max(f.done + running.length, handed)) / f.total : 0;
  const done = f.isFinished ? f.total : Math.min(f.done, f.total);
  return {
    source: "report",
    title: f.title,
    label: reportLabel(f, running.length),
    ratio: ratioOf({ done: f.done, credit, total: f.total, isFinished: f.isFinished }),
    isEstimate: credit.isEstimate && !f.isFinished,
    launched: f.isFinished ? 1 : launched,
    units: f.total,
    done,
    active: f.isFinished ? 0 : Math.max(0, Math.round(launched * f.total) - done),
    isFinished: f.isFinished,
    isWorking: running.length > 0,
    crew: input.agents.length + plannedOf(f, input.agents).length,
    failed: 0
  };
}
function tasksView(tasks, list) {
  const count = countTasks(tasks);
  const running = list.filter((a) => a.status === "running").length;
  const isFinished = count.done === count.total && running === 0;
  return {
    source: "tasks",
    title: agentsTitle(list),
    label: isFinished ? t().done : `${t().tasks} ${count.done}/${count.total}`,
    ratio: ratioOf({ done: count.done, credit: NO_CREDIT, total: count.total, isFinished }),
    isEstimate: false,
    launched: isFinished ? 1 : (count.done + count.active) / count.total,
    units: count.total,
    done: count.done,
    active: isFinished ? 0 : count.active,
    isFinished,
    isWorking: running > 0,
    crew: list.length,
    failed: 0
  };
}
function agentsView(list) {
  const s = t();
  const running = list.filter((a) => a.status === "running");
  const ended = list.length - running.length;
  const failed = list.filter((a) => a.status === "failed").length;
  const isFinished = running.length === 0;
  const credit = creditOf(running);
  const done = failed ? `${s.done} · ${s.errors(failed)}` : s.done;
  return {
    source: "agents",
    title: agentsTitle(list),
    label: isFinished ? done : `${s.agents} ${ended}/${list.length}`,
    ratio: ratioOf({ done: ended, credit, total: list.length, isFinished }),
    isEstimate: credit.isEstimate && !isFinished,
    launched: 1,
    units: list.length,
    done: ended,
    active: running.length,
    isFinished,
    isWorking: !isFinished,
    crew: list.length,
    failed
  };
}
function deriveJob(input) {
  const list = jobAgents(input);
  if (input.flow)
    return reportView(input.flow, list, input);
  if (!list.length)
    return null;
  return input.tasks.length ? tasksView(input.tasks, list) : agentsView(list);
}
const percentText = (view) => {
  if (view.ratio === null)
    return "—";
  const n = Math.max(1, Math.round(view.ratio * PERCENT$2));
  return `${view.isEstimate ? "~" : ""}${t().pct(n)}`;
};
const joinJob = (prev, id, at) => {
  if (!prev || prev.isSealed)
    return { agentIds: [id], startedAt: at, isSealed: false, isHidden: false };
  return { ...prev, agentIds: [...prev.agentIds.filter((other) => other !== id), id] };
};
const sealJob = (prev, list) => {
  if (!prev)
    return null;
  const isBusy = list.some((a) => prev.agentIds.includes(a.id) && a.status === "running");
  return isBusy ? prev : { ...prev, isSealed: true };
};

const BAND_H = 26;
const BASELINE$1 = 17.5;
const TITLE_X = 11;
const TITLE_SIZE = 13;
const TITLE_MIN = 64;
const BOLD$5 = 1.06;
const GAP$2 = 8;
const PILL$1 = { y: 3, h: 20, padX: 9, size: 11 };
const METER$2 = { h: 6, min: 36, max: 360 };
const PERCENT_SIZE = 12.5;
const MONO_EM$1 = 0.6;
const CRAB$1 = { w: 24, y: 2, scale: 0.8 };
const UNKNOWN$1 = "—";
const pillRole = (view) => {
  if (!view.isFinished)
    return "run";
  return view.failed ? "warn" : "ok";
};
const PILL_INK$1 = { run: "f-edit", ok: "s", warn: "f-warn", danger: "f-danger" };
const pillSvg = ({ label, role, x, w }) => `<rect class="k" x="${x}" y="${PILL$1.y}" width="${w}" height="${PILL$1.h}" rx="${PILL$1.h / 2}"/>
<text class="${PILL_INK$1[role]}" x="${x + w / 2}" y="${BASELINE$1 - 0.5}" text-anchor="middle" font-family="${FONT}" font-size="${PILL$1.size}" font-weight="600">${xml(label)}</text>`;
const planOf = (view, maxW) => {
  const pillW = Math.ceil(textWidth(view.label, PILL$1.size) * BOLD$5 + PILL$1.padX * 2);
  const pctW = percentText(view) === UNKNOWN$1 ? 0 : Math.ceil(percentText(view).length * PERCENT_SIZE * MONO_EM$1);
  const avail = maxW - TITLE_X - pillW - pctW - CRAB$1.w - GAP$2 * 4;
  const natural = Math.ceil(textWidth(view.title, TITLE_SIZE) * BOLD$5);
  if (avail - natural >= METER$2.min)
    return { title: view.title, titleW: natural, meterW: Math.min(METER$2.max, avail - natural), pillW, pctW };
  const titleW = Math.max(TITLE_MIN, avail - METER$2.min);
  const meterW = avail - titleW;
  const fits = meterW >= METER$2.min;
  const room = fits ? titleW : Math.max(TITLE_MIN, avail + GAP$2);
  const title = fitText(view.title, TITLE_SIZE * BOLD$5, room);
  return { title, titleW: Math.min(room, Math.ceil(textWidth(title, TITLE_SIZE) * BOLD$5)), meterW: fits ? meterW : 0, pillW, pctW };
};
const bandCrab = (x, mood) => crab$3(x, CRAB$1.y, { costume: "other", look: HOME_LOOK, mood, scale: CRAB$1.scale });
const bandSvg = (view, maxW, mood) => {
  const plan = planOf(view, maxW);
  const pillX = TITLE_X + plan.titleW + GAP$2;
  const meterX = pillX + plan.pillW + GAP$2;
  const pctX = meterX + (plan.meterW ? plan.meterW + GAP$2 : 0);
  const crabX = pctX + (plan.pctW ? plan.pctW + GAP$2 : 0);
  const width = Math.ceil(mood ? crabX + CRAB$1.w : crabX - GAP$2);
  const body = [
    `<text class="t" x="${TITLE_X}" y="${BASELINE$1}" font-family="${FONT}" font-size="${TITLE_SIZE}" font-weight="600">${xml(plan.title)}</text>`,
    pillSvg({ label: view.label, role: pillRole(view), x: pillX, w: plan.pillW }),
    plan.meterW ? meterSvg(view, { x: meterX, y: (BAND_H - METER$2.h) / 2, w: plan.meterW, h: METER$2.h }) : "",
    plan.pctW ? `<text class="t" x="${pctX}" y="${BASELINE$1}" font-family="${MONO}" font-size="${PERCENT_SIZE}" font-weight="650">${xml(percentText(view))}</text>` : "",
    mood ? bandCrab(crabX, mood) : ""
  ];
  return { source: paneSvg(width, BAND_H, body.join(`
`)), width };
};

const SECOND$4 = 1000;
const MINUTE$4 = 60 * SECOND$4;
const HEARTBEAT_MS = 30 * SECOND$4;
const SCAN_MS = 5 * SECOND$4;
const STALE_MS = 2 * MINUTE$4;
const KEY_PREFIX = "sessions/";
const TITLE_MAX = 40;
const SECRET_LIKE = /\b(?=[A-Za-z0-9_\-]*\d)(?=[A-Za-z0-9_\-]*[A-Za-z])[A-Za-z0-9_\-]{20,}\b/g;
const MASK = "•••";
const WRAPPED = /<([a-z][\w-]*)[^>]*>[\s\S]*?<\/\1>/gi;
const TAG = /<\/?[a-z][\w-]*[^>]*>/gi;
const STATES = ["working", "waiting", "idle"];
const RANK = { waiting: 0, working: 1, idle: 2 };
const keyOf = (id) => `${KEY_PREFIX}${id}`;
const stateOf$1 = (self) => {
  if (self.asks.length > 0)
    return "waiting";
  return self.isWorking ? "working" : "idle";
};
const titleOf = (text) => {
  const said = text.replace(WRAPPED, " ").replace(TAG, " ");
  const line = said.split(`
`).map((part) => part.trim()).find(Boolean) ?? "";
  return clip$2(line.replace(/\s+/g, " ").replace(SECRET_LIKE, MASK), TITLE_MAX);
};
const projectOf = (path) => path.replace(/\/+$/, "").split("/").at(-1) || path;
const blankSelf = (at) => ({ id: "", project: "", title: "", isWorking: false, asks: [], since: at });
const settle = (prev, next, at) => stateOf$1(prev) === stateOf$1(next) ? next : { ...next, since: at };
const withAsk = (self, id) => self.asks.includes(id) ? self : { ...self, asks: [...self.asks, id] };
const withoutAsk = (self, id) => self.asks.includes(id) ? { ...self, asks: self.asks.filter((ask) => ask !== id) } : self;
const sharedOf = (list) => list.filter((a) => isRunning(a) && a.isMain !== true).map((a) => ({ id: a.id, name: lookOf(a).name, title: titleOf(a.description || a.type), startedAt: a.startedAt, costUsd: a.costUsd }));
const beatOf = (self, at, agents = []) => ({
  project: self.project,
  title: self.title,
  state: stateOf$1(self),
  since: self.since,
  at,
  ...agents.length > 0 ? { agents } : {}
});
const bodyOf = (beat) => ({
  project: beat.project,
  title: beat.title,
  state: beat.state,
  since: beat.since,
  ...beat.agents ? { agents: beat.agents.map(({ costUsd: _cost, ...who }) => who) } : {}
});
const isHeartbeat = (value) => {
  if (typeof value !== "object" || value === null)
    return false;
  const v = value;
  const isText = typeof v.project === "string" && typeof v.title === "string";
  const isTime = Number.isFinite(v.since) && Number.isFinite(v.at);
  return isText && isTime && STATES.includes(v.state);
};
const isShared = (value) => {
  if (typeof value !== "object" || value === null)
    return false;
  const v = value;
  return typeof v.id === "string" && typeof v.name === "string" && typeof v.title === "string" && Number.isFinite(v.startedAt);
};
const agentsIn = (value, now) => (Array.isArray(value) ? value.filter(isShared) : []).map((a) => ({
  id: a.id,
  name: a.name,
  title: a.title,
  minutes: Math.max(0, Math.floor((now - a.startedAt) / MINUTE$4)),
  costUsd: Number.isFinite(a.costUsd) ? Number(a.costUsd) : 0
}));
const isStale = (beat, now) => now - beat.at > STALE_MS;
function scanOf(entries, own, now) {
  const chats = [];
  const gone = [];
  for (const [key, value] of entries) {
    if (!key.startsWith(KEY_PREFIX) || key === own)
      continue;
    if (!isHeartbeat(value) || isStale(value, now)) {
      gone.push(key);
      continue;
    }
    const minutes = Math.max(0, Math.floor((now - value.since) / MINUTE$4));
    const agents = agentsIn(value.agents, now);
    chats.push({ id: key.slice(KEY_PREFIX.length), project: value.project, title: value.title, state: value.state, minutes, ...agents.length > 0 ? { agents } : {} });
  }
  chats.sort((a, b) => RANK[a.state] - RANK[b.state] || b.minutes - a.minutes || a.id.localeCompare(b.id));
  return { chats, gone };
}
const waitingOf = (chats) => chats.filter((chat) => chat.state === "waiting");
const crewedOf = (chats) => chats.filter((chat) => (chat.agents?.length ?? 0) > 0);
const quietOf = (chats) => chats.filter((chat) => chat.state !== "waiting");
const CHATS_MAX = 8;
const CHAT_AGENTS_MAX = 6;
function listedChats(chats) {
  const listed = chats.slice(0, CHATS_MAX).map((chat) => chat.agents && chat.agents.length > CHAT_AGENTS_MAX ? { ...chat, agents: chat.agents.slice(0, CHAT_AGENTS_MAX) } : chat);
  return { chats: listed, more: chats.length - listed.length };
}

function isSame(a, b) {
  if (Object.is(a, b))
    return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
    return false;
  if (Array.isArray(a) !== Array.isArray(b))
    return false;
  const left = a;
  const right = b;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length)
    return false;
  return keys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && isSame(left[key], right[key]));
}

const DETAIL_MAX = 40;
const SEP = " · ";
const isOwnOpen = (value) => typeof value === "object" && value !== null && value.pane === HUB_PANE;
const toneOf$1 = (view) => {
  if (!view)
    return "idle";
  if (!view.isFinished)
    return "live";
  return view.failed ? "warn" : "ok";
};
const hubDetailOf = (view, running, others = {}) => {
  const { waiting = 0, working = 0 } = others;
  const crew = running > 0 ? `${SEP}${t().hubCrew(running)}` : "";
  const jobPart = view ? `${view.label}${crew}` : "";
  const works = working > 0 ? t().chats.hubWorks(working) : "";
  const waits = waiting > 0 ? t().chats.hubWaits(waiting) : works;
  if (!waits)
    return clip$2(jobPart, DETAIL_MAX);
  if (!view)
    return clip$2(waits, DETAIL_MAX);
  const room = DETAIL_MAX - waits.length - SEP.length;
  const lead = jobPart.length <= room ? jobPart : clip$2(view.label, room);
  return `${lead}${SEP}${waits}`;
};
const LIVE_LINES = 3;
const LABEL_MAX = 48;
const COST_MIN = 0.005;
const hubLiveOf = (agents) => {
  const running = [...agents.filter((a) => isRunning(a) && isMain(a)), ...crewOf(agents).filter(isRunning)];
  if (running.length === 0)
    return;
  const lines = running.slice(0, LIVE_LINES).map((a) => ({
    label: clip$2(isMain(a) && a.lastPlain || a.description || a.type, LABEL_MAX),
    since: a.startedAt,
    ...a.costUsd >= COST_MIN ? { value: fmtCost(a.costUsd) } : {}
  }));
  return running.length > LIVE_LINES ? { lines, more: running.length - LIVE_LINES } : { lines };
};
const hubCardOf = (src) => {
  const view = deriveJob({ flow: src.flow, agents: src.agents, job: src.job, tasks: src.tasks });
  const others = { waiting: waitingOf(src.chats).length, working: quietOf(src.chats).filter((chat) => chat.state === "working").length };
  const live = hubLiveOf(src.agents);
  const tone = !view && (others.working > 0 || live !== undefined) ? "live" : toneOf$1(view);
  return { detail: hubDetailOf(view, crewOf(src.agents).filter(isRunning).length, others), tone, ...live ? { live } : {} };
};
const isShowing = (card, shown) => card.detail === shown.detail && card.tone === shown.tone && isSame(card.live, shown.live);

const paneKept = () => ({ isHeld: false, needsDraw: true });
const NOTE_PREFIX = "pane-open/";
const noteKey = (sessionId) => `${NOTE_PREFIX}${sessionId}`;
const DAY_MS$1 = 24 * 60 * 60 * 1000;
const NOTE_FRESH_MS = DAY_MS$1;
const NOTE_TTL_MS = 7 * DAY_MS$1;
const isNoted = (value) => value === true || typeof value === "number";
async function drawSafely(kept, o) {
  try {
    const drawn = await o.draw();
    kept.needsDraw = false;
    return drawn;
  } catch (cause) {
    kept.needsDraw = true;
    o.log(`the pane fell back to its plain list (${String(cause)})`);
    return o.plain(cause);
  }
}
const PLAIN_MAX = 20;
function plainPane(ui, o) {
  const { Box, Text } = ui;
  const shown = o.lines.slice(0, PLAIN_MAX);
  return h(Box, {
    flexDirection: "column"
  }, o.head, h(Text, {
    dimColor: true
  }, o.notice), shown.map((line, i) => h(Text, {
    key: `plain-${i}`,
    wrap: "truncate-end"
  }, line)), o.lines.length > shown.length && h(Text, {
    dimColor: true
  }, "…"));
}
function reopenKeptTab(kept, nouns) {
  if (kept.isHeld)
    return;
  kept.isHeld = true;
  nouns.soon(() => {
    (async () => {
      if (!await nouns.isListed())
        await nouns.reopen();
    })().catch((cause) => nouns.log(`could not reopen the pane (${String(cause)})`));
  });
}
async function restorePane(kept, nouns) {
  try {
    if (isNoted(await nouns.note.read())) {
      kept.isHeld = true;
      if (!await nouns.isListed())
        await nouns.reopen();
    }
  } catch (cause) {
    nouns.log(`could not restore the pane (${String(cause)})`);
  }
  nouns.redraw();
}
async function watchPane(kept, nouns, isBeat = false) {
  try {
    const isOpen = await nouns.isListed();
    kept.isHeld ||= isOpen;
    if (!isOpen)
      kept.needsDraw = true;
    const noted = await nouns.note.read();
    const now = await nouns.now();
    const isFresh = typeof noted === "number" && now - noted < NOTE_FRESH_MS;
    if (isOpen && !isFresh)
      await nouns.note.write(now);
    if (!isOpen && isNoted(noted))
      await nouns.note.write(undefined);
    if (isOpen && (kept.needsDraw || isBeat))
      nouns.redraw();
  } catch (cause) {
    nouns.log(`could not look at the pane (${String(cause)})`);
  }
}
function staleNotes(entries, o) {
  return entries.filter(([key, value]) => key.startsWith(NOTE_PREFIX) && key !== o.own && !(typeof value === "number" && o.now - value < NOTE_TTL_MS)).map(([key]) => key);
}

const paneOf = (value) => {
  if (typeof value !== "object" || value === null)
    return null;
  const pane = value.pane;
  return typeof pane === "string" && pane !== "" ? pane : null;
};
function isOffStage(value, pane) {
  const staged = paneOf(value);
  return staged !== null && staged !== pane;
}
const shownOf = (pane, at) => ({ pane, at });

const MINUTE$3 = 60 * 1000;
const REST_MS = 10 * MINUTE$3;
const LEVELS = [10, 50, 200, 1000];
const TURNS_KEY = "crab/turns";
const restingCrab = (turns) => ({ mood: "sleeping", turns, endedAt: 0 });
const levelOf = (turns) => 1 + LEVELS.filter((threshold) => turns >= threshold).length;
const started = (crab) => ({ ...crab, mood: "working" });
const ended = (crab, end) => {
  const isAnswer = end.reason === "answer";
  return { mood: isAnswer ? "happy" : "worried", turns: crab.turns + (isAnswer ? 1 : 0), endedAt: end.at };
};
const rested = (crab, now) => {
  const isAwake = crab.mood === "happy" || crab.mood === "worried";
  return isAwake && now - crab.endedAt >= REST_MS ? { ...crab, mood: "sleeping" } : crab;
};
const isIdleMood = (mood) => mood !== "working";
const turnsFrom = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;

const FILL$1 = /<rect\b[^>]*\bdata-m-fill\b[^>]*>/g;
const DONE = /<path\b[^>]*\bdata-m-done\b[^>]*>/g;
const HAS_DONE = /\bdata-m-done\b/;
const WIDTH = /\swidth="([\d.]+)"/;
const CLASS = /\sclass="([^"]*)"/;
const STYLE = /\sstyle="([^"]*)"/;
const MIN_RATIO_STEP = 0.02;
const RATIO_DIGITS = 3;
const widthOf$1 = (tag) => Number(WIDTH.exec(tag)?.[1] ?? 0);
function withClass(tag, name, extra = "") {
  const tagged = CLASS.test(tag) ? tag.replace(CLASS, (_, classes) => ` class="${classes} ${name}"`) : tag.replace(/\s*\/?>$/, ` class="${name}"$&`);
  return tagged.replace(/\s*\/?>$/, `${extra}$&`);
}
function slideFills(before, now) {
  const old = before.match(FILL$1) ?? [];
  if (old.length !== (now.match(FILL$1) ?? []).length)
    return now;
  let index = 0;
  return now.replace(FILL$1, (tag) => {
    const was = old[index++];
    const from = was === undefined ? 0 : widthOf$1(was);
    const to = widthOf$1(tag);
    if (from <= 0 || to <= 0 || Math.abs(from - to) / to < MIN_RATIO_STEP)
      return tag;
    const slide = `--m-from:${(from / to).toFixed(RATIO_DIGITS)}`;
    const styled = STYLE.test(tag) ? tag.replace(STYLE, (_, rules) => ` style="${slide};${rules}"`) : tag.replace(/\s*\/?>$/, ` style="${slide}"$&`);
    return withClass(styled, "m-from");
  });
}
function drawDone(before, now) {
  if (HAS_DONE.test(before))
    return now;
  return now.replace(DONE, (tag) => withClass(tag, "m-draw", ' pathLength="1"'));
}
function markChanges(before, now) {
  return drawDone(before, slideFills(before, now));
}

const STAGGER_MS = 45;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const SHEEN = "#A39E93";
const RULES = {
  "m-in": `.m-in{animation:m-in .42s ${EASE} both}@keyframes m-in{from{opacity:0;transform:translateY(8px)}}`,
  "m-fade": `.m-fade{animation:m-fade .5s ${EASE} both}@keyframes m-fade{from{opacity:0}}`,
  "m-grow": `.m-grow{transform-box:fill-box;transform-origin:left center;animation:m-grow .7s ${EASE} both}@keyframes m-grow{from{transform:scaleX(0)}}`,
  "m-px": `.m-px{transform-box:fill-box;transform-origin:center;animation:m-px .34s ${EASE} both}@keyframes m-px{from{opacity:0;transform:translateY(-10px) scale(.6)}}`,
  "m-flash": ".m-flash{opacity:0;animation:m-flash 1.6s ease-out both}@keyframes m-flash{from{opacity:.9}to{opacity:0}}",
  "m-from": `.m-from{transform-box:fill-box;transform-origin:left center;animation:m-from .32s ${EASE} both}@keyframes m-from{from{transform:scaleX(var(--m-from))}}`,
  "m-draw": `.m-draw{stroke-dasharray:1;animation:m-draw .32s ${EASE} .12s both}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`,
  "m-breathe": ".m-breathe{animation:m-breathe 1.8s ease-in-out infinite}@keyframes m-breathe{50%{opacity:.4}}",
  "m-ring": ".m-ring{transform-box:fill-box;transform-origin:center;animation:m-ring 1.8s ease-out infinite}@keyframes m-ring{from{opacity:.55;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}",
  "m-wash": `.m-wash{fill:#8E8A80;opacity:0;transition:opacity .12s ${EASE}}svg:hover .m-wash{opacity:.12}`,
  "m-tile": `.m-tile{transform-box:fill-box;transform-origin:center;transition:transform .2s ${EASE}}svg:hover .m-tile{transform:translateY(-1px) scale(1.06)}`
};
const REDUCED = "@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}";
function motionCss(body) {
  const used = Object.keys(RULES).filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  return used.length === 0 ? "" : `${used.map((name) => RULES[name]).join("")}${REDUCED}`;
}
Object.values(RULES).join("");
const isEntering = (cue) => cue.phase === "enter";
function entering(body, cue, kind = "in") {
  if (!isEntering(cue))
    return body;
  return `<g class="m-${kind}" style="animation-delay:${cue.order * STAGGER_MS}ms">${body}</g>`;
}
const FLASH = `<rect x="0" y="0" width="100%" height="100%" rx="10" fill="${SHEEN}" fill-opacity=".22" class="m-flash"/>`;
const WASH = '<rect x="0" y="0" width="100%" height="100%" rx="10" class="m-wash"/>';

function stableDrawings() {
  const kept = new Map;
  return {
    reset: () => kept.clear(),
    draw: (key, what, build) => {
      const signature = typeof what === "string" ? what : JSON.stringify(what);
      const before = kept.get(key);
      if (before !== undefined && before.what === signature)
        return before.drawing;
      const drawing = build(before === undefined ? "enter" : "change");
      kept.set(key, { what: signature, drawing });
      return drawing;
    }
  };
}

const TAG_WIDTH = /^[\s\S]*?<svg\b[^>]*?\swidth="([\d.]+)"/;
const SVG = /^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/;
const SCHEME$1 = "<style>:root{color-scheme:light dark}</style>";
const SAYS_SCHEME = /(^|[^-\w])color-scheme\s*:/;
const PASS_MS = 120;
const MAX_ORDER = 12;
const LIVE_MS = 30000;
function animate(source, spec) {
  const moved = spec.cue.phase === "change" && spec.before !== undefined ? markChanges(spec.before, source) : source;
  const parts = SVG.exec(moved);
  if (parts === null)
    return source;
  const [, open, inner = "", close] = parts;
  const scheme = SAYS_SCHEME.test(inner) ? "" : SCHEME$1;
  const lit = `${spec.isRow === true ? WASH : ""}${spec.cue.phase === "change" && spec.isLive !== true ? FLASH : ""}${inner}`;
  const body = entering(lit, spec.cue);
  const css = motionCss(body);
  return `${open}${scheme}${css === "" ? "" : `<style>${css}</style>`}${body}${close}`;
}
function paneMotion() {
  const drawings = stableDrawings();
  const shown = new Map;
  const pass = { at: Number.NEGATIVE_INFINITY, entered: 0 };
  const begin = () => {
    const now = Date.now();
    if (now - pass.at > PASS_MS)
      pass.entered = 0;
    pass.at = now;
  };
  return {
    reset: () => {
      drawings.reset();
      shown.clear();
    },
    pic: (key, pic, opts = {}) => {
      begin();
      const what = `${opts.isRow === true ? "row:" : ""}${pic.source}`;
      const now = { shows: opts.shows === undefined ? what : JSON.stringify(opts.shows), width: String(pic.width ?? TAG_WIDTH.exec(pic.source)?.[1]), source: pic.source };
      const source = drawings.draw(key, what, (built) => {
        const order = built === "enter" ? Math.min(MAX_ORDER, pass.entered++) : 0;
        const before = shown.get(key);
        const isQuiet = before !== undefined && (before.shows === now.shows || before.width !== now.width);
        const phase = built === "change" && isQuiet ? "still" : built;
        const lastChange = before?.changedAt ?? Number.NEGATIVE_INFINITY;
        const isLive = phase === "change" && pass.at - lastChange < LIVE_MS;
        shown.set(key, { ...now, changedAt: phase === "change" ? pass.at : lastChange });
        return animate(pic.source, { cue: { phase, order }, isRow: opts.isRow, before: before?.source, isLive });
      });
      return { ...pic, source, isInteractive: true };
    }
  };
}

const motion = paneMotion();
function picture(ui, placed) {
  const { Svg } = ui;
  return h(Svg, {
    key: placed.key,
    ...motion.pic(placed.at, placed.pic, placed.opts)
  });
}

const paneHeld = paneKept();

const FIRST_PINNED = 1e9;
const pins = new Map;
function handleFor(id) {
  let handle = pins.get(id);
  if (handle === undefined) {
    handle = FIRST_PINNED + pins.size;
    pins.set(id, handle);
  }
  return handle;
}
const UNDRAWABLE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f\ud800-\udfff\u{10eeee}]/gu;
const drawable = (text) => text.replace(UNDRAWABLE, "");
function drawableProps(el) {
  const props = el.props;
  if (typeof props !== "object" || props === null)
    return el;
  const cleaned = Object.entries(props).filter(([name, value]) => name !== "key" && typeof value === "string" && drawable(value) !== value);
  if (cleaned.length === 0)
    return el;
  return { ...el, props: { ...props, ...Object.fromEntries(cleaned.map(([name, value]) => [name, drawable(value)])) } };
}
function pinNode(node, ctx) {
  if (typeof node === "string")
    return drawable(node);
  if (typeof node !== "object" || node === null)
    return node;
  const el = drawableProps(node);
  const children = el.children?.map((child) => pinNode(child, ctx));
  const withKids = children === undefined ? el : { ...el, children };
  if (el.press?.plugin !== "" || typeof el.props?.key !== "string")
    return withKids;
  const base = `${ctx.site}\x00${el.type}\x00${el.props.key}`;
  const nth = ctx.seen.get(base) ?? 0;
  ctx.seen.set(base, nth + 1);
  return { ...withKids, press: { plugin: "", handle: handleFor(`${base}\x00${nth}`) } };
}
function pinned(site, tree) {
  if (tree === null || tree === undefined)
    return tree;
  const ctx = { site: `${site.surface}\x00${site.component ?? ""}\x00${site.requestId ?? ""}`, seen: new Map };
  return pinNode(tree, ctx);
}

const HOUR$2 = 3600000;
const DAY = 24 * HOUR$2;
const FIVE_HOUR$1 = "five_hour";
const SEVEN_DAY = "seven_day";
const SPAN_MS = { [FIVE_HOUR$1]: 5 * HOUR$2, [SEVEN_DAY]: 7 * DAY };
const MIN_ELAPSED = 0.05;
const MIN_PERCENT = 3;
const FULL$2 = 100;
const TWO_DIGITS = 2;
function runwayOf(limit, now) {
  const span = SPAN_MS[limit.kind];
  if (span === undefined)
    return null;
  const reset = limit.resetsAt === undefined ? Number.NaN : Date.parse(limit.resetsAt);
  if (Number.isNaN(reset))
    return { kind: limit.kind, percent: limit.percentUsed, resetsAt: null, endsAt: null };
  const base = { kind: limit.kind, percent: limit.percentUsed, resetsAt: reset };
  if (limit.percentUsed >= FULL$2)
    return { ...base, endsAt: now };
  const elapsed = now - (reset - span);
  if (elapsed < span * MIN_ELAPSED || limit.percentUsed < MIN_PERCENT)
    return { ...base, endsAt: null };
  const endsAt = now + elapsed * (FULL$2 - limit.percentUsed) / limit.percentUsed;
  return { ...base, endsAt: endsAt < reset ? endsAt : null };
}
function whenText(at, now) {
  const moment = new Date(at);
  const clock = `${String(moment.getHours()).padStart(TWO_DIGITS, "0")}:${String(moment.getMinutes()).padStart(TWO_DIGITS, "0")}`;
  const isToday = moment.toDateString() === new Date(now).toDateString();
  return isToday ? clock : `${t().stripDays[moment.getDay()] ?? ""} ${clock}`.trim();
}

const CHIP_H = 28;
const CHIP_GAP$1 = 0;
const BUTTON_PAD = 28;
const CELL_PX$1 = 11.9;
const PAD$2 = 12;
const GAP$1 = 6;
const BASELINE = 18.5;
const LABEL_SIZE = 11.5;
const VALUE_SIZE = 13;
const BOLD$4 = 1.14;
const VALUE_SLACK = 3;
const METER$1 = { w: 34, h: 4 };
const WARN_AT = 70;
const DANGER_AT = 90;
const FULL$1 = 100;
const NOTE_MIN = 28;
const LETTERS = {
  m: [".....", ".....", "XX.X.", "X.X.X", "X.X.X", "X.X.X", "X.X.X"],
  o: [".....", ".....", ".XXX.", "X...X", "X...X", "X...X", ".XXX."],
  d: ["....X", "....X", ".XXXX", "X...X", "X...X", "X...X", ".XXXX"],
  z: [".....", ".....", "XXXXX", "...X.", "..X..", ".X...", "XXXXX"]
};
const PIXEL = { pitch: 2.3, cell: 1.9, cols: 5, rows: 7, gap: 1 };
const label = (cls, s) => ({
  w: Math.ceil(textWidth(s, LABEL_SIZE)),
  draw: (x) => `<text class="${cls}" x="${x}" y="${BASELINE}" font-family="${FONT}" font-size="${LABEL_SIZE}">${xml(s)}</text>`
});
const value = (cls, s, widest = s) => ({
  w: Math.ceil(Math.max(textWidth(s, VALUE_SIZE), textWidth(widest, VALUE_SIZE)) * BOLD$4) + VALUE_SLACK,
  draw: (x) => `<text class="${cls}" x="${x}" y="${BASELINE}" font-family="${FONT}" font-size="${VALUE_SIZE}" font-weight="600" style="font-variant-numeric:tabular-nums">${xml(s)}</text>`
});
const wordmark = (word) => {
  const advance = (PIXEL.cols + PIXEL.gap) * PIXEL.pitch;
  const top = (CHIP_H - PIXEL.rows * PIXEL.pitch) / 2 - 1;
  return {
    w: Math.ceil([...word].length * advance - PIXEL.gap * PIXEL.pitch),
    draw: (x) => [...word].flatMap((ch, i) => (LETTERS[ch] ?? []).flatMap((row, r) => [...row].flatMap((cell, c) => cell === "X" ? [`<rect class="f-edit" x="${(x + i * advance + c * PIXEL.pitch).toFixed(1)}" y="${(top + r * PIXEL.pitch).toFixed(1)}" width="${PIXEL.cell}" height="${PIXEL.cell}" rx=".4"/>`] : []))).join("")
  };
};
const meterTone = (percent) => {
  if (percent >= DANGER_AT)
    return "f-danger";
  return percent >= WARN_AT ? "f-warn" : "s";
};
const meter = (percent) => ({
  w: METER$1.w,
  draw: (x) => {
    const y = (CHIP_H - METER$1.h) / 2;
    const filled = Math.max(METER$1.h, METER$1.w * Math.min(FULL$1, percent) / FULL$1);
    const r = METER$1.h / 2;
    return `<rect class="m" x="${x}" y="${y}" width="${METER$1.w}" height="${METER$1.h}" rx="${r}" opacity=".3"/><rect class="${meterTone(percent)}" x="${x}" y="${y}" width="${filled.toFixed(1)}" height="${METER$1.h}" rx="${r}"/>`;
  }
});
const partsOf = (chip, note) => {
  if (chip.isWordmark === true)
    return [wordmark(chip.value)];
  const ink = chip.tone === undefined ? "t" : `f-${chip.tone}`;
  return [
    ...chip.label === "" ? [] : [label("m", chip.label)],
    value(ink, chip.value, chip.widest),
    ...chip.meter === undefined ? [] : [meter(chip.meter)],
    ...note === "" ? [] : [label(chip.tone === undefined ? "s" : ink, note)]
  ];
};
const widthOf = (parts) => Math.ceil(PAD$2 * 2 + parts.reduce((sum, part) => sum + part.w, 0) + GAP$1 * (parts.length - 1));
const chipCells = (width) => Math.max(1, Math.floor((width - BUTTON_PAD) / CELL_PX$1));
const chipWidth$1 = (chip) => widthOf(partsOf(chip, chip.note ?? ""));
function chipSvg(chip, maxW = Number.POSITIVE_INFINITY) {
  const room = maxW - widthOf(partsOf(chip, "")) - GAP$1;
  const fitted = chip.note === undefined || room < NOTE_MIN ? "" : fitText(chip.note, LABEL_SIZE, room);
  const parts = partsOf(chip, fitted);
  const width = widthOf(parts);
  let x = PAD$2;
  const drawn = parts.map((part) => {
    const at = x;
    x += part.w + GAP$1;
    return part.draw(at);
  });
  const alt = [chip.label, chip.value, chip.note ?? ""].filter(Boolean).join(" ");
  return { source: paneSvg(width, CHIP_H, drawn.join("")), width, alt };
}

const HISTORY_MAX = 150;
const READ = ["Read", "Grep", "Glob", "LS", "WebFetch", "WebSearch", "NotebookRead"];
const EDIT = ["Edit", "Write", "MultiEdit", "NotebookEdit"];
const RUN = ["Bash", "BashOutput", "KillShell", "Monitor"];
const AGENT = ["Agent", "Task", "SendMessage"];
const kindOf = (tool) => {
  if (READ.includes(tool))
    return "read";
  if (EDIT.includes(tool))
    return "edit";
  if (RUN.includes(tool))
    return "run";
  return AGENT.includes(tool) ? "agent" : "other";
};
const KIND_GLYPH = { read: "◇", edit: "✎", run: "❯", agent: "◆", other: "•" };
const pathOf$1 = (call) => {
  const value = call.file_path ?? call.notebook_path;
  return typeof value === "string" && value.startsWith("/") ? value : undefined;
};
const openEvent = (a, facts) => {
  const tool = String(facts.call.tool ?? "");
  const owed = a.reason !== undefined && a.reason.left > 0 ? a.reason : undefined;
  const event = { id: facts.id, tool: toolName(tool), target: toolTarget(facts.call), plain: plainCall(tool, facts.call, plainLang()), why: purposeOf(facts.call) || undefined, because: owed?.text, path: pathOf$1(facts.call), at: facts.at };
  return { ...a, reason: owed ? { ...owed, left: owed.left - 1 } : a.reason, history: [...a.history ?? [], event].slice(-HISTORY_MAX) };
};
const withReason = (a, step) => {
  const text = reasonOf(step.answer);
  if (text === "" || step.calls === 0)
    return a.reason ? { ...a, reason: undefined } : a;
  const list = a.history ?? [];
  const opened = list.filter((e) => e.at >= step.sentAt).slice(-step.calls);
  const history = list.map((e) => opened.includes(e) ? { ...e, because: text } : e);
  return { ...a, history, reason: { text, left: step.calls - opened.length } };
};
const closeEvent = (a, facts) => {
  const list = a.history ?? [];
  const name = toolName(facts.tool);
  const isOpen = (e) => e.endAt === undefined && (facts.id ? e.id === facts.id : e.tool === name);
  const index = list.map(isOpen).lastIndexOf(true);
  if (index < 0)
    return a;
  const closed = list.map((e, i) => i === index ? { ...e, endAt: facts.at, isError: facts.isError } : e);
  return { ...a, history: closed };
};

const SCENE_H = 84;
const BASE = 60;
const STEP = 8;
const RADIUS$1 = 12;
const FADE_END = 8;
const groundY = (x) => BASE + 4 * Math.sin(x / 61 + 1.3) + 2.2 * Math.sin(x / 23 + 0.4);
const hillY = (x) => BASE - 12 + 6 * Math.sin(x / 97 + 0.2) + 3 * Math.sin(x / 41 + 2);
const farY = (x) => BASE - 24 + 9 * Math.sin(x / 151 + 2.4) + 3 * Math.sin(x / 67 + 0.9);
const curve = (y, from, to, lift = 0) => {
  const xs = Array.from({ length: Math.max(1, Math.ceil((to - from) / STEP)) + 1 }, (_, i) => Math.min(to, from + i * STEP));
  return xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${(y(x) + lift).toFixed(1)}`).join("");
};
const groundLine = (from, to, lift) => curve(groundY, from, to, lift);
const SKY = {
  dawn: { light: ["#C9D4F2", "#FFD9C2", 0.95], dark: ["#3A4470", "#C9826A", 0.42] },
  day: { light: ["#BBDCFA", "#EAF6FF", 0.95], dark: ["#3F78B8", "#7FB2DC", 0.44] },
  dusk: { light: ["#B9B4E6", "#FFC9A6", 0.95], dark: ["#2E2A5C", "#D9774F", 0.46] },
  night: { light: ["#1E2A52", "#3B4A7A", 0.5], dark: ["#02040A", "#141C36", 0.78] }
};
const landCss = (phase) => {
  const { light, dark } = SKY[phase];
  return `<style>
.s0{stop-color:${light[0]}}.s1{stop-color:${light[1]}}.sky{opacity:${light[2]}}.hill{fill:#5A6B7A;opacity:.1}.hill2{fill:#5A6B7A;opacity:.16}
.pine{fill:#52647A;opacity:.4}.sg{stop-color:#E6E0D2}.turf{stroke:#C4BCAA}.speck{fill:#000;opacity:.14}.bird{stroke:#5A6B7A;opacity:.6}
.tuft{fill:#5E9B5A}.rock{fill:#A8A294}.stem{fill:#D8D2C4}.cloud{fill:#fff;opacity:.95}.star{fill:#fff}
.veil{fill:#7F8A99;opacity:.3}.drop{stroke:#4F6F96}.flake{fill:#7C8FA6}.fg{stop-color:#B8C0CA}.fog{opacity:.6}
@media (prefers-color-scheme: dark){.s0{stop-color:${dark[0]}}.s1{stop-color:${dark[1]}}.sky{opacity:${dark[2]}}.hill{fill:#fff;opacity:.04}.hill2{fill:#0B0E14;opacity:.3}
.pine{fill:#0B0E14;opacity:.5}.sg{stop-color:#36342D}.turf{stroke:#5A564C}.speck{fill:#fff;opacity:.06}.bird{stroke:#fff;opacity:.45}
.tuft{fill:#5FA86A}.rock{fill:#6B675E}.stem{fill:#CFCABD}.cloud{opacity:.12}
.veil{fill:#3C434D;opacity:.5}.drop{stroke:#A9C2E0}.flake{fill:#fff}.fg{stop-color:#AEB6C0}.fog{opacity:.3}}
</style>`;
};
const rnd = (i, salt) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const px = (cls, box) => `<rect class="${cls}" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"/>`;
const THINGS = [
  { isFront: true, isSwaying: true, draw: () => px("tuft", [-3, -4, 1.5, 4]) + px("tuft", [0, -6, 1.5, 6]) + px("tuft", [3, -3, 1.5, 3]) },
  { draw: () => px("rock", [-4, -3, 8, 3]) + px("rock", [-2, -5, 4, 2]) },
  { isSwaying: true, draw: (i) => px("tuft", [0, -7, 1.2, 7]) + px(i % 2 === 0 ? "f-plan" : "f-warn", [-1.4, -10, 4, 3.4]) },
  { draw: () => px("stem", [-1, -4, 2, 4]) + px("f-danger", [-3.5, -7, 7, 3]) + px("f-danger", [-2, -8.5, 4, 1.5]) },
  { isFront: true, isSwaying: true, draw: () => px("tuft", [-2, -3, 1.5, 3]) + px("tuft", [1, -5, 1.5, 5]) },
  { draw: () => px("tuft", [-6, -5, 12, 5]) + px("tuft", [-4, -8, 8, 3]) }
];
const SPACING = 54;
const JITTER = 30;
function decorOf(width) {
  const layers = { back: "", front: "" };
  for (let i = 0;40 + i * SPACING < width - 24; i += 1) {
    const x = 40 + i * SPACING + rnd(i, 1) * JITTER;
    const thing = THINGS[(i * 5 + Math.floor(rnd(i, 2) * 2)) % THINGS.length];
    if (thing === undefined)
      continue;
    const inner = thing.isSwaying === true ? `<g class="sway" style="animation-delay:-${(rnd(i, 3) * 4).toFixed(1)}s">${thing.draw(i)}</g>` : thing.draw(i);
    layers[thing.isFront === true ? "front" : "back"] += `<g transform="translate(${x.toFixed(1)},${(groundY(x) + 0.5).toFixed(1)})" shape-rendering="crispEdges">${inner}</g>`;
  }
  return layers;
}
const STARS = 16;
const stars = (width) => Array.from({ length: STARS }, (_, i) => {
  const size = rnd(i, 6) > 0.7 ? 1.8 : 1.2;
  return `<rect class="star tw${i % 3}" x="${(16 + rnd(i, 4) * (width - 32)).toFixed(1)}" y="${(5 + rnd(i, 5) * 30).toFixed(1)}" width="${size}" height="${size}"/>`;
}).join("");
const cloud = (x, y, cls) => `<g class="${cls}"><g transform="translate(${x},${y})" shape-rendering="crispEdges">${px("cloud", [0, 4, 26, 5])}${px("cloud", [5, 0, 12, 5])}${px("cloud", [15, 2, 7, 3])}</g></g>`;
const SUN = "#F5C542";
const LOW_SUN = "#F08A4B";
const MOON = "#E8E6DA";
const glow = (x, y, r, color) => `<circle class="halo" cx="${x.toFixed(1)}" cy="${y}" r="${r}" fill="url(#glow)" color="${color}"/>`;
const sun = (x, y, r, color) => `${glow(x, y, r * 3.2, color)}<circle cx="${x.toFixed(1)}" cy="${y}" r="${r}" fill="${color}" opacity=".92"/>`;
const bird = (x, y, cls) => `<g class="${cls}"><path class="bird" d="M${x} ${y}l3.5 2.2 3.5-2.2" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const ARC = { side: 56, low: BASE - 25, high: 16 };
const arcAt = (at, width) => ({
  x: ARC.side + at * (width - 2 * ARC.side),
  y: Math.round(ARC.low - (ARC.low - ARC.high) * Math.sin(Math.PI * at))
});
const CLOUDS = {
  day: [[0.3, 8], [0.62, 15]],
  low: [[0.45, 10], [0.8, 20]],
  dull: [[0.06, 7], [0.22, 14], [0.38, 5], [0.54, 13], [0.7, 6], [0.86, 15]]
};
const cloudsAt = (places, width) => places.map(([at, y], i) => cloud(width * at, y, i % 2 === 0 ? "drift" : "drift drift2")).join("");
const isDullOf = (weather) => weather !== undefined && weather !== "clear" && weather !== "cloudy";
function heavens(sky, width) {
  const { x, y } = arcAt(sky.at, width);
  const isNight = sky.phase === "night";
  const isDull = isDullOf(sky.weather);
  const moon = `${glow(x, y, 20, MOON)}<path fill="${MOON}" transform="translate(${x.toFixed(1)},${y})" d="M0-7a7 7 0 1 0 7 7 5.4 5.4 0 0 1-7-7z"/>`;
  const light = isNight ? moon : sky.phase === "day" ? sun(x, y, 6, SUN) : sun(x, y, 9, LOW_SUN);
  const fall = `<line class="shoot" x1="${(width * 0.62).toFixed(0)}" y1="8" x2="${(width * 0.62 + 16).toFixed(0)}" y2="2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`;
  const fair = isNight ? [] : sky.phase === "day" ? CLOUDS.day : CLOUDS.low;
  const clouds = sky.weather === "clear" ? "" : cloudsAt(isDull ? CLOUDS.dull : fair, width);
  if (isDull)
    return `<g opacity=".35">${light}</g><rect class="veil" width="${width}" height="${SCENE_H}"/>${clouds}`;
  const birds = sky.phase === "day" ? `${bird(width * 0.46, 22, "drift drift2")}${bird(width * 0.46 + 12, 17, "drift drift2")}` : "";
  return (isNight ? stars(width) + fall : "") + light + clouds + birds;
}
const FALLS = {
  rain: { cls: "drop", every: 13, seconds: 0.7 },
  storm: { cls: "drop", every: 9, seconds: 0.55 },
  snow: { cls: "flake", every: 16, seconds: 4.5 }
};
const falling = (weather, width) => {
  const fall = weather === undefined ? undefined : FALLS[weather];
  if (fall === undefined)
    return "";
  let out = "";
  for (let i = 0;i * fall.every < width; i += 1) {
    const x = ((i + rnd(i, 12)) * fall.every).toFixed(1);
    const y = (4 + rnd(i, 13) * (BASE - 12)).toFixed(1);
    const beat = `style="animation-duration:${(fall.seconds * (0.8 + rnd(i, 14) * 0.4)).toFixed(2)}s;animation-delay:-${(rnd(i, 15) * fall.seconds).toFixed(2)}s"`;
    out += fall.cls === "drop" ? `<path class="drop" d="M${x} ${y}l-1.6 5" fill="none" stroke-width="1" stroke-linecap="round" ${beat}/>` : `<rect class="flake" x="${x}" y="${y}" width="1.8" height="1.8" ${beat}/>`;
  }
  const bolt = weather === "storm" ? `<rect class="bolt" width="${width}" height="${SCENE_H}" fill="#fff" opacity="0"/>` : "";
  return out + bolt;
};
const FOG = { top: BASE - 42, h: 54 };
const fog = (width) => `<rect class="fog" y="${FOG.top}" width="${width}" height="${FOG.h}" fill="url(#fogg)"/>`;
const PINE = [
  [-1, -2, 2, 2],
  [-4, -5, 8, 3],
  [-3, -8, 6, 3],
  [-2, -11, 4, 3],
  [-1, -13, 2, 2]
];
const PINE_STEP = 46;
const pines = (width) => {
  let out = "";
  for (let i = 0;20 + i * PINE_STEP < width - 10; i += 1) {
    if (rnd(i, 7) < 0.42)
      continue;
    const x = 20 + i * PINE_STEP + rnd(i, 8) * 24;
    const size = 0.75 + rnd(i, 9) * 0.5;
    out += `<g transform="translate(${x.toFixed(1)},${(hillY(x) + 1).toFixed(1)}) scale(${size.toFixed(2)})" shape-rendering="crispEdges">${PINE.map((box) => px("pine", box)).join("")}</g>`;
  }
  return out;
};
const SPECKS = 26;
const specks = (width) => Array.from({ length: SPECKS }, (_, i) => {
  const x = 10 + rnd(i, 10) * (width - 20);
  return `<rect class="speck" x="${x.toFixed(1)}" y="${(groundY(x) + 4 + rnd(i, 11) * 9).toFixed(1)}" width="1.6" height="1.6"/>`;
}).join("");
const fireflies = (width) => [0.24, 0.58, 0.83].map((at, i) => `<circle class="fly fly${i}" cx="${(width * at).toFixed(0)}" cy="${(groundY(width * at) - 12).toFixed(1)}" r="1.3" fill="#F5E07A"/>`).join("");
function landOf(width, sky) {
  const { phase } = sky;
  const under = (y) => `${curve(y, 0, width)}L${width} ${SCENE_H}L0 ${SCENE_H}Z`;
  const fadeOut = `<stop offset="0" stop-color="#fff"/><stop offset=".66" stop-color="#fff" stop-opacity=".6"/><stop offset=".9" stop-color="#fff" stop-opacity="0"/>`;
  const defs = `<defs><clipPath id="win"><rect width="${width}" height="${SCENE_H}" rx="${RADIUS$1}"/></clipPath><linearGradient id="skf" x1="0" y1="0" x2="0" y2="1">${fadeOut}</linearGradient><mask id="skm"><rect width="${width}" height="${SCENE_H}" fill="url(#skf)"/></mask><linearGradient id="skc" x1="0" y1="0" x2="0" y2="1"><stop class="s0" offset="0"/><stop class="s1" offset=".72"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="currentColor" stop-opacity=".5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient><linearGradient id="fogg" x1="0" y1="0" x2="0" y2="1"><stop class="fg" offset="0" stop-opacity="0"/><stop class="fg" offset=".55"/><stop class="fg" offset="1" stop-opacity="0"/></linearGradient><linearGradient id="sof" gradientUnits="userSpaceOnUse" x1="0" y1="${BASE - 6}" x2="0" y2="${SCENE_H - FADE_END}"><stop class="sg" offset="0"/><stop class="sg" offset="1" stop-opacity="0"/></linearGradient></defs>`;
  const decor = decorOf(width);
  const air = `<g mask="url(#skm)"><rect class="sky" width="${width}" height="${SCENE_H}" fill="url(#skc)"/>${heavens(sky, width)}<path class="hill" d="${under(farY)}"/><path class="hill2" d="${under(hillY)}"/>${pines(width)}</g>`;
  const ground = `<path d="${under(groundY)}" fill="url(#sof)"/>${specks(width)}<path class="turf" d="${curve(groundY, 0, width)}" fill="none" stroke-width="1.5" stroke-linecap="round"/>`;
  return { open: `${landCss(phase)}${defs}<g clip-path="url(#win)">${air}${ground}`, back: decor.back, front: decor.front + (phase === "night" && !isDullOf(sky.weather) ? fireflies(width) : "") + (sky.weather === "fog" ? fog(width) : "") + falling(sky.weather, width), close: "</g>" };
}

const STROLL_S = 24;
const WALKS = [
  [12, 32],
  [58, 78]
];
const STEPS$1 = 10;
const SAMPLES = 8;
const eased = (f) => f * f * (3 - 2 * f);
const wayFrames = (way) => Array.from({ length: SAMPLES + 1 }, (_, k) => {
  const x = way.fromX + (way.toX - way.fromX) * eased(k / SAMPLES);
  const at = way.t0 + (way.t1 - way.t0) * k / SAMPLES;
  return `${at.toFixed(1)}%{transform:translate(${(x - way.home).toFixed(1)}px,${(groundY(x) - groundY(way.home)).toFixed(1)}px)}`;
}).join("");
const WALK_S = { min: 1.2, max: 3.2, perPx: 1 / 200 };
const walkInCss = (fromX, home) => {
  const seconds = Math.min(WALK_S.max, WALK_S.min + Math.abs(home - fromX) * WALK_S.perPx);
  return `<style>.walkin{animation:walkin ${seconds.toFixed(2)}s linear both}@keyframes walkin{${wayFrames({ fromX, toX: home, home, t0: 0, t1: 100 })}}</style>`;
};
const strollCss = (home, distance) => {
  const [out, back] = WALKS;
  if (out === undefined || back === undefined)
    return "";
  const far = home + distance;
  return `<style>@keyframes amble{${wayFrames({ fromX: home, toX: far, home, t0: out[0], t1: out[1] })}${wayFrames({ fromX: far, toX: home, home, t0: back[0], t1: back[1] })}}</style>`;
};
const legFrames = (isFirstPair) => WALKS.flatMap(([from, to]) => Array.from({ length: STEPS$1 + 1 }, (_, k) => {
  const isUp = k < STEPS$1 && k % 2 === 0 === isFirstPair;
  return `${(from + (to - from) * k / STEPS$1).toFixed(1)}%{transform:translateY(${isUp ? -1 : 0}px)}`;
})).join("");
const SCENE_CSS = `<style>
.br{animation:br 2.8s ease-in-out infinite}.sl{animation:br 4.6s ease-in-out infinite}
@keyframes br{50%{transform:translateY(-1.5px)}}
.lift{transition:transform .2s cubic-bezier(.2,.8,.2,1)}.who:hover .lift{transform:translateY(-4px)}
.tip{opacity:0;pointer-events:none;transition:opacity .12s ease-out}.who:hover .tip{opacity:1}
.st{transform-box:fill-box;transform-origin:center;transition:transform .18s cubic-bezier(.2,.8,.2,1)}.st:hover{transform:scale(1.6)}
.now{transform-box:fill-box;transform-origin:center;animation:now 2.2s ease-in-out infinite}
@keyframes now{50%{transform:scale(1.35);opacity:.5}}
.d1,.d2,.d3{animation:dot 1.6s ease-in-out infinite}.d2{animation-delay:.2s}.d3{animation-delay:.4s}
@keyframes dot{0%,60%,100%{transform:translateY(0);opacity:.6}30%{transform:translateY(-2.5px);opacity:1}}
.car{animation:car 1.1s steps(1) infinite}@keyframes car{50%{opacity:0}}
.ty1{animation:ty1 2.4s steps(1) infinite}.ty2{animation:ty2 2.4s steps(1) infinite}.ty3{animation:ty3 2.4s steps(1) infinite}
@keyframes ty1{0%,92%{opacity:1}93%,100%{opacity:0}}
@keyframes ty2{0%,24%{opacity:0}25%,92%{opacity:1}93%,100%{opacity:0}}
@keyframes ty3{0%,49%{opacity:0}50%,92%{opacity:1}93%,100%{opacity:0}}
.chk{stroke-dasharray:14;animation:chk .7s cubic-bezier(.2,.8,.2,1) both}@keyframes chk{from{stroke-dashoffset:14}}
.zz{animation:zz 3.4s ease-in infinite}.zz2{animation-delay:-1.7s}
@keyframes zz{0%{transform:translate(0,2px);opacity:0}25%{opacity:.9}100%{transform:translate(5px,-8px);opacity:0}}
.amble{animation:amble ${STROLL_S}s linear infinite}
.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 4s ease-in-out infinite}
@keyframes sway{0%,100%{transform:skewX(-5deg)}50%{transform:skewX(6deg)}}
.drift{animation:drift 46s ease-in-out infinite alternate}.drift2{animation-duration:64s;animation-delay:-20s}
@keyframes drift{to{transform:translateX(18px)}}
.shoot{animation:shoot 13s ease-in infinite}
@keyframes shoot{0%,90%{opacity:0;transform:translate(0,0)}92%{opacity:.9}100%{opacity:0;transform:translate(-70px,26px)}}
.halo{transform-box:fill-box;transform-origin:center;animation:halo 6s ease-in-out infinite}
@keyframes halo{50%{transform:scale(1.12);opacity:.75}}
.tw0,.tw1,.tw2{animation:tw 4.2s ease-in-out infinite}.tw1{animation-delay:-1.4s}.tw2{animation-delay:-2.8s;animation-duration:5.6s}
@keyframes tw{0%,100%{opacity:.9}50%{opacity:.25}}
.fly{animation:fly 9s ease-in-out infinite}.fly1{animation-delay:-3s;animation-duration:11s}.fly2{animation-delay:-6s;animation-duration:13s}
@keyframes fly{0%,100%{transform:translate(0,0);opacity:0}20%{opacity:.9}50%{transform:translate(14px,-9px);opacity:.3}75%{transform:translate(26px,-3px);opacity:.9}}
.drop{animation:drop .7s linear infinite}.flake{animation:flake 4.5s linear infinite}
@keyframes drop{from{transform:translate(4px,-14px);opacity:0}20%,80%{opacity:.8}to{transform:translate(-4px,14px);opacity:0}}
@keyframes flake{from{transform:translate(-3px,-12px);opacity:0}20%,80%{opacity:.9}to{transform:translate(4px,12px);opacity:0}}
.bolt{animation:bolt 11s steps(1) infinite}@keyframes bolt{0%,100%{opacity:0}90%{opacity:.16}91%{opacity:0}93%{opacity:.1}94%{opacity:0}}
.wave{transform-box:fill-box;transform-origin:0 50%;animation:wave 2.4s ease-in-out infinite}
@keyframes wave{50%{transform:skewY(-9deg) scaleX(.88)}}
.amble .la{animation:la ${STROLL_S}s steps(1) infinite}.amble .lb{animation:lb ${STROLL_S}s steps(1) infinite}
@keyframes la{0%{transform:translateY(0)}${legFrames(true)}}
@keyframes lb{0%{transform:translateY(0)}${legFrames(false)}}
</style>`;

const PAD$1 = 14;
const EDGE = 36;
const PATH_LIFT = 8;
const GRID = { w: 30, feet: 26 };
const LEAD_SCALE = 1.3;
const LEAD_W = GRID.w * LEAD_SCALE;
const CREW = { scale: 1, step: 38, shown: 4, lead: 26, more: 24 };
const AMBLE_MAX = 240;
const STONES_MAX = 24;
const PIPS = { shown: 4, size: 3, step: 4.5, y: 6.5 };
const SCHEME = "<style>:root{color-scheme:light dark}</style>";
const isDone = (step) => step.status === "completed";
const standIndexOf = (steps) => {
  const current = steps.findIndex((step) => step.status === "in_progress");
  if (current >= 0)
    return current;
  const next = steps.findIndex((step) => !isDone(step));
  return next >= 0 ? next : steps.length - 1;
};
function layoutOf$1(spec) {
  const helpers = spec.crew.filter((a) => a.isMain !== true);
  const shown = Math.min(CREW.shown, helpers.length);
  const bench = shown === 0 ? 0 : CREW.lead + shown * CREW.step + (helpers.length > shown ? CREW.more : 0);
  const x0 = PAD$1 + EDGE;
  const x1 = Math.max(x0, spec.width - PAD$1 - EDGE - bench);
  const last = spec.steps.length - 1;
  const at = spec.steps.map((_, i) => last <= 0 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / last);
  const standIndex = standIndexOf(spec.steps);
  return { x0, x1, at, stand: Math.round(at[standIndex] ?? x0), standIndex, benchX: x1 + EDGE + CREW.lead };
}
const titled = (title, body) => `<title>${xml(title)}</title>${body}`;
const markOf = (step, isCurrent) => {
  if (isDone(step))
    return '<circle class="f-ok" r="3.5"/>';
  if (isCurrent)
    return '<circle class="i-run now" r="5" fill="none" stroke-width="1.5"/><circle class="f-run" r="2.5"/>';
  return '<circle class="card i-m" r="3" stroke-width="1.2"/>';
};
const stone = (step, i, lay) => {
  const x = lay.at[i] ?? lay.x0;
  const crew = (step.crew ?? []).slice(0, PIPS.shown);
  const pips = crew.map((a, k) => `<rect x="${((k - (crew.length - 1) / 2) * PIPS.step - PIPS.size / 2).toFixed(1)}" y="${PIPS.y}" width="${PIPS.size}" height="${PIPS.size}" rx=".6" fill="${a.shell}"/>`).join("");
  const names = (step.crew ?? []).map((a) => a.name).join(", ");
  const said = names === "" ? t().stripStep(i + 1, step.subject) : `${t().stripStep(i + 1, step.subject)} · ${names}`;
  const body = `<circle r="9" fill="transparent"/>${markOf(step, i === lay.standIndex)}${pips}`;
  return `<g transform="translate(${x.toFixed(1)},${(groundY(x) + PATH_LIFT).toFixed(1)})"><g class="st">${titled(said, body)}</g></g>`;
};
const goal = (x, isReached) => `<g transform="translate(${x.toFixed(1)},${groundY(x).toFixed(1)})" shape-rendering="crispEdges"><rect class="m" x="0" y="-17" width="1.5" height="17"/><g class="wave"><rect class="${isReached ? "f-ok" : "m"}" x="1.5" y="-17" width="8" height="5.5"/></g></g>`;
function trackSvg(spec, lay) {
  if (spec.steps.length === 0)
    return "";
  const line = (cls, to, more = "") => `<path class="${cls}" d="${groundLine(lay.x0, to, PATH_LIFT)}" fill="none" stroke-width="2" stroke-linecap="round"${more}/>`;
  const isReached = spec.steps.every(isDone);
  const stones = spec.steps.length > STONES_MAX ? "" : spec.steps.map((step, i) => stone(step, i, lay)).join("");
  return line("i-m", lay.x1, ' opacity=".4"') + (isReached || lay.stand > lay.x0 ? line("i-ok", isReached ? lay.x1 : lay.stand) : "") + stones + goal(lay.x1 + EDGE + 2, isReached);
}
const THOUGHT = {
  other: [7, 12, 17].map((cx, i) => `<circle class="s d${i + 1}" cx="${cx}" cy="7.5" r="1.6"/>`).join(""),
  read: `<rect class="i-read" x="7" y="2.5" width="10" height="10" rx="1.5" fill="none" stroke-width="1.2"/>${[5, 7.5, 10].map((y, i) => `<rect class="f-read ty${i + 1}" x="9.5" y="${y}" width="5" height="1"/>`).join("")}`,
  edit: [5.5, 10.25, 15].map((x, i) => `<rect class="f-edit ty${i + 1}" x="${x}" y="5.5" width="3.5" height="4" rx=".8"/>`).join(""),
  run: '<polyline class="i-run" points="6.5,4.5 10,7.5 6.5,10.5" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect class="f-run car" x="12.5" y="9" width="5.5" height="1.6"/>',
  agent: [6, 11, 16].map((x, i) => `<rect class="f-plan d${i + 1}" x="${x}" y="6" width="3" height="3"/>`).join("")
};
const HAPPY = '<path class="i-ok chk" d="M7.5 7.8l3 3 6-6.2" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
const WORRIED = '<rect class="f-warn live" x="11" y="3" width="2" height="6" rx="1"/><rect class="f-warn live" x="11" y="10.4" width="2" height="2" rx="1"/>';
const BUBBLE = { x: -19, y: -45, w: 24, h: 15 };
const bubble = (inner) => `<g transform="translate(${BUBBLE.x},${BUBBLE.y})"><rect class="card ln" x=".5" y=".5" width="${BUBBLE.w - 1}" height="${BUBBLE.h - 1}" rx="7" stroke-width="1"/><circle class="card ln" cx="21" cy="17.5" r="1.8" stroke-width="1"/><circle class="card ln" cx="24.5" cy="21" r="1.1" stroke-width="1"/>${inner}</g>`;
const SNOOZE = [
  { x: 34, y: -31, size: 9, cls: "zz" },
  { x: 39, y: -37, size: 7, cls: "zz zz2" }
].map((z) => `<text class="m ${z.cls}" x="${z.x}" y="${z.y}" font-size="${z.size}" font-weight="700" font-family="sans-serif">z</text>`).join("");
const RESTING = { sleeping: SNOOZE, working: bubble(THOUGHT.other), happy: bubble(HAPPY), worried: bubble(WORRIED) };
const IS_BUSY = { read: false, run: true, edit: true, agent: false, other: false };
function leadOf(spec, isWalkingIn) {
  const main = spec.crew.find((a) => a.isMain === true);
  if (main === undefined) {
    const isAwake = spec.mood === "happy" || spec.mood === "worried";
    const body = crab$3(0, -GRID.feet * LEAD_SCALE, { costume: "other", look: HOME_LOOK, mood: spec.mood, isWalking: isWalkingIn, scale: LEAD_SCALE });
    return { body, extra: RESTING[spec.mood], title: `${t().mainName} · ${t().stripResting[spec.mood]}`, breath: spec.mood === "sleeping" ? "sl" : "br", canAmble: isAwake && spec.steps.length === 0 };
  }
  const kind = kindOf(main.lastTool ?? "");
  const body = crab$3(0, -GRID.feet * LEAD_SCALE, { costume: costumeOf(main), look: lookOf(main), isWalking: IS_BUSY[kind] || isWalkingIn, scale: LEAD_SCALE });
  return { body, extra: bubble(THOUGHT[kind]), title: `${t().mainName} · ${main.lastPlain || t().stripDoing[kind]}`, breath: IS_BUSY[kind] ? "" : "br", canAmble: false };
}
const TIP = { h: 18, size: 10.5, pad: 7, max: 40, gap: 6 };
const tip = (text, at) => {
  const said = clip$2(text, TIP.max);
  const w = Math.ceil(textWidth(said, TIP.size)) + TIP.pad * 2;
  return `<g class="tip" transform="translate(${at.isLeft ? at.x - w : at.x},${at.y})"><rect class="card ln" x=".5" y=".5" width="${w - 1}" height="${TIP.h - 1}" rx="5" stroke-width="1"/><text class="t" x="${TIP.pad}" y="12.5" font-family="${FONT}" font-size="${TIP.size}">${xml(said)}</text></g>`;
};
const standing = (x, w, body) => `<g transform="translate(${(x - w / 2).toFixed(1)},${(groundY(x) + 1).toFixed(1)})">${body}</g>`;
function leadSvg(spec, lay) {
  const isWalkingIn = spec.from !== undefined && Math.round(spec.from) !== lay.stand;
  const lead = leadOf(spec, isWalkingIn);
  const isLeft = lay.stand > spec.width * 0.6;
  const said = tip(lead.title, { x: isLeft ? BUBBLE.x - TIP.gap : LEAD_W + TIP.gap, y: -GRID.feet * LEAD_SCALE + 4, isLeft });
  const who = `<g class="who"><g class="lift"><g class="${lead.breath}">${lead.body}</g>${lead.extra}</g>${said}</g>`;
  const stroll = lead.canAmble ? strollCss(lay.stand, Math.min(AMBLE_MAX, lay.x1 - lay.x0)) : "";
  const amble = stroll === "" ? who : `${stroll}<g class="amble">${who}</g>`;
  const walk = isWalkingIn && spec.from !== undefined ? `${walkInCss(spec.from, lay.stand)}<g class="walkin">${amble}</g>` : amble;
  return standing(lay.stand, LEAD_W, walk);
}
function benchSvg(spec, lay) {
  const helpers = spec.crew.filter((a) => a.isMain !== true);
  const shown = helpers.slice(0, CREW.shown);
  const w = GRID.w * CREW.scale;
  const crabs = shown.map((a, i) => {
    const kind = kindOf(a.lastTool ?? "");
    const body = crab$3(0, -GRID.feet * CREW.scale, { costume: costumeOf(a), look: lookOf(a), isWalking: IS_BUSY[kind], scale: CREW.scale });
    const x = lay.benchX + i * CREW.step + w / 2;
    const isLeft = x > spec.width * 0.6;
    const said = tip(`${lookOf(a).name} · ${a.lastPlain || a.description || t().stripDoing[kind]}`, { x: isLeft ? w : 0, y: -GRID.feet * CREW.scale - TIP.h - TIP.gap, isLeft });
    return standing(x, w, `<g class="who"><g class="lift"><g class="${IS_BUSY[kind] ? "" : "br"}">${body}</g></g>${said}</g>`);
  });
  const rest = helpers.length - shown.length;
  const moreX = lay.benchX + shown.length * CREW.step;
  const more = rest > 0 ? `<text class="s" x="${moreX}" y="${(groundY(moreX) - 8).toFixed(1)}" font-size="11" font-weight="650" font-family="ui-monospace,Menlo,monospace">+${rest}</text>` : "";
  return crabs.join("") + more;
}
function sceneSvg(spec) {
  const lay = layoutOf$1(spec);
  const land = landOf(spec.width, spec.sky);
  const done = spec.steps.filter(isDone).length;
  const plan = spec.steps.length === 0 ? "" : `${t().stripPlan} ${done}/${spec.steps.length}`;
  const names = spec.crew.map((a) => lookOf(a).name).join(", ");
  const alt = [plan, names === "" ? `${t().mainName} · ${t().stripResting[spec.mood]}` : names].filter(Boolean).join(" · ");
  const body = land.open + land.back + trackSvg(spec, lay) + benchSvg(spec, lay) + leadSvg(spec, lay) + land.front + land.close;
  return { source: paneSvg(spec.width, SCENE_H, SCHEME + SCENE_CSS + body), alt };
}

const NO_TALLY = { tokens: 0, busyMs: 0, turns: 0, lastCost: 0, costBefore: 0 };
const SECOND$3 = 1000;
const MINUTE$2 = 60;
const HOUR$1 = 60 * MINUTE$2;
const spanText = (ms) => {
  const s = Math.round(ms / SECOND$3);
  const words = t();
  if (s >= HOUR$1)
    return `${words.hours(Math.floor(s / HOUR$1))} ${words.minutes(Math.floor(s % HOUR$1 / MINUTE$2))}`;
  if (s >= MINUTE$2)
    return `${words.minutes(Math.floor(s / MINUTE$2))} ${words.seconds(s % MINUTE$2)}`;
  return words.seconds(s);
};

const DAY_MS = 86400000;
const RAD = Math.PI / 180;
const J2000 = 2451545;
const UNIX_EPOCH_JULIAN = 2440587.5;
const RISE_ANGLE = -0.833 * RAD;
const TILT = 23.4397 * RAD;
function sunTimes(now, place) {
  const turn = -place.lon / 360;
  const days = Math.round(now / DAY_MS + UNIX_EPOCH_JULIAN - J2000 - 0.0009 - turn) + 0.0009 + turn;
  const anomaly = RAD * (357.5291 + 0.98560028 * days);
  const centre = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
  const longitude = anomaly + centre + RAD * 102.9372 + Math.PI;
  const noon = J2000 + days + 0.0053 * Math.sin(anomaly) - 0.0069 * Math.sin(2 * longitude);
  const tilt = Math.asin(Math.sin(longitude) * Math.sin(TILT));
  const lat = place.lat * RAD;
  const cos = (Math.sin(RISE_ANGLE) - Math.sin(lat) * Math.sin(tilt)) / (Math.cos(lat) * Math.cos(tilt));
  if (cos > 1)
    return "night";
  if (cos < -1)
    return "day";
  const half = Math.acos(cos) / (2 * Math.PI);
  const toMs = (julian) => (julian - UNIX_EPOCH_JULIAN) * DAY_MS;
  return { rise: toMs(noon - half), set: toMs(noon + half) };
}
const clockTimes = (now) => ({ rise: new Date(now).setHours(6, 30, 0, 0), set: new Date(now).setHours(18, 30, 0, 0) });
const GLOW_MS = 45 * 60000;
const STEPS = 120;
const stepped = (at) => Math.round(Math.min(1, Math.max(0, at)) * STEPS) / STEPS;
function skyOf(now, place) {
  const times = place === undefined ? clockTimes(now) : sunTimes(now, place);
  if (times === "day" || times === "night")
    return { phase: times, at: 0.5 };
  const { rise, set } = times;
  if (now >= rise && now <= set) {
    const phase = now < rise + GLOW_MS ? "dawn" : now > set - GLOW_MS ? "dusk" : "day";
    return { phase, at: stepped((now - rise) / (set - rise)) };
  }
  if (now < rise && now >= rise - GLOW_MS)
    return { phase: "dawn", at: 0 };
  if (now > set && now <= set + GLOW_MS)
    return { phase: "dusk", at: 1 };
  const dusk = now < rise ? set - DAY_MS : set;
  const dawn = now < rise ? rise : rise + DAY_MS;
  return { phase: "night", at: stepped((now - dusk) / (dawn - dusk)) };
}
function placeFromText(text) {
  const [lat, lon] = (text ?? "").split(",").map(Number);
  if (lat === undefined || lon === undefined || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180))
    return;
  return { lat, lon };
}
const ZONE_PLACE = /^([+-])(\d{2})(\d{2})(\d{2})?([+-])(\d{3})(\d{2})(\d{2})?$/;
const degrees = (sign, deg, min, sec = "0") => (sign === "-" ? -1 : 1) * (Number(deg) + Number(min) / 60 + Number(sec) / 3600);
function placeOfZone(zoneTab, zone) {
  const row = zoneTab.split(`
`).find((line) => line.split("\t")[2] === zone);
  const found = ZONE_PLACE.exec(row?.split("\t")[1] ?? "");
  if (found === null)
    return;
  const [, latSign = "+", latDeg = "0", latMin = "0", latSec, lonSign = "+", lonDeg = "0", lonMin = "0", lonSec] = found;
  return { lat: degrees(latSign, latDeg, latMin, latSec), lon: degrees(lonSign, lonDeg, lonMin, lonSec) };
}

const PX_PER_COL$2 = 8.8;
const DEFAULT_COLS$2 = 100;
const FULL = 100;
const PLAN_MIN = 150;
const PLAN_MAX = 340;
const PLAN_PANE = "plan";
const USAGE_PANE = "usage";
const COMMAND = { [PLAN_PANE]: { command: "steps" }, [USAGE_PANE]: { command: "hud", args: "full" } };
const stepsFrom = (value) => Array.isArray(value) ? value.flatMap((one) => {
  const step = one;
  return typeof step?.subject === "string" && typeof step.status === "string" ? [{ subject: step.subject, status: step.status }] : [];
}) : [];
const withPace = (limits, pace) => {
  const told = pace;
  if (typeof told?.window !== "string" || told.fullAt !== null && typeof told.fullAt !== "number")
    return limits;
  return limits.map((run) => run.kind === told.window && run.percent < FULL ? { ...run, endsAt: told.fullAt } : run);
};
async function factsOf(io) {
  const usage = await io.usage().catch(() => {
    return;
  });
  const now = await io.now();
  return {
    cost: usage?.cost?.usd ?? 0,
    tally: { ...NO_TALLY, ...await io.tally() },
    crew: (await io.agents()).filter((a) => a.status === "running"),
    mood: await io.mood(),
    steps: stepsFrom(await io.plan().catch(() => {
      return;
    })),
    limits: withPace((usage?.rateLimits ?? []).flatMap((limit) => runwayOf(limit, now) ?? []), await io.pace().catch(() => {
      return;
    })),
    now,
    isHubOn: await io.isHubOn().catch(() => false)
  };
}
function planSlot(facts, presses) {
  if (facts.steps.length === 0)
    return [];
  const done = facts.steps.filter((step) => step.status === "completed").length;
  const current = facts.steps.find((step) => step.status === "in_progress") ?? facts.steps.find((step) => step.status !== "completed");
  const base = { id: "plan", label: t().stripPlan, value: `${done}/${facts.steps.length}`, widest: `${facts.steps.length}/${facts.steps.length}` };
  const chip = current === undefined ? { ...base, note: t().stripPlanDone, tone: "ok" } : { ...base, note: current.subject };
  return [{ chip, rank: 0, isNoteKept: true, press: presses.open(PLAN_PANE) }];
}
function limitSlot(run, facts, presses) {
  const isWeek = run.kind === SEVEN_DAY;
  const base = { id: run.kind, label: isWeek ? t().stripWeek : t().stripFive, value: t().pct(Math.round(run.percent)), widest: widest().percent, meter: run.percent };
  const rank = isWeek ? 2 : 5;
  const press = presses.open(USAGE_PANE);
  if (run.percent >= FULL)
    return { chip: { ...base, note: t().stripFull, tone: "danger" }, rank, isNoteKept: true, press };
  if (run.endsAt === null)
    return { chip: base, rank, press };
  return { chip: { ...base, note: t().stripRunsOut(whenText(run.endsAt, facts.now)), tone: "warn" }, rank, isNoteKept: true, press };
}
const widest = () => ({ cost: fmtCost(8888.8), tokens: fmtTokens(888800000), time: spanText(3599000), percent: t().pct(100) });
function slotsOf(facts, presses) {
  const helpers = facts.crew.filter((a) => a.isMain !== true).length;
  const { tally: counted } = facts;
  const usage = presses.open(USAGE_PANE);
  const windows = [SEVEN_DAY, FIVE_HOUR$1].flatMap((kind) => facts.limits.find((run) => run.kind === kind) ?? []);
  const room = widest();
  return [
    ...planSlot(facts, presses),
    { chip: { id: "cost", label: t().stripCost, value: fmtCost(facts.cost), widest: room.cost }, rank: 1, press: usage },
    { chip: { id: "tokens", label: t().stripTokens, value: fmtTokens(counted.tokens), widest: room.tokens }, rank: 3, press: usage },
    { chip: { id: "time", label: t().stripTime, value: spanText(counted.busyMs), widest: room.time, ...helpers > 0 ? { note: t().crew(helpers) } : {} }, rank: 4, press: presses.onAgents },
    ...windows.map((run) => limitSlot(run, facts, presses)),
    ...presses.onHub === null ? [] : [{ chip: { id: "modz", label: "", value: "modz", isWordmark: true }, rank: 0, press: presses.onHub }]
  ];
}
const withoutNote = (slot) => {
  const { note: _dropped, ...chip } = slot.chip;
  return slot.isNoteKept === true ? slot : { ...slot, chip };
};
const fitW = (slot) => slot.chip.id === "plan" ? PLAN_MIN : chipWidth$1(slot.chip);
const rowW = (row) => row.reduce((sum, slot) => sum + fitW(slot), 0) + CHIP_GAP$1 * Math.max(0, row.length - 1);
function fitRow(slots, width) {
  let row = rowW(slots) > width ? slots.map(withoutNote) : [...slots];
  while (rowW(row) > width && row.some((slot) => slot.rank > 0)) {
    const top = Math.max(...row.map((slot) => slot.rank));
    row = row.filter((slot) => slot.rank !== top);
  }
  const spare = Math.max(0, width - rowW(row));
  return row.map((slot) => ({ slot, maxW: slot.chip.id === "plan" ? Math.min(PLAN_MAX, PLAN_MIN + spare) : Number.POSITIVE_INFINITY }));
}
const worked = new Map;
function withCrew(steps, crew) {
  const current = steps.find((step) => step.status === "in_progress");
  for (const subject of worked.keys())
    if (!steps.some((step) => step.subject === subject))
      worked.delete(subject);
  if (current !== undefined) {
    const seen = worked.get(current.subject) ?? new Map;
    for (const a of crew)
      if (a.isMain !== true)
        seen.set(a.id, { name: lookOf(a).name, shell: lookOf(a).shell });
    worked.set(current.subject, seen);
  }
  return steps.map((step) => ({ ...step, crew: [...worked.get(step.subject)?.values() ?? []] }));
}
const WALK_MS = 3600;
const stood = { x: Number.NaN, from: Number.NaN, at: 0 };
function walkFrom(x, now) {
  if (!Number.isNaN(stood.x) && x !== stood.x) {
    stood.from = stood.x;
    stood.at = now;
  }
  stood.x = x;
  return now - stood.at < WALK_MS ? stood.from : undefined;
}
function pressesOf(io, facts) {
  const failed = (cause) => io.log(`a strip chip could not open its pane: ${String(cause)}`);
  const viaHub = (pane) => async () => io.home(pane === undefined ? { at: await io.now() } : { at: await io.now(), pane }).catch(failed);
  const viaCommand = (pane) => () => {
    const command = COMMAND[pane];
    return command === undefined ? undefined : io.run(command).catch(failed);
  };
  return { open: facts.isHubOn ? viaHub : viaCommand, onAgents: io.onAgents, onHub: facts.isHubOn ? viaHub() : null };
}
function stripText(facts) {
  const done = facts.steps.filter((step) => step.status === "completed").length;
  const week = facts.limits.find((run) => run.kind === SEVEN_DAY);
  return [
    facts.steps.length === 0 ? "" : `${t().stripPlan} ${done}/${facts.steps.length}`,
    `${t().stripCost} ${fmtCost(facts.cost)}`,
    `${t().stripTokens} ${fmtTokens(facts.tally.tokens)}`,
    `${t().stripTime} ${spanText(facts.tally.busyMs)}`,
    week === undefined ? "" : `${t().stripWeek} ${t().pct(Math.round(week.percent))}`
  ].filter(Boolean).join(" · ");
}
const BLANK$1 = "ㅤ";
function chipPress(ui, slot, maxW) {
  const { Box, Button, Svg } = ui;
  const drawing = chipSvg(slot.chip, maxW);
  const { id } = slot.chip;
  return h(Box, {
    key: `savvy-chip-${id}`,
    flexShrink: 0,
    alignSelf: "flex-start"
  }, h(Svg, {
    key: `savvy-chip-pic-${id}`,
    source: drawing.source,
    alt: drawing.alt,
    width: drawing.width,
    height: CHIP_H
  }), h(Box, {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  }, h(Button, {
    key: `savvy-chip-press-${id}`,
    label: BLANK$1.repeat(chipCells(drawing.width)),
    plain: true,
    onPress: slot.press
  })));
}
async function stripOf(io, ui, site) {
  const seen = await factsOf(io);
  const facts = { ...seen, steps: withCrew(seen.steps, seen.crew) };
  if (!site.isDesktop) {
    const { Text } = ui;
    return h(Text, {
      key: "savvy-strip",
      dimColor: true
    }, stripText(facts));
  }
  const { Box, Svg } = ui;
  const width = Math.floor((site.cols || DEFAULT_COLS$2) * PX_PER_COL$2);
  const from = facts.steps.length === 0 ? undefined : walkFrom(layoutOf$1({ width, steps: facts.steps, crew: facts.crew }).stand, facts.now);
  const sky = { ...skyOf(facts.now, await io.place().catch(() => {
    return;
  })), weather: await io.weather().catch(() => {
    return;
  }) };
  const scene = sceneSvg({ width, crew: facts.crew, mood: facts.mood, steps: facts.steps, sky, ...from === undefined ? {} : { from } });
  const fitted = fitRow(slotsOf(facts, pressesOf(io, facts)), width);
  const chips = fitted.flatMap(({ slot, maxW }, i) => [
    ...i > 0 && i === fitted.length - 1 ? [h(Box, {
      key: "savvy-chip-spring",
      flexGrow: 1
    })] : [],
    chipPress(ui, slot, maxW)
  ]);
  return h(Box, {
    key: "savvy-strip",
    flexDirection: "column"
  }, h(Svg, {
    key: "savvy-scene",
    source: scene.source,
    alt: scene.alt,
    width,
    height: SCENE_H,
    isInteractive: true
  }), h(Box, {
    key: "savvy-chips",
    flexDirection: "row"
  }, chips));
}

const WEATHER_EVERY_MS = 30 * 60000;
const weatherUrl = (place) => `https://api.open-meteo.com/v1/forecast?latitude=${place.lat.toFixed(1)}&longitude=${place.lon.toFixed(1)}&current=weather_code`;
const KINDS = [
  [0, "clear"],
  [2, "cloudy"],
  [3, "overcast"],
  [45, "fog"],
  [51, "rain"],
  [71, "snow"],
  [80, "rain"],
  [85, "snow"],
  [95, "storm"]
];
const CODE_MAX = 99;
function weatherOfText(text) {
  let code;
  try {
    code = JSON.parse(text)?.current?.weather_code;
  } catch {
    return;
  }
  if (typeof code !== "number" || !(code >= 0 && code <= CODE_MAX))
    return;
  return KINDS.findLast(([from]) => code >= from)?.[1];
}

const agents$4 = atom({ plugin: "savvy-progress", key: "agents" }, []);
const flow$4 = atom({ plugin: "savvy-progress", key: "flow" }, null);
const job$4 = atom({ plugin: "savvy-progress", key: "job" }, null);
const tasks$4 = atom({ plugin: "savvy-progress", key: "tasks" }, []);
const now$3 = atom({ plugin: "savvy-progress", key: "now" }, 0);
const crab$2 = atom({ plugin: "savvy-progress", key: "crab" }, restingCrab(0));
const tally$1 = atom({ plugin: "savvy-progress", key: "tally" }, NO_TALLY);
const HOME$1 = { plugin: "savvy-progress", key: "home" };
const PX_PER_COL$1 = 8;
const BUTTONS_PX = 128;
const DEFAULT_COLS$1 = 100;
const TERM = { dot: 2, buttons: 12, gaps: 5, titleMin: 8, meterMin: 8, meterMax: 40, segMin: 3 };
const CELL = {
  ok: { key: "subtle", glyph: "━" },
  danger: { key: "error", glyph: "━" },
  run: { key: "claude", glyph: "━" },
  wait: { key: null, glyph: "─" }
};
const unitKind = (view, i) => {
  if (i < view.done - view.failed)
    return "ok";
  if (i < view.done)
    return "danger";
  return i < view.done + view.active ? "run" : "wait";
};
const pillKey = (view) => {
  if (!view.isFinished)
    return "claude";
  return view.failed ? "warning" : "subtle";
};
async function reportShown($, at) {
  try {
    if ((await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
      return;
    await $.state.set({ plugin: "savvy-progress", key: "shown" }, shownOf(HUB_PANE, at));
  } catch (cause) {
    $.ui.log(`savvy-progress: could not tell MODZ the pane is shown: ${String(cause)}`, { to: "debug" });
  }
}
async function openPane($) {
  paneHeld.isHeld = true;
  const at = await $.clock.now();
  await update($, now$3, () => at);
  motion.reset();
  const opened = await $.ui.open({ id: PANE, title: t().pane, focus: true });
  if (opened.isPlaced)
    await reportShown($, at);
}
let isWatchingPane = false;
const BEAT_LOOKS = HEARTBEAT_MS / SCAN_MS;
async function reopenPane$1($) {
  const opened = await $.ui.open({ id: PANE, title: t().pane });
  if (opened.isPlaced)
    await reportShown($, await $.clock.now());
}
const keepNouns = ($) => ({
  isListed: async () => (await $.ui.panes()).some((p) => p.id === PANE),
  reopen: () => reopenPane$1($),
  redraw: () => $.ui.invalidate("ui.render"),
  note: {
    read: async () => $.store.get(noteKey(await $.session.id())),
    write: async (at) => {
      const key = noteKey(await $.session.id());
      return at === undefined ? $.store.delete(key) : $.store.set(key, at);
    }
  },
  now: () => $.clock.now(),
  log: (text) => $.ui.log(`savvy-progress: ${text}`, { to: "debug" })
});
async function pruneNotes($) {
  try {
    const entries = [];
    for (const key of await $.store.keys())
      if (key.startsWith(NOTE_PREFIX))
        entries.push([key, await $.store.get(key)]);
    for (const key of staleNotes(entries, { own: noteKey(await $.session.id()), now: await $.clock.now() }))
      await $.store.delete(key);
  } catch (cause) {
    $.ui.log(`savvy-progress: could not drop old pane notes: ${String(cause)}`, { to: "debug" });
  }
}
function startWatch($) {
  let looks = 0;
  $.clock.every(SCAN_MS, () => void watchPane(paneHeld, keepNouns($), ++looks % BEAT_LOOKS === 0));
}
async function togglePane($) {
  const isOpen = (await $.ui.panes()).some((p) => p.id === PANE);
  if (isOpen) {
    paneHeld.isHeld = true;
    await $.ui.close({ id: PANE });
    return false;
  }
  await openPane($);
  return true;
}
async function dismiss($) {
  await update($, flow$4, () => null);
  await update($, job$4, (prev) => prev ? { ...prev, isSealed: true, isHidden: true } : prev);
}
function buttons(ui, $, view) {
  const { Button } = ui;
  return [
    h(Button, {
      key: "savvy-agents",
      label: t().crew(view.crew),
      plain: true,
      onPress: () => void togglePane($)
    }),
    h(Button, {
      key: "savvy-dismiss",
      label: "✕",
      plain: true,
      role: "dismiss",
      onPress: () => dismiss($)
    })
  ];
}
function desktopBand(ui, $, { view, cols, mood }) {
  const { Box, Svg } = ui;
  const drawing = bandSvg(view, (cols || DEFAULT_COLS$1) * PX_PER_COL$1 - BUTTONS_PX, mood);
  return h(Box, {
    key: "savvy-band",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, h(Svg, {
    source: drawing.source,
    alt: `${view.title}: ${view.label}, ${percentText(view)}`,
    width: drawing.width,
    height: BAND_H
  }), buttons(ui, $, view));
}
const termCells = (view, width) => {
  const units = Math.max(1, view.units);
  const per = Math.floor((width - (units - 1)) / units);
  const gap = { key: null, glyph: " " };
  if (view.units > 0 && per >= TERM.segMin) {
    return Array.from({ length: units }, (_, i) => [...i ? [gap] : [], ...Array(per).fill(CELL[unitKind(view, i)] ?? gap)]).flat();
  }
  if (view.units < 1)
    return Array(width).fill(CELL.wait ?? gap);
  return Array.from({ length: width }, (_, i) => CELL[unitKind(view, Math.floor(i * units / width))] ?? gap);
};
function meterText(ui, cells) {
  const { Text } = ui;
  const runs = [];
  for (const cell of cells) {
    const last = runs.at(-1);
    if (last && last.key === cell.key)
      last.text += cell.glyph;
    else
      runs.push({ key: cell.key, text: cell.glyph });
  }
  return h(Text, null, runs.map((run, i) => run.key ? h(Text, {
    key: `m${i}`,
    color: run.key
  }, run.text) : h(Text, {
    key: `m${i}`,
    dimColor: true
  }, run.text)));
}
const termPlan = (view, cols) => {
  const avail = cols - TERM.dot - view.label.length - percentText(view).length - TERM.buttons - TERM.gaps;
  const natural = view.title.length;
  if (avail - natural >= TERM.meterMin)
    return { titleW: natural, meterW: Math.min(TERM.meterMax, avail - natural) };
  const titleW = Math.max(TERM.titleMin, avail - TERM.meterMin);
  const meterW = avail - titleW;
  return meterW >= TERM.meterMin ? { titleW, meterW } : { titleW: Math.max(TERM.titleMin, avail + 1), meterW: 0 };
};
function terminalBand(ui, $, { view, cols, mood }) {
  const { Box, Text } = ui;
  const face = mood ? FACES[mood] : "";
  const plan = termPlan(view, (cols || DEFAULT_COLS$1) - (face ? face.length + 1 : 0));
  return h(Box, {
    key: "savvy-band",
    flexDirection: "row",
    columnGap: 1
  }, h(Box, {
    width: plan.titleW + TERM.dot,
    flexShrink: 0
  }, h(Text, {
    color: pillKey(view)
  }, "● "), h(Text, {
    bold: true,
    wrap: "truncate-end"
  }, view.title)), h(Text, {
    color: pillKey(view)
  }, view.label), plan.meterW > 0 && meterText(ui, termCells(view, plan.meterW)), h(Text, {
    bold: true
  }, percentText(view)), face !== "" && h(Text, {
    dimColor: true
  }, face), buttons(ui, $, view));
}
async function viewOf($) {
  return deriveJob({ flow: await read($, flow$4), agents: await read($, agents$4), job: await read($, job$4), tasks: await read($, tasks$4) });
}
function onOpen(on) {
  on("command.run", { command: "agents-info" }, async ($) => {
    const isOpen = await togglePane($);
    return { text: isOpen ? t().opened : t().closed };
  });
  on("session.attach", async ($, e, next) => {
    const done = await next(e);
    if (e.surface !== "desktop")
      return done;
    await restorePane(paneHeld, keepNouns($));
    if (!isWatchingPane) {
      isWatchingPane = true;
      await pruneNotes($);
      startWatch($);
    }
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "open" }, async ($, e, next) => {
    const done = await next(e);
    if (isOwnOpen(e.value))
      await openPane($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "modz", key: "stage" }, async ($, e, next) => {
    const done = await next(e);
    if (isOffStage(e.value, HUB_PANE)) {
      paneHeld.isHeld = true;
      await $.ui.close({ id: PANE });
    }
    return done;
  }).catch(($, e, next) => next(e));
}
async function bandMood($, isCrabInBand) {
  if (!isCrabInBand)
    return;
  const { mood } = await read($, crab$2);
  return isIdleMood(mood) ? mood : undefined;
}
const ZONE_TAB = "/usr/share/zoneinfo/zone.tab";
let placeFound;
const placeOf = async ($) => placeFromText(await $.env.get("MODZ_PLACE")) ?? placeOfZone(await $.fs.read(ZONE_TAB), Intl.DateTimeFormat().resolvedOptions().timeZone);
let weatherSeen = { at: 0, kind: undefined };
async function askWeather($) {
  if (await $.env.get("MODZ_WEATHER") === "off")
    return;
  const place = await (placeFound ??= placeOf($));
  if (place === undefined)
    return;
  const kind = weatherOfText((await $.http.fetch(weatherUrl(place))).text);
  if (kind === weatherSeen.kind)
    return;
  weatherSeen = { ...weatherSeen, kind };
  await $.ui.invalidate("ui.render");
}
const weatherOf = ($, now) => {
  if (now - weatherSeen.at >= WEATHER_EVERY_MS) {
    weatherSeen = { ...weatherSeen, at: now };
    askWeather($).catch((cause) => $.ui.log(`savvy-progress: the weather could not be read: ${String(cause)}`, { to: "debug" }));
  }
  return weatherSeen.kind;
};
const stripIo = ($) => ({
  usage: () => $.session.usage(),
  now: () => $.clock.now(),
  place: () => placeFound ??= placeOf($),
  weather: async () => weatherOf($, await $.clock.now()),
  plan: async () => (await $.state.get({ plugin: "plan-steps", key: "tasks" })).value,
  isHubOn: async () => (await $.state.get({ plugin: "modz", key: "isOn" })).value === true,
  pace: async () => (await $.state.get({ plugin: "hud-pro", key: "pace" })).value,
  tally: () => read($, tally$1),
  agents: () => read($, agents$4),
  mood: async () => (await read($, crab$2)).mood,
  home: (value) => $.state.set(HOME$1, value),
  run: (command) => $.command.run(command),
  log: (text) => $.ui.log(`savvy-progress: ${text}`, { to: "debug" }),
  onAgents: () => void togglePane($)
});
function onBand(on, opts) {
  onOpen(on);
  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    if (e.props.hasSurvey)
      return next(e);
    const theirs = await next(e);
    const ui = $.ui.resolve(e);
    const { Box } = ui;
    const isDesktop = e.surface !== "terminal" && "Svg" in ui;
    const view = await viewOf($);
    const input = view === null ? null : { view, cols: e.props.bodyColumns, mood: await bandMood($, opts.isCrabInBand) };
    const job = input === null ? null : isDesktop ? desktopBand(ui, $, input) : terminalBand(ui, $, input);
    const strip = await stripOf(stripIo($), ui, { isDesktop, cols: e.props.bodyColumns });
    return h(Box, {
      flexDirection: "column"
    }, job === null ? null : pinned(e, job), pinned(e, strip), theirs);
  });
}

const PILL = { h: 20, padX: 9, size: 11, dot: 3, dotGap: 6 };
const BOLD$3 = 1.06;
const LABEL$3 = { size: 12, weight: 600 };
const HEAD = { h: 28, size: 13.5, gap: 10, nameGap: 7 };
const CHEVRON_ROOM = 22;
const CHEVRON = 4.5;
const STROKE$1 = 1.5;
const SECTION_H = 18;
const HEAD_H = HEAD.h;
const PILL_INK = {
  run: { dot: "f-edit live", text: "f-edit" },
  ok: { dot: "m", text: "s" },
  warn: { dot: "f-warn", text: "f-warn" },
  danger: { dot: "f-danger", text: "f-danger" }
};
const pillPart = (pill, x, y) => {
  const width = Math.ceil(textWidth(pill.text, PILL.size) * BOLD$3 + PILL.padX * 2 + PILL.dot * 2 + PILL.dotGap);
  const mid = y + PILL.h / 2;
  const ink = PILL_INK[pill.role];
  const body = [
    `<rect class="k" x="${x}" y="${y}" width="${width}" height="${PILL.h}" rx="${PILL.h / 2}"/>`,
    `<circle class="${ink.dot}" cx="${x + PILL.padX + PILL.dot}" cy="${mid}" r="${PILL.dot}"/>`,
    `<text class="${ink.text}" x="${x + PILL.padX + PILL.dot * 2 + PILL.dotGap}" y="${mid + PILL.size * 0.35}" font-family="${FONT}" font-size="${PILL.size}" font-weight="600">${xml(pill.text)}</text>`
  ];
  return { body: body.join(""), width };
};
const chevronSvg = (x, y) => `<g class="chev"><path d="M${x} ${y - CHEVRON}l${CHEVRON} ${CHEVRON}-${CHEVRON} ${CHEVRON}" fill="none" stroke-width="${STROKE$1}" stroke-linecap="round" stroke-linejoin="round" class="i-m"/></g>`;
const cardHeadSvg = (W, head) => {
  const right = W - CHEVRON_ROOM;
  const probe = pillPart(head.pill, 0, 0);
  const pill = pillPart(head.pill, right - probe.width, (HEAD.h - PILL.h) / 2);
  const nameW = textWidth(head.name, HEAD.size) * BOLD$3;
  const title = fitText(head.title, HEAD.size, right - probe.width - HEAD.gap - nameW - HEAD.nameGap);
  const titleSpan = title === "…" ? "" : `<tspan class="s" dx="${HEAD.nameGap}">${xml(title)}</tspan>`;
  const y = HEAD.h / 2 + HEAD.size * 0.35;
  const body = [
    `<text x="0" y="${y}" font-family="${FONT}" font-size="${HEAD.size}"><tspan class="t" font-weight="620">${xml(head.name)}</tspan>${titleSpan}</text>`,
    pill.body,
    chevronSvg(W - CHEVRON_ROOM / 2 - CHEVRON / 2, HEAD.h / 2)
  ];
  return paneSvg(W, HEAD.h, body.join(""));
};
const sectionSvg = (W, section) => {
  const label = `<text class="m" x="0" y="${SECTION_H / 2 + LABEL$3.size * 0.36}" font-family="${FONT}" font-size="${LABEL$3.size}" font-weight="${LABEL$3.weight}">${xml(fitText(section.label, LABEL$3.size * BOLD$3, W))}</text>`;
  return paneSvg(W, SECTION_H, label);
};
const SECTION_SVG_H = SECTION_H;
const NOTICE = { h: 32, padX: 8, dot: 3, gap: 9, size: 13 };
const noticeSvg = (W, notice) => {
  const mid = NOTICE.h / 2;
  const x = NOTICE.padX + NOTICE.dot * 2 + NOTICE.gap;
  const lead = `${notice.name} `;
  const reason = notice.reason;
  const used = textWidth(lead, NOTICE.size) * BOLD$3 + textWidth(reason, NOTICE.size) * BOLD$3;
  const title = fitText(` · ${notice.title}`, NOTICE.size, Math.max(0, W - x - CHEVRON_ROOM - used));
  const body = [
    `<circle class="f-${notice.role}" cx="${NOTICE.padX + NOTICE.dot}" cy="${mid}" r="${NOTICE.dot}"/>`,
    `<text x="${x}" y="${mid + NOTICE.size * 0.35}" font-family="${FONT}" font-size="${NOTICE.size}" font-weight="560"><tspan class="t">${xml(lead)}</tspan><tspan class="f-${notice.role}">${xml(reason)}</tspan><tspan class="s" font-weight="400">${xml(title === "…" ? "" : title)}</tspan></text>`,
    chevronSvg(W - CHEVRON_ROOM / 2 - CHEVRON / 2, mid)
  ];
  return paneSvg(W, NOTICE.h, body.join(""));
};
const NOTICE_H = NOTICE.h;

const types$2 = atom({ plugin: "savvy-progress", key: "types" }, BUILTIN_TYPES);
function draftHead(ui, layout) {
  const { Text } = ui;
  const label = t().newTask;
  if (!layout.isDesktop)
    return h(Text, {
      bold: true,
      dimColor: true
    }, label);
  return picture(ui, { key: "draft-head", at: "draft-head", pic: { source: sectionSvg(layout.inner, { label }), alt: label, width: layout.inner, height: SECTION_SVG_H } });
}
function draftTree(ui, view, on) {
  const { Box, Button, Input, Select, Text } = ui;
  const s = t();
  const chosen = chosenOf(view.types, view.draft);
  const frame = view.layout.isDesktop ? { borderStyle: "round", paddingX: 2, paddingY: 1 } : {};
  return h(Box, {
    key: "draft",
    flexDirection: "column",
    rowGap: 1,
    ...frame
  }, draftHead(ui, view.layout), !chosen && h(Text, {
    dimColor: true
  }, s.noTypes), chosen && Select && h(Select, {
    key: "dispatch-type",
    label: s.agentLabel,
    options: view.types.map((type) => ({ value: type.name, label: type.name })),
    value: chosen.name,
    onSelect: on.onPickType
  }), chosen && h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, `${sourceWord(chosen.source)} · ${describe(chosen)}`), chosen && Input && h(Input, {
    key: "dispatch-task",
    label: s.taskLabel,
    placeholder: s.taskHint,
    value: "",
    submitLabel: s.start,
    autoFocus: true,
    onSubmit: on.onStartTask
  }), view.draft?.notice && h(Text, {
    color: "warning"
  }, view.draft.notice), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "dispatch-cancel",
    plain: true,
    dimColor: true,
    label: s.cancel,
    onPress: on.onCancelTask
  })));
}
function onDispatch(on) {
  on("agent.offer", async ($, e, next) => {
    const answer = await next(e);
    const type = offered(e);
    if (!(await read($, types$2)).some((known) => known.name === type.name))
      await update($, types$2, (current) => mergeTypes(current, [type]));
    return answer;
  }).catch(($, e, next) => next(e));
}

const FIVE_HOUR = "five_hour";
const MIN_POINTS = 0.5;
const MIN_USD = 0.05;
const TENTH = 0.1;
const ONE_DECIMAL_BELOW = 10;
const readingOf = (rateLimits, usd) => {
  const window = rateLimits.find((limit) => limit.kind === FIVE_HOUR);
  if (!window || usd === undefined)
    return null;
  return { percent: window.percentUsed, usd, resetsAt: window.resetsAt };
};
const rateBetween = (track) => {
  const points = track.percent - track.basePercent;
  const usd = track.usd - track.baseUsd;
  return points >= MIN_POINTS && usd >= MIN_USD ? points / usd : null;
};
const trackLimit = (prev, reading) => {
  if (!prev)
    return { basePercent: reading.percent, baseUsd: reading.usd, percent: reading.percent, usd: reading.usd, resetsAt: reading.resetsAt };
  const hasReset = reading.resetsAt !== undefined && prev.resetsAt !== undefined && reading.resetsAt !== prev.resetsAt;
  if (!hasReset)
    return { ...prev, percent: reading.percent, usd: reading.usd, resetsAt: reading.resetsAt ?? prev.resetsAt };
  const carried = rateBetween(prev) ?? prev.carriedRate;
  return { basePercent: reading.percent, baseUsd: reading.usd, percent: reading.percent, usd: reading.usd, resetsAt: reading.resetsAt, carriedRate: carried };
};
const rateOf = (track) => track ? rateBetween(track) ?? track.carriedRate ?? null : null;
const shareOf = (costUsd, track) => {
  const rate = rateOf(track);
  return rate === null ? null : costUsd * rate;
};
const shareNumber = (points) => {
  if (points < TENTH)
    return `<${fixed(TENTH, 1)}`;
  return points < ONE_DECIMAL_BELOW ? fixed(points, 1) : String(Math.round(points));
};

const FILES_MAX = 40;
const READS = ["Read", "NotebookRead"];
const EDITS = ["Edit", "Write", "MultiEdit", "NotebookEdit"];
const pathOf = (call) => {
  const value = call.file_path ?? call.notebook_path;
  return typeof value === "string" ? value.trim() : "";
};
const touchFile = (a, facts) => {
  const tool = toolName(String(facts.call.tool ?? ""));
  const isRead = READS.includes(tool);
  const path = pathOf(facts.call);
  if (!path || !isRead && !EDITS.includes(tool))
    return a;
  const list = a.files ?? [];
  const prev = list.find((f) => f.path === path);
  const next = {
    path,
    reads: (prev?.reads ?? 0) + (isRead ? 1 : 0),
    edits: (prev?.edits ?? 0) + (isRead ? 0 : 1),
    at: facts.at
  };
  return { ...a, files: [...list.filter((f) => f.path !== path), next].slice(-FILES_MAX) };
};
const filesShown = (files) => {
  const latest = [...files].sort((x, y) => y.at - x.at);
  return [...latest.filter((f) => f.edits > 0), ...latest.filter((f) => f.edits === 0)];
};
const EXT = /\.([a-z0-9]{1,5})$/i;
const extOf = (path) => (EXT.exec(path)?.[1] ?? "").toUpperCase();

const tally = atom({ plugin: "savvy-progress", key: "tally" }, NO_TALLY);
const agents$3 = atom({ plugin: "savvy-progress", key: "agents" }, []);
const flow$3 = atom({ plugin: "savvy-progress", key: "flow" }, null);
const job$3 = atom({ plugin: "savvy-progress", key: "job" }, null);
const now$2 = atom({ plugin: "savvy-progress", key: "now" }, 0);
const tasks$3 = atom({ plugin: "savvy-progress", key: "tasks" }, []);
const limit$2 = atom({ plugin: "savvy-progress", key: "limit" }, null);
const launchEffort = new Map;
let asked;
const STEP_BRIEF = `

Progress reporting: before any other work, call \`${STEP_TOOL}\` with \`total\` (your plan in 3-8 steps) and \`done: 0\`; call it again with \`done\` and a few-word \`note\` as each step finishes. It only draws a progress bar.`;
async function stamp($) {
  const at = await $.clock.now();
  await update($, now$2, () => at);
  return at;
}
function onReports(on) {
  on("tool.call", { tool: TOOL }, async ($, e) => {
    if (e.agentId)
      return { result: "ignored: only the main session reports the flow" };
    const input = e;
    const prev = await read($, flow$3);
    if (isNewFlow(prev, input) && input.title !== undefined)
      await update($, agents$3, (list) => list.filter(isRunning));
    const next = await update($, flow$3, (p) => mergeFlow(p, input));
    const view = deriveJob({ flow: next, agents: [], job: null, tasks: [] });
    return { result: `ok: ${view?.label ?? ""}` };
  });
  on("tool.call", { tool: STEP_TOOL }, async ($, e) => {
    const agentId = e.agentId;
    if (!agentId)
      return { result: "ignored: only subagents report steps" };
    const input = e;
    const at = await $.clock.now();
    const list = await update($, agents$3, (all) => patchRun(all, agentId, (a) => heard(stepReport(a, input), at)));
    return { result: list.some((a) => a.agentId === agentId) ? "ok" : `ignored: no panel row for agent ${agentId}` };
  });
}
function onLaunches(on) {
  on("tool.call", { tool: "Agent" }, async ($, e, next) => {
    if (typeof e.effort === "string" && e.tool_use_id)
      launchEffort.set(e.tool_use_id, e.effort);
    try {
      return await next(e);
    } finally {
      launchEffort.delete(e.tool_use_id ?? "");
    }
  });
  on("agent.spawn", async ($, e, next) => {
    const isUnbriefed = savvyTierOf(e.subagentType) !== null && !e.prompt.includes(STEP_TOOL);
    const started = await next(isUnbriefed ? { ...e, prompt: e.prompt + STEP_BRIEF } : e);
    if (started.deny !== undefined)
      return started;
    const at = await stamp($);
    const id = started.agentId ?? e.tool_use_id;
    const spawn = { id, agentId: started.agentId, toolUseId: e.tool_use_id, parentId: e.parentAgentId, at };
    const who = { type: e.subagentType, description: e.description, brief: e.prompt, model: started.model, effort: launchEffort.get(e.tool_use_id) };
    await update($, agents$3, (list) => addRun(list, { ...spawn, ...who }));
    if (!e.parentAgentId)
      await update($, job$3, (prev) => joinJob(prev, id, at));
    return started;
  });
  on("prompt.submit", async ($, e, next) => {
    const result = await next(e);
    if (e.origin.kind === "task-notification")
      return result;
    asked = titleOf$1(e.text);
    const list = await read($, agents$3);
    const before = await read($, job$3);
    const kept = isSame(sealJob(before, list), before) ? before : await update($, job$3, (prev) => sealJob(prev, list));
    const open = await read($, tasks$3);
    if ((!kept || kept.isSealed) && !isSame(openTasks(open), open))
      await update($, tasks$3, openTasks);
    if ((await read($, flow$3))?.isFinished)
      await update($, flow$3, (f) => f?.isFinished ? null : f);
    return result;
  });
}
function onActivity(on) {
  on("tool.call", async ($, e, next) => {
    const call = e;
    const name = String(e.tool);
    const agentId = e.agentId;
    const who = agentId ?? MAIN_ID;
    const id = typeof call.tool_use_id === "string" ? call.tool_use_id : undefined;
    const isModelCall = next.origin.plugin === "engine";
    const isTracked = isModelCall && name !== STEP_TOOL && (await read($, agents$3)).some((a) => a.agentId === who);
    if (isTracked) {
      const at = await $.clock.now();
      const facts = { call, at, id };
      await update($, agents$3, (list) => patchRun(list, who, (a) => heard(openEvent(touchFile(toolActivity(a, call), facts), facts), at)));
    }
    const result = await next(e);
    if (isTracked) {
      const facts = { id, tool: name, at: await $.clock.now(), isError: result.deny !== undefined || result.isError === true };
      await update($, agents$3, (list) => patchRun(list, who, (a) => heard(closeEvent(a, facts), facts.at)));
    }
    if (!TASK_TOOLS.includes(name) || result.deny !== undefined || result.isError)
      return result;
    if (agentId)
      await update($, agents$3, (list) => patchRun(list, agentId, (a) => ownTasks(a, call, result.result)));
    else
      await update($, tasks$3, (list) => applyTaskTool(list, call, result.result));
    return result;
  }).catch(($, e, next) => next(e));
}
async function countTurn$1($, e) {
  const used = e.usage === undefined ? 0 : tokensOf(e.usage);
  const isMain = e.agentId === undefined;
  const cost = isMain ? (await $.session.usage().catch(() => {
    return;
  }))?.cost?.usd ?? 0 : 0;
  await update($, tally, (x) => {
    const was = { ...NO_TALLY, ...x };
    if (!isMain)
      return { ...was, tokens: was.tokens + used };
    return { tokens: was.tokens + used, busyMs: was.busyMs + (e.durationMs ?? 0), turns: was.turns + 1, lastCost: was.costBefore > 0 ? Math.max(0, cost - was.costBefore) : 0, costBefore: cost };
  });
}
function onSteps(on) {
  on("turn.step", async function* ($, e, next) {
    const agentId = e.agentId ?? MAIN_ID;
    const sent = await $.clock.now();
    if (!e.agentId && e.index === 0) {
      const title = asked;
      asked = undefined;
      await update($, agents$3, (list) => mainAwake(list, { title, at: sent }));
    }
    await update($, agents$3, (list) => patchRun(list, agentId, (a) => ({ ...heard(a, sent), stepAt: sent })));
    const result = yield* next(e);
    const usage = result.usage;
    const facts = usage && { model: usage.model || e.model, effort: e.effort, usage };
    const at = await $.clock.now();
    const step = { answer: result.answer, calls: result.toolUses.length, sentAt: sent };
    await update($, agents$3, (list) => patchRun(list, agentId, (a) => heard({ ...withReason(facts ? stepUsage(reopen(a), facts) : a, step), stepAt: undefined }, at)));
    return result;
  });
  on("turn.complete", async ($, e, next) => {
    const agentId = e.agentId ?? MAIN_ID;
    const at = await stamp($);
    await update($, agents$3, (list) => patchRun(list, agentId, (a) => endRun(a, { reason: e.reason, at, answer: e.answer, usage: e.usage })));
    await countTurn$1($, e).catch((cause) => $.ui.log(`savvy-progress: could not count the turn: ${String(cause)}`, { to: "debug" }));
    return next(e);
  });
}
async function follow($, reading) {
  if (!reading)
    return;
  const prev = await read($, limit$2);
  if (!isSame(trackLimit(prev, reading), prev))
    await update($, limit$2, (p) => trackLimit(p, reading));
}
function onLimit(on) {
  on("session.measure", async ($, e, next) => {
    await follow($, readingOf(e.rateLimits, e.cost?.usd));
    return next(e);
  });
}
function onEvents(on) {
  onLimit(on);
  onReports(on);
  onLaunches(on);
  onActivity(on);
  onSteps(on);
}

const CARD = { padX: 14, rx: 10, labelY: 24, firstRowY: 48, rowH: 22, bottom: 14 };
const LABEL$2 = { size: 12, weight: 600 };
const ROW$1 = { size: 13, waitSize: 12, gap: 10 };
const BOLD$2 = 1.06;
const rowSvg = (row, y, W) => {
  const right = W - CARD.padX;
  const waitW = Math.ceil(textWidth(row.wait, ROW$1.waitSize) * BOLD$2);
  const room = right - waitW - ROW$1.gap - CARD.padX;
  const project = fitText(row.project, ROW$1.size * BOLD$2, room);
  const titleRoom = room - textWidth(project, ROW$1.size) * BOLD$2;
  const title = row.title ? fitText(` · ${row.title}`, ROW$1.size, titleRoom) : "";
  const titleSpan = title && title !== "…" ? `<tspan class="s" font-weight="400">${xml(title)}</tspan>` : "";
  return [
    `<text x="${CARD.padX}" y="${y}" font-family="${FONT}" font-size="${ROW$1.size}" font-weight="560"><tspan class="t">${xml(project)}</tspan>${titleSpan}</text>`,
    `<text class="f-warn" x="${right}" y="${y}" text-anchor="end" font-family="${FONT}" font-size="${ROW$1.waitSize}" font-weight="600">${xml(row.wait)}</text>`
  ].join("");
};
const chatsCardSvg = (W, card) => {
  const lines = card.rows.length + (card.more ? 1 : 0);
  const height = CARD.firstRowY + (lines - 1) * CARD.rowH + CARD.bottom;
  const rows = card.rows.map((row, i) => rowSvg(row, CARD.firstRowY + i * CARD.rowH, W));
  const moreY = CARD.firstRowY + card.rows.length * CARD.rowH;
  const more = card.more ? `<text class="m" x="${CARD.padX}" y="${moreY}" font-family="${FONT}" font-size="${ROW$1.waitSize}">${xml(card.more)}</text>` : "";
  const body = [
    `<rect class="card ln" x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="${CARD.rx}" stroke-width="1"/>`,
    `<text class="m" x="${CARD.padX}" y="${CARD.labelY}" font-family="${FONT}" font-size="${LABEL$2.size}" font-weight="${LABEL$2.weight}">${xml(fitText(card.title, LABEL$2.size * BOLD$2, W - CARD.padX * 2))}</text>`,
    ...rows,
    more
  ];
  const alt = [card.title, ...card.rows.map((row) => [row.project, row.title, row.wait].filter(Boolean).join(" · ")), card.more].filter(Boolean).join(", ");
  return { source: paneSvg(W, height, body.join("")), height, alt };
};
const LIST = { rowH: 24, size: 13, sizeSmall: 12, dot: 3, indent: 13, chipGap: 10 };
const lineSvg = (line, y, W) => {
  const base = y + LIST.rowH / 2 + LIST.size * 0.35;
  const x = line.kind === "agent" ? LIST.indent : LIST.dot * 2 + 7;
  const size = line.kind === "agent" ? LIST.sizeSmall : LIST.size;
  const endW = line.end ? Math.ceil(textWidth(line.end, LIST.sizeSmall)) + LIST.chipGap : 0;
  const room = W - x - endW;
  const lead = fitText(line.lead, size * BOLD$2, room);
  const rest = fitText(` · ${line.text}`, size, room - textWidth(lead, size) * BOLD$2);
  const dot = line.kind === "chat" ? `<circle class="${line.isLive ? "f-edit live" : "m"}" cx="${LIST.dot}" cy="${y + LIST.rowH / 2}" r="${LIST.dot}"/>` : "";
  const end = line.end ? `<text class="m" x="${W}" y="${base}" text-anchor="end" font-family="${FONT}" font-size="${LIST.sizeSmall}" font-variant-numeric="tabular-nums">${xml(line.end)}</text>` : "";
  const restSpan = line.text && rest !== "…" ? `<tspan class="m">${xml(rest)}</tspan>` : "";
  return `${dot}<text x="${x}" y="${base}" font-family="${FONT}" font-size="${size}"><tspan class="${line.kind === "chat" ? "t" : "s"}" font-weight="560">${xml(lead)}</tspan>${restSpan}</text>${end}`;
};
const chatLinesSvg = (W, lines) => {
  const height = lines.length * LIST.rowH;
  const alt = lines.map((line) => [line.lead, line.text, line.end].filter(Boolean).join(" · ")).join(", ");
  return { source: paneSvg(W, height, lines.map((line, i) => lineSvg(line, i * LIST.rowH, W)).join("")), height, alt };
};

const PAD = 16;
const RADIUS = 10;
const LABEL$1 = { size: 12, weight: 600, y: 27 };
const HEADLINE = { size: 17, y: 56 };
const PERCENT$1 = { size: 26, y: 58 };
const MONO_EM = 0.6;
const METER = { y: 70, h: 6 };
const DIVIDER_Y = 92;
const STATS = { top: 104, label: 11, value: 31, valueSize: 15, labelSize: 12, rule: 34, pitch: 46 };
const BOLD$1 = 1.06;
const DOT_R$1 = 3;
const GAP = 12;
const HOME = { y: 11, scale: 1.5, room: 58 };
const PILL_GAP = 8;
const PILL_DROP = 4;
const PERCENT_CLASS = { run: "t", ok: "t", warn: "f-warn", idle: "m" };
const UNKNOWN = "—";
const needOf = (stat) => Math.max(textWidth(stat.label, STATS.labelSize), textWidth(stat.value, STATS.valueSize) * BOLD$1) + GAP * 2;
const columnsOf = (inner, stats) => {
  const need = Math.max(0, ...stats.map(needOf));
  const fits = (cols) => inner / cols >= need;
  if (fits(stats.length))
    return stats.length;
  return fits(2) ? 2 : 1;
};
const statSvg = (stat, { x, y, w }) => `<text class="m" x="${x}" y="${y + STATS.label}" font-family="${FONT}" font-size="${STATS.labelSize}">${xml(fitText(stat.label, STATS.labelSize, w))}</text>
<text class="t" x="${x}" y="${y + STATS.value}" font-family="${FONT}" font-size="${STATS.valueSize}" font-weight="650" font-variant-numeric="tabular-nums">${xml(fitText(stat.value, STATS.valueSize, w))}</text>`;
const statsSvg = (stats, inner) => {
  const cols = columnsOf(inner, stats);
  const rows = Math.ceil(stats.length / cols);
  const colW = inner / cols;
  const parts = stats.map((stat, i) => {
    const col = i % cols;
    const y = STATS.top + Math.floor(i / cols) * STATS.pitch;
    const x = PAD + col * colW;
    return statSvg(stat, { x, y, w: colW - GAP });
  });
  return { body: parts.join(`
`), height: STATS.top + (rows - 1) * STATS.pitch + STATS.rule + PAD };
};
const homeParts = (data, eyebrowEnd) => {
  if (!data.home)
    return { body: "", room: 0 };
  const crab = homeCrab(PAD, HOME.y, { home: data.home, scale: HOME.scale });
  const pill = levelPill(data.home.level, eyebrowEnd + PILL_GAP, LABEL$1.y - LEVEL_PILL.h + PILL_DROP);
  return { body: crab + pill, room: PILL_GAP + levelWidth(data.home.level) };
};
const headerSvg = (W, data) => {
  const inner = W - PAD * 2;
  const left = PAD + (data.home ? HOME.room : 0);
  const isLive = data.tone === "run";
  const eyebrowX = left + (isLive ? DOT_R$1 * 2 + 7 : 0);
  const eyebrowEnd = eyebrowX + textWidth(data.eyebrow, LABEL$1.size) * BOLD$1;
  const home = homeParts(data, eyebrowEnd);
  const isKnown = data.percent !== UNKNOWN;
  const percentW = isKnown ? Math.ceil(data.percent.length * PERCENT$1.size * MONO_EM) : 0;
  const isCountShown = textWidth(data.counts, LABEL$1.size) <= W - PAD - eyebrowEnd - home.room - GAP;
  const headline = fitText(data.headline, HEADLINE.size * 1.06, W - PAD - left - percentW - (isKnown ? GAP : 0));
  const stats = statsSvg(data.stats, inner);
  const dot = isLive ? `<circle class="f-edit live" cx="${left + DOT_R$1}" cy="${LABEL$1.y - 4}" r="${DOT_R$1}"/>` : "";
  const body = [
    `<rect class="card ln" x="0.5" y="0.5" width="${W - 1}" height="${stats.height - 1}" rx="${RADIUS}" stroke-width="1"/>`,
    home.body,
    dot,
    `<text class="m" x="${eyebrowX}" y="${LABEL$1.y}" font-family="${FONT}" font-size="${LABEL$1.size}" font-weight="${LABEL$1.weight}">${xml(data.eyebrow)}</text>`,
    isCountShown ? `<text class="m" x="${W - PAD}" y="${LABEL$1.y}" text-anchor="end" font-family="${FONT}" font-size="${LABEL$1.size}" font-variant-numeric="tabular-nums">${xml(data.counts)}</text>` : "",
    `<text class="t" x="${left}" y="${HEADLINE.y}" font-family="${FONT}" font-size="${HEADLINE.size}" font-weight="620">${xml(headline)}</text>`,
    isKnown ? `<text class="${PERCENT_CLASS[data.tone]}" x="${W - PAD}" y="${PERCENT$1.y}" text-anchor="end" font-family="${MONO}" font-size="${PERCENT$1.size}" font-weight="650">${xml(data.percent)}</text>` : "",
    meterSvg(data.meter ?? { units: 0, done: 0, failed: 0, active: 0 }, { x: PAD, y: METER.y, w: inner, h: METER.h }),
    `<line class="ln" x1="${PAD}" x2="${W - PAD}" y1="${DIVIDER_Y}" y2="${DIVIDER_Y}" stroke-width="1"/>`,
    stats.body
  ];
  return { source: paneSvg(W, stats.height, body.join(`
`)), height: stats.height };
};

const BLANK = "ㅤ";
const CELL_PX = 11.9;
const BUTTON_PX$1 = 28;
const RUN_SPAN = 2;
const LINE_SPAN = "400%";
function PressCover(ui, o) {
  const { Box, Button } = ui;
  const lines = Math.max(1, Math.floor(o.height / (BUTTON_PX$1 * 2)));
  const label = BLANK.repeat(Math.ceil(o.width * RUN_SPAN / CELL_PX));
  const hotkey = o.hotkey === undefined ? {} : { hotkey: o.hotkey };
  return h(Box, {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "column",
    justifyContent: "center",
    overflow: "hidden"
  }, Array.from({ length: lines }, (_, i) => h(Box, {
    key: `${o.key}~line${i}`,
    flexDirection: "row",
    width: LINE_SPAN,
    marginLeft: -1,
    flexShrink: 0
  }, h(Button, {
    key: i === 0 ? o.key : `${o.key}~${i}`,
    label,
    plain: true,
    ...i === 0 ? hotkey : {},
    onPress: o.onPress
  }))));
}
const STILL = "<style>*{animation:none!important;transition:none!important}</style>";
const stillSource = (source) => source.replace(/<\/svg>\s*$/, `${STILL}</svg>`);
function stillSvg(ui, drawing) {
  if (drawing.type !== "Svg")
    return drawing;
  const { Svg } = ui;
  const { key, source, alt, width, height } = drawing.props;
  return h(Svg, {
    key,
    source: stillSource(source),
    alt,
    width,
    height
  });
}
const FALLBACK_PX = 52;
const FALLBACK_WIDTH_PX = 360;
function PressRow(ui, o) {
  const { Box } = ui;
  const props = o.drawing.type === "Svg" ? o.drawing.props : {};
  const width = props.width ?? FALLBACK_WIDTH_PX;
  const height = props.height ?? FALLBACK_PX;
  return h(Box, {
    key: o.box,
    alignSelf: "flex-start"
  }, stillSvg(ui, o.drawing), PressCover(ui, { key: o.key, width, height, hotkey: o.hotkey, onPress: o.onPress }));
}

const SECOND$2 = 1000;
const MINUTE$1 = 60 * SECOND$2;
const HOUR = 60 * MINUTE$1;
const QUIET_MS = 2 * MINUTE$1;
const LONG_TOOL_MS = 15 * MINUTE$1;
const FAILURE_FRESH_MS = 10 * MINUTE$1;
const roughSpan = (ms) => {
  const s = t();
  if (ms < MINUTE$1)
    return s.seconds(Math.floor(ms / SECOND$2));
  if (ms < HOUR)
    return s.minutes(Math.floor(ms / MINUTE$1));
  return s.hours(Math.floor(ms / HOUR));
};
function stuckOf(a, at) {
  if (a.status !== "running" || a.isMain === true)
    return null;
  const open = (a.history ?? []).find((e) => e.endAt === undefined);
  if (open)
    return at - open.at >= LONG_TOOL_MS ? { reason: t().longTool(open.tool, roughSpan(at - open.at)), since: open.at } : null;
  if (a.stepAt !== undefined)
    return at - a.stepAt >= LONG_TOOL_MS ? { reason: t().quiet(roughSpan(at - a.stepAt)), since: a.stepAt } : null;
  const heard = Math.max(a.heardAt ?? 0, a.startedAt);
  return at - heard >= QUIET_MS ? { reason: t().quiet(roughSpan(at - heard)), since: heard } : null;
}
const attention = (a, reason, role) => ({
  agentId: a.id,
  name: lookOf(a).name,
  title: a.description || a.type,
  reason,
  role
});
const isFreshFailure = (a, at) => a.status === "failed" && a.endReason !== "aborted" && a.endedAt !== undefined && at - a.endedAt < FAILURE_FRESH_MS;
function attentionOf(list, at) {
  const stuck = list.map((a) => ({ a, why: stuckOf(a, at) })).filter((x) => x.why !== null).sort((x, y) => x.why.since - y.why.since)[0];
  if (stuck)
    return attention(stuck.a, stuck.why.reason, "warn");
  const failed = list.filter((a) => isFreshFailure(a, at)).sort((x, y) => (y.endedAt ?? 0) - (x.endedAt ?? 0))[0];
  return failed ? attention(failed, t().failedNow, "danger") : null;
}

const COMPACT_H = 32;
const CRAB_PITCH = 36;
const MORE_ROOM = 40;
const LIVE_DOT = { x: 32, y: 4, r: 3 };
const CRAB = { w: 36, h: 32 };
const PULSE = 12;
const PULSE_CORE = 3;
const stepsOf = (a) => {
  if (a.stepTotal)
    return `${a.stepDone ?? 0}/${a.stepTotal}${a.stepNote ? " · " + a.stepNote : ""}`;
  const own = countTasks(a.todos ?? []);
  if (!own.total)
    return "";
  const active = (a.todos ?? []).find((task) => task.status === "in_progress");
  return `${own.done}/${own.total}${active && a.status === "running" ? " · " + active.title : ""}`;
};
const activityOf = (a) => {
  const s = t();
  const steps = stepsOf(a);
  if (a.status === "failed")
    return [steps, a.endReason === "aborted" ? s.aborted : s.failed].filter(Boolean).join(" · ");
  if (a.status === "done")
    return steps || s.completed;
  const tool = a.lastTool ? `› ${a.lastPlain ?? `${a.lastTool}${a.lastTarget ? " " + a.lastTarget : ""}`}` : s.starting;
  return steps ? `${steps}  ${tool}` : tool;
};
const UNNAMED = ["", "inherit"];
const modelLine = (a) => {
  const round = a.round > 1 ? `${t().round} ${a.round}` : "";
  const model = UNNAMED.includes(a.model) ? "" : modelName(a.model);
  return [model, effortWord(a.effort), round].filter(Boolean).join(" · ");
};
const clockOf = (a, at) => {
  const time = fmtTime(elapsed(a, at));
  return a.status === "running" ? time : `${t().total} ${time}`;
};
const crabSvg = (opts) => paneSvg(CRAB.w, CRAB.h, crab$3(1, 0, opts));
const CARD_CRAB = { w: 30, h: 28, scale: 0.92 };
const cardCrabSvg = (opts) => paneSvg(CARD_CRAB.w, CARD_CRAB.h, crab$3(1, 0, { ...opts, scale: CARD_CRAB.scale }));
const HERO_CRAB = { w: 76, h: 88, scale: 2.3, crabH: 66, pillGap: 4 };
const GRID_MID = 15;
const heroCrabSvg = (home) => {
  const pillX = Math.max(0, Math.round(GRID_MID * HERO_CRAB.scale - levelWidth(home.level) / 2));
  const pill = levelPill(home.level, pillX, HERO_CRAB.crabH + HERO_CRAB.pillGap);
  return paneSvg(HERO_CRAB.w, HERO_CRAB.h, homeCrab(0, 2, { home, scale: HERO_CRAB.scale }) + pill);
};
const pulseSvg = () => {
  const c = PULSE / 2;
  return paneSvg(PULSE, PULSE, `<circle class="f-edit live" cx="${c}" cy="${c}" r="${PULSE_CORE}"/>`);
};
const plannedLine = (p) => {
  const tier = plannedTierOf(p.tier);
  const parts = [TIER_MODEL[tier] ?? ""];
  if (p.after.length)
    parts.push(t().after(p.after.join(", ")));
  return parts.filter(Boolean).join(" · ");
};
const compactSvg = (W, icons) => {
  const fit = Math.max(1, Math.floor((W - MORE_ROOM) / CRAB_PITCH));
  const shown = icons.slice(0, fit);
  const more = icons.length - shown.length;
  const body = shown.map((ic, i) => crab$3(i * CRAB_PITCH, 0, { costume: ic.costume, look: ic.look, isDim: ic.isDim, isWalking: ic.isRunning }) + (ic.isRunning ? `<circle class="f-edit live" cx="${i * CRAB_PITCH + LIVE_DOT.x}" cy="${LIVE_DOT.y}" r="${LIVE_DOT.r}"/>` : "")).join("");
  const plus = more ? `<text class="s" x="${shown.length * CRAB_PITCH + 4}" y="21" font-family="${FONT}" font-size="12">+${more}</text>` : "";
  return paneSvg(W, COMPACT_H, body + plus);
};

const crewView = (list) => deriveJob({ flow: null, agents: list, job: { agentIds: list.map((a) => a.id), startedAt: 0, isSealed: true, isHidden: false }, tasks: [] });
const homeOf = (crab, running) => ({
  mood: crab.mood,
  level: t().crab.level(levelOf(crab.turns)),
  isMoving: running.length === 0
});
const DRAWN_STEP_MS = 1e4;
const lastEventOf = (a) => Math.max(a.startedAt, a.endedAt ?? 0, ...(a.history ?? []).map((e) => Math.max(e.at, e.endAt ?? 0)));
const drawnClockOf = (list, at) => Math.max(Math.floor(at / DRAWN_STEP_MS) * DRAWN_STEP_MS, ...list.map(lastEventOf));
function paneDataOf(state) {
  const { list } = state;
  const at = Math.max(state.now, ...list.map((a) => a.startedAt), 0);
  const view = deriveJob({ flow: state.flow, agents: list, job: state.job, tasks: state.tasks }) ?? crewView(list);
  const ended = (a) => a.endedAt ?? a.startedAt;
  const live = list.filter(isRunning).reverse();
  const running = [...live.filter(isMain), ...live.filter((a) => !isMain(a))];
  return {
    list,
    running,
    finished: list.filter((a) => !isRunning(a)).sort((a, b) => ended(b) - ended(a)),
    planned: plannedOf(state.flow, list),
    sum: totals(list, at),
    view,
    at,
    drawnAt: drawnClockOf(list, at),
    panel: state.panel,
    limit: state.limit,
    attention: attentionOf(list, at),
    types: state.types,
    home: homeOf(state.crab, running),
    chats: state.chats
  };
}
const summaryOf = (sum) => `≈${fmtCost(sum.cost)} · ${fmtTokens(sum.tokens)} ${t().tokensWord} · ${fmtTime(sum.time)}`;
const toneOf = (d) => {
  if (d.running.length)
    return "run";
  if (!d.list.length)
    return "idle";
  return d.view && d.view.failed > 0 ? "warn" : "ok";
};
const countsOf$1 = (d) => {
  const s = t();
  const ended = d.list.length - d.running.length;
  return [d.running.length && s.liveCount(d.running.length), ended && s.endedCount(ended), d.planned.length && s.plannedCount(d.planned.length)].filter(Boolean).join(" · ");
};
function headerOf(d) {
  const s = t();
  const share = shareOf(d.sum.cost, d.limit);
  const view = d.view;
  return {
    eyebrow: s.pane,
    counts: countsOf$1(d),
    headline: view?.title || s.crew(d.list.length),
    percent: view ? percentText(view) : "—",
    tone: toneOf(d),
    meter: view,
    stats: [
      { label: s.cost, value: `≈${fmtCost(d.sum.cost)}` },
      { label: s.tokens, value: fmtTokens(d.sum.tokens) },
      { label: s.time, value: fmtTime(d.sum.time) },
      ...share === null ? [] : [{ label: s.limitTile, value: `≈${s.pct(shareNumber(share))}` }]
    ],
    home: d.home
  };
}
const drawnHeaderOf = (d) => headerOf({ ...d, sum: totals(d.list, d.drawnAt) });
const totalsLineOf = (data) => data.stats.map((stat) => `${stat.label} ${stat.value}`).join(" · ");

const LANES_MAX = 8;
const MIN_SPAN_MS = 30000;
const laneOf = (a, at) => {
  const isLive = a.status === "running";
  const end = isLive ? at : a.endedAt ?? a.startedAt;
  const look = lookOf(a);
  return {
    id: a.id,
    name: look.name,
    shell: look.shell,
    title: a.description || a.type,
    status: a.status,
    isStuck: stuckOf(a, at) !== null,
    start: a.startedAt,
    end: Math.max(end, a.startedAt),
    segments: (a.history ?? []).map((e) => ({ from: e.at, to: e.endAt ?? (isLive ? at : e.at), kind: kindOf(e.tool) }))
  };
};
function timelineOf(list, at) {
  const lanes = [...list].sort((a, b) => a.startedAt - b.startedAt).slice(-LANES_MAX).map((a) => laneOf(a, at));
  if (lanes.length === 0)
    return null;
  const t0 = Math.min(...lanes.map((lane) => lane.start));
  const t1 = Math.max(...lanes.map((lane) => lane.end));
  return { lanes, t0, t1, span: Math.max(MIN_SPAN_MS, t1 - t0), isLive: lanes.some((lane) => lane.status === "running") };
}
const cellOf = (lane, from, to) => {
  if (to <= lane.start || from > lane.end)
    return { kind: "none" };
  let best = null;
  let most = 0;
  for (const seg of lane.segments) {
    const overlap = Math.min(to, Math.max(seg.to, seg.from + 1)) - Math.max(from, seg.from);
    if (overlap > most)
      [best, most] = [seg.kind, overlap];
  }
  return { kind: best ?? "idle" };
};
const laneCells = (lane, tl, width) => {
  const slice = tl.span / Math.max(1, width);
  return Array.from({ length: width }, (_, i) => cellOf(lane, tl.t0 + i * slice, tl.t0 + (i + 1) * slice));
};
const runsOf = (cells) => {
  const runs = [];
  for (const cell of cells) {
    const last = runs.at(-1);
    if (last && last.kind === cell.kind)
      last.length += 1;
    else
      runs.push({ kind: cell.kind, length: 1 });
  }
  return runs;
};

const TOP = 6;
const LANE_H = 24;
const AXIS_H = 20;
const LABEL_W = 74;
const RIGHT_PAD = 10;
const NOW_ROOM = 44;
const SEG_H = 10;
const SEG_MIN = 3;
const TRACK_H$1 = 2;
const DOT_R = 4;
const CAP_R = 3.5;
const NAME_SIZE = 12;
const MICRO = 10.5;
const TICKS_MAX = 4;
const SECOND$1 = 1000;
const MINUTE = 60 * SECOND$1;
const STEPS_MS = [10 * SECOND$1, 30 * SECOND$1, MINUTE, 2 * MINUTE, 5 * MINUTE, 10 * MINUTE, 15 * MINUTE, 30 * MINUTE, 60 * MINUTE];
const CAP = { running: "f-edit", done: "m", failed: "f-danger" };
const ENDED_OPACITY = 0.6;
const xOf = (scale, ms) => scale.x0 + (ms - scale.t0) / scale.span * (scale.x1 - scale.x0);
const n1 = (v) => v.toFixed(1);
function laneSvg(lane, y, scale) {
  const cy = y + LANE_H / 2;
  const isLive = lane.status === "running";
  const start = xOf(scale, lane.start);
  const end = Math.max(start + SEG_MIN, xOf(scale, lane.end));
  const label = `<circle cx="${DOT_R + 1}" cy="${cy}" r="${DOT_R}" fill="${lane.shell}"/><text class="${isLive ? "t" : "s"}" x="${DOT_R * 2 + 8}" y="${cy + 4}" font-family="${FONT}" font-size="${NAME_SIZE}" font-weight="600">${xml(fitText(lane.name, NAME_SIZE, LABEL_W - DOT_R * 2 - 12))}</text>`;
  const track = `<rect class="k" x="${n1(start)}" y="${cy - TRACK_H$1 / 2}" width="${n1(end - start)}" height="${TRACK_H$1}" rx="1"/>`;
  const segs = lane.segments.map((seg) => {
    const x = xOf(scale, seg.from);
    const w = Math.max(SEG_MIN, xOf(scale, seg.to) - x);
    return `<rect class="s" x="${n1(x)}" y="${cy - SEG_H / 2}" width="${n1(w)}" height="${SEG_H}" rx="2.5"/>`;
  }).join("");
  const cap = `<circle class="${lane.isStuck ? "f-warn" : CAP[lane.status] ?? "f-edit"}" cx="${n1(end)}" cy="${cy}" r="${CAP_R}"/>`;
  const notch = lane.isStuck ? `<rect class="f-warn" x="${n1(end + CAP_R + 3)}" y="${cy - SEG_H / 2 - 2}" width="3" height="${SEG_H + 4}" rx="1.5"/>` : "";
  return `<g>${label}<g opacity="${isLive ? 1 : ENDED_OPACITY}">${track}${segs}</g>${cap}${notch}</g>`;
}
function axisSvg(scale, top, nowX) {
  const step = STEPS_MS.find((ms) => scale.span / ms <= TICKS_MAX) ?? STEPS_MS.at(-1) ?? MINUTE;
  const ticks = [];
  for (let ms = 0;ms <= scale.span; ms += step) {
    const x = xOf(scale, scale.t0 + ms);
    if (nowX !== null && Math.abs(x - nowX) < NOW_ROOM && ms > 0)
      continue;
    const anchor = ms === 0 ? "start" : "middle";
    ticks.push(`<rect class="k" x="${n1(x)}" y="${top}" width="1" height="4"/><text class="m" x="${n1(x)}" y="${top + 16}" text-anchor="${anchor}" font-family="${MONO}" font-size="${MICRO}">${fmtTime(ms)}</text>`);
  }
  return `<rect class="k" x="${scale.x0}" y="${top}" width="${n1(scale.x1 - scale.x0)}" height="1"/>${ticks.join("")}`;
}
const nowSvg$1 = (scale, at, rows) => {
  const x = xOf(scale, at);
  const anchor = x > scale.x1 - NOW_ROOM / 2 ? "end" : "middle";
  return `<rect class="s" x="${n1(x)}" y="${rows.top - 4}" width="1" height="${rows.bottom - rows.top + 8}" opacity=".55"/>` + `<text class="s" x="${n1(anchor === "end" ? scale.x1 : x)}" y="${rows.bottom + 18}" text-anchor="${anchor}" font-family="${FONT}" font-size="${MICRO}" font-weight="600">${xml(t().now)}</text>`;
};
const altOf = (tl) => {
  const s = t();
  const words = { running: s.isRunning, done: s.isFinished, failed: s.failed };
  return `${s.timeline}: ${tl.lanes.map((lane) => `${lane.name} ${fmtTime(lane.end - lane.start)} ${words[lane.status] ?? ""}`.trim()).join(", ")}`;
};
function timelineSvg(W, tl) {
  const scale = { x0: LABEL_W, x1: W - RIGHT_PAD, t0: tl.t0, span: tl.span };
  const bottom = TOP + tl.lanes.length * LANE_H;
  const height = bottom + AXIS_H + 4;
  const lanes = tl.lanes.map((lane, i) => laneSvg(lane, TOP + i * LANE_H, scale)).join("");
  const nowX = tl.isLive ? xOf(scale, tl.t1) : null;
  const body = lanes + axisSvg(scale, bottom + 2, nowX) + (tl.isLive ? nowSvg$1(scale, tl.t1, { top: TOP, bottom }) : "");
  return { source: paneSvg(W, height, body), height, alt: altOf(tl) };
}

const BUTTON_PX = 76;
const TERM_NAME = 6;
const TERM_CLOCK = 2;
const TIMELINE_MIN_AGENTS = 2;
const homeAlt = (home) => `${HOME_LOOK.name}, ${t().crab.moods[home.mood]}, ${home.level}`;
function deskHead$1(ui, d, layout) {
  const data = drawnHeaderOf(d);
  const { stats, ...shows } = data;
  const head = headerSvg(layout.W, data);
  const alt = [data.headline, data.percent, data.counts, totalsLineOf(data), homeAlt(d.home)].filter(Boolean).join(", ");
  return picture(ui, { key: "head", at: "head", pic: { source: head.source, alt, width: layout.W, height: head.height }, opts: { shows: { ...shows, labels: stats.map((stat) => stat.label) } } });
}
function headTree(ui, d, layout) {
  const { Box, Text } = ui;
  if (layout.isDesktop)
    return deskHead$1(ui, d, layout);
  const data = headerOf(d);
  const line = totalsLineOf(data);
  return h(Box, {
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    dimColor: true
  }, `${FACES[d.home.mood]} `), h(Text, {
    bold: true
  }, data.headline), h(Text, {
    bold: true,
    dimColor: data.tone === "idle"
  }, `  ${data.percent}`)), h(Text, {
    dimColor: true
  }, [d.home.level, data.counts].filter(Boolean).join(" · ")), h(Text, {
    dimColor: true
  }, line));
}
function toolbarTree(ui, d, on) {
  const { Box, Button } = ui;
  const s = t();
  const isDrafting = d.panel.draft?.isOpen === true;
  return h(Box, {
    key: "toolbar",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  }, h(Button, {
    key: "new-task",
    variant: isDrafting ? undefined : "secondary",
    label: `＋ ${s.newTask}`,
    onPress: on.onNewTask
  }), h(Button, {
    key: "compact",
    label: d.panel.isCompact ? s.expand : s.collapse,
    plain: true,
    dimColor: true,
    onPress: on.onCompact
  }));
}
function attentionTree(ui, view) {
  const { Box, Button, Text } = ui;
  const { layout, on } = view;
  const att = view.d.attention;
  if (!att)
    return null;
  const onPress = () => on.onLook(att.agentId);
  if (!layout.isDesktop) {
    return h(Box, {
      key: "attention",
      flexDirection: "row",
      columnGap: 1
    }, h(Text, {
      color: att.role === "warn" ? "warning" : "error",
      wrap: "truncate-end"
    }, `! ${att.name} ${att.reason}`, h(Text, {
      dimColor: true
    }, ` · ${att.title}`)), h(Button, {
      key: "look",
      plain: true,
      label: t().look,
      onPress
    }));
  }
  const pic = { source: noticeSvg(layout.W, att), alt: `${att.name} ${att.reason}: ${att.title} (${t().look})`, width: layout.W, height: NOTICE_H };
  const drawing = picture(ui, { key: "notice", at: "attention", pic, opts: { isRow: true } });
  return PressRow(ui, { box: "attention", key: "look", drawing, onPress });
}
function sectionHead(ui, layout, head) {
  const { Box, Button, Text } = ui;
  const s = t();
  const toggle = head.toggle;
  if (!layout.isDesktop) {
    if (!toggle)
      return h(Text, {
        key: `h-${head.label}`,
        bold: true
      }, head.label);
    return h(Box, {
      key: `h-${toggle.key}`,
      flexDirection: "row"
    }, h(Button, {
      key: toggle.key,
      plain: true,
      label: `${toggle.isOpen ? "▾" : "▸"} ${head.label}`,
      onPress: toggle.onPress
    }));
  }
  const width = toggle ? layout.W - BUTTON_PX : layout.W;
  const svg = picture(ui, { key: "eyebrow", at: `eyebrow-${head.id}`, pic: { source: sectionSvg(width, head), alt: head.label, width, height: SECTION_SVG_H } });
  if (!toggle)
    return h(Box, {
      key: `h-${head.label}`,
      flexDirection: "row"
    }, svg);
  return h(Box, {
    key: `h-${toggle.key}`,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, svg, h(Button, {
    key: toggle.key,
    plain: true,
    dimColor: true,
    label: toggle.isOpen ? s.hide : s.show,
    onPress: toggle.onPress
  }));
}
const RUN_GLYPH = { none: " ", idle: "─" };
function termLane(ui, runs, label) {
  const { Text } = ui;
  return h(Text, {
    key: `lane-${label.name}`,
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, label.name.padEnd(TERM_NAME)), runs.map((run, i) => h(Text, {
    key: `r${i}`,
    dimColor: run.kind === "idle"
  }, (RUN_GLYPH[run.kind] ?? "━").repeat(run.length))), h(Text, {
    color: label.key
  }, ` ${label.end}`));
}
const END_GLYPH = { running: "●", done: "✓", failed: "✗", stuck: "!" };
const END_KEY = { running: "claude", done: "subtle", failed: "error", stuck: "warning" };
function termTimeline(ui, tl, layout) {
  const { Box } = ui;
  const width = Math.max(TERM_NAME, layout.cols - TERM_NAME - TERM_CLOCK - 1);
  return h(Box, {
    key: "timeline",
    flexDirection: "column"
  }, tl.lanes.map((lane) => {
    const end = lane.isStuck ? "stuck" : lane.status;
    return termLane(ui, runsOf(laneCells(lane, tl, width)), { name: lane.name, end: END_GLYPH[end] ?? "●", key: END_KEY[end] ?? "subtle" });
  }));
}
function deskTimeline(ui, tl, layout) {
  const drawing = timelineSvg(layout.W, tl);
  const shows = { lanes: tl.lanes.map((lane) => [lane.id, lane.status, lane.isStuck]), isLive: tl.isLive };
  return picture(ui, { key: "timeline", at: "timeline", pic: { ...drawing, width: layout.W }, opts: { shows } });
}
function timelineTree(ui, view) {
  const { Box } = ui;
  const { d, layout, on } = view;
  const tl = d.list.length >= TIMELINE_MIN_AGENTS ? timelineOf(d.list, layout.isDesktop ? d.drawnAt : d.at) : null;
  if (!tl)
    return null;
  const isOpen = d.panel.isTimelineHidden !== true;
  const head = sectionHead(ui, layout, { id: "timeline", label: t().timeline, toggle: { key: "timeline", isOpen, onPress: on.onTimeline } });
  return h(Box, {
    key: "timeline-section",
    flexDirection: "column",
    rowGap: layout.isDesktop ? 1 : 0
  }, head, isOpen && layout.isDesktop && deskTimeline(ui, tl, layout), isOpen && !layout.isDesktop && termTimeline(ui, tl, layout));
}
const glyphKeyOf = (a) => {
  if (a.status === "failed")
    return "error";
  return a.status === "done" ? "subtle" : "claude";
};
const iconsOf = (d) => [
  ...[...d.running, ...d.finished].map((a) => ({ costume: costumeOf(a), look: lookOf(a), isRunning: a.status === "running" && !stuckOf(a, d.at), isDim: false })),
  ...d.planned.map((p, i) => ({ costume: plannedTierOf(p.tier), look: lookAt(i), isRunning: false, isDim: true }))
];
function compactTree(ui, d, layout) {
  const { Text } = ui;
  if (layout.isDesktop) {
    return picture(ui, { key: "compact-icons", at: "compact", pic: { source: compactSvg(layout.W, iconsOf(d)), alt: `${d.list.length} ${t().agentsCount}, ${summaryOf(d.sum)}`, width: layout.W, height: COMPACT_H } });
  }
  const glyphs = [...d.running, ...d.finished].map((a) => h(Text, {
    key: a.id,
    color: glyphKeyOf(a)
  }, `${a.status === "done" ? "✓" : "●"} `));
  return h(Text, {
    wrap: "truncate-end"
  }, glyphs, d.planned.length ? h(Text, {
    dimColor: true
  }, "○ ".repeat(d.planned.length)) : null);
}
function emptyTree(ui, view) {
  const { Box, Button, Text } = ui;
  const { layout, on } = view;
  const home = view.d.home;
  const s = t();
  const crab = layout.isDesktop && picture(ui, { key: "crab", at: "hero-crab", pic: { source: heroCrabSvg(home), alt: homeAlt(home), width: HERO_CRAB.w, height: HERO_CRAB.h } });
  return h(Box, {
    key: "empty",
    flexDirection: "row",
    columnGap: 2,
    alignItems: "center"
  }, crab, h(Box, {
    flexDirection: "column",
    rowGap: 1,
    flexShrink: 1
  }, !layout.isDesktop && h(Text, {
    dimColor: true
  }, `${FACES[home.mood]} · ${home.level}`), h(Text, {
    bold: true
  }, crewedOf(view.d.chats).length > 0 ? s.chats.emptyHere : s.emptyTitle), h(Text, {
    dimColor: true
  }, s.empty), h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: "new-task",
    variant: "primary",
    label: `＋ ${s.newTask}`,
    onPress: on.onNewTask
  }))));
}

const MAX_WAITING_ROWS = 3;
const MINUTES_PER_HOUR = 60;
const spanOf = (minutes) => {
  const s = t();
  if (minutes >= MINUTES_PER_HOUR)
    return s.hours(Math.floor(minutes / MINUTES_PER_HOUR));
  return minutes >= 1 ? s.minutes(minutes) : "";
};
const rowOf = (chat) => ({
  project: chat.project,
  title: chat.title || t().chats.untitled,
  wait: t().chats.waiting(spanOf(chat.minutes))
});
function waitingTree(ui, chats, layout) {
  const { Box, Text } = ui;
  const s = t().chats;
  const waiting = waitingOf(chats);
  if (!waiting.length)
    return null;
  const rows = waiting.slice(0, MAX_WAITING_ROWS).map(rowOf);
  const rest = waiting.length - rows.length;
  const more = rest > 0 ? s.more(rest) : "";
  if (layout.isDesktop) {
    const card = chatsCardSvg(layout.W, { title: s.waitingTitle, rows, more });
    return picture(ui, { key: "chats-waiting", at: "chats-waiting", pic: { ...card, width: layout.W } });
  }
  return h(Box, {
    key: "chats-waiting",
    flexDirection: "column"
  }, h(Text, {
    bold: true,
    dimColor: true
  }, s.waitingTitle), rows.map((row, i) => h(Text, {
    key: `wait-${i}`,
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, row.project), h(Text, {
    dimColor: true
  }, ` · ${row.title}  `), h(Text, {
    color: "warning"
  }, row.wait))), more !== "" && h(Text, {
    dimColor: true
  }, more));
}
const linesPicture = (ui, at, lines, W) => {
  const drawn = chatLinesSvg(W, lines);
  return picture(ui, { key: at, at, pic: { source: drawn.source, alt: drawn.alt, width: W, height: drawn.height } });
};
const chatLine = (chat) => ({
  kind: "chat",
  lead: chat.project,
  text: chat.title || t().chats.untitled,
  end: chat.state === "working" ? spanOf(chat.minutes) : t().chats.states.idle,
  isLive: chat.state === "working"
});
const agentChatLine = (agent) => ({
  kind: "agent",
  lead: agent.name,
  text: agent.title,
  end: [spanOf(agent.minutes), agent.costUsd > 0 ? `≈${fmtCost(agent.costUsd)}` : ""].filter(Boolean).join(" · "),
  isLive: true
});
const agentLine = (agent) => [agent.name, agent.title, spanOf(agent.minutes), agent.costUsd > 0 ? `≈${fmtCost(agent.costUsd)}` : ""].filter(Boolean).join(" · ");
function crewTree(ui, chats, layout) {
  const { Box, Text } = ui;
  const s = t().chats;
  const crewed = crewedOf(chats);
  if (!crewed.length)
    return null;
  const count = crewed.reduce((sum, chat) => sum + (chat.agents?.length ?? 0), 0);
  return h(Box, {
    key: "chats-crew",
    flexDirection: "column",
    rowGap: 0
  }, sectionHead(ui, layout, { id: "chats-crew", label: `${s.agentsTitle} · ${count}` }), layout.isDesktop && linesPicture(ui, "chats-crew-lines", crewed.flatMap((chat) => [chatLine(chat), ...(chat.agents ?? []).map(agentChatLine)]), layout.W), !layout.isDesktop && crewed.map((chat) => h(Box, {
    key: `crew-${chat.id}`,
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, chat.project), h(Text, {
    dimColor: true
  }, ` · ${chat.title || s.untitled}`)), chat.agents?.map((agent) => h(Text, {
    key: `crew-${chat.id}-${agent.id}`,
    dimColor: true,
    wrap: "truncate-end"
  }, `  ${agentLine(agent)}`)))));
}
function quietTree(ui, view) {
  const { Box, Text } = ui;
  const s = t().chats;
  const quiet = quietOf(view.chats).filter((chat) => !chat.agents?.length);
  if (!quiet.length)
    return null;
  const shown = view.isOpen ? quiet : quiet.filter((chat) => chat.state === "working");
  const head = sectionHead(ui, view.layout, { id: "chats", label: `${s.title} · ${quiet.length}`, toggle: { key: "chats", isOpen: view.isOpen, onPress: view.onToggle } });
  return h(Box, {
    key: "chats-quiet",
    flexDirection: "column",
    rowGap: 0
  }, head, view.layout.isDesktop && shown.length > 0 && linesPicture(ui, "chats-quiet-lines", shown.map(chatLine), view.layout.W), !view.layout.isDesktop && shown.map((chat) => h(Text, {
    key: `chat-${chat.id}`,
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, chat.project), h(Text, {
    dimColor: true
  }, ` · ${chat.title || s.untitled} · ${s.states[chat.state === "working" ? "working" : "idle"]}`))));
}

const HOME_LABEL = "← modz";
function HomeButton(ui, onPress) {
  const { Box, Button } = ui;
  return h(Box, {
    key: "modz-home-row",
    flexDirection: "row",
    marginLeft: -1
  }, h(Button, {
    key: "modz-home",
    label: HOME_LABEL,
    plain: true,
    dimColor: true,
    onPress
  }));
}

const BRIEF_SHOWN = 280;
const ANSWER_SHOWN = 900;
function saidTree(ui, said) {
  const { Box, Text } = ui;
  return h(Box, {
    key: said.key,
    flexDirection: "column"
  }, h(Text, {
    bold: true
  }, said.who), h(Box, {
    flexDirection: "column",
    borderStyle: "round",
    borderDimColor: true,
    paddingX: 1
  }, h(Text, null, said.text)));
}
function briefTree(ui, a, ctx) {
  const { Box, Button } = ui;
  if (!a.brief)
    return null;
  const s = t();
  const isLong = a.brief.length > BRIEF_SHOWN;
  const isWhole = !isLong || ctx.briefOpen === a.id;
  const text = isWhole ? a.brief : clip$2(a.brief, BRIEF_SHOWN);
  return h(Box, {
    key: `brief-box-${a.id}`,
    flexDirection: "column"
  }, saidTree(ui, { key: "asked", who: a.isAsked ? s.you : s.brief, text }), isLong && h(Box, {
    flexDirection: "row",
    justifyContent: "flex-end"
  }, h(Button, {
    key: `brief-${a.id}`,
    plain: true,
    dimColor: true,
    label: isWhole ? s.showLess : s.showAll,
    onPress: () => ctx.onBrief(a.id)
  })));
}
const turnsOf = (a) => a.thread ?? (a.answer && a.status === "done" ? [{ from: "agent", text: a.answer, at: a.endedAt ?? a.startedAt }] : []);
const turnTree = (ui, a, turn, i) => turn.from === "you" ? saidTree(ui, { key: `turn-${i}`, who: t().you, text: turn.text }) : saidTree(ui, { key: `turn-${i}`, who: lookOf(a).name, text: clip$2(turn.text, ANSWER_SHOWN) });
const isAwaited = (a, turns) => a.status === "running" || a.status === "done" && turns.at(-1)?.from === "you";
function tailTree(ui, a, turns) {
  const { Text } = ui;
  const s = t();
  if (isAwaited(a, turns))
    return h(Text, {
      color: "claude"
    }, `● ${s.answering(lookOf(a).name)}`);
  if (a.status !== "failed")
    return null;
  return h(Text, {
    color: "error"
  }, `${s.cheerFailed} · ${a.endReason === "aborted" ? s.aborted : s.failedNow}`);
}
function conversationTree(ui, a, ctx) {
  const { Box } = ui;
  const turns = turnsOf(a);
  return h(Box, {
    key: `talk-${a.id}`,
    flexDirection: "column",
    rowGap: 1
  }, briefTree(ui, a, ctx), turns.map((turn, i) => turnTree(ui, a, turn, i)), tailTree(ui, a, turns));
}

const ICON = {
  read: '<circle cx="7" cy="7" r="4.5"/><path d="M10.4 10.4L14 14"/>',
  edit: '<path d="M3 13l.8-3.2L10.6 3l2.4 2.4-6.8 6.8z"/><path d="M9.2 4.4l2.4 2.4"/>',
  run: '<path d="M3 4.5L6.5 8 3 11.5"/><path d="M8.5 12h5"/>',
  agent: '<path d="M8 2.5L13.5 8 8 13.5 2.5 8z"/>',
  other: '<circle cx="8" cy="8" r="5"/>',
  thinking: '<circle cx="3.5" cy="8" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="12.5" cy="8" r=".9"/>',
  done: '<path d="M3 8.5l3.2 3.2L13 4.8"/>',
  failed: '<path d="M4 4l8 8M12 4l-8 8"/>'
};
const ICON_SIZE = 16;
const STROKE = 1.5;
const iconAt = (icon, opts) => `<g class="${opts.cls}" transform="translate(${opts.x} ${opts.y}) scale(${opts.scale ?? 1})" fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">${ICON[icon]}</g>`;
const NOW = { h: 42, textX: 26, iconY: 3, label: 12, labelY: 15, lineY: 34, line2: 13.5, mono: 12.5 };
const BOLD = 1.06;
const MID_BASELINE = 0.36;
const lookOfNow = (now) => {
  if (now.state === "done")
    return { ink: "m", icon: "done" };
  if (now.state === "failed")
    return { ink: "f-danger", icon: "failed" };
  if (now.state === "call")
    return { ink: "f-edit", icon: now.kind };
  return { ink: "f-edit", icon: "thinking" };
};
const capital$1 = (s) => upper(s.charAt(0)) + s.slice(1);
const callLine = (now, x, room) => {
  const tool = now.tool ? `${fitText(now.tool, NOW.line2 * BOLD, room)} ` : "";
  const used = textWidth(tool, NOW.line2) * BOLD;
  const shown = fitMono(now.target, { size: NOW.mono, maxW: Math.max(0, room - used), isFromStart: now.isPath });
  return `<text x="${x}" y="${NOW.lineY}" font-family="${FONT}" font-size="${NOW.line2}" font-weight="620"><tspan class="t">${xml(tool)}</tspan><tspan class="s" font-family="${MONO}" font-size="${NOW.mono}" font-weight="450">${xml(shown)}</tspan></text>`;
};
const nowSvg = (W, now) => {
  const look = lookOfNow(now);
  const x = NOW.textX;
  const verb = fitText(capital$1(now.verb), NOW.label * BOLD, W - x);
  const body = [
    iconAt(look.icon, { x: 0, y: NOW.iconY, cls: "i-s" }),
    `<text class="${look.ink}" x="${x}" y="${NOW.labelY}" font-family="${FONT}" font-size="${NOW.label}" font-weight="600">${xml(verb)}</text>`,
    now.tool ? callLine(now, x, W - x) : ""
  ];
  return paneSvg(W, NOW.h, body.join(""));
};
const NOW_H = NOW.h;
const ROW = { h: 26, badgeW: 34, badgeH: 17, badgeRx: 4, badge: 9, gap: 10, path: 12.5, count: 11.5, icon: 0.72, iconGap: 3, countGap: 10 };
const BADGE_MAX = 4;
const badgeOf = (path, y) => {
  const ext = extOf(path).slice(0, BADGE_MAX);
  const mid = y + ROW.h / 2;
  return `<rect class="k" x="0" y="${mid - ROW.badgeH / 2}" width="${ROW.badgeW}" height="${ROW.badgeH}" rx="${ROW.badgeRx}"/>` + `<text class="m" x="${ROW.badgeW / 2}" y="${mid + ROW.badge * MID_BASELINE}" text-anchor="middle" font-family="${MONO}" font-size="${ROW.badge}" font-weight="600">${xml(ext || "·")}</text>`;
};
const countsOf = (f) => [{ n: f.edits, icon: "edit", ink: "s" }, { n: f.reads, icon: "read", ink: "m" }].filter((c) => c.n > 0);
const countW = (c) => ICON_SIZE * ROW.icon + ROW.iconGap + monoWidth(String(c.n), ROW.count);
const countsSvg = (counts, opts) => {
  let x = opts.right;
  const mid = opts.y + ROW.h / 2;
  const parts = [...counts].reverse().map((c) => {
    x -= countW(c);
    const part = iconAt(c.icon, { x, y: mid - ICON_SIZE * ROW.icon / 2, cls: `i-${c.ink}`, scale: ROW.icon }) + `<text class="${c.ink}" x="${x + ICON_SIZE * ROW.icon + ROW.iconGap}" y="${mid + ROW.count * MID_BASELINE}" font-family="${MONO}" font-size="${ROW.count}" font-weight="600">${c.n}</text>`;
    x -= ROW.countGap;
    return part;
  });
  return { body: parts.join(""), width: opts.right - x };
};
const pathSvg = (path, opts) => {
  const short = shortPath(path);
  const cut = short.lastIndexOf("/") + 1;
  const name = fitText(short.slice(cut), ROW.path * BOLD, opts.room);
  const dir = fitStart(short.slice(0, cut), ROW.path, opts.room - textWidth(name, ROW.path) * BOLD);
  const y = opts.y + ROW.h / 2 + ROW.path * MID_BASELINE;
  return `<text x="${ROW.badgeW + ROW.gap}" y="${y}" font-family="${FONT}" font-size="${ROW.path}"><tspan class="m">${xml(dir)}</tspan><tspan class="t" font-weight="560">${xml(name)}</tspan></text>`;
};
const filesSvg = (W, files) => {
  const rows = files.map((f, i) => {
    const y = i * ROW.h;
    const counts = countsSvg(countsOf(f), { right: W, y });
    const room = W - ROW.badgeW - ROW.gap - counts.width - ROW.gap;
    return badgeOf(f.path, y) + pathSvg(f.path, { y, room }) + counts.body;
  });
  const height = Math.max(ROW.h, files.length * ROW.h);
  return { source: paneSvg(W, height, rows.join("")), height };
};

const pad = (n) => String(n).padStart(2, "0");
const timeOf = (at) => {
  const date = new Date(at);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const nameOf = (path) => path.split("/").filter(Boolean).at(-1) ?? path;
const hrefOf = (path) => `file://${encodeURI(path)}`;
const linkOf = (path) => `[${nameOf(path).replace(/([\\`*_[\]<>])/g, "\\$1")}](<${hrefOf(path)}>)`;
const filesMarkdown = (paths) => paths.filter((path) => path.startsWith("/")).map(linkOf).join(" · ");
function fileLink(ui, e, key) {
  const { Markdown } = ui;
  if (!e.path || !Markdown)
    return null;
  return h(Markdown, {
    key,
    text: linkOf(e.path)
  });
}
const endOf = (e, isLive) => {
  if (e.endAt !== undefined)
    return e.isError ? `✗ ${t().failedNow}` : "✓";
  return isLive ? "…" : "—";
};
function stepTree(ui, e, ctx) {
  const { Box, Text } = ui;
  const said = e.why ?? e.plain ?? e.tool;
  const because = e.because && e.because !== ctx.prev?.because ? e.because : undefined;
  const isFailed = e.endAt !== undefined && e.isError === true;
  return h(Box, {
    key: `log-${ctx.index}`,
    flexDirection: "column"
  }, because ? h(Text, {
    wrap: "wrap"
  }, h(Text, {
    bold: true
  }, `${t().because}: `), h(Text, null, because)) : null, h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Box, {
    flexShrink: 0
  }, h(Text, {
    dimColor: true
  }, timeOf(e.at))), h(Box, {
    flexShrink: 0
  }, h(Text, {
    dimColor: true
  }, KIND_GLYPH[kindOf(e.tool)])), h(Box, {
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1
  }, h(Text, {
    wrap: "wrap"
  }, said), h(Text, {
    dimColor: true,
    wrap: "wrap"
  }, [e.why && e.plain ? e.plain : "", `${e.tool}${e.path ? "" : ` ${e.target}`}`.trim()].filter(Boolean).join(" · ")), fileLink(ui, e, `log-file-${ctx.index}`)), h(Box, {
    flexShrink: 0
  }, h(Text, {
    color: isFailed ? "error" : "subtle"
  }, endOf(e, ctx.isLive)))));
}
function logTree(ui, a) {
  const { Box } = ui;
  const list = a.history ?? [];
  const isLive = a.status === "running";
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, list.map((e, index) => stepTree(ui, e, { isLive, index, prev: list[index - 1] })));
}
function logButton(ui, a, ctx) {
  const { Box, Button } = ui;
  const s = t();
  const label = ctx.logOpen === a.id ? s.logClose : s.logOpen(a.history?.length ?? 0);
  return h(Box, {
    flexDirection: "row"
  }, h(Button, {
    key: `log-${a.id}`,
    variant: "secondary",
    label,
    onPress: () => ctx.onLog(a.id)
  }));
}

const BAR_H = 18;
const CHIPS_H = 22;
const MIX_H = 8;
const TRACK_H = 8;
const PCT_GAP = 8;
const PCT_W = 46;
const PCT_SIZE = 12.5;
const STRIPE = 8;
const CHIP_GAP = 6;
const CHIP_PAD = 9;
const CHIP_TEXT = 11.5;
const RING_R = 5.5;
const RING_W = 2.2;
const RING_SLOT = 17;
const MIX_GAP = 2;
const stripesOf = (filled, y, uid) => `<defs><pattern id="st${uid}" width="${STRIPE}" height="${STRIPE}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${STRIPE / 2}" height="${STRIPE}" fill="#fff" opacity=".28"/></pattern></defs><rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" fill="url(#st${uid})"/>`;
const FILL = { running: "f-edit", done: "m", failed: "f-danger" };
const LABEL = { running: "s", done: "m", failed: "f-danger" };
const progressBarSvg = (W, a, opts) => {
  const y = (BAR_H - TRACK_H) / 2;
  const barW = Math.max(TRACK_H, W - PCT_W - PCT_GAP);
  const filled = Math.max(TRACK_H, Math.round(barW * opts.progress.value));
  const uid = a.id.replace(/\W/g, "");
  const track = `<rect class="k" x="0" y="${y}" width="${barW}" height="${TRACK_H}" rx="${TRACK_H / 2}"/>`;
  const clip = `<clipPath id="cl${uid}"><rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" rx="${TRACK_H / 2}"/></clipPath>`;
  const bar = `<rect data-m-fill="" class="${FILL[a.status] ?? "f-edit"}" x="0" y="${y}" width="${filled}" height="${TRACK_H}"/>`;
  const isRunning = a.status === "running";
  const stripes = isRunning && opts.progress.isEstimate ? stripesOf(filled, y, uid) : "";
  const label = `<text class="${LABEL[a.status] ?? "s"}" x="${barW + PCT_GAP}" y="${BAR_H / 2 + PCT_SIZE * 0.34}" font-family="${MONO}" font-size="${PCT_SIZE}" font-weight="650">${xml(opts.label)}</text>`;
  return paneSvg(W, BAR_H, `${track}<defs>${clip}</defs><g clip-path="url(#cl${uid})">${bar}${stripes}</g>${label}`);
};
const ringOf = (x, ring) => {
  const c = 2 * Math.PI * RING_R;
  const dash = Math.max(0.6, Math.min(1, ring.ratio) * c);
  const cx = x + CHIP_PAD + RING_R - 1;
  const cy = CHIPS_H / 2;
  return `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" class="rk" stroke-width="${RING_W}"/>` + `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" class="i-s" stroke-width="${RING_W}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
};
const chipWidth = (chip) => Math.ceil(textWidth(chip.text, CHIP_TEXT)) + CHIP_PAD * 2 + (chip.ring ? RING_SLOT : 0);
const chipsSvg = (W, chips) => {
  let x = 0;
  let y = 0;
  const parts = [];
  for (const chip of chips) {
    const w = Math.min(W, chipWidth(chip));
    if (x > 0 && x + w > W) {
      x = 0;
      y += CHIPS_H + CHIP_GAP;
    }
    const tx = x + CHIP_PAD + (chip.ring ? RING_SLOT : 0);
    parts.push(`<rect class="chip" x="${x}" y="${y}" width="${w}" height="${CHIPS_H}" rx="${CHIPS_H / 2}"/>`);
    if (chip.ring)
      parts.push(`<g transform="translate(0,${y})">${ringOf(x, chip.ring)}</g>`);
    parts.push(`<text class="s" x="${tx}" y="${y + CHIPS_H / 2 + 4}" font-family="${FONT}" font-size="${CHIP_TEXT}" font-weight="500" font-variant-numeric="tabular-nums">${xml(chip.text)}</text>`);
    x += w + CHIP_GAP;
  }
  const height = y + CHIPS_H;
  return { source: paneSvg(W, height, parts.join("")), height };
};
const mixSvg = (W, parts) => {
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  if (!total)
    return paneSvg(W, MIX_H, `<rect class="k" width="${W}" height="${MIX_H}" rx="${MIX_H / 2}"/>`);
  const room = W - MIX_GAP * (parts.length - 1);
  let x = 0;
  const segs = parts.map((p) => {
    const w = Math.max(MIX_H, room * p.count / total);
    const seg = `<rect class="m" x="${x.toFixed(1)}" width="${w.toFixed(1)}" height="${MIX_H}" rx="${MIX_H / 2}"/>`;
    x += w + MIX_GAP;
    return seg;
  });
  return paneSvg(W, MIX_H, segs.join(""));
};

const SECOND = 1000;
const PATH = /^[~.]?\//;
const agoOf = (ms) => ms < SECOND ? t().now : t().ago(roughSpan(ms));
const stateOf = (a, last) => {
  if (a.status !== "running")
    return a.status;
  if (!last)
    return "starting";
  return last.endAt === undefined ? "call" : "thinking";
};
const verbOf = (a, state, kind) => {
  const s = t();
  const last = a.history?.at(-1);
  if (state === "call")
    return last?.why ?? last?.plain ?? s.doing[kind];
  if (state === "thinking")
    return s.thinking;
  if (state === "starting")
    return s.starting;
  if (state === "done")
    return s.completed;
  return a.endReason === "aborted" ? s.aborted : s.failedNow;
};
function nowOf(a, at) {
  const last = a.history?.at(-1);
  const state = stateOf(a, last);
  const kind = last ? kindOf(last.tool) : "other";
  const isLatest = last !== undefined && last.tool === a.lastTool;
  const target = (isLatest ? a.lastDetail : undefined) ?? last?.target ?? "";
  const verb = verbOf(a, state, kind);
  if (!last)
    return { state, kind, verb, tool: "", target: "", isPath: false, span: "" };
  const span = state === "call" ? roughSpan(at - last.at) : agoOf(at - last.at);
  const said = state === "call" ? undefined : last.why ?? last.plain;
  if (said)
    return { state, kind, verb, tool: said, target: "", isPath: false, span };
  return { state, kind, verb, tool: last.tool, target, isPath: PATH.test(target), span };
}

const RECENT_SHOWN = 8;
const FILES_SHOWN = 6;
const KIND_ORDER = ["read", "edit", "run", "agent", "other"];
const NOW_KEY = { call: "claude", thinking: "claude", starting: "claude", done: "subtle", failed: "error" };
const capital = (s) => upper(s.charAt(0)) + s.slice(1);
function nowText(ui, now) {
  const { Box, Text } = ui;
  const key = NOW_KEY[now.state];
  const glyph = now.state === "call" ? KIND_GLYPH[now.kind] : "●";
  return h(Box, {
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    color: key
  }, `${glyph} `), h(Text, {
    bold: true,
    color: key
  }, capital(now.verb)), now.span ? h(Text, {
    dimColor: true
  }, ` · ${now.span}`) : null), now.tool ? h(Box, {
    flexDirection: "row",
    columnGap: 1,
    paddingLeft: 2
  }, h(Text, {
    bold: true
  }, now.tool), h(Box, {
    flexShrink: 1
  }, h(Text, {
    dimColor: true,
    wrap: now.isPath ? "truncate-start" : "truncate-end"
  }, now.target))) : null);
}
function deskNow(ui, a, now, ctx) {
  const alt = [now.verb, now.span, now.tool, now.target].filter(Boolean).join(" · ");
  return picture(ui, { key: "now", at: `now-${a.id}`, pic: { source: nowSvg(ctx.inner, now), alt, width: ctx.inner, height: NOW_H } });
}
function nowTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const s = t();
  const now = nowOf(a, ctx.at);
  const steps = stepsOf(a);
  const heading = h(Text, {
    bold: true
  }, a.status === "running" ? s.current : s.lastStep);
  return h(Box, {
    flexDirection: "column",
    rowGap: ctx.isDesktop ? 1 : 0
  }, ctx.isDesktop && now.span ? h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, heading, h(Text, {
    dimColor: true
  }, now.span)) : heading, ctx.isDesktop ? deskNow(ui, a, now, ctx) : nowText(ui, now), steps ? h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, `${s.tasks} ${steps}`) : null);
}
const outcomeOf = (e, isLive) => {
  if (e.endAt !== undefined)
    return e.isError ? { glyph: "✗", key: "error" } : { glyph: "✓", key: "subtle" };
  return { glyph: isLive ? "…" : "—", key: "subtle" };
};
function eventTree(ui, e, ctx) {
  const { Box, Text } = ui;
  const kind = kindOf(e.tool);
  const outcome = outcomeOf(e, ctx.isLive);
  const said = e.why ?? e.plain;
  const fine = e.why && e.plain ? ` · ${e.plain}` : `${said ? ` · ${e.tool}` : ""}${e.target ? ` ${e.target}` : ""}`;
  const pulse = { source: pulseSvg(), alt: t().isRunning, width: PULSE, height: PULSE };
  const end = e.endAt === undefined && ctx.isLive && ctx.isDesktop ? picture(ui, { key: "live", at: `live-${ctx.id}-${ctx.index}`, pic: pulse }) : h(Text, {
    color: outcome.key
  }, outcome.glyph);
  return h(Box, {
    key: `ev-${ctx.index}`,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, h(Text, {
    dimColor: true
  }, KIND_GLYPH[kind]), h(Box, {
    flexGrow: 1,
    flexShrink: 1
  }, h(Text, {
    wrap: "truncate-end"
  }, said ? h(Text, null, said) : h(Text, {
    bold: true
  }, e.tool), fine ? h(Text, {
    dimColor: true
  }, fine) : null)), h(Box, {
    flexShrink: 0,
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, h(Text, {
    dimColor: true
  }, agoOf(ctx.at - e.at)), end));
}
const mixOf = (history) => KIND_ORDER.map((kind) => ({ kind, count: history.filter((e) => kindOf(e.tool) === kind).length })).filter((p) => p.count > 0);
function mixTree(ui, parts, ctx) {
  const { Box, Text } = ui;
  if (!parts.length)
    return null;
  const s = t();
  const words = parts.map((p) => `${s.kinds[p.kind]} ${p.count}`).join(" · ");
  const legend = parts.map((p, i) => h(Text, {
    key: `k-${p.kind}`
  }, h(Text, {
    dimColor: true
  }, `${KIND_GLYPH[p.kind]} `), h(Text, {
    dimColor: true
  }, `${s.kinds[p.kind]} ${p.count}${i < parts.length - 1 ? "   " : ""}`)));
  return h(Box, {
    flexDirection: "column",
    rowGap: ctx.isDesktop ? 1 : 0
  }, ctx.isDesktop && picture(ui, { key: "mix", at: `mix-${ctx.id}`, pic: { source: mixSvg(ctx.inner, parts), alt: words, width: ctx.inner, height: MIX_H } }), h(Text, {
    wrap: "truncate-end"
  }, legend));
}
function historyTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const s = t();
  const list = a.history ?? [];
  const shown = list.slice(-RECENT_SHOWN);
  const hidden = list.length - shown.length;
  const isLive = a.status === "running";
  const isLog = ctx.logOpen === a.id;
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, h(Text, {
    bold: true
  }, `${isLog ? s.log : s.history} · ${s.tools(list.length)}`), mixTree(ui, mixOf(list), { ...ctx, id: a.id }), isLog ? logTree(ui, a) : h(Box, {
    flexDirection: "column"
  }, hidden > 0 && h(Text, {
    dimColor: true
  }, s.earlier(hidden)), shown.map((e, i) => eventTree(ui, e, { ...ctx, id: a.id, isLive, index: hidden + i }))), logButton(ui, a, ctx));
}
const fileWords = (f) => {
  const s = t();
  return [f.edits ? `${s.kinds.edit} ${f.edits}` : "", f.reads ? `${s.kinds.read} ${f.reads}` : ""].filter(Boolean).join(" · ");
};
function fileText(ui, f) {
  const { Text } = ui;
  const kind = f.edits ? "edit" : "read";
  const counts = [f.edits ? `${KIND_GLYPH.edit}${f.edits}` : "", f.reads ? `${KIND_GLYPH.read}${f.reads}` : ""].filter(Boolean).join(" ");
  return h(Text, {
    key: `file-${f.path}`,
    wrap: "truncate-middle"
  }, h(Text, {
    dimColor: true
  }, `${KIND_GLYPH[kind]} `), h(Text, null, shortPath(f.path)), h(Text, {
    dimColor: true
  }, `  ${counts}`));
}
function filesTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const all = filesShown(a.files ?? []);
  if (!all.length)
    return null;
  const s = t();
  const shown = all.slice(0, FILES_SHOWN);
  const more = all.length - shown.length;
  const drawn = ctx.isDesktop ? filesSvg(ctx.inner, shown) : null;
  const alt = shown.map((f) => `${f.path} (${fileWords(f)})`).join(", ");
  const links = filesMarkdown(shown.map((f) => f.path));
  return h(Box, {
    flexDirection: "column",
    rowGap: ctx.isDesktop ? 1 : 0
  }, h(Text, {
    bold: true
  }, `${s.files} · ${all.length}`), drawn ? picture(ui, { key: "files", at: `files-${a.id}`, pic: { source: drawn.source, alt, width: ctx.inner, height: drawn.height } }) : shown.map((f) => fileText(ui, f)), ui.Markdown && links ? h(ui.Markdown, {
    key: `file-links-${a.id}`,
    dimColor: true,
    text: links
  }) : null, more > 0 && h(Text, {
    dimColor: true
  }, s.moreFiles(more)));
}

const PERCENT = 100;
const limitShareOf = (a, limit) => shareOf(a.costUsd, limit);
const usageChipsOf = (a, limit) => {
  const s = t();
  const ctx = ctxOf(a);
  const cost = costText(a);
  const share = cost === "" ? null : limitShareOf(a, limit);
  const chips = [
    { text: `${s.context} ${s.pct(ctx)}`, ring: { ratio: ctx / PERCENT } },
    { text: `${fmtTokens(a.tokens)} ${s.tokensWord}` },
    ...cost === "" ? [] : [{ text: cost }]
  ];
  if (share !== null)
    chips.push({ text: `${s.limit} ≈${s.pct(shareNumber(share))}`, ring: { ratio: share / PERCENT } });
  return chips;
};
const chipsOf = (a, facts) => [{ text: `${t().time} ${fmtTime(elapsed(a, facts.at))}` }, ...usageChipsOf(a, facts.limit)];
const metricsLine = (a, facts) => chipsOf(a, facts).map((chip) => chip.text).join(" · ");
const progressLabel = (p) => `${p.isEstimate ? "~" : ""}${t().pct(Math.round(p.value * PERCENT))}`;

const SIDE_BY_SIDE_PX = 480;
function metricsTree(ui, a, ctx) {
  const { Text } = ui;
  const facts = { limit: ctx.limit, at: ctx.at };
  const line = metricsLine(a, facts);
  if (!ctx.isDesktop)
    return h(Text, {
      dimColor: true,
      wrap: "truncate-end"
    }, line);
  const width = ctx.inner;
  const chips = chipsSvg(width, a.status === "running" ? usageChipsOf(a, ctx.limit) : chipsOf(a, facts));
  return picture(ui, { key: "chips", at: `chips-${a.id}`, pic: { source: chips.source, alt: line, width, height: chips.height } });
}
function actionsTree(ui, a, ctx) {
  const { Box, Button, Input } = ui;
  if (a.isMain === true)
    return null;
  const s = t();
  const name = lookOf(a).name;
  const isRunning = a.status === "running";
  const field = Input && h(Input, {
    key: `send-${a.id}`,
    label: s.message,
    placeholder: isRunning ? s.messageTo(name) : s.followUp(name),
    value: "",
    submitLabel: s.send,
    onSubmit: (text) => ctx.onSend(a.id, text)
  });
  if (!isRunning)
    return field ? h(Box, {
      key: `actions-${a.id}`,
      flexDirection: "column"
    }, field) : null;
  const stop = h(Button, {
    key: `stop-${a.id}`,
    variant: "secondary",
    label: s.stopWho(name),
    onPress: () => ctx.onStop(a.id)
  });
  if (!ctx.isDesktop || ctx.inner < SIDE_BY_SIDE_PX) {
    return h(Box, {
      key: `actions-${a.id}`,
      flexDirection: "column",
      rowGap: ctx.isDesktop ? 1 : 0
    }, field, h(Box, {
      flexDirection: "row",
      justifyContent: ctx.isDesktop ? "flex-end" : "flex-start"
    }, stop));
  }
  return h(Box, {
    key: `actions-${a.id}`,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, field && h(Box, {
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1
  }, field), stop);
}
function detailTree(ui, a, ctx) {
  const { Box } = ui;
  const hasWork = (a.history?.length ?? 0) > 0;
  return h(Box, {
    key: `detail-${a.id}`,
    flexDirection: "column",
    rowGap: 1,
    marginTop: 1
  }, conversationTree(ui, a, ctx), actionsTree(ui, a, ctx), hasWork && nowTree(ui, a, ctx), hasWork && historyTree(ui, a, ctx), filesTree(ui, a, ctx), metricsTree(ui, a, ctx));
}

const CURVE_CAP = 0.9;
const CURVE_CALLS = 8;
const EDIT_FLOOR = 0.45;
const TEST_FLOOR = 0.7;
const START = 0.04;
const TEST_WORDS = /\b(test|vitest|jest|pytest|lint|tsc|validate|check)\b/i;
const floorOf = (a) => {
  const history = a.history ?? [];
  const hasTest = history.some((e) => kindOf(e.tool) === "run" && TEST_WORDS.test(e.target));
  if (hasTest)
    return TEST_FLOOR;
  return history.some((e) => kindOf(e.tool) === "edit") ? EDIT_FLOOR : 0;
};
const estimateOf = (a) => {
  const calls = Math.max(a.toolCount || 0, a.history?.length ?? 0);
  const curve = CURVE_CAP * (1 - Math.exp(-calls / CURVE_CALLS));
  return Math.min(CURVE_CAP, Math.max(START, floorOf(a), curve));
};
const agentProgress = (a) => {
  if (a.status !== "running")
    return { value: 1, isEstimate: false };
  const measured = partialOf(a);
  return measured === null ? { value: estimateOf(a), isEstimate: true } : { value: measured, isEstimate: false };
};

const FRAME_PX = 34;
const FRAME_COLS = 4;
const GAP_PX = 8;
const TERM_BAR_MAX = 24;
const PCT_COLS = 6;
const COST_COLS = 8;
const ANSWER_LINE = 120;
const BODY_PX = 14;
const GLYPH = { running: "●", done: "✓", failed: "✗" };
const STATUS_KEY = { running: "claude", done: "subtle", failed: "error" };
const whoLine = (a) => {
  const tier = tierWordOf(a);
  return [tier, ...modelLine(a).split(" · ").filter((part) => part !== tier)].join(" · ");
};
const statusWord = (a) => {
  const s = t();
  if (a.status === "running")
    return s.isRunning;
  if (a.status === "done")
    return s.isFinished;
  return a.endReason === "aborted" ? s.aborted : s.failed;
};
const pillOf = (a, stuck) => {
  if (stuck)
    return { text: stuck.reason, role: "warn" };
  if (a.status === "running")
    return { text: statusWord(a), role: "run" };
  if (a.status === "done")
    return { text: statusWord(a), role: "ok" };
  return { text: statusWord(a), role: a.endReason === "aborted" ? "warn" : "danger" };
};
const headOf = (a, stuck) => ({
  name: lookOf(a).name,
  title: a.description || a.type,
  pill: pillOf(a, stuck)
});
const nowLine = (a, isOpen) => {
  const answer = a.status === "done" && !isOpen ? a.answer?.split(`
`).find((line) => line.trim()) : undefined;
  if (answer)
    return clip$2(answer.trim(), ANSWER_LINE);
  if (a.status === "failed" && a.lastTool)
    return `› ${a.lastPlain ?? `${a.lastTool}${a.lastTarget ? " " + a.lastTarget : ""}`}`;
  return activityOf(a);
};
const barLabel = (a, progress) => {
  if (a.status === "failed")
    return "✗";
  return progress.isEstimate && !a.toolCount ? "" : progressLabel(progress);
};
const termBar = (p, width) => {
  const filled = Math.round(width * p.value);
  return (p.isEstimate ? "╍" : "━").repeat(filled) + "─".repeat(Math.max(0, width - filled));
};
function termBarTree(ui, a, ctx) {
  const { Box, Text } = ui;
  const progress = agentProgress(a);
  const width = Math.max(6, Math.min(TERM_BAR_MAX, ctx.inner - PCT_COLS - COST_COLS));
  const key = STATUS_KEY[a.status] ?? "claude";
  return h(Box, {
    flexDirection: "row",
    columnGap: 1
  }, h(Text, {
    color: key,
    dimColor: progress.isEstimate
  }, termBar(progress, width)), h(Text, {
    bold: true,
    color: key
  }, barLabel(a, progress)), h(Text, null, costText(a)));
}
function termStatus(ui, a, stuck) {
  const { Text } = ui;
  if (stuck)
    return h(Text, {
      color: "warning"
    }, `! ${stuck.reason}`);
  return h(Text, {
    color: STATUS_KEY[a.status] ?? "subtle"
  }, `${GLYPH[a.status] ?? "●"} ${statusWord(a)}`);
}
function termSummary(ui, a, ctx) {
  const { Box, Text, Button } = ui;
  const isOpen = ctx.selected === a.id;
  return h(Box, {
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1
  }, h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Button, {
    key: `open-${a.id}`,
    plain: true,
    label: `${isOpen ? "▾" : "▸"} ${a.description || a.type}`,
    hover: { color: "claude" },
    onPress: () => ctx.onToggle(a.id)
  }), termStatus(ui, a, stuckOf(a, ctx.at))), termBarTree(ui, a, ctx), h(Box, {
    flexDirection: "row",
    justifyContent: "space-between",
    columnGap: 1
  }, h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    bold: true
  }, lookOf(a).name), h(Text, {
    dimColor: true
  }, ` · ${[whoLine(a), t().tools(a.toolCount || 0)].filter(Boolean).join(" · ")}`)), h(Text, {
    dimColor: true
  }, clockOf(a, ctx.at))), a.status !== "done" && h(Text, {
    wrap: "truncate-end",
    dimColor: a.status !== "running"
  }, activityOf(a)));
}
function termCard(ui, a, ctx) {
  const { Box } = ui;
  const isOpen = ctx.selected === a.id;
  const frame = isOpen ? { borderStyle: "round", paddingX: 1 } : {};
  return h(Box, {
    key: a.id,
    flexDirection: "column",
    ...frame
  }, termSummary(ui, a, isOpen ? { ...ctx, inner: ctx.inner - FRAME_COLS } : ctx), isOpen && detailTree(ui, a, { ...ctx, inner: ctx.inner - FRAME_COLS }));
}
function deskHead(ui, a, ctx) {
  const { Box } = ui;
  const look = lookOf(a);
  const stuck = stuckOf(a, ctx.at);
  const isOpen = ctx.selected === a.id;
  const head = headOf(a, stuck);
  const headW = ctx.inner - CARD_CRAB.w - GAP_PX;
  const crab = cardCrabSvg({ costume: costumeOf(a), look, isWalking: a.status === "running" && !stuck });
  const alt = `${head.title}: ${head.name} · ${whoLine(a)} · ${head.pill.text} (${isOpen ? t().hide : t().details})`;
  return h(Box, {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 1
  }, picture(ui, { key: "crab", at: `crab-${a.id}`, pic: { source: crab, alt: `${look.name}, ${tierWordOf(a)}`, width: CARD_CRAB.w, height: CARD_CRAB.h } }), picture(ui, { key: "head", at: `head-${a.id}`, pic: { source: cardHeadSvg(headW, head), alt, width: headW, height: HEAD_H } }));
}
function deskFoot(ui, a, ctx) {
  const { Box, Text } = ui;
  const isOpen = ctx.selected === a.id;
  const meta = [t().tools(a.toolCount || 0), clockOf(a, ctx.at), costText(a), whoLine(a)].filter(Boolean).join(" · ");
  return h(Box, {
    key: "foot",
    flexDirection: "column"
  }, h(Text, {
    wrap: "truncate-end",
    dimColor: a.status !== "running"
  }, fitText(nowLine(a, isOpen), BODY_PX, ctx.inner)), h(Text, {
    wrap: "truncate-end",
    dimColor: true
  }, fitText(meta, BODY_PX, ctx.inner)));
}
function deskBar(ui, a, ctx) {
  const progress = agentProgress(a);
  const label = barLabel(a, progress);
  const pic = { source: progressBarSvg(ctx.inner, a, { progress, label }), alt: label || t().starting, width: ctx.inner, height: BAR_H };
  return picture(ui, { key: "bar", at: `bar-${a.id}`, pic, opts: { shows: { status: a.status, isEstimate: progress.isEstimate } } });
}
function deskCard(ui, a, ctx) {
  const { Box } = ui;
  const isOpen = ctx.selected === a.id;
  return h(Box, {
    key: a.id,
    flexDirection: "column"
  }, h(Box, {
    key: "row",
    flexDirection: "column",
    alignSelf: "flex-start"
  }, h(Box, {
    key: "head-row",
    alignSelf: "flex-start"
  }, deskHead(ui, a, ctx), PressCover(ui, { key: `open-${a.id}`, width: ctx.inner, height: HEAD_H, onPress: () => ctx.onToggle(a.id) })), deskBar(ui, a, ctx), deskFoot(ui, a, ctx)), isOpen && detailTree(ui, a, ctx));
}
const agentRow = (ui, a, ctx) => ctx.isDesktop ? deskCard(ui, a, ctx) : termCard(ui, a, ctx);
function plannedRow(ui, p, ctx) {
  const { Box, Text } = ui;
  const tier = plannedTierOf(p.tier);
  const crab = { source: crabSvg({ costume: tier, isDim: true }), alt: tier, width: CRAB.w, height: CRAB.h };
  return h(Box, {
    key: `plan-${p.n}`,
    flexDirection: "row",
    columnGap: 1,
    alignItems: "center"
  }, ctx.isDesktop ? picture(ui, { key: "crab", at: `plan-crab-${p.n}`, pic: crab }) : h(Text, {
    dimColor: true
  }, "○"), h(Box, {
    flexDirection: "column",
    flexGrow: 1
  }, h(Text, {
    dimColor: true,
    wrap: "truncate-end"
  }, `${p.n}. ${p.title}`), h(Text, {
    wrap: "truncate-end"
  }, h(Text, {
    dimColor: true
  }, [tier, plannedLine(p)].filter(Boolean).join(" · ")))));
}

const deliveryText = (result) => result.isDelivered ? t().delivered : t().notDelivered(result.reason ?? "");

const agents$2 = atom({ plugin: "savvy-progress", key: "agents" }, []);
const flow$2 = atom({ plugin: "savvy-progress", key: "flow" }, null);
const job$2 = atom({ plugin: "savvy-progress", key: "job" }, null);
const now$1 = atom({ plugin: "savvy-progress", key: "now" }, 0);
const panel = atom({ plugin: "savvy-progress", key: "panel" }, { isCompact: false });
const tasks$2 = atom({ plugin: "savvy-progress", key: "tasks" }, []);
const limit$1 = atom({ plugin: "savvy-progress", key: "limit" }, null);
const types$1 = atom({ plugin: "savvy-progress", key: "types" }, BUILTIN_TYPES);
const crab$1 = atom({ plugin: "savvy-progress", key: "crab" }, restingCrab(0));
const chats$2 = atom({ plugin: "savvy-progress", key: "chats" }, []);
const MIN_W = 240;
const MAX_W = 900;
const PX_PER_COL = 9;
const MIN_COLS = 24;
const DEFAULT_COLS = 40;
async function sendTo($, id, text) {
  const message = text.trim();
  if (!message)
    return;
  const run = (await read($, agents$2)).find((a) => a.id === id);
  const sent = await $.session.send({ to: { agentId: run?.agentId ?? id }, text: message });
  if (!sent.isDelivered) {
    $.ui.toast(deliveryText(sent));
    return;
  }
  const at = await $.clock.now();
  await update($, agents$2, (list) => list.map((a) => a.id === id ? askedAgain(a, message, at) : a));
}
async function requestStop($, agentId) {
  const ran = await $.tool.call({ tool: "TaskStop", task_id: agentId });
  return ran.deny === undefined;
}
async function stopAgent($, agentId) {
  try {
    const isStopped = await requestStop($, agentId);
    $.ui.toast(isStopped ? t().stopAsked : t().stopRefused);
  } catch (error) {
    $.ui.log(`savvy-progress: stop failed (${String(error)})`, { to: "debug" });
    $.ui.toast(t().stopFailed);
  }
}
async function paneData($) {
  return paneDataOf({
    list: await read($, agents$2),
    flow: await read($, flow$2),
    job: await read($, job$2),
    tasks: await read($, tasks$2),
    now: await read($, now$1),
    panel: await read($, panel),
    limit: await read($, limit$1),
    types: await read($, types$1),
    crab: await read($, crab$1),
    chats: await read($, chats$2)
  });
}
const draftOf = (draft) => draft ?? blankDraft();
const patchDraft = ($, patch) => update($, panel, (prev) => ({ ...prev, draft: { ...draftOf(prev.draft), ...patch } }));
async function startTask($, type, text) {
  const prompt = text.trim();
  if (!prompt)
    return;
  try {
    const description = clip$2(prompt.split(`
`)[0] ?? prompt, TASK_TITLE_MAX);
    const started = await $.agent.spawn({ subagentType: type, prompt, description });
    if (started.deny !== undefined) {
      await patchDraft($, { notice: t().denied(started.deny) });
      return;
    }
    const id = started.agentId;
    const at = await $.clock.now();
    const spawn = { id: id ?? `task-${at}`, agentId: id, type, description, brief: prompt, model: started.model, isAsked: true, at };
    const isKnown = (a) => a.agentId !== undefined && a.agentId === id;
    const list = await update($, agents$2, (prev) => prev.some(isKnown) ? prev.map((a) => isKnown(a) ? { ...a, isAsked: true } : a) : addRun(prev, spawn));
    await update($, panel, (prev) => ({ ...prev, selected: spawn.id, draft: { ...draftOf(prev.draft), isOpen: false, notice: undefined } }));
    const run = list.find((a) => a.id === spawn.id);
    $.ui.toast(t().launched(run ? lookOf(run).name : type));
  } catch (error) {
    $.ui.log(`savvy-progress: spawn failed (${String(error)})`, { to: "debug" });
    await patchDraft($, { notice: t().spawnFailed });
  }
}
const draftHandlers = ($, view) => ({
  onNewTask: () => void patchDraft($, { isOpen: !draftOf(view.draft).isOpen, notice: undefined }),
  onCancelTask: () => void patchDraft($, { isOpen: false, notice: undefined }),
  onPickType: (name) => void patchDraft($, { type: name, notice: undefined }),
  onStartTask: (text) => void startTask($, chosenOf(view.types, view.draft)?.name ?? DEFAULT_TYPE, text)
});
function handlersOf($, d) {
  const flip = (fn) => () => void update($, panel, fn);
  return {
    onToggle: (id) => void update($, panel, (prev) => ({ ...prev, selected: prev.selected === id ? undefined : id })),
    onLook: (id) => void update($, panel, (prev) => ({ ...prev, selected: id, isCompact: false })),
    onBrief: (id) => void update($, panel, (prev) => ({ ...prev, briefOpen: prev.briefOpen === id ? undefined : id })),
    onSend: (id, text) => void sendTo($, id, text),
    onStop: (id) => void stopAgent($, id),
    onLog: (id) => void update($, panel, (prev) => ({ ...prev, logOpen: prev.logOpen === id ? undefined : id })),
    onCompact: flip((prev) => ({ ...prev, isCompact: !prev.isCompact })),
    onDone: flip((prev) => ({ ...prev, isDoneOpen: !isDoneOpenIn(prev, d) })),
    onTimeline: flip((prev) => ({ ...prev, isTimelineHidden: prev.isTimelineHidden !== true })),
    onChats: flip((prev) => ({ ...prev, isChatsOpen: prev.isChatsOpen !== true })),
    ...draftHandlers($, { draft: d.panel.draft, types: d.types })
  };
}
const ROWS_MAX = 12;
const isDoneOpenIn = (shown, d) => shown.isDoneOpen ?? d.running.length === 0;
function listTree(ui, view) {
  const { Box, Text } = ui;
  const { d, layout, on } = view;
  const s = t();
  const ctx = { ...on, at: d.at, isDesktop: layout.isDesktop, inner: layout.isDesktop ? layout.W : layout.inner, limit: d.limit, selected: d.panel.selected, briefOpen: d.panel.briefOpen, logOpen: d.panel.logOpen };
  const isDoneOpen = isDoneOpenIn(d.panel, d);
  const running = d.running.slice(0, ROWS_MAX);
  const finished = isDoneOpen ? d.finished.slice(0, ROWS_MAX - running.length) : [];
  const planned = d.planned.slice(0, ROWS_MAX - running.length - finished.length);
  const more = d.running.length + (isDoneOpen ? d.finished.length : 0) + d.planned.length - running.length - finished.length - planned.length;
  return h(Box, {
    key: "list",
    flexDirection: "column",
    rowGap: 1
  }, d.running.length > 0 && sectionHead(ui, layout, { id: "running", label: `${s.running} · ${d.running.length}` }), running.map((a) => agentRow(ui, a, ctx)), d.finished.length > 0 && sectionHead(ui, layout, { id: "finished", label: `${s.finished} · ${d.finished.length}`, toggle: { key: "done", isOpen: isDoneOpen, onPress: on.onDone } }), finished.map((a) => agentRow(ui, a, ctx)), d.planned.length > 0 && sectionHead(ui, layout, { id: "planned", label: `${s.planned} · ${d.planned.length}` }), planned.map((p) => plannedRow(ui, p, ctx)), more > 0 && h(Text, {
    key: "more",
    dimColor: true
  }, s.moreAgents(more)));
}
function withChats(ui, view) {
  const { Box, Text } = ui;
  const { d, layout, on } = view;
  const listed = listedChats(d.chats);
  const quiet = quietTree(ui, { chats: listed.chats, layout, isOpen: d.panel.isChatsOpen === true, onToggle: on.onChats });
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, waitingTree(ui, d.chats, layout), paneTree(ui, view), crewTree(ui, listed.chats, layout), quiet, listed.more > 0 && h(Text, {
    key: "chats-more",
    dimColor: true
  }, t().chats.more(listed.more)));
}
function paneTree(ui, view) {
  const { Box } = ui;
  const { d, layout, on } = view;
  const isDrafting = d.panel.draft?.isOpen === true;
  const form = isDrafting && draftTree(ui, { draft: d.panel.draft, types: d.types, layout }, on);
  if (d.list.length === 0 && d.planned.length === 0) {
    return h(Box, {
      flexDirection: "column",
      rowGap: 2
    }, isDrafting ? form : emptyTree(ui, view));
  }
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, headTree(ui, d, layout), toolbarTree(ui, d, on), attentionTree(ui, view), form, d.panel.isCompact ? compactTree(ui, d, layout) : timelineTree(ui, view), !d.panel.isCompact && listTree(ui, view));
}
async function goHome($) {
  try {
    await $.state.set({ plugin: "savvy-progress", key: "home" }, { at: await $.clock.now() });
  } catch (error) {
    $.ui.log(`savvy-progress: home failed (${String(error)})`, { to: "debug" });
  }
}
const layoutOf = (isDesktop, columns) => {
  if (!isDesktop)
    return { isDesktop, W: 0, inner: columns, cols: columns };
  const W = Math.max(MIN_W, Math.min(MAX_W, columns * PX_PER_COL));
  return { isDesktop, W, inner: W - FRAME_PX, cols: columns - FRAME_COLS };
};
async function drawnPane($, ui, room) {
  const { Box } = ui;
  const home = (await $.state.get({ plugin: "modz", key: "isOn" })).value === true && HomeButton(ui, () => void goHome($));
  const d = await paneData($);
  const body = withChats(ui, { d, layout: layoutOf(room.isDesktop, room.columns), on: handlersOf($, d) });
  return h(Box, {
    flexDirection: "column",
    rowGap: 1
  }, home, body);
}
async function plainOf($, ui) {
  const list = await read($, agents$2).catch(() => []);
  const lines = [...list].sort((a, b) => Number(b.status === "running") - Number(a.status === "running"));
  return plainPane(ui, { notice: t().paneFailed, lines: lines.map((a) => `${a.status === "running" ? "● " : ""}${a.description || a.type}`) });
}
const logOf = ($) => (text) => $.ui.log(`savvy-progress: ${text}`, { to: "debug" });
async function reopenPane($) {
  const opened = await $.ui.open({ id: PANE, title: t().pane });
  if (!opened.isPlaced || (await $.state.get({ plugin: "modz", key: "isOn" })).value !== true)
    return;
  await $.state.set({ plugin: "savvy-progress", key: "shown" }, shownOf(HUB_PANE, await $.clock.now()));
}
function onPane(on) {
  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e);
    reopenKeptTab(paneHeld, {
      isListed: async () => (await $.ui.panes()).some((p) => p.id === PANE),
      reopen: () => reopenPane($),
      soon: (work) => $.clock.after(0, work),
      log: logOf($)
    });
    const room = { isDesktop: e.surface === "desktop" && "Svg" in ui, columns: Math.max(MIN_COLS, e.props.bodyColumns || DEFAULT_COLS) };
    return pinned(e, await drawSafely(paneHeld, { draw: () => drawnPane($, ui, room), plain: () => plainOf($, ui), log: logOf($) }));
  }).catch(async ($, e, next) => {
    if (next.error.kind === "re-entry")
      return next(e);
    paneHeld.needsDraw = true;
    return pinned(e, await plainOf($, $.ui.resolve(e)));
  });
}

const self = atom({ plugin: "savvy-progress", key: "self" }, null);
const chats$1 = atom({ plugin: "savvy-progress", key: "chats" }, []);
const crab = atom({ plugin: "savvy-progress", key: "crab" }, restingCrab(0));
const agents$1 = atom({ plugin: "savvy-progress", key: "agents" }, []);
const flow$1 = atom({ plugin: "savvy-progress", key: "flow" }, null);
const job$1 = atom({ plugin: "savvy-progress", key: "job" }, null);
const tasks$1 = atom({ plugin: "savvy-progress", key: "tasks" }, []);
const hub$1 = atom({ plugin: "savvy-progress", key: "hub" }, { pane: HUB_PANE, detail: "", tone: "idle", at: 0 });
const QUESTION_TOOL = "AskUserQuestion";
const ANY_END = ["answer", "aborted", "refusal", "error"];
const ANY_SESSION = [true, false];
const ANY_TOOL = /./;
const log = ($, what, error) => $.ui.log(`savvy-progress: ${what} (${String(error)})`, { to: "debug" });
async function change($, fn) {
  const prev = await read($, self);
  if (!prev)
    return false;
  const at = await $.clock.now();
  if (isSame(settle(prev, fn(prev), at), prev))
    return false;
  await update($, self, (current) => current ? settle(current, fn(current), at) : current);
  return true;
}
async function publish($, isBeat) {
  const mine = await read($, self);
  if (!mine)
    return;
  const id = await $.session.id();
  if (id === mine.endedId)
    return;
  const beat = beatOf(mine, await $.clock.now(), sharedOf(await read($, agents$1)));
  if (!isBeat && id === mine.id && isSame(bodyOf(beat), mine.sent))
    return;
  if (mine.id && mine.id !== id)
    await $.store.delete(keyOf(mine.id));
  await $.store.set(keyOf(id), beat);
  await update($, self, (current) => current ? { ...current, id, sent: bodyOf(beat) } : current);
}
async function changeAndPublish($, fn) {
  try {
    if (await change($, fn))
      await publish($, false);
  } catch (error) {
    log($, "heartbeat not written", error);
  }
}
async function scan($) {
  const own = keyOf(await $.session.id());
  const entries = [];
  for (const key of await $.store.keys())
    if (key.startsWith(KEY_PREFIX) && key !== own)
      entries.push([key, await $.store.get(key)]);
  const found = scanOf(entries, own, await $.clock.now());
  for (const key of found.gone)
    await $.store.delete(key);
  const prev = await read($, chats$1);
  if (isSame(found.chats, prev))
    return;
  await update($, chats$1, () => found.chats);
  await syncHub$1($);
}
async function syncHub$1($) {
  const sources = { flow: await read($, flow$1), agents: await read($, agents$1), job: await read($, job$1), tasks: await read($, tasks$1) };
  const shown = hubCardOf({ ...sources, chats: await read($, chats$1) });
  if (isShowing(await read($, hub$1), shown))
    return;
  const at = await $.clock.now();
  await update($, hub$1, () => ({ pane: HUB_PANE, ...shown, at }));
}
async function moveCrab($, fn) {
  const prev = await read($, crab);
  if (!isSame(fn(prev), prev))
    await update($, crab, fn);
}
async function beat($) {
  try {
    await publish($, true);
    await scan($);
    const now = await $.clock.now();
    await moveCrab($, (prev) => rested(prev, now));
  } catch (error) {
    log($, "no chat heartbeat this beat", error);
  }
}
async function glance($) {
  try {
    await publish($, false);
    await scan($);
  } catch (error) {
    log($, "no look at the other chats this time", error);
  }
}
async function projectName($, cwd) {
  try {
    const repo = await $.session.repo();
    return projectOf(repo?.root ?? cwd);
  } catch (error) {
    log($, "no repository, naming the folder", error);
    return projectOf(cwd);
  }
}
async function followFolder($) {
  try {
    const project = await projectName($, await $.session.cwd());
    await change($, (prev) => ({ ...prev, project }));
  } catch (error) {
    log($, "the folder could not be read this beat", error);
  }
}
async function start($, cwd) {
  try {
    const turns = turnsFrom(await $.store.get(TURNS_KEY));
    await moveCrab($, (prev) => prev.mood === "working" ? { ...prev, turns } : { ...prev, mood: "sleeping", turns });
    const at = await $.clock.now();
    const project = await projectName($, cwd);
    const prev = await read($, self);
    await update($, self, () => prev ? { ...prev, project, endedId: undefined } : { ...blankSelf(at), project });
  } catch (error) {
    log($, "other chats and the crab wait for the next beat", error);
  }
  await beat($);
  $.clock.every(HEARTBEAT_MS, () => void followFolder($).then(() => beat($)));
  $.clock.every(SCAN_MS, () => void glance($));
}
async function countTurn($) {
  const turns = turnsFrom(await $.store.get(TURNS_KEY)) + 1;
  await $.store.set(TURNS_KEY, turns);
  return turns;
}
async function crabEnded($, reason) {
  try {
    const at = await $.clock.now();
    const turns = reason === "answer" ? await countTurn($) : (await read($, crab)).turns;
    await moveCrab($, (prev) => ({ ...ended(prev, { reason, at }), turns }));
  } catch (error) {
    log($, "the crab missed a turn", error);
  }
}
async function askClosed($, id) {
  if (typeof id !== "string" || !(await read($, self))?.asks.includes(id))
    return;
  await changeAndPublish($, (prev) => withoutAsk(prev, id));
}
function onSession(on) {
  on("session.start", { isInteractive: ANY_SESSION }, async ($, e, next) => {
    const result = await next(e);
    await start($, result.cwd);
    return result;
  }).catch(($, e, next) => next(e));
  on("session.end", async ($, e, next) => {
    try {
      await $.store.delete(keyOf(e.sessionId));
      const at = await $.clock.now();
      await update($, self, (prev) => ({ ...blankSelf(at), project: prev?.project ?? "", endedId: e.sessionId }));
    } catch (error) {
      log($, "heartbeat not removed", error);
    }
    return next(e);
  }).catch(($, e, next) => next(e));
}
function onTurns(on) {
  on("turn.start", async ($, e, next) => {
    const result = await next(e);
    await changeAndPublish($, (prev) => ({ ...prev, isWorking: true, title: prev.title || titleOf(e.text) }));
    await moveCrab($, started).catch((error) => log($, "the crab missed a turn", error));
    return result;
  }).catch(($, e, next) => next(e));
  on("turn.complete", { reason: ANY_END }, async ($, e, next) => {
    const result = await next(e);
    if (e.agentId !== undefined)
      return result;
    await changeAndPublish($, (prev) => ({ ...prev, isWorking: false, asks: [] }));
    await crabEnded($, e.reason);
    return result;
  }).catch(($, e, next) => next(e));
}
function onAsks(on) {
  on("tool.check", async ($, e, next) => {
    const verdict = await next(e);
    const id = e.tool_use_id;
    if (verdict.decision === "ask" && id !== undefined)
      await changeAndPublish($, (prev) => withAsk(prev, id));
    return verdict;
  }).catch(($, e, next) => next(e));
  on("tool.call", { tool: ANY_TOOL }, async ($, e, next) => {
    const id = e.tool_use_id;
    if (typeof id === "string" && e.tool === QUESTION_TOOL)
      await changeAndPublish($, (prev) => withAsk(prev, id));
    try {
      return await next(e);
    } finally {
      await askClosed($, id);
    }
  }).catch(($, e, next) => next(e));
}
function onPresence(on) {
  onSession(on);
  onTurns(on);
  onAsks(on);
}

const OWN = new Set([TOOL, STEP_TOOL]);
const isOwnTool = (tool) => OWN.has(tool);
const isQuietCall = (call) => isOwnTool(call.tool) && !call.isErrored && call.isInterrupted !== true;
const nothing = (ui) => {
  const { Box } = ui;
  return h(Box, null);
};
function onTranscript(on) {
  on("ui.render", { component: "ToolUse" }, async ($, e, next) => {
    if (!isQuietCall(e.props))
      return next(e);
    return nothing($.ui.resolve(e));
  });
  on("ui.render", { component: "ToolResult" }, async ($, e, next) => {
    if (!isQuietCall(e.props))
      return next(e);
    return nothing($.ui.resolve(e));
  });
  on("ui.render", { component: "ToolGroup" }, async ($, e, next) => {
    const calls = e.props.calls;
    if (calls.length === 0 || !calls.every(isQuietCall))
      return next(e);
    return nothing($.ui.resolve(e));
  });
}

const agents = atom({ plugin: "savvy-progress", key: "agents" }, []);
const now = atom({ plugin: "savvy-progress", key: "now" }, 0);
const limit = atom({ plugin: "savvy-progress", key: "limit" }, null);
const flow = atom({ plugin: "savvy-progress", key: "flow" }, null);
const job = atom({ plugin: "savvy-progress", key: "job" }, null);
const tasks = atom({ plugin: "savvy-progress", key: "tasks" }, []);
const types = atom({ plugin: "savvy-progress", key: "types" }, BUILTIN_TYPES);
const hub = atom({ plugin: "savvy-progress", key: "hub" }, { pane: HUB_PANE, detail: "", tone: "idle", at: 0 });
const chats = atom({ plugin: "savvy-progress", key: "chats" }, []);
const TICK_MS = 1000;
const IDLE_ROSTER_BEATS = 5;
const AGENTS_DIR = ".claude/agents";
const PROGRESS_SPEC = {
  name: "progress",
  description: "Report /savvy-flow progress to the progress bar above the prompt and the agents panel. " + 'Call it after presenting the plan (title, total, tasks, phase "delegate"), each time a task is accepted (done), ' + "when switching phase or re-planning (tasks), and once at the end with finished: true. Fields left out keep their previous value. " + "For the main session only: a call from a subagent is ignored (workers report with `step`).",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short name of the overall task, a few words." },
      total: { type: "integer", minimum: 0, description: "Number of planned worker tasks." },
      done: { type: "integer", minimum: 0, description: "Number of tasks accepted after review." },
      phase: { type: "string", enum: [...PHASES] },
      finished: { type: "boolean", description: "True once the flow is closed." },
      tasks: {
        type: "array",
        description: "The planned worker tasks in order, numbered from 1. Each title must equal the Agent tool `description` the task will be delegated with, so the panel can match runs to tasks.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "A few words; reused verbatim as the Agent description." },
            tier: { type: "string", enum: [...TIERS] },
            after: { type: "array", items: { type: "integer" }, description: "Numbers of the tasks this one waits for." }
          },
          required: ["title", "tier"]
        }
      }
    }
  }
};
const STEP_SPEC = {
  name: "step",
  description: "For savvy-flow workers: report progress on your own task to the agents panel. " + "Right after reading the brief, call it with `total` (your plan in 3-8 steps) and `done: 0`; " + "call it again as each step finishes. Cheap and silent: it only draws a bar.",
  inputSchema: {
    type: "object",
    properties: {
      done: { type: "integer", minimum: 0, description: "Steps finished so far." },
      total: { type: "integer", minimum: 1, description: "Steps planned; may change if the plan changes." },
      note: { type: "string", description: "The step in progress, a few words." }
    },
    required: ["done"]
  },
  isDeferred: false
};
async function settingsLang($) {
  try {
    const settings = await $.settings.read();
    return langOf(settings.language);
  } catch (error) {
    $.ui.log(`savvy-progress: settings unreadable, using the locale (${String(error)})`, { to: "debug" });
    return null;
  }
}
async function detectLang($, option) {
  if (isLang(option))
    return option;
  const fromModz = langOf(await $.env.get("MODZ_LANG").catch(() => {
    return;
  }));
  if (fromModz)
    return fromModz;
  const fromSettings = await settingsLang($);
  if (fromSettings)
    return fromSettings;
  const locale = await $.env.get("LC_ALL") || await $.env.get("LC_MESSAGES") || await $.env.get("LANG");
  return langOf(locale) ?? "en";
}
async function seedLimit($) {
  try {
    const usage = await $.session.usage();
    const reading = readingOf(usage.rateLimits, usage.cost?.usd);
    const prev = await read($, limit);
    if (reading && !isSame(trackLimit(prev, reading), prev))
      await update($, limit, (p) => trackLimit(p, reading));
  } catch (error) {
    $.ui.log(`savvy-progress: no usage yet, the 5h share waits for a measure (${String(error)})`, { to: "debug" });
  }
}
async function scanDir($, dir, source) {
  const found = [];
  try {
    for (const entry of await $.fs.list(dir)) {
      if (!entry.name.endsWith(".md"))
        continue;
      const type = parseAgentFile(await $.fs.read(`${dir}/${entry.name}`), source);
      if (type)
        found.push(type);
    }
  } catch (error) {
    $.ui.log(`savvy-progress: no agent files in ${dir} (${String(error)})`, { to: "debug" });
  }
  return found;
}
async function scanTypes($) {
  const home = await $.env.get("HOME");
  const project = await scanDir($, AGENTS_DIR, "project");
  const user = home ? await scanDir($, `${home}/${AGENTS_DIR}`, "user") : [];
  const found = [...project, ...user];
  const known = await read($, types);
  if (found.length && !isSame(mergeTypes(known, found), known))
    await update($, types, (current) => mergeTypes(current, found));
}
async function syncRoster($) {
  try {
    const roster = await $.agent.list();
    const at = await $.clock.now();
    const prev = await read($, agents);
    if (reconcile(prev, roster, at) === prev)
      return;
    await update($, agents, (list) => reconcile(list, roster, at));
    await syncHub($);
  } catch (error) {
    $.ui.log(`savvy-progress: no agent list this beat (${String(error)})`, { to: "debug" });
  }
}
function startBeat($) {
  let idleBeats = 0;
  $.clock.every(TICK_MS, () => {
    (async () => {
      const isBusy = crewOf(await read($, agents)).some(isRunning);
      idleBeats = isBusy ? 0 : idleBeats + 1;
      if (isBusy || idleBeats >= IDLE_ROSTER_BEATS) {
        idleBeats = 0;
        await syncRoster($);
      }
      const list = await read($, agents);
      if (!list.some(isRunning))
        return;
      const at = await $.clock.now();
      await update($, now, () => at);
    })();
  });
}
async function syncHub($, isForced = false) {
  const sources = { flow: await read($, flow), agents: await read($, agents), job: await read($, job), tasks: await read($, tasks) };
  const shown = hubCardOf({ ...sources, chats: await read($, chats) });
  if (!isForced && isShowing(await read($, hub), shown))
    return;
  const at = await $.clock.now();
  await update($, hub, () => ({ pane: HUB_PANE, ...shown, at }));
}
function onHubSources(on) {
  on("state.set", { plugin: "savvy-progress", key: "flow" }, async ($, e, next) => {
    const done = await next(e);
    await syncHub($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "savvy-progress", key: "agents" }, async ($, e, next) => {
    const done = await next(e);
    await syncHub($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "savvy-progress", key: "job" }, async ($, e, next) => {
    const done = await next(e);
    await syncHub($);
    return done;
  }).catch(($, e, next) => next(e));
  on("state.set", { plugin: "savvy-progress", key: "tasks" }, async ($, e, next) => {
    const done = await next(e);
    await syncHub($);
    return done;
  }).catch(($, e, next) => next(e));
}
const register = (on, options) => {
  on("session.start", async ($, e, next) => {
    setLang(await detectLang($, options.language));
    const started = await next(e);
    await $.tool.register(PROGRESS_SPEC);
    await $.tool.register(STEP_SPEC);
    await $.command.register({
      name: "agents-info",
      description: t().command
    });
    startBeat($);
    await seedLimit($);
    await scanTypes($);
    await syncHub($, true);
    return started;
  });
  onEvents(on);
  onPane(on);
  onDispatch(on);
  onBand(on, { isCrabInBand: options.crabInBand === true });
  onPresence(on);
  onHubSources(on);
  onTranscript(on);
};

export { register };

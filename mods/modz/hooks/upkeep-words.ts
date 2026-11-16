// The words of the hub's two side panes, Connections and Dead weight, in English and in Turkish (MODZ_LANG=tr).
import { pick } from './kit/lang'

// "8.2k" / "8,2 bin": a token count short enough for a row.
const short = (tokens: number, point: string, unit: string): string =>
  tokens < 1000 ? String(tokens) : `${(tokens / 1000).toFixed(1).replace('.', point)}${unit}`

const LINKS = {
  en: {
    lead: "Claude's doors to outside tools (MCP servers) in this chat.",
    failed: 'Broken',
    failedNote: 'Could not connect. Fix its address or remove it.',
    pending: 'Connecting',
    waiting: 'Waiting for sign-in',
    waitingNote: "Unusable until you sign in: Claude's connector settings, or /mcp.",
    connected: 'Working',
    none: 'No connections in this chat.',
    unread: 'Not looked at yet.',
    check: 'Look again',
    failedCount: (n: number) => `${n} broken`,
    waitingCount: (n: number) => `${n} waiting for sign-in`,
    connectedCount: (n: number) => `${n} working`,
  },
  tr: {
    lead: "Claude'un bu sohbette dış araçlara açılan kapıları (MCP sunucuları).",
    failed: 'Bozuk',
    failedNote: 'Bağlanamadı. Adresini düzelt ya da kaldır.',
    pending: 'Bağlanıyor',
    waiting: 'Giriş bekliyor',
    waitingNote: "Giriş yapmadan kullanılamaz: Claude'un bağlantı ayarları ya da /mcp.",
    connected: 'Çalışıyor',
    none: 'Bu sohbette hiç bağlantı yok.',
    unread: 'Henüz bakılmadı.',
    check: 'Yeniden bak',
    failedCount: (n: number) => `${n} bozuk`,
    waitingCount: (n: number) => `${n} giriş bekliyor`,
    connectedCount: (n: number) => `${n} çalışıyor`,
  },
}

export const linkWords = () => pick(LINKS)

const WEIGHT = {
  en: {
    lead: (days: number) => `Plugins and skills you have not used in ${days} days. Claude reads each one's listing in every chat.`,
    total: (tokens: number) => `Without them every chat starts about ${short(tokens, '.', 'k')} tokens lighter.`,
    kinds: { plugin: 'plugin', skill: 'skill' },
    skills: (n: number) => `${n} ${n === 1 ? 'skill' : 'skills'}`,
    tokens: (tokens: number) => `~${short(tokens, '.', 'k')} tokens`,
    never: 'never used',
    idle: (days: number) => `not used for ${days} days`,
    how: 'Copy a line and paste it into the message box to switch that plugin off. Your own skills are folders under ~/.claude/skills.',
    copy: 'Copy',
    more: (n: number) => `+${n} more`,
    none: 'No dead weight: everything installed gets used.',
    noneShort: 'everything gets used',
    unread: 'Not measured yet.',
    count: (n: number, tokens: number) => `${n} unused · ~${short(tokens, '.', 'k')} tokens`,
  },
  tr: {
    lead: (days: number) => `${days} gündür kullanmadığın eklentiler ve beceriler. Claude her sohbette hepsinin tanıtımını okur.`,
    total: (tokens: number) => `Bunlar olmasa her sohbet yaklaşık ${short(tokens, ',', ' bin')} token hafif başlar.`,
    kinds: { plugin: 'eklenti', skill: 'beceri' },
    skills: (n: number) => `${n} beceri`,
    tokens: (tokens: number) => `~${short(tokens, ',', ' bin')} token`,
    never: 'hiç kullanılmadı',
    idle: (days: number) => `${days} gündür kullanılmadı`,
    how: 'Bir satırı kopyalayıp mesaj kutusuna yapıştır; o eklenti kapanır. Kendi becerilerin ~/.claude/skills altındaki klasörlerdir.',
    copy: 'Kopyala',
    more: (n: number) => `+${n} tane daha`,
    none: 'Ölü ağırlık yok: kurulu her şey kullanılıyor.',
    noneShort: 'her şey kullanılıyor',
    unread: 'Henüz ölçülmedi.',
    count: (n: number, tokens: number) => `${n} kullanılmıyor · ~${short(tokens, ',', ' bin')} token`,
  },
}

export const weightWords = () => pick(WEIGHT)

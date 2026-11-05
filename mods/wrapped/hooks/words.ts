import { pick } from './kit/lang'
import type { Persona, Wrapped } from '../types'

// Every word the mod shows, in both languages.

const THOUSAND = 1000
const MILLION = 1_000_000

export function compact(value: number): string {
  if (value >= MILLION) return `${(value / MILLION).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 10 * THOUSAND) return `${Math.round(value / THOUSAND)}k`
  if (value >= THOUSAND) return `${(value / THOUSAND).toFixed(1).replace(/\.0$/, '')}k`

  return String(Math.round(value))
}

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
}

// `2026-10-09` → `Oct 9` / `9 Eki`.
export function shortDay(day: string): string {
  const [, month, date] = day.split('-')
  const name = pick(MONTHS)[Number(month) - 1] ?? ''

  return pick({ en: `${name} ${Number(date)}`, tr: `${Number(date)} ${name}` })
}

const PERSONAS: Record<Persona, { en: [string, string]; tr: [string, string] }> = {
  commander: {
    en: ['The Commander', 'I rarely go alone. I send agents.'],
    tr: ['Komutan', 'Tek başıma gitmiyorum. Ajan gönderiyorum.'],
  },
  owl: {
    en: ['The Night Owl', 'My best work starts after midnight.'],
    tr: ['Gece Kuşu', 'En iyi işlerim gece yarısından sonra başlıyor.'],
  },
  marathoner: {
    en: ['The Marathoner', 'I stay in one chat until it is done.'],
    tr: ['Maratoncu', 'Bir sohbete girince iş bitmeden çıkmıyorum.'],
  },
  director: {
    en: ['The Director', 'Cut. Again. My hand stays on the stop button.'],
    tr: ['Yönetmen', 'Kestik, baştan. Elim hep durdur düğmesinde.'],
  },
  sprinter: {
    en: ['The Sprinter', 'Ask, get it, close the chat. Next.'],
    tr: ['Sprinter', 'Sor, al, sohbeti kapat. Sıradaki.'],
  },
  builder: {
    en: ['The Builder', 'Steady chats, steady work. Things get shipped.'],
    tr: ['Yapıcı', 'Düzenli sohbet, düzenli iş. Bir şeyler çıkıyor.'],
  },
}

export const personaName = (persona: Persona): string => pick(PERSONAS[persona])[0]
export const personaLine = (persona: Persona): string => pick(PERSONAS[persona])[1]

const hourText = (hour: number): string => `${String(hour).padStart(2, '0')}:00`

const longMonths = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
}

// `2026-10` → `October` / `Ekim`.
export const monthName = (month: string): string => pick(longMonths)[Number(month.split('-')[1]) - 1] ?? month

export const words = () =>
  pick({
    en: {
      agentsTitle: 'Agents',
      agentsLine: (runs: number, tools: number) => `${compact(runs)} runs, ${compact(tools)} tool calls`,
      agentRun: (runs: number) => `${compact(runs)} runs`,
      agentMeta: (tools: number, tokens: number) => `${compact(tools)} tools · ${compact(tokens)} tokens`,
      monthsTitle: 'Month by month',
      monthMeta: (prompts: number, runs: number) => `${compact(prompts)} prompts · ${compact(runs)} agents`,
      hiddenProject: (letter: string) => `Project ${letter}`,
      filmMake: 'Make the video',
      filmMaking: (made: number, total: number) => `Making the video: ${made}/${total} frames…`,
      filmReady: (path: string) => `Video saved: ${path}`,
      filmFailed: (reason: string) => `No video: ${reason}`,
      filmNoFfmpeg: 'ffmpeg is needed (brew install ffmpeg); macOS draws the frames.',
      sceneIntro: 'with Claude Code',
      sceneVolume: 'This year I sent',
      sceneCrew: 'agents went to work',
      sceneCrewEach: (each: number) => `each crab is ${compact(each)} agents`,
      sceneCrewTools: (tools: number, tokens: number) => `${compact(tools)} tool calls · ${compact(tokens)} tokens`,
      sceneBoard: 'Who did the work',
      sceneBoardRuns: (runs: number) => `${compact(runs)} runs`,
      sceneHardest: 'Hardest single shift',
      sceneHardestMeta: (tools: number, tokens: number) => `${compact(tools)} tool calls · ${compact(tokens)} tokens`,
      sceneMonths: 'How the year went',
      scenePersona: 'This year I was',
      paneTitle: 'Wrapped',
      commandHelp: 'Your year with Claude Code: a card and a video. /wrapped 2025 picks a year',
      hubHint: 'Your year with Claude Code on one card',
      hubDetail: (w: Wrapped) => `${w.year}: ${personaName(w.persona)}, ${compact(w.prompts)} prompts`,
      opened: 'Wrapped pane opened.',
      badYear: 'Give a year like 2026, or nothing for this one.',
      reading: (year: number) => `Reading your ${year} transcripts…`,
      readingHint: 'A few minutes at most on a big archive. You can keep working.',
      idle: 'Nothing read yet.',
      empty: (year: number) => `No prompts from ${year} in the transcripts on this machine.`,
      emptyHint: 'Claude Code removes old transcripts after 30 days unless cleanupPeriodDays in settings keeps them.',
      failed: 'The transcripts could not be read',
      noRoot: 'Their folder is not known yet: send a prompt, then try again.',
      title: (year: number) => `My ${year} with Claude Code`,
      range: (w: Wrapped) => `${shortDay(w.firstDay)} to ${shortDay(w.lastDay)}, from the transcripts on my machine`,
      prompts: 'prompts',
      sessions: 'chats',
      activeDays: 'active days',
      streak: 'day streak',
      linesAdded: 'lines added',
      apiValue: 'at API prices',
      rightRow: 'Claude said I was right',
      rightValue: (count: number) => `${compact(count)} times`,
      stopsRow: 'I stopped Claude',
      stopsValue: (count: number) => `${compact(count)} times`,
      hourRow: 'Busiest hour',
      hourValue: hourText,
      nightRow: 'Prompts after midnight',
      percent: (value: number) => `${value}%`,
      toolRow: 'Favorite tool',
      toolValue: (name: string, count: number) => `${name}, ${compact(count)} times`,
      novelsRow: 'Claude wrote about',
      novelsValue: (count: number) => `${compact(count)} novels`,
      fileRow: 'Most-edited file',
      fileValue: (name: string, count: number) => `${name}, ${compact(count)} edits`,
      projectRow: 'Top project',
      projectValue: (name: string, count: number) => `${name}, ${compact(count)} prompts`,
      hiddenCount: (count: number, unit: 'edits' | 'prompts') => `${compact(count)} ${unit}`,
      chatRow: 'Longest chat',
      chatValue: (count: number) => `${compact(count)} prompts`,
      made: 'made with MODZ',
      save: 'Save image',
      copy: 'Copy text',
      showNames: 'Show names',
      hideNames: 'Hide names',
      readAgain: 'Read again',
      namesOff: 'File and project names are off the card.',
      namesOn: 'File and project names are on the card, and in what you save or copy.',
      savedImage: (path: string) => `Saved: ${path}`,
      savedSvg: (path: string) => `Saved as SVG, no PNG converter here: ${path}`,
      saveFailed: (reason: string) => `Not saved: ${reason}`,
      copied: 'Copied.',
      readAt: (when: string) => `Read on ${when}.`,
    },
    tr: {
      agentsTitle: 'Ajanlar',
      agentsLine: (runs: number, tools: number) => `${compact(runs)} çalıştırma, ${compact(tools)} araç çağrısı`,
      agentRun: (runs: number) => `${compact(runs)} görev`,
      agentMeta: (tools: number, tokens: number) => `${compact(tools)} araç · ${compact(tokens)} token`,
      monthsTitle: 'Ay ay',
      monthMeta: (prompts: number, runs: number) => `${compact(prompts)} mesaj · ${compact(runs)} ajan`,
      hiddenProject: (letter: string) => `Proje ${letter}`,
      filmMake: 'Video yap',
      filmMaking: (made: number, total: number) => `Video yapılıyor: ${made}/${total} kare…`,
      filmReady: (path: string) => `Video kaydedildi: ${path}`,
      filmFailed: (reason: string) => `Video yok: ${reason}`,
      filmNoFfmpeg: 'ffmpeg gerekiyor (brew install ffmpeg); kareleri macOS çiziyor.',
      sceneIntro: 'Claude Code ile',
      sceneVolume: 'Bu yıl gönderdiğim',
      sceneCrew: 'ajan işe çıktı',
      sceneCrewEach: (each: number) => `her yengeç ${compact(each)} ajan`,
      sceneCrewTools: (tools: number, tokens: number) => `${compact(tools)} araç çağrısı · ${compact(tokens)} token`,
      sceneBoard: 'İşi kim yaptı',
      sceneBoardRuns: (runs: number) => `${compact(runs)} görev`,
      sceneHardest: 'En uzun tek mesai',
      sceneHardestMeta: (tools: number, tokens: number) => `${compact(tools)} araç çağrısı · ${compact(tokens)} token`,
      sceneMonths: 'Yıl nasıl geçti',
      scenePersona: 'Bu yıl şuydum',
      paneTitle: 'Wrapped',
      commandHelp: 'Claude Code ile yılın: kart ve video. /wrapped 2025 başka bir yılı seçer',
      hubHint: 'Claude Code ile yılın tek kartta',
      hubDetail: (w: Wrapped) => `${w.year}: ${personaName(w.persona)}, ${compact(w.prompts)} mesaj`,
      opened: 'Wrapped paneli açıldı.',
      badYear: 'Yılı 2026 gibi yaz; bu yıl için boş bırak.',
      reading: (year: number) => `${year} kayıtların okunuyor…`,
      readingHint: 'Büyük arşivde en fazla birkaç dakika sürer. Çalışmaya devam edebilirsin.',
      idle: 'Henüz okunmadı.',
      empty: (year: number) => `Bu makinedeki kayıtlarda ${year} yılına ait mesaj yok.`,
      emptyHint: "Claude Code eski kayıtları 30 gün sonra siler; ayarlardaki cleanupPeriodDays bunu uzatır.",
      failed: 'Kayıtlar okunamadı',
      noRoot: 'Klasörleri henüz bilinmiyor: bir mesaj gönderip yeniden dene.',
      title: (year: number) => `Claude Code ile ${year} yılım`,
      range: (w: Wrapped) => `${shortDay(w.firstDay)} – ${shortDay(w.lastDay)}, makinemdeki kayıtlardan`,
      prompts: 'mesaj',
      sessions: 'sohbet',
      activeDays: 'aktif gün',
      streak: 'gün üst üste',
      linesAdded: 'satır eklendi',
      apiValue: 'API fiyatıyla',
      rightRow: 'Claude bana hak verdi',
      rightValue: (count: number) => `${compact(count)} kez`,
      stopsRow: "Claude'u durdurdum",
      stopsValue: (count: number) => `${compact(count)} kez`,
      hourRow: 'En yoğun saat',
      hourValue: hourText,
      nightRow: 'Gece yarısından sonra',
      percent: (value: number) => `%${value}`,
      toolRow: 'En sevilen araç',
      toolValue: (name: string, count: number) => `${name}, ${compact(count)} kez`,
      novelsRow: 'Claude şu kadar yazdı',
      novelsValue: (count: number) => `${compact(count)} roman`,
      fileRow: 'En çok düzenlenen dosya',
      fileValue: (name: string, count: number) => `${name}, ${compact(count)} düzenleme`,
      projectRow: 'Başlıca proje',
      projectValue: (name: string, count: number) => `${name}, ${compact(count)} mesaj`,
      hiddenCount: (count: number, unit: 'edits' | 'prompts') => `${compact(count)} ${unit === 'edits' ? 'düzenleme' : 'mesaj'}`,
      chatRow: 'En uzun sohbet',
      chatValue: (count: number) => `${compact(count)} mesaj`,
      made: "MODZ ile yapıldı",
      save: 'Görsel kaydet',
      copy: 'Metni kopyala',
      showNames: 'Adları göster',
      hideNames: 'Adları gizle',
      readAgain: 'Yeniden oku',
      namesOff: 'Dosya ve proje adları kartta yok.',
      namesOn: 'Dosya ve proje adları kartta; kaydettiğinde ve kopyaladığında da görünür.',
      savedImage: (path: string) => `Kaydedildi: ${path}`,
      savedSvg: (path: string) => `PNG dönüştürücü yok, SVG olarak kaydedildi: ${path}`,
      saveFailed: (reason: string) => `Kaydedilemedi: ${reason}`,
      copied: 'Kopyalandı.',
      readAt: (when: string) => `${when} tarihinde okundu.`,
    },
  })

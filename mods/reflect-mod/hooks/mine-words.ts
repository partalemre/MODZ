import type { Candidate, Idea } from '../types'
import { pick } from './lang'

// Every word the Ideas pane and `/mine` show, in English and Turkish. Read through `mineWords()` when drawing.

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

const TR = {
  title: 'Fikirler',
  mineHelp: 'reflect: son sohbetlerinde tekrar eden sürtünmeyi bul',
  eyebrow: 'Geçmiş sohbetlerinden',
  reading: (n: number) => `Son ${n} sohbetin okunuyor`,
  thinking: 'Tekrar edenler fikre dönüşüyor',
  ideasHead: (n: number) => `${n} fikir`,
  read: (n: number) => `${n} sohbet okundu`,
  tooLarge: (n: number) => `${n} çok büyük`,
  empty: (n: number) => `Son ${n} sohbette tekrar eden sürtünme bulunmadı`,
  noChats: 'Bu proje için geçmiş sohbet bulunamadı',
  unreadable: 'Geçmiş sohbetlerin okunamadı',
  failedHead: (n: number) => `${n} şey tekrar ediyor`,
  failed: 'Bunlar fikre dönüştürülemedi; tekrar edenler şunlar.',
  again: 'Yeniden çalıştır',
  tryAgain: 'Tekrar dene',
  save: "CLAUDE.md'ye kaydet",
  copy: 'Kopyala',
  copied: 'Kopyalandı',
  copyFailed: 'reflect: burada kopyalanamadı',
  waiting: 'İstem üstündeki kartta',
  known: "Zaten CLAUDE.md'de",
  saved: "CLAUDE.md'ye kaydedildi",
  seen: (count: number, chats: number) => `${chats} sohbette ${count} kez`,
  type: { rule: 'Kural', hook: 'Hook', skill: 'Skill', mod: 'Mod' } as Record<Idea['type'], string>,
  kind: {
    correction: 'Düzeltme', ask: 'Kalıcı istek', held: 'Bekletilen çağrı', failing: 'Başarısız komut', repeat: 'Tekrarlanan istem',
  } as Record<Candidate['kind'], string>,
}

type MineWords = typeof TR

const EN: MineWords = {
  title: 'Ideas',
  mineHelp: 'reflect: find what keeps repeating in your recent chats',
  eyebrow: 'From your past chats',
  reading: n => `Reading your last ${plural(n, 'chat', 'chats')}`,
  thinking: 'Turning what repeats into ideas',
  ideasHead: n => plural(n, 'idea', 'ideas'),
  read: n => `${plural(n, 'chat', 'chats')} read`,
  tooLarge: n => `${n} too large`,
  empty: n => `No repeating friction found in the last ${plural(n, 'chat', 'chats')}`,
  noChats: 'No past chats found for this project',
  unreadable: 'Could not read your past chats',
  failedHead: n => `${plural(n, 'thing repeats', 'things repeat')}`,
  failed: 'Could not turn these into ideas; here is what repeats.',
  again: 'Run again',
  tryAgain: 'Try again',
  save: 'Save to CLAUDE.md',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'reflect: could not copy here',
  waiting: 'In the card above the prompt',
  known: 'Already in CLAUDE.md',
  saved: 'Saved to CLAUDE.md',
  seen: (count, chats) => `Seen ${plural(count, 'time', 'times')} in ${plural(chats, 'chat', 'chats')}`,
  type: { rule: 'Rule', hook: 'Hook', skill: 'Skill', mod: 'Mod' },
  kind: { correction: 'Correction', ask: 'Standing ask', held: 'Held call', failing: 'Failing command', repeat: 'Repeated prompt' },
}

export const mineWords = (): MineWords => pick({ en: EN, tr: TR })

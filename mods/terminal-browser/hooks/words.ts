// Every word the browser shows the person, in English and Turkish. Read through `pick` at draw time, after
// session.start has set the language.
import { pick } from './lang'

const EN = {
  command: 'Opens a browser on the right',
  closed: 'Browser closed',
  alreadyClosed: 'The browser is already closed',
  opened: 'Browser opened',
  startPage: 'Start page',
  paneTitle: 'Browser',
  eyebrow: 'Browser',
  loading: 'Loading the page…',
  died: 'The browser closed',
  retry: 'Try again with /browser · /browser close closes it',
  terminalOnly: 'terminal-browser runs only in the terminal',
  upgrade: 'This needs a newer terminal-browser: run terminal-browser upgrade',
  install: 'Install terminal-browser first',
  noStart: 'terminal-browser could not start',
}

const TR: typeof EN = {
  command: 'Sağda bir tarayıcı açar',
  closed: 'Tarayıcı kapatıldı',
  alreadyClosed: 'Tarayıcı zaten kapalı',
  opened: 'Tarayıcı açıldı',
  startPage: 'Başlangıç sayfası',
  paneTitle: 'Tarayıcı',
  eyebrow: 'Tarayıcı',
  loading: 'Sayfa yükleniyor…',
  died: 'Tarayıcı kapandı',
  retry: '/browser ile yeniden dene · /browser close kapatır',
  terminalOnly: 'terminal-browser yalnızca terminalde çalışır',
  upgrade: 'Daha yeni bir terminal-browser gerekiyor: terminal-browser upgrade çalıştır',
  install: "Önce terminal-browser'ı kur",
  noStart: 'terminal-browser başlatılamadı',
}

export type Word = keyof typeof EN

export const word = (key: Word): string => pick({ en: EN, tr: TR })[key]

// The command's answer after opening: the start page by name in the sentence's own case, a real address whole.
export function openedText(url: string, isStart: boolean): string {
  const startPage = pick({ en: 'start page', tr: 'başlangıç sayfası' })

  return `${word('opened')}: ${isStart ? startPage : url}`
}

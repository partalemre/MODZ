import { pick } from './kit/lang'

// Every word the card says, in English or in Turkish (MODZ_LANG=tr). The /feedback report itself stays in
// English: it goes to Anthropic.

type Words = {
  eyebrow: string
  headline: string
  noRequest: string
  report: string
  dismiss: string
  draftTaken: string
  filled: string
}

const EN: Words = {
  eyebrow: 'Safeguards flagged this turn',
  headline: 'The model stopped on your last request',
  noRequest: 'Your last request could not be read.',
  report: 'Report a false positive',
  dismiss: 'Dismiss',
  draftTaken: 'The prompt box has a draft. Clear it, then press Report again.',
  filled: 'The report is in the prompt box. Read it, then press Enter to open /feedback.',
}

const TR: Words = {
  eyebrow: 'Güvenlik filtresi bu turu durdurdu',
  headline: 'Model son isteğinde durdu',
  noRequest: 'Son isteğin okunamadı.',
  report: 'Yanlış alarmı bildir',
  dismiss: 'Kapat',
  draftTaken: 'İstem kutusunda bir taslak var. Onu silip Bildir’e yeniden bas.',
  filled: 'Bildirim istem kutusunda. Okuyup /feedback’i açmak için Enter’a bas.',
}

export const words = (): Words => pick({ en: EN, tr: TR })

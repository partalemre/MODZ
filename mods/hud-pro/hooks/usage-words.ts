import { pick } from './lang'

// The Usage pane's pace section, its notices above the prompt and the cost's label, in English and Turkish.
// Numbers, times and window names arrive already formatted.

type FillSpec = { window: string; time: string; reset: string }

type UsageWords = {
  paceTitle: string
  rate: (window: string, percent: string, rate: string) => string
  fills: (time: string, reset: string) => string
  lasts: (reset: string) => string
  tooFew: (count: number, needed: number, minutes: number) => string
  lastTurn: (share: string, window: string) => string
  before: (shares: string) => string
  sharesNote: string
  noTurns: string
  noWindow: string
  shareNotice: (share: string, window: string, percent: string) => string
  fillNotice: (spec: FillSpec) => string
  listPrice: string
}

const EN: UsageWords = {
  paceTitle: 'Pace',
  rate: (window, percent, rate) => `${window} window ${percent} · rising ${rate} an hour`,
  fills: (time, reset) => `At this pace it fills ${time}, before it resets at ${reset}`,
  lasts: reset => `At this pace it lasts until it resets at ${reset}`,
  tooFew: (count, needed, minutes) => `Too few readings for a pace yet: ${count} of ${needed}, over at least ${minutes} min. It shows after a few turns.`,
  lastTurn: (share, window) => `Last turn used ${share} of the ${window} window`,
  before: shares => `Turns before, newest first: ${shares}`,
  sharesNote: 'A share is how far the window moved while the turn ran; other sessions on the account count too.',
  noTurns: 'Each turn’s share of the window shows here once a turn ends.',
  noWindow: 'This account reports no 5-hour or weekly limit, so there is no window to pace. Cost shows under Limits.',
  shareNotice: (share, window, percent) => `That turn used ${share} of the ${window} window (now ${percent}).`,
  fillNotice: ({ window, time, reset }) => `At this pace the ${window} window fills ${time}, before it resets at ${reset}.`,
  listPrice: 'list-price estimate',
}

const TR: UsageWords = {
  paceTitle: 'Tempo',
  rate: (window, percent, rate) => `${window} penceresi ${percent} · saatte ${rate} artıyor`,
  fills: (time, reset) => `Bu hızla ${time} dolar; sıfırlanma ${reset}`,
  lasts: reset => `Bu hızla sıfırlanmaya (${reset}) kadar yeter`,
  tooFew: (count, needed, minutes) => `Tempo için okuma az: ${needed} okumadan ${count}, en az ${minutes} dk içinde. Birkaç turdan sonra görünür.`,
  lastTurn: (share, window) => `Son tur ${window} penceresinden ${share} kullandı`,
  before: shares => `Önceki turlar, yeniden eskiye: ${shares}`,
  sharesNote: 'Pay, tur sürerken pencerenin ne kadar ilerlediğidir; hesaptaki öbür oturumlar da sayılır.',
  noTurns: 'Bir tur bitince her turun penceredeki payı burada görünür.',
  noWindow: 'Bu hesap 5 saatlik ya da haftalık limit bildirmiyor; izlenecek pencere yok. Maliyet Limitler altında.',
  shareNotice: (share, window, percent) => `Bu tur ${window} penceresinden ${share} kullandı (şimdi ${percent}).`,
  fillNotice: ({ window, time, reset }) => `Bu hızla ${window} penceresi ${time} dolar, sıfırlanmadan (${reset}) önce.`,
  listPrice: 'liste fiyatı tahmini',
}

export const usageWords = (): UsageWords => pick({ en: EN, tr: TR })

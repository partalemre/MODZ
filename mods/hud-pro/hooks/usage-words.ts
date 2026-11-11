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
  rate: (window, percent, rate) => `${window} ${percent} used · rising ${rate} an hour`,
  fills: (time, reset) => `At this pace it runs out ${time}, before it refills at ${reset}`,
  lasts: reset => `At this pace it lasts until it refills at ${reset}`,
  tooFew: (count, needed, minutes) => `Not enough measurements to tell the pace yet: ${count} of ${needed}, over at least ${minutes} min. It shows after a few turns.`,
  lastTurn: (share, window) => `Last turn used ${share} of the ${window}`,
  before: shares => `Turns before, newest first: ${shares}`,
  sharesNote: 'A share is how much of the allowance went while the turn ran; your other chats on the account count too.',
  noTurns: 'How much each turn used shows here once a turn ends.',
  noWindow: 'This account has no 5-hour or weekly allowance, so there is no pace to show. Cost shows under Limits.',
  shareNotice: (share, window, percent) => `That turn used ${share} of the ${window} (now ${percent}).`,
  fillNotice: ({ window, time, reset }) => `At this pace the ${window} runs out ${time}, before it refills at ${reset}.`,
  listPrice: 'estimate at list prices',
}

const TR: UsageWords = {
  paceTitle: 'Hız',
  rate: (window, percent, rate) => `${window} ${percent} kullanıldı · saatte ${rate} artıyor`,
  fills: (time, reset) => `Bu hızla ${time} biter; yenilenme ${reset}`,
  lasts: reset => `Bu hızla yenilenmeye (${reset}) kadar yeter`,
  tooFew: (count, needed, minutes) => `Hızı söylemek için ölçüm az: ${needed} ölçümden ${count}, en az ${minutes} dk içinde. Birkaç turdan sonra görünür.`,
  lastTurn: (share, window) => `Son tur ${window}tan ${share} kullandı`,
  before: shares => `Önceki turlar, yeniden eskiye: ${shares}`,
  sharesNote: 'Pay, tur sürerken kullanım hakkından ne kadar gittiğidir; hesaptaki öbür sohbetlerin de sayılır.',
  noTurns: 'Bir tur bitince her turun ne kadar kullandığı burada görünür.',
  noWindow: 'Bu hesapta 5 saatlik ya da haftalık kullanım hakkı yok; gösterilecek hız yok. Maliyet Limitler altında.',
  shareNotice: (share, window, percent) => `Bu tur ${window}tan ${share} kullandı (şimdi ${percent}).`,
  fillNotice: ({ window, time, reset }) => `Bu hızla ${window} ${time} biter, yenilenmeden (${reset}) önce.`,
  listPrice: 'liste fiyatıyla tahmin',
}

export const usageWords = (): UsageWords => pick({ en: EN, tr: TR })

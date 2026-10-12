import { pick } from './lang'

// Every word the budget's band rows, its card, its question and its commands show, in English and Turkish.
// Read through `words()` when drawing or answering: the language is set at session.start.

const TR = {
  // Numbers: Turkish writes "%20" and "4,50"; English "20%" and "4.50".
  percent: (value: string) => `%${value}`,
  decimal: (fixed: string) => fixed.replace('.', ','),
  fiveHour: '5s',
  etaMinutes: (minutes: number) => `bu hızla ~${minutes} dk`,
  etaHours: (hours: number, rest: number) => `bu hızla ~${hours} sa${rest === 0 ? '' : ` ${rest} dk`}`,
  usage: 'Kullanım: /budget <5s limitinin yüzdesi, ör. 20%> | <$tutar, ör. $5> | off',
  tooMuch: 'Bir 5s bütçesi en çok %100 olabilir.',
  notPositive: 'Bütçe sıfırdan büyük olmalı.',
  // The question and its options.
  stop: 'Dur',
  goOn: 'Devam et',
  header: 'Bütçe',
  question: (said: string) => `Oturum bütçesi doldu: ${said}. Yine de devam edilsin mi?`,
  // Notices and command answers.
  warned: (said: string) => `Bütçe uyarısı: ${said}`,
  stoppedNotice: (spend: string) => `Durduruldu: bütçe doldu · ${spend} · /budget ile artır`,
  dropped: (said: string) => `Oturum bütçesi doldu: ${said}. /budget ile artır ya da /budget off ile kaldır.`,
  removed: 'Oturum bütçesi kaldırıldı.',
  none: 'Oturum bütçesi yok. Kur: /budget 20% ya da /budget $5',
  status: (said: string) => `Oturum bütçesi: ${said}`,
  percentUnit: (limit: number) => `%${limit} (5 saatlik limit)`,
  waitForData: ' Sayım ilk kullanım okumasıyla başlar (5s verisi abonelik ister).',
  set: (unit: string, wait: string) => `Oturum bütçesi kuruldu: ${unit}.${wait}`,
  switched: (isOn: boolean) => `session-budget ${isOn ? 'açık' : 'kapalı'}`,
  budgetHelp: 'Oturum bütçesi kur: 5s limitinin yüzdesi ya da $tutar',
  toggleHelp: 'Bütçe uyarısı ve onayını aç/kapat',
  // The band rows and the full card.
  budget: 'Bütçe',
  rowTitle: (percent: string) => `Bütçe ${percent}`,
  raiseHint: '/budget ile artır',
  stoppedTitle: 'Durduruldu: bütçe doldu',
  eyebrow: 'Oturum bütçesi',
  full: 'Bütçe doldu',
  fullLine: (spend: string, percent: string) => `Bütçe doldu · ${spend} (${percent})`,
  held: (step: string) => `Mesajın bekletiliyor. Devam edersen bütçe ${step} artar.`,
  // A no-break space keeps the step with its verb when the line wraps.
  heldWrapped: (step: string) => `Mesajın bekletiliyor. Devam edersen bütçe ${step} artar.`,
  fullAlt: (spend: string, percent: string, step: string) => `Oturum bütçesi doldu: ${spend} · ${percent}. Mesajın bekletiliyor; devam edersen bütçe ${step} artar.`,
}

type Words = typeof TR

const EN: Words = {
  percent: value => `${value}%`,
  decimal: fixed => fixed,
  fiveHour: '5h',
  etaMinutes: minutes => `full in ≈${minutes}m at this pace`,
  etaHours: (hours, rest) => `full in ≈${hours}h${rest === 0 ? '' : ` ${rest}m`} at this pace`,
  usage: 'Usage: /budget <share of the 5h limit, e.g. 20%> | <$amount, e.g. $5> | off',
  tooMuch: 'A 5h budget can be 100% at most.',
  notPositive: 'A budget must be more than zero.',
  stop: 'Stop',
  goOn: 'Continue anyway',
  header: 'Budget',
  question: said => `Session budget is full: ${said}. Continue anyway?`,
  warned: said => `Budget warning: ${said}`,
  stoppedNotice: spend => `Stopped: budget is full · ${spend} · raise it with /budget`,
  dropped: said => `Session budget is full: ${said}. Raise it with /budget, or remove it with /budget off.`,
  removed: 'Session budget removed.',
  none: 'No session budget. Set one with /budget 20% or /budget $5',
  status: said => `Session budget: ${said}`,
  percentUnit: limit => `${limit}% of the 5-hour limit`,
  waitForData: ' Counting starts with the first usage reading (5h data needs a subscription).',
  set: (unit, wait) => `Session budget set: ${unit}.${wait}`,
  switched: isOn => `session-budget ${isOn ? 'on' : 'off'}`,
  budgetHelp: 'Set a session budget: a share of the 5h limit, or a dollar amount',
  toggleHelp: 'Turn the budget warning and check on or off',
  budget: 'Budget',
  rowTitle: percent => `Budget ${percent}`,
  raiseHint: 'raise it with /budget',
  stoppedTitle: 'Stopped: budget is full',
  eyebrow: 'Session budget',
  full: 'Budget is full',
  fullLine: (spend, percent) => `Budget is full · ${spend} (${percent})`,
  held: step => `Your message is on hold. Continuing raises the budget by ${step}.`,
  heldWrapped: step => `Your message is on hold. Continuing raises the budget by ${step}.`,
  fullAlt: (spend, percent, step) => `Session budget is full: ${spend} · ${percent}. Your message is on hold; continuing raises the budget by ${step}.`,
}

export const words = (): Words => pick({ en: EN, tr: TR })

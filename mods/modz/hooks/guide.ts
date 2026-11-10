// One index of what a person can do with the mods: each installed mod's slash commands (as the engine lists them,
// so a command a mod adds tomorrow is here without a table to keep) and where its settings are (the options its
// manifest declares, set under /plugin), and for a mod that is not installed the exact line that installs it.
// Pure: register.tsx hands in the engine's command list.
import type { Market, ModInfo } from './catalog'
import { catalogWords, hubWords } from './words'

// A slash command as `$.command.list()` gives it; `plugin` may carry its marketplace ("hud-pro@modz").
export type Command = { name: string; description: string; source?: string; plugin?: string }

export type ModGuide = { mod: string; commands: Array<{ name: string; description: string }>; options: string[] }

export type Install = { mod: string; summary: string; command: string }

// The set a new person is offered first, in this order; the rest follow as the catalog lists them.
export const CORE = ['modz', 'savvy-progress', 'plan-steps', 'filetree', 'blast-radius', 'secret-guard', 'checkpoint', 'hud-pro']

const ownerOf = (command: Command): string | undefined => command.plugin?.split('@')[0]

// The installed mods that have something to run or to set, in the catalog's order.
export function guideOf(market: Market, commands: readonly Command[]): ModGuide[] {
  return market.mods
    .filter(mod => mod.isEnabled === true)
    .map(mod => ({
      mod: mod.name,
      commands: commands.filter(command => ownerOf(command) === mod.name).map(({ name, description }) => ({ name, description })),
      options: mod.options,
    }))
    .filter(guide => guide.commands.length > 0 || guide.options.length > 0)
}

const coreRank = (mod: ModInfo): number => (CORE.includes(mod.name) ? CORE.indexOf(mod.name) : CORE.length)

// A mod nobody says is on is not installed (a switched-off one is, and a broken entry cannot be). Core set first.
export function installsOf(market: Market): Install[] {
  return market.mods
    .filter(mod => mod.isEnabled === null && mod.isHealthy)
    .sort((a, b) => coreRank(a) - coreRank(b))
    .map(mod => ({ mod: mod.name, summary: mod.description, command: `/plugin install ${mod.name}@${market.name}` }))
}

export const commandsLine = (guide: ModGuide): string => guide.commands.map(command => `/${command.name}`).join(' · ')

function guideLines(guide: ModGuide): string[] {
  const commands = guide.commands.map(command => `  /${command.name}: ${command.description}`)
  const options = guide.options.length === 0 ? [] : [`  ${catalogWords().options(guide.options.join(', '))}`]

  return [guide.mod, ...commands, ...options]
}

// What `/modz help` prints: every installed mod's commands and options, then the lines that install the rest.
export function helpText(market: Market, commands: readonly Command[]): string {
  const words = hubWords()
  const guides = guideOf(market, commands)
  const installs = installsOf(market)
  const body = guides.length === 0 ? [words.helpNone] : guides.flatMap(guideLines)
  const rest = installs.length === 0 ? [] : ['', words.helpInstall, ...installs.map(install => `  ${install.command}`)]

  return [words.helpTitle, words.helpHub, '', ...body, ...rest].join('\n')
}

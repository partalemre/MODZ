import type { CommandSpec } from 'claude-code'

import { rowReply, runSkinCommand } from './command'
import { skinNames } from './custom'
import { commit, isFolderWord, runFolderCommand } from './prefs-store'
import type { PrefsHost } from './prefs-store'

// What /skin registers as: the settings alone, or a skin, a folder word or a switch by name.
export const SKIN_COMMAND: CommandSpec = {
  name: 'skin',
  description: 'Skin ayarlarını aç ya da /skin <ad | list | off>',
  argumentHint: '[gallery | name | list | off | pin | unpin | share | rail | tables | shimmer | band | clip | icons]',
  immediate: true,
}

// The /skin command's reach, bound in register.tsx: the prefs store, the panes it opens,
// toasts, and the width the last reply was drawn at.
export type SkinCommandHost = PrefsHost & {
  openSettings(): Promise<void>
  openGallery(): Promise<unknown>
  toast(text: string): void
  columns(): number | undefined
}

// /skin alone opens the settings, `gallery` the gallery; a folder word pins or shares.
async function runSkinWord(host: SkinCommandHost, word: string): Promise<boolean> {
  if (word === '') {
    await host.openSettings()
  } else if (word === 'gallery') {
    await host.openGallery()
  } else if (isFolderWord(word)) {
    host.toast(await runFolderCommand(host, word))
  }

  return word === '' || word === 'gallery' || isFolderWord(word)
}

export async function runSkin(host: SkinCommandHost, args: string): Promise<{ text?: string }> {
  if (await runSkinWord(host, args.trim().toLowerCase())) {
    return {}
  }

  const current = await host.prefs()
  const custom = await host.custom()
  const outcome = runSkinCommand(args, current, skinNames(custom))

  if (outcome.prefs !== current) {
    await commit(host, { prefs: outcome.prefs, custom })
  }

  if (outcome.channel === 'row') {
    return { text: rowReply(outcome.message, { args, isPinned: await host.isPinned(), columns: host.columns() }) }
  }

  host.toast(outcome.message)

  return {}
}

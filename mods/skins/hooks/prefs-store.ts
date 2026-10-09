import type { CustomSkin, HubCard, Prefs } from '../types'
import { parsePrefs } from './command'
import { buildCustom, resolveSkin, skinNames } from './custom'
import type { DesignState } from './designer'
import { parseFolders, prefsFor, withFolder, withoutFolder } from './folders'
import { HUB_PANE, hubDetail } from './hub'
import { forTheme } from './light'
import type { Active } from './look'
import { BAND_OFF_KEY, bandOffWrites } from './migrate'

// The engine's reach, bound in register.tsx: the engine follows `$` only into functions of
// the hooks module's own file, so the prefs' load and save get this port instead.
export type PrefsHost = {
  storeGet(key: string): Promise<unknown>
  storeSet(key: string, value: unknown): Promise<void>
  cwd(): Promise<string>
  now(): Promise<number>
  prefs(): Promise<Prefs>
  setPrefs(prefs: Prefs): Promise<unknown>
  custom(): Promise<Record<string, CustomSkin>>
  setCustom(custom: Record<string, CustomSkin>): Promise<unknown>
  isPinned(): Promise<boolean>
  setPinned(isPinned: boolean): Promise<unknown>
  isLight(): Promise<boolean>
  hub(): Promise<HubCard>
  setHub(card: HubCard): Promise<unknown>
}

// The skin the prefs pick, drawn for the background in use; null while skins are off.
export async function activeSkin(host: PrefsHost): Promise<Active | null> {
  const prefs = await host.prefs()
  const custom = await host.custom()
  const skin = resolveSkin(prefs.skin, custom)

  return skin === undefined ? null : { prefs, skin: forTheme(skin, await host.isLight()), custom }
}

// Made skins from the store, each checked again: the store may hold an older shape.
function parseCustom(raw: unknown): Record<string, CustomSkin> {
  const saved = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}

  return Object.fromEntries(
    Object.values(saved)
      .map(draft => buildCustom(draft as Record<string, unknown>, undefined))
      .filter((skin): skin is CustomSkin => typeof skin !== 'string')
      .map(skin => [skin.name, skin]),
  )
}

// Once: older versions stored the band on only because it was the default.
async function migrateBandOff(host: PrefsHost): Promise<void> {
  const writes = bandOffWrites(await host.storeGet(BAND_OFF_KEY), await host.storeGet('prefs'), await host.storeGet('folders'))

  for (const [key, value] of writes) {
    await host.storeSet(key, value)
  }
}

export async function load(host: PrefsHost): Promise<void> {
  await migrateBandOff(host)
  const custom = parseCustom(await host.storeGet('custom'))
  const names = skinNames(custom)
  const folders = parseFolders(await host.storeGet('folders'), names)
  const folder = await host.cwd()
  const prefs = prefsFor(folder, folders, parsePrefs(await host.storeGet('prefs'), names))

  await host.setCustom(custom)
  await host.setPrefs(prefs)
  await host.setPinned(Object.hasOwn(folders, folder))
}

// A pinned folder keeps its prefs to itself; every other folder shares the default.
async function savePrefs(host: PrefsHost, prefs: Prefs): Promise<void> {
  if (!(await host.isPinned())) {
    await host.storeSet('prefs', prefs)

    return
  }

  const names = skinNames(await host.custom())
  const folders = parseFolders(await host.storeGet('folders'), names)
  await host.storeSet('folders', withFolder(folders, await host.cwd(), prefs))
}

export async function commit(host: PrefsHost, state: DesignState): Promise<void> {
  await host.setCustom(state.custom)
  await host.setPrefs(state.prefs)
  await host.storeSet('custom', state.custom)
  await savePrefs(host, state.prefs)
  await syncHub(host)
}

// The MODZ card, written whenever the skin or the theme may have changed; a same text is not
// written again.
export async function syncHub(host: PrefsHost): Promise<void> {
  const detail = hubDetail((await host.prefs()).skin, await host.isLight())
  if ((await host.hub()).detail === detail) return
  const at = await host.now()
  await host.setHub({ pane: HUB_PANE, detail, tone: 'idle', at })
}

const FOLDER_WORDS = new Set(['pin', 'unpin', 'share'])

export const isFolderWord = (word: string): boolean => FOLDER_WORDS.has(word)

// /skin pin, unpin and share: this folder's own look, or the default.
export async function runFolderCommand(host: PrefsHost, word: string): Promise<string> {
  const folder = await host.cwd()
  const custom = await host.custom()
  const names = skinNames(custom)
  const folders = parseFolders(await host.storeGet('folders'), names)
  const prefs = await host.prefs()

  switch (word) {
    case 'pin':
      await host.storeSet('folders', withFolder(folders, folder, prefs))
      await host.setPinned(true)

      return 'bu klasör kendi görünümünü korur'
    case 'unpin': {
      const fallback = parsePrefs(await host.storeGet('prefs'), names)
      await host.storeSet('folders', withoutFolder(folders, folder))
      await host.setPinned(false)
      await host.setPrefs(fallback)
      await syncHub(host)

      return `bu klasör varsayılanı izler: ${fallback.skin}`
    }
    default:
      await host.storeSet('prefs', prefs)

      return `varsayılan görünüm: ${prefs.skin}`
  }
}

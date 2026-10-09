type ReadFile = (path: string) => Promise<unknown>

export type ModInfo = { name: string; version: string; description: string }

type Entry = { name: string; source: string }

// The mod is read from MODZ/mods/modz, so the marketplace sits two levels up.
export function marketRoot(pluginRoot: string): string {
  return pluginRoot.replace(/\/mods\/[^/]+\/?$/, '')
}

async function readJson<T>(read: ReadFile, path: string): Promise<T | undefined> {
  try {
    return JSON.parse(String(await read(path))) as T
  } catch {
    return undefined
  }
}

export async function loadCatalog(read: ReadFile, root: string): Promise<ModInfo[]> {
  const market = await readJson<{ plugins?: Entry[] }>(read, `${root}/.claude-plugin/marketplace.json`)
  const entries = market?.plugins ?? []

  return Promise.all(
    entries.map(async entry => {
      const dir = `${root}/${entry.source.replace(/^\.\//, '')}`
      const manifest = await readJson<Partial<ModInfo>>(read, `${dir}/.claude-plugin/plugin.json`)

      return {
        name: entry.name,
        version: manifest?.version ?? '?',
        description: manifest?.description ?? 'plugin.json okunamadı',
      }
    }),
  )
}

// Loads the look again for each new session. /clear, /resume and /branch reset $.state to its defaults and skip
// session.start, and on a Team or Enterprise plan the built-in guard (cc-plugin-sec-default) keeps
// classic.SessionStart from user-tier mods: the new session's first turn catches the change instead.

// The engine's reach, bound in register.tsx. `id` is undefined where nothing answers (a test's engine).
export type SessionHost = {
  id(): Promise<string | undefined>
  load(): Promise<void>
  theme(): Promise<void>
  log(text: string): void
}

export type SessionLoad = {
  // session.start and classic.SessionStart: loads for `known`, the hook's own session id when it has one
  // (on /resume, the engine can still answer the old one), else the engine's.
  start(host: SessionHost, known?: string): Promise<void>
  // A turn's start: loads again only when the session's id moved; reads a theme that could not be read yet.
  turn(host: SessionHost): Promise<void>
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

export function sessionLoad(): SessionLoad {
  let loadedFor: string | undefined
  // Before Claude Code binds a resumed session, $.config.list rejects while the prefs already load (#64, #77).
  let isThemePending = false

  async function retryTheme(host: SessionHost): Promise<void> {
    if (!isThemePending) return
    isThemePending = false
    await host.theme().catch((error: unknown) => {
      isThemePending = true
      host.log(`skins: theme not read yet: ${messageOf(error)}`)
    })
  }

  async function loadFor(host: SessionHost, id: string | undefined): Promise<void> {
    loadedFor = id
    try {
      await host.load()
    } catch (error) {
      if (loadedFor === id) loadedFor = undefined
      host.log(`skins: not loaded yet: ${messageOf(error)}`)

      return
    }
    // The prefs stand without the theme; only the theme waits for the bind.
    isThemePending = true
    await retryTheme(host)
  }

  return {
    start: async (host, known) => loadFor(host, known ?? (await host.id())),
    turn: async host => {
      const id = await host.id()
      // No await between the check and the write, so starts that overlap load once.
      if (id !== undefined && id !== loadedFor) return loadFor(host, id)
      await retryTheme(host)
    },
  }
}

// $.tool.register waits up to 8 s for the tool to be listed, never so under an allowlist that leaves it out (--agent).
export const DESIGN_WAIT_MS = 1000

// Waits for `work` or `ms`, whichever ends first; the timer is cancelled when the work wins.
export function waitAtMost(work: Promise<unknown>, ms: number, after: (ms: number, fn: () => void) => { cancel(): void }): Promise<void> {
  return new Promise<void>(resolve => {
    const cap = after(ms, resolve)
    void work.then(() => {
      cap.cancel()
      resolve()
    })
  })
}

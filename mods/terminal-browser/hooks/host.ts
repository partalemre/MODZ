import type { EngineInterface } from 'claude-code'

// The engine's reach, bound in register.tsx: the engine follows `$` only into functions of the hooks module's own
// file, so the bridge, watcher and pane modules get this port instead.
export type Host = {
  root: string
  exists(path: string): Promise<boolean>
  run: EngineInterface['process']['run']
  fetch: EngineInterface['http']['fetch']
  sleep(ms: number): Promise<void>
  log: EngineInterface['ui']['log']
  redraw(): void
  open: EngineInterface['ui']['open']
  close: EngineInterface['ui']['close']
  blit: EngineInterface['ui']['blit']
  fill: EngineInterface['prompt']['fill']
}

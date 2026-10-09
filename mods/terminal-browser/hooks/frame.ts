import type { Frame } from './bridge-protocol'
import { MAX_IMAGE_CELLS } from './surface'
import { state, type Grid } from './session'

// Until the first frame: the address on its way, or the bridge's own reason it stopped.
export function paneStatus() {
  const last = state.last
  return { url: state.requestedUrl ?? last?.url ?? null, error: last?.error ?? null, isAlive: last === null ? null : last.alive }
}

export function imageSource(frame: Frame) {
  return { shm: frame.shm, format: frame.format, width: frame.width, height: frame.height, generation: frame.generation }
}

export function imageGrid(frame: Frame, cols: number, rows: number): Grid {
  return {
    cols: Math.max(1, Math.min(frame.cols, cols, MAX_IMAGE_CELLS)),
    rows: Math.max(1, Math.min(frame.rows, rows, MAX_IMAGE_CELLS)),
  }
}

export function fitsMounted(frame: Frame): boolean {
  const mounted = state.mounted
  if (!mounted || !state.region) return false
  const grid = imageGrid(frame, state.region.cols, state.region.rows)
  return grid.cols === mounted.cols && grid.rows === mounted.rows
}

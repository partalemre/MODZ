// The desktop pane's drawing width in pixels, from the cells the pane reports.
const PX_PER_COLUMN = 8
const WIDTH_MIN = 320
const WIDTH_MAX = 900

export function paneWidth(columns: number): number {
  return Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, columns * PX_PER_COLUMN - PX_PER_COLUMN))
}

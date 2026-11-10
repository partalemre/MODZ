import { paneKept } from './kit/pane-keep'

// What this engine knows of the Agents pane (band.tsx, pane.tsx; kit/pane-keep.tsx): whether it opened, closed or saw
// it, and whether the pane still waits for a good draw.
export const paneHeld = paneKept()

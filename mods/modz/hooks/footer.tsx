// The MODZ toggle in the prompt footer (DESIGN.md §9). On the desktop the dim mode labels at the right of the
// footer gain a "MODZ" control that works as the app's own session-rail toggle does: a press puts the hub in the
// panel (or brings it back on stage), and takes it away when one of the hub's panes is the one shown. It opens
// without asking for the keyboard, so the composer keeps it. The engine's labels stay, in its order and joint.
import type { UiPane } from 'claude-code'

import { MODS_PANE } from './hub'
import { HUB_PANE } from './kit/stage'

type Ui = Record<string, any>

export const TOGGLE_KEY = 'modz-toggle'
const TOGGLE_LABEL = 'MODZ'
// The engine's own joint between footer labels.
const JOINT = ' & '
const HUB_PANES = new Set<string>([HUB_PANE, MODS_PANE])

export type FooterView = { modes: readonly string[]; onPress: () => void }

export function footerTree(ui: Ui, view: FooterView) {
  const { Box, Text, Button } = ui
  const labels = view.modes.length > 0 ? [<Text dimColor>{view.modes.join(JOINT)}</Text>] : []

  return (
    <Box flexDirection="row" alignItems="center" gap={1}>
      {...labels}
      <Button key={TOGGLE_KEY} label={TOGGLE_LABEL} plain dimColor onPress={view.onPress} />
    </Box>
  )
}

// Whether one of the hub's own panes is the one the panel shows now, from `$.ui.panes()`.
export const isHubShown = (panes: readonly UiPane[]): boolean => panes.some(pane => pane.isShown && HUB_PANES.has(pane.id))

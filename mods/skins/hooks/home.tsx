// MODZ kit — the way back to the hub from a mod's pane (DESIGN.md §9). While the hub runs it keeps
// `{ plugin: 'modz', key: 'isOn' }` true; a pane then draws `HomeButton` first, and its press writes the mod's
// own `{ plugin: '<mod>', key: 'home' }` value (`{ at }`). The hub hears it, comes forward, and opens again if
// it was closed, so the person always has a way back, even with one pane left and no tab to click.

// The resolved element table of the surface that draws the pane.
type Table = Record<string, any>

export const HOME_LABEL = '← MODZ'

export function HomeButton(ui: Table, onPress: () => void) {
  const { Box, Button } = ui

  return (
    <Box key="modz-home-row" flexDirection="row">
      <Button key="modz-home" label={HOME_LABEL} variant="secondary" onPress={onPress} />
    </Box>
  )
}

// The pane's tree with the way back above it; null while the hub is off draws the pane as it is.
export function withHome<T>(ui: Table, tree: T, onHome: (() => void) | null) {
  if (onHome === null) return tree
  const { Box } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      {HomeButton(ui, onHome)}
      {tree}
    </Box>
  )
}

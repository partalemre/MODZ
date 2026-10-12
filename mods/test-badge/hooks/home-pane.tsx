import { HomeButton } from './home'

// The resolved element table of the surface that draws the tree.
type Ui = Record<string, any>

// The way back to the MODZ hub above the whole pane; null while the hub is off draws the pane as it is.
export function withHome<T>(ui: Ui, tree: T, onHome: (() => void) | null) {
  if (onHome === null) return tree
  const { Box } = ui

  return (
    <Box flexDirection="column" rowGap={1}>
      {HomeButton(ui, onHome)}
      {tree}
    </Box>
  )
}

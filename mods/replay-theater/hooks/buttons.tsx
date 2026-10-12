import type { Ui } from './offer'
import type { PaneModel } from './pane-svg'
import { words } from './words'

export type PaneHandlers = { onPrev: () => void; onNext: () => void; onClose: () => void }

export function buttons(ui: Ui, model: PaneModel, on: PaneHandlers) {
  const { Box, Button } = ui
  const isFirst = model.index === 0
  const isLast = model.index >= model.steps.length - 1
  const w = words()

  return (
    <Box key="rt-buttons" flexDirection="row" columnGap={2} alignItems="center">
      <Button key="rt-prev" variant="secondary" hotkey="p" label={w.prev} dimColor={isFirst} onPress={on.onPrev} />
      <Button key="rt-next" variant="primary" hotkey="n" label={isLast ? w.finish : w.next} autoFocus onPress={isLast ? on.onClose : on.onNext} />
      <Box flexGrow={1} />
      <Button key="rt-close" plain hotkey="c" label={w.close} onPress={on.onClose} />
    </Box>
  )
}

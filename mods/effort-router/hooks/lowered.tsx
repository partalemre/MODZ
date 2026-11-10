// The band row after a lowered turn: what it went at against the person's own setting, and a button that sends
// the same prompt again at that setting. Below the other plugins' rows, next to the prompt. Pure: no `$`.
import type { RenderElement } from 'claude-code'

import type { StepEffort } from '../types'
import type { Ui } from './kit/ui'
import { words } from './words'

export type Lowered = { turnId: string; text: string; asked: StepEffort | undefined; sent: StepEffort | undefined }

export function loweredRow(ui: Ui, row: { theirs: RenderElement; lowered: Lowered; resend: () => void }): RenderElement {
  const { Box, Button, Text } = ui
  const asked = String(row.lowered.asked)
  const said = words()

  return (
    <Box flexDirection="column">
      {row.theirs}
      <Box flexDirection="row" columnGap={1} alignItems="center">
        <Text dimColor wrap="truncate-end">{said.loweredBand(String(row.lowered.sent), asked)}</Text>
        <Button key="effort-router:resend" label={said.resend(asked)} variant="secondary" onPress={row.resend} />
      </Box>
    </Box>
  )
}

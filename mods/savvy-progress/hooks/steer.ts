import type { ToolCallResult } from 'claude-code'

import { t } from './i18n'

// Talking to a running agent and stopping it, from its open card: the words and types only.
// The calls stay with `$` in pane.tsx (the validator follows `$` into functions of one file).

// The tool noun narrowed to this one call: checked against every tool's schema, the call is too deep for tsc.
export type StopNoun = { tool: { call: (input: { tool: 'TaskStop'; task_id: string }) => Promise<ToolCallResult> } }

export const deliveryText = (result: { isDelivered: boolean; reason?: string }): string =>
  result.isDelivered ? t().delivered : t().notDelivered(result.reason ?? '')

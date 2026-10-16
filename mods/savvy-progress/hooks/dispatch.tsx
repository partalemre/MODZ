import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AgentType, Draft } from '../types'
import { BUILTIN_TYPES, chosenOf, describe, mergeTypes, offered, sourceWord } from './agent-types'
import { sectionSvg, SECTION_SVG_H } from './card-svg'
import { t } from './i18n'
import { upper } from './lang'
import { picture } from './pane-motion'
import type { Ui } from './rows'
import type { Layout, PaneHandlers } from './sections'

// "Yeni görev": pick an agent type, describe the task, start it. This file draws the form and keeps
// the catalogue's live source; the start (`$.agent.spawn`) is in pane.tsx and the agent files are
// read in register.tsx, since the engine follows `$` only into functions of the hook's own file.

// State refs live in each file that reads them: the scan follows literals, not imports.
const types = atom({ plugin: 'savvy-progress', key: 'types' } as const, BUILTIN_TYPES)

type On = Parameters<Register>[0]

export type DraftView = { draft: Draft | undefined; types: AgentType[]; layout: Layout }

function draftHead(ui: Ui, layout: Layout) {
  const { Text } = ui
  const label = t().newTask
  if (!layout.isDesktop) return <Text bold color="permission">{`● ${upper(label)}`}</Text>
  return picture(ui, { key: 'draft-head', at: 'draft-head', pic: { source: sectionSvg(layout.inner, { label, dot: 'run' }), alt: label, width: layout.inner, height: SECTION_SVG_H } })
}

/** The form: a type picker with what the type does, the task field, a refusal if one came, "Vazgeç". */
export function draftTree(ui: Ui, view: DraftView, on: PaneHandlers) {
  const { Box, Button, Input, Select, Text } = ui
  const s = t()
  const chosen = chosenOf(view.types, view.draft)
  const frame = view.layout.isDesktop ? { borderStyle: 'round', paddingX: 2, paddingY: 1 } : {}
  return (
    <Box key="draft" flexDirection="column" rowGap={1} {...frame}>
      {draftHead(ui, view.layout)}
      {!chosen && <Text dimColor>{s.noTypes}</Text>}
      {chosen && Select && <Select key="dispatch-type" label={s.agentLabel} options={view.types.map(type => ({ value: type.name, label: type.name }))} value={chosen.name} onSelect={on.onPickType} />}
      {chosen && <Text dimColor wrap="truncate-end">{`${sourceWord(chosen.source)} · ${describe(chosen)}`}</Text>}
      {chosen && Input && <Input key="dispatch-task" label={s.taskLabel} placeholder={s.taskHint} value="" submitLabel={s.start} autoFocus onSubmit={on.onStartTask} />}
      {view.draft?.notice && <Text color="warning">{view.draft.notice}</Text>}
      <Box flexDirection="row"><Button key="dispatch-cancel" plain dimColor label={s.cancel} onPress={on.onCancelTask} /></Box>
    </Box>
  )
}

// The catalogue's live source: every type the engine offers the model.
export function onDispatch(on: On): void {
  on('agent.offer', async ($, e, next) => {
    const answer = await next(e)
    const type = offered(e)
    if (!(await read($, types)).some(known => known.name === type.name)) await update($, types, current => mergeTypes(current, [type]))
    return answer
  }).catch(($, e, next) => next(e))
}

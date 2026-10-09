// The Gönder tab, the same on both surfaces: pick an agent type, describe the work, send it.
import { shortText } from './format'
import { colorOf, faceOf } from './insight'
import { ROW_MIN_TEXT, sourceName, teamTree } from './rows'
import type { DeckHandlers, DeckView, Ui } from './rows'

export function dispatchTree(ui: Ui, view: DeckView, handlers: DeckHandlers) {
  const { Box, Text, Select, Input } = ui
  const chosen = view.types.find(type => type.name === view.draftType) ?? view.types[0]
  if (chosen === undefined) return <Text dimColor>Henüz bilinen ajan türü yok.</Text>
  const options = view.types.map(type => ({ value: type.name, label: type.name }))

  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="column">
        <Box flexDirection="row" columnGap={1}>
          <Text color={colorOf(chosen.name)}>{faceOf(chosen.name)}</Text>
          <Text bold>{chosen.name}</Text>
          <Text dimColor>{sourceName(chosen.source)}</Text>
        </Box>
        <Text dimColor wrap="truncate">{shortText(chosen.description === '' ? 'Açıklama yok.' : chosen.description, Math.max(ROW_MIN_TEXT, view.columns - 4))}</Text>
      </Box>
      <Select key="type" label="Ajan" options={options} value={chosen.name} onSelect={handlers.onType} />
      <Input key="task" label="Görev" placeholder="İşi anlat, Enter gönderir" value="" submitLabel="gönder" autoFocus onSubmit={handlers.onDispatch} />
      {view.notice !== null && <Text color="warning">{view.notice}</Text>}
      {teamTree(ui, view, handlers)}
    </Box>
  )
}

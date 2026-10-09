import type { ElementTable, RenderElement } from 'claude-code'

import type { SkinSlot } from '../types'
import type { ToggleWord } from './command'
import { SLOTS } from './custom'
import type { Table } from './markdown'
import { footerRow, groupRow, promptRow, tableRows, toolRow } from './rows'
import type { Look } from './rows'

export type PaneUi = Pick<ElementTable<'terminal' | 'desktop'>, 'Box' | 'Text' | 'Markdown' | 'Button' | 'Input' | 'Select'>

export type SettingsModel = {
  names: readonly string[]
  editing: SkinSlot
  width: number
}

export type SettingsActions = {
  pick: (name: string) => void
  toggle: (word: ToggleWord) => void
  icons: () => void
  edit: (slot: SkinSlot) => void
  paint: (hex: string) => void
}

const SAMPLE: Table = {
  kind: 'table',
  header: ['Route', 'Limit', 'Window'],
  align: ['left', 'right', 'left'],
  rows: [
    ['/chat', '60', '1 min'],
    ['/upload', '10', '1 min'],
    ['/search', '120', '1 min'],
  ],
}

const done = { isRunning: false, isErrored: false, isInterrupted: false }

// A turn as the skin would draw it, built from the same rows the transcript uses.
function preview(look: Look, width: number) {
  const { Box } = look.ui
  const word = look.skin.done[0] ?? 'Done'

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={look.skin.palette.muted} paddingX={1}>
      {promptRow(look, "hub api'ye hız sınırı ekle")}
      {toolRow(look, { tool: 'Bash', input: {}, ...done }, 'run', 'pnpm test', { ms: 2140 })}
      {toolRow(look, { tool: 'Edit', input: {}, ...done }, 'write', 'src/server.ts', {
        ms: 380,
        added: 18,
        removed: 3,
      })}
      {groupRow(look, [
        { tool: 'Read', input: {}, ...done },
        { tool: 'Read', input: {}, ...done },
        { tool: 'Grep', input: {}, ...done },
      ])}
      {tableRows(look, SAMPLE, Math.max(20, width - 4))}
      {footerRow(look, word, 41_000, { tools: 6, added: 18, removed: 3 })}
    </Box>
  )
}

const mark = (on: boolean): string => (on ? '●' : '○')

// Each part of the pane opens with its own heading line, so a narrow side panel wraps the
// buttons under it instead of beside a label.
function section(look: Look, title: string, body: RenderElement) {
  const { Box, Text } = look.ui

  return (
    <Box key={`section-${title}`} flexDirection="column">
      <Text color={look.skin.palette.muted} bold>
        {title}
      </Text>
      {body}
    </Box>
  )
}

// What each toggle reads as in the pane; /skin keeps the English words.
const TOGGLE_LABELS: Readonly<Record<ToggleWord, string>> = {
  rail: 'ray',
  tables: 'tablolar',
  shimmer: 'parıltı',
  band: 'kullanım bandı',
  clip: 'çıktı kırp',
}

type Parts = { look: Look; ui: PaneUi; model: SettingsModel; actions: SettingsActions }

function skinButtons({ look, ui, model, actions }: Parts) {
  const { Box, Button } = ui

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      {model.names.map((name, i) => (
        <Button
          key={`skin-${name}`}
          label={name === look.prefs.skin ? `${name} ●` : name}
          plain
          dimColor={name !== look.prefs.skin}
          onPress={() => actions.pick(name)}
          {...(i < 9 ? { hotkey: String(i + 1) } : {})}
        />
      ))}
    </Box>
  )
}

function optionButtons({ look, ui, actions }: Parts) {
  const { Box, Button } = ui
  const { prefs } = look
  const toggle = (word: ToggleWord, hotkey: string, on: boolean) => (
    <Button
      key={`toggle-${word}`}
      label={`${TOGGLE_LABELS[word]} ${mark(on)}`}
      hotkey={hotkey}
      plain
      dimColor={!on}
      onPress={() => actions.toggle(word)}
    />
  )

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      {toggle('rail', 'r', prefs.rail)}
      {toggle('tables', 't', prefs.tables)}
      {toggle('shimmer', 's', prefs.shimmer)}
      {toggle('band', 'b', prefs.band)}
      {toggle('clip', 'c', prefs.clipOutput)}
      <Button key="icons" label={`ikonlar ${prefs.icons}`} hotkey="i" plain onPress={() => actions.icons()} />
    </Box>
  )
}

// The swatches wrap as whole "■ name" pairs; the slot picker and the hex field wrap under
// each other when the panel is too narrow for both.
function colorControls({ look, ui, model, actions }: Parts) {
  const { Box, Text, Input, Select } = ui
  const { palette } = look.skin

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {SLOTS.map(slot => (
          <Text key={`swatch-${slot}`}>
            <Text backgroundColor={palette[slot]}>{'  '}</Text>
            <Text color={slot === model.editing ? palette.fg : palette.muted} bold={slot === model.editing}>
              {` ${slot}`}
            </Text>
          </Text>
        ))}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" columnGap={2} rowGap={1} marginTop={1}>
        <Select
          key="slot"
          label="Renk"
          value={model.editing}
          options={SLOTS.map(slot => ({ value: slot, label: slot }))}
          onSelect={(value: string) => actions.edit(value as SkinSlot)}
        />
        <Input
          key="hex"
          label={palette[model.editing]}
          placeholder="#rrggbb"
          value=""
          submitLabel="boya"
          onSubmit={(value: string) => actions.paint(value.trim())}
        />
      </Box>
    </Box>
  )
}

export function settingsPane(look: Look, ui: PaneUi, model: SettingsModel, actions: SettingsActions) {
  const { Box, Text } = ui
  const { palette } = look.skin
  const parts: Parts = { look, ui, model, actions }

  return (
    <Box flexDirection="column" rowGap={1}>
      {section(look, 'Skin', skinButtons(parts))}
      {preview(look, model.width)}
      {section(look, 'Seçenekler', optionButtons(parts))}
      {section(look, 'Renkler', colorControls(parts))}
      <Text color={palette.muted}>
        Ya da Claude'a sor: <Text color={palette.fg}>“gün batımı gibi hissettiren bir skin yap”</Text>. Esc kapatır.
      </Text>
    </Box>
  )
}

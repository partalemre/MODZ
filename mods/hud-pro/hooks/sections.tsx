import type { Ui } from './line'
import { terminalColor } from './theme'
import type { UsageSection } from '../types'

// The Usage pane's sections below Limits: Pace (this mod's own) and whatever session-budget, cache-tax and
// effort-router publish. The same Box/Text tree on both surfaces: a title in its tone, the lines dim, the buttons.

export type SectionsView = { sections: readonly UsageSection[]; press: (section: string, action: string) => void }

// The order the pane lists them in, whatever order they reported in; a section this mod does not know goes last.
const ORDER = ['pace', 'budget', 'cache', 'effort']

const rankOf = (section: UsageSection): number => {
  const rank = ORDER.indexOf(section.id)

  return rank === -1 ? ORDER.length : rank
}

const TONES: readonly unknown[] = ['neutral', 'warn', 'danger']
const isText = (value: unknown): value is string => typeof value === 'string'

// Another mod's value, checked before it is drawn: a title, lines of text, a known tone, and buttons with labels.
export function isSection(value: unknown): value is UsageSection {
  if (typeof value !== 'object' || value === null) return false
  const section = value as Partial<Record<keyof UsageSection, unknown>>
  const actions = section.actions ?? []
  const isAction = (action: unknown) => typeof action === 'object' && action !== null && isText((action as { id?: unknown }).id) && isText((action as { label?: unknown }).label)

  return isText(section.id) && isText(section.title) && Array.isArray(section.lines) && section.lines.every(isText) && TONES.includes(section.tone) && Array.isArray(actions) && actions.every(isAction)
}

export const ordered =(sections: readonly UsageSection[]): UsageSection[] => [...sections].sort((a, b) => rankOf(a) - rankOf(b))

function actionsRow(ui: Ui, section: UsageSection, press: SectionsView['press']) {
  const { Box, Button } = ui
  const actions = section.actions ?? []
  if (actions.length === 0) return null

  return (
    <Box key={`usage-${section.id}-actions`} flexDirection="row" columnGap={1} marginTop={1}>
      {actions.map(action => (
        <Button
          key={`usage-${section.id}-${action.id}`}
          label={action.label}
          variant={action.isOn === true ? 'primary' : 'secondary'}
          onPress={() => press(section.id, action.id)}
        />
      ))}
    </Box>
  )
}

export function sectionTree(ui: Ui, section: UsageSection, press: SectionsView['press']) {
  const { Box, Text } = ui
  const color = terminalColor(section.tone)

  return (
    <Box key={`usage-${section.id}`} flexDirection="column" marginTop={1}>
      {color === undefined ? <Text bold>{section.title}</Text> : <Text bold color={color}>{section.title}</Text>}
      {section.lines.map((line, index) => (
        <Text key={`usage-${section.id}-${index}`} dimColor={section.isEmpty === true || index > 0} wrap="wrap">
          {line}
        </Text>
      ))}
      {actionsRow(ui, section, press)}
    </Box>
  )
}

export function sectionsTree(ui: Ui, view: SectionsView) {
  const { Box } = ui

  return <Box flexDirection="column">{ordered(view.sections).map(section => sectionTree(ui, section, view.press))}</Box>
}

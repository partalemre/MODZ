/* @jsx h */
// What the pane says while it has no picture yet: the page it is loading, or why it stopped.
// The browser's own picture covers this as soon as the first frame lands.
import type { ElementTable } from 'claude-code'

type Ui = Pick<ElementTable<'terminal'>, 'Box' | 'Text'>

export type PaneStatus = { url: string | null; error: string | null; isAlive: boolean | null }

const START_URL = 'terminal-browser://start'

// The start page has no address worth showing; a real one is shown whole.
function shownUrl(url: string | null): string {
  return url === null || url === START_URL ? 'Başlangıç sayfası' : url
}

function lead(status: PaneStatus): { text: string; color?: string } {
  if (status.error !== null && status.error !== '') return { text: status.error, color: 'error' }
  if (status.isAlive === false) return { text: 'Tarayıcı kapandı', color: 'warning' }

  return { text: 'Sayfa yükleniyor…' }
}

export function statusView(ui: Ui, status: PaneStatus) {
  const { Box, Text } = ui
  const line = lead(status)
  const isStuck = line.color !== undefined

  return (
    <Box key="tb-status" flexDirection="column" paddingX={1} paddingY={1}>
      <Text color="suggestion" bold>{'● TARAYICI'}</Text>
      <Text dimColor wrap="truncate-middle">{shownUrl(status.url)}</Text>
      <Text color={line.color} dimColor={!isStuck}>{line.text}</Text>
      {isStuck ? <Text dimColor>{'/browser ile yeniden dene · /browser close kapatır'}</Text> : null}
    </Box>
  )
}

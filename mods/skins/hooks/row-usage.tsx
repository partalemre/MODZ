import type { Look } from './look'
import { CONTEXT_LABEL, usageLine, usageSvg } from './svg-usage'
import type { Meter } from './svg-usage'

// From this full, the band suggests compacting and makes it the main action.
export const COMPACT_NUDGE = 70

export const COMPACT_HOTKEY = '0'

function meterView(look: Look, meters: readonly Meter[]) {
  const { Box, Text } = look.ui
  const { palette } = look.skin

  if (look.svg !== undefined) {
    const Svg = look.svg
    const built = usageSvg(meters, palette)

    return <Svg source={built.source} alt={built.alt} width={built.width} height={built.height} />
  }

  return (
    <Box flexDirection="row" columnGap={3}>
      {usageLine(meters).map(meter => (
        <Text color={palette.muted}>
          <Text color={palette.user}>{meter.bar}</Text>
          {` %${meter.percent} ${meter.label}`}
        </Text>
      ))}
    </Box>
  )
}

export type Usage = { meters: readonly Meter[]; canCompact: boolean; compact: () => void }

// The band above the prompt: the meters, and a Compact button that becomes the main
// action, with a word on why, once the context is full enough to be worth it.
export function usageBand(look: Look, { meters, canCompact, compact }: Usage) {
  const { Box, Text, Button } = look.ui
  const { palette } = look.skin
  const context = meters.find(meter => meter.label === CONTEXT_LABEL)?.percent ?? 0
  const isNudge = context >= COMPACT_NUDGE

  return (
    // The right edge stays clear: the band draws its own collapse mark ([-]) there.
    <Box flexDirection="row" alignItems="center" columnGap={2} paddingRight={5}>
      {meterView(look, meters)}
      <Box flexGrow={1} />
      {canCompact && isNudge ? <Text color={palette.warn}>{`Bağlam %${context} dolu`}</Text> : ''}
      {canCompact ? (
        // A digit hotkey: typed alone into an empty prompt it presses the band's button, which
        // is the only way in where the terminal reports no clicks. `plain` shows it: `0: Sıkıştır`.
        <Button
          key="compact"
          label={isNudge ? 'Şimdi sıkıştır' : 'Sıkıştır'}
          hotkey={COMPACT_HOTKEY}
          plain
          {...(isNudge ? { variant: 'primary' as const } : { dimColor: true })}
          onPress={compact}
        />
      ) : (
        ''
      )}
    </Box>
  )
}

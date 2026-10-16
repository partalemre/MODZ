import { atom, memberOf, update } from 'claude-code'
import type { On } from 'claude-code'

import { DESIGN } from './designer'
import { diffstat } from './format'
import { addCall, type Live } from './turn-stats'

// What each call and prompt leaves for the transcript rows: how long a call took, the main loop's calls and
// changed lines, and which prompts carried images.

// The engine reads each module's use of the mod's values from that module's own source.
const durationAtom = atom({ plugin: 'skins', key: 'duration' } as const, -1)
const imagesAtom = atom({ plugin: 'skins', key: 'images' } as const, false)

export function onCalls(on: On, live: Live): void {
  // Notes which prompts carried images, so their row keeps Claude Code's drawing of them.
  on('session.append', async ($, e, next) => {
    const stored = await next(e)
    const hasImage = e.door === 'prompt' && e.message.content.some(block => block.type === 'image')
    if (hasImage && stored.uuid !== undefined) await update($, memberOf(imagesAtom, { requestId: stored.uuid }), () => true)

    return stored
  })

  // Times every call and counts the main loop's calls and changed lines.
  on('tool.call', async ($, e, next) => {
    const startedAt = await $.clock.now()
    const ran = await next(e)
    const ms = (await $.clock.now()) - startedAt

    await update($, memberOf(durationAtom, { requestId: e.tool_use_id }), () => ms)
    if (e.agentId === undefined && e.tool !== DESIGN && ran.deny === undefined) live.stats = addCall(live.stats, diffstat(ran.result))

    return ran
  })
}

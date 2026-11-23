import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { BUILTIN_TYPES, mergeTypes, offered } from './agent-types'

// State refs live in each file that reads them: the scan follows literals, not imports.
const types = atom({ plugin: 'savvy-progress', key: 'types' } as const, BUILTIN_TYPES)

type On = Parameters<Register>[0]

// The catalogue's live source: every type the engine offers the model.
export function onDispatch(on: On): void {
  on('agent.offer', async ($, e, next) => {
    const answer = await next(e)
    const type = offered(e)
    if (!(await read($, types)).some(known => known.name === type.name)) await update($, types, current => mergeTypes(current, [type]))
    return answer
  }).catch(($, e, next) => next(e))
}

import type { Skin } from '../skin'

const skin: Skin = {
  name: 'nord',
  label: 'Nord',
  palette: {
    read: '#8fbcbb',
    write: '#d08770',
    run: '#ebcb8b',
    search: '#b48ead',
    web: '#5e81ac',
    mcp: '#88c0d0',
    other: '#d8dee9',
    user: '#88c0d0',
    fg: '#e5e9f0',
    muted: '#7b88a1',
    surface: '#3b4252',
    zebra: '#353b49',
    ok: '#a3be8c',
    err: '#bf616a',
    warn: '#ebcb8b',
  },
  spinner: ['Drifting', 'Frosting', 'Chilling', 'Thawing', 'Skiing', 'Gliding'],
  done: ['Frozen', 'Thawed', 'Charted', 'Crossed'],
}

export default skin

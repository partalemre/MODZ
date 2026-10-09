import type { Skin } from '../skin'

// Greys only: the structure of a skin with none of the colour.
const skin: Skin = {
  name: 'mono',
  label: 'Monochrome',
  palette: {
    read: '#9e9e9e',
    write: '#e0e0e0',
    run: '#bdbdbd',
    search: '#9e9e9e',
    web: '#9e9e9e',
    mcp: '#9e9e9e',
    other: '#9e9e9e',
    user: '#e0e0e0',
    fg: '#e0e0e0',
    muted: '#7a7a7a',
    surface: '#262626',
    zebra: '#222222',
    ok: '#e0e0e0',
    err: '#ffffff',
    warn: '#bdbdbd',
  },
  spinner: ['Working', 'Thinking', 'Reading', 'Writing', 'Checking'],
  done: ['Done', 'Finished', 'Completed'],
}

export default skin

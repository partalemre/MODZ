import type { Skin } from '../skin'

const skin: Skin = {
  name: 'dracula',
  label: 'Dracula',
  palette: {
    read: '#8be9fd',
    write: '#ffb86c',
    run: '#f1fa8c',
    search: '#bd93f9',
    web: '#ff79c6',
    mcp: '#50fa7b',
    other: '#f8f8f2',
    user: '#bd93f9',
    fg: '#f8f8f2',
    muted: '#6272a4',
    surface: '#2b2d3a',
    zebra: '#2a2c37',
    ok: '#50fa7b',
    err: '#ff5555',
    warn: '#f1fa8c',
  },
  spinner: ['Brooding', 'Haunting', 'Conjuring', 'Lurking', 'Scheming', 'Unliving'],
  done: ['Risen', 'Conjured', 'Bitten', 'Vanquished'],
}

export default skin

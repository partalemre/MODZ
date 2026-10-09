import type { Skin } from '../skin'

const skin: Skin = {
  name: 'catppuccin',
  label: 'Catppuccin Mocha',
  palette: {
    read: '#89dceb',
    write: '#fab387',
    run: '#f9e2af',
    search: '#cba6f7',
    web: '#74c7ec',
    mcp: '#94e2d5',
    other: '#bac2de',
    user: '#cba6f7',
    fg: '#cdd6f4',
    muted: '#7f849c',
    surface: '#252536',
    zebra: '#232334',
    ok: '#a6e3a1',
    err: '#f38ba8',
    warn: '#f9e2af',
  },
  spinner: ['Purring', 'Napping', 'Pouncing', 'Kneading', 'Stretching', 'Nuzzling'],
  done: ['Pounced', 'Purred', 'Napped', 'Curled up'],
}

export default skin

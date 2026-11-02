// The living scenes `/skin scene` puts above the prompt: a glyph field and the creatures that cross it, drawn by
// svg-scene.ts. A new scene is one entry here. Inspired by Marko Vineli's (@handsher_NGU) "/theme" concept.

// right / left: crosses the strip. rise: floats up through it. blink: twinkles in place. float: bobs in place.
export type Motion = 'right' | 'left' | 'rise' | 'blink' | 'float' | 'still'

export type Sprite = {
  readonly art: readonly string[]
  readonly color: string
  readonly motion: Motion
  // One loop: a crossing, a rise, a twinkle.
  readonly seconds: number
  // One [row, column] per copy: where it rests, and where a moving one is when the loop starts.
  readonly at: readonly (readonly [number, number])[]
  // A soft halo, for what gives light.
  readonly glows?: boolean
}

export type Field = {
  // Sparse to dense; the first is empty.
  readonly ramp: string
  // How dense the top row and the bottom row are, 0 to 1.
  readonly fill: readonly [number, number]
  readonly colors: readonly [string, string]
  // Sparkles drifting the other way; none when empty.
  readonly glint: string
  readonly glintColor: string
  readonly seconds: number
}

export type Scene = {
  readonly name: string
  readonly label: string
  readonly sky: readonly [string, string]
  readonly field: Field
  readonly sprites: readonly Sprite[]
}

const TURTLE = ['   .----.', ' _/_\\__/_\\_(°>', '   "    "']
const KOI_RIGHT = ['~><((((°>']
const KOI_LEFT = ['<°))))><~']
const JELLY = [' .-""-.', '(______)', ' ) ) ) ', ' ( ( ( ']
const JELLY_SMALL = [' .-.', '(___)', ' )|(']
const BOAT = ['   |\\', ' __|_\\__', ' \\_____/']
const MOON = ['  .-""""-.', ' /    °   \\', '|  °       |', ' \\      ° /', "  '-....-'"]
const CLOUD = ['    .--.', '  .(    )-.', ' (___.__)__)']
const CLOUD_SMALL = [' .-(  )-.', '(___.___)']

export const SCENES: readonly Scene[] = [
  {
    name: 'honu-lagoon',
    label: 'Honu Lagoon',
    sky: ['#5fd6d6', '#1a8fa6'],
    field: { ramp: ' .·:~≈', fill: [0.2, 0.6], colors: ['#c6f5f1', '#0f6f86'], glint: '˚°·', glintColor: '#ffffff', seconds: 48 },
    sprites: [
      { art: TURTLE, color: '#1f5e4a', motion: 'right', seconds: 34, at: [[2, 18], [5, 76]] },
      { art: ['><(((°>'], color: '#ffd43b', motion: 'right', seconds: 18, at: [[1, 52], [7, 8], [6, 100]] },
      { art: ['<°)))><'], color: '#ff8c69', motion: 'left', seconds: 22, at: [[4, 40], [8, 90]] },
      { art: ['✿'], color: '#ff4d6d', motion: 'float', seconds: 4, at: [[8, 30], [7, 64], [8, 112]] },
      { art: ['❀'], color: '#fff3c4', motion: 'float', seconds: 5, at: [[8, 48], [7, 96]] },
    ],
  },
  {
    name: 'koi-pond',
    label: 'Koi Pond',
    sky: ['#12474b', '#082224'],
    field: { ramp: ' .·~', fill: [0.25, 0.45], colors: ['#3a8f88', '#14504c'], glint: '·', glintColor: '#9fe3d6', seconds: 60 },
    sprites: [
      { art: KOI_RIGHT, color: '#ff7a3d', motion: 'right', seconds: 28, at: [[2, 20], [6, 70]] },
      { art: KOI_LEFT, color: '#f4efe6', motion: 'left', seconds: 32, at: [[4, 90], [7, 30]] },
      { art: KOI_RIGHT, color: '#e84a3a', motion: 'right', seconds: 38, at: [[8, 100]] },
      { art: ['(_@_)'], color: '#5fae5a', motion: 'float', seconds: 6, at: [[1, 8], [5, 46], [8, 84]] },
      { art: ['✿'], color: '#ff9fc4', motion: 'float', seconds: 5, at: [[1, 10], [5, 48]] },
    ],
  },
  {
    name: 'jellyfish',
    label: 'Jellyfish',
    sky: ['#1b1f4b', '#070a22'],
    field: { ramp: ' .·:', fill: [0.15, 0.4], colors: ['#5a63b8', '#262b6a'], glint: '˚°', glintColor: '#c9b6ff', seconds: 70 },
    sprites: [
      { art: JELLY, color: '#ff9bd2', motion: 'rise', seconds: 26, at: [[2, 14], [6, 74]] },
      { art: JELLY, color: '#9be8ff', motion: 'rise', seconds: 32, at: [[8, 44], [0, 104]] },
      { art: JELLY_SMALL, color: '#c7a6ff', motion: 'rise', seconds: 20, at: [[4, 30], [1, 60], [7, 92]] },
    ],
  },
  {
    name: 'paper-boats',
    label: 'Paper Boats',
    sky: ['#f6d8c8', '#9ec9d9'],
    field: { ramp: ' .-~≈', fill: [-0.4, 0.75], colors: ['#f2c4ae', '#4f88a3'], glint: '·', glintColor: '#ffffff', seconds: 54 },
    sprites: [
      { art: BOAT, color: '#ffffff', motion: 'right', seconds: 44, at: [[4, 10], [5, 70]] },
      { art: BOAT, color: '#ffd1dc', motion: 'right', seconds: 56, at: [[5, 40]] },
      { art: ['~v~'], color: '#7a6a73', motion: 'left', seconds: 30, at: [[0, 60], [1, 100]] },
    ],
  },
  {
    name: 'fireflies',
    label: 'Fireflies',
    sky: ['#0d1a14', '#04090a'],
    field: { ramp: " .,'\"|", fill: [-0.5, 0.85], colors: ['#1d3a2a', '#3b6e45'], glint: '', glintColor: '#000000', seconds: 80 },
    sprites: [
      {
        art: ['•'],
        color: '#e6ff7a',
        motion: 'blink',
        seconds: 4,
        glows: true,
        at: [[1, 8], [3, 22], [0, 37], [5, 46], [2, 58], [4, 69], [1, 81], [6, 90], [3, 101], [0, 112], [5, 15], [2, 95]],
      },
      { art: ['·'], color: '#fff7b0', motion: 'blink', seconds: 3, glows: true, at: [[2, 30], [4, 52], [1, 74], [3, 86], [6, 64]] },
    ],
  },
  {
    name: 'moonlit',
    label: 'Moonlit',
    sky: ['#141a3a', '#0a0e22'],
    field: { ramp: ' .-~≈', fill: [-0.45, 0.65], colors: ['#3a4a8a', '#1f2a5c'], glint: '·˚', glintColor: '#e8e6ff', seconds: 64 },
    sprites: [
      { art: MOON, color: '#f3eecd', motion: 'still', seconds: 1, glows: true, at: [[0, 90]] },
      { art: ['+'], color: '#fffbe0', motion: 'blink', seconds: 5, glows: true, at: [[0, 8], [1, 24], [0, 41], [2, 57], [1, 73], [0, 112]] },
      { art: ['·'], color: '#fffbe0', motion: 'blink', seconds: 3, at: [[1, 15], [0, 33], [2, 48], [1, 66], [2, 84], [1, 118]] },
    ],
  },
  {
    name: 'cloud-drift',
    label: 'Cloud Drift',
    sky: ['#8ccbf2', '#e6f4fb'],
    field: { ramp: ' ·', fill: [0.05, 0.12], colors: ['#ffffff', '#ffffff'], glint: '', glintColor: '#000000', seconds: 90 },
    sprites: [
      { art: CLOUD, color: '#ffffff', motion: 'right', seconds: 70, at: [[0, 10], [4, 64]] },
      { art: CLOUD_SMALL, color: '#f4fbff', motion: 'right', seconds: 90, at: [[2, 38], [6, 100]] },
      { art: ['^v^'], color: '#4a5a6a', motion: 'left', seconds: 26, at: [[1, 80], [3, 30]] },
    ],
  },
  {
    name: 'ember',
    label: 'Ember',
    sky: ['#2a1710', '#120a07'],
    field: { ramp: ' .:;', fill: [0.1, 0.45], colors: ['#5a2e1c', '#8a4527'], glint: '*+·', glintColor: '#ff9a5a', seconds: 50 },
    sprites: [
      { art: ['*'], color: '#ff8a4c', motion: 'rise', seconds: 9, glows: true, at: [[2, 12], [6, 28], [4, 44], [8, 60], [1, 76], [5, 92], [7, 108]] },
      { art: ["'"], color: '#ffc38a', motion: 'rise', seconds: 7, glows: true, at: [[3, 20], [7, 52], [0, 84], [5, 116]] },
    ],
  },
]

export const SCENE_NAMES: readonly string[] = SCENES.map(scene => scene.name)

export const sceneNamed = (name: string): Scene | undefined => SCENES.find(scene => scene.name === name)

// The scene after `name` in the settings pane's cycle, which passes through off.
export function nextScene(name: string): string {
  const cycle = [...SCENE_NAMES, 'off']

  return cycle[(cycle.indexOf(name) + 1) % cycle.length] ?? 'off'
}

// One file per mod: the engine reads a hooks module and every file it imports one by one at each session's
// start, which cost ~0.4 s a mod; the same code as a single plain-JS file loads in a fraction of that.
import { existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const MODS = resolve(import.meta.dirname, '../../mods')
const ENTRIES = ['register.tsx', 'register.ts']
const SUFFIXES = ['', '.ts', '.tsx', '/index.ts']
const JSX = { jsx: 'react', jsxFactory: 'h', jsxFragmentFactory: 'Fragment' }
const transpilers = Object.fromEntries(['ts', 'tsx'].map(loader => [loader, new Bun.Transpiler({ loader, target: 'node', tsconfig: { compilerOptions: JSX } })]))
const isFile = path => existsSync(path) && statSync(path).isFile()

const typescript = {
  name: 'modz-typescript',
  resolveId(source, importer) {
    if (importer === undefined || !source.startsWith('.')) return null
    const base = join(dirname(importer), source)

    return SUFFIXES.map(suffix => base + suffix).find(isFile) ?? null
  },
  transform: (code, id) => transpilers[id.endsWith('x') ? 'tsx' : 'ts'].transformSync(code),
}

const entryOf = mod => ENTRIES.map(name => join(MODS, mod, 'hooks', name)).find(isFile)

export default (process.env.MODZ_BUILD ?? '').split(' ').filter(mod => entryOf(mod) !== undefined).map(mod => ({
  input: entryOf(mod),
  external: ['claude-code'],
  plugins: [typescript],
  output: { file: join(MODS, mod, 'hooks', 'bundle.js'), format: 'es', banner: '// Built by `bin/modz build` from the files beside it. Never edited by hand.' },
}))

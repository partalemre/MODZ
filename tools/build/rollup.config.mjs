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

// Every mod carries its own copy of kit/ (bin/kit-sync keeps them byte-identical to the repo's kit/). A mod that
// draws another mod's page (modz's hooks/pages/) would pull that mod's copy in beside its own: the same code several
// times, each with its own memory (language, motion). So every kit file is taken from the repo's kit/.
const KIT = '/hooks/kit/'
const ROOT_KIT = resolve(import.meta.dirname, '../../kit') + '/'
const oneKit = path => {
  const at = path.indexOf(KIT)
  if (at < 0) return path
  const root = ROOT_KIT + path.slice(at + KIT.length)

  return isFile(root) ? root : path
}

const typescript = {
  name: 'modz-typescript',
  resolveId(source, importer) {
    if (importer === undefined || !source.startsWith('.')) return null
    const base = join(dirname(importer), source)
    const found = SUFFIXES.map(suffix => base + suffix).find(isFile)

    return found === undefined ? null : oneKit(found)
  },
  transform: (code, id) => transpilers[id.endsWith('x') ? 'tsx' : 'ts'].transformSync(code),
}

// A name is a mod under mods/; a path is a plugin folder of its own (transceiver lives in its own repo).
const hooksOf = mod => (mod.includes('/') ? join(resolve(mod), 'hooks') : join(MODS, mod, 'hooks'))
const entryOf = mod => ENTRIES.map(name => join(hooksOf(mod), name)).find(isFile)

export default (process.env.MODZ_BUILD ?? '').split(' ').filter(mod => entryOf(mod) !== undefined).map(mod => ({
  input: entryOf(mod),
  external: ['claude-code'],
  plugins: [typescript],
  output: { file: join(hooksOf(mod), 'bundle.js'), format: 'es', banner: '// Built by `bin/modz build` from the files beside it. Never edited by hand.' },
}))

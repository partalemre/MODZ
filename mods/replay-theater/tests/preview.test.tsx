import { test } from 'claude-code/testing'

import { bandOf, newWorld, paneOf, said, setup } from './fixtures'

const FILES: Record<string, string> = {
  '/w/README.md': 'Call `greet(name)` to say hi.\n',
  '/w/src/greet.js': 'export function greet(name) {\n  return `Hi ${name}`\n}\n',
  '/w/src/cli.js': "import { greet } from './greet.js';\nconsole.log(greet(process.argv[2]));\n",
  '/w/src/index.js': "import { greet } from './greet.js';\nconsole.log(greet('station'));\n",
}
const TODOS = ['Kodu tara', 'Testleri oku', 'Adı welcome yap', 'CLI çıktısını kontrol et', 'README güncelle', 'Testleri çalıştır', 'Sürümü artır', 'Değişiklik notu', 'Gözden geçir']

const todos = (current: number) => TODOS.map((content, k) => ({ content, activeForm: content, status: k < current ? 'completed' : k === current ? 'in_progress' : 'pending' }))

async function demo($: any, on: any, theme: string) {
  const world = newWorld()
  world.theme = theme
  world.files = { ...FILES }
  const clock = await setup($, on, world)
  world.messages = ids => [said('greet fonksiyonunu welcome olarak yeniden adlandırıyorum; önce tanımı değiştiriyorum.', ids.slice(0, 3).map(id => ({ tool_use_id: id, tool: 'Edit' })))]
  await $.turn.start({ text: 'greet adını welcome yap', turnId: 't1' })
  await $.tool.call({ tool: 'TodoWrite', todos: todos(2) })
  await $.tool.call({ tool: 'Edit', file_path: '/w/README.md', old_string: 'Call `greet(name)`', new_string: 'Call `welcome(name)`', description: "README'deki örnek çağrıyı yeni adla günceller" })
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/greet.js', old_string: 'export function greet(name) {', new_string: 'export function welcome(name) {' })
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/cli.js', old_string: FILES['/w/src/cli.js'], new_string: FILES['/w/src/cli.js']!.replaceAll('greet(', 'welcome(').replace('{ greet }', '{ welcome }') })
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/index.js', old_string: FILES['/w/src/index.js'], new_string: FILES['/w/src/index.js']!.replace('{ greet }', '{ welcome }').replace("greet('", "welcome('") })
  await $.turn.complete({ answer: 'greet fonksiyonunu dört dosyada welcome olarak yeniden adlandırdım. Testler geçiyor.', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })

  return { world, clock }
}

for (const theme of ['dark', 'light']) {
  test(`preview ${theme}`, async ($: any, on: any) => {
    const { clock } = await demo($, on, theme)
    const band = await $.ui.mount(bandOf('desktop'))
    console.log(`@@TREE@@replay-offer-${theme}@@` + JSON.stringify(await band.drawn()))
    await band.press({ key: 'rt-open' })
    await clock.advance(200)
    const pane = await $.ui.mount(paneOf('desktop'))
    await pane.press({ key: 'rt-next' })
    console.log(`@@TREE@@replay-pane-step2-${theme}@@` + JSON.stringify(await pane.drawn()))
    const term = await $.ui.mount({ ...paneOf('terminal'), requestId: 'replay-theater' })
    console.log(`@@TREE@@replay-pane-terminal-${theme}@@` + JSON.stringify(await term.drawn()))
  })
}

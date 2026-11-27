import { expect, test } from 'claude-code/testing'

import { pushesOf, repoOf, warningFor } from '../hooks/ship'
import { EN, mountBand, pass, start, stub, world } from './world'

// A push to a repository that is not the signed-in user's own: a line above the prompt, never a hold.

const ORIGIN = 'git -C /work/demo-app remote get-url origin'
const LOGIN = 'gh api user --jq .login'
const call = ($: any, command: string) => $.tool.call({ tool: 'Bash', command })

async function bandText($: any, surface = 'terminal'): Promise<string> {
  const ui = await mountBand($, surface)
  const text = JSON.stringify(await ui.drawn())
  await ui.unmount()

  return text
}

test('a push to someone else\'s repository runs and leaves a warning; a push to your own leaves none', async ($, on) => {
  const w = world({ ...EN, answers: { [ORIGIN]: 'git@github.com:acme/payments.git\n', [LOGIN]: 'partalemre\n' } })
  stub(on, w)
  await start($, w)

  const ran: any = await call($, 'git add -A && git commit -m "ship" && git push -u origin feature/x')
  await pass(w, 0)

  expect(ran.deny).toBeUndefined()
  expect(w.ran).toHaveLength(1)
  const drawn = await bandText($)
  expect(drawn).toContain('Pushing to acme/payments, which is not yours')
  expect(drawn).toContain('owned by acme, you are partalemre')
  expect(await bandText($, 'desktop')).toContain('Pushing to acme/payments, which is not yours')

  w.answers[ORIGIN] = 'https://github.com/PartalEmre/MODZ.git\n'
  await call($, 'git push')
  await pass(w, 0)
  expect(await bandText($)).toContain('acme/payments')
})

test('the warning is said once per repository and goes with Got it', async ($, on) => {
  const w = world({ ...EN, answers: { [ORIGIN]: 'https://github.com/acme/payments\n', [LOGIN]: 'partalemre\n' } })
  stub(on, w)
  await start($, w)
  await call($, 'git push')
  await pass(w, 0)

  const ui = await mountBand($, 'terminal')
  await ui.press({ key: 'blast-radius-ship-ok' })
  await ui.unmount()
  expect(await bandText($)).not.toContain('acme/payments')

  await call($, 'git push')
  await pass(w, 0)
  expect(await bandText($)).not.toContain('acme/payments')
})

test('without a gh login nothing can be trusted; a failed lookup never stops the push', async ($, on) => {
  const w = world({ ...EN, answers: { [ORIGIN]: 'git@github.com:partalemre/MODZ.git\n' }, failing: [LOGIN] })
  stub(on, w)
  await start($, w)
  await call($, 'git push')
  await pass(w, 0)
  expect(await bandText($)).toContain('gh is not signed in')

  w.failing = [ORIGIN, LOGIN]
  const ran: any = await call($, 'git -C other push')
  expect(ran.deny).toBeUndefined()
})

test('pushes are found where git runs them; remotes are read for their owner', () => {
  expect(pushesOf('git add . && git commit -m "push it" && git push -u origin main')).toEqual([{ dir: null, remote: 'origin' }])
  expect(pushesOf('GIT_TRACE=1 git -C ../repo push upstream')).toEqual([{ dir: '../repo', remote: 'upstream' }])
  expect(pushesOf('git push')).toEqual([{ dir: null, remote: 'origin' }])
  expect(pushesOf('echo "git push" && git status')).toEqual([])
  expect(repoOf('git@github.com:acme/pay.git')).toEqual({ owner: 'acme', name: 'pay' })
  expect(repoOf('https://gitlab.com/acme/pay.git')).toBeNull()
  expect(warningFor('https://github.com/me/x.git', 'Me')).toBeNull()
  expect(warningFor('https://gitlab.com/me/x.git', 'me')).toMatchObject({ owner: null })
})

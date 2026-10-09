import type { Register } from 'claude-code'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    $.ui.status('__NAME__ loaded')

    return next(e)
  })
}

import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const start = { cwd: '/', surface: 'terminal', isInteractive: true } as const
const run = (args: string) =>
  ({
    command: 'refresh-context',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  }) as const
const bottom = (on: On) => {
  on('classic.SessionStart', () => ({}))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
}

test('/refresh-context writes a handoff, clears, and sends it back', async ($, on) => {
  const order: string[] = []
  let written = ''
  let submitted = ''

  bottom(on)
  const clock = mock.clock(on)
  on('command.register', () => ({ value: { command: 'refresh-context' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
  on('model.fork', (_, e) => {
    order.push('fork')
    expect(e.prompt).toContain('remember the rate limit')
    return { value: { isAnswered: true, text: '# Handoff\n## Next steps\n1. Fix it', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }
  })
  on('fs.write', (_, e) => {
    order.push('write')
    written = e.text
    return { value: undefined }
  })
  on('command.run', { command: 'clear' }, () => {
    order.push('clear')
    return { text: '' }
  })
  on('prompt.submit', (_, e) => {
    order.push('submit')
    submitted = e.text
    return { text: e.text }
  })

  await $.session.start(start)
  const out = await $.command.run(run('remember the rate limit'))
  expect(out.text).toContain('Clearing the context')

  // /clear runs on a timer once the command has returned.
  await clock.advance(10)
  expect(order).toEqual(['fork', 'write', 'clear'])

  // The session /clear starts.
  await $.classic.SessionStart({ source: 'clear' })

  expect(order).toEqual(['fork', 'write', 'clear', 'submit'])
  expect(written).toContain('1. Fix it')
  expect(submitted).toContain('exact same task')
  expect(submitted).toContain('1. Fix it')

  // A later, unrelated /clear sends nothing.
  await $.classic.SessionStart({ source: 'clear' })
  expect(order.filter(s => s === 'submit').length).toBe(1)
})

test('no clear when the handoff fails', async ($, on) => {
  let cleared = false
  bottom(on)
  on('command.register', () => ({ value: { command: 'refresh-context' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
  on('model.fork', () => ({ value: { isAnswered: false, reason: 'nothing-to-fork' } }))
  on('command.run', { command: 'clear' }, () => {
    cleared = true
    return { text: '' }
  })

  const clock = mock.clock(on)
  await $.session.start(start)
  const out = await $.command.run(run(''))
  await clock.advance(10)
  expect(out.text).toContain('Nothing was cleared')
  expect(cleared).toBe(false)
})

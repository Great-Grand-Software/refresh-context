import type { ModelForkResult, On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const start = { cwd: '/', surface: 'terminal', isInteractive: true } as const
const run = (args: string) =>
  ({
    command: 'refresh-context',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  }) as const
const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }

const setup = (on: On, fork: () => ModelForkResult) => {
  const order: string[] = []
  let submitted = ''
  on('classic.SessionStart', () => ({}))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'refresh-context' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('model.fork', () => (order.push('fork'), { value: fork() }))
  on('command.run', { command: 'clear' }, () => (order.push('clear'), { text: '' }))
  on('prompt.submit', (_, e) => (order.push('submit'), (submitted = e.text), { text: e.text }))
  return { order, submitted: () => submitted, clock: mock.clock(on) }
}

test('hands off, clears, resumes once', async ($, on) => {
  const t = setup(on, () => ({ isAnswered: true, text: '1. Fix it', usage }))

  await $.session.start(start)
  await $.command.run(run('notes'))
  await t.clock.advance(10)
  await $.classic.SessionStart({ source: 'clear' })
  await $.classic.SessionStart({ source: 'clear' })

  expect(t.order).toEqual(['fork', 'clear', 'submit'])
  expect(t.submitted()).toContain('1. Fix it')
})

test('failed handoff clears nothing', async ($, on) => {
  const t = setup(on, () => ({ isAnswered: false, reason: 'nothing-to-fork' }))

  await $.session.start(start)
  const out = await $.command.run(run(''))
  await t.clock.advance(10)

  expect(out.text).toContain('Nothing cleared')
  expect(t.order).toEqual(['fork'])
})

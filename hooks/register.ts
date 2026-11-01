import type { Register } from 'claude-code'

const handoffPrompt = (notes: string) => `Your context is about to be cleared. A fresh copy of you will continue this exact task from the handoff you write now. Don't call tools; reply with only the handoff, in markdown.

Be specific: exact paths, names, commands, errors. Don't mention this refresh. Use these sections, skipping empty ones:

# Handoff
## Goal
## Constraints and preferences
## Done so far
## In progress
## Next steps
## Decisions and reasoning
## Dead ends
## How to verify
## Open questions
${notes.trim() ? `\nUser's notes: ${notes.trim()}\n` : ''}`

const resumePrompt = (handoff: string) => `Context refreshed. Continue the exact same task from this handoff. Reply "Context refreshed." then get back to work. Don't mention the refresh or ask if it worked. If the next step needs me, say you're ready and stop.

${handoff}`

// Survives /clear: the process keeps running under a new session.
let pending: string | undefined

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command
      .register({
        name: 'refresh-context',
        description: 'Hand off, clear, continue',
        argumentHint: '[notes]',
      })
      .catch(() => $.ui.toast('refresh-context: could not register'))
    return next(e)
  })

  on('command.run', { command: 'refresh-context' }, async ($, e) => {
    $.ui.status('Writing handoff…')
    const reply = await $.model.fork({ prompt: handoffPrompt(e.args ?? '') }).catch(() => undefined)
    $.ui.status(undefined)

    const handoff = reply?.isAnswered ? reply.text.trim() : ''
    if (!handoff) return { text: 'No handoff written. Nothing cleared.' }

    pending = handoff
    // A command can't run another command from its own hook.
    $.clock.after(0, () => {
      $.command.run({ command: 'clear' }).catch(() => {
        pending = undefined
        $.ui.toast('refresh-context: /clear failed. Nothing cleared.')
      })
    })
    return { text: 'Clearing…' }
  })

  on('classic.SessionStart', ($, e, next) => {
    if (e.source === 'clear' && pending) {
      const text = resumePrompt(pending)
      pending = undefined
      $.prompt.submit({ text, asUser: true }).catch(() => $.ui.toast('refresh-context: could not resume'))
    }
    return next(e)
  })
}

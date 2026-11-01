import type { Register } from 'claude-code'

const COMMAND = 'refresh-context'
const BACKUP = '.refresh-context/handoff.md'

const handoffPrompt = (notes: string) => `Your context is about to be cleared. A fresh copy of you, with no memory of this conversation, will continue this exact task from a handoff that you write now. Do not call any tools: reply with the handoff as markdown and nothing else.

Be specific: exact file paths, function names, commands, error messages and line numbers, not summaries of them. Use these sections, leaving out any that would be empty:

# Handoff
## Goal
What the user asked for, in their words where possible, plus any later changes to the request.
## Constraints and preferences
What the user told you to do or not do, tooling and style choices, branches, anything you would be corrected on.
## Done so far
What is finished and verified, with the files changed and what changed in each.
## In progress
The exact step you were on, and how far along it is. Say if a file was left half-edited.
## Next steps
A numbered list, in order. The first item is something to start on immediately.
## Decisions and reasoning
Choices made and why, so they are not revisited.
## Dead ends
Approaches tried that failed or were rejected, and why.
## How to verify
Commands to build, test or check the work, and what passing looks like.
## Open questions
Anything still waiting on the user.
${notes.trim() ? `\nThe user added these notes for the handoff: ${notes.trim()}\n` : ''}`

const resumePrompt = (handoff: string) => `My context was just cleared with /refresh-context so you can keep going with a fresh one. You are continuing the exact same task as before. Here is the handoff you wrote just before the clear. Pick up from its next steps and keep working as if nothing had changed.

${handoff}`

// The handoff waiting for the cleared session. A module variable, because
// /clear keeps this process (and this module) running under a new session.
let pending: string | undefined

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command
      .register({
        name: COMMAND,
        description: 'Write a handoff, clear the context, and continue the same task fresh',
        argumentHint: '[notes for the handoff]',
      })
      .catch(() => $.ui.toast('refresh-context: could not register /refresh-context'))

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    $.ui.status('refresh-context: writing handoff…')
    const reply = await $.model
      .fork({ prompt: handoffPrompt(e.args ?? '') })
      .catch(() => undefined)
    $.ui.status(undefined)

    if (!reply?.isAnswered || !reply.text.trim()) {
      const why = !reply ? 'error' : reply.isAnswered ? 'empty-reply' : reply.reason

      return { text: `Couldn't write a handoff (${why}). Nothing was cleared.` }
    }

    const handoff = reply.text.trim()
    // A copy on disk, so the handoff is never lost if something below fails.
    await $.fs.write(BACKUP, `${handoff}\n`).catch(() => undefined)
    pending = handoff

    // A command can't run another command from its own hook, so /clear goes
    // on a timer that fires once this command has returned.
    $.clock.after(0, () => {
      $.command.run({ command: 'clear' }).catch((err: unknown) => {
        pending = undefined
        $.ui.log(`refresh-context: /clear failed: ${String(err)}`)
        $.ui.toast(`refresh-context: /clear failed. The handoff is saved in ${BACKUP}.`)
      })
    })

    return { text: `Handoff written (also saved to ${BACKUP}). Clearing the context and continuing…` }
  })

  // Fires in the fresh session that /clear started.
  on('classic.SessionStart', ($, e, next) => {
    if (e.source === 'clear' && pending !== undefined) {
      const handoff = pending
      pending = undefined
      // Queued: it runs as the new session's first turn once it is idle.
      $.prompt.submit({ text: resumePrompt(handoff), asUser: true }).catch(() => {
        $.ui.toast(`refresh-context: couldn't send the handoff. It is saved in ${BACKUP}.`)
      })
    }

    return next(e)
  })
}

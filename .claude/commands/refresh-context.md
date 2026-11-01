---
description: Write a handoff for the current task so you can /clear and continue with a fresh context
argument-hint: "[optional notes to include in the handoff]"
allowed-tools: Write
disable-model-invocation: true
---

The user wants to clear your context and continue this exact task as a fresh agent. Your only job in this turn is to write a handoff that your future self, with no memory of this conversation, can pick up and continue from without losing anything.

Do not start new work. Do not change any files except the handoff file. If you are partway through an edit that left a file broken or inconsistent, say so in the handoff instead of trying to finish it now.

Write the handoff with the Write tool to `.refresh-context/handoff.md` in the project root (overwrite it if it exists). Use this structure, and be specific: exact file paths, function names, commands, error messages and line numbers, not summaries of them.

```markdown
# Handoff

## Goal
What the user asked for, in their words where possible, plus any later changes to the request.

## Constraints and preferences
Things the user told you to do or not do, style or tooling choices, branches, anything you would be corrected on.

## Done so far
What is finished and verified. List the files changed and what changed in each.

## In progress
The exact step you were on when this handoff was written, and how far along it is.

## Next steps
A numbered list, in order, of what to do next. The first item should be something you can start on immediately.

## Decisions and reasoning
Choices you made and why, so they don't get revisited.

## Dead ends
Approaches you tried that failed or were rejected, and why.

## How to verify
Commands to build, test or check the work, and what passing looks like.

## Open questions
Anything still waiting on the user.
```

Leave out any section that has nothing in it. Include anything else a fresh agent would need that doesn't fit these headings.

Extra notes from the user to include in the handoff (may be empty): $ARGUMENTS

After the file is written, reply with only this:

> Handoff saved to `.refresh-context/handoff.md`. Now run `/clear`, then send `continue` and I'll pick up where I left off.

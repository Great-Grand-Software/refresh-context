# refresh-context

One command, `/refresh-context`, that gives a Claude Code agent a fresh context without losing its place. Type it and wait. That's all.

## What happens when you type `/refresh-context`

1. The agent is asked, with its full current context, to write a detailed handoff for the task it is working on: the goal, your constraints, what's done, the exact step it was on, next steps, decisions, dead ends, and how to verify. It is told it will continue the exact same task afterwards.
2. The handoff is also saved to `.refresh-context/handoff.md` in your project, as a backup.
3. `/clear` runs automatically.
4. The handoff is sent to the fresh agent automatically, as your message, telling it to continue the same task from the next steps.

You can add notes for the handoff: `/refresh-context remember the API is rate limited`.

If the handoff can't be written, nothing is cleared and the command says why.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install refresh-context --marketplace Great-Grand-Software/refresh-context
```

Answer `y` to add the marketplace, then pick a scope (user scope makes it work in every project). Restart Claude Code afterwards.

From a shell instead:

```
claude plugin install refresh-context --marketplace Great-Grand-Software/refresh-context
```

If this repository is private, your computer needs GitHub access to it (for example `gh auth login`) for the install to work.

## Why this is a plugin and not a plain slash command

A plain slash command (a markdown file in `.claude/commands/`) is only a prompt for the agent, and the agent can't run `/clear`. This plugin uses Claude Code's plugin hooks API, which can ask the agent a question over its current context (`$.model.fork`), run `/clear` (`$.command.run`), and send a message as you (`$.prompt.submit`). That is what lets all four steps happen from one command.

The plugin hooks API is marked early access, so it needs a recent Claude Code. This was built and tested against Claude Code 2.1.316.

## Files

| File | What it does |
| :- | :- |
| `hooks/register.ts` | The plugin: registers `/refresh-context`, writes the handoff, runs `/clear`, and sends the handoff to the fresh session |
| `hooks/hooks.json` | Points Claude Code at `register.ts` |
| `.claude-plugin/plugin.json` | The plugin's name and description |
| `.claude-plugin/marketplace.json` | Makes this repository installable with `/plugin install` |
| `tests/refresh.test.ts` | Tests, run with `claude plugin test .` |

## Developing

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .    # try it in a session without installing
```

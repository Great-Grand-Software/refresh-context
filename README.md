# refresh-context

A `/refresh-context` command for Claude Code. It swaps a long, cluttered context for a fresh one without losing track of the task you're working on.

## How to use it

In a Claude Code session, type these three things:

1. `/refresh-context`. Claude writes a detailed handoff for the current task to `.refresh-context/handoff.md` and does nothing else. You can add notes for the handoff after the command, e.g. `/refresh-context remember the API is rate limited`.
2. `/clear`. This wipes the context. A `SessionStart` hook on `clear` reads the handoff and adds it to the new, empty context.
3. `continue` (or anything else). The fresh Claude picks the task back up from the handoff.

## Why it takes three steps and not one

A slash command is a prompt for Claude. Claude can't run built-in commands like `/clear`, and Claude Code doesn't let a command or hook run `/clear` or start a turn on its own. So the parts that only you can trigger, clearing and sending the next message, are left to you. Everything else is automatic.

## What's in the repo

| File | What it does |
| :- | :- |
| `.claude/commands/refresh-context.md` | The `/refresh-context` command: tells Claude what to put in the handoff and where to save it |
| `.claude/hooks/load-handoff.sh` | Runs after `/clear`, prints the handoff into the new context, and moves it to `.refresh-context/archive/` so it's used only once. It ignores a handoff more than 60 minutes old |
| `.claude/settings.json` | Registers the hook on `SessionStart` with matcher `clear` |
| `.gitignore` | Keeps `.refresh-context/` out of git |

## Using it in other projects

**One project:** copy `.claude/commands/refresh-context.md`, `.claude/hooks/load-handoff.sh` and the `hooks` block from `.claude/settings.json` into that project, and add `.refresh-context/` to its `.gitignore`.

**Every project:** put the files in your user config instead:

```bash
mkdir -p ~/.claude/commands ~/.claude/hooks
cp .claude/commands/refresh-context.md ~/.claude/commands/
cp .claude/hooks/load-handoff.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/load-handoff.sh
```

Then add this to `~/.claude/settings.json`, merging it with any `hooks` you already have:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "clear",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/load-handoff.sh" }
        ]
      }
    ]
  }
}
```

The handoff is still saved in each project's own `.refresh-context/` folder, so add that folder to your global gitignore (`git config --global core.excludesFile`).

## Requirements

- Claude Code, started in the project folder (or with the files installed globally as above)
- bash, for the hook script (macOS, Linux, or WSL/Git Bash on Windows)
- Restart Claude Code after adding the hook so it gets picked up. Run `/hooks` to check that it's listed

## Related: `/compact`

Claude Code's built-in `/compact` does something similar: it summarizes the conversation and keeps going in the same session, and you can steer it, e.g. `/compact focus on the remaining test failures`. `/refresh-context` gives you a cleaner reset. The new context holds only a handoff that Claude wrote on purpose, and you can open the file and edit it before you `/clear`.

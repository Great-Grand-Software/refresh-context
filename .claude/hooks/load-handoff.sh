#!/usr/bin/env bash
# SessionStart hook (matcher: "clear").
# If /refresh-context wrote a handoff just before /clear, put it into the fresh
# context, then archive it so it is only used once.
set -euo pipefail

dir="${CLAUDE_PROJECT_DIR:-$PWD}/.refresh-context"
file="$dir/handoff.md"

[ -f "$file" ] || exit 0

# Ignore a handoff older than 60 minutes, so an unrelated /clear later on
# doesn't bring back old work.
if [ -n "$(find "$file" -mmin +60 2>/dev/null)" ]; then
  exit 0
fi

echo "The context was just cleared with /refresh-context. Before clearing, the previous session wrote the handoff below for the task it was working on. That task is still the current task: when the user's next message arrives (for example \"continue\"), resume it from the handoff's next steps, as though this were the same session."
echo
cat "$file"

mkdir -p "$dir/archive"
mv "$file" "$dir/archive/handoff-$(date +%Y%m%d-%H%M%S).md"

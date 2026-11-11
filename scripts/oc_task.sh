#!/bin/zsh
# Send one task file to Qwen 3.8 through the OpenCode CLI.
# Usage: scripts/oc_task.sh scripts/prompts/<task>.md
# Log: /tmp/rb-oc-<task>.log
# - stdin must be closed, or `opencode run` waits forever for piped input.
# - A separate data folder avoids the schema error in the shared ~/.local/share/opencode database.
set -u
task_file="$1"
task_name="$(basename "$task_file" .md)"
log_file="/tmp/rb-oc-${task_name}.log"
cd "$(dirname "$0")/.." || exit 1
: > "$log_file"
ln -sf "$log_file" /tmp/rb-oc-current.log
XDG_DATA_HOME="$HOME/.local/share/opencode-range-ballistics" \
  opencode run --title "$task_name" "$(cat "$task_file")" < /dev/null > "$log_file" 2>&1
echo "exit=$?" >> "$log_file"

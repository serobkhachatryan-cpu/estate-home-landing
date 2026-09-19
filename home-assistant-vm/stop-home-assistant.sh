#!/usr/bin/env bash
set -euo pipefail

VM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DISK_IMAGE="$VM_DIR/haos_generic-aarch64-18.3.qcow2"
PID_FILE="$VM_DIR/home-assistant.pid"
PIDS="$(lsof -t "$DISK_IMAGE" 2>/dev/null || true)"

if [[ -z "$PIDS" ]]; then
  [[ ! -f "$PID_FILE" ]] || rm "$PID_FILE"
  echo "Home Assistant VM is not running."
  exit 0
fi

while IFS= read -r pid; do
  [[ -z "$pid" ]] || kill "$pid"
done <<< "$PIDS"
[[ ! -f "$PID_FILE" ]] || rm "$PID_FILE"
echo "Home Assistant VM stopped."

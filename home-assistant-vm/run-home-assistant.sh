#!/usr/bin/env bash
set -euo pipefail

VM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QEMU_BIN="/opt/homebrew/bin/qemu-system-aarch64"
QEMU_SHARE="/opt/homebrew/opt/qemu/share/qemu"
DISK_IMAGE="$VM_DIR/haos_generic-aarch64-18.3.qcow2"
UEFI_CODE="$QEMU_SHARE/edk2-aarch64-code.fd"
UEFI_VARS="$VM_DIR/edk2-arm-vars.fd"
PID_FILE="$VM_DIR/home-assistant.pid"
LOG_FILE="$VM_DIR/home-assistant.log"

if [[ ! -x "$QEMU_BIN" || ! -f "$DISK_IMAGE" || ! -f "$UEFI_CODE" ]]; then
  echo "Home Assistant VM prerequisites are missing." >&2
  exit 1
fi

if lsof -t "$DISK_IMAGE" >/dev/null 2>&1; then
  echo "Home Assistant VM is already running at http://127.0.0.1:8123"
  exit 0
fi

[[ ! -f "$PID_FILE" ]] || rm "$PID_FILE"
[[ -f "$UEFI_VARS" ]] || cp "$QEMU_SHARE/edk2-arm-vars.fd" "$UEFI_VARS"

# Home Assistant OS 18.3 runs the initial onboarding server on guest port 80.
# Keep the familiar host address on port 8123 while forwarding it correctly.
"$QEMU_BIN" \
  -accel hvf \
  -cpu host \
  -machine virt,highmem=on \
  -smp 4 \
  -m 4096 \
  -drive if=pflash,format=raw,readonly=on,file="$UEFI_CODE" \
  -drive if=pflash,format=raw,file="$UEFI_VARS" \
  -drive if=none,file="$DISK_IMAGE",format=qcow2,id=haos_disk \
  -device virtio-blk-pci,drive=haos_disk \
  -netdev user,id=haos_network,hostfwd=tcp:127.0.0.1:8123-:80 \
  -device virtio-net-pci,netdev=haos_network \
  -device virtio-rng-pci \
  -display none \
  -serial file:"$LOG_FILE" \
  -monitor none \
  -daemonize \
  -pidfile "$PID_FILE"

echo "Home Assistant OS is starting at http://127.0.0.1:8123"

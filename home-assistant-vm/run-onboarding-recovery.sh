#!/usr/bin/env bash
set -euo pipefail

# This recovery launcher is for a Home Assistant OS image that was started
# with the legacy guest port (8123) instead of the current port (80).
# It starts a clean replacement without modifying a running VM.

VM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QEMU_BIN="/opt/homebrew/bin/qemu-system-aarch64"
QEMU_IMG="/opt/homebrew/bin/qemu-img"
QEMU_SHARE="/opt/homebrew/opt/qemu/share/qemu"
SOURCE_IMAGE="$VM_DIR/haos_generic-aarch64-18.3.qcow2.xz"
INSTANCE_NAME="${1:-recovery}"
HOST_PORT="${2:-8124}"
DISK_IMAGE="$VM_DIR/haos_generic-aarch64-18.3-${INSTANCE_NAME}.qcow2"
UEFI_CODE="$QEMU_SHARE/edk2-aarch64-code.fd"
UEFI_VARS="$VM_DIR/edk2-arm-vars-${INSTANCE_NAME}.fd"
PID_FILE="$VM_DIR/home-assistant-${INSTANCE_NAME}.pid"
LOG_FILE="$VM_DIR/home-assistant-${INSTANCE_NAME}.log"

if [[ ! -x "$QEMU_BIN" || ! -x "$QEMU_IMG" || ! -f "$SOURCE_IMAGE" || ! -f "$UEFI_CODE" ]]; then
  echo "Home Assistant VM recovery prerequisites are missing." >&2
  exit 1
fi

if [[ ! "$INSTANCE_NAME" =~ ^[a-z0-9-]+$ || ! "$HOST_PORT" =~ ^[1-9][0-9]{0,4}$ || "$HOST_PORT" -gt 65535 ]]; then
  echo "Usage: $0 [instance-name] [host-port]" >&2
  exit 1
fi

if lsof -t "$DISK_IMAGE" >/dev/null 2>&1; then
  echo "Recovery Home Assistant VM is already running at http://127.0.0.1:${HOST_PORT}"
  exit 0
fi

if [[ ! -f "$DISK_IMAGE" ]]; then
  xz -dc "$SOURCE_IMAGE" > "$DISK_IMAGE"
  "$QEMU_IMG" resize "$DISK_IMAGE" 32G
fi

[[ ! -f "$UEFI_VARS" ]] || rm "$UEFI_VARS"
cp "$QEMU_SHARE/edk2-arm-vars.fd" "$UEFI_VARS"
[[ ! -f "$PID_FILE" ]] || rm "$PID_FILE"

"$QEMU_BIN" \
  -accel hvf \
  -cpu host \
  -machine virt,highmem=on \
  -smp 2 \
  -m 3072 \
  -drive if=pflash,format=raw,readonly=on,file="$UEFI_CODE" \
  -drive if=pflash,format=raw,file="$UEFI_VARS" \
  -drive if=none,file="$DISK_IMAGE",format=qcow2,id=haos_recovery_disk \
  -device virtio-blk-pci,drive=haos_recovery_disk \
  -netdev user,id=haos_recovery_network,hostfwd=tcp:127.0.0.1:${HOST_PORT}-:80 \
  -device virtio-net-pci,netdev=haos_recovery_network \
  -device virtio-rng-pci \
  -display none \
  -serial file:"$LOG_FILE" \
  -monitor none \
  -daemonize \
  -pidfile "$PID_FILE"

echo "Recovery Home Assistant OS is starting at http://127.0.0.1:${HOST_PORT}"

#!/usr/bin/env bash
# Air-gapped Ubuntu VM: load bundle image and run staging container.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="${IMAGE_NAME:-dxapdfprocessor}"
IMAGE_TAR="${SCRIPT_DIR}/dxapdfprocessor.tar.gz"
CONTAINER_NAME="${CONTAINER_NAME:-dxapdfprocessor-staging}"
HOST_PORT="${HOST_PORT:-5085}"
CONTAINER_PORT="${CONTAINER_PORT:-85}"

if [[ ! -f "$IMAGE_TAR" ]]; then
  echo "error: ${IMAGE_TAR} not found. Unzip the VM bundle in this directory first." >&2
  exit 1
fi

echo "Loading Docker image from ${IMAGE_TAR}..."
docker load -i "$IMAGE_TAR"

LOADED="$(docker images --format '{{.Repository}}:{{.Tag}}' | grep "^${IMAGE_NAME}:" | head -1 || true)"
if [[ -z "$LOADED" ]]; then
  echo "error: could not find loaded image for ${IMAGE_NAME}" >&2
  exit 1
fi

docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$LOADED"

echo "Staging running: http://127.0.0.1:${HOST_PORT} (${CONTAINER_NAME} → ${LOADED})"

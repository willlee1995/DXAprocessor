#!/usr/bin/env bash
# Promote verified staging image to production (same loaded image, new container).
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-dxapdfprocessor}"
STAGING_CONTAINER="${STAGING_CONTAINER:-dxapdfprocessor-staging}"
PROD_CONTAINER="${PROD_CONTAINER:-dxapdfprocessor-prod}"
HOST_PORT="${HOST_PORT:-5086}"
CONTAINER_PORT="${CONTAINER_PORT:-85}"

if ! docker inspect "$STAGING_CONTAINER" >/dev/null 2>&1; then
  echo "error: staging container ${STAGING_CONTAINER} not found. Run ./deploy-staging.sh first." >&2
  exit 1
fi

IMAGE_ID="$(docker inspect -f '{{.Image}}' "$STAGING_CONTAINER")"
if [[ -z "$IMAGE_ID" ]]; then
  echo "error: could not read image from staging container" >&2
  exit 1
fi

docker rm -f "$PROD_CONTAINER" 2>/dev/null || true

docker run -d \
  --name "$PROD_CONTAINER" \
  --restart unless-stopped \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "$IMAGE_ID"

echo "Production running: http://127.0.0.1:${HOST_PORT} (${PROD_CONTAINER}, image ${IMAGE_ID})"

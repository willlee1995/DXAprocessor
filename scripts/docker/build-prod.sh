#!/usr/bin/env bash
# Build production Docker image for DXA PDF Processor (air-gapped path).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT}/DXAPDFProcessor"
IMAGE_NAME="${IMAGE_NAME:-dxapdfprocessor}"

cd "$APP_DIR"

if [[ ! -f .env.production ]]; then
  echo "error: DXAPDFProcessor/.env.production is required at build time (not committed)." >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
TAG_SEMVER="${TAG:-}"
if [[ -n "$TAG_SEMVER" ]]; then
  TAG_SEMVER="${TAG_SEMVER#v}"
  if [[ "$TAG_SEMVER" != "$VERSION" ]]; then
    echo "error: --tag v${TAG_SEMVER} does not match package.json version ${VERSION}" >&2
    exit 1
  fi
fi

export DOCKER_BUILDKIT=1

BUILD_ARGS=(
  -f Dockerfile.bun
  -t "${IMAGE_NAME}:${VERSION}"
  -t "${IMAGE_NAME}:v${VERSION}"
  -t "${IMAGE_NAME}:latest"
)

if [[ -n "${BUILDKIT_CACHE_FROM:-}" && -f "${BUILDKIT_CACHE_FROM}" ]]; then
  BUILD_ARGS+=(--cache-from "type=local,src=${BUILDKIT_CACHE_FROM}")
fi

if [[ -n "${BUILDKIT_CACHE_TO:-}" ]]; then
  BUILD_ARGS+=(--cache-to "type=local,dest=${BUILDKIT_CACHE_TO},mode=max")
fi

docker build "${BUILD_ARGS[@]}" .

echo "Built ${IMAGE_NAME}:${VERSION} (${IMAGE_NAME}:v${VERSION}, ${IMAGE_NAME}:latest)"

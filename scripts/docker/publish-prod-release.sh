#!/usr/bin/env bash
# Publish air-gapped VM bundle zip to GitHub Releases (SemVer + docker-prod).
# Run on a machine with Docker and gh auth — typically a Cursor cloud agent.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT}/DXAPDFProcessor"
IMAGE_NAME="${IMAGE_NAME:-dxapdfprocessor}"
REPO="${GITHUB_REPOSITORY:-willlee1995/DXAprocessor}"

DO_BUILD=false
SEMVER_MODE=false
TAG=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [--build] [--semver] --tag=vX.Y.Z

  --build    Build the production image before saving
  --semver   Require tag to match DXAPDFProcessor/package.json (recommended)
  --tag      SemVer GitHub release tag (e.g. v0.0.1)

Uploads:
  - dxapdfprocessor-vm-bundle-X.Y.Z.zip → release vX.Y.Z and rolling docker-prod
  - dxapdfprocessor-buildkit-cache.tgz → docker-prod only (not inside VM zip)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build) DO_BUILD=true; shift ;;
    --semver) SEMVER_MODE=true; shift ;;
    --tag=*) TAG="${1#*=}"; shift ;;
    --tag)
      TAG="${2:-}"
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$TAG" ]]; then
  echo "error: --tag=vX.Y.Z is required" >&2
  usage
  exit 1
fi

VERSION="${TAG#v}"
PKG_VERSION="$(node -p "require('${APP_DIR}/package.json').version")"
if $SEMVER_MODE && [[ "$VERSION" != "$PKG_VERSION" ]]; then
  echo "error: tag ${TAG} does not match package.json ${PKG_VERSION}" >&2
  exit 1
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

CACHE_DIR="${WORK}/buildkit-cache"
CACHE_TGZ="${WORK}/dxapdfprocessor-buildkit-cache.tgz"
IMAGE_TAR="${WORK}/dxapdfprocessor.tar.gz"
BUNDLE_ZIP="${WORK}/dxapdfprocessor-vm-bundle-${VERSION}.zip"
STAGING_DIR="${WORK}/bundle"

mkdir -p "$CACHE_DIR" "$STAGING_DIR"

# Optional: restore BuildKit cache from rolling docker-prod release
if gh release view docker-prod -R "$REPO" >/dev/null 2>&1; then
  if gh release download docker-prod -R "$REPO" -p "dxapdfprocessor-buildkit-cache.tgz" -D "$WORK" 2>/dev/null; then
    tar -xzf "$CACHE_TGZ" -C "$CACHE_DIR" 2>/dev/null || true
    export BUILDKIT_CACHE_FROM="$CACHE_DIR"
  fi
fi

export BUILDKIT_CACHE_TO="$CACHE_DIR"
export TAG="$VERSION"

if $DO_BUILD; then
  bash "${ROOT}/scripts/docker/build-prod.sh"
else
  if ! docker image inspect "${IMAGE_NAME}:${VERSION}" >/dev/null 2>&1; then
    echo "error: image ${IMAGE_NAME}:${VERSION} not found; pass --build" >&2
    exit 1
  fi
fi

docker save "${IMAGE_NAME}:${VERSION}" | gzip -c > "$IMAGE_TAR"

cp "${ROOT}/scripts/deploy/deploy-staging.sh" "$STAGING_DIR/"
cp "${ROOT}/scripts/deploy/deploy-promote.sh" "$STAGING_DIR/"
cp "${ROOT}/scripts/deploy/dxapdfprocessor-staging.desktop" "$STAGING_DIR/" 2>/dev/null || true
cp "${ROOT}/scripts/deploy/dxapdfprocessor-prod.desktop" "$STAGING_DIR/" 2>/dev/null || true
cp "$IMAGE_TAR" "$STAGING_DIR/"

(
  cd "$STAGING_DIR"
  zip -r "$BUNDLE_ZIP" .
)

if [[ -d "$CACHE_DIR" ]] && [[ -n "$(ls -A "$CACHE_DIR" 2>/dev/null || true)" ]]; then
  tar -czf "$CACHE_TGZ" -C "$CACHE_DIR" .
fi

if ! gh release view "$TAG" -R "$REPO" >/dev/null 2>&1; then
  echo "error: GitHub release ${TAG} not found. Merge a PR with a bump:* label first." >&2
  exit 1
fi

gh release upload "$TAG" "$BUNDLE_ZIP" --clobber -R "$REPO"

# Refresh rolling docker-prod release (current prod artifact + cache only)
if ! gh release view docker-prod -R "$REPO" >/dev/null 2>&1; then
  gh release create docker-prod --title "docker-prod" --notes "Rolling production Docker artifacts (air-gapped). BuildKit cache is for publish machines only — never deploy the cache tarball to VMs." -R "$REPO"
fi

gh release upload docker-prod "$BUNDLE_ZIP" --clobber -R "$REPO"
if [[ -f "$CACHE_TGZ" ]]; then
  gh release upload docker-prod "$CACHE_TGZ" --clobber -R "$REPO"
fi

echo "Published dxapdfprocessor-vm-bundle-${VERSION}.zip to ${TAG} and docker-prod"

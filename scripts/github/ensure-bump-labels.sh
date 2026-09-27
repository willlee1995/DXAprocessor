#!/usr/bin/env bash
# Create bump:* labels (repo admin). Cloud agent tokens often lack label write access.
set -euo pipefail

REPO="${1:-willlee1995/DXAprocessor}"

create() {
  local name="$1"
  local color="$2"
  local desc="$3"
  if gh label list -R "$REPO" --json name -q '.[].name' | grep -qx "$name"; then
    echo "exists: $name"
  else
    gh label create "$name" -R "$REPO" -c "$color" -d "$desc"
    echo "created: $name"
  fi
}

create "bump:major" "B60205" "SemVer major bump on merge to main"
create "bump:minor" "0E8A16" "SemVer minor bump on merge to main"
create "bump:patch" "1D76DB" "SemVer patch bump on merge to main"
create "bump:none" "C5DEF5" "Merge without cutting a SemVer release"

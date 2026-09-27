# Versioning and air-gapped releases (DXAprocessor)

This repository follows the HKCH **SemVer → offline Docker zip → USB → staging → promote** path. There is **no** public container registry, Cloudflare, Vercel, or Fly deploy hook for production.

## SemVer rules

| Item | Value |
|------|--------|
| Git tag | `vX.Y.Z` (leading `v`) |
| Source of truth | [`DXAPDFProcessor/package.json`](DXAPDFProcessor/package.json) `version` field (`X.Y.Z`, no `v`) |
| Changelog | Root [`CHANGELOG.md`](CHANGELOG.md), prepended on each release bump from the merged PR `## Changelog` section |
| PR gate | Exactly one label: `bump:major`, `bump:minor`, `bump:patch`, or `bump:none` (create via [`scripts/github/ensure-bump-labels.sh`](scripts/github/ensure-bump-labels.sh) if missing) |
| Notes-only tag | A SemVer GitHub Release created by Actions is **notes-only** until the VM bundle zip is attached — **never deploy it** without the zip |

## Docker identity (this app)

| Role | Name / port |
|------|-------------|
| Image name | `dxapdfprocessor` |
| Image tags (in tar) | `dxapdfprocessor:X.Y.Z`, `dxapdfprocessor:vX.Y.Z`, `dxapdfprocessor:latest` |
| VM bundle zip | `dxapdfprocessor-vm-bundle-X.Y.Z.zip` |
| Image tar inside zip | `dxapdfprocessor.tar.gz` |
| BuildKit cache (publish machine only) | `dxapdfprocessor-buildkit-cache.tgz` on release **`docker-prod` only** — not inside the VM zip |
| Staging container | `dxapdfprocessor-staging`, host **5085** → container **85** |
| Production container | `dxapdfprocessor-prod`, host **5086** → container **85** |
| Production Dockerfile | [`DXAPDFProcessor/Dockerfile.bun`](DXAPDFProcessor/Dockerfile.bun) (nginx serves built Vite static assets) |

Bake-time config: [`DXAPDFProcessor/.env.production`](DXAPDFProcessor/.env.production) must exist on the **publish machine** when building the image. Do not commit secrets; do not print env contents in logs.

## Release flow

1. Open a PR to `main` with one `bump:*` label and a `## Changelog` section in the PR body.
2. On merge, [`.github/workflows/release-on-bump-label.yml`](.github/workflows/release-on-bump-label.yml) bumps `package.json`, updates `CHANGELOG.md`, pushes `chore(release): vX.Y.Z`, and creates a **notes-only** GitHub Release `vX.Y.Z`. **Actions does not build Docker.**
3. **Cursor cloud agent** (or any host with Docker + `gh` auth + `.env.production`) publishes the offline bundle:

```bash
cd /path/to/DXAprocessor
./scripts/docker/publish-prod-release.sh --build --semver --tag=vX.Y.Z
```

Replace `vX.Y.Z` with the tag created in step 2. This attaches `dxapdfprocessor-vm-bundle-X.Y.Z.zip` to the SemVer release and refreshes the rolling **`docker-prod`** release (same zip + BuildKit cache tarball).

4. **Air-gapped Ubuntu VM:** copy the zip off GitHub (off-VM), unzip, then:

```bash
./deploy-staging.sh
# verify http://127.0.0.1:5085
./deploy-promote.sh
# production http://127.0.0.1:5086
```

## Branch protection

`main` must allow `github-actions[bot]` to push release commits (`chore(release): …`) after PR merge.

## Rolling `docker-prod` tag

GitHub Release **`docker-prod`** always mirrors the current production zip (and publish-cache tarball). It is not a SemVer deploy target by itself — operators deploy from a **SemVer** release that includes the bundle zip.

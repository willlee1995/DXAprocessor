# Agent handbook — DXAprocessor

## SemVer and air-gapped Docker releases

| Step | Owner | What happens |
|------|--------|----------------|
| PR merge | Human + label | Exactly one `bump:major` \| `bump:minor` \| `bump:patch` \| `bump:none` on the PR |
| Cut SemVer | GitHub Actions | [`release-on-bump-label.yml`](.github/workflows/release-on-bump-label.yml) bumps version, updates [`CHANGELOG.md`](CHANGELOG.md), tags `vX.Y.Z`, creates **notes-only** release |
| Build + upload zip | **Cursor cloud agent** (not Actions) | Run publish script with Docker + `gh` + [`DXAPDFProcessor/.env.production`](DXAPDFProcessor/.env.production) |
| VM deploy | Operator | Unzip bundle → [`deploy-staging.sh`](scripts/deploy/deploy-staging.sh) → verify → [`deploy-promote.sh`](scripts/deploy/deploy-promote.sh) |

**Hard rules**

- Never deploy a SemVer release until `dxapdfprocessor-vm-bundle-X.Y.Z.zip` is attached.
- Never invent a public registry path or add Cloudflare/Vercel/Fly as the release path.
- BuildKit cache tarball lives on **`docker-prod` only**; never put it in the sneakernet zip.

**Publish command (cloud agent)**

From repo root, after a bump merge created tag `vX.Y.Z`:

```bash
./scripts/docker/publish-prod-release.sh --build --semver --tag=vX.Y.Z
```

Full detail: [`VERSIONING.md`](VERSIONING.md).

## Repo layout

- Application source: [`DXAPDFProcessor/`](DXAPDFProcessor/) (Vite + React, nginx in production)
- Docker build: [`scripts/docker/build-prod.sh`](scripts/docker/build-prod.sh) using `Dockerfile.bun`
- VM deploy scripts (copied into bundle): [`scripts/deploy/`](scripts/deploy/)

## PR checklist

- [ ] One `bump:*` label
- [ ] `## Changelog` section in PR description
- [ ] After merge: cloud agent runs publish script for the new tag (if bump was not `bump:none`)

# Releasing vibe

This repository supports automated release to both npm and GitHub Releases.

Workflow file: `.github/workflows/release.yml`

## Prerequisites

- npm package ownership for `ai-vibe`
- GitHub repository secret: `NPM_TOKEN`

## Create `NPM_TOKEN` (Automation token)

1. Sign in at npmjs.com.
2. Go to Account Settings -> Access Tokens.
3. Create a token of type `Automation`.
4. Copy token value (shown once).
5. In GitHub repo:
   - Settings -> Secrets and variables -> Actions
   - New repository secret
   - Name: `NPM_TOKEN`
   - Value: your npm automation token

## Release flow

On push to `main` (or manual `workflow_dispatch`), release workflow will:

1. Run `npm install`
2. Run `npm run ci`
3. Read `name` and `version` from `package.json`
4. Check npm for `${name}@${version}`
   - if exists: skip publish
   - if missing: publish with `npm publish --access public --provenance`
5. Ensure git tag `v<version>` exists
6. Ensure GitHub Release for `v<version>` exists

## Typical maintainer process

1. Prepare release PR
   - update code/docs
   - bump `package.json` version
2. Merge PR into `main`
3. GitHub Actions handles publish + tag + release

Version bump examples:

```bash
# patch release (bugfix)
npm version patch --no-git-tag-version

# minor release (new backward-compatible feature)
npm version minor --no-git-tag-version

# major release (breaking change)
npm version major --no-git-tag-version
```

## Manual trigger

From GitHub UI:

- Actions -> Release -> Run workflow

Via CLI:

```bash
gh workflow run release.yml --ref main
```

## Troubleshooting

### `NPM_TOKEN` missing

- Symptom: workflow fails before publish
- Fix: add `NPM_TOKEN` in GitHub Actions secrets

### npm version already exists

- Symptom: publish is skipped
- Fix: bump `package.json` to a new version and push again

### tag already exists

- Symptom: tag creation skipped
- Behavior: workflow continues and only creates missing GitHub release if needed

### release already exists

- Symptom: release creation skipped
- Behavior: workflow completes successfully

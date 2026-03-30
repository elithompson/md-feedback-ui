# md-feedback-ui

Browser-based markdown review UI with inline commenting and screenshot support.

## Development

```bash
npm install
npm run dev          # Vite frontend (port 5173)
npx tsx src/server/index.ts test-fixtures/ --no-open  # API server (port 3456)
npm run check        # typecheck + lint + test
```

## Testing

Tests use Vitest with jsdom for components and node environment for server tests. Write tests first (TDD) — failing test, then implementation.

```bash
npm test             # run once
npm run test:watch   # watch mode
```

## Publishing a new version

Trusted publishing is configured via OIDC — no tokens needed.

1. Bump the version in `package.json` (e.g. `0.2.0` -> `0.3.0`)
2. Commit the version bump and push to `main`
3. Wait for CI to pass on the push
4. Create a GitHub release: tag should match the version with a `v` prefix (e.g. `v0.3.0`)
5. The `publish.yml` workflow runs automatically: checks, builds, and publishes to npm with provenance
6. Verify with `npm view md-feedback-ui version`

The first publish (0.1.0) was done manually with a passkey. All future publishes go through GitHub releases.

## Project structure

- `src/client/` — React frontend (Vite)
- `src/server/` — Express CLI + API server
- `skill/md-feedback-ui.md` — Claude Code skill (shipped in npm tarball)
- `.claude/commands/md-feedback-ui.md` — Local project skill (same content)

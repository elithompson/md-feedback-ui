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

1. Bump version in `package.json`
2. Commit and push to `main`
3. Create a GitHub release (tag matching the version, e.g. `v0.2.0`)
4. The `publish.yml` workflow runs automatically: check, build, publish to npm with provenance

The first publish (0.1.0) was done manually. All future publishes go through GitHub releases.

## Project structure

- `src/client/` — React frontend (Vite)
- `src/server/` — Express CLI + API server
- `skill/plan-review.md` — Claude Code skill (shipped in npm tarball)
- `.claude/commands/plan-review.md` — Local project skill (same content)

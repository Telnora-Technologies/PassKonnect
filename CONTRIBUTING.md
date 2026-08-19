# Contributing

## Setup

Follow the [README](README.md) to get `server/` and `client/` running
locally.

## Before opening a PR

```bash
cd server && npm run lint && npm test
cd client && npm run lint && npm test
```

Both must pass — CI (`.github/workflows/ci.yml`) runs the same checks,
plus coverage thresholds, `npm audit`, and a production build of the
client, on every push and pull request.

## Commit style

Keep commits small and focused: one feature or fix per commit, with its
tests included in the same commit rather than added later. Avoid bulk
commits that mix formatting, refactors, and behavior changes.

## Code style

- Prettier (`.prettierrc.json`) and ESLint (`eslint.config.js`) are
  configured in both packages — `npm run lint` checks both.
- Validate request bodies at API boundaries with Zod (see
  `server/src/schemas/`).
- Wrap async route handlers in `asyncHandler` so rejected promises don't
  crash the process.

# Contributing to express-inertia

Thanks for wanting to contribute! This guide covers how to set up the project, run checks, and get your changes merged.

## Development setup

Requirements:

- Node.js `>=18`
- npm

Install dependencies:

```bash
npm install
```

## Commands

| Command | Description |
|---|---|
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | ESLint over `src/` and `tests/` |
| `npm test` | Run the full Vitest suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with v8 coverage + thresholds |
| `npm run build` | Build `dist/` with tsup |
| `npm run dev` | Rebuild on source changes |

All checks must pass locally before opening a pull request:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Project layout

- `src/` — library source (ESM-first TypeScript, `NodeNext` resolution)
- `tests/` — Vitest suites, including a real Vue + Vite integration build
- `templates/base.ejs` — the default root view shipped with the package

## Test notes

- The Vue integration suite (`tests/vue-inertia.integration.test.ts`) compiles a
  real Vite production build into `tests/temp_vue_inertia_client/` the first
  time it runs. The compiled fixture is reused on later runs; delete that folder
  to force a rebuild.
- Temp fixtures under `tests/temp_*/` are gitignored.
- When changing engine caching behavior, keep the `fs.readFileSync` spy tests in
  `tests/engine.test.ts` honest: they assert how many times templates are read.

## Pull request guidelines

- Keep changes focused; one concern per PR.
- Add or update tests for any behavior change.
- Update `CHANGELOG.md` under `[Unreleased]`.
- Update `README.md` when public APIs or options change.
- Rebase onto the latest `main` before requesting review.

## Reporting issues

Include the Node/Express versions, the adapter (Vue/React/Svelte), the Vite
version, and a minimal reproduction when possible.
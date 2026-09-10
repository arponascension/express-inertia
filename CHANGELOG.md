# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-09-10

### Added

- `clearCustomDirectives()` to reset the global Blade directives registry.
- `test:coverage` script with v8 coverage reporting and thresholds.
- `lint` script powered by ESLint + `typescript-eslint`.
- CI workflow validating typecheck, lint, tests, and build on Node 18/20/22.
- `engines` field declaring Node `>=18` support.
- Expanded README and npm metadata for search-engine discoverability.

### Changed

- Template engine cache is now owned by the package: compiled templates are
  reused until the source file changes (mtime-based invalidation in dev mode),
  removing reliance on EJS's internal cache and per-request re-reads.
- `templateSource` renders entirely without touching the filesystem.
- `ViteHelper.isDev()` short-circuits on an explicit `isDev` config value.
- Circuit breaker registry is bounded (`MAX_CIRCUIT_BREAKERS`) and keyed by
  order-stable option serialization.
- Vite plugin registers its `process.once('exit')` cleanup handler only once.
- `generateSriHash` reuses a single lazily-loaded `node:crypto` import.
- Test suite: the Vue/Inertia protocol integration test reuses its compiled
  fixture across runs, cutting repeat-run time from ~8s to ~4s.

## [1.0.1] - 2026-09-10

### Fixed

- XSS: CSRF token output is HTML-attribute escaped (`escapeHtmlAttr`).
- XSS: Inertia page JSON inside `<script>` tags escapes `<` as `\u003c`.
- XSS: `escapeJsString` now escapes `\n`, `\r`, `\u2028`, and `\u2029`.
- Request IDs now use `crypto.randomUUID()` instead of `Math.random()`.
- SSR timeout is always cleared on failure paths (timer leak).
- `templateSource` is respected even when it is an empty string.
- `throw undefined` is guarded before rethrowing in the SSR retry loop.
- `import('node:crypto')` failures no longer leak across test runs.
- `sanitizeViewData` can be disabled independently of component validation.
- Version checks (`409`) now apply to all HTTP methods, matching Inertia spec.
- Dev-mode prefetch tags honour the configured `crossorigin` attribute.

### Changed

- Removed dead/misused code: `circuitBreakers` state on `CircuitBreaker`,
  unused `pad()` logger helper, orphaned `src/templates/base.ejs`.
- `catch (err: any)` replaced with `catch (err: unknown)` throughout.
- Added public `ViteHelper.getBasePath()` and a `req.id` Express type
  augmentation.
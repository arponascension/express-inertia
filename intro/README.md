# Express-Inertia Documentation Site

Documentation website for [@arponascension/express-inertia](https://www.npmjs.com/package/@arponascension/express-inertia), hosted on GitHub Pages under `/express-inertia/`.

The design follows the visual language of [react.dev](https://react.dev): light wash background with the exact color tokens (`#23272F` text, `#087EA4` accent, the `colors.js` gray/blue scales), alternating conic-gradient homepage sections, dark grid footer, rounded code panels with filename bars, and a right-hand "On this page" table of contents.

Built with React, Vite, and Tailwind CSS.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

The build output is served under the `/express-inertia/` base path (configured in `vite.config.ts`). Routing uses `HashRouter`, so all routes work on GitHub Pages without rewrites.

### Option 1: Manual

```bash
npm run build
npx gh-pages -d dist
```

### Option 2: GitHub Actions (recommended)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.

1. In the repository, go to **Settings -> Pages**.
2. Set **Source** to "GitHub Actions".

## Structure

```
intro/
  index.html                  # HTML entry
  vite.config.ts              # Vite config with /express-inertia/ base
  tailwind.config.js          # react.dev color tokens, fonts, shadows, gradients
  src/
    App.tsx                   # HashRouter + routes
    index.css                 # Base styles, syntax theme, footer grid
    lib/
      highlight.tsx           # Light-theme syntax tokenizer
    pages/
      Home.tsx                # Homepage mirroring react.dev HomeContent
      GettingStarted.tsx      # Installation + server/client setup
      Tutorial.tsx            # Step-by-step task-manager tutorial
      ApiReference.tsx        # Full API reference
    components/
      Navbar.tsx              # react.dev-style top nav
      Sidebar.tsx             # Docs sidebar with blue active links
      Toc.tsx                 # "On this page" scroll-spy nav
      Footer.tsx              # Dark grid footer with link columns
      CodeBlock.tsx           # Filename-bar code panels + copy
      BrowserChrome.tsx       # Window-chrome previews for the homepage
      Callout.tsx             # Note / Pitfall callouts
```
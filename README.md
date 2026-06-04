# All of Our Ancestors

A minimal React/Vite site for an educational deep-time ancestry atlas, from LUCA to recent modern humans.

This repo was packaged for GitHub Pages. It includes the patched JSX app, the 45-stage content dataset, and a GitHub Actions workflow that builds and deploys the `dist/` output to Pages.

## What is included

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages deployment workflow
├── content/stages.json           # 45-stage ancestry dataset
├── src/App.jsx                   # Main React app
├── src/main.jsx                  # React entry point
├── src/styles.css                # Site styles
├── index.html                    # Vite HTML shell
├── package.json                  # Scripts and dependencies
├── vite.config.js                # Vite + GitHub Pages base-path config
└── .gitignore
```

## Local development

```bash
npm install
npm run dev
```

Then open the local URL Vite prints in the terminal.

## Build locally

```bash
npm run build
npm run preview
```

## Deploy on GitHub Pages

1. Create a new GitHub repo.
2. Upload/push the contents of this folder to the repo's `main` branch.
3. In GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push to `main`. The workflow in `.github/workflows/deploy.yml` will build and deploy the site.

The Vite config automatically sets the correct base path for GitHub Pages using the repository name during GitHub Actions builds.

## Patch note

The original `TimelineStrip` JSX used CSS `calc()` expressions that multiplied unit-bearing values, for example:

```jsx
calc(${top}% * (100% - ${PAD * 2}px) / 100%)
```

That pattern is fragile because CSS multiplication with mixed units is not broadly valid. The patched version moves that math into JavaScript:

```jsx
const timelinePos = (pct) => `calc(${pct}% + ${PAD - (pct / 100) * PAD * 2}px)`;
const timelineHeight = (pct) => `calc(${pct}% - ${(pct / 100) * PAD * 2}px)`;
```

CSS now only receives ordinary percentage-plus-pixel or percentage-minus-pixel expressions.

## Content caveat

Exemplar fossils are usually representative close relatives, not proven direct ancestors. This is a bushy-path visualization, not a literal ancestor chain.

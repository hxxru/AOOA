# Devlog

## v1.0.0 - Interactive ancestry atlas

Released as the first stable testing version of the All of Our Ancestors React/Vite site.

### Current behavior

- The app renders 45 lineage stages from `content/stages.json`.
- Each stage includes a short `intro` field rendered between the title/subtitle and the illustration area.
- The sidebar/timeline window is era-anchored: it starts at the oldest entry in the current era and shows every later era, while older eras are collapsed.
- Desktop navigation supports sidebar clicks, footer prev/next buttons, arrow keys, Home, and End.
- Mobile navigation hides footer prev/next buttons and uses horizontal gestures: swipe left for next, swipe right for previous.
- The mobile footer shows a small first-use swipe hint that disappears after navigation.
- The info/help content opens in a centered modal with a blurred backdrop.
- The footer displays the app version from `package.json`.
- Stage records can include curated external links. The current UI renders Wikipedia links as icon-only buttons using Wikipedia's favicon.
- Stage records can include an `illustration` object with `src` and `alt`. Static trial images live under `public/illustrations/`.

### Implementation notes for future agents

- `src/App.jsx` is the only React component file. Keep small interaction changes there unless the app grows enough to justify splitting components.
- `src/styles.css` owns the whole layout, including the desktop/sidebar and mobile/top-rail breakpoints.
- Do not reintroduce CSS `calc()` multiplication for timeline positions. Timeline percentage/pixel math is intentionally done in JavaScript before values reach CSS.
- Mobile swipe handling uses native `touchstart`, `touchend`, and `touchcancel` listeners on `.main-shell`, with pointer events retained as a non-touch fallback for testing.
- The mobile horizontal stage rail is separate from page swipes. Swipe page content to navigate stages; scroll the rail to browse visible stages.
- Keep `content/stages.json` as structured data. Avoid hard-coding stage facts into JSX.
- Keep stage intros to 2-3 concise sentences. They should orient, not replace citations or detailed explainers.
- Prefer curated `links` entries over generated URLs; many stage names are lineage grades rather than exact article titles.
- Keep illustration paths root-relative in data, for example `/illustrations/stage-10-early-chordate.jpg`. `src/App.jsx` prefixes them with `import.meta.env.BASE_URL` so GitHub Pages deployments under `/AOOA/` load assets correctly.
- `.DS_Store` is ignored and should not be reintroduced to the repository.

### Verification checklist

- Run `npm run build` before committing.
- Check desktop navigation: sidebar, footer buttons, arrow keys, Home, End.
- Check mobile navigation on a real phone after deploy, especially horizontal swipes inside the page content.
- Confirm the footer version matches `package.json`.
- Spot-check that stage external links open the intended pages in a new tab.
- Confirm GitHub Pages deploys from the `main` branch workflow.

## Milestones

- [x] v1.0.0: stable navigation model, mobile gestures, visible footer version, GitHub Pages deployment.
- [ ] v1.1.0: replace illustration placeholders with real generated or sourced visuals for each stage.
- [ ] v1.2.0: add detailed explainer copy for every stage.
- [ ] v1.3.0: add source/citation metadata to each stage in `content/stages.json`.
- [ ] v1.4.0: improve accessibility for modal focus handling and mobile gesture alternatives.
- [ ] v2.0.0: richer stage pages with visual comparisons, fossil context, and optional deep-dive views.

## Open questions

- Should versioning use git tags/releases in addition to `package.json`?
- Should stage content support citations and confidence notes as first-class fields?
- Should generated visual assets be committed, or fetched from a separate asset pipeline?

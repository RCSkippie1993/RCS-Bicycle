# RCS Bicycle

South African road-bike sourcing configurator. Seven component groups, real manufacturer model references, local build persistence, optional rider requirements, shift-control mismatch checks and downloadable sourcing briefs.

## Development

Requires Node.js 20.19+ or 22.12+ (validated on Node 24).

```sh
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
```

```sh
npm test
npm run build
npm run preview -- --port 4173
```

No credentials, database or external services are required to run the site. Fonts are bundled locally. Use the existing cloud checkout; tasks are isolated and no Git worktree is needed.

## Product data and evidence

`src/catalog.js` contains named models from Specialized, Shimano, DT Swiss, Continental and PRO. These replace the original fictional demonstration products. Exact model years, sizes, variants, specifications, photography, local availability and prices have **not been reviewed** because manufacturer and retailer websites were blocked by the environment network policy during this update.

Manufacturer links are catalog/research destinations, not citations to verified product-level specifications. There is no claimed supplier or brand partnership. Each entry records a pending verification status and null review date/source evidence. All prices, weights and scores remain unknown; unknown is never converted to zero or an invented star rating.

Before verifying an entry, record the exact variant, reviewed product URL, review date, dimensions and standards, package contents and weight measurement basis. Prices need a South African source, currency, date, VAT treatment, stock status and unit basis (pair/single/bundle). Avoid double-counting bundled controls, seatposts or other parts. Add product photographs only from a source that permits the intended use and keep their source/usage record. The current bicycle illustration is explicitly generic. An entry's `image` can display an appropriately sourced selected-frame photograph later.

Mechanical Shimano 105 and Di2 shift controls are checked for a control-system mismatch. No full physical-fit guarantee is made: frame sizing, tire clearance, axle/freehub standards, bottom bracket, headset, cockpit, seatpost, saddle rails, rotors and included small parts require review. Performance ratings require comparable measurement evidence; bike weight alone is not a climbing score.

Builds and optional rider requirements stay in the browser. Rider details include a riding goal, whole-rand budget target, height and cycling inseam. They support supplier and fitter review and do not calculate a frame size or establish affordability. All fields may be left blank. A clear action removes locally saved rider details; resetting components preserves those details. The sourcing brief includes provided rider details and downloads as text; it is not submitted to RCS. No customer data is collected, payment accepted, inventory reserved or order created.

## Validation

Rider tests cover optional fields, numeric normalization, invalid and contradictory measurements, budget validation and unsafe stored values. Browser checks exercise rider save/reload, unsaved cancellation, clearing, optional empty details, exported measurements and budget, mobile dialogs and unavailable-browser-storage fallback.

`npm test` covers null handling for unknown totals and evidence, mechanical/Di2 control mismatches, migration from saved fictional selections, and all 288 catalog combinations. Browser checks cover real model selection, source links, unknown pricing/ratings, mismatch blocking, persistence, brief download and mobile layout.

## Public preview

The build uses relative asset URLs. The `gh-pages` branch contains the compiled preview and a `.nojekyll` marker. In GitHub **Settings → Pages**, choose **Deploy from a branch → gh-pages → / (root)**. Source changes on `main` do not automatically update `gh-pages`; publish a newly built tree to that branch after validation, preserving its current parent and avoiding force pushes.

## Next phase

Verify official specifications and permitted photographs, establish South African supplier pricing and availability, then build evidence-based comparisons. Add secure quote submission and customer privacy handling before collecting personal data. Enable payment only once sourcing and fulfilment are established.

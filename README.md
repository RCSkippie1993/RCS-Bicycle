# RCS Bicycle

South African road-bike configurator prototype. Dark equipment-selection interface, ZAR pricing, seven component groups, local build persistence, tire-clearance checks, illustrative build scores and downloadable sourcing briefs.

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

No credentials, database or external services required. Fonts are bundled locally. Do not expose the development server as a production service.

## Current scope

All catalog entries in `src/catalog.js` are fictional. Prices are demo estimates in ZAR, not retail offers. Scores demonstrate the interface and are not measured claims. Bike illustration does not render individual component changes. Only tire clearance is checked; no real-world compatibility guarantee is made. Brakes and levers are bundled pending verified component compatibility data.

Builds are stored only in the browser. The sourcing brief downloads as text; it is not submitted to the shop. No customer information is collected, payment accepted, inventory reserved or order created.

## Validation

`npm test` checks default totals, incompatible tire clearance and score/total bounds across all 144 combinations. Browser smoke checks during development covered selection, invalid-build blocking, persistence across reload, summary, downloaded brief, reset, mobile overflow and JavaScript errors.

## Next product phase

1. Add verified manufacturer specifications and source URLs, model years, supported sizes, standards, provenance and last-reviewed dates.
2. Establish supplier relationships, availability, VAT treatment, assembly and shipping prices before displaying real offers.
3. Replace demonstration scores with documented evidence and disclose uncertainty; assess rider fit separately.
4. Add persistent quote submission, secure admin access and customer privacy/consent handling before collecting customer data.
5. Add stock and payment integration only once fulfilment is established.

Use the existing checkout in cloud tasks; each task is isolated, so no Git worktree is needed.

## Public preview on GitHub Pages

The production build uses relative asset URLs so it can be served at a GitHub Pages project path. The `gh-pages` branch contains the compiled preview with a `.nojekyll` marker.

In the repository's **Settings → Pages**, select **Deploy from a branch**, choose **gh-pages** and **/ (root)**, and save. GitHub will show the public URL when deployment completes. This is a demonstration site with fictional products and prices, not a payment-enabled store.

Changing source on `main` does not automatically update this preview branch; rebuild and republish the compiled files after changes.

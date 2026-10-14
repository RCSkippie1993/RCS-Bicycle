# RCS Bicycle

South African road-bike sourcing configurator with actual product photos, dated ZAR price references, rider requirements, source links, a schematic 3D assembly viewer and downloadable sourcing briefs.

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

No credentials or external service is needed to run the app. Fonts and product photos are bundled locally. Use the existing cloud checkout; tasks are isolated and no Git worktree is needed.

## 3D preview

Choose **3D schematic** in the builder to rotate/zoom a generic assembly, switch wheel/frame styles, select camera presets or separate the component groups. The default view stays on sourced product photographs. No AI-generated or supplier product models exist in the current catalog; the mesh is explicitly schematic and does not establish real appearance or fit.

The GLB import adapter supports reviewed frame and wheel assets with source/credit/usage metadata, metre units and reviewed assembly anchors. See [the asset contract](docs/3d-assets.md) and [first model production brief](docs/model-production-brief.md). The viewer falls back to photos if WebGL is unavailable, and to schematic geometry if a registered product asset fails. The engine is lazy-loaded and renders only on interaction/resize.

## Sourced catalog

`src/catalog-data.json` records product-level source URLs, observed prices, quantities, reference variants, availability notes, check dates and original photo URLs. The 14 October 2026 review used Specialized South Africa manufacturer pages and public Bike Addict product listings. See [the source register](docs/product-sources.md).

The builder contains 44 product/bundle options and the collection browser includes 24 complete-bike references (68 total). Search, category, brand and price-source filters, sorting and incremental loading keep the collection manageable. Each reference links to local source photos under `public/products` and its exact source listing. Photos show individual products or a source bundle, not a rendered assembled build. Source attribution records provenance; supplier image authorization should be confirmed before a commercial sales launch.

Manufacturer MSRP is distinguished from retailer listing prices. Reference variants and quantities are explicit: two individual tires; left and right mechanical lever/caliper kits; a handlebar plus stem; five separately listed items for the mechanical drivetrain. No retailer relationship, RCS inventory or RCS selling price is claimed. A manufacturer listing or a retailer availability flag does not establish an RCS sourcing commitment.

The default selected-parts reference subtotal is R51,610. This is not a complete-bike quote: confirm VAT treatment, exact fit and missing parts, rotors, bottom bracket, tubes/sealant, tape, pedals, assembly and delivery. Manufacturer MSRP can differ from promotional or dealer prices. The snapshots do not refresh automatically.

The Di2 groupset listing describes shift controls. Its exact caliper/rotor inclusions remain unconfirmed, so the matching brake package remains unpriced rather than adding a duplicate controls charge or inventing a zero-price kit. The UI displays a partial subtotal and an unpriced-category warning for that build.

Control-system mismatches and sourced maximum tire widths are checked. Unknown clearance remains unknown. Full size, axle/freehub, tire/rim, brake mount, BB, headset, cockpit, seatpost and rail compatibility require review. A frame that includes a stem may use the selected cockpit as an additional replacement; that is disclosed. Source-stated product weights retain their measurement basis and are not turned into complete-bike weight or performance stars.

## Collection pages and build box

The home page (`index.html`) shows a three-product collection preview, category links and the configurator. The full searchable catalog is on `collection.html`; Vite builds both HTML entry points with relative URLs for GitHub Pages. Category links use `?category=wheels` and product links use `?product=rd50`. Products can be added from preview cards, catalog cards, product dialogs or the selected builder preview. **Save these 7 products to box** saves the current configurator selection without duplicating existing rows or changing their quantities.

The shared build box opens from the navigation or floating button on either page. Expand it for a larger product list and summary. It supports package quantities from one to twenty, removal, clearing, category coverage, alternative/control-system warnings and a downloaded sourcing list. A tire package already represents two tires; controls and cockpit bundles retain their listed inclusions. Known component and complete-bike subtotals are separate, with a combined saved-reference subtotal. Unpriced lines remain pending and are excluded from known subtotals rather than treated as free.

The box starts empty. Selections persist locally under `rcs-build-box` with a versioned schema containing only validated product IDs and quantities; prices always come from the current catalog. Retired IDs, malformed quantities and duplicates are discarded, excessive quantities are capped, and cross-tab changes refresh the box. If storage is unavailable, the box works for the current visit and reports the persistence limit. Existing `rcs-build` and `rcs-rider` data remain separate. No personal data or order is sent to a server.

**Use box components in builder** transfers one package per represented component category while preserving the other builder selections. Multiple alternatives, extra component packages and detected control/clearance errors must be resolved first. Complete bikes stay in the box and never enter the configurator subtotal. Category coverage does not guarantee an assembled or compatible bicycle; the existing full-fit and supplier-confirmation limits still apply. The box export multiplies original source quantities by package quantities and retains source URLs, exact reference variants, price type, unpriced package caveats and optional locally saved rider details.

## Product reference profiles

Every reference has an RCS profile with dated evidence and explanations, including 64 cost scores and four unpriced references. Budget accessibility describes listed spend, not quality or value. Additional scores describe rim depth, nominal tire width and listed wheelset/complete-bike mass when evidence exists. Higher means more of the named trait; it does not guarantee suitability or faster riding. Unknowns remain pending. Frameset and cockpit package weights are not scored because inclusions differ. No component-to-build measured-performance prediction is performed. A separate editorial specification-to-goal estimate is described below. Source basis, fixed endpoints, rounding and limits are published in [the ratings method](docs/ratings.md) and on the website. Profiles also accompany each selected component in the sourcing export.

## Live overall build goal match

The builder shows a whole-build **RCS goal match** above the component configurator and a compact score link beside the choices. It updates when products or the riding goal change; choose balanced road, racing/aero, climbing/low-mass or comfort/endurance. The current goal saves alongside optional rider details without dropping measurements or budget. The full selected-parts list, score inputs, weights, source links and coverage remain available. The sourcing brief and an unambiguous seven-category build box carry the same rating.

This is an editorial specification-preference estimate, not an overall quality score or tested aero/climbing/comfort result. It uses only source-backed frame purpose plus listed wheel-pair mass, rim depth and nominal tire width with published goal weights. Price, frame package weight, rider measurements and undocumented performance of drivetrain/brakes/cockpit/saddle are excluded. Missing weighted evidence produces a labelled provisional score with coverage; detected component conflicts or explicitly missing essentials withhold the overall score. Read the [build rating method](docs/build-ratings.md). Product cost profiles retain their separate method/version.

There are nine frame options across Specialized, Pinarello and Colnago. Six have verified SA price references; three Aethos/Roubaix manufacturer references require a South African quote. CWC prices retain cents. The Colnago frame-only listing excludes a fork/headset/axles, so its overall goal match is withheld until required parts are resolved; it is never presented as a complete frame-and-fork package. Source descriptions, exact variants, photos and exclusions are in the [source register](docs/product-sources.md).

## Rider requirements and privacy

Riding goal (including climbing/low-mass focus), whole-rand budget, height and cycling inseam are optional. Details save in local browser storage and appear in the downloaded brief. They support supplier/fitter review and do not calculate frame size. Clearing rider details removes that local profile; resetting components preserves it. There is no server submission, customer account, payment, stock reservation or order creation.

## Validation

`npm test` also verifies 3D provenance, metadata/alignment rules, schematic/data separation and valid self-contained GLB files. Real WebGL browser tests cover camera and mesh changes, no-WebGL fallback, resource disposal and the GLB loader with an unbranded test fixture.

Catalog checks cover sourced quantities/subtotals, separate complete-bike pricing, local photo/source coverage, partial pricing for the Di2 package, all 95,040 component combinations (47,520 control mismatches), rider validation, source-aware exports and HTML escaping. Browser checks cover all 68 catalog images, intersecting filters and empty results, pagination, product dialogs and evidence, selecting catalog components into the builder, option search, totals, compatibility, persistence, source-aware exports and mobile layout. Rating tests cover fixed endpoints, direction/clamping, evidence requirements, pending fields, coverage and search/sort behavior. Build-box tests cover untrusted storage, catalog-derived prices, package arithmetic, separate complete-bike subtotals, idempotent build saving, alternatives/control mismatches, unpriced lines and multiplied source quantities in exports. Live build-rating tests cover goal weights, rounded results, input changes, evidence gaps, excluded price/unknown inputs, conflicts, frame-only exclusions and export provenance. Browser validation covers both actual production HTML pages, preview/category/product links, cross-page and cross-tab persistence, add/edit/remove/clear, compact/expanded box layouts, downloads, builder transfers and mobile widths from 320 to 1440 pixels.

## Public preview

The two-page production build uses relative asset URLs; both `index.html` and `collection.html` must be deployed together. `gh-pages` contains compiled preview files plus `.nojekyll`. GitHub **Settings → Pages** uses **Deploy from a branch → gh-pages → / (root)**. Source changes on `main` do not automatically rebuild `gh-pages`; publish a validated build tree while preserving the current deployment parent, without force pushing.

## Updating product evidence

Open the exact product/variant source, reconfirm price/currency, package quantities, stock notes and model/colour/size. Update source and review dates, and compare any manufacturer MSRP against current promotions without silently treating it as a dealer offer. Price bundles by their line items, avoiding duplicate included controls or other parts. Keep unknown fields null. Refresh the original photo only from the correct product listing with an appropriate usage basis. Run tests/build and recheck the sourcing export before publishing. Performance ratings need independent comparable evidence. Reference profiles use the fixed, transparent cost/specification scales in [the ratings method](docs/ratings.md); they are not performance tests.

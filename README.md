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

`src/catalog-data.json` records product-level source URLs, observed prices, quantities, reference variants, availability notes, check dates and original photo URLs. The original catalog was reviewed on 14 October 2026 using Specialized South Africa and Bike Addict listings. Wheelset offers were expanded on 15 October 2026 across seven South African retailers; each reference retains its own review date. See [the source register](docs/product-sources.md).

The builder contains 65 builder product/bundle options, 24 complete-bike references and 148 additional wheelset offers (237 total collection references). Search, category, brand and price-source filters, sorting and incremental loading keep the collection manageable. Each reference links to local source photos under `public/products` and its exact source listing. Photos show individual products or a source bundle, not a rendered assembled build. Source attribution records provenance; supplier image authorization should be confirmed before a commercial sales launch.

Manufacturer MSRP is distinguished from retailer listing prices. Reference variants and quantities are explicit: two individual tires; left and right mechanical lever/caliper kits; a handlebar plus stem; five separately listed items for the mechanical drivetrain. No retailer relationship, RCS inventory or RCS selling price is claimed. A manufacturer listing or a retailer availability flag does not establish an RCS sourcing commitment.

The default selected-parts reference subtotal is R51,610. This is not a complete-bike quote: confirm VAT treatment, exact fit and missing parts, rotors, bottom bracket, tubes/sealant, tape, pedals, assembly and delivery. Manufacturer MSRP can differ from promotional or dealer prices. The snapshots do not refresh automatically.

The Di2 groupset listing describes shift controls. Its exact caliper/rotor inclusions remain unconfirmed, so the matching brake package remains unpriced rather than adding a duplicate controls charge or inventing a zero-price kit. The UI displays a partial subtotal and an unpriced-category warning for that build.

Control-system mismatches and sourced maximum tire widths are checked. Unknown clearance remains unknown. Full size, axle/freehub, tire/rim, brake mount, BB, headset, cockpit, seatpost and rail compatibility require review. A frame that includes a stem may use the selected cockpit as an additional replacement; that is disclosed. Source-stated product weights retain their measurement basis and are not turned into complete-bike weight or performance stars.

## Collection pages and build box

The home page (`index.html`) shows a three-product collection preview, category links and the configurator. The full searchable catalog is on `collection.html`; Vite builds both HTML entry points with relative URLs for GitHub Pages. Category links use `?category=wheels` and product links use `?product=rd50`. Products can be added from preview cards, catalog cards, product dialogs or the selected builder preview. **Save these 7 products to box** saves the current configurator selection without duplicating existing rows or changing their quantities.

The shared build box opens from the navigation or floating button on either page. Expand it for a larger product list and summary. It supports package quantities from one to twenty, removal, clearing, category coverage, alternative/control-system warnings and a downloaded sourcing list. A tire package already represents two tires; controls and cockpit bundles retain their listed inclusions. Known component and complete-bike subtotals are separate, with a combined saved-reference subtotal. Unpriced lines remain pending and are excluded from known subtotals rather than treated as free.

The box starts empty. Selections persist locally under `rcs-build-box` with a versioned schema containing only validated product IDs and quantities; prices always come from the current catalog. Retired IDs, malformed quantities and duplicates are discarded, excessive quantities are capped, and cross-tab changes refresh the box. If storage is unavailable, the box works for the current visit and reports the persistence limit. Existing `rcs-build` and `rcs-rider` data remain separate. No personal data or order is submitted to an RCS server.

**Use box components in builder** transfers one package per represented component category while preserving the other builder selections. Multiple alternatives, extra component packages and detected control/clearance errors must be resolved first. Complete bikes stay in the box and never enter the configurator subtotal. Category coverage does not guarantee an assembled or compatible bicycle; the existing full-fit and supplier-confirmation limits still apply. The box export multiplies original source quantities by package quantities and retains source URLs, exact reference variants, price type, unpriced package caveats and optional locally saved rider details.

## Product reference profiles

Every reference has an RCS profile with dated evidence and explanations, including 233 cost scores and four unpriced references. Budget accessibility describes listed spend, not quality or value. Additional scores describe rim depth, nominal tire width and listed wheelset/complete-bike mass when evidence exists. Higher means more of the named trait; it does not guarantee suitability or faster riding. Unknowns remain pending. Frameset and cockpit package weights are not scored because inclusions differ. No component-to-build measured-performance prediction is performed. A separate editorial specification-to-goal estimate is described below. Source basis, fixed endpoints, rounding and limits are published in [the ratings method](docs/ratings.md) and on the website. Profiles also accompany each selected component in the sourcing export.

## Live overall build goal match

The builder shows a whole-build **RCS goal match** above the component configurator and a compact score link beside the choices. It updates when products or the riding goal change; choose balanced road, racing/aero, climbing/low-mass or comfort/endurance. The current goal saves alongside optional rider details without dropping measurements or budget. The full selected-parts list, score inputs, weights, source links and coverage remain available. The sourcing brief and an unambiguous seven-category build box carry the same rating.

This is an editorial specification-preference estimate, not an overall quality score or tested aero/climbing/comfort result. It uses only source-backed frame purpose plus listed wheel-pair mass, rim depth and nominal tire width with published goal weights. Price, frame package weight, rider measurements and undocumented performance of drivetrain/brakes/cockpit/saddle are excluded. Missing weighted evidence produces a labelled provisional score with coverage; detected component conflicts or explicitly missing essentials withhold the overall score. Read the [build rating method](docs/build-ratings.md). Product cost profiles retain their separate method/version.

There are nine frame options across Specialized, Pinarello and Colnago. Six have verified SA price references; three Aethos/Roubaix manufacturer references require a South African quote. CWC prices retain cents. The Colnago frame-only listing excludes a fork/headset/axles, so its overall goal match is withheld until required parts are resolved; it is never presented as a complete frame-and-fork package. Source descriptions, exact variants, photos and exclusions are in the [source register](docs/product-sources.md).

## Rider requirements and privacy

Riding goal (including climbing/low-mass focus), whole-rand budget, height and cycling inseam are optional. Details save in local browser storage and appear in the downloaded brief. They support supplier/fitter review and do not calculate frame size. Clearing rider details removes that local profile; resetting components preserves it. There is no server submission, customer account, payment, stock reservation or order creation. Customers may explicitly copy, download or prepare an email request as described below.

## Validation

`npm test` also verifies 3D provenance, metadata/alignment rules, schematic/data separation and valid self-contained GLB files. Real WebGL browser tests cover camera and mesh changes, no-WebGL fallback, resource disposal and the GLB loader with an unbranded test fixture.

Catalog checks cover sourced quantities/subtotals, separate complete-bike pricing, local photo/source coverage, partial pricing for the Di2 package, all 427,680 builder combinations (213,840 control mismatches), rider validation, source-aware exports and HTML escaping. Browser checks cover all catalog images, intersecting filters and empty results, pagination, product dialogs and evidence, selecting catalog components into the builder, option search, totals, compatibility, persistence, source-aware exports and mobile layout. Rating tests cover fixed endpoints, direction/clamping, evidence requirements, pending fields, coverage and search/sort behavior. Build-box tests cover untrusted storage, catalog-derived prices, package arithmetic, separate complete-bike subtotals, idempotent build saving, alternatives/control mismatches, unpriced lines and multiplied source quantities in exports. Live build-rating tests cover goal weights, rounded results, input changes, evidence gaps, excluded price/unknown inputs, conflicts, frame-only exclusions and export provenance. Browser validation covers both actual production HTML pages, preview/category/product links, cross-page and cross-tab persistence, add/edit/remove/clear, compact/expanded box layouts, downloads, builder transfers and mobile widths from 320 to 1440 pixels.

## Expanded wheelset collection

The collection has **175 wheelset listing references**, including six original references and 169 additions from Bike Addict, Evo Bikes, Olympic Cycles, Lynnwood Cyclery, Solomons Cycles, CWC and Cycle Lab. These are store offers, not 175 unique models or RCS inventory. Material, rim-depth band, brake type, tire system, freehub, road/all-road use and retailer filters intersect with the existing brand, search and price controls. Unknown specifications stay visibly unconfirmed. The evidence panel links each recorded specification to its exact listing. See [wheelset coverage and source register](docs/wheelsets.md).

The road configurator offers 27 wheelsets. New entries require a reviewed Shimano disc-road configuration; collection-only rim-brake, other freehub, gravel, QR and uncertain variants remain available for browsing and sourcing enquiries. They cannot transfer into the current builder or make a build box apply-ready. Exact cassette generation/spacers, axle endcaps, tire approvals and fit still need supplier review. Front and rear variants are added explicitly when a store sells wheels separately; single-wheel packages and conflicting/unclear listings are excluded. Mixed-depth pairs retain both dimensions without an invented single-depth rating.

`src/wheel-data.json` stores the 169 added offers and coverage/exclusion log; `src/catalog-data.json` retains the original references. Prices are snapshots, including clearly labelled unavailable and demo listings. Store changes never refresh automatically. Every photo is a downloaded product-listing image with source attribution; no manufacturer partnership or image licence is inferred.

## Build checks, sharing and quote requests

The builder's interface checklist separates limited documented matches, detected conflicts and supplier-review items. It checks sourced axle dimensions, frame clearance, control families, available cockpit clamp dimensions, rim-width recommendations and the requested tire setup. Generic HG labels, tubeless-ready labels and rider measurements never establish whole-build compatibility. Unpriced extras/package checks remain outside the subtotal. The control mismatch action changes the brake/control choice only when the user clicks it. Tire setup saves separately under `rcs-build-settings`.

**Share build** creates a URL fragment containing validated product IDs, riding goal and tire setup only. It excludes measurements, budget and contact details. Opening a link previews it without overwriting the recipient's saved selections; the recipient can save it, edit it or return to their own build. Incomplete, duplicate, unavailable or unknown fields are rejected without partially replacing saved data. Prices come from the current catalog when the link is opened.

**Prepare quote request** works for the current builder and build box on either page. The user supplies name, reply email, province and delivery/collection preference, with optional phone, requested size and notes. The review step clearly says nothing has been sent. Download/copy preserves the entire source-aware request and package quantities. **Open email draft** addresses `rikus2011@hotmail.com` from `src/shop-config.json`; the customer must send it from their own email app. Long requests use a short email cover note and explicitly ask the customer to attach/paste the full downloaded/copied request. No backend, transactional email credentials, automated delivery or checkout exists. Contact drafts stay in memory during the visit, never in localStorage or shared links.

Validation includes 38 Node tests, all 427,680 builder combinations, source/photo metadata, exact package arithmetic, taxonomy intersections, malformed share links, quote validation and capped draft URLs. Production-browser checks cover all 169 new photos, filters, collection-only transfers, control repair, saved/shared preview behavior, quote review/privacy and mobile layouts from 320 to 1440 pixels. No test sends email.

## Public preview

The two-page production build uses relative asset URLs; both `index.html` and `collection.html` must be deployed together. `gh-pages` contains compiled preview files plus `.nojekyll`. GitHub **Settings → Pages** uses **Deploy from a branch → gh-pages → / (root)**. Source changes on `main` do not automatically rebuild `gh-pages`; publish a validated build tree while preserving the current deployment parent, without force pushing.

## Updating product evidence

Open the exact product/variant source, reconfirm price/currency, package quantities, stock notes and model/colour/size. Update source and review dates, and compare any manufacturer MSRP against current promotions without silently treating it as a dealer offer. Price bundles by their line items, avoiding duplicate included controls or other parts. Keep unknown fields null. Refresh the original photo only from the correct product listing with an appropriate usage basis. Run tests/build and recheck the sourcing export before publishing. Performance ratings need independent comparable evidence. Reference profiles use the fixed, transparent cost/specification scales in [the ratings method](docs/ratings.md); they are not performance tests.

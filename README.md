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

The builder contains 15 product/bundle options and a separate gallery of three complete-bike references. Eighteen source photos are stored without image editing under `public/products`; credits link to the corresponding listings. Photos show individual products or a source bundle, not a rendered assembled build. Source attribution records provenance; supplier image authorization should be confirmed before a commercial sales launch.

Manufacturer MSRP is distinguished from retailer listing prices. Reference variants and quantities are explicit: two individual tires; left and right mechanical lever/caliper kits; a handlebar plus stem; five separately listed items for the mechanical drivetrain. No retailer relationship, RCS inventory or RCS selling price is claimed. A manufacturer listing or a retailer availability flag does not establish an RCS sourcing commitment.

The default selected-parts reference subtotal is R51,610. This is not a complete-bike quote: confirm VAT treatment, exact fit and missing parts, rotors, bottom bracket, tubes/sealant, tape, pedals, assembly and delivery. Manufacturer MSRP can differ from promotional or dealer prices. The snapshots do not refresh automatically.

The Di2 groupset listing describes shift controls. Its exact caliper/rotor inclusions remain unconfirmed, so the matching brake package remains unpriced rather than adding a duplicate controls charge or inventing a zero-price kit. The UI displays a partial subtotal and an unpriced-category warning for that build.

Control-system mismatches and sourced maximum tire widths are checked. Unknown clearance remains unknown. Full size, axle/freehub, tire/rim, brake mount, BB, headset, cockpit, seatpost and rail compatibility require review. A frame that includes a stem may use the selected cockpit as an additional replacement; that is disclosed. Source-stated product weights retain their measurement basis and are not turned into complete-bike weight or performance stars.

## Rider requirements and privacy

Riding goal, whole-rand budget, height and cycling inseam are optional. Details save in local browser storage and appear in the downloaded brief. They support supplier/fitter review and do not calculate frame size. Clearing rider details removes that local profile; resetting components preserves it. There is no server submission, customer account, payment, stock reservation or order creation.

## Validation

`npm test` also verifies 3D provenance, metadata/alignment rules, schematic/data separation and valid self-contained GLB files. Real WebGL browser tests cover camera and mesh changes, no-WebGL fallback, resource disposal and the GLB loader with an unbranded test fixture.

Catalog checks cover sourced quantities/subtotals, separate complete-bike pricing, local photo/source coverage, partial pricing for the Di2 package, all 192 component combinations (96 control mismatches), rider validation, source-aware exports and HTML escaping. Browser checks cover actual image loading and selection, totals, compatibility, budget warnings, source links, rider persistence, exports and mobile layout.

## Public preview

The production build uses relative asset URLs. `gh-pages` contains compiled preview files plus `.nojekyll`. GitHub **Settings → Pages** uses **Deploy from a branch → gh-pages → / (root)**. Source changes on `main` do not automatically rebuild `gh-pages`; publish a validated build tree while preserving the current deployment parent, without force pushing.

## Updating product evidence

Open the exact product/variant source, reconfirm price/currency, package quantities, stock notes and model/colour/size. Update source and review dates, and compare any manufacturer MSRP against current promotions without silently treating it as a dealer offer. Price bundles by their line items, avoiding duplicate included controls or other parts. Keep unknown fields null. Refresh the original photo only from the correct product listing with an appropriate usage basis. Run tests/build and recheck the sourcing export before publishing. Performance ratings need independent comparable evidence.

# RCS Bicycle

South African road and mountain-bike sourcing configurator. The main experience is a guided build box with real product photos, dated ZAR references, source-backed specifications and a live component summary.

## Development

Use the existing `/workspace/RCS-Bicycle` checkout. Cloud tasks are isolated; no Git worktree is needed. Requires Node 20.19+ or 22.12+; validated with Node 24.19.0 / npm 11.9.0.

```sh
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev -- --port 5173
npm test
npm run build
```

Vite builds `index.html`, `collection.html`, `builds.html` and `mountain.html` with relative assets for GitHub Pages. No credentials or backend services are needed. Fonts and product photos are local. Restart development processes in a new task; check all four HTML entry points. Keep TLS verification enabled.

## Mountain-bike builder

`mountain.html` adds a separate guided MTB build path with 135 sourced references: 10 frames/modules, 9 complete bikes, 14 forks, 9 shocks, 16 wheelsets, 26 single tyres and drivetrain, chain, brake, cockpit, seatpost, saddle and finishing references. Prices/photos and exact source variants were reviewed 19 October 2026. Browse all at `mountain.html?view=collection`; complete MTBs stay separate from component pricing. Read [the MTB method](docs/mtb-builder.md) and [full source register](docs/mtb-sources.md).

Front and rear tyres are independent single-tyre selections. Source-confirmed frame/shock/fork/post and drivetrain-chain inclusions are contextual, with no duplicate price or mass. Separately purchased replacements keep their full additional price and require reconciliation. Known axle/wheel/tyre/freehub/UDH/chain/shock/brake/clamp/post mismatches are flagged; unknowns and nominal agreements stay supplier review. Partial upgrade kits retain explicit missing essentials. Source options, private size requests, quantity-aware extras, downloads, quote drafts and isolated MTB sharing/persistence are supported. Road selections and link schemas remain unchanged.

## Guided build box

The home page starts with the frameset step and an empty configuration for new visitors. Existing `rcs-build` selections migrate into the guided flow. Ten steps cover frameset, wheelset, tyres, drivetrain, brakes/levers, bar/stem, saddle, chain, finishing extras and review. Six product cards per page, ascending price order, intersecting brand/material/purpose/depth checkboxes, search and sorting keep browsing manageable. Unpriced options sort last in either price direction. A selected SKU's price participates in sorting.

The persistent build summary shows equipped core packages, current source choices, known reference subtotal, optional budget comparison, partial documented mass and editorial goal match. On mobile a fixed summary button provides access to the full build box. No default components are charged before they are equipped. The seven-package reference configuration still totals R51,610; a fresh guided build starts at R0.

`src/build-plan.js` validates the versioned `rcs-build-plan` state: equipped categories, source-backed option values, bounded fit requests, chain selection/mode and extra IDs. Prices never come from storage. `src/guided-data.json` retains the original guided SKUs, claims, photos, four chains and six finishing extras reviewed on 15 October 2026. `src/expanded-data.json` adds 176 product/package references reviewed on 16 October, including 53 option registers. The merged collection exposes 22 chains and 58 extras, with 18 chains eligible for the guided build. Read [the guided-builder method](docs/guided-builder.md) and [the expansion method and full source register](docs/catalog-expansion.md).

Product inspection provides listed specifications, package limits, credited source photographs and size/colour/width/crank/stem choices where reviewed. Exact Shopify variants use their dated SKU prices; cockpit prices retain separate bar and stem lines. Winspace alternative attribute combinations are requests until the combination/price is verified. Unknown or free-text variants require a quote. The source image is a reference and may show another size/colour. Measurements and source size labels do not determine fit.

The chain step distinguishes an installed replacement from an additional spare. Mechanical 105 bundle replacement removes only its explicit R490 included-chain line and prices the selected chain separately. A spare keeps the full bundle plus the spare price. New unsplittable SRAM groupsets retain their full price when a replacement chain is purchased; the included chain is not given an invented credit. Shimano HG, SRAM Road Flattop and Campagnolo families remain distinct; documented speed/family conflicts are flagged, while a nominal match still needs exact drivetrain/connector/length review. Legacy 10/11-speed chains can be browsed for sourcing but are not compatible installed replacements for a 12/13-speed drivetrain merely because the brand matches.

Finishing extras now include lights, pedals, electronics, tools/spares, bottles/cages, tape, rotors and bottom brackets, with local source photos, variant URLs and dated SA prices. The finishing-kit panel supports 1–20 copies of each exact selected source package, with separate unit prices and line totals. A set or pair remains one package. Customers can edit quantities, inspect variants and remove extras from the extras step or review; an accessory-only configuration can also prepare a quote. Read [finishing-kit quantities and checks](docs/finishing-kit.md). Multiple separately selected offers add their own prices, including extras already supplied in a selected groupset. Source-backed tube-width, rotor-package/mount and bottom-bracket checks surface known conflicts; missing information and nominal agreements remain supplier reviews. A generic BB or rotor choice does not certify an interface. The build checklist still covers any missing rotors, BB, tape/tubes/tubeless supplies, frame parts, assembly and delivery.

## Separate browsing and saved products

`builds.html` contains three editable suggestions and a complete-bike preview, linking to all 24 complete-bike references. Suggestions are not customer builds or completed orders. Frame photos are reference images, not images of an assembled suggested configuration.

`collection.html` contains 447 references: 24 complete bikes, 209 core builder package choices, 18 selectable chains, 58 finishing extras and 138 collection-only component references. The 47 frames span 16 brand subsections, with 44 selectable in the builder. The 175 wheel references retain their dated store offers; 44 reviewed road-disc variants are now selectable across the broader freehub range. Counts include contextual package checks, bundles and functional variants; they are not unique physical-model counts or a claim of all South African stores. See [the current category counts and 176-reference expansion register](docs/catalog-expansion.md), [earlier frameset research](docs/framesets.md), [wheelsets](docs/wheelsets.md) and [original source register](docs/product-sources.md).

Controls/caliper and frame-included cockpit checks remain unpriced catalog references. Only a confirmed check paired with its exact parent package resolves to included at no extra charge. Three SRAM groupsets explicitly include both control/caliper assemblies; Shimano and Campagnolo checks remain pending where the source inventory is insufficient. Known control-system and freehub-family conflicts are surfaced; a family agreement is not complete fit approval. An unpriced frame, unsupported variant or missing package item still requires a quote.

The former saved-product build-box drawer is labelled **Saved products**, separate from the primary configuration. It retains quantities 1–20, alternative products, complete-bike subtotals, sourcing exports and cross-tab persistence under `rcs-build-box`. Saving reference models to the shortlist does not serialize custom variants or extras there; those remain in the primary build. Transferring a reference from the collection/shortlist marks that component equipped and resets its option requests to the source reference. Other component selections remain. Collection-only or conflicting alternatives cannot be transferred as an apply-ready build.

## Specifications and estimates

The guided cards show mass profiles, aero/race intent or wheel-depth proxies, climbing intent and pending stiffness tests. Sources, fixed scales and scope appear in product inspection. Package mass, bare-frame marketing mass, wheel-pair mass and handlebar-only mass are explicitly distinguished. A paint name such as Carbon Black is not evidence of frame material. Implausible retailer claims, including the PRO Vibe listing's “25gr”, remain withheld.

The live mass subtotal sums only documented, separate selected frame/wheel/tyre packages and supported extras. It excludes unknown masses, bare-frame marketing claims, handlebar-only measurements, spare chains and unresolved installed-chain length. Extra package quantities can include spares; the subtotal is not installed or complete-bike weight.

The research lab estimates only the gravitational power difference between two wheelsets with cited pair masses at a chosen steady speed and gradient. It uses ΔP = Δm × g × v × sin(arctan(gradient)). Aero watts remain pending: rim depth, carbon grade and marketing descriptions do not supply a comparable CdA or wind-tunnel result. Read [the guided-builder method](docs/guided-builder.md) for the Martin et al. (1998) cycling-power and NASA drag references, assumptions and limits.

The separately versioned [reference cost/dimension profiles](docs/ratings.md) and [editorial build goal match](docs/build-ratings.md) remain available. Goal match uses only source-backed frame purpose, wheel-pair mass/depth and nominal tyre width. Controls, stiffness, unverified frame mass, price, rider measurements and saddle comfort do not become invented performance points. Partial configurations stay incomplete; conflicts and explicit missing essentials withhold the score. Default *reference configuration* baselines remain balanced 5.9/10, RD38 balanced 7.7/10 and Aethos 2 / RD38 climbing 8.8/10. These are preference estimates, not measured performance or quality.

## Sharing, quote drafts and privacy

Version 1 shared links remain supported. Version 2 includes validated equipped-category membership, catalog option choices, chain/extras and their package quantities, goal and tyre setup. Older links without quantities still mean one package per extra. Free-text sizing requests, measurements, budget and customer contact data are excluded. A recipient previews without overwriting their saved configuration until saving/editing. Tampered prices, extra fields, unknown products/options and duplicate URL fields are rejected. Prices are derived from the local source register.

Sourcing downloads and quote drafts include configured source variants, separate accessory/chain lines, package credits, missing selections, known prices, unpriced lines, scientific-profile basis and supplier checks. Quote requests are addressed to **rikus2011@hotmail.com** in `src/shop-config.json`. The customer reviews and then copies/downloads or opens a mailto draft and sends it themselves. Long email links use a cover note instructing them to attach/paste the complete request. Contact drafts remain in memory, outside localStorage and shared links. There is no backend submission, payment, order, stock reservation or automated email delivery.

## Validation and publishing

The Node suite covers original core combinations, pricing/source arithmetic, model provenance, ratings, persistence validation, quote/share privacy, guided partial builds, SKU/size-dependent checks, chain credits/spares, extras, gravity-model endpoints and source-aware exports. Production browser checks cover the full guided journey, filters, pagination, price order, configuration dialogs, exact options, package conflicts, summary changes, downloads, sharing preview/save isolation, quote drafts and 320–1440 px layouts. No check sends real email.

The existing schematic Three.js engine and GLB validation remain in source, but the guided home page focuses on source photographs. No real product meshes have been supplied. 3D expansion is paused; read [3D asset contract](docs/3d-assets.md) and [production brief](docs/model-production-brief.md) before future asset work. Schematic geometry never establishes appearance, fit or measured performance.

After authorized changes pass tests/build/browser checks, publish all four HTML pages and shared assets to `gh-pages` with `.nojekyll`, preserving the current deployment parent without force pushing. `main` does not auto-publish. Confirm GitHub Pages built the expected SHA and public HTTPS files match the tested build. Website deployment is separate from cloud-environment configuration review/publication.

# Mountain-bike build lab

Workflow and research: 19 October 2026. Open `mountain.html` for the separate MTB configurator; `mountain.html?view=collection` browses all MTB references, and `&category=bike` limits it to complete bikes. Road builds, prices, saved selections and old shared links remain independent.

## Current scope

The initial MTB collection has 135 sourced references across 34 brands and seven South African pricing hosts: 10 framesets/modules, 9 complete bikes, 14 forks, 9 rear shocks, 16 front/rear wheelsets, 26 single tyres, 12 drivetrain/upgrade packages, 10 chains, 6 brake pairs, 6 bar/stem bundles, 8 seatposts, 4 saddles and 5 pedal/grip extras. These are packages and functional references, not every SA store or unique physical model. See [the source register](mtb-sources.md).

The builder starts empty at R0. Its steps cover frame, fork, rear shock, wheels, front tyre, rear tyre, drivetrain, brakes, cockpit, seatpost, saddle, chain, extras and review. A source-confirmed hardtail hides the rear-shock step unless a previously selected shock still needs removal. Each step has search, brand include/exclude checkboxes, source-specification facets, six cards per page and price sorting with unknown prices last. The MTB source collection also supports categories and complete-bike enquiries.

## Physical package scope

Front and rear tyres are independent single physical purchases. Selecting the same tyre at both ends charges two tyres; choosing different models/casings/diameters is supported by separate product references. Wheelsets price their actual front/rear package. Mixed 29/27.5 sets preserve both ends. Cockpits price a real bar and stem; brake pairs price both lever/caliper ends. Single-component photos are captioned when the priced package contains additional parts.

Source-confirmed frame inclusions create contextual fork/shock/seatpost rows at no extra charge and no added mass. The Epic 8 module explicitly includes all three; Epic 9 includes fork and shock with only its documented interfaces. A separately selected replacement adds its full price on top of the unsplit frame package and creates a reconciliation conflict. Keeping the supplied component removes that additional selection. No invented credit is deducted. The same rule applies to buying a separate chain when a drivetrain already includes one.

An upgrade kit is not renamed a full drivetrain: missing cranksets, chainrings, cassettes, chains, bottom brackets and other explicit omissions remain required sourcing notes. `selectionComplete` means selection steps are represented; `complete` also requires no explicit missing essentials or detected conflicts. Even then, full fit and assembly remain supplier review. Unknown chain inclusion creates an unpriced package check, not a free chain. Dropper remotes are included only with source proof; an explicitly excluded remote remains required.

## Evidence-based compatibility

`src/mtb-build.js` gates each interface fact on a recorded URL and source excerpt. It checks suspension scope; shock eye-to-eye, stroke and mount; fork travel against an explicitly approved range; front/rear axle standards; frame/fork/wheel and tyre diameters; source-backed width limits; tubeless exclusions; HG/Micro Spline/XD/XDR cassette families; classic Eagle versus T-Type/other chain standards; UDH requirements; frame/fork brake mounts; bar/stem clamp size; and seatpost diameter.

A single recommended fork travel is not expanded into an invented safe range. A shared nominal standard remains supplier review. Mixed or missing facts never become full compatibility approval. Axle endcaps, spacers, adapters, shock tunes/hardware, dropper insertion/cables, hose routing, rotor limits, headset/steerer and actual mounted clearance still require exact supplier checks. T-Type needs exact manufacturer-approved UDH frame compatibility, not just an assumed model-family match.

## Options, prices and private requests

`src/mtb-data.json` holds exact dated products and source SKUs. The 33 option registers contain 108 verified combinations. Only recorded combinations receive prices. Changed SKU facts must be explicitly present for that variant; unknown interfaces and masses are cleared rather than borrowed. Drive length/link-count variants explicitly retain separately reviewed invariant family and package facts. Multi-source variant packages must reconcile every price line. Source orderability flags are not RCS inventory.

Private size/colour requests remain in local state and sourcing quotes; they make the requested package price/mass unconfirmed. Public sharing excludes these requests and customer contact details. The main MTB state is `rcs-mtb-build`; road `rcs-build`, `rcs-build-plan` and saved-product shortlist schemas are untouched. MTB links use `#mtb=1&plan=...`, strictly validate canonical known choices/quantities and preserve the recipient's saved build until save/edit. Unknown IDs, fields, arbitrary prices and invalid quantity maps are rejected.

Extras allow 1–20 copies of the same selected package/SKU. Unit prices remain unchanged; totals and source quantities multiply once. A pedal pair is already one package. An accessory-only build can prepare a sourcing request. The existing quote UI uses the user-authorized recipient rikus2011@hotmail.com; it prepares downloads/copies/mailto drafts only. MTB contexts supply their own 19 October source date rather than borrowing road review dates. No backend order, reservation, payment or automatic email exists.

## Mass profiles and performance limits

Cards show a low-mass specification profile only when a reviewed exact package mass/basis is present. Fixed kg endpoints 10→1: frame 1.0→4.5; fork 1.3→3.1; shock 0.2→0.8; wheel pair 1.4→2.6; single tyre 0.5→1.5; cockpit 0.25→0.70; seatpost 0.18→0.90; saddle 0.15→0.45. Linear values are clamped 1–10 and rounded to one decimal. These are editorial package-mass comparison scales, not market percentiles, engineering thresholds, quality ratings or trail-performance tests. Source inclusions and measurement conditions differ.

Partial documented mass sums reviewed source packages. Included checks are not counted again; separately purchased replacements and extra quantities can include uninstalled spares. Bare/partial bar mass, mismatched shock-size claims and unverified package weights stay unscored. Complete installed bike mass, suspension quality, stiffness, traction, trail speed and aero watts remain unverified. No component stars are averaged into an invented MTB performance score.

## Validation and release

Run `npm test` and `npm run build`; Vite now builds four HTML entry points. Validate the road builder, collection and build ideas alongside the MTB flow, separate storage, included/replacement packages, front/rear tyres, changed SKUs, physical-standard conflicts, quote/download provenance, share preview/save/discard and 320–1440 px layouts. Decode the new source photos. No check should send real email.

Publish compiled `dist` with `.nojekyll`, all four HTML pages, shared assets and product photos to `gh-pages`, preserving its parent without force push. Confirm Pages built the expected commit and public HTTPS files match the tested build. Website publishing remains separate from cloud-environment draft publication.

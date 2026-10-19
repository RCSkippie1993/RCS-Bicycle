# Mountain-bike build lab

Workflow and research: 19 October 2026. Open `mountain.html` for the separate MTB configurator; `mountain.html?view=collection` browses all MTB references, and `&category=bike` limits it to complete bikes. Road builds, prices, saved selections and old shared links remain independent.

## Current scope

The MTB collection has 270 sourced references across 59 source brand labels and nine South African pricing hosts: 49 framesets/modules, 27 complete bikes, 17 forks, 13 rear shocks, 21 front/rear wheelsets, 35 single tyres, 12 drivetrain/upgrade packages, 14 chains, 9 brake pairs, 10 bar/stem bundles, 13 seatposts, 10 saddles and 40 finishing extras. These are packages and functional references, not every SA store or unique physical model. See [the source register](mtb-sources.md).

The builder starts empty at R0. Its steps cover frame, fork, rear shock, wheels, front tyre, rear tyre, drivetrain, brakes, cockpit, seatpost, saddle, chain, extras and review. A source-confirmed hardtail hides the rear-shock step unless a previously selected shock still needs removal. Each step has search, brand include/exclude checkboxes, source-specification facets, six cards per page and price sorting with unknown prices last. The MTB source collection also supports categories and complete-bike enquiries.

## Physical package scope

Front and rear tyres are independent single physical purchases. Selecting the same tyre at both ends charges two tyres; choosing different models/casings/diameters is supported by separate product references. Wheelsets price their actual front/rear package. Mixed 29/27.5 sets preserve both ends. Cockpits price a real bar and stem; brake pairs price both lever/caliper ends. Single-component photos are captioned when the priced package contains additional parts.

Source-confirmed frame inclusions create contextual fork/shock/seatpost rows at no extra charge and no added mass. The Epic 8 module explicitly includes all three; Epic 9 includes fork and shock with only its documented interfaces. A separately selected replacement adds its full price on top of the unsplit frame package and creates a reconciliation conflict. Keeping the supplied component removes that additional selection. No invented credit is deducted. The same rule applies to buying a separate chain when a drivetrain already includes one.

An upgrade kit is not renamed a full drivetrain: missing cranksets, chainrings, cassettes, chains, bottom brackets and other explicit omissions remain required sourcing notes. `selectionComplete` means selection steps are represented; `complete` also requires no explicit missing essentials or detected conflicts. Even then, full fit and assembly remain supplier review. Unknown chain inclusion creates an unpriced package check, not a free chain. Dropper remotes are included only with source proof; an explicitly excluded remote remains required.

## Evidence-based compatibility

`src/mtb-build.js` gates each interface fact on a recorded URL and source excerpt. It checks suspension scope; shock eye-to-eye, stroke and mount; fork travel against an explicitly approved range; front/rear axle standards; frame/fork/wheel and tyre diameters; source-backed width limits; tubeless exclusions; HG/Micro Spline/XD/XDR cassette families; classic Eagle versus T-Type/other chain standards; UDH requirements; frame/fork brake mounts; bar/stem clamp size; and seatpost diameter.

A single recommended fork travel is not expanded into an invented safe range. A shared nominal standard remains supplier review. Mixed or missing facts never become full compatibility approval. Axle endcaps, spacers, adapters, shock tunes/hardware, dropper insertion/cables, hose routing, rotor limits, headset/steerer and actual mounted clearance still require exact supplier checks. T-Type needs exact manufacturer-approved UDH frame compatibility, not just an assumed model-family match.

## Options, prices and private requests

`src/mtb-data.json` holds exact dated products and source SKUs. The 72 option registers contain 387 verified priced combinations. Only recorded combinations receive prices. Changed SKU facts must be explicitly present for that variant; unknown interfaces and masses are cleared rather than borrowed. Drive length/link-count variants explicitly retain separately reviewed invariant family and package facts. Multi-source variant packages must reconcile every price line. Source orderability flags are not RCS inventory.

Private size/colour requests remain in local state and sourcing quotes; they make the requested package price/mass unconfirmed. Public sharing excludes these requests and customer contact details. The main MTB state is `rcs-mtb-build`; road `rcs-build`, `rcs-build-plan` and saved-product shortlist schemas are untouched. MTB links use `#mtb=1&plan=...`, strictly validate canonical known choices/quantities and preserve the recipient's saved build until save/edit. Unknown IDs, fields, arbitrary prices and invalid quantity maps are rejected.

Extras allow 1–20 copies of the same selected package/SKU. Unit prices remain unchanged; totals and source quantities multiply once. A pedal pair is already one package. An accessory-only build can prepare a sourcing request. The existing quote UI uses the user-authorized recipient rikus2011@hotmail.com; it prepares downloads/copies/mailto drafts only. MTB contexts supply their own 19 October source date rather than borrowing road review dates. No backend order, reservation, payment or automatic email exists.

## Mass profiles and performance limits

Cards show a low-mass specification profile only when a reviewed exact package mass/basis is present. Fixed kg endpoints 10→1: frame 1.0→4.5; fork 1.3→3.1; shock 0.2→0.8; wheel pair 1.4→2.6; single tyre 0.5→1.5; cockpit 0.25→0.70; seatpost 0.18→0.90; saddle 0.15→0.45. Linear values are clamped 1–10 and rounded to one decimal. These are editorial package-mass comparison scales, not market percentiles, engineering thresholds, quality ratings or trail-performance tests. Source inclusions and measurement conditions differ.

Partial documented mass sums reviewed source packages. Included checks are not counted again; separately purchased replacements and extra quantities can include uninstalled spares. Bare/partial bar mass, mismatched shock-size claims and unverified package weights stay unscored. Complete installed bike mass, suspension quality, stiffness, traction, trail speed and aero watts remain unverified. No component stars are averaged into an invented MTB performance score.

## Finding and comparing components

The expanded browser adds minimum/maximum source-package price, dated source-availability filtering, documented package-mass sorting, and extra facets for shock dimensions/mount, tyre width/tubeless status, seatpost travel, drive family/speeds and accessory type. Price bounds exclude unknown prices; absent price bounds keep unknown references last. Availability requires every priced source line to explicitly list availability. This is not RCS stock or a live reservation. Purpose shortcuts browse source-listed XC/marathon, trail or enduro frames; they do not set a performance rating or choose a frame automatically.

Select up to three products from one category to compare exact currently chosen variants, package scope, known masses, technical facts and source links. Switching category starts a new comparison. Comparisons are session-only and do not change saved component selections or appear in shared links. Tyre comparisons from a dedicated build step preview that exact end; collection tyre comparisons require choosing the front/rear position in product details. Complete-bike comparisons stay outside component pricing.

`src/mtb-discovery.js` previews each candidate through the same source-backed build evaluator. It shows the known subtotal after selection, and an exact subtotal difference only when both before/after have no unpriced lines. Replacing a source-included component adds the full replacement price with its reconciliation warning. Mass differences compare documented selected packages only; they are not installed weight or measured speed improvements. Candidate conflict filtering considers checks involving that component; unrelated existing conflicts must not hide valid candidates. Unknown interfaces stay visible and require review. “No conflict detected” never certifies full compatibility.

The summary adds component-selection progress and a link to the first missing selection. It counts an unconfirmed bundled-chain placeholder as missing. An optional budget is saved separately under `rcs-mtb-preferences`, bounded R1–R2,000,000; it compares only the known subtotal and explicitly warns about missing/unpriced parts and final assembly/delivery. Budget never enters the build plan, shared links, quote or downloaded sourcing brief. Starting a new build retains this private target. Road state remains isolated.

The 19 October expansion adds 101 new records and photos plus 29 option registers/232 source combinations. Santa Cruz Blur 4 CC Salmon/Dark Matter offers are merged into a colour selector; new Lyne droppers keep exact diameter, travel and lever-package prices, and ZeroTwo wheel variants retain the named driver without inventing undocumented axle dimensions or an exact mass. Three SRAM reversible brake pairs price two complete single-brake units; published single 1800 mm hose weights do not become the 2000 mm two-unit package mass. Generic model-family tyre compound/casing/TR lists remain unconfirmed for an exact SKU. The Norco Optic A1 source uses a complete-bike photo for a frame-only offer; cards, comparisons and photo details explicitly label this scope. Conflicting FOX 36/DH and Canyon Lux shock listings, gravel Titan Switch frame, ambiguous lever-only SLX listings, unknown-suitability Carbon sealant and motor-powered e-bike light are excluded.

## Expanded frame sourcing

The frame selection now contains 49 references across 13 brands: 25 locally priced references and 24 manufacturer specification references requiring a South African quote. The latest expansion adds 34 frame references/photos and 10 registers/47 exact priced variants. Use the frame-source facet to choose reviewed SA prices or manufacturer references. Manufacturer-only records have null price/currency/availability, reference-only source lines and explicit supplier requirements; an unpriced frame never becomes a free item or confirmed SA stock. No foreign prices are converted. All other categories and the original 236 records/62 registers are preserved.

PYGA Frame Only and Frame Kit variants have separate exact prices and source-confirmed shock scope; complete-build variants are excluded. Stealth Medium's live No Shock offer conflicts with a Large-only source body, so Medium inherits no Large geometry/interfaces. Large and Boost offers preserve their own availability and axle facts. Banshee V3.2 uses its documented 30.9 mm post, not an archived V3 dimension. Cotic Jeht Gen3 uses its documented 185 × 55 trunnion shock and mixed 29/27.5 wheels. Cotic BFe explicitly excludes SRAM Transmission despite its UDH hanger; that manufacturer exclusion creates a conflict for a Transmission drivetrain. Size-dependent Ibis Ripmo/Transition Sentinel wheel setups remain unknown until the exact size/configuration is supplied. Unsupported delivered-package masses stay unscored.

All 34 new photos retain actual retailer/manufacturer provenance, including native AVIF files. Complete-bike illustrations are prominently labelled as frame references; pictured parts do not establish package inclusion. Read [the frame register and research limits](mtb-frames.md).

## Validation and release

Run `npm test` and `npm run build`; Vite now builds four HTML entry points. Validate the road builder, collection and build ideas alongside the MTB flow, separate storage, included/replacement packages, front/rear tyres, changed SKUs, physical-standard conflicts, quote/download provenance, share preview/save/discard and 320–1440 px layouts. Decode the new source photos. No check should send real email.

Publish compiled `dist` with `.nojekyll`, all four HTML pages, shared assets and product photos to `gh-pages`, preserving its parent without force push. Confirm Pages built the expected commit and public HTTPS files match the tested build. Website publishing remains separate from cloud-environment draft publication.

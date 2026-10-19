# Finishing kit: quantities and source checks

Workflow updated 19 October 2026. Existing product prices, availability observations and source review dates remain unchanged; this is not a price refresh.

The main build now has a selected finishing-kit panel in the extras step and the final review. Customers can inspect the chosen variant, select 1–20 packages and remove a line without finding it again in the catalogue. An accessory-only configuration can be downloaded or used to prepare a quote request.

## Package arithmetic

Quantities count copies of the exact selected source package and SKU. One light set, pedal pair, valve set or tyre pair is already one package. Quantity two of a single rotor reference selects two of the same diameter; it does not represent a front/rear mix. Different sizes or colours within one model need separate supplier instructions and an itemised quote.

`additionalLines.price` and source `unitPrice` remain per-package/per-source-unit values. Line totals multiply the selected package quantity once. Source quantities in the sourcing brief multiply each original source quantity by the package count. Unknown package prices stay unpriced at every quantity; an unpriced line count is not a count of units. No quantities change the seven core packages, create component credits or subtract parts included in another package.

`normalizePlan` retains an `extraQuantities` map only for selected, eligible extra IDs and integer quantities 2–20. Missing, invalid, fractional, non-finite, string or out-of-range values default to one. Removing a reference drops its quantity override. Prices never come from stored state. Reusing a retained SKU choice does not retain a removed quantity.

Version-2 shared links optionally include a nonempty canonical quantity map. Existing links without it still mean one package of each selected extra. Invalid maps, unknown keys and externally supplied prices are rejected. Free-text fit requests and contact/rider data remain outside shared links. The base-reference shortlist stays separate from this configuration.

Supported extra package masses multiply by the selected quantity, retaining the measurement basis. This is a documented sourcing-package mass subtotal: multiple packages can contain spares or items that will not all be installed. It is not installed bicycle weight. Unverified/partial component masses, unresolved chain lengths, tools/spares and consumables remain excluded. Accessory quantities do not improve performance or goal-match scores.

## Accessory checks

Accessory checks use the selected product's recorded source evidence. Known mismatches are conflicts; missing information and nominal agreements remain supplier reviews. No quantity or nominal family establishes a complete or ride-ready bicycle.

- Tube checks use the exact selected source variant, including its listed wheel diameter, width range and valve length. A 700C × 18–25C tube does not cover a selected 28 mm tyre. Valve clearance still needs the rim and supplier's approval.
- Rotor checks keep single-piece source quantities distinct from pairs and sets. Hub mount, diameter, caliper approval, adapters, lockrings and front/rear installation remain separate questions. Selecting two matching rotor packages does not certify both brake installations.
- Bottom-bracket checks distinguish explicit threaded and press-fit shell families, known widths and source-proven crank interfaces. A shared width is not proof of a shared bore, thread or crank fit. Changed variants cannot inherit unsupported reference-only interface claims.
- Package notes retain explicit source exclusions and inclusions. Separately selected extras stay additional purchases until a supplier provides a verified split quote; no automatic credit or free part is inferred.

Checks are included in the build review and sourcing brief. Customers may still prepare a request for advice when a conflict is present; no order, payment, reservation or automatic email is created.

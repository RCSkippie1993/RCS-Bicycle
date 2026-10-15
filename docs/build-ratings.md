# Overall build goal match — editorial method 1.0

Introduced 14 October 2026. The user requested an overall rating for the bicycle being configured. **RCS goal match** is an editorial comparison of selected specifications against a riding preference. It is not a laboratory result, customer rating, engineering certification, universal quality ranking, safety rating or prediction of speed, drag, climbing performance or rider comfort.

The existing [product reference profiles](ratings.md) remain separate. Their cost scores are not averaged into this goal match. More expensive does not mean a higher goal-match score.

## Inputs

1. **Frame purpose match:** RCS classifies the frame as race, aero, lightweight or endurance from a reviewed product-description excerpt and its source URL, stored in `buildEvidence.designFocus`. These are RCS interpretations, not manufacturer-issued points. Models in the same purpose class can score equally despite different price, material grade or package weight.
2. **Wheel depth profile:** the existing listed rim-depth scale, 20 mm → 65 mm mapped to 1 → 10. Depth is not aerodynamic performance and can be unsuitable in crosswinds.
3. **Wheelset low-mass profile:** the existing listed pair-weight scale, 2.00 kg → 1.20 kg mapped to 1 → 10. The retailer-stated measurement basis/tolerance remains visible. This is not an actual climbing test.
4. **Tire volume profile:** the existing nominal selected-width scale, 25 mm → 35 mm mapped to 1 → 10. Width is not mounted width, rolling resistance, grip or comfort; rim/pressure/clearance checks remain required.

Dimension inputs require existing reviewed `profileEvidence`, not just a number in an item record. Frame package masses are excluded because fork, seatpost, stem and other inclusions differ. The formula does not use component prices, complete-bike estimates, rider measurements, 3D geometry or unsupported drivetrain/brake/cockpit/saddle performance claims. Those products remain in the selected build, compatibility notes and price subtotal.

## Frame-purpose points

| RCS frame class | Balanced road | Racing / aero | Climbing / low mass | Comfort / endurance |
| --- | ---: | ---: | ---: | ---: |
| Race | 9 | 9 | 8 | 6 |
| Aero | 7 | 10 | 6 | 5 |
| Lightweight | 8 | 7 | 10 | 7 |
| Endurance | 8 | 5 | 6 | 10 |

This table expresses editorial preferences, not measured differences or precise suitability for a particular rider. Aethos 2 is classified primarily by its documented lightweight emphasis, despite also having performance-endurance geometry. Roubaix is classified by its explicit endurance positioning. These choices and all weights are exposed so a user can interpret the number rather than mistake it for an independent test.

## Goal weights

| Goal | Frame purpose | Wheel depth | Wheel-pair low mass | Nominal tire width |
| --- | ---: | ---: | ---: | ---: |
| Balanced road | 45% | — | 35% | 20% |
| Racing / aero focus | 50% | 30% | 20% | — |
| Climbing / low-mass focus | 40% | — | 60% | — |
| Comfort / endurance focus | 40% | — | — | 60% |

An undecided/unknown riding goal defaults to balanced road. Choosing a goal in the rating panel updates the locally saved rider goal while preserving budget and measurements.

## Calculation and missing information

Compute `sum(input score × weight percent) / sum(known weight percent)` and round once to one decimal place. Percent weights are summed as integers to avoid rounding coverage incorrectly. Weighted evidence coverage is shown beside the score.

An **overall specification goal match** requires all seven selected component categories and every weighted input for the chosen goal. A missing weighted input never becomes a default or zero: show only a **provisional** score using known weights and disclose exactly what is missing and the known-weight coverage. A score based on fewer inputs cannot be compared as if it had equal coverage. When no weighted input is known, show pending.

Detected control-system or sourced tire-clearance conflicts withhold the overall and provisional score. Explicitly documented missing essentials also withhold it: the CWC Colnago listing excludes the fork, headset and axles. An unverified price stays unpriced but does not alter the independent specification-match estimate; no missing price is treated as a free product.

Even 100% of weighted evidence and seven selected categories do not mean a complete, compatible or rideable bicycle. The builder still requires size, routing, axle/freehub, tire/rim, brake, BB, headset, cockpit, seatpost and rail checks, a final bill of materials and supplier/fitter review. These limits are not folded into a misleading compatibility percentage.

## Worked references

- Default balanced build: race frame 9 × 45% + R470 pair-mass profile 3 × 35% + nominal 28C tire profile 4 × 20% = **5.9/10**. No full bike weight is estimated.
- Replacing the R470 with the reviewed ZeroTwo RD38 pair gives **7.7/10** on the balanced rubric.
- Default racing goal has no reviewed R470 rim depth: **7.3/10 provisional**, with **70%** of the weighted evidence available. It does not claim that an unknown rim depth passed an aero test.
- Aethos 2 plus RD38 gives **8.8/10** under the climbing/low-mass preference rubric. This does not predict climbing speed, and the frame's South African price remains quote-required.

## UI, exports and maintenance

The home builder shows the live whole-build panel, goal controls, selected-parts list, evidence links, pricing coverage and a compact score link alongside component choices. The sourcing brief uses the same function. A saved build box receives a profile only when it has one package in each of the seven categories without alternatives or detected control conflicts; complete-bike references never enter the component goal match.

`src/build-ratings.js` is the calculation source of truth. `src/build-ratings-ui.js` exposes the full rubric. Tests cover fixed examples, excluded price and frame package mass, missing evidence, incomplete builds, conflict/missing-essential withholding, bounded outputs for every frame/goal combination, and export limitations. Change this method's version, UI and documentation together if points, weights or missing-data behavior change. Product cost/specification profile version 1.0 remains independent.


## Guided configuration

The home page now shows the goal match in its live build box, with full evidence in the review step. Only equipped core packages contribute; a new configuration starts empty. Missing categories remain incomplete, and partial evidence remains provisional. Source variant requests, chain standards and known conflicts are checked before an overall label. Added accessory prices and advertised bare-frame masses do not add goal points. See [guided builder](guided-builder.md) for the separately scoped mass subtotal and wheel-mass power calculator.

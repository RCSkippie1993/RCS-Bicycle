# RCS reference profiles — method 1.0

Reviewed 14 October 2026. Profiles are editorial comparison aids for the exact displayed package and variant. They describe listed cost and selected dimensions. They are not customer ratings, an overall quality score, independent measurements, value-for-money judgments or predictions of aero, climbing or comfort performance.

## Fixed scales

| Profile | Scope | 1/10 endpoint | 10/10 endpoint |
| --- | --- | ---: | ---: |
| Budget accessibility | Frameset package | R100,000 | R15,000 |
| Budget accessibility | Wheelset pair | R60,000 | R3,000 |
| Budget accessibility | Tire pair | R4,000 | R800 |
| Budget accessibility | Listed drivetrain package | R35,000 | R5,000 |
| Budget accessibility | Brake/control pair | R15,000 | R5,000 |
| Budget accessibility | Handlebar + stem | R7,000 | R1,000 |
| Budget accessibility | Saddle | R10,000 | R1,000 |
| Budget accessibility | Complete bike | R220,000 | R20,000 |
| Rim depth profile | Wheelset rim depth | 20 mm | 65 mm |
| Tire width profile | Nominal selected tire width | 25 mm | 35 mm |
| Low-mass profile | Listed wheelset pair mass | 2.00 kg | 1.20 kg |
| Low-mass profile | Listed complete-bike mass | 10.00 kg | 6.50 kg |

These are editorial scale endpoints, not market percentiles or engineering thresholds. The scale stays unchanged when products are added. They deliberately do not imply that a more expensive product is better. Budget accessibility is about spend only: package contents and manufacturer MSRP versus retailer price must be checked before comparing. Partial and full drivetrain packages have different inclusions.

For an increasing scale, use `round(1 + 9 × clamp((value − low) / (high − low), 0, 1))`. For cost and mass, reverse the clamped fraction before multiplying. Output is an integer from one to ten. Unknown, non-positive or non-finite inputs are pending, never zero or a free package. The Di2 brake package remains pending because a separate price has not been established.

## Evidence and interpretation

Price ratings use all non-reference price lines and the displayed quantity (two tires, two control kits, or bar plus stem). Price type, exact selected variant, check date and URLs are retained in the catalog. They are snapshots, not automated live pricing or RCS selling offers.

Dimension scores additionally require a reviewed source excerpt and product URL in `profileEvidence`. A numeric field alone cannot generate a dimension score. Explanations are available in each product dialog and the selected builder preview. Their original quantities and measurement basis remain visible.

Listed wheelset and complete-bike masses are not weighed by RCS. Sizes, tolerances and accessory inclusions differ or can be unspecified. Treat mass profiles as rough reference comparisons. Frameset and cockpit package masses are intentionally not scored: different included forks, stems or seatposts make a shared scale misleading. A light listed product does not establish climbing speed, stiffness or reliability.

A deeper rim is not necessarily faster and can behave differently in crosswinds. Tire nominal width is not mounted width, comfort, rolling resistance or compatibility. Neither profile replaces tire/rim/pressure/clearance review. Higher describes more depth or width, not better suitability.

No source data presently supports comparable aero, climbing, rolling resistance, stiffness, braking power or individual comfort scores. These remain pending. There is no overall product star rating and no averaging of components into a supposed complete-build performance score.

## Maintenance

Reconfirm the exact source and variant before changing a price or specification. Retain the original image provenance and source excerpt. Update the review date honestly. If a specification cannot be reconfirmed, remove its evidence so its score becomes pending. Changing the scale requires a method version change in `src/ratings.js`, the UI method and this document. Re-run rating, catalog and export tests, build the site and check filters, product dialogs, evidence links and the sourcing export before deployment.

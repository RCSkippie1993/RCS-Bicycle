# First product model production brief

Create one frame asset and two alternative wheel assets for the RCS road-bike pilot. This document commissions no external work and does not claim models have been produced.

| Slot / catalog ID | Product reference | Evidence in this repository |
| --- | --- | --- |
| frame / `allez-sprint` | Specialized Allez Sprint Frameset, listed 2024 variant | `public/products/allez-sprint.png`; exact manufacturer page and source photo URL in `src/catalog-data.json` |
| wheels / `r470` | DT Swiss R470 OEM wheelset | `public/products/r470.jpg`; selected retailer listing in `src/catalog-data.json` |
| wheels / `rd38` | ZeroTwo RD38 Shimano HG wheelset | `public/products/rd38.jpg`; selected retailer listing in `src/catalog-data.json` |

Get additional side, front, rear and oblique views plus dimensional references and usage authorization. Existing single catalog photographs and published package weights are insufficient for exact 3D geometry. Preserve a provenance log for source images and manual/AI modelling steps. Use the `ai-approximation` provenance for reconstructed models and retain the viewer's approximation label.

Deliver static, self-contained GLBs under 10 MB using the coordinate/anchor contract in [3d-assets.md](3d-assets.md). Include model credit, source URL, usage basis, true unit scale and a list of unverified details. Wheel assets should omit tires, cassette and rotors; the prototype duplicates one wheel per axle, which does not reproduce distinct front/rear hub geometry.

Human review should confirm alignment and visible resemblance before enabling each asset. Validate product compatibility in the specification database independently. Do not infer or generate aerodynamic scores, material stiffness, frame fit, load limits or actual weight from an AI mesh.

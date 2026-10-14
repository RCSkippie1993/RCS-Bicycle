# 3D viewer and product asset contract

## Current state

The website has a lazily loaded Three.js viewer with orbit/zoom, keyboard controls, camera presets and a separated-parts view. It renders a generic road-bike schematic whose styles respond to component choices. It is **not an AI reconstruction, supplier CAD model or engineering/fit representation**. Real manufacturer/retailer photographs remain the default view. No real product meshes have been supplied or generated.

`src/model-assets.json` intentionally has an empty `assets` mapping. The schematic dimensions/colours in `src/model-spec.js` never change sourced specifications, weights, prices or compatibility rules. A selected source product's name below the viewer identifies the catalog selection, not the mesh's manufacturer.

## Add a frame or wheel GLB

1. Obtain supplier CAD/GLB files, commission a model, or use a separately authorized image-to-3D service. Document source photographs/files, permission/usage basis and model-maker credit. Several views and dimension references are preferable; one photo cannot establish hidden geometry or exact dimensions.
2. Prepare a static, self-contained GLB 2.0. Apply transforms and convert to metres. Use embedded textures/buffers; remove skeletons and animations. This initial loader does not support Draco/Meshopt-compressed assets. Aim for fewer than 80,000 triangles and textures of 1K–2K; the viewer rejects files above 10 MB.
3. Align to the coordinate system: Y up, X toward the front wheel, Z along the wheel axles. The schematic anchors are reference assembly positions, not a specific frame's geometry.
4. Put a file under `public/models/` and register its catalog product ID below. Fill in all reviewed transforms, source, credit and usage basis. Keep `alignmentReviewed` false until a person has compared the asset against its dimensional evidence and photos. Do not label an AI approximation as supplier CAD.
5. Test both actual model loading and fallback. Validate dimensions/interfaces against manufacturer data separately; a good-looking mesh does not establish fit, aerodynamics, stiffness or weight.

Example **metadata only**; this file does not exist and is not registered in the current viewer:

```json
{
  "version": 1,
  "assets": {
    "allez-sprint": {
      "slot": "frame",
      "url": "models/allez-sprint.glb",
      "provenance": "ai-approximation",
      "credit": "Artist / generation-service account",
      "usageBasis": "Record the applicable supplier permission or asset terms",
      "sourceUrl": "https://example.com/product-evidence",
      "units": "metres",
      "alignmentReviewed": false,
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "anchors": {
        "rearAxle": [-0.54, 0.35, 0],
        "frontAxle": [0.51, 0.35, 0],
        "bottomBracket": [-0.12, 0.29, 0],
        "seatTop": [-0.25, 0.85, 0],
        "headTop": [0.32, 0.86, 0],
        "headBottom": [0.37, 0.72, 0]
      }
    }
  }
}
```

The example anchor numbers belong to the generic schematic. Replace them with reviewed model anchors before setting `alignmentReviewed: true`.

A frame asset replaces frame, fork and seatpost. Exclude wheels, tires, bars/stem, saddle, brakes and drivetrain; those are separate schematic groups in this pilot. A wheel asset uses `slot: "wheels"` and `layout: "single-wheel"`, with its hub at the origin and its axle along Z. It should contain the rim, spokes and hub without a tire, rotor or cassette. The current pilot clones one wheel model front/rear; distinct front/rear hubs require a future paired-wheel adapter. Keep that visual approximation disclosed.

Provenance must be `supplier` or `ai-approximation`. Credit/source links appear when an imported model is used. The scene remains labelled schematic/mixed because other components still use generic geometry. Invalid metadata, out-of-range model size, missing files or unsupported GLBs retain the schematic fallback.

## Runtime and performance

The 3D engine loads only when the visitor chooses **3D schematic**. GLTFLoader is a separate dynamic chunk loaded only for an actual registered asset. The viewer renders on interaction/resize, caps pixel density, reuses the canvas between component changes, and releases resources in photo mode. The approximately 165 KB gzipped 3D chunk intentionally exceeds Vite's default raw chunk warning threshold; it does not load on the default photo page.

No external 3D-generation API, paid account or generation credentials are connected. Adding such a service requires choosing the provider, its usage terms and generation budget. Do not put API credentials in the static website or browser bundle.

## Validation

Model unit tests cover registry honesty, schematic/data separation, evidence/alignment requirements, local asset paths and GLB inspection. Browser checks exercise real WebGL drawing, visible camera/mesh changes, retained canvas, separation, keyboard/zoom, prices/quotes, mobile sizing, cleanup, no-WebGL fallback and the actual GLB loader using an unbranded triangle fixture. The fixture under `test/fixtures` is not a product and is not shipped under `public/models`.

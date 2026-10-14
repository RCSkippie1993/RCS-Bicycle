import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { catalog, defaults, evaluate } from './catalog.js';
import { defaultAnchors, schematicSpec, validateModelAsset, inspectGlb } from './model-spec.js';
import registry from './model-assets.json' with { type: 'json' };
const asset = { slot: 'frame', url: 'models/example.glb', provenance: 'ai-approximation', credit: 'Test artist', usageBasis: 'Test permission', sourceUrl: 'https://example.com/source', units: 'metres', alignmentReviewed: true, anchors: defaultAnchors };

test('no supplied models are represented as real product meshes', () => {
 assert.deepEqual(registry.assets, {});assert.equal(validateModelAsset(null, 'frame').valid, false);
});
test('schematic changes are separate from actual prices, measurements and performance', () => {
 const base = evaluate(defaults), other = evaluate({ ...defaults, wheels: 'rd38', frame: 'tarmac-sl8' });
 const a = schematicSpec(base.parts), b = schematicSpec(other.parts);
 assert.notEqual(a.rimDepth, b.rimDepth);assert.notEqual(a.frameColor, b.frameColor);
 assert.equal(base.knownSubtotal, 51610);assert.equal(base.weight, null);assert.ok(Object.values(base.scores).every(x => x === null));
 assert.equal(catalog.frame.items[0].weight, 2.35);
});
test('model evidence, usage, source, units and reviewed anchors are required', () => {
 assert.equal(validateModelAsset(asset, 'frame').valid, true);
 for (const bad of [{ ...asset, alignmentReviewed: false }, { ...asset, units: 'millimetres' }, { ...asset, anchors: {} }, { ...asset, usageBasis: '' }, { ...asset, sourceUrl: 'javascript:alert(1)' }, { ...asset, provenance: 'official-unverified' }, { ...asset, scale: [-1, 1, 1] }]) assert.equal(validateModelAsset(bad, 'frame').valid, false);
 assert.equal(validateModelAsset({ ...asset, slot: 'wheels', layout: 'single-wheel' }, 'wheels').valid, true);
 assert.equal(validateModelAsset({ ...asset, slot: 'wheels' }, 'wheels').valid, false);
});
test('asset URLs stay within the local model directory', () => {
 for (const url of ['https://example.com/a.glb', '../a.glb', 'models/../a.glb', '/models/a.glb', 'models/a.gltf', 'models/a.glb?x=1']) assert.equal(validateModelAsset({ ...asset, url }, 'frame').valid, false);
});
test('a real GLB binary fixture passes inspection while invalid/external assets are rejected', () => {
 const fixture = readFileSync(new URL('../test/fixtures/viewer-triangle.glb', import.meta.url));assert.equal(inspectGlb(fixture).valid, true);
 assert.equal(inspectGlb(new ArrayBuffer(4)).valid, false);assert.equal(inspectGlb(new Uint8Array(11 * 1024 * 1024)).valid, false);
 const json = JSON.stringify({ asset: { version: '2.0' }, images: [{ uri: 'https://example.com/texture.jpg' }] });const padded = json.padEnd(Math.ceil(json.length / 4) * 4, ' '), bytes = new Uint8Array(20 + padded.length), view = new DataView(bytes.buffer);
 view.setUint32(0, 0x46546c67, true);view.setUint32(4, 2, true);view.setUint32(8, bytes.length, true);view.setUint32(12, padded.length, true);view.setUint32(16, 0x4e4f534a, true);bytes.set(new TextEncoder().encode(padded), 20);
 assert.equal(inspectGlb(bytes).valid, false);assert.match(inspectGlb(bytes).reason, /Embed/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, defaults } from './catalog.js';
import { briefText } from './brief.js';
import { riderDefaults } from './rider.js';
import { escapeHtml } from './view-utils.js';

test('export retains price types, variant evidence, pair quantities and scope of subtotal', () => {
 const text = briefText(evaluate(defaults), { ...riderDefaults, budgetZar: 60000, heightCm: 180 });
 assert.match(text, /Height: 180 cm/);assert.match(text, /Manufacturer MSRP/);assert.match(text, /2 × R\s*1\s*390/);
 assert.match(text, /variant=/);assert.match(text, /2026-10-14/);assert.match(text, /Known listed parts subtotal: R\s*51\s*610/);
 assert.match(text, /not a complete-bike quote/);assert.match(text, /VAT/);assert.match(text, /No order, payment or request/);
 assert.doesNotMatch(text, /Bianchi Sprint/);
 assert.match(text, /RCS reference profile v1.0 — Budget accessibility:/);
 assert.match(text, /No overall build score is calculated/);
});
test('Di2 sourcing export keeps caliper package unpriced without adding a separate controls charge', () => {
 const text = briefText(evaluate({ ...defaults, drivetrain: '105-di2', brakes: '105-r7170' }), riderDefaults);
 assert.match(text, /Quote required \(Package confirmation needed\)/);assert.match(text, /Package reference only; no separate brake price confirmed/);
 assert.match(text, /Known listed parts subtotal: R\s*65\s*460/);
});
test('external product text is escaped before insertion into HTML', () => {
 assert.equal(escapeHtml('"<img onerror=x> & \'test\''), '&quot;&lt;img onerror=x&gt; &amp; &#39;test&#39;');
});

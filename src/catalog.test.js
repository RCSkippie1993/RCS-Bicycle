import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { catalog, completeBikes, defaults, evaluate, money, checkedAt } from './catalog.js';

test('default reference subtotal uses actual listed line quantities and excludes complete bikes', () => {
 const b = evaluate(defaults);
 assert.equal(b.knownSubtotal, 51610);assert.equal(b.price, 51610);assert.equal(b.unpriced.length, 0);
 assert.equal(b.parts.tires.price, 2780);assert.equal(b.parts.cockpit.price, 1780);
 assert.equal(b.parts.drivetrain.price, 6410);assert.equal(b.parts.brakes.price, 9640);
 assert.equal(b.weight, null);assert.equal(b.compatibilityVerified, false);
 assert.ok(Object.values(b.scores).every(score => score === null));
 assert.deepEqual(completeBikes.map(p => p.price), [49900, 50000, 62900]);
});
test('every catalog photo is local and has dated product-level price/source evidence', () => {
 const records = [...Object.values(catalog).flatMap(g => g.items), ...completeBikes];
 assert.equal(records.length, 18);
 for (const p of records) {
  assert.ok(existsSync(new URL('../public/' + p.image, import.meta.url)), p.id);
  assert.match(p.image, /^products\/[a-z0-9-]+\.(png|jpg)$/);
  assert.equal(p.verification.status, 'listing-reviewed');assert.equal(p.verification.reviewedAt, checkedAt);
  assert.match(p.photoSource.remoteUrl, /^https:\/\//);assert.match(p.photoSource.url, /^https:\/\//);
  for (const source of p.sources) {
   assert.ok(['www.specialized.com', 'bike-addict.co.za'].includes(new URL(source.url).hostname));
   assert.equal(source.checkedAt, checkedAt);assert.equal(source.currency, 'ZAR');assert.ok(source.unitPrice > 0 && source.quantity > 0);
  }
  if (Number.isFinite(p.price)) assert.equal(p.price, p.sources.filter(s => !s.referenceOnly).reduce((sum, s) => sum + s.quantity * s.unitPrice, 0));
 }
});
test('mechanical controls must match and Di2 package check never double-counts a separate brake price', () => {
 assert.equal(evaluate({ ...defaults, drivetrain: '105-di2' }).errors.length, 1);
 const b = evaluate({ ...defaults, drivetrain: '105-di2', brakes: '105-r7170' });
 assert.deepEqual(b.errors, []);assert.equal(b.parts.drivetrain.price, 29900);assert.equal(b.parts.brakes.price, null);
 assert.equal(b.price, null);assert.equal(b.knownSubtotal, 65460);assert.equal(b.unpriced.length, 1);
 assert.equal(money(b.price), 'Quote required');assert.ok(b.warnings.some(note => /caliper/i.test(note)));
});
test('source-supported frame information remains separate from fit and build-weight guarantees', () => {
 const unknown = evaluate(defaults);assert.ok(unknown.warnings.some(note => /clearance/.test(note)));
 const tarmac = evaluate({ ...defaults, frame: 'tarmac-sl8-10r' });
 assert.equal(tarmac.parts.frame.maxTire, 32);assert.equal(tarmac.parts.frame.weight, 1.69);assert.equal(tarmac.weight, null);
 assert.ok(tarmac.warnings.some(note => /optional replacement/.test(note)));
});
test('retired selections fall back to available reference models', () => {
 const b = evaluate({ frame: 'aethos', wheels: 'e1800', drivetrain: 'electronic' });
 assert.equal(b.parts.frame.id, 'allez-sprint');assert.equal(b.parts.wheels.id, 'r470');assert.equal(b.parts.drivetrain.id, '105-mechanical');
});
test('all 192 combinations keep partial pricing explicit and detect 96 control mismatches', () => {
 let cases = [{}];for (const [key, g] of Object.entries(catalog)) cases = cases.flatMap(c => g.items.map(p => ({ ...c, [key]: p.id })));
 let mismatches = 0;for (const c of cases) {
  const b = evaluate(c);assert.ok(Number.isFinite(b.knownSubtotal) && b.knownSubtotal > 0);assert.equal(b.price === null, b.unpriced.length > 0);
  if (b.errors.length) mismatches++;
 }
 assert.equal(cases.length, 192);assert.equal(mismatches, 96);
});

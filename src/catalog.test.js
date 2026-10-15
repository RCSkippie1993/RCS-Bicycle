import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { catalog, completeBikes, defaults, evaluate, money, checkedAt } from './catalog.js';
import { productRecords } from './product-records.js';

test('default reference subtotal uses actual listed line quantities and excludes complete bikes', () => {
 const b = evaluate(defaults);
 assert.equal(b.knownSubtotal, 51610);assert.equal(b.price, 51610);assert.equal(b.unpriced.length, 0);
 assert.equal(b.parts.tires.price, 2780);assert.equal(b.parts.cockpit.price, 1780);
 assert.equal(b.parts.drivetrain.price, 6410);assert.equal(b.parts.brakes.price, 9640);
 assert.equal(b.weight, null);assert.equal(b.compatibilityVerified, false);
 assert.ok(Object.values(b.scores).every(score => score === null));
 assert.deepEqual(completeBikes.slice(0,3).map(p => p.price), [49900, 50000, 62900]);
 assert.equal(completeBikes.length, 24);
 assert.equal(completeBikes.find(p => p.id === 'addict-30-26').price, 71900);
 assert.match(completeBikes.find(p => p.id === 'addict-30-26').sources[0].variant, /Frozen Green \/ M/);
});
test('every catalog photo is local and has dated product-level price/source evidence', () => {
 const records = productRecords.map(r=>r.product);
 assert.equal(records.length, 261);
 assert.equal(catalog.frame.items.length,32);
 assert.equal(new Set(records.map(p=>p.id)).size, records.length);
 for (const p of records) {
  assert.ok(existsSync(new URL('../public/' + p.image, import.meta.url)), p.id);
  assert.match(p.image, /^products\/[a-z0-9-]+\.(png|jpg|webp)$/);
  assert.equal(p.verification.status, 'listing-reviewed');assert.ok(['2026-10-14','2026-10-15'].includes(p.verification.reviewedAt));
  assert.match(p.photoSource.remoteUrl, /^https:\/\//);assert.match(p.photoSource.url, /^https:\/\//);
  for (const source of p.sources) {
   assert.ok(['www.specialized.com','bike-addict.co.za','cwcycles.co.za','www.cyclelab.com','www.olympiccycles.co.za','www.lynnwoodcyclery.co.za','evobikes.co.za','solomonscycles.co.za','www.mellowvelo.co.za','www.complete-cyclist.com','www.crowncycles.co.za','winspacecyclessa.co.za'].includes(new URL(source.url).hostname));
   assert.equal(source.checkedAt,p.verification.reviewedAt);assert.ok(source.quantity > 0);
   if(source.kind==='manufacturer-specification') {
    assert.equal(source.unitPrice,null);assert.equal(source.currency,null);assert.equal(source.referenceOnly,true);assert.equal(p.price,null);assert.match(p.pricingLabel,/SA quote required/);
   }else {assert.equal(source.currency,'ZAR');assert.ok(source.unitPrice>0);}
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
test('every builder combination preserves partial pricing and detects its control-family mismatch', () => {
 const keys=Object.keys(catalog),selection={};let cases=0,controlMismatches=0;
 // Stream combinations: frame additions must not create a multi-million-object array in memory.
 function visit(index){
  if(index<keys.length){const key=keys[index];for(const p of catalog[key].items){selection[key]=p.id;visit(index+1);}return;}
  const b=evaluate(selection);cases++;
  assert.ok(Number.isFinite(b.knownSubtotal)&&b.knownSubtotal>0);assert.equal(b.price===null,b.unpriced.length>0);
  const conflict=b.parts.drivetrain.controlSystem!==b.parts.brakes.controlSystem;
  assert.equal(b.compatibility.checks.find(c=>c.id==='controls').status==='conflict',conflict);
  if(conflict){controlMismatches++;assert.ok(b.errors.length);}
 }
 visit(0);
 assert.equal(cases,Object.values(catalog).reduce((n,g)=>n*g.items.length,1));assert.equal(controlMismatches,cases/2);
});
test('new frames retain actual SA cents, explicit foreign-reference pricing gaps and missing fork exclusions',()=>{
 const frames=catalog.frame.items;
 assert.equal(frames.find(p=>p.id==='dogma-f-2024').price,124999.99);
 assert.match(money(124999.99),/124\s*999[.,]99/);
 assert.deepEqual(frames.filter(p=>p.price===null).map(p=>p.id),['aethos-2-10r','aethos-2-12r','roubaix-sl8-12r']);
 assert.deepEqual(frames.find(p=>p.id==='colnago-v4rs-frame').missingEssentials,['matching fork','headset','axles']);
 const build=evaluate({frame:'aethos-2-10r'});assert.equal(build.knownSubtotal,26610);assert.equal(build.price,null);assert.equal(build.unpriced.length,1);
 assert.ok(build.warnings.some(note=>/South African supplier quote/.test(note)));
});

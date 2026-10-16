import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog, completeBikes } from './catalog.js';
import { productRatings, budgetBands } from './ratings.js';
import { productRecords, filterProducts } from './product-browser.js';

test('all collection references get profiles; unpriced packages stay pending', () => {
 assert.ok(productRecords.length>=430);
 let scored=0;
 for (const {category,product} of productRecords) {
  const ratings=productRatings(product,category);
  assert.equal(ratings[0].key,'budget');
  assert.equal(ratings[0].score===null,!Number.isFinite(product.price));
  if(ratings[0].score!==null)scored++;
  for(const r of ratings) {
   assert.ok(r.score===null || (Number.isInteger(r.score) && r.score>=1 && r.score<=10));
   if(r.score!==null)assert.ok(r.evidence.length>0,product.id+' '+r.key);
   assert.ok(r.basis.length>20);
  }
 }
 assert.equal(scored,productRecords.filter(r=>Number.isFinite(r.product.price)).length);
});
test('fixed budget scales clamp and reverse cost without implying expensive is better', () => {
 for(const category in budgetBands) {
  const [low,high]=budgetBands[category];
  const score=price=>productRatings({price,sources:[]},category)[0].score;
  assert.equal(score(low/2),10);assert.equal(score(low),10);assert.equal(score(high),1);assert.equal(score(high*2),1);
  assert.ok(score(low+(high-low)*0.25)>score(low+(high-low)*0.75));
  assert.equal(score(null),null);assert.equal(score(NaN),null);assert.equal(score(0),null);
 }
});
test('dimension profiles require evidence and never invent aero, climbing or comfort scores', () => {
 const wheel=catalog.wheels.items.find(p=>p.id==='rd50');
 const rated=productRatings(wheel,'wheels');
 assert.equal(rated.find(r=>r.key==='depth').score,7);
 assert.equal(rated.find(r=>r.key==='mass').score,7);
 assert.equal(productRatings({...wheel,profileEvidence:{}},'wheels').find(r=>r.key==='mass').score,null);
 const tyre=catalog.tires.items.find(p=>p.id==='cinturato-32');
 assert.equal(productRatings(tyre,'tires').find(r=>r.key==='volume').score,7);
 assert.equal(productRatings(completeBikes.find(p=>p.id==='addict-rc10-26'),'bike').find(r=>r.key==='mass').score,9);
 for(const {category,product}of productRecords)assert.ok(productRatings(product,category).every(r=>!['aero','climbing','comfort','overall'].includes(r.key)));
 assert.throws(()=>productRatings(wheel,'unknown'),/Unknown rating category/);
});
test('search and intersecting category/brand/source filters find actual products without mutating the catalog', () => {
 const all=productRecords.map(r=>r.product.id);
 const found=filterProducts(productRecords,{query:'  105  ',category:'bike',brand:'Titan Racing',pricing:'retailer-listing'});
 assert.equal(found.length,2);assert.ok(found.every(r=>r.category==='bike'&&r.product.brand==='Titan Racing'));
 assert.equal(filterProducts(productRecords,{query:'unfindable-xyz'}).length,0);
 assert.ok(filterProducts(productRecords,{pricing:'manufacturer-msrp'}).every(r=>r.product.pricingLabel==='Manufacturer MSRP'));
 const tires=filterProducts(productRecords,{category:'tires',sort:'price-asc'});
 assert.ok(tires.length>=40);assert.ok(tires[0].product.price<=980);
 const descending=filterProducts(productRecords,{category:'brakes',sort:'price-desc'});
 assert.equal(descending.at(-1).product.price,null);
 assert.deepEqual(productRecords.map(r=>r.product.id),all);
});

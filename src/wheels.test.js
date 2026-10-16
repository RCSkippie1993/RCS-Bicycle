import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import data from './wheel-data.json' with {type:'json'};
import { catalog } from './catalog.js';
import { productRecords, filterProducts } from './product-browser.js';
import { wheelGroups, wheelFacet } from './wheel-filters.js';
import { summarizeBox } from './build-box.js';

test('expanded wheelset offers preserve exact SA source quantities, dates, photos and distinct variants',()=>{
 assert.equal(data.wheelsets.length,169);assert.equal(data.coverage.stores.length,7);
 assert.equal(productRecords.filter(r=>r.category==='wheels').length,175);
 for(const p of data.wheelsets){
  assert.ok(p.price>0);assert.equal(p.price,p.sources.reduce((sum,s)=>sum+s.unitPrice*s.quantity,0));
  assert.equal(p.verification.reviewedAt,'2026-10-15');assert.equal(p.sources[0].currency,'ZAR');
  const b=readFileSync(new URL('../public/'+p.image,import.meta.url));assert.ok(b.length>1500);assert.ok(b[0]===0xff||b[0]===0x89||b.toString('ascii',0,4)==='RIFF');
  for(const key of ['material','brake','tireSystem','freehub','depthMm'])if(p.wheelSpecs[key]!==null){assert.ok(p.wheelEvidence[key]?.excerpt,p.id+' '+key);assert.equal(p.wheelEvidence[key].url,p.sources[0].url);}
  if(p.buildEligible){assert.equal(p.wheelSpecs.brake,'disc');assert.equal(p.wheelSpecs.freehub,'shimano');assert.equal(p.wheelSpecs.usage,'road');assert.notEqual(p.wheelSpecs.tireSystem,'tubular');assert.ok(catalog.wheels.items.some(w=>w.id===p.id));}
  else {assert.ok(p.builderNote);const added=catalog.wheels.items.some(w=>w.id===p.id);if(added){assert.equal(p.wheelSpecs.brake,'disc');assert.equal(p.wheelSpecs.usage,'road');assert.ok(['xdr','n3w','campagnolo'].includes(p.wheelSpecs.freehub));}assert.equal(summarizeBox([{productId:p.id,quantity:1}]).canApply,added);}
 }
 const separate=data.wheelsets.find(p=>p.name==='Roval Rapide CL III');assert.equal(separate.sources.length,2);assert.equal(separate.price,38000);assert.deepEqual(separate.wheelSpecs.depthMm,[51,48]);assert.equal(separate.profileFacts.rimDepthMm,undefined);
 assert.ok(data.coverage.excluded.some(r=>r.reason.includes('Rear wheel only')));
});
test('wheelset subcategories and retailer filters intersect and never pull in unrelated products',()=>{
 for(const[key,group]of Object.entries(wheelGroups))for(const value of Object.keys(group.values)){
  const found=filterProducts(productRecords,{category:'wheels',['wheel_'+key]:value});
  assert.ok(found.every(r=>r.category==='wheels'&&wheelFacet(r.product,key)===value));
 }
 const found=filterProducts(productRecords,{category:'wheels',wheel_material:'carbon',wheel_brake:'disc',wheel_store:'Evo Bikes',sort:'price-asc'});
 assert.ok(found.length>10);assert.ok(found.every(r=>r.product.sources.some(s=>s.name==='Evo Bikes')));
 assert.ok(found.slice(1).every((r,i)=>r.product.price>=found[i].product.price));
 assert.equal(filterProducts(productRecords,{category:'wheels',wheel_material:'alloy',wheel_brake:'disc',wheel_tireSystem:'tubular'}).length,0);
});

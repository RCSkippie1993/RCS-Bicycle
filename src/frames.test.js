import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import data from './frame-data.json' with {type:'json'};
import {catalog,evaluate} from './catalog.js';
import {productRecords,filterProducts} from './product-browser.js';
import {frameFocus,frameFocusLabels} from './frame-filters.js';
import {summarizeBox,boxText} from './build-box.js';
import {briefText} from './brief.js';
import {riderDefaults} from './rider.js';
import {parseSharedBuild,sharedBuildUrl} from './build-share.js';
import {defaults} from './catalog.js';
import {rateBuild} from './build-ratings.js';

test('frame expansion adds distinct model/brake references with actual SA prices, variants and local sourced photos',()=>{
 assert.equal(data.framesets.length,24);assert.equal(catalog.frame.items.length,32);
 const frames=productRecords.filter(r=>r.category==='frame');assert.equal(frames.length,33);assert.equal(new Set(frames.map(r=>r.product.brand)).size,11);
 for(const p of data.framesets){
  assert.ok(p.price>0);assert.equal(p.sources.length,1);assert.equal(p.sources[0].unitPrice,p.price);assert.equal(p.sources[0].quantity,1);assert.equal(p.sources[0].currency,'ZAR');assert.equal(p.sources[0].checkedAt,'2026-10-15');assert.ok(p.sources[0].variant);
  assert.equal(p.weight,null);assert.match(p.weightBasis,/bare-frame|bare frame/i);assert.ok(p.frameSpecs.package.length>20);assert.ok(p.fitNote.length>40);
  const b=readFileSync(new URL('../public/'+p.image,import.meta.url));assert.ok(b.length>1500);assert.ok(b[0]===0x89||b[0]===0xff||b.toString('ascii',0,4)==='RIFF');
  for(const source of Object.values(p.frameEvidence)){assert.ok(source.excerpt.length>5);assert.equal(source.url,p.sources[0].url);}
  if(p.buildEligible)assert.ok(catalog.frame.items.some(f=>f.id===p.id));else assert.equal(summarizeBox([{productId:p.id,quantity:1}]).canApply,false);
 }
 const enve=data.framesets.find(p=>p.id==='enve-melee');assert.match(enve.priceBasis,/frame and fork only/i);assert.match(enve.photoCaption,/complete-bike/i);
 const winspace=data.framesets.find(p=>p.id==='winspace-m6');assert.equal(winspace.price,26149);assert.match(winspace.sources[0].variant,/Small.*Carbon Black/);assert.match(winspace.stockNote,/stock dependent/);assert.equal(winspace.sources[0].listedAvailable,null);
});
test('new sourced clearance/axle limits block conflicts while size-dependent clearance stays a review',()=>{
 const small=evaluate({frame:'winspace-t1550',tires:'gp5000-str-32'});assert.ok(small.errors.some(e=>e.includes('28 mm')));assert.equal(rateBuild(small).blocked,true);
 const valid=evaluate({frame:'winspace-t1550',tires:'gp5000-28'});assert.equal(valid.compatibility.checks.find(c=>c.id==='clearance').status,'matched');
 const agile=evaluate({frame:'winspace-agile',tires:'gp5000-str-32'});assert.equal(agile.parts.frame.maxTire,null);const check=agile.compatibility.checks.find(c=>c.id==='clearance');assert.equal(check.status,'review');assert.match(check.detail,/28 mm for size M/);assert.ok(check.sources.length);
 const bianchi=evaluate({frame:'bianchi-infinito-cv-disc',wheels:'hollowgram-r45'});assert.ok(bianchi.errors.some(e=>e.includes('12x135')));assert.equal(rateBuild(bianchi).blocked,true);
 const unknown=evaluate({frame:'winspace-m6'});assert.equal(unknown.compatibility.checks.find(c=>c.id==='frame-brakes').status,'review');
});
test('frame purpose filters intersect with price, brand and search without changing wheel filters',()=>{
 const featured=filterProducts(productRecords,{category:'frame',sort:'featured'});assert.equal(new Set(featured.slice(0,12).map(r=>r.product.brand)).size,11);
 for(const key of Object.keys(frameFocusLabels)){
  const rows=filterProducts(productRecords,{category:'frame',frame_focus:key});assert.ok(rows.every(r=>frameFocus(r.product)===key));
 }
 const options=filterProducts(productRecords,{category:'frame',brand:'Winspace',frame_focus:'aero',pricing:'retailer-listing',sort:'price-asc'});assert.ok(options.length>=4);assert.ok(options.slice(1).every((r,i)=>r.product.price>=options[i].product.price));
 assert.equal(filterProducts(productRecords,{category:'frame',query:'unfindable-model'}).length,0);
 assert.equal(filterProducts(productRecords,{category:'wheels'}).length,175);
 const pending=filterProducts(productRecords,{category:'frame',frame_focus:'unknown'});assert.ok(pending.some(r=>r.product.id==='time-alpe-dhuez-disc'));
});
test('new frames retain package evidence in briefs, boxes, pricing and share links',()=>{
 const build=evaluate({frame:'enve-melee'}),text=briefText(build,riderDefaults);assert.equal(build.knownSubtotal,121609);assert.match(text,/Frame and fork only/);assert.match(text,/pictured wheels/);
 const box=boxText([{productId:'enve-melee',quantity:2}]);assert.match(box,/Known component subtotal: R\s*189\s*998/);assert.match(box,/ONLY/);
 const url=sharedBuildUrl({...defaults,frame:'winspace-slc3'},'climbing',{},'https://example.com/RCS-Bicycle/');assert.equal(parseSharedBuild(new URL(url).hash).selection.frame,'winspace-slc3');
 const invalid=new URL(url);invalid.hash=invalid.hash.replace('winspace-slc3','time-alpe-dhuez-rim');assert.equal(parseSharedBuild(invalid.hash).status,'invalid');
});

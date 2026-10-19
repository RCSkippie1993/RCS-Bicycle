import test from 'node:test';
import assert from 'node:assert/strict';
import data from './mtb-data.json' with {type:'json'};
import {evaluateMtbBuild,configureMtbProduct,mtbBriefText,mtbSharedUrl,parseMtbShared} from './mtb-build.js';
import {mtbProducts,newMtbFilters,mtbResultsMarkup} from './mtb-ui.js';
const frames=data.records.filter(r=>r.category==='frame').map(r=>r.product),p=id=>frames.find(p=>p.id===id);
const hyrax='mtb-frameplus-pyga-hyrax';
const option=(id,search)=>data.options[id].skus.find(s=>s.title.includes(search)).title;

test('expanded frame catalogue separates 25 dated South African price listings from 24 manufacturer quote references',()=>{
 assert.equal(frames.length,49);assert.equal(new Set(frames.map(p=>p.brand)).size,13);assert.equal(frames.filter(p=>p.manufacturerReference).length,24);assert.equal(frames.filter(p=>Number.isFinite(p.price)).length,25);
 for(const frame of frames.filter(p=>p.manufacturerReference)){
  assert.equal(frame.price,null);assert.equal(frame.weight,null);assert.equal(frame.verification.status,'specification-reviewed');assert.ok(frame.missingEssentials.length);
  assert.ok(frame.sources.every(s=>s.referenceOnly&&s.currency===null&&s.unitPrice===null&&s.listedAvailable===null));
  const build=evaluateMtbBuild(data,{selection:{frame:frame.id}});assert.ok(build.unpriced.some(p=>p.id===frame.id));assert.equal(build.complete,false);assert.match(mtbBriefText(build),/Quote required/);
 }
 const f={...newMtbFilters(),facets:{sourceKind:['Manufacturer reference · SA quote needed']}};assert.equal(mtbProducts(data,'frame',f,{}).length,24);assert.equal(mtbProducts(data,'frame',{...f,availableOnly:true},{}).length,0);
 const rows=mtbProducts(data,'frame',newMtbFilters(),{});assert.ok(rows.slice(0,25).every(r=>Number.isFinite(r.product.price)));assert.ok(rows.slice(25).every(r=>r.product.price===null));
});
test('PYGA exact frame-only and frame-kit options switch supplied shock scope and price without importing complete-bike builds',()=>{
 const frame=p(hyrax),kit=option(hyrax,'Medium / Frame Kit'),bare=option(hyrax,'Medium / Frame Only'),plan={selection:{frame:hyrax},choices:{[hyrax]:{variant:kit}}};
 for(const id of ['mtb-frameplus-pyga-mobu',hyrax,'mtb-frameplus-pyga-slakline'])for(const s of data.options[id].skus){assert.match(s.title,/Frame (?:Kit|Only)/);assert.ok(!s.title.includes('Build 1'));assert.ok(!s.title.includes('Build 2'));}
 const equipped=evaluateMtbBuild(data,plan);assert.equal(equipped.knownSubtotal,36500);assert.equal(equipped.parts.shock.price,0);assert.equal(equipped.parts.shock.includedInPackage,true);
 const basic=evaluateMtbBuild(data,{selection:{frame:hyrax},choices:{[hyrax]:{variant:bare}}});assert.equal(basic.knownSubtotal,27500);assert.equal(basic.parts.shock,undefined);assert.ok(basic.missing.includes('shock'));
 const replacement='mtb-suspension-fox-float-sl-performance-190x45',after=evaluateMtbBuild(data,{...plan,selection:{frame:hyrax,shock:replacement}});assert.ok(after.checks.some(c=>c.id==='included-shock-replacement'&&c.status==='conflict'));assert.equal(after.knownSubtotal,36500+data.records.find(r=>r.product.id===replacement).product.price);
 const link=mtbSharedUrl(plan,'https://example.co.za/mountain.html',data);assert.equal(parseMtbShared(new URL(link).hash,data).plan.choices[hyrax].variant,kit);assert.match(mtbBriefText(equipped),/Frame Kit/);
});
test('Stealth Medium keeps its explicit no-shock offer and does not inherit the contradictory Large-only interfaces',()=>{
 const frame=p('mtb-frameplus-stealth-s8');assert.equal(frame.price,21995);assert.equal(frame.mtb.rearAxle,undefined);assert.equal(frame.mtb.seatpostDiameterMm,undefined);assert.equal(frame.mtb.includedCategories,undefined);assert.match(frame.photoScope,/excluded from Medium/);
 const large=configureMtbProduct(frame,{choices:{[frame.id]:{variant:'Large · shock contents unconfirmed'}}},data);assert.equal(large.price,21995);assert.equal(large.mtb.rearAxle,'12x142');assert.equal(large.mtb.seatpostDiameterMm,31.6);assert.equal(large.mtb.shockStrokeMm,35);assert.equal(large.sources[0].listedAvailable,false);assert.equal(large.mtb.includedCategories,undefined);assert.equal(large.weight,null);
 const gulf=p('mtb-frameplus-stealth-s8-boost');assert.equal(gulf.mtb.rearAxle,'12x148');assert.notEqual(gulf.id,frame.id);
});
test('frame generation, wheel configuration and explicit Transmission exclusions survive the larger range',()=>{
 const bfe=p('mtb-frameplus-cotic-bfe');assert.equal(bfe.mtb.UDH,true);assert.equal(bfe.mtb.transmissionCompatible,false);
 const conflict=evaluateMtbBuild(data,{selection:{frame:bfe.id,drivetrain:'mtb-drives-gx-transmission-drive'}});assert.ok(conflict.checks.some(c=>c.id==='udh'&&c.status==='conflict'&&/explicitly excludes SRAM Transmission/.test(c.detail)));
 const mechanical=evaluateMtbBuild(data,{selection:{frame:bfe.id,drivetrain:'mtb-drives-xt-m8200-di2-drive'}});assert.ok(!mechanical.checks.some(c=>c.id==='udh'&&c.status==='conflict'));
 const jeht=p('mtb-frameplus-cotic-jeht-gen3');assert.equal(jeht.mtb.shockEyeMm,185);assert.equal(jeht.mtb.shockStrokeMm,55);assert.equal(jeht.mtb.frontWheelSize,'29');assert.equal(jeht.mtb.rearWheelSize,'27.5');
 const mismatched=evaluateMtbBuild(data,{selection:{frame:jeht.id,wheels:'mtb-wheels-fulcrum-redzone3'}});assert.ok(mismatched.checks.some(c=>c.id==='frame-rear-wheel'&&c.status==='conflict'));
 for(const name of ['prime','phantom','titan','rune','spitfire']){const frame=p('mtb-frameplus-banshee-'+name+'-v3-2');assert.equal(frame.mtb.seatpostDiameterMm,30.9);assert.ok(frame.mtbEvidence.seatpostDiameterMm.url.endsWith('-v32'));}
 for(const id of ['mtb-frameplus-ibis-ripmo-v3','mtb-frameplus-ibis-ripmo-af-v2','mtb-frameplus-transition-sentinel'])assert.equal(p(id).mtb.rearWheelSize,undefined,'size-dependent setups must not become universal wheel facts');
 assert.equal(p('mtb-frameplus-yeti-arc').mtb.recommendedForkTravelMm,undefined,'conflicting current/legacy fork descriptions stay unconfirmed');
});
test('quote-only model cards keep their sourcing status visible and never render a free frame',()=>{
 const id='mtb-frameplus-banshee-anomaly',f={...newMtbFilters(),query:'Banshee Anomaly'},build=evaluateMtbBuild(data,{}),view=mtbResultsMarkup(data,'frame',f,build);
 assert.match(view.html,/Quote required/);assert.match(view.html,/SA price & supply unconfirmed/);assert.ok(!view.html.includes('R 0'));assert.ok(view.html.includes(id));
 const current=mtbSharedUrl({selection:{frame:id}},'https://example.co.za/mountain.html',data);assert.equal(parseMtbShared(new URL(current).hash,data).plan.selection.frame,id);
});

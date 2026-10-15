import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {catalog,defaults} from './catalog.js';
import {normalizePlan,guidedBuild,coreSteps,chainOffers,extraOffers,optionRegister,validSharedPlan,shareablePlan} from './build-plan.js';
import {scienceProfile,climbingPowerDelta,documentedMass} from './build-science.js';
import {parseSharedBuild,sharedBuildUrl} from './build-share.js';
import {briefText} from './brief.js';
import {riderDefaults} from './rider.js';
import {filterItems,newFilters} from './guided-ui.js';
const all=extra=>normalizePlan({chosen:coreSteps,...extra});
const item=(category,id)=>catalog[category].items.find(p=>p.id===id);
test('new guided builds start empty, only equipped components enter costs, mass and compatibility',()=>{
 const fresh=guidedBuild(defaults,normalizePlan());assert.equal(fresh.knownSubtotal,0);assert.equal(Object.keys(fresh.parts).length,0);assert.equal(fresh.missing.length,7);assert.equal(fresh.complete,false);assert.deepEqual(fresh.errors,[]);
 const frame=guidedBuild(defaults,normalizePlan({chosen:['frame']}));assert.equal(frame.knownSubtotal,25000);assert.equal(documentedMass(frame).kg,2.35);assert.equal(frame.parts.wheels,undefined);
 const full=guidedBuild(defaults,all());assert.equal(full.knownSubtotal,51610);assert.equal(full.complete,true);assert.equal(documentedMass(full).kg,4.16);assert.equal(documentedMass(full).complete,false);
});
test('plan validation drops unknown ids, user prices, duplicates, invalid options and oversized requests',()=>{
 const p=normalizePlan({chosen:['frame','frame','bike'],choices:{constructor:{size:'M'},'pro-plt':{size:'44cm',price:1},bogus:{size:'M'}},requests:{'allez-sprint':{size:'x'.repeat(90)+'\n',email:'private'},bogus:{size:'M'}},chain:'bogus',extras:['light-femto-pair','light-femto-pair','bogus'],price:1});
 assert.deepEqual(p.chosen,['frame']);assert.deepEqual(p.choices,{'pro-plt':{size:'44cm'}});assert.equal(p.requests['allez-sprint'].size.length,60);assert.equal(p.requests['allez-sprint'].email,undefined);assert.equal(p.chain,'included');assert.deepEqual(p.extras,['light-femto-pair']);
});
test('source SKU choices recalculate exact width prices and preserve stem/source quantities',()=>{
 const b=guidedBuild({...defaults,cockpit:'pro-plt-carbon'},all({choices:{'pro-plt-carbon':{size:'44cm / 31.8mm'}}}));
 assert.equal(b.parts.cockpit.price,4980);assert.equal(b.knownSubtotal,54810);assert.match(b.parts.cockpit.sources[0].url,/49866375168297/);assert.equal(b.parts.cockpit.sources[0].unitPrice,4190);assert.equal(b.parts.cockpit.sources[1].unitPrice,790);
 const stem=guidedBuild(defaults,all({choices:{'pro-plt':{size:'40cm',stemLength:'80mm'}}}));assert.equal(stem.parts.cockpit.price,1780);assert.match(stem.parts.cockpit.sources[1].url,/39741521297492/);assert.equal(stem.parts.cockpit.sources[1].variant,'80mm');
 const spec=optionRegister['sworks-aethos-original'];assert.ok(spec.skus.some(s=>s.listedAvailable===false));
});
test('unverified combinations and free-text sizing stay unpriced; size-dependent clearance remains enforced',()=>{
 const b=guidedBuild({...defaults,frame:'winspace-agile',tires:'gp5000-str-32'},all({choices:{'winspace-agile':{size:'Medium',colour:'Almond White'}}}));
 assert.equal(b.parts.frame.price,null);assert.equal(b.parts.frame.weight,null);assert.equal(b.parts.frame.maxTire,28);assert.ok(b.errors.some(s=>s.includes('28 mm')));assert.ok(b.parts.frame.sources.every(s=>s.referenceOnly));
 const request=guidedBuild(defaults,all({requests:{'allez-sprint':{size:'54'}}}));assert.equal(request.parts.frame.price,null);assert.equal(request.parts.frame.weight,null);assert.equal(request.unpriced.length,1);
});
test('replacement credit removes only a priced included chain; spare retains the full bundle',()=>{
 const replacement=guidedBuild(defaults,all({chain:'chain-kmc-x12'}));assert.equal(replacement.knownSubtotal,51710);assert.equal(replacement.parts.drivetrain.price,5920);assert.equal(replacement.parts.drivetrain.sources.length,4);assert.equal(replacement.additionalLines[0].price,590);
 const same=guidedBuild(defaults,all({chain:'chain-m7100-116'}));assert.equal(same.knownSubtotal,51610);
 const spare=guidedBuild(defaults,all({chain:'chain-kmc-x12',chainMode:'spare'}));assert.equal(spare.knownSubtotal,52200);assert.equal(spare.parts.drivetrain.price,6410);
 const di2=guidedBuild({...defaults,drivetrain:'105-di2',brakes:'105-r7170'},all({chain:'chain-m7100-126'}));assert.equal(di2.parts.drivetrain.price,29900);assert.ok(di2.unpriced.some(p=>p.id==='chain-package-review'));assert.equal(di2.knownSubtotal,66050);
});
test('SRAM Road Flattop is withheld as an installed option on Shimano but can be saved as a spare',()=>{
 const b=guidedBuild(defaults,all({chain:'chain-red-e1'}));assert.ok(b.errors.some(s=>s.includes('Flattop')));assert.equal(b.compatibility.counts.conflict,1);
 const spare=guidedBuild(defaults,all({chain:'chain-red-e1',chainMode:'spare'}));assert.deepEqual(spare.errors,[]);assert.equal(documentedMass(spare).kg,4.16);
});
test('extras contribute once to the subtotal; sourced pair mass excludes unknown and partial cockpit masses',()=>{
 const b=guidedBuild(defaults,all({extras:['light-femto-pair','pedals-r7000']}));assert.equal(b.knownSubtotal,54710);assert.ok(Math.abs(documentedMass(b).kg-4.217)<1e-10);assert.equal(documentedMass(b).rows.length,3);
 const metrics=scienceProfile(item('cockpit','pro-plt'),'cockpit');assert.equal(metrics[0].actual,'0.260 kg');assert.equal(metrics[0].label,'Handlebar only');assert.equal(metrics.find(m=>m.key==='stiffness').score,null);
 assert.equal(scienceProfile(item('cockpit','pro-vibe'),'cockpit')[0].score,null);
 for(const p of [...chainOffers,...extraOffers]){assert.ok(existsSync(new URL('../public/'+p.image,import.meta.url)));assert.ok(p.sources.every(s=>s.currency==='ZAR'&&s.checkedAt==='2026-10-15'));assert.equal(p.price,p.sources.reduce((n,s)=>n+s.unitPrice*s.quantity,0));}
});
test('gravity power model has a physical zero/sign, speed scaling and rejects unsupported evidence or scenarios',()=>{
 const a=item('wheels','r470'),b=item('wheels','rd38'),d=climbingPowerDelta(a,b,15,6);
 assert.ok(Math.abs(d.kgSaved-.39)<1e-10);assert.ok(Math.abs(d.watts-.954)<.002);assert.equal(climbingPowerDelta(a,a).watts,0);assert.equal(climbingPowerDelta(a,b,15,0).watts,0);assert.ok(climbingPowerDelta(b,a).watts<0);assert.ok(Math.abs(climbingPowerDelta(a,b,30,6).watts-2*d.watts)<1e-10);
 assert.equal(climbingPowerDelta(a,{...b,profileEvidence:{}},15,6),null);assert.equal(climbingPowerDelta(a,b,NaN,6),null);assert.equal(climbingPowerDelta(a,b,15,-1),null);assert.equal(climbingPowerDelta(a,b,80,6),null);
});
test('guided sharing preserves partial membership, exact catalog variants/chain/extras and excludes private fit requests',()=>{
 const plan=normalizePlan({chosen:['frame','cockpit'],choices:{'pro-plt-carbon':{size:'44cm / 31.8mm'}},requests:{'allez-sprint':{size:'private fit note'}},chain:'chain-kmc-x12',extras:['light-femto-pair']});
 const url=sharedBuildUrl({...defaults,cockpit:'pro-plt-carbon'},'race',{},'https://example.com/RCS-Bicycle/index.html?email=secret',plan),parsed=parseSharedBuild(new URL(url).hash);
 assert.equal(parsed.status,'valid');assert.deepEqual(parsed.plan,shareablePlan(plan));assert.ok(!decodeURIComponent(url).includes('private'));assert.ok(!url.includes('secret'));assert.deepEqual(guidedBuild(parsed.selection,parsed.plan).plan.chosen,['frame','cockpit']);
 const bad={...shareablePlan(plan),price:1};assert.equal(validSharedPlan(bad),false);const hash=new URL(url).hash.replace(/plan=.*/,'plan='+encodeURIComponent(JSON.stringify(bad)));assert.equal(parseSharedBuild(hash).status,'invalid');
});
test('guided export contains configured choices, credits, extras and scope rather than phantom default products',()=>{
 const partial=guidedBuild(defaults,normalizePlan({chosen:['frame'],requests:{'allez-sprint':{size:'54',colour:'Blue'}}})),text=briefText(partial,riderDefaults);
 assert.match(text,/requested size: 54/);assert.match(text,/requested colour: Blue/);assert.match(text,/Not yet selected: Wheelset/);assert.doesNotMatch(text,/DT Swiss R470/);
 const full=briefText(guidedBuild(defaults,all({chain:'chain-kmc-x12',extras:['light-femto-pair']})),riderDefaults);
 assert.match(full,/126 Links/);assert.match(full,/FEMTO|Femto/);assert.match(full,/Four drivetrain items/);assert.match(full,/DOCUMENTED MASS SUBTOTAL/);assert.match(full,/complete bicycle weight is pending/);
});
test('checkbox filters intersect; default price ordering and unpriced-last reflect selected variants',()=>{
 const f=newFilters(),p=normalizePlan({choices:{'winspace-agile':{size:'Medium'}}});const sorted=filterItems('frame',f,p);const prices=sorted.filter(p=>Number.isFinite(p.price)).map(p=>p.price);assert.deepEqual(prices,[...prices].sort((a,b)=>a-b));assert.equal(sorted.at(-1).price,null);
 assert.equal(filterItems('frame',{...f,brands:[]}).length,0);const carbon=filterItems('frame',{...f,brands:['Winspace'],material:['Carbon'],focus:['aero']});assert.ok(carbon.length>0);assert.ok(carbon.every(p=>p.brand==='Winspace'));assert.equal(filterItems('frame',{...f,query:'nothing-xyz'}).length,0);
});

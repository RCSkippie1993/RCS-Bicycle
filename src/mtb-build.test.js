import test from 'node:test';
import assert from 'node:assert/strict';
import {mtbStorageKey,mtbCatalog,normalizeMtbPlan,configureMtbProduct,evaluateMtbBuild,mtbSteps,mtbLineTotal,mtbBriefText,mtbQuoteContext,mtbSharedUrl,parseMtbShared,shareableMtbPlan} from './mtb-build.js';
import {quoteText} from './quote.js';

const source='https://example.co.za/products/';
const evidence=facts=>Object.fromEntries(Object.entries(facts).map(([key,value])=>[key,{url:source+'specification',excerpt:`Published ${key}: ${JSON.stringify(value)}`,checkedAt:'2026-10-19'}]));
function product(id,mtb={},price=100,weight=null){return{id,brand:'Fixture',name:id,variant:'Exact reference',price,weight,weightBasis:'Exact source package mass',mtb,mtbEvidence:evidence(mtb),image:'products/fixture.jpg',photoSource:{name:'SA source',url:source+id},priceBasis:'One source-listed package',sources:[{name:'SA source',url:source+id,currency:'ZAR',checkedAt:'2026-10-19',unitPrice:price,quantity:1,variant:'Exact reference',listedAvailable:true}],buildEligible:true};}
function fixture(){
 const add=(category,id,facts,price,weight)=>({category,product:product(id,facts,price,weight)});
 return{records:[
  add('frame','frame',{suspension:'hardtail',wheelSizes:['29'],rearAxle:'12x148',seatpostDiameterMm:31.6,brakeMount:'post',recommendedForkTravelMm:[100,120],maxTireWidthInches:2.4,UDH:false},1000,1.5),
  add('fork','fork',{wheelSize:'29',travelMm:120,frontAxle:'15x110',brakeMount:'post'},500,1.7),
  add('shock','shock',{eyeMm:210,strokeMm:55,mount:'trunnion'},200,.4),
  add('wheels','wheels',{frontWheelSize:'29',rearWheelSize:'29',frontAxle:'15x110',rearAxle:'12x148',freehub:'microspline',tubelessReady:true},600,2),
  add('tires','tire',{wheelSize:'29',diameterMm:622,widthInches:2.3,tubelessReady:true},100,.7),
  add('drivetrain','drive',{driveFamily:'shimano-hg12',speeds:12,requiredFreehub:'microspline',includedCategories:['chain']},900),
  add('brakes','brakes',{mount:'post'},300),
  add('cockpit','cockpit',{barClampMm:31.8,stemClampMm:31.8},150),
  add('seatpost','post',{diameterMm:31.6,dropper:true,remoteIncluded:true},200),
  add('saddle','saddle',{},100),
  add('chain','chain',{compatibleDriveFamilies:['shimano-hg12'],speeds:12},80),
  add('extras','light-pair',{},50,.1),
  add('extras','bundle',{},100),
  add('bike','whole-bike',{suspension:'full'},9000),
 ],options:{}};
}
const selection={frame:'frame',fork:'fork',wheels:'wheels',frontTire:'tire',rearTire:'tire',drivetrain:'drive',brakes:'brakes',cockpit:'cockpit',seatpost:'post',saddle:'saddle'};
const get=(data,id)=>data.records.find(r=>r.product.id===id).product;
const setFacts=(data,id,changes)=>{const p=get(data,id);Object.assign(p.mtb,changes);Object.assign(p.mtbEvidence,evidence(changes));};
const check=(build,id)=>build.checks.find(c=>c.id===id);

test('MTB state starts empty and normalizes only scoped catalog choices',()=>{
 const data=fixture(),fresh=evaluateMtbBuild(data);
 assert.notEqual(mtbStorageKey,'rcs-build-plan');
 assert.equal(fresh.knownSubtotal,0);assert.deepEqual(fresh.parts,{});assert.equal(fresh.complete,false);
 assert.equal(parseMtbShared('#build=2&plan=private',data).status,'none');
 assert.equal(mtbCatalog(data).bike.items.length,1);
 const plan=normalizeMtbPlan({selection:{frame:'whole-bike',fork:'fork',frontTire:'bogus'},extras:['light-pair','light-pair','bogus'],extraQuantities:{'light-pair':2,bundle:3},requests:{frame:{size:'x'.repeat(80)+'\n',email:'private'},bogus:{size:'L'}},price:1},data);
 assert.deepEqual(plan.selection,{fork:'fork'});assert.deepEqual(plan.extras,['light-pair']);assert.deepEqual(plan.extraQuantities,{'light-pair':2});
 assert.equal(plan.requests.frame.size.length,60);assert.equal(plan.requests.frame.email,undefined);assert.equal(plan.price,undefined);
 assert.deepEqual(normalizeMtbPlan({...plan,extraQuantities:{'light-pair':21}},data).extraQuantities,{});
});

test('hardtail build prices physical front and rear tyres separately and nominal agreements remain review',()=>{
 const data=fixture(),build=evaluateMtbBuild(data,{selection});
 assert.equal(build.knownSubtotal,3950);assert.equal(build.complete,true);assert.deepEqual(build.errors,[]);
 assert.equal(build.parts.frontTire.price,100);assert.equal(build.parts.rearTire.price,100);assert.equal(build.parts.chain.price,0);
 assert.ok(!mtbSteps(build).includes('shock'));
 assert.equal(build.compatibility.counts.matched,0);assert.ok(build.checks.every(c=>c.status==='review'));
 assert.ok(Math.abs(build.mass.kg-6.6)<1e-10);assert.equal(build.mass.complete,false);
});

test('explicit axle, wheel, tyre, freehub, UDH, chain, brake and clamp disagreements conflict',()=>{
 const data=fixture();
 setFacts(data,'fork',{wheelSize:'27.5',travelMm:150,frontAxle:'15x100'});
 setFacts(data,'wheels',{rearAxle:'12x142',freehub:'xd'});
 setFacts(data,'tire',{wheelSize:'27.5',diameterMm:584,widthInches:2.6});
 setFacts(data,'drive',{driveFamily:'sram-t-type12',requiresUDH:true});
 setFacts(data,'chain',{compatibleDriveFamilies:['sram-eagle12']});
 setFacts(data,'brakes',{mount:'flat'});setFacts(data,'post',{diameterMm:30.9});setFacts(data,'cockpit',{stemClampMm:35});
 const build=evaluateMtbBuild(data,{selection,chain:'chain'});
 for(const id of ['front-axle','rear-axle','fork-wheel','fork-travel','front-tire-diameter','rear-tire-diameter','front-tire-clearance','rear-tire-clearance','freehub','udh','chain-standard','frame-brakes','fork-brakes','seatpost-diameter','bar-clamp'])assert.equal(check(build,id)?.status,'conflict',id);
});

test('unknown specifications and a single fork recommendation never become invented approvals',()=>{
 const data=fixture();for(const row of data.records)row.product.mtbEvidence={};
 const build=evaluateMtbBuild(data,{selection,chain:'chain'});
 assert.deepEqual(build.errors,[]);assert.ok(build.checks.every(c=>c.status==='review'));
 const recommended=fixture();setFacts(recommended,'frame',{recommendedForkTravelMm:120});setFacts(recommended,'fork',{travelMm:140});
 assert.equal(check(evaluateMtbBuild(recommended,{selection}),'fork-travel').status,'review');
});

test('bare full-suspension frames need exact shock dimensions and hardtails reject added shocks',()=>{
 const data=fixture();setFacts(data,'frame',{suspension:'full',shockEyeMm:210,shockStrokeMm:55,shockMount:'trunnion'});
 const absent=evaluateMtbBuild(data,{selection});assert.ok(absent.missing.includes('shock'));
 const matching=evaluateMtbBuild(data,{selection:{...selection,shock:'shock'}});assert.equal(matching.complete,true);assert.equal(check(matching,'shock-eye').status,'review');
 setFacts(data,'shock',{eyeMm:200,strokeMm:50,mount:'eyelet'});
 const wrong=evaluateMtbBuild(data,{selection:{...selection,shock:'shock'}});
 for(const id of ['shock-eye','shock-stroke','shock-mount'])assert.equal(check(wrong,id).status,'conflict');
 const hardtail=evaluateMtbBuild(fixture(),{selection:{...selection,shock:'shock'}});
 assert.equal(check(hardtail,'hardtail-shock').status,'conflict');assert.ok(mtbSteps(hardtail).includes('shock'));
});

test('included fork, shock and post default to contextual zero cost and no duplicated package mass',()=>{
 const data=fixture();const module={suspension:'full',includedCategories:['fork','shock','seatpost'],shockEyeMm:210,shockStrokeMm:55,shockMount:'trunnion',includedFork:{wheelSize:'29',travelMm:120,frontAxle:'15x110',brakeMount:'post'},includedShock:{eyeMm:210,strokeMm:55,mount:'trunnion'},includedSeatpost:{diameterMm:31.6}};
 setFacts(data,'frame',module);get(data,'frame').weight=3.6;
 const {fork,seatpost,...rest}=selection;
 const build=evaluateMtbBuild(data,{selection:rest});
 for(const key of ['fork','shock','seatpost']){assert.equal(build.parts[key].price,0);assert.equal(build.parts[key].weight,null);assert.equal(build.parts[key].includedInPackage,true);assert.equal(build.parts[key].includedParentId,'frame');}
 assert.ok(mtbSteps(build).includes('shock'));assert.equal(build.complete,true);
 assert.equal(build.knownSubtotal,3250);assert.equal(build.mass.kg,7);
 assert.equal(check(build,'front-axle').status,'review');
 const replacement=evaluateMtbBuild(data,{selection:{...selection,shock:'shock'}});
 assert.equal(replacement.parts.shock.id,'shock');assert.equal(replacement.parts.shock.price,200);
 assert.equal(replacement.knownSubtotal,3950+200);
 for(const key of ['fork','shock','seatpost'])assert.equal(check(replacement,`included-${key}-replacement`).status,'conflict');
});

test('accessory quantities multiply exact package and source quantities once',()=>{
 const data=fixture(),bundle=get(data,'bundle');bundle.sources[0].quantity=2;bundle.sources[0].unitPrice=50;
 const build=evaluateMtbBuild(data,{extras:['light-pair','bundle'],extraQuantities:{'light-pair':2,bundle:3}});
 assert.equal(build.knownSubtotal,400);assert.equal(build.additionalLines[0].price,50);assert.equal(build.additionalLines[0].sources[0].quantity,1);
 const brief=mtbBriefText(build);assert.match(brief,/6 × R/);assert.match(brief,/2 package\(s\)/);
 assert.equal(build.mass.kg,.2);assert.equal(mtbLineTotal({price:null,quantity:2}),null);assert.equal(mtbLineTotal({price:50,quantity:21}),50);
 const context=mtbQuoteContext(build),text=quoteText({name:'Test Rider',email:'test@example.com',province:'Gauteng',delivery:'collect'},context);
 assert.match(text,/2 × light-pair/);assert.match(text,/3 × bundle/);assert.equal(context.knownSubtotal,400);
});

test('changed SKU interfaces need exact facts and multi-source variants need complete accounting',()=>{
 const data=fixture(),tire=get(data,'tire');
 data.options.tire={fields:[{key:'size',values:['2.3','2.4']}],reference:{size:'2.3'},skus:[{id:'t23',values:{size:'2.3'},title:'2.3',price:100,url:source+'t23'},{id:'t24',values:{size:'2.4'},title:'2.4',price:120,url:source+'t24'}],checkedAt:'2026-10-19'};
 const raw={choices:{tire:{size:'2.4'}}};let changed=configureMtbProduct(tire,raw,data);
 assert.equal(changed.price,120);assert.equal(changed.weight,null);assert.deepEqual(changed.mtb,{});
 const facts={wheelSize:'29',diameterMm:622,widthInches:2.4,tubelessReady:true};data.options.tire.skus[1].facts={mtb:facts,mtbEvidence:evidence(facts),weight:.75,weightBasis:'Exact 2.4 source mass'};
 changed=configureMtbProduct(tire,raw,data);assert.equal(changed.mtb.widthInches,2.4);assert.equal(changed.weight,.75);
 const bundle=get(data,'bundle');bundle.sources.push({...bundle.sources[0],unitPrice:20});data.options.bundle={fields:[{key:'size',values:['one','two']}],reference:{size:'one'},skus:[{values:{size:'two'},title:'two',price:180,url:source+'new-bundle'}]};
 assert.equal(configureMtbProduct(bundle,{choices:{bundle:{size:'two'}}},data).price,null);
});

test('private frame requests stay unpriced and are excluded from isolated canonical share URLs',()=>{
 const data=fixture(),plan={selection,requests:{frame:{size:'Private custom sizing',colour:'Private colour'}},tireSetup:'tubeless',extras:['light-pair'],extraQuantities:{'light-pair':2}};
 const build=evaluateMtbBuild(data,plan);assert.equal(build.parts.frame.price,null);assert.equal(build.parts.frame.weight,null);assert.ok(build.parts.frame.sources.every(s=>s.referenceOnly));
 assert.equal(check(build,'rear-axle').status,'review');assert.match(mtbBriefText(build),/Private custom sizing/);
 const url=mtbSharedUrl(plan,'https://example.com/RCS-Bicycle/index.html?email=private',data);
 assert.ok(url.includes('/mountain.html#mtb=1'));assert.ok(!decodeURIComponent(url).includes('Private custom sizing'));assert.ok(!url.includes('email='));
 const parsed=parseMtbShared(new URL(url).hash,data);assert.equal(parsed.status,'valid');assert.equal(parsed.plan.tireSetup,'tubeless');assert.deepEqual(parsed.plan.extraQuantities,{'light-pair':2});assert.deepEqual(parsed.plan.requests,{});
 const raw=shareableMtbPlan(plan,data);
 for(const bad of [{...raw,price:1},{...raw,requests:{frame:{size:'private'}}},{...raw,selection:{frame:'whole-bike'}},{...raw,extraQuantities:{'light-pair':21}}])assert.equal(parseMtbShared('#mtb=1&plan='+encodeURIComponent(JSON.stringify(bad)),data).status,'invalid');
 assert.equal(parseMtbShared(new URL(url).hash+'&mtb=1',data).status,'invalid');
});

test('unconfirmed chain inclusion and incompatible tubeless choices remain actionable',()=>{
 const data=fixture();delete get(data,'drive').mtb.includedCategories;
 const noChain=evaluateMtbBuild(data,{selection});assert.equal(noChain.parts.chain.price,null);assert.ok(noChain.missing.includes('chain'));assert.equal(noChain.price,null);
 setFacts(data,'tire',{tubelessReady:false});
 const tubeOnly=evaluateMtbBuild(data,{selection,chain:'chain',tireSetup:'tubeless'});
 assert.equal(check(tubeOnly,'front-tire-system').status,'conflict');assert.equal(check(tubeOnly,'rear-tire-system').status,'conflict');
 assert.equal(check(evaluateMtbBuild(data,{selection,chain:'chain',tireSetup:'tubes'}),'front-tire-system').status,'review');
});

test('selected upgrade packages and excluded dropper remotes do not become complete bikes',()=>{
 const data=fixture();get(data,'drive').missingEssentials=['Crankset and chainring','Chain'];
 setFacts(data,'post',{remoteIncluded:false});
 const build=evaluateMtbBuild(data,{selection,chain:'chain'});
 assert.equal(build.selectionComplete,true);assert.equal(build.complete,false);assert.deepEqual(build.missing,[]);
 assert.ok(build.unresolvedEssentials.some(v=>v.includes('Crankset and chainring')));
 assert.ok(build.unresolvedEssentials.some(v=>v.includes('remote/cable')));
 assert.ok(build.unresolvedEssentials.some(v=>v.endsWith('Chain')),'a missing package line is not silently removed without exact package reconciliation');
 assert.match(mtbBriefText(build),/Unresolved essential: drive: Crankset/);
});

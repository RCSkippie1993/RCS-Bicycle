import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import data from './mtb-data.json' with {type:'json'};
import {catalog,defaults,evaluate} from './catalog.js';
import {productRecords} from './product-records.js';
import {configureMtbProduct,evaluateMtbBuild,normalizeMtbPlan,mtbQuoteContext,mtbSharedUrl,parseMtbShared} from './mtb-build.js';
import {mtbProducts,newMtbFilters,mtbMassProfile} from './mtb-ui.js';
import {quoteText} from './quote.js';
const product=id=>{const p=data.records.find(r=>r.product.id===id)?.product;assert.ok(p,id);return p;};

test('MTB references retain real local photos, exact source-package prices and reviewed field-level evidence',()=>{
 assert.ok(data.records.length>=120);
 assert.equal(new Set(data.records.map(r=>r.product.id)).size,data.records.length);
 for(const {category,product:p}of data.records){
  assert.match(p.id,/^mtb-/);assert.equal(p.verification.status,'listing-reviewed');assert.equal(p.verification.reviewedAt,data.reviewedAt);
  assert.ok(category&&p.brand&&p.name&&p.priceBasis&&p.fitNote&&p.photoCaption);
  assert.ok(p.sources.length);assert.ok(!productRecords.some(r=>r.product.id===p.id),'road collection must remain separate');
  for(const s of p.sources){assert.equal(s.checkedAt,data.reviewedAt);assert.equal(s.currency,'ZAR');assert.ok(s.quantity>0&&s.variant);assert.match(s.url,/^https:\/\//);if(!s.referenceOnly)assert.ok(s.unitPrice>0);}
  if(p.price!==null)assert.ok(Math.abs(p.price-p.sources.filter(s=>!s.referenceOnly).reduce((n,s)=>n+s.quantity*s.unitPrice,0))<.005,p.id);
  for(const [key,value]of Object.entries(p.mtb||{}))if(value!==null&&value!==undefined){assert.match(p.mtbEvidence[key].url,/^https:\/\//,p.id+' '+key);assert.ok(p.mtbEvidence[key].excerpt,p.id+' '+key);}
  assert.match(p.photoSource.remoteUrl,/^https:\/\//);assert.match(p.image,/^products\/mtb-[a-z0-9.-]+\.(?:jpg|png|webp)$/);
  const bytes=readFileSync(new URL('../public/'+p.image,import.meta.url));assert.ok(bytes.length>500);assert.ok(bytes[0]===0xff||bytes[0]===0x89||bytes.toString('ascii',0,4)==='RIFF',p.id);
  if(Number.isFinite(p.weight))assert.ok(p.weight>0&&p.weightBasis,p.id);
 }
});
test('every MTB SKU keeps exact package arithmetic; drive and chain changes preserve explicitly researched invariant standards',()=>{
 for(const[id,spec]of Object.entries(data.options)){
  const p=product(id),reference=spec.skus.find(s=>spec.fields.every(f=>s.values[f.key]===spec.reference[f.key]));assert.ok(reference,id);assert.equal(reference.price,p.price,id);
  for(const sku of spec.skus){
   const selected=configureMtbProduct(p,{choices:{[id]:sku.values}},data);assert.equal(selected.price,sku.price,id+' '+sku.title);
   assert.ok(Math.abs(selected.sources.filter(s=>!s.referenceOnly).reduce((n,s)=>n+s.quantity*s.unitPrice,0)-selected.price)<.005,id);
   if(id.startsWith('mtb-drives-')){
    for(const k of ['driveFamily','compatibleDriveFamilies','includedCategories','requiredFreehub','requiresUDH'])if(p.mtb[k]!==undefined)assert.deepEqual(selected.mtb[k],p.mtb[k],id+' '+k);
    if(p.missingEssentials)assert.deepEqual(selected.missingEssentials,p.missingEssentials,id);
   }
  }
 }
});
test('front and rear MTB tyres are independent single physical purchases and road defaults stay unchanged',()=>{
 const tyres=data.records.filter(r=>r.category==='tires').map(r=>r.product);assert.ok(tyres.length>=20);
 assert.ok(tyres.every(p=>p.sources.length===1&&p.sources[0].quantity===1));
 const [a,b]=tyres,build=evaluateMtbBuild(data,{selection:{frontTire:a.id,rearTire:b.id}});assert.equal(build.knownSubtotal,a.price+b.price);
 const same=evaluateMtbBuild(data,{selection:{frontTire:a.id,rearTire:a.id}});assert.equal(same.knownSubtotal,2*a.price);
 assert.deepEqual(normalizeMtbPlan({selection:{frame:defaults.frame}},data).selection,{});assert.equal(evaluate(defaults).knownSubtotal,51610);assert.equal(productRecords.length,447);assert.equal(catalog.frame.items.length,44);
});
test('actual frame modules price included forks/shocks/posts once and replacement purchases reconcile without fake credits',()=>{
 const frame=product('mtb-frames-specialized-epic8-module'),build=evaluateMtbBuild(data,{selection:{frame:frame.id}});
 assert.equal(build.knownSubtotal,frame.price);for(const key of ['fork','shock','seatpost']){assert.equal(build.parts[key].price,0);assert.equal(build.parts[key].includedInPackage,true);}
 const fork=product('mtb-suspension-pike-select-29-140'),replacement=evaluateMtbBuild(data,{selection:{frame:frame.id,fork:fork.id}});
 assert.equal(replacement.knownSubtotal,frame.price+fork.price);assert.ok(replacement.checks.some(c=>c.id==='included-fork-replacement'&&c.status==='conflict'));
 const upgrade=product('mtb-drives-deore-m6100-kit');assert.ok(upgrade.missingEssentials.includes('crankset'));
 const partial=evaluateMtbBuild(data,{selection:{drivetrain:upgrade.id}});assert.equal(partial.complete,false);assert.ok(partial.unresolvedEssentials.some(s=>s.includes('crankset')));
});
test('actual freehub and chain families detect conflicts even after exact option changes',()=>{
 const gx=product('mtb-drives-gx-transmission-drive'),wheel=data.records.find(r=>r.category==='wheels'&&r.product.mtb.freehub==='microspline').product;
 const chain=product('mtb-drives-chain-gx-eagle'),build=evaluateMtbBuild(data,{selection:{wheels:wheel.id,drivetrain:gx.id},chain:chain.id});
 assert.ok(build.checks.some(c=>c.id==='freehub'&&c.status==='conflict'));assert.ok(build.checks.some(c=>c.id==='chain-standard'&&c.status==='conflict'));
 const id='mtb-drives-xt-m8200-di2-drive',spec=data.options[id],sku=spec.skus.find(s=>s.values.crankLength==='165mm');
 const changed=evaluateMtbBuild(data,{selection:{drivetrain:id},choices:{[id]:sku.values}});assert.equal(changed.parts.chain.price,0);assert.equal(changed.parts.chain.includedInPackage,true);
});
test('an explicit maximum fork travel is enforced without inventing a range around a recommendation',()=>{
 const build=evaluateMtbBuild(data,{selection:{frame:'mtb-frames-trek-procaliber-isobow-gen3',fork:'mtb-suspension-zeb-ultimate-29-170'}});
 assert.ok(build.checks.some(c=>c.id==='fork-travel'&&c.status==='conflict'&&c.detail.includes('maximum is 120 mm')));
});
test('MTB quote and sharing retain variants/quantities while private fit requests and road state stay out of links',()=>{
 const frame=product('mtb-frames-trek-procaliber-isobow-gen3'),extra=data.records.find(r=>r.category==='extras').product;
 const plan={selection:{frame:frame.id},requests:{[frame.id]:{size:'Private rider fit request'}},extras:[extra.id],extraQuantities:{[extra.id]:2}};
 const link=mtbSharedUrl(plan,'https://example.com/RCS-Bicycle/mountain.html?private=secret',data),parsed=parseMtbShared(new URL(link).hash,data);assert.equal(parsed.status,'valid');assert.ok(!decodeURIComponent(link).includes('Private'));assert.ok(!link.includes('secret'));assert.equal(parsed.plan.extraQuantities[extra.id],2);
 const build=evaluateMtbBuild(data,plan),context={...mtbQuoteContext(build,link),checkedDate:'19 Oct 2026'};assert.match(context.sourceText,/Private rider fit request/);assert.equal(context.items.find(p=>p.name===extra.name).quantity,2);
 assert.match(quoteText({name:'Rider',email:'rider@example.com',province:'Gauteng',delivery:'collect'},context),/Reference prices checked: 19 Oct 2026/);
});
test('MTB filters sort prices and intersect source wheel standards; mass scales never score unverified weights',()=>{
 const filters=newMtbFilters(),all=mtbProducts(data,'wheels',filters,{});assert.ok(all.length>=10);assert.ok(all.every((r,i)=>!i||r.product.price>=all[i-1].product.price));
 filters.facets.freehub=['microspline'];const rows=mtbProducts(data,'wheels',filters,{});assert.ok(rows.length);assert.ok(rows.every(r=>r.product.mtb.freehub==='microspline'));
 filters.query='nothing-will-match-xyz';assert.equal(mtbProducts(data,'wheels',filters,{}).length,0);
 assert.equal(mtbMassProfile({weight:1.5,sources:[]},'wheels').score,null);assert.equal(mtbMassProfile({weight:null,weightBasis:'Unknown',sources:[{}]},'wheels').score,null);
});
test('complete-bike source options affect their enquiry only and never enter component subtotals',()=>{
 const reference=data.records.find(r=>r.category==='bike').product,p={...reference,id:'fixture-complete-bike'},sku={id:'fixture-alternative',values:{size:'Alternative'},price:reference.price+100,sourceUnitPrice:reference.price+100,url:'https://supplier.example/bike?variant=alternative',title:'Alternative',listedAvailable:true};
 const fixture={records:[{category:'bike',product:p}],options:{[p.id]:{fields:[{key:'size',values:['Reference','Alternative']}],reference:{size:'Reference'},checkedAt:data.reviewedAt,skus:[{...sku,id:'fixture-reference',values:{size:'Reference'},price:p.price,sourceUnitPrice:p.price},sku]}}};
 const plan={choices:{[p.id]:sku.values}};const configured=configureMtbProduct(p,plan,fixture);assert.equal(configured.price,sku.price);assert.equal(configured.sources[0].url,sku.url);
 const build=evaluateMtbBuild(fixture,plan);assert.equal(build.knownSubtotal,0);assert.deepEqual(build.parts,{});
 assert.deepEqual(normalizeMtbPlan({selection:{frame:p.id}},fixture).selection,{});
});

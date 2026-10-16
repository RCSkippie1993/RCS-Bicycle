import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import expansion from './expanded-data.json' with {type:'json'};
import {catalog,defaults,chainOffers,extraOffers,optionRegister} from './catalog.js';
import {productRecords,findProduct} from './product-records.js';
import {configureProduct,guidedBuild,normalizePlan} from './build-plan.js';
import {resolvePackages,chainCompatibility,matchingBrakePackage} from './product-packages.js';
import {inspectParts} from './compatibility.js';
import {scienceProfile,documentedMass} from './build-science.js';
import {addToBox,summarizeBox} from './build-box.js';

const product=id=>{const row=findProduct(id);assert.ok(row,id+' must remain discoverable');return row.product;};
const sourceTotal=p=>p.sources.filter(s=>!s.referenceOnly).reduce((n,s)=>n+s.unitPrice*s.quantity,0);
const configured=(id,choices)=>configureProduct(product(id),normalizePlan({choices:{[id]:choices}}));

test('expanded references have unique identities, reviewed SA source packages and readable local product photos',()=>{
 assert.ok(expansion.records.length>0);
 assert.equal(new Set(productRecords.map(r=>r.product.id)).size,productRecords.length);
 for(const {category,product:p} of expansion.records){
  assert.equal(findProduct(p.id).category,category);
  assert.equal(p.verification.status,'listing-reviewed');
  assert.equal(p.verification.reviewedAt,expansion.reviewedAt);
  assert.ok(p.priceBasis&&p.fitNote&&p.photoCaption,p.id);
  assert.ok(p.sources.length>0,p.id);
  for(const s of p.sources){
   assert.equal(s.currency,'ZAR',p.id);assert.equal(s.checkedAt,expansion.reviewedAt,p.id);
   assert.ok(s.quantity>0&&s.variant,p.id);assert.match(s.url,/^https:\/\//,p.id);
   if(!s.referenceOnly)assert.ok(Number.isFinite(s.unitPrice)&&s.unitPrice>0,p.id);
  }
  if(Number.isFinite(p.price))assert.equal(p.price,sourceTotal(p),p.id);
  else assert.equal(p.price,null,p.id+' must not coerce an unknown price to zero');
  assert.match(p.image,/^products\/exp-[a-z0-9-]+\.(?:jpg|png|webp)$/i,p.id);
  assert.match(p.photoSource.remoteUrl,/^https:\/\//,p.id);
  assert.match(p.photoSource.downloadedUrl,/^https:\/\//,p.id);
  const bytes=readFileSync(new URL('../public/'+p.image,import.meta.url));
  assert.ok(bytes.length>500,p.id);
  assert.ok(bytes[0]===0xff||bytes[0]===0x89||bytes.toString('ascii',0,4)==='RIFF',p.id);
  if(Number.isFinite(p.weight))assert.ok(p.weight>0&&p.weightBasis,p.id);
 }
});

test('controls are included only in their confirmed exact SRAM parent package; Shimano uncertainty stays unpriced',()=>{
 const drive=product('exp-drivetrains-force-e1'),brakes=product('exp-drivetrains-force-e1-brake-check');
 const exact=resolvePackages({drivetrain:drive,brakes});
 assert.equal(exact.brakes.price,0);assert.equal(exact.brakes.includedInSelectedPackage,true);
 assert.equal(exact.drivetrain.price,drive.price);assert.equal(brakes.price,null,'catalog check must remain unpriced');
 const other=resolvePackages({drivetrain:product('exp-drivetrains-force-d2-pm'),brakes});
 assert.equal(other.brakes.price,null);assert.notEqual(other.brakes.includedInSelectedPackage,true);
 assert.ok(inspectParts(other).checks.some(c=>c.id==='duplicated-controls'&&c.status==='conflict'));
 const shimano=resolvePackages({drivetrain:product('exp-drivetrains-ultegra-r8100'),brakes:product('exp-drivetrains-ultegra-r8100-brake-check')});
 assert.equal(shimano.brakes.price,null);assert.notEqual(shimano.brakes.includedInSelectedPackage,true);
 const partial=guidedBuild({...defaults,drivetrain:drive.id,brakes:brakes.id},normalizePlan({chosen:['drivetrain','brakes']}));
 assert.equal(partial.knownSubtotal,drive.price);assert.equal(partial.unpriced.length,0);
});

test('matching controls prefers the exact package over an earlier same-family check',()=>{
 for(const id of ['exp-drivetrains-force-e1','exp-drivetrains-red-axs-karoo','exp-drivetrains-ultegra-r8100']){
  const drive=product(id),brake=matchingBrakePackage(drive,catalog.brakes.items);
  assert.ok(brake.packageIncludedIn.includes(drive.id),id);
 }
});

test('installed chains respect both drivetrain family and speed; spares do not redefine the installed system',()=>{
 const shimano=product('105-mechanical'),sram=product('exp-drivetrains-force-e1');
 const flattop=product('exp-chains-force-e1'),hg=product('chain-m7100-116'),eleven=product('exp-chains-hg701-11');
 assert.equal(chainCompatibility(shimano,flattop).status,'conflict');
 assert.equal(chainCompatibility(sram,hg).status,'conflict');
 assert.equal(chainCompatibility(shimano,eleven).status,'conflict');
 assert.equal(chainCompatibility(sram,flattop).status,'review','matching family is not a whole-build certificate');
 const installed=guidedBuild(defaults,normalizePlan({chosen:['drivetrain'],chain:flattop.id}));
 assert.ok(installed.compatibility.checks.some(c=>c.id==='chain-system'&&c.status==='conflict'));
 const spare=guidedBuild(defaults,normalizePlan({chosen:['drivetrain'],chain:flattop.id,chainMode:'spare'}));
 assert.ok(!spare.compatibility.checks.some(c=>c.id==='chain-system'));
 assert.equal(documentedMass(spare).kg,0);
});

test('replacement chains do not deduct an invented split credit from a complete groupset',()=>{
 const drive=product('exp-drivetrains-force-e1'),chain=product('exp-chains-force-e1');
 const build=guidedBuild({...defaults,drivetrain:drive.id},normalizePlan({chosen:['drivetrain'],chain:chain.id}));
 assert.equal(build.parts.drivetrain.price,drive.price);
 assert.equal(build.knownSubtotal,drive.price+chain.price);
 assert.match(build.additionalLines[0].role,/packaged chain retained/i);
 assert.equal(build.additionalLines.filter(p=>p.id===chain.id).length,1);
});

test('chain length and accessory package choices update exact prices, source variants and build totals',()=>{
 const chainId='exp-chains-hg701-11',tapeId='exp-extras-muc-off-tubeless-rim-tape';
 const chain=configured(chainId,{size:'126 Link'}),tape=configured(tapeId,{length:'50m',size:'21mm'});
 assert.equal(chain.price,690);assert.equal(sourceTotal(chain),690);assert.match(chain.sources[0].variant,/126 Link/);
 assert.equal(tape.price,1290);assert.match(tape.name,/50m \/ 21mm/);assert.doesNotMatch(tape.name,/10 m/);assert.equal(sourceTotal(tape),1290);assert.match(tape.sources[0].variant,/50m.*21mm/);
 assert.equal(chain.weight,null);assert.equal(tape.weight,null);
 const plan=normalizePlan({chosen:[],chain:chainId,chainMode:'spare',extras:[tapeId],choices:{[chainId]:{size:'126 Link'},[tapeId]:{length:'50m',size:'21mm'}}});
 const build=guidedBuild(defaults,plan);
 assert.equal(build.knownSubtotal,1980);
 assert.equal(build.additionalLines.find(p=>p.id===chainId).price,690);
 assert.equal(build.additionalLines.find(p=>p.id===tapeId).price,1290);
 const unavailableCombination=configured(tapeId,{length:'50m',size:'25mm'});
 assert.equal(unavailableCombination.price,null);assert.ok(unavailableCombination.sources.every(s=>s.referenceOnly));
});

test('priced bar and stem combinations keep both exact source lines without summing bar-only mass as a cockpit',()=>{
 const cockpits=expansion.records.filter(r=>r.category==='cockpit'&&optionRegister[r.product.id]);
 assert.ok(cockpits.length>0);
 for(const {product:p} of cockpits){
  const spec=optionRegister[p.id];
  for(const sku of spec.skus){
   const selected=configured(p.id,sku.values);
   assert.equal(selected.price,sku.price,p.id+' '+sku.title);
   assert.equal(sourceTotal(selected),sku.price,p.id+' '+sku.title);
   assert.equal(selected.sources[0].url,sku.url,p.id);
   if(sku.stemUrl){assert.equal(selected.sources[1].url,sku.stemUrl,p.id);assert.equal(selected.sources[1].unitPrice,sku.stemPrice,p.id);}
   assert.equal(documentedMass({parts:{cockpit:selected}}).kg,0,p.id);
  }
 }
 const narrow=configured('exp-cockpits-easton-ea70-handlebars',{size:'38cm',stemLength:'50mm'});
 assert.equal(narrow.price,3340);assert.equal(narrow.weight,null);
 assert.equal(scienceProfile(narrow,'cockpit')[0].actual,'Unverified','42 cm handlebar measurement must not follow a different width');
 const referenceWidth=configured('exp-cockpits-easton-ea70-handlebars',{size:'42cm',stemLength:'80mm'});
 assert.equal(scienceProfile(referenceWidth,'cockpit')[0].actual,'0.280 kg');
 assert.equal(scienceProfile(referenceWidth,'cockpit')[0].label,'Handlebar only');
});

test('quote-only LOOK frames stay unpriced and included cockpits apply only to their exact frame package',()=>{
 const frame=product('exp-frames-look795-blade-rs'),cockpit=product('exp-frames-look795-blade-rs-included-cockpit');
 assert.equal(frame.price,null);assert.equal(frame.weight,null);assert.equal(cockpit.price,null);
 const exact=resolvePackages({frame,cockpit});
 assert.equal(exact.cockpit.price,0);assert.equal(exact.frame.price,null);
 const build=guidedBuild({...defaults,frame:frame.id,cockpit:cockpit.id},normalizePlan({chosen:['frame','cockpit']}));
 assert.equal(build.knownSubtotal,0);assert.equal(build.price,null);assert.equal(build.unpriced.length,1);
 assert.equal(build.unpriced[0].id,frame.id);
 const other=resolvePackages({frame:product('allez-sprint'),cockpit});
 assert.equal(other.cockpit.price,null);
 assert.ok(inspectParts({frame,cockpit:product('pro-plt')}).checks.some(c=>c.status==='conflict'));
});

test('collection supplements remain saved references without becoming bulk core selections',()=>{
 const chain=chainOffers.find(p=>p.id==='exp-chains-hg701-11'),extra=extraOffers.find(p=>p.id==='exp-extras-magene-at1200-smart-headlight');
 assert.ok(chain&&extra);
 const supplements=addToBox(addToBox([],chain.id),extra.id),only=summarizeBox(supplements);
 assert.equal(only.canApply,false);assert.deepEqual(only.selection,{});
 const mixed=summarizeBox(addToBox(supplements,'allez-sprint'));
 assert.equal(mixed.canApply,true);assert.deepEqual(mixed.selection,{frame:'allez-sprint'});
 assert.equal(mixed.knownSubtotal,product('allez-sprint').price+chain.price+extra.price);
 assert.equal(mixed.rows.length,3);
});

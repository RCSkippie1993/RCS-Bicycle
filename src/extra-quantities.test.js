import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,money} from './catalog.js';
import {coreSteps,extraOffers,normalizePlan,extraQuantity,lineTotal,maxExtraQuantity,guidedBuild,planText,shareablePlan,validSharedPlan} from './build-plan.js';
import {documentedMass} from './build-science.js';
import {sharedBuildUrl,parseSharedBuild} from './build-share.js';

const light='light-femto-pair',rotor='exp-chains-rt70',tape='exp-extras-muc-off-tubeless-rim-tape';
const offer=id=>extraOffers.find(p=>p.id===id);

test('extra quantities accept only selected catalog IDs and integers 2–20',()=>{
 assert.equal(maxExtraQuantity,20);
 for(const value of [undefined,null,'2',true,0,-1,1,1.5,21,Infinity,NaN]){
  const plan=normalizePlan({extras:[light],extraQuantities:{[light]:value}});
  assert.deepEqual(plan.extraQuantities,{});
  assert.equal(extraQuantity(plan,light),1);
 }
 const plan=normalizePlan({extras:[light,light],extraQuantities:{[light]:20,[rotor]:2,bogus:3}});
 assert.deepEqual(plan.extras,[light]);
 assert.deepEqual(plan.extraQuantities,{[light]:20});
 assert.deepEqual(normalizePlan({...plan,extras:[]}).extraQuantities,{});
 assert.equal(lineTotal({price:50,quantity:2}),100);
 assert.equal(lineTotal({price:50,quantity:21}),50);
 assert.equal(lineTotal({price:0,quantity:2}),0);
 assert.equal(lineTotal({price:null,quantity:2}),null);
});

test('extras use per-package prices, including exact SKU changes, and unknown packages stay unpriced',()=>{
 const quantities={[rotor]:2,[light]:3};
 const build=guidedBuild(defaults,{chosen:coreSteps,extras:[rotor,light],extraQuantities:quantities,choices:{[rotor]:{size:'140mm'}}});
 const rotorLine=build.additionalLines.find(p=>p.id===rotor),lightLine=build.additionalLines.find(p=>p.id===light);
 assert.equal(rotorLine.quantity,2);
 assert.equal(rotorLine.variant,'140mm');
 assert.equal(rotorLine.sources[0].unitPrice,rotorLine.price);
 assert.equal(lightLine.price,offer(light).price);
 assert.equal(lightLine.sources[0].quantity,1);
 assert.equal(build.knownSubtotal,guidedBuild(defaults,{chosen:coreSteps}).knownSubtotal+2*rotorLine.price+3*lightLine.price);
 const unknown=guidedBuild(defaults,{extras:[tape,light],extraQuantities:{[tape]:2,[light]:2},choices:{[tape]:{length:'50m',size:'25mm'}}});
 assert.equal(unknown.additionalLines.find(p=>p.id===tape).price,null);
 assert.equal(unknown.price,null);
 assert.equal(unknown.unpriced.length,1);
 assert.equal(unknown.knownSubtotal,2*offer(light).price);
});

test('sourcing exports multiply package and internal source quantities exactly once',()=>{
 const build=guidedBuild(defaults,{extras:[light],extraQuantities:{[light]:2}}),line=build.additionalLines[0];
 const text=planText(build);
 assert.ok(text.includes(`2 package(s) × ${money(line.price)} = ${money(2*line.price)}`));
 assert.ok(text.includes(`2 × ${money(line.sources[0].unitPrice)}`));
 assert.equal(build.knownSubtotal,2*offer(light).price,'a source-listed light pair is one package, not two separately charged products');
 const bundled={...line,quantity:3,price:40,sources:[{...line.sources[0],quantity:2,unitPrice:20}]};
 const bundleText=planText({...build,additionalLines:[bundled]});
 assert.ok(bundleText.includes(`3 package(s) × ${money(40)} = ${money(120)}`));
 assert.ok(bundleText.includes(`6 × ${money(20)}`));
});

test('legacy build=2 URLs remain valid and quantity shares are canonical',()=>{
 const legacy={version:1,chosen:['frame'],choices:{},chain:'included',chainMode:'replacement',extras:[light]};
 assert.equal(validSharedPlan(legacy),true);
 assert.deepEqual(shareablePlan(legacy),legacy);
 const legacyUrl=sharedBuildUrl(defaults,'allround',{},'https://example.com/RCS-Bicycle/',legacy);
 assert.equal(parseSharedBuild(new URL(legacyUrl).hash).status,'valid');
 const plan=normalizePlan({...legacy,extraQuantities:{[light]:2}});
 const url=sharedBuildUrl(defaults,'allround',{},'https://example.com/RCS-Bicycle/',plan),parsed=parseSharedBuild(new URL(url).hash);
 assert.equal(parsed.status,'valid');
 assert.deepEqual(parsed.plan.extraQuantities,{[light]:2});
 for(const quantities of [{},null,[],{[light]:1},{[light]:'2'},{[light]:21},{[rotor]:2},{bogus:2}])assert.equal(validSharedPlan({...legacy,extraQuantities:quantities}),false);
});

test('only supported sourcing-package masses scale, while spares and unresolved masses remain excluded',()=>{
 const pump='exp-extras-syncros-boundary-1-5hp-mini-pump';
 const build=guidedBuild(defaults,{extras:[light,pump],extraQuantities:{[light]:2,[pump]:3}}),mass=documentedMass(build);
 assert.equal(mass.kg,2*offer(light).weight);
 assert.equal(mass.rows.length,1);
 assert.equal(mass.rows[0].quantity,2);
 assert.match(mass.rows[0].basis,/not necessarily all installed/);
 assert.match(mass.scope,/sourcing-package mass/);
 assert.equal(mass.complete,false);
});

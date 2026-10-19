import test from 'node:test';
import assert from 'node:assert/strict';
import data from './mtb-data.json' with {type:'json'};
import {evaluateMtbBuild,configureMtbProduct,mtbSharedUrl,parseMtbShared} from './mtb-build.js';
import {mtbCandidateImpact,mtbSourceAvailable,normalizeMtbPreferences,mtbBuildProgress} from './mtb-discovery.js';
import {mtbProducts,newMtbFilters,mtbComparisonMarkup} from './mtb-ui.js';
const id={frame:'mtb-frames-trek-procaliber-isobow-gen3',fork:'mtb-suspension-sid-ultimate-rd2-29-120',longFork:'mtb-suspension-zeb-ultimate-29-170',module:'mtb-frames-specialized-epic8-module',wheel:'mtb-wheels-fulcrum-redzone3',saddle:'mtb-contact-giant-romero',drive:'mtb-drives-nx-s-eagle-kit',tType:'mtb-drives-gx-transmission-drive',chain:'mtb-more-sram-nx-eagle-126-link-chain'};
const p=id=>data.records.find(r=>r.product.id===id).product;

test('candidate previews retain the original plan and isolate conflicts to the component being considered',()=>{
 const plan={selection:{frame:id.frame,fork:id.longFork,saddle:id.saddle}},before=JSON.stringify(plan);
 assert.ok(mtbCandidateImpact(data,plan,'fork',id.longFork).conflicts.some(c=>c.id==='fork-travel'));
 assert.equal(mtbCandidateImpact(data,plan,'fork',id.fork).conflicts.length,0);
 assert.equal(mtbCandidateImpact(data,plan,'saddle',id.saddle).conflicts.length,0,'an unrelated fork conflict must not hide saddles');
 assert.ok(mtbCandidateImpact(data,{selection:{wheels:'mtb-wheels-lyne-pulse28'}},'frame',id.module).conflicts.some(c=>c.id==='front-axle'),'a supplied fork changes with its parent frame');
 assert.ok(!mtbCandidateImpact(data,{selection:{wheels:'mtb-wheels-lyne-pulse28',fork:id.fork}},'frame','mtb-more-norco-optic-carbon-frame-set').conflicts.some(c=>c.id==='front-axle'),'unrelated separately selected fork conflicts must not hide frames');
 assert.equal(JSON.stringify(plan),before);assert.equal(mtbCandidateImpact(data,plan,'frame',id.saddle),null);
 assert.equal(mtbCandidateImpact(data,plan,'frame',data.records.find(r=>r.category==='bike').product.id),null);
});
test('candidate package previews add a full replacement purchase without subtracting an invented inclusion credit',()=>{
 const impact=mtbCandidateImpact(data,{selection:{frame:id.module}},'fork',id.fork);
 assert.equal(impact.knownSubtotal,p(id.module).price+p(id.fork).price);assert.equal(impact.priceDelta,p(id.fork).price);
 assert.ok(impact.conflicts.some(c=>c.id==='included-fork-replacement'));assert.equal(impact.massDelta,null);
 const requested=mtbCandidateImpact(data,{selection:{frame:id.frame},requests:{[id.frame]:{size:'Private fitter request'}}},'fork',id.fork);assert.equal(requested.priceDelta,null,'a subtotal with unpriced packages cannot be an exact total delta');
});
test('source availability, price bounds and conflict filters intersect while unknown fit remains visible',()=>{
 const f={...newMtbFilters(),minPrice:10000,maxPrice:25000,availableOnly:true};
 const rows=mtbProducts(data,'fork',f,{selection:{frame:id.frame}});assert.ok(rows.length);
 assert.ok(rows.every(r=>r.product.price>=10000&&r.product.price<=25000&&mtbSourceAvailable(r.product)));
 const filtered=mtbProducts(data,'fork',{...f,hideConflicts:true},{selection:{frame:id.frame}});assert.ok(filtered.length<rows.length);assert.ok(filtered.every(r=>!mtbCandidateImpact(data,{selection:{frame:id.frame}},'fork',r.product.id).conflicts.length));
 const empty=mtbProducts(data,'fork',{...f,hideConflicts:true},{});assert.equal(empty.length,rows.length,'missing frame facts are reviews, not a compatibility claim or exclusion');
 const mixed={sources:[{listedAvailable:true},{listedAvailable:false}]};assert.equal(mtbSourceAvailable(mixed),false);assert.equal(mtbSourceAvailable({sources:[]}),false);
});
test('private budget is bounded, reports an incomplete subtotal honestly and does not enter shared plans',()=>{
 assert.equal(normalizeMtbPreferences({budget:Infinity}).budget,null);assert.equal(normalizeMtbPreferences({budget:'90000'}).budget,null);assert.equal(normalizeMtbPreferences({budget:2000001}).budget,null);
 const build=evaluateMtbBuild(data,{selection:{frame:id.frame}}),progress=mtbBuildProgress(build,20000);assert.equal(progress.remaining,20000-p(id.frame).price);assert.equal(progress.next,'fork');assert.equal(progress.total,11);assert.equal(progress.configured,1);assert.match(progress.budgetScope,/Partial subtotal/);
 const shared=mtbSharedUrl({...build.plan,budget:123456,contact:{email:'private@example.com'}},'https://example.co.za/mountain.html',data);assert.ok(!decodeURIComponent(shared).includes('123456'));assert.ok(!decodeURIComponent(shared).includes('private@example.com'));assert.equal(parseMtbShared(new URL(shared).hash,data).status,'valid');
});
test('new exact dropper and wheel options change their documented interfaces, inclusions and prices',()=>{
 const post=p('mtb-more-lyne-contour-internal-dropper-post'),configured=configureMtbProduct(post,{choices:{[post.id]:{variant:'31.6 x 150mm / Under Bar'}}},data);
 assert.equal(configured.mtb.diameterMm,31.6);assert.equal(configured.mtb.travelMm,150);assert.equal(configured.mtb.remoteIncluded,true);assert.equal(configured.price,3950);assert.equal(configured.weight,null,'post-only mass must not become the post+lever package mass');
 const bare=configureMtbProduct(post,{choices:{[post.id]:{variant:'31.6 x 150mm / No Lever'}}},data);assert.equal(bare.mtb.remoteIncluded,false);assert.equal(bare.weight,.466);
 const wheel=p('mtb-more-zerotwo-29r-arch-bridge-carbon-mtb-wheelset'),xd=configureMtbProduct(wheel,{choices:{[wheel.id]:{variant:'Boost / XD'}}},data);assert.equal(xd.mtb.freehub,'xd');assert.equal(xd.mtb.frontAxle,undefined);assert.equal(xd.weight,null);
});
test('expanded chain families and reversible brake pairs retain their actual physical package scope',()=>{
 const classic=evaluateMtbBuild(data,{selection:{drivetrain:id.drive},chain:id.chain}),transmission=evaluateMtbBuild(data,{selection:{drivetrain:id.tType},chain:id.chain});assert.ok(!classic.checks.some(c=>c.id==='chain-standard'&&c.status==='conflict'));assert.ok(transmission.checks.some(c=>c.id==='chain-standard'&&c.status==='conflict'));
 for(const handle of ['sram-maven-base-brake-lever','sram-maven-silver-b1-brake-lever','sram-motive-bronze-disc-brake-no-rotor']){const brake=p('mtb-more-'+handle);assert.equal(brake.sources[0].quantity,2);assert.equal(brake.price,2*brake.sources[0].unitPrice);assert.equal(brake.weight,null);assert.match(brake.photoCaption,/Single brake/);}
 assert.match(p('mtb-more-norco-optic-a1-2019').photoScope,/Complete bike shown.*frame price only/);
 assert.ok(!data.records.some(r=>r.product.id==='mtb-more-titan-switch-comp-2021-framesets-small'));assert.ok(!data.records.some(r=>r.product.id==='mtb-more-lezyne-e-bike-macro-drive-1000-front-light'));
});
test('comparison details escape supplied product names and expose sourced conflicts without modifying the build',()=>{
 const hostile=structuredClone(data),record=hostile.records.find(r=>r.product.id===id.longFork);record.product.name='<img src=x onerror=alert(1)>';
 const build=evaluateMtbBuild(hostile,{selection:{frame:id.frame}}),before=JSON.stringify(build.plan),html=mtbComparisonMarkup(hostile,[id.longFork],build,'fork');assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;img/);assert.match(html,/Frame source maximum is 120 mm/);assert.match(html,/No.*approval|Unknown fit|Unknown specifications/);assert.equal(JSON.stringify(build.plan),before);
});

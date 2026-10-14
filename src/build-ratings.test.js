import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, catalog } from './catalog.js';
import { rateBuild, buildGoals, buildRatingText } from './build-ratings.js';
import { buildRatingPanel } from './build-ratings-ui.js';

test('the whole selected build has an explicit weighted goal match that changes with sourced wheel and tire inputs',()=>{
 const base=rateBuild(evaluate());assert.equal(base.overall,5.9);assert.equal(base.coverage,100);
 assert.equal(rateBuild(evaluate({wheels:'rd38'})).overall,7.7);
 assert.equal(rateBuild(evaluate({tires:'gp5000-str-32'}),'endurance').overall,6.6);
 assert.equal(rateBuild(evaluate({frame:'aethos-2-10r',wheels:'rd38'}),'climbing').overall,8.8);
 const panel=buildRatingPanel(evaluate());assert.match(panel,/5.9/);assert.match(panel,/Your selected build/);assert.match(panel,/Shimano 105 R7100/);
});
test('missing reviewed inputs stay provisional with honest weight coverage; absent categories do not count as complete',()=>{
 const base=evaluate(),race=rateBuild(base,'race');assert.equal(race.overall,null);assert.equal(race.provisional,7.3);assert.equal(race.coverage,70);
 assert.deepEqual(race.missing,['Rim depth profile']);
 const lacking={...base,parts:{...base.parts,frame:{...base.parts.frame,buildEvidence:null}}};
 assert.equal(rateBuild(lacking).overall,null);assert.equal(rateBuild(lacking).coverage,55);
 const partial={...base,parts:{frame:base.parts.frame,wheels:base.parts.wheels,tires:base.parts.tires}};
 assert.equal(rateBuild(partial).overall,null);assert.equal(rateBuild(partial).complete,false);
});
test('cost, bundle weights and unscored categories cannot fabricate an improvement in specification match',()=>{
 const base=evaluate(),before=rateBuild(base).overall;
 const changed={...base,parts:Object.fromEntries(Object.entries(base.parts).map(([key,p])=>[key,{...p,price:999999,...(key==='frame'?{weight:0.1}:{})}]))};
 assert.equal(rateBuild(changed).overall,before);
 assert.equal(rateBuild(evaluate({cockpit:'pro-vibe',saddle:'power-evo-pro-with-mirror'})).overall,before);
 assert.equal(rateBuild(evaluate({frame:'aethos-2-10r',wheels:'rd38'}),'climbing').overall,8.8);
 assert.equal(evaluate({frame:'aethos-2-10r'}).price,null);
});
test('detected control mismatches and documented missing essentials withhold the overall score',()=>{
 const bad=rateBuild(evaluate({drivetrain:'105-di2'}));assert.equal(bad.blocked,true);assert.equal(bad.overall,null);assert.equal(bad.provisional,null);
 const missing=rateBuild(evaluate({frame:'colnago-v4rs-frame'}));assert.equal(missing.blocked,true);assert.match(missing.issues.join(' '),/matching fork/);
 const matching=rateBuild(evaluate({drivetrain:'105-di2',brakes:'105-r7170'}));assert.equal(matching.overall,5.9);
 const fakeClearance=evaluate();fakeClearance.errors=['Tires exceed frame clearance.'];assert.equal(rateBuild(fakeClearance).overall,null);
});
test('all frame/goal choices produce bounded estimates with cited classification evidence and no measured-performance claim',()=>{
 for(const frame of catalog.frame.items){
  assert.ok(frame.buildEvidence.designFocus.excerpt.length>15);assert.match(frame.buildEvidence.designFocus.url,/^https:\/\//);
  for(const goal in buildGoals){const rating=rateBuild(evaluate({frame:frame.id,wheels:'rd38'}),goal);for(const score of [rating.overall,rating.provisional])assert.ok(score===null||(score>=1&&score<=10));}
 }
 assert.equal(rateBuild(evaluate(),'bad-goal').goal,'allround');
 const text=buildRatingText(evaluate(),'race');assert.match(text,/Provisional goal match/);assert.match(text,/70%/);assert.match(text,/not measured speed/);assert.match(text,/Evidence: https/);
});

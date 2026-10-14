import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog,defaults,evaluate,money} from './catalog.js';
test('unverified real references never produce invented prices, weight or ratings',()=>{
 const b=evaluate(defaults);assert.equal(Object.keys(b.parts).length,7);assert.equal(b.price,null);assert.equal(b.weight,null);assert.equal(b.compatibilityVerified,false);assert.deepEqual(b.errors,[]);
 assert.ok(Object.values(b.scores).every(score=>score===null));assert.equal(money(b.price),'Quote required');
 for(const group of Object.values(catalog)) for(const p of group.items){assert.equal(p.verification.status,'pending');assert.equal(p.verification.sourceUrl,null);assert.equal(p.verification.reviewedAt,null);assert.match(p.manufacturerUrl,/^https:\/\//);assert.ok(p.brand);assert.equal(p.image,null);assert.equal(p.price,null);assert.equal(p.weight,null);}
});
test('mechanical and Di2 controls must match drivetrain',()=>{
 assert.equal(evaluate({...defaults,drivetrain:'105-di2'}).errors.length,1);
 assert.equal(evaluate({...defaults,drivetrain:'105-di2',brakes:'105-r7170'}).errors.length,0);
 assert.equal(evaluate({...defaults,brakes:'105-r7170'}).errors.length,1);
});
test('legacy saved fictional products fall back to real references',()=>{
 const b=evaluate({frame:'allroad',wheels:'carbon',drivetrain:'electronic'});assert.equal(b.parts.frame.id,'allez-sprint');assert.equal(b.parts.wheels.id,'e1800');assert.equal(b.parts.drivetrain.id,'105-mechanical');
});
test('all 288 combinations retain unknown pricing and flag all control mismatches',()=>{
 let cases=[{}];for(const [key,g] of Object.entries(catalog))cases=cases.flatMap(c=>g.items.map(p=>({...c,[key]:p.id})));
 let mismatches=0;for(const c of cases){const b=evaluate(c);assert.equal(b.price,null);assert.equal(b.weight,null);if(b.errors.length)mismatches++;}
 assert.equal(cases.length,288);assert.equal(mismatches,144);
});

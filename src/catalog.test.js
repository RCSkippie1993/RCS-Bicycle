import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog,defaults,evaluate} from './catalog.js';
test('complete default build has expected totals and passes tire clearance',()=>{
 const b=evaluate(defaults);assert.equal(Object.keys(b.parts).length,7);assert.equal(b.price,30300);assert.equal(b.weight,8.6);assert.deepEqual(b.errors,[]);
});
test('frame changes enforce clearance and affect total and weight',()=>{
 const b=evaluate({...defaults,frame:'aero',tires:'endurance'});assert.equal(b.errors.length,1);assert.match(b.errors[0],/32 mm.*28 mm/);assert.equal(b.price,45100);
 assert.equal(evaluate({...defaults,frame:'aero',tires:'race'}).errors.length,0);
});
test('all catalog combinations yield bounded scores and finite totals',()=>{
 let cases=[{}];for(const [key,g] of Object.entries(catalog)) cases=cases.flatMap(c=>g.items.map(p=>({...c,[key]:p.id})));
 for(const c of cases){const b=evaluate(c);assert.ok(b.price>0&&Number.isFinite(b.weight));for(const score of Object.values(b.scores))assert.ok(score>=1&&score<=10);}
 assert.equal(cases.length,144);
});

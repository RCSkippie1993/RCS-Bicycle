import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults,evaluate,catalog } from './catalog.js';
import { parseSharedBuild,sharedBuildUrl } from './build-share.js';
import { inspectParts,compatibilityText } from './compatibility.js';
import { validateQuote,quoteMailto,quoteText } from './quote.js';

test('shared builds round-trip only exact products, goal and tire setup; malformed links stay invalid',()=>{
 const link=sharedBuildUrl({...defaults,frame:'aethos-2-10r'},'climbing',{tireSetup:'tubeless'},'https://example.com/RCS-Bicycle/index.html?name=private#builder');
 assert.equal(new URL(link).pathname,'/RCS-Bicycle/index.html');assert.equal(new URL(link).search,'');assert.ok(!link.includes('private'));
 const parsed=parseSharedBuild(new URL(link).hash);assert.equal(parsed.status,'valid');assert.equal(parsed.selection.frame,'aethos-2-10r');assert.equal(parsed.goal,'climbing');assert.equal(parsed.settings.tireSetup,'tubeless');
 for(const hash of ['#build=2',new URL(link).hash+'&frame=allez-sprint',new URL(link).hash+'&name=private',new URL(link).hash.replace('aethos-2-10r','retired'),new URL(link).hash.replace('tubeless','invalid')])assert.equal(parseSharedBuild(hash).status,'invalid');
 assert.equal(parseSharedBuild('#builder').status,'none');assert.throws(()=>sharedBuildUrl({},'race',{},'https://example.com'));
});
test('interface matches stay limited to sourced specifications; unknown and excluded packages need review',()=>{
 const b=evaluate({frame:'tarmac-sl8',wheels:'hollowgram-r45',cockpit:'pro-plt',tires:'gp5000-str-32'},{tireSetup:'tubeless'});
 for(const key of ['frontAxle','rearAxle','bar-clamp','tire-system','clearance'])assert.equal(b.compatibility.checks.find(c=>c.id===key).status,'matched');
 assert.equal(b.compatibility.checks.find(c=>c.id==='freehub').status,'review');assert.equal(b.compatibilityVerified,false);
 const unknown=evaluate(defaults,{tireSetup:'tubeless'});assert.equal(unknown.compatibility.checks.find(c=>c.id==='tire-system').status,'review');
 assert.equal(evaluate({drivetrain:'105-di2'}).compatibility.counts.conflict,1);
 assert.ok(evaluate({frame:'colnago-v4rs-frame'}).compatibility.requiredExtras.some(s=>s.includes('matching fork')));
 const fake={...b.parts,wheels:{...b.parts.wheels,wheelFacts:{frontAxle:{value:'15x110'}}}};assert.ok(inspectParts(fake).errors.some(e=>e.includes('15x110')));
 assert.match(compatibilityText(b.compatibility),/Evidence checked/);assert.match(compatibilityText(b.compatibility),/Full build compatibility is not verified/);
});
const contact={name:'Test Rider',email:'rider@example.com',phone:'+27 82 123 4567',city:'Cape Town',province:'Western Cape',delivery:'courier',frameSize:'Supplier advice',notes:'Please check sizing.\nNo automatic order.'};
const context={title:'Custom road build',items:[{name:'Pair of tires',quantity:2,price:2780,basis:'Two tires per package'}],knownSubtotal:5560,unpricedCount:0,sourceText:'DETAILED SOURCE AND FIT CHECKS',shareUrl:'https://example.com/#build=1'};
test('quote details validate before a correctly addressed draft; full requests preserve all quantities and notes',()=>{
 assert.deepEqual(validateQuote(contact).errors,{});
 for(const raw of [{...contact,email:'bad'},{...contact,city:''},{...contact,province:'Unknown'},{...contact,name:'User\nBcc:evil@example.com'},{...contact,notes:'x'.repeat(2001)}])assert.ok(Object.keys(validateQuote(raw).errors).length);
 assert.equal(validateQuote({...contact,delivery:'collect',city:''}).errors.city,undefined);
 const mailto=quoteMailto('rikus2011@hotmail.com',contact,context);assert.ok(mailto.startsWith('mailto:rikus2011@hotmail.com?subject='));assert.ok(mailto.length<1900);
 const text=quoteText(contact,context);assert.match(text,/2 × Pair of tires/);assert.match(text,/Two tires per package/);assert.match(text,/DETAILED SOURCE AND FIT CHECKS/);assert.match(text,/has not been submitted automatically/);
 const large={...context,items:Array.from({length:175},(_,i)=>({name:'Wheelset '+i,quantity:20,price:10000,basis:'Pair'}))};
 assert.ok(quoteMailto('rikus2011@hotmail.com',contact,large).length<1900);assert.match(decodeURIComponent(quoteMailto('rikus2011@hotmail.com',contact,large)),/attach or paste the full/);assert.match(quoteText(contact,large),/Wheelset 174/);
 assert.equal(quoteMailto('bad\naddress',contact,context),null);
});

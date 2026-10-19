import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from './catalog.js';
import {guidedBuild} from './build-plan.js';
import {finishingKitMarkup,extraQuantityControl} from './finishing-ui.js';
import {reviewMarkup} from './guided-ui.js';
import {rateBuild} from './build-ratings.js';
import {briefText} from './brief.js';
import {riderDefaults} from './rider.js';

test('finishing kit distinguishes package count, unit price and selected line total',()=>{
 const build=guidedBuild(defaults,{extras:['light-femto-pair'],extraQuantities:{'light-femto-pair':2}});
 const html=finishingKitMarkup(build);
 assert.match(html,/2 packages · 1 product reference/);
 assert.match(html,/650 per package/);
 assert.match(html,/1\s*300/);
 assert.match(html,/<option value="2" selected>/);
 assert.match(html,/A light set or pedal pair is one package/);
 const review=reviewMarkup(build,'allround',{});
 assert.doesNotMatch(review,/id="request-quote-review" disabled/);
 assert.doesNotMatch(review,/id="download-build" disabled/);
 assert.match(review,/data-remove-extra="light-femto-pair"/);
});
test('finishing controls escape sourced text and keep removal separate from quantities',()=>{
 const html=extraQuantityControl({id:'test"id',name:'<script>unit</script>'},3);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/data-extra-quantity="test&quot;id"/);
 assert.match(html,/Packages of &lt;script&gt;unit&lt;\/script&gt;/);
 assert.match(html,/<option value="3" selected>/);
});

test('accessory conflicts enter the build rating, source checklist and downloaded brief',()=>{
 const build=guidedBuild(defaults,{chosen:Object.keys(defaults),extras:['exp-extras-titan-road-tubes'],extraQuantities:{'exp-extras-titan-road-tubes':2}},{tireSetup:'tubes'});
 assert.equal(build.knownSubtotal,51730);
 assert.ok(build.compatibility.checks.some(c=>c.id==='finishing-tube-exp-extras-titan-road-tubes'&&c.status==='conflict'));
 assert.equal(build.compatibility.counts.conflict,build.errors.length);
 assert.equal(rateBuild(build,'allround').blocked,true);
 const text=briefText(build,riderDefaults);
 assert.match(text,/outside the source-listed tube range/);
 assert.match(text,/2 package\(s\) × R\s*60/);
 assert.match(text,/2 × R\s*60/);
 assert.match(text,/shimano|titan-road-tubes/i);
});

import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';
import './guided.css';
import {matchingBrakePackage} from './product-packages.js';
import {catalog,defaults,money,checkedDate} from './catalog.js';
import {siteHeader,siteFooter} from './site-shell.js';
import {riderDefaults,validateRider,hasRider} from './rider.js';
import {openRider} from './rider-ui.js';
import {briefText} from './brief.js';
import {escapeHtml as esc,externalArrow} from './view-utils.js';
import {mountBuildBox,saveProductsToBox} from './build-box-ui.js';
import {settingsKey,normalizeSettings} from './build-settings.js';
import {parseSharedBuild,sharedBuildUrl} from './build-share.js';
import {openShare} from './share-ui.js';
import {openQuoteRequest} from './quote-ui.js';
import {ratingMethod} from './ratings-ui.js';
import {buildRatingMethod} from './build-ratings-ui.js';
import {planKey,coreSteps,buildSteps,stepLabels,normalizePlan,guidedBuild,maxExtraQuantity} from './build-plan.js';
import {productsFor,newFilters,filterMarkup,resultsMarkup,inspectorMarkup,summaryMarkup,reviewMarkup,stepperMarkup} from './guided-ui.js';

let selection={...defaults},settings=normalizeSettings(),rider={...riderDefaults},plan=normalizePlan(),active='frame',sharedPreview=null,notice='',storageAvailable=true,inspection=null;
let scenario={baseline:'r470',speed:15,grade:6};
const filters=Object.fromEntries(buildSteps.filter(k=>k!=='review').map(k=>[k,newFilters()]));
try{const parsed=validateRider(JSON.parse(localStorage.getItem('rcs-rider')));if(!Object.keys(parsed.errors).length)rider=parsed.value;}catch{}
try{
 const saved=JSON.parse(localStorage.getItem('rcs-build'));const rawPlan=JSON.parse(localStorage.getItem(planKey));
 if(saved&&typeof saved==='object')for(const key of coreSteps)if(catalog[key].items.some(p=>p.id===saved[key]))selection[key]=saved[key];
 plan=rawPlan?normalizePlan(rawPlan):normalizePlan({chosen:saved?coreSteps.filter(k=>catalog[k].items.some(p=>p.id===saved[k])):[]});
 settings=normalizeSettings(JSON.parse(localStorage.getItem(settingsKey)));
}catch{storageAvailable=false;}
function currentBuild(){return guidedBuild(selection,plan,settings);}
function loadShared(){
 const shared=parseSharedBuild(location.hash);
 if(shared.status==='valid'){
  if(!sharedPreview)sharedPreview={selection:{...selection},plan:structuredClone(plan),settings:{...settings},goal:rider.goal};
  selection=shared.selection;plan=shared.plan?normalizePlan(shared.plan):normalizePlan({chosen:coreSteps});settings=shared.settings;rider={...rider,goal:shared.goal};notice='';
 }else if(shared.status==='invalid')notice=shared.message;
}
function persist(){
 if(sharedPreview){sharedPreview=null;history.replaceState(null,'',location.pathname+location.search);}
 try{localStorage.setItem('rcs-build',JSON.stringify(selection));localStorage.setItem(planKey,JSON.stringify(plan));localStorage.setItem(settingsKey,JSON.stringify(settings));localStorage.setItem('rcs-rider',JSON.stringify(rider));storageAvailable=true;}catch{storageAvailable=false;}
}
function shareLink(){return sharedBuildUrl(selection,rider.goal,settings,location.href,plan);}
function requestBuild(){const build=currentBuild();openQuoteRequest({title:'Your custom road build',items:[...Object.values(build.parts),...build.additionalLines].map(p=>({name:p.name,quantity:p.quantity??1,price:p.price,basis:p.priceBasis||p.role})),knownSubtotal:build.knownSubtotal,unpricedCount:build.unpriced.length,sourceText:briefText(build,rider),shareUrl:shareLink()});}
function downloadBuild(){const text=briefText(currentBuild(),rider);const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='rcs-road-build.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function goStep(key){if(!buildSteps.includes(key))return;active=key;inspection=null;render();document.querySelector('#lab-step-heading').focus({preventScroll:true});document.querySelector('#builder').scrollIntoView({block:'start'});}
function equip(id,key=active){
 if(!productsFor(key).some(p=>p.id===id))return;
 if(coreSteps.includes(key)){selection[key]=id;plan.chosen=[...new Set([...plan.chosen,key])];}
 else if(key==='chain')plan.chain=id;
 else if(key==='extras')plan.extras=plan.extras.includes(id)?plan.extras.filter(v=>v!==id):[...plan.extras,id];
 plan=normalizePlan(plan);persist();inspection=null;render();const button=document.querySelector(`[data-equip="${id}"]`);button?.focus({preventScroll:true});announce(stepLabels[key]+' selection updated.');
}
function announce(message){document.querySelector('#lab-status').textContent=message+(storageAvailable?'':' Browser storage is unavailable; changes last for this visit.');}
function paintResults(){
 if(active==='review')return;
 const output=resultsMarkup(active,filters[active],currentBuild());document.querySelector('#lab-result-count').textContent=output.count;document.querySelector('#lab-results').innerHTML=output.html;
}
function updateSummary(){const mobile=document.querySelector('.lab-mobile-summary');if(mobile){const b=currentBuild();mobile.textContent='Your build box · '+money(b.knownSubtotal)+' · '+b.plan.chosen.length+'/7 equipped ↑';}document.querySelector('#live-build-summary').innerHTML=summaryMarkup(currentBuild(),rider.goal,active,rider.budgetZar);document.querySelector('#lab-steps').innerHTML=stepperMarkup(active,currentBuild());if(active==='review')paintReview();}
function paintReview(){document.querySelector('#lab-step-content').innerHTML=reviewMarkup(currentBuild(),rider.goal,scenario);}
function openInspector(id,key=active){
 const p=productsFor(key).find(p=>p.id===id);if(!p)return;inspection={id,key};
 const dialog=document.querySelector('#lab-inspector');dialog.innerHTML=inspectorMarkup(p,key,currentBuild());if(!dialog.open)dialog.showModal();
}
function refreshInspector(focus){
 if(!inspection)return;const {id,key}=inspection;openInspector(id,key);document.querySelector('#lab-inspector').querySelector(focus)?.focus({preventScroll:true});
}
function render(){
 const build=currentBuild(),i=buildSteps.indexOf(active);
 document.body.classList.add('guided-home');
 document.querySelector('#app').innerHTML=`${siteHeader()}<main class="lab-main"><div class="lab-hero"><div><p class="lab-kicker">RCS BUILD LAB / SOUTH AFRICA / ROAD</p><h1>Build your <em>advantage.</em></h1><p>One choice at a time. Your frame, your components, your road machine.</p></div><div class="lab-hero-actions"><button id="edit-rider">${hasRider(rider)?'Edit rider requirements':'Rider requirements & budget'} ${externalArrow}</button><a href="./mountain.html">Mountain bike builder ↗</a><a href="./builds.html">Complete bikes & build ideas ${externalArrow}</a></div></div>${sharedPreview?'<aside class="lab-share-banner" role="status">Shared configuration preview. Your saved build is preserved until you save or edit.<div><button id="keep-shared">Save this configuration</button><button id="discard-shared">Back to my build</button></div></aside>':''}<p id="lab-status" class="lab-status" role="status" aria-live="polite">${esc(notice)}${!storageAvailable?' Browser storage is unavailable; changes last for this visit.':''}</p><div id="lab-steps">${stepperMarkup(active,build)}</div><div class="lab-layout" id="builder"><section class="lab-workbench" aria-labelledby="lab-step-heading"><div class="lab-step-heading"><div><p class="lab-kicker">STEP ${String(i+1).padStart(2,'0')} / ${buildSteps.length}</p><h2 id="lab-step-heading" tabindex="-1">${esc(active==='review'?'Review your build':active==='extras'?'Make it ride-ready.':'Choose your '+stepLabels[active].toLowerCase()+'.')}</h2><p>${esc(active==='frame'?'Start with the foundation. Compare brands, purpose, materials and exact package contents.':active==='wheels'?'Shape your ride with rim depth, material and pair mass. Current builder options are reviewed disc-road references.':active==='cockpit'?'Choose your bar and stem package. Configure source-listed bar widths in Specs & options.':active==='chain'?'Keep the bundled chain, choose a replacement, or add a spare. Different chain standards require different drivetrains.':active==='extras'?'Lights, pedals, bar tape and the small details. Add only what you need.':active==='review'?'Review your selected specification, research estimates and supplier checks.':'Inspect the specification and source before equipping your next component.')}</p></div><button class="lab-reset" id="reset">Start a new build</button></div><div id="lab-step-content">${active==='review'?reviewMarkup(build,rider.goal,scenario):filterMarkup(active,filters[active])}</div><div class="lab-step-bottom">${i?`<button data-step="${buildSteps[i-1]}">← ${esc(stepLabels[buildSteps[i-1]])}</button>`:'<a href="./collection.html?category=frame">Full frameset source collection ${externalArrow}</a>'}${i<buildSteps.length-1?`<button data-next-step="${buildSteps[i+1]}" ${coreSteps.includes(active)&&!build.parts[active]?'disabled':''}>${esc(stepLabels[buildSteps[i+1]])} →</button>`:''}</div></section><aside class="lab-summary" id="live-build-summary" aria-label="Your build box">${summaryMarkup(build,rider.goal,active,rider.budgetZar)}</aside></div><div class="lab-scope"><p>South African source references · ${checkedDate}. No RCS stock held. Final sizing, supply, compatibility and complete price need a supplier quote.</p><details><summary>How the specification bars and estimates work</summary><p>Mass profiles describe the listed measurement and its package scope. Frame intent scores use the RCS source-based purpose rubric; wheel depth is a dimensional proxy. Neither predicts tested aerodynamics. Stiffness stays pending without comparable tests. The live mass subtotal is incomplete, and watt estimates isolate the wheel-mass effect on a steady climb.</p></details>${buildRatingMethod()}${ratingMethod.replace('id="rating-method" open','id="rating-method"')}</div></main>${siteFooter()}<dialog id="lab-inspector" aria-labelledby="lab-product-title"></dialog><dialog id="rider-dialog" aria-labelledby="rider-title" aria-describedby="rider-help"></dialog>`;
 if(active!=='review')paintResults();
 const stepNav=document.querySelector('.lab-stepper'),current=stepNav.querySelector('[aria-current=step]');stepNav.scrollLeft=Math.max(0,current.offsetLeft-stepNav.offsetLeft-stepNav.clientWidth/2+current.offsetWidth/2);
 mountBuildBox();
 if(matchMedia('(max-width:600px)').matches&&active!=='review')document.querySelector('.lab-filters').open=false;
 document.querySelector('.lab-mobile-summary')?.remove();
 const mobile=document.createElement('button');mobile.className='lab-mobile-summary';mobile.textContent='Your build box · '+money(build.knownSubtotal)+' · '+build.plan.chosen.length+'/7 equipped ↑';mobile.onclick=()=>document.querySelector('#live-build-summary').scrollIntoView({block:'start'});document.body.append(mobile);
 const dialog=document.querySelector('#lab-inspector');dialog.addEventListener('close',()=>{const id=inspection?.id;inspection=null;if(id)document.querySelector(`[data-inspect="${id}"]`)?.focus({preventScroll:true});});
}
const app=document.querySelector('#app');
app.addEventListener('click',event=>{
 const button=event.target.closest('button,a');if(!button)return;
 if(button.hasAttribute('data-remove-extra')){plan.extras=plan.extras.filter(id=>id!==button.dataset.removeExtra);plan=normalizePlan(plan);persist();render();announce('Extra removed from your finishing kit.');return;}
 if(button.hasAttribute('data-remove-step')){plan.chosen=plan.chosen.filter(k=>k!==button.dataset.removeStep);persist();render();announce('Component removed from your build.');return;}
 if(button.hasAttribute('data-step')){event.preventDefault();goStep(button.dataset.step);return;}
 if(button.hasAttribute('data-next-step')){goStep(button.dataset.nextStep);return;}
 if(button.hasAttribute('data-equip')){equip(button.dataset.equip);return;}
 if(button.hasAttribute('data-inspect')){openInspector(button.dataset.inspect);return;}
 if(button.hasAttribute('data-review-inspect')){openInspector(button.dataset.reviewInspect,button.dataset.category);return;}
 if(button.hasAttribute('data-inspector-close')){document.querySelector('#lab-inspector').close();return;}
 if(button.hasAttribute('data-inspector-equip')){const {id,key}=inspection,keep=key==='extras'&&plan.extras.includes(id);document.querySelector('#lab-inspector').close();if(!keep)equip(id,key);return;}
 if(button.hasAttribute('data-review-issues')){event.preventDefault();goStep('review');document.querySelector('.lab-review-evidence').open=true;document.querySelector('.lab-review-evidence').scrollIntoView({block:'start'});return;}
 if(button.hasAttribute('data-chain-included')){plan.chain='included';persist();render();announce('Bundled chain selected. No separate chain cost added.');return;}
 if(button.hasAttribute('data-lab-page')){filters[active].page=Number(button.dataset.labPage);paintResults();document.querySelector('#lab-result-count').scrollIntoView({block:'start'});return;}
 if(button.id==='lab-clear'||button.hasAttribute('data-reset-results')){filters[active]=newFilters();render();document.querySelector('#lab-search').focus({preventScroll:true});return;}
 if(button.id==='lab-brands-all'||button.id==='lab-brands-none'){filters[active].brands=button.id==='lab-brands-all'?null:[];filters[active].page=1;document.querySelectorAll('[data-facet="brands"]').forEach(el=>el.checked=button.id==='lab-brands-all');paintResults();return;}
 if(button.id==='reset'){selection={...defaults};plan=normalizePlan();settings=normalizeSettings();active='frame';persist();render();announce('New build started. Choose your frameset.');return;}
 if(button.id==='keep-shared'){persist();render();announce('Shared configuration saved in this browser.');return;}
 if(button.id==='discard-shared'){({selection,plan,settings}=sharedPreview);rider={...rider,goal:sharedPreview.goal};sharedPreview=null;history.replaceState(null,'',location.pathname+location.search);render();return;}
 if(button.id==='edit-rider'){openRider(rider,next=>{rider=next;persist();render();announce('Rider requirements updated.');},()=>{rider={...riderDefaults};try{localStorage.removeItem('rcs-rider');}catch{}render();});return;}
 if(button.id==='request-quote'||button.id==='request-quote-review'){requestBuild();return;}
 if(button.id==='download-build'){downloadBuild();return;}
 if(button.id==='share-build'){openShare(shareLink());return;}
 if(button.id==='save-build-box'){saveProductsToBox(Object.values(currentBuild().parts).map(p=>p.id));return;}
 if(button.hasAttribute('data-fix-cockpit')){const frame=currentBuild().parts.frame,match=catalog.cockpit.items.find(p=>p.includedConfirmed&&p.packageIncludedInFrame?.includes(frame?.id));if(!match)return;selection.cockpit=match.id;plan.chosen=[...new Set([...plan.chosen,'cockpit'])];persist();render();announce('Included frame cockpit selected; confirm dimensions and routing with supplier.');return;}
 if(button.hasAttribute('data-fix-controls')){const p=currentBuild().parts.drivetrain;if(!p)return;const match=matchingBrakePackage(p,catalog.brakes.items);if(!match){announce('No exact brake/control package is reviewed for this drivetrain. Request supplier advice.');return;}selection.brakes=match.id;plan.chosen=[...new Set([...plan.chosen,'brakes'])];persist();render();announce('Brake/control family matched; remaining interfaces need review.');}
});
app.addEventListener('input',event=>{if(event.target.id==='lab-search'){filters[active].query=event.target.value;filters[active].page=1;paintResults();}});
app.addEventListener('change',event=>{
 const input=event.target;
 if(input.hasAttribute('data-extra-quantity')){const id=input.dataset.extraQuantity,value=Number(input.value);if(!plan.extras.includes(id)||!Number.isInteger(value)||value<1||value>maxExtraQuantity)return;plan.extraQuantities={...plan.extraQuantities,[id]:value};plan=normalizePlan(plan);persist();updateSummary();if(active!=='review')paintResults();if(inspection)refreshInspector(`[data-extra-quantity="${id}"]`);else document.querySelector(`[data-extra-quantity="${id}"]`)?.focus({preventScroll:true});announce('Finishing-kit quantity updated.');return;}
 if(input.hasAttribute('data-facet')){const facet=input.dataset.facet;filters[active][facet]=[...document.querySelectorAll(`[data-facet="${facet}"]:checked`)].map(el=>el.value);filters[active].page=1;paintResults();}
 if(input.id==='lab-sort'){filters[active].sort=input.value;filters[active].page=1;paintResults();}
 if(input.hasAttribute('data-option-field')&&inspection){const {id}=inspection;plan.choices[id]={...plan.choices[id],[input.dataset.optionField]:input.value};plan=normalizePlan(plan);persist();updateSummary();if(active!=='review')paintResults();refreshInspector(`[data-option-field="${input.dataset.optionField}"]`);}
 if(input.hasAttribute('data-fit-request')&&inspection){const {id}=inspection;plan.requests[id]={...plan.requests[id],[input.dataset.fitRequest]:input.value};plan=normalizePlan(plan);persist();updateSummary();if(active!=='review')paintResults();refreshInspector(`[data-fit-request="${input.dataset.fitRequest}"]`);}
 if(input.id==='chain-mode'){plan.chainMode=input.value;persist();updateSummary();paintResults();}
 if(input.id==='lab-goal'){rider={...rider,goal:input.value};persist();updateSummary();document.querySelector('#lab-goal').focus({preventScroll:true});}
 if(input.id==='tire-setup'){settings=normalizeSettings({tireSetup:input.value});persist();updateSummary();document.querySelector('.lab-review-evidence').open=true;document.querySelector('#tire-setup').focus({preventScroll:true});}
 if(['power-baseline','power-speed','power-grade'].includes(input.id)){
  const key={'power-baseline':'baseline','power-speed':'speed','power-grade':'grade'}[input.id],value=key==='baseline'?input.value:input.value.trim()===''?NaN:Number(input.value);
  if((key==='speed'&&(!Number.isFinite(value)||value<5||value>60))||(key==='grade'&&(!Number.isFinite(value)||value<0||value>20))){input.setCustomValidity(key==='speed'?'Use a speed from 5 to 60 km/h.':'Use a gradient from 0 to 20%.');input.reportValidity();input.value=scenario[key];return;}
  scenario[key]=value;paintReview();document.querySelector('#'+input.id).focus({preventScroll:true});
 }
});
loadShared();render();
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#build=')){loadShared();render();}});

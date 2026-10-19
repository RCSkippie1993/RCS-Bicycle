import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';
import './guided.css';
import './mtb.css';
import data from './mtb-data.json' with {type:'json'};
import {money,displayDate} from './catalog.js';
import {siteHeader,siteFooter} from './site-shell.js';
import {escapeHtml as esc} from './view-utils.js';
import {openShare} from './share-ui.js';
import {openQuoteRequest} from './quote-ui.js';
import {mtbStorageKey,normalizeMtbPlan,evaluateMtbBuild,configureMtbProduct,mtbSteps,mtbStepLabels,mtbBriefText,mtbQuoteContext,mtbSharedUrl,parseMtbShared} from './mtb-build.js';
import {newMtbFilters,categoryFor,mtbCategoryLabels,mtbFilterMarkup,mtbResultsMarkup,mtbInspectorMarkup,mtbSummaryMarkup,mtbStepperMarkup,mtbReviewMarkup,mtbMassBands} from './mtb-ui.js';

let plan=normalizeMtbPlan({},data),active='frame',inspection=null,preview=null,notice='',storageAvailable=true;
let collection=new URLSearchParams(location.search).get('view')==='collection';
const filters={};
const filterFor=key=>filters[key]||(filters[key]=newMtbFilters());
const params=new URLSearchParams(location.search);if(Object.hasOwn(mtbCategoryLabels,params.get('category')))filterFor('collection').category=params.get('category');
try{plan=normalizeMtbPlan(JSON.parse(localStorage.getItem(mtbStorageKey))||{},data);}catch{storageAvailable=false;}
const current=()=>evaluateMtbBuild(data,plan);
const app=document.querySelector('#app');
function loadShared(){
 const parsed=parseMtbShared(location.hash,data);
 if(parsed.status==='valid'){if(!preview)preview=structuredClone(plan);plan=parsed.plan;collection=false;notice='';}
 else if(parsed.status==='invalid')notice=parsed.message;
}
function persist(){
 if(preview){preview=null;history.replaceState(null,'',location.pathname+location.search);document.querySelector('.lab-share-banner')?.remove();}
 plan=normalizeMtbPlan(plan,data);
 try{localStorage.setItem(mtbStorageKey,JSON.stringify(plan));storageAvailable=true;}catch{storageAvailable=false;}
}
function announce(message){notice=message;const status=document.querySelector('#mtb-status');if(status)status.textContent=notice+(storageAvailable?'':' Browser storage is unavailable; download or share your configuration before leaving.');}
function sourceMethod(){return `<details class="mtb-method"><summary>MTB source coverage, specification profiles & limits</summary><p>${data.records.length} source references reviewed ${displayDate(data.reviewedAt)}. Sources include dated public South African store listings; this is not live inventory or every South African product. Separate variants and packages can represent one model. Prices, VAT treatment, availability, sizing and exact contents need reconfirmation. Real source photos can show another size or colour. Photo attribution records provenance.</p><p>Front and rear tyres are separate physical tyres. Wheelsets price the source-listed pair. Cockpits include a bar and stem; brake pairs include both lever/caliper ends. Forks, shocks, seatposts, rotors, remotes and drivetrain finishing parts are included only where source package contents explicitly prove it. Replacement components add their price to an unsplit parent package; no credit is invented.</p><p>Low-mass profiles use fixed editorial endpoints: ${Object.entries(mtbMassBands).map(([k,[low,high]])=>`${esc(mtbCategoryLabels[k])} ${low.toFixed(2)}–${high.toFixed(2)} kg`).join('; ')}. The low endpoint maps to10 and high to1, linearly clamped and rounded to one decimal. Higher means a lighter source package, not a better bicycle. Different package contents limit comparisons. No score is invented for an unknown mass.</p><p>Partial mass totals describe source packages, including possible spares and separately purchased replacements. Included component checks add no second mass. Complete installed weight, stiffness, traction, suspension quality, watts saved and trail speed remain unverified. Nominal interface agreements stay supplier review; a source-documented mismatch is flagged.</p><p>Road and MTB configurations are saved separately in this browser. Sharing includes catalogue choices and quantities; private fit requests and customer contact details stay out. Quotes are prepared for you to review and send; no order, payment or reservation is created.</p></details>`;}
function render(){
 const build=current(),steps=mtbSteps(build);if(!steps.includes(active))active='frame';
 document.body.classList.add('guided-home','mtb-home');
 const key=collection?'collection':active,index=steps.indexOf(active),next=steps[index+1];
 app.innerHTML=`${siteHeader('mountain')}<main class="lab-main"><div class="lab-hero"><div><p class="lab-kicker">RCS BUILD LAB / MOUNTAIN / SOUTH AFRICA</p><h1>Build for <em>your terrain.</em></h1><p>Hardtail or full suspension. Every interface, every component, your mountain bike.</p></div><div class="lab-hero-actions"><a href="./index.html">Road bike builder ↗</a><button data-mtb-browse>${collection?'Back to my MTB build':'Browse '+data.records.length+' MTB source references'} ↗</button><a href="./mountain.html?view=collection&category=bike">Complete mountain bikes ↗</a></div></div>${preview?'<aside class="lab-share-banner" role="status">Shared MTB configuration preview. Your saved build is preserved until you save or edit.<div><button data-mtb-keep>Save this MTB configuration</button><button data-mtb-discard>Back to my MTB build</button></div></aside>':''}<p id="mtb-status" class="lab-status" role="status" aria-live="polite">${esc(notice)}${storageAvailable?'':' Browser storage is unavailable; use a download or shared link.'}</p>${collection?'':mtbStepperMarkup(build,active)}<div class="lab-layout" id="mtb-builder"><section class="lab-workbench" aria-labelledby="mtb-step-heading"><div class="lab-step-heading"><div><p class="lab-kicker">${collection?'MTB SOURCE COLLECTION':'STEP '+String(index+1).padStart(2,'0')+' / '+steps.length}</p><h2 id="mtb-step-heading" tabindex="-1">${collection?'Explore mountain products.':active==='review'?'Review your MTB build.':'Choose your '+esc((mtbStepLabels[active]||active).toLowerCase())+'.'}</h2><p>${collection?'Real products, local prices and source evidence. Complete bikes are separate products.':active==='frame'?'Start with the frame package. Compare hardtails and full-suspension frames; inspect sizes, included parts and the source before equipping.':active==='frontTire'||active==='rearTire'?'One physical tyre for this end of the bike. Choose tread, casing and compound separately; confirm rim approval and clearance.':active==='shock'?'Keep a source-confirmed supplied shock or select an additional replacement for a supplier-approved substitution. Eye-to-eye, stroke and mount all matter.':active==='extras'?'Choose the exact package and quantity. A pair or set already counts as one package.':'Compare source specifications and exact variants; nominal agreement is not full fit approval.'}</p></div><button class="lab-reset" data-mtb-reset>Start a new MTB build</button></div><div id="mtb-content">${key==='review'?mtbReviewMarkup(build):mtbFilterMarkup(data,key,filterFor(key))}</div>${collection?'':`<div class="lab-step-bottom">${index?`<button data-mtb-step="${steps[index-1]}">← ${esc(mtbStepLabels[steps[index-1]])}</button>`:''}${next?`<button data-mtb-step="${next}">${esc(mtbStepLabels[next])} →</button>`:''}</div>`}</section><aside id="mtb-summary" class="lab-summary" aria-label="Your mountain-bike build">${mtbSummaryMarkup(build,active)}</aside></div><div class="lab-scope"><p>MTB sources reviewed ${displayDate(data.reviewedAt)} · South Africa · ZAR. No RCS stock held. Exact size, package contents, supplier availability and full build price need a quote.</p>${sourceMethod()}</div></main>${siteFooter(displayDate(data.reviewedAt))}<dialog id="mtb-inspector" aria-labelledby="mtb-product-title"></dialog>`;
 if(key!=='review')paintResults();
 if(matchMedia('(max-width:600px)').matches)document.querySelector('.lab-filters')?.removeAttribute('open');
 const nav=document.querySelector('.lab-stepper'),button=nav?.querySelector('[aria-current=step]');if(button)nav.scrollLeft=Math.max(0,button.offsetLeft-nav.offsetLeft-nav.clientWidth/2+button.offsetWidth/2);
 document.querySelector('.lab-mobile-summary')?.remove();
 const mobile=document.createElement('button');mobile.className='lab-mobile-summary';mobile.textContent='Your MTB build · '+money(build.knownSubtotal)+' · review ↑';mobile.onclick=()=>document.querySelector('#mtb-summary').scrollIntoView({block:'start'});document.body.append(mobile);
 document.querySelector('#mtb-inspector').addEventListener('close',()=>{const id=inspection?.id;inspection=null;if(id)document.querySelector(`[data-mtb-inspect="${id}"]`)?.focus({preventScroll:true});});
}
function paintResults(){
 const key=collection?'collection':active;if(key==='review')return;
 const result=mtbResultsMarkup(data,key,filterFor(key),current());document.querySelector('#mtb-result-count').textContent=result.count;document.querySelector('#mtb-results').innerHTML=result.html;
}
function goStep(key){if(!mtbSteps(current()).includes(key))return;collection=false;active=key;inspection=null;render();document.querySelector('#mtb-step-heading').focus({preventScroll:true});document.querySelector('#mtb-builder').scrollIntoView({block:'start'});}
function updateParts(){
 document.querySelector('#mtb-summary').innerHTML=mtbSummaryMarkup(current(),active);
 if(!collection&&active==='review')document.querySelector('#mtb-content').innerHTML=mtbReviewMarkup(current());else paintResults();
 const mobile=document.querySelector('.lab-mobile-summary');if(mobile)mobile.textContent='Your MTB build · '+money(current().knownSubtotal)+' · review ↑';
}
function openInspector(id){
 const row=data.records.find(r=>r.product.id===id);if(!row)return;const key=row.category==='tires'&&['frontTire','rearTire'].includes(active)?active:row.category;
 inspection={id,key};const dialog=document.querySelector('#mtb-inspector');dialog.innerHTML=mtbInspectorMarkup(data,row,current(),key);if(!dialog.open)dialog.showModal();
}
function refreshInspector(selector){if(!inspection)return;openInspector(inspection.id);document.querySelector('#mtb-inspector').querySelector(selector)?.focus({preventScroll:true});}
function equip(id,key){
 const row=data.records.find(r=>r.product.id===id);if(!row||row.product.buildEligible===false||row.category==='bike')return;
 key=key||(!collection&&categoryFor(active)===row.category?active:row.category);
 if(row.category==='tires'&&!['frontTire','rearTire'].includes(key))return;
 if(key==='chain')plan.chain=id;
 else if(key==='extras')plan.extras=plan.extras.includes(id)?plan.extras.filter(v=>v!==id):[...plan.extras,id];
 else plan.selection[key]=id;
 plan=normalizeMtbPlan(plan,data);persist();collection=false;active=key;inspection=null;render();announce((mtbStepLabels[key]||'Component')+' selection updated.');
}
function sharedUrl(){return mtbSharedUrl(plan,location.href,data);}
function requestBuild(){let shareUrl;try{shareUrl=sharedUrl();}catch{}openQuoteRequest({...mtbQuoteContext(current(),shareUrl),checkedDate:displayDate(data.reviewedAt)});}
function downloadBuild(){const blob=new Blob([mtbBriefText(current())],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rcs-mountain-bike-build.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
app.addEventListener('click',event=>{
 const b=event.target.closest('button,a');if(!b)return;
 if(b.hasAttribute('data-mtb-step')){event.preventDefault();goStep(b.dataset.mtbStep);return;}
 if(b.hasAttribute('data-mtb-browse')){collection=!collection;render();return;}
 if(b.hasAttribute('data-mtb-inspect')){openInspector(b.dataset.mtbInspect);return;}
 if(b.hasAttribute('data-mtb-close')){document.querySelector('#mtb-inspector').close();return;}
 if(b.hasAttribute('data-mtb-equip')){equip(b.dataset.mtbEquip);return;}
 if(b.hasAttribute('data-mtb-equip-step')){const {productId,mtbEquipStep}=b.dataset;document.querySelector('#mtb-inspector').close();equip(productId,mtbEquipStep);return;}
 if(b.hasAttribute('data-mtb-inspector-equip')){const id=b.dataset.mtbInspectorEquip,row=data.records.find(r=>r.product.id===id),keep=row?.category==='extras'&&plan.extras.includes(id)||current().parts[row?.category]?.id===id;document.querySelector('#mtb-inspector').close();if(!keep)equip(id,row.category);return;}
 if(b.hasAttribute('data-mtb-included')){const key=b.dataset.mtbIncluded;if(key==='chain')plan.chain='included';else delete plan.selection[key];persist();render();announce('Source package inclusion selected; confirm the exact supplied component.');return;}
 if(b.hasAttribute('data-mtb-remove-step')){const key=b.dataset.mtbRemoveStep;if(key==='chain')plan.chain='included';else delete plan.selection[key];persist();render();announce('Component removed from MTB build.');return;}
 if(b.hasAttribute('data-mtb-remove-extra')){plan.extras=plan.extras.filter(id=>id!==b.dataset.mtbRemoveExtra);persist();render();announce('Extra removed.');return;}
 if(b.hasAttribute('data-mtb-page')){const key=collection?'collection':active;filterFor(key).page=Number(b.dataset.mtbPage);paintResults();document.querySelector('#mtb-result-count').scrollIntoView({block:'start'});return;}
 if(b.id==='mtb-filter-reset'){filters[collection?'collection':active]=newMtbFilters();render();return;}
 if(['mtb-brands-all','mtb-brands-none'].includes(b.id)){const f=filterFor(collection?'collection':active);f.brands=b.id==='mtb-brands-none'?[]:null;f.page=1;render();return;}
 if(b.hasAttribute('data-mtb-reset')){plan=normalizeMtbPlan({},data);active='frame';collection=false;persist();render();announce('New MTB build started. Your road configuration is preserved.');return;}
 if(b.hasAttribute('data-mtb-keep')){persist();render();announce('MTB configuration saved in this browser.');return;}
 if(b.hasAttribute('data-mtb-discard')){plan=preview;preview=null;history.replaceState(null,'',location.pathname);render();return;}
 if(b.hasAttribute('data-mtb-quote')){requestBuild();return;}
 if(b.hasAttribute('data-mtb-download')){downloadBuild();return;}
 if(b.hasAttribute('data-mtb-share')){try{openShare(sharedUrl(),{description:'This link includes MTB catalogue choices, source-listed options, tyre setup and extra quantities. Private size/colour requests and customer contact details stay out.'});}catch(e){announce(e.message);}return;}
 if(b.hasAttribute('data-mtb-quote-product')){const raw=data.records.find(r=>r.product.id===b.dataset.mtbQuoteProduct)?.product;if(!raw)return;const p=configureMtbProduct(raw,plan,data);document.querySelector('#mtb-inspector').close();openQuoteRequest({title:'Complete mountain bike: '+p.name,checkedDate:displayDate(p.verification.reviewedAt),items:[{name:p.name,quantity:1,price:p.price,basis:p.priceBasis}],knownSubtotal:p.price??0,unpricedCount:Number(!Number.isFinite(p.price)),sourceText:[p.name,p.priceBasis,p.fitNote,p.stockNote,...p.sources.map(s=>`${s.name}: ${s.url} | ${s.variant} | ${s.quantity} × ${money(s.unitPrice)} | checked ${s.checkedAt}`),'Complete-bike source reference, not donor components or RCS stock. Supplier must confirm exact variant, fit, inclusions, availability and final selling price.'].join('\n')});}
});
app.addEventListener('input',event=>{if(event.target.id==='mtb-search'){const f=filterFor(collection?'collection':active);f.query=event.target.value;f.page=1;paintResults();}});
app.addEventListener('change',event=>{
 const input=event.target,key=collection?'collection':active,f=filterFor(key);
 if(input.hasAttribute('data-mtb-facet')){const field=input.dataset.mtbFacet,values=[...document.querySelectorAll(`[data-mtb-facet="${field}"]:checked`)].map(el=>el.value);if(field==='brands')f.brands=values;else f.facets[field]=values;f.page=1;paintResults();return;}
 if(input.id==='mtb-sort'){f.sort=input.value;f.page=1;paintResults();return;}
 if(input.id==='mtb-category'){f.category=input.value;f.brands=null;f.facets={};f.page=1;render();return;}
 if(input.hasAttribute('data-mtb-option')&&inspection){const id=inspection.id,field=input.dataset.mtbOption;plan.choices[id]={...plan.choices[id],[field]:input.value};persist();updateParts();refreshInspector(`[data-mtb-option="${field}"]`);return;}
 if(input.hasAttribute('data-mtb-request')&&inspection){const id=inspection.id,field=input.dataset.mtbRequest;plan.requests[id]={...plan.requests[id],[field]:input.value};persist();updateParts();refreshInspector(`[data-mtb-request="${field}"]`);return;}
 if(input.hasAttribute('data-mtb-quantity')){const id=input.dataset.mtbQuantity,n=Number(input.value);if(!plan.extras.includes(id)||!Number.isInteger(n)||n<1||n>20)return;plan.extraQuantities[id]=n;persist();updateParts();if(inspection)refreshInspector(`[data-mtb-quantity="${id}"]`);else document.querySelector(`[data-mtb-quantity="${id}"]`)?.focus({preventScroll:true});return;}
 if(input.id==='mtb-tire-setup'){plan.tireSetup=input.value;persist();updateParts();document.querySelector('#mtb-tire-setup').focus({preventScroll:true});}
});
loadShared();render();
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#mtb=')){loadShared();render();}});

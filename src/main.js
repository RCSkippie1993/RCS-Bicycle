import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';
import { catalog, checkedDate, defaults, evaluate, money } from './catalog.js';
import { riderDefaults, validateRider, hasRider, riderRows, riderSummary } from './rider.js';
import { openRider } from './rider-ui.js';
import { briefText } from './brief.js';
import { escapeHtml as esc } from './view-utils.js';
import modelRegistry from './model-assets.json' with { type: 'json' };
import { ratingsPanel, ratingMethod } from './ratings-ui.js';
import { rateBuild } from './build-ratings.js';
import { buildRatingPanel, buildRatingMethod } from './build-ratings-ui.js';
import { collectionPreview } from './product-browser.js';
import { siteHeader, siteFooter } from './site-shell.js';
import { mountBuildBox, saveProductsToBox } from './build-box-ui.js';
import { settingsKey, normalizeSettings } from './build-settings.js';
import { sharedBuildUrl, parseSharedBuild } from './build-share.js';
import { openShare } from './share-ui.js';
import { compatibilityPanel } from './compatibility-ui.js';
import { openQuoteRequest } from './quote-ui.js';
import { wheelGroups, matchesWheelFilters } from './wheel-filters.js';

const arrow = '<svg class="arrow-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" stroke-width="1.5"/></svg>';
let viewer=null, viewerState=null, viewerTicket=0, previewMode='photo';
let settings=normalizeSettings(), sharedPreview=null, shareMessage='';
let rider = { ...riderDefaults }, selection = { ...defaults }, active = 'frame', catalogChanged = false;
try {
 const parsed = validateRider(JSON.parse(localStorage.getItem('rcs-rider')));
 if (!Object.keys(parsed.errors).length) rider = parsed.value;
} catch {}
try {
 const saved = JSON.parse(localStorage.getItem('rcs-build'));
 if (saved) for (const key in defaults) {
  if (catalog[key].items.some(p => p.id === saved[key])) selection[key] = saved[key];
  else if (saved[key]) catalogChanged = true;
 }
} catch {}

try{settings=normalizeSettings(JSON.parse(localStorage.getItem(settingsKey)));}catch{}
function loadShared(){
 const shared=parseSharedBuild(location.hash);
 if(shared.status==='valid'){
  if(!sharedPreview)sharedPreview={selection:{...selection},settings:{...settings},goal:rider.goal};
  selection=shared.selection;settings=shared.settings;rider={...rider,goal:shared.goal};shareMessage='';
 }else if(shared.status==='invalid')shareMessage=shared.message;
}
function keepShared(){
 if(!sharedPreview)return;
 sharedPreview=null;history.replaceState(null,'',location.pathname+location.search);
 try{localStorage.setItem('rcs-rider',JSON.stringify(rider));}catch{}
}
function buildLink(){return sharedBuildUrl(selection,rider.goal,settings,location.href);}
function requestBuild(build){
 openQuoteRequest({title:'Custom road build',items:Object.values(build.parts).map(p=>({name:p.name,quantity:1,price:p.price,basis:p.priceBasis})),knownSubtotal:build.knownSubtotal,unpricedCount:build.unpriced.length,sourceText:briefText(build,rider),shareUrl:buildLink()});
}
loadShared();

function sourceLinks(product) {
 return product.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(source.name)} · ${source.referenceOnly ? (source.referenceNote||'package reference') : `${source.quantity} × ${money(source.unitPrice)}`}<small>${esc(source.variant)}</small></span>${arrow}</a>`).join('');
}
function picture(product, className = '', lazy = true) {
 return `<img src="${esc(product.image)}" alt="${esc(product.name)}" class="${className}" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`;
}

function render() {
 if(previewMode==='photo' && viewer){viewerState=viewer.snapshot();viewer.dispose();viewer=null;}
 const ticket=++viewerTicket;
 const build = evaluate(selection,settings), group = catalog[active], preview = build.parts[active];
 const overall=rateBuild(build,rider.goal),overallValue=overall.overall??overall.provisional;
 const overBudget = rider.budgetZar !== null && build.knownSubtotal > rider.budgetZar;
 document.querySelector('#app').innerHTML = `
 ${siteHeader()}
 <main><div class="intro"><div><p class="eyebrow"><span></span> THE ROAD IS YOURS. BUILD FOR IT.</p><h1>Build your<br><em>advantage.</em></h1><p class="lede">Real bikes. Real components. Your next chapter.<br>Explore sourced South African prices and shape your road build.</p></div><div class="edition"><span>01 / ROAD COLLECTION</span><p>Price sources checked<br>${checkedDate}</p></div></div>
 ${sharedPreview?'<aside class="share-banner" role="status"><p>Shared build preview. Your saved build is kept until you save or edit this build.</p><button id="keep-shared">Save this shared build</button><button id="discard-shared">Back to my build</button></aside>':shareMessage?`<p class="share-banner" role="status">${esc(shareMessage)}</p>`:''}
 ${collectionPreview()}
 <section class="rider-card" aria-labelledby="rider-heading"><div><p class="eyebrow">START WITH THE RIDER</p><h2 id="rider-heading">Your ride, your requirements.</h2><p>${esc(riderSummary(rider))}</p><p class="rider-status" id="rider-status" role="status"></p></div><button id="edit-rider" class="rider-edit">${hasRider(rider) ? 'Edit rider details' : 'Add rider details'} ${arrow}</button></section>
 ${buildRatingPanel(build,rider.goal,{interactive:true})}
 ${compatibilityPanel(build.compatibility)}
 <div class="workspace" id="builder"><section class="stage" aria-label="Selected component preview"><div class="stage-top"><span class="pill">PREVIEW / ${previewMode==='3d'?'SCHEMATIC BUILD':esc(group.label.toUpperCase())}</span><span class="demo">${previewMode==='3d'?'NOT MANUFACTURER GEOMETRY':'SOURCED PRODUCT PHOTO'}</span></div><div class="preview-switch" role="group" aria-label="Preview mode"><button data-preview="photo" aria-pressed="${previewMode==='photo'}">Product photo</button><button data-preview="3d" aria-pressed="${previewMode==='3d'}">3D schematic</button></div>${previewMode==='3d'?`<div id="viewer3d" class="viewer-viewport" role="region" aria-label="Schematic 3D bicycle viewer"><p class="viewer-loading" role="status">Loading 3D viewer…</p></div><div class="viewer-toolbar" role="group" aria-label="3D view controls"><button data-view3d="side" disabled>Side</button><button data-view3d="front" disabled>Front</button><button data-view3d="reset" disabled>Reset view</button><button data-zoom3d="in" disabled aria-label="Zoom in">+</button><button data-zoom3d="out" disabled aria-label="Zoom out">−</button><button id="separate-parts" aria-pressed="${Boolean(viewer?viewer.snapshot().expanded:viewerState?.expanded)}" disabled>Separate parts</button></div><p class="viewer-help" id="viewer-help">Drag to rotate · scroll or pinch to zoom · arrow keys rotate when focused.</p><p class="model-disclaimer">Schematic scene: assembly positions and remaining geometry are illustrative. ${Object.keys(modelRegistry.assets).length?'See the scene’s loaded-asset credits and provenance; AI meshes remain approximations.':'No actual product meshes have been supplied.'} Use product photos for real appearance; fit and performance come from verified data, not this scene.</p>`:`<div class="bike is-photo">${picture(preview, 'product-photo', false)}</div><p class="visual-note">${esc(preview.photoCaption)}<br><a href="${esc(preview.photoSource.url)}" target="_blank" rel="noopener noreferrer">Photo/source: ${esc(preview.photoSource.name)} ${arrow}</a></p>`}<div class="stage-bottom"><div><p class="eyebrow">${esc(preview.brand)}</p><h2>${esc(preview.name)}</h2><p>${esc(preview.tag)}</p></div><div class="weight"><strong>${Number.isFinite(preview.weight) ? preview.weight.toFixed(2) : '—'}<small>${Number.isFinite(preview.weight) ? ' kg' : ''}</small></strong><span>${Number.isFinite(preview.weight) ? 'LISTED PART WEIGHT' : 'WEIGHT NOT VERIFIED'}</span></div></div>${preview.weightBasis ? `<p class="weight-basis fine">${esc(preview.weightBasis)}</p>` : ''}<div class="performance">${ratingsPanel(preview, active)}</div></section>
 <section class="config" aria-label="Component configurator"><div class="config-heading"><div><p class="eyebrow">MAKE IT YOURS</p><h2>The build room<span>.</span></h2></div><button id="reset" class="text-button">Reset ↺</button></div><a class="rating-quick-link" href="#build-overview">${overall.blocked?'Resolve component mismatch':`${overall.overall===null?'Provisional':'Overall'} goal match: ${overallValue===null?'Pending':overallValue.toFixed(1)+'/10'}`} <span>View full build rating ↑</span></a>${catalogChanged ? '<p class="catalog-update" role="status">The catalog has changed since your last visit. Please review the selected products and reference variants.</p>' : ''}<div class="tabs" role="tablist" aria-label="Components">${Object.entries(catalog).map(([key, g], i) => `<button role="tab" aria-selected="${key === active}" tabindex="${key === active ? 0 : -1}" aria-controls="options" id="tab-${key}" data-tab="${key}" class="${active === key ? 'selected' : ''}"><span>0${i + 1}</span>${esc(g.label)}</button>`).join('')}</div>
 <div class="options" id="options" role="tabpanel" aria-labelledby="tab-${active}"><div class="option-label"><h3>Choose your ${esc(group.label.toLowerCase())}</h3><span>${group.items.length} OPTIONS</span></div><label class="option-search-label">Find a ${esc(group.label.toLowerCase())}<input type="search" id="option-search" placeholder="Search this category"></label>${active==='wheels'?`<div class="builder-wheel-filters">${['material','depth'].map(key=>`<label>${wheelGroups[key].label}<select data-builder-wheel="wheel_${key}"><option value="">All options</option>${Object.entries(wheelGroups[key].values).filter(([value])=>group.items.some(p=>matchesWheelFilters(p,{['wheel_'+key]:value}))).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></label>`).join('')}</div><a class="fine wheel-explore-link" href="./collection.html?category=wheels">Browse all wheelsets & store offers →</a><p class="fine">Builder options use reviewed Shimano disc-road references. Other standards and packages are available in the full collection for sourcing enquiries.</p>`:''}<p id="option-count" class="fine" role="status"></p><div class="option-scroll">${group.items.map(item => `<button class="option ${selection[active] === item.id ? 'chosen' : ''}" data-part="${item.id}" aria-pressed="${selection[active] === item.id}"><span class="radio"></span>${picture(item, 'option-photo')}<span class="option-info"><strong>${esc(item.name)}</strong><small>${esc(item.tag)}</small><small>${esc(item.pricingLabel)}</small></span><b>${money(item.price)}</b></button>`).join('')}
 </div><button class="add-to-box selected-to-box" data-box-add="${esc(preview.id)}">Add this product to build box +</button><div class="source-links"><p class="eyebrow">SELECTED PRICE SOURCES · ${checkedDate}</p><p class="fine">${esc(preview.priceBasis)} · ${esc(preview.stockNote)}</p>${sourceLinks(preview)}</div></div>
 <div class="compat ${build.errors.length ? 'error' : ''}" role="status">${build.errors.length ? esc(build.errors.join(' ')) : 'Fit requires review · confirm frame size, axle/freehub standards, tire system and all component interfaces.'}</div>${build.warnings.length ? `<details class="build-notes"><summary>Package and compatibility notes (${build.warnings.length})</summary>${build.warnings.map(note => `<p>${esc(note)}</p>`).join('')}</details>` : ''}
 <div class="total"><div><span>${build.unpriced.length ? 'KNOWN LISTED PARTS SUBTOTAL' : 'LISTED PARTS SUBTOTAL'}</span><strong>${money(build.knownSubtotal)}</strong></div><span class="price-note">${7 - build.unpriced.length}/7 categories priced<br>Reference prices · ZAR</span></div>${build.unpriced.length ? `<p class="unpriced-note">${build.unpriced.length} category needs a quote or package confirmation. ${build.parts.drivetrain.controlSystem==='di2-12'?'No duplicate controls price has been added to the Di2 groupset.':'Unconfirmed product prices are not treated as free.'}</p>` : ''}${overBudget ? `<p class="budget-warning" role="status">Listed parts exceed your budget target by ${money(build.knownSubtotal - rider.budgetZar)}, before assembly and delivery.</p>` : ''}<p class="fine subtotal-note">Reference subtotal only. Confirm VAT treatment and any missing parts, rotors, bottom bracket, tubes/sealant, tape, pedals, assembly and delivery.</p>
 <div class="build-actions"><button id="share-build">Share build ↗</button><a href="#build-checklist">Review build checklist ↑</a></div><button class="cta" id="request-quote">Prepare quote request →</button><button class="cta save-build-box" id="save-build-box">Save these 7 products to box +</button>
 <button class="cta" id="quote" ${build.errors.length ? 'disabled' : ''}>Review sourcing brief ${arrow}</button><p class="fine checkout-note">No RCS stock held. No payment taken. Final fit, inclusions, price and availability require a supplier quote.</p></section></div>
 <section class="principles"><div><span>01</span><h3>Start with the ride.</h3><p>Road today. Gravel, mountain and time trial are next on the horizon.</p></div><div><span>02</span><h3>Every choice counts.</h3><p>Real product photos and dated South African price references. Sources stay visible.</p></div><div><span>03</span><h3>Built around you.</h3><p>Export your selections and rider requirements for a sourcing conversation.</p></div></section>
 ${buildRatingMethod()}
 ${ratingMethod}
 <details id="method"><summary>Product sources, prices & compatibility scope</summary><p>The 3D view currently uses schematic geometry, not AI reconstruction or manufacturer CAD. Its dimensions, colours and assembly positions are illustrative. Frame and wheel selections change the schematic; the sourced photographs show actual products. A future GLB asset needs documented provenance, usage and alignment review before display. Neither a schematic nor an AI mesh establishes compatibility, fit, aerodynamic performance or weight.</p><p>Manufacturer product pages and South African retailer listings were reviewed on ${checkedDate}. Manufacturer MSRP and retailer prices are labelled separately. Sizes, colours and package quantities are recorded in the source links; they are reference configurations, not automatic fit recommendations. A retailer listing marked available is not an RCS stock promise. Product photos are credited to their source listings; no brand partnership is claimed.</p><p>The subtotal combines selected reference items and excludes unpriced categories and build extras. Tires are priced as two individual tires; mechanical controls are the sum of left and right kits; cockpits are a bar and stem. The Di2 listing is a groupset with controls described; caliper inclusion and any additional brake cost need confirmation, so that category stays unpriced. Components included in a frameset may be replaced by selected upgrades; review the package notes.</p><p>Control-system mismatches and explicitly sourced maximum tire widths are checked. Full fit still requires size, axle/freehub, brake mount, tire/rim, bottom bracket, headset, cockpit, seatpost and rail review. Product weights use the source’s stated basis; a complete bike weight and performance scores are not inferred.</p></details></main>
 ${siteFooter()}<dialog id="brief" aria-labelledby="brief-title"><div id="brief-content"></div></dialog><dialog id="rider-dialog" aria-labelledby="rider-title" aria-describedby="rider-help"></dialog>`;
 bindControls(build);
 mountBuildBox();
 document.querySelectorAll('a[href="#rating-method"]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#rating-method').open=true;}));
 if(previewMode==='3d'){const host=document.querySelector('#viewer3d');if(viewer){host.replaceWith(viewer.element);viewer.update(build.parts);enable3dControls();}else mount3d(host,build.parts,ticket);}
}

async function mount3d(host,parts,ticket){
 try{
  const {createViewer}=await import('./viewer3d.js');
  if(ticket!==viewerTicket || previewMode!=='3d' || !host.isConnected)return;
  viewer=createViewer(host,parts,{state:viewerState});enable3dControls();host.dataset.ready='true';
 }catch{
  if(ticket===viewerTicket && host.isConnected){host.textContent='3D is unavailable in this browser. Product photos and the builder still work.';host.classList.add('viewer-unavailable');host.setAttribute('role','status');}
 }
}
function enable3dControls(){
 document.querySelectorAll('.viewer-toolbar button').forEach(button=>button.disabled=false);
 const separate=document.querySelector('#separate-parts');if(separate)separate.setAttribute('aria-pressed',String(viewer.snapshot().expanded));
}
function bindControls(build) {
 document.querySelector('#share-build').onclick=()=>openShare(buildLink());
 document.querySelector('#request-quote').onclick=()=>requestBuild(build);
 document.querySelector('#tire-setup').onchange=event=>{settings=normalizeSettings({tireSetup:event.target.value});save();render();document.querySelector('#tire-setup').focus({preventScroll:true});};
 document.querySelector('[data-fix-controls]')?.addEventListener('click',()=>{selection.brakes=catalog.brakes.items.find(p=>p.controlSystem===build.parts.drivetrain.controlSystem).id;save();render();document.querySelector('#checklist-title').setAttribute('tabindex','-1');document.querySelector('#checklist-title').focus({preventScroll:true});});
 document.querySelector('#keep-shared')?.addEventListener('click',()=>{save();render();document.querySelector('#share-build').focus({preventScroll:true});});
 document.querySelector('#discard-shared')?.addEventListener('click',()=>{selection=sharedPreview.selection;settings=sharedPreview.settings;rider={...rider,goal:sharedPreview.goal};sharedPreview=null;history.replaceState(null,'',location.pathname+location.search);render();});
 document.querySelectorAll('[data-build-goal]').forEach(button=>button.onclick=()=>updateRider({...rider,goal:button.dataset.buildGoal},false,`[data-build-goal="${button.dataset.buildGoal}"]`));
 const optionSearch=document.querySelector('#option-search');
 const filterOptions=()=>{
  const query=optionSearch.value.trim().toLocaleLowerCase();let count=0;
  const filters=Object.fromEntries([...document.querySelectorAll('[data-builder-wheel]')].map(s=>[s.dataset.builderWheel,s.value]));
  document.querySelectorAll('[data-part]').forEach(button=>{const p=catalog[active].items.find(p=>p.id===button.dataset.part);button.hidden=!button.textContent.toLocaleLowerCase().includes(query)||(active==='wheels'&&!matchesWheelFilters(p,filters));if(!button.hidden)count++;});
  document.querySelector('#option-count').textContent=count ? `${count} matching options` : 'No matching options. Clear the search to see this category.';
 };

 optionSearch.oninput=filterOptions;document.querySelectorAll('[data-builder-wheel]').forEach(s=>s.onchange=filterOptions);
 document.querySelectorAll('[data-preview]').forEach(button=>button.onclick=()=>{previewMode=button.dataset.preview;render();document.querySelector(`[data-preview="${previewMode}"]`).focus();});
 document.querySelectorAll('[data-view3d]').forEach(button=>button.onclick=()=>viewer?.view(button.dataset.view3d));
 document.querySelectorAll('[data-zoom3d]').forEach(button=>button.onclick=()=>viewer?.zoom(button.dataset.zoom3d==='in'?0.85:1.15));
 const separate=document.querySelector('#separate-parts');if(separate)separate.onclick=()=>{const expanded=viewer?.expand(!viewer.snapshot().expanded);separate.setAttribute('aria-pressed',String(expanded));};
 document.querySelectorAll('[data-tab]').forEach(button => {
  const activate = key => { active = key; render(); document.querySelector(`#tab-${active}`).focus(); };
  button.onclick = () => activate(button.dataset.tab);
  button.onkeydown = event => {
   const keys = Object.keys(catalog), index = keys.indexOf(active);
   const target = { ArrowRight: keys[(index + 1) % keys.length], ArrowLeft: keys[(index + keys.length - 1) % keys.length], Home: keys[0], End: keys.at(-1) }[event.key];
   if (target) { event.preventDefault(); activate(target); }
  };
 });
 document.querySelectorAll('[data-part]').forEach(button => button.onclick = () => { selection[active] = button.dataset.part; save(); render(); document.querySelector(`[data-part="${selection[active]}"]`).focus(); });
 document.querySelector('#reset').onclick = () => { selection = { ...defaults }; settings=normalizeSettings(); save(); render(); document.querySelector('#reset').focus(); };
 document.querySelector('#method').insertAdjacentHTML('beforebegin','<a class="approach-link" href="#method">Our approach & sourcing scope ↓</a>');
 const about=document.querySelector('.approach-link');if(about)about.onclick = () => { document.querySelector('#method').open = true; document.querySelector('#method').scrollIntoView({ behavior: 'smooth' }); };
 document.querySelector('#save-build-box').onclick=()=>saveProductsToBox(Object.values(build.parts).map(p=>p.id));
 document.querySelector('#quote').onclick = () => openBrief(build);
 document.querySelector('#edit-rider').onclick = () => openRider(rider, next => updateRider(next), () => updateRider({ ...riderDefaults }, true));
 document.querySelectorAll('img').forEach(img => img.onerror = () => {
  const fallback = document.createElement('span'); fallback.className = 'photo-fallback'; fallback.textContent = 'Photo unavailable — view source listing'; img.replaceWith(fallback);
 });
}
function save() { keepShared();try { localStorage.setItem('rcs-build', JSON.stringify(selection));localStorage.setItem(settingsKey,JSON.stringify(settings)); } catch {} }
function updateRider(next, clear = false, focusSelector='#edit-rider') {
 if(sharedPreview)save();rider = next; let stored = true;
 try { if (clear) localStorage.removeItem('rcs-rider'); else localStorage.setItem('rcs-rider', JSON.stringify(rider)); } catch { stored = false; }
 render(); document.querySelector(focusSelector).focus({preventScroll:true});
 document.querySelector('#rider-status').textContent = stored ? (clear ? 'Saved rider details cleared.' : 'Rider details saved in this browser.') : 'Details updated for this visit. Browser storage is unavailable.';
}
function openBrief(build) {
 const dialog = document.querySelector('#brief');
 document.querySelector('#brief-content').innerHTML = `<button id="close" class="close" aria-label="Close summary">×</button><p class="eyebrow">YOUR NEXT CHAPTER</p><h2 id="brief-title">Your road build.</h2><p>A sourcing brief, not an order. Price sources checked ${checkedDate}. Final fit, inclusions and costs require confirmation.</p><h3 class="brief-subheading">Rider requirements</h3><dl class="brief-rider">${riderRows(rider).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><p class="fine">Measurements are supplied by the rider. Frame size and fit require review. Budget is a target, not a quote.</p>${buildRatingPanel(build,rider.goal).replaceAll('box-build-overview','brief-build-overview').replaceAll('box-rating-title','brief-rating-title')}<h3 class="brief-subheading">Selected components</h3><dl>${Object.entries(build.parts).map(([key, p]) => `<div><dt>${esc(catalog[key].label)} · ${esc(p.pricingLabel)}</dt><dd>${esc(p.name)}<span>${money(p.price)}</span></dd></div>`).join('')}</dl><div class="brief-total"><span>Known listed parts subtotal</span><strong>${money(build.knownSubtotal)}</strong></div><p class="fine">${build.unpriced.length ? `${build.unpriced.length} category remains unpriced. ` : ''}Excludes build extras; confirm VAT, missing parts, assembly and delivery. No request is sent or stored on a server.</p><button class="cta" id="brief-request">Prepare quote request →</button><button class="cta" id="download">Download sourcing brief <span aria-hidden="true">↓</span></button>`;
 document.querySelector('#close').onclick = () => dialog.close();
 document.querySelector('#brief-request').onclick=()=>{dialog.close();requestBuild(build);};
 document.querySelector('#download').onclick = () => {
  const url = URL.createObjectURL(new Blob([briefText(build, rider)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'rcs-road-build.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
 };
 dialog.showModal();
}
render();
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#build=')){loadShared();render();}});

window.addEventListener('pagehide',()=>{++viewerTicket;if(viewer){viewerState=viewer.snapshot();viewer.dispose();viewer=null;} });
window.addEventListener('pageshow',event=>{if(event.persisted)render();});

import { catalog, money } from './catalog.js';
import { categoryLabels } from './product-records.js';
import { boxStorageKey, maxBoxQuantity, normalizeBox, boxSnapshot, addToBox, setBoxQuantity, removeFromBox, summarizeBox, boxText } from './build-box.js';
import { validateRider } from './rider.js';
import { escapeHtml as esc, externalArrow } from './view-utils.js';
import { buildRatingPanel } from './build-ratings-ui.js';

let items=[], initialized=false, expanded=false, storageAvailable=true, statusTimer;
function load() {
 try { items=normalizeBox(JSON.parse(localStorage.getItem(boxStorageKey))); } catch { items=[]; }
}
function persist() {
 try { localStorage.setItem(boxStorageKey,JSON.stringify(boxSnapshot(items)));storageAvailable=true; }
 catch { storageAvailable=false; }
}
function announce(message) {
 const status=document.querySelector('#box-status');if(status){clearTimeout(statusTimer);status.textContent=message+(storageAvailable?'':' Saved for this visit only; browser storage is unavailable.');statusTimer=setTimeout(()=>{status.textContent='';},6000);}
}
export function saveProductsToBox(ids) {
 if(!initialized)mountBuildBox();
 for(const id of ids)items=addToBox(items,id,false);
 persist();refresh();announce('Current build added to your box. Existing saved quantities are preserved.');
 openBox();
}
function refresh(preserveProducts=false) {
 const box=summarizeBox(items);
 let goal='allround';try{goal=JSON.parse(localStorage.getItem('rcs-rider'))?.goal||goal;}catch{}
 const ratingBuild={parts:Object.fromEntries(box.components.map(row=>[row.category,row.product])),errors:box.errors,unpriced:box.unpriced.filter(row=>row.category!=='bike').map(row=>row.product)};
 document.querySelectorAll('[data-box-count]').forEach(node=>node.textContent=box.packageCount);
 const dock=document.querySelector('#box-dock-label');if(dock)dock.textContent=`Build box · ${box.packageCount} package${box.packageCount===1?'':'s'}`;
 const dialog=document.querySelector('#build-box-dialog');if(!dialog)return;
 dialog.classList.toggle('box-expanded',expanded);
 const markup=`<div class="box-heading"><div><p class="eyebrow">YOUR PRODUCTS. YOUR NEXT RIDE.</p><h2 id="box-title" tabindex="-1">Your build box<span>.</span></h2></div><button class="box-close" aria-label="Close build box">×</button></div>
 <p class="box-intro">${box.rows.length?`${box.rows.length} saved product lines · ${box.packageCount} packages. Quantities use each product’s listed package.`:'Choose products from the collection or save the current configurator build to get started.'} ${storageAvailable?'Saved in this browser.':'Browser storage is unavailable; saved for this visit only.'}</p>
 <div class="box-top-actions"><button class="box-expand" aria-pressed="${expanded}">${expanded?'Compact view':'Expand box'}</button><a href="./collection.html">Keep exploring →</a></div>
 <p class="box-status" id="box-dialog-status" role="status"></p>
 <div class="box-layout"><div class="box-products">${box.rows.length?box.rows.map(row=>`<article class="box-row" data-box-row="${esc(row.productId)}"><img src="${esc(row.product.image)}" alt="${esc(row.product.name)}"><div class="box-row-info"><p class="eyebrow">${esc(categoryLabels[row.category])}</p><h3>${esc(row.product.name)}</h3><p>${esc(row.product.priceBasis)}</p><small>${esc(row.product.pricingLabel)} · ${money(row.product.price)} per package</small><a href="${esc(row.product.sources[0].url)}" target="_blank" rel="noopener noreferrer">Source & reference variant ${externalArrow}</a><div class="box-quantity"><button data-box-dec="${esc(row.productId)}" aria-label="Decrease quantity for ${esc(row.product.name)}" ${row.quantity===1?'disabled':''}>−</button><label><span class="sr-only">Packages of ${esc(row.product.name)}</span><input type="number" inputmode="numeric" min="1" max="${maxBoxQuantity}" step="1" value="${row.quantity}" data-box-quantity="${esc(row.productId)}"></label><button data-box-inc="${esc(row.productId)}" aria-label="Increase quantity for ${esc(row.product.name)}" ${row.quantity===maxBoxQuantity?'disabled':''}>+</button><span>package${row.quantity===1?'':'s'}</span></div></div><div class="box-row-end"><strong>${money(Number.isFinite(row.product.price)?row.quantity*row.product.price:null)}</strong><button data-box-remove="${esc(row.productId)}" aria-label="Remove ${esc(row.product.name)}">Remove</button></div></article>`).join(''):'<div class="box-empty"><span aria-hidden="true">＋</span><h3>A fresh start.</h3><p>Add a frame, wheels or a complete bike. Your saved choices will appear here.</p><a class="cta" href="./collection.html">Explore the collection →</a></div>'}</div>
 <aside class="box-summary" aria-label="Build box summary"><p class="eyebrow">THE BIG PICTURE</p><div class="box-totals"><p><span>Known component subtotal</span><strong>${money(box.componentSubtotal)}</strong></p><p><span>Known complete-bike subtotal</span><strong>${money(box.bikeSubtotal)}</strong></p><p class="box-grand"><span>Known reference subtotal</span><strong>${money(box.knownSubtotal)}</strong></p></div>${box.unpriced.length?`<p class="box-warning">${box.unpriced.length} product line${box.unpriced.length===1?'':'s'} unpriced. Final total requires a quote; these are not free products.</p>`:''}
 <details class="box-checklist" open><summary>${Object.keys(catalog).length-box.missing.length}/${Object.keys(catalog).length} builder categories represented</summary><ul>${Object.keys(catalog).map(key=>`<li><span>${esc(categoryLabels[key])}</span><b>${box.missing.includes(key)?'Missing':box.alternatives.includes(key)?'Alternatives':'Saved'}</b></li>`).join('')}</ul></details>
 ${box.canApply&&!box.missing.length?buildRatingPanel(ratingBuild,goal):'<p class="fine">An overall goal match appears here for one package in all seven component categories, without alternatives or detected conflicts.</p>'}
 ${[...box.errors,...box.warnings].map(note=>`<p class="box-warning">${esc(note)}</p>`).join('')}
 <p class="fine">Complete bikes and components are separate saved products. A full category checklist does not confirm a complete or compatible bicycle. Reference prices exclude unpriced parts and build extras.</p>
 <button class="cta box-export" ${box.rows.length?'':'disabled'}>Download sourcing list ↓</button><button class="box-apply" ${box.canApply?'':'disabled'}>Use box components in builder →</button><p class="fine">Transfers one package per component category. Other builder selections stay as they are. Complete bikes stay in the box.</p><button class="box-clear" ${box.rows.length?'':'disabled'}>Clear build box</button>
 <p class="fine">No RCS stock reserved or payment taken. Confirm VAT, fit, inclusions, availability, missing parts, assembly and delivery.</p></aside></div>`;
 if(preserveProducts) {
  const template=document.createElement('template');template.innerHTML=markup;
  for(const selector of ['.box-intro','.box-summary'])dialog.querySelector(selector).replaceWith(template.content.querySelector(selector));
  for(const row of box.rows){
   const element=dialog.querySelector(`[data-box-row="${row.productId}"]`);
   element.querySelector('.box-row-end strong').textContent=money(Number.isFinite(row.product.price)?row.quantity*row.product.price:null);
   element.querySelector('[data-box-inc]').disabled=row.quantity===maxBoxQuantity;
   element.querySelector('[data-box-dec]').disabled=row.quantity===1;
  }
 }else dialog.innerHTML=markup;
 dialog.querySelector('.box-close').onclick=()=>dialog.close();
 dialog.querySelector('.box-expand').onclick=event=>{expanded=!expanded;dialog.classList.toggle('box-expanded',expanded);event.currentTarget.setAttribute('aria-pressed',String(expanded));event.currentTarget.textContent=expanded?'Compact view':'Expand box';};
 function change(next,message,focus,preserve=false) {items=next;persist();refresh(preserve);if(!preserve)dialog.querySelector(focus||'#box-title')?.focus({preventScroll:true});dialog.querySelector('#box-dialog-status').textContent=message+(storageAvailable?'':' Browser storage is unavailable; this change lasts for this visit.');announce(message);}
 dialog.querySelectorAll('[data-box-inc]').forEach(button=>button.onclick=()=>{const id=button.dataset.boxInc,row=items.find(item=>item.productId===id);if(!row)return;change(setBoxQuantity(items,id,row.quantity+1),'Quantity updated.',`[data-box-quantity="${id}"]`);});
 dialog.querySelectorAll('[data-box-dec]').forEach(button=>button.onclick=()=>{const id=button.dataset.boxDec,row=items.find(item=>item.productId===id);if(!row)return;change(setBoxQuantity(items,id,row.quantity-1),'Quantity updated.',`[data-box-quantity="${id}"]`);});
 dialog.querySelectorAll('[data-box-quantity]').forEach(input=>input.onchange=()=>{
  const value=Number(input.value),id=input.dataset.boxQuantity;
  if(!items.some(item=>item.productId===id))return;
  if(!Number.isInteger(value)||value<1||value>maxBoxQuantity){input.value=items.find(item=>item.productId===id).quantity;dialog.querySelector('#box-dialog-status').textContent=`Enter a whole package quantity from 1 to ${maxBoxQuantity}.`;return;}
  change(setBoxQuantity(items,id,value),'Quantity updated.',null,true);
 });
 dialog.querySelectorAll('[data-box-remove]').forEach(button=>button.onclick=()=>change(removeFromBox(items,button.dataset.boxRemove),'Product removed.'));
 dialog.querySelector('.box-clear').onclick=()=>change([],'Build box cleared.');
 dialog.querySelector('.box-apply').onclick=()=>{
  if(!box.canApply)return;
  try { let previous={};try{previous=JSON.parse(localStorage.getItem('rcs-build'))||{};}catch{}localStorage.setItem('rcs-build',JSON.stringify({...previous,...box.selection})); }
  catch {dialog.querySelector('#box-dialog-status').textContent='Could not save builder selections. Browser storage must be available to transfer between pages.';return;}
  window.location.assign('./index.html#builder');
 };
 dialog.querySelector('.box-export').onclick=()=>{
  let rider;
  try {const parsed=validateRider(JSON.parse(localStorage.getItem('rcs-rider')));if(!Object.keys(parsed.errors).length)rider=parsed.value;}catch{}
  const url=URL.createObjectURL(new Blob([boxText(items,rider)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='rcs-build-box.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
}
function openBox() { refresh();document.querySelector('#build-box-dialog').showModal(); }
export function mountBuildBox() {
 if(initialized){refresh();return;}
 initialized=true;load();
 document.body.insertAdjacentHTML('beforeend','<dialog id="build-box-dialog" aria-labelledby="box-title"></dialog><div class="box-dock"><span id="box-status" role="status" aria-live="polite"></span><button data-box-open><span id="box-dock-label">Build box</span><span aria-hidden="true">↑</span></button></div>');
 document.addEventListener('click',event=>{
  const opener=event.target.closest('[data-box-open]');if(opener){openBox();return;}
  const add=event.target.closest('[data-box-add]');if(!add)return;
  if(items.some(item=>item.productId===add.dataset.boxAdd&&item.quantity===maxBoxQuantity)){announce(`This product is already at the ${maxBoxQuantity}-package limit.`);return;}
  items=addToBox(items,add.dataset.boxAdd);persist();refresh();
  const row=items.find(item=>item.productId===add.dataset.boxAdd);if(!row)return;add.textContent='Added to build box +';announce('Product added to your build box.');
 });
 window.addEventListener('storage',event=>{if(event.key===boxStorageKey||event.key===null){load();refresh();}});
 window.addEventListener('pageshow',event=>{if(event.persisted){load();refresh();}});
 refresh();
}

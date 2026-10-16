import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';
import { browserSection, mountCatalog } from './product-browser.js';
import { siteHeader, siteFooter } from './site-shell.js';
import { ratingMethod } from './ratings-ui.js';
import {planKey,normalizePlan} from './build-plan.js';
import { mountBuildBox } from './build-box-ui.js';

document.querySelector('#app').innerHTML=`${siteHeader('collection')}<main class="collection-page"><a class="back-home" href="./index.html">← Back to the build room</a>${browserSection()}<p class="fine">Save reference products to your shortlist to compare alternatives, adjust package quantities and download a sourcing list. Use “Use in bike builder” in product details to equip a component. MSRP and retailer references are labelled separately. Supply and final prices require confirmation.</p>${ratingMethod}</main>${siteFooter()}`;
mountBuildBox();
mountCatalog(document.querySelector('#catalog-browser'),(category,id)=>{
 try {
  let saved={};try{saved=JSON.parse(localStorage.getItem('rcs-build'))||{};}catch{}
  let raw;try{raw=JSON.parse(localStorage.getItem(planKey));}catch{}const plan=normalizePlan(raw||{chosen:Object.keys(saved)});if(category==='chain')plan.chain=id;else if(category==='extras')plan.extras=[...new Set([...plan.extras,id])];else plan.chosen=[...new Set([...plan.chosen,category])];delete plan.choices[id];delete plan.requests[id];
  localStorage.setItem(planKey,JSON.stringify(normalizePlan(plan)));
  if(category!=='chain'&&category!=='extras')localStorage.setItem('rcs-build',JSON.stringify({...saved,[category]:id}));
  location.assign('./index.html#builder');
 }catch{
  const status=document.querySelector('.catalog-count');status.textContent='Browser storage is unavailable. Enable storage to transfer a selection to the builder; product details and the build box still work for this visit.';
 }
});
document.querySelectorAll('a[href="#rating-method"]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#rating-method').open=true;}));

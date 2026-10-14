import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';
import { browserSection, mountCatalog } from './product-browser.js';
import { siteHeader, siteFooter } from './site-shell.js';
import { ratingMethod } from './ratings-ui.js';
import { mountBuildBox } from './build-box-ui.js';

document.querySelector('#app').innerHTML=`${siteHeader('collection')}<main class="collection-page"><a class="back-home" href="./index.html">← Back to the build room</a>${browserSection()}<p class="fine">Add products to your build box to keep alternatives, adjust package quantities and download a sourcing list. MSRP and retailer references are labelled separately. Supply and final prices require confirmation.</p>${ratingMethod}</main>${siteFooter()}`;
mountBuildBox();
mountCatalog(document.querySelector('#catalog-browser'),(category,id)=>{
 try {
  let saved={};try{saved=JSON.parse(localStorage.getItem('rcs-build'))||{};}catch{}
  localStorage.setItem('rcs-build',JSON.stringify({...saved,[category]:id}));
  location.assign('./index.html#builder');
 }catch{
  const status=document.querySelector('.catalog-count');status.textContent='Browser storage is unavailable. Enable storage to transfer a selection to the builder; product details and the build box still work for this visit.';
 }
});
document.querySelectorAll('a[href="#rating-method"]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#rating-method').open=true;}));

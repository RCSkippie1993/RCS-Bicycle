import { escapeHtml as esc } from './view-utils.js';

export function openShare(url){
 let dialog=document.querySelector('#share-dialog');
 if(!dialog){document.body.insertAdjacentHTML('beforeend','<dialog id="share-dialog" aria-labelledby="share-title"></dialog>');dialog=document.querySelector('#share-dialog');}
 dialog.innerHTML=`<button class="close" aria-label="Close sharing">×</button><p class="eyebrow">YOUR BUILD, ANYWHERE</p><h2 id="share-title">Share this build.</h2><p>The link includes your seven products, riding goal and tire setup. Rider measurements, budget and contact details stay out of the link.</p><label class="request-text-label" for="share-url">Build link<input id="share-url" readonly value="${esc(url)}"></label><button class="cta" id="copy-build-link">Copy build link</button><p id="share-status" role="status"></p><p class="fine">Prices and available products may change. This link does not reserve stock or confirm compatibility.</p>`;
 dialog.querySelector('.close').onclick=()=>dialog.close();
 dialog.querySelector('#copy-build-link').onclick=async()=>{try{await navigator.clipboard.writeText(url);dialog.querySelector('#share-status').textContent='Build link copied.';}catch{dialog.querySelector('#share-url').select();dialog.querySelector('#share-status').textContent='Copy the selected build link. Clipboard access is unavailable.';}};
 dialog.showModal();
}

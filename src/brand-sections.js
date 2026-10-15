import {escapeHtml as esc} from './view-utils.js';

export function frameBrandGroups(records){
 const groups=new Map();
 for(const row of records){
  if(row.category!=='frame')continue;
  const brand=row.product.brand;
  if(!groups.has(brand))groups.set(brand,[]);
  groups.get(brand).push(row);
 }
 return [...groups].sort(([a],[b])=>a.localeCompare(b,'en-ZA')).map(([brand,rows])=>({brand,rows,id:'frame-brand-'+brand.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}));
}

export function frameBrandsView(groups,expanded,card){
 if(!groups.length)return '';
 return `<nav class="frame-brand-index" aria-label="Frameset brands" id="frame-brands"><div><p class="eyebrow">FIND YOUR FRAME MAKER</p><h3>Explore by brand.</h3><p>Jump to a range. Your search and filters apply to every brand below.</p></div><ul>${groups.map(g=>`<li><a href="#${g.id}">${esc(g.brand)}<span>${g.rows.length}<span class="sr-only"> matching frame references</span></span></a></li>`).join('')}</ul></nav><div class="frame-brand-sections">${groups.map(g=>{
  const open=expanded.has(g.brand),visible=open?g.rows:g.rows.slice(0,3);
  return `<section class="frame-brand-section" aria-labelledby="${g.id}"><div class="frame-brand-heading"><div><p class="eyebrow">FRAMESETS / ${esc(g.brand.toUpperCase())}</p><h3 id="${g.id}" tabindex="-1">${esc(g.brand)}<span>.</span></h3><p>${g.rows.length} matching reference${g.rows.length===1?'':'s'}${visible.length<g.rows.length?` · showing ${visible.length}`:''}</p></div><div class="frame-brand-actions">${g.rows.length>3?`<button data-brand-expand="${g.id}" aria-expanded="${open}" aria-controls="${g.id}-products">${open?'Show fewer':`Show all ${g.rows.length}`}<span class="sr-only"> ${esc(g.brand)} frame references</span></button>`:''}<a href="#frame-brands">Back to brands ↑</a></div></div><div class="catalog-grid" id="${g.id}-products">${visible.map(row=>card(row,'h4')).join('')}</div></section>`;
 }).join('')}</div>`;
}

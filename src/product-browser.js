import {productSpecsView} from './product-specs-ui.js';
import { money, checkedDate, displayDate, wheelCoverage } from './catalog.js';
import { wheelGroups, wheelFacet, matchesWheelFilters } from './wheel-filters.js';
import { frameFocusLabels, frameFocus, matchesFrameFilter } from './frame-filters.js';
import { frameDetails } from './frame-ui.js';
import { frameBrandGroups,frameBrandsView } from './brand-sections.js';
import { productRatings } from './ratings.js';
import { ratingsPanel } from './ratings-ui.js';
import { escapeHtml as esc, externalArrow } from './view-utils.js';

import { productRecords, categoryLabels as labels } from './product-records.js';
export { productRecords } from './product-records.js';
const emptyFilters={query:'',category:'',brand:'',pricing:'',sort:'featured',limit:12,frame_focus:'',wheel_store:'',...Object.fromEntries(Object.keys(wheelGroups).map(k=>['wheel_'+k,'']))};
const state = {...emptyFilters};

export function filterProducts(records, filters) {
 const query = (filters.query || '').trim().toLocaleLowerCase();
 const result = records.filter(({category,product:p}) =>
  (!filters.category || category === filters.category) && (!filters.brand || p.brand === filters.brand) &&
  (!filters.pricing || (filters.pricing==='price-pending' ? !Number.isFinite(p.price) : p.sources.some(s => s.kind === filters.pricing))) &&
  (category==='wheels'?matchesWheelFilters(p,filters):!Object.keys(emptyFilters).filter(k=>k.startsWith('wheel_')).some(k=>filters[k])) &&
  (category==='frame'?matchesFrameFilter(p,filters.frame_focus):!filters.frame_focus) &&
  (!query || `${p.name} ${p.brand} ${p.tag} ${labels[category]}`.toLocaleLowerCase().includes(query)));
 if (filters.sort === 'price-asc' || filters.sort === 'price-desc') result.sort((a,b) => {
  if (!Number.isFinite(a.product.price)) return Number.isFinite(b.product.price) ? 1 : 0;
  if (!Number.isFinite(b.product.price)) return -1;
  return (a.product.price - b.product.price) * (filters.sort === 'price-desc' ? -1 : 1);
 });
 if (filters.sort === 'name') result.sort((a,b) => a.product.name.localeCompare(b.product.name));
 if(filters.category==='frame'&&(!filters.sort||filters.sort==='featured')){
  // Surface brand variety immediately instead of placing every original Specialized frame first.
  const groups=new Map();for(const row of result){if(!groups.has(row.product.brand))groups.set(row.product.brand,[]);groups.get(row.product.brand).push(row);}
  const mixed=[];while(mixed.length<result.length)for(const rows of groups.values())if(rows.length)mixed.push(rows.shift());
  return mixed;
 }
 return result;
}

function productCard({category,product:p},heading='h3'){
   const r=productRatings(p,category)[0];
   return `<article class="catalog-card"><button class="product-open product-image-button" data-product="${esc(p.id)}" aria-label="View ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async"></button><div class="catalog-card-content"><p class="eyebrow">${esc(labels[category])} · ${esc(p.brand)}</p><${heading}>${esc(p.name)}</${heading}><p class="catalog-tag">${esc(p.tag)}</p>${['wheels','frame'].includes(category)?`<p class="fine wheel-listing-status">${esc(p.stockNote)}${p.listingCondition==='demo'?' · DEMO':''}</p>`:''}<strong class="catalog-price">${money(p.price)}</strong><small>${esc(p.pricingLabel)} · ${esc(p.priceBasis)}</small><p class="rating-chip">Budget accessibility <b>${r.score === null ? 'Pending' : r.score+'/10'}</b></p><p class="fine photo-credit">Photo: ${esc(p.photoSource.name)}</p><button class="product-open product-details" data-product="${esc(p.id)}">Details, ratings & sources ${externalArrow}</button><button class="add-to-box" data-box-add="${esc(p.id)}">Save to shortlist +</button></div></article>`;

}

export const browserSection = () => `<section id="product-catalog" class="product-catalog" aria-labelledby="catalog-heading"><div class="section-heading"><div><p class="eyebrow">${productRecords.length} SOURCED REFERENCES · SOUTH AFRICA</p><h2 id="catalog-heading">Explore the collection.</h2></div><p>Real product photos. Dated ZAR prices.<br>Open a product for its profile and evidence.</p></div><a class="frame-explore-link" href="./collection.html?category=frame">Browse ${productRecords.filter(r=>r.category==='frame').length} frameset references →</a><a class="wheel-explore-link" href="./collection.html?category=wheels">Explore ${productRecords.filter(r=>r.category==='wheels').length} wheelset references from ${wheelCoverage.stores.length} SA retailers →</a><div id="catalog-browser"></div></section>`;

function wheelDetails(p){
 if(!p.wheelSpecs)return '';
 return `<section class="wheel-details"><h3>Wheelset specifications</h3><dl>${Object.entries(wheelGroups).map(([key,group])=>`<div><dt>${group.label}</dt><dd>${esc(group.values[wheelFacet(p,key)]||'Unconfirmed')}${key==='depth'&&p.wheelSpecs.depthMm!==null?` · ${esc(Array.isArray(p.wheelSpecs.depthMm)?p.wheelSpecs.depthMm.join(' / '):p.wheelSpecs.depthMm)} mm`:''}</dd></div>`).join('')}</dl>${p.builderNote?`<p class="box-warning">${esc(p.builderNote)}</p>`:''}${p.listingCondition==='demo'?'<p class="box-warning">Retailer demo listing. Confirm condition, warranty and actual supplied wheels.</p>':''}<details><summary>Evidence behind these specifications</summary>${Object.entries(p.wheelEvidence||{}).map(([key,s])=>`<p><b>${esc(wheelGroups[key]?.label||(key==='depthMm'?'Rim depth':key))}</b>: ${esc(s.excerpt)}<br><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Listing evidence ↗</a></p>`).join('')}<p class="fine">Unconfirmed fields have no reviewed specification. No speed, stiffness or complete-build compatibility is inferred from a model name.</p></details></section>`;
}

export function mountCatalog(host, onChoose) {
 const params=new URLSearchParams(location.search);
 if(params.has('category') && Object.hasOwn(labels,params.get('category')))state.category=params.get('category');
 for(const key of Object.keys(wheelGroups)){const value=params.get('wheel_'+key);if(Object.hasOwn(wheelGroups[key].values,value))state['wheel_'+key]=value;}
 if(Object.hasOwn(frameFocusLabels,params.get('frame_focus')))state.frame_focus=params.get('frame_focus');
 const brands = [...new Set(productRecords.map(r => r.product.brand))].sort();
 host.innerHTML = `<form class="catalog-filters" role="search" aria-label="Search product catalog"><label class="search-field">Search products<input type="search" name="query" placeholder="Try 105, carbon, Pirelli…" value="${esc(state.query)}"></label><label>Category<select name="category"><option value="">All categories</option>${Object.entries(labels).map(([k,v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label><label>Brand<select name="brand"><option value="">All brands</option>${brands.map(v=>`<option>${esc(v)}</option>`).join('')}</select></label><label>Price source<select name="pricing"><option value="">All sources</option><option value="manufacturer-msrp">Manufacturer MSRP</option><option value="retailer-listing">SA retailer listings</option><option value="price-pending">SA price / package pending</option></select></label><label>Sort<select name="sort"><option value="featured">Collection order</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name A–Z</option></select></label><button type="button" class="filter-clear">Clear filters</button></form><p class="fine catalog-count" role="status" aria-live="polite"></p><div class="catalog-results"></div><button type="button" class="load-more">Show more products</button><dialog class="product-dialog" aria-labelledby="product-title"></dialog>`;
 const wheelRecords=productRecords.filter(r=>r.category==='wheels');
 const frameRecords=productRecords.filter(r=>r.category==='frame');
 host.querySelector('form').insertAdjacentHTML('afterend',`<section class="frame-browse" aria-labelledby="frame-browse-title"><p class="eyebrow">THE START OF YOUR NEXT BUILD</p><h3 id="frame-browse-title">More frames. More possibilities.</h3><p>${frameRecords.length} frameset references across ${new Set(frameRecords.map(r=>r.product.brand)).size} brands. Compare source prices, package contents and reference variants before choosing your frame.</p><label for="frame-focus">Choose a riding focus<select id="frame-focus" name="frame_focus"><option value="">All frame purposes</option>${Object.entries(frameFocusLabels).map(([key,label])=>`<option value="${key}">${label} (${frameRecords.filter(r=>frameFocus(r.product)===key).length})</option>`).join('')}</select></label><p class="fine">Groups describe the source’s intended use, not measured speed or quality. Frame-only and frame-and-fork packages have different inclusions. Exact sizing, fit, availability and unpriced extras need supplier confirmation.</p></section>`);
 host.querySelector('form').insertAdjacentHTML('afterend',`<section class="wheel-browse" aria-labelledby="wheel-browse-title"><div><p class="eyebrow">FIND YOUR NEXT UPGRADE</p><h3 id="wheel-browse-title">Wheelsets, your way.</h3><p>${wheelRecords.length} listing references · ${wheelCoverage.stores.length} SA retailers · reviewed ${displayDate(wheelCoverage.reviewedAt)}. Separate store offers can refer to the same model. Availability and prices require confirmation.</p></div><div class="wheel-shortcuts"><button data-wheel-shortcut="">All wheelsets</button><button data-wheel-shortcut="carbon">Carbon</button><button data-wheel-shortcut="alloy">Alloy</button><button data-wheel-shortcut="gravel">All-road & gravel</button><button data-wheel-shortcut="rim">Rim brake</button></div><div class="wheel-filters">${Object.entries(wheelGroups).map(([key,group])=>`<label>${group.label}<select name="wheel_${key}"><option value="">All ${group.label.toLowerCase()}</option>${Object.entries(group.values).map(([value,label])=>`<option value="${value}">${label} (${wheelRecords.filter(r=>wheelFacet(r.product,key)===value).length})</option>`).join('')}</select></label>`).join('')}<label>SA retailer<select name="wheel_store"><option value="">All reviewed stores</option>${wheelCoverage.stores.map(s=>`<option>${esc(s)}</option>`).join('')}</select></label></div><p class="fine">Rim depth groups describe dimensions, not measured speed or climbing performance. Clincher does not automatically mean tubeless-ready. Collection-only variants need supplier review before use in this road builder.</p><details class="wheel-coverage"><summary>Research coverage & exclusions</summary><p>Reviewed public listings from ${esc(wheelCoverage.stores.join(', '))}. This is a dated research snapshot, not every wheelset or every South African store.</p><p>Unclear front/rear packages, missing usable photos, duplicate exact listings and conflicting specifications were held back. Prices can include unavailable or demo listings, clearly identified in product details.</p>${wheelCoverage.alsoChecked.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>: ${esc(s.result)}</p>`).join('')}</details></section>`);
 const expandedBrands=new Set();
 const form = host.querySelector('form');form.onsubmit = e => e.preventDefault();
 for (const key of ['category','brand','pricing','sort']) form.elements[key].value=state[key];
 function results() {
  host.querySelector('.wheel-browse').hidden=state.category!==''&&state.category!=='wheels';
  host.querySelector('.frame-browse').hidden=state.category!=='frame';host.querySelector('#frame-focus').value=state.frame_focus;
  host.querySelectorAll('.wheel-filters select').forEach(input=>input.value=state[input.name]);
  const all=filterProducts(productRecords,state),grouped=state.category==='frame',groups=grouped?frameBrandGroups(all):[],visible=all.slice(0,state.limit);
  const displayed=grouped?groups.reduce((n,g)=>n+(expandedBrands.has(g.brand)?g.rows.length:Math.min(3,g.rows.length)),0):visible.length;
  form.elements.sort.parentElement.firstChild.textContent=grouped?'Sort within each brand':'Sort';
  host.querySelector('.catalog-count').textContent=all.length ? `Showing ${displayed} of ${all.length} references${grouped?` across ${groups.length} brand${groups.length===1?'':'s'}`:''} · prices checked ${checkedDate} · no RCS stock held` : 'No products match these filters. Try a broader search or clear filters.';
  host.querySelector('.catalog-results').innerHTML=grouped?frameBrandsView(groups,expandedBrands,productCard):`<div class="catalog-grid">${visible.map(row=>productCard(row)).join('')}</div>`;
  host.querySelectorAll('[data-brand-expand]').forEach(button=>button.onclick=()=>{
   const group=groups.find(g=>g.id===button.dataset.brandExpand);if(!group)return;
   if(expandedBrands.has(group.brand))expandedBrands.delete(group.brand);else expandedBrands.add(group.brand);
   const id=button.dataset.brandExpand;results();host.querySelector(`[data-brand-expand="${id}"]`)?.focus({preventScroll:true});
  });
  const more=host.querySelector('.load-more');more.hidden=grouped||visible.length===all.length;more.textContent=`Show more products (${all.length-visible.length} remaining)`;
  host.querySelectorAll('[data-product]').forEach(button=>button.onclick=()=>openProduct(productRecords.find(r=>r.product.id===button.dataset.product)));
  host.querySelectorAll('.catalog-grid img').forEach(img=>img.onerror=()=>{img.alt='Photo unavailable. Open details for the source listing.';});
 }
 function openProduct({category,product:p}) {
  const dialog=host.querySelector('.product-dialog');
  dialog.innerHTML=`<button class="close" aria-label="Close product">×</button><p class="eyebrow">${esc(labels[category])} · ${esc(p.brand)}</p><h2 id="product-title">${esc(p.name)}</h2><img class="detail-photo" src="${esc(p.image)}" alt="${esc(p.name)}"><p>${esc(p.tag)}</p><strong class="catalog-price">${money(p.price)}</strong><p>${esc(p.pricingLabel)} · ${esc(p.priceBasis)}<br>${esc(p.stockNote)} · checked ${displayDate(p.verification.reviewedAt)}</p><p class="fine">${esc(p.photoCaption)} · Photo: <a href="${esc(p.photoSource.url)}" target="_blank" rel="noopener noreferrer">${esc(p.photoSource.name)} ${externalArrow}</a></p>${p.weightBasis ? `<p class="fine">${p.weight === null ? '' : p.weight+' kg · '}${esc(p.weightBasis)}</p>` : ''}${p.fitNote ? `<p class="fine">${esc(p.fitNote)}</p>` : ''}${ratingsPanel(p,category)}<div class="source-links"><p class="eyebrow">PRICE & VARIANT EVIDENCE</p>${p.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(s.name)} · ${s.referenceOnly ? (s.referenceNote||'Package reference only') : s.quantity+' × '+money(s.unitPrice)}<small>${esc(s.variant)}</small></span>${externalArrow}</a>`).join('')}</div><button class="cta" data-box-add="${esc(p.id)}">Save to shortlist +</button>${category !== 'bike' ? '<button class="product-use-builder choose-product">Use in bike builder →</button>' : '<p class="fine">Complete-bike reference only. It is not added to your custom component subtotal. Confirm exact specification, fit and supply with the listing source.</p>'}`;
  dialog.querySelector('.close').onclick=()=>dialog.close();
  dialog.querySelectorAll('a[href="#rating-method"]').forEach(a=>a.onclick=()=>{dialog.close();document.querySelector('#rating-method').open=true;});
  dialog.querySelector('.source-links').insertAdjacentHTML('beforebegin',productSpecsView(p));
  if(category==='wheels')dialog.querySelector('.source-links').insertAdjacentHTML('beforebegin',wheelDetails(p));
  if(category==='frame')dialog.querySelector('.source-links').insertAdjacentHTML('beforebegin',frameDetails(p));
  const choose=dialog.querySelector('.choose-product');if(choose){if(p.buildEligible===false)choose.remove();else choose.onclick=()=>{dialog.close();onChoose(category,p.id);};}
  dialog.showModal();
 }
 const update=event=>{if(event.target.name in state){state[event.target.name]=event.target.value;state.limit=12;if(event.target.name==='category'&&event.target.value!=='frame')state.frame_focus='';if(event.target.name==='category'&&event.target.value!=='wheels')for(const key of Object.keys(state).filter(k=>k.startsWith('wheel_')))state[key]='';results();}};
 form.oninput=event=>{if(event.target.type==='search')update(event);};
 form.onchange=event=>{if(event.target.tagName==='SELECT')update(event);};
 host.querySelector('.wheel-filters').onchange=event=>{state[event.target.name]=event.target.value;state.category='wheels';state.frame_focus='';state.limit=12;form.elements.category.value='wheels';results();};
 host.querySelector('#frame-focus').onchange=event=>{state.frame_focus=event.target.value;state.limit=12;results();};
 host.querySelectorAll('[data-wheel-shortcut]').forEach(button=>button.onclick=()=>{Object.assign(state,emptyFilters,{category:'wheels'});const v=button.dataset.wheelShortcut;if(v)state['wheel_'+(v==='gravel'?'usage':v==='rim'?'brake':'material')]=v;form.reset();form.elements.category.value='wheels';results();});
 host.querySelector('.filter-clear').onclick=()=>{Object.assign(state,emptyFilters);form.reset();results();form.elements.query.focus();};
 host.querySelector('.load-more').onclick=()=>{state.limit+=12;results();};
 results();
 function focusBrandFromHash(){
  if(state.category!=='frame'||!location.hash.startsWith('#frame-brand-'))return;
  const group=frameBrandGroups(filterProducts(productRecords,state)).find(g=>'#'+g.id===location.hash);
  if(!group)return;
  requestAnimationFrame(()=>{const heading=document.getElementById(group.id);heading?.focus({preventScroll:true});heading?.scrollIntoView({block:'start'});});
 }
 window.addEventListener('hashchange',focusBrandFromHash);focusBrandFromHash();
 const requested=productRecords.find(row=>row.product.id===params.get('product'));if(requested)openProduct(requested);
}

export function collectionPreview() {
 const featured=[productRecords.find(r=>r.category==='bike'),productRecords.find(r=>r.product.id==='allez-sprint'),productRecords.find(r=>r.product.id==='rd38')];
 return `<section class="collection-preview" id="collection-preview" aria-labelledby="collection-preview-title"><div class="section-heading"><div><p class="eyebrow">A TASTE OF WHAT’S NEXT · ${productRecords.length} SOURCED REFERENCES</p><h2 id="collection-preview-title">Explore the collection.</h2></div><a class="collection-link" href="./collection.html">View full collection ${externalArrow}</a></div><div class="catalog-grid preview-grid">${featured.map(({category,product:p})=>`<article class="catalog-card"><a class="product-image-button" href="./collection.html?product=${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></a><div class="catalog-card-content"><p class="eyebrow">${esc(labels[category])} · ${esc(p.brand)}</p><h3>${esc(p.name)}</h3><strong class="catalog-price">${money(p.price)}</strong><small>${esc(p.pricingLabel)} · ${esc(p.priceBasis)}</small><a class="product-details" href="./collection.html?product=${esc(p.id)}">Details & ratings ${externalArrow}</a><button class="add-to-box" data-box-add="${esc(p.id)}">Save to shortlist +</button></div></article>`).join('')}</div><div class="category-links" aria-label="Browse product categories">${Object.entries(labels).map(([key,label])=>`<a href="./collection.html?category=${key}">${esc(label)} <span>${productRecords.filter(r=>r.category===key).length}</span></a>`).join('')}</div><p class="fine">Real source photos and dated South African prices. Reference listings, not RCS inventory or selling offers.</p></section>`;
}

import { money, checkedDate } from './catalog.js';
import { productRatings } from './ratings.js';
import { ratingsPanel } from './ratings-ui.js';
import { escapeHtml as esc, externalArrow } from './view-utils.js';

import { productRecords, categoryLabels as labels } from './product-records.js';
export { productRecords } from './product-records.js';
const state = { query: '', category: '', brand: '', pricing: '', sort: 'featured', limit: 12 };

export function filterProducts(records, filters) {
 const query = (filters.query || '').trim().toLocaleLowerCase();
 const result = records.filter(({category,product:p}) =>
  (!filters.category || category === filters.category) && (!filters.brand || p.brand === filters.brand) &&
  (!filters.pricing || p.sources.some(s => s.kind === filters.pricing)) &&
  (!query || `${p.name} ${p.brand} ${p.tag} ${labels[category]}`.toLocaleLowerCase().includes(query)));
 if (filters.sort === 'price-asc' || filters.sort === 'price-desc') result.sort((a,b) => {
  if (!Number.isFinite(a.product.price)) return Number.isFinite(b.product.price) ? 1 : 0;
  if (!Number.isFinite(b.product.price)) return -1;
  return (a.product.price - b.product.price) * (filters.sort === 'price-desc' ? -1 : 1);
 });
 if (filters.sort === 'name') result.sort((a,b) => a.product.name.localeCompare(b.product.name));
 return result;
}

export const browserSection = () => `<section id="product-catalog" class="product-catalog" aria-labelledby="catalog-heading"><div class="section-heading"><div><p class="eyebrow">${productRecords.length} SOURCED REFERENCES · SOUTH AFRICA</p><h2 id="catalog-heading">Explore the collection.</h2></div><p>Real product photos. Dated ZAR prices.<br>Open a product for its profile and evidence.</p></div><div id="catalog-browser"></div></section>`;

export function mountCatalog(host, onChoose) {
 const params=new URLSearchParams(location.search);
 if(params.has('category') && Object.hasOwn(labels,params.get('category')))state.category=params.get('category');
 const brands = [...new Set(productRecords.map(r => r.product.brand))].sort();
 host.innerHTML = `<form class="catalog-filters" role="search" aria-label="Search product catalog"><label class="search-field">Search products<input type="search" name="query" placeholder="Try 105, carbon, Pirelli…" value="${esc(state.query)}"></label><label>Category<select name="category"><option value="">All categories</option>${Object.entries(labels).map(([k,v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label><label>Brand<select name="brand"><option value="">All brands</option>${brands.map(v=>`<option>${esc(v)}</option>`).join('')}</select></label><label>Price source<select name="pricing"><option value="">All sources</option><option value="manufacturer-msrp">Manufacturer MSRP</option><option value="retailer-listing">SA retailer listings</option></select></label><label>Sort<select name="sort"><option value="featured">Collection order</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name A–Z</option></select></label><button type="button" class="filter-clear">Clear filters</button></form><p class="fine catalog-count" role="status" aria-live="polite"></p><div class="catalog-grid"></div><button type="button" class="load-more">Show more products</button><dialog class="product-dialog" aria-labelledby="product-title"></dialog>`;
 const form = host.querySelector('form');form.onsubmit = e => e.preventDefault();
 for (const key of ['category','brand','pricing','sort']) form.elements[key].value=state[key];
 function results() {
  const all=filterProducts(productRecords,state), visible=all.slice(0,state.limit);
  host.querySelector('.catalog-count').textContent=all.length ? `Showing ${visible.length} of ${all.length} references · prices checked ${checkedDate} · no RCS stock held` : 'No products match these filters. Try a broader search or clear filters.';
  host.querySelector('.catalog-grid').innerHTML=visible.map(({category,product:p}) => {
   const r=productRatings(p,category)[0];
   return `<article class="catalog-card"><button class="product-open product-image-button" data-product="${esc(p.id)}" aria-label="View ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async"></button><div class="catalog-card-content"><p class="eyebrow">${esc(labels[category])} · ${esc(p.brand)}</p><h3>${esc(p.name)}</h3><p class="catalog-tag">${esc(p.tag)}</p><strong class="catalog-price">${money(p.price)}</strong><small>${esc(p.pricingLabel)} · ${esc(p.priceBasis)}</small><p class="rating-chip">Budget accessibility <b>${r.score === null ? 'Pending' : r.score+'/10'}</b></p><p class="fine photo-credit">Photo: ${esc(p.photoSource.name)}</p><button class="product-open product-details" data-product="${esc(p.id)}">Details, ratings & sources ${externalArrow}</button><button class="add-to-box" data-box-add="${esc(p.id)}">Add to build box +</button></div></article>`;
  }).join('');
  const more=host.querySelector('.load-more');more.hidden=visible.length===all.length;more.textContent=`Show more products (${all.length-visible.length} remaining)`;
  host.querySelectorAll('[data-product]').forEach(button=>button.onclick=()=>openProduct(productRecords.find(r=>r.product.id===button.dataset.product)));
  host.querySelectorAll('.catalog-grid img').forEach(img=>img.onerror=()=>{img.alt='Photo unavailable. Open details for the source listing.';});
 }
 function openProduct({category,product:p}) {
  const dialog=host.querySelector('.product-dialog');
  dialog.innerHTML=`<button class="close" aria-label="Close product">×</button><p class="eyebrow">${esc(labels[category])} · ${esc(p.brand)}</p><h2 id="product-title">${esc(p.name)}</h2><img class="detail-photo" src="${esc(p.image)}" alt="${esc(p.name)}"><p>${esc(p.tag)}</p><strong class="catalog-price">${money(p.price)}</strong><p>${esc(p.pricingLabel)} · ${esc(p.priceBasis)}<br>${esc(p.stockNote)} · checked ${checkedDate}</p><p class="fine">${esc(p.photoCaption)} · Photo: <a href="${esc(p.photoSource.url)}" target="_blank" rel="noopener noreferrer">${esc(p.photoSource.name)} ${externalArrow}</a></p>${p.weightBasis ? `<p class="fine">${p.weight === null ? '' : p.weight+' kg · '}${esc(p.weightBasis)}</p>` : ''}${p.fitNote ? `<p class="fine">${esc(p.fitNote)}</p>` : ''}${ratingsPanel(p,category)}<div class="source-links"><p class="eyebrow">PRICE & VARIANT EVIDENCE</p>${p.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(s.name)} · ${s.referenceOnly ? 'Package reference only' : s.quantity+' × '+money(s.unitPrice)}<small>${esc(s.variant)}</small></span>${externalArrow}</a>`).join('')}</div><button class="cta" data-box-add="${esc(p.id)}">Add to build box +</button>${category !== 'bike' ? '<button class="product-use-builder choose-product">Use in bike builder →</button>' : '<p class="fine">Complete-bike reference only. It is not added to your custom component subtotal. Confirm exact specification, fit and supply with the listing source.</p>'}`;
  dialog.querySelector('.close').onclick=()=>dialog.close();
  dialog.querySelectorAll('a[href="#rating-method"]').forEach(a=>a.onclick=()=>{dialog.close();document.querySelector('#rating-method').open=true;});
  const choose=dialog.querySelector('.choose-product');if(choose)choose.onclick=()=>{dialog.close();onChoose(category,p.id);};
  dialog.showModal();
 }
 const update=event=>{if(event.target.name in state){state[event.target.name]=event.target.value;state.limit=12;results();}};
 form.oninput=event=>{if(event.target.type==='search')update(event);};
 form.onchange=event=>{if(event.target.tagName==='SELECT')update(event);};
 host.querySelector('.filter-clear').onclick=()=>{Object.assign(state,{query:'',category:'',brand:'',pricing:'',sort:'featured',limit:12});form.reset();results();form.elements.query.focus();};
 host.querySelector('.load-more').onclick=()=>{state.limit+=12;results();};
 results();
 const requested=productRecords.find(row=>row.product.id===params.get('product'));if(requested)openProduct(requested);
}

export function collectionPreview() {
 const featured=[productRecords.find(r=>r.category==='bike'),productRecords.find(r=>r.product.id==='allez-sprint'),productRecords.find(r=>r.product.id==='rd38')];
 return `<section class="collection-preview" id="collection-preview" aria-labelledby="collection-preview-title"><div class="section-heading"><div><p class="eyebrow">A TASTE OF WHAT’S NEXT · ${productRecords.length} SOURCED REFERENCES</p><h2 id="collection-preview-title">Explore the collection.</h2></div><a class="collection-link" href="./collection.html">View full collection ${externalArrow}</a></div><div class="catalog-grid preview-grid">${featured.map(({category,product:p})=>`<article class="catalog-card"><a class="product-image-button" href="./collection.html?product=${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></a><div class="catalog-card-content"><p class="eyebrow">${esc(labels[category])} · ${esc(p.brand)}</p><h3>${esc(p.name)}</h3><strong class="catalog-price">${money(p.price)}</strong><small>${esc(p.pricingLabel)} · ${esc(p.priceBasis)}</small><a class="product-details" href="./collection.html?product=${esc(p.id)}">Details & ratings ${externalArrow}</a><button class="add-to-box" data-box-add="${esc(p.id)}">Add to build box +</button></div></article>`).join('')}</div><div class="category-links" aria-label="Browse product categories">${Object.entries(labels).map(([key,label])=>`<a href="./collection.html?category=${key}">${esc(label)} <span>${productRecords.filter(r=>r.category===key).length}</span></a>`).join('')}</div><p class="fine">Real source photos and dated South African prices. Reference listings, not RCS inventory or selling offers.</p></section>`;
}

import '@fontsource/barlow-condensed/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './style.css';
import './guided.css';
import {catalog,defaults,evaluate,money,completeBikes} from './catalog.js';
import {siteHeader,siteFooter} from './site-shell.js';
import {escapeHtml as esc,externalArrow} from './view-utils.js';
import {sharedBuildUrl} from './build-share.js';
import {mountBuildBox} from './build-box-ui.js';
const ideas=[
 {name:'The everyday road build',frame:'allez-sprint',wheels:'r470',goal:'allround',text:'An alloy race-purpose frame and listed alloy wheel pair. A starting specification to edit; confirm all interfaces and missing finishing parts.'},
 {name:'The aero-minded build',frame:'winspace-t1600',wheels:'rd50',goal:'race',text:'An aero-purpose carbon frame and 50 mm carbon wheels. Deeper rims do not establish a watt saving; crosswind handling and fit need review.'},
 {name:'The climbing-minded build',frame:'winspace-slc3',wheels:'rd38',goal:'climbing',text:'A lightweight-purpose frame paired with listed 1.42 kg wheels. Frame package mass is unverified; this is a specification idea, not a measured complete-bike weight.'},
];
document.querySelector('#app').innerHTML=`${siteHeader('builds')}<main><div class="lab-ideas-hero"><p class="lab-kicker">ROAD / COMPLETE BIKES & BUILD IDEAS</p><h1>Find your<br><em>starting point.</em></h1><p class="lede">Explore complete-bike source references, or open an editable configuration.<br>These are RCS suggestions. No customer builds or completed orders are claimed.</p><a class="back-home" href="./index.html#builder">← Start your own build</a></div><section class="lab-build-ideas" aria-label="Suggested configurations">${ideas.map(idea=>{
 const selection={...defaults,frame:idea.frame,wheels:idea.wheels},b=evaluate(selection),p=b.parts.frame,href=sharedBuildUrl(selection,idea.goal,{},location.href);
 return `<article class="lab-build-idea"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div><p class="lab-kicker">EDITABLE SUGGESTION / NOT AN ASSEMBLED PHOTO</p><h2>${esc(idea.name)}</h2><p>${esc(idea.text)}</p><p>${esc(p.name)}<br>${esc(b.parts.wheels.name)}</p><strong>${money(b.knownSubtotal)}</strong><p class="lab-muted">Known core-package reference subtotal. Finishing parts, full fit, assembly and supply need confirmation. Frame photo credited to ${esc(p.photoSource.name)}; it may illustrate a different build.</p><a class="lab-primary" href="${esc(href)}">Open & customise →</a></div></article>`;
}).join('')}</section><section class="collection-preview"><div class="section-heading"><div><p class="eyebrow">COMPLETE ROAD BIKES / SOURCE REFERENCES</p><h2>Ready-built inspiration.</h2></div><a class="collection-link" href="./collection.html?category=bike">Browse all ${completeBikes.length} complete bikes ${externalArrow}</a></div><div class="catalog-grid">${completeBikes.slice(0,6).map(p=>`<article class="catalog-card"><a class="product-image-button" href="./collection.html?product=${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></a><div class="catalog-card-content"><p class="eyebrow">${esc(p.brand)}</p><h3>${esc(p.name)}</h3><strong class="catalog-price">${money(p.price)}</strong><p class="fine">${esc(p.pricingLabel)} · source reference, not RCS inventory. Photo: ${esc(p.photoSource.name)}.</p><a class="product-details" href="./collection.html?product=${esc(p.id)}">View exact variant & sources ${externalArrow}</a></div></article>`).join('')}</div></section></main>${siteFooter()}`;
mountBuildBox();

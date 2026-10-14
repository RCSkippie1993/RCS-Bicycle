import { externalArrow } from './view-utils.js';
import { checkedDate } from './catalog.js';

export function siteHeader(page='home') {
 return `<header><a class="brand" href="./index.html">RCS<span> BICYCLE</span><i>${externalArrow}</i></a><nav aria-label="Main navigation"><a href="./collection.html" ${page==='collection'?'class="current" aria-current="page"':''}>Collection</a><a href="./index.html#builder" ${page==='home'?'class="current"':''}>Bike builder</a><button class="nav-box" data-box-open>Build box <span data-box-count>0</span></button></nav><span class="location">SOUTH AFRICA · ZAR</span></header>`;
}
export function siteFooter() {
 return `<footer><a class="brand" href="./index.html">RCS<span> BICYCLE</span></a><span>Build your ride. / South Africa</span><span>PRICES CHECKED · ${checkedDate}</span></footer>`;
}

import { externalArrow } from './view-utils.js';
import { checkedDate } from './catalog.js';

export function siteHeader(page='home') {
 return `<header><a class="brand" href="./index.html">RCS<span> BICYCLE</span><i>${externalArrow}</i></a><nav aria-label="Main navigation"><a href="${page==='mountain'?'./mountain.html?view=collection':'./collection.html'}" ${page==='collection'?'class="current" aria-current="page"':''}>Product collection</a><a href="./index.html#builder" ${page==='home'?'class="current"':''}>Road builder</a><a href="./mountain.html" ${page==='mountain'?'class="current" aria-current="page"':''}>MTB builder</a><a href="${page==='mountain'?'./mountain.html?view=collection&category=bike':'./builds.html'}" ${page==='builds'?'class="current" aria-current="page"':''}>${page==='mountain'?'Complete MTBs':'Build ideas'}</a>${page==='mountain'?'':'<button class="nav-box" data-box-open>Saved products <span data-box-count>0</span></button>'}</nav><span class="location">SOUTH AFRICA · ZAR</span></header>`;
}
export function siteFooter(date=checkedDate) {
 return `<footer><a class="brand" href="./index.html">RCS<span> BICYCLE</span></a><span>Build your ride. / South Africa</span><span>PRICES CHECKED · ${date}</span></footer>`;
}

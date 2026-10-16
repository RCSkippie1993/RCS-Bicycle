import {escapeHtml as esc} from './view-utils.js';
const textValue=value=>value===null||value===undefined?'Unconfirmed':typeof value==='object'?Object.hasOwn(value,'value')?textValue(value.value):JSON.stringify(value):String(value);
export function productSpecsView(p){
 const specs=p.productSpecs||{},evidence=p.productEvidence||{};
 const rows=Object.entries(specs);
 if(!rows.length&&!Object.keys(evidence).length)return '';
 return `<section class="source-specifications"><h3>${p.referenceSpecsOnly?'Reference':'Listed'} specifications</h3>${p.referenceSpecsOnly?'<p class="fine">These facts describe the recorded reference; changed SKU measurements and interfaces need confirmation unless separately stated.</p>':''}<dl>${rows.map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(textValue(value))}</dd></div>`).join('')}</dl>${Object.keys(evidence).length?`<details><summary>Specification sources</summary>${Object.entries(evidence).map(([key,fact])=>`<p><b>${esc(key)}</b>: ${esc(textValue(fact?.excerpt??fact))}${fact?.url?` <a href="${esc(fact.url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`:''}</p>`).join('')}</details>`:''}</section>`;
}

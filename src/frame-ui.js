import { frameFocusLabels,frameFocus } from './frame-filters.js';
import { escapeHtml as esc } from './view-utils.js';

export function frameDetails(product){
 const p=product,s=p.frameSpecs;
 if(!s)return '';
 const rows=[['RCS purpose classification',frameFocusLabels[frameFocus(p)]],['Material',s.material||'Not documented for this exact reference'],['Brake type',s.brake==='rim'?'Rim brake':s.brake==='disc'?'Disc brake':'Supplier confirmation required'],['Reference size / colour',s.sizeNote],['Tire clearance',s.clearance],['Listed package',s.package]];
 return `<section class="frame-details" aria-label="Frameset package and specifications"><h3>Know your frameset.</h3><dl>${rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${p.builderNote?`<p class="box-warning">${esc(p.builderNote)}</p>`:''}<p class="fine">The pictured build does not establish package contents. Reference sizes are not fit recommendations. Purpose groups are editorial classifications, not tested performance ratings.</p><details><summary>Package & specification evidence</summary>${Object.entries(p.frameEvidence||{}).map(([key,e])=>`<p><b>${esc(key)}</b>: ${esc(e.excerpt)}<br><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">View listing evidence ↗</a></p>`).join('')}</details></section>`;
}

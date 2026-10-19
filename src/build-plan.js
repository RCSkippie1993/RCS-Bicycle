import data from './guided-data.json' with {type:'json'};
import {catalog, evaluate, money,chainOffers,extraOffers,optionRegister,featureRegister} from './catalog.js';
import {resolvePackages,chainCompatibility} from './product-packages.js';
import {inspectParts} from './compatibility.js';
import {inspectFinishing} from './finishing-checks.js';

export const planKey='rcs-build-plan';
export const coreSteps=['frame','wheels','tires','drivetrain','brakes','cockpit','saddle'];
export const buildSteps=[...coreSteps,'chain','extras','review'];
export const stepLabels={frame:'Frameset',wheels:'Wheelset',tires:'Tyres',drivetrain:'Drivetrain',brakes:'Brakes & levers',cockpit:'Handlebar & stem',saddle:'Saddle',chain:'Chain',extras:'Finishing extras',review:'Review build'};
export {chainOffers,extraOffers,optionRegister,featureRegister};
export const research=data.research;
const own=(o,k)=>o&&Object.hasOwn(o,k);
const cleanText=t=>typeof t==='string'?t.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,60):'';
export const maxExtraQuantity=20;
const packageQuantity=value=>Number.isInteger(value)&&value>=1&&value<=maxExtraQuantity?value:1;
export const extraQuantity=(plan,id)=>packageQuantity(own(plan?.extraQuantities,id)?plan.extraQuantities[id]:1);
export const lineTotal=p=>Number.isFinite(p?.price)?p.price*packageQuantity(p.quantity):null;
export function normalizePlan(raw={}){
 const chosen=coreSteps.filter(k=>Array.isArray(raw?.chosen)&&raw.chosen.includes(k));
 const choices={},requests={};
 if(raw?.choices&&typeof raw.choices==='object')for(const[id,values]of Object.entries(raw.choices)){
  const spec=Object.hasOwn(optionRegister,id)?optionRegister[id]:null;if(!spec||!values||typeof values!=='object')continue;
  const safe=Object.fromEntries(spec.fields.filter(f=>f.values.includes(values[f.key])).map(f=>[f.key,values[f.key]]));
  if(Object.keys(safe).length)choices[id]=safe;
 }
 if(raw?.requests&&typeof raw.requests==='object')for(const[id,values]of Object.entries(raw.requests)){
  if(!Object.values(catalog).some(g=>g.items.some(p=>p.id===id))||!values)continue;
  const safe=Object.fromEntries(['size','colour'].map(k=>[k,cleanText(values[k])]).filter(([,v])=>v));if(Object.keys(safe).length)requests[id]=safe;
 }
 const extras=extraOffers.filter(p=>Array.isArray(raw?.extras)&&raw.extras.includes(p.id)).map(p=>p.id);
 const extraQuantities=Object.fromEntries(extras.map(id=>[id,extraQuantity(raw,id)]).filter(([,quantity])=>quantity>1));
 return{version:1,chosen,choices,requests,chain:chainOffers.some(p=>p.id===raw?.chain)?raw.chain:'included',chainMode:raw?.chainMode==='spare'?'spare':'replacement',extras,extraQuantities};
}
export function configureProduct(product,rawPlan){
 const plan=normalizePlan(rawPlan),spec=optionRegister[product.id],changes=plan.choices[product.id]||{};
 const requested=plan.requests[product.id];
 if(!spec&&!requested)return product;
 const values=spec?{...spec.reference,...changes}:{};
 const sku=spec?.skus.find(s=>spec.fields.every(f=>s.values[f.key]===values[f.key]));
 const changed=spec&&spec.fields.some(f=>values[f.key]!==spec.reference[f.key]);
 let p={...product,chosenOptions:values,variantNote:requested?`Requested ${Object.entries(requested).map(([k,v])=>k+': '+v).join('; ')}. Exact variant, supply and price require confirmation.`:sku?`Source variant: ${sku.title}. Availability needs confirmation.`:'Requested combination: supplier must confirm this combination, price and supply.',requestedOptions:requested||{},weight:changed||requested?null:product.weight};
 if(changed||requested){
  p.price=requested?null:sku?.price??null;
  p.referenceSpecsOnly=true;
  if(sku&&!requested){const baseName=product.configurationName||(product.variant&&product.name.endsWith(' · '+product.variant)?product.name.slice(0,-(' · '+product.variant).length):null);if(baseName)p.name=baseName+' · '+sku.title;p.variant=sku.title;Object.assign(p,Object.fromEntries(Object.entries(sku.facts||{}).filter(([key])=>['width','tireFacts','compatibility','frameFacts','frameSpecs','productSpecs','weight','weightBasis'].includes(key))));}
  if(sku&&!requested)p.tag=sku.title+' · source variant';
  if(sku?.stemUrl&&!requested)p.priceBasis='Handlebar '+sku.values.size+' + separately sourced stem '+sku.stemVariant;
  p.pricingLabel=Number.isFinite(p.price)?'SA variant price reference':'Variant quote required';
  if(sku&&!requested){
   p.sources=product.sources.map((s,i)=>i===0?{...s,url:sku.url,variant:sku.title,unitPrice:sku.sourceUnitPrice??sku.barPrice??sku.price,checkedAt:spec.checkedAt,listedAvailable:sku.listedAvailable}:i===1&&sku.stemUrl?{...s,url:sku.stemUrl,variant:sku.stemVariant,unitPrice:sku.stemPrice,checkedAt:spec.checkedAt,listedAvailable:sku.stemAvailable}:s);
   p.stockNote=sku.listedAvailable===false||sku.stemAvailable===false?'Source variant listed unavailable; sourcing required':'Source variant only; reconfirm exact size, colour and supply';
  }else p.sources=product.sources.map(s=>({...s,referenceOnly:true,referenceNote:'Base reference only; requested combination price unconfirmed'}));
 }
 if(product.id==='winspace-agile'&&values.size==='Medium')p.maxTire=28;
 return p;
}
export function guidedBuild(selection,rawPlan,settings={}){
 const plan=normalizePlan(rawPlan),base=evaluate(selection,settings);
 const parts=resolvePackages(Object.fromEntries(plan.chosen.map(key=>[key,configureProduct(catalog[key].items.find(p=>p.id===selection[key])||catalog[key].items[0],plan)])));
 const additionalLines=extraOffers.filter(p=>plan.extras.includes(p.id)).map(raw=>({...configureProduct(raw,plan),quantity:extraQuantity(plan,raw.id),role:'Optional extra'}));
 const rawChain=chainOffers.find(p=>p.id===plan.chain),chain=rawChain?configureProduct(rawChain,plan):null,chainChecks=[];
 if(chain){
  additionalLines.unshift({...chain,quantity:1,role:plan.chainMode==='spare'?'Spare chain · not installed':'Installed chain selection'});
  if(plan.chainMode==='replacement'&&parts.drivetrain){
   const included=parts.drivetrain.sources.find(s=>s.url.includes('shimano-slx-m7100-12-speed-mtb-chain')&&!s.referenceOnly);
   if(included){parts.drivetrain={...parts.drivetrain,price:parts.drivetrain.price-included.unitPrice*included.quantity,sources:parts.drivetrain.sources.filter(s=>s!==included),name:parts.drivetrain.name+' (chain selected separately)',priceBasis:`${parts.drivetrain.sources.length-1} drivetrain source lines; selected chain priced separately`};}
   else if(parts.drivetrain.includedCategories?.includes('chain')){additionalLines[0].role='Replacement chain · extra purchase; packaged chain retained';}
   else additionalLines.push({id:'chain-package-review',name:'Bundled chain contents / replacement credit',price:null,sources:[],role:'Supplier package check',weight:null});
   const check=chainCompatibility(parts.drivetrain,chain);
   chainChecks.push({id:'chain-system',title:'Selected chain & drivetrain',status:check.status,detail:check.detail,sources:chain.sources.map(s=>({sourceUrl:s.url,excerpt:chain.kind,checkedAt:s.checkedAt}))});
  }
 }
 const compatibility=inspectParts(parts,settings),finishing=inspectFinishing(parts,additionalLines,compatibility.settings);compatibility.checks.push(...chainChecks,...finishing.checks);compatibility.requiredExtras.push(...finishing.notes);compatibility.errors=compatibility.checks.filter(c=>c.status==='conflict').map(c=>c.detail);for(const k of ['matched','conflict','review'])compatibility.counts[k]=compatibility.checks.filter(c=>c.status===k).length;
 const rows=[...Object.values(parts),...additionalLines],unpriced=rows.filter(p=>!Number.isFinite(p.price)),knownSubtotal=rows.reduce((n,p)=>n+(lineTotal(p)??0),0);
 return{...base,parts,plan,additionalLines,unpriced,knownSubtotal,price:unpriced.length?null:knownSubtotal,compatibility,errors:compatibility.errors,warnings:Object.values(parts).flatMap(p=>[p.fitNote,p.variantNote].filter(Boolean)),complete:coreSteps.every(k=>parts[k]),missing:coreSteps.filter(k=>!parts[k])};
}
export function planText(build){
 if(!build.plan)return '';
 return ['BUILD CONFIGURATION',...Object.values(build.parts).flatMap(p=>[p.variantNote||'',...Object.entries(p.chosenOptions||{}).map(([k,v])=>`${p.name} · ${k}: ${v}`),...Object.entries(p.requestedOptions||{}).map(([k,v])=>`${p.name} · requested ${k}: ${v} (supplier confirmation)`)]),...build.missing.map(k=>'Not yet selected: '+stepLabels[k]),'CHAIN & FINISHING EXTRAS',build.plan.chain==='included'?'Use source-listed drivetrain chain; exact package contents and installed length need confirmation.':`Selected chain mode: ${build.plan.chainMode}. Itemised mechanical included-chain line is removed only for replacement; no unverified bundle credit is assumed.`,...build.additionalLines.flatMap(p=>[`${p.role}: ${p.name} — ${packageQuantity(p.quantity)} package(s) × ${money(p.price)} = ${money(lineTotal(p))}`,...p.sources.map(s=>`${s.name}: ${s.url} | ${s.variant} | ${s.referenceOnly?'Reference only; price unconfirmed':packageQuantity(p.quantity)*s.quantity+' × '+money(s.unitPrice)} | checked ${s.checkedAt}`),p.variantNote||'',p.fitNote||'',p.weightBasis||'']),'Quantities count copies of the exact source-listed package and selected variant. A package may already contain a pair or set; front/rear sizes and installed quantities need supplier confirmation.'].filter(Boolean).join('\n');
}
// Share only catalog-backed option values. Free-text fit requests stay in this browser/quote.
export function shareablePlan(raw){const {requests,extraQuantities,...safe}=normalizePlan(raw);return Object.keys(extraQuantities).length?{...safe,extraQuantities}:safe;}
export function validSharedPlan(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
 const keys=['version','chosen','choices','chain','chainMode','extras'];if(Object.keys(raw).some(k=>![...keys,'extraQuantities'].includes(k))||keys.some(k=>!own(raw,k)))return false;
 const stable=v=>JSON.stringify(v,(_,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))):value);
 return stable(raw)===stable(shareablePlan(raw));
}

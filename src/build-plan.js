import data from './guided-data.json' with {type:'json'};
import {catalog, evaluate, money} from './catalog.js';
import {inspectParts} from './compatibility.js';

export const planKey='rcs-build-plan';
export const coreSteps=['frame','wheels','tires','drivetrain','brakes','cockpit','saddle'];
export const buildSteps=[...coreSteps,'chain','extras','review'];
export const stepLabels={frame:'Frameset',wheels:'Wheelset',tires:'Tyres',drivetrain:'Drivetrain',brakes:'Brakes & levers',cockpit:'Handlebar & stem',saddle:'Saddle',chain:'Chain',extras:'Finishing extras',review:'Review build'};
export const chainOffers=data.chains,extraOffers=data.extras,optionRegister=data.options,featureRegister=data.features,research=data.research;
const own=(o,k)=>o&&Object.hasOwn(o,k);
const cleanText=t=>typeof t==='string'?t.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,60):'';
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
 return{version:1,chosen,choices,requests,chain:chainOffers.some(p=>p.id===raw?.chain)?raw.chain:'included',chainMode:raw?.chainMode==='spare'?'spare':'replacement',extras:extraOffers.filter(p=>Array.isArray(raw?.extras)&&raw.extras.includes(p.id)).map(p=>p.id)};
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
  if(sku&&!requested)p.tag=sku.title+' · source variant';
  if(sku?.stemUrl&&!requested)p.priceBasis='Handlebar '+sku.values.size+' + PLT stem '+sku.stemVariant;
  p.pricingLabel=Number.isFinite(p.price)?'SA variant price reference':'Variant quote required';
  if(sku&&!requested){
   p.sources=product.sources.map((s,i)=>i===0?{...s,url:sku.url,variant:sku.title,unitPrice:sku.sourceUnitPrice??sku.barPrice??sku.price,checkedAt:spec.checkedAt,listedAvailable:sku.listedAvailable}:i===1&&sku.stemUrl?{...s,url:sku.stemUrl,variant:sku.stemVariant,unitPrice:sku.stemPrice,checkedAt:spec.checkedAt,listedAvailable:sku.stemAvailable}:s);
   p.stockNote=sku.listedAvailable===false?'Source variant listed unavailable; sourcing required':'Source variant only; reconfirm exact size, colour and supply';
  }else p.sources=product.sources.map(s=>({...s,referenceOnly:true,referenceNote:'Base reference only; requested combination price unconfirmed'}));
 }
 if(product.id==='winspace-agile'&&values.size==='Medium')p.maxTire=28;
 return p;
}
export function guidedBuild(selection,rawPlan,settings={}){
 const plan=normalizePlan(rawPlan),base=evaluate(selection,settings);
 const parts=Object.fromEntries(plan.chosen.map(key=>[key,configureProduct(base.parts[key],plan)]));
 const additionalLines=extraOffers.filter(p=>plan.extras.includes(p.id)).map(p=>({...p,quantity:1,role:'Optional extra'}));
 const chain=chainOffers.find(p=>p.id===plan.chain),chainChecks=[];
 if(chain){
  additionalLines.unshift({...chain,quantity:1,role:plan.chainMode==='spare'?'Spare chain · not installed':'Installed chain selection'});
  if(plan.chainMode==='replacement'&&parts.drivetrain){
   const included=parts.drivetrain.sources.find(s=>s.url.includes('shimano-slx-m7100-12-speed-mtb-chain')&&!s.referenceOnly);
   if(included){parts.drivetrain={...parts.drivetrain,price:parts.drivetrain.price-included.unitPrice*included.quantity,sources:parts.drivetrain.sources.filter(s=>s!==included),name:parts.drivetrain.name+' (chain selected separately)',priceBasis:'Four drivetrain items; selected chain priced separately'};}
   else additionalLines.push({id:'chain-package-review',name:'Bundled chain contents / replacement credit',price:null,sources:[],role:'Supplier package check',weight:null});
   const conflict=chain.brand==='SRAM';
   chainChecks.push({id:'chain-system',title:'Selected chain & drivetrain',status:conflict?'conflict':'review',detail:conflict?'SRAM RED Road Flattop has not been approved for the current Shimano HG+ road bundles. Choose the included chain or a reviewed Shimano/KMC option; SRAM AXS drivetrain support is still required.':chain.brand==='KMC'?'The retailer lists Shimano 12-speed compatibility. Confirm the exact Shimano road cassette, chainrings, connector and installed chain length.':'Shimano HG+ 12-speed chain selected. Confirm the exact drivetrain compatibility, correct chain length and new quick-link.',sources:chain.sources.map(s=>({sourceUrl:s.url,excerpt:chain.kind,checkedAt:s.checkedAt}))});
  }
 }
 const compatibility=inspectParts(parts,settings);compatibility.checks.push(...chainChecks);compatibility.errors=compatibility.checks.filter(c=>c.status==='conflict').map(c=>c.detail);for(const k of ['matched','conflict','review'])compatibility.counts[k]=compatibility.checks.filter(c=>c.status===k).length;
 const rows=[...Object.values(parts),...additionalLines],unpriced=rows.filter(p=>!Number.isFinite(p.price)),knownSubtotal=rows.reduce((n,p)=>n+(Number.isFinite(p.price)?p.price:0),0);
 return{...base,parts,plan,additionalLines,unpriced,knownSubtotal,price:unpriced.length?null:knownSubtotal,compatibility,errors:compatibility.errors,warnings:Object.values(parts).flatMap(p=>[p.fitNote,p.variantNote].filter(Boolean)),complete:coreSteps.every(k=>parts[k]),missing:coreSteps.filter(k=>!parts[k])};
}
export function planText(build){
 if(!build.plan)return '';
 return ['BUILD CONFIGURATION',...Object.values(build.parts).flatMap(p=>[p.variantNote||'',...Object.entries(p.chosenOptions||{}).map(([k,v])=>`${p.name} · ${k}: ${v}`),...Object.entries(p.requestedOptions||{}).map(([k,v])=>`${p.name} · requested ${k}: ${v} (supplier confirmation)`)]),...build.missing.map(k=>'Not yet selected: '+stepLabels[k]),'CHAIN & FINISHING EXTRAS',build.plan.chain==='included'?'Use chain included in drivetrain package; Di2 contents need confirmation.':`Selected chain mode: ${build.plan.chainMode}. Itemised mechanical included-chain line is removed only for replacement; no unverified bundle credit is assumed.`,...build.additionalLines.flatMap(p=>[`${p.role}: ${p.name} — ${money(p.price)}`,...p.sources.map(s=>`${s.name}: ${s.url} | ${s.variant} | ${s.quantity} × ${money(s.unitPrice)} | checked ${s.checkedAt}`),p.weightBasis||''])].filter(Boolean).join('\n');
}
// Share only catalog-backed option values. Free-text fit requests stay in this browser/quote.
export function shareablePlan(raw){const {requests,...safe}=normalizePlan(raw);return safe;}
export function validSharedPlan(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
 const keys=['version','chosen','choices','chain','chainMode','extras'];if(Object.keys(raw).some(k=>!keys.includes(k))||keys.some(k=>!own(raw,k)))return false;
 const stable=v=>JSON.stringify(v,(_,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))):value);
 return stable(raw)===stable(shareablePlan(raw));
}

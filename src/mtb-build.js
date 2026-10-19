// Separate MTB state, package accounting and source-limited interface checks.
// Road catalogs, storage and shared-link schemas are intentionally independent.
export const mtbStorageKey='rcs-mtb-build';
export const maxMtbExtraQuantity=20;
export const mtbStepLabels={frame:'Frame',fork:'Suspension fork',shock:'Rear shock',wheels:'Wheelset',frontTire:'Front tyre',rearTire:'Rear tyre',drivetrain:'Drivetrain',brakes:'Brakes',cockpit:'Handlebar & stem',seatpost:'Seatpost',saddle:'Saddle',chain:'Chain',extras:'Finishing extras',review:'Review build'};
export const mtbBaseSteps=['frame','fork','shock','wheels','frontTire','rearTire','drivetrain','brakes','cockpit','seatpost','saddle','chain','extras','review'];
export const mtbCategoryLabels={frame:'Frames',fork:'Forks',shock:'Rear shocks',wheels:'Wheelsets',tires:'Tyres',drivetrain:'Drivetrains',brakes:'Brakes',cockpit:'Cockpits',seatpost:'Seatposts',saddle:'Saddles',chain:'Chains',extras:'Finishing extras',bike:'Complete mountain bikes'};
const categoryFor=key=>['frontTire','rearTire'].includes(key)?'tires':key;
const own=(value,key)=>Boolean(value&&Object.hasOwn(value,key));
const plain=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const quantity=value=>Number.isInteger(value)&&value>=1&&value<=maxMtbExtraQuantity?value:1;
const text=value=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,' ').trim().slice(0,60):'';
const money=value=>finite(value)?new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:2}).format(value):'Quote required';
const stable=value=>JSON.stringify(value,(_,v)=>plain(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const recordsOf=data=>Array.isArray(data)?data:Array.isArray(data?.records)?data.records:[];
const optionsOf=data=>plain(data?.options)?data.options:{};
const proof=e=>Boolean(e&&typeof e.url==='string'&&e.url&&typeof e.excerpt==='string'&&e.excerpt.trim());
export const mtbLineTotal=p=>finite(p?.price)?p.price*quantity(p.quantity):null;
export const mtbExtraQuantity=(plan,id)=>quantity(own(plan?.extraQuantities,id)?plan.extraQuantities[id]:1);

export function mtbCatalog(data){
 return Object.fromEntries(Object.entries(mtbCategoryLabels).map(([key,label])=>[key,{label,items:recordsOf(data).filter(r=>r.category===key&&r.product?.id&&(key==='bike'||r.product.buildEligible!==false)).map(r=>r.product)}]));
}
export function normalizeMtbPlan(raw={},data){
 const catalog=mtbCatalog(data),selection={},choices={},requests={},options=optionsOf(data);
 for(const key of mtbBaseSteps.filter(k=>!['chain','extras','review'].includes(k))){
  const id=raw?.selection?.[key];if(catalog[categoryFor(key)]?.items.some(p=>p.id===id))selection[key]=id;
 }
 // Complete-bike source variants may be inspected/quoted without becoming donor components.
 const eligible=new Map(Object.values(catalog).flatMap(g=>g.items.map(p=>[p.id,p])));
 if(plain(raw?.choices))for(const[id,values]of Object.entries(raw.choices)){
  if(!eligible.has(id)||!own(options,id)||!plain(values))continue;
  const fields=options[id].fields||[],safe=Object.fromEntries(fields.filter(f=>Array.isArray(f.values)&&f.values.includes(values[f.key])).map(f=>[f.key,values[f.key]]));
  if(Object.keys(safe).length)choices[id]=safe;
 }
 if(plain(raw?.requests))for(const[id,values]of Object.entries(raw.requests)){
  if(!eligible.has(id)||!plain(values))continue;
  const safe=Object.fromEntries(['size','colour'].map(k=>[k,text(values[k])]).filter(([,v])=>v));if(Object.keys(safe).length)requests[id]=safe;
 }
 const extras=catalog.extras.items.filter(p=>Array.isArray(raw?.extras)&&raw.extras.includes(p.id)).map(p=>p.id);
 const extraQuantities=Object.fromEntries(extras.map(id=>[id,mtbExtraQuantity(raw,id)]).filter(([,n])=>n>1));
 return{version:1,selection,choices,requests,chain:catalog.chain.items.some(p=>p.id===raw?.chain)?raw.chain:'included',extras,extraQuantities,tireSetup:['tubes','tubeless'].includes(raw?.tireSetup)?raw.tireSetup:'unsure'};
}

export function configureMtbProduct(product,rawPlan,data){
 const plan=normalizeMtbPlan(rawPlan,data),spec=own(optionsOf(data),product.id)?optionsOf(data)[product.id]:null,requested=plan.requests[product.id];
 const values=spec?{...spec.reference,...plan.choices[product.id]}:{},fields=spec?.fields||[];
 const sku=spec?.skus?.find(s=>fields.every(f=>s.values?.[f.key]===values[f.key]));
 const changed=Boolean(spec&&fields.some(f=>values[f.key]!==spec.reference?.[f.key]));
 let p={...product,chosenOptions:values,requestedOptions:requested||{}};
 if(!changed&&!requested)return p;
 p={...p,weight:null,referenceSpecsOnly:true,variantNote:requested?`Requested ${Object.entries(requested).map(([k,v])=>k+': '+v).join('; ')}. Exact package, fit, price and supply require confirmation.`:sku?`Source variant: ${sku.title}. Confirm actual supply and remaining interfaces.`:'Requested combination has no reviewed exact SKU; package and price require supplier confirmation.'};
 if(requested||!sku){p.price=null;p.sources=(product.sources||[]).map(s=>({...s,referenceOnly:true,referenceNote:'Recorded reference only; requested variant price and interfaces unconfirmed'}));return p;}
 p.variant=sku.title;p.tag=sku.title+' · source variant';
 const stem=product.variant&&product.name.endsWith(' · '+product.variant)?product.name.slice(0,-(' · '+product.variant).length):product.configurationName;
 if(stem)p.name=stem+' · '+sku.title;
 // Changed interfaces are retained only when the exact SKU carries researched facts.
 p.mtb=plain(sku.facts?.mtb)?{...sku.facts.mtb}:{};
 p.mtbEvidence=plain(sku.facts?.mtbEvidence)?sku.facts.mtbEvidence:product.mtbEvidence||{};
 for(const key of ['weight','weightBasis','productSpecs','description'])if(own(sku.facts,key))p[key]=sku.facts[key];
 const original=product.sources||[];
 if(Array.isArray(sku.sources)&&sku.sources.length){
  const priced=sku.sources.every(s=>s.currency==='ZAR'&&finite(s.unitPrice)&&Number.isInteger(s.quantity)&&s.quantity>0);
  const total=sku.sources.reduce((n,s)=>n+(finite(s.unitPrice)?s.unitPrice*s.quantity:0),0);
  p.price=priced&&finite(sku.price)&&Math.abs(total-sku.price)<.005?sku.price:null;
  p.sources=sku.sources.map(s=>({...s,...(p.price===null?{referenceOnly:true}:{})}));
 }else if(original.length===1&&(original[0].quantity===1||finite(sku.sourceUnitPrice))){
  const unitPrice=sku.sourceUnitPrice??sku.price,total=finite(unitPrice)?unitPrice*original[0].quantity:null;
  p.price=finite(sku.price)&&finite(total)&&Math.abs(total-sku.price)<.005?sku.price:null;
  p.sources=[{...original[0],url:sku.url,variant:sku.title,unitPrice,checkedAt:spec.checkedAt,listedAvailable:sku.listedAvailable,...(p.price===null?{referenceOnly:true}:{})}];
 }else{
  p.price=null;p.sources=original.map(s=>({...s,referenceOnly:true,referenceNote:'Variant package source accounting needs confirmation'}));
 }
 p.pricingLabel=p.price===null?'Variant quote required':'SA variant price reference';
 p.stockNote=sku.listedAvailable===false?'Exact source variant listed unavailable; sourcing required.':'Exact source variant snapshot; supplier must reconfirm availability.';
 return p;
}

function fact(p,key){
 if(Object.keys(p?.requestedOptions||{}).length)return undefined;
 const value=p?.mtb?.[key];return value!==null&&value!==undefined&&proof(p?.mtbEvidence?.[key])?value:undefined;
}
function includedIn(p,key){const items=fact(p,'includedCategories');return Array.isArray(items)&&items.includes(key);}
function includedPart(parent,key){
 const nested={fork:'includedFork',shock:'includedShock',seatpost:'includedSeatpost'}[key],mtb=plain(parent.mtb?.[nested])?parent.mtb[nested]:{},mtbEvidence={};
 for(const field of Object.keys(mtb)){
  const e=parent.mtbEvidence?.[`${nested}.${field}`]||parent.mtbEvidence?.[nested]?.[field]||parent.mtbEvidence?.[nested];
  if(proof(e))mtbEvidence[field]=e;
 }
 return{id:`included-${key}-${parent.id}`,brand:parent.brand,name:`${mtbStepLabels[key]} included in ${parent.name}`,tag:'Exact frame-package inclusion; dimensions require supplier review',variant:'Included package check',price:0,weight:null,weightBasis:'Already within the parent package scope; no independent mass added.',priceBasis:`Included in ${parent.name}; no separate charge and no replacement credit.`,pricingLabel:'Included in selected frame package',includedInPackage:true,includedParentId:parent.id,mtb,mtbEvidence,sources:(parent.sources||[]).map(s=>({...s,referenceOnly:true,referenceNote:'Parent package provenance, not a separately priced component'})),image:parent.image,photoCaption:'Parent frame package shown; confirm the exact included component.',photoSource:parent.photoSource,fitNote:'Confirm exact included model, dimensions, fittings and source package before ordering.'};
}
export function mtbSteps(build){
 const hide= fact(build?.parts?.frame,'suspension')==='hardtail'&&!build?.plan?.selection?.shock;
 return mtbBaseSteps.filter(k=>k!=='shock'||!hide);
}

export function evaluateMtbBuild(data,rawPlan={}){
 const catalog=mtbCatalog(data),plan=normalizeMtbPlan(rawPlan,data),parts={},checks=[];
 const add=(id,title,status,detail,products=[])=>checks.push({id,title,status,detail,sources:products.flatMap(p=>Object.entries(p?.mtbEvidence||{}).filter(([,e])=>proof(e)).map(([field,e])=>({field,sourceUrl:e.url,excerpt:e.excerpt,checkedAt:e.checkedAt})))});
 for(const[key,id]of Object.entries(plan.selection)){const p=catalog[categoryFor(key)].items.find(p=>p.id===id);if(p)parts[key]=configureMtbProduct(p,plan,data);}
 const frame=parts.frame;
 for(const key of ['fork','shock','seatpost'])if(frame&&includedIn(frame,key)){
  if(parts[key])add(`included-${key}-replacement`,`${mtbStepLabels[key]} replacement & frame package`,'conflict',`The frame package already includes ${mtbStepLabels[key].toLowerCase()}. The selected replacement is priced on top; no package credit is assumed. Ask the supplier to reconcile the replacement and retain or remove it explicitly.`,[frame,parts[key]]);
  else parts[key]=includedPart(frame,key);
 }
 const drive=parts.drivetrain;
 if(plan.chain!=='included'){
  parts.chain={...configureMtbProduct(catalog.chain.items.find(p=>p.id===plan.chain),plan,data),role:'Installed chain selection'};
  if(drive&&includedIn(drive,'chain'))add('included-chain-replacement','Chain & drivetrain package','review','This drivetrain already includes its source-listed chain. A separately selected chain is an additional purchase; no unsplit package credit is applied.',[drive,parts.chain]);
 }else if(drive){
  parts.chain=includedIn(drive,'chain')?{id:`included-chain-${drive.id}`,brand:drive.brand,name:`Chain included in ${drive.name}`,price:0,weight:null,priceBasis:'Already included in the selected drivetrain package; no separate charge.',includedInPackage:true,includedParentId:drive.id,sources:(drive.sources||[]).map(s=>({...s,referenceOnly:true,referenceNote:'Drivetrain-package provenance; no independent chain price'})),mtb:{},mtbEvidence:{}}:{id:'mtb-chain-package-review',name:'Chain package inclusion / installed chain check',price:null,weight:null,priceBasis:'No reviewed chain inclusion; supplier quote or exact chain selection required.',sources:[],mtb:{},mtbEvidence:{}};
 }
 const additionalLines=catalog.extras.items.filter(p=>plan.extras.includes(p.id)).map(p=>({...configureMtbProduct(p,plan,data),quantity:mtbExtraQuantity(plan,p.id),role:'Optional extra'}));
 const compare=(id,title,left,leftKey,right,rightKey,detail)=>{
  if(!left||!right)return;
  const a=fact(left,leftKey),b=fact(right,rightKey),known=a!==undefined&&b!==undefined;
  add(id,title,known&&stable(a)!==stable(b)?'conflict':'review',known?(stable(a)===stable(b)?`${detail}: both list ${Array.isArray(a)?a.join(' / '):a}. This nominal agreement still needs exact package and installation review.`:`${detail}: ${Array.isArray(a)?a.join(' / '):a} versus ${Array.isArray(b)?b.join(' / '):b}. Select a documented matching standard or request supplier advice.`):`${detail} is not documented for both selected references. Supplier confirmation is required.`,[left,right]);
 };
 const {fork,shock,wheels,frontTire,rearTire,brakes,cockpit,seatpost,chain}=parts;
 const suspension=fact(frame,'suspension');
 if(frame){
  if(suspension==='hardtail'&&shock)add('hardtail-shock','Hardtail & rear shock','conflict','The source frame is a hardtail and does not use a rear shock. Remove the selected shock or choose a matching full-suspension frame.',[frame,shock]);
  if(!suspension)add('frame-suspension','Frame suspension/package','review','The exact source frame suspension and supplied component scope are not confirmed. Do not infer inclusions from a photograph.',[frame]);
 }
 if(frame&&shock&&suspension==='full'&&!shock.includedInPackage){
  compare('shock-eye','Shock eye-to-eye',frame,'shockEyeMm',shock,'eyeMm','Listed shock eye-to-eye (mm)');
  compare('shock-stroke','Shock stroke',frame,'shockStrokeMm',shock,'strokeMm','Listed shock stroke (mm)');
  compare('shock-mount','Shock mount',frame,'shockMount',shock,'mount','Listed shock mount');
  add('shock-hardware','Shock tune & mounting hardware','review','Eye-to-eye, stroke and mount labels alone do not establish fit. Confirm frame approval, tune, hardware widths/bolts, clearance and all travel positions.',[frame,shock]);
 }
 if(frame&&fork){
  const allowed=fact(frame,'recommendedForkTravelMm'),maximum=fact(frame,'maxForkTravelMm'),travel=fact(fork,'travelMm'),range=Array.isArray(allowed)&&allowed.length===2&&allowed.every(finite),known=finite(travel)&&(range||finite(allowed)||finite(maximum));
  const outside=finite(travel)&&(range&&(travel<allowed[0]||travel>allowed[1])||finite(maximum)&&travel>maximum);
  add('fork-travel','Frame & fork travel',outside?'conflict':'review',known?`Fork lists ${travel} mm; ${range||finite(allowed)?'frame source recommends '+(range?allowed.join('–'):allowed)+' mm. ':''}${finite(maximum)?'Frame source maximum is '+maximum+' mm. ':''}${outside?'This exceeds a documented travel limit or range.':'Confirm exact frame approval, axle-to-crown, offset, headset and intended use; a recommendation is not a complete fit certification.'}`:'Fork travel and an explicit frame recommendation are not documented together. Confirm the approved travel and axle-to-crown; no range is inferred from discipline.',[frame,fork]);
 }
 compare('front-axle','Fork & front-wheel axle',fork,'frontAxle',wheels,'frontAxle','Front axle');
 compare('rear-axle','Frame & rear-wheel axle',frame,'rearAxle',wheels,'rearAxle','Rear axle');
 compare('fork-wheel','Fork & front-wheel diameter',fork,'wheelSize',wheels,'frontWheelSize','Nominal front-wheel size');
 if(frame&&wheels)for(const[end,label]of [['front','Front'],['rear','Rear']]){
  const fixed=fact(frame,end+'WheelSize'),sizes=fact(frame,'wheelSizes'),wheel=fact(wheels,end+'WheelSize'),allowed=fixed!==undefined?[fixed]:Array.isArray(sizes)?sizes:null;
  add(`frame-${end}-wheel`,`${label} wheel & frame`,allowed&&wheel!==undefined&&!allowed.includes(wheel)?'conflict':'review',allowed&&wheel!==undefined?`Frame source lists ${allowed.join(' / ')}; selected ${end} wheel lists ${wheel}. ${allowed.includes(wheel)?'Confirm exact size-specific setup and clearance.':'This wheel size is outside the listed source setup.'}`:`Exact ${end}-wheel setup is not documented for both references. Do not infer a mixed-wheel conversion.`,[frame,wheels]);
 }
 for(const[end,tire]of [['front',frontTire],['rear',rearTire]]){
  if(!tire)continue;
  if(wheels){
   const wheel=fact(wheels,end+'WheelSize'),size=fact(tire,'wheelSize'),diameter=fact(tire,'diameterMm'),mapping={'29':622,'27.5':584,'26':559};
   const known=wheel!==undefined&&(size!==undefined||finite(diameter)),agree=size!==undefined?wheel===size:mapping[wheel]===diameter;
   add(`${end}-tire-diameter`,`${end==='front'?'Front':'Rear'} tyre & rim diameter`,known&&!agree?'conflict':'review',known?`Wheel: ${wheel}; tyre: ${size??diameter+' mm bead-seat diameter'}. ${agree?'Confirm exact rim approval, casing and pressure.':'The documented diameters do not agree.'}`:'Tyre and wheel diameter are not documented together. Confirm exact bead-seat diameter; width alone does not establish fit.',[wheels,tire]);
   const wheelTL=fact(wheels,'tubelessReady'),tireTL=fact(tire,'tubelessReady'),no=wheelTL===false||tireTL===false;
   add(`${end}-tire-system`,`${end==='front'?'Front':'Rear'} tyre system`,plan.tireSetup==='tubeless'&&no?'conflict':'review',plan.tireSetup==='tubeless'?(no?'A selected reference explicitly excludes tubeless use. Choose approved equipment or inner tubes.':wheelTL===true&&tireTL===true?'Both source references are tubeless-ready. Confirm exact rim/tyre approval, hooked/hookless limits, pressure, tape, valves and sealant.':'Tubeless suitability is not documented for both references. Supplier approval is required.'):plan.tireSetup==='tubes'?'Inner tubes requested. Confirm tyre/rim approval, tube diameter/width and valve length.':'Choose inner tubes or tubeless, or ask the supplier to confirm a supported setup.',[wheels,tire]);
  }
  const width=fact(tire,'widthInches');
  const key=end==='front'?'frontTireMaxWidthInches':'rearTireMaxWidthInches',limit=fact(frame,key)??fact(frame,'maxTireWidthInches');
  if(frame)add(`${end}-tire-clearance`,`${end==='front'?'Front':'Rear'} tyre clearance`,finite(width)&&finite(limit)&&width>limit?'conflict':'review',finite(width)&&finite(limit)?`Tyre nominal width ${width} in; frame source limit ${limit} in. Check actual mounted width, mud clearance and exact wheel/frame size.`:'No exact source-backed width limit is available for this tyre/frame combination. Confirm measured clearance; no limit is inferred from XC/trail/enduro labels.',[frame,tire]);
  if(end==='front'&&fork){const max=fact(fork,'maxTireWidthInches');if(finite(max)&&finite(width))add('fork-tire-clearance','Fork tyre clearance',width>max?'conflict':'review',`Tyre lists ${width} in; fork lists maximum ${max} in. Confirm mounted width and actual clearance.`,[fork,tire]);}
 }
 if(wheels&&drive){
  const hub=fact(wheels,'freehub'),required=fact(drive,'requiredFreehub'),allowed=Array.isArray(required)?required:required!==undefined?[required]:[],known=hub!==undefined&&allowed.length;
  add('freehub','Cassette & freehub',known&&!allowed.includes(hub)?'conflict':'review',known?`Wheel lists ${hub}; drivetrain requires ${allowed.join(' / ')}. ${allowed.includes(hub)?'Confirm exact cassette, driver generation, spacers and supplied body.':'These nominal standards differ; HG, Micro Spline, XD and XDR are not treated as interchangeable.'}`:'Exact freehub and cassette requirements are not documented together. Ask the supplier; no driver conversion or adapter is assumed.',[wheels,drive]);
 }
 if(frame&&drive&&fact(drive,'requiresUDH')===true){const udh=fact(frame,'UDH');add('udh','Transmission / UDH frame interface',udh===false?'conflict':'review',udh===true?'Frame source documents UDH; exact T-Type/Transmission frame approval and installation still need review.':udh===false?'This drivetrain requires UDH, but the exact source frame is explicitly not UDH-compatible.':'This drivetrain requires UDH; the exact frame interface has not been source-confirmed.',[frame,drive]);}
 if(drive&&chain&&!chain.includedInPackage&&chain.id!=='mtb-chain-package-review'){
  const family=fact(drive,'driveFamily'),families=fact(chain,'compatibleDriveFamilies'),driveSpeeds=fact(drive,'speeds'),chainSpeeds=fact(chain,'speeds'),speeds=Array.isArray(chainSpeeds)?chainSpeeds:finite(chainSpeeds)?[chainSpeeds]:[];
  const familyConflict=family!==undefined&&Array.isArray(families)&&families.length&&!families.includes(family),speedConflict=finite(driveSpeeds)&&speeds.length&&!speeds.includes(driveSpeeds);
  add('chain-standard','Chain & drivetrain standard',familyConflict||speedConflict?'conflict':'review',familyConflict||speedConflict?`Drivetrain: ${family??'unconfirmed family'} / ${driveSpeeds??'unknown'} speeds; chain: ${Array.isArray(families)?families.join(' / '):'unconfirmed family'} / ${speeds.join(' / ')||'unknown'} speeds. Classic Eagle, T-Type and Road Flattop are not interchangeable by speed count alone.`:'Confirm exact drive/chain family, cassette, chainrings, link count and connector. A nominal family or speed agreement does not certify installation.',[drive,chain]);
 }
 compare('frame-brakes','Frame & rear brake mount',frame,'brakeMount',brakes,'mount','Rear frame/caliper mount');
 compare('fork-brakes','Fork & front brake mount',fork,'brakeMount',brakes,'mount','Front fork/caliper mount');
 compare('seatpost-diameter','Frame & seatpost diameter',frame,'seatpostDiameterMm',seatpost,'diameterMm','Seatpost diameter (mm)');
 if(cockpit){const bar=fact(cockpit,'barClampMm'),stem=fact(cockpit,'stemClampMm');add('bar-clamp','Handlebar & stem clamp',finite(bar)&&finite(stem)&&bar!==stem?'conflict':'review',finite(bar)&&finite(stem)?`Bar clamp ${bar} mm; stem clamp ${stem} mm. Confirm bar installation, stem/steerer, routing, reach and torque.`:'Both bar and stem clamp measurements are not documented. Confirm exact clamp, steerer and routing.',[cockpit]);}
 if(seatpost&&fact(seatpost,'dropper')===true)add('dropper-fit','Dropper insertion, travel & remote','review',`Confirm rider saddle height, frame insertion limit, post overall length, cable routing and lever clearance. ${fact(seatpost,'remoteIncluded')===true?'Source lists a remote in the package; confirm its mount.':fact(seatpost,'remoteIncluded')===false?'Remote is explicitly excluded; add and quote a compatible remote.':'Remote inclusion is not confirmed; supplier must itemise any missing remote/cable.'}`,[seatpost,frame]);
 if(Object.keys(parts).length)add('remaining-fit','Sizing & remaining installation','review','Confirm exact frame size, rider fit, headset/steerer, bottom bracket/crank, rotors/adapters/hoses, saddle-rail clamp, fasteners, torque and assembly. These checks do not certify a complete bicycle.',Object.values(parts));
 const required=mtbSteps({parts,plan}).filter(k=>!['extras','review'].includes(k));
 const missing=required.filter(k=>!parts[k]||parts[k].id==='mtb-chain-package-review');
 const rows=[...Object.values(parts),...additionalLines],unpriced=rows.filter(p=>!finite(p.price)),knownSubtotal=rows.reduce((n,p)=>n+(mtbLineTotal(p)??0),0);
 const errors=checks.filter(c=>c.status==='conflict').map(c=>c.detail),warnings=rows.flatMap(p=>[p.fitNote,p.variantNote,...(p.missingEssentials||[]).map(v=>'Still required: '+v)].filter(Boolean));
 const unresolvedEssentials=[...new Set(rows.flatMap(p=>(p.missingEssentials||[]).map(v=>`${p.name}: ${v}`)))];
 if(seatpost&&fact(seatpost,'dropper')===true&&fact(seatpost,'remoteIncluded')===false)unresolvedEssentials.push(`${seatpost.name}: compatible remote/cable is explicitly excluded and still needs sourcing.`);
 const selectionComplete=missing.length===0;
 const compatibility={checks,errors,verified:false,counts:{matched:0,review:checks.filter(c=>c.status==='review').length,conflict:errors.length},requiredExtras:[...new Set(rows.flatMap(p=>p.missingEssentials||[]))]};
 const massRows=rows.filter(p=>finite(p.weight)&&p.weight>0&&!p.includedInPackage).map(p=>({id:p.id,name:p.name,kg:p.weight*quantity(p.quantity),quantity:quantity(p.quantity),basis:p.weightBasis||'Source package mass; scope needs confirmation.'}));
 return{plan,parts,additionalLines,checks,compatibility,errors,warnings,missing,selectionComplete,unresolvedEssentials,complete:selectionComplete&&unresolvedEssentials.length===0&&errors.length===0,knownSubtotal,price:unpriced.length?null:knownSubtotal,unpriced,mass:{kg:massRows.reduce((n,p)=>n+p.kg,0),rows:massRows,complete:false,scope:'Documented sourcing-package mass only. Included components are not counted twice; replacement packages and spares may remain uninstalled. Complete bicycle mass is unverified.'}};
}

export function mtbBriefText(build){
 const rows=[...Object.entries(build.parts).map(([key,p])=>({key,p})),...build.additionalLines.map(p=>({key:'extras',p}))];
 return['RCS BICYCLE — MOUNTAIN BIKE SOURCING BRIEF','South Africa · ZAR · No RCS stock held','',...rows.flatMap(({key,p})=>[`${mtbStepLabels[key]}: ${p.name}`,`${quantity(p.quantity)} package(s) × ${money(p.price)} = ${money(mtbLineTotal(p))}`,p.priceBasis||'',p.variantNote||'',...Object.entries(p.requestedOptions||{}).map(([k,v])=>`Private supplier fit request · ${k}: ${v}`),...(p.sources||[]).map(s=>`${s.name}: ${s.url} | ${s.variant} | ${s.referenceOnly?'Package/reference provenance only; no independent component price':quantity(p.quantity)*s.quantity+' × '+money(s.unitPrice)} | checked ${s.checkedAt}`),p.fitNote||'',...(p.missingEssentials||[]).map(v=>'Still required: '+v),'']),`Known sourcing subtotal: ${money(build.knownSubtotal)}`,`Unpriced lines: ${build.unpriced.length}`,`Not yet selected/confirmed: ${build.missing.map(k=>mtbStepLabels[k]).join(', ')||'All required selection steps represented; fit still unverified.'}`,...build.unresolvedEssentials.map(v=>'Unresolved essential: '+v),`Requested tyre setup: ${build.plan.tireSetup}`,'','SOURCE-LIMITED INTERFACE CHECKS',...build.checks.flatMap(c=>[`${c.status.toUpperCase()} — ${c.title}: ${c.detail}`,...c.sources.map(s=>`${s.sourceUrl} | ${s.excerpt}`)]),'',`${build.mass.kg.toFixed(3)} kg documented sourcing-package mass. ${build.mass.scope}`,'Quantities count exact listed packages, not assumed individual pieces. No credit is taken from unsplit included parts.','Confirm exact variants, supplier availability, VAT, package contents, missing parts, final selling price, sizing, full compatibility, assembly and delivery. No order, reservation, payment or automatic submission is created.'].filter(Boolean).join('\n');
}
export function mtbQuoteContext(build,shareUrl){
 return{title:'Your custom mountain bike build',items:[...Object.values(build.parts),...build.additionalLines].map(p=>({name:p.name,quantity:quantity(p.quantity),price:p.price,basis:p.priceBasis||p.role})),knownSubtotal:build.knownSubtotal,unpricedCount:build.unpriced.length,sourceText:mtbBriefText(build),...(shareUrl?{shareUrl}:{})};
}
export function shareableMtbPlan(raw,data){const{requests,...safe}=normalizeMtbPlan(raw,data);return safe;}
export function mtbSharedUrl(rawPlan,baseUrl,data){
 const url=new URL('./mountain.html',baseUrl);if(!['http:','https:'].includes(url.protocol))throw new Error('Sharing requires a website URL.');
 url.search='';url.hash=new URLSearchParams({mtb:'1',plan:JSON.stringify(shareableMtbPlan(rawPlan,data))}).toString();if(url.hash.length>24000)throw new Error('This configuration is too long to share. Download the sourcing brief instead.');return url.href;
}
export function parseMtbShared(hash,data){
 if(typeof hash!=='string'||!hash.startsWith('#mtb='))return{status:'none'};
 const invalid={status:'invalid',message:'This mountain-bike configuration is incomplete, outdated or contains unavailable references. Your saved build is preserved.'};
 if(hash.length>24000)return invalid;const params=new URLSearchParams(hash.slice(1));
 if(params.get('mtb')!=='1'||[...params.keys()].some(k=>!['mtb','plan'].includes(k))||['mtb','plan'].some(k=>params.getAll(k).length!==1))return invalid;
 let raw;try{raw=JSON.parse(params.get('plan'));}catch{return invalid;}
 if(!plain(raw)||stable(raw)!==stable(shareableMtbPlan(raw,data)))return invalid;
 return{status:'valid',plan:normalizeMtbPlan(raw,data)};
}

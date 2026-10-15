import evidence from './compatibility-data.json' with {type:'json'};
import { normalizeSettings, tireSetups } from './build-settings.js';

export const checkLabels={matched:'Documented match',conflict:'Conflict',review:'Supplier review'};
// A match applies only to the named interface, never to the whole bicycle.
export function inspectParts(parts,rawSettings={}) {
 const settings=normalizeSettings(rawSettings),checks=[],requiredExtras=[];
 const fact=(part,key)=>part?.frameFacts?.[key]||part?.wheelFacts?.[key]||evidence.products[part?.id]?.[key];
 const add=(id,title,status,detail,sources=[])=>checks.push({id,title,status,detail,sources:sources.filter(Boolean)});
 const {frame,wheels,tires,drivetrain,brakes,cockpit,saddle}=parts;
 if(frame?.buildEligible===false)add('frame-variant','Frameset variant','conflict',frame.builderNote||'This frame variant has not been reviewed for the current disc-road builder.');
 if(frame?.frameSpecs&&brakes){
  const detail=frame.frameEvidence?.brake;
  add('frame-brakes','Frame & brake type',frame.frameSpecs.brake==='rim'?'conflict':'review',frame.frameSpecs.brake==='rim'?'This frame listing uses rim brakes; the selected road brake packages are disc systems.':frame.frameSpecs.brake==='disc'?'A disc-brake frame variant is listed. Confirm flat-mount interfaces, rotor sizes, hoses and routing for the exact frame and control package.':'Brake type and mount details have not been documented for this exact frame package. Confirm a disc-compatible version, mounts and hose routing with the supplier.',detail?[{sourceUrl:detail.url,excerpt:detail.excerpt,checkedAt:detail.checkedAt}]:[]);
 }
 if(wheels?.buildEligible===false)add('wheel-variant','Wheelset variant','conflict',wheels.builderNote||'This collection wheelset has not been reviewed for the current Shimano disc-road builder.');
 if(drivetrain&&brakes){
  const same=drivetrain.controlSystem===brakes.controlSystem;
  add('controls','Shifting & controls',same?'matched':'conflict',same?'The listed control-system families agree. Exact contents, calipers, hoses and installation still need confirmation.':'The selected shift levers and drivetrain use different control systems. Match mechanical 105 with ST-R7120, or 105 Di2 with the Di2 package check.');
 }
 if(frame&&tires){
  const known=Number.isFinite(frame.maxTire),over=known&&tires.width>frame.maxTire;
  const proof=frame.frameEvidence?.clearance;
  add('clearance','Frame tire clearance',over?'conflict':known?'matched':'review',over?`${tires.width} mm tires exceed this frame’s ${frame.maxTire} mm source-listed clearance.`:known?`${tires.width} mm nominal tires are within the listed ${frame.maxTire} mm limit. Check actual inflated width, rim width and required clearance.`:frame.clearanceNote||'This frameset has no confirmed tire-clearance limit in the catalog. Ask the supplier before selecting a tire size.',proof?[{sourceUrl:proof.url,excerpt:proof.excerpt,checkedAt:proof.checkedAt}]:[]);
 }
 if(frame&&wheels)for(const[key,label]of [['frontAxle','Front axle'],['rearAxle','Rear axle']]){
  const f=fact(frame,key),w=fact(wheels,key),known=Boolean(f&&w);
  add(key,label,known?(f.value===w.value?'matched':'conflict'):'review',known?`Frame/fork: ${f.value} mm; wheel: ${w.value} mm. Confirm the supplied endcaps and axles for the exact package.`:`Exact axle dimensions are not documented for both selected products${f?`; frame/fork lists ${f.value} mm`:w?`; wheel lists ${w.value} mm`:''}. Confirm standards and supplied endcaps.`,[f,w]);
 }
 if(wheels&&tires){
  const range=fact(wheels,'recommendedTireWidth');
  if(range){const[min,max]=range.value;add('rim-width','Listed rim tire-width recommendation',tires.width>=min&&tires.width<=max?'matched':'review',`${tires.width} mm nominal tire; the wheel listing recommends ${min}–${max} mm. Confirm the exact tire/rim approval and operating pressure.`,[range]);}
  const w=fact(wheels,'tubelessReady'),t=fact(tires,'tubelessReady');
  if(settings.tireSetup==='tubeless'){
   const no=w?.value===false||t?.value===false,yes=w?.value===true&&t?.value===true;
   add('tire-system','Tubeless setup',no?'conflict':yes?'matched':'review',no?'A selected tire or wheel is explicitly listed as unsuitable for tubeless. Change the product or choose inner tubes.':yes?'Both listings describe tubeless-ready products. This does not confirm the exact combination: check hooked/hookless approval, pressures, tape, valves and sealant.':'Tubeless suitability is not documented for both selected products. Do not install tubeless until the supplier confirms the exact tire and rim; tube-type catalog variants need review or replacement.',[w,t]);
  }else add('tire-system','Tire system','review',settings.tireSetup==='tubes'?'Inner tubes requested. Confirm tube size and valve length, rim/tire approval and inflation limits.':'Choose inner tubes or tubeless, or ask the supplier to recommend a supported setup.');
 }
 if(cockpit){
  const bar=fact(cockpit,'barClampMm'),stem=fact(cockpit,'stemClampMm'),known=Boolean(bar&&stem);
  add('bar-clamp','Handlebar & stem clamp',known?(bar.value===stem.value?'matched':'conflict'):'review',known?`Listed bar clamp: ${bar.value} mm; stem clamp: ${stem.value} mm. Steerer, routing, reach and torque remain separate checks.`:'Bar and stem clamp diameters have not both been documented. Confirm the exact bar/stem variants, steerer and cable routing.',[bar,stem]);
 }
 if(wheels&&drivetrain)add('freehub','Cassette & freehub','review','A generic Shimano/HG label alone does not establish the exact road 12-speed cassette fit, spacers or freehub generation. Confirm with the supplier.');
 if(frame&&drivetrain){const bb=fact(frame,'bottomBracket');add('bottom-bracket','Bottom bracket & crank','review',`${bb?'The frame listing says '+bb.value+' bottom bracket. ':''}Confirm shell dimensions/thread, crank spindle compatibility and the exact bottom-bracket unit and package inclusion.`,[bb]);}
 if(frame||cockpit||saddle)add('fit','Sizing & remaining interfaces','review','Confirm frame size and rider fit, headset/steerer, brake mounts and rotor sizes, hose routing, seatpost and saddle-rail clamp. Rider measurements do not automatically determine frame size.');
 if(frame?.missingEssentials?.length)requiredExtras.push(...frame.missingEssentials.map(part=>`${frame.name}: ${part} is explicitly excluded and still required.`));
 if(drivetrain)requiredExtras.push(drivetrain.controlSystem==='mechanical-12'?'Bottom bracket is excluded from the listed mechanical drivetrain bundle; select and quote a matching unit.':'Confirm Di2 package contents, calipers/rotors, battery, wires, charger and bottom bracket; quote anything not included.');
 if(brakes)requiredExtras.push('Confirm rotors, adapters, hoses and installation supplies; quote any items outside the listed brake package.');
 if(tires)requiredExtras.push(settings.tireSetup==='tubeless'?'Quote suitable rim tape, valves and sealant if not included; confirm exact tire/rim approval.':settings.tireSetup==='tubes'?'Quote two suitable inner tubes with the correct valve length if not included.':'Quote the agreed tire setup: tubes or tubeless tape, valves and sealant as required.');
 if(frame||cockpit)requiredExtras.push('Confirm bar tape, pedals, any replacement fittings, assembly and delivery. Extra costs are not included in the reference subtotal.');
 return{checks,requiredExtras,settings,errors:checks.filter(c=>c.status==='conflict').map(c=>c.detail),counts:Object.fromEntries(Object.keys(checkLabels).map(status=>[status,checks.filter(c=>c.status===status).length])),verified:false};
}

export function compatibilityText(report){
 return['BUILD INTERFACE CHECKLIST',`Requested tire setup: ${tireSetups[report.settings.tireSetup]}`,...report.checks.flatMap(c=>[`${checkLabels[c.status]} — ${c.title}: ${c.detail}`,...c.sources.map(s=>`Evidence checked ${s.checkedAt||evidence.checkedAt}: ${s.sourceUrl} | ${s.excerpt}`)]),'UNPRICED EXTRAS / PACKAGE CHECKS',...report.requiredExtras,'A documented match covers only the named specification. Full build compatibility is not verified.'].join('\n');
}

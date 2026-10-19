import existingEvidence from './compatibility-data.json' with {type:'json'};

// These checks describe sourcing interfaces, not certification of an assembled bicycle.
const positive=n=>Number.isFinite(n)&&n>0;
const quantity=line=>Number.isInteger(line.quantity)&&line.quantity>=1&&line.quantity<=20?line.quantity:1;
const sourceOf=(p,e)=>({sourceUrl:e?.sourceUrl||e?.url||p?.sources?.[0]?.url,excerpt:String(e?.excerpt||p?.sources?.[0]?.variant||'Exact package contents require confirmation.'),checkedAt:e?.checkedAt||p?.sources?.[0]?.checkedAt||p?.verification?.reviewedAt});
const sourceList=(p,keys=[])=>{
 const facts=p?.referenceSpecsOnly?[]:keys.map(k=>p?.productEvidence?.[k]).filter(Boolean);
 return (facts.length?facts:[null]).map(f=>sourceOf(p,f)).filter(s=>s.sourceUrl);
};
const currentVariant=p=>p.sources?.find(s=>!s.referenceOnly)?.variant||p.variantNote?.match(/^Source variant: (.+)\. Availability/)?.[1]||(!p.referenceSpecsOnly?p.variant:null);
const depthOf=p=>{
 if(p?.referenceSpecsOnly||!p?.wheelEvidence?.depthMm&&!p?.profileEvidence?.rimDepthMm)return null;
 const values=[p?.wheelSpecs?.depthMm].flat();
 return values.length&&values.every(positive)?Math.max(...values):null;
};
const extraNote=p=>[p.variantNote,p.referenceSpecsOnly?'Reference measurements and fit notes need confirmation for this changed SKU.':p.fitNote].filter(Boolean).join(' ');
const staticSpecs=p=>p?.referenceSpecsOnly?null:p?.productSpecs;

function wheelRotorMount(wheels){
 if(!wheels||wheels.referenceSpecsOnly)return {sources:[]};
 const facts=[...Object.values(wheels.wheelEvidence||{}),...Object.values(wheels.wheelFacts||{})];
 const explicit=wheels.wheelFacts?.rotorMount||wheels.wheelFacts?.hubMount;
 const structured=wheels.wheelSpecs?.rotorMount||wheels.wheelSpecs?.hubMount;
 if(explicit?.value)facts.push({...explicit,excerpt:explicit.excerpt||String(explicit.value)});
 if(structured&&(wheels.wheelEvidence?.rotorMount||wheels.wheelEvidence?.hubMount))facts.push({excerpt:String(structured),...(wheels.wheelEvidence.rotorMount||wheels.wheelEvidence.hubMount)});
 const found=facts.filter(e=>/cent(?:er|re)[ -]?lock|\b6[- ]?bolt\b|\bsix[- ]?bolt\b|\bAFS\b/i.test(e.excerpt||''));
 const center=found.some(e=>/cent(?:er|re)[ -]?lock/i.test(e.excerpt));
 const six=found.some(e=>/\b6[- ]?bolt\b|\bsix[- ]?bolt\b/i.test(e.excerpt));
 // AFS is not silently converted to another interface, and mixed listing options stay unresolved.
 const ambiguous=center&&six||six&&found.some(e=>/\bAFS\b/i.test(e.excerpt));
 return {mount:ambiguous?null:center?'Center Lock':six?'6-bolt':null,sources:found.map(e=>sourceOf(wheels,e)),ambiguous};
}

function tubeSize(p){
 const variant=currentVariant(p)||'';
 const match=variant.match(/700\s*C\s*[x×]\s*(\d+)\s*[-–]\s*(\d+)\s*C\s*F\s*\/\s*V\s*(\d+)/i);
 if(!match)return null;
 return {diameterMm:622,minWidth:Number(match[1]),maxWidth:Number(match[2]),valveMm:Number(match[3]),variant};
}

function frameBottomBracket(frame){
 if(frame?.referenceSpecsOnly)return null;
 return frame?.frameFacts?.bottomBracket||frame?.compatibility?.bottomBracket||existingEvidence.products[frame?.id]?.bottomBracket||null;
}

function standardOf(value){
 const text=String(value||'');
 if(/\bT47a\b/i.test(text))return 'T47a';
 if(/\bT47\b/i.test(text))return 'T47';
 if(/\bBSA\b/i.test(text))return 'BSA';
 if(/\bItalian\b/i.test(text))return 'Italian';
 if(/\bBB\s*386\b/i.test(text))return 'BB386';
 if(/\bBB\s*86\b/i.test(text))return 'BB86';
 if(/\bPF\s*30\b/i.test(text))return 'PF30';
 if(/press[ -]?fit/i.test(text))return 'Unspecified press-fit';
 if(/threaded/i.test(text))return 'Unspecified threaded';
 return null;
}
const frameWidth=value=>{const text=String(value||'');const match=text.match(/\b(\d+(?:\.\d+)?)\s*mm\b/i)||text.match(/\bT47\s*-\s*(\d+(?:\.\d+)?)\b/i);return match?Number(match[1]):null;};
const crankFamily=value=>/\bDUB\b/i.test(value||'')?'SRAM DUB':/Hollowtech\s*II/i.test(value||'')?'Shimano Hollowtech II':null;
const crankOf=drive=>{
 if(drive?.referenceSpecsOnly)return null;
 const descriptions=Object.entries(drive?.productSpecs||{}).filter(([key])=>/crank|spindle/i.test(key)).map(([,value])=>String(value));
 if(descriptions.some(value=>/\bDUB\b/i.test(value)))return 'SRAM DUB';
 if(descriptions.some(value=>/Hollowtech\s*II/i.test(value)))return 'Shimano Hollowtech II';
 return null;
};

export function inspectFinishing(parts={},extraLines=[],settings={}){
 const checks=[],notes=[];
 const add=(id,title,status,detail,sources=[])=>checks.push({id,title,status,detail,sources:sources.filter(s=>s?.sourceUrl)});
 const {frame,wheels,tires,drivetrain}=parts;
 const lines=extraLines.filter(p=>p&&p.role!=='Spare chain · not installed');
 const rotors=lines.filter(p=>p.kind==='Rotors & braking'&&(/\brotor\b/i.test(p.priceBasis||'')||p.productSpecs?.hubMount));
 const bottomBrackets=lines.filter(p=>p.kind==='Bottom brackets');
 const tubes=lines.filter(p=>p.id==='exp-extras-titan-road-tubes');
 const valves=lines.filter(p=>['exp-extras-muc-off-all-new-tubeless-valves','exp-extras-ryder-rvc-tubeless-valve-set'].includes(p.id));
 const driveSpecs=staticSpecs(drivetrain)||{};
 const redRotorPair=drivetrain?.id==='exp-drivetrains-red-axs-karoo'&&/rotors/i.test(driveSpecs['Included brakes']||'')&&/160\s*\/\s*160/.test(driveSpecs['Included brakes']);

 if(rotors.length||wheels?.wheelSpecs?.brake==='disc'||redRotorPair){
  let count=redRotorPair?2:0,unknownCount=false;
  for(const rotor of rotors){
   const specs=staticSpecs(rotor),mount=specs?.hubMount||null,wheel=wheelRotorMount(wheels);
   const variant=currentVariant(rotor)||'',diameter=variant.match(/^(\d+)\s*mm$/i)?.[1]||specs?.diameterMm;
   const single=rotor.productSpecs?.packageQuantity===1&&/\bone rotor\b/i.test(rotor.priceBasis||'');
   if(single)count+=quantity(rotor);else unknownCount=true;
   const conflict=Boolean(mount&&wheel.mount&&mount!==wheel.mount);
   add('finishing-rotor-'+rotor.id,'Rotor mounting & size',conflict?'conflict':'review',
    `${rotor.name}: ${diameter?diameter+' mm':'diameter unconfirmed'}; ${mount||'selected-variant mount unconfirmed'}. ${wheel.mount?'Wheel evidence lists '+wheel.mount+'. ':wheel.ambiguous?'Wheel listing describes multiple or conflicting mounting interfaces. ':'The exact wheel rotor-mount interface is unconfirmed. '}${conflict?'These are different direct mounting interfaces; no adapter is assumed. ':''}Confirm front/rear assignment, frame/fork limits, caliper/pad approval, rotor thickness, adapters and lockring/axle clearance. ${extraNote(rotor)}`,
    [...sourceList(rotor,['hubMount','diameterMm','thicknessMm','lockring']),...wheel.sources]);
  }
  add('finishing-rotor-count','Disc rotor package quantities','review',
   `${count} rotor(s) documented in selected ${redRotorPair?'groupset and extra':'extra'} packages${unknownCount?'; other package quantities are unconfirmed':''}. ${count<2?'A two-disc road build needs a front and rear rotor; the selected sourcing list does not document both yet. ':'A quantity of two or more does not establish the required front/rear diameters or correct fit. '} Quantities count packages; two units of one configured reference use the same SKU. Confirm any package inclusions and spares; no automatic bundle credit is deducted.`,
   [...rotors.flatMap(p=>sourceList(p,['packageQuantity'])),...(redRotorPair?sourceList(drivetrain,['package']):[])]);
 }

 for(const tube of tubes){
  const size=tubeSize(tube),width=tires?.referenceSpecsOnly?null:tires?.width,diameter=tires?.referenceSpecsOnly?null:tires?.tireFacts?.diameterMm;
  const widthConflict=Boolean(size&&positive(width)&&(width<size.minWidth||width>size.maxWidth));
  const diameterConflict=Boolean(size&&positive(diameter)&&diameter!==size.diameterMm);
  const depth=depthOf(wheels),shortValve=Boolean(size&&positive(depth)&&size.valveMm<=depth);
  add('finishing-tube-'+tube.id,'Inner tube size & valve',widthConflict||diameterConflict||shortValve?'conflict':'review',
   `${size?'Exact source variant: '+size.variant+'. ':'The selected tube size/valve is unconfirmed. '}${positive(width)?'Selected tyre nominal width: '+width+' mm. ':''}${positive(diameter)?'Selected tyre bead-seat diameter: '+diameter+' mm. ':''}${widthConflict?'The tyre width is outside the source-listed tube range. ':''}${diameterConflict?'The tube and tyre list different wheel diameters. ':''}${positive(depth)?'Maximum listed rim depth: '+depth+' mm. ':''}${shortValve?'The valve is not longer than the listed rim depth and cannot provide exposed pump attachment as listed. ':''}Confirm exact tyre/rim approval and sufficient valve access; extensions are not assumed. ${settings.tireSetup==='tubeless'?'An emergency tube still needs the correct size; this does not change the selected tubeless setup. ':''}${extraNote(tube)}`,
   [...sourceList(tube),...(tires?sourceList(tires):[]),...(wheels?sourceList(wheels):[])]);
 }
 if(settings.tireSetup==='tubes'&&tires){
  const count=tubes.reduce((sum,p)=>sum+quantity(p),0);
  add('finishing-tube-count','Inner tube package quantities','review',`${count} individually sold tube(s) selected. ${count<2?'Two installed tubes are not yet documented for the tyre pair. ':'Confirm which two are installed and whether remaining tubes are spares. '}Other package inclusions, exact size and valve fit require confirmation.`,tubes.flatMap(p=>sourceList(p)));
 }

 for(const valve of valves){
  const variant=currentVariant(valve)||'',length=valve.id==='exp-extras-muc-off-all-new-tubeless-valves'?Number(variant.match(/(?:^|\/)\s*(\d+)\s*mm\s*$/i)?.[1])||null:null;
  const depth=depthOf(wheels),short=settings.tireSetup==='tubeless'&&positive(length)&&positive(depth)&&length<=depth;
  add('finishing-valve-'+valve.id,'Tubeless valve length & package',short?'conflict':'review',
   `${valve.name}: ${positive(length)?length+' mm selected valve length':'valve length unconfirmed'}. ${positive(depth)?'Maximum listed rim depth: '+depth+' mm. ':''}${short?'The valve does not protrude beyond the listed rim depth; do not assume an extension. ':''}${valve.id==='exp-extras-ryder-rvc-tubeless-valve-set'?'Source lists two valves per package; length is undocumented. ':'Package valve count is not explicitly established by the source text. '}${settings.tireSetup==='tubes'?'Tubeless valves do not replace the valves attached to the requested inner tubes. ':''}Confirm rim hole/base, insert compatibility and pump access. ${extraNote(valve)}`,sourceList(valve));
 }

 const frameBB=frameBottomBracket(frame),frameStandard=standardOf(frameBB?.value),frameShellWidth=frameWidth(frameBB?.value);
 for(const bb of bottomBrackets){
  const specs=staticSpecs(bb),standard=standardOf(specs?.frameStandard),crank=crankOf(drivetrain),bbCrank=crankFamily(specs?.crankFamily);
  const generic=new Set(['Unspecified threaded','Unspecified press-fit']);
  const threaded=new Set(['BSA','Italian','T47','T47a','Unspecified threaded']);
  const familyMismatch=frameStandard&&standard&&(threaded.has(frameStandard)!==threaded.has(standard)||!generic.has(frameStandard)&&!generic.has(standard)&&frameStandard!==standard);
  const widths=[specs?.shellWidthMm,specs?.alternativeShellWidthMm].filter(positive);
  const widthMismatch=frameStandard&&standard&&frameStandard===standard&&positive(frameShellWidth)&&widths.length&&!widths.includes(frameShellWidth);
  const crankMismatch=crank&&bbCrank&&(/DUB/i.test(crank)!==/DUB/i.test(bbCrank));
  add('finishing-bb-'+bb.id,'Bottom bracket shell & crank',familyMismatch||widthMismatch||crankMismatch?'conflict':'review',
   `${bb.name}: ${standard||'selected-variant frame standard unconfirmed'}${widths.length?' / '+widths.join(' or ')+' mm shell':''}; ${bbCrank||'crank interface unconfirmed'}. ${frameBB?'Frame source lists '+frameBB.value+'. ':'Exact frame shell/threading is unconfirmed. '}${familyMismatch?'The documented direct-fit shell standards differ. ':''}${widthMismatch?'The documented shell widths differ. ':''}${crankMismatch?'The source-stated crank and bottom-bracket families differ. ':''}${!crank?'The exact crank spindle/family has not been documented here; brand or shifting family is not used as proof. ':''}Even equal nominal standards require supplier confirmation of bore/thread, shell width, crank/spacers and installation. No conversion adapter is assumed. ${extraNote(bb)}`,
   [...sourceList(bb,['frameStandard','shellWidthMm','alternativeShellWidthMm','spindleDiameterMm','crankFamily']),...(frameBB?[sourceOf(frame,frameBB)]:[]),...(crank?sourceList(drivetrain):[])]);
 }
 if(frame&&drivetrain&&!bottomBrackets.length)add('finishing-bb-missing','Bottom bracket sourcing','review','No separate bottom-bracket package is selected. Confirm whether the exact groupset includes one and quote the correct frame-shell/crank/spacer combination; this is not treated as a free or supplied part.',sourceList(drivetrain,['package']));
 if(bottomBrackets.reduce((sum,p)=>sum+quantity(p),0)>1)notes.push('Multiple bottom-bracket packages are selected. Identify installation, alternatives or spares; one bicycle does not install all of them.');

 const exclusions=driveSpecs.Excluded||driveSpecs.Completion||'';
 if(exclusions)notes.push(`${drivetrain.name}: ${exclusions}. Extra selections are separate purchases; no unverified package credit is deducted.`);
 if(redRotorPair)notes.push(`${drivetrain.name} already lists a Paceline X 160/160 mm rotor pair and Hammerhead Karoo in its package. Added rotors/computers are extra purchases or spares; no price credit is assumed.`);
 for(const p of lines){
  const specs=staticSpecs(p)||{};
  if(specs['Included cleats']&&lines.some(q=>q.id==='exp-extras-shimano-sm-sh11-floating-cleats'))notes.push(`${p.name} already lists ${specs['Included cleats']} cleats. The separate SM-SH11 selection is an additional purchase; confirm whether it is a spare.`);
  if(p.id==='exp-extras-garmin-edge-1050-device-only'&&lines.some(q=>['exp-extras-lezyne-gps-forward-mount-garmin-wahoo','exp-extras-magene-out-front-bike-mount'].includes(q.id)))notes.push('The Edge 1050 source package already lists out-front and standard mounts. An extra mount is a separate purchase; confirm cockpit fit before treating it as required.');
 }
 return {checks,notes:[...new Set(notes)]};
}

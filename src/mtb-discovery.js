import {normalizeMtbPlan,evaluateMtbBuild,configureMtbProduct,mtbSteps} from './mtb-build.js';

const categoryFor=key=>['frontTire','rearTire'].includes(key)?'tires':key;
const related={
 frame:['included-fork-replacement','included-shock-replacement','included-seatpost-replacement','hardtail-shock','shock-eye','shock-stroke','shock-mount','fork-travel','rear-axle','frame-front-wheel','frame-rear-wheel','front-tire-clearance','rear-tire-clearance','udh','frame-brakes','seatpost-diameter'],
 fork:['included-fork-replacement','fork-travel','front-axle','fork-wheel','fork-tire-clearance','fork-brakes'],
 shock:['included-shock-replacement','hardtail-shock','shock-eye','shock-stroke','shock-mount'],
 wheels:['front-axle','rear-axle','fork-wheel','frame-front-wheel','frame-rear-wheel','front-tire-diameter','rear-tire-diameter','front-tire-system','rear-tire-system','freehub'],
 frontTire:['front-tire-diameter','front-tire-system','front-tire-clearance','fork-tire-clearance'],
 rearTire:['rear-tire-diameter','rear-tire-system','rear-tire-clearance'],
 drivetrain:['freehub','udh','chain-standard'],brakes:['frame-brakes','fork-brakes'],
 cockpit:['bar-clamp'],seatpost:['included-seatpost-replacement','seatpost-diameter'],chain:['chain-standard'],saddle:[],extras:[],
};

// Simulate the exact candidate without changing the customer's saved selection.
// Only checks involving this selection affect its conflict filter.
export function mtbCandidateImpact(data,rawPlan,key,id){
 const row=data.records.find(r=>r.product.id===id);
 if(!row||row.category!==categoryFor(key)||row.category==='bike'||row.product.buildEligible===false)return null;
 const plan=normalizeMtbPlan(rawPlan,data),before=evaluateMtbBuild(data,plan),next=structuredClone(plan);
 if(key==='chain')next.chain=id;
 else if(key==='extras'){if(!next.extras.includes(id))next.extras.push(id);}
 else next.selection[key]=id;
 const after=evaluateMtbBuild(data,next),product=configureMtbProduct(row.product,plan,data);
 const relevant=new Set(related[key]||[]);
 // A supplied fork also changes with its parent frame; unrelated separately selected forks do not.
 if(key==='frame'&&after.parts.fork?.includedParentId===id)for(const check of related.fork)relevant.add(check);
 const conflicts=after.checks.filter(c=>c.status==='conflict'&&relevant.has(c.id));
 const previous=key==='extras'?before.additionalLines.find(p=>p.id===id):before.parts[key];
 const comparableMass=previous&&!previous.includedInPackage&&Number.isFinite(previous.weight)&&Number.isFinite(product.weight)&&previous.weightBasis&&product.weightBasis;
 return{product,previous,conflicts,knownSubtotal:after.knownSubtotal,unpriced:after.unpriced.length,
  priceDelta:before.unpriced.length||after.unpriced.length?null:after.knownSubtotal-before.knownSubtotal,
  massDelta:comparableMass?product.weight-previous.weight:null,
  missing:after.missing,essentials:after.unresolvedEssentials,
  scope:'Reference sourcing packages only. Missing parts, installation and complete fit still need a quote.'};
}

export function mtbSourceAvailable(product){
 const lines=product.sources?.filter(s=>!s.referenceOnly)||[];
 return lines.length>0&&lines.every(s=>s.listedAvailable===true);
}
export function normalizeMtbPreferences(raw={}){
 return{budget:typeof raw.budget==='number'&&Number.isFinite(raw.budget)&&raw.budget>=1&&raw.budget<=2000000?Math.round(raw.budget):null};
}
export function mtbBuildProgress(build,budget=null){
 const steps=mtbSteps(build).filter(k=>!['review','extras'].includes(k)),configured=steps.filter(k=>!build.missing.includes(k));
 const target=normalizeMtbPreferences({budget}).budget;
 return{configured:configured.length,total:steps.length,percent:Math.round(configured.length/steps.length*100),next:steps.find(k=>build.missing.includes(k))||'review',
  budget:target,remaining:target===null?null:target-build.knownSubtotal,
  budgetScope:build.unpriced.length||build.missing.length||build.unresolvedEssentials.length?'Partial subtotal; missing or unpriced parts can change the final budget.':'Reference packages; final supplier, assembly and delivery prices still need confirmation.'};
}

import {productRatings} from './ratings.js';
import {frameGoalPoints} from './build-ratings.js';
import {featureRegister,research} from './build-plan.js';

const scale=(n,low,high)=>Number.isFinite(n)?Math.round((1+9*Math.max(0,Math.min(1,(high-n)/(high-low))))*10)/10:null;
export function materialOf(p,category){
 const materialEvidence=featureRegister[p.id]?.material;
 const listed=materialEvidence?.value||(category==='frame'&&/Carbon Black|Carbon \/ Gold Pearl/.test(p.frameEvidence?.material?.excerpt||'')?null:p.frameSpecs?.material)||p.wheelSpecs?.material;
 if(listed){if(/carbon/i.test(listed))return 'Carbon';if(/alloy|alumin/i.test(listed))return 'Alloy';}
 const explicit=p.tag+' '+p.name;
 if(/carbon(?!\s*(?:black|\/\s*gold))|FACT (?:10|12)r/i.test(explicit))return 'Carbon';if(/alloy|alumini?um|E5 alloy/i.test(explicit))return 'Alloy';
 return 'Unconfirmed';
}
export function scienceProfile(p,category){
 const source=p.sources?.[0]?.url,weight=Number.isFinite(p.weight)?p.weight:null;
 let massSource=source,mass=weight,basis=p.weightBasis||'No reviewed mass for this supplied package.',massLabel='Package mass',massScore=null;
 if(category==='frame')massScore=scale(mass,1.2,2.5);
 if(category==='frame'&&mass===null&&featureRegister[p.id]?.bareFrameMass){const b=featureRegister[p.id].bareFrameMass;mass=b.value;basis=b.basis;massLabel='Reference bare frame';massSource=b.url;massScore=scale(mass,.55,1.4);}
 if(category==='wheels')massScore=productRatings(p,'wheels').find(r=>r.key==='mass')?.score??null;
 if(category==='cockpit'&&featureRegister[p.id]?.barMass){const b=featureRegister[p.id].barMass;mass=b.value;basis=b.basis;massLabel='Handlebar only';massScore=scale(mass,.15,.4);}
 const focus=p.buildEvidence?.designFocus,points=focus?.url&&focus?.excerpt?frameGoalPoints[focus.value]:null;
 const depth=category==='wheels'?productRatings(p,'wheels').find(r=>r.key==='depth'):null;
 return[{key:'mass',label:massLabel,score:massScore,actual:mass===null?'Unverified':mass.toFixed(3)+' kg',basis:massLabel==='Handlebar only'?basis+' Fixed bar scale: 150 g = 10; 400 g = 1.':massLabel==='Reference bare frame'?basis+' Fixed bare-frame scale: 0.55 kg = 10; 1.40 kg = 1. Separate from the package-mass scale.':category==='frame'?basis+' Fixed package scale: 1.20 kg = 10; 2.50 kg = 1. Package inclusions vary; this is a mass profile, not climbing performance.':basis,source:massSource},
  {key:'aero',label:category==='wheels'?'Depth proxy · aero focus':'Aero / race intent',score:points?.race??depth?.score??null,actual:category==='wheels'?(p.wheelSpecs?.depthMm?([p.wheelSpecs.depthMm].flat().join(' / ')+' mm'):p.profileFacts?.rimDepthMm?p.profileFacts.rimDepthMm+' mm':'No drag test'):focus?.value||'No comparable test',basis:points?'RCS editorial frame-purpose rubric (aero 10, race 9, lightweight 7, endurance 5). Source description, not measured aerodynamics.':depth?.basis||'No comparable drag test or sourced performance rubric. Carbon material alone does not establish aerodynamics.',source:focus?.url||depth?.evidence?.[0]||source},
  {key:'climb',label:'Climbing / low-mass intent',score:points?.climbing??(category==='wheels'?massScore:null),actual:points?focus.value:category==='wheels'?'Listed pair mass':'Evidence needed',basis:points?'RCS editorial frame-purpose rubric (lightweight 10, race 8, aero 6, endurance 6). Not a measured climbing test.':category==='wheels'?'Uses only the same wheel-pair low-mass profile above. Not an independent performance measurement or extra weight in the goal score.':'No comparable sourced climbing or mass input.',source:focus?.url||source},
  {key:'stiffness',label:'Stiffness',score:null,actual:'Test data needed',basis:'No comparable, reviewed stiffness test in the catalog for this product and reference size. No points are inferred from carbon grade, price or marketing.',source:null}];
}
export function documentedMass(build){
 const rows=Object.entries(build.parts||{}).filter(([key,p])=>['frame','wheels','tires'].includes(key)&&Number.isFinite(p.weight)).map(([key,p])=>({key,name:p.name,kg:p.weight,basis:p.weightBasis,source:p.sources[0]?.url}));
 for(const p of build.additionalLines||[])if(p.role==='Optional extra'&&Number.isFinite(p.weight))rows.push({key:p.id,name:p.name,kg:p.weight,basis:p.weightBasis,source:p.sources[0]?.url});
 return{kg:rows.reduce((n,p)=>n+p.kg,0),rows,missing:Object.entries(build.parts||{}).filter(([key,p])=>!['frame','wheels','tires'].includes(key)||!Number.isFinite(p.weight)).map(([key])=>key),complete:false};
}
export function climbingPowerDelta(baseline,selected,speedKph=15,gradePercent=6){
 const valid=p=>p&&Number.isFinite(p.weight)&&p.weight>0&&p.profileEvidence?.weight?.url&&p.profileEvidence?.weight?.excerpt;
 if(!valid(baseline)||!valid(selected)||!Number.isFinite(speedKph)||speedKph<5||speedKph>60||!Number.isFinite(gradePercent)||gradePercent<0||gradePercent>20)return null;
 const kgSaved=baseline.weight-selected.weight,watts=kgSaved*9.80665*(speedKph/3.6)*Math.sin(Math.atan(gradePercent/100));
 return{kgSaved,watts,speedKph,gradePercent,source:research.cyclingPower.url,scope:'Gravity-only wheel-mass delta at steady speed. Excludes aero, rolling losses, drivetrain efficiency, acceleration and rider changes. Listed pair weights may use different measurement conditions; no complete-bike speed claim.'};
}

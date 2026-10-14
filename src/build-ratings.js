import { productRatings } from './ratings.js';

export const buildRatingVersion='1.0';
export const buildGoals={
 allround:{label:'Balanced road',weights:{frame:0.45,mass:0.35,width:0.20}},
 race:{label:'Racing & aero focus',weights:{frame:0.50,depth:0.30,mass:0.20}},
 climbing:{label:'Climbing & low-mass focus',weights:{frame:0.40,mass:0.60}},
 endurance:{label:'Comfort & endurance focus',weights:{frame:0.40,width:0.60}},
};
// Editorial suitability rubric, not an engineering or quality ranking.
export const frameGoalPoints={
 race:{allround:9,race:9,climbing:8,endurance:6},
 aero:{allround:7,race:10,climbing:6,endurance:5},
 lightweight:{allround:8,race:7,climbing:10,endurance:7},
 endurance:{allround:8,race:5,climbing:6,endurance:10},
};
const round=n=>Math.round(n*10)/10;
export function rateBuild(build,requestedGoal='allround') {
 const goal=Object.hasOwn(buildGoals,requestedGoal)?requestedGoal:'allround';
 const parts=build.parts||{},frame=parts.frame,wheels=parts.wheels,tires=parts.tires;
 const intent=frame?.buildEvidence?.designFocus;
 const frameScore=intent?.url&&intent?.excerpt?frameGoalPoints[intent.value]?.[goal]??null:null;
 const wheelRatings=wheels?productRatings(wheels,'wheels'):[];
 const tireRatings=tires?productRatings(tires,'tires'):[];
 const candidates={
  frame:{label:'Frame purpose match',score:frameScore,product:frame,
   explanation:intent?`RCS classifies this frame as ${intent.value}, based on the linked description. The published editorial goal table assigns ${frameScore??'no'} points for ${buildGoals[goal].label}. This is intended use, not a frame weight or aero test.`:'Frame purpose has no reviewed evidence yet.',
   evidence:intent?.url?[intent.url]:[],excerpt:intent?.excerpt},
  depth:{label:'Wheel depth profile',...wheelRatings.find(r=>r.key==='depth'),product:wheels},
  mass:{label:'Wheelset low-mass profile',...wheelRatings.find(r=>r.key==='mass'),product:wheels},
  width:{label:'Tire volume profile',...tireRatings.find(r=>r.key==='volume'),product:tires},
 };
 const signals=Object.entries(buildGoals[goal].weights).map(([key,weight])=>{
  const item=candidates[key];return{...item,key,weight,score:Number.isFinite(item.score)?item.score:null,explanation:item.explanation||item.basis||'Reviewed specification missing.',evidence:item.evidence||[]};
 });
 const known=signals.filter(s=>s.score!==null),coverage=known.reduce((n,s)=>n+Math.round(s.weight*100),0);
 const provisional=known.length?round(known.reduce((n,s)=>n+s.score*Math.round(s.weight*100),0)/coverage):null;
 const issues=[...(build.errors||[]),...Object.values(parts).filter(p=>p.missingEssentials?.length).map(p=>`${p.name} still requires ${p.missingEssentials.join(', ')}; these are not priced in this package.`)];
 const blocked=issues.length>0,complete=['frame','wheels','tires','drivetrain','brakes','cockpit','saddle'].every(key=>Boolean(parts[key]));
 const overall=!blocked&&coverage===100&&complete?provisional:null;
 return{version:buildRatingVersion,goal,label:buildGoals[goal].label,signals,coverage,provisional:blocked?null:provisional,overall,blocked,complete,issues,
  status:blocked?'Resolve build issues':overall!==null?'Specification goal match':provisional!==null?'Provisional goal match':'More evidence needed',
  missing:signals.filter(s=>s.score===null).map(s=>s.label),
  // Cost, frame package weights, and undocumented controls/saddle traits do not feed the score.
  unscoredCategories:['drivetrain','brakes','cockpit','saddle'],
 };
}

export function buildRatingText(build,goal) {
 const profile=rateBuild(build,goal);
 return[
  `RCS BUILD GOAL MATCH v${profile.version} — ${profile.label}`,
  `${profile.status}: ${profile.overall??profile.provisional??'Pending'}${profile.overall!==null||profile.provisional!==null?'/10':''} · evidence weight covered ${profile.coverage}%`,
  ...profile.signals.flatMap(s=>[`${s.label}: ${s.score??'Pending'}${s.score!==null?'/10':''} · weight ${Math.round(s.weight*100)}% · ${s.product?.name||'Product missing'}`,s.explanation,...s.evidence.map(url=>'Evidence: '+url)]),
  ...profile.issues,
  'Editorial specification-to-goal estimate only, not measured speed, aerodynamics, climbing performance, comfort, quality, safety or full compatibility. Missing signals are disclosed; a provisional score uses known weights only.',
  'Price is excluded. Frame purpose, listed wheel-pair mass/depth and nominal tire width are the only scored signals. Controls, drivetrain, cockpit and saddle remain selected but are not assigned invented performance points.',
 ].join('\n');
}

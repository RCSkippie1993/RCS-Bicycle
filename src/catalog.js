// Real model references, not supplier offers. Manufacturer pages are currently
// blocked by the environment network policy; specifications and variants must
// be reviewed before adding prices, weights, photographs or fit guarantees.
const product=(id,brand,name,tag,manufacturerUrl,extra={})=>({
 id,brand,name,tag,manufacturerUrl,price:null,weight:null,image:null,
 verification:{status:'pending',reviewedAt:null,sourceUrl:null},...extra
});
const specialized='https://www.specialized.com/za/en';
const shimano='https://bike.shimano.com/';
const dtSwiss='https://www.dtswiss.com/en';
const continental='https://www.continental-tires.com/products/b2c/bicycle/';
const pro='https://www.pro-bikegear.com/';
export const catalog={
 frame:{label:'Frameset',items:[
  product('allez-sprint','Specialized','Specialized Allez Sprint Frameset','Aluminium road frameset · size and model year to confirm',specialized,{maxTire:null}),
  product('aethos','Specialized','Specialized Aethos Frameset','Carbon road frameset · size and model year to confirm',specialized,{maxTire:null}),
  product('tarmac-sl8','Specialized','Specialized S-Works Tarmac SL8 Frameset','Carbon race frameset · size and model year to confirm',specialized,{maxTire:null})]},
 wheels:{label:'Wheelset',items:[
  product('e1800','DT Swiss','DT Swiss E 1800 SPLINE','Disc road wheelset · rim and freehub variant to confirm',dtSwiss),
  product('er1600','DT Swiss','DT Swiss ER 1600 SPLINE','Disc road wheelset · rim and freehub variant to confirm',dtSwiss),
  product('arc1400','DT Swiss','DT Swiss ARC 1400 DICUT','Disc aero wheelset · depth and freehub variant to confirm',dtSwiss)]},
 tires:{label:'Tires',items:[
  product('gp5000-28','Continental','Continental Grand Prix 5000 · 28C','Tube-type · 700 × 28C · pair requested',continental,{width:28}),
  product('gp5000-32','Continental','Continental Grand Prix 5000 · 32C','Tube-type · 700 × 32C · pair requested',continental,{width:32})]},
 drivetrain:{label:'Drivetrain',items:[
  product('105-mechanical','Shimano','Shimano 105 R7100 mechanical','2×12 · drivetrain components; brakes and levers separate',shimano,{controlSystem:'mechanical-12'}),
  product('105-di2','Shimano','Shimano 105 Di2 R7100 series','2×12 electronic · drivetrain and electronics; controls separate',shimano,{controlSystem:'di2-12'})]},
 brakes:{label:'Brakes & levers',items:[
  product('105-r7120','Shimano','Shimano 105 ST-R7120 / BR-R7170','Mechanical shifting · hydraulic disc controls and calipers',shimano,{controlSystem:'mechanical-12'}),
  product('105-r7170','Shimano','Shimano 105 ST-R7170 / BR-R7170','Di2 shifting · hydraulic disc controls and calipers',shimano,{controlSystem:'di2-12'})]},
 cockpit:{label:'Cockpit',items:[
  product('pro-plt','PRO','PRO PLT Compact handlebar + PLT stem','Alloy cockpit · bar width and stem fit to confirm',pro),
  product('pro-vibe','PRO','PRO Vibe Aero Carbon handlebar + Vibe stem','Carbon handlebar · width and stem fit to confirm',pro)]},
 saddle:{label:'Saddle',items:[
  product('power-comp','Specialized','Specialized Power Comp','Saddle only · width and frame-specific seatpost to confirm',specialized),
  product('power-expert','Specialized','Specialized Power Expert','Saddle only · width and rail compatibility to confirm',specialized)]}
};
export const defaults=Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,group.items[0].id]));
export function evaluate(selection={}){
 const parts=Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,group.items.find(p=>p.id===selection[key])||group.items[0]]));
 const errors=[];
 if(parts.drivetrain.controlSystem!==parts.brakes.controlSystem) errors.push('The selected shift levers and drivetrain use different control systems. Match mechanical 105 with ST-R7120, or 105 Di2 with ST-R7170.');
 if(Number.isFinite(parts.frame.maxTire)&&parts.tires.width>parts.frame.maxTire) errors.push(`${parts.tires.width} mm tires exceed this frame’s ${parts.frame.maxTire} mm clearance.`);
 const selected=Object.values(parts);
 const total=field=>selected.every(p=>Number.isFinite(p[field]))?selected.reduce((n,p)=>n+p[field],0):null;
 return {parts,errors,price:total('price'),weight:total('weight'),compatibilityVerified:false,scores:{Aerodynamics:null,Climbing:null,Comfort:null}};
}
export const money=n=>Number.isFinite(n)?new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(n):'Quote required';

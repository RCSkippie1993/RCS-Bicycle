// Fictional demonstration products. No supplier pricing or measured performance claims.
export const catalog = {
 frame: { label: 'Frameset', items: [
  {id:'allroad',name:'RCS Allroad 01',tag:'Balanced / aluminium',price:9500,weight:2.1,aero:5,comfort:8,maxTire:32},
  {id:'aero',name:'RCS Aero 01',tag:'Race / carbon concept',price:24500,weight:1.7,aero:9,comfort:5,maxTire:28},
  {id:'climb',name:'RCS Summit 01',tag:'Climbing / carbon concept',price:21500,weight:1.35,aero:6,comfort:7,maxTire:30}]},
 wheels: {label:'Wheelset',items:[
  {id:'alloy',name:'Alloy 28',tag:'28 mm / everyday reliability',price:4200,weight:1.85,aero:4},
  {id:'carbon',name:'Carbon 50',tag:'50 mm / aero profile',price:12500,weight:1.55,aero:9},
  {id:'light',name:'Carbon 35',tag:'35 mm / low weight',price:13800,weight:1.3,aero:6}]},
 tires:{label:'Tires',items:[
  {id:'race',name:'Road Race 28',tag:'28 mm / pair',price:1600,weight:.5,width:28,comfort:6},
  {id:'endurance',name:'Endurance 32',tag:'32 mm / pair',price:1400,weight:.65,width:32,comfort:9}]},
 drivetrain:{label:'Drivetrain',items:[
  {id:'mechanical',name:'Road 2×11',tag:'Mechanical / 50–34 · 11–32',price:6500,weight:1.8},
  {id:'electronic',name:'Road 2×12',tag:'Electronic concept / 50–34 · 11–34',price:15500,weight:1.55}]},
 brakes:{label:'Brakes & levers',items:[
  {id:'hydraulic',name:'Hydraulic control kit',tag:'Matched levers + calipers + rotors',price:4800,weight:.85}]},
 cockpit:{label:'Cockpit',items:[
  {id:'standard',name:'Alloy cockpit',tag:'Bar + stem + tape',price:1800,weight:.5},
  {id:'carbonbar',name:'Carbon cockpit',tag:'Bar + stem + tape',price:4600,weight:.32}]},
 saddle:{label:'Saddle & seatpost',items:[
  {id:'comfort',name:'Endurance contact kit',tag:'Saddle + matched seatpost',price:1900,weight:.55},
  {id:'sport',name:'Race contact kit',tag:'Saddle + matched seatpost',price:3500,weight:.35}]}
};
export const defaults = Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,group.items[0].id]));
export function evaluate(selection){
 const parts=Object.fromEntries(Object.entries(catalog).map(([key,group])=>[key,group.items.find(p=>p.id===selection[key])||group.items[0]]));
 const errors=[];
 if(parts.tires.width>parts.frame.maxTire) errors.push(`${parts.tires.width} mm tires exceed this frame’s ${parts.frame.maxTire} mm clearance. Choose narrower tires or another frame.`);
 const weight=Object.values(parts).reduce((n,p)=>n+p.weight,0)+.45;
 return {parts,errors,price:Object.values(parts).reduce((n,p)=>n+p.price,0),weight,scores:{Aerodynamics:Math.round((parts.frame.aero+parts.wheels.aero)/2),Climbing:Math.max(1,Math.min(10,Math.round(15-weight))),Comfort:Math.round((parts.frame.comfort+parts.tires.comfort)/2)}};
}
export const money=n=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(n);

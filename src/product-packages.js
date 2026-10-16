// Package pricing is contextual. A catalog check remains unpriced outside its exact group.
export function resolvePackages(rawParts){
 const parts={...rawParts},drive=parts.drivetrain,brake=parts.brakes,frame=parts.frame,cockpit=parts.cockpit;
 if(frame&&cockpit?.includedConfirmed===true&&cockpit.packageIncludedInFrame?.includes(frame.id))parts.cockpit={...cockpit,price:0,includedInSelectedPackage:true,pricingLabel:"Included in selected frame package",priceBasis:`Cockpit is already included in ${frame.name}; no independent charge.`};
 if(drive&&brake?.includedConfirmed===true&&brake.packageIncludedIn?.includes(drive.id)){
  parts.brakes={...brake,price:0,includedInSelectedPackage:true,pricingLabel:'Included in selected groupset',priceBasis:`Controls and calipers are already priced in ${drive.name}; no separate charge.`,stockNote:'Package inclusion only; confirm exact supply, hoses and rotor requirements.'};
 }
 return parts;
}
export const driveFamily=p=>p?.driveFamily||(['105-mechanical','105-di2'].includes(p?.id)?'shimano-hg12':null);
export const driveSpeeds=p=>p?.speeds||(['105-mechanical','105-di2'].includes(p?.id)?12:null);
export function chainCompatibility(drive,chain){
 const family=driveFamily(drive),speeds=driveSpeeds(drive),allowed=chain?.compatibleDriveFamilies||[],chainSpeeds=Array.isArray(chain?.speeds)?chain.speeds:chain?.speeds?[chain.speeds]:[];
 const speedConflict=speeds&&chainSpeeds.length&&!chainSpeeds.includes(speeds);
 const familyConflict=family&&allowed.length&&!allowed.includes(family);
 const known=family&&allowed.includes(family)&&(!speeds||!chainSpeeds.length||chainSpeeds.includes(speeds));
 return{family,speeds,status:speedConflict||familyConflict?'conflict':'review',detail:speedConflict?`The selected chain is listed for ${chainSpeeds.join(' / ')} speeds; this drivetrain uses ${speeds}.`:familyConflict?`The selected ${chain.name} lists ${allowed.join(', ')}, while this drivetrain uses ${family}. Select the matching chain standard; a brand or speed count alone does not establish compatibility.`:known?`The listed chain family matches ${family}. Confirm the exact cassette/chainrings, correct installed length and connector; full fit is not certified.`:'Road compatibility for this exact chain/drivetrain is unconfirmed. Ask the supplier to confirm the chain standard, cassette, chainrings, connector and installed length.'};
}
export function matchingBrakePackage(drive,items){
 return items.find(p=>p.packageIncludedIn?.includes(drive.id))||items.find(p=>p.controlSystem===drive.controlSystem&&!p.packageIncludedIn?.length);
}

export const frameFocusLabels={race:'Road racing',aero:'Aero focus',lightweight:'Lightweight / climbing focus',endurance:'Endurance / all-road',unknown:'Purpose not yet classified'};
export const frameFocus=product=>Object.hasOwn(frameFocusLabels,product.buildEvidence?.designFocus?.value)?product.buildEvidence.designFocus.value:'unknown';
export const matchesFrameFilter=(product,focus)=>!focus||frameFocus(product)===focus;

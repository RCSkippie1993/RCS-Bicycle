import data from './catalog-data.json' with { type: 'json' };
import wheelData from './wheel-data.json' with {type:'json'};
import frameData from './frame-data.json' with {type:'json'};
import expansion from './expanded-data.json' with {type:'json'};
import guidedData from './guided-data.json' with {type:'json'};
import {resolvePackages} from './product-packages.js';
import { inspectParts } from './compatibility.js';

export const expandedRecords=expansion.records;
// These existing source variants can now be considered by the wider road drivetrain range.
// Nominal freehub/type evidence does not establish full axle, cassette or tyre approval.
const reviewedRoadWheel=p=>p.buildEligible||p.wheelSpecs?.brake==='disc'&&p.wheelSpecs?.usage==='road'&&['xdr','n3w','campagnolo'].includes(p.wheelSpecs?.freehub)&&p.wheelSpecs?.tireSystem!=='tubular';
const builderWheels=wheelData.wheelsets.filter(reviewedRoadWheel).map(p=>p.buildEligible?p:{...p,buildEligible:true,builderNote:'Road disc reference. Confirm exact freehub/cassette, endcaps, axle and tyre/rim approval for the selected drivetrain.'});
const baseCatalog={...data.catalog,frame:{...data.catalog.frame,items:[...data.catalog.frame.items,...frameData.framesets.filter(p=>p.buildEligible)]},wheels:{...data.catalog.wheels,items:[...data.catalog.wheels.items,...builderWheels]}};
export const catalog=Object.fromEntries(Object.entries(baseCatalog).map(([key,group])=>[key,{...group,items:[...group.items,...expandedRecords.filter(r=>r.category===key&&r.product.buildEligible!==false).map(r=>r.product)]}]));
export const frameReferences=frameData.framesets.filter(p=>!p.buildEligible);
export const frameCoverage=frameData.coverage;
export const wheelReferences=wheelData.wheelsets.filter(p=>!reviewedRoadWheel(p));
export const wheelCoverage=wheelData.coverage;
export const collectionOnly=expandedRecords.filter(r=>Object.hasOwn(catalog,r.category)&&r.product.buildEligible===false);
export const expansionCoverage=expansion.coverage;
export const optionRegister={...guidedData.options,...expansion.options};
export const featureRegister={...guidedData.features,...expansion.features};
function supplement(p,category){
 const oldChain=p.id.startsWith('chain-m7100')?{chainFamily:'Shimano HG+ 12-speed',speeds:[12],compatibleDriveFamilies:['shimano-hg12']}:p.id==='chain-kmc-x12'?{chainFamily:'KMC X12',speeds:[12],compatibleDriveFamilies:['shimano-hg12']}:p.id==='chain-red-e1'?{chainFamily:'SRAM Road Flattop',speeds:[12,13],compatibleDriveFamilies:['sram-flattop12','sram-flattop13']}:{};
 return{tag:p.kind||'',pricingLabel:'SA retailer reference',priceBasis:category==='chain'?'One chain in the source-listed length':'One source-listed accessory package',stockNote:p.sources.some(s=>s.listedAvailable===false)?'Source variant listed unavailable; sourcing required':'Source snapshot; supplier must reconfirm variant and availability',verification:{status:'listing-reviewed',reviewedAt:p.checkedAt,sourceUrl:p.sources[0].url},photoCaption:'Retailer source photograph; confirm reference variant and package contents',fitNote:'Confirm exact mounting, sizing, interfaces and supplied contents before use.',...p,...oldChain};
}
export const chainReferences=[...guidedData.chains.map(p=>supplement(p,'chain')),...expandedRecords.filter(r=>r.category==='chain').map(r=>r.product)];
export const extraReferences=[...guidedData.extras.map(p=>supplement(p,'extras')),...expandedRecords.filter(r=>r.category==='extras').map(r=>r.product)];
export const chainOffers=chainReferences.filter(p=>p.buildEligible!==false);
export const extraOffers=extraReferences.filter(p=>p.buildEligible!==false);
export const completeBikes = data.completeBikes;
export const checkedAt = data.checkedAt;
export const defaults = Object.fromEntries(Object.entries(catalog).map(([key, group]) => [key, group.items[0].id]));
export const money = n => Number.isFinite(n) ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits:0, maximumFractionDigits:Number.isInteger(n)?0:2 }).format(n) : 'Quote required';
export const displayDate = day => new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeZone: 'Africa/Johannesburg' }).format(new Date(day + 'T12:00:00Z'));
const latestReview=[checkedAt,wheelData.reviewedAt,frameData.reviewedAt,expansion.reviewedAt].sort().at(-1);
export const checkedDate=displayDate(checkedAt)+(latestReview===checkedAt?'':' – '+displayDate(latestReview));

export function evaluate(selection = {}, settings = {}) {
 const parts = resolvePackages(Object.fromEntries(Object.entries(catalog).map(([key, group]) => [key, group.items.find(p => p.id === selection[key]) || group.items[0]])));
 const compatibility=inspectParts(parts,settings),errors=compatibility.errors,warnings=[];
 if (!Number.isFinite(parts.frame.maxTire)) warnings.push('Tire clearance has not been confirmed for this frameset.');
 for (const item of Object.values(parts)) if (item.fitNote) warnings.push(item.fitNote);
 const selected = Object.values(parts), unpriced = selected.filter(p => !Number.isFinite(p.price));
 const knownSubtotal = selected.reduce((n, p) => n + (Number.isFinite(p.price) ? p.price : 0), 0);
 return { parts, errors, warnings, compatibility, knownSubtotal, unpriced, price: unpriced.length ? null : knownSubtotal, weight: null, compatibilityVerified: false, scores: { Aerodynamics: null, Climbing: null, Comfort: null } };
}

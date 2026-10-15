import data from './catalog-data.json' with { type: 'json' };
import wheelData from './wheel-data.json' with {type:'json'};
import frameData from './frame-data.json' with {type:'json'};
import { inspectParts } from './compatibility.js';

export const catalog = {...data.catalog,frame:{...data.catalog.frame,items:[...data.catalog.frame.items,...frameData.framesets.filter(p=>p.buildEligible)]},wheels:{...data.catalog.wheels,items:[...data.catalog.wheels.items,...wheelData.wheelsets.filter(p=>p.buildEligible)]}};
export const frameReferences=frameData.framesets.filter(p=>!p.buildEligible);
export const frameCoverage=frameData.coverage;
export const wheelReferences=wheelData.wheelsets.filter(p=>!p.buildEligible);
export const wheelCoverage=wheelData.coverage;
export const completeBikes = data.completeBikes;
export const checkedAt = data.checkedAt;
export const defaults = Object.fromEntries(Object.entries(catalog).map(([key, group]) => [key, group.items[0].id]));
export const money = n => Number.isFinite(n) ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits:0, maximumFractionDigits:Number.isInteger(n)?0:2 }).format(n) : 'Quote required';
export const displayDate = day => new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeZone: 'Africa/Johannesburg' }).format(new Date(day + 'T12:00:00Z'));
export const checkedDate = displayDate(checkedAt)+(wheelData.reviewedAt===checkedAt?'':' – '+displayDate(wheelData.reviewedAt));

export function evaluate(selection = {}, settings = {}) {
 const parts = Object.fromEntries(Object.entries(catalog).map(([key, group]) => [key, group.items.find(p => p.id === selection[key]) || group.items[0]]));
 const compatibility=inspectParts(parts,settings),errors=compatibility.errors,warnings=[];
 if (!Number.isFinite(parts.frame.maxTire)) warnings.push('Tire clearance has not been confirmed for this frameset.');
 for (const item of Object.values(parts)) if (item.fitNote) warnings.push(item.fitNote);
 const selected = Object.values(parts), unpriced = selected.filter(p => !Number.isFinite(p.price));
 const knownSubtotal = selected.reduce((n, p) => n + (Number.isFinite(p.price) ? p.price : 0), 0);
 return { parts, errors, warnings, compatibility, knownSubtotal, unpriced, price: unpriced.length ? null : knownSubtotal, weight: null, compatibilityVerified: false, scores: { Aerodynamics: null, Climbing: null, Comfort: null } };
}

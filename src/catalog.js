import data from './catalog-data.json' with { type: 'json' };

export const catalog = data.catalog;
export const completeBikes = data.completeBikes;
export const checkedAt = data.checkedAt;
export const defaults = Object.fromEntries(Object.entries(catalog).map(([key, group]) => [key, group.items[0].id]));
export const money = n => Number.isFinite(n) ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits:0, maximumFractionDigits:Number.isInteger(n)?0:2 }).format(n) : 'Quote required';
export const checkedDate = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeZone: 'Africa/Johannesburg' }).format(new Date(checkedAt + 'T12:00:00Z'));

export function evaluate(selection = {}) {
 const parts = Object.fromEntries(Object.entries(catalog).map(([key, group]) => [key, group.items.find(p => p.id === selection[key]) || group.items[0]]));
 const errors = [], warnings = [];
 if (parts.drivetrain.controlSystem !== parts.brakes.controlSystem) errors.push('The selected shift levers and drivetrain use different control systems. Match mechanical 105 with ST-R7120, or 105 Di2 with the Di2 package check.');
 if (Number.isFinite(parts.frame.maxTire) && parts.tires.width > parts.frame.maxTire) errors.push(`${parts.tires.width} mm tires exceed this frame’s ${parts.frame.maxTire} mm manufacturer-listed clearance.`);
 if (!Number.isFinite(parts.frame.maxTire)) warnings.push('Tire clearance has not been confirmed for this frameset.');
 for (const item of Object.values(parts)) if (item.fitNote) warnings.push(item.fitNote);
 const selected = Object.values(parts), unpriced = selected.filter(p => !Number.isFinite(p.price));
 const knownSubtotal = selected.reduce((n, p) => n + (Number.isFinite(p.price) ? p.price : 0), 0);
 return { parts, errors, warnings, knownSubtotal, unpriced, price: unpriced.length ? null : knownSubtotal, weight: null, compatibilityVerified: false, scores: { Aerodynamics: null, Climbing: null, Comfort: null } };
}

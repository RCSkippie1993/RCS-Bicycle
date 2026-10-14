import { catalog, money, checkedDate } from './catalog.js';
import { riderRows } from './rider.js';

export function briefText(build, rider) {
 return [
  'RCS BICYCLE — SOURCING BRIEF', 'South Africa · ZAR', `Price sources checked: ${checkedDate}`, '',
  'RIDER REQUIREMENTS', ...riderRows(rider).map(([label, value]) => `${label}: ${value}`),
  'Measurements supplied by rider. Frame size and fit require review. Budget is a target, not a quote.', '',
  'SELECTED COMPONENTS', ...Object.entries(build.parts).flatMap(([key, p]) => [
   `${catalog[key].label}: ${p.name} — ${money(p.price)} (${p.pricingLabel})`,
   `Price basis: ${p.priceBasis}. ${p.stockNote}.`,
   ...p.sources.map(s => `  ${s.name}: ${s.url} | ${s.variant} | ${s.referenceOnly ? 'Package reference only; no separate brake price confirmed' : `${s.quantity} × ${money(s.unitPrice)}`} | checked ${s.checkedAt}`)
  ]), '', `Known listed parts subtotal: ${money(build.knownSubtotal)}`,
  `Unpriced categories: ${build.unpriced.length ? build.unpriced.map(p => p.name).join('; ') : 'None among selected categories; build extras still require a quote'}`,
  'This is a reference subtotal, not a complete-bike quote or an RCS selling price. Manufacturer MSRP and retailer listings are distinguished above.',
  'Confirm VAT treatment, any missing parts, frame size, compatibility, calipers/rotors, bottom bracket, tubes/sealant, tape, pedals, assembly and delivery.',
  ...build.warnings, 'Complete bike weight and performance ratings are not verified.',
  'No stock is held or reserved by this brief. No order, payment or request has been submitted.'
 ].join('\n');
}

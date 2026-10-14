import { money } from './catalog.js';

export const riderDefaults = { goal: 'unsure', heightCm: null, inseamCm: null, budgetZar: null };
export const goals = {
 unsure: 'Not decided',
 endurance: 'Comfort & endurance',
 allround: 'Balanced road riding',
 race: 'Racing & speed'
};
export const ranges = { heightCm: [80, 250], inseamCm: [30, 130], budgetZar: [1000, 2000000] };
const labels = { heightCm: 'Height', inseamCm: 'Cycling inseam', budgetZar: 'Budget' };

export function validateRider(input) {
 const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
 const value = { ...riderDefaults }, errors = {};
 const goal = raw.goal ?? riderDefaults.goal;
 if (Object.hasOwn(goals, goal)) value.goal = goal;
 else errors.goal = 'Choose one of the listed riding goals.';
 for (const [key, [min, max]] of Object.entries(ranges)) {
  const item = raw[key];
  if (item === null || item === undefined || (typeof item === 'string' && item.trim() === '')) continue;
  const number = (typeof item === 'number' || typeof item === 'string') ? Number(item) : NaN;
  if (!Number.isFinite(number) || number < min || number > max) {
   errors[key] = `${labels[key]} must be between ${min} and ${max}${key === 'budgetZar' ? ' rand' : ' cm'}.`;
  } else if (key === 'budgetZar' && !Number.isInteger(number)) {
   errors[key] = 'Enter the budget in whole rand.';
  } else if (key !== 'budgetZar' && Math.abs(number * 10 - Math.round(number * 10)) > 0.000001) {
   errors[key] = 'Use no more than one decimal place.';
  } else value[key] = number;
 }
 if (value.heightCm !== null && value.inseamCm !== null && value.inseamCm >= value.heightCm) {
  errors.inseamCm = 'Cycling inseam must be shorter than your total height.';
 }
 return { value, errors };
}

export function hasRider(profile) {
 return profile.goal !== 'unsure' || Object.keys(ranges).some(key => profile[key] !== null);
}
export function riderRows(profile) {
 return [
  ['Riding goal', goals[profile.goal]],
  ['Budget target', profile.budgetZar === null ? 'Not supplied' : money(profile.budgetZar)],
  ['Height', profile.heightCm === null ? 'Not supplied' : `${profile.heightCm} cm`],
  ['Cycling inseam', profile.inseamCm === null ? 'Not supplied' : `${profile.inseamCm} cm`]
 ];
}
export function riderSummary(profile) {
 if (!hasRider(profile)) return 'Add your riding goals, budget and optional measurements.';
 return riderRows(profile).filter(([label, value]) => value !== 'Not supplied' && !(label === 'Riding goal' && profile.goal === 'unsure')).map(([label, value]) => `${label}: ${value}`).join(' · ');
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riderDefaults, validateRider, riderRows, hasRider, riderSummary } from './rider.js';

test('optional details may all remain empty without inventing fit or budget', () => {
 const { value, errors } = validateRider({ goal: 'unsure', heightCm: '', inseamCm: ' ', budgetZar: null });
 assert.deepEqual(value, riderDefaults);assert.deepEqual(errors, {});assert.equal(hasRider(value), false);
 assert.equal(riderRows(value).filter(([, text]) => text === 'Not supplied').length, 3);
});
test('form numbers normalize to values used in briefs', () => {
 const { value, errors } = validateRider({ goal: 'endurance', heightCm: '178.5', inseamCm: '82', budgetZar: '45000' });
 assert.deepEqual(errors, {});assert.deepEqual(value, { goal: 'endurance', heightCm: 178.5, inseamCm: 82, budgetZar: 45000 });
 assert.match(riderSummary(value), /Comfort & endurance/);assert.match(riderSummary(value), /178.5 cm/);
});
test('rejects contradictory measurements and malformed or out-of-range values', () => {
 assert.ok(validateRider({ heightCm: '90', inseamCm: '100' }).errors.inseamCm);
 for (const raw of [{ heightCm: 'Infinity' }, { budgetZar: '0' }, { budgetZar: '1234.5' }, { inseamCm: '999' }, { heightCm: '178.123' }, { goal: '<script>' }, { heightCm: true }]) {
  assert.ok(Object.keys(validateRider(raw).errors).length);
 }
});
test('untrusted storage never introduces HTML or unknown fields into summaries', () => {
 const { value, errors } = validateRider({ goal: '<img src=x>', heightCm: '<script>', budgetZar: 'NaN', name: '<script>' });
 assert.ok(Object.keys(errors).length);assert.deepEqual(value, riderDefaults);assert.doesNotMatch(riderSummary(value), /script|<|NaN/);
 assert.deepEqual(validateRider(null).value, riderDefaults);
});

import { goals, ranges, hasRider, validateRider } from './rider.js';

export function openRider(profile, onSave, onClear) {
 const dialog = document.querySelector('#rider-dialog');
 const fields = [
  ['heightCm', 'Height (cm)', 'e.g. 178', 'Measure standing height without shoes.'],
  ['inseamCm', 'Cycling inseam (cm)', 'e.g. 82', 'Measure floor to crotch without shoes, not trouser length.'],
  ['budgetZar', 'Total budget target (ZAR)', 'e.g. 45000', 'Your target for the complete build, assembly and delivery.']
 ];
 dialog.innerHTML = `<button class="close" id="rider-close" aria-label="Close rider details">×</button>
  <p class="eyebrow">A BUILD AROUND YOU</p><h2 id="rider-title">Your rider brief.</h2>
  <p id="rider-help">All fields are optional. These details support a fit and sourcing conversation; they do not calculate a frame size or guarantee fit.</p>
  <form id="rider-form" novalidate>
   <div class="rider-fields"><label class="rider-field rider-goal" for="rider-goal">Riding goal
    <select id="rider-goal" name="goal" aria-describedby="error-goal">${Object.entries(goals).map(([key, label]) => `<option value="${key}" ${profile.goal === key ? 'selected' : ''}>${label}</option>`).join('')}</select>
    <span class="field-error" id="error-goal"></span></label>
   ${fields.map(([key, label, placeholder, help]) => `<label class="rider-field" for="rider-${key}">${label}
    <input id="rider-${key}" name="${key}" type="number" inputmode="${key === 'budgetZar' ? 'numeric' : 'decimal'}" min="${ranges[key][0]}" max="${ranges[key][1]}" step="${key === 'budgetZar' ? 1 : 0.1}" value="${profile[key] ?? ''}" placeholder="${placeholder}" aria-describedby="help-${key} error-${key}">
    <small id="help-${key}">${help}</small><span class="field-error" id="error-${key}"></span></label>`).join('')}</div>
   <p class="fine">Details stay in this browser and are included in the sourcing brief you download. No details are submitted to RCS.</p>
   <p class="form-error" id="rider-errors" role="alert"></p>
   <button type="submit" class="cta">Save rider details <span aria-hidden="true">✓</span></button>
   <button type="button" class="clear-rider" id="rider-clear" ${hasRider(profile) ? '' : 'disabled'}>Clear saved rider details</button>
  </form>`;
 dialog.querySelector('#rider-close').onclick = () => dialog.close();
 dialog.querySelector('#rider-clear').onclick = () => { dialog.close(); onClear(); };
 dialog.querySelector('#rider-form').onsubmit = event => {
  event.preventDefault();
  const form = event.currentTarget;
  const { value, errors } = validateRider(Object.fromEntries(new FormData(form)));
  for(const key of Object.keys(ranges)) if(form.elements[key].validity.badInput) errors[key]='Enter a valid number.';
  for (const key of ['goal', ...Object.keys(ranges)]) {
   form.elements[key].setAttribute('aria-invalid', String(Boolean(errors[key])));
   document.querySelector(`#error-${key}`).textContent = errors[key] || '';
  }
  if (Object.keys(errors).length) {
   document.querySelector('#rider-errors').textContent = 'Please check the highlighted details.';
   form.elements[Object.keys(errors)[0]].focus();
   return;
  }
  dialog.close(); onSave(value);
 };
 dialog.showModal();
}

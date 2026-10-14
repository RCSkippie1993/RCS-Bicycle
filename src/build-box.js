import { catalog, money, checkedDate } from './catalog.js';
import { findProduct, categoryLabels } from './product-records.js';
import { riderRows } from './rider.js';
import { buildRatingText } from './build-ratings.js';

export const boxStorageKey = 'rcs-build-box';
export const maxBoxQuantity = 20;

export function normalizeBox(raw) {
 const items = raw?.version === 1 && Array.isArray(raw.items) ? raw.items : [];
 const seen = new Set();
 return items.filter(item => {
  if (!item || typeof item.productId !== 'string' || !findProduct(item.productId) || seen.has(item.productId)) return false;
  if (!Number.isInteger(item.quantity) || item.quantity < 1) return false;
  seen.add(item.productId);return true;
 }).map(item => ({ productId: item.productId, quantity: Math.min(maxBoxQuantity,item.quantity) }));
}
export const boxSnapshot = items => ({ version: 1, items });
export function addToBox(items, id, increment = true) {
 if (!findProduct(id)) return items;
 const existing = items.find(item => item.productId === id);
 if (!existing) return [...items, { productId: id, quantity: 1 }];
 return items.map(item => item.productId === id ? { ...item, quantity: Math.min(maxBoxQuantity,item.quantity+(increment?1:0)) } : item);
}
export function setBoxQuantity(items,id,quantity) {
 if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxBoxQuantity) return items;
 return items.map(item => item.productId===id ? {...item,quantity} : item);
}
export const removeFromBox = (items,id) => items.filter(item=>item.productId!==id);

export function summarizeBox(items) {
 const rows=normalizeBox(boxSnapshot(items)).map(item=>({...item,...findProduct(item.productId)}));
 const components=rows.filter(row=>row.category!=='bike'), bikes=rows.filter(row=>row.category==='bike');
 const subtotal=list=>list.reduce((sum,row)=>sum+(Number.isFinite(row.product.price)?row.quantity*row.product.price:0),0);
 const unpriced=rows.filter(row=>!Number.isFinite(row.product.price));
 const grouped=Object.fromEntries(Object.keys(catalog).map(key=>[key,components.filter(row=>row.category===key)]));
 const missing=Object.keys(grouped).filter(key=>!grouped[key].length);
 const alternatives=Object.keys(grouped).filter(key=>grouped[key].length>1);
 const warnings=[];
 if(alternatives.length)warnings.push(`Multiple alternatives: ${alternatives.map(key=>categoryLabels[key]).join(', ')}. Keep one product per category to use the box in the builder.`);
 if(components.some(row=>row.quantity!==1))warnings.push('Component quantities above one represent extra packages, not a single assembled bike. Use one package per category to transfer to the builder.');
 const one=key=>grouped[key].length===1?grouped[key][0].product:null;
 const drivetrain=one('drivetrain'), brakes=one('brakes'), frame=one('frame'), tires=one('tires');
 const errors=[];
 if(drivetrain&&brakes&&drivetrain.controlSystem!==brakes.controlSystem)errors.push('The drivetrain and brake/shift controls use different control systems.');
 if(frame&&tires&&Number.isFinite(frame.maxTire)&&tires.width>frame.maxTire)errors.push(`${tires.width} mm tires exceed the frame’s ${frame.maxTire} mm listed clearance.`);
 if(frame&&!Number.isFinite(frame.maxTire))warnings.push('Tire clearance is not confirmed for this frameset.');
 for(const row of components)if(row.product.missingEssentials?.length)warnings.push(`${row.product.name}: ${row.product.missingEssentials.join(', ')} still required; these costs are excluded.`);
 return {rows,components,bikes,missing,alternatives,warnings,errors,unpriced,
  componentSubtotal:subtotal(components),bikeSubtotal:subtotal(bikes),knownSubtotal:subtotal(rows),
  total:unpriced.length?null:subtotal(rows),packageCount:rows.reduce((sum,row)=>sum+row.quantity,0),
  canApply:components.length>0&&!alternatives.length&&components.every(row=>row.quantity===1)&&!errors.length,
  selection:Object.fromEntries(components.map(row=>[row.category,row.productId])),
 };
}

export function boxText(items,rider) {
 const box=summarizeBox(items);
 return [
  'RCS BICYCLE — BUILD BOX SOURCING LIST','South Africa · ZAR',`Price sources checked: ${checkedDate}`,'',
  ...(rider?['RIDER REQUIREMENTS',...riderRows(rider).map(([label,value])=>`${label}: ${value}`),'Measurements are supplied by the rider; sizing and fit require review.','']:[]),
  'SAVED PRODUCTS',...box.rows.flatMap(row=>[
   `${categoryLabels[row.category]}: ${row.product.name}`,
   `${row.quantity} package(s) × ${money(row.product.price)} = ${money(Number.isFinite(row.product.price)?row.quantity*row.product.price:null)}`,
   `${row.product.pricingLabel}. Package basis: ${row.product.priceBasis}. ${row.product.stockNote}.`,
   ...row.product.sources.map(source=>`${source.name}: ${source.url} | ${source.variant} | ${source.referenceOnly?'Package reference only; separate price unconfirmed':`${row.quantity*source.quantity} × ${money(source.unitPrice)}`} | checked ${source.checkedAt}`),
   ...(row.product.fitNote?[row.product.fitNote]:[]),'',
  ]),
  `Known component subtotal: ${money(box.componentSubtotal)}`,`Known complete-bike subtotal: ${money(box.bikeSubtotal)}`,
  `Known box reference subtotal: ${money(box.knownSubtotal)}`,
  `Unpriced product lines: ${box.unpriced.length}. Final box total: ${box.unpriced.length?'Quote required':money(box.total)}`,
  `Builder categories represented: ${Object.keys(catalog).length-box.missing.length}/${Object.keys(catalog).length}`,
  ...(box.canApply&&!box.missing.length?[buildRatingText({parts:Object.fromEntries(box.components.map(row=>[row.category,row.product])),errors:box.errors},rider?.goal)]:['Overall goal match is available for one package in every builder category without alternatives or detected conflicts.']),
  ...box.errors,...box.warnings,
  'Complete bikes are separate products, not donor parts or automatically part of a component build. Multiple alternatives are not one complete bicycle.',
  'Quantities count the displayed package: one tire package already contains two tires; one cockpit package is a bar and stem. No duplicate separate Di2 controls price is assumed.',
  'These are reference prices, not an RCS quote. Confirm VAT treatment, exact variant, availability, package inclusions, full compatibility, missing parts, assembly and delivery.',
  'Fit, complete-build weight and performance are not verified. No order, payment, stock reservation or request has been submitted.',
 ].join('\n');
}

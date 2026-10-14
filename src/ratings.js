// RCS reference profiles v1. Fixed scales: catalog additions never change a score.
// These describe listed cost and dimensions, not tested product performance.
export const ratingVersion = '1.0';
export const budgetBands = {
 frame: [15000, 100000], wheels: [3000, 60000], tires: [800, 4000],
 drivetrain: [5000, 35000], brakes: [5000, 15000], cockpit: [1000, 7000],
 saddle: [1000, 10000], bike: [20000, 220000],
};
const scale = (value, low, high, reverse = false) => {
 if (!Number.isFinite(value) || value <= 0) return null;
 const fraction = Math.min(1, Math.max(0, (value - low) / (high - low)));
 return Math.round(1 + 9 * (reverse ? 1 - fraction : fraction));
};

export function productRatings(product, category) {
 const bands = budgetBands[category];
 if (!bands) throw new Error('Unknown rating category: ' + category);
 const price = product.price;
 const ratings = [{
  key: 'budget', label: 'Budget accessibility', score: scale(price, ...bands, true),
  basis: Number.isFinite(price)
   ? `Listed package cost R${price.toLocaleString('en-ZA')}. Fixed ${category} scale: R${bands[0].toLocaleString('en-ZA')} = 10; R${bands[1].toLocaleString('en-ZA')} = 1. Lower spend scores higher. This is not quality or value for money; compare package contents and MSRP versus retailer prices.`
   : 'A separate price is unconfirmed. Package confirmation is required; unknown does not mean free.',
  evidence: product.sources.filter(s => !s.referenceOnly).map(s => s.url),
  confidence: Number.isFinite(price) ? 'Price snapshot' : 'Pending',
 }];
 const metric = (key, label, value, low, high, reverse, basis, evidenceKey) => {
  const evidence = product.profileEvidence?.[evidenceKey];
  // No evidence means no score, even if a dimension happens to be present.
  ratings.push({ key, label, score: evidence ? scale(value, low, high, reverse) : null,
   basis: evidence ? `${basis} Source: “${evidence.excerpt}”.` : 'No reviewed specification for this scale.',
   evidence: evidence ? [evidence.url] : [], confidence: evidence ? 'Listed specification' : 'Pending' });
 };
 if (category === 'wheels') {
  metric('depth', 'Rim depth profile', product.profileFacts?.rimDepthMm, 20, 65, false,
   '20 mm = 1; 65 mm = 10. Higher means deeper, not faster. Rim shape, tire, yaw and crosswind handling are not evaluated.', 'rimDepthMm');
  metric('mass', 'Low-mass profile', product.weight, 1.2, 2, true,
   `Wheelset pair: 1.20 kg = 10; 2.00 kg = 1. ${product.weightBasis || ''}. Lower listed mass scores higher; this does not rate climbing or stiffness.`, 'weight');
 }
 if (category === 'tires') metric('volume', 'Tire width profile', product.width, 25, 35, false,
  'Nominal 25 mm = 1; 35 mm = 10. Higher means wider, not more comfortable or faster. Mounted width, pressure, casing, clearance and rim fit must be checked.', 'width');
 if (category === 'bike') metric('mass', 'Low-mass profile', product.weight, 6.5, 10, true,
  `Complete-bike listed mass: 6.50 kg = 10; 10.00 kg = 1. ${product.weightBasis || ''} Size and measurement differences limit comparison; this is not a climbing test.`, 'weight');
 return ratings;
}

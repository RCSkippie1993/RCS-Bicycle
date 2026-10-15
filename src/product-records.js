import { catalog, completeBikes, wheelReferences, frameReferences } from './catalog.js';

export const productRecords = [
 ...completeBikes.map(product => ({ category: 'bike', product })),
 ...Object.entries(catalog).flatMap(([category, g]) => g.items.map(product => ({ category, product }))),
 ...wheelReferences.map(product=>({category:'wheels',product})),
 ...frameReferences.map(product=>({category:'frame',product})),
];
export const categoryLabels = { bike: 'Complete road bikes', ...Object.fromEntries(Object.entries(catalog).map(([key, g]) => [key, g.label])) };
export const findProduct = id => productRecords.find(record => record.product.id === id);

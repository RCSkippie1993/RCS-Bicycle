import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from './catalog.js';
import { normalizeBox, boxSnapshot, addToBox, setBoxQuantity, removeFromBox, summarizeBox, boxText } from './build-box.js';

test('untrusted saved boxes cannot supply prices, unknown products, duplicate rows or invalid quantities',()=>{
 const rows=normalizeBox({version:1,items:[
  {productId:'r470',quantity:2,price:1},{productId:'r470',quantity:4},
  {productId:'retired-fake',quantity:1},{productId:'gp5000-28',quantity:0},
  {productId:'rd50',quantity:'2'},{productId:'pro-lt',quantity:100},null,
 ]});
 assert.deepEqual(rows,[{productId:'r470',quantity:2},{productId:'pro-lt',quantity:20}]);
 assert.equal(summarizeBox(rows).knownSubtotal,7800+20*1380);
 for(const raw of [null,[],{},'bad',{version:2,items:rows}])assert.deepEqual(normalizeBox(raw),[]);
});
test('quantities multiply listed packages, complete-bike subtotals stay separate and removals update totals',()=>{
 let items=[];for(const id of ['gp5000-28','gp5000-28','reacto-5000'])items=addToBox(items,id);
 const box=summarizeBox(items);
 assert.equal(box.packageCount,3);assert.equal(box.componentSubtotal,5560);assert.equal(box.bikeSubtotal,49900);assert.equal(box.knownSubtotal,55460);
 assert.equal(box.canApply,false);
 items=removeFromBox(items,'gp5000-28');assert.equal(summarizeBox(items).componentSubtotal,0);
 assert.equal(summarizeBox(items).bikeSubtotal,49900);assert.equal(summarizeBox(items).canApply,false);
});
test('saving the current build is idempotent, preserves quantities and never adds defaults into an empty box',()=>{
 assert.equal(summarizeBox([]).rows.length,0);assert.equal(summarizeBox([]).missing.length,7);
 let items=[];for(const id of Object.values(defaults))items=addToBox(items,id,false);
 assert.equal(items.length,7);assert.equal(summarizeBox(items).knownSubtotal,51610);assert.equal(summarizeBox(items).canApply,true);
 items=setBoxQuantity(items,'gp5000-28',3);
 for(const id of Object.values(defaults))items=addToBox(items,id,false);
 assert.equal(items.length,7);assert.equal(items.find(row=>row.productId==='gp5000-28').quantity,3);
 assert.deepEqual(setBoxQuantity(items,'r470',1.5),items);assert.deepEqual(setBoxQuantity(items,'r470',0),items);
 assert.deepEqual(normalizeBox(boxSnapshot(items)),items);
});
test('alternatives and control mismatches are visible, while an unknown brake price is never free',()=>{
 let items=[];for(const id of ['105-di2','105-r7120'])items=addToBox(items,id);
 assert.equal(summarizeBox(items).errors.length,1);assert.equal(summarizeBox(items).canApply,false);
 items=removeFromBox(items,'105-r7120');items=addToBox(items,'105-r7170');
 const box=summarizeBox(items);assert.equal(box.errors.length,0);assert.equal(box.unpriced.length,1);
 assert.equal(box.knownSubtotal,29900);assert.equal(box.total,null);assert.equal(box.canApply,true);
 items=addToBox(addToBox(items,'r470'),'rd50');assert.deepEqual(summarizeBox(items).alternatives,['wheels']);assert.equal(summarizeBox(items).canApply,false);
});
test('box export retains multiplied source quantities, variants and unpriced package exclusions',()=>{
 let items=[];for(const id of ['gp5000-28','gp5000-28','105-r7170'])items=addToBox(items,id);
 const text=boxText(items);
 assert.match(text,/4 × R\s*1\s*390/);assert.match(text,/variant=/);assert.match(text,/Known component subtotal: R\s*5\s*560/);
 assert.match(text,/Unpriced product lines: 1. Final box total: Quote required/);
 assert.match(text,/Package reference only; separate price unconfirmed/);assert.doesNotMatch(text,/1 × R\s*29\s*900/);
 assert.match(text,/one tire package already contains two tires/);assert.match(text,/No order, payment/);
});

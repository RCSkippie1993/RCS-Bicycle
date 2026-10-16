import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,featureRegister} from './catalog.js';
import {configureProduct} from './build-plan.js';
import {scienceProfile} from './build-science.js';

const cockpit=id=>catalog.cockpit.items.find(p=>p.id===`exp-cockpits-${id}`);
const mass=(p,choices)=>scienceProfile(configureProduct(p,{choices:{[p.id]:choices}}),'cockpit')[0];

test('a 42 cm measurement cannot score the only offered 44 cm Streem Carbon',()=>{
 const p=cockpit('ritchey-wcs-streem-carbon-road-handlebar');
 assert.equal(featureRegister[p.id].barMass.value,.235);
 assert.deepEqual(featureRegister[p.id].barMass.values,{size:'42cm'});
 assert.equal(mass(p,{}).score,null);
 assert.equal(mass(p,{}).actual,'Unverified');
});

test('sourced bar mass applies to its exact width and survives a stem change',()=>{
 const p=cockpit('easton-e100-handlebar');
 for(const choices of [{},{stemLength:'110mm'}]){
  const profile=mass(p,choices);
  assert.equal(profile.label,'Handlebar only');
  assert.equal(profile.actual,'0.178 kg');
  assert.equal(profile.score,9);
 }
 assert.equal(mass(p,{size:'40cm'}).score,null);
 assert.equal(mass(p,{size:'40cm'}).actual,'Unverified');
});

test('hood/drop widths match their sourced size and unknown reference sizes stay pending',()=>{
 const streem=cockpit('ritchey-superlogic-streem-handlebar');
 assert.equal(mass(streem,{}).actual,'0.230 kg');
 assert.equal(mass(streem,{size:'36/40cm'}).score,null);
 const creston=cockpit('syncros-creston-1-0-road-handlebar');
 assert.equal(featureRegister[creston.id].barMass.value,.205);
 assert.equal(mass(creston,{}).score,null);
 assert.equal(mass(creston,{}).actual,'Unverified');
});

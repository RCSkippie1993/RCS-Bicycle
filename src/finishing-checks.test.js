import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findProduct} from './product-records.js';
import {configureProduct,normalizePlan} from './build-plan.js';
import {inspectFinishing} from './finishing-checks.js';

const p=id=>{const record=findProduct(id);assert.ok(record,id);return record.product;};
const extra=(id,choices,quantity=1)=>({...configureProduct(p(id),normalizePlan({choices:choices?{[id]:choices}:{}})),quantity,role:'Optional extra'});
const check=(report,id)=>{const found=report.checks.find(c=>c.id===id);assert.ok(found,id);return found;};

test('Titan tube checks follow the exact selected source variant rather than stale reference specifications',()=>{
 const tires=p('gp5000-28'),id='exp-extras-titan-road-tubes';
 const narrow=inspectFinishing({tires},[extra(id)],{tireSetup:'tubes'});
 assert.equal(check(narrow,'finishing-tube-'+id).status,'conflict');
 assert.match(check(narrow,'finishing-tube-'+id).detail,/18-25C.*outside/s);
 const wide=inspectFinishing({tires},[extra(id,{size:'700C x 35-38C F/V48'})],{tireSetup:'tubes'});
 assert.equal(check(wide,'finishing-tube-'+id).status,'conflict');
 assert.match(check(wide,'finishing-tube-'+id).detail,/35-38C/);
 assert.match(check(wide,'finishing-tube-'+id).sources[0].sourceUrl,/22158454325332/);
 const within=inspectFinishing({tires:{...tires,width:35,tireFacts:{diameterMm:622}}},[extra(id,{size:'700C x 35-38C F/V48'})],{tireSetup:'tubes'});
 assert.equal(check(within,'finishing-tube-'+id).status,'review');
 assert.doesNotMatch(check(within,'finishing-tube-'+id).detail,/outside the source-listed/);
 const wrongDiameter=inspectFinishing({tires:{...tires,width:35,tireFacts:{diameterMm:584}}},[extra(id,{size:'700C x 35-38C F/V48'})]);
 assert.equal(check(wrongDiameter,'finishing-tube-'+id).status,'conflict');
 assert.match(check(wrongDiameter,'finishing-tube-'+id).detail,/different wheel diameters/);
 const unconfirmedTyre=inspectFinishing({tires:{...tires,referenceSpecsOnly:true}},[extra(id)]);
 assert.equal(check(unconfirmedTyre,'finishing-tube-'+id).status,'review','changed tyre references cannot cause a conflict from stale width');
});

test('tube quantity and valve exposure remain separate from nominal width agreement',()=>{
 const id='exp-extras-titan-road-tubes',tires={...p('gp5000-28'),width:25};
 const one=inspectFinishing({tires,wheels:p('rd50')},[extra(id,{size:'700C x 18-25C F/V48'})],{tireSetup:'tubes'});
 assert.equal(check(one,'finishing-tube-'+id).status,'conflict');
 assert.match(check(one,'finishing-tube-count').detail,/1 individually sold/);
 const two=inspectFinishing({tires,wheels:p('rd38')},[extra(id,{size:'700C x 18-25C F/V60'},2)],{tireSetup:'tubes'});
 assert.equal(check(two,'finishing-tube-'+id).status,'review');
 assert.match(check(two,'finishing-tube-count').detail,/2 individually sold/);
 assert.equal(check(two,'finishing-tube-count').status,'review');
});

test('rotor count uses individual packages and does not certify a pair or infer frame diameter limits',()=>{
 const id='exp-chains-paceline',rotor=extra(id);
 const one=inspectFinishing({wheels:p('rd38')},[rotor]);
 assert.match(check(one,'finishing-rotor-count').detail,/1 rotor\(s\)/);
 assert.match(check(one,'finishing-rotor-count').detail,/does not document both/);
 assert.equal(check(one,'finishing-rotor-'+id).status,'review');
 assert.match(check(one,'finishing-rotor-'+id).detail,/Wheel evidence lists Center Lock/);
 const two=inspectFinishing({wheels:p('rd38')},[extra(id,undefined,2)]);
 assert.match(check(two,'finishing-rotor-count').detail,/2 rotor\(s\)/);
 assert.equal(check(two,'finishing-rotor-count').status,'review');
 assert.equal(rotor.price,p(id).price,'inspection cannot mutate the unit price');
 const changed=inspectFinishing({wheels:p('rd38')},[extra('exp-chains-centerline-x',{size:'180mm'})]);
 assert.match(check(changed,'finishing-rotor-exp-chains-centerline-x').detail,/180 mm/);
 assert.equal(check(changed,'finishing-rotor-exp-chains-centerline-x').status,'review');
});

test('rotor mount conflicts require source evidence; mixed wheel options stay under review',()=>{
 const wheel=p('wheel-ev-6b8925b367'),rotor=extra('exp-chains-rt70');
 const mixed=inspectFinishing({wheels:wheel},[rotor]);
 assert.equal(check(mixed,'finishing-rotor-'+rotor.id).status,'review');
 assert.match(check(mixed,'finishing-rotor-'+rotor.id).detail,/multiple or conflicting/);
 const six={wheelSpecs:{brake:'disc'},wheelEvidence:{brake:{url:'https://example.com/verified-six-bolt',excerpt:'Brake Type: 6-bolt disc',checkedAt:'2026-10-16'}}};
 const conflict=inspectFinishing({wheels:six},[rotor]);
 assert.equal(check(conflict,'finishing-rotor-'+rotor.id).status,'conflict');
 assert.ok(check(conflict,'finishing-rotor-'+rotor.id).sources.some(s=>s.excerpt==='Brake Type: 6-bolt disc'));
 const unsupported=inspectFinishing({wheels:{wheelSpecs:{brake:'disc',rotorMount:'6-bolt'}}},[rotor]);
 assert.equal(check(unsupported,'finishing-rotor-'+rotor.id).status,'review','an unsupported dimensional field is not source proof');
});

test('BB family conflicts use explicit frame evidence; known nominal agreement stays supplier review',()=>{
 const bsa=p('exp-frames-cannondale-caad14'),bb86=extra('exp-chains-bb71-41b');
 const wrong=inspectFinishing({frame:bsa},[bb86]);
 assert.equal(check(wrong,'finishing-bb-'+bb86.id).status,'conflict');
 assert.match(check(wrong,'finishing-bb-'+bb86.id).detail,/BSA 68 mm.*standards differ/s);
 const nominal=inspectFinishing({frame:p('winspace-c5')},[bb86]);
 assert.equal(check(nominal,'finishing-bb-'+bb86.id).status,'review');
 const generic=inspectFinishing({frame:p('tarmac-sl8')},[extra('exp-chains-cs-t47-68-shimano')]);
 assert.equal(check(generic,'finishing-bb-exp-chains-cs-t47-68-shimano').status,'review','Threaded does not establish T47 or BSA');
});

test('T47 shell width is checked only where explicit; alternative 85.5 mm source width is retained',()=>{
 const frame=p('exp-frames-look795-blade-rs');
 const narrow=inspectFinishing({frame},[extra('exp-chains-cs-t47-68-shimano')]);
 assert.equal(check(narrow,'finishing-bb-exp-chains-cs-t47-68-shimano').status,'conflict');
 assert.match(check(narrow,'finishing-bb-exp-chains-cs-t47-68-shimano').detail,/shell widths differ/);
 const documented=inspectFinishing({frame},[extra('exp-chains-cs-t47-86-shimano')]);
 assert.equal(check(documented,'finishing-bb-exp-chains-cs-t47-86-shimano').status,'review');
 const unknownWidth=inspectFinishing({frame:p('exp-frames-trek-madone-sl-disc')},[extra('exp-chains-cs-t47-68-shimano')]);
 assert.equal(check(unknownWidth,'finishing-bb-exp-chains-cs-t47-68-shimano').status,'review');
});

test('crank checks use stated DUB evidence and never infer spindle family from Shimano brand',()=>{
 const bb=extra('exp-chains-bb71-41b');
 const dub=inspectFinishing({drivetrain:p('exp-drivetrains-force-d2-pm')},[bb]);
 assert.equal(check(dub,'finishing-bb-'+bb.id).status,'conflict');
 assert.match(check(dub,'finishing-bb-'+bb.id).detail,/crank and bottom-bracket families differ/);
 const unproved=inspectFinishing({drivetrain:p('105-mechanical')},[extra('exp-chains-dub-pf86')]);
 assert.equal(check(unproved,'finishing-bb-exp-chains-dub-pf86').status,'review');
 assert.match(check(unproved,'finishing-bb-exp-chains-dub-pf86').detail,/brand or shifting family is not used as proof/);
 const changed=inspectFinishing({frame:p('winspace-c5')},[extra('exp-chains-dub-pf86',{fit:'Road Wide'})]);
 assert.equal(check(changed,'finishing-bb-exp-chains-dub-pf86').status,'review');
 assert.match(check(changed,'finishing-bb-exp-chains-dub-pf86').detail,/selected-variant frame standard unconfirmed/);
});

test('a documented threaded shell cannot directly accept an unspecified press-fit bottom bracket',()=>{
 const report=inspectFinishing({frame:p('exp-frames-cannondale-caad14')},[extra('exp-chains-bb72-41b')]);
 assert.equal(check(report,'finishing-bb-exp-chains-bb72-41b').status,'conflict');
 assert.match(check(report,'finishing-bb-exp-chains-bb72-41b').detail,/direct-fit shell standards differ/);
});

test('unknown valve length or pack quantity never establishes a complete tubeless setup',()=>{
 const ryder=extra('exp-extras-ryder-rvc-tubeless-valve-set');
 const unknown=inspectFinishing({wheels:p('rd50')},[ryder],{tireSetup:'tubeless'});
 assert.equal(check(unknown,'finishing-valve-'+ryder.id).status,'review');
 assert.match(check(unknown,'finishing-valve-'+ryder.id).detail,/length unconfirmed.*two valves/s);
 const muc=extra('exp-extras-muc-off-all-new-tubeless-valves',{colour:'Black',size:'44mm'});
 const short=inspectFinishing({wheels:p('rd50')},[muc],{tireSetup:'tubeless'});
 assert.equal(check(short,'finishing-valve-'+muc.id).status,'conflict');
 assert.match(check(short,'finishing-valve-'+muc.id).detail,/44 mm selected.*count is not explicitly/s);
 const tubes=inspectFinishing({wheels:p('rd50')},[muc],{tireSetup:'tubes'});
 assert.equal(check(tubes,'finishing-valve-'+muc.id).status,'review');
});

test('source-known included and excluded extras produce notes without phantom free-price credits',()=>{
 const rotor=extra('exp-chains-paceline-x'),red=p('exp-drivetrains-red-axs-karoo');
 const before=JSON.stringify({red,rotor});
 const included=inspectFinishing({drivetrain:red},[rotor]);
 assert.match(check(included,'finishing-rotor-count').detail,/3 rotor\(s\)/);
 assert.ok(included.notes.some(n=>/already lists.*160\/160.*Karoo/.test(n)));
 assert.equal(JSON.stringify({red,rotor}),before);
 const excluded=inspectFinishing({drivetrain:p('exp-drivetrains-force-e1')},[]);
 assert.ok(excluded.notes.some(n=>/Bottom bracket and rotors explicitly excluded/.test(n)));
 const cleats=inspectFinishing({},[extra('exp-extras-shimano-rs500-spd-sl-road-pedals'),extra('exp-extras-shimano-sm-sh11-floating-cleats')]);
 assert.ok(cleats.notes.some(n=>/already lists SM-SH11/.test(n)));
});

test('all finishing checks carry compatible evidence shapes and remain separate from full-build completion',()=>{
 const report=inspectFinishing({frame:p('winspace-c5'),wheels:p('rd38'),tires:p('gp5000-28'),drivetrain:p('exp-drivetrains-force-e1')},[extra('exp-extras-titan-road-tubes'),extra('exp-chains-rt70'),extra('exp-chains-bb71-41b')],{tireSetup:'tubes'});
 assert.equal(new Set(report.checks.map(c=>c.id)).size,report.checks.length);
 for(const c of report.checks){
  assert.ok(['review','conflict'].includes(c.status));assert.ok(c.title&&c.detail&&Array.isArray(c.sources));
  for(const s of c.sources){assert.match(s.sourceUrl,/^https:\/\//);assert.ok(s.excerpt);assert.ok(s.checkedAt);}
 }
 assert.equal(report.complete,undefined);assert.deepEqual(inspectFinishing(),{checks:[],notes:[]});
});

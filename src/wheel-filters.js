export const wheelGroups={
 material:{label:'Rim material',values:{carbon:'Carbon',alloy:'Alloy',hybrid:'Carbon / alloy laminate',unknown:'Unconfirmed material'}},
 depth:{label:'Rim depth',values:{shallow:'Shallow · under 35 mm',mid:'Mid depth · 35–49 mm',deep:'Deep · 50–64 mm',verydeep:'Very deep · 65 mm+',mixed:'Mixed front/rear depths',unknown:'Unconfirmed depth'}},
 brake:{label:'Brake type',values:{disc:'Disc brake',rim:'Rim brake',unknown:'Unconfirmed brake type'}},
 tireSystem:{label:'Tire system',values:{tubeless:'Tubeless-ready listing',clincher:'Clincher · TLR unconfirmed',tubular:'Tubular',unknown:'Unconfirmed tire system'}},
 freehub:{label:'Freehub',values:{shimano:'Shimano road / HG',xdr:'SRAM XDR',n3w:'Campagnolo N3W',campagnolo:'Campagnolo',unknown:'Confirm exact freehub'}},
 usage:{label:'Use',values:{road:'Road',gravel:'All-road & gravel',tt:'TT & triathlon',unknown:'Use unconfirmed'}},
};
export function wheelFacet(product,key){
 const facts=product.wheelSpecs||{};
 if(key==='depth'){
  const d=facts.depthMm??(product.profileEvidence?.rimDepthMm?product.profileFacts?.rimDepthMm:null);
  return Array.isArray(d)?'mixed':!Number.isFinite(d)?'unknown':d<35?'shallow':d<50?'mid':d<65?'deep':'verydeep';
 }
 return facts[key]||(key==='freehub'&&/Shimano.*(?:HG|freehub)|HG.*Shimano/i.test(product.tag||'')?'shimano':'unknown');
}
export function matchesWheelFilters(product,filters){
 return Object.keys(wheelGroups).every(key=>!filters['wheel_'+key]||wheelFacet(product,key)===filters['wheel_'+key])&&(!filters.wheel_store||product.sources.some(s=>s.name===filters.wheel_store));
}

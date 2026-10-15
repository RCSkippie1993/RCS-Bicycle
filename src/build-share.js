import { catalog } from './catalog.js';
import { buildGoals } from './build-ratings.js';
import { normalizeSettings, tireSetups } from './build-settings.js';
import { shareablePlan,validSharedPlan } from './build-plan.js';

export function sharedBuildUrl(selection,goal,settings,baseUrl,plan) {
 const url=new URL('./index.html',baseUrl);
 if(!['https:','http:'].includes(url.protocol))throw new Error('Sharing requires a website URL.');
 const params=new URLSearchParams({build:plan?'2':'1'});
 for(const [key,group]of Object.entries(catalog)){
  if(!group.items.some(p=>p.id===selection[key]))throw new Error('Select an available product in every category before sharing.');
  params.set(key,selection[key]);
 }
 params.set('goal',Object.hasOwn(buildGoals,goal)?goal:'allround');
 params.set('setup',normalizeSettings(settings).tireSetup);
 if(plan)params.set('plan',JSON.stringify(shareablePlan(plan)));
 url.search='';url.hash=params.toString();return url.href;
}

export function parseSharedBuild(hash) {
 if(typeof hash!=='string'||!hash.startsWith('#build='))return{status:'none'};
 const invalid={status:'invalid',message:'This shared build is incomplete, outdated or contains unavailable products. Your saved build has been kept.'};
 if(hash.length>12000)return invalid;
 const params=new URLSearchParams(hash.slice(1));
 const version=params.get('build'),keys=['build',...Object.keys(catalog),'goal','setup',...(version==='2'?['plan']:[])];
 if(!['1','2'].includes(version)||[...params.keys()].some(key=>!keys.includes(key))||keys.some(key=>params.getAll(key).length!==1))return invalid;
 const selection={};
 for(const[key,group]of Object.entries(catalog)){
  const id=params.get(key);if(!group.items.some(p=>p.id===id))return invalid;selection[key]=id;
 }
 if(!Object.hasOwn(buildGoals,params.get('goal'))||!Object.hasOwn(tireSetups,params.get('setup')))return invalid;
 let plan;
 if(version==='2'){try{plan=JSON.parse(params.get('plan'));}catch{return invalid;}if(!validSharedPlan(plan))return invalid;}
 return{status:'valid',selection,goal:params.get('goal'),settings:{tireSetup:params.get('setup')},...(plan?{plan}:{})};
}

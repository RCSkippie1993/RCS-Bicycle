import { money, checkedDate } from './catalog.js';

export const provinces=['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'];
export const deliveryMethods={courier:'Delivery quote',collect:'Collection options'};
export function validateQuote(raw={}) {
 const value={},errors={};
 const limits={name:80,email:254,phone:30,city:80,frameSize:60,notes:2000};
 for(const[key,limit]of Object.entries(limits)){
  const input=typeof raw[key]==='string'?raw[key].trim():'';
  value[key]=input;
  if(input.length>limit||/[\u0000-\u0008\u000b-\u001f\u007f]/.test(input)||(key!=='notes'&&/[\r\n\t]/.test(input)))errors[key]=`Use no more than ${limit} characters and remove control characters.`;
 }
 if(value.name.length<2)errors.name='Enter your name.';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))errors.email='Enter a valid reply email address.';
 if(value.phone&&(!/^[+()\d .-]+$/.test(value.phone)||value.phone.replace(/\D/g,'').length<7||value.phone.replace(/\D/g,'').length>15))errors.phone='Enter a valid phone number, or leave it blank.';
 value.province=typeof raw.province==='string'?raw.province:'';
 value.delivery=typeof raw.delivery==='string'?raw.delivery:'';
 if(!provinces.includes(value.province))errors.province='Choose your province.';
 if(!Object.hasOwn(deliveryMethods,value.delivery))errors.delivery='Choose delivery or collection options.';
 if(value.delivery==='courier'&&!value.city)errors.city='Enter a town or city for a delivery quote.';
 return{value,errors};
}

export function quoteText(contact,context,{compact=false}={}) {
 return[
  'RCS BICYCLE — QUOTE REQUEST',`Request for: ${context.title}`,`Reference prices checked: ${context.checkedDate||checkedDate}`,'',
  'CONTACT & DELIVERY',`Name: ${contact.name}`,`Reply email: ${contact.email}`,`Phone: ${contact.phone||'Not supplied'}`,
  `Province: ${contact.province}`,`Town/city: ${contact.city||'To confirm'}`,`Fulfilment: ${deliveryMethods[contact.delivery]}`,
  `Requested frame size: ${contact.frameSize||'Fitter/supplier advice requested'}`,
  'Frame size is a request, not a fit recommendation.','',
  'SELECTED PRODUCTS',...context.items.map(item=>`${item.quantity} × ${item.name} — ${money(item.price)} per listed package${item.basis?' · '+item.basis:''}`),
  `Known reference subtotal: ${money(context.knownSubtotal)}`,`Unpriced product lines: ${context.unpricedCount}`,
  'Please confirm final selling prices, availability, exact variants, compatibility, missing parts, VAT treatment, assembly and delivery.',
  ...(context.shareUrl?['','BUILD LINK (products, riding goal and tire setup only)',context.shareUrl]:[]),
  '',`CUSTOMER NOTES\n${contact.notes||'None supplied'}`,
  ...(compact?['','The customer can attach the downloaded request for the full source/compatibility brief.']:['','FULL SOURCING BRIEF',context.sourceText]),
  '','This prepared request is not a confirmed order or reservation. It has not been submitted automatically.',
 ].join('\n');
}

export function quoteEmailDraft(email,contact,context) {
 if(typeof email!=='string'||!/^[-+\w.]+@[-\w.]+\.[a-z]{2,}$/i.test(email))return null;
 const prefix=`mailto:${email}?subject=${encodeURIComponent('RCS Bicycle quote request — '+context.title)}&body=`;
 const full=prefix+encodeURIComponent(quoteText(contact,context,{compact:true}));
 if(full.length<=1900)return{href:full,requiresAttachment:true};
 // Long boxes and notes stay intact in the full download; keep the email-app URL practical.
 const body=['Please quote my RCS Bicycle '+context.title+'.',`Name: ${contact.name}`,`Reply email: ${contact.email}`,`Phone: ${contact.phone||'Not supplied'}`,`Location: ${contact.city||'To confirm'}, ${contact.province}`,`Preference: ${deliveryMethods[contact.delivery]}`,`${context.items.length} product lines; known reference subtotal ${money(context.knownSubtotal)}. Unpriced lines: ${context.unpricedCount}.`,'','I will attach or paste the full downloaded/copied request, including my product choices, notes and sourcing checks.','Please confirm pricing, availability, exact variants, fit, missing parts, VAT, assembly and delivery.','This is a sourcing enquiry, not a confirmed order.'].join('\n');
 const cover=prefix+encodeURIComponent(body);
 return{href:cover.length<=1900?cover:prefix+encodeURIComponent('Please quote my RCS Bicycle selections. I will attach or paste the full downloaded/copied request with my contact details, products and notes. Please confirm pricing, supply, variants and fit. This is an enquiry, not a confirmed order.'),requiresAttachment:true};
}
export const quoteMailto=(email,contact,context)=>quoteEmailDraft(email,contact,context)?.href||null;

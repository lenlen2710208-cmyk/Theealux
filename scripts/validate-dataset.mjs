import fs from 'node:fs';
const file='data/items.json';
if(!fs.existsSync(file))throw new Error('Missing data/items.json');
const raw=JSON.parse(fs.readFileSync(file,'utf8')),items=Array.isArray(raw)?raw:(raw.items||[]);
if(!items.length)throw new Error('Dataset is empty.');
const attrs=['gorgeous','simple','elegant','lively','mature','cute','sexy','pure','warm','cool'],ids=new Set(),errors=[];
for(let i=0;i<items.length;i++){const x=items[i],at='items['+i+']';if(x?.id===undefined||String(x.id)==='')errors.push(at+': missing id');else{const id=String(x.id);if(ids.has(id))errors.push(at+': duplicate id '+id);ids.add(id)}if(!x?.name||typeof x.name!=='string')errors.push(at+': missing name');if(x?.rarity!=null&&(!Number.isInteger(+x.rarity)||+x.rarity<1||+x.rarity>5))errors.push(at+': invalid rarity');for(const k of attrs)if(x?.[k]!=null&&(!Number.isFinite(+x[k])||+x[k]<0))errors.push(at+': invalid '+k);if(x?.image!=null&&typeof x.image!=='string')errors.push(at+': invalid image');if(x?.source!=null&&typeof x.source!=='string')errors.push(at+': invalid source');if(x?.verificationStatus!=null&&typeof x.verificationStatus!=='string')errors.push(at+': invalid verificationStatus')}
if(raw.count!=null&&Number(raw.count)!==items.length)errors.push('count != items.length');
console.log('Aetheria dataset:',items.length.toLocaleString('vi-VN'),'records,',ids.size.toLocaleString('vi-VN'),'unique IDs.');
if(errors.length){console.error(errors.slice(0,100).join('\n'));throw new Error('Dataset validation failed: '+errors.length+' issue(s).')}
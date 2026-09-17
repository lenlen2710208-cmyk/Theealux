import fs from 'node:fs';
const file='data/items.json';
if(!fs.existsSync(file)) throw new Error('Missing data/items.json');
const p=JSON.parse(fs.readFileSync(file,'utf8'));
const items=Array.isArray(p.items)?p.items:[];
const ids=new Set(); let bad=0;
for(const x of items){ if(!x || !x.id || !x.name) bad++; ids.add(String(x.id)); }
console.log(`Theealux dataset: ${items.length} records, ${ids.size} unique IDs, ${bad} invalid records.`);
if(items.length===0) throw new Error('Dataset is empty; refusing to publish fake data.');
if(bad) throw new Error(`Dataset has ${bad} invalid records.`);
if(items.length<30000) console.warn(`WARNING: only ${items.length} items found; target is 32561.`);

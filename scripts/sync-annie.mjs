import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const PAGE_URL = process.env.SOURCE_URL || 'https://annie-nikki.homes/items';
const API_URL = 'https://annie-nikki.homes/api/items';
const out = path.resolve('data/items.json');
const abs = (u) => { try { return new URL(u, PAGE_URL).href; } catch { return u || ''; } };
const isObject = x => x && typeof x === 'object' && !Array.isArray(x);
const keysOf = x => isObject(x) ? Object.keys(x).map(k => k.toLowerCase()) : [];
const looksLikeItem = x => {
  if (!isObject(x)) return 0;
  const k = keysOf(x); let score = 0;
  if (k.some(v => ['id','itemid','code','item_id'].includes(v))) score += 2;
  if (k.some(v => ['name','title','itemname','item_name'].includes(v))) score += 3;
  if (k.some(v => ['image','imageurl','img','image_url','icon','iconurl'].includes(v))) score += 3;
  if (k.some(v => ['category','type','typename','type_id'].includes(v))) score += 1;
  if (k.some(v => ['rarity','star','stars'].includes(v))) score += 1;
  if (k.some(v => ['gorgeous','simple','elegant','lively','mature','cute','sexy','pure','warm','cool'].includes(v))) score += 2;
  return score;
};
const extractRows = json => {
  const seen = new Set(), arrays = [];
  const walk = value => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) arrays.push(value); else for (const v of Object.values(value)) walk(v);
  };
  walk(json);
  return arrays.filter(a => a.length && a.some(x => looksLikeItem(x) >= 5)).sort((a,b) => {
    const sa = a.filter(x => looksLikeItem(x) >= 5).length, sb = b.filter(x => looksLikeItem(x) >= 5).length;
    return sb - sa || b.length - a.length;
  })[0] || [];
};
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
async function getPage(pageNumber, limit = 1000) {
  const url = `${API_URL}?page=${pageNumber}&limit=${limit}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await page.request.get(url, { timeout: 30000 });
      if (r.ok()) return { pageNumber, url, rows: extractRows(await r.json()) };
    } catch {}
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  return { pageNumber, url, rows: [] };
}
const probe = await getPage(0, 1000);
console.log(`Annie probe: ${probe.rows.length} items from ${probe.url}`);
let rawRows = probe.rows;
if (probe.rows.length < 900) {
  const firstPageSize = Math.max(probe.rows.length, 1), all = new Map();
  for (const x of probe.rows) {
    const id = String(x.id ?? x.itemId ?? x.ID ?? x.code ?? x.item_id ?? '').trim();
    if (id) all.set(id, x);
  }
  let pageNumber = 1, emptyStreak = 0;
  const batchSize = 12;
  while (pageNumber < 2000 && emptyStreak < 2) {
    const pages = Array.from({ length: batchSize }, (_, i) => pageNumber + i);
    const results = await Promise.all(pages.map(p => getPage(p, firstPageSize)));
    let got = 0;
    for (const result of results) {
      if (!result.rows.length) continue;
      got += result.rows.length;
      for (const x of result.rows) {
        const id = String(x.id ?? x.itemId ?? x.ID ?? x.code ?? x.item_id ?? '').trim();
        if (id) all.set(id, x);
      }
    }
    console.log(`Pages ${pages[0]}-${pages.at(-1)}: +${got}, total ${all.size}`);
    emptyStreak = got === 0 ? emptyStreak + 1 : 0;
    if (got < firstPageSize && results.some(r => r.rows.length < firstPageSize)) emptyStreak = 2;
    pageNumber += batchSize;
  }
  rawRows = [...all.values()];
}
const normalize = (x) => ({
  id: String(x.id ?? x.itemId ?? x.ID ?? x.code ?? x.item_id ?? '').trim(),
  name: String(x.name ?? x.title ?? x.Name ?? x.itemName ?? x.item_name ?? '').trim(),
  category: x.category ?? x.type ?? x.Type ?? x.typeName ?? x.type_name ?? '',
  rarity: Number(x.rarity ?? x.star ?? x.stars ?? x.Rarity ?? 0) || null,
  gorgeous: Number(x.gorgeous ?? x.Gorgeous ?? 0) || 0,
  simple: Number(x.simple ?? x.Simple ?? 0) || 0,
  elegant: Number(x.elegance ?? x.Elegance ?? x.elegant ?? 0) || 0,
  lively: Number(x.lively ?? x.Lively ?? 0) || 0,
  mature: Number(x.mature ?? x.Mature ?? 0) || 0,
  cute: Number(x.cute ?? x.Cute ?? 0) || 0,
  sexy: Number(x.sexy ?? x.Sexy ?? 0) || 0,
  pure: Number(x.pure ?? x.Pure ?? 0) || 0,
  warm: Number(x.warm ?? x.Warm ?? 0) || 0,
  cool: Number(x.cool ?? x.Cool ?? 0) || 0,
  tags: Array.isArray(x.tags) ? x.tags : (x.tag ? [x.tag] : []),
  image: abs(x.image ?? x.imageUrl ?? x.img ?? x.image_url ?? x.icon ?? x.iconUrl ?? ''),
  suit: x.suit ?? x.suitName ?? x.suit_name ?? '',
  source: 'Annie Nikki Homes', sourceUrl: PAGE_URL, verificationStatus: 'source-imported'
});
const normalized = rawRows.map(normalize);
const unique = new Map();
for (const item of normalized) {
  if (!item.id || !item.name) continue;
  if (!unique.has(item.id)) unique.set(item.id, item);
}
const rows = [...unique.values()];
if (!rows.length) { await browser.close(); throw new Error('Không lấy được item hợp lệ từ Annie.'); }
const payload = { version: 7, game: 'Ngôi Sao Thời Trang VNG', locale: 'vi-VN', source: 'Annie Nikki Homes', sourceUrl: PAGE_URL, fetchedAt: new Date().toISOString(), targetCount: 32561, count: rows.length, items: rows };
await fs.mkdir(path.dirname(out), { recursive: true });
// Compact JSON keeps GitHub Pages download much smaller and makes the mobile site load faster.
await fs.writeFile(out, JSON.stringify(payload));
await browser.close();
console.log(`Imported ${rows.length} valid unique items from Annie API.`);
if (rows.length < 30000) console.warn(`Nguồn hiện thu được ${rows.length} item; không bơm item giả.`);

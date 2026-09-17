import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const URL = process.env.SOURCE_URL || 'https://annie-nikki.homes/items';
const out = path.resolve('data/items.json');
const abs = (u) => { try { return new URL(u, URL).href } catch { return u || '' } };

const arrays = (value, seen = new Set()) => {
  if (!value || typeof value !== 'object' || seen.has(value)) return [];
  seen.add(value);
  const out = [];
  if (Array.isArray(value)) out.push(value);
  for (const v of Object.values(value)) out.push(...arrays(v, seen));
  return out;
};

const isObject = x => x && typeof x === 'object' && !Array.isArray(x);
const keysOf = x => isObject(x) ? Object.keys(x).map(k => k.toLowerCase()) : [];
const looksLikeItem = x => {
  if (!isObject(x)) return 0;
  const k = keysOf(x);
  let score = 0;
  if (k.some(v => ['id','itemid','code','item_id'].includes(v))) score += 2;
  if (k.some(v => ['name','title','itemname','item_name'].includes(v))) score += 3;
  if (k.some(v => ['image','imageurl','img','image_url','icon','iconurl'].includes(v))) score += 3;
  if (k.some(v => ['category','type','typename','type_id'].includes(v))) score += 1;
  if (k.some(v => ['rarity','star','stars'].includes(v))) score += 1;
  if (k.some(v => ['gorgeous','simple','elegant','lively','mature','cute','sexy','pure','warm','cool'].includes(v))) score += 2;
  return score;
};

const scoreArray = rows => {
  if (!Array.isArray(rows) || rows.length < 2) return { score: -1, itemLike: 0 };
  const sample = rows.slice(0, Math.min(rows.length, 200));
  const itemLike = sample.reduce((n, x) => n + (looksLikeItem(x) >= 5 ? 1 : 0), 0);
  const avg = sample.reduce((n, x) => n + looksLikeItem(x), 0) / sample.length;
  return { score: itemLike * 1000 + avg * 100 + Math.min(rows.length, 100000) / 1000, itemLike };
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const candidates = [];
const seenUrls = new Set();

const inspectJson = (json, url) => {
  for (const rows of arrays(json)) {
    const s = scoreArray(rows);
    if (s.score >= 0) candidates.push({ url, rows, ...s });
  }
};

page.on('response', async response => {
  const type = response.headers()['content-type'] || '';
  const u = response.url();
  if (type.includes('json') || /api|items|wardrobe|data/i.test(u)) {
    try {
      const text = await response.text();
      if (text.length < 50_000_000) {
        const json = JSON.parse(text);
        inspectJson(json, u);
      }
    } catch {}
  }
});

await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(5000);

const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(x => x.name));
const scripts = [...new Set(resources.filter(u => /\.(js|json)(\?|$)|\/api\//i.test(u)))];

for (const u of scripts) {
  try {
    const text = await page.evaluate(async u => { try { return await (await fetch(u)).text(); } catch { return ''; } }, u);
    const matches = [...text.matchAll(/(?:https?:\/\/[^"'`\s]+|\/api\/[A-Za-z0-9_?=&/.:-]+)/g)]
      .map(m => m[0].replace(/[),;]+$/, ''));
    for (const raw of matches) {
      const endpoint = abs(raw);
      if (seenUrls.has(endpoint)) continue;
      seenUrls.add(endpoint);
      try {
        const r = await page.request.get(endpoint, { timeout: 20000 });
        const ct = r.headers()['content-type'] || '';
        if (r.ok() && ct.includes('json')) inspectJson(await r.json(), endpoint);
      } catch {}
    }
  } catch {}
}

const embedded = await page.evaluate(() => [...document.querySelectorAll('script[type="application/json"]')].map(x => x.textContent || ''));
for (const text of embedded) { try { inspectJson(JSON.parse(text), 'embedded'); } catch {} }

const ranked = candidates
  .filter(c => c.itemLike > 0)
  .sort((a, b) => b.score - a.score);

console.log('Annie payload candidates:');
for (const c of ranked.slice(0, 12)) console.log(JSON.stringify({ url: c.url, rows: c.rows.length, itemLike: c.itemLike, score: c.score }));

const best = ranked[0];
if (!best?.rows?.length || best.itemLike === 0) {
  await browser.close();
  throw new Error('Không tìm thấy payload item JSON phù hợp từ Annie. Không tạo dữ liệu giả.');
}

const normalize = (x, index) => ({
  id: String(x.id ?? x.itemId ?? x.ID ?? x.code ?? x.item_id ?? index + 1),
  name: x.name ?? x.title ?? x.Name ?? x.itemName ?? x.item_name ?? '',
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
  source: 'Annie Nikki Homes',
  sourceUrl: URL,
  verificationStatus: 'source-imported'
});

const rows = best.rows.map(normalize).filter(x => x.name || x.image);
const payload = {
  version: 4,
  game: 'Ngôi Sao Thời Trang VNG',
  locale: 'vi-VN',
  source: 'Annie Nikki Homes',
  sourceUrl: URL,
  fetchedAt: new Date().toISOString(),
  count: rows.length,
  items: rows
};

await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, JSON.stringify(payload, null, 2));
await browser.close();
console.log(`Imported ${rows.length} items from ${best.url}`);
if (rows.length < 30000) console.warn(`Nguồn hiện trả về dưới 30.000 item; giữ dữ liệu thật, không bơm item giả.`);

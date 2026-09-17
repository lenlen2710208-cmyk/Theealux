import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const URL = process.env.SOURCE_URL || 'https://annie-nikki.homes/items';
const out = path.resolve('data/items.json');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const responses = [];
page.on('response', async response => {
  const type = response.headers()['content-type'] || '';
  const u = response.url();
  if (type.includes('json') || /api|items|wardrobe|data/i.test(u)) {
    try {
      const text = await response.text();
      if (text.length < 25_000_000) responses.push({ url: u, type, text });
    } catch {}
  }
});
await page.goto(URL, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(5000);

const candidates = [];
for (const r of responses) {
  try {
    const json = JSON.parse(r.text);
    const flat = Array.isArray(json) ? json : Object.values(json).find(Array.isArray) || null;
    if (Array.isArray(flat) && flat.length >= 20) candidates.push({ url: r.url, rows: flat });
  } catch {}
}

let rows = candidates.sort((a,b)=>b.rows.length-a.rows.length)[0]?.rows || [];
if (!rows.length) {
  await browser.close();
  throw new Error('Không tìm thấy payload item JSON từ Annie. Không tạo dữ liệu giả.');
}

const normalize = (x, index) => ({
  id: String(x.id ?? x.itemId ?? x.ID ?? x.code ?? index + 1),
  name: x.name ?? x.title ?? x.Name ?? '',
  category: x.category ?? x.type ?? x.Type ?? '',
  rarity: Number(x.rarity ?? x.star ?? x.Rarity ?? 0) || null,
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
  tags: x.tags ?? x.tag ?? [],
  image: x.image ?? x.imageUrl ?? x.img ?? x.image_url ?? '',
  suit: x.suit ?? x.suitName ?? '',
  source: 'Annie Nikki Homes',
  sourceUrl: URL,
  verificationStatus: 'source-imported',
}));
rows = rows.map(normalize).filter(x => x.name || x.image);

await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, JSON.stringify({
  version: 1,
  game: 'Ngôi Sao Thời Trang VNG',
  locale: 'vi-VN',
  source: 'Annie Nikki Homes',
  sourceUrl: URL,
  fetchedAt: new Date().toISOString(),
  count: rows.length,
  items: rows
}, null, 2));
await browser.close();
console.log(`Imported ${rows.length} items into ${out}`);
if (rows.length < 30000) console.warn('Nguồn hiện trả về dưới 30.000 item; workflow vẫn giữ dữ liệu thật và không bơm item giả.');

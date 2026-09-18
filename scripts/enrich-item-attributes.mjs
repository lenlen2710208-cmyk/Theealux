import fs from 'node:fs/promises';

const ITEMS_PATH = 'data/items.json';
const OUT_PATH = 'data/items-enriched.json';
const API_BASE = 'https://annie-nikki.homes';
const ATTR_KEYS = ['gorgeous','simple','elegant','lively','mature','cute','sexy','pure','warm','cool'];
const CONCURRENCY = Math.max(4, Math.min(32, Number(process.env.CONCURRENCY || 16)));
const PAGE_SIZE = 50;
const TIMEOUT = Number(process.env.TIMEOUT || 25000);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 4);

const headers = {
  accept: 'application/json,text/plain,*/*',
  origin: API_BASE,
  referer: API_BASE + '/items',
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(path) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const res = await fetch(API_BASE + path, { headers, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) await sleep(300 * (2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

function normalizeTags(detail) {
  const rows = detail?.item?.item_tags || [];
  return rows.map(row => row?.tags || row).filter(Boolean).map(tag => ({
    id: String(tag.id ?? tag.name ?? tag.name_vn ?? ''),
    name: tag.name ?? '',
    nameVi: tag.name_vn ?? tag.name ?? ''
  })).filter(x => x.id || x.name || x.nameVi);
}

function normalizeSuit(item) {
  const suit = item?.suits;
  if (!item?.suit_id && !suit) return null;
  return {
    id: item?.suit_id ? String(item.suit_id) : (suit?.id ? String(suit.id) : ''),
    name: suit?.name ?? '',
    nameVi: suit?.name_vn ?? suit?.name ?? '',
    slug: suit?.slug ?? ''
  };
}

function normalizeAttributes(item) {
  const out = {};
  for (const key of ATTR_KEYS) out[key] = item?.[key] || null;
  return out;
}

async function main() {
  const raw = JSON.parse(await fs.readFile(ITEMS_PATH, 'utf8'));
  const sourceItems = Array.isArray(raw) ? raw : (raw.items || []);
  const wantedIds = new Set(sourceItems.map(x => String(x.id)));
  console.log(`Theealux source items: ${wantedIds.size}`);

  const first = await getJson('/api/items?page=0');
  const total = Number(first.total || 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const listMap = new Map((first.items || []).map(x => [String(x.id), x]));

  for (let page = 1; page < pages; page++) {
    const data = await getJson(`/api/items?page=${page}`);
    for (const item of data.items || []) {
      const id = String(item.id);
      if (wantedIds.has(id)) listMap.set(id, item);
    }
    if (page % 25 === 0 || page === pages - 1) {
      console.log(`List pages: ${page + 1}/${pages}; matched ${listMap.size}/${wantedIds.size}`);
    }
  }

  const ids = [...wantedIds];
  const detailMap = new Map();
  let done = 0;
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async id => {
      try {
        return [id, await getJson(`/api/items/${encodeURIComponent(id)}`), null];
      } catch (err) {
        return [id, null, String(err?.message || err)];
      }
    }));
    for (const [id, detail, err] of results) {
      if (detail?.item) detailMap.set(id, detail);
      else if (err) console.warn(`Detail failed ${id}: ${err}`);
      done++;
    }
    if (done % 250 === 0 || done === ids.length) {
      console.log(`Details: ${done}/${ids.length}; ok=${detailMap.size}`);
    }
    await sleep(40);
  }

  let attrCount = 0, suitCount = 0, tagCount = 0, detailedCount = 0;
  const fetchedAt = new Date().toISOString();
  const enrichedItems = sourceItems.map(original => {
    const id = String(original.id);
    const detail = detailMap.get(id);
    const list = listMap.get(id);
    const item = detail?.item || list || null;
    if (!item) return {
      ...original,
      enrichment: { source: 'Annie Nikki Homes', status: 'not-found', sourceUrl: `${API_BASE}/items/${encodeURIComponent(id)}` }
    };

    detailedCount++;
    const attributes = normalizeAttributes(item);
    if (Object.values(attributes).some(Boolean)) attrCount++;
    const tagsDetailed = detail ? normalizeTags(detail) : [];
    const tags = tagsDetailed.length ? tagsDetailed : (Array.isArray(original.tags) ? original.tags : []);
    const suit = detail ? normalizeSuit(item) : null;
    if (tagsDetailed.length) tagCount++;
    if (suit) suitCount++;

    return {
      ...original,
      name: original.name || item.name_vn || item.name || id,
      rarity: original.rarity ?? item.rarity ?? null,
      attributes,
      tags,
      suit: suit ?? original.suit ?? null,
      sourceMetadata: {
        provider: 'Annie Nikki Homes',
        sourceUrl: `${API_BASE}/items/${encodeURIComponent(id)}`,
        fetchedAt,
        sourceItemUpdatedAt: item.updated_at || null,
        englishName: item.name || null,
        vietnameseName: item.name_vn || null,
        chineseName: item.name_cn || null,
        typeId: item.type_id || null,
        subtypeId: item.subtype_id || null,
        mainColor: item.maincolor || null,
        otherColor: item.othercolor || null,
        attr1: item.attr1 || null,
        attr2: item.attr2 || null
      }
    };
  });

  const out = Array.isArray(raw) ? enrichedItems : {
    ...raw,
    version: Number(raw.version || 1) + 1,
    source: 'Theealux + Annie Nikki Homes public item metadata',
    sourceUrl: `${API_BASE}/items`,
    fetchedAt,
    count: enrichedItems.length,
    enrichmentCoverage: {
      requested: ids.length,
      found: detailedCount,
      withAttributes: attrCount,
      withSuit: suitCount,
      withTags: tagCount
    },
    attributeFormat: 'Letter grades from source (SSS/SS/S/A/B/C or null). No numeric score is invented.',
    items: enrichedItems
  };

  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(`DONE ${OUT_PATH}`);
  console.log(JSON.stringify(out.enrichmentCoverage || {}, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

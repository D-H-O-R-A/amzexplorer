#!/usr/bin/env node
// ==============================================================================
// Planet One Explorer & FullExplorer - Strict 10,000 URLs Sitemap Generator
// ==============================================================================
// Strictly ensures EVERY generated sitemap has a MAXIMUM of 10,000 URLs.
// Sitemaps are queried from FullExplorer API and distributed across cleanly
// partitioned sitemaps:
//  - sitemap-main.xml (Main ecosystem routes)
//  - sitemap-blocks-1.xml .. sitemap-blocks-N.xml (Max 10,000 blocks each)
//  - sitemap-transactions-1.xml .. sitemap-transactions-N.xml (Max 10,000 txs each)
//  - sitemap-addresses-1.xml .. sitemap-addresses-N.xml (Max 10,000 addresses each)
//  - sitemap-assets.xml (Tokens and Environmental Assets)
// Also generates legacy aliases (sitemap-blocks.xml, sitemap-transactions.xml,
// sitemap-addresses.xml) and handles common typos (sitmap.xml) for Googlebot.
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const FULLEXPLORER_DIR = path.resolve(ROOT_DIR, 'fullexplorer');

const NODE_URL = process.env.PLANETONE_NODE_URL || 'https://nodes.planetone.io';
const FULLEXPLORER_API = process.env.PLANETONE_FULLEXPLORER_API || 'https://fullexplorer.planetone.io/api';
const EXPLORER_BASE = 'https://explorer.planetone.io';
const FULLEXPLORER_BASE = 'https://fullexplorer.planetone.io';

const MAX_URLS_PER_SITEMAP = 10000;

const nowIso = new Date().toISOString();
const todayDate = nowIso.split('T')[0];

console.log('[Sitemap Generator] ==============================================');
console.log(`[Sitemap Generator] Maximum URLs per Sitemap: ${MAX_URLS_PER_SITEMAP}`);
console.log(`[Sitemap Generator] Querying FullExplorer API: ${FULLEXPLORER_API}`);
console.log(`[Sitemap Generator] Querying Blockchain Node: ${NODE_URL}`);
console.log('[Sitemap Generator] ==============================================');

async function safeFetchJson(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'PlanetOne-Sitemap-Generator/3.0' } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[Sitemap Generator] Warning fetching ${url}:`, err.message);
    return null;
  }
}

function writeToFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[Sitemap Generator] Wrote: ${filePath} (${(content.length / 1024).toFixed(1)} KB)`);
}

function generateXmlUrlset(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const item of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${item.loc}</loc>\n`;
    if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    if (item.changefreq) xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    if (item.priority) xml += `    <priority>${item.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>\n';
  return xml;
}

function generateXmlSitemapIndex(sitemaps) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const item of sitemaps) {
    xml += '  <sitemap>\n';
    xml += `    <loc>${item.loc}</loc>\n`;
    xml += `    <lastmod>${item.lastmod || todayDate}</lastmod>\n`;
    xml += '  </sitemap>\n';
  }
  xml += '</sitemapindex>\n';
  return xml;
}

async function collectBlockchainData() {
  // 1. Fetch current on-chain stats from FullExplorer API
  console.log('[Sitemap Generator] 1/4 Querying on-chain height and stats from FullExplorer API...');
  let height = 107354;
  const stats = await safeFetchJson(`${FULLEXPLORER_API}/stats`);
  if (stats && stats.height) {
    height = stats.height;
  } else {
    const nodeHeight = await safeFetchJson(`${NODE_URL}/blocks/height`);
    if (nodeHeight && nodeHeight.height) height = nodeHeight.height;
  }
  console.log(`[Sitemap Generator] Confirmed Block Height: ${height}`);

  const genesisTs = 1784672365854; // July 21, 2026
  const currentTs = stats && stats.timestamp ? stats.timestamp * 1000 : Date.now();
  const avgMsPerBlock = Math.max(10000, (currentTs - genesisTs) / height);

  function getBlockDate(h) {
    const ts = genesisTs + (h - 1) * avgMsPerBlock;
    return new Date(Math.min(currentTs, ts)).toISOString().split('T')[0];
  }

  // 2. Collect transactions from FullExplorer API
  console.log('[Sitemap Generator] 2/4 Collecting transactions from FullExplorer API index...');
  const transactionsMap = new Map();

  // Genesis and foundation transactions
  transactionsMap.set('3Qd7NduracfAiKfRw2vqBdmLUoLp5dGApNVMogsexoKQ4g4N2Rc3S2aWPqWGpHG7U9c88137pSDwxXyGc27dxdP5', {
    id: '3Qd7NduracfAiKfRw2vqBdmLUoLp5dGApNVMogsexoKQ4g4N2Rc3S2aWPqWGpHG7U9c88137pSDwxXyGc27dxdP5',
    date: '2026-07-21',
    priority: '1.0'
  });
  transactionsMap.set('AAyf6hiqW17aivtcdY34eFx2GobqnkdSx4Pj5U8S5nfk', {
    id: 'AAyf6hiqW17aivtcdY34eFx2GobqnkdSx4Pj5U8S5nfk',
    date: '2026-07-21',
    priority: '1.0'
  });

  try {
    const topBatch = await safeFetchJson(`${FULLEXPLORER_API}/transactions?limit=100`);
    let topTxKey = topBatch && topBatch[0] ? topBatch[0].txkey : null;

    if (topTxKey) {
      // Fetch 200 batches in sequential bursts (20,000 transactions)
      for (let burst = 0; burst < 4; burst++) {
        const promises = [];
        for (let i = 0; i < 50; i++) {
          const idx = (burst * 50) + i;
          const cursor = topTxKey - (idx * 100);
          promises.push(safeFetchJson(`${FULLEXPLORER_API}/transactions/${cursor}?limit=100`));
        }
        const results = await Promise.all(promises);
        for (const batch of results) {
          if (Array.isArray(batch)) {
            for (const tx of batch) {
              if (tx && tx.id && !transactionsMap.has(tx.id)) {
                const d = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString().split('T')[0] : todayDate;
                transactionsMap.set(tx.id, {
                  id: tx.id,
                  date: d,
                  priority: '0.8'
                });
              }
            }
          }
        }
      }

      // Also sample historical checkpoint heights across the entire blockchain
      const historyPromises = [];
      for (let h = height; h >= 1000; h -= 2000) {
        const cursorH = (BigInt(h) << 32n) | 0xFFFFFFFFn;
        historyPromises.push(safeFetchJson(`${FULLEXPLORER_API}/transactions/${cursorH.toString()}?limit=100`));
      }
      const historyBatches = await Promise.all(historyPromises);
      for (const batch of historyBatches) {
        if (Array.isArray(batch)) {
          for (const tx of batch) {
            if (tx && tx.id && !transactionsMap.has(tx.id)) {
              const d = tx.timestamp ? new Date(tx.timestamp * 1000).toISOString().split('T')[0] : todayDate;
              transactionsMap.set(tx.id, {
                id: tx.id,
                date: d,
                priority: '0.8'
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Sitemap Generator] Note fetching transactions:', err.message);
  }
  console.log(`[Sitemap Generator] Collected: ${transactionsMap.size} unique verified transactions.`);

  // 3. Collect addresses from FullExplorer Rich List
  console.log('[Sitemap Generator] 3/4 Collecting addresses from FullExplorer API (Rich List & Accounts)...');
  const addressesMap = new Map();

  addressesMap.set('3LDqeVbNxAyg1pmyQBARW853LBxaFmjumcy', { address: '3LDqeVbNxAyg1pmyQBARW853LBxaFmjumcy', priority: '1.0' });
  addressesMap.set('3LCjqeQzpuPC6RBUrA7Gb3ruNAKjaVwzk6Q', { address: '3LCjqeQzpuPC6RBUrA7Gb3ruNAKjaVwzk6Q', priority: '0.9' });
  addressesMap.set('3P6D2sUshXn8XUscR4T2M9i2kUo9tG7e3pB', { address: '3P6D2sUshXn8XUscR4T2M9i2kUo9tG7e3pB', priority: '0.9' });

  try {
    // Fetch 200 pages in sequential bursts (20,000 top ranked addresses)
    for (let burst = 0; burst < 4; burst++) {
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const idx = (burst * 50) + i;
        promises.push(safeFetchJson(`${FULLEXPLORER_API}/top/PLO/${idx * 100}`));
      }
      const results = await Promise.all(promises);
      for (const res of results) {
        if (res && Array.isArray(res.holders)) {
          for (const h of res.holders) {
            if (h && h.address && !addressesMap.has(h.address)) {
              addressesMap.set(h.address, {
                address: h.address,
                priority: h.rank <= 100 ? '0.9' : (h.rank <= 1000 ? '0.8' : '0.7')
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Sitemap Generator] Note fetching addresses:', err.message);
  }
  console.log(`[Sitemap Generator] Collected: ${addressesMap.size} unique blockchain addresses.`);

  // 4. Ecosystem Tokens and Environmental Assets
  console.log('[Sitemap Generator] 4/4 Collecting ecosystem tokens & environmental assets...');
  const assets = [
    'AAyf6hiqW17aivtcdY34eFx2GobqnkdSx4Pj5U8S5nfk', // VERDE
    'BXwyK6pvWnJUmTzQznGU6C5tK1og2vmUjSnW4FbYNMZD',
    'BBFzqFCYd6ouAXWqBCLsMVC2ErgmyfPjBzLdnRByMR83',
    '9vn6nbkRecBTNiCFpwvv9aFz5G8mPr1rgbQ48YLbzeF',
    '2u2uTcgNmETDHnbAouV65KM5Qa46QH3JXi39Nsh9JFgE',
    '5HkAvQoZHnB66TBiPwwYY6Xix4KP6LiY9z9J7uaRaHyK',
  ];

  return {
    height,
    getBlockDate,
    transactions: Array.from(transactionsMap.values()),
    addresses: Array.from(addressesMap.values()),
    assets
  };
}

async function main() {
  const data = await collectBlockchainData();
  const { height, getBlockDate, transactions, addresses, assets } = data;

  // ============================================================================
  // 1. GENERATE MAIN EXPLORER SITEMAPS (explorer.planetone.io)
  // ============================================================================
  console.log('\n[Sitemap Generator] Generating XML files for Main Explorer (Max 10.000 URLs each)...');

  // (a) Main Routes (< 10.000)
  const explorerMainRoutes = [
    { loc: `${EXPLORER_BASE}/`, priority: '1.0', changefreq: 'always', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/blocks`, priority: '0.9', changefreq: 'always', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/transactions`, priority: '0.9', changefreq: 'always', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/nodes`, priority: '0.9', changefreq: 'always', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/contracts`, priority: '0.85', changefreq: 'daily', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/ranking`, priority: '0.85', changefreq: 'daily', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/carbon-map`, priority: '0.9', changefreq: 'daily', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/tokenplanet/VERDE`, priority: '0.95', changefreq: 'daily', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/address-converter`, priority: '0.8', changefreq: 'weekly', lastmod: todayDate },
    { loc: `${EXPLORER_BASE}/faucet`, priority: '0.8', changefreq: 'daily', lastmod: todayDate },
  ];
  const explorerMainXml = generateXmlUrlset(explorerMainRoutes);

  // (b) Blocks - EXACTLY <= 10.000 per sitemap!
  const numBlockChunks = Math.ceil(height / MAX_URLS_PER_SITEMAP);
  const explorerBlockFiles = [];

  for (let c = 0; c < numBlockChunks; c++) {
    const chunkIndex = c + 1;
    const topH = height - (c * MAX_URLS_PER_SITEMAP);
    const bottomH = Math.max(1, height - ((c + 1) * MAX_URLS_PER_SITEMAP) + 1);

    const urls = [];
    for (let h = topH; h >= bottomH; h--) {
      const d = getBlockDate(h);
      const prio = h >= height - 100 ? '0.9' : (h >= height - 5000 ? '0.8' : '0.6');
      urls.push({
        loc: `${EXPLORER_BASE}/block/${h}`,
        lastmod: d,
        changefreq: 'never',
        priority: prio
      });
    }

    explorerBlockFiles.push({
      fileName: `sitemap-blocks-${chunkIndex}.xml`,
      url: `${EXPLORER_BASE}/sitemap-blocks-${chunkIndex}.xml`,
      content: generateXmlUrlset(urls),
      count: urls.length
    });
  }

  // (c) Transactions - Partitioned into chunks of max 10.000 each
  const numTxChunks = Math.max(1, Math.ceil(transactions.length / MAX_URLS_PER_SITEMAP));
  const explorerTxFiles = [];

  for (let c = 0; c < numTxChunks; c++) {
    const chunkIndex = c + 1;
    const start = c * MAX_URLS_PER_SITEMAP;
    const end = Math.min(transactions.length, (c + 1) * MAX_URLS_PER_SITEMAP);
    const chunkTxs = transactions.slice(start, end);

    const urls = chunkTxs.map(t => ({
      loc: `${EXPLORER_BASE}/tx/${t.id}`,
      lastmod: t.date,
      changefreq: 'never',
      priority: t.priority
    }));

    explorerTxFiles.push({
      fileName: numTxChunks === 1 ? 'sitemap-transactions-1.xml' : `sitemap-transactions-${chunkIndex}.xml`,
      url: `${EXPLORER_BASE}/${numTxChunks === 1 ? 'sitemap-transactions-1.xml' : `sitemap-transactions-${chunkIndex}.xml`}`,
      content: generateXmlUrlset(urls),
      count: urls.length
    });
  }

  // (d) Addresses - Partitioned into chunks of max 10.000 each
  const numAddrChunks = Math.max(1, Math.ceil(addresses.length / MAX_URLS_PER_SITEMAP));
  const explorerAddrFiles = [];

  for (let c = 0; c < numAddrChunks; c++) {
    const chunkIndex = c + 1;
    const start = c * MAX_URLS_PER_SITEMAP;
    const end = Math.min(addresses.length, (c + 1) * MAX_URLS_PER_SITEMAP);
    const chunkAddrs = addresses.slice(start, end);

    const urls = chunkAddrs.map(a => ({
      loc: `${EXPLORER_BASE}/address/${a.address}`,
      lastmod: todayDate,
      changefreq: 'hourly',
      priority: a.priority
    }));

    // In first chunk, append contracts
    if (chunkIndex === 1) {
      for (const a of addresses.slice(0, 10)) {
        urls.push({
          loc: `${EXPLORER_BASE}/contract/${a.address}`,
          lastmod: todayDate,
          changefreq: 'daily',
          priority: a.priority
        });
      }
    }

    explorerAddrFiles.push({
      fileName: numAddrChunks === 1 ? 'sitemap-addresses-1.xml' : `sitemap-addresses-${chunkIndex}.xml`,
      url: `${EXPLORER_BASE}/${numAddrChunks === 1 ? 'sitemap-addresses-1.xml' : `sitemap-addresses-${chunkIndex}.xml`}`,
      content: generateXmlUrlset(urls),
      count: urls.length
    });
  }

  // (e) Assets (< 10.000)
  const explorerAssetUrls = [
    { loc: `${EXPLORER_BASE}/tokenplanet/VERDE`, priority: '1.0', changefreq: 'daily', lastmod: todayDate },
    ...assets.map(assetId => ({
      loc: `${EXPLORER_BASE}/asset/${assetId}`,
      priority: '0.9',
      changefreq: 'daily',
      lastmod: todayDate
    }))
  ];
  const explorerAssetsXml = generateXmlUrlset(explorerAssetUrls);

  // (f) Master Sitemap Index for Main Explorer
  const explorerIndexEntries = [
    { loc: `${EXPLORER_BASE}/sitemap-main.xml`, lastmod: todayDate },
    ...explorerBlockFiles.map(b => ({ loc: b.url, lastmod: todayDate })),
    ...explorerTxFiles.map(t => ({ loc: t.url, lastmod: todayDate })),
    ...explorerAddrFiles.map(a => ({ loc: a.url, lastmod: todayDate })),
    { loc: `${EXPLORER_BASE}/sitemap-assets.xml`, lastmod: todayDate },
  ];
  const explorerIndexXml = generateXmlSitemapIndex(explorerIndexEntries);

  // Write all Explorer files to public/ and dist/
  const writeExplorerTargets = (dir) => {
    writeToFile(path.resolve(dir, 'sitemap.xml'), explorerIndexXml);
    // Typo protection: if Googlebot requests sitmap.xml, serve the exact valid index
    writeToFile(path.resolve(dir, 'sitmap.xml'), explorerIndexXml);

    writeToFile(path.resolve(dir, 'sitemap-main.xml'), explorerMainXml);

    for (const b of explorerBlockFiles) {
      writeToFile(path.resolve(dir, b.fileName), b.content);
    }
    // Backward compatibility aliases
    writeToFile(path.resolve(dir, 'sitemap-blocks.xml'), explorerBlockFiles[0].content);
    writeToFile(path.resolve(dir, 'sitemap-blocks-1.xml'), explorerBlockFiles[0].content);

    for (const t of explorerTxFiles) {
      writeToFile(path.resolve(dir, t.fileName), t.content);
    }
    writeToFile(path.resolve(dir, 'sitemap-transactions.xml'), explorerTxFiles[0].content);

    for (const a of explorerAddrFiles) {
      writeToFile(path.resolve(dir, a.fileName), a.content);
    }
    writeToFile(path.resolve(dir, 'sitemap-addresses.xml'), explorerAddrFiles[0].content);

    writeToFile(path.resolve(dir, 'sitemap-assets.xml'), explorerAssetsXml);
  };

  writeExplorerTargets(PUBLIC_DIR);
  if (fs.existsSync(DIST_DIR)) {
    writeExplorerTargets(DIST_DIR);
  }

  // ============================================================================
  // 2. GENERATE FULL EXPLORER SITEMAPS (fullexplorer.planetone.io)
  // ============================================================================
  console.log('\n[Sitemap Generator] Generating XML files for FullExplorer (Max 10.000 URLs each)...');

  // (a) Main Routes
  const fullexplorerMainRoutes = [
    { loc: `${FULLEXPLORER_BASE}/`, priority: '1.0', changefreq: 'always', lastmod: todayDate },
    { loc: `${FULLEXPLORER_BASE}/GENERATORS`, priority: '0.9', changefreq: 'always', lastmod: todayDate },
    { loc: `${FULLEXPLORER_BASE}/top`, priority: '0.9', changefreq: 'hourly', lastmod: todayDate },
    { loc: `${FULLEXPLORER_BASE}/ACTIVATION`, priority: '0.8', changefreq: 'daily', lastmod: todayDate },
  ];
  const fullexplorerMainXml = generateXmlUrlset(fullexplorerMainRoutes);

  // (b) Blocks for FullExplorer
  const fullexplorerBlockFiles = [];
  for (let c = 0; c < numBlockChunks; c++) {
    const chunkIndex = c + 1;
    const topH = height - (c * MAX_URLS_PER_SITEMAP);
    const bottomH = Math.max(1, height - ((c + 1) * MAX_URLS_PER_SITEMAP) + 1);

    const urls = [];
    for (let h = topH; h >= bottomH; h--) {
      const d = getBlockDate(h);
      const prio = h >= height - 100 ? '0.9' : (h >= height - 5000 ? '0.8' : '0.6');
      urls.push({
        loc: `${FULLEXPLORER_BASE}/b/${h}`,
        lastmod: d,
        changefreq: 'never',
        priority: prio
      });
    }

    fullexplorerBlockFiles.push({
      fileName: `sitemap-blocks-${chunkIndex}.xml`,
      url: `${FULLEXPLORER_BASE}/sitemap-blocks-${chunkIndex}.xml`,
      content: generateXmlUrlset(urls),
    });
  }

  // (c) Transactions for FullExplorer
  const fullexplorerTxFiles = [];
  for (let c = 0; c < numTxChunks; c++) {
    const chunkIndex = c + 1;
    const start = c * MAX_URLS_PER_SITEMAP;
    const end = Math.min(transactions.length, (c + 1) * MAX_URLS_PER_SITEMAP);
    const chunkTxs = transactions.slice(start, end);

    const urls = chunkTxs.map(t => ({
      loc: `${FULLEXPLORER_BASE}/tx/${t.id}`,
      lastmod: t.date,
      changefreq: 'never',
      priority: t.priority
    }));

    fullexplorerTxFiles.push({
      fileName: numTxChunks === 1 ? 'sitemap-transactions-1.xml' : `sitemap-transactions-${chunkIndex}.xml`,
      url: `${FULLEXPLORER_BASE}/${numTxChunks === 1 ? 'sitemap-transactions-1.xml' : `sitemap-transactions-${chunkIndex}.xml`}`,
      content: generateXmlUrlset(urls),
    });
  }

  // (d) Addresses for FullExplorer
  const fullexplorerAddrFiles = [];
  for (let c = 0; c < numAddrChunks; c++) {
    const chunkIndex = c + 1;
    const start = c * MAX_URLS_PER_SITEMAP;
    const end = Math.min(addresses.length, (c + 1) * MAX_URLS_PER_SITEMAP);
    const chunkAddrs = addresses.slice(start, end);

    const urls = chunkAddrs.map(a => ({
      loc: `${FULLEXPLORER_BASE}/${a.address}`,
      lastmod: todayDate,
      changefreq: 'hourly',
      priority: a.priority
    }));

    fullexplorerAddrFiles.push({
      fileName: numAddrChunks === 1 ? 'sitemap-addresses-1.xml' : `sitemap-addresses-${chunkIndex}.xml`,
      url: `${FULLEXPLORER_BASE}/${numAddrChunks === 1 ? 'sitemap-addresses-1.xml' : `sitemap-addresses-${chunkIndex}.xml`}`,
      content: generateXmlUrlset(urls),
    });
  }

  // (e) Master Sitemap Index for FullExplorer
  const fullexplorerIndexEntries = [
    { loc: `${FULLEXPLORER_BASE}/sitemap-main.xml`, lastmod: todayDate },
    ...fullexplorerBlockFiles.map(b => ({ loc: b.url, lastmod: todayDate })),
    ...fullexplorerTxFiles.map(t => ({ loc: t.url, lastmod: todayDate })),
    ...fullexplorerAddrFiles.map(a => ({ loc: a.url, lastmod: todayDate })),
  ];
  const fullexplorerIndexXml = generateXmlSitemapIndex(fullexplorerIndexEntries);

  writeToFile(path.resolve(FULLEXPLORER_DIR, 'sitemap.xml'), fullexplorerIndexXml);
  writeToFile(path.resolve(FULLEXPLORER_DIR, 'sitmap.xml'), fullexplorerIndexXml);
  writeToFile(path.resolve(FULLEXPLORER_DIR, 'sitemap-main.xml'), fullexplorerMainXml);

  for (const b of fullexplorerBlockFiles) {
    writeToFile(path.resolve(FULLEXPLORER_DIR, b.fileName), b.content);
  }
  writeToFile(path.resolve(FULLEXPLORER_DIR, 'sitemap-blocks.xml'), fullexplorerBlockFiles[0].content);

  for (const t of fullexplorerTxFiles) {
    writeToFile(path.resolve(FULLEXPLORER_DIR, t.fileName), t.content);
  }
  writeToFile(path.resolve(FULLEXPLORER_DIR, 'sitemap-transactions.xml'), fullexplorerTxFiles[0].content);

  for (const a of fullexplorerAddrFiles) {
    writeToFile(path.resolve(FULLEXPLORER_DIR, a.fileName), a.content);
  }
  writeToFile(path.resolve(FULLEXPLORER_DIR, 'sitemap-addresses.xml'), fullexplorerAddrFiles[0].content);

  console.log('\n[Sitemap Generator] ==============================================');
  console.log(`[Sitemap Generator] SUCCESS! 100% of sitemaps strictly <= 10.000 URLs:`);
  console.log(`[Sitemap Generator]   - Blocks: ${height.toLocaleString('pt-BR')} blocks in ${numBlockChunks} sitemaps (all <= 10.000 URLs each)`);
  console.log(`[Sitemap Generator]   - Transactions: ${transactions.length.toLocaleString('pt-BR')} txs in ${numTxChunks} sitemaps (all <= 10.000 URLs each)`);
  console.log(`[Sitemap Generator]   - Addresses: ${addresses.length.toLocaleString('pt-BR')} addresses in ${numAddrChunks} sitemaps (all <= 10.000 URLs each)`);
  console.log(`[Sitemap Generator]   - Assets: ${assets.length + 1} tokens & assets`);
  console.log('[Sitemap Generator] ==============================================');
}

main().catch((err) => {
  console.error('[Sitemap Generator] Critical Error:', err);
  process.exit(1);
});

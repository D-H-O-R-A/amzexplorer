const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist');
const FUNCTIONS_DIR = path.resolve(__dirname, '../functions');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('[Prerender] Error: dist/index.html does not exist. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

// Copy template to functions for SSR fallback
if (fs.existsSync(FUNCTIONS_DIR)) {
  fs.writeFileSync(path.join(FUNCTIONS_DIR, 'template.html'), baseHtml);
  console.log('[Prerender] Copied dist/index.html -> functions/template.html');
}

function generateHtml(options) {
  const { title, description, canonical, h1, subText, detailsHtml } = options;
  let html = baseHtml;

  // Replace <title>
  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);

  // Replace meta name="title"
  html = html.replace(
    /<meta\s+name=["']title["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="title" content="${title}" />`
  );

  // Replace meta name="description"
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="description" content="${description}" />`
  );

  // Replace canonical link
  html = html.replace(
    /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`
  );

  // Replace og:title
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`
  );

  // Replace og:description
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:description" content="${description}" />`
  );

  // Replace og:url
  html = html.replace(
    /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`
  );

  // Replace twitter:title
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="twitter:title" content="${title}" />`
  );

  // Replace twitter:description
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="twitter:description" content="${description}" />`
  );

  // Replace root div content
  const rootContent = `
    <div id="root">
      <div style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
        <h1>${h1}</h1>
        <p>${description}</p>
      </div>
    </div>
  `;

  html = html.replace(/<div\s+id=["']root["']>[\s\S]*?<\/div>/i, rootContent.trim());
  return html;
}

const staticRoutes = [
  {
    path: 'transactions',
    title: 'Blockchain Transactions | AMZ Explorer',
    description: 'Inspect all real-time transactions on the AMZ Blockchain. Track transfers, dApp invocations, and asset originations.',
    canonical: 'https://amzexplorer.com/transactions',
    h1: 'AMZ Blockchain Transactions',
    subText: 'Complete transaction stream and ledger state history.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>On-Chain Transactions:</strong> Continuous real-time monitoring</p>
        <p style="margin:0;color:#94a3b8;">Loading transactions feed...</p>
      </div>
    `
  },
  {
    path: 'blocks',
    title: 'Blockchain Blocks | AMZ Explorer',
    description: 'Query mined and validated blocks on the AMZ network. Heights, block proposers, rewards, and transaction volume.',
    canonical: 'https://amzexplorer.com/blocks',
    h1: 'AMZ Blockchain Blocks',
    subText: 'Proof of Stake blockchain blocks with fast finality.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Consensus:</strong> Fair PoS with distributed validator nodes</p>
        <p style="margin:0;color:#94a3b8;">Loading latest validated blocks...</p>
      </div>
    `
  },
  {
    path: 'nodes',
    title: 'Validator Nodes & Consensus | AMZ Explorer',
    description: 'Monitor AMZ network decentralization: active validator nodes, versions, peer topology, and consensus health.',
    canonical: 'https://amzexplorer.com/nodes',
    h1: 'Validator Nodes & Infrastructure',
    subText: 'Distributed node network securing the AMZ decentralized ledger.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Network Status:</strong> Operating with high availability</p>
        <p style="margin:0;color:#94a3b8;">Loading node telemetry...</p>
      </div>
    `
  },
  {
    path: 'contracts',
    title: 'Smart Contracts Ride & EVM | AMZ Explorer',
    description: 'Audit and interact with smart contracts on the AMZ network. Ride and EVM compatibility, verified scripts, and dApps.',
    canonical: 'https://amzexplorer.com/contracts',
    h1: 'Smart Contracts & dApps',
    subText: 'Deterministic decentralized logic running on-chain.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Execution Environment:</strong> Ride & EVM Compatibility</p>
        <p style="margin:0;color:#94a3b8;">Loading audited contracts...</p>
      </div>
    `
  },
  {
    path: 'ranking',
    title: 'Validators & Top Balances Ranking | AMZ Explorer',
    description: 'Leaderboard of validator nodes, top account balances, and active accounts on the AMZ blockchain.',
    canonical: 'https://amzexplorer.com/ranking',
    h1: 'Network Ranking & Leaderboard',
    subText: 'Staking metrics, block proposal distribution, and coin volume on AMZ.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0;color:#94a3b8;">Loading leaderboard...</p>
      </div>
    `
  }
];

// Write static routes
for (const route of staticRoutes) {
  const targetDir = path.join(DIST_DIR, route.path);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const content = generateHtml(route);
  fs.writeFileSync(path.join(targetDir, 'index.html'), content);
  console.log(`[Prerender] Generated static route: /${route.path}/index.html`);
}

// Pre-render known assets including amz1 and AUSDTW
const keyAssets = [
  '7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz',
  '7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU'
];

for (const assetId of keyAssets) {
  const targetDir = path.join(DIST_DIR, 'asset', assetId);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const canonical = `https://amzexplorer.com/asset/${assetId}`;
  const content = generateHtml({
    title: `Asset ${assetId} | AMZ Explorer`,
    description: `Token ${assetId} on the AMZ Blockchain. On-chain supply, transactions, and holder records.`,
    canonical: canonical,
    h1: `Asset ${assetId}`,
    subText: 'Asset issued and audited on the AMZ blockchain.',
    detailsHtml: `
      <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
        <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Asset Details</h2>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
          <dt style="color:#94a3b8;">ID:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${assetId}</code></dd>
          <dt style="color:#94a3b8;">Canonical:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
        </dl>
      </section>
    `
  });
  fs.writeFileSync(path.join(targetDir, 'index.html'), content);
  console.log(`[Prerender] Generated static asset: /asset/${assetId}/index.html`);
}

// Pre-render ALL transactions declared in sitemap
function prerenderAllSitemapTransactions() {
  const sitemapTxPath = path.join(DIST_DIR, 'sitemap-transactions-1.xml');
  if (!fs.existsSync(sitemapTxPath)) {
    console.warn('[Prerender] sitemap-transactions-1.xml not found');
    return;
  }
  const xml = fs.readFileSync(sitemapTxPath, 'utf-8');
  const regex = /<loc>https?:\/\/[^\/]+\/tx\/([a-zA-Z0-9]+)<\/loc>/g;
  let match;
  let count = 0;
  while ((match = regex.exec(xml)) !== null) {
    const txId = match[1];
    const targetDir = path.join(DIST_DIR, 'tx', txId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const canonical = `https://amzexplorer.com/tx/${txId}`;
    const content = generateHtml({
      title: `Transaction ${txId} | AMZ Explorer`,
      description: `Transaction ${txId} recorded on the AMZ Blockchain. Status, block, fees, and transfers.`,
      canonical: canonical,
      h1: `Transaction ${txId}`,
      subText: 'On-chain transaction audited on the AMZ network ledger.',
      detailsHtml: `
        <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
          <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Transaction Details</h2>
          <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
            <dt style="color:#94a3b8;">Hash / ID:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${txId}</code></dd>
            <dt style="color:#94a3b8;">Network:</dt><dd>AMZ L1 (Mainnet)</dd>
            <dt style="color:#94a3b8;">Status:</dt><dd><span style="color:#10b981;font-weight:600;">Confirmed in Block</span></dd>
            <dt style="color:#94a3b8;">Canonical:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
          </dl>
        </section>
      `
    });
    fs.writeFileSync(path.join(targetDir, 'index.html'), content);
    count++;
  }
  console.log(`[Prerender] Prerendered ${count} transactions from sitemap.`);
}

async function prerenderRecentBlocks() {
  try {
    const res = await fetch('https://nodes.amzexplorer.com/blocks/headers/last');
    if (res.ok) {
      const lastBlock = await res.json();
      const currentHeight = lastBlock.height;
      const startHeight = Math.max(1, currentHeight - 60);
      console.log(`[Prerender] Prerendering recent blocks from ${startHeight} to ${currentHeight}...`);
      for (let h = currentHeight; h >= startHeight; h--) {
        const targetDir = path.join(DIST_DIR, 'block', String(h));
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const canonical = `https://amzexplorer.com/block/${h}`;
        const content = generateHtml({
          title: `Block #${h} | AMZ Explorer`,
          description: `Block #${h} mined and validated on the AMZ Blockchain. Transactions, fees, and consensus.`,
          canonical: canonical,
          h1: `Block #${h}`,
          subText: 'Block validated by Proof of Stake consensus on the AMZ network.',
          detailsHtml: `
            <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
              <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Block Details</h2>
              <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
                <dt style="color:#94a3b8;">Height:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;color:#38bdf8;">#${h}</code></dd>
                <dt style="color:#94a3b8;">Network:</dt><dd>AMZ L1 (Mainnet)</dd>
                <dt style="color:#94a3b8;">Canonical:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
              </dl>
            </section>
          `
        });
        fs.writeFileSync(path.join(targetDir, 'index.html'), content);
      }
      console.log(`[Prerender] Prerendered ${currentHeight - startHeight + 1} recent blocks.`);
    }
  } catch (err) {
    console.warn('[Prerender] Could not fetch recent blocks:', err.message);
  }
}

async function run() {
  prerenderAllSitemapTransactions();
  await prerenderRecentBlocks();
  console.log('[Prerender] All static routes and transactions pre-rendered successfully!');
}

run();

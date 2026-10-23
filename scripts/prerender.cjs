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
    title: 'Transações da Blockchain | AMZX Explorer',
    description: 'Acompanhe todas as transações em tempo real na Blockchain AMZX. Rastreie transferências, invocação de dApps e emissão de ativos eRWA.',
    canonical: 'https://amzexplorer.com/transactions',
    h1: 'Transações da Blockchain AMZX',
    subText: 'Histórico completo de transações e movimentações no ledger ambiental eRWA.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Transações On-Chain:</strong> Monitoramento contínuo em tempo real</p>
        <p style="margin:0;color:#94a3b8;">Carregando feed de transações...</p>
      </div>
    `
  },
  {
    path: 'blocks',
    title: 'Blocos da Blockchain | AMZX Explorer',
    description: 'Consulte os blocos minerados e validados na rede AMZX. Altura, geradores de bloco, recompensas e volume transacionado.',
    canonical: 'https://amzexplorer.com/blocks',
    h1: 'Blocos da Blockchain AMZX',
    subText: 'Cadeia de blocos com consenso Proof of Stake e finalidade instantânea.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Consenso:</strong> Fair PoS com nós validadores distribuídos</p>
        <p style="margin:0;color:#94a3b8;">Carregando últimos blocos validados...</p>
      </div>
    `
  },
  {
    path: 'nodes',
    title: 'Nós Validadores e Consenso | AMZX Explorer',
    description: 'Monitore a descentralização da rede AMZX: nós validadores ativos, versões, localizações geográficas e saúde do consenso.',
    canonical: 'https://amzexplorer.com/nodes',
    h1: 'Nós Validadores e Infraestrutura',
    subText: 'Rede distribuída de nós mantendo a segurança do ledger ecológico AMZX.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Status da Rede:</strong> Operando em alta disponibilidade</p>
        <p style="margin:0;color:#94a3b8;">Carregando telemetria dos nós...</p>
      </div>
    `
  },
  {
    path: 'contracts',
    title: 'Contratos Inteligentes Ride & EVM | AMZX Explorer',
    description: 'Audite e interaja com Smart Contracts na rede AMZX. Compatibilidade com Ride e EVM, contratos verificados e ativos eRWA.',
    canonical: 'https://amzexplorer.com/contracts',
    h1: 'Contratos Inteligentes',
    subText: 'Lógica descentralizada executada deterministicamente na blockchain.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Ambiente de Execução:</strong> Ride & EVM Compatibility</p>
        <p style="margin:0;color:#94a3b8;">Carregando contratos auditados...</p>
      </div>
    `
  },
  {
    path: 'ranking',
    title: 'Ranking de Validadores e Contas | AMZX Explorer',
    description: 'Classificação de nós validadores, maiores detentores e contas mais ativas da blockchain AMZX.',
    canonical: 'https://amzexplorer.com/ranking',
    h1: 'Ranking e Estatísticas da Rede',
    subText: 'Métricas de participação, geração de blocos e volume financeiro na AMZX.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0;color:#94a3b8;">Carregando tabela de classificação...</p>
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
    title: `Ativo ${assetId} | AMZX Explorer`,
    description: `Token ${assetId} na Blockchain AMZX. Transações, detentores e suprimento on-chain.`,
    canonical: canonical,
    h1: `Ativo ${assetId}`,
    subText: 'Ativo emitido e auditado na blockchain AMZX.',
    detailsHtml: `
      <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
        <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados do Ativo</h2>
        <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
          <dt style="color:#94a3b8;">ID:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${assetId}</code></dd>
          <dt style="color:#94a3b8;">Canônico:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
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
      title: `Transação ${txId} | AMZX Explorer`,
      description: `Transação ${txId} registrada na Blockchain AMZX. Ledger ambiental eRWA, status, bloco, taxas e transferências.`,
      canonical: canonical,
      h1: `Transação ${txId}`,
      subText: 'Transação on-chain auditada no ledger ambiental eRWA da rede AMZX.',
      detailsHtml: `
        <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
          <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados da Transação</h2>
          <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
            <dt style="color:#94a3b8;">Hash / ID:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${txId}</code></dd>
            <dt style="color:#94a3b8;">Rede:</dt><dd>AMZX L1 (Mainnet)</dd>
            <dt style="color:#94a3b8;">Status:</dt><dd><span style="color:#10b981;font-weight:600;">Confirmado em Bloco</span></dd>
            <dt style="color:#94a3b8;">Canônico:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
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
          title: `Bloco #${h} | AMZX Explorer`,
          description: `Bloco #${h} minerado e validado na Blockchain AMZX. Consulte transações contidas, taxas e consenso de nós.`,
          canonical: canonical,
          h1: `Bloco #${h}`,
          subText: 'Bloco validado pelo consenso Proof of Stake da rede AMZX.',
          detailsHtml: `
            <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
              <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados do Bloco</h2>
              <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
                <dt style="color:#94a3b8;">Altura:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;color:#38bdf8;">#${h}</code></dd>
                <dt style="color:#94a3b8;">Rede:</dt><dd>AMZX L1 (Mainnet)</dd>
                <dt style="color:#94a3b8;">Canônico:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
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

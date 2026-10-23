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
    title: 'Transações da Blockchain | Planet One Explorer',
    description: 'Acompanhe todas as transações em tempo real na Blockchain Planet One. Rastreie transferências, invocação de dApps e emissão de ativos eRWA.',
    canonical: 'https://explorer.planetone.io/transactions',
    h1: 'Transações da Blockchain Planet One',
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
    title: 'Blocos da Blockchain | Planet One Explorer',
    description: 'Consulte os blocos minerados e validados na rede Planet One. Altura, geradores de bloco, recompensas e volume transacionado.',
    canonical: 'https://explorer.planetone.io/blocks',
    h1: 'Blocos da Blockchain Planet One',
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
    title: 'Nós Validadores e Consenso | Planet One Explorer',
    description: 'Monitore a descentralização da rede Planet One: nós validadores ativos, versões, localizações geográficas e saúde do consenso.',
    canonical: 'https://explorer.planetone.io/nodes',
    h1: 'Nós Validadores e Infraestrutura',
    subText: 'Rede distribuída de nós mantendo a segurança do ledger ecológico Planet One.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Status da Rede:</strong> Operando em alta disponibilidade</p>
        <p style="margin:0;color:#94a3b8;">Carregando telemetria dos nós...</p>
      </div>
    `
  },
  {
    path: 'contracts',
    title: 'Contratos Inteligentes Ride & EVM | Planet One Explorer',
    description: 'Audite e interaja com Smart Contracts na rede Planet One. Compatibilidade com Ride e EVM, contratos verificados e ativos eRWA.',
    canonical: 'https://explorer.planetone.io/contracts',
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
    path: 'faucet',
    title: 'Faucet Oficial Testnet | Planet One Explorer',
    description: 'Solicite tokens PLO Testnet gratuitamente para desenvolvedores testarem contratos inteligentes e dApps na Planet One.',
    canonical: 'https://explorer.planetone.io/faucet',
    h1: 'Faucet Oficial Planet One Testnet',
    subText: 'Distribuição automática de tokens PLO de teste para a comunidade Web3.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Limite:</strong> 1 solicitação a cada 24 horas por carteira/IP</p>
        <p style="margin:0;color:#94a3b8;">Insira seu endereço PLO para receber fundos de teste.</p>
      </div>
    `
  },
  {
    path: 'address-converter',
    title: 'Conversor de Endereços Ride & EVM | Planet One Explorer',
    description: 'Converta endereços entre o formato nativo Ride (3P...) e o formato EVM compatível (0x...) na Planet One Blockchain.',
    canonical: 'https://explorer.planetone.io/address-converter',
    h1: 'Conversor de Endereços Ride & EVM',
    subText: 'Interoperabilidade entre formatos de endereço nativos e Ethereum na rede Planet One.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0 0 0.5rem 0;color:#e2e8f0;"><strong>Padrão:</strong> Algoritmo de mapeamento determinístico de chave pública</p>
        <p style="margin:0;color:#94a3b8;">Carregando conversor interativo...</p>
      </div>
    `
  },
  {
    path: 'ranking',
    title: 'Ranking de Validadores e Contas | Planet One Explorer',
    description: 'Classificação de nós validadores, maiores detentores e contas mais ativas da blockchain Planet One.',
    canonical: 'https://explorer.planetone.io/ranking',
    h1: 'Ranking e Estatísticas da Rede',
    subText: 'Métricas de participação, geração de blocos e volume financeiro ecológico.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0;color:#94a3b8;">Carregando tabela de classificação...</p>
      </div>
    `
  },
  {
    path: 'carbon-map',
    title: 'Mapa de Carbono e Ativos Ambientais (eRWA) | Planet One Explorer',
    description: 'Visualização geoespacial de projetos de crédito de carbono, preservação florestal e biodiversidade registrados na Planet One.',
    canonical: 'https://explorer.planetone.io/carbon-map',
    h1: 'Mapa de Ativos Ambientais (eRWA)',
    subText: 'Geolocalização e transparência on-chain de reservas ambientais e projetos tokenizados.',
    detailsHtml: `
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.25rem;">
        <p style="margin:0;color:#94a3b8;">Carregando mapa geoespacial interativo...</p>
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

// Pre-render known assets and tokenplanet/VERDE
const keyAssets = [
  'AAyf6hiqW17aivtcdY34eFx2GobqnkdSx4Pj5U8S5nfk',
  'BXwyK6pvWnJUmTzQznGU6C5tK1og2vmUjSnW4FbYNMZD',
  'BBFzqFCYd6ouAXWqBCLsMVC2ErgmyfPjBzLdnRByMR83',
  '9vn6nbkRecBTNiCFpwvv9aFz5G8mPr1rgbQ48YLbzeF',
  '2u2uTcgNmETDHnbAouV65KM5Qa46QH3JXi39Nsh9JFgE',
  '5HkAvQoZHnB66TBiPwwYY6Xix4KP6LiY9z9J7uaRaHyK'
];

for (const assetId of keyAssets) {
  const targetDir = path.join(DIST_DIR, 'asset', assetId);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const canonical = `https://explorer.planetone.io/asset/${assetId}`;
  const content = generateHtml({
    title: `Ativo Ambiental ${assetId} | Planet One Explorer`,
    description: `Ativo tokenizado eRWA ${assetId} na Blockchain Planet One. Créditos ambientais, auditoria e suprimento on-chain.`,
    canonical: canonical,
    h1: `Ativo ${assetId}`,
    subText: 'Ativo ambiental eRWA emitido e auditado na blockchain Planet One.',
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

// Token VERDE
const verdeDir = path.join(DIST_DIR, 'tokenplanet', 'VERDE');
if (!fs.existsSync(verdeDir)) {
  fs.mkdirSync(verdeDir, { recursive: true });
}
const verdeCanonical = 'https://explorer.planetone.io/tokenplanet/VERDE';
const verdeContent = generateHtml({
  title: 'Token VERDE - Token Nativo de Sustentabilidade | Planet One Explorer',
  description: 'Métricas, emissão, queima e circulação do Token VERDE na Blockchain Planet One.',
  canonical: verdeCanonical,
  h1: 'Token VERDE (eRWA Ecosystem)',
  subText: 'Ativo ecológico governado por contratos inteligentes e lastreado em preservação ambiental.',
  detailsHtml: `
    <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
      <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Token VERDE</h2>
      <p style="margin:0;color:#94a3b8;">Ativo nativo do ecossistema eRWA Planet One.</p>
    </section>
  `
});
fs.writeFileSync(path.join(verdeDir, 'index.html'), verdeContent);
console.log('[Prerender] Generated static token: /tokenplanet/VERDE/index.html');

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
    const canonical = `https://explorer.planetone.io/tx/${txId}`;
    const content = generateHtml({
      title: `Transação ${txId} | Planet One Explorer`,
      description: `Transação ${txId} registrada na Blockchain Planet One. Ledger ambiental eRWA, status, bloco, taxas e transferências.`,
      canonical: canonical,
      h1: `Transação ${txId}`,
      subText: 'Transação on-chain auditada no ledger ambiental eRWA da rede Planet One.',
      detailsHtml: `
        <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
          <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados da Transação</h2>
          <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
            <dt style="color:#94a3b8;">Hash / ID:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${txId}</code></dd>
            <dt style="color:#94a3b8;">Rede:</dt><dd>Planet One L1 (Mainnet)</dd>
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
    const res = await fetch('https://nodes.planetone.io/blocks/headers/last');
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
        const canonical = `https://explorer.planetone.io/block/${h}`;
        const content = generateHtml({
          title: `Bloco #${h} | Planet One Explorer`,
          description: `Bloco #${h} minerado e validado na Blockchain Planet One. Consulte transações contidas, taxas e consenso de nós.`,
          canonical: canonical,
          h1: `Bloco #${h}`,
          subText: 'Bloco validado pelo consenso Proof of Stake da rede Planet One.',
          detailsHtml: `
            <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
              <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados do Bloco</h2>
              <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
                <dt style="color:#94a3b8;">Altura:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;color:#38bdf8;">#${h}</code></dd>
                <dt style="color:#94a3b8;">Rede:</dt><dd>Planet One L1 (Mainnet)</dd>
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

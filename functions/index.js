const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

const { transfer, broadcast } = require("@waves/waves-transactions");
const { ethAddress2waves, wavesAddress2eth } = require("@waves/node-api-js");

if (!admin.apps.length) {
  admin.initializeApp();
}

function getRtdb() {
  try {
    return admin.database();
  } catch (_) {
    return null;
  }
}

// Define Secrets using Google Cloud Secret Manager via Firebase params
const faucetPrivateKey = defineSecret("AMZX_PRIVATE_KEY");
const faucetNodeUrl = defineSecret("AMZX_NODE_URL");
const faucetChainId = defineSecret("AMZX_CHAIN_ID");

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const AMOUNT = 10 * 1e8; // 10 AMZ in atomic units
const FEE = 1_000_000;

// Utility to get real client IP
function getClientIp(req) {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    "";

  ip = ip.trim();

  // Localhost IPv6 ::1 handling
  if (ip === "::1") ip = "127.0.0.1";

  // Keep numbers and periods only (IPv4) for RTDB keys
  ip = ip.replace(/[^0-9.]/g, "_");

  return ip;
}

exports.faucet = onRequest(
  { 
    cors: true,
    secrets: [faucetPrivateKey, faucetNodeUrl, faucetChainId]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST method" });
      }

      const { address } = req.body || {};
      if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "Parameter 'address' is required" });
      }

      const ip = getClientIp(req);
      const now = Date.now();

      // Retrieve values from Google Cloud Secret Manager
      const privateKey = faucetPrivateKey.value();
      const nodeUrl = faucetNodeUrl.value() || "https://nodes.amzexplorer.com/";
      const chainId = faucetChainId.value() || "A";

      if (!privateKey) {
        return res.status(500).json({ error: "Faucet service is misconfigured: private key is missing." });
      }

      const gicAddress = address.startsWith("0x")
        ? ethAddress2waves(address, chainId)
        : address;

      if (!/^([3DSTWYL][a-zA-Z0-9]{34,35})$/.test(gicAddress)) {
        return res.status(400).json({ error: "Invalid AMZ address" });
      }

      const rtdb = getRtdb();
      if (!rtdb) {
        return res.status(500).json({ error: "Database not configured" });
      }

      const addrSnap = await rtdb.ref(`faucet_addresses/${gicAddress}`).get();
      const ipSnap = await rtdb.ref(`faucet_ips/${ip || "unknown"}`).get();

      function isOnCooldown(snap) {
        if (!snap.exists()) return false;
        const last = snap.val().timestamp || 0;
        return now - last < COOLDOWN_MS;
      }

      if (isOnCooldown(addrSnap)) {
        const wait = Math.ceil((COOLDOWN_MS - (now - addrSnap.val().timestamp)) / 3.6e6);
        return res.status(429).json({ error: `Address must wait ${wait}h before requesting again` });
      }

      if (isOnCooldown(ipSnap)) {
        const wait = Math.ceil((COOLDOWN_MS - (now - ipSnap.val().timestamp)) / 3.6e6);
        return res.status(429).json({ error: `IP must wait ${wait}h before requesting again` });
      }

      const tx = transfer(
        {
          recipient: gicAddress,
          amount: AMOUNT,
          attachment: "",
          fee: FEE,
          chainId: chainId,
        },
        privateKey
      );

      const result = await broadcast(tx, nodeUrl);
      logger.info(`Transaction sent: ${result.id} to ${gicAddress} (IP: ${ip})`);

      await Promise.all([
        rtdb.ref(`faucet_addresses/${gicAddress}`).set({ timestamp: now, txId: result.id, ip }),
        rtdb.ref(`faucet_ips/${ip}`).set({ timestamp: now, txId: result.id, address: gicAddress }),
      ]);

      return res.json({
        success: true,
        txId: result.id,
        amount: "10 AMZ",
        to: gicAddress,
        ethAlias: wavesAddress2eth(gicAddress),
      });
    } catch (err) {
      logger.error("Faucet error:", JSON.stringify(err) ?? err ?? "Unknown error");
      return res.status(500).json({ error: "Internal faucet error", details: err.message });
    }
  }
);

const fs = require("fs");
const path = require("path");

exports.ssr = onRequest(
  {
    cors: true,
    region: "us-central1",
    timeoutSeconds: 15,
    memory: "256MiB",
  },
  async (req, res) => {
    try {
      const urlPath = req.path || "/";
      let template = "";
      const templatePath = path.join(__dirname, "template.html");
      if (fs.existsSync(templatePath)) {
        template = fs.readFileSync(templatePath, "utf-8");
      } else {
        template = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>AMZ Explorer</title><link rel="canonical" href="https://amzexplorer.com/" /></head><body><div id="root"></div></body></html>`;
      }

      let title = "AMZ Explorer - Blockchain Explorer & Ledger (Amazonic One)";
      let description = "Explorer oficial da Blockchain AMZX (Amazonic One). Monitore blocos, rastreie transações e acompanhe créditos de carbono REDD+ e tokens.";
      let canonical = `https://amzexplorer.com${urlPath}`;
      let h1Text = "AMZ Explorer";
      let subText = "Blockchain Explorer & Ledger (Amazonic One)";
      let detailsHtml = "";

      const txMatch = urlPath.match(/^\/(?:tx|transaction)\/([a-zA-Z0-9]+)/i);
      const blockMatch = urlPath.match(/^\/block\/([a-zA-Z0-9]+)/i);
      const addressMatch = urlPath.match(/^\/address\/([a-zA-Z0-9]+)/i);
      const assetMatch = urlPath.match(/^\/(?:asset|assets)\/([a-zA-Z0-9]+)/i);

      if (txMatch) {
        const txId = txMatch[1];
        canonical = `https://amzexplorer.com/tx/${txId}`;
        title = `Transação ${txId} | AMZ Explorer`;
        description = `Transação ${txId} registrada na Blockchain AMZX. Consulte dados no ledger, nós validadores, taxas e histórico.`;
        h1Text = `Transação ${txId}`;
        subText = "Transação on-chain auditada no ledger da rede AMZX (Amazonic One).";

        let extraDetails = "";
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1200);
          const resp = await fetch(`https://nodes.amzexplorer.com/transactions/info/${txId}`, { signal: controller.signal });
          clearTimeout(timeout);
          if (resp.ok) {
            const data = await resp.json();
            const blockLink = data.height ? `<a href="/block/${data.height}" style="color:#10b981;">#${data.height}</a>` : "N/A";
            const recipientLink = data.recipient ? `<a href="/address/${data.recipient}" style="color:#38bdf8;">${data.recipient}</a>` : "N/A";
            const senderLink = data.sender ? `<a href="/address/${data.sender}" style="color:#38bdf8;">${data.sender}</a>` : (data.generator ? `<a href="/address/${data.generator}" style="color:#38bdf8;">${data.generator}</a>` : "N/A");
            const dateStr = data.timestamp ? new Date(data.timestamp).toUTCString() : "Confirmado";
            const amountStr = typeof data.amount === "number" ? `${(data.amount / 1e8).toLocaleString("pt-BR")} AMZ` : "N/A";

            extraDetails = `
              <dt style="color:#94a3b8;">Bloco:</dt><dd>${blockLink}</dd>
              <dt style="color:#94a3b8;">Remetente:</dt><dd>${senderLink}</dd>
              <dt style="color:#94a3b8;">Destinatário:</dt><dd>${recipientLink}</dd>
              <dt style="color:#94a3b8;">Valor:</dt><dd><strong style="color:#10b981;">${amountStr}</strong></dd>
              <dt style="color:#94a3b8;">Timestamp (UTC):</dt><dd>${dateStr}</dd>
            `;
          }
        } catch (_) {}

        detailsHtml = `
          <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
            <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados da Transação</h2>
            <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
              <dt style="color:#94a3b8;">Hash / ID:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${txId}</code></dd>
              <dt style="color:#94a3b8;">Rede:</dt><dd>AMZX L1 (Mainnet)</dd>
              <dt style="color:#94a3b8;">Status:</dt><dd><span style="color:#10b981;font-weight:600;">Confirmado em Bloco</span></dd>
              <dt style="color:#94a3b8;">Canônico:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
              ${extraDetails}
            </dl>
          </section>
        `;
      } else if (blockMatch) {
        const height = blockMatch[1];
        canonical = `https://amzexplorer.com/block/${height}`;
        title = `Bloco #${height} | AMZ Explorer`;
        description = `Bloco #${height} minerado e validado na Blockchain AMZX. Consulte transações contidas e consenso de nós.`;
        h1Text = `Bloco #${height}`;
        subText = "Bloco validado pelo consenso Proof of Stake da rede AMZX.";

        let extraDetails = "";
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1200);
          const resp = await fetch(`https://nodes.amzexplorer.com/blocks/headers/at/${height}`, { signal: controller.signal });
          clearTimeout(timeout);
          if (resp.ok) {
            const data = await resp.json();
            const genLink = data.generator ? `<a href="/address/${data.generator}" style="color:#38bdf8;">${data.generator}</a>` : "N/A";
            const dateStr = data.timestamp ? new Date(data.timestamp).toUTCString() : "Confirmado";
            const txCount = typeof data.transactionCount === "number" ? data.transactionCount : 0;
            extraDetails = `
              <dt style="color:#94a3b8;">Gerador:</dt><dd>${genLink}</dd>
              <dt style="color:#94a3b8;">Transações:</dt><dd>${txCount}</dd>
              <dt style="color:#94a3b8;">Timestamp (UTC):</dt><dd>${dateStr}</dd>
            `;
          }
        } catch (_) {}

        detailsHtml = `
          <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
            <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados do Bloco</h2>
            <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
              <dt style="color:#94a3b8;">Altura:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;color:#38bdf8;">#${height}</code></dd>
              <dt style="color:#94a3b8;">Rede:</dt><dd>AMZX L1 (Mainnet)</dd>
              <dt style="color:#94a3b8;">Canônico:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
              ${extraDetails}
            </dl>
          </section>
        `;
      } else if (addressMatch) {
        const addr = addressMatch[1];
        canonical = `https://amzexplorer.com/address/${addr}`;
        title = `Endereço ${addr} | AMZ Explorer`;
        description = `Conta e carteira ${addr} na Blockchain AMZX. Consulte saldo AMZ, histórico e tokens REDD+.`;
        h1Text = `Endereço ${addr}`;
        subText = "Conta de usuário ou contrato na rede AMZX (Amazonic One).";

        let extraDetails = "";
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1200);
          const resp = await fetch(`https://nodes.amzexplorer.com/addresses/balance/${addr}`, { signal: controller.signal });
          clearTimeout(timeout);
          if (resp.ok) {
            const data = await resp.json();
            const balStr = typeof data.balance === "number" ? `${(data.balance / 1e8).toLocaleString("pt-BR")} AMZ` : "0 AMZ";
            extraDetails = `
              <dt style="color:#94a3b8;">Saldo AMZ:</dt><dd><strong style="color:#10b981;">${balStr}</strong></dd>
            `;
          }
        } catch (_) {}

        detailsHtml = `
          <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
            <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados da Conta</h2>
            <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
              <dt style="color:#94a3b8;">Endereço:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${addr}</code></dd>
              <dt style="color:#94a3b8;">Rede:</dt><dd>AMZX Blockchain</dd>
              <dt style="color:#94a3b8;">Canônico:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
              ${extraDetails}
            </dl>
          </section>
        `;
      } else if (assetMatch) {
        const assetId = assetMatch[1];
        canonical = `https://amzexplorer.com/asset/${assetId}`;
        title = `Ativo / Token ${assetId} | AMZ Explorer`;
        description = `Detalhes do token/ativo ${assetId} na Blockchain AMZX (Amazonic One).`;
        h1Text = `Ativo ${assetId}`;
        subText = "Token ou Ativo registrado na AMZX Blockchain.";
        detailsHtml = `
          <section style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:1.5rem;margin-top:1.5rem;">
            <h2 style="font-size:1.125rem;font-weight:600;margin:0 0 1rem 0;color:#e2e8f0;">Dados do Ativo</h2>
            <dl style="display:grid;grid-template-columns:auto 1fr;gap:0.75rem 1.5rem;font-size:0.95rem;margin:0;">
              <dt style="color:#94a3b8;">ID do Ativo:</dt><dd><code style="background:#1e293b;padding:0.2rem 0.4rem;border-radius:4px;word-break:break-all;color:#38bdf8;">${assetId}</code></dd>
              <dt style="color:#94a3b8;">Canônico:</dt><dd><a href="${canonical}" style="color:#10b981;">${canonical}</a></dd>
            </dl>
          </section>
        `;
      }

      let html = template;
      html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
      html = html.replace(/<meta\s+name=["']title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="title" content="${title}" />`);
      html = html.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="description" content="${description}" />`);
      html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`);
      html = html.replace(/<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:title" content="${title}" />`);
      html = html.replace(/<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:description" content="${description}" />`);
      html = html.replace(/<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i, `<meta property="og:url" content="${canonical}" />`);
      html = html.replace(/<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:title" content="${title}" />`);
      html = html.replace(/<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i, `<meta name="twitter:description" content="${description}" />`);

      const rootContent = `
        <div id="root">
          <main style="max-width:1200px;margin:2rem auto;padding:1.5rem;font-family:system-ui,-apple-system,sans-serif;color:#f8fafc;">
            <nav style="margin-bottom:1.5rem;"><a href="/" style="color:#10b981;text-decoration:none;font-weight:500;">← AMZ Explorer</a></nav>
            <h1 style="font-size:1.75rem;font-weight:700;margin:0 0 0.5rem 0;word-break:break-all;">${h1Text}</h1>
            <p style="color:#94a3b8;margin:0 0 1.5rem 0;font-size:1rem;">${subText}</p>
            ${detailsHtml}
          </main>
        </div>
      `;
      html = html.replace(/<div\s+id=["']root["']>[\s\S]*?<\/div>/i, rootContent.trim());

      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    } catch (err) {
      return res.status(500).send("Error rendering page: " + err.message);
    }
  }
);

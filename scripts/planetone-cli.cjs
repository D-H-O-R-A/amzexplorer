#!/usr/bin/env node

/**
 * ============================================================================
 * PLANET ONE BLOCKCHAIN INTERACTION CLI
 * Ferramenta Oficial de Interação, Gestão de Contas e Execução de Transações
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const http = require('http');
const https = require('https');
const nodeCrypto = require('crypto');
const crypto = require('@waves/ts-lib-crypto');
const ride = require('@waves/ride-js');
const wt = require('@waves/waves-transactions');

// ANSI Color Codes for Terminal Styling
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  yellow: '\x1b[33m',
  brightYellow: '\x1b[93m',
  red: '\x1b[31m',
  brightRed: '\x1b[91m',
  magenta: '\x1b[35m',
  brightMagenta: '\x1b[95m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgCyan: '\x1b[46m',
};

// Configuration file path
const CONFIG_FILE = path.join(__dirname, '.planetone-config.json');
let savedEncryptedSeed = null;

// AES-256-GCM Encryption with PBKDF2 Key Derivation
function encryptSeed(seedText, password) {
  const salt = nodeCrypto.randomBytes(16);
  const key = nodeCrypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const iv = nodeCrypto.randomBytes(12);
  const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(seedText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    version: 'aes-256-gcm',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag,
    encryptedData: encrypted
  };
}

function decryptSeed(encryptedObj, password) {
  try {
    if (!encryptedObj || !encryptedObj.salt || !encryptedObj.iv || !encryptedObj.tag || !encryptedObj.encryptedData) {
      return null;
    }
    const salt = Buffer.from(encryptedObj.salt, 'hex');
    const iv = Buffer.from(encryptedObj.iv, 'hex');
    const tag = Buffer.from(encryptedObj.tag, 'hex');
    const key = nodeCrypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return null;
  }
}

// Helper to resolve and normalize file paths (handles quotes, ~, relative paths, missing .ride extension)
function resolveFilePath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') return null;

  // 1. Remove wrapping quotes (single or double) and extra spaces
  let clean = inputPath.trim().replace(/^['"]+|['"]+$/g, '').trim();
  if (!clean) return null;

  // 2. Expand home directory (~)
  if (clean.startsWith('~')) {
    clean = path.join(os.homedir(), clean.slice(1));
  }

  // 3. Build candidate path list
  const candidates = [
    clean,
    path.resolve(clean),
    path.resolve(process.cwd(), clean),
    path.resolve(process.cwd(), 'scripts', clean),
    path.resolve(__dirname, clean),
    path.resolve(__dirname, 'scripts', clean),
    path.resolve(__dirname, '..', clean),
    path.resolve(__dirname, '..', 'scripts', clean)
  ];

  // If path starts with 'scripts/' and cwd is already inside scripts or root
  if (clean.startsWith('scripts/')) {
    const withoutScripts = clean.replace(/^scripts\//, '');
    candidates.push(path.resolve(__dirname, withoutScripts));
  }

  // 4. If no .ride extension, also test adding .ride to all candidates
  if (!clean.toLowerCase().endsWith('.ride')) {
    const rideClean = `${clean}.ride`;
    candidates.push(
      rideClean,
      path.resolve(rideClean),
      path.resolve(process.cwd(), rideClean),
      path.resolve(process.cwd(), 'scripts', rideClean),
      path.resolve(__dirname, rideClean),
      path.resolve(__dirname, 'scripts', rideClean),
      path.resolve(__dirname, '..', rideClean),
      path.resolve(__dirname, '..', 'scripts', rideClean)
    );
    if (clean.startsWith('scripts/')) {
      const withoutScripts = clean.replace(/^scripts\//, '');
      candidates.push(path.resolve(__dirname, `${withoutScripts}.ride`));
    }
  }

  // 5. Return the first candidate that exists as a file
  for (const cand of candidates) {
    try {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        return cand;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

// Helper to normalize Chain ID (supports 'P', 80, '80', 'S', 83, 'T', 84)
function normalizeChainId(input) {
  if (!input) return 'P';
  const str = String(input).trim();
  if (!isNaN(Number(str)) && str.length > 1) {
    return String.fromCharCode(Number(str));
  }
  return str.charAt(0);
}

// Helper to encode attachment message as Base58 (required by waves-transactions and Planet One node)
function formatAttachment(attachment) {
  if (!attachment || typeof attachment !== 'string' || attachment.trim() === '') {
    return undefined;
  }
  const clean = attachment.trim();
  try {
    return wt.libs.crypto.base58Encode(wt.libs.crypto.stringToBytes(clean));
  } catch (e) {
    return undefined;
  }
}

// Helper to calculate dynamic minimal fee using Planet One node
async function fetchCalculateFee(txObject, fallbackFee = 100000) {
  try {
    const res = await fetch(`${session.nodeUrl}/transactions/calculateFee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txObject)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.feeAmount === 'number') {
        return data.feeAmount;
      }
    }
  } catch (e) {
    // fallback
  }
  return fallbackFee;
}

// Global Session State
let session = {
  seed: '',
  nodeUrl: 'https://testnet.planetone.io',
  chainId: 'P',
  explorerUrl: 'https://explorer.planetone.io',
  address: '',
  publicKey: ''
};

// Helper function to create readline interface
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Prompt promise helper
function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    const rl = createRL();
    const promptText = defaultValue ? `${question} [${colors.gray}${defaultValue}${colors.reset}]: ` : `${question}: `;
    rl.question(promptText, (answer) => {
      rl.close();
      const val = answer.trim();
      resolve(val === '' ? defaultValue : val);
    });
  });
}

// Prompt with hidden input (for seed)
function askSecret(question) {
  return new Promise((resolve) => {
    const rl = createRL();
    process.stdout.write(`${question}: `);
    let buffer = '';

    // Handle keypress directly
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(buffer.trim());
      } else if (char === '\u0003') { // Ctrl+C
        process.exit(0);
      } else if (char === '\u007F' || char === '\b') { // Backspace
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        buffer += char;
        process.stdout.write('*');
      }
    };

    process.stdin.on('data', onData);
  });
}

// Network Request Helper (Node.js native http/https)
function makeRequest(urlStr, options = {}, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;

    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = client.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject({ status: res.statusCode, error: json.message || json.error || data });
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject({ status: res.statusCode, error: data });
          }
        }
      });
    });

    req.on('error', (err) => {
      reject({ status: 0, error: err.message });
    });

    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

// Save & Load Config
function loadSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(content);
      session.nodeUrl = parsed.nodeUrl || session.nodeUrl;
      session.chainId = normalizeChainId(parsed.chainId || session.chainId);
      session.explorerUrl = parsed.explorerUrl || session.explorerUrl;
      if (parsed.encryptedSeed) {
        savedEncryptedSeed = parsed.encryptedSeed;
      } else if (parsed.seed) {
        // Legacy plaintext seed detected
        session.seed = parsed.seed;
      }
    }
  } catch (e) {
    // Ignore config load error
  }
}

function saveConfig(password) {
  try {
    let encryptedPayload = savedEncryptedSeed;
    if (session.seed && password) {
      encryptedPayload = encryptSeed(session.seed, password);
      savedEncryptedSeed = encryptedPayload;
    }
    const configToSave = {
      nodeUrl: session.nodeUrl,
      chainId: session.chainId,
      explorerUrl: session.explorerUrl,
      encryptedSeed: encryptedPayload
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar arquivo de configuração local:', e.message);
  }
}

// Update keys and address based on seed & chainId
function updateKeys() {
  if (!session.seed) return;
  const keyPair = crypto.keyPair(session.seed);
  session.publicKey = keyPair.publicKey;
  session.chainId = normalizeChainId(session.chainId);
  session.address = crypto.address(session.seed, session.chainId);
}

// Blockchain Query Functions
async function getAccountBalanceDetails(addr) {
  const target = addr || session.address;
  const url = `${session.nodeUrl.replace(/\/+$/, '')}/addresses/balance/details/${target}`;
  return await makeRequest(url);
}

async function getAccountAssets(addr) {
  const target = addr || session.address;
  const url = `${session.nodeUrl.replace(/\/+$/, '')}/assets/balance/${target}`;
  return await makeRequest(url);
}

async function getAssetDetails(assetId) {
  if (!assetId || assetId === 'PLO' || assetId === 'null') {
    return {
      assetId: null,
      name: 'PLO',
      decimals: 8,
      description: 'Moeda Nativa da Rede Planet One',
      quantity: 115368878600000000,
      reissuable: false
    };
  }
  const url = `${session.nodeUrl.replace(/\/+$/, '')}/assets/details/${assetId}`;
  return await makeRequest(url);
}

async function getAccountScript(addr) {
  const target = addr || session.address;
  const url = `${session.nodeUrl.replace(/\/+$/, '')}/addresses/scriptInfo/${target}`;
  return await makeRequest(url);
}

async function getAccountData(addr) {
  const target = addr || session.address;
  const url = `${session.nodeUrl.replace(/\/+$/, '')}/addresses/data/${target}`;
  return await makeRequest(url);
}

// Broadcast signed transaction
async function broadcastTx(signedTx) {
  const url = `${session.nodeUrl.replace(/\/+$/, '')}/transactions/broadcast`;
  return await makeRequest(url, { method: 'POST' }, signedTx);
}

// Compile Ride Script
async function compileRideScript(scriptSource) {
  // Try local compiler first
  try {
    const res = ride.compile(scriptSource);
    if (res.result && res.result.base64) {
      return res.result.base64;
    }
    if (res.error) {
      throw new Error(res.error);
    }
  } catch (localErr) {
    console.log(`${colors.yellow}Compilador local falhou: ${localErr.message}. Tentando nó Planet One...${colors.reset}`);
  }

  // Fallback to Planet One Node compilation endpoint
  const url = `${session.nodeUrl.replace(/\/+$/, '')}/utils/script/compileCode`;
  const nodeRes = await makeRequest(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' } }, scriptSource);
  if (nodeRes && nodeRes.script) {
    return nodeRes.script;
  }
  throw new Error('Falha ao compilar contrato Ride.');
}

// Format numbers
function formatAmount(amountInt, decimals = 8) {
  return (Number(amountInt) / Math.pow(10, decimals)).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

function parseAmount(amountStr, decimals = 8) {
  const clean = String(amountStr).replace(',', '.');
  const num = parseFloat(clean);
  if (isNaN(num) || num < 0) throw new Error(`Valor inválido: ${amountStr}`);
  return Math.round(num * Math.pow(10, decimals));
}

// Banner display
function printBanner() {
  console.clear();
  console.log(`${colors.brightCyan}${colors.bold}`);
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                       ║');
  console.log('║             🪐  PLANET ONE BLOCKCHAIN INTERACTION CLI  🪐             ║');
  console.log('║           Painel de Operações, Emissão de Tokens e Contratos          ║');
  console.log('║                                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
}

function printSessionInfo() {
  console.log(`${colors.gray}─────────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.bold}Rede:${colors.reset}       ${colors.green}${session.nodeUrl}${colors.reset} [Chain ID: ${colors.yellow}${session.chainId}${colors.reset} (${session.chainId.charCodeAt(0)})]`);
  console.log(`${colors.bold}Explorer:${colors.reset}   ${colors.cyan}${session.explorerUrl}${colors.reset}`);
  if (session.address) {
    console.log(`${colors.bold}Conta:${colors.reset}      ${colors.brightGreen}${session.address}${colors.reset}`);
    console.log(`${colors.bold}Public Key:${colors.reset} ${colors.gray}${session.publicKey}${colors.reset}`);
  } else {
    console.log(`${colors.bold}Conta:${colors.reset}      ${colors.red}[Nenhuma Seed Configurada]${colors.reset}`);
  }
  console.log(`${colors.gray}─────────────────────────────────────────────────────────────────────────${colors.reset}`);
}

// Success Transaction Reporter
function printTxSuccess(txResult) {
  console.log(`\n${colors.brightGreen}${colors.bold}✓ Transação transmitida com sucesso para a rede Planet One!${colors.reset}`);
  console.log(`${colors.bold}ID da Transação:${colors.reset} ${colors.brightCyan}${txResult.id}${colors.reset}`);
  console.log(`${colors.bold}Tipo:${colors.reset}            ${colors.yellow}${txResult.type}${colors.reset}`);
  console.log(`${colors.bold}Taxa Paga:${colors.reset}       ${colors.white}${formatAmount(txResult.fee, 8)} PLO${colors.reset}`);
  console.log(`${colors.bold}Link no Explorer:${colors.reset}`);
  console.log(`${colors.brightMagenta}${session.explorerUrl}/tx/${txResult.id}${colors.reset}\n`);
}

// ============================================================================
// TRANSACTION HANDLERS
// ============================================================================

// 1. Balance & Portfolio Check
async function handleCheckBalance() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}📊 CONSULTA DE SALDO E PORTFÓLIO${colors.reset}\n`);

  try {
    const customAddr = await ask('Digite o endereço a consultar (ou pressione ENTER para usar sua conta atual)', session.address);
    console.log(`\n${colors.gray}Consultando nó Planet One...${colors.reset}`);

    const [balanceData, assetData, scriptData, dataEntries] = await Promise.all([
      getAccountBalanceDetails(customAddr).catch(e => ({ regular: 0, available: 0, effective: 0, generating: 0 })),
      getAccountAssets(customAddr).catch(e => ({ balances: [] })),
      getAccountScript(customAddr).catch(e => null),
      getAccountData(customAddr).catch(e => [])
    ]);

    console.log(`\n${colors.bold}${colors.green}=== Saldos Nativos (PLO) ===${colors.reset}`);
    console.log(`  • ${colors.bold}Endereço Consultado:${colors.reset} ${colors.brightCyan}${customAddr}${colors.reset}`);
    console.log(`  • ${colors.bold}Saldo Regular:${colors.reset}       ${colors.brightGreen}${formatAmount(balanceData.regular, 8)} PLO${colors.reset}`);
    console.log(`  • ${colors.bold}Saldo Disponível:${colors.reset}    ${colors.white}${formatAmount(balanceData.available, 8)} PLO${colors.reset}`);
    console.log(`  • ${colors.bold}Saldo Efetivo:${colors.reset}     ${colors.white}${formatAmount(balanceData.effective, 8)} PLO${colors.reset} (com leasing)`);
    console.log(`  • ${colors.bold}Saldo Gerador:${colors.reset}     ${colors.white}${formatAmount(balanceData.generating, 8)} PLO${colors.reset}`);

    console.log(`\n${colors.bold}${colors.green}=== Tokens e Ativos na Carteira (${assetData.balances ? assetData.balances.length : 0}) ===${colors.reset}`);
    if (assetData.balances && assetData.balances.length > 0) {
      for (const item of assetData.balances) {
        const decimals = item.issueTransaction ? item.issueTransaction.decimals : (item.decimals || 8);
        const name = item.issueTransaction ? item.issueTransaction.name : (item.name || 'Token');
        console.log(`  • ${colors.bold}${name}${colors.reset} (${colors.cyan}${item.assetId}${colors.reset})`);
        console.log(`    Saldo: ${colors.brightYellow}${formatAmount(item.balance, decimals)}${colors.reset} [${decimals} decimais]`);
      }
    } else {
      console.log(`  ${colors.gray}(Nenhum token secundário encontrado nesta conta)${colors.reset}`);
    }

    console.log(`\n${colors.bold}${colors.green}=== Status de Smart Contract na Conta ===${colors.reset}`);
    if (scriptData && scriptData.script) {
      console.log(`  • ${colors.brightGreen}Smart Contract Ativo!${colors.reset}`);
      console.log(`    Complexidade: ${scriptData.complexity || 'N/A'}`);
      console.log(`    Taxa Extra: ${formatAmount(scriptData.extraFee || 0, 8)} PLO`);
    } else {
      console.log(`  • ${colors.gray}Conta Comum (Sem Script / Contrato)${colors.reset}`);
    }

    console.log(`\n${colors.bold}${colors.green}=== Dados Gravados (Data Entries: ${dataEntries.length}) ===${colors.reset}`);
    if (dataEntries.length > 0) {
      dataEntries.slice(0, 10).forEach(entry => {
        console.log(`  • ${colors.cyan}${entry.key}${colors.reset} (${entry.type}): ${colors.white}${entry.value}${colors.reset}`);
      });
      if (dataEntries.length > 10) console.log(`  ${colors.gray}... e mais ${dataEntries.length - 10} chaves.${colors.reset}`);
    } else {
      console.log(`  ${colors.gray}(Nenhum dado gravado no estado da conta)${colors.reset}`);
    }

  } catch (error) {
    console.error(`\n${colors.red}Erro ao consultar saldo:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 2. Specific Asset Lookup
async function handleLookupAsset() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🔍 CONSULTA DE TOKEN ESPECÍFICO${colors.reset}\n`);

  try {
    const assetId = await ask('Digite o Asset ID do token');
    if (!assetId) throw new Error('Asset ID não informado');

    console.log(`\n${colors.gray}Buscando metadados no nó Planet One...${colors.reset}`);
    const details = await getAssetDetails(assetId);

    console.log(`\n${colors.bold}${colors.green}=== Detalhes do Token ===${colors.reset}`);
    console.log(`  • ${colors.bold}Nome:${colors.reset}          ${colors.brightCyan}${details.name}${colors.reset}`);
    console.log(`  • ${colors.bold}Asset ID:${colors.reset}      ${colors.cyan}${details.assetId}${colors.reset}`);
    console.log(`  • ${colors.bold}Decimais:${colors.reset}      ${colors.yellow}${details.decimals}${colors.reset}`);
    console.log(`  • ${colors.bold}Total Supply:${colors.reset}  ${colors.white}${formatAmount(details.quantity, details.decimals)} ${details.name}${colors.reset}`);
    console.log(`  • ${colors.bold}Reemitível:${colors.reset}    ${details.reissuable ? colors.green + 'Sim' : colors.red + 'Não'}${colors.reset}`);
    console.log(`  • ${colors.bold}Emissor:${colors.reset}       ${colors.white}${details.issuer || 'N/A'}${colors.reset}`);
    console.log(`  • ${colors.bold}Descrição:${colors.reset}     ${colors.gray}${details.description || '(Sem descrição)'}${colors.reset}`);
    if (details.minSponsoredAssetFee) {
      console.log(`  • ${colors.bold}Patrocínio de Taxa:${colors.reset} ${colors.green}Ativo (${formatAmount(details.minSponsoredAssetFee, details.decimals)} por tx)${colors.reset}`);
    }

    // Check user balance for this asset
    if (session.address) {
      const assetList = await getAccountAssets(session.address);
      const matched = assetList.balances.find(b => b.assetId === assetId);
      const userBalance = matched ? matched.balance : 0;
      console.log(`\n  • ${colors.bold}Seu Saldo Atual deste Token:${colors.reset} ${colors.brightGreen}${formatAmount(userBalance, details.decimals)} ${details.name}${colors.reset}`);
    }

  } catch (error) {
    console.error(`\n${colors.red}Erro ao consultar token:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 3. Issue Token (Type 3)
async function handleIssueToken() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🪙 CRIAR NOVO TOKEN NA PLANET ONE (ISSUE TOKEN - TIPO 3)${colors.reset}\n`);

  try {
    const name = await ask('Nome do Token (4 a 16 caracteres)');
    if (!name || name.length < 4 || name.length > 16) throw new Error('Nome deve ter entre 4 e 16 caracteres');

    const description = await ask('Descrição do Token', 'Token criado via Planet One CLI');
    const decimalsStr = await ask('Casas Decimais (0 a 8)', '8');
    const decimals = parseInt(decimalsStr, 10);
    if (isNaN(decimals) || decimals < 0 || decimals > 8) throw new Error('Decimais devem ser entre 0 e 8');

    const supplyStr = await ask(`Quantidade Inicial (Total Supply)`, '1000000');
    const quantity = parseAmount(supplyStr, decimals);

    const reissuableStr = await ask('Permitir Reemissão futura? (s/n)', 's');
    const reissuable = reissuableStr.toLowerCase().startsWith('s');

    const feeStr = await ask('Taxa da transação em PLO', '1.0');
    const fee = parseAmount(feeStr, 8);

    console.log(`\n${colors.yellow}Resumo da Emissão:${colors.reset}`);
    console.log(`  • Nome: ${name}`);
    console.log(`  • Total Supply: ${supplyStr} (${quantity} unidades base)`);
    console.log(`  • Decimais: ${decimals}`);
    console.log(`  • Reemitível: ${reissuable ? 'Sim' : 'Não'}`);
    console.log(`  • Taxa: ${feeStr} PLO`);

    const confirm = await ask('\nConfirmar emissão do Token? (s/n)', 's');
    if (!confirm.toLowerCase().startsWith('s')) {
      console.log('Operação cancelada.');
      await ask('\nPressione ENTER para voltar');
      return;
    }

    const tx = wt.issue({
      name,
      description,
      quantity,
      decimals,
      reissuable,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo transação para o nó Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);
    console.log(`${colors.bold}Novo Asset ID gerado:${colors.reset} ${colors.brightCyan}${result.id}${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao emitir token:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 4. Transfer (Type 4)
async function handleTransfer() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}💸 TRANSFERIR PLO OU TOKEN (TRANSFER - TIPO 4)${colors.reset}\n`);

  try {
    const assetIdInput = await ask('Asset ID do token a transferir (ou ENTER para moeda nativa PLO)', '');
    const assetId = assetIdInput ? assetIdInput.trim() : null;

    let decimals = 8;
    let tokenName = 'PLO';
    let availableBalance = 0;

    if (!assetId) {
      const balanceData = await getAccountBalanceDetails(session.address);
      availableBalance = balanceData.available || 0;
      tokenName = 'PLO';
    } else {
      const [details, accountAssets] = await Promise.all([
        getAssetDetails(assetId),
        getAccountAssets(session.address)
      ]);
      decimals = details.decimals || 8;
      tokenName = details.name || 'Token';
      const matched = accountAssets.balances.find(b => b.assetId === assetId);
      availableBalance = matched ? matched.balance : 0;
    }

    console.log(`\n${colors.bold}Saldo Disponível para envio:${colors.reset} ${colors.brightGreen}${formatAmount(availableBalance, decimals)} ${tokenName}${colors.reset}\n`);

    const recipient = await ask('Endereço de destino ou Alias');
    if (!recipient) throw new Error('Destinatário obrigatório');

    const amountStr = await ask(`Quantidade a enviar em ${tokenName}`);
    const amount = parseAmount(amountStr, decimals);

    if (amount > availableBalance) {
      console.log(`${colors.red}Aviso: A quantidade informada (${amountStr}) excede seu saldo disponível (${formatAmount(availableBalance, decimals)})!${colors.reset}`);
      const proceed = await ask('Deseja tentar enviar mesmo assim? (s/n)', 'n');
      if (!proceed.toLowerCase().startsWith('s')) return;
    }

    const rawAttachment = await ask('Mensagem / Anexo opcional', '');
    const attachment = formatAttachment(rawAttachment);

    // Consulta taxa mínima dinâmica calculada pelo nó Planet One
    const tempTx = wt.transfer({
      recipient,
      amount,
      assetId,
      attachment,
      fee: 100000,
      chainId: session.chainId
    }, session.seed);

    const calculatedFee = await fetchCalculateFee(tempTx, 100000);
    const feeStr = await ask('Taxa da transação em PLO', (calculatedFee / 1e8).toString());
    const userFee = parseAmount(feeStr, 8);
    const fee = Math.max(userFee, calculatedFee);

    if (userFee < calculatedFee) {
      console.log(`${colors.yellow}Aviso: A taxa informada é menor que o mínimo exigido (${formatAmount(calculatedFee, 8)} PLO). Ajustando para a taxa mínima.${colors.reset}`);
    }

    const tx = wt.transfer({
      recipient,
      amount,
      assetId,
      attachment,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo transferência para a rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro na transferência:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 5. Mass Transfer (Type 11)
async function handleMassTransfer() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}👥 TRANSFERÊNCIA EM MASSA (MASS TRANSFER - TIPO 11)${colors.reset}\n`);

  try {
    const assetIdInput = await ask('Asset ID do token a transferir (ou ENTER para moeda nativa PLO)', '');
    const assetId = assetIdInput ? assetIdInput.trim() : null;

    let decimals = 8;
    let tokenName = 'PLO';
    let availableBalance = 0;

    if (!assetId) {
      const balanceData = await getAccountBalanceDetails(session.address);
      availableBalance = balanceData.available || 0;
      tokenName = 'PLO';
    } else {
      const [details, accountAssets] = await Promise.all([
        getAssetDetails(assetId),
        getAccountAssets(session.address)
      ]);
      decimals = details.decimals || 8;
      tokenName = details.name || 'Token';
      const matched = accountAssets.balances.find(b => b.assetId === assetId);
      availableBalance = matched ? matched.balance : 0;
    }

    console.log(`\n${colors.bold}Saldo Disponível:${colors.reset} ${colors.brightGreen}${formatAmount(availableBalance, decimals)} ${tokenName}${colors.reset}\n`);

    console.log(`${colors.yellow}Modo de entrada de destinatários:${colors.reset}`);
    console.log(`1. Digitar um por um interativamente`);
    console.log(`2. Colar lista no formato: endereco,valor (uma por linha)`);
    const mode = await ask('Escolha a opção (1 ou 2)', '1');

    const transfers = [];

    if (mode === '2') {
      console.log(`\nCole a lista de transferências (digite FIM em uma linha para encerrar):`);
      while (true) {
        const line = await ask('');
        if (line.trim().toUpperCase() === 'FIM' || line.trim() === '') break;
        const parts = line.split(/[,;\t]/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const addr = parts[0];
          const val = parts[1];
          transfers.push({ recipient: addr, amount: parseAmount(val, decimals) });
        }
      }
    } else {
      let adding = true;
      while (adding) {
        const addr = await ask(`Destinatário #${transfers.length + 1} (ou ENTER para concluir)`);
        if (!addr) break;
        const valStr = await ask(`Quantidade para ${addr} em ${tokenName}`);
        transfers.push({ recipient: addr, amount: parseAmount(valStr, decimals) });
        console.log(`${colors.green}Adicionado! Total de itens: ${transfers.length}${colors.reset}\n`);
      }
    }

    if (transfers.length === 0) throw new Error('Nenhum destinatário informado');

    const totalAmount = transfers.reduce((acc, t) => acc + t.amount, 0);
    console.log(`\n${colors.bold}Resumo da Transferência em Massa:${colors.reset}`);
    console.log(`  • Total de Destinatários: ${transfers.length}`);
    console.log(`  • Volume Total: ${formatAmount(totalAmount, decimals)} ${tokenName}`);

    const rawAttachment = await ask('Mensagem / Anexo opcional', '');
    const attachment = formatAttachment(rawAttachment);

    // Consulta taxa mínima dinâmica calculada pelo nó Planet One
    const tempTx = wt.massTransfer({
      transfers,
      assetId,
      attachment,
      fee: 100000,
      chainId: session.chainId
    }, session.seed);

    const calculatedFee = await fetchCalculateFee(tempTx, Math.max(400000, 100000 + Math.ceil(transfers.length / 2) * 100000));
    const feeStr = await ask('Taxa em PLO', (calculatedFee / 1e8).toString());
    const userFee = parseAmount(feeStr, 8);
    const fee = Math.max(userFee, calculatedFee);

    if (userFee < calculatedFee) {
      console.log(`${colors.yellow}Aviso: A taxa informada é menor que o mínimo exigido (${formatAmount(calculatedFee, 8)} PLO). Ajustando para a taxa mínima.${colors.reset}`);
    }

    const tx = wt.massTransfer({
      transfers,
      assetId,
      attachment,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo transferência em massa para a rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro na transferência em massa:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 6. Reissue Token (Type 5)
async function handleReissueToken() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}➕ REEMITIR TOKEN (REISSUE TOKEN - TIPO 5)${colors.reset}\n`);

  try {
    const assetId = await ask('Asset ID do token a reemitir');
    if (!assetId) throw new Error('Asset ID obrigatório');

    const details = await getAssetDetails(assetId);
    if (!details.reissuable) {
      console.log(`${colors.red}Atenção: Este token foi configurado como NÃO reemitível na sua criação!${colors.reset}`);
    }

    console.log(`\n${colors.bold}Token:${colors.reset} ${details.name} (Decimais: ${details.decimals})`);
    console.log(`Supply Atual: ${formatAmount(details.quantity, details.decimals)} ${details.name}\n`);

    const addSupplyStr = await ask(`Quantidade adicional a emitir em ${details.name}`);
    const quantity = parseAmount(addSupplyStr, details.decimals);

    const reissuableStr = await ask('Manter o token reemitível para o futuro? (s/n)', 's');
    const reissuable = reissuableStr.toLowerCase().startsWith('s');

    const feeStr = await ask('Taxa em PLO', '1.0');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.reissue({
      assetId,
      quantity,
      reissuable,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo reemissão para a rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao reemitir token:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 7. Burn Token (Type 6)
async function handleBurnToken() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🔥 QUEIMAR TOKEN (BURN TOKEN - TIPO 6)${colors.reset}\n`);

  try {
    const assetId = await ask('Asset ID do token a queimar');
    if (!assetId) throw new Error('Asset ID obrigatório');

    const [details, accountAssets] = await Promise.all([
      getAssetDetails(assetId),
      getAccountAssets(session.address)
    ]);

    const matched = accountAssets.balances.find(b => b.assetId === assetId);
    const available = matched ? matched.balance : 0;

    console.log(`\n${colors.bold}Token:${colors.reset} ${details.name} (Decimais: ${details.decimals})`);
    console.log(`Seu Saldo Atual: ${colors.brightGreen}${formatAmount(available, details.decimals)} ${details.name}${colors.reset}\n`);

    const amountStr = await ask(`Quantidade de ${details.name} a QUEIMAR permanentemente`);
    const amount = parseAmount(amountStr, details.decimals);

    if (amount > available) {
      console.log(`${colors.red}Aviso: A quantidade informada excede seu saldo disponível!${colors.reset}`);
      const proceed = await ask('Deseja tentar queimar mesmo assim? (s/n)', 'n');
      if (!proceed.toLowerCase().startsWith('s')) return;
    }

    const feeStr = await ask('Taxa em PLO', '0.001');
    const fee = parseAmount(feeStr, 8);

    const confirm = await ask(`\n${colors.brightRed}Confirmar queima de ${amountStr} ${details.name}? Essa ação é IRREVERSÍVEL! (s/n)${colors.reset}`, 'n');
    if (!confirm.toLowerCase().startsWith('s')) {
      console.log('Operação cancelada.');
      await ask('\nPressione ENTER para voltar');
      return;
    }

    const tx = wt.burn({
      assetId,
      amount,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo queima para a rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao queimar token:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 8. Lease (Type 8)
async function handleLease() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🤝 LEASING / STAKING EM NÓ VALIDADOR (LEASE - TIPO 8)${colors.reset}\n`);

  try {
    const balanceData = await getAccountBalanceDetails(session.address);
    console.log(`Saldo Disponível para Leasing: ${colors.brightGreen}${formatAmount(balanceData.available, 8)} PLO${colors.reset}\n`);

    const recipient = await ask('Endereço do Nó Gerador / Validador Planet One');
    if (!recipient) throw new Error('Endereço do validador obrigatório');

    const amountStr = await ask('Quantidade de PLO a colocar em Leasing');
    const amount = parseAmount(amountStr, 8);

    const feeStr = await ask('Taxa da transação em PLO', '0.001');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.lease({
      recipient,
      amount,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo lease para a rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);
    console.log(`${colors.bold}ID do Leasing para futuro cancelamento:${colors.reset} ${colors.brightCyan}${result.id}${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}Erro no leasing:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 9. Cancel Lease (Type 9)
async function handleCancelLease() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🛑 CANCELAR LEASING (CANCEL LEASE - TIPO 9)${colors.reset}\n`);

  try {
    const leaseId = await ask('ID da transação de Lease a cancelar');
    if (!leaseId) throw new Error('Lease ID obrigatório');

    const feeStr = await ask('Taxa da transação em PLO', '0.001');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.cancelLease({
      leaseId,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo cancelamento de lease para a rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao cancelar lease:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 10. Create Alias (Type 10)
async function handleCreateAlias() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🏷️ CRIAR APELIDO / ALIAS (CREATE ALIAS - TIPO 10)${colors.reset}\n`);

  try {
    const alias = await ask('Nome do Alias desejado (4 a 30 caracteres: a-z, 0-9, @, -, _)');
    if (!alias || alias.length < 4 || alias.length > 30) throw new Error('Alias deve ter entre 4 e 30 caracteres');

    const feeStr = await ask('Taxa da transação em PLO', '0.001');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.alias({
      alias,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Registrando alias na rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao criar alias:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 11. Data Transaction (Type 12)
async function handleDataTransaction() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}📝 GRAVAR DADOS NO ESTADO DA CONTA (DATA TRANSACTION - TIPO 12)${colors.reset}\n`);

  try {
    const dataEntries = [];
    console.log(`${colors.yellow}Insira as entradas de dados chave/valor:${colors.reset}`);

    let adding = true;
    while (adding) {
      const key = await ask(`Chave #${dataEntries.length + 1} (ou ENTER para finalizar)`);
      if (!key) break;

      console.log(`Tipos disponíveis: 1. String | 2. Integer | 3. Boolean | 4. Binary (Base64)`);
      const typeOption = await ask('Tipo do valor (1, 2, 3 ou 4)', '1');
      const valStr = await ask(`Valor para a chave "${key}"`);

      let parsedVal;
      let typeName = 'string';

      if (typeOption === '2') {
        parsedVal = parseInt(valStr, 10);
        typeName = 'integer';
      } else if (typeOption === '3') {
        parsedVal = valStr.toLowerCase() === 'true' || valStr === '1' || valStr.toLowerCase() === 's';
        typeName = 'boolean';
      } else if (typeOption === '4') {
        parsedVal = valStr.startsWith('base64:') ? valStr : `base64:${valStr}`;
        typeName = 'binary';
      } else {
        parsedVal = valStr;
        typeName = 'string';
      }

      dataEntries.push({ key, type: typeName, value: parsedVal });
      console.log(`${colors.green}Entrada adicionada! Total: ${dataEntries.length}${colors.reset}\n`);
    }

    if (dataEntries.length === 0) throw new Error('Nenhuma entrada de dados informada');

    const tempTx = wt.data({
      data: dataEntries,
      fee: 100000,
      chainId: session.chainId
    }, session.seed);

    const calculatedFee = await fetchCalculateFee(tempTx, 100000);
    const feeStr = await ask('Taxa em PLO', (calculatedFee / 1e8).toString());
    const userFee = parseAmount(feeStr, 8);
    const fee = Math.max(userFee, calculatedFee);

    const tx = wt.data({
      data: dataEntries,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Gravando dados na blockchain Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro na transação de dados:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 12. Set Script / Smart Contract (Type 13)
async function handleSetScript() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}📜 ADICIONAR OU ATUALIZAR SMART CONTRACT NA CONTA (SET SCRIPT - TIPO 13)${colors.reset}\n`);

  try {
    console.log(`${colors.yellow}Escolha a forma de fornecer o Smart Contract Ride:${colors.reset}`);
    console.log(`1. Digitar o caminho de um arquivo .ride no computador`);
    console.log(`2. Colar o código Ride diretamente no terminal`);
    console.log(`3. Colar o Base64 do script já compilado`);
    const method = await ask('Opção (1, 2 ou 3)', '1');

    let compiledBase64 = '';

    if (method === '1') {
      const filePathInput = await ask('Caminho do arquivo .ride (ex: scripts/data-storage.ride)');
      const resolvedPath = resolveFilePath(filePathInput);
      if (!resolvedPath) {
        throw new Error(`Arquivo não encontrado: "${filePathInput}". Verifique se o caminho ou nome do arquivo estão corretos.`);
      }
      console.log(`\n${colors.cyan}Lendo arquivo:${colors.reset} ${resolvedPath}`);
      const code = fs.readFileSync(resolvedPath, 'utf8');
      console.log(`${colors.gray}Compilando contrato Ride...${colors.reset}`);
      compiledBase64 = await compileRideScript(code);
    } else if (method === '2') {
      console.log(`\nCole o código Ride (digite FIM em uma linha separada para concluir):`);
      let lines = [];
      while (true) {
        const line = await ask('');
        if (line.trim() === 'FIM') break;
        lines.push(line);
      }
      const code = lines.join('\n');
      console.log(`\n${colors.gray}Compilando contrato Ride...${colors.reset}`);
      compiledBase64 = await compileRideScript(code);
    } else {
      compiledBase64 = await ask('Base64 do script compilado');
    }

    if (!compiledBase64) throw new Error('Código compilado vazio');

    console.log(`\n${colors.green}✓ Script compilado com sucesso!${colors.reset}`);
    console.log(`Script Base64: ${colors.gray}${compiledBase64.slice(0, 40)}...${colors.reset}\n`);

    const feeStr = await ask('Taxa em PLO', '0.01');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.setScript({
      script: compiledBase64,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Ativando Smart Contract na conta Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao configurar contrato:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 13. Remove Script / Contract (Type 13 with script: null)
async function handleRemoveScript() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🗑️ REMOVER SMART CONTRACT DA CONTA (TRANSFORMAR EM CONTA PADRÃO)${colors.reset}\n`);

  try {
    const scriptInfo = await getAccountScript(session.address);
    if (!scriptInfo || !scriptInfo.script) {
      console.log(`${colors.yellow}Esta conta já é uma conta padrão (não possui smart contract ativo).${colors.reset}`);
      await ask('\nPressione ENTER para voltar');
      return;
    }

    console.log(`${colors.yellow}Smart Contract atual detectado (Complexidade: ${scriptInfo.complexity || 'N/A'}).${colors.reset}`);
    const confirm = await ask(`\n${colors.brightRed}Tem certeza que deseja REMOVER o contrato da conta e torná-la conta comum? (s/n)${colors.reset}`, 'n');
    if (!confirm.toLowerCase().startsWith('s')) {
      console.log('Operação cancelada.');
      await ask('\nPressione ENTER para voltar');
      return;
    }

    const feeStr = await ask('Taxa em PLO', '0.01');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.setScript({
      script: null, // null removes the script
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Removendo contrato da conta na rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao remover contrato:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 14. Sponsor Fee (Type 14)
async function handleSponsorFee() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}⚙️ CONFIGURAR PATROCÍNIO DE TAXAS DE TOKEN (SPONSOR FEE - TIPO 14)${colors.reset}\n`);

  try {
    const assetId = await ask('Asset ID do token a patrocinar');
    if (!assetId) throw new Error('Asset ID obrigatório');

    const details = await getAssetDetails(assetId);
    console.log(`\n${colors.bold}Token:${colors.reset} ${details.name} (Decimais: ${details.decimals})`);

    console.log(`\n${colors.yellow}Informe o custo mínimo do token para pagar uma taxa básica de transação (0.001 PLO):${colors.reset}`);
    console.log(`Exemplo: Se 1 ${details.name} = 1 PLO, digite 0.001. Digite 0 para DESATIVAR o patrocínio.`);
    const minFeeStr = await ask(`Valor do token ${details.name} por taxa básica`, '1');

    let minSponsoredAssetFee = null;
    if (minFeeStr !== '0' && minFeeStr !== '') {
      minSponsoredAssetFee = parseAmount(minFeeStr, details.decimals);
    }

    const feeStr = await ask('Taxa da transação em PLO', '1.0');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.sponsorship({
      assetId,
      minSponsoredAssetFee,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Atualizando patrocínio de taxas na rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao patrocinar taxas:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 15. Set Asset Script (Type 15)
async function handleSetAssetScript() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}🛡️ CONFIGURAR SCRIPT EM SMART ASSET (SET ASSET SCRIPT - TIPO 15)${colors.reset}\n`);

  try {
    const assetId = await ask('Asset ID do Smart Asset');
    if (!assetId) throw new Error('Asset ID obrigatório');

    const details = await getAssetDetails(assetId);
    console.log(`\n${colors.bold}Token:${colors.reset} ${details.name}`);

    console.log(`\n${colors.yellow}Informe o script do Asset:${colors.reset}`);
    console.log(`1. Arquivo .ride`);
    console.log(`2. Base64 compilado`);
    const opt = await ask('Opção (1 ou 2)', '1');

    let compiledBase64 = '';
    if (opt === '1') {
      const filePathInput = await ask('Caminho do arquivo .ride (ex: scripts/basic-asset-script.ride)');
      const resolvedPath = resolveFilePath(filePathInput);
      if (!resolvedPath) {
        throw new Error(`Arquivo não encontrado: "${filePathInput}". Verifique se o caminho ou nome do arquivo estão corretos.`);
      }
      console.log(`\n${colors.cyan}Lendo arquivo:${colors.reset} ${resolvedPath}`);
      const code = fs.readFileSync(resolvedPath, 'utf8');
      console.log(`${colors.gray}Compilando script do asset em Ride...${colors.reset}`);
      compiledBase64 = await compileRideScript(code);
    } else {
      compiledBase64 = await ask('Base64 do script');
    }

    const feeStr = await ask('Taxa em PLO', '1.0');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.setAssetScript({
      assetId,
      script: compiledBase64,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Transmitindo script do asset para a rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao configurar script do asset:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 16. Invoke Script / dApp Call (Type 16)
async function handleInvokeScript() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}⚡ INVOCAR FUNÇÃO DE SMART CONTRACT / DAPP (INVOKE SCRIPT - TIPO 16)${colors.reset}\n`);

  try {
    const dApp = await ask('Endereço do Smart Contract / dApp');
    if (!dApp) throw new Error('Endereço do dApp obrigatório');

    const funcName = await ask('Nome da função @Callable a chamar (ou @default para função padrão)', '@default');

    const args = [];
    console.log(`\n${colors.yellow}Argumentos da função (pressione ENTER sem preencher para nenhum):${colors.reset}`);
    let addingArgs = true;
    while (addingArgs) {
      const argVal = await ask(`Argumento #${args.length + 1} (ou ENTER para encerrar)`);
      if (!argVal) break;

      console.log('Tipo: 1. String | 2. Integer | 3. Boolean | 4. Binary (Base64)');
      const t = await ask('Tipo', '1');

      if (t === '2') {
        args.push({ type: 'integer', value: parseInt(argVal, 10) });
      } else if (t === '3') {
        args.push({ type: 'boolean', value: argVal.toLowerCase() === 'true' || argVal === '1' });
      } else if (t === '4') {
        args.push({ type: 'binary', value: argVal });
      } else {
        args.push({ type: 'string', value: argVal });
      }
    }

    // Payment attachments
    const payment = [];
    const attachPay = await ask('\nDeseja anexar pagamento a esta chamada? (s/n)', 'n');
    if (attachPay.toLowerCase().startsWith('s')) {
      const payAsset = await ask('Asset ID do pagamento (ou ENTER para PLO)', '');
      const assetId = payAsset || null;
      let decimals = 8;
      let tokenName = 'PLO';
      if (assetId) {
        const det = await getAssetDetails(assetId);
        decimals = det.decimals;
        tokenName = det.name;
      }
      const payAmountStr = await ask(`Quantidade a anexar em ${tokenName}`);
      payment.push({
        assetId,
        amount: parseAmount(payAmountStr, decimals)
      });
    }

    const callObj = funcName === '@default' ? null : {
      function: funcName,
      args
    };

    const tempTx = wt.invokeScript({
      dApp,
      call: callObj,
      payment,
      fee: 500000,
      chainId: session.chainId
    }, session.seed);

    const calculatedFee = await fetchCalculateFee(tempTx, 500000);
    const feeStr = await ask('\nTaxa em PLO', (calculatedFee / 1e8).toString());
    const userFee = parseAmount(feeStr, 8);
    const fee = Math.max(userFee, calculatedFee);

    const tx = wt.invokeScript({
      dApp,
      call: callObj,
      payment,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Executando invocação no nó Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao invocar contrato:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// 17. Update Asset Info (Type 17)
async function handleUpdateAssetInfo() {
  printBanner();
  printSessionInfo();
  console.log(`${colors.bold}${colors.cyan}✏️ EDITAR INFORMAÇÕES DE TOKEN (UPDATE ASSET INFO - TIPO 17)${colors.reset}\n`);

  try {
    const assetId = await ask('Asset ID do token a editar');
    if (!assetId) throw new Error('Asset ID obrigatório');

    const details = await getAssetDetails(assetId);
    console.log(`\n${colors.bold}Nome Atual:${colors.reset} ${details.name}`);
    console.log(`${colors.bold}Descrição Atual:${colors.reset} ${details.description}\n`);

    const name = await ask('Novo Nome do Token (4 a 16 caracteres)', details.name);
    const description = await ask('Nova Descrição', details.description);

    const feeStr = await ask('Taxa em PLO', '0.001');
    const fee = parseAmount(feeStr, 8);

    const tx = wt.updateAssetInfo({
      assetId,
      name,
      description,
      fee,
      chainId: session.chainId
    }, session.seed);

    console.log(`\n${colors.gray}Atualizando dados do token na rede Planet One...${colors.reset}`);
    const result = await broadcastTx(tx);
    printTxSuccess(result);

  } catch (error) {
    console.error(`\n${colors.red}Erro ao atualizar informações do token:${colors.reset}`, error.error || error.message || error);
  }

  await ask('\nPressione ENTER para voltar ao menu');
}

// Configuration Menu
async function handleConfigureSettings() {
  printBanner();
  console.log(`${colors.bold}${colors.cyan}⚙️ CONFIGURAÇÕES DE REDE E CONTA PLANET ONE${colors.reset}\n`);

  const nodeUrl = await ask('URL do Nó da Blockchain Planet One', session.nodeUrl);
  const chainIdRaw = await ask('Chain ID da Rede (P para Mainnet [3L...], S ou T para Testnet)', session.chainId);
  const chainId = normalizeChainId(chainIdRaw);
  const explorerUrl = await ask('URL do Explorer Planet One', session.explorerUrl);

  const changeSeed = await ask('Deseja configurar / alterar a Seed Phrase da conta? (s/n)', session.seed ? 'n' : 's');
  let seed = session.seed;
  let encryptionPassword = '';

  if (changeSeed.toLowerCase().startsWith('s')) {
    seed = await askSecret('Digite a Seed Phrase da sua conta Planet One');

    console.log(`\n${colors.cyan}🔒 Proteção de Segurança (AES-256):${colors.reset}`);
    console.log(`${colors.gray}Defina uma senha para criptografar sua Seed Phrase no disco e evitar ataques.${colors.reset}`);

    while (!encryptionPassword) {
      const pass = await askSecret('Crie a senha de proteção');
      if (!pass) {
        console.log(`${colors.red}A senha não pode ser vazia.${colors.reset}`);
        continue;
      }
      const confirmPass = await askSecret('Confirme a senha');
      if (pass !== confirmPass) {
        console.log(`${colors.red}As senhas não coincidem! Tente novamente.${colors.reset}`);
        continue;
      }
      encryptionPassword = pass;
    }
  }

  session.nodeUrl = nodeUrl.replace(/\/+$/, '');
  session.chainId = chainId;
  session.explorerUrl = explorerUrl.replace(/\/+$/, '');
  session.seed = seed;

  updateKeys();
  saveConfig(encryptionPassword);

  console.log(`\n${colors.green}✓ Configurações salvas e Seed protegida com AES-256!${colors.reset}`);
  console.log(`Endereço Planet One derivado: ${colors.brightGreen}${session.address}${colors.reset}`);
  await ask('\nPressione ENTER para continuar');
}

// Initial setup check
async function ensureConfiguration() {
  loadSavedConfig();

  // If we have an encrypted seed saved, prompt for password to decrypt
  if (savedEncryptedSeed && !session.seed) {
    printBanner();
    console.log(`${colors.bold}${colors.brightCyan}🔒 CONTA PROTEGIDA COM CRIPTOGRAFIA AES-256${colors.reset}`);
    console.log(`${colors.gray}Sua Seed Phrase está armazenada em arquivo criptografado.${colors.reset}\n`);

    let attempts = 0;
    while (!session.seed && attempts < 3) {
      const password = await askSecret(`Digite a senha para desbloquear sua Seed (Tentativa ${attempts + 1}/3)`);
      if (!password) {
        console.log(`${colors.red}A senha não pode ser vazia.${colors.reset}\n`);
        attempts++;
        continue;
      }
      const decrypted = decryptSeed(savedEncryptedSeed, password);
      if (decrypted) {
        session.seed = decrypted;
        console.log(`\n${colors.brightGreen}✓ Autenticado com sucesso! Seed descriptografada via AES-256.${colors.reset}\n`);
        break;
      } else {
        console.log(`\n${colors.red}❌ Senha incorreta! Falha na autenticação AES-256.${colors.reset}\n`);
        attempts++;
      }
    }

    if (!session.seed) {
      console.log(`${colors.yellow}Deseja reconfigurar a conexão e a seed do zero? (s/n)${colors.reset}`);
      const resetChoice = await ask('Opção', 's');
      if (resetChoice.toLowerCase().startsWith('s')) {
        await handleConfigureSettings();
      } else {
        console.log(`${colors.red}Encerrando aplicação.${colors.reset}`);
        process.exit(0);
      }
    }
  } else if (session.seed && !savedEncryptedSeed) {
    // Migration: Legacy plaintext seed found in config, ask user for a password to encrypt it
    printBanner();
    console.log(`${colors.bold}${colors.yellow}🛡️ ATIVAÇÃO DE SEGURANÇA OBRIGATÓRIA (AES-256)${colors.reset}`);
    console.log(`${colors.gray}Para proteger sua conta contra invasões e acesso indevido, defina uma senha de criptografia AES-256.${colors.reset}\n`);

    let pass = '';
    while (!pass) {
      pass = await askSecret('Defina uma senha para criptografar sua Seed');
      if (!pass) {
        console.log(`${colors.red}A senha não pode ser vazia.${colors.reset}\n`);
        continue;
      }
      const confirmPass = await askSecret('Confirme a senha');
      if (pass !== confirmPass) {
        console.log(`${colors.red}As senhas não coincidem! Tente novamente.${colors.reset}\n`);
        pass = '';
      }
    }

    saveConfig(pass);
    console.log(`\n${colors.brightGreen}✓ Seed criptografada com sucesso via AES-256!${colors.reset}\n`);
  }

  if (session.seed) {
    updateKeys();
  } else {
    printBanner();
    console.log(`${colors.yellow}Bem-vindo ao Planet One Blockchain Interaction CLI!${colors.reset}`);
    console.log(`${colors.gray}Para iniciar, vamos configurar sua conexão e conta com proteção criptográfica.${colors.reset}\n`);
    await handleConfigureSettings();
  }
}

// ============================================================================
// MAIN INTERACTION LOOP
// ============================================================================

async function main() {
  await ensureConfiguration();

  let running = true;
  while (running) {
    printBanner();
    printSessionInfo();

    console.log(`${colors.bold}MENU DE OPERAÇÕES DISPONÍVEIS:${colors.reset}\n`);
    console.log(`  ${colors.brightCyan}[1]${colors.reset}  📊 Consultar Saldos e Portfólio de Tokens (PLO e outros ativos)`);
    console.log(`  ${colors.brightCyan}[2]${colors.reset}  🔍 Consultar Detalhes de um Token Específico (Asset ID)`);
    console.log(`  ${colors.brightCyan}[3]${colors.reset}  🪙 Criar Novo Token (Issue Token - Tipo 3)`);
    console.log(`  ${colors.brightCyan}[4]${colors.reset}  💸 Transferir PLO ou Token (Transfer - Tipo 4)`);
    console.log(`  ${colors.brightCyan}[5]${colors.reset}  👥 Transferência em Massa para Múltiplas Contas (Mass Transfer - Tipo 11)`);
    console.log(`  ${colors.brightCyan}[6]${colors.reset}  ➕ Reemitir Token Existente (Reissue - Tipo 5)`);
    console.log(`  ${colors.brightCyan}[7]${colors.reset}  🔥 Queimar Token (Burn - Tipo 6)`);
    console.log(`  ${colors.brightCyan}[8]${colors.reset}  🤝 Iniciar Leasing / Staking em Validador (Lease - Tipo 8)`);
    console.log(`  ${colors.brightCyan}[9]${colors.reset}  🛑 Cancelar Leasing (Cancel Lease - Tipo 9)`);
    console.log(`  ${colors.brightCyan}[10]${colors.reset} 🏷️ Criar Apelido de Conta (Create Alias - Tipo 10)`);
    console.log(`  ${colors.brightCyan}[11]${colors.reset} 📝 Gravar Dados / Data Entries na Conta (Data Transaction - Tipo 12)`);
    console.log(`  ${colors.brightCyan}[12]${colors.reset} 📜 Adicionar ou Atualizar Smart Contract na Conta (Set Script - Tipo 13)`);
    console.log(`  ${colors.brightCyan}[13]${colors.reset} 🗑️ Remover Smart Contract da Conta (Voltar a ser Conta Comum)`);
    console.log(`  ${colors.brightCyan}[14]${colors.reset} ⚙️ Configurar Patrocínio de Taxas no Token (Sponsor Fee - Tipo 14)`);
    console.log(`  ${colors.brightCyan}[15]${colors.reset} 🛡️ Configurar Script em Smart Asset (Set Asset Script - Tipo 15)`);
    console.log(`  ${colors.brightCyan}[16]${colors.reset} ⚡ Invocar Função de Smart Contract (Invoke Script - Tipo 16)`);
    console.log(`  ${colors.brightCyan}[17]${colors.reset} ✏️ Editar Informações do Token (Update Asset Info - Tipo 17)`);
    console.log(`  ${colors.yellow}[18]${colors.reset} 🔄 Alterar Configurações (Seed, Node URL, Chain ID, Explorer)`);
    console.log(`  ${colors.red}[0]${colors.reset}  🚪 Sair\n`);

    const option = await ask('Selecione uma opção');

    switch (option.trim()) {
      case '1':
        await handleCheckBalance();
        break;
      case '2':
        await handleLookupAsset();
        break;
      case '3':
        await handleIssueToken();
        break;
      case '4':
        await handleTransfer();
        break;
      case '5':
        await handleMassTransfer();
        break;
      case '6':
        await handleReissueToken();
        break;
      case '7':
        await handleBurnToken();
        break;
      case '8':
        await handleLease();
        break;
      case '9':
        await handleCancelLease();
        break;
      case '10':
        await handleCreateAlias();
        break;
      case '11':
        await handleDataTransaction();
        break;
      case '12':
        await handleSetScript();
        break;
      case '13':
        await handleRemoveScript();
        break;
      case '14':
        await handleSponsorFee();
        break;
      case '15':
        await handleSetAssetScript();
        break;
      case '16':
        await handleInvokeScript();
        break;
      case '17':
        await handleUpdateAssetInfo();
        break;
      case '18':
        await handleConfigureSettings();
        break;
      case '0':
        console.log(`\n${colors.brightCyan}Até logo! Planet One Blockchain Interaction CLI finalizado.${colors.reset}\n`);
        running = false;
        break;
      default:
        console.log(`${colors.red}Opção inválida!${colors.reset}`);
        await ask('Pressione ENTER para continuar');
        break;
    }
  }
}

// Run Main CLI
main().catch((err) => {
  console.error('\nErro fatal:', err);
  process.exit(1);
});

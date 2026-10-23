# ⚡ AMZX Blockchain Explorer Suite

Official explorer suite for the **AMZX Network (Amazonic One)**. This suite consists of two core components:

1. **AMZ Explorer (Web Frontend)**: Fast, modern blockchain explorer built with **React, TypeScript, Vite, and Tailwind CSS**. Provides real-time block streaming, transaction search, token auditing, LPoS validator analytics, and EVM compatibility.
2. **AMZ Full Explorer (Indexer & Archival API)**: Lightweight backend built in **PHP and SQLite** that indexes the entire ledger in real time, serving high-throughput REST APIs.

---

## 🚀 Component 1: AMZ Explorer (Frontend)

The frontend offers real-time inspection for blocks, transactions, Ride smart contracts, account portfolios, active validators, mempool backlog, and ecosystem assets (`AMZ`, `amz1`, `AUSDTW`).

### ✨ Key Features
- **Real-Time Telemetry**: Live network statistics including block height, transaction counts, mempool transactions, ledger size, and active validators.
- **Full Precision Support**: Native BigInt arithmetic and precision handling for standard and high-precision tokens (up to 18 decimals).
- **Ride Smart Contracts & EVM**: Interactive inspector for Ride scripts, callable functions, state entries, and Ethereum-compatible (0x) transactions.
- **Node & Network Settings**: Customizable RPC endpoints, chain identifiers, and live telemetry switches.

### 💻 Local Development

#### Prerequisites
- Node.js (v18+) and npm.

#### Quick Start
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build production bundle
npm run build
```

---

## ⚡ Component 2: AMZ Full Explorer (Indexer & Backend API)

Located in `./fullexplorer`, this is an on-chain indexing daemon and technical explorer.

### ✨ Key Features
- **Incremental Ledger Indexing**: Streams blocks directly from the consensus node into SQLite tables.
- **Native REST API**: Endpoints for account portfolios, rich lists, transactions, blocks, and contract execution logs.
- **Zero Heavy Dependencies**: Self-contained PHP/SQLite architecture with low memory footprint.

### 💻 Setup & Execution

#### Prerequisites
- PHP (v7.4 - v8.3) with `sqlite3`, `curl`, `json`, and `mbstring` extensions.

```bash
# Setup directories & dependencies
npm run setup:fullexplorer

# Start indexer and PHP local server on port 8000
npm run start:fullexplorer

# Stream updater logs
npm run logs:fullexplorer
```

---

## 🌐 Official Network Endpoints

| Service | Protocol | Endpoint |
|:---|:---|:---|
| **Node Swagger API** | HTTPS / TLS | `https://nodes.amzexplorer.com/` |
| **Matcher DEX API** | HTTPS / TLS | `https://matcher.amzexplorer.com` |
| **MetaMask JSON-RPC** | EVM Web3 | `https://rpc.amzexplorer.com` |
| **AMZX Data Service** | REST API | `https://data-service.amzexplorer.com` |
| **gRPC DEX** | GRPCS / WSS | `https://grpc-dex.amzexplorer.com` |
| **gRPC Updates** | GRPCS | `https://grpc-updates.amzexplorer.com` |

---

## 🛠️ Available Scripts

| Command | Description |
|:---|:---|
| `npm run dev` | Starts Vite development server. |
| `npm run build` | Builds production bundle in `dist/`. |
| `npm run preview` | Previews production build locally. |
| `npm run setup:fullexplorer` | Sets up folders and dependencies for Full Explorer. |
| `npm run start:fullexplorer` | Starts the Full Explorer indexer daemon and local API server. |
| `npm run logs:fullexplorer` | Tails live indexing logs (`var/log/updater.log`). |

---

## 🌐 Production Deployment

### 1. Frontend (Firebase Hosting)
Configured for Firebase project `amz1wallet` and hosting target `amzexplorer1`:
```bash
npm run build
firebase deploy --only hosting:amzexplorer1
```

### 2. Backend (Nginx & Systemd)

#### Nginx VirtualHost
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name fullexplorer.amzexplorer.com;

    root /home/diegooris/amzexplore/fullexplorer;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location /var {
        deny all;
        return 403;
    }
}
```

#### Systemd Indexer Service (`/etc/systemd/system/amzx-indexer.service`)
```ini
[Unit]
Description=AMZX Archival Blockchain Indexer Service
After=network.target

[Service]
Type=simple
User=diegooris
WorkingDirectory=/home/diegooris/amzexplore/fullexplorer
ExecStart=/usr/bin/php /home/diegooris/amzexplore/fullexplorer/w8_updater.php
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=amzx-indexer

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable amzx-indexer.service
sudo systemctl start amzx-indexer.service
```

---

## 📝 License

**Proprietary Software License**

Copyright (c) 2026 **Amazonic One Eco Tecnologia S.A.** & **Diego Henrique Roa Antunes** (Diego Oris). All rights reserved.

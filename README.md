# 🌳 AMZX Blockchain Explorer Suite

Este repositório contém a suíte oficial e completa de exploradores de blocos da rede **AMZX Blockchain (Amazonic One)**. A suíte é dividida em dois componentes de alto desempenho:

1. **AMZ Explorer (Frontend)**: Uma aplicação web moderna, ultra-rápida e esteticamente premium construída em **React, TypeScript, Vite e Tailwind CSS**, com suporte nativo a tokens de alta precisão (até 18 casas decimais), créditos de carbono REDD+ e auditoria em tempo real.
2. **AMZ Full Explorer (Indexador e API)**: Um backend robusto e leve construído em **PHP e SQLite**, responsável por indexar toda a blockchain em banco de dados relacional SQL, fornecer APIs REST de alto rendimento e interface técnica de terminal.

---

## 🚀 Componente 1: AMZ Explorer (Frontend)

O frontend é a interface premium descentralizada e ecológica para inspecionar blocos, transações de usuários, contratos inteligentes (Ride), balanços de contas, validadores/consenso LPoS, fila da Mempool em tempo real e tokens de ativos da **Amazonic One** (como o token oficial **amz1** de créditos de carbono REDD+ e **AUSDTW** com 18 decimais).

### ✨ Funcionalidades do Frontend
* **Design Ecológico & Glassmorphic**: Interface visual impecável com tema escuro e toques verde esmeralda inspirados na Floresta Amazônica.
* **Barra de Dados Unificada (*Sleek Data Bar*)**: Exibição responsiva de métricas vitais da rede (Altura do Bloco, Transações, Fila Mempool, Peso do Ledger em GB, Validadores Ativos e Staking Ratio).
* **Suporte Completo a 18 Casas Decimais**: Normalização, exibição e tratamento aritmético seguro com BigInt para tokens com até 18 decimais em todas as páginas e transações.
* **Mesa de Negociação REDD+**: Seção institucional integrada conectando corporações diretamente à mesa de trade de créditos de carbono de alta integridade da **Amazonic One Eco Tecnologia S.A.**
* **Central de Endpoints Criptografados**: Visualização rápida e cópia dos endpoints oficiais HTTPS/GRPCS protegidos sob a porta 443.
* **Visualização de Contratos Inteligentes**: Interface dedicada para verificar scripts Ride instalados e suas chamadas de função.

### 💻 Como Iniciar o Frontend Localmente

#### Pré-requisitos
* Node.js (v18+) e npm instalados.

#### Passos
1. Entre na pasta do explorer:
   ```bash
   cd amzexplore
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento Vite local:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:5173`.

4. Para compilar o bundle estático de produção:
   ```bash
   npm run build
   ```

---

## ⚡ Componente 2: AMZ Full Explorer (Indexador & API Backend)

Localizado em `./fullexplorer`, o Full Explorer é um daemon de indexação on-chain extremamente rápido e leve baseado em PHP e SQLite. Ele escuta cada bloco gerado pelo nó da blockchain AMZX, normaliza, analisa e popula tabelas SQL locais.

### ✨ Funcionalidades do Backend
* **Indexação Incremental de Alta Velocidade**: Sincroniza blocos inteiros em frações de segundos diretamente do nó validador AMZX.
* **API REST Nativa**: Fornece endpoints rápidos para consultar estatísticas de contas ativas, ranking de moedas em circulação, transações, blocos detalhados e eventos de contratos.
* **Baixo Consumo de Recursos**: Sem necessidade de dependências pesadas, utilizando apenas SQLite como base de dados relacional.

### 💻 Como Iniciar o Full Explorer Localmente

#### Pré-requisitos
* PHP (v7.4 - v8.3) instalado.
* Extensões do PHP habilitadas: `sqlite3`, `curl`, `json`, `mbstring`.

#### Passos
1. Para instalar e configurar o ambiente de forma automática:
   ```bash
   npm run setup:fullexplorer
   ```
2. Para iniciar o indexador e o servidor local de desenvolvimento na porta `8000`:
   ```bash
   npm run start:fullexplorer
   ```
   * O servidor web PHP estará ativo em `http://localhost:8000` fornecendo as APIs de dados históricos.
   * O daemon de sincronização em segundo plano estará ativado populando o arquivo de banco de dados SQLite.

3. Para ler os logs de sincronização local do Full Explorer:
   ```bash
   npm run logs:fullexplorer
   ```

---

## 🌐 Endpoints Oficiais Criptografados (Rede AMZX)

| Serviço | Protocolo | Endpoint Oficial |
|:---|:---|:---|
| **Node Swagger API** | HTTPS / TLS | `https://nodes.amzexplorer.com/` |
| **Matcher DEX API** | HTTPS / TLS | `https://matcher.amzexplorer.com` |
| **MetaMask JSON-RPC** | EVM Web3 | `https://rpc.amzexplorer.com` |
| **AMZX Data Service** | REST API | `https://data-service.amzexplorer.com` |
| **gRPC Control / DEX** | GRPCS / WSS | `https://grpc-dex.amzexplorer.com` (WSS/GRPCS:443) |
| **gRPC Updates** | GRPCS | `https://grpc-updates.amzexplorer.com` (GRPCS:443) |

---

## 🛠️ Scripts Úteis (package.json)

| Comando | Descrição |
|:---|:---|
| `npm run dev` | Inicia o servidor local de desenvolvimento do frontend React/Vite. |
| `npm run build` | Gera sitemaps e compila o frontend de produção otimizado na pasta `dist/`. |
| `npm run start:explorer` | Executa o script de inicialização do frontend. |
| `npm run setup:fullexplorer` | Instala dependências do Composer e inicializa pastas para o Full Explorer. |
| `npm run start:fullexplorer` | Executa o painel interativo para iniciar o indexador e servidor PHP localmente. |
| `npm run logs:fullexplorer` | Monitora em tempo real a sincronização e logs do indexador de blocos do Full Explorer. |
| `npm run preview` | Inicia um servidor local para visualizar a build de produção compilada. |

---

## 🌐 Implantação em Servidor de Produção

### 1. Publicando o Frontend (Explorer)
O build estático gerado por `npm run build` pode ser servido por qualquer servidor web moderno de arquivos estáticos como Nginx, Apache ou Firebase Hosting.
* **Firebase Hosting**: Pré-configurado para o projeto `amz1wallet` e site `amzexplorer1`. Para publicar:
  ```bash
  firebase deploy --only hosting:amzexplorer1
  ```

### 2. Publicando o Backend (Full Explorer)

#### Configuração do Nginx (VirtualHost)
Para servir a API do Full Explorer no subdomínio `fullexplorer.amzexplorer.com` utilizando PHP-FPM, adicione o seguinte bloco no seu Nginx:
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

#### Serviço de Background com Systemd (Para manter o Indexador Ativo)
Crie o arquivo `/etc/systemd/system/amzx-indexer.service`:
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
Ative e inicie o serviço:
```bash
sudo systemctl daemon-reload
sudo systemctl enable amzx-indexer.service
sudo systemctl start amzx-indexer.service
```

---

## 📝 Direitos Autorais e Licença

**Licença de Uso - AMZX Blockchain Explorer Suite**

Copyright (c) 2026 **Amazonic One Eco Tecnologia S.A.** e **Diego Henrique Roa Antunes** (Diego Oris). Todos os direitos reservados.

O código-fonte desta suíte de exploradores de blocos é disponibilizado publicamente e deixado em aberto como um compromisso com a **transparência total, descentralização e auditoria ambiental** da infraestrutura tecnológica da rede blockchain AMZX (Amazonic One).

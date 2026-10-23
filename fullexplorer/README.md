# ⚡ AMZ Full Explorer (Backend Indexer & Archival API)

The **AMZ Full Explorer** is a high-performance blockchain indexer and lightweight API engine built on PHP and SQLite.

It serves as the relational indexing engine for the **AMZX Network (Amazonic One)**. The indexer streams blocks from the node in real time, normalizing and persisting consensus transactions, transfers, balances, aliases, and smart contract execution traces into optimized SQLite tables. This enables fast REST API queries and historical analytics.

---

## 🛠️ Environment Requirements

To run the indexer and API locally or in production:
* **PHP**: 7.4, 8.0, 8.1, 8.2, or 8.3.
* **Required PHP Extensions**:
  * `sqlite3` (Local high-throughput storage)
  * `curl` (Node RPC polling and gRPC proxy)
  * `json` (Transaction payload serialization)
  * `mbstring` (UTF-8 string and encoding handling)

---

## 💻 Local Setup & Development

### 1. Initialize Directories & Permissions
Create the required directory hierarchy and grant write permissions:
```bash
mkdir -p var/db var/log var/tmp
chmod -R 775 var
```

### 2. Start Blockchain Indexer
The `w8_updater.php` daemon connects to the node RPC and indexes blocks incrementally:

* **Standard Continuous Indexing**:
  ```bash
  php w8_updater.php
  ```
* **Explicit Indexer Run**:
  ```bash
  php w8_updater.php indexer
  ```
* **Block Rollback (In case of chain reorganization)**:
  ```bash
  php w8_updater.php rollback <target_height>
  ```

Real-time indexing logs are stored in `var/log/updater.log`.

### 3. Start Local Web Server
You can use PHP's built-in development server on port `8000`:
```bash
php -S 0.0.0.0:8000 -t .
```
The REST API and Full Explorer web UI will be accessible at `http://localhost:8000`.

---

## 🌐 Production Deployment (Nginx & Systemd)

### 1. Nginx VirtualHost Configuration
Create an Nginx configuration file (e.g. `/etc/nginx/sites-available/fullexplorer`):

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

Verify and reload Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Systemd Background Service
To keep the indexer running continuously as a daemon, create `/etc/systemd/system/amzx-indexer.service`:

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

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable amzx-indexer.service
sudo systemctl start amzx-indexer.service
```

Check status:
```bash
sudo systemctl status amzx-indexer.service
```

---

## 📝 License

**Proprietary Software License**

Copyright (c) 2026 **AMZ1 LLC** & **Diego Henrique Roa Antunes** (Diego Oris). All rights reserved.

---

## 👥 Acknowledgments

The core indexing pipeline is adapted from the open-source **W8IO** engine developed by **Dmitrii Pichulin** ([deemru](https://github.com/deemru)), released under the MIT License.

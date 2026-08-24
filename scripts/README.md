# 🪐 Scripts do Ecossistema Planet One Explorer

Este diretório contém os utilitários, automações e a ferramenta oficial de linha de comando para interação e gerenciamento da blockchain **Planet One**.

---

## 📋 Índice de Utilitários e Scripts

| Script / Arquivo | Finalidade / Descrição | Como Executar / Usar |
| :--- | :--- | :--- |
| **`planetone-cli.js`** | **Ferramenta CLI interativa completa para operações na Blockchain Planet One**: Consulta de saldos/portfólio, emissão/edição/queima de tokens, transferências simples e em massa, leasing, data transactions e publicação/invocação/remoção de Smart Contracts Ride. Protegido com criptografia **AES-256**. | `npm run interact` ou `node scripts/planetone-cli.js` |
| **`data-storage.ride`** | Smart Contract Ride de exemplo para registrar e manipular entradas no **Database Entries** (On-chain State: Boolean, Integer, String e Bytes/ByteVector). | Publicar via opção `[12]` do CLI |
| **`basic-asset-script.ride`** | Script Ride para **Smart Assets**, validando operações e regras de transferência/queima por assinatura digital. | Publicar via opção `[15]` do CLI |
| **`start-explorer.sh`** | Inicia a aplicação web frontend do Planet One Explorer em modo de desenvolvimento (Vite). | `npm run start:explorer` ou `bash scripts/start-explorer.sh` |
| **`start-fullexplorer-localhost.sh`** | Inicia o servidor backend PHP e o sincronizador de blocos do Full Explorer em localhost para indexação de dados. | `npm run start:fullexplorer` ou `bash scripts/start-fullexplorer-localhost.sh` |
| **`setup-fullexplorer.sh`** | Configura dependências, extensões PHP (curl, sqlite3, gmp, mbstring), composer e permissões do Full Explorer. | `npm run setup:fullexplorer` ou `bash scripts/setup-fullexplorer.sh` |
| **`deploy-fullexplorer-nginx.sh`** | Automação completa de deploy do Full Explorer em servidores Linux com Nginx, PHP-FPM e SSL Certbot. | `npm run deploy:fullexplorer` ou `bash scripts/deploy-fullexplorer-nginx.sh` |
| **`start-fullexplorer.sh`** | Executa em background o processo contínuo de sincronização e atualização de transações da rede Planet One. | `bash scripts/start-fullexplorer.sh` |

---

## 🚀 Planet One Blockchain Interaction CLI (`planetone-cli.js`)

O **Planet One CLI** é uma ferramenta interativa e segura desenvolvida em Node.js para conectar diretamente a qualquer nó da rede Planet One (Mainnet ou Testnet), permitindo inspecionar saldos, gerenciar ativos e executar todas as operações criptográficas nativas da blockchain com assinatura local.

### 🌟 Principais Funcionalidades

1. **Assinatura Criptográfica Local**: Suas chaves privadas e seed phrases nunca saem da sua máquina; todas as transações são criadas e assinadas localmente antes do envio ao nó da blockchain.
2. **Consulta Completa de Saldos e Portfólio**: Visualização do saldo regular em PLO, saldo disponível, saldo efetivo (leasing), saldo gerador e lista de todos os tokens secundários da carteira.
3. **Verificação Prévia de Saldo**: O CLI consulta automaticamente o saldo do token e de PLO antes de submeter transferências para evitar falhas ou desperdício de taxas.
4. **Emissão e Gestão Avançada de Tokens**: Emissão de novos tokens (Issue), reemissão (Reissue), queima (Burn), alteração de nome/descrição (Update Asset Info) e configuração de patrocínio de taxas (Sponsor Fee).
5. **Smart Contracts e dApps em Ride**: Suporte à compilação local e remota de scripts Ride, ativação de contratos na conta (Set Script), remoção de contratos (retorno a conta comum), Smart Assets (Set Asset Script) e chamadas a dApps (Invoke Script).
6. **Integração Direta com o Explorer**: Ao concluir qualquer transação, o CLI exibe o ID da transação e o link direto no Planet One Explorer.

---

### ⚙️ Configuração Inicial

Ao executar o CLI pela primeira vez via `npm run interact`, o assistente interativo solicitará:

- **URL do Nó Planet One**: Exemplo: `https://testnet.planetone.io` ou `https://node.planetone.io`
- **Chain ID**: `P` para Mainnet Planet One ou `S` / `T` para Testnet
- **URL do Explorer**: Exemplo: `https://explorer.planetone.io`
- **Seed Phrase da Conta**: Frase mnemônica de 12 a 24 palavras (a digitação é mascarada para segurança)

> As configurações e o endereço da conta ativa são salvos em `scripts/.planetone-config.json` (arquivo ignorado pelo git). Você pode alterar a rede ou a seed a qualquer momento na opção **[18]**.

---

### 📖 Menu de Operações Disponíveis

```text
  [1]  📊 Consultar Saldos e Portfólio de Tokens (PLO e outros ativos)
  [2]  🔍 Consultar Detalhes de um Token Específico (Asset ID)
  [3]  🪙 Criar Novo Token (Issue Token - Tipo 3)
  [4]  💸 Transferir PLO ou Token (Transfer - Tipo 4)
  [5]  👥 Transferência em Massa para Múltiplas Contas (Mass Transfer - Tipo 11)
  [6]  ➕ Reemitir Token Existente (Reissue - Tipo 5)
  [7]  🔥 Queimar Token (Burn - Tipo 6)
  [8]  🤝 Iniciar Leasing / Staking em Validador (Lease - Tipo 8)
  [9]  🛑 Cancelar Leasing (Cancel Lease - Tipo 9)
  [10] 🏷️ Criar Apelido de Conta (Create Alias - Tipo 10)
  [11] 📝 Gravar Dados / Data Entries na Conta (Data Transaction - Tipo 12)
  [12] 📜 Adicionar ou Atualizar Smart Contract na Conta (Set Script - Tipo 13)
  [13] 🗑️ Remover Smart Contract da Conta (Voltar a ser Conta Comum)
  [14] ⚙️ Configurar Patrocínio de Taxas no Token (Sponsor Fee - Tipo 14)
  [15] 🛡️ Configurar Script em Smart Asset (Set Asset Script - Tipo 15)
  [16] ⚡ Invocar Função de Smart Contract (Invoke Script - Tipo 16)
  [17] ✏️ Editar Informações do Token (Update Asset Info - Tipo 17)
  [18] 🔄 Alterar Configurações (Seed, Node URL, Chain ID, Explorer)
  [0]  🚪 Sair
```

---

### 💡 Exemplos de Uso

#### 1. Criar um Novo Token
1. Execute `npm run interact` e escolha a opção `[3]`.
2. Digite o nome do token (ex: `ECOPLANET`).
3. Digite a descrição e número de casas decimais (ex: `8`).
4. Digite a quantidade inicial (ex: `1000000`).
5. Escolha se o token poderá receber novas emissões no futuro (`s/n`).
6. Confirme a emissão e receba o **Asset ID** gerado.

#### 2. Adicionar um Smart Contract Ride na Conta
1. Escolha a opção `[12]`.
2. Selecione se deseja informar o caminho de um arquivo `.ride` ou colar o código diretamente no terminal.
3. O CLI compilará o código Ride automaticamente e transmitirá a transação `SetScript` para a rede.

#### 3. Remover Smart Contract da Conta
1. Escolha a opção `[13]`.
2. O CLI confirmará o cancelamento do contrato e enviará um `SetScript` nulo, retornando a conta ao modo comum.

#### 4. Transferência em Massa
1. Escolha a opção `[5]`.
2. Informe o Asset ID (ou ENTER para a moeda nativa PLO).
3. Cole a lista de destinatários no formato `endereco,quantidade` ou insira interativamente um por um.
4. O CLI calculará a taxa proporcional e transmitirá a transação em lote.

---

## 🔒 Proteção Criptográfica da Seed (AES-256)

- **Criptografia em Repouso**: A Seed Phrase da sua conta é criptografada com algoritmo **AES-256-GCM** com derivação de chave via PBKDF2 (100.000 iterações SHA-256) e salt/IV aleatórios antes de ser salva no disco.
- **Proteção contra Acesso Indevido**: Nenhuma chave ou seed é armazenada em texto puro. Ao iniciar a aplicação, você deve fornecer sua senha para desbloquear a seed em memória durante a sessão.
- **Segurança de Repositório**: O arquivo `.planetone-config.json` está incluído no `.gitignore` para nunca ser enviado acidentalmente ao git.
- **Taxas da Rede**: Certifique-se de manter sempre uma pequena reserva de **PLO** na carteira para custear as taxas de transação da rede Planet One.

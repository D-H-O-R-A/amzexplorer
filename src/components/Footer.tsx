import { Link } from 'react-router-dom';
import { 
  ExternalLink, 
  Leaf, 
  Cpu, 
  Compass, 
  Network, 
  ArrowUpRight,
  Globe,
  Mail,
  MapPin,
  Building,
  ShieldCheck,
  Server,
  Lock,
  Layers
} from 'lucide-react';
import { 
  getChainId, 
  getCoinName,
  NODE_SWAGGER_URL,
  MATCHER_SWAGGER_URL,
  METAMASK_RPC_URL,
  DATA_SERVICE_DOCS_URL,
  GRPC_DEX_URL,
  GRPC_UPDATES_URL
} from '@/lib/utils';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const chainId = getChainId();
  const coinName = getCoinName();

  const institutionalLinks = [
    { label: "Início", href: "https://amazonicone.com.br" },
    { label: "A Floresta", href: "https://amazonicone.com.br/#floresta" },
    { label: "Comunidades", href: "https://amazonicone.com.br/#comunidades" },
    { label: "Créditos de Carbono", href: "https://amazonicone.com.br/#creditos" },
    { label: "Mesa de Trade", href: "https://amazonicone.com.br/#trade" },
    { label: "Contato", href: "mailto:contact@amazonicone.com" },
  ];

  const explorerLinks = [
    { label: "Blocos em Tempo Real", path: "/blocks" },
    { label: "Transações On-Chain", path: "/transactions" },
    { label: "Contratos Inteligentes Ride", path: "/contracts" },
    { label: "Ranking de Endereços", path: "/ranking" },
    { label: "Status da Rede & Peers", path: "/nodes" },
    { label: "Token amz1 (Oficial)", path: "/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" },
    { label: "Token AUSDTW (18 Decimais)", path: "/asset/7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU" },
  ];

  const secureEndpoints = [
    { name: "Node Swagger API", url: NODE_SWAGGER_URL, protocol: "HTTPS / REST" },
    { name: "Matcher DEX API", url: MATCHER_SWAGGER_URL, protocol: "HTTPS / ORDERBOOK" },
    { name: "MetaMask JSON-RPC", url: METAMASK_RPC_URL, protocol: "EVM RPC" },
    { name: "AMZX Data Service", url: DATA_SERVICE_DOCS_URL, protocol: "REST / DOCS" },
    { name: "gRPC Control / DEX", url: GRPC_DEX_URL, protocol: "WSS / GRPCS:443" },
    { name: "gRPC Blockchain Updates", url: GRPC_UPDATES_URL, protocol: "GRPCS:443" },
  ];

  return (
    <footer className="relative w-full mt-16 bg-slate-950 text-slate-200 border-t border-emerald-500/20 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 py-16 relative z-10">
        
        {/* Top Tier: Company Info Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-emerald-950/25 border border-emerald-500/20 backdrop-blur-md mb-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl shadow-black/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold tracking-widest uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Entidade Registrada & Certificada</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
              Amazonic One Eco Tecnologia S. A.
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Proteção real e direta de Floresta Amazônica. Originamos e comercializamos créditos de carbono de alta integridade (REDD+) diretamente de terras sob gestão com rastreabilidade criptográfica total.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:contact@amazonicone.com"
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Falar com Mesa de Trade</span>
            </a>
            <a
              href="https://amazonicone.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>amazonicone.com.br</span>
            </a>
          </div>
        </div>

        {/* Middle Tier: 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Corporate & Contact (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="AMZX Logo" className="w-9 h-9 object-contain" />
              <div className="flex flex-col">
                <span className="text-base font-black font-mono tracking-wider text-white uppercase">
                  AMZ<span className="text-emerald-400">X</span> Explorer
                </span>
                <span className="text-[10px] text-emerald-400/90 font-mono">
                  Blockchain Oficial Amazonic One
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Infraestrutura de consensus distribuído (Proof of Stake) para custódia imutável, contratos inteligentes e liquidez de créditos ambientais e token nativo AMZ.
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:contact@amazonicone.com" className="hover:text-emerald-400 transition-colors font-mono">
                  contact@amazonicone.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Operações de campo: Amazonas, Brasil</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Atendimento corporativo global</span>
              </div>
            </div>
          </div>

          {/* Col 2: Institutional Amazonic One (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider font-mono">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>Institucional</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {institutionalLinks.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Explorer Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider font-mono">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Explorer Ledger</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {explorerLinks.map((item, idx) => (
                <li key={idx}>
                  <Link
                    to={item.path}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Encrypted Endpoints (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Endpoints Criptografados</span>
            </div>
            <div className="space-y-2">
              {secureEndpoints.map((ep, idx) => (
                <a
                  key={idx}
                  href={ep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {ep.name}
                    </span>
                    <span className="text-[8px] font-mono text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10">
                      {ep.protocol}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                    {ep.url}
                  </span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Tier: Copyright & Network Bar */}
        <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center md:text-left leading-relaxed">
            &copy; {currentYear} <strong className="text-white">Amazonic One</strong> - Preservação real e direta na Floresta Amazônica. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Chain ID: <strong className="text-emerald-400">{chainId}</strong> (Mainnet)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              Moeda: {coinName}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

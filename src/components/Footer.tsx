import { Link } from 'react-router-dom';
import { 
  Leaf, 
  Compass, 
  ArrowUpRight,
  Globe,
  Mail,
  MapPin,
  Building,
  ShieldCheck
} from 'lucide-react';
import { 
  getChainId, 
  getCoinName
} from '@/lib/utils';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const chainId = getChainId();
  const coinName = getCoinName();

  const institutionalLinks = [
    { label: "Official Portal", href: "https://amazonic.online" },
    { label: "The Rainforest", href: "https://amazonicone.com" },
    { label: "Local Community", href: "https://urbnix.com.br" },
    { label: "Carbon Credits", href: "https://kaatrust.org" },
    { label: "Contact Us", href: "mailto:contact@amazonicone.com" },
  ];

  const explorerLinks = [
    { label: "Recent Blocks", path: "/blocks" },
    { label: "On-Chain Transactions", path: "/transactions" },
    { label: "Smart Contracts (Ride)", path: "/contracts" },
    { label: "Top Accounts (Rich List)", path: "/ranking" },
    { label: "Network Nodes & Peers", path: "/nodes" },
    { label: "amz1 Official Token", path: "/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" },
    { label: "AUSDTW (Wrapped USDT)", path: "/asset/7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU" },
  ];

  return (
    <footer className="relative w-full mt-16 bg-slate-950 text-slate-200 border-t border-emerald-500/20 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-800/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-8 py-16 relative z-10">
        
        {/* Top Tier: Company Info Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-emerald-950/25 border border-emerald-500/20 backdrop-blur-md mb-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl shadow-black/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold tracking-widest uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Registered Organization</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
              AMZ1 LLC
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Direct and audited protection of the Amazon Rainforest. Originating high-integrity environmental assets and REDD+ carbon credits on the decentralized AMZ ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:contact@amazonicone.com"
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Team</span>
            </a>
            <a
              href="https://amazonic.online"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>amazonic.online</span>
            </a>
          </div>
        </div>

        {/* Middle Tier: 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-slate-800">
          
          {/* Col 1: Corporate & Contact (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="AMZ Logo" className="w-9 h-9 object-contain" />
              <div className="flex flex-col">
                <span className="text-base font-black font-mono tracking-wider text-white uppercase">
                  AMZ Explorer
                </span>
                <span className="text-[10px] text-emerald-400/90 font-mono">
                  Official Amazonic One Blockchain
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Distributed Proof-of-Stake consensus infrastructure providing immutable ledger custody, smart contract execution, and verified on-chain asset settlements.
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
                <span>Field Operations: Dubai, UAE</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Corporate Operations: AMZ1 LLC (Dubai)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Institutional Amazonic One (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider font-mono">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ecosystem</span>
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

          {/* Col 3: Explorer Navigation (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider font-mono">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Blockchain</span>
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

        </div>

        {/* Bottom Tier: Copyright & Network Bar */}
        <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center md:text-left leading-relaxed">
            &copy; {currentYear} <strong className="text-white">AMZ1 LLC</strong>. All rights reserved.
          </p>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Chain ID: <strong className="text-emerald-400">{chainId}</strong> (Mainnet)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              Native: {coinName}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

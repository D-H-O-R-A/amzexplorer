import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isTestnet, getChainId } from '@/lib/utils';
import SearchForm from './SearchForm';
import { NodeSettingsDialog } from './NodeSettingsDialog';
import { useTheme } from '@/components/ThemeProvider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Sun, 
  Moon, 
  Menu, 
  Database,
  Box,
  ArrowRightLeft,
  FileCode,
  Network,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const currentIsTestnet = isTestnet();
  const chainId = getChainId();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { label: "Início", path: "/" },
    { label: "Blocos", path: "/blocks", icon: Box },
    { label: "Transações", path: "/transactions", icon: ArrowRightLeft },
    { label: "Contratos", path: "/contracts", icon: FileCode },
    { label: "Ranking", path: "/ranking", icon: Trophy },
    { label: "Nós & RPC", path: "/nodes", icon: Network },
  ];

  return (
    <header className="w-full sticky top-0 z-[200] backdrop-blur-2xl bg-background/85 border-b border-emerald-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      {/* Top micro live network ticker strip */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 bg-emerald-950/20 dark:bg-emerald-950/40 border-b border-emerald-500/10 text-[10px] font-mono text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AMZX Network Active</span>
          </div>
          <span className="text-border">|</span>
          <span>Ledger: Chain ID {chainId} (Mainnet)</span>
          <span className="text-border">|</span>
          <span className="text-emerald-500">Consenso: Proof of Stake (Fair PoS)</span>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="https://amazonicone.com.br" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-emerald-500 transition-colors flex items-center gap-1 font-semibold"
          >
            <span>Amazonic One Eco Tecnologia S.A.</span>
            <ExternalLink className="w-3 h-3 text-emerald-500" />
          </a>
        </div>
      </div>

      {/* Main Bar */}
      <div className="container mx-auto px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand - Left */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 blur-sm opacity-40 group-hover:opacity-75 transition-opacity duration-300" />
              <img 
                src="/logo.png" 
                alt="Amazonic One Logo" 
                className="relative w-10 h-10 object-contain rounded-full border border-emerald-500/25 bg-background shadow-md transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black font-mono tracking-wider text-foreground uppercase">
                  AMZ<span className="text-emerald-500">X</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  EXPLORER
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground font-mono tracking-tight leading-none mt-0.5">
                Amazonic One Ecosystem
              </p>
            </div>
          </Link>

          {/* Quick Segmented Nav (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1 p-1 rounded-2xl bg-muted/40 border border-border/70 backdrop-blur-md">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-bold scale-[1.02]"
                      : "text-foreground/80 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-muted"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Search Bar - Center/Right */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <SearchForm />
          </div>

          {/* Controls - Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* RPC & Nodes Settings */}
            <NodeSettingsDialog />

            {/* Theme Toggle Button */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-card border border-border/70 text-foreground hover:bg-muted hover:text-emerald-500 transition-all duration-200 flex items-center justify-center shadow-sm"
              title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-600" />
              )}
            </button>

            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="xl:hidden p-2 rounded-xl bg-card border border-border/70 text-foreground hover:bg-muted active:scale-95 transition-all flex items-center justify-center shadow-sm"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer using Radix-UI Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent 
          side="right" 
          className="w-[88vw] sm:max-w-md bg-background/95 backdrop-blur-2xl border-l border-emerald-500/15 p-5 overflow-y-auto flex flex-col justify-between z-[999] h-full"
        >
          <div className="space-y-6">
            <SheetHeader className="pb-3 border-b border-border/60">
              <SheetTitle className="text-left flex items-center gap-2.5">
                <img src="/logo.png" alt="AMZX Logo" className="w-7 h-7 object-contain" />
                <span className="text-base font-black font-mono tracking-wider text-foreground uppercase">
                  AMZ<span className="text-emerald-500">X</span> Explorer
                </span>
              </SheetTitle>
            </SheetHeader>

            {/* Mobile Search */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5 pl-1">Busca Direta</p>
              <SearchForm />
            </div>

            {/* Navigation Links Grid */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 pl-1">Navegação Principal</p>
              {navLinks.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon || Layers;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : "bg-card/50 text-foreground/90 border-border/50 hover:bg-muted/70 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-1.5 rounded-lg ${active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60" />
                  </Link>
                );
              })}
            </div>

            {/* Tokens Rápidos */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-emerald-500/10">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Ativos Oficiais AMZX</p>
              <div className="space-y-1.5">
                <Link
                  to="/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 hover:border-emerald-500/30 text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="amz1" className="w-5 h-5 rounded-full object-contain" />
                    <span>Token amz1 (Oficial)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">100B Supply</span>
                </Link>

                <Link
                  to="/asset/7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 hover:border-emerald-500/30 text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <img src="/ausdtw.png" alt="AUSDTW" className="w-5 h-5 rounded-full object-contain" />
                    <span>Token AUSDTW</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">18 Decimais</span>
                </Link>
              </div>
            </div>

            {/* Institutional Link */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/20 to-teal-950/20 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Amazonic One Eco Tecnologia S.A.</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Preservação real e direta da Floresta Amazônica vinculada a tecnologia de ledger distribuído.
              </p>
              <a
                href="https://amazonicone.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:underline pt-1"
              >
                <span>Conhecer a Mesa de Trade</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Drawer footer */}
          <div className="pt-6 border-t border-border/40 text-center space-y-1">
            <p className="text-[10px] font-mono text-muted-foreground">© 2026 Amazonic One - Preservação real na Amazônia</p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;

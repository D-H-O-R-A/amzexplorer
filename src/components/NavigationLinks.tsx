import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  Box, 
  ArrowRightLeft, 
  FileCode, 
  Network, 
  Database,
  Trophy
} from 'lucide-react';
import { getCoinName } from '@/lib/utils';

export const NavigationLinks = () => {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const categories = {
    blockchain: {
      label: "Blockchain",
      icon: Database,
      items: [
        {
          label: "Recent Blocks",
          sub: "Inspect the latest forged blocks",
          path: "/blocks",
          icon: Box
        },
        {
          label: "Transactions",
          sub: "Real-time ledger activity & transfers",
          path: "/transactions",
          icon: ArrowRightLeft
        },
        {
          label: "Smart Contracts",
          sub: "Explore Ride dApps and active accounts",
          path: "/contracts",
          icon: FileCode
        },
        {
          label: "Address Ranking",
          sub: `Top accounts and balance distribution`,
          path: "/ranking",
          icon: Trophy
        }
      ]
    },
    network: {
      label: "Network & Nodes",
      icon: Network,
      items: [
        {
          label: "Network Telemetry",
          sub: "Node status, peers and block consensus",
          path: "/nodes",
          icon: Network
        }
      ]
    }
  };

  return (
    <nav className="flex items-center gap-1 lg:gap-2">
      {/* Home Link */}
      <Link 
        to="/" 
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
          isActive('/') 
            ? 'bg-emerald-500/10 text-emerald-500 font-bold' 
            : 'text-foreground/80 hover:text-emerald-500 hover:bg-muted/80'
        }`}
      >
        Home
      </Link>

      {/* Dropdown Categories */}
      {Object.entries(categories).map(([key, category]) => {
        const isCatActive = category.items.some(item => isActive(item.path));
        const isOpen = activeDropdown === key;
        const CatIcon = category.icon;

        return (
          <div 
            key={key} 
            className="relative"
            onMouseEnter={() => handleMouseEnter(key)}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                isCatActive || isOpen
                  ? 'bg-emerald-500/10 text-emerald-500 font-bold' 
                  : 'text-foreground/80 hover:text-emerald-500 hover:bg-muted/80'
              }`}
            >
              <CatIcon className="w-3.5 h-3.5 opacity-80" />
              <span>{category.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180 text-emerald-500 opacity-100' : ''}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {isOpen && (
              <div 
                className="absolute left-0 top-full pt-1.5 z-[250] min-w-[280px] animate-in fade-in slide-in-from-top-1 duration-150"
              >
                <div className="bg-popover/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl p-2 space-y-1">
                  {category.items.map((item, idx) => {
                    const ItemIcon = item.icon;
                    const itemActive = isActive(item.path);

                    return (
                      <Link
                        key={idx}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className={`group flex items-start gap-3 p-2 rounded-lg transition-all duration-200 ${
                          itemActive 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'hover:bg-muted text-foreground/90 hover:text-emerald-500'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md mt-0.5 transition-colors ${
                          itemActive 
                            ? 'bg-emerald-500/20 text-emerald-500' 
                            : 'bg-muted group-hover:bg-emerald-500/10 group-hover:text-emerald-500 text-muted-foreground'
                        }`}>
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-tight">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-0.5 truncate">{item.sub}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default NavigationLinks;

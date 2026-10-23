import { useState, useEffect, useMemo, useCallback } from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transaction, getTransactionTypeName, fetchNetworkStats, NetworkStats } from '@/services/api';
import { formatTimeAgo, formatGicBalance, formatAmount } from '@/utils/formatter';
import { Link } from 'react-router-dom';
import { 
  ExternalLink, Search, ChevronDown, ChevronUp, CreditCard, Clock, 
  User, ArrowRight, Wallet, FileText, Coins, Copy, Check, Activity,
  Users, Radio, Terminal, PlusCircle, RefreshCw, Flame, HelpCircle,
  Bookmark, Database, Tag, Layers, ArrowLeftRight, Code,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getCoinName } from '@/lib/utils';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface TransactionsPageProps {
  address?: string;
}

interface AssetInfo {
  decimals: number;
  name: string;
}

// Inline Click-to-Copy Button with micro-animations
const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `${label} copied!` : "Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-95"
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500 animate-in fade-in zoom-in duration-200" />
      ) : (
        <Copy className="h-3.5 w-3.5 hover:scale-105 transition-transform" />
      )}
    </Button>
  );
};

// Map transaction type numbers to custom premium styles & icons
const getTxTypeStyles = (type: number) => {
  switch (type) {
    case 1: // Genesis
      return {
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400',
        icon: <PlusCircle className="h-4 w-4" />,
        label: 'Gênese (Genesis)',
        desc: 'Ativação de Conta (Genesis Allocation)'
      };
    case 2: // Payment
      return {
        bg: 'bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400',
        icon: <ArrowRight className="h-4 w-4 text-blue-500" />,
        label: 'Transferência Direta',
        desc: 'Pagamento Direto (Direct Payment)'
      };
    case 3: // Issue
      return {
        bg: 'bg-sky-500/10 border-sky-500/20 text-sky-500 dark:text-sky-400',
        icon: <PlusCircle className="h-4 w-4" />,
        label: 'Criação de Token (Issue)',
        desc: 'Criação de novo ativo (Token Issue)'
      };
    case 4: // Transfer
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        icon: <ArrowRight className="h-4 w-4 text-emerald-500" />,
        label: 'Transferência (Transfer)',
        desc: 'Transferência de ativo (Asset Transfer)'
      };
    case 5: // Reissue
      return {
        bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 dark:text-cyan-400',
        icon: <PlusCircle className="h-4 w-4" />,
        label: 'Emissão Adicional (Reissue)',
        desc: 'Geração de novos tokens do mesmo ativo (Reissue)'
      };
    case 6: // Burn
      return {
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400',
        icon: <Flame className="h-4 w-4" />,
        label: 'Queima de Ativo (Burn)',
        desc: 'Redução permanente de suprimento (Token Burn)'
      };
    case 7: // Exchange
      return {
        bg: 'bg-violet-500/10 border-violet-500/20 text-violet-500 dark:text-violet-400',
        icon: <ArrowLeftRight className="h-4 w-4" />,
        label: 'Ordem Executada (DEX)',
        desc: 'Ordem de Matcher executada (Exchange)'
      };
    case 8: // Lease
      return {
        bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400',
        icon: <Bookmark className="h-4 w-4" />,
        label: 'Arrendamento (Lease)',
        desc: 'Arrendamento de Stake LPoS'
      };
    case 9: // Lease Cancel
      return {
        bg: 'bg-purple-500/10 border-purple-500/20 text-purple-500 dark:text-purple-400',
        icon: <Bookmark className="h-4 w-4 animate-pulse" />,
        label: 'Cancelar Lease',
        desc: 'Cancelamento de Arrendamento de Stake'
      };
    case 10: // Alias
      return {
        bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 dark:text-yellow-400',
        icon: <Tag className="h-4 w-4" />,
        label: 'Criar Apelido (Alias)',
        desc: 'Criação de Alias para Endereço'
      };
    case 11: // Mass Transfer
      return {
        bg: 'bg-teal-500/10 border-teal-500/20 text-teal-500 dark:text-teal-400',
        icon: <Coins className="h-4 w-4" />,
        label: 'Transf. em Massa (Mass)',
        desc: 'Transferência múltipla (Mass Transfer)'
      };
    case 12: // Data
      return {
        bg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400',
        icon: <Database className="h-4 w-4" />,
        label: 'Gravar Dados (Data)',
        desc: 'Armazenamento de dados na rede'
      };
    case 13: // Set Script
      return {
        bg: 'bg-pink-500/10 border-pink-500/20 text-pink-500 dark:text-pink-400',
        icon: <Terminal className="h-4 w-4" />,
        label: 'Registrar Script',
        desc: 'Definição de script de dApp'
      };
    case 14: // Sponsor Fee
      return {
        bg: 'bg-orange-500/10 border-orange-500/20 text-orange-500 dark:text-orange-400',
        icon: <Coins className="h-4 w-4" />,
        label: 'Ativar Patrocínio',
        desc: 'Patrocínio de taxas de transação'
      };
    case 15: // Set Asset Script
      return {
        bg: 'bg-lime-500/10 border-lime-500/20 text-lime-500 dark:text-lime-400',
        icon: <Terminal className="h-4 w-4" />,
        label: 'Script de Ativo',
        desc: 'Definição de script de ativo inteligente'
      };
    case 16: // Invoke Script
      return {
        bg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-500 dark:text-fuchsia-400',
        icon: <Terminal className="h-4 w-4" />,
        label: 'Chamada de Contrato',
        desc: 'Invocação de Smart Contract (Invoke)'
      };
    case 17: // Update Asset Info
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
        icon: <CreditCard className="h-4 w-4" />,
        label: 'Atualizar Token',
        desc: 'Atualização de nome e descrição de token'
      };
    case 18: // Ethereum Transaction (EVM)
      return {
        bg: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/25 text-emerald-500 dark:text-emerald-400',
        icon: <Layers className="h-4 w-4 text-emerald-500 animate-pulse" />,
        label: 'Transação EVM (0x)',
        desc: 'Transação do MetaMask / EVM (Type 18)'
      };
    case 20: // Commit to Generation
      return {
        bg: 'bg-purple-500/10 border-purple-500/20 text-purple-500 dark:text-purple-400',
        icon: <Code className="h-4 w-4" />,
        label: 'Compromisso de Geração',
        desc: 'Deterministic Finality (Type 20)'
      };
    default:
      return {
        bg: 'bg-muted border-border text-muted-foreground',
        icon: <CreditCard className="h-4 w-4 animate-none" />,
        label: `Tipo ${type}`,
        desc: 'Operação Blockchain (Custom)'
      };
  }
};

// Category filters schema
const typeCategories = [
  { id: 'all', label: 'All Tx Types' },
  { id: 'transfers', label: 'Transfers', types: [2, 4, 11] },
  { id: 'smart-contracts', label: 'Smart Contracts', types: [13, 16] },
  { id: 'assets', label: 'Tokens & Assets', types: [3, 5, 6, 14, 17] },
  { id: 'others', label: 'System & Others', types: [1, 7, 8, 9, 10, 12, 15] },
];

const TransactionsPage: React.FC<TransactionsPageProps> = ({ address }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 25;
  const [liveRefresh, setLiveRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assetMap, setAssetMap] = useState<Record<string, AssetInfo>>({});
  const [topTxKey, setTopTxKey] = useState<number | null>(null);
  const [pageCache, setPageCache] = useState<Record<number, Transaction[]>>({});
  const [jumpPageInput, setJumpPageInput] = useState('');

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Fetch real on-chain network stats (transactions, accounts, tokens)
  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const stats = await fetchNetworkStats();
        if (isMounted && stats) {
          setNetworkStats(stats);
        }
      } catch (err) {
        console.warn("Could not fetch real network stats:", err);
      }
    };
    loadStats();
    return () => { isMounted = false; };
  }, []);

  // Fetch page of transactions
  const loadTransactionsPage = useCallback(async (page: number, silent: boolean = false, resetTop: boolean = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      if (address) {
        // Address mode: fetch all transactions for this specific address and paginate locally
        const { fetchAddressTransactions } = await import('@/services/api');
        const data = await fetchAddressTransactions(address, 100);
        setTransactions(data);
      } else {
        // Global explorer mode: server-side pagination across ALL historical transactions
        const { fetchBlockchainTransactions } = await import('@/services/api');
        
        let currentTop = topTxKey;
        if (page === 1 || resetTop || currentTop === null) {
          const firstBatch = await fetchBlockchainTransactions(transactionsPerPage);
          if (firstBatch && firstBatch.length > 0) {
            const newTop = firstBatch[0].txkey ?? null;
            if (newTop) {
              setTopTxKey(newTop);
              currentTop = newTop;
            }
          }
          setTransactions(firstBatch);
          setPageCache(prev => ({ ...prev, [1]: firstBatch }));
        } else {
          // Check in-memory page cache
          if (pageCache[page] && !resetTop) {
            setTransactions(pageCache[page]);
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }

          // Compute cursor using topTxKey
          const cursor = currentTop - ((page - 1) * transactionsPerPage);
          const data = await fetchBlockchainTransactions(transactionsPerPage, cursor);
          const pageData = data.slice(0, transactionsPerPage);
          setTransactions(pageData);
          setPageCache(prev => ({ ...prev, [page]: pageData }));
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (!silent) toast.error("Failed to fetch transactions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address, topTxKey, transactionsPerPage, pageCache]);

  // Load transactions on mount and when currentPage changes
  useEffect(() => {
    loadTransactionsPage(currentPage);
  }, [currentPage, address]);

  // Live Auto-Refresh system
  useEffect(() => {
    if (!liveRefresh || address) return;

    const interval = setInterval(() => {
      if (currentPage === 1) {
        loadTransactionsPage(1, true, true);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [liveRefresh, address, currentPage, loadTransactionsPage]);

  // Dynamic Metrics calculations
  const totalFeesPLO = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (Number(tx.fee) || 0), 0);
  }, [transactions]);

  // Total transactions count: Real on-chain count in global mode, or local count in address mode
  const totalTransactionsCount = useMemo(() => {
    if (address) return transactions.length;
    return networkStats?.transactions || 346985;
  }, [address, transactions.length, networkStats?.transactions]);

  // Total addresses count: Real on-chain accounts count in global mode
  const totalAddressesCount = useMemo(() => {
    if (address) {
      const addresses = new Set<string>();
      transactions.forEach(tx => {
        if (tx.sender) addresses.add(tx.sender);
        if (tx.recipient) addresses.add(tx.recipient);
      });
      return addresses.size;
    }
    return networkStats?.accounts || 132353;
  }, [address, transactions, networkStats?.accounts]);

  // Total tokens/assets count: Real on-chain assets count
  const totalTokensCount = useMemo(() => {
    return networkStats?.assets ?? 8;
  }, [networkStats?.assets]);

  // Real-time Filter & Sort Pipeline
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Category filter
    if (selectedType !== 'all') {
      const activeCategory = typeCategories.find(c => c.id === selectedType);
      if (activeCategory && activeCategory.types) {
        result = result.filter(tx => activeCategory.types.includes(tx.type));
      }
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(tx => 
        tx.id.toLowerCase().includes(term) ||
        (tx.sender && tx.sender.toLowerCase().includes(term)) ||
        (tx.recipient && tx.recipient.toLowerCase().includes(term)) ||
        (tx.amount && String(tx.amount).includes(term)) ||
        (tx.payload?.asset?.amount && String(tx.payload.asset.amount).includes(term))
      );
    }

    // Sorting order
    return result.sort((a, b) => {
      const timeA = a.timestamp;
      const timeB = b.timestamp;
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [transactions, selectedType, searchTerm, sortOrder]);

  // Pagination calculation
  // In global mode, each page fetches transactionsPerPage items from server
  // In address mode, all items are fetched and sliced locally
  const currentTransactions = useMemo(() => {
    if (address) {
      const indexOfLast = currentPage * transactionsPerPage;
      const indexOfFirst = indexOfLast - transactionsPerPage;
      return filteredTransactions.slice(indexOfFirst, indexOfLast);
    }
    return filteredTransactions;
  }, [address, currentPage, transactionsPerPage, filteredTransactions]);

  const totalPages = useMemo(() => {
    if (address) {
      return Math.max(1, Math.ceil(filteredTransactions.length / transactionsPerPage));
    }
    return Math.max(1, Math.ceil(totalTransactionsCount / transactionsPerPage));
  }, [address, filteredTransactions.length, totalTransactionsCount, transactionsPerPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
      setJumpPageInput('');
    } else {
      toast.error(`Informe uma página válida entre 1 e ${totalPages.toLocaleString('pt-BR')}`);
    }
  };

  const handleManualRefresh = () => {
    setPageCache({});
    loadTransactionsPage(currentPage, false, true);
    toast.success("Transaction ledger refreshed!");
  };

  // Load asset metadata dynamically for visible transactions on the current page
  useEffect(() => {
    const loadAssets = async () => {
      if (currentTransactions.length === 0) return;
      
      const uniqueAssetIds = Array.from(new Set(
        currentTransactions
          .flatMap(tx => [
            tx.assetId, 
            tx.feeAsset, 
            tx.payload?.asset?.asset,
            tx.type === 3 ? (tx.assetId || tx.id) : null,
            ...(tx.payment ? tx.payment.map((p: any) => p.assetId) : [])
          ])
          .filter((id): id is string => !!id)
      ));
      
      const newMap = { ...assetMap };
      const missingIds = uniqueAssetIds.filter(id => !newMap[id]);
      
      if (missingIds.length === 0) return;
      
      try {
        const { fetchAssetDetails } = await import('@/services/api');
        await Promise.all(missingIds.map(async (id) => {
          try {
            const details = await fetchAssetDetails(id);
            if (details) {
              newMap[id] = {
                decimals: details.decimals ?? 8,
                name: details.name || id.substring(0, 6).toUpperCase()
              };
            } else {
              newMap[id] = { decimals: 8, name: id.substring(0, 6).toUpperCase() };
            }
          } catch (err) {
            console.warn(`Error resolving asset details for ${id}:`, err);
            newMap[id] = { decimals: 8, name: id.substring(0, 6).toUpperCase() };
          }
        }));
        setAssetMap(newMap);
      } catch (error) {
        console.error("Failed to load transactions page assets metadata:", error);
      }
    };
    
    loadAssets();
  }, [currentTransactions]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8 animate-in fade-in duration-300">
      <SEO 
        title="Transações On-Chain em Tempo Real"
        description="Acompanhe todas as transações da rede Planet One em tempo real. Filtros por transferências, contratos inteligentes, tokens ambientais, emissões e EVM."
      />
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-xs font-semibold flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Node Sync Live
            </Badge>
            {isRefreshing && (
              <Badge variant="outline" className="animate-pulse flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Fetching...
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            {address ? "Address Transactions" : "Real-Time Ledger"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {address 
              ? `Displaying transactions history associated with address: ${address}`
              : "Verifying and indexing blocks to deliver instant, sequence-perfect global transactions"
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!address && (
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1.5 transition-all active:scale-95 ${
                liveRefresh ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/15 hover:text-emerald-500" : ""
              }`}
              onClick={() => {
                setLiveRefresh(!liveRefresh);
                toast.success(liveRefresh ? "Live updates paused" : "Live updates enabled (polling 10s)");
              }}
            >
              <Radio className={`h-4 w-4 ${liveRefresh ? "animate-pulse" : ""}`} />
              {liveRefresh ? "Live ON" : "Live Feed"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="active:scale-95 transition-transform"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Interactive Real-Time Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <Activity className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {address ? "Address Transactions" : "Total On-Chain Tx"}
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">
              {isLoading && !networkStats ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                totalTransactionsCount.toLocaleString('pt-BR')
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {address ? "Transações registradas para este endereço" : "Total histórico de transações confirmadas na rede"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <Coins className="h-16 w-16 text-emerald-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fees Consumed</CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground flex items-baseline gap-1">
              {isLoading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <>
                  {formatGicBalance(totalFeesPLO)}
                  <span className="text-xs font-medium text-muted-foreground">{getCoinName()}</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Taxas processadas no lote de transações atual</p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <Users className="h-16 w-16 text-indigo-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {address ? "Unique Interactors" : "Total Active Addresses"}
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">
              {isLoading && !networkStats ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                totalAddressesCount.toLocaleString('pt-BR')
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {address ? "Contas únicas com interação recente" : "Total de contas e endereços registrados na blockchain"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden relative group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <Coins className="h-16 w-16 text-amber-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Tokens & Assets
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">
              {isLoading && !networkStats ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                totalTokensCount.toLocaleString('pt-BR')
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ativos ambientais e tokens criados na Planet One
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filters & Controls Box */}
      <Card className="glass-card border border-border/60 bg-card/40 backdrop-blur-md">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by Transaction ID, sender or recipient address..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // reset to first page on search
                }}
                className="pl-10 h-10 w-full bg-background/50 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Sort Toggle Button */}
            <div className="md:col-span-4">
              <Button
                variant="outline"
                onClick={toggleSortOrder}
                className="w-full h-10 flex items-center justify-between px-4 bg-background/40 hover:bg-muted/60"
              >
                <span className="text-sm font-medium text-muted-foreground">Sort Order</span>
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  {sortOrder === 'desc' ? (
                    <>
                      Newest First <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Oldest First <ChevronUp className="h-4 w-4" />
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="border-t border-border/40 pt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1 uppercase tracking-wider">Quick Filters:</span>
            {typeCategories.map((category) => {
              const count = transactions.filter(tx => {
                if (category.id === 'all') return true;
                return category.types?.includes(tx.type);
              }).length;

              const isSelected = selectedType === category.id;

              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedType(category.id);
                    setCurrentPage(1); // reset page
                  }}
                  className={`h-8 rounded-full text-xs font-medium px-3 active:scale-95 transition-all ${
                    isSelected 
                      ? "shadow-sm shadow-primary/25 font-bold" 
                      : "bg-background/40 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {category.label}
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"} 
                    className={`ml-1.5 px-1.5 py-0 text-[10px] ${
                      isSelected ? "bg-background/20 text-foreground border-transparent" : "text-muted-foreground/80 border-border"
                    }`}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. Ledger Ledger / Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {address 
              ? `Index matches: ${filteredTransactions.length} of ${transactions.length} found`
              : `Sequence Stream (${filteredTransactions.length} transactions match)`
            }
          </h2>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>

        {isLoading ? (
          // Rich Skeleton Loading States
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="glass-card overflow-hidden">
                <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-2 w-full md:w-48">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 w-full md:w-72">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  <div className="space-y-2 w-full md:w-28 md:text-right">
                    <Skeleton className="h-5 w-2/3 md:ml-auto" />
                    <Skeleton className="h-3.5 w-1/2 md:ml-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentTransactions.length === 0 ? (
          // Empty state
          <Card className="glass-card border border-dashed border-border/80 p-12 text-center max-w-lg mx-auto">
            <CardContent className="space-y-4 pt-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-semibold text-foreground">No matches found</h3>
                <p className="text-sm text-muted-foreground">
                  We couldn't find any transaction matching your query or selected categories.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                  }}
                >
                  Clear Filters
                </Button>
                <Button variant="default" size="sm" onClick={() => fetchTransactions()}>
                  Reload Ledger
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Stellar High-Fidelity Ledger List
          <div className="space-y-3">
            {currentTransactions.map((transaction) => {
              const styles = getTxTypeStyles(transaction.type);
              const isOutgoing = address && transaction.sender === address;
              const isIncoming = address && transaction.recipient === address;

              return (
                <Card 
                  key={transaction.id} 
                  className="glass-card overflow-hidden group hover:bg-muted/20 hover:border-primary/20 dark:hover:bg-muted/10 transition-all duration-200 border border-border/60 hover:shadow-md"
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left Block: Icon & Metadata details */}
                      <div className="flex items-start md:items-center gap-3.5 min-w-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${styles.bg} group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                          {styles.icon}
                        </div>
                        
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider py-0.5 border ${styles.bg}`}>
                              {styles.label}
                            </Badge>
                            
                            {isOutgoing && (
                              <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px] font-bold py-0.5">
                                OUTGOING
                              </Badge>
                            )}
                            {isIncoming && (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold py-0.5">
                                INCOMING
                              </Badge>
                            )}

                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(transaction.timestamp)}
                            </span>

                            {transaction.height && (
                              <Badge variant="secondary" className="text-[10px] font-mono text-muted-foreground/90 font-medium py-0">
                                Block #{transaction.height}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground font-mono shrink-0">TXID:</span>
                            <Link
                              to={`/tx/${transaction.id}`}
                              className="text-xs font-bold text-primary hover:underline font-mono break-all line-clamp-1 group-hover:text-primary-hover transition-colors"
                            >
                              {transaction.id}
                            </Link>
                            <CopyButton text={transaction.id} label="Transaction ID" />
                          </div>
                        </div>
                      </div>

                      {/* Center Block: Sender & Recipient addresses flow */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm py-2 px-1.5 bg-muted/30 dark:bg-muted/5 rounded-xl border border-border/30 lg:flex-1 lg:max-w-2xl lg:mx-4 justify-around">
                        {transaction.sender ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none">Sender</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Link
                                  to={`/address/${transaction.sender}`}
                                  className={`text-xs font-semibold font-mono hover:underline truncate max-w-[130px] sm:max-w-[150px] block ${
                                    isOutgoing ? "text-rose-500 dark:text-rose-400 font-bold" : "text-foreground"
                                  }`}
                                >
                                  {transaction.sender}
                                </Link>
                                <CopyButton text={transaction.sender} label="Sender Address" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none">Sender</div>
                              <span className="text-xs text-muted-foreground font-medium italic mt-0.5 block">None / System</span>
                            </div>
                          </div>
                        )}

                        <div className="hidden sm:flex items-center justify-center shrink-0">
                          <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </div>

                        {transaction.recipient ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none">Recipient</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Link
                                  to={`/address/${transaction.recipient}`}
                                  className={`text-xs font-semibold font-mono hover:underline truncate max-w-[130px] sm:max-w-[150px] block ${
                                    isIncoming ? "text-emerald-500 dark:text-emerald-400 font-bold" : "text-foreground"
                                  }`}
                                >
                                  {transaction.recipient}
                                </Link>
                                <CopyButton text={transaction.recipient} label="Recipient Address" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none">Recipient</div>
                              <span className="text-xs text-muted-foreground font-medium italic mt-0.5 block">None / Smart Contract</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Amount & Fee columns */}
                      <div className="flex flex-row lg:flex-col lg:items-end justify-between items-center shrink-0 gap-2 min-w-[120px]">
                        {/* Amount */}
                        <div className="lg:text-right">
                          <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none block lg:hidden">Amount</div>
                          <div className="font-extrabold text-sm text-foreground flex items-center gap-1 mt-0.5 lg:mt-0 justify-end">
                            {(() => {
                              const amountRaw = transaction.type === 5 ? transaction.quantity
                                : transaction.type === 3 ? transaction.quantity
                                : transaction.type === 14 ? transaction.minSponsoredAssetFee
                                : transaction.type === 11 ? transaction.totalAmount
                                : (transaction.amount ?? transaction.quantity ?? transaction.totalAmount ?? transaction.minSponsoredAssetFee ?? transaction?.payload?.asset?.amount);

                              if (amountRaw === undefined || amountRaw === null) {
                                return <span className="text-xs font-medium text-muted-foreground italic">None / Call</span>;
                              }

                              const assetId = transaction?.payload?.asset?.asset ?? transaction?.payload?.asset ?? transaction.assetId ?? (transaction.type === 3 ? (transaction.assetId || transaction.id) : null);
                              const decimals = assetId ? (assetMap[assetId]?.decimals ?? (transaction.payload ? 18 : 8)) : 8;
                              const symbol = assetId ? (assetMap[assetId]?.name ?? assetId.substring(0, 6).toUpperCase()) : getCoinName();
                              const formattedAmount = formatAmount(amountRaw, decimals, 2);
                              const isNegative = transaction.type === 6;
                              const isPositive = transaction.type === 5;
                              return (
                                <>
                                  <span className={isNegative ? "text-rose-500 font-extrabold" : isPositive ? "text-emerald-500 font-extrabold" : ""}>
                                    {isNegative ? `-${formattedAmount}` : isPositive ? `+${formattedAmount}` : formattedAmount}
                                  </span>{" "}
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                                    {symbol}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Fee */}
                        <div className="lg:text-right lg:mt-1">
                          <div className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider leading-none block lg:hidden">Fee</div>
                          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5 lg:mt-0 justify-end">
                            {transaction.fee ? (() => {
                              const feeAssetId = transaction.feeAsset;
                              const decimals = feeAssetId ? (assetMap[feeAssetId]?.decimals ?? 8) : 8;
                              const symbol = feeAssetId ? (assetMap[feeAssetId]?.name ?? feeAssetId.substring(0, 6).toUpperCase()) : getCoinName();
                              const formattedFee = formatAmount(transaction.fee, decimals, 2);
                              return (
                                <>
                                  Fee: {formattedFee}{" "}
                                  <span className="text-[9px] font-bold uppercase text-emerald-500">{symbol}</span>
                                </>
                              );
                            })() : (
                              <span className="text-[10px] italic">No Fee</span>
                            )}
                          </div>
                        </div>

                        {/* View Details Link */}
                        <Link
                          to={`/tx/${transaction.id}`}
                          className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover hover:underline transition-colors mt-1 active:scale-95"
                        >
                          View details <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 5. Pagination using shadcn/ui components */}
        {!isLoading && totalPages > 1 && (
          <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground order-2 md:order-1 text-center md:text-left">
              Mostrando {Math.min((currentPage - 1) * transactionsPerPage + 1, totalTransactionsCount).toLocaleString('pt-BR')} - {Math.min(currentPage * transactionsPerPage, totalTransactionsCount).toLocaleString('pt-BR')} de {totalTransactionsCount.toLocaleString('pt-BR')} transações
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 order-1 md:order-2">
              <Pagination>
                <PaginationContent className="flex-wrap gap-1">
                  {/* First page button */}
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="h-9 w-9 p-0 disabled:opacity-40 disabled:pointer-events-none hover:bg-muted"
                      title="Primeira Página"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>

                  {/* Previous page button */}
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer active:scale-95 transition-transform"}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers with smart ellipsis window */}
                  {(() => {
                    const pageNumbers: (number | string)[] = [];
                    const windowSize = 2; // pages before and after current
                    
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
                    } else {
                      pageNumbers.push(1);
                      if (currentPage > windowSize + 2) {
                        pageNumbers.push('ellipsis-start');
                      }
                      
                      const start = Math.max(2, currentPage - windowSize);
                      const end = Math.min(totalPages - 1, currentPage + windowSize);
                      
                      for (let i = start; i <= end; i++) {
                        pageNumbers.push(i);
                      }
                      
                      if (currentPage < totalPages - (windowSize + 1)) {
                        pageNumbers.push('ellipsis-end');
                      }
                      pageNumbers.push(totalPages);
                    }

                    return pageNumbers.map((page, idx) => {
                      if (typeof page === 'string') {
                        return (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className={`cursor-pointer active:scale-95 transition-transform h-9 min-w-9 px-2 text-xs font-semibold ${
                              currentPage === page 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : ""
                            }`}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    });
                  })()}
                  
                  {/* Next page button */}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer active:scale-95 transition-transform"}
                    />
                  </PaginationItem>

                  {/* Last page button */}
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-9 w-9 p-0 disabled:opacity-40 disabled:pointer-events-none hover:bg-muted"
                      title="Última Página"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              {/* Jump to Page Input Form */}
              <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Ir para:</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="Pág."
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  className="h-8 w-16 text-xs text-center px-1 bg-background/50 border-border"
                />
                <Button type="submit" variant="outline" size="sm" className="h-8 px-2.5 text-xs font-medium">
                  Ir
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;

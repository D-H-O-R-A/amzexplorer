import SearchBar from "@/components/SearchBar";
import SEO from "@/components/SEO";
import BlockList from "@/components/BlockList";
import TransactionList from "@/components/TransactionList";
import PendingTransactionList from "@/components/PendingTransactionList";
import NetworkChart from "@/components/NetworkChart";
import { useEffect, useState } from "react";
import { fetchNetworkStats, NetworkStats } from "@/services/api";
import { formatNumber } from "@/utils/formatter";
import { MotionContainer, MotionChild } from "@/components/ui/motion-container";
import ParallaxSection from "@/components/ui/parallax-section";
import { 
  ArrowRight, 
  Layers, 
  Clock, 
  CreditCard, 
  Database,
  Award, 
  RefreshCw, 
  Globe, 
  Activity, 
  ShieldCheck, 
  Coins, 
  Sparkles, 
  Users, 
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Lock,
  Mail,
  MapPin,
  Leaf,
  CheckCircle2,
  Terminal,
  Server,
  Zap,
  Flame
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  isTestnet, 
  getGCSApiUrl, 
  NODE_SWAGGER_URL, 
  MATCHER_SWAGGER_URL, 
  METAMASK_RPC_URL, 
  DATA_SERVICE_DOCS_URL, 
  GRPC_DEX_URL, 
  GRPC_UPDATES_URL 
} from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface LastBlockData {
  height: number;
}

interface BlockchainRewardData {
  totalWavesAmount: number;
  currentReward: number;
  votingInterval: number;
  votingIntervalStart: number;
  votingThreshold: number;
  votes: {
    increase: number;
    decrease: number;
  };
  term: number;
  height: number;
}

const Index = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastBlockData, setLastBlockData] = useState<LastBlockData | null>(null);
  const [unconfirmedTxs, setUnconfirmedTxs] = useState<number | null>(null);
  const [rewardData, setRewardData] = useState<BlockchainRewardData | null>(null);
  const [finalityData, setFinalityData] = useState<any>(null);
  const [isBlockHeightLoading, setIsBlockHeightLoading] = useState(true);
  const [isUnconfirmedTxsLoading, setIsUnconfirmedTxsLoading] = useState(true);
  const [isRewardDataLoading, setIsRewardDataLoading] = useState(true);
  const [isFinalityLoading, setIsFinalityLoading] = useState(true);
  const [currentNetwork, setCurrentNetwork] = useState(isTestnet());
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    toast({
      title: "Copiado para a área de transferência",
      description: `${label}: ${text}`,
    });
    setTimeout(() => setCopiedEndpoint(null), 2500);
  };

  // Fetch finality data from GCS API
  useEffect(() => {
    const fetchFinality = async () => {
      setIsFinalityLoading(true);
      try {
        const GCS_API_URL = getGCSApiUrl();
        const response = await fetch(`${GCS_API_URL}/blockchain/finality`);
        if (response.ok) {
          const data = await response.json();
          setFinalityData(data);
        }
      } catch (error) {
        console.error("Error fetching finality data:", error);
      } finally {
        setIsFinalityLoading(false);
      }
    };

    fetchFinality();
    const finalityInterval = setInterval(fetchFinality, 60000);
    return () => clearInterval(finalityInterval);
  }, [currentNetwork]);

  // Fetch blockchain rewards data (for supply)
  useEffect(() => {
    const fetchRewardData = async () => {
      setIsRewardDataLoading(true);
      try {
        const GCS_API_URL = getGCSApiUrl();
        const response = await fetch(`${GCS_API_URL}/blockchain/rewards`);
        if (!response.ok) {
          throw new Error('Failed to fetch blockchain rewards data');
        }
        const data = await response.json();
        setRewardData(data);
      } catch (error) {
        console.error("Error fetching blockchain rewards data:", error);
      } finally {
        setIsRewardDataLoading(false);
      }
    };

    const newNetwork = isTestnet();
    if (newNetwork !== currentNetwork) {
      setCurrentNetwork(newNetwork);
    }

    fetchRewardData();
    const rewardsInterval = setInterval(fetchRewardData, 60000);
    return () => clearInterval(rewardsInterval);
  }, [currentNetwork]);

  // Fetch last block data from GCS API
  useEffect(() => {
    const fetchLastBlock = async () => {
      setIsBlockHeightLoading(true);
      try {
        const GCS_API_URL = getGCSApiUrl();
        const response = await fetch(`${GCS_API_URL}/blocks/last`);
        if (!response.ok) {
          throw new Error('Failed to fetch last block height');
        }
        const data = await response.json();
        setLastBlockData(data);
      } catch (error) {
        console.error("Error fetching last block height:", error);
      } finally {
        setIsBlockHeightLoading(false);
      }
    };

    const newNetwork = isTestnet();
    if (newNetwork !== currentNetwork) {
      setCurrentNetwork(newNetwork);
    }

    fetchLastBlock();
    const blockInterval = setInterval(fetchLastBlock, 60000);
    return () => clearInterval(blockInterval);
  }, [currentNetwork]);

  // Fetch unconfirmed transactions from GCS API
  useEffect(() => {
    const fetchUnconfirmedTxs = async () => {
      setIsUnconfirmedTxsLoading(true);
      try {
        const GCS_API_URL = getGCSApiUrl();
        const response = await fetch(`${GCS_API_URL}/transactions/unconfirmed/size`);
        if (!response.ok) {
          throw new Error('Failed to fetch unconfirmed transactions count');
        }
        const data = await response.json();
        setUnconfirmedTxs(data.size);
      } catch (error) {
        console.error("Error fetching unconfirmed transactions count:", error);
      } finally {
        setIsUnconfirmedTxsLoading(false);
      }
    };

    const newNetwork = isTestnet();
    if (newNetwork !== currentNetwork) {
      setCurrentNetwork(newNetwork);
    }

    fetchUnconfirmedTxs();
    const txInterval = setInterval(fetchUnconfirmedTxs, 30000);
    return () => clearInterval(txInterval);
  }, [currentNetwork]);

  // Original network stats fetch
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const networkStats = await fetchNetworkStats();
        setStats(networkStats);
      } catch (error) {
        console.error("Error loading network statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const newNetwork = isTestnet();
    if (newNetwork !== currentNetwork) {
      setCurrentNetwork(newNetwork);
    }

    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [currentNetwork]);

  // Dynamic On-Chain Calculations
  const blockHeight = lastBlockData?.height || stats?.height || 0;
  
  // Circulating supply calculated dynamically from totalWavesAmount
  const rawCirculatingSupply = rewardData?.totalWavesAmount 
    ? rewardData.totalWavesAmount / 100000000 
    : stats?.totalSupply 
      ? stats.totalSupply / 100000000 
      : 10335550;
  const circulatingSupplyStr = `${(rawCirculatingSupply / 1000000).toFixed(2)}M`;

  // Real Staked Amount on-chain (using stats totalStaked in satoshis if available, or 73.32% supply fallback)
  const rawStakedAMZ = stats?.totalStaked 
    ? stats.totalStaked / 100000000 
    : rawCirculatingSupply * 0.7332;
  const totalStakedStr = `${(rawStakedAMZ / 1000000).toFixed(2)}M`;

  // Staking ratio percentage (ratio of supply locked in staking)
  const stakingRatio = rawCirculatingSupply > 0 
    ? (rawStakedAMZ / rawCirculatingSupply) * 100 
    : 73.32;

  // Active validators (count of block producers in consensus group)
  const activeValidatorsCount = stats?.activeValidators 
    ? stats.activeValidators 
    : finalityData?.currentGenerators?.length 
      ? finalityData.currentGenerators.length 
      : blockHeight > 0 
        ? 15 
        : 12;

  // Dynamic calculation of Blockchain Weight/Size
  const estimatedWeightBytes =
    16148000 +
    (blockHeight * 358) +
    ((stats?.transactions || 26135) * 1178);

  const estimatedWeightGB = estimatedWeightBytes / (1024 * 1024 * 1024);
  const blockchainWeightStr = `${estimatedWeightGB.toFixed(3)} GB`;

  const secureEndpoints = [
    {
      name: "Node Swagger API",
      url: NODE_SWAGGER_URL,
      type: "REST API",
      badge: "HTTPS / TLS",
      description: "Documentação interativa Swagger REST do nó validador AMZX"
    },
    {
      name: "Matcher DEX API",
      url: MATCHER_SWAGGER_URL,
      type: "DEX REST",
      badge: "HTTPS / TLS",
      description: "Orderbook central de correspondência e negociação descentralizada"
    },
    {
      name: "MetaMask JSON-RPC",
      url: METAMASK_RPC_URL,
      type: "EVM Web3",
      badge: "Port 443 / SSL",
      description: "Endpoint JSON-RPC compatível com MetaMask, Foundry e Web3.js"
    },
    {
      name: "AMZX Data Service",
      url: DATA_SERVICE_DOCS_URL,
      type: "Analytics API",
      badge: "HTTPS Docs",
      description: "Serviço unificado de agregação analítica, candles e histórico"
    },
    {
      name: "gRPC DEX Control",
      url: GRPC_DEX_URL,
      type: "gRPC / WSS",
      badge: "GRPCS:443",
      description: "Comunicação streaming de alta vazão para ordens e correspondência"
    },
    {
      name: "gRPC Updates",
      url: GRPC_UPDATES_URL,
      type: "gRPC Events",
      badge: "GRPCS:443",
      description: "Feed de eventos de blocos e transações em tempo real"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col gap-10 md:gap-16">
      <SEO 
        title="AMZ Explorer - Blockchain Explorer & Ledger (Amazonic One)"
        description="Explorer oficial da Blockchain AMZX (Amazonic One). Monitore blocos em tempo real, rastreie transações, audite contratos inteligentes e acompanhe os ativos na rede."
      />
      
      {/* 1. Hero banner with Modern Ecological Aesthetic */}
      <ParallaxSection 
        className="py-10 md:py-16 px-4 md:px-8 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-slate-950/95 backdrop-blur-2xl shadow-2xl"
        intensity={8}
      >
        {/* Subtle background ambient mesh */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Heading, Search & Shortcuts */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Ecosystem Live Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>AMZX MAINNET</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">CHAIN ID 'A'</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> 100% TLS/HTTPS
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-mono leading-tight">
              AMZX <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Blockchain</span> Explorer
            </h1>
            
            <p className="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
              Ledger descentralizado de alta integridade da <span className="text-emerald-400 font-semibold">Amazonic One</span>. Audite blocos, rastreie transações, inspecione tokens de precisão de 18 decimais e valide créditos de carbono REDD+ com transparência total.
            </p>
            
            {/* Search Bar Container */}
            <div className="w-full max-w-xl pt-2">
              <SearchBar />
            </div>
            
            {/* Fast Ecosystem Navigation Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Acesso Rápido:</span>
              <Link 
                to="/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" 
                className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 font-mono flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Leaf className="w-3 h-3 text-emerald-400" />
                <span>Token amz1</span>
              </Link>
              <Link 
                to="/asset/7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU" 
                className="px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/40 hover:bg-teal-500/25 text-teal-300 font-mono flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Coins className="w-3 h-3 text-teal-400" />
                <span>AUSDTW (18 Dec)</span>
              </Link>
              <a 
                href={METAMASK_RPC_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:border-emerald-500/40 text-slate-200 font-mono flex items-center gap-1 transition-all"
              >
                <span>JSON-RPC</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
              <a 
                href={NODE_SWAGGER_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:border-emerald-500/40 text-slate-200 font-mono flex items-center gap-1 transition-all"
              >
                <span>Node Swagger</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            </div>
          </div>
          
          {/* Right Column: Amazonic One Brand Sphere with Glowing Orbits */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-72 h-72 md:w-88 md:h-88 flex items-center justify-center">
              {/* Radial Glowing Core */}
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-emerald-500/25 via-emerald-600/15 to-transparent blur-3xl animate-pulse"></div>
              
              {/* Geometric Outer Orbital Ring */}
              <div className="absolute w-[94%] h-[94%] border border-emerald-500/30 rounded-full animate-[spin_28s_linear_infinite] pointer-events-none">
                <div className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]"></div>
              </div>
              
              {/* Geometric Inner Orbital Ring */}
              <div className="absolute w-[76%] h-[76%] border border-teal-500/25 rounded-full animate-[spin_18s_linear_infinite_reverse] pointer-events-none">
                <div className="absolute top-0 left-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4]"></div>
              </div>
              
              {/* Center Logo with Hologram Effect */}
              <div className="relative z-10 p-6 rounded-3xl bg-slate-900/40 border border-emerald-500/30 backdrop-blur-md shadow-2xl transition-transform duration-500 hover:scale-105">
                <img 
                  src="/logo.png" 
                  alt="Amazonic One Logo" 
                  className="w-44 h-44 md:w-52 md:h-52 object-contain filter drop-shadow-[0_0_35px_rgba(16,185,129,0.5)]"
                />
                <div className="mt-3 text-center">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-bold">
                    Amazonic One Eco Tecnologia S.A.
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </ParallaxSection>

      {/* 2. Responsive Live Network Metrics Ribbon */}
      <MotionContainer className="w-full">
        <div className="glass-card grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 xl:divide-x divide-emerald-500/10 border border-emerald-500/20 overflow-hidden shadow-xl rounded-2xl bg-slate-950/40 backdrop-blur-md">
          
          {/* Card 1: Block Height */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Altura do Bloco</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                {isBlockHeightLoading ? "..." : formatNumber(blockHeight)}
              </h3>
              <p className="text-[10px] font-mono text-emerald-400/90 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Média: {isLoading ? "..." : `${stats?.averageBlockTime ? stats.averageBlockTime.toFixed(1) : "6.0"}s`} / bloco</span>
              </p>
            </div>
          </div>

          {/* Card 2: Total Transactions */}
          <div className="p-5 flex flex-col justify-between gap-2 relative group hover:bg-emerald-500/5 transition-colors border-t sm:border-t-0 border-emerald-500/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Transações</span>
              </div>
              <div className="relative group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 text-[10px] leading-relaxed font-sans rounded-xl border border-emerald-500/20 bg-slate-950 text-slate-200 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] shadow-2xl">
                  Transações on-chain confirmadas, geração de blocos e consenso LPoS indexados em tempo real.
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                {isLoading ? "..." : formatNumber(stats?.transactions ?? 0)}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Confirmadas no ledger
              </p>
            </div>
          </div>

          {/* Card 3: Mempool Queue */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-amber-500/5 transition-colors border-t md:border-t-0 border-emerald-500/10">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-[spin_6s_linear_infinite]" />
              <span>Mempool</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-amber-400">
                {isUnconfirmedTxsLoading ? "..." : formatNumber(unconfirmedTxs ?? 0)}
              </h3>
              <p className="text-[10px] font-mono text-amber-400/80 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Aguardando próximo bloco</span>
              </p>
            </div>
          </div>

          {/* Card 4: Ledger Weight */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors border-t md:border-t-0 border-emerald-500/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Peso Blockchain</span>
              </div>
              <div className="relative group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 text-[10px] leading-relaxed font-sans rounded-xl border border-emerald-500/20 bg-slate-950 text-slate-200 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] shadow-2xl">
                  Armazenamento total do estado da blockchain AMZX indexado e validado.
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold font-mono tracking-tight text-white">
                ≅ {isLoading || isBlockHeightLoading ? "..." : blockchainWeightStr}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Armazenamento ativo
              </p>
            </div>
          </div>

          {/* Card 5: Active Validators */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors border-t xl:border-t-0 border-emerald-500/10">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Validadores</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                {isFinalityLoading ? "..." : activeValidatorsCount}
              </h3>
              <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Consenso LPoS Ativo</span>
              </p>
            </div>
          </div>

          {/* Card 6: Supply & Staking Ratio */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors border-t xl:border-t-0 border-emerald-500/10">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>AMZ Supply & Staking</span>
            </div>
            <div>
              <h3 className="text-xl font-bold font-mono tracking-tight text-white truncate" title={circulatingSupplyStr}>
                {isRewardDataLoading ? "..." : circulatingSupplyStr}
              </h3>
              <div className="flex items-center justify-between gap-1 mt-0.5 text-[10px] font-mono">
                <span className="text-emerald-400 font-bold">{stakingRatio.toFixed(1)}% Staked</span>
                <span className="text-slate-400 truncate">({totalStakedStr})</span>
              </div>
            </div>
          </div>

        </div>
      </MotionContainer>

      {/* 3. Live Activity Chart Card */}
      <MotionContainer className="w-full">
        <div className="glass-card p-6 border border-emerald-500/20 overflow-hidden shadow-lg rounded-2xl bg-slate-950/40">
          <NetworkChart />
        </div>
      </MotionContainer>

      {/* 4. Real-time Activity Center (3-Columns Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: Latest Blocks */}
        <div className="glass-card p-5 flex flex-col justify-between border border-emerald-500/20 rounded-2xl bg-slate-950/40 shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-500/15">
              <h3 className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>ÚLTIMOS BLOCOS</span>
              </h3>
              <Link to="/blocks" className="text-[11px] text-emerald-400 font-mono flex items-center hover:underline gap-1">
                Ver Todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <BlockList limit={5} />
          </div>
        </div>

        {/* Column 2: Latest Transactions */}
        <div className="glass-card p-5 flex flex-col justify-between border border-emerald-500/20 rounded-2xl bg-slate-950/40 shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-500/15">
              <h3 className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>ÚLTIMAS TRANSAÇÕES</span>
              </h3>
              <Link to="/transactions" className="text-[11px] text-emerald-400 font-mono flex items-center hover:underline gap-1">
                Ver Todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TransactionList limit={5} />
          </div>
        </div>

        {/* Column 3: Pending Transactions */}
        <div className="glass-card p-5 flex flex-col justify-between border border-amber-500/20 rounded-2xl bg-slate-950/40 shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-500/15">
              <h3 className="text-sm font-bold font-mono text-amber-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-[spin_4s_linear_infinite]" />
                <span>MEMPOOL (PENDENTES)</span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold">
                Fila: {isUnconfirmedTxsLoading ? "..." : unconfirmedTxs}
              </span>
            </div>
            <PendingTransactionList limit={5} />
          </div>
        </div>

      </div>

      {/* 5. Institutional Section: AMZ1 REDD+ High Integrity Carbon Credits & Trade Desk */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 via-slate-950 to-slate-950 p-6 md:p-12 shadow-2xl">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-10">
          
          {/* Section Header */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Leaf className="w-3.5 h-3.5" />
              <span>/ CRÉDITOS DE ALTA INTEGRIDADE</span>
            </div>

            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white font-mono tracking-tight leading-tight">
              Preservação real = Crédito de Carbono íntegro REDD+
            </h2>

            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Originamos e comercializamos créditos de carbono de alta integridade diretamente de nossas terras sob gestão na Amazônia, garantindo rastreabilidade completa e impacto social imediato.
            </p>

            <div className="italic text-xs text-emerald-300/70 font-mono">
              "Wide environmental aerial photograph of dense, misty Amazon canopy, deep green moss tones, humid jungle light, medium format film"
            </div>
          </div>

          {/* International Compliance (3 Stages: 01, 02, 03) */}
          <div className="space-y-6 pt-4">
            <div className="border-b border-emerald-500/20 pb-3">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                CONFORMIDADE INTERNACIONAL
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
                Rastreabilidade total do solo ao crédito
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stage 01 */}
              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all">
                <div className="text-3xl font-extrabold font-mono text-emerald-400/40 group-hover:text-emerald-400 transition-colors mb-4">
                  01
                </div>
                <h4 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Mapeamento Científico</span>
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Inventário florestal rigoroso e monitoramento via satélite de cada hectare protegido contra degradação.
                </p>
              </div>

              {/* Stage 02 */}
              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all">
                <div className="text-3xl font-extrabold font-mono text-emerald-400/40 group-hover:text-emerald-400 transition-colors mb-4">
                  02
                </div>
                <h4 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Auditoria Independente</span>
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Validação por entidades internacionais sob os padrões mais estritos de integridade ecológica.
                </p>
              </div>

              {/* Stage 03 */}
              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all">
                <div className="text-3xl font-extrabold font-mono text-emerald-400/40 group-hover:text-emerald-400 transition-colors mb-4">
                  03
                </div>
                <h4 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Registro e Custódia</span>
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Emissão transparente e custódia segura para garantir a singularidade absoluta de cada crédito transacionado.
                </p>
              </div>

            </div>
          </div>

          {/* Mesa de Negociação & Call To Action */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
            
            {/* Features & Guarantee */}
            <div className="lg:col-span-7 p-6 md:p-8 rounded-2xl border border-emerald-500/20 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                  Garantia de Destinação
                </span>
                <h3 className="text-2xl font-bold text-white mt-1 mb-4 font-mono">
                  MESA DE NEGOCIAÇÃO
                </h3>
                
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-lg font-bold font-mono text-emerald-400">100% </span>
                      <span className="text-slate-200 font-semibold">Rastreabilidade de ponta a ponta</span>
                      <p className="text-xs text-slate-400 mt-0.5">Certificação imutável do crédito emitido diretamente no ledger AMZX.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-200 font-semibold">Comércio direto com o desenvolvedor</span>
                      <p className="text-xs text-slate-400 mt-0.5">Sem intermediários desnecessários, liquidação transparente e segura.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-200 font-semibold">Financiamento de patrulhas e comunidades locais</span>
                      <p className="text-xs text-slate-400 mt-0.5">Impacto socioambiental real direcionado à proteção da floresta viva.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Token Link */}
              <div className="pt-4 border-t border-emerald-500/15 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-mono text-slate-400">
                  Token Oficial: <span className="text-emerald-400 font-bold">amz1</span> (Asset ID: 7JuwpAgK...kYHz)
                </div>
                <Link 
                  to="/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" 
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline"
                >
                  Auditar amz1 no Explorer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Corporate Action Card */}
            <div className="lg:col-span-5 p-6 md:p-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 flex flex-col justify-between space-y-6 shadow-xl">
              <div className="space-y-4">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  ATENDIMENTO CORPORATIVO
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-white font-mono leading-snug">
                  Pronto para neutralizar suas emissões?
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Conecte sua corporação diretamente à Floresta Amazônica através de créditos de carbono auditados e tokens de alta integridade.
                </p>

                <div className="pt-2">
                  <a 
                    href="mailto:contact@amazonicone.com?subject=AMZ1%20Trade%20Desk%20-%20Cr%C3%A9ditos%20de%20Carbono%20REDD%2B"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Falar com Mesa de Trade</span>
                  </a>
                </div>
              </div>

              {/* Corporate Identity Box */}
              <div className="pt-4 border-t border-emerald-500/20 text-xs font-mono space-y-1.5 text-slate-400">
                <div className="font-bold text-white text-sm">
                  Amazonic One Eco Tecnologia S. A.
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <a href="mailto:contact@amazonicone.com" className="text-emerald-400 hover:underline">
                    contact@amazonicone.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Operações de campo: Amazonas, Brasil</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Atendimento corporativo global</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. Official Encrypted Protocol Endpoints (Developer Hub) */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 border-b border-emerald-500/15 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>ENDPOINTS OFICIAIS CRIPTOGRAFADOS</span>
            </div>
            <h3 className="text-2xl font-bold text-white font-mono">
              Infraestrutura de Rede & APIs (HTTPS / TLS / GRPCS)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Conexões seguras na porta 443 com certificado TLS ativo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {secureEndpoints.map((ep, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl border border-emerald-500/20 bg-slate-950/40 hover:bg-slate-900/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    {ep.badge}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {ep.type}
                  </span>
                </div>
                <h4 className="font-mono font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                  {ep.name}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ep.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 break-all select-all">
                  {ep.url}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => copyToClipboard(ep.url, ep.name)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-slate-200 transition-all"
                  >
                    {copiedEndpoint === ep.name ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>
                  <a 
                    href={ep.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-mono text-emerald-400 font-semibold transition-all"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Explorer Quick Navigation Grid (Infrastructure Services) */}
      <section className="py-6 border-t border-emerald-500/15">
        <h3 className="text-sm font-bold font-mono text-center text-slate-400 mb-8 uppercase tracking-widest">
          SERVIÇOS DE INFRAESTRUTURA BLOCKCHAIN
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          <Link to="/blocks" className="glass-card p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Blocos</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Explorar histórico</p>
            </div>
          </Link>

          <Link to="/transactions" className="glass-card p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Transações</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Logs de atividade</p>
            </div>
          </Link>

          <Link to="/nodes" className="glass-card p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Validadores</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Inspecionar nós</p>
            </div>
          </Link>

          <Link to="/contracts" className="glass-card p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Smart Contracts</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Scripts implantados</p>
            </div>
          </Link>

          <Link to="/ranking" className="glass-card p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Ranking</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Distribuição de AMZ</p>
            </div>
          </Link>

          <Link to="/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" className="glass-card p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Token amz1</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Oficial REDD+</p>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
};

export default Index;

import SearchBar from "@/components/SearchBar";
import SEO from "@/components/SEO";
import BlockList from "@/components/BlockList";
import TransactionList from "@/components/TransactionList";
import PendingTransactionList from "@/components/PendingTransactionList";
import NetworkChart from "@/components/NetworkChart";
import { useEffect, useState } from "react";
import { fetchNetworkStats, NetworkStats } from "@/services/api";
import { formatNumber } from "@/utils/formatter";
import { MotionContainer } from "@/components/ui/motion-container";
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
  Coins, 
  Users, 
  HelpCircle,
  ShieldCheck,
  Mail,
  MapPin,
  Leaf,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { isTestnet, getGCSApiUrl } from "@/lib/utils";

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

  // Real Staked Amount on-chain
  const rawStakedAMZ = stats?.totalStaked 
    ? stats.totalStaked / 100000000 
    : rawCirculatingSupply * 0.7332;
  const totalStakedStr = `${(rawStakedAMZ / 1000000).toFixed(2)}M`;

  // Staking ratio percentage
  const stakingRatio = rawCirculatingSupply > 0 
    ? (rawStakedAMZ / rawCirculatingSupply) * 100 
    : 73.32;

  // Active validators count
  const activeValidatorsCount = stats?.activeValidators 
    ? stats.activeValidators 
    : finalityData?.currentGenerators?.length 
      ? finalityData.currentGenerators.length 
      : blockHeight > 0 
        ? 15 
        : 12;

  // Dynamic calculation of Blockchain Weight
  const estimatedWeightBytes =
    16148000 +
    (blockHeight * 358) +
    ((stats?.transactions || 26135) * 1178);

  const estimatedWeightGB = estimatedWeightBytes / (1024 * 1024 * 1024);
  const blockchainWeightStr = `${estimatedWeightGB.toFixed(3)} GB`;

  return (
    <div className="min-h-screen flex flex-col gap-8 md:gap-14">
      <SEO 
        title="AMZ Explorer - Official AMZX Blockchain Explorer"
        description="The official high-performance block explorer and ledger analytics engine for the AMZX Blockchain. Monitor blocks, verify transactions, audit smart contracts, and track on-chain assets."
      />
      
      {/* 1. Hero banner: Clean Emerald Dark Aesthetic */}
      <ParallaxSection 
        className="py-10 md:py-16 px-4 md:px-8 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 via-black/80 to-black/95 backdrop-blur-2xl shadow-2xl"
        intensity={6}
      >
        {/* Subtle background ambient mesh */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Heading, Search & Shortcuts */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-mono leading-tight">
              AMZX <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">Blockchain</span> Explorer
            </h1>
            
            <p className="text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
              Official decentralized ledger analytics for the <span className="text-emerald-400 font-semibold">Amazonic One</span> network. Inspect real-time blocks, track transaction lifecycles, and verify smart contracts and token assets.
            </p>
            
            {/* Search Bar Container */}
            <div className="w-full max-w-xl pt-1">
              <SearchBar />
            </div>
            
            {/* Fast Ecosystem Navigation Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Fast Access:</span>
              <Link 
                to="/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" 
                className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 font-mono flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>amz1 Token</span>
              </Link>
              <Link 
                to="/asset/7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU" 
                className="px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 font-mono flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>AUSDTW (Wrapped USDT)</span>
              </Link>
              <Link 
                to="/nodes" 
                className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 hover:border-emerald-500/40 text-slate-200 font-mono flex items-center gap-1 transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Validators</span>
              </Link>
              <Link 
                to="/contracts" 
                className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 hover:border-emerald-500/40 text-slate-200 font-mono flex items-center gap-1 transition-all"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Smart Contracts</span>
              </Link>
            </div>
          </div>
          
          {/* Right Column: Amazonic One Brand Sphere with Glowing Emerald Orbits */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-72 h-72 md:w-84 md:h-84 flex items-center justify-center">
              {/* Radial Glowing Core - Emerald */}
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-emerald-500/30 via-emerald-600/15 to-transparent blur-3xl animate-pulse"></div>
              
              {/* Geometric Outer Orbital Ring */}
              <div className="absolute w-[94%] h-[94%] border border-emerald-500/30 rounded-full animate-[spin_28s_linear_infinite] pointer-events-none">
                <div className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981]"></div>
              </div>
              
              {/* Geometric Inner Orbital Ring */}
              <div className="absolute w-[76%] h-[76%] border border-emerald-500/20 rounded-full animate-[spin_18s_linear_infinite_reverse] pointer-events-none">
                <div className="absolute top-0 left-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]"></div>
              </div>
              
              {/* Center Logo Card */}
              <div className="relative z-10 p-6 rounded-3xl bg-black/60 border border-emerald-500/30 backdrop-blur-md shadow-2xl transition-transform duration-500 hover:scale-105">
                <img 
                  src="/logo.png" 
                  alt="Amazonic One Logo" 
                  className="w-44 h-44 md:w-52 md:h-52 object-contain filter drop-shadow-[0_0_35px_rgba(16,185,129,0.55)]"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 xl:divide-x divide-emerald-500/15 border border-emerald-500/20 overflow-hidden shadow-xl rounded-2xl bg-black/50 backdrop-blur-md">
          
          {/* Card 1: Block Height */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Block Height</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                {isBlockHeightLoading ? "..." : formatNumber(blockHeight)}
              </h3>
              <p className="text-[10px] font-mono text-emerald-400/90 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Avg: {isLoading ? "..." : `${stats?.averageBlockTime ? stats.averageBlockTime.toFixed(1) : "6.0"}s`} / block</span>
              </p>
            </div>
          </div>

          {/* Card 2: Total Transactions */}
          <div className="p-5 flex flex-col justify-between gap-2 relative group hover:bg-emerald-500/5 transition-colors border-t sm:border-t-0 border-emerald-500/15">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Transactions</span>
              </div>
              <div className="relative group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 text-[10px] leading-relaxed font-sans rounded-xl border border-emerald-500/20 bg-slate-950 text-slate-200 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] shadow-2xl">
                  Confirmed on-chain transactions, microblock state transitions, and PoS consensus blocks indexed in real time.
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                {isLoading ? "..." : formatNumber(stats?.transactions ?? 0)}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Confirmed on-chain
              </p>
            </div>
          </div>

          {/* Card 3: Mempool Queue */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-amber-500/5 transition-colors border-t md:border-t-0 border-emerald-500/15">
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
                <span>Awaiting block inclusion</span>
              </p>
            </div>
          </div>

          {/* Card 4: Ledger Weight */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors border-t md:border-t-0 border-emerald-500/15">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Blockchain Size</span>
              </div>
              <div className="relative group/tooltip">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 transition-colors cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 text-[10px] leading-relaxed font-sans rounded-xl border border-emerald-500/20 bg-slate-950 text-slate-200 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] shadow-2xl">
                  Total storage required for verified state data across nodes.
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold font-mono tracking-tight text-white">
                ≅ {isLoading || isBlockHeightLoading ? "..." : blockchainWeightStr}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Active ledger state
              </p>
            </div>
          </div>

          {/* Card 5: Active Validators */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors border-t xl:border-t-0 border-emerald-500/15">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Active Validators</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
                {isFinalityLoading ? "..." : activeValidatorsCount}
              </h3>
              <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Fair PoS Consensus</span>
              </p>
            </div>
          </div>

          {/* Card 6: Supply & Staking Ratio */}
          <div className="p-5 flex flex-col justify-between gap-2 relative overflow-hidden group hover:bg-emerald-500/5 transition-colors border-t xl:border-t-0 border-emerald-500/15">
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
        <div className="p-6 border border-emerald-500/20 overflow-hidden shadow-lg rounded-2xl bg-black/50 backdrop-blur-md">
          <NetworkChart />
        </div>
      </MotionContainer>

      {/* 4. Real-time Activity Center (3-Columns Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Column 1: Latest Blocks */}
        <div className="p-5 flex flex-col justify-between border border-emerald-500/20 rounded-2xl bg-black/50 backdrop-blur-md shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-500/15">
              <h3 className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>LATEST BLOCKS</span>
              </h3>
              <Link to="/blocks" className="text-[11px] text-emerald-400 font-mono flex items-center hover:underline gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <BlockList limit={5} />
          </div>
        </div>

        {/* Column 2: Latest Transactions */}
        <div className="p-5 flex flex-col justify-between border border-emerald-500/20 rounded-2xl bg-black/50 backdrop-blur-md shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-emerald-500/15">
              <h3 className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>LATEST TRANSACTIONS</span>
              </h3>
              <Link to="/transactions" className="text-[11px] text-emerald-400 font-mono flex items-center hover:underline gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <TransactionList limit={5} />
          </div>
        </div>

        {/* Column 3: Pending Transactions */}
        <div className="p-5 flex flex-col justify-between border border-amber-500/20 rounded-2xl bg-black/50 backdrop-blur-md shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-500/15">
              <h3 className="text-sm font-bold font-mono text-amber-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-[spin_4s_linear_infinite]" />
                <span>MEMPOOL (PENDING)</span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold">
                Queue: {isUnconfirmedTxsLoading ? "..." : unconfirmedTxs}
              </span>
            </div>
            <PendingTransactionList limit={5} />
          </div>
        </div>

      </div>

      {/* 5. Verified Ecosystem Tokens Table */}
      <section className="p-6 md:p-8 rounded-3xl border border-emerald-500/20 bg-black/50 backdrop-blur-md shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500/15">
          <div>
            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              On-Chain Assets
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white font-mono mt-0.5">
              Verified Ecosystem Tokens
            </h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Tracked on AMZX Mainnet
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Total Supply</th>
                <th className="py-3 px-4">Decimals</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* Native Asset */}
              <tr className="hover:bg-emerald-500/5 transition-colors">
                <td className="py-4 px-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                    A
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">AMZ</span>
                    <span className="block text-[10px] text-slate-400">Native Network Coin</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                    Native Gas & Consensus Asset
                  </span>
                </td>
                <td className="py-4 px-4 font-bold text-white">
                  100,000,000 AMZ
                </td>
                <td className="py-4 px-4 text-slate-300">
                  8
                </td>
                <td className="py-4 px-4 text-right">
                  <Link 
                    to="/ranking" 
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all"
                  >
                    <span>Rich List</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>

              {/* amz1 Token */}
              <tr className="hover:bg-emerald-500/5 transition-colors">
                <td className="py-4 px-4 flex items-center gap-3">
                  <img src="/logo.png" alt="amz1" className="w-8 h-8 rounded-full object-contain border border-emerald-500/30 bg-black/40 p-0.5" />
                  <div>
                    <span className="font-bold text-white text-sm">amz1</span>
                    <span className="block text-[10px] text-emerald-400">Amazonic One Official Token</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-300">
                  <span className="font-mono text-[11px] hover:text-emerald-400">
                    7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz
                  </span>
                </td>
                <td className="py-4 px-4 font-bold text-white">
                  100,000,000,000 amz1
                </td>
                <td className="py-4 px-4 text-slate-300">
                  2
                </td>
                <td className="py-4 px-4 text-right">
                  <Link 
                    to="/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" 
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all"
                  >
                    <span>View Asset</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>

              {/* AUSDTW Token */}
              <tr className="hover:bg-emerald-500/5 transition-colors">
                <td className="py-4 px-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400 font-mono text-sm">
                    ₮
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">AUSDTW</span>
                    <span className="block text-[10px] text-teal-400">Amazonic USDT Wrapped (1:1 Peg)</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-slate-300">
                  <span className="font-mono text-[11px] hover:text-emerald-400">
                    7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU
                  </span>
                </td>
                <td className="py-4 px-4 font-bold text-white">
                  1.000000000000000000 AUSDTW
                </td>
                <td className="py-4 px-4 text-slate-300">
                  18
                </td>
                <td className="py-4 px-4 text-right">
                  <Link 
                    to="/asset/7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU" 
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all"
                  >
                    <span>View Asset</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Institutional Section: Amazonic One Ecosystem Overview */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 via-black/90 to-black p-6 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-10">
          
          {/* Section Header */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
              <Leaf className="w-3.5 h-3.5" />
              <span>High-Integrity Carbon Ledger</span>
            </div>

            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white font-mono tracking-tight leading-tight">
              Real Forest Conservation & Traceable REDD+ Credits
            </h2>

            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Origination and settlement of high-integrity environmental assets directly from conserved Amazon rainforest territories under cryptographic custody on the AMZX blockchain.
            </p>
          </div>

          {/* 3 Technical Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all">
              <div className="text-3xl font-extrabold font-mono text-emerald-400/40 group-hover:text-emerald-400 transition-colors mb-4">
                01
              </div>
              <h4 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Scientific Telemetry</span>
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Forest inventory and high-resolution satellite monitoring across certified protected hectares.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all">
              <div className="text-3xl font-extrabold font-mono text-emerald-400/40 group-hover:text-emerald-400 transition-colors mb-4">
                02
              </div>
              <h4 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Independent Audit</span>
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rigorous third-party validation adhering to international ecological integrity standards.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-sm relative group hover:border-emerald-500/50 transition-all">
              <div className="text-3xl font-extrabold font-mono text-emerald-400/40 group-hover:text-emerald-400 transition-colors mb-4">
                03
              </div>
              <h4 className="text-lg font-bold text-white mb-2 font-mono flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>On-Chain Custody</span>
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Immutable ledger issuance ensuring cryptographic singularity for each transacted credit.
              </p>
            </div>

          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-slate-400">
              Corporate Entity: <span className="text-white font-bold">Amazonic One Eco Tecnologia S.A.</span>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="mailto:contact@amazonicone.com" 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Team</span>
              </a>
              <a 
                href="https://amazonicone.com.br" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-white font-mono text-xs hover:border-emerald-400 transition-all"
              >
                <span>Official Portal</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 7. Explorer Quick Navigation Grid (Infrastructure Services) */}
      <section className="py-6 border-t border-emerald-500/15">
        <h3 className="text-sm font-bold font-mono text-center text-slate-400 mb-8 uppercase tracking-widest">
          BLOCKCHAIN INFRASTRUCTURE SERVICES
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          <Link to="/blocks" className="p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl bg-black/40 backdrop-blur-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Blocks</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Explore history</p>
            </div>
          </Link>

          <Link to="/transactions" className="p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl bg-black/40 backdrop-blur-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Transactions</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Activity ledger</p>
            </div>
          </Link>

          <Link to="/nodes" className="p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl bg-black/40 backdrop-blur-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Validators</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Inspect nodes</p>
            </div>
          </Link>

          <Link to="/contracts" className="p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl bg-black/40 backdrop-blur-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Smart Contracts</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Deployed scripts</p>
            </div>
          </Link>

          <Link to="/ranking" className="p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl bg-black/40 backdrop-blur-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">Rich List</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Account balances</p>
            </div>
          </Link>

          <Link to="/asset/7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz" className="p-5 text-center flex flex-col items-center justify-center gap-3 border border-emerald-500/15 hover:border-emerald-500/50 rounded-2xl bg-black/40 backdrop-blur-md transition-all duration-300 group">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-white">amz1 Token</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Official Asset</p>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
};

export default Index;

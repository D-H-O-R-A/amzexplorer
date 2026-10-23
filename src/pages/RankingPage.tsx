import React, { useState, useEffect, useMemo } from "react";
import SEO from "@/components/SEO";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { shortenHash, formatAmount } from "@/utils/formatter";
import { 
  Trophy, Medal, Wallet, Copy, Check, Loader2, AlertCircle, 
  TrendingUp, Search, Coins, Sparkles, ExternalLink, RefreshCw, Info, Flame
} from "lucide-react";
import { toast } from "sonner";
import { MotionContainer, MotionChild } from "@/components/ui/motion-container";
import { fetchAssetDetails } from "@/services/api";
import { isTestnet, getFullExplorerApiUrl, getNodeUrl } from "@/lib/utils";

interface RankedAddress {
  rank: number;
  address: string;
  balance: number;
  decimals?: number;
  assetName?: string;
  assetId?: string;
}

interface AssetMeta {
  name: string;
  decimals: number;
  rawTotalSupply: string | number | bigint;
  assetId: string;
}

const RankingPage: React.FC = () => {
  const [ranking, setRanking] = useState<RankedAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Pagination states
  const [offset, setOffset] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Asset filtering state
  const [activeAsset, setActiveAsset] = useState<string>("AMZ");
  const [customAssetInput, setCustomAssetInput] = useState<string>("");
  const [assetMeta, setAssetMeta] = useState<AssetMeta>({
    name: "AMZ",
    decimals: 8,
    rawTotalSupply: "1000000000000000",
    assetId: "AMZ"
  });

  const loadRanking = async (assetKey: string, currentOffset: number = 0, append: boolean = false) => {
    try {
      if (currentOffset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const baseUrl = getFullExplorerApiUrl();

      let targetAssetId = assetKey;
      let decimals = 8;
      let name = "AMZ";
      let rawTotalSupply: string | number | bigint = "1000000000000000"; // fallback

      if (assetKey === "AMZ" || assetKey === "AMZ") {
        try {
          const rewardsResponse = await fetch(`${getNodeUrl()}/blockchain/rewards`);
          if (rewardsResponse.ok) {
            const rewards = await rewardsResponse.json();
            rawTotalSupply = rewards.totalWavesAmount || "1001242000000000";
          }
        } catch (err) {
          console.error("Failed to fetch precise AMZ supply from node rewards:", err);
          rawTotalSupply = "1001242000000000";
        }
      } else {
        try {
          const assetData = await fetchAssetDetails(assetKey);
          if (assetData) {
            targetAssetId = assetData.assetId;
            decimals = assetData.decimals;
            name = assetData.name;
            rawTotalSupply = assetData.quantity || "0";
          } else {
            throw new Error("Asset details not returned");
          }
        } catch (err) {
          console.error("Failed to resolve asset details via Node API:", err);
          if (assetKey === "amz1" || assetKey === "7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz") {
            targetAssetId = "7JuwpAgKpQDuorg5xX8AFbhRMMgrCfbwUgdktxypkYHz";
            decimals = 2;
            name = "amz1";
            rawTotalSupply = "10000000000000";
          }
        }
      }

      // Fetch from backend using the offset pagination
      const response = await fetch(`${baseUrl}/top/${targetAssetId}/${currentOffset}`);
      if (!response.ok) {
        throw new Error("O indexador local do FullExplorer falhou ao compilar o ranking.");
      }
      const result = await response.json();
      const holdersList = result.holders || [];

      if (Array.isArray(holdersList)) {
        const mappedData: RankedAddress[] = holdersList.map((item: any) => ({
          rank: item.rank,
          address: item.address,
          balance: item.balance,
          decimals: item.decimals !== undefined ? item.decimals : decimals,
          assetName: item.assetName || name,
          assetId: item.assetId || targetAssetId
        }));

        if (append) {
          setRanking(prev => [...prev, ...mappedData]);
        } else {
          setRanking(mappedData);
          setAssetMeta({
            name: mappedData[0]?.assetName || name,
            decimals: mappedData[0]?.decimals !== undefined ? mappedData[0].decimals : decimals,
            rawTotalSupply: rawTotalSupply,
            assetId: targetAssetId
          });
        }

        if (holdersList.length < 100) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        throw new Error("Formato de ranking retornado inválido ou vazio.");
      }
    } catch (err: any) {
      console.error("Failed to fetch ranking:", err);
      setError(err.message || "Serviço de ranking temporariamente indisponível.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadRanking(activeAsset, 0, false);
  }, [activeAsset]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextOffset = offset + 100;
    setOffset(nextOffset);
    loadRanking(activeAsset, nextOffset, true);
  };

  const handleCustomAssetSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = customAssetInput.trim();
    if (!cleanInput) {
      toast.error("Por favor, digite um ID de Asset válido.");
      return;
    }
    setOffset(0);
    setHasMore(true);
    setRanking([]);
    setActiveAsset(cleanInput);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-extrabold shadow-md shadow-yellow-500/20 text-xs animate-pulse">
          <Trophy className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 text-slate-800 font-extrabold shadow-md text-xs">
          <Medal className="w-3.5 h-3.5" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 text-white font-extrabold shadow-md text-xs">
          <Medal className="w-3.5 h-3.5" />
        </span>
      );
    }
    return <span className="font-mono text-xs font-bold text-muted-foreground w-7 text-center">{rank}</span>;
  };

  const getAvatarColor = (address: string) => {
    const charCode = address.charCodeAt(address.length - 1) + address.charCodeAt(address.length - 2);
    const colors = [
      "from-emerald-400 to-teal-500 text-emerald-500 bg-emerald-500/10 border-emerald-500/15",
      "from-green-400 to-emerald-600 text-green-500 bg-green-500/10 border-green-500/15",
      "from-violet-400 to-purple-500 text-violet-500 bg-violet-500/10 border-violet-500/15",
      "from-pink-400 to-rose-500 text-pink-500 bg-pink-500/10 border-pink-500/15",
      "from-amber-400 to-orange-500 text-amber-500 bg-amber-500/10 border-amber-500/15",
    ];
    return colors[charCode % colors.length];
  };

  // Top holder concentration math helper
  const topHolderConcentration = useMemo(() => {
    if (ranking.length === 0 || !assetMeta.rawTotalSupply) return 0;
    try {
      const topRaw = BigInt(ranking[0].balance || 0);
      const totalRaw = BigInt(assetMeta.rawTotalSupply || 0);
      if (totalRaw === 0n) return 0;
      return (Number(topRaw) / Number(totalRaw)) * 100;
    } catch {
      return 0;
    }
  }, [ranking, assetMeta]);

  return (
    <MotionContainer 
      animateOnMount={true}
      className="w-full max-w-6xl mx-auto space-y-8 px-2 md:px-0 animate-fade-in pb-16"
    >
      <SEO 
        title="Top Accounts & Rich List"
        description="Official leaderboard of top account balances and asset holders on the AMZX blockchain. Inspect coin distribution and holder concentration."
      />
      
      {/* Header Block */}
      <MotionChild className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-pulse">
              <Trophy className="w-6 h-6" />
            </span>
            <Badge variant="outline" className="text-[10px] bg-background/50 border-border/80 font-bold px-2 py-0.5 rounded-md">
              Analytics Rich List
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
            Top Account Holders
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Real-time balance ranking of accounts and smart contracts by asset volume. Inspect accumulated balances and circulating token distribution.
          </p>
        </div>

        {/* Network Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-none font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Rede: {isTestnet() ? "Testnet Explorer" : "Mainnet Oficial"}
          </Badge>
          <Badge variant="outline" className="bg-background/40 hover:bg-muted border-border font-mono py-1.5 px-3 rounded-xl text-xs">
            Formatado por Decimais
          </Badge>
        </div>
      </MotionChild>

      {/* Asset Switcher and Filter Panel */}
      <MotionChild className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Quick Selection Buttons */}
        <div className="lg:col-span-6 flex flex-wrap gap-2.5 items-center">
          <button
            onClick={() => {
              setOffset(0);
              setHasMore(true);
              setRanking([]);
              setActiveAsset("AMZ");
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm border ${
              activeAsset === "AMZ"
                ? "bg-primary text-primary-foreground border-primary scale-[1.02] shadow-primary/10"
                : "bg-card/45 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            <Coins className="w-4 h-4" />
            AMZ (Ativo Nativo)
          </button>

          <button
            onClick={() => {
              setOffset(0);
              setHasMore(true);
              setRanking([]);
              setActiveAsset("amz1");
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm border ${
              activeAsset === "amz1"
                ? "bg-emerald-500 text-white border-emerald-500 scale-[1.02] shadow-emerald-500/15"
                : "bg-card/45 hover:bg-muted text-muted-foreground border-border/60 hover:text-emerald-500"
            }`}
          >
            <Flame className="w-4 h-4" />
            Token amz1 (Oficial)
          </button>

          <button
            onClick={() => {
              setOffset(0);
              setHasMore(true);
              setRanking([]);
              setActiveAsset("7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU");
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm border ${
              activeAsset === "7i8QogaFNfDWJi93yreUYgtJ12ZFLiPFdJaC1WLoD7tU"
                ? "bg-emerald-600 text-white border-emerald-600 scale-[1.02] shadow-emerald-500/15"
                : "bg-card/45 hover:bg-muted text-muted-foreground border-border/60 hover:text-emerald-500"
            }`}
          >
            <Coins className="w-4 h-4" />
            AUSDTW (18 Dec)
          </button>
        </div>

        {/* Custom Asset Search Form */}
        <form onSubmit={handleCustomAssetSearch} className="lg:col-span-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={customAssetInput}
              onChange={(e) => setCustomAssetInput(e.target.value)}
              placeholder="Search Token or Contract ID..."
              className="pl-10 h-11 bg-white border-slate-200 text-slate-950 placeholder:text-slate-400 focus-visible:ring-emerald-500 rounded-xl text-xs font-semibold shadow-sm"
            />
          </div>
          <Button 
            type="submit" 
            className="h-11 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary/95 flex items-center gap-1.5 shadow-md shadow-primary/5 hover:scale-[1.02] transition-transform"
          >
            <Search className="h-3.5 w-3.5" />
            Filtrar Asset
          </Button>
        </form>
      </MotionChild>

      {/* KPI Stats Analytics Panel */}
      <MotionChild className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Asset Details */}
        <Card className="border border-border/50 bg-card/35 backdrop-blur-xl relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary opacity-60">
            <Coins className="w-5 h-5" />
          </div>
          <CardContent className="p-5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Ativo Atualmente</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1 group-hover:text-primary transition-colors">
              {assetMeta.name}
            </h3>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 truncate max-w-[170px]">
                {assetMeta.assetId}
              </span>
              <button 
                onClick={() => handleCopy(assetMeta.assetId, -1)}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Copiar ID"
              >
                {copiedIndex === -1 ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Supply */}
        <Card className="border border-border/50 bg-card/35 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-emerald-500/5 flex items-center justify-center text-emerald-500 opacity-60">
            <TrendingUp className="w-5 h-5" />
          </div>
          <CardContent className="p-5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Suprimento Emitido</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1 font-mono">
              {formatAmount(assetMeta.rawTotalSupply, assetMeta.decimals)}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2">
              Distribuição máxima indexada
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Top Whale Concentration */}
        <Card className="border border-border/50 bg-card/35 backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-amber-500/5 flex items-center justify-center text-amber-500 opacity-60">
            <Flame className="w-5 h-5" />
          </div>
          <CardContent className="p-5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Dominação do Holder #1</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1 font-mono">
              {topHolderConcentration > 0 ? `${topHolderConcentration.toFixed(3)}%` : "Calculando..."}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2">
              Concentração do maior detentor da blockchain
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Decimals */}
        <Card className="border border-border/50 bg-card/35 backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-indigo-500/5 flex items-center justify-center text-indigo-500 opacity-60">
            <Info className="w-5 h-5" />
          </div>
          <CardContent className="p-5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Fator de Precisão</span>
            <h3 className="text-xl font-extrabold text-foreground mt-1">
              {assetMeta.decimals} Casas Decimais
            </h3>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">
              1 {assetMeta.name} = 10^{assetMeta.decimals} unidades internas
            </p>
          </CardContent>
        </Card>
      </MotionChild>

      {/* Main Ranking Table Card */}
      <MotionChild>
        <Card className="border border-border/70 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl">
          <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-primary" />
                  Top Accounts & Balances ({assetMeta.name})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  On-chain accounts holding accumulated balances of {assetMeta.name} in confirmed blocks.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-background/80 border-border/80 text-[10px] font-mono px-2 py-0.5">
                Showing {ranking.length} accounts
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="space-y-1 text-center">
                  <p className="text-xs font-bold text-foreground">Synchronizing network ledger balances...</p>
                  <p className="text-[10px] text-muted-foreground animate-pulse">Querying live index in real time</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center text-center py-20 px-6 gap-3 bg-destructive/5 border-t border-destructive/10">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-foreground">Failed to compile account leaderboard</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">{error}</p>
                </div>
                <Button 
                  onClick={() => loadRanking(activeAsset, 0, false)} 
                  variant="outline" 
                  className="rounded-xl mt-2 h-9 border-destructive/25 text-destructive hover:bg-destructive hover:text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground text-xs font-medium space-y-2">
                <p>No addresses found holding balances for this asset.</p>
                <p className="text-[10px] font-normal text-muted-foreground">Try querying another asset ID or contract address.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/60 hover:bg-transparent bg-muted/5">
                      <TableHead className="w-[100px] text-center font-bold text-xs pl-6 text-foreground/80">Rank</TableHead>
                      <TableHead className="text-left font-bold text-xs text-foreground/80">Account Address</TableHead>
                      <TableHead className="text-right font-bold text-xs text-foreground/80">Balance ({assetMeta.name})</TableHead>
                      <TableHead className="text-right font-bold text-xs pr-6 text-foreground/80">% Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((row, index) => {
                      const decimals = row.decimals !== undefined ? row.decimals : assetMeta.decimals;
                      let percentOfSupply = 0;
                      try {
                        const bal = BigInt(row.balance || 0);
                        const tot = BigInt(assetMeta.rawTotalSupply || 0);
                        if (tot > 0n) {
                          percentOfSupply = (Number(bal) / Number(tot)) * 100;
                        }
                      } catch {
                        percentOfSupply = 0;
                      }
                      const avatarClass = getAvatarColor(row.address);

                      return (
                        <TableRow 
                          key={index} 
                          className="border-b border-border/40 hover:bg-muted/30 transition-colors duration-200 group"
                        >
                          {/* Rank Icon / Number */}
                          <TableCell className="text-center py-4 pl-4">
                            <div className="flex items-center justify-center">
                              {getRankBadge(row.rank)}
                            </div>
                          </TableCell>

                          {/* Address & Copy with Identity Avatar */}
                          <TableCell className="text-left py-4">
                            <div className="flex items-center gap-2.5">
                              {/* Glowing visual identicon */}
                              <span className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shadow-sm bg-gradient-to-br ${avatarClass}`}>
                                <Wallet className="w-3.5 h-3.5" />
                              </span>
                              
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <Link 
                                    to={`/address/${row.address}`} 
                                    className="font-mono text-xs md:text-sm font-extrabold text-foreground hover:text-primary hover:underline transition-colors"
                                  >
                                    <span className="hidden md:inline">{row.address}</span>
                                    <span className="inline md:hidden">{shortenHash(row.address, 12)}</span>
                                  </Link>
                                  
                                  <button
                                    onClick={() => handleCopy(row.address, index)}
                                    className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copiar Endereço"
                                  >
                                    {copiedIndex === index ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Balance (AMZ / Asset) */}
                          <TableCell className="text-right py-4 font-mono text-xs md:text-sm font-extrabold text-foreground">
                            {formatAmount(row.balance, decimals)}
                          </TableCell>

                          {/* Supply Bar and Percent */}
                          <TableCell className="text-right py-4 pr-6">
                            <div className="flex flex-col items-end gap-1 max-w-[150px] ml-auto">
                              <span className="font-mono text-xs text-foreground/95 font-bold">
                                {percentOfSupply.toFixed(4)}%
                              </span>
                              <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden border border-border/40">
                                <div 
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    row.rank <= 3 ? "from-yellow-400 to-amber-500" : "from-primary to-emerald-500"
                                  }`} 
                                  style={{ width: `${Math.min(100, Math.max(0.5, percentOfSupply * 4))}%` }} 
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Load More Pagination */}
          {!loading && hasMore && (
            <div className="flex justify-center p-6 border-t border-border/50 bg-muted/5">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="px-8 py-4 h-auto rounded-xl font-bold bg-background/60 hover:bg-primary hover:text-primary-foreground border-primary/20 hover:border-primary transition-all duration-300 shadow-md flex items-center gap-2 group hover:scale-[1.03]"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-primary group-hover:text-primary-foreground" />
                    Buscando próximos holders...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
                    Load More 100 Accounts (Rich List)
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </MotionChild>
    </MotionContainer>
  );
};

export default RankingPage;

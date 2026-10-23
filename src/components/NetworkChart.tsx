import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { getGCSApiUrl, getCoinName } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  Clock,
  Database,
  Coins,
  RefreshCw,
  Zap,
  TrendingUp,
  Layers
} from 'lucide-react';
import { shortenHash } from '@/utils/formatter';

export interface ChartDataPoint {
  timestamp: number;
  height: number;
  transactions: number;
  blockTime: number; // in seconds
  blockSizeKb: number;
  totalFeePlo: number;
  generator?: string;
  timeLabel: string;
  fullDateLabel: string;
}

export type MetricType = 'transactions' | 'blockTime' | 'blockSize' | 'fees';
export type RangeOption = 30 | 60 | 100;

interface MetricMeta {
  id: MetricType;
  label: string;
  shortLabel: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  strokeColor: string;
  gradientId: string;
  badgeBg: string;
  badgeText: string;
  yAxisFormatter: (val: number) => string;
  tooltipFormatter: (val: number) => string;
}

const METRIC_CONFIGS: Record<MetricType, MetricMeta> = {
  transactions: {
    id: 'transactions',
    label: 'Transaction Volume',
    shortLabel: 'Transactions',
    unit: 'txs',
    icon: Zap,
    strokeColor: '#10b981', // emerald-500
    gradientId: 'emeraldTxGradient',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    yAxisFormatter: (v) => `${Math.round(v)}`,
    tooltipFormatter: (v) => `${v} txs`
  },
  blockTime: {
    id: 'blockTime',
    label: 'Block Generation Time (Latency)',
    shortLabel: 'Block Time',
    unit: 's',
    icon: Clock,
    strokeColor: '#8b5cf6', // violet-500
    gradientId: 'violetTimeGradient',
    badgeBg: 'bg-violet-500/15 border-violet-500/30 text-violet-700 dark:text-violet-400',
    badgeText: 'text-violet-600 dark:text-violet-400',
    yAxisFormatter: (v) => `${v.toFixed(0)}s`,
    tooltipFormatter: (v) => `${v.toFixed(1)}s`
  },
  blockSize: {
    id: 'blockSize',
    label: 'Block Size (KB)',
    shortLabel: 'Size (KB)',
    unit: 'KB',
    icon: Database,
    strokeColor: '#f59e0b', // amber-500
    gradientId: 'amberSizeGradient',
    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
    badgeText: 'text-amber-600 dark:text-amber-400',
    yAxisFormatter: (v) => `${v.toFixed(1)}k`,
    tooltipFormatter: (v) => `${v.toFixed(2)} KB`
  },
  fees: {
    id: 'fees',
    label: 'Collected Block Fees',
    shortLabel: 'Fees (AMZ)',
    unit: 'AMZ',
    icon: Coins,
    strokeColor: '#10b981', // emerald-500
    gradientId: 'emeraldFeeGradient',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    yAxisFormatter: (v) => `${v.toFixed(2)}`,
    tooltipFormatter: (v) => `${v.toFixed(4)} ${getCoinName()}`
  }
};

interface NetworkChartProps {
  initialMetric?: MetricType;
  initialRange?: RangeOption;
  hideHeader?: boolean;
}

const NetworkChart: React.FC<NetworkChartProps> = ({
  initialMetric = 'transactions',
  initialRange = 30,
  hideHeader = false
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [activeMetric, setActiveMetric] = useState<MetricType>(initialMetric);
  const [blockRange, setBlockRange] = useState<RangeOption>(initialRange);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchChartData = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    setIsRefreshing(true);

    try {
      const apiUrl = getGCSApiUrl();

      // 1. Get latest block height
      const lastRes = await fetch(`${apiUrl}/blocks/last`);
      if (!lastRes.ok) throw new Error('Failed to fetch latest block');
      const lastBlock = await lastRes.json();
      const latestHeight = Number(lastBlock.height);

      if (!latestHeight || isNaN(latestHeight)) {
        throw new Error('Invalid block height');
      }

      const fromHeight = Math.max(1, latestHeight - blockRange + 1);
      const toHeight = latestHeight;

      let rawBlocks: any[] = [];

      // 2. Try fast batch block headers endpoint
      try {
        const batchRes = await fetch(`${apiUrl}/blocks/headers/seq/${fromHeight}/${toHeight}`);
        if (batchRes.ok) {
          const json = await batchRes.json();
          if (Array.isArray(json) && json.length > 0) {
            rawBlocks = json;
          }
        }
      } catch (batchErr) {
        // Fallback below
      }

      // 3. Fallback to parallel fetch if batch unavailable
      if (rawBlocks.length === 0) {
        const heightsToFetch: number[] = [];
        for (let h = toHeight; h >= fromHeight; h--) {
          heightsToFetch.push(h);
        }

        const blockPromises = heightsToFetch.map(async (height) => {
          try {
            const res = await fetch(`${apiUrl}/blocks/headers/at/${height}`);
            if (res.ok) return await res.json();
            const fullRes = await fetch(`${apiUrl}/blocks/at/${height}`);
            if (fullRes.ok) return await fullRes.json();
          } catch (e) {
            return null;
          }
          return null;
        });

        const fetched = await Promise.all(blockPromises);
        rawBlocks = fetched.filter((b) => b !== null).reverse();
      }

      // 4. Process and calculate chronological metrics
      if (rawBlocks.length > 0) {
        // Sort ascending by height
        const sorted = [...rawBlocks].sort((a, b) => Number(a.height) - Number(b.height));

        const processed: ChartDataPoint[] = sorted.map((block: any, idx: number) => {
          const prev = sorted[idx - 1];
          let blockTimeSeconds = 60;
          if (prev && block.timestamp && prev.timestamp) {
            const diff = (block.timestamp - prev.timestamp) / 1000;
            // Cap reasonable range (1s to 600s)
            blockTimeSeconds = diff > 0 && diff < 600 ? diff : 60;
          }

          const dateObj = new Date(block.timestamp);
          const timeLabel = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const fullDateLabel = dateObj.toLocaleString('pt-BR');

          const txCount = block.transactionCount !== undefined ? block.transactionCount : (block.transactions?.length || 0);
          const sizeKb = block.blocksize ? block.blocksize / 1024 : 0.35;
          const feePlo = block.totalFee ? block.totalFee / 1e8 : 0;

          return {
            timestamp: block.timestamp,
            height: Number(block.height),
            transactions: Number(txCount),
            blockTime: Number(blockTimeSeconds),
            blockSizeKb: Number(sizeKb),
            totalFeePlo: Number(feePlo),
            generator: block.generator || block.generatorPublicKey,
            timeLabel,
            fullDateLabel
          };
        });

        setChartData(processed);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Erro ao obter dados do gráfico:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [blockRange]);

  useEffect(() => {
    fetchChartData(chartData.length === 0);
    const timer = setInterval(() => fetchChartData(false), 30000); // 30s auto-refresh
    return () => clearInterval(timer);
  }, [fetchChartData, chartData.length]);

  // Derived KPI Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        totalTxs: 0,
        avgTxs: 0,
        avgBlockTime: 60,
        peakBlock: { height: 0, txs: 0 },
        avgSizeKb: 0,
        totalFees: 0
      };
    }

    const totalTxs = chartData.reduce((acc, cur) => acc + cur.transactions, 0);
    const avgTxs = totalTxs / chartData.length;
    const avgBlockTime = chartData.reduce((acc, cur) => acc + cur.blockTime, 0) / chartData.length;
    const peakBlock = chartData.reduce(
      (max, cur) => (cur.transactions > max.txs ? { height: cur.height, txs: cur.transactions } : max),
      { height: chartData[0].height, txs: chartData[0].transactions }
    );
    const avgSizeKb = chartData.reduce((acc, cur) => acc + cur.blockSizeKb, 0) / chartData.length;
    const totalFees = chartData.reduce((acc, cur) => acc + cur.totalFeePlo, 0);

    return {
      totalTxs,
      avgTxs,
      avgBlockTime,
      peakBlock,
      avgSizeKb,
      totalFees
    };
  }, [chartData]);

  const currentMeta = METRIC_CONFIGS[activeMetric];

  // Custom Glassmorphic Tooltip compatible with Light & Dark Modes
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartDataPoint = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-primary/20 shadow-xl dark:shadow-2xl rounded-xl p-3.5 text-xs font-mono space-y-2.5 min-w-[220px] pointer-events-none text-slate-800 dark:text-slate-100 z-50">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-primary/15 pb-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Bloco #{data.height}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{data.timeLabel}</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Zap className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Transactions:
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[11px]">
                {data.transactions} txs
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-violet-600 dark:text-violet-400" /> Intervalo:
              </span>
              <span className="font-bold text-violet-700 dark:text-violet-300">
                {data.blockTime.toFixed(1)}s
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Database className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Tamanho:
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {data.blockSizeKb.toFixed(2)} KB
              </span>
            </div>

            {data.totalFeePlo > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Coins className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Taxas:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {data.totalFeePlo.toFixed(4)} {getCoinName()}
                </span>
              </div>
            )}

            {data.generator && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                <span className="text-slate-400 dark:text-slate-500">Minerador:</span>
                <span className="text-primary font-mono truncate max-w-[110px]" title={data.generator}>
                  {shortenHash(data.generator, 4)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-5">
      {/* 1. Header Bar: Title, Metric Switchers, Range Filters, Refresh */}
      {!hideHeader && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/70 dark:border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono tracking-tight text-foreground">
                  DESEMPENHO HISTÓRICO DA REDE
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Live
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Real-time throughput, latency, and block validation telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Switcher Pills */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-primary/15 shadow-sm dark:shadow-none">
              {(Object.keys(METRIC_CONFIGS) as MetricType[]).map((key) => {
                const item = METRIC_CONFIGS[key];
                const Icon = item.icon;
                const isActive = activeMetric === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveMetric(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                      isActive
                        ? `${item.badgeBg} font-bold shadow-sm`
                        : 'text-slate-600 dark:text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Block Range Selector */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-primary/15 shadow-sm dark:shadow-none">
              {([30, 60, 100] as RangeOption[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setBlockRange(r)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-mono transition-all ${
                    blockRange === r
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'text-slate-600 dark:text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-800/40'
                  }`}
                >
                  {r}B
                </button>
              ))}
            </div>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchChartData(false)}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-100/90 dark:bg-slate-900/60 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-primary/15 text-slate-600 dark:text-muted-foreground hover:text-foreground transition-all disabled:opacity-50 shadow-sm dark:shadow-none"
              title="Refresh data now"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Micro KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Transactions in Range */}
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-emerald-500/20 dark:border-emerald-500/15 shadow-sm dark:shadow-none flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Tx Volume ({blockRange}B)
            </span>
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isLoading ? '...' : `${stats.totalTxs.toLocaleString('en-US')} txs`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-muted-foreground font-mono mt-0.5">
              Avg: ~{stats.avgTxs.toFixed(1)} / block
            </div>
          </div>
        </div>

        {/* KPI 2: Average Block Time */}
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-violet-500/20 dark:border-violet-500/15 shadow-sm dark:shadow-none flex flex-col justify-between relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              Avg Block Time
            </span>
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono text-violet-600 dark:text-violet-300">
              {isLoading ? '...' : `${stats.avgBlockTime.toFixed(1)}s`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-muted-foreground font-mono mt-0.5">
              Target: ~60s
            </div>
          </div>
        </div>

        {/* KPI 3: Peak Activity */}
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-amber-500/20 dark:border-amber-500/15 shadow-sm dark:shadow-none flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Peak Activity
            </span>
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-300">
              {isLoading ? '...' : `${stats.peakBlock.txs} txs`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-muted-foreground font-mono mt-0.5">
              Block #{stats.peakBlock.height}
            </div>
          </div>
        </div>

        {/* KPI 4: Average Size */}
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-emerald-500/20 dark:border-emerald-500/15 shadow-sm dark:shadow-none flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Avg Block Size
            </span>
          </div>
          <div className="mt-1.5">
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-300">
              {isLoading ? '...' : `${stats.avgSizeKb.toFixed(2)} KB`}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-muted-foreground font-mono mt-0.5">
              {chartData.length} blocks analyzed
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Main Glowing Area Chart */}
      <div className="relative w-full h-72 md:h-80 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 p-4 border border-slate-200/80 dark:border-primary/15 shadow-inner">
        {isLoading && chartData.length === 0 ? (
          <div className="h-full w-full flex flex-col justify-center space-y-3">
            <Skeleton className="h-4 w-48 bg-slate-200 dark:bg-slate-800/60" />
            <Skeleton className="h-full w-full bg-slate-200/60 dark:bg-slate-800/40 rounded-lg" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                {/* Emerald Gradient */}
                <linearGradient id="emeraldTxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="65%" stopColor="#10b981" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>

                {/* Violet Gradient */}
                <linearGradient id="violetTimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                  <stop offset="65%" stopColor="#8b5cf6" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>

                {/* Amber Gradient */}
                <linearGradient id="amberSizeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
                  <stop offset="65%" stopColor="#f59e0b" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>

                {/* Emerald Fee Gradient */}
                <linearGradient id="emeraldFeeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="65%" stopColor="#10b981" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-slate-200/80 dark:text-slate-800/80"
                vertical={false}
              />

              <XAxis
                dataKey="height"
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500"
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'currentColor' }}
                tickFormatter={(val) => `#${val}`}
                dy={6}
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                tickLine={false}
              />

              <YAxis
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500"
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'currentColor' }}
                tickFormatter={currentMeta.yAxisFormatter}
                dx={-4}
                axisLine={false}
                tickLine={false}
                allowDecimals={activeMetric !== 'transactions'}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Reference line for 60s target on blockTime metric */}
              {activeMetric === 'blockTime' && (
                <ReferenceLine
                  y={60}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: 'Meta: 60s',
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 10,
                    fontFamily: 'monospace'
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey={
                  activeMetric === 'transactions'
                    ? 'transactions'
                    : activeMetric === 'blockTime'
                    ? 'blockTime'
                    : activeMetric === 'blockSize'
                    ? 'blockSizeKb'
                    : 'totalFeePlo'
                }
                stroke={currentMeta.strokeColor}
                strokeWidth={2.5}
                fill={`url(#${currentMeta.gradientId})`}
                activeDot={{
                  r: 5,
                  stroke: currentMeta.strokeColor,
                  strokeWidth: 2,
                  fill: '#ffffff',
                  className: 'animate-pulse'
                }}
                isAnimationActive={true}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 4. Footer Legend / Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: currentMeta.strokeColor }}
            ></span>
            <span className="text-foreground font-medium">{currentMeta.label}</span>
          </span>
          <span className="text-slate-400 dark:text-slate-600">|</span>
          <span>Sample: Last {blockRange} confirmed blocks</span>
        </div>

        {lastUpdated && (
          <span className="text-[10px] text-slate-500 dark:text-slate-500">
            Updated at {lastUpdated.toLocaleTimeString('en-US')} (Auto-refresh 30s)
          </span>
        )}
      </div>
    </div>
  );
};

export default NetworkChart;



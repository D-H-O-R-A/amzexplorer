import { useState, useEffect } from 'react';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchNodesData, NodesData } from '@/services/api';
import { formatTimestamp, formatNumber } from '@/utils/formatter';
import { isTestnet, getCoinName } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Clock, 
  Settings, 
  ArrowUp, 
  ArrowDown, 
  Shield, 
  Award, 
  Cpu, 
  Search, 
  Copy, 
  Check, 
  Info, 
  Server, 
  RefreshCw, 
  BarChart3, 
  Database,
  Activity,
  Heart
} from 'lucide-react';

const NodesPage = () => {
  const [nodesData, setNodesData] = useState<NodesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [peerSearch, setPeerSearch] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const isTest = isTestnet();
  const mainNodeUrl = isTest ? 'nodes-testnet.amzexplorer.com' : 'nodes.amzexplorer.com';

  const loadNodesData = async (showProgress = true) => {
    try {
      if (showProgress) setLoading(true);
      else setRefreshing(true);
      const data = await fetchNodesData();
      setNodesData(data);
    } catch (error) {
      console.error('Failed to load nodes data:', error);
      toast.error('Erro ao atualizar dados de telemetria da rede.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNodesData();
    // Auto refresh telemetry every 30 seconds
    const interval = setInterval(() => {
      loadNodesData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-8 py-6 pb-20 animate-fade-in">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border border-border bg-card/40">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!nodesData) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto animate-bounce" />
        <h1 className="text-3xl font-black text-foreground">Connection Failed</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Unable to establish communication with AMZ network telemetry and synchronization APIs.
        </p>
        <Button onClick={() => loadNodesData(true)} variant="outline" className="border-border">
          Try Again
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activated':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-semibold px-2.5 py-0.5">Activated</Badge>;
      case 'voting':
        return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-semibold px-2.5 py-0.5">Voting</Badge>;
      case 'implemented':
        return <Badge className="bg-teal-500/10 text-teal-500 border border-teal-500/20 rounded-lg text-xs font-semibold px-2.5 py-0.5">Implemented</Badge>;
      default:
        return <Badge variant="outline" className="rounded-lg text-xs font-semibold px-2.5 py-0.5">{status}</Badge>;
    }
  };

  // Filter peers based on search query
  const filteredPeers = nodesData.connectedPeers.filter(peer => 
    (peer.peerName || '').toLowerCase().includes(peerSearch.toLowerCase()) ||
    (peer.address || '').toLowerCase().includes(peerSearch.toLowerCase()) ||
    (peer.applicationName || '').toLowerCase().includes(peerSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 py-6 pb-20 animate-fade-in">
      <SEO 
        title="Network Status & Validator Nodes"
        description="Real-time telemetry of validator nodes, connected peers, protocol feature activation, and block rewards on the AMZ blockchain."
      />
      
      {/* Header and Telemetry state */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
              Nodes & Network Telemetry
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 py-0.5 px-2 rounded-full font-bold text-[10px] animate-pulse">
              <Activity className="w-3 h-3" />
              Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Real-time peer connectivity statistics, feature activation tracking, consensus validator nodes, and global protocol parameters for {isTest ? 'Testnet' : 'Mainnet'}.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => loadNodesData(false)}
          disabled={refreshing}
          className="border-border self-start md:self-center hover:bg-muted/50 rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Syncing...' : 'Refresh'}
        </Button>
      </div>

      {/* Grid: Telemetry Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-emerald-500/15 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Connected Peers</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Wifi className="h-4 w-4 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {nodesData.connectedPeers.length + 1}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Server className="w-3 h-3 text-emerald-500" /> Including primary node
            </p>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-rose-500/15 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Blacklisted Peers</CardTitle>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <WifiOff className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {nodesData.blacklistedPeers.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Suspended for network safety</p>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-amber-500/15 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Suspended Peers</CardTitle>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {nodesData.suspendedPeers.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Temporary peer suspensions</p>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-emerald-500/15 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Block Height</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Database className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {formatNumber(nodesData.activationStatus.height)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Blocks verified on ledger</p>
          </CardContent>
        </Card>

      </div>

      {/* Observability center tabs */}
      <Tabs defaultValue="connected" className="space-y-6">
        
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/30 p-1 border border-border/60 rounded-xl overflow-x-auto w-full md:grid md:grid-cols-6">
          <TabsTrigger value="connected" className="flex items-center gap-1.5 rounded-lg py-2.5 font-semibold text-xs md:text-sm">
            <Wifi className="w-3.5 h-3.5" /> Active Peers
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1.5 rounded-lg py-2.5 font-semibold text-xs md:text-sm">
            <Settings className="w-3.5 h-3.5" /> Features
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-1.5 rounded-lg py-2.5 font-semibold text-xs md:text-sm">
            <Award className="w-3.5 h-3.5" /> Rewards
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-1.5 rounded-lg py-2.5 font-semibold text-xs md:text-sm">
            <Clock className="w-3.5 h-3.5" /> Time Sync
          </TabsTrigger>
          <TabsTrigger value="blacklisted" className="flex items-center gap-1.5 rounded-lg py-2.5 font-semibold text-xs md:text-sm">
            <WifiOff className="w-3.5 h-3.5" /> Blacklisted
          </TabsTrigger>
          <TabsTrigger value="suspended" className="flex items-center gap-1.5 rounded-lg py-2.5 font-semibold text-xs md:text-sm">
            <Shield className="w-3.5 h-3.5" /> Suspended
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Connected Peers */}
        <TabsContent value="connected" className="space-y-4">
          
          {/* Peer Search Section */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={peerSearch}
              onChange={(e) => setPeerSearch(e.target.value)}
              placeholder="Filter peers by name or address..."
              className="pl-9 pr-4 py-5 bg-white border-slate-200 text-slate-950 placeholder:text-slate-400 text-xs rounded-xl focus-visible:ring-emerald-500/50 shadow-sm font-medium"
            />
          </div>

          <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Wifi className="w-4 h-4 text-emerald-500" />
                Active Connected Peers
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Active nodes broadcasting blocks and transactions across the AMZ ledger.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-b border-border/40">
                      <TableHead className="text-xs font-bold text-muted-foreground pl-6">Node Name</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">IP / Endpoint</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Application</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Version</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground pr-6 text-right">Peer Nonce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Main Node */}
                    <TableRow className="border-b border-border/30 hover:bg-muted/10">
                      <TableCell className="font-bold text-emerald-500 flex items-center gap-1.5 pl-6 py-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        AMZ Blockchain Node (Primary)
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <span className="inline-flex items-center gap-1">
                          {mainNodeUrl}
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted rounded" onClick={() => handleCopy(mainNodeUrl)}>
                            {copiedText === mainNodeUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                          </Button>
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">amzA</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/15 text-[10px] font-mono">
                          Main Branch
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right pr-6">-</TableCell>
                    </TableRow>

                    {/* Filtered connected peers */}
                    {filteredPeers.map((peer, idx) => (
                      <TableRow key={idx} className="border-b border-border/30 hover:bg-muted/10">
                        <TableCell className="font-semibold text-foreground pl-6 py-4">
                          {peer.peerName || 'Anônimo'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className="inline-flex items-center gap-1">
                            {peer.address}
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted rounded" onClick={() => handleCopy(peer.address)}>
                              {copiedText === peer.address ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                            </Button>
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">AmzxP</TableCell>
                        <TableCell className="font-mono text-xs">{peer.applicationVersion}</TableCell>
                        <TableCell className="font-mono text-xs text-right pr-6 text-muted-foreground">{formatNumber(peer.peerNonce)}</TableCell>
                      </TableRow>
                    ))}

                    {filteredPeers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground pr-6">
                          Nenhum peer conectado correspondente à busca.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Layout (Strict Responsive) */}
              <div className="block md:hidden p-4 space-y-4">
                {/* Main Node Card */}
                <div className="border border-emerald-500/20 rounded-xl bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Nó Principal
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/15 text-[9px] font-mono">
                      Main Branch
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>IP/URL:</span>
                      <span className="font-mono text-foreground font-bold">{mainNodeUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aplicação:</span>
                      <span className="text-foreground">amzA</span>
                    </div>
                  </div>
                </div>

                {/* Filtered Peer Cards */}
                {filteredPeers.map((peer, idx) => (
                  <div key={idx} className="border border-border rounded-xl bg-muted/10 p-4 space-y-3 hover:border-emerald-500/15 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">
                        {peer.peerName || 'Anônimo'}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono">
                        Versão {peer.applicationVersion}
                      </Badge>
                    </div>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>Endereço IP:</span>
                        <span className="font-mono text-foreground font-semibold">{peer.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aplicação:</span>
                        <span className="text-foreground">{peer.applicationName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peer Nonce:</span>
                        <span className="font-mono text-foreground">{formatNumber(peer.peerNonce)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPeers.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Nenhum peer conectado correspondente à busca.
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Blockchain Features */}
        <TabsContent value="features">
          <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Settings className="w-4 h-4 text-emerald-500" />
                Blockchain Protocol Feature Activation
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Protocol features implemented across the network and ongoing voting progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Voting Interval</span>
                  <div className="text-xl font-extrabold text-foreground mt-2">{nodesData.activationStatus.votingInterval} blocks</div>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Next Check</span>
                  <div className="text-xl font-extrabold text-foreground mt-2">Block #{formatNumber(nodesData.activationStatus.nextCheck)}</div>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col justify-between">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Voting Threshold</span>
                  <div className="text-xl font-extrabold text-foreground mt-2">{nodesData.activationStatus.votingThreshold} votes</div>
                </div>
              </div>

              {/* Table View */}
              <div className="overflow-x-auto pt-2">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-b border-border/40">
                      <TableHead className="text-xs font-bold text-muted-foreground">Feature ID</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Description</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">Activation Height</TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground text-right">Supporting Blocks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nodesData.activationStatus.features.map((feature) => (
                      <TableRow key={feature.id} className="border-b border-border/30 hover:bg-muted/10">
                        <TableCell className="font-mono text-xs font-bold text-emerald-500">{feature.id}</TableCell>
                        <TableCell className="text-xs font-medium text-foreground">{feature.description.replace(/waves/gi, getCoinName())}</TableCell>
                        <TableCell>{getStatusBadge(feature.blockchainStatus)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {feature.activationHeight !== undefined ? `#${formatNumber(feature.activationHeight)}` : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-right text-muted-foreground">
                          {feature.supportingBlocks !== undefined ? formatNumber(feature.supportingBlocks) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Rewards & DAO Parameters */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-emerald-500/15 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Reward</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-500 font-mono">
                  {formatNumber(nodesData.blockchainRewards.currentReward / Math.pow(10, 8))} {getCoinName()}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Per forged block</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-emerald-500/15 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Supply ({getCoinName()})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground font-mono">
                  {formatNumber(nodesData.blockchainRewards.totalWavesAmount / Math.pow(10, 8))} {getCoinName()}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Circulating on ledger</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-emerald-500/15 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Voting Term</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground font-mono">
                  {nodesData.blockchainRewards.term}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Voting term duration</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/40 backdrop-blur-xl shadow hover:border-emerald-500/15 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Next Reward Check</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground font-mono">
                  {formatNumber(nodesData.blockchainRewards.nextCheck)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Next target height check</p>
              </CardContent>
            </Card>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Voting Details */}
            <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Voting Status (Incentive Adjustments)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Incentive proposals and active validator votes for reward parameter modifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4 text-emerald-500" />
                      <span className="text-muted-foreground">Votes to Increase</span>
                    </div>
                    <span className="font-bold text-foreground font-mono">
                      {nodesData.blockchainRewards.votes.increase}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-rose-500" />
                      <span className="text-muted-foreground">Votes to Decrease</span>
                    </div>
                    <span className="font-bold text-foreground font-mono">
                      {nodesData.blockchainRewards.votes.decrease}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-emerald-500/80" />
                      <span className="text-muted-foreground">Regulatory Voting Threshold</span>
                    </div>
                    <span className="font-bold text-foreground font-mono">
                      {nodesData.blockchainRewards.votingThreshold} votes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DAO & Increment Details */}
            <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  Parameters & DAO Address
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Corporate allocations and minimum reward increment adjustments.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Minimum Increment</span>
                    <span className="font-bold text-foreground font-mono">
                      {formatNumber(nodesData.blockchainRewards.minIncrement / Math.pow(10, 8))} {getCoinName()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Voting Interval Start</span>
                    <span className="font-bold text-foreground font-mono">
                      {formatNumber(nodesData.blockchainRewards.votingIntervalStart)}
                    </span>
                  </div>
                  <div className="flex flex-col py-2 gap-1.5">
                    <span className="text-muted-foreground">DAO Treasury Address</span>
                    <span className="font-mono text-xs break-all bg-muted/40 p-2 rounded-xl border border-border">
                      {nodesData.blockchainRewards.daoAddress || 'Not configured'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tab 4: Network Time Telemetry */}
        <TabsContent value="time" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-500" />
                  Hora do Sistema Local
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Timestamp retornado pelas configurações de máquina local.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="text-2xl font-black text-foreground font-mono">
                  {formatTimestamp(nodesData.networkTime.system)}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Referência raw do servidor principal: <strong className="text-foreground font-mono">{nodesData.networkTime.system} ms</strong>.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Sincronização NTP da Blockchain
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Tempo oficial de consenso global (Network Time Protocol).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="text-2xl font-black text-emerald-500 font-mono">
                  {formatTimestamp(nodesData.networkTime.NTP)}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Referência oficial NTP: <strong className="text-foreground font-mono">{nodesData.networkTime.NTP} ms</strong>.
                </p>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tab 5: Blacklisted Peers */}
        <TabsContent value="blacklisted">
          <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <WifiOff className="w-4 h-4 text-rose-500" />
                Blacklisted Peers (Security)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Hostnames and IP addresses temporarily or permanently banned from the peer ledger.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              
              {nodesData.blacklistedPeers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="border-b border-border/40">
                        <TableHead className="text-xs font-bold text-muted-foreground pl-6">Hostname / IP</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">Banned At</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground pr-6">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nodesData.blacklistedPeers.map((peer, index) => (
                        <TableRow key={index} className="border-b border-border/30 hover:bg-muted/10">
                          <TableCell className="font-mono text-xs font-semibold text-foreground pl-6 py-4 break-all">{peer.hostname}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatTimestamp(peer.timestamp)}</TableCell>
                          <TableCell className="text-xs font-medium text-rose-500 pr-6">{peer.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  <Heart className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                  No peers blacklisted on the network. Excellent consensus behavior!
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Suspended Peers */}
        <TabsContent value="suspended">
          <Card className="border border-border bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4 text-amber-500" />
                Suspended Peers
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Nodes with connections temporarily suspended for peer latency stabilization.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              
              {nodesData.suspendedPeers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="border-b border-border/40">
                        <TableHead className="text-xs font-bold text-muted-foreground pl-6">Hostname / IP</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground pr-6">Suspended At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nodesData.suspendedPeers.map((peer, index) => (
                        <TableRow key={index} className="border-b border-border/30 hover:bg-muted/10">
                          <TableCell className="font-mono text-xs font-semibold text-foreground pl-6 py-4 break-all">{peer.hostname}</TableCell>
                          <TableCell className="text-xs text-muted-foreground pr-6">{formatTimestamp(peer.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  <Heart className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                  No peers currently suspended. Flawless synchronization!
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default NodesPage;

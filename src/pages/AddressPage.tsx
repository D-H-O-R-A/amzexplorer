import AddressView from "@/components/AddressView";
import SEO from "@/components/SEO";
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  fetchAddressData, 
  fetchAddressNFTs, 
  NFT, 
  AddressData, 
  fetchAddressTransactions, 
  Transaction, 
  fetchDetailedBalance, 
  DetailedBalance,
  validateAddress
} from '@/services/api';
import { Loader2, AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { getChainId, getCoinName } from '@/lib/utils';
import { ethAddress2waves, wavesAddress2eth } from '@waves/node-api-js';

const AddressPage = () => {
  const { address } = useParams<{ address: string }>();
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [detailedBalance, setDetailedBalance] = useState<DetailedBalance | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingNFTs, setLoadingNFTs] = useState<boolean>(false);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(false);
  const [isValidAddressState, setIsValidAddressState] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAddressData = async () => {
      if (!address) return;
      setLoading(true);
      setIsValidAddressState(true);
      
      try {
        console.log("Validating and loading address:", address);
        
        let targetAddress = address;
        let ethAddress = '';
        let wavesAddress = '';
        
        // 1. Check & Convert EVM Address
        if (address.startsWith('0x')) {
          ethAddress = address;
          try {
            wavesAddress = ethAddress2waves(address, getChainId());
            targetAddress = wavesAddress;
            
            // Validate converted address
            if (!validateAddress(wavesAddress)) {
              setIsValidAddressState(false);
              setLoading(false);
              return;
            }
            
            // Redirect to consistency format
            navigate(`/address/${wavesAddress}`, { replace: true });
            return;
          } catch (error) {
            console.error(`Error converting or validating converted EVM address:`, error);
            setIsValidAddressState(false);
            setLoading(false);
            return;
          }
        } else {
          wavesAddress = address;
          try {
            ethAddress = wavesAddress2eth(address);
          } catch (error) {
            console.warn("Could not derive Ethereum address from AMZ address format.", error);
          }
        }

        // 2. Perform strict chain-level address validation
        if (!validateAddress(targetAddress)) {
          setIsValidAddressState(false);
          setLoading(false);
          return;
        }

        // 3. Fetch Address Data & Detailed Balance in parallel
        const [data, balanceData] = await Promise.all([
          fetchAddressData(targetAddress).catch(err => {
            console.error("Error fetching address data:", err);
            return null;
          }),
          fetchDetailedBalance(targetAddress).catch(err => {
            console.error("Error fetching detailed balance:", err);
            return null;
          })
        ]);

        if (!data) {
          // If validator passes but on-chain details fail, we still initialize minimum structure with zero-balance
          const fallbackData: AddressData = {
            address: targetAddress,
            balance: 0,
            regular: 0,
            available: 0,
            effective: 0,
            generating: 0,
            wavesAddress: wavesAddress,
            ethAddress: ethAddress
          };
          setAddressData(fallbackData);
        } else {
          data.wavesAddress = wavesAddress;
          data.ethAddress = ethAddress || data.ethAddress;
          setAddressData(data);
        }
        
        setDetailedBalance(balanceData);

        // Load NFTs in background
        setLoadingNFTs(true);
        try {
          const nftData = await fetchAddressNFTs(targetAddress);
          setNfts(nftData || []);
        } catch (error) {
          console.error("Error loading NFTs:", error);
          setNfts([]);
        } finally {
          setLoadingNFTs(false);
        }

        // Load Transactions in background
        setLoadingTransactions(true);
        try {
          const transactionData = await fetchAddressTransactions(targetAddress, 100);
          setTransactions(transactionData || []);
        } catch (error) {
          console.error("Error loading transactions:", error);
          setTransactions([]);
        } finally {
          setLoadingTransactions(false);
        }

      } catch (error) {
        console.error("Critical error in loadAddressData:", error);
        setIsValidAddressState(false);
      } finally {
        setLoading(false);
      }
    };

    loadAddressData();
  }, [address, navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen px-4 md:px-8 py-8 pb-24 md:pb-8"
    >
      <SEO 
        title={`Address ${address ? address.substring(0, 10) + '...' : ''}`}
        description={`On-chain record for address ${address} on the AMZ blockchain. Balances, tokens, NFTs, transactions, and associated smart contracts.`}
      />
      <div className="container mx-auto max-w-5xl">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Loading account and assets...</span>
          </div>
        ) : !isValidAddressState ? (
          // High-Fidelity Validation Failure Screen
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md mx-auto my-12 p-6 md:p-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl shadow-xl space-y-6 text-center"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground">Incompatible Address</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The provided address <code className="font-mono text-xs bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded break-all">{address}</code> is invalid or incompatible with the <span className="font-bold text-emerald-500">AMZ</span> network.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-background/50 border border-border/40 text-left space-y-2 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> AMZ Network Rules:
              </div>
              <p>• Expected Chain ID for this node is <span className="font-bold text-emerald-500">"{String.fromCharCode(getChainId())}"</span> (Byte: {getChainId()}).</p>
              <p>• Addresses must be cryptographically valid Base58 strings.</p>
              <p>• EVM addresses (<code className="font-mono">0x...</code>) are automatically mapped if originating on the same Chain ID.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => navigate('/')} 
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold py-5 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Button>
            </div>
          </motion.div>
        ) : addressData ? (
          <AddressView 
            addressData={addressData}
            detailedBalance={detailedBalance}
            transactions={transactions} 
            loadingTransactions={loadingTransactions} 
            nfts={nfts}
            loadingNFTs={loadingNFTs}
          />
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Address Details Unavailable</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Could not render account portfolio data for this address. Please try again later.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AddressPage;

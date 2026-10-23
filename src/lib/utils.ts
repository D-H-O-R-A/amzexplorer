import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Constants for blockchain node connections
export const NODE_URL = 'https://nodes.amzexplorer.com';
export const ETH_NODE_URL = 'https://rpc.amzexplorer.com';
export const DATA_SERVICE_URL = 'https://data-service.amzexplorer.com';
export const CHAIN_ID = 65; // 'A' in ASCII is 65 for AMZX Blockchain
export const EXPLORER_URL = 'https://amzexplorer.com';
export const CHAIN_ID_LETTER = 'A'; // Chain ID letter for AMZX

// Official Encrypted HTTPS / GRPCS Endpoints
export const NODE_SWAGGER_URL = 'https://nodes.amzexplorer.com/';
export const MATCHER_SWAGGER_URL = 'https://matcher.amzexplorer.com';
export const METAMASK_RPC_URL = 'https://rpc.amzexplorer.com';
export const DATA_SERVICE_DOCS_URL = 'https://data-service.amzexplorer.com';
export const GRPC_DEX_URL = 'https://grpc-dex.amzexplorer.com'; // WSS/GRPCS:443
export const GRPC_UPDATES_URL = 'https://grpc-updates.amzexplorer.com'; // GRPCS:443

// Testnet constants
export const TESTNET_NODE_URL = 'https://nodes-testnet.amzexplorer.com';
export const TESTNET_ETH_NODE_URL = 'https://rpc-testnet.amzexplorer.com';
export const TESTNET_DATA_SERVICE_URL = 'https://data-service-testnet.amzexplorer.com';
export const TESTNET_CHAIN_ID = 'S'; // Testnet Chain ID
export const TESTNET_EXPLORER_URL = 'https://testnet.amzexplorer.com';

// Import necessary functions from @better2better/waves-node-api-js
import { wavesAsset2Eth, ethTxId2waves } from '@better2better/waves-node-api-js';

// Add utility functions for asset and transaction conversions
export const convertWavesAssetToEth = (assetId: string): string => {
  try {
    return wavesAsset2Eth(assetId);
  } catch (error) {
    console.error("Error converting AMZ asset to ETH:", error);
    return assetId;
  }
};

export const convertEthTxToWaves = (txId: string): string => {
  try {
    return ethTxId2waves(txId);
  } catch (error) {
    console.error("Error converting ETH tx to AMZ:", error);
    return txId;
  }
};

// Environment detection
export const isTestnet = () => {
  return false;
};

// Get appropriate URLs based on environment and local storage
export const getNodeUrl = (): string => {
  if (isTestnet()) return TESTNET_NODE_URL;
  return localStorage.getItem('custom_node_url') || NODE_URL;
};

export const getEthNodeUrl = (): string => {
  if (isTestnet()) return TESTNET_ETH_NODE_URL;
  return localStorage.getItem('custom_eth_node_url') || ETH_NODE_URL;
};

export const getDataServiceUrl = (): string => {
  if (isTestnet()) return TESTNET_DATA_SERVICE_URL;
  return localStorage.getItem('custom_data_service_url') || DATA_SERVICE_URL;
};

export const getChainId = (): number => {
  if (isTestnet()) return 83; // 'S' in ASCII is 83
  const custom = localStorage.getItem('custom_chain_id');
  if (custom) {
    if (isNaN(Number(custom))) {
      return custom.charCodeAt(0);
    } else {
      return Number(custom);
    }
  }
  return CHAIN_ID;
};

export const getChainIdLetter = (): string => {
  if (isTestnet()) return 'S';
  const customLetter = localStorage.getItem('custom_chain_id_letter');
  if (customLetter) return customLetter;
  const custom = localStorage.getItem('custom_chain_id');
  if (custom) {
    if (isNaN(Number(custom))) {
      return custom.substring(0, 1).toUpperCase();
    } else {
      return String.fromCharCode(Number(custom));
    }
  }
  return CHAIN_ID_LETTER;
};

export const getCoinName = (): string => {
  if (isTestnet()) return 'AMZT';
  return localStorage.getItem('custom_coin_name') || 'AMZ';
};

export const getExplorerUrl = (): string => isTestnet() ? TESTNET_EXPLORER_URL : EXPLORER_URL;

// Get the appropriate base URL for GCS API based on current network and custom node URL
export const getGCSApiUrl = (): string => {
  if (isTestnet()) return TESTNET_NODE_URL;
  return localStorage.getItem('custom_node_url') || NODE_URL;
};

// Get the appropriate base URL for the FullExplorer API (PHP backend)
export const getFullExplorerApiUrl = (): string => {
  const isTest = isTestnet();
  
  // Allow overriding via localStorage for local backend development
  const customUrl = localStorage.getItem('custom_fullexplorer_url');
  if (customUrl) return customUrl;

  return isTest ? "https://testnet-fullexplorer.amzexplorer.com/api" : "https://fullexplorer.amzexplorer.com/api";
};

// Get the appropriate base URL for the FullExplorer Web UI
export const getFullExplorerUiUrl = (path: string = ''): string => {
  const isTest = isTestnet();
  
  // Allow overriding via localStorage
  const customUrl = localStorage.getItem('custom_fullexplorer_ui_url');
  if (customUrl) return `${customUrl}/${path}`;

  // Auto-detect local development
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' || 
                      window.location.hostname.startsWith('192.168.');
  
  let baseUrl = '';
  if (isLocalhost) {
    baseUrl = "http://localhost:8080";
  } else {
    baseUrl = isTest ? "https://testnet-fullexplorer.amzexplorer.com" : "https://fullexplorer.amzexplorer.com";
  }
  return path ? `${baseUrl}/${path}` : baseUrl;
};

import { base58Decode, bytesToString } from '@waves/ts-lib-crypto';

/**
 * Format a timestamp to a human-readable date
 */
export const formatDate = (timestamp: number): string => {
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);
  return date.toLocaleString();
};

/**
 * Format a number to a human-readable number with thousands separators
 */
export const formatNumber = (num: number | string | bigint, maxDecimals: number = 18): string => {
  if (num === undefined || num === null || num === '') return '0';
  const str = num.toString().trim();
  if (str.includes('.')) {
    return formatDecimal(str, maxDecimals);
  }
  try {
    return BigInt(str).toLocaleString('pt-BR');
  } catch {
    return str;
  }
};

/**
 * Format a number with specified decimal places (supports up to 18 decimals)
 */
export const formatDecimal = (num: number | string | bigint, decimals: number = 8, minDecimals: number = 0): string => {
  if (num === undefined || num === null || num === '') return '0';
  const str = num.toString().trim();
  if (str === '0') return minDecimals > 0 ? '0,' + '0'.repeat(minDecimals) : '0';
  
  const isNegative = str.startsWith('-');
  const cleanStr = isNegative ? str.slice(1) : str;
  const [intPart = '0', fracPart = ''] = cleanStr.split('.');
  
  let formattedInt = intPart;
  try {
    formattedInt = BigInt(intPart).toLocaleString('pt-BR');
  } catch {}
  
  const trimmedFrac = fracPart.slice(0, decimals).replace(/0+$/, '');
  const finalFrac = trimmedFrac.length < minDecimals ? trimmedFrac.padEnd(minDecimals, '0') : trimmedFrac;
  const res = finalFrac.length > 0 ? `${formattedInt},${finalFrac}` : formattedInt;
  return isNegative ? `-${res}` : res;
};

/**
 * Format an amount of AMZ (or any custom token up to 18 decimals)
 * Converts from atomic satoshis to human-readable units using exact string BigInt arithmetic.
 */
export const formatAmount = (
  amount: number | string | bigint,
  decimals: number = 8,
  minDecimals: number = 0
): string => {
  if (amount === undefined || amount === null || amount === '') return '0';
  
  let str = typeof amount === 'number'
    ? (Number.isFinite(amount) ? Math.floor(amount).toString() : '0')
    : amount.toString().trim();
  
  str = str.split('.')[0] || '0';
  let isNegative = false;
  if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1);
  }
  str = str.replace(/^0+/, '') || '0';
  if (str === '0') return minDecimals > 0 ? '0,' + '0'.repeat(minDecimals) : '0';

  const dec = Math.max(0, Math.min(18, Number(decimals) || 0));
  if (dec === 0) {
    try {
      const formatted = BigInt(str).toLocaleString('pt-BR');
      return (isNegative ? '-' : '') + formatted;
    } catch {
      return (isNegative ? '-' : '') + str;
    }
  }

  const padded = str.padStart(dec + 1, '0');
  const intPart = padded.slice(0, padded.length - dec);
  let fracPart = padded.slice(padded.length - dec);

  let formattedInt = intPart;
  try {
    formattedInt = BigInt(intPart).toLocaleString('pt-BR');
  } catch {}

  fracPart = fracPart.replace(/0+$/, '');
  if (fracPart.length < minDecimals) {
    fracPart = fracPart.padEnd(minDecimals, '0');
  }

  const result = fracPart.length > 0 ? `${formattedInt},${fracPart}` : formattedInt;
  return (isNegative ? '-' : '') + result;
};

/**
 * Shorten an address or hash for display
 */
export const shortenHash = (hash: string, chars: number = 6): string => {
  if (!hash || hash.length <= chars * 2) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
};

/**
 * Format block time in seconds
 * This function now accepts either a Date object or a number (milliseconds)
 */
export const formatBlockTime = (time: Date | number): string => {
  // If time is a Date object, convert to seconds, otherwise assume it's already in seconds
  const seconds = time instanceof Date ? time.getTime() / 1000 : (typeof time === 'number' ? time : 0);
  return `${seconds.toFixed(1)} seconds`;
};

/**
 * Calculate time passed since timestamp
 */
export const timeSince = (timestamp: number): string => {
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const seconds = Math.floor((Date.now() - ms) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return "Just now";
};

/**
 * Format time ago - alias for timeSince for consistency
 */
export const formatTimeAgo = (timestamp: number): string => {
  return timeSince(timestamp);
};

/**
 * Format file size
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0)} ${sizes[i]}`;
};

/**
 * Format a timestamp to a human-readable date
 */
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return 'Unknown';
  
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const date = new Date(ms);
  const diffMs = now - ms;
  
  // Less than a minute
  if (diffMs < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffMs < 3600000) {
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  }
  
  // Less than a day
  if (diffMs < 86400000) {
    const hours = Math.floor(diffMs / 3600000);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffMs < 604800000) {
    const days = Math.floor(diffMs / 86400000);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Format as date
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString(undefined, options);
};

/**
 * Format AMZ balance (dividing by 10^8)
 */
export const formatAmzBalance = (balance: number | string | bigint): string => {
  return formatAmount(balance, 8);
};

export const formatPloBalance = formatAmzBalance;

// Alias for internal legacy compatibility
export const formatGicBalance = formatAmzBalance;

/**
 * Format asset amount with appropriate decimal places (supports up to 18 decimals)
 */
export const formatAssetAmount = (amount: number | string | bigint, decimals: number = 8): string => {
  return formatAmount(amount, decimals);
};

/**
 * Decode Base58 attachment into readable UTF-8 text, with fallback to original
 */
export const decodeAttachment = (attachment?: string): string => {
  if (!attachment || typeof attachment !== 'string') return '';
  const trimmed = attachment.trim();
  if (!trimmed) return '';
  try {
    const bytes = base58Decode(trimmed);
    const decoded = bytesToString(bytes);
    if (decoded && /^[\x20-\x7E\s\p{L}\p{N}\p{P}\p{S}]+$/u.test(decoded)) {
      return decoded;
    }
  } catch (e) {
    // If decoding fails, fallback to original
  }
  return trimmed;
};



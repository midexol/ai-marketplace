export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatNumber(num: string | number, decimals = 2): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

/** Compact notation (1.2K, 3.4M, 1.2B) so large values fit in small containers. */
export function formatCompact(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) < 1000) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
}

export function formatPrice(priceWei: string | number, decimals = 18): string {
  if (priceWei === null || priceWei === undefined || priceWei === '') {
    return '0.0000';
  }

  const raw = String(priceWei).trim();

  if (!/^-?\d+$/.test(raw)) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed.toFixed(4) : '0.0000';
  }

  const price = BigInt(raw);
  const divisor = 10n ** BigInt(decimals);
  const wholePart = price / divisor;
  const fractionalPart = price % divisor;

  const fractional = fractionalPart.toString().padStart(decimals, '0').slice(0, 4);
  return `${wholePart}.${fractional}`;
}

export function formatUSD(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return 'N/A';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return 'N/A';

  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return d.toLocaleDateString();
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function truncateText(text: string, length = 50): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

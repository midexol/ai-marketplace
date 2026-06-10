'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatPrice } from '@/utils/formatters';

interface ChartDataPoint {
  timestamp: number | string;
  price: number;
  volume?: number;
}

interface PriceChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  height?: number;
  showArea?: boolean;
  tooltipFormatter?: (value: number) => string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) {
    return null;
  }

  const data = payload[0].payload;
  const timestamp = typeof data.timestamp === 'number'
    ? new Date(data.timestamp).toLocaleDateString()
    : data.timestamp;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
      <p className="text-xs text-slate-400">{timestamp}</p>
      <p className="text-sm font-semibold text-cyan-400">
        {formatPrice(data.price)}
      </p>
      {data.volume && (
        <p className="text-xs text-slate-400">Vol: {data.volume}</p>
      )}
    </div>
  );
};

export function PriceChart({
  data,
  isLoading = false,
  error = null,
  height = 300,
  showArea = true,
  tooltipFormatter,
}: PriceChartProps) {
  if (isLoading) {
    return (
      <div
        style={{ height }}
        className="w-full bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="text-sm text-slate-400">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ height }}
        className="w-full bg-slate-800/50 rounded-lg border border-red-500/50 flex items-center justify-center"
      >
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-center"
      >
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    timestamp:
      typeof point.timestamp === 'number'
        ? new Date(point.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : point.timestamp,
  }));

  const minPrice = Math.min(...data.map((p) => p.price));
  const maxPrice = Math.max(...data.map((p) => p.price));
  const domain = [
    Math.floor(minPrice * 0.95),
    Math.ceil(maxPrice * 1.05),
  ];

  if (showArea) {
    return (
      <div className="w-full bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="timestamp"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={domain}
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tickFormatter={(value: number) =>
                tooltipFormatter ? tooltipFormatter(value) : formatPrice(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#06b6d4"
              fillOpacity={1}
              fill="url(#colorPrice)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-800/50 rounded-lg border border-slate-700 p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis
            dataKey="timestamp"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={domain}
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tickFormatter={(value: number) =>
              tooltipFormatter ? tooltipFormatter(value) : formatPrice(value)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

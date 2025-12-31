import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { FlightOffer } from '../types';

interface StatsChartProps {
  data: FlightOffer[];
}

interface GroupedData {
  date: string;
  total: number;
  count: number;
  minPrice: number;
}

const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  // Aggregate data: Average price per day to keep chart readable
  const chartData = React.useMemo(() => {
    const grouped = data.reduce((acc, curr) => {
      if (!acc[curr.date]) {
        acc[curr.date] = { date: curr.date, total: 0, count: 0, minPrice: 9999 };
      }
      acc[curr.date].total += curr.price;
      acc[curr.date].count += 1;
      acc[curr.date].minPrice = Math.min(acc[curr.date].minPrice, curr.price);
      return acc;
    }, {} as Record<string, GroupedData>);

    return Object.values(grouped).map((item: GroupedData) => ({
      date: item.date,
      avgPrice: Math.round(item.total / item.count),
      minPrice: item.minPrice
    }));
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">90-Day Price Trend (Cheapest Options)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(val) => val.slice(5)} // Show MM-DD
              minTickGap={30}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              domain={[0, 'auto']}
              unit="$"
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <ReferenceLine y={150} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'Cash Deal', fill: '#10b981', fontSize: 12 }} />
            <ReferenceLine y={400} stroke="#d97706" strokeDasharray="3 3" label={{ position: 'right', value: 'Check Points', fill: '#d97706', fontSize: 12 }} />
            <Line 
              type="monotone" 
              dataKey="minPrice" 
              name="Lowest Price"
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;
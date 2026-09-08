import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { Measurement } from '../../types';
import { TrendingUp } from 'lucide-react';
import { formatIndianTime } from '../../utils/dateUtils';

interface ExposureChartProps {
  measurements: Measurement[];
  className?: string;
}

export const ExposureChart: React.FC<ExposureChartProps> = ({ measurements, className = '' }) => {
  const sorted = [...measurements].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const chartData = sorted.map(m => ({
    time: formatIndianTime(m.timestamp),
    exposure: m.estimatedExposure,
    worker: m.workerName || m.workerId,
    status: m.exposureStatus,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg font-mono text-xs space-y-1">
          <div className="text-slate-400 font-semibold">{data.time}</div>
          <div className="text-slate-800">
            Worker: <strong className="text-sky-600">{data.worker}</strong>
          </div>
          <div className="text-slate-800">
            Est. Exposure: <strong className="text-amber-600">{data.exposure} ppm·h</strong>
          </div>
          <div className="text-[10px] text-slate-500 uppercase">
            Status: <span className="text-emerald-600 font-bold">{data.status}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`industrial-card p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
            Exposure Dosage Trend (ppm·h)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Real-time Timeline
        </span>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="exposureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 'dataMax + 10']} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine y={10} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'MODERATE (10.0)', fill: '#d97706', fontSize: 9 }} />
            <ReferenceLine y={25} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'HIGH LIMIT (25.0)', fill: '#e11d48', fontSize: 9 }} />

            <Area 
              type="monotone" 
              dataKey="exposure" 
              stroke="#0284c7" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#exposureGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

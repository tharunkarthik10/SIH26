import React from 'react';
import { Measurement } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface StatusBreakdownProps {
  measurements: Measurement[];
}

export const StatusBreakdown: React.FC<StatusBreakdownProps> = ({ measurements }) => {
  let low = 0;
  let mod = 0;
  let high = 0;

  measurements.forEach((m) => {
    if (m.exposureStatus === 'LOW') low++;
    else if (m.exposureStatus === 'MODERATE') mod++;
    else if (m.exposureStatus === 'HIGH') high++;
  });

  const total = measurements.length || 1;
  const lowPct = Math.round((low / total) * 100);
  const modPct = Math.round((mod / total) * 100);
  const highPct = Math.round((high / total) * 100);

  return (
    <div className="industrial-card p-5 space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
          Exposure Category Breakdown
        </h3>
        <p className="text-[11px] text-slate-500 font-mono">
          Distribution across all recorded scans
        </p>
      </div>

      {/* Progress Multi-Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
          <div style={{ width: `${lowPct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Low: ${low}`} />
          <div style={{ width: `${modPct}%` }} className="bg-amber-500 transition-all duration-500" title={`Moderate: ${mod}`} />
          <div style={{ width: `${highPct}%` }} className="bg-rose-500 transition-all duration-500" title={`High: ${high}`} />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col items-center text-center">
          <ShieldCheck className="w-4 h-4 mb-1 text-emerald-600" />
          <div className="font-bold text-base">{low}</div>
          <div className="text-[10px] opacity-80 uppercase">LOW (&lt;10)</div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex flex-col items-center text-center">
          <AlertTriangle className="w-4 h-4 mb-1 text-amber-600" />
          <div className="font-bold text-base">{mod}</div>
          <div className="text-[10px] opacity-80 uppercase">MOD (10-25)</div>
        </div>

        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col items-center text-center">
          <AlertOctagon className="w-4 h-4 mb-1 text-rose-600" />
          <div className="font-bold text-base">{high}</div>
          <div className="text-[10px] opacity-80 uppercase">HIGH (&gt;25)</div>
        </div>
      </div>
    </div>
  );
};

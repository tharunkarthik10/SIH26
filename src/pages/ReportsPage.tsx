import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { generateReportSummary, exportMeasurementsToCSV } from '../services/reportService';
import { ExposureChart } from '../components/dashboard/ExposureChart';
import { StatusPill } from '../components/common/StatusPill';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { FileSpreadsheet, Download, Calendar, Users } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { measurements, workers } = useData();
  const [daysFilter, setDaysFilter] = useState<number>(30);

  const summary = generateReportSummary(measurements, daysFilter);

  const workerMap = new Map(workers.map(w => [w.workerId, w]));
  const workerAggregates = new Map<string, { name: string; count: number; totalExposure: number; maxExposure: number; lastStatus: any }>();

  measurements.forEach(m => {
    const existing = workerAggregates.get(m.workerId) || {
      name: m.workerName || workerMap.get(m.workerId)?.name || 'Unassigned',
      count: 0,
      totalExposure: 0,
      maxExposure: 0,
      lastStatus: m.exposureStatus,
    };

    existing.count += 1;
    existing.totalExposure += m.estimatedExposure;
    if (m.estimatedExposure > existing.maxExposure) existing.maxExposure = m.estimatedExposure;

    workerAggregates.set(m.workerId, existing);
  });

  return (
    <div className="space-y-6">
      {/* Header Bar & Date Range Selector */}
      <div className="industrial-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
              Plant Safety Exposure Intelligence Report
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              {summary.dateRange}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="industrial-input py-1.5"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          <button
            onClick={() => exportMeasurementsToCSV(measurements, workers)}
            className="industrial-button-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="industrial-card p-4 space-y-1">
          <div className="text-[11px] text-slate-500 uppercase">Total Telemetry Scans</div>
          <div className="text-2xl font-bold text-slate-900">{summary.totalMeasurements}</div>
          <div className="text-[10px] text-slate-400">Processed NFC & Camera Records</div>
        </div>

        <div className="industrial-card p-4 space-y-1">
          <div className="text-[11px] text-slate-500 uppercase">Low Exposure Scans</div>
          <div className="text-2xl font-bold text-emerald-600">{summary.lowExposureCount}</div>
          <div className="text-[10px] text-emerald-600/80">Below 10.0 ppm·h</div>
        </div>

        <div className="industrial-card p-4 space-y-1">
          <div className="text-[11px] text-slate-500 uppercase">Moderate Exposure Scans</div>
          <div className="text-2xl font-bold text-amber-600">{summary.moderateExposureCount}</div>
          <div className="text-[10px] text-amber-600/80">10.0 - 25.0 ppm·h</div>
        </div>

        <div className="industrial-card p-4 space-y-1">
          <div className="text-[11px] text-slate-500 uppercase">High Exposure Alerts</div>
          <div className="text-2xl font-bold text-rose-600">{summary.highExposureCount}</div>
          <div className="text-[10px] text-rose-600/80">Exceeds 25.0 ppm·h</div>
        </div>
      </div>

      {/* Trend Visualizer */}
      <ExposureChart measurements={measurements} />

      {/* Worker-Wise Exposure Aggregation Table */}
      <div className="industrial-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
              Worker-Wise Cumulative Dose Summary
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Worker ID</th>
                <th className="py-2.5 px-3">Worker Name</th>
                <th className="py-2.5 px-3 text-center">Total Scans</th>
                <th className="py-2.5 px-3 text-right">Avg Dose</th>
                <th className="py-2.5 px-3 text-right">Peak Dose</th>
                <th className="py-2.5 px-3 text-center">Latest Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from(workerAggregates.entries()).map(([workerId, agg]) => {
                const avg = agg.count > 0 ? (agg.totalExposure / agg.count).toFixed(1) : '0.0';

                return (
                  <tr key={workerId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-700">{workerId}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{agg.name}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{agg.count}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700">{avg} ppm·h</td>
                    <td className="py-3 px-3 text-right font-bold text-amber-700">{agg.maxExposure.toFixed(1)} ppm·h</td>
                    <td className="py-3 px-3 text-center"><StatusPill status={agg.lastStatus} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <ScientificDisclaimer />
    </div>
  );
};

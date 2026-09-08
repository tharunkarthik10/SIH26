import React from 'react';
import { Measurement, Worker } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Clock, ExternalLink, Radio, Camera } from 'lucide-react';
import { formatIndianDateTime } from '../../utils/dateUtils';

interface RecentMeasurementsTableProps {
  measurements: Measurement[];
  workers: Worker[];
  onSelectMeasurement?: (m: Measurement) => void;
  onViewAll?: () => void;
}

export const RecentMeasurementsTable: React.FC<RecentMeasurementsTableProps> = ({
  measurements,
  workers,
  onSelectMeasurement,
  onViewAll,
}) => {
  const workerMap = new Map(workers.map(w => [w.workerId, w]));

  return (
    <div className="industrial-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
            Recent Telemetry Scans
          </h3>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-mono text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors font-semibold"
          >
            <span>View Audit Log</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
              <th className="py-2.5 px-3">Worker</th>
              <th className="py-2.5 px-3">Method</th>
              <th className="py-2.5 px-3">Device / Strip</th>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3 text-right">Est. Exposure</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {measurements.slice(0, 5).map((m) => {
              const worker = workerMap.get(m.workerId);
              const isCamera = m.source === 'camera_scan';

              return (
                <tr
                  key={m.measurementId}
                  onClick={() => onSelectMeasurement?.(m)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {worker ? worker.name : m.workerName || 'Unassigned'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {m.workerId}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCamera ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {isCamera ? <Camera className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                      {isCamera ? 'Camera 📷' : 'NFC ✅'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    <div className="font-bold">{m.deviceId}</div>
                    <div className="text-[10px] text-slate-400">{m.stripId}</div>
                  </td>

                  <td className="py-3 px-3 text-slate-500">
                    {formatIndianDateTime(m.timestamp)}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {m.estimatedExposure.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">{m.exposureUnit}</span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <StatusPill status={m.exposureStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

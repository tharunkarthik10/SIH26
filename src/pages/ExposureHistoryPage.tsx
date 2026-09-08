import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Measurement } from '../types';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';
import { MeasurementResultCard } from '../components/measure/MeasurementResultCard';
import { History, Search, Filter, Download, Radio, Camera, Layers } from 'lucide-react';
import { exportMeasurementsToCSV } from '../services/reportService';
import { formatIndianDate, formatIndianTime } from '../utils/dateUtils';

export const ExposureHistoryPage: React.FC = () => {
  const { measurements, workers, lookupDevice, lookupStrip, lookupWorker } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);

  const workerMap = new Map(workers.map(w => [w.workerId, w]));

  const filteredMeasurements = measurements.filter((m) => {
    const workerName = m.workerName || (workerMap.get(m.workerId)?.name || '');
    const matchesQuery = 
      m.measurementId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.workerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.stripId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.exposureStatus === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="industrial-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by Worker, Device, Strip, or ID..."
              className="industrial-input w-full pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="industrial-input py-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="LOW">Low (&lt;10 ppm·h)</option>
              <option value="MODERATE">Moderate (10-25 ppm·h)</option>
              <option value="HIGH">High (&gt;25 ppm·h)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => exportMeasurementsToCSV(filteredMeasurements, workers)}
          className="industrial-button-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="industrial-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
              Chronological Exposure Log ({filteredMeasurements.length} Records)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Worker</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Device / Strip</th>
                <th className="py-3 px-3 text-right">Optical Absorbance</th>
                <th className="py-3 px-3 text-right">Est. Exposure</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeasurements.map((m) => {
                const worker = workerMap.get(m.workerId);
                const isCamera = m.source === 'camera_scan';

                return (
                  <tr
                    key={m.measurementId}
                    onClick={() => setSelectedMeasurement(m)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-3 text-slate-500">
                      <div>{formatIndianDate(m.timestamp)}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatIndianTime(m.timestamp, true)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">
                        {worker ? worker.name : m.workerName || 'Unassigned'}
                      </div>
                      <div className="text-[10px] text-slate-400">{m.workerId}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCamera ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {isCamera ? <Camera className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                        {isCamera ? 'Camera 📷' : 'NFC ✅'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      <div className="font-bold">{m.deviceId}</div>
                      <div className="text-[10px] text-slate-400">{m.stripId}</div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                      {m.opticalReading.toFixed(3)} AU
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 text-sm">
                      {m.estimatedExposure.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">{m.exposureUnit}</span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <StatusPill status={m.exposureStatus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Measurement Result Detail Modal */}
      {selectedMeasurement && (
        <Modal
          isOpen={!!selectedMeasurement}
          onClose={() => setSelectedMeasurement(null)}
          title={`Measurement Inspection: ${selectedMeasurement.measurementId}`}
          subtitle="Full Telemetry Audit Record"
          maxWidth="xl"
        >
          <MeasurementResultCard
            measurement={selectedMeasurement}
            device={lookupDevice(selectedMeasurement.deviceId)}
            strip={lookupStrip(selectedMeasurement.stripId)}
            worker={lookupWorker(selectedMeasurement.workerId)}
          />
        </Modal>
      )}
    </div>
  );
};

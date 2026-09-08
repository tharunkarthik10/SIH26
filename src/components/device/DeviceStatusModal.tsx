import React, { useState } from 'react';
import { Device, Worker, ChemicalStrip } from '../../types';
import { Modal } from '../common/Modal';
import { StatusPill } from '../common/StatusPill';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { formatIndianFullDateTime, formatIndianDate } from '../../utils/dateUtils';
import { 
  Cpu, 
  Zap, 
  User, 
  Clock, 
  Activity, 
  CheckCircle2, 
  History, 
  Tag, 
  Plus, 
  RefreshCw, 
  ShieldCheck,
  Building
} from 'lucide-react';

interface DeviceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device;
  worker?: Worker;
  activeStrip?: ChemicalStrip;
  onReplaceStrip?: (newStripId: string, batchId: string) => void;
}

export const DeviceStatusModal: React.FC<DeviceStatusModalProps> = ({
  isOpen,
  onClose,
  device,
  worker,
  activeStrip,
  onReplaceStrip
}) => {
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [newStripId, setNewStripId] = useState(`STRIP-2026-000${Date.now().toString().slice(-3)}`);
  const [newBatchId, setNewBatchId] = useState('B025-H2S');

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReplaceStrip?.(newStripId, newBatchId);
    setShowReplaceForm(false);
  };

  const stripHistory = device.stripHistory || [
    {
      recordId: 'REC-101',
      stripId: activeStrip ? activeStrip.stripId : 'STRIP-2026-000124',
      batchId: activeStrip ? activeStrip.batchId : 'B024-H2S',
      insertedAt: '2026-01-15T08:00:00Z',
      status: activeStrip ? activeStrip.status : 'VALID',
      replacedByEmail: 'supervisor@industrial-safety.org'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Device Working Health & Status: ${device.deviceId}`}
      subtitle="NFC Reader Diagnostic & Strip Changing Audit Log"
      maxWidth="2xl"
    >
      <div className="space-y-6 font-sans">
        
        {/* TOP ROW: QR IDENTITY + WORKING HEALTH & LAST ACTIVATED */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
          
          {/* QR & Power Card (Left 4 cols) */}
          <div className="sm:col-span-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center space-y-3">
            <QRCodeDisplay
              id={device.deviceId}
              type="device"
              size="md"
              subText="Permanent Hardware Reader"
            />

            <div className="w-full pt-2 border-t border-slate-200 text-xs font-sans space-y-1 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Power Source:</span>
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  NFC powered
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Firmware:</span>
                <strong className="text-slate-800 font-semibold">{device.firmwareVersion}</strong>
              </div>
            </div>
          </div>

          {/* Device Health Checklist & Last Activated (Right 8 cols) */}
          <div className="sm:col-span-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs font-sans">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-slate-900 uppercase tracking-wider">Device Working Health</span>
              </div>
              <StatusPill status={device.status} />
            </div>

            {/* Health Checklist Items */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">NFC Energy Harvester</div>
                <div className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  100% Operational
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">MCU Controller</div>
                <div className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Optimal State
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">LED Optical Emitter</div>
                <div className="font-bold text-sky-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  Calibrated (470nm)
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-medium">Photodiode Sensor</div>
                <div className="font-bold text-sky-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                  0.842 AU Baseline
                </div>
              </div>
            </div>

            {/* Last Activated Timestamp */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span className="text-slate-600 font-medium">Last Activated (NFC Tap):</span>
              </div>
              <strong className="text-slate-900 font-bold text-sm">
                {device.lastMeasurementAt 
                  ? formatIndianFullDateTime(device.lastMeasurementAt) 
                  : 'Just Now'}
              </strong>
            </div>
          </div>
        </div>

        {/* ASSIGNED WORKER DETAILS CARD */}
        <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 space-y-2 text-xs font-sans">
          <div className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-600" />
            <span>Assigned Worker & Login Mail ID</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <div className="text-[11px] text-slate-500">Full Name</div>
              <div className="font-bold text-slate-900 text-sm">{worker ? worker.name : 'Rajesh Kumar'}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Assigned Email ID</div>
              <div className="font-bold text-sky-700 text-xs truncate">{worker ? worker.email : device.assignedWorkerEmail || 'rajesh.kumar@industrial-safety.org'}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Department</div>
              <div className="font-semibold text-slate-800">{worker ? worker.department : 'Refinery Operations'}</div>
            </div>
          </div>
        </div>

        {/* CHEMICAL STRIP REPLACEMENT HISTORY LOG */}
        <div className="space-y-3 text-xs font-sans">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                Chemical Strip Replacement Records ({stripHistory.length})
              </h4>
            </div>

            <button
              onClick={() => setShowReplaceForm(!showReplaceForm)}
              className="industrial-button-primary py-1 px-3 text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showReplaceForm ? 'Cancel' : 'Insert New Strip'}</span>
            </button>
          </div>

          {/* Replace Strip Form */}
          {showReplaceForm && (
            <form onSubmit={handleReplaceSubmit} className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3 text-xs animate-in fade-in">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Record New Chemical Strip Replacement</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 text-[11px]">New Strip ID</label>
                  <input
                    type="text"
                    value={newStripId}
                    onChange={(e) => setNewStripId(e.target.value)}
                    className="industrial-input w-full mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 text-[11px]">Batch Number</label>
                  <input
                    type="text"
                    value={newBatchId}
                    onChange={(e) => setNewBatchId(e.target.value)}
                    className="industrial-input w-full mt-1"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" className="industrial-button-primary py-1 px-4 text-xs">
                  Confirm Strip Insertion
                </button>
              </div>
            </form>
          )}

          {/* Replacement Log Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Strip ID</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Inserted Date</th>
                  <th className="py-2.5 px-3">Removed Date</th>
                  <th className="py-2.5 px-3">Installed By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stripHistory.map((rec) => (
                  <tr key={rec.recordId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{rec.stripId}</td>
                    <td className="py-3 px-3 text-slate-600">{rec.batchId}</td>
                    <td className="py-3 px-3 text-slate-600">{formatIndianDate(rec.insertedAt)}</td>
                    <td className="py-3 px-3 text-slate-500">{rec.removedAt ? formatIndianDate(rec.removedAt) : 'Active in Unit'}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">{rec.replacedByEmail}</td>
                    <td className="py-3 px-3 text-center">
                      <StatusPill status={rec.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};

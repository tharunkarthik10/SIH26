import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Device } from '../types';
import { StatusPill } from '../components/common/StatusPill';
import { QRCodeDisplay } from '../components/common/QRCodeDisplay';
import { Modal } from '../components/common/Modal';
import { Cpu, Zap, Plus, Search, User, Clock } from 'lucide-react';
import { formatIndianTime, formatIndianDate } from '../utils/dateUtils';

export const DevicesPage: React.FC = () => {
  const { devices, workers, registerDevice } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Device Form
  const [newDeviceId, setNewDeviceId] = useState(`DEV-00${Date.now().toString().slice(-3)}`);
  const [newAssignedWorkerId, setNewAssignedWorkerId] = useState('');
  const [newFirmwareVersion, setNewFirmwareVersion] = useState('v2.4.1-nfc');

  const workerMap = new Map(workers.map(w => [w.workerId, w]));

  const filteredDevices = devices.filter(d => 
    d.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.assignedWorkerId && d.assignedWorkerId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRegisterDevice = (e: React.FormEvent) => {
    e.preventDefault();
    registerDevice({
      deviceId: newDeviceId,
      status: 'REGISTERED',
      assignedWorkerId: newAssignedWorkerId || undefined,
      firmwareVersion: newFirmwareVersion,
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="industrial-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reader units by Device ID..."
            className="industrial-input w-full pl-9"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="industrial-button-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Reader</span>
        </button>
      </div>

      {/* Grid of Battery-Free Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((device) => {
          const worker = device.assignedWorkerId ? workerMap.get(device.assignedWorkerId) : undefined;

          return (
            <div
              key={device.deviceId}
              onClick={() => setSelectedDevice(device)}
              className="industrial-card p-5 space-y-4 hover:border-sky-400/80 cursor-pointer transition-all relative overflow-hidden group shadow-2xs hover:shadow-md"
            >
              {/* Header: ID & Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-slate-900 text-sm">
                      {device.deviceId}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-500">
                      FW: {device.firmwareVersion}
                    </div>
                  </div>
                </div>

                <StatusPill status={device.status} />
              </div>

              {/* Specs Grid */}
              <div className="space-y-2 font-mono text-xs">
                {/* Assigned Worker */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <User className="w-3 h-3 text-sky-600" />
                    <span>Assigned:</span>
                  </span>
                  <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                    {worker ? worker.name : 'Unassigned'}
                  </span>
                </div>

                {/* Power Status: Explicit Battery-Free NFC Powered Display */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" />
                    <span>Power:</span>
                  </span>
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <Zap className="w-3 h-3 animate-pulse text-amber-600" />
                    NFC powered
                  </span>
                </div>

                {/* Last Measurement */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Last Scan:</span>
                  </span>
                  <span className="text-slate-700">
                    {device.lastMeasurementAt 
                      ? formatIndianTime(device.lastMeasurementAt) 
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <Modal
          isOpen={!!selectedDevice}
          onClose={() => setSelectedDevice(null)}
          title={`Reader Unit: ${selectedDevice.deviceId}`}
          subtitle="Battery-Free NFC Hardware Reader Specification"
          maxWidth="md"
        >
          <div className="space-y-6 flex flex-col items-center text-center font-mono">
            <QRCodeDisplay
              id={selectedDevice.deviceId}
              type="device"
              size="lg"
              subText="Permanent Hardware Reader ID"
            />

            <div className="w-full space-y-2 text-xs text-left">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Power Source</span>
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  NFC powered (Battery-Free)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Assigned Worker</span>
                <span className="text-slate-900 font-bold">{selectedDevice.assignedWorkerId || 'Unassigned'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Firmware Version</span>
                <span className="text-slate-800">{selectedDevice.firmwareVersion}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Provision Date</span>
                <span className="text-slate-600">{formatIndianDate(selectedDevice.createdAt)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Provision Device Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Reader Unit"
        subtitle="Register a new battery-free NFC optical reader device"
      >
        <form onSubmit={handleRegisterDevice} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-slate-600">Device Hardware ID</label>
            <input
              type="text"
              value={newDeviceId}
              onChange={(e) => setNewDeviceId(e.target.value)}
              className="industrial-input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600">Firmware Build</label>
            <input
              type="text"
              value={newFirmwareVersion}
              onChange={(e) => setNewFirmwareVersion(e.target.value)}
              className="industrial-input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600">Assign to Worker (Optional)</label>
            <select
              value={newAssignedWorkerId}
              onChange={(e) => setNewAssignedWorkerId(e.target.value)}
              className="industrial-input w-full"
            >
              <option value="">-- Leave Unassigned --</option>
              {workers.map((w) => (
                <option key={w.workerId} value={w.workerId}>
                  {w.name} ({w.workerId})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
            <strong>Note:</strong> Devices operate strictly via NFC energy harvesting. No battery management required.
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="industrial-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="industrial-button-primary"
            >
              Provision Device
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Worker, Measurement } from '../types';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';
import { formatIndianDateTime } from '../utils/dateUtils';
import { ExposureChart } from '../components/dashboard/ExposureChart';
import { Users, Search, UserPlus, Cpu, History } from 'lucide-react';

export const WorkersPage: React.FC = () => {
  const { workers, devices, measurements, registerWorker } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Worker Form State
  const [newWorkerId, setNewWorkerId] = useState(`WRK-00${Date.now().toString().slice(-3)}`);
  const [newName, setNewName] = useState('');
  const [newEmployeeCode, setNewEmployeeCode] = useState(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newDepartment, setNewDepartment] = useState('Refinery Operations');
  const [newAssignedDevice, setNewAssignedDevice] = useState('');

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.workerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegisterWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    registerWorker({
      workerId: newWorkerId,
      name: newName,
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@industrial-safety.org`,
      employeeCode: newEmployeeCode,
      department: newDepartment,
      assignedDeviceId: newAssignedDevice || undefined,
      status: 'ACTIVE',
    });

    setIsAddModalOpen(false);
    setNewName('');
  };

  const getWorkerMeasurements = (workerId: string): Measurement[] => {
    return measurements.filter(m => m.workerId.toLowerCase() === workerId.toLowerCase());
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Search & Add Worker Button */}
      <div className="industrial-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers by name, ID, or department..."
            className="industrial-input w-full pl-9"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="industrial-button-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Worker</span>
        </button>
      </div>

      {/* Workers Roster Table */}
      <div className="industrial-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
              Monitored Worker Roster ({filteredWorkers.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-3">Worker ID / Code</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Assigned Device</th>
                <th className="py-3 px-3">Latest Exposure</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map((worker) => {
                const latest = worker.latestExposure;

                return (
                  <tr
                    key={worker.workerId}
                    onClick={() => setSelectedWorker(worker)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      <div>{worker.workerId}</div>
                      <div className="text-[10px] text-slate-400">{worker.employeeCode}</div>
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-900 text-sm">
                      {worker.name}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      {worker.department}
                    </td>

                    <td className="py-3.5 px-3">
                      {worker.assignedDeviceId ? (
                        <span className="text-sky-700 font-bold flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-sky-600" />
                          {worker.assignedDeviceId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {latest ? (
                        <div>
                          <strong className="text-slate-900 text-sm">{latest.estimatedExposure} ppm·h</strong>
                          <span className="ml-2"><StatusPill status={latest.exposureStatus} /></span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No scans yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <StatusPill status={worker.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Profile Detail Drawer Modal */}
      {selectedWorker && (
        <Modal
          isOpen={!!selectedWorker}
          onClose={() => setSelectedWorker(null)}
          title={`Worker Profile: ${selectedWorker.name}`}
          subtitle={`${selectedWorker.workerId} • ${selectedWorker.department}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Employee Code</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedWorker.employeeCode}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Assigned Device</div>
                <div className="font-bold text-sky-700 mt-0.5">{selectedWorker.assignedDeviceId || 'None'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Current Status</div>
                <div className="mt-0.5"><StatusPill status={selectedWorker.status} /></div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase">Latest Exposure</div>
                <div className="font-bold text-amber-700 mt-0.5">
                  {selectedWorker.latestExposure ? `${selectedWorker.latestExposure.estimatedExposure} ppm·h` : 'N/A'}
                </div>
              </div>
            </div>

            <ExposureChart measurements={getWorkerMeasurements(selectedWorker.workerId)} />

            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-sky-600" />
                <span>Recent Scans for {selectedWorker.name}</span>
              </h4>

              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px]">
                      <th className="py-2 px-2">Timestamp</th>
                      <th className="py-2 px-2">Device</th>
                      <th className="py-2 px-2">Strip</th>
                      <th className="py-2 px-2 text-right">Exposure</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getWorkerMeasurements(selectedWorker.workerId).map((m) => (
                      <tr key={m.measurementId}>
                        <td className="py-2 px-2 text-slate-500">{formatIndianDateTime(m.timestamp)}</td>
                        <td className="py-2 px-2 text-slate-700">{m.deviceId}</td>
                        <td className="py-2 px-2 text-slate-700">{m.stripId}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900">{m.estimatedExposure} ppm·h</td>
                        <td className="py-2 px-2 text-center"><StatusPill status={m.exposureStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Worker Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Monitored Worker"
        subtitle="Provision worker identity and assign dosimeter device"
      >
        <form onSubmit={handleRegisterWorker} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-600">Worker ID</label>
              <input
                type="text"
                value={newWorkerId}
                onChange={(e) => setNewWorkerId(e.target.value)}
                className="industrial-input w-full"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-600">Employee Code</label>
              <input
                type="text"
                value={newEmployeeCode}
                onChange={(e) => setNewEmployeeCode(e.target.value)}
                className="industrial-input w-full"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              className="industrial-input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600">Department / Unit</label>
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="industrial-input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600">Assign NFC Reader Device (Optional)</label>
            <select
              value={newAssignedDevice}
              onChange={(e) => setNewAssignedDevice(e.target.value)}
              className="industrial-input w-full"
            >
              <option value="">-- Unassigned --</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.deviceId} ({d.status})
                </option>
              ))}
            </select>
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
              Register Worker
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

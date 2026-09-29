import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { QRCodeDisplay } from '../components/common/QRCodeDisplay';
import { StatusPill } from '../components/common/StatusPill';
import { formatIndianTime } from '../utils/dateUtils';
import { 
  Cpu, 
  Zap, 
  User, 
  Clock, 
  ShieldCheck, 
  Wrench, 
  RefreshCw, 
  CheckCircle2, 
  Send, 
  Building,
  Activity
} from 'lucide-react';

export const DevicePage: React.FC = () => {
  const { user } = useAuth();
  const { workers, devices, measurements, deviceAssignments, createServiceTicket } = useData();

  // Firmware update state
  const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
  const [isUpdatingFirmware, setIsUpdatingFirmware] = useState(false);
  const [firmwareProgress, setFirmwareProgress] = useState(0);
  const [firmwareVersion, setFirmwareVersion] = useState('v2.4.1');

  // Service ticket modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [issueType, setIssueType] = useState<'Sensor Drift' | 'NFC Read Error' | 'Physical Damage' | 'Firmware Glitch' | 'Other'>('Sensor Drift');
  const [issueDesc, setIssueDesc] = useState('');
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState(false);

  const userEmail = user?.email || 'rajesh.kumar@industrial-safety.org';
  const assignedWorker = (workers && workers.length > 0)
    ? (workers.find(w => w && w.email && w.email.toLowerCase() === userEmail.toLowerCase()) || workers[0])
    : undefined;

  const latestMeasurement = (assignedWorker ? measurements.find(m => m && m.workerId === assignedWorker.workerId) : undefined) || measurements[0];

  const activeDevice = (devices && devices.length > 0)
    ? (devices.find(d => 
        (latestMeasurement && d.deviceId.toLowerCase() === latestMeasurement.deviceId.toLowerCase()) ||
        (d.assignedWorkerId && assignedWorker?.workerId && d.assignedWorkerId.toLowerCase() === assignedWorker.workerId.toLowerCase()) ||
        (d.assignedWorkerEmail && d.assignedWorkerEmail.toLowerCase() === userEmail.toLowerCase())
      ) || devices[0])
    : (devices && devices[0]);

  const handleStartFirmwareUpdate = () => {
    setIsUpdatingFirmware(true);
    setFirmwareProgress(15);
    const interval = setInterval(() => {
      setFirmwareProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUpdatingFirmware(false);
          setFirmwareVersion('v2.5.0');
          return 100;
        }
        return prev + 35;
      });
    }, 500);
  };

  const handleServiceTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDevice) return;
    createServiceTicket({
      deviceId: activeDevice.deviceId,
      reportedBy: userEmail,
      issueType,
      description: issueDesc || 'Reader issue reported from field device screen.',
      priority: issueType === 'NFC Read Error' || issueType === 'Physical Damage' ? 'HIGH' : 'MEDIUM'
    });
    setTicketSuccessMsg(true);
    setTimeout(() => {
      setTicketSuccessMsg(false);
      setIsServiceModalOpen(false);
    }, 1500);
  };

  if (!activeDevice || !assignedWorker) {
    return (
      <div className="p-8 text-center font-sans text-slate-500 text-sm">
        Loading device hardware details...
      </div>
    );
  }

  return (
    <div className="space-y-3.5 font-sans animate-in fade-in pb-2">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Optical Reader Unit</h1>
          <p className="text-[11px] text-slate-500">Hardware Calibration & Status</p>
        </div>
        <StatusPill status={activeDevice.status} />
      </div>

      {/* HERO: Unit Identifier & Power State */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base">
                Unit {activeDevice.deviceId}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Battery-Free NFC Powered</span>
              </div>
            </div>
          </div>
          <QRCodeDisplay id={activeDevice.deviceId} type="device" size="sm" />
        </div>

        {/* Quick Diagnostics Strip */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] text-slate-400 block font-medium">Sensor</span>
            <span className="font-bold text-slate-800 text-xs">99.5%</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] text-slate-400 block font-medium">Firmware</span>
            <span className="font-bold text-slate-800 text-xs">{firmwareVersion}</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] text-slate-400 block font-medium">Power</span>
            <span className="font-bold text-emerald-700 text-xs">Passive NFC</span>
          </div>
        </div>
      </div>

      {/* OPERATOR & PLANT LOCATION: Clean Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>Assigned Operator</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{assignedWorker.employeeCode}</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Personnel:</span>
            <strong className="text-slate-800">{assignedWorker.name}</strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Station:</span>
            <span className="text-slate-800 font-medium">Refinery Plant A - Desulfurization</span>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-50 text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Last sync:</span>
            </span>
            <span className="font-mono text-slate-600">
              {activeDevice.lastMeasurementAt ? formatIndianTime(activeDevice.lastMeasurementAt) : 'Just Now'}
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS: 2 Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => setIsServiceModalOpen(true)}
          className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs text-slate-800 font-bold flex flex-col items-center justify-center gap-1.5 transition-all"
        >
          <Wrench className="w-4 h-4 text-sky-600" />
          <span>Report Issue</span>
        </button>

        <button
          onClick={() => setIsFirmwareModalOpen(true)}
          className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs text-slate-800 font-bold flex flex-col items-center justify-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-sky-600" />
          <span>Check Firmware</span>
        </button>
      </div>

      {/* REASSIGNMENT / TRANSFER HISTORY (Minimal) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-bold text-slate-900">Transfer History</span>
          <span className="text-[10px] text-slate-400">{deviceAssignments.length} logs</span>
        </div>

        <div className="space-y-2 pt-0.5">
          {deviceAssignments.slice(0, 2).map((asg) => (
            <div key={asg.recordId} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">{asg.workerName}</div>
                  <div className="text-[10px] text-slate-400">{asg.reason}</div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{asg.assignedAt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FIRMWARE UPDATE MODAL */}
      {isFirmwareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-sky-600" />
                <span>Firmware Over NFC</span>
              </h3>
              <button onClick={() => setIsFirmwareModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <div>Current: <strong>{firmwareVersion}</strong></div>
                <div>Update: <strong className="text-emerald-700">v2.5.0 (Latest Patch)</strong></div>
              </div>

              {isUpdatingFirmware ? (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-[11px] font-bold text-sky-700">
                    <span>Flashing over NFC...</span>
                    <span>{firmwareProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full transition-all duration-300" style={{ width: `${firmwareProgress}%` }} />
                  </div>
                </div>
              ) : firmwareProgress === 100 ? (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-center font-bold text-xs rounded-xl">
                  Firmware updated to v2.5.0!
                </div>
              ) : (
                <button
                  onClick={handleStartFirmwareUpdate}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Flash Update</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE SERVICE MODAL */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-sky-600" />
                <span>Service Request</span>
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            {ticketSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 text-center font-bold text-xs rounded-xl space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div>Service Ticket Logged</div>
                <div className="text-[10px] font-normal text-emerald-700">Dispatched to maintenance.</div>
              </div>
            ) : (
              <form onSubmit={handleServiceTicketSubmit} className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 text-[11px]">Reader Unit:</label>
                  <input
                    type="text"
                    disabled
                    value={activeDevice.deviceId}
                    className="w-full mt-1 p-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-[11px]">Issue Type:</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as any)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Sensor Drift">Sensor Drift / Optical Dust</option>
                    <option value="NFC Read Error">NFC Read Handshake Failure</option>
                    <option value="Physical Damage">Physical Housing Damage</option>
                    <option value="Firmware Glitch">Firmware / Screen Glitch</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-[11px]">Description:</label>
                  <textarea
                    value={issueDesc}
                    onChange={(e) => setIssueDesc(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl h-14 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

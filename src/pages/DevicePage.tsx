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
  Activity, 
  CheckCircle2, 
  ShieldCheck,
  Mail,
  Gauge,
  Wrench,
  RefreshCw,
  History as HistoryIcon,
  Calendar,
  AlertCircle,
  Send,
  Building
} from 'lucide-react';

export const DevicePage: React.FC = () => {
  const { user } = useAuth();
  const { workers, devices, chemicalStrips, measurements, deviceAssignments, createServiceTicket } = useData();

  // Firmware update state
  const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);
  const [isUpdatingFirmware, setIsUpdatingFirmware] = useState(false);
  const [firmwareProgress, setFirmwareProgress] = useState(0);
  const [firmwareVersion, setFirmwareVersion] = useState('v2.4.1-nfc');

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
    setFirmwareProgress(10);
    const interval = setInterval(() => {
      setFirmwareProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUpdatingFirmware(false);
          setFirmwareVersion('v2.5.0-nfc (Latest)');
          return 100;
        }
        return prev + 30;
      });
    }, 600);
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
      <div className="p-8 text-center font-sans text-slate-500">
        Loading device hardware details...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans animate-in fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Device Details</h1>
          <p className="text-xs text-slate-500 font-sans">Hardware Calibration & Service History</p>
        </div>
        <StatusPill status={activeDevice.status} />
      </div>

      {/* 1. HARDWARE SPECIFICATIONS CARD */}
      <div className="industrial-card p-4 space-y-4 border border-slate-200 bg-white">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Stationary Reader Hardware</span>
          <span className="text-sky-700 font-mono text-[10px]">ID: {activeDevice.deviceId}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base font-sans">
                Unit {activeDevice.deviceId}
              </div>
              <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                NFC Battery-Free Powered
              </span>
            </div>
          </div>

          <QRCodeDisplay id={activeDevice.deviceId} type="device" size="sm" />
        </div>

        {/* Stationary Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500">Power Source</div>
            <div className="font-bold text-amber-700">NFC Energy Harvesting</div>
          </div>

          {/* FIRMWARE WITH UPDATE ACTION FLOW */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500">Firmware</div>
              <div className="font-bold text-slate-800">{firmwareVersion}</div>
            </div>
            <button
              onClick={() => setIsFirmwareModalOpen(true)}
              className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Update</span>
            </button>
          </div>
        </div>

        {/* HARDWARE CALIBRATION DUE DATE (SEPARATE FROM STRIP EXPIRY) */}
        <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 space-y-1 text-xs">
          <div className="flex justify-between items-center font-semibold text-slate-800">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              Hardware Reader Calibration:
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              CALIBRATED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>Last Hardware Cal: <strong>15 Jan 2026</strong></div>
            <div>Next Cal Due: <strong className="text-sky-700">15 Jan 2027</strong></div>
          </div>
        </div>

        {/* REPORT ISSUE / REQUEST SERVICE ACTION BUTTON */}
        <button
          onClick={() => setIsServiceModalOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200/90"
        >
          <Wrench className="w-4 h-4 text-sky-600" />
          <span>Report Hardware Issue / Request Service</span>
        </button>
      </div>

      {/* 2. ASSIGNED PERSONNEL INFO (FIXED TRUNCATION FOR LOCATION) */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-sky-600" />
          <span>Assigned Operator & Location</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Full Name:</span>
            <strong className="text-slate-900 font-semibold">{assignedWorker.name}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3 text-sky-600" />
              Mail ID:
            </span>
            <span className="text-sky-700 font-semibold truncate max-w-[180px]">{userEmail}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Employee Code:</span>
            <span className="text-slate-800 font-mono font-medium">{assignedWorker.employeeCode}</span>
          </div>

          {/* FIXED TRUNCATION: FULL TEXT WRAPPING FOR LOCATION */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <Building className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              Plant Department Location:
            </span>
            <div className="text-slate-900 font-bold text-xs whitespace-normal break-words leading-relaxed">
              Refinery Plant A - Desulfurization Unit 4
            </div>
          </div>
        </div>
      </div>

      {/* 3. DEVICE REASSIGNMENT HISTORY TIMELINE */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <HistoryIcon className="w-4 h-4 text-sky-600" />
            <span>Device Reassignment History</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{deviceAssignments.length} Transfers</span>
        </div>

        <div className="space-y-3 relative border-l-2 border-sky-200 ml-2 pl-3 pt-1">
          {deviceAssignments.map(asg => (
            <div key={asg.recordId} className="relative space-y-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 absolute -left-[17px] top-1 border-2 border-white" />
              <div className="font-bold text-slate-900">{asg.workerName} ({asg.workerId})</div>
              <div className="text-[11px] text-slate-500">{asg.reason}</div>
              <div className="text-[10px] text-sky-700 font-mono">Assigned: {asg.assignedAt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. DYNAMIC DIAGNOSTICS & LIVE TELEMETRY CARD */}
      <div className="industrial-card p-4 space-y-3 bg-gradient-to-br from-sky-50/90 to-white border-2 border-sky-300">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-600 text-white">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Device Diagnostics & Scan Telemetry
              </h3>
              <span className="text-[10px] text-sky-700 font-semibold">
                Telemetry Link Operational
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Healthy
          </span>
        </div>

        {/* LATEST QR SCAN RESULT SNAPSHOT */}
        {latestMeasurement && (
          <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2 text-xs font-sans">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Latest Scanned Reading</span>
              <span className="text-sky-700 font-mono">Strip: {latestMeasurement.stripId}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-extrabold text-slate-900">
                  {latestMeasurement.estimatedExposure} <span className="text-xs font-bold text-slate-500">ppm·h</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Method: {latestMeasurement.source === 'camera_scan' || latestMeasurement.readingMethod === 'camera_secondary' ? 'Camera QR Scan' : 'NFC Primary'}
                </div>
              </div>
              <StatusPill status={latestMeasurement.exposureStatus} />
            </div>
          </div>
        )}

        <div className="space-y-2 text-xs font-sans">
          <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs">
            <span className="text-slate-600 font-medium">Power Health Rate</span>
            <span className="font-extrabold text-emerald-700 text-xs">100% Powered (NFC)</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-sky-200 flex items-center justify-between shadow-2xs">
            <span className="text-slate-600 font-medium">Sensor Calibration</span>
            <span className="font-extrabold text-sky-700 text-xs">99.5% Calibrated</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-sky-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Last Tapped Sync</span>
            </div>
            <strong className="text-slate-900 font-extrabold">
              {activeDevice.lastMeasurementAt ? formatIndianTime(activeDevice.lastMeasurementAt) : 'Just Now'}
            </strong>
          </div>
        </div>
      </div>

      {/* FIRMWARE UPDATE MODAL */}
      {isFirmwareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-sky-600" />
                <span>NFC OTA Firmware Update</span>
              </h3>
              <button onClick={() => setIsFirmwareModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <div>Current Version: <strong>{firmwareVersion}</strong></div>
                <div>Available Build: <strong className="text-emerald-700">v2.5.0-nfc (Patch Release)</strong></div>
                <p className="text-[10px] text-slate-500">Patch includes improved optical photodiode noise filtering and faster NFC tap handshake.</p>
              </div>

              {isUpdatingFirmware ? (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-xs font-bold text-sky-700">
                    <span>Flashing Firmware over NFC...</span>
                    <span>{firmwareProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full transition-all duration-300" style={{ width: `${firmwareProgress}%` }} />
                  </div>
                </div>
              ) : firmwareProgress === 100 ? (
                <div className="p-3 bg-emerald-50 text-emerald-900 text-center font-bold text-xs rounded-xl">
                  Firmware Updated Successfully to v2.5.0-nfc!
                </div>
              ) : (
                <button
                  onClick={handleStartFirmwareUpdate}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Start NFC Firmware Flashing</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT ISSUE SERVICE MODAL */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-sky-600" />
                <span>Report Reader Issue / Request Service</span>
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            {ticketSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 text-center font-bold text-xs rounded-xl space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto animate-bounce" />
                <div>Service Ticket Logged!</div>
                <div className="text-[10px] text-emerald-700">Dispatched to plant maintenance engineering.</div>
              </div>
            ) : (
              <form onSubmit={handleServiceTicketSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Target Reader ID:</label>
                  <input
                    type="text"
                    disabled
                    value={activeDevice.deviceId}
                    className="w-full mt-1 p-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Issue Classification:</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as any)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Sensor Drift">Sensor Drift / Optical Dust</option>
                    <option value="NFC Read Error">NFC Read Handshake Failure</option>
                    <option value="Physical Damage">Physical Housing Damage</option>
                    <option value="Firmware Glitch">Firmware / Screen Glitch</option>
                    <option value="Other">Other Hardware Issue</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Detailed Description:</label>
                  <textarea
                    value={issueDesc}
                    onChange={(e) => setIssueDesc(e.target.value)}
                    placeholder="Describe symptoms, error codes, or physical condition..."
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl h-16 text-xs focus:outline-none focus:border-sky-500"
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
                    className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Service Ticket</span>
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


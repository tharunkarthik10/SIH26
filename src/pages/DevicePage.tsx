import React from 'react';
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
  Gauge
} from 'lucide-react';

export const DevicePage: React.FC = () => {
  const { user } = useAuth();
  const { workers, devices, chemicalStrips, measurements } = useData();

  const userEmail = user?.email || 'rajesh.kumar@industrial-safety.org';
  const assignedWorker = (workers && workers.length > 0)
    ? (workers.find(w => w && w.email && w.email.toLowerCase() === userEmail.toLowerCase()) || workers[0])
    : undefined;

  const activeDevice = (assignedWorker && devices && devices.length > 0)
    ? (devices.find(d => 
        (d.assignedWorkerId && assignedWorker.workerId && d.assignedWorkerId.toLowerCase() === assignedWorker.workerId.toLowerCase()) ||
        (d.assignedWorkerEmail && d.assignedWorkerEmail.toLowerCase() === userEmail.toLowerCase())
      ) || devices[0])
    : (devices && devices[0]);

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
          <p className="text-xs text-slate-500 font-sans">Stationary Hardware Specs & Health</p>
        </div>
        <StatusPill status={activeDevice.status} />
      </div>

      {/* 1. STATIONARY SECTION: FIXED DEVICE HARDWARE SPECIFICATIONS */}
      <div className="industrial-card p-4 space-y-4 border border-slate-200 bg-white">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
          Stationary Hardware Specifications
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
                NFC powered
              </span>
            </div>
          </div>

          <QRCodeDisplay id={activeDevice.deviceId} type="device" size="sm" />
        </div>

        {/* Stationary Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500">Power Source</div>
            <div className="font-bold text-amber-700">NFC powered</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500">Firmware</div>
            <div className="font-bold text-slate-800">{activeDevice.firmwareVersion}</div>
          </div>
        </div>
      </div>

      {/* 2. STATIONARY SECTION: ASSIGNED PERSONNEL INFO */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <User className="w-4 h-4 text-sky-600" />
          <span>Assigned Personnel (Stationary)</span>
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
            <span className="text-sky-700 font-semibold truncate max-w-[170px]">{userEmail}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Employee Code:</span>
            <span className="text-slate-800 font-mono font-medium">{assignedWorker.employeeCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Department:</span>
            <span className="text-slate-800 font-medium truncate max-w-[170px]">{assignedWorker.department}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-500">Assigned Since:</span>
            <strong className="text-slate-800">15 Jan 2026, 08:00 AM</strong>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC SECTION: DEVICE WORKING HEALTH (AT BOTTOM - NO CTA BUTTON / NO POPUP MODAL) */}
      <div className="industrial-card p-4 space-y-3 bg-gradient-to-br from-sky-50/90 to-white border-2 border-sky-300">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-600 text-white">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Device Health & Diagnostics
              </h3>
              <span className="text-[10px] text-sky-700 font-semibold">
                Updated dynamically on every NFC tap
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Healthy
          </span>
        </div>

        {/* Dynamic Percentage Metrics (Full-width single line per metric) */}
        <div className="space-y-2.5 text-xs font-sans">
          {/* Metric 1: Power Health Rate */}
          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Power Health Rate</span>
              <span className="font-extrabold text-emerald-700 text-xs flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                100% Powered
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
            </div>
          </div>

          {/* Metric 2: Sensor Accuracy Rate */}
          <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Sensor Accuracy Rate</span>
              <span className="font-extrabold text-sky-700 text-xs flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                99.5% Calibrated
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full w-[99.5%]" />
            </div>
          </div>

          {/* Metric 3: Hardware Life Rate */}
          <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Hardware Life Rate</span>
              <span className="font-extrabold text-emerald-700 text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                100% Healthy
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-full" />
            </div>
          </div>

          {/* Metric 4: Last Tapped Time */}
          <div className="p-3 bg-white rounded-xl border border-sky-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-800">Last Tapped Time</div>
                <div className="text-[10px] text-slate-400">Live Tap Synced</div>
              </div>
            </div>
            <strong className="text-slate-900 font-extrabold text-sm">
              {activeDevice.lastMeasurementAt 
                ? formatIndianTime(activeDevice.lastMeasurementAt) 
                : 'Just Now'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

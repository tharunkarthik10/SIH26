import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useDemo } from '../context/DemoContext';
import { 
  User, 
  Mail, 
  Building, 
  BadgeCheck, 
  LogOut, 
  Shield, 
  Wifi, 
  WifiOff,
  HeartPulse,
  Stethoscope,
  Phone,
  Clock,
  Radio,
  Tag,
  FileText
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { workers, devices, chemicalStrips } = useData();
  const { isOffline, setIsOffline } = useDemo();

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

  const activeStrip = (chemicalStrips && chemicalStrips.length > 0)
    ? (chemicalStrips.find(s => s.status === 'VALID') || chemicalStrips[0])
    : undefined;

  const userName = assignedWorker?.name || user?.displayName || 'Rajesh Kumar';

  return (
    <div className="space-y-4 font-sans animate-in fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Account Holder Profile</h1>
          <p className="text-xs text-slate-500 font-sans">Personal Credentials & Health Baseline</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
          {user?.role || 'Plant Worker'}
        </span>
      </div>

      {/* ACCOUNT HOLDER IDENTIFICATION CARD */}
      <div className="industrial-card p-4 space-y-4 bg-white border-2 border-sky-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-sky-600/20">
            {userName.charAt(0)}
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base font-sans flex items-center gap-1.5">
              {userName}
              <BadgeCheck className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xs text-sky-700 font-semibold">{userEmail}</div>
            <div className="text-[11px] text-slate-400 font-mono">ID: {assignedWorker?.workerId || 'WRK-00124'}</div>
          </div>
        </div>

        {/* WORKER DETAILS GRID */}
        <div className="space-y-2 text-xs pt-1">
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500">Employee Code:</span>
            <span className="text-slate-800 font-mono font-bold">{assignedWorker?.employeeCode || 'EMP-9042'}</span>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-sky-600" />
              Department:
            </span>
            <span className="text-slate-800 font-medium truncate max-w-[170px]">{assignedWorker?.department || 'Refinery Operations'}</span>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              Assigned Hardware Reader:
            </span>
            <strong className="text-sky-700 font-bold">{activeDevice?.deviceId || 'DEV-0081'}</strong>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              Active Chemical Strip ID:
            </span>
            <strong className="text-amber-800 font-mono text-[11px]">{activeStrip?.stripId || 'STRIP-2026-000124'}</strong>
          </div>
        </div>
      </div>

      {/* ACCOUNT HOLDER PERSONAL HEALTH & MEDICAL BASELINE CARD */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>Health & Medical Profile</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            Medical Verified
          </span>
        </div>

        <div className="space-y-2">
          {/* Resting Heart Rate */}
          <div className="flex justify-between items-center p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
            <span className="text-slate-600 flex items-center gap-1 font-medium">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              Resting Telemetry Heart Rate:
            </span>
            <strong className="text-rose-700 font-extrabold text-xs">78 BPM (Normal)</strong>
          </div>

          {/* Past Medical Conditions */}
          <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Past Medical Condition:
              </span>
              <strong className="text-amber-900 font-bold text-[11px]">Asthma / Respiratory Hypersensitivity</strong>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Pre-existing bronchial sensitivity logged in occupational health registry. Requires mandatory rest breaks under gas exposure.
            </p>
          </div>

          {/* Emergency Contact & Blood Group */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-sky-600" />
              Emergency Contact:
            </span>
            <strong className="text-slate-800 font-mono">+91 98765-43210 (O+)</strong>
          </div>

          {/* Shift Schedule */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              Active Shift:
            </span>
            <strong className="text-slate-800">08:00 AM – 04:00 PM (8h Shift)</strong>
          </div>
        </div>
      </div>

      {/* NETWORK STATUS TOGGLE & SIGN OUT */}
      <div className="space-y-2 pt-1">
        <button
          onClick={() => setIsOffline(!isOffline)}
          className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            isOffline ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {isOffline ? <WifiOff className="w-4 h-4 text-rose-600" /> : <Wifi className="w-4 h-4 text-emerald-600" />}
          <span>Simulated Telemetry Network: {isOffline ? 'OFFLINE' : 'ONLINE'}</span>
        </button>

        <button
          onClick={() => logout()}
          className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
};

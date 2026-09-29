import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { WorkerOnboardingModal } from '../components/common/WorkerOnboardingModal';
import { 
  LogOut, 
  Stethoscope, 
  HelpCircle,
  FileCheck,
  Bell,
  Edit3
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { workers, devices, chemicalStrips, updateWorkerProfile } = useData();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');

  // Notification toggles
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

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

  const handleOpenEdit = () => {
    if (assignedWorker) {
      setEditName(assignedWorker.name);
      setEditDept(assignedWorker.department);
    }
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignedWorker) {
      updateWorkerProfile(assignedWorker.workerId, {
        name: editName,
        department: editDept,
      });
    }
    setIsEditProfileOpen(false);
  };

  return (
    <div className="space-y-3.5 font-sans animate-in fade-in pb-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Worker Profile</h1>
          <p className="text-[11px] text-slate-500">Identity & Safety Clearance</p>
        </div>

        <button
          onClick={() => setIsOnboardingModalOpen(true)}
          className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200 flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3 text-sky-600" />
          <span>User Guide</span>
        </button>
      </div>

      {/* USER HERO CARD */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white font-extrabold flex items-center justify-center text-base shadow-xs">
              {assignedWorker?.name?.charAt(0) || 'R'}
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>{assignedWorker?.name || 'Rajesh Kumar'}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {assignedWorker?.employeeCode || 'EMP-9042'} • {assignedWorker?.department || 'Desulfurization'}
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenEdit}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs"
            title="Edit Profile"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Email ID</span>
            <span className="font-semibold text-slate-800 text-[11px] truncate block">{userEmail}</span>
          </div>

          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Assigned Dosimeter</span>
            <span className="font-mono font-bold text-sky-700 text-[11px]">{activeDevice?.deviceId || 'DEV-0081'}</span>
          </div>
        </div>
      </div>

      {/* MEDICAL BASELINE CARD */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
            <span>Medical Baseline</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
            Respiratory Watch
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Pre-existing Condition:</span>
            <strong className="text-slate-800">Asthma / Hypersensitivity</strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Emergency Contact:</span>
            <strong className="text-slate-800">+91 98765-43210 (O+)</strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Active Sensor Coupon:</span>
            <span className="font-mono text-slate-700 font-semibold">{activeStrip?.stripId || 'STRIP-2026-000124'}</span>
          </div>
        </div>
      </div>

      {/* COMPLIANCE DOCUMENTS */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safety Certifications</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">All Valid</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
            <div>
              <div className="font-bold text-slate-800 text-[11px]">H₂S Gas Hazard Safety Training</div>
              <div className="text-[10px] text-slate-400">Valid through Oct 2027</div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Passed
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
            <div>
              <div className="font-bold text-slate-800 text-[11px]">Annual Respiratory Fit Test</div>
              <div className="text-[10px] text-slate-400">Valid through Nov 2027</div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Passed
            </span>
          </div>
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-sky-600" />
            <span>Alert Preferences</span>
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-600">SMS Evacuation Alerts</span>
            <input 
              type="checkbox" 
              checked={smsAlerts} 
              onChange={() => setSmsAlerts(!smsAlerts)}
              className="rounded accent-sky-600 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-slate-600">Push Notifications for Rest Breaks</span>
            <input 
              type="checkbox" 
              checked={pushAlerts} 
              onChange={() => setPushAlerts(!pushAlerts)}
              className="rounded accent-sky-600 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <button
        onClick={() => logout()}
        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Log Out of Dosimeter System</span>
      </button>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Edit Operator Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 text-[11px]">Full Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-[11px]">Department:</label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONBOARDING MODAL */}
      <WorkerOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
    </div>
  );
};

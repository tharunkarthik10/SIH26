import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useDemo } from '../context/DemoContext';
import { PrivacyConsentModal } from '../components/common/PrivacyConsentModal';
import { WorkerOnboardingModal } from '../components/common/WorkerOnboardingModal';
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
  FileText,
  Edit3,
  TrendingUp,
  Bell,
  Upload,
  FileCheck,
  CheckCircle2,
  Lock,
  Send,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { workers, devices, chemicalStrips, measurements, workerDocuments, updateWorkerProfile, uploadWorkerDocument } = useData();
  const { isOffline, setIsOffline } = useDemo();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Profile Edit Form State
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editEmergency, setEditEmergency] = useState('');

  // Notification Preferences State
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [audioAlarms, setAudioAlarms] = useState(true);

  // Document Upload State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'training_cert' | 'medical_clearance' | 'fit_test'>('training_cert');

  // Trend timeframe state: 'weekly' | 'monthly'
  const [trendTab, setTrendTab] = useState<'weekly' | 'monthly'>('weekly');

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

  // Mock exposure trend data
  const weeklyData = [
    { label: 'Mon', dose: 4.2 },
    { label: 'Tue', dose: 6.8 },
    { label: 'Wed', dose: 5.1 },
    { label: 'Thu', dose: 12.4 },
    { label: 'Fri', dose: 3.9 },
    { label: 'Sat', dose: 8.2 },
    { label: 'Sun', dose: 1.5 },
  ];

  const monthlyData = [
    { label: 'Week 1', dose: 28.5 },
    { label: 'Week 2', dose: 42.1 },
    { label: 'Week 3', dose: 35.8 },
    { label: 'Week 4', dose: 24.6 },
  ];

  const handleOpenEditModal = () => {
    if (assignedWorker) {
      setEditName(assignedWorker.name);
      setEditDept(assignedWorker.department);
      setEditCondition('Asthma / Respiratory Hypersensitivity');
      setEditEmergency('+91 98765-43210 (O+)');
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

  const handleUploadDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) return;
    uploadWorkerDocument({
      title: docTitle,
      type: docType,
      fileSize: '1.2 MB (PDF)',
      expiryDate: '2027-09-01T00:00:00Z'
    });
    setDocTitle('');
    setIsUploadDocOpen(false);
  };

  return (
    <div className="space-y-4 font-sans animate-in fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Account Holder Profile</h1>
          <p className="text-xs text-slate-500 font-sans">Personal Credentials & Chronic Dose Tracking</p>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsOnboardingModalOpen(true)}
            className="p-1.5 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs flex items-center gap-1 border border-sky-200"
            title="Open Field Worker Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Guide</span>
          </button>

          <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
            {user?.role || 'Plant Worker'}
          </span>
        </div>
      </div>

      {/* ACCOUNT HOLDER IDENTIFICATION CARD */}
      <div className="industrial-card p-4 space-y-4 bg-white border-2 border-sky-100">
        <div className="flex items-center justify-between">
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

          <button
            onClick={handleOpenEditModal}
            className="p-2 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs hover:bg-sky-100 border border-sky-200 flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* WORKER DETAILS GRID */}
        <div className="space-y-2 text-xs pt-1">
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500">Employee Code:</span>
            <span className="text-slate-800 font-mono font-bold">{assignedWorker?.employeeCode || 'EMP-9042'}</span>
          </div>

          {/* FIXED TRUNCATION FOR DEPARTMENT LOCATION */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
              <Building className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              Plant Department:
            </span>
            <div className="text-slate-900 font-bold text-xs whitespace-normal break-words leading-relaxed">
              {assignedWorker?.department || 'Refinery Plant A - Desulfurization Unit 4'}
            </div>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              Assigned Hardware Reader:
            </span>
            <strong className="text-sky-700 font-bold">{activeDevice?.deviceId || 'DEV-0081'}</strong>
          </div>
        </div>
      </div>

      {/* CHRONIC LOW-LEVEL EXPOSURE HISTORY TREND (WEEKLY / MONTHLY CUMULATIVE DOSE) */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>Chronic Exposure History Trend</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setTrendTab('weekly')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                trendTab === 'weekly' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTrendTab('monthly')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                trendTab === 'monthly' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendTab === 'weekly' ? weeklyData : monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-2 rounded-xl text-[10px] shadow-sm">
                        <div className="font-bold text-slate-900">{d.label} Cumulative Dose</div>
                        <div className="text-sky-700 font-extrabold">{d.dose} ppm·h</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="dose" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Cumulative Chronic Dose: <strong>42.1 ppm·h (This Month)</strong></span>
          <span className="text-emerald-700 font-bold">Within OSHA Chronic Standard</span>
        </div>
      </div>

      {/* NOTIFICATION & ALERT PREFERENCES CARD */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <Bell className="w-4 h-4 text-sky-600" />
            <span>Notification & Alert Preferences</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-800">Emergency SMS Dispatch</div>
              <div className="text-[10px] text-slate-500">Send emergency SMS to emergency contacts during Critical High alerts.</div>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-800">Push Notifications</div>
              <div className="text-[10px] text-slate-500">Real-time smartphone push alerts when chemical strip lifetime &lt; 20%.</div>
            </div>
            <input
              type="checkbox"
              checked={pushAlerts}
              onChange={(e) => setPushAlerts(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="font-bold text-slate-800">Audible Dosimeter Siren</div>
              <div className="text-[10px] text-slate-500">High-decibel phone alarm when mandatory shift removal is triggered.</div>
            </div>
            <input
              type="checkbox"
              checked={audioAlarms}
              onChange={(e) => setAudioAlarms(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded"
            />
          </div>
        </div>
      </div>

      {/* MEDICAL CLEARANCE & TRAINING CERTIFICATIONS CARD */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <FileCheck className="w-4 h-4 text-sky-600" />
            <span>Medical Clearance & Safety Certificates ({workerDocuments.length})</span>
          </div>

          <button
            onClick={() => setIsUploadDocOpen(true)}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] rounded-lg border border-sky-200 flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Cert</span>
          </button>
        </div>

        <div className="space-y-2">
          {workerDocuments.map(doc => (
            <div key={doc.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">{doc.title}</div>
                <div className="text-[10px] text-slate-500">{doc.fileSize} • Valid until {doc.expiryDate ? doc.expiryDate.split('T')[0] : '2027'}</div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PRIVACY & DATA CONSENT MODAL TRIGGER BUTTON */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Lock className="w-4 h-4 text-sky-600" />
          <span>Health Data Privacy & HIPAA Consent Notice</span>
        </div>
        <button
          onClick={() => setIsPrivacyModalOpen(true)}
          className="px-2.5 py-1 bg-white border border-slate-300 text-slate-800 font-bold text-[10px] rounded-lg hover:bg-slate-100"
        >
          View Consent
        </button>
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

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-sky-600" />
                <span>Edit Profile & Medical Baseline</span>
              </h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Full Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Department Location:</label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Respiratory / Health Condition:</label>
                <select
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Asthma / Respiratory Hypersensitivity">Asthma / Respiratory Hypersensitivity</option>
                  <option value="Pre-existing Cardiac Condition">Pre-existing Cardiac Condition</option>
                  <option value="Chronic Bronchitis">Chronic Bronchitis</option>
                  <option value="Healthy Baseline">Healthy Baseline</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Emergency Phone Contact:</label>
                <input
                  type="text"
                  value={editEmergency}
                  onChange={(e) => setEditEmergency(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold"
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
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Upload Compliance Document</span>
              </h3>
              <button onClick={() => setIsUploadDocOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <form onSubmit={handleUploadDocumentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Document Title:</label>
                <input
                  type="text"
                  placeholder="e.g. H2S Safety Training Cert 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Category:</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="training_cert">H2S Safety Training Certificate</option>
                  <option value="medical_clearance">Annual Respiratory Medical Clearance</option>
                  <option value="fit_test">Respirator Mask Fit Test Card</option>
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-1 bg-slate-50">
                <FileCheck className="w-6 h-6 text-sky-600 mx-auto" />
                <div className="font-bold text-slate-700">Drag & Drop PDF or Image</div>
                <div className="text-[10px] text-slate-400">Supported formats: PDF, PNG, JPG (Max 5MB)</div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUploadDocOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Upload & Verify</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRIVACY CONSENT MODAL */}
      <PrivacyConsentModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* WORKER ONBOARDING MODAL */}
      <WorkerOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
    </div>
  );
};


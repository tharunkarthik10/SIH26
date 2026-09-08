import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useDemo } from '../context/DemoContext';
import { isFirebaseConfigured } from '../services/firebase';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { Settings, Database, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { calibrationProfiles, resetToDemoData } = useData();
  const { isDemoBarVisible, setIsDemoBarVisible, isOffline, setIsOffline } = useDemo();

  const [activeProfile, setActiveProfile] = useState('CP-03');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetData = () => {
    resetToDemoData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title Card */}
      <div className="industrial-card p-5 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
              System Configuration & Calibration Registry
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Manage hybrid calibration models, database seeding, and hardware preferences.
            </p>
          </div>
        </div>

        {/* SIH Demo Mode & Interface Controls */}
        <div className="space-y-3 font-mono text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider">
            Demonstration Controls
          </h3>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Top SIH Demo Control Bar</div>
              <div className="text-[10px] text-slate-500">Show floating scenario switcher header for presentations</div>
            </div>
            <button
              onClick={() => setIsDemoBarVisible(!isDemoBarVisible)}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                isDemoBarVisible ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}
            >
              {isDemoBarVisible ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Simulated Network Status</div>
              <div className="text-[10px] text-slate-500">Toggle offline queueing vs online synchronization</div>
            </div>
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${
                isOffline ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              {isOffline ? 'Offline Mode' : 'Online Mode'}
            </button>
          </div>
        </div>

        {/* Database Control */}
        <div className="space-y-3 font-mono text-xs pt-3 border-t border-slate-100">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-sky-600" />
            <span>Database Status & Seeding</span>
          </h3>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Storage Driver</div>
              <div className="text-[10px] text-slate-500">
                {isFirebaseConfigured ? 'Connected to Cloud Firestore' : 'Pre-seeded Reactive LocalStorage Engine (SIH Demo)'}
              </div>
            </div>

            <button
              onClick={handleResetData}
              className="industrial-button-secondary flex items-center gap-1.5 py-1.5 text-xs text-amber-800 border-amber-300 hover:bg-amber-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{resetSuccess ? 'Reset Complete!' : 'Reset Demo Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calibration Profile Registry Card */}
      <div className="industrial-card p-5 space-y-4 font-mono text-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Calibration Profile Registry (Abstraction)
            </h3>
            <p className="text-[11px] text-slate-500">
              Select active optical absorption regression model for exposure calculation.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {calibrationProfiles.map((cp) => (
            <div
              key={cp.calibrationProfileId}
              onClick={() => setActiveProfile(cp.calibrationProfileId)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                activeProfile === cp.calibrationProfileId
                  ? 'bg-sky-50/50 border-sky-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{cp.calibrationProfileId}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {cp.version}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  cp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cp.status}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                {cp.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                <span>Model Type: <strong className="text-slate-800">{cp.modelType}</strong></span>
                <span>R² Confidence: <strong className="text-sky-700">{cp.rSquared || 0.988}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <ScientificDisclaimer />
    </div>
  );
};

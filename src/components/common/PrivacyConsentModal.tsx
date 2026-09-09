import React, { useState } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ isOpen, onClose }) => {
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    return localStorage.getItem('SIH_HEALTH_PRIVACY_CONSENT') === 'true';
  });

  const handleAgree = () => {
    setHasConsented(true);
    localStorage.setItem('SIH_HEALTH_PRIVACY_CONSENT', 'true');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Health Data Privacy & Consent Notice" maxWidth="md">
      <div className="space-y-4 font-sans text-xs text-slate-700">
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sky-900 text-xs">Occupational Health Compliance</h4>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              This application records personal health parameters (e.g. Asthma/Respiratory hypersensitivity baseline, heart rate vitals) strictly for real-time toxic gas safety algorithms.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Data Storage & Protection Standards:</div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>AES-256 Encrypted Local & Cloud Storage</span>
            </div>
            <p className="text-slate-500 leading-tight">
              Medical baselines are stored on encrypted device storage and synced strictly over TLS 1.3 to authorized plant safety supervisors.
            </p>

            <div className="flex items-center gap-2 text-slate-800 font-semibold pt-1 border-t border-slate-200">
              <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Occupational Health Purpose Only</span>
            </div>
            <p className="text-slate-500 leading-tight">
              Your asthma status dynamically adjusts rest thresholds (0.8x multiplier) to prevent respiratory distress during chemical leaks.
            </p>
          </div>
        </div>

        {hasConsented ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 font-bold text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Consent Verified (Active on Account)</span>
            </span>
            <button onClick={onClose} className="px-3 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-700 hover:bg-emerald-100">
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>By clicking "I Agree & Provide Consent", you authorize SIH Telemetry to process respiratory health baselines for gas dosage safety calculation.</span>
            </div>
            <button
              onClick={handleAgree}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>I Agree & Provide Health Consent</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

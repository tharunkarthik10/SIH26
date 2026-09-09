import React, { useState } from 'react';
import { Modal } from './Modal';
import { Radio, ShieldAlert, AlertTriangle, RefreshCw, CheckCircle2, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

interface WorkerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerOnboardingModal: React.FC<WorkerOnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '1. NFC Reader Tap Flow',
      icon: Radio,
      color: 'text-sky-600 bg-sky-100',
      description: 'How to take an optical gas exposure measurement using your assigned smartphone or stationary NFC terminal.',
      points: [
        'Ensure the chemical colorimetric strip is securely mounted in your dosimeter housing.',
        'Hold the back of your smartphone within 2 cm of the NFC reader target until it vibrates.',
        'The photodiode measures the optical absorbance change in the strip and instantly calculates your cumulative H₂S gas dose in ppm·h.',
        'You can also take a backup color photo scan using the camera scanner button if NFC is unavailable.'
      ]
    },
    {
      title: '2. Exposure Badges & Regulatory Limits',
      icon: ShieldAlert,
      color: 'text-emerald-600 bg-emerald-100',
      description: 'Understanding your status indicator, color codes, and official safety thresholds.',
      points: [
        'LOW (0 – 10 ppm·h): Safe working range. Normal shift operations permitted.',
        'MODERATE (10 – 25 ppm·h): Elevated gas accumulation. Mandatory 30 to 45-minute hydration rest break in clean air required.',
        'HIGH (>= 25 ppm·h): Critical Toxicity Hazard. Immediate site evacuation and mandatory medical shift removal required.',
        'Reference Limits: OSHA PEL (10 ppm 8-hr TWA), OSHA STEL (15 ppm 15-min ceiling), NIOSH IDLH (100 ppm).'
      ]
    },
    {
      title: '3. Mandatory Medical Shift Removal Protocol',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-100',
      description: 'What happens when a high gas exposure or respiratory risk condition is detected.',
      points: [
        'When a critical alert triggers, a mandatory medical leave banner appears on screen.',
        'Step 1: Tap "Acknowledge" to confirm receipt of the emergency warning.',
        'Step 2: Tap "Notify Supervisor" to automatically dispatch your GPS location and telemetry to the plant control room.',
        'Step 3: Tap "Log Incident" to submit symptom details and proceed immediately to fresh air isolation.'
      ]
    },
    {
      title: '4. Chemical Strip Lifecycle & Replacement',
      icon: RefreshCw,
      color: 'text-amber-600 bg-amber-100',
      description: 'Managing your strip capacity and requesting a replacement.',
      points: [
        'Each chemical strip has a maximum exposure saturation capacity (50 ppm·h).',
        'When remaining strip lifetime drops below 20%, a warning banner will notify you.',
        'Tap "Request Replacement Strip" on the Strip tab to order a fresh lot from the chemical inventory.',
        'Batch QC certificates can be inspected anytime for audit compliance.'
      ]
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Field Worker Telemetry Guide" maxWidth="lg">
      <div className="space-y-4 font-sans text-slate-800">
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            Field Operator Onboarding Guide
          </span>
          <span className="text-sky-700 font-mono">Step {step + 1} of {steps.length}</span>
        </div>

        <div className="flex gap-1.5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === step ? 'bg-sky-600' : idx < step ? 'bg-sky-200' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${currentStep.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">{currentStep.title}</h3>
              <p className="text-xs text-slate-500">{currentStep.description}</p>
            </div>
          </div>

          <ul className="space-y-2 text-xs pt-2 border-t border-slate-200/80">
            {currentStep.points.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep(prev => Math.max(0, prev - 1))}
            disabled={step === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
              step === 0 ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Got It & Ready</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

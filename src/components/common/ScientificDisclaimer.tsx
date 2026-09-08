import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ScientificDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export const ScientificDisclaimer: React.FC<ScientificDisclaimerProps> = ({ 
  compact = false, 
  className = '' 
}) => {
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono shadow-2xs ${className}`}>
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Demo value — calibration model pending experimental validation.</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1 shadow-2xs ${className}`}>
      <div className="flex items-center gap-2 font-semibold text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Prototype Calibration & Validation Notice</span>
      </div>
      <p className="text-amber-800">
        Demo value — calibration model pending experimental validation. The estimated exposure (ppm·h) is derived from prototype mathematical curves (CP-03). Final medical and regulatory safety certification will require gas chamber calibration.
      </p>
    </div>
  );
};

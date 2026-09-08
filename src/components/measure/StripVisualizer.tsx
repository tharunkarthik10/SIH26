import React from 'react';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { ChemicalStrip } from '../../types';
import { formatIndianDate } from '../../utils/dateUtils';

interface StripVisualizerProps {
  strip?: ChemicalStrip;
  opticalReading?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StripVisualizer: React.FC<StripVisualizerProps> = ({
  strip,
  opticalReading = 0.85,
  className = '',
}) => {
  // Lower optical reading = darker colorimetric reaction (Silver Nitrate darkening under H2S exposure)
  // 1.0 = Fresh yellow/white reagent (#fef08a)
  // 0.5 = Moderate brown (#d97706)
  // 0.1 = Severe dark black/brown (#1c1917)
  const calculateSensingAreaColor = (reading: number) => {
    if (reading >= 0.8) {
      return 'bg-amber-100 border-amber-300 text-amber-900';
    } else if (reading >= 0.5) {
      return 'bg-amber-600 border-amber-700 text-white';
    } else {
      return 'bg-stone-900 border-stone-800 text-stone-100';
    }
  };

  const sensingColorClass = calculateSensingAreaColor(opticalReading);

  return (
    <div className={`industrial-card p-4 relative overflow-hidden bg-white border border-slate-200/90 shadow-sm ${className}`}>
      {/* Strip Shell Blueprint Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-mono font-bold text-xs text-slate-800 uppercase tracking-wider">
            H₂S Chemical Sensing Coupon
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          Batch: {strip?.batchId || 'B024-H2S'}
        </span>
      </div>

      {/* Disposable Physical Strip Graphic */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        {/* Left: Colorimetric Optical Sensing Window */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
            Colorimetric Reaction Zone
          </div>

          {/* Color Matrix Sensing Area */}
          <div className={`w-24 h-16 rounded-xl border-2 ${sensingColorClass} flex flex-col items-center justify-center text-center transition-all duration-700 shadow-inner relative overflow-hidden group`}>
            <div className="text-[10px] font-mono font-bold">
              H₂S SENSOR
            </div>
            <div className="text-[9px] font-mono opacity-90 mt-0.5">
              {(opticalReading * 100).toFixed(0)}% Optical
            </div>
            
            {/* Photodiode Scanning Line Simulation overlay */}
            <div className="absolute inset-x-0 h-0.5 bg-sky-500 opacity-75 shadow-xs animate-scan-line"></div>
          </div>

          <div className="text-[9px] font-mono text-slate-500 mt-2">
            Absorbance: {opticalReading.toFixed(3)} AU
          </div>
        </div>

        {/* Right: QR Code & Expiry Metadata */}
        <div className="flex flex-col items-center justify-center border-l border-slate-200 pl-4 space-y-2">
          <QRCodeDisplay 
            id={strip?.stripId || 'STRIP-2026-000124'} 
            type="strip" 
            size="sm"
            label="Strip QR"
          />

          <div className="text-center font-mono text-[10px]">
            <div className="text-slate-400">Expiry Date</div>
            <div className="text-slate-800 font-semibold">
              {strip?.expiryDate ? formatIndianDate(strip.expiryDate) : '12 Aug 2027'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
        <span>Calibration: <strong className="text-slate-800">{strip?.calibrationProfileId || 'CP-03'}</strong></span>
        <span>Single-Use Disposable</span>
      </div>
    </div>
  );
};

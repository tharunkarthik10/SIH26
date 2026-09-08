import React from 'react';
import { Measurement, Device, ChemicalStrip, Worker } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { ScientificDisclaimer } from '../common/ScientificDisclaimer';
import { formatIndianFullDateTime } from '../../utils/dateUtils';
import { CheckCircle2, User, Cpu, Tag, Calendar, Zap, Camera, Radio, ShieldCheck, CheckCheck } from 'lucide-react';

interface MeasurementResultCardProps {
  measurement: Measurement;
  device?: Device;
  strip?: ChemicalStrip;
  worker?: Worker;
  onResetScan?: () => void;
}

export const MeasurementResultCard: React.FC<MeasurementResultCardProps> = ({
  measurement,
  device,
  strip,
  worker,
  onResetScan
}) => {
  const isDanger = measurement.exposureStatus === 'HIGH';
  const isWarning = measurement.exposureStatus === 'MODERATE';

  let borderGlow = 'border-emerald-300 shadow-emerald-500/5';
  if (isDanger) borderGlow = 'border-rose-300 shadow-rose-500/10';
  else if (isWarning) borderGlow = 'border-amber-300 shadow-amber-500/5';

  const nfcData = measurement.nfcReading || { opticalReading: measurement.opticalReading, estimatedExposure: measurement.estimatedExposure };
  const cameraData = measurement.cameraReading;
  const isHybrid = measurement.readingMethod === 'hybrid_dual' || !!cameraData;

  return (
    <div className={`industrial-card p-6 border-2 shadow-xl ${borderGlow} space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDanger ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
          }`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <span>Telemetry Record</span>
              {isHybrid && (
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px]">
                  HYBRID CROSS-CHECK
                </span>
              )}
            </div>
            <h2 className="text-lg font-mono font-bold text-slate-900">
              MEASUREMENT COMPLETE
            </h2>
          </div>
        </div>

        <StatusPill status={measurement.exposureStatus} className="text-sm px-3 py-1" />
      </div>

      {/* Main Big Numerical Exposure Display */}
      <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200 text-center relative overflow-hidden">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">
          Final Estimated Cumulative Exposure (Primary: NFC Optical)
        </div>

        <div className="flex items-baseline justify-center gap-2">
          <span className={`font-mono text-5xl md:text-6xl font-extrabold tracking-tight ${
            isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {measurement.estimatedExposure.toFixed(1)}
          </span>
          <span className="font-mono text-xl font-bold text-slate-500">
            {measurement.exposureUnit}
          </span>
        </div>

        {/* Dual Method Cross-Check Badge */}
        {isHybrid && measurement.crossCheckVerified !== undefined && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Dual Method Cross-Check Verified ({measurement.crossCheckDelta?.toFixed(1)} ppm·h delta)</span>
          </div>
        )}
      </div>

      {/* TWO RESULTS → ONE RECORD DUAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Primary Method: NFC Optical Reading */}
        <div className="p-4 bg-white rounded-xl border-2 border-sky-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-sky-800 flex items-center gap-1.5 text-sm">
              <Radio className="w-4 h-4 text-sky-600" />
              NFC Optical Reading
            </span>
            <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-md uppercase">
              PRIMARY ✅
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-700">
            <span>Photodiode Absorbance:</span>
            <strong className="text-slate-900 font-mono">{nfcData.opticalReading.toFixed(3)} AU</strong>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Estimated Exposure:</span>
            <strong className="text-sky-700 font-mono text-sm">{nfcData.estimatedExposure.toFixed(1)} ppm·h</strong>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            Controlled LED + MCU transmission
          </div>
        </div>

        {/* Secondary Method: Camera Reading */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
              <Camera className="w-4 h-4 text-amber-600" />
              Camera Reading
            </span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase">
              SECONDARY / CROSS-CHECK 📷
            </span>
          </div>

          {cameraData ? (
            <>
              <div className="flex justify-between items-center text-slate-700">
                <span>Color Sample Hex:</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: cameraData.analyzedColorHex }} />
                  {cameraData.analyzedColorHex}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Estimated Exposure:</span>
                <strong className="text-amber-700 font-mono text-sm">{cameraData.estimatedExposure.toFixed(1)} ppm·h</strong>
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                Image RGB optical density analysis ({cameraData.confidenceScore}% confidence)
              </div>
            </>
          ) : (
            <div className="text-slate-400 italic text-xs py-2 text-center">
              Camera cross-check not performed for this scan.
            </div>
          )}
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Worker Info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>Assigned Worker</span>
          </div>
          <div className="font-semibold text-slate-900 truncate">
            {worker ? worker.name : measurement.workerName || 'Unassigned Worker'}
          </div>
          <div className="text-[10px] text-slate-500">
            ID: {measurement.workerId}
          </div>
        </div>

        {/* Device Info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            <span>NFC Reader Unit</span>
          </div>
          <div className="font-semibold text-slate-900">
            {measurement.deviceId}
          </div>
          <div className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-600" />
            Power: NFC powered
          </div>
        </div>

        {/* Strip Info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>Chemical Strip</span>
          </div>
          <div className="font-semibold text-slate-900 truncate">
            {measurement.stripId}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold">
            Status: VALID
          </div>
        </div>
      </div>

      {/* Details Row: Timestamp & Calibration Profile */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 pt-2 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Timestamp: {formatIndianFullDateTime(measurement.timestamp)}</span>
        </div>
        <div>
          Calibration Profile: <span className="text-slate-800 font-semibold">{measurement.calibrationProfileId}</span>
        </div>
      </div>

      {/* Scientific Disclaimer */}
      <ScientificDisclaimer />

      {/* Action Button */}
      {onResetScan && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onResetScan}
            className="industrial-button-primary w-full sm:w-auto"
          >
            Perform New Scan
          </button>
        </div>
      )}
    </div>
  );
};

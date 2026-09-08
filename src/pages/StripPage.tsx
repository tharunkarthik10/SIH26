import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/common/StatusPill';
import { QRCodeDisplay } from '../components/common/QRCodeDisplay';
import { formatIndianDate, formatIndianFullDateTime } from '../utils/dateUtils';
import { 
  Tag, 
  History, 
  Calendar, 
  AlertTriangle,
  Battery,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
  Gauge,
  UserCheck,
  Thermometer,
  Droplets,
  Sun,
  CloudSun
} from 'lucide-react';

type WeatherPreset = 'normal' | 'hot_humid' | 'extreme_tropical';

export const StripPage: React.FC = () => {
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

  const activeStrip = (chemicalStrips && chemicalStrips.length > 0)
    ? (chemicalStrips.find(s => s.status === 'VALID') || chemicalStrips[0])
    : undefined;

  const latestMeasurement = (assignedWorker ? measurements.find(m => m && m.workerId === assignedWorker.workerId) : undefined) || measurements[0];
  const currentExposure = typeof latestMeasurement?.estimatedExposure === 'number' ? latestMeasurement.estimatedExposure : 4.2;

  // Weather Impact Simulation State
  const [weatherPreset, setWeatherPreset] = useState<WeatherPreset>('normal');

  const weatherConfig = {
    normal: {
      label: 'Standard Ambient',
      temp: '25°C',
      humidity: '50% RH',
      uv: 'Shaded',
      rateMultiplier: 1.0,
      adjustedExpiry: '12 Aug 2027',
      expiryStatus: 'Nominal Baseline Expiry',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    hot_humid: {
      label: 'Hot & Humid',
      temp: '38°C',
      humidity: '82% RH',
      uv: 'Moderate Direct UV',
      rateMultiplier: 1.35,
      adjustedExpiry: '28 Apr 2027 (-106 days)',
      expiryStatus: 'Accelerated Degradation (+35% Rate)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
    },
    extreme_tropical: {
      label: 'Extreme Heat & Wet',
      temp: '45°C',
      humidity: '92% RH',
      uv: 'High Solar Radiation',
      rateMultiplier: 1.85,
      adjustedExpiry: '15 Jan 2027 (-209 days)',
      expiryStatus: 'Rapid Degradation (+85% Rate)',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
    }
  }[weatherPreset];

  // Max strip saturation capacity (50 ppm·h limit adjusted for weather rate)
  const MAX_STRIP_CAPACITY = 50.0;
  const effectiveExposure = currentExposure * weatherConfig.rateMultiplier;
  const lifetimePct = Math.max(0, Math.min(100, Math.round(((MAX_STRIP_CAPACITY - effectiveExposure) / MAX_STRIP_CAPACITY) * 100)));
  const isMaxCapacityReached = effectiveExposure >= MAX_STRIP_CAPACITY || activeStrip?.status === 'EXPIRED' || activeStrip?.status === 'USED';

  // Collapsible History State
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const toggleRecordExpand = (recordId: string) => {
    setExpandedRecordId(prev => (prev === recordId ? null : recordId));
  };

  const stripHistory = activeDevice?.stripHistory || [
    {
      recordId: 'REC-101',
      stripId: activeStrip ? activeStrip.stripId : 'STRIP-2026-000124',
      batchId: activeStrip ? activeStrip.batchId : 'B024-H2S',
      insertedAt: '2026-01-15T08:00:00Z',
      status: activeStrip ? activeStrip.status : 'VALID',
      replacedByEmail: 'supervisor@industrial-safety.org',
      totalObservedExposure: 4.2,
      opticalAbsorbance: 0.842,
      usageDurationText: 'Active in Unit (236 days)'
    },
    {
      recordId: 'REC-100',
      stripId: 'STRIP-2026-000099',
      batchId: 'B022-H2S',
      insertedAt: '2025-12-01T08:00:00Z',
      removedAt: '2026-01-15T07:55:00Z',
      status: 'USED',
      replacedByEmail: 'supervisor@industrial-safety.org',
      totalObservedExposure: 48.6,
      opticalAbsorbance: 0.215,
      usageDurationText: '44 days, 23 hours'
    }
  ];

  if (!activeStrip) {
    return (
      <div className="p-8 text-center font-sans text-slate-500">
        Loading chemical strip details...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans animate-in fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Chemical Strip Details</h1>
          <p className="text-xs text-slate-500 font-sans">Dynamic Weather Impact & Hourly Saturation</p>
        </div>
        <StatusPill status={isMaxCapacityReached ? 'EXPIRED' : activeStrip.status} />
      </div>

      {/* MAX CAPACITY WARNING BANNER IF STRIP EXHAUSTED */}
      {isMaxCapacityReached && (
        <div className="p-3 bg-rose-100 border-2 border-rose-300 rounded-xl text-rose-900 text-xs space-y-1 font-sans animate-bounce">
          <div className="font-extrabold flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>MAX STRIP CAPACITY REACHED — REPLACE STRIP</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            The chemical strip has reached its maximum exposure saturation limit under current ambient weather conditions.
          </p>
        </div>
      )}

      {/* ACTIVE CHEMICAL STRIP CARD */}
      <div className="industrial-card p-4 space-y-4 border-2 border-amber-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base font-sans">
                {activeStrip.stripId}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Batch: {activeStrip.batchId}
              </span>
            </div>
          </div>

          <QRCodeDisplay id={activeStrip.stripId} type="strip" size="sm" />
        </div>

        {/* Dynamic Hourly Exposure & Weather-Adjusted Lifetime Gauge */}
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2 text-xs">
          <div className="flex justify-between items-center font-semibold text-slate-800">
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-amber-600" />
              Remaining Strip Lifetime:
            </span>
            <span className={`font-bold ${lifetimePct < 20 ? 'text-rose-600' : lifetimePct < 50 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {lifetimePct}% ({effectiveExposure.toFixed(1)} / {MAX_STRIP_CAPACITY} ppm·h)
            </span>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                lifetimePct < 20 ? 'bg-rose-500' : lifetimePct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${lifetimePct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <span>Observed Dosage: {effectiveExposure.toFixed(1)} ppm·h</span>
            <span>Degradation Rate: {weatherConfig.rateMultiplier}x</span>
          </div>
        </div>

        {/* DYNAMIC WEATHER & EXPIRY ADJUSTMENT FIELDS */}
        <div className="space-y-2 text-xs">
          {/* Date of Creation (Mfg) */}
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500">Date of Creation (Mfg):</span>
            <strong className="text-slate-800 font-semibold">
              {formatIndianDate(activeStrip.manufacturedAt || '2026-01-10')}
            </strong>
          </div>

          {/* Weather Adjusted Date of Expiry */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Weather-Adjusted Expiry Date:
              </span>
              <strong className="text-emerald-700 font-bold text-xs">
                {weatherConfig.adjustedExpiry}
              </strong>
            </div>
            <div className="text-[10px] text-slate-400 text-right italic">
              {weatherConfig.expiryStatus}
            </div>
          </div>
        </div>
      </div>

      {/* AMBIENT WEATHER CONDITIONS CARD (ENVIRONMENT IMPACT SELECTOR) */}
      <div className="industrial-card p-4 space-y-3 bg-gradient-to-br from-sky-50/80 to-white border-2 border-sky-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <CloudSun className="w-4 h-4 text-sky-600" />
            <span>Ambient Weather & Environment Impact</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${weatherConfig.badgeColor}`}>
            {weatherConfig.label}
          </span>
        </div>

        {/* Live Weather Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <Thermometer className="w-3 h-3 text-rose-500" />
              Temp
            </div>
            <div className="font-bold text-slate-900 text-xs mt-0.5">{weatherConfig.temp}</div>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <Droplets className="w-3 h-3 text-sky-500" />
              Humidity
            </div>
            <div className="font-bold text-slate-900 text-xs mt-0.5">{weatherConfig.humidity}</div>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" />
              UV Exposure
            </div>
            <div className="font-bold text-slate-900 text-[10px] mt-0.5 truncate">{weatherConfig.uv}</div>
          </div>
        </div>

        {/* Weather Selector Buttons */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-500 font-semibold">Simulate Ambient Weather Condition:</div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setWeatherPreset('normal')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                weatherPreset === 'normal'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Standard (25°C)
            </button>

            <button
              onClick={() => setWeatherPreset('hot_humid')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                weatherPreset === 'hot_humid'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Hot & Humid
            </button>

            <button
              onClick={() => setWeatherPreset('extreme_tropical')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                weatherPreset === 'extreme_tropical'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Extreme Wet
            </button>
          </div>
        </div>
      </div>

      {/* REPLACEMENT HISTORY AUDIT LOG WITH COLLAPSIBLE EXPANDED DETAILS */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 uppercase tracking-wider">
            <History className="w-4 h-4 text-amber-600" />
            <span>Replacement History ({stripHistory.length})</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Tap any strip to view details</span>
        </div>

        {/* Collapsible Strip Items List */}
        <div className="space-y-2 text-xs font-sans">
          {stripHistory.map((rec) => {
            const isExpanded = expandedRecordId === rec.recordId;

            // Calculate usage duration if not explicitly stored
            let durationStr = rec.usageDurationText;
            if (!durationStr) {
              const start = new Date(rec.insertedAt).getTime();
              const end = rec.removedAt ? new Date(rec.removedAt).getTime() : Date.now();
              const diffHours = Math.max(1, Math.round((end - start) / (3600 * 1000)));
              const days = Math.floor(diffHours / 24);
              const hours = diffHours % 24;
              durationStr = days > 0 ? `${days} days, ${hours} hours` : `${hours} hours`;
            }

            const observedPpm = typeof rec.totalObservedExposure === 'number' ? rec.totalObservedExposure : (rec.status === 'VALID' ? currentExposure : 48.6);
            const absorbance = typeof rec.opticalAbsorbance === 'number' ? rec.opticalAbsorbance : (rec.status === 'VALID' ? 0.842 : 0.215);

            return (
              <div 
                key={rec.recordId} 
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded ? 'border-amber-300 bg-amber-50/40 shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                {/* Clickable Card Header */}
                <button
                  onClick={() => toggleRecordExpand(rec.recordId)}
                  className="w-full p-3 text-left flex items-center justify-between focus:outline-none"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{rec.stripId}</span>
                      <StatusPill status={rec.status} />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Batch: <strong className="text-slate-700">{rec.batchId}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right text-[11px]">
                      <div className="font-bold text-amber-700">{observedPpm.toFixed(1)} ppm·h</div>
                      <div className="text-slate-400 text-[10px]">{durationStr}</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-700 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded Detailed Report Panel */}
                {isExpanded && (
                  <div className="p-3 bg-white border-t border-amber-200 space-y-2.5 text-xs font-sans animate-in fade-in">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center justify-between">
                      <span>Strip Performance Report</span>
                      <span className="text-amber-700 font-mono text-[10px]">{rec.recordId}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* How Long Used */}
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>Usage Duration</span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{durationStr}</div>
                      </div>

                      {/* How Much Observed */}
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          <Activity className="w-3 h-3 text-amber-600" />
                          <span>Total Observed</span>
                        </div>
                        <div className="font-bold text-amber-700 text-xs">{observedPpm.toFixed(1)} ppm·h</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Optical Absorbance:</span>
                        <strong className="text-slate-800 font-mono">{absorbance.toFixed(3)} AU</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Inserted Timestamp:</span>
                        <strong className="text-slate-800">
                          {formatIndianFullDateTime(rec.insertedAt)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Removed Timestamp:</span>
                        <strong className="text-slate-800">
                          {rec.removedAt 
                            ? formatIndianFullDateTime(rec.removedAt) 
                            : 'Currently Active in Unit'}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100/60 text-slate-500">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-sky-600" />
                          Installed By:
                        </span>
                        <strong className="text-slate-700 truncate max-w-[160px]">{rec.replacedByEmail}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

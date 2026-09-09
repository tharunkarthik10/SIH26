import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
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
  CloudSun,
  FileCheck,
  ShoppingBag,
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

type WeatherPreset = 'normal' | 'hot_humid' | 'extreme_tropical';

export const StripPage: React.FC = () => {
  const { user } = useAuth();
  const { isDevMode } = useDemo();
  const { workers, devices, chemicalStrips, measurements, requestStripReplacement } = useData();

  // Requisition Modal State
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(5);
  const [orderUrgency, setOrderUrgency] = useState<'ROUTINE' | 'HIGH' | 'CRITICAL_EXPIRED'>('ROUTINE');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(false);

  // QC Cert Modal State
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);

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

  const latestMeasurement = (assignedWorker ? measurements.find(m => m && m.workerId === assignedWorker.workerId) : undefined) || measurements[0];
  const currentExposure = typeof latestMeasurement?.estimatedExposure === 'number' ? latestMeasurement.estimatedExposure : 4.2;

  const activeStrip = (chemicalStrips && chemicalStrips.length > 0)
    ? (chemicalStrips.find(s => latestMeasurement && s.stripId.toLowerCase() === latestMeasurement.stripId.toLowerCase()) ||
       chemicalStrips.find(s => s.status === 'VALID') || chemicalStrips[0])
    : undefined;

  // Weather Impact Simulation State
  const [weatherPreset, setWeatherPreset] = useState<WeatherPreset>('normal');

  const weatherConfig = {
    normal: {
      label: 'Standard Ambient Model',
      temp: '25°C',
      humidity: '50% RH',
      uv: 'Shaded',
      rateMultiplier: 1.0,
      adjustedExpiry: '12 Aug 2027',
      expiryStatus: 'Nominal Baseline Expiry',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    hot_humid: {
      label: 'Hot & Humid Compensation',
      temp: '38°C',
      humidity: '82% RH',
      uv: 'Moderate Direct UV',
      rateMultiplier: 1.35,
      adjustedExpiry: '28 Apr 2027 (-106 days)',
      expiryStatus: 'Accelerated Degradation (+35% Rate)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
    },
    extreme_tropical: {
      label: 'Extreme Heat & Wet Compensation',
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
  const isNearExpiry = lifetimePct < 20 && !isMaxCapacityReached;

  // Collapsible History State
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const toggleRecordExpand = (recordId: string) => {
    setExpandedRecordId(prev => (prev === recordId ? null : recordId));
  };

  const handleOrderRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStrip || !activeDevice) return;
    requestStripReplacement({
      stripId: activeStrip.stripId,
      deviceId: activeDevice.deviceId,
      requestedBy: userEmail,
      quantity: orderQuantity,
      urgency: orderUrgency,
      notes: orderNotes || 'Field operator replacement requisition.'
    });
    setOrderSuccessMsg(true);
    setTimeout(() => {
      setOrderSuccessMsg(false);
      setIsRequisitionModalOpen(false);
    }, 1500);
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
          <p className="text-xs text-slate-500 font-sans">Batch QC Audit & Environmental Compensation</p>
        </div>
        <StatusPill status={isMaxCapacityReached ? 'EXPIRED' : activeStrip.status} />
      </div>

      {/* PROACTIVE NEAR EXPIRY / LOW LIFETIME PUSH WARNING BANNER */}
      {isNearExpiry && (
        <div className="p-3 bg-amber-100 border-2 border-amber-300 rounded-xl text-amber-950 text-xs space-y-1 font-sans animate-pulse">
          <div className="font-extrabold flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>WARNING: STRIP NEARING EXPIRY / LOW LIFETIME (&lt;20%)</span>
            </span>
            <button
              onClick={() => setIsRequisitionModalOpen(true)}
              className="px-2 py-0.5 bg-amber-600 text-white font-bold rounded text-[10px] hover:bg-amber-700"
            >
              Order Now
            </button>
          </div>
          <p className="text-[11px] leading-relaxed">
            Remaining strip exposure capacity is only {lifetimePct}%. Requisition a replacement strip lot to prevent measurement interruption.
          </p>
        </div>
      )}

      {/* MAX CAPACITY WARNING BANNER IF STRIP EXHAUSTED */}
      {isMaxCapacityReached && (
        <div className="p-3 bg-rose-100 border-2 border-rose-300 rounded-xl text-rose-900 text-xs space-y-1 font-sans animate-bounce">
          <div className="font-extrabold flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>MAX STRIP CAPACITY REACHED — REPLACE STRIP</span>
            </span>
            <button
              onClick={() => setIsRequisitionModalOpen(true)}
              className="px-2.5 py-1 bg-rose-600 text-white font-extrabold rounded text-[10px] shadow-sm"
            >
              Request Replacement
            </button>
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

        {/* REQUEST REPLACEMENT STRIP CTA BUTTON */}
        <button
          onClick={() => setIsRequisitionModalOpen(true)}
          className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
            isNearExpiry || isMaxCapacityReached ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Request / Order Replacement Strip</span>
        </button>

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
                lifetimePct < 20 ? 'bg-rose-500 animate-pulse' : lifetimePct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${lifetimePct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <span>Observed Dosage: {effectiveExposure.toFixed(1)} ppm·h</span>
            <span>Degradation Rate: {weatherConfig.rateMultiplier}x</span>
          </div>
        </div>

        {/* CHAIN OF CUSTODY METADATA CARD */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-sans">
          <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center justify-between">
            <span>Chain of Custody & Mounting Verification</span>
            <span className="text-sky-700 font-mono">Traceability</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                Installed By:
              </span>
              <strong className="text-slate-800 font-semibold">Tech. Rajesh Kumar (EMP-9042)</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Mounted Timestamp:
              </span>
              <strong className="text-slate-800 font-mono">15 Jan 2026, 08:00 AM</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Assigned Reader Hardware:</span>
              <strong className="text-sky-700 font-mono">{activeDevice?.deviceId || 'DEV-0081'}</strong>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-emerald-800 font-bold">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Custody Verification:
              </span>
              <span className="bg-emerald-100 px-2 py-0.5 rounded text-[10px]">VERIFIED & SIGNED</span>
            </div>
          </div>
        </div>

        {/* BATCH QC / CALIBRATION CERTIFICATE REFERENCE CARD */}
        <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 space-y-2 text-xs font-sans">
          <div className="flex items-center justify-between">
            <div className="font-bold text-sky-900 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-sky-600" />
              <span>Batch Quality Control Certificate</span>
            </div>
            <button
              onClick={() => setIsQcModalOpen(true)}
              className="px-2.5 py-1 bg-white border border-sky-300 text-sky-800 font-bold text-[10px] rounded-lg hover:bg-sky-100 transition-colors shadow-2xs"
            >
              View Certificate
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
            <div>QC Cert #: <strong>QC-2026-B024-CERT</strong></div>
            <div>NIST Standard: <strong>NIST-H2S-7704</strong></div>
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

      {/* AMBIENT WEATHER CONDITIONS CARD (ENVIRONMENT COMPENSATION MODEL) */}
      <div className="industrial-card p-4 space-y-3 bg-gradient-to-br from-sky-50/80 to-white border-2 border-sky-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <CloudSun className="w-4 h-4 text-sky-600" />
            <span>Environmental Compensation Model</span>
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

        {/* Weather Selector Buttons (GATED BEHIND DEV MODE OR EXPLICIT OVERRIDE) */}
        {isDevMode ? (
          <div className="space-y-1 pt-1 border-t border-sky-100">
            <div className="text-[10px] text-amber-900 font-bold flex items-center justify-between">
              <span>[DEV MODE] Manual Weather Override Simulator:</span>
              <span className="text-[9px] bg-amber-100 px-1.5 py-0.2 rounded text-amber-800">Debug Tool</span>
            </div>
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
        ) : (
          <p className="text-[10px] text-slate-500 text-center italic">
            Automated sensor compensation active. (Manual overrides hidden in production view).
          </p>
        )}
      </div>

      {/* SCANNED TELEMETRY AUDIT LOG FOR THIS STRIP */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-amber-600" />
            <span>Scanned Telemetry Log for {activeStrip.stripId}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {measurements.filter(m => m && m.stripId.toLowerCase() === activeStrip.stripId.toLowerCase()).length} Scans Recorded
          </span>
        </div>

        <div className="space-y-2">
          {measurements
            .filter(m => m && m.stripId.toLowerCase() === activeStrip.stripId.toLowerCase())
            .slice(0, 5)
            .map(m => (
              <div key={m.measurementId} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900">
                    {m.estimatedExposure} <span className="text-[10px] font-normal text-slate-500">ppm·h</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {m.source === 'camera_scan' || m.readingMethod === 'camera_secondary' ? 'Camera QR Scan' : 'NFC Primary'} • {m.timestamp ? formatIndianDate(m.timestamp) : 'Just now'}
                  </div>
                </div>
                <StatusPill status={m.exposureStatus} />
              </div>
            ))}

          {measurements.filter(m => m && m.stripId.toLowerCase() === activeStrip.stripId.toLowerCase()).length === 0 && (
            <div className="p-3 text-center text-slate-400 text-xs italic">
              No optical scans recorded for this strip yet.
            </div>
          )}
        </div>
      </div>

      {/* REQUISITION ORDER MODAL */}
      {isRequisitionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>Requisition Chemical Strip Lot</span>
              </h3>
              <button onClick={() => setIsRequisitionModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            {orderSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 text-center font-bold text-xs rounded-xl space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto animate-bounce" />
                <div>Requisition Order Submitted!</div>
                <div className="text-[10px] font-normal text-emerald-700">Dispatched to plant safety inventory supervisor.</div>
              </div>
            ) : (
              <form onSubmit={handleOrderRequisition} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Target Device Reader Unit:</label>
                  <input
                    type="text"
                    disabled
                    value={activeDevice?.deviceId || 'DEV-0081'}
                    className="w-full mt-1 p-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700">Quantity (Strips):</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Number(e.target.value))}
                      className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Priority Level:</label>
                    <select
                      value={orderUrgency}
                      onChange={(e) => setOrderUrgency(e.target.value as any)}
                      className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="ROUTINE">Routine Stock</option>
                      <option value="HIGH">High Priority</option>
                      <option value="CRITICAL_EXPIRED">Critical (Expired)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Requisition Notes:</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Specify delivery bay or urgency justification..."
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl h-16 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRequisitionModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Order</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QC CERTIFICATE MODAL */}
      {isQcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-sky-600" />
                <span>Batch Calibration & QC Certificate</span>
              </h3>
              <button onClick={() => setIsQcModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-bold text-slate-900 text-sm">CERTIFICATE OF ANALYSIS</div>
                <div className="text-[10px] text-slate-500">ISO 17025 Certified Optical Lab</div>
              </div>

              <div>Certificate ID: <strong>QC-2026-B024-CERT</strong></div>
              <div>Batch Lot Number: <strong>B024-H2S</strong></div>
              <div>NIST Traceability ID: <strong>NIST-H2S-7704</strong></div>
              <div>Mfg Date: <strong>10 Jan 2026</strong></div>
              <div>Nominal Shelf Expiry: <strong>12 Aug 2027</strong></div>
              <div>Linear Slope (m): <strong>58.4 AU/(ppm·h)</strong></div>
              <div>R² Calibration Fit: <strong>0.988</strong></div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-emerald-800 font-bold text-center">
                STATUS: APPROVED FOR INDUSTRIAL DEPLOYMENT
              </div>
            </div>

            <button
              onClick={() => setIsQcModalOpen(false)}
              className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



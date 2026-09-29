import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useDemo } from '../context/DemoContext';
import { StatusPill } from '../components/common/StatusPill';
import { QRCodeDisplay } from '../components/common/QRCodeDisplay';
import { formatIndianDate } from '../utils/dateUtils';
import { 
  Tag, 
  ShoppingBag, 
  AlertTriangle,
  Clock,
  Battery,
  FileCheck,
  CheckCircle2,
  Send,
  CloudSun,
  ShieldCheck
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
      label: 'Standard (25°C)',
      rateMultiplier: 1.0,
      adjustedExpiry: '12 Aug 2027',
    },
    hot_humid: {
      label: 'Hot & Humid (38°C)',
      rateMultiplier: 1.35,
      adjustedExpiry: '28 Apr 2027',
    },
    extreme_tropical: {
      label: 'Extreme Tropical (45°C)',
      rateMultiplier: 1.85,
      adjustedExpiry: '15 Jan 2027',
    }
  }[weatherPreset];

  // Max strip saturation capacity
  const MAX_STRIP_CAPACITY = 50.0;
  const effectiveExposure = currentExposure * weatherConfig.rateMultiplier;
  const lifetimePct = Math.max(0, Math.min(100, Math.round(((MAX_STRIP_CAPACITY - effectiveExposure) / MAX_STRIP_CAPACITY) * 100)));
  const isMaxCapacityReached = effectiveExposure >= MAX_STRIP_CAPACITY || activeStrip?.status === 'EXPIRED' || activeStrip?.status === 'USED';
  const isNearExpiry = lifetimePct < 20 && !isMaxCapacityReached;

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

  const stripMeasurements = measurements.filter(
    m => m && activeStrip && m.stripId.toLowerCase() === activeStrip.stripId.toLowerCase()
  );

  if (!activeStrip) {
    return (
      <div className="p-8 text-center font-sans text-slate-500 text-sm">
        Loading chemical strip details...
      </div>
    );
  }

  return (
    <div className="space-y-3.5 font-sans animate-in fade-in pb-2">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Chemical Strip</h1>
          <p className="text-[11px] text-slate-500">Active Sensor Lot & Capacity</p>
        </div>
        <StatusPill status={isMaxCapacityReached ? 'EXPIRED' : activeStrip.status} />
      </div>

      {/* Near Expiry / Exhausted Warning Banner */}
      {isNearExpiry && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-[11px]">Low Strip Capacity ({lifetimePct}% left)</span>
          </div>
          <button
            onClick={() => setIsRequisitionModalOpen(true)}
            className="px-2 py-0.5 bg-amber-600 text-white font-bold rounded text-[10px]"
          >
            Order
          </button>
        </div>
      )}

      {isMaxCapacityReached && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold text-[11px]">Strip Saturated — Replacement Required</span>
          </div>
          <button
            onClick={() => setIsRequisitionModalOpen(true)}
            className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px]"
          >
            Replace
          </button>
        </div>
      )}

      {/* HERO: Active Strip Card & Remaining Capacity */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">
                {activeStrip.stripId}
              </div>
              <div className="text-[11px] text-slate-500">
                Batch: {activeStrip.batchId}
              </div>
            </div>
          </div>
          <QRCodeDisplay id={activeStrip.stripId} type="strip" size="sm" />
        </div>

        {/* Remaining Lifetime Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-amber-600" />
              Remaining Capacity
            </span>
            <span className={`font-extrabold text-sm ${
              lifetimePct < 20 ? 'text-rose-600' : lifetimePct < 50 ? 'text-amber-600' : 'text-emerald-700'
            }`}>
              {lifetimePct}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                lifetimePct < 20 ? 'bg-rose-500' : lifetimePct < 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${lifetimePct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Used: {effectiveExposure.toFixed(1)} / {MAX_STRIP_CAPACITY} ppm·h</span>
            <span>Valid to: {weatherConfig.adjustedExpiry}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setIsRequisitionModalOpen(true)}
          className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Request Replacement Strip</span>
        </button>
      </div>

      {/* KEY DETAILS: Clean 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400">Batch Lot</span>
          <div className="font-bold text-slate-800">{activeStrip.batchId}</div>
          <button 
            onClick={() => setIsQcModalOpen(true)}
            className="text-[10px] text-sky-600 font-semibold flex items-center gap-0.5 hover:underline pt-0.5"
          >
            <FileCheck className="w-3 h-3" />
            <span>QC Certificate</span>
          </button>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400">Mounted Date</span>
          <div className="font-bold text-slate-800">
            {formatIndianDate(activeStrip.manufacturedAt || '2026-01-15')}
          </div>
          <span className="text-[10px] text-slate-400">Installed in {activeDevice?.deviceId || 'DEV-0081'}</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400">Expiry Date</span>
          <div className="font-bold text-emerald-700">{weatherConfig.adjustedExpiry}</div>
          <span className="text-[10px] text-slate-400">NIST Calibrated</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-0.5">
          <span className="text-[10px] font-medium text-slate-400">Chain of Custody</span>
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Verified</span>
          </div>
          <span className="text-[10px] text-slate-400">Tech. Rajesh Kumar</span>
        </div>
      </div>

      {/* Environmental Model Summary */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
            <CloudSun className="w-3.5 h-3.5 text-sky-600" />
            <span>Environmental Compensation</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{weatherConfig.label}</span>
        </div>

        {isDevMode && (
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100">
            <button
              onClick={() => setWeatherPreset('normal')}
              className={`py-1 rounded-lg text-[10px] font-bold ${
                weatherPreset === 'normal' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setWeatherPreset('hot_humid')}
              className={`py-1 rounded-lg text-[10px] font-bold ${
                weatherPreset === 'hot_humid' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Hot & Humid
            </button>
            <button
              onClick={() => setWeatherPreset('extreme_tropical')}
              className={`py-1 rounded-lg text-[10px] font-bold ${
                weatherPreset === 'extreme_tropical' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Extreme
            </button>
          </div>
        )}
      </div>

      {/* Recent Strip Scans */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-bold text-xs text-slate-900">Strip Readings</span>
          <span className="text-[10px] text-slate-400 font-medium">
            {stripMeasurements.length} recorded
          </span>
        </div>

        <div className="space-y-1.5">
          {stripMeasurements.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              No optical scans on this strip yet
            </div>
          ) : (
            stripMeasurements.slice(-3).reverse().map((m) => (
              <div 
                key={m.measurementId} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {m.estimatedExposure.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">ppm·h</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {m.timestamp ? formatIndianDate(m.timestamp) : 'Recent'}
                  </div>
                </div>
                <StatusPill status={m.exposureStatus} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* REQUISITION ORDER MODAL */}
      {isRequisitionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>Requisition Strip Lot</span>
              </h3>
              <button onClick={() => setIsRequisitionModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            {orderSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 text-center font-bold text-xs rounded-xl space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div>Requisition Order Submitted</div>
                <div className="text-[10px] font-normal text-emerald-700">Dispatched to plant inventory.</div>
              </div>
            ) : (
              <form onSubmit={handleOrderRequisition} className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 text-[11px]">Unit ID:</label>
                  <input
                    type="text"
                    disabled
                    value={activeDevice?.deviceId || 'DEV-0081'}
                    className="w-full mt-1 p-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 text-[11px]">Quantity:</label>
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
                    <label className="font-semibold text-slate-700 text-[11px]">Priority:</label>
                    <select
                      value={orderUrgency}
                      onChange={(e) => setOrderUrgency(e.target.value as any)}
                      className="w-full mt-1 p-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="HIGH">High Priority</option>
                      <option value="CRITICAL_EXPIRED">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 text-[11px]">Notes (Optional):</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Bay location or notes..."
                    className="w-full mt-1 p-2 border border-slate-200 rounded-xl h-14 text-xs focus:outline-none focus:border-sky-500"
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
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QC CERTIFICATE MODAL */}
      {isQcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-sky-600" />
                <span>Batch QC Certificate</span>
              </h3>
              <button onClick={() => setIsQcModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
              <div>Lot Number: <strong>B024-H2S</strong></div>
              <div>NIST ID: <strong>NIST-H2S-7704</strong></div>
              <div>Linear Slope: <strong>58.4 AU/(ppm·h)</strong></div>
              <div>Fit Score (R²): <strong>0.988</strong></div>
              <div className="pt-1.5 border-t border-slate-200 text-emerald-800 font-bold text-center">
                STATUS: APPROVED
              </div>
            </div>

            <button
              onClick={() => setIsQcModalOpen(false)}
              className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

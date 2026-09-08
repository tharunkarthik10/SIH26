import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { generateSimulatedScanPayload } from '../services/simulationService';
import { NFCMeasurementService, WorkflowStepState, ScanExecutionResult } from '../services/nfcMeasurementService';
import { processCameraColorScan, performHybridCrossCheck } from '../services/cameraScanService';
import { assessHealthImpact } from '../services/healthImpactService';
import { exportMeasurementsToCSV } from '../services/reportService';
import { StatusPill } from '../components/common/StatusPill';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { DeviceStatusModal } from '../components/device/DeviceStatusModal';
import { Measurement, ReadingMethod } from '../types';
import { formatIndianTime, formatIndianDate } from '../utils/dateUtils';
import { CameraScannerModal, ScannedQRResult } from '../components/camera/CameraScannerModal';
import { DemoQRCodesModal } from '../components/demo/DemoQRCodesModal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  Radio, 
  Camera, 
  Cpu, 
  User, 
  Zap, 
  TrendingUp, 
  Download, 
  Activity,
  HeartPulse,
  Clock,
  Calendar,
  Layers,
  CheckCircle2,
  Tag,
  Plus,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Sliders
} from 'lucide-react';

export const SingleDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { activeScenarioId } = useDemo();
  const { 
    workers, 
    devices, 
    chemicalStrips, 
    measurements, 
    saveMeasurement, 
    updateStripStatus, 
    updateDeviceLastScan, 
    updateWorkerExposure,
    lookupDevice,
    lookupStrip,
    lookupWorker,
    registerChemicalStrip
  } = useData();

  // Find worker assigned to current logged in email with safe fallback
  const userEmail = user?.email || 'rajesh.kumar@industrial-safety.org';
  const assignedWorker = (workers && workers.length > 0)
    ? (workers.find(w => w && w.email && w.email.toLowerCase() === userEmail.toLowerCase()) || workers[0])
    : undefined;

  // Find device assigned to worker or email
  const activeDevice = (assignedWorker && devices && devices.length > 0)
    ? (devices.find(d => 
        (d.assignedWorkerId && assignedWorker.workerId && d.assignedWorkerId.toLowerCase() === assignedWorker.workerId.toLowerCase()) ||
        (d.assignedWorkerEmail && d.assignedWorkerEmail.toLowerCase() === userEmail.toLowerCase())
      ) || devices[0])
    : (devices && devices[0]);

  const activeStrip = (chemicalStrips && chemicalStrips.length > 0)
    ? (chemicalStrips.find(s => s.status === 'VALID') || chemicalStrips[0])
    : undefined;

  // Modals & Scan States
  const [isDeviceStatusModalOpen, setIsDeviceStatusModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isDemoQRCodesModalOpen, setIsDemoQRCodesModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanMethod, setActiveScanMethod] = useState<'nfc' | 'camera' | null>(null);
  const [currentStepState, setCurrentStepState] = useState<WorkflowStepState | null>(null);
  const [scanResult, setScanResult] = useState<ScanExecutionResult | null>(null);

  // Handle Real Camera QR Code Scan Result
  const handleRealCameraScanSuccess = (scanned: ScannedQRResult) => {
    const targetDevice = activeDevice || devices[0] || { deviceId: scanned.deviceId || 'DEV-001' };
    const targetWorker = assignedWorker || workers[0] || { workerId: scanned.workerId || 'WRK-1002', name: scanned.workerName || 'Rajesh Kumar' };
    const scannedStripId = scanned.stripId || 'STRIP-2026-000124';

    // Auto-register strip if missing from inventory
    let strip = chemicalStrips.find(s => s.stripId.toLowerCase() === scannedStripId.toLowerCase());
    if (!strip) {
      registerChemicalStrip({
        stripId: scannedStripId,
        batchId: 'B024-H2S',
        manufacturedAt: '2026-01-10T00:00:00Z',
        expiryDate: '2027-10-01T00:00:00Z',
        calibrationProfileId: 'CP-03',
        status: 'USED'
      });
    }

    const timestamp = scanned.timestamp || new Date().toISOString();

    const newMeasurement: Measurement = {
      measurementId: `MEAS-CAM-${Date.now().toString().slice(-4)}`,
      deviceId: scanned.deviceId || targetDevice.deviceId,
      stripId: scannedStripId,
      workerId: targetWorker.workerId,
      workerName: targetWorker.name,
      timestamp,
      opticalReading: typeof scanned.opticalReading === 'number' ? scanned.opticalReading : 0.42,
      estimatedExposure: typeof scanned.exposurePpmH === 'number' ? scanned.exposurePpmH : 19.6,
      exposureUnit: 'ppm·h',
      exposureStatus: scanned.exposurePpmH >= 25 ? 'HIGH' : (scanned.exposurePpmH >= 10 ? 'MODERATE' : 'LOW'),
      calibrationProfileId: 'CP-03',
      measurementStatus: 'success',
      disclaimer: 'SIH 2026 Camera Telemetry Verification Record',
      readingMethod: 'camera_secondary',
      source: 'camera_scan',
      createdAt: timestamp,
      cameraReading: {
        analyzedColorHex: scanned.exposurePpmH >= 25 ? '#78350f' : '#d97706',
        rgbAbsorbance: scanned.opticalReading,
        estimatedExposure: scanned.exposurePpmH,
        confidenceScore: 98.4
      }
    };

    saveMeasurement(newMeasurement);
    updateWorkerExposure(targetWorker.workerId, newMeasurement.estimatedExposure, newMeasurement.exposureStatus, newMeasurement.timestamp);
    updateDeviceLastScan(targetDevice.deviceId, newMeasurement.timestamp);
    updateStripStatus(scannedStripId, 'USED', newMeasurement.timestamp);

    setScanResult({ 
      success: true, 
      measurement: newMeasurement,
      device: targetDevice,
      strip: strip || {
        stripId: scannedStripId,
        batchId: 'B024-H2S',
        manufacturedAt: '2026-01-10T00:00:00Z',
        expiryDate: '2027-10-01T00:00:00Z',
        calibrationProfileId: 'CP-03',
        status: 'USED',
        createdAt: timestamp
      }
    });
  };

  // Latest Measurement Data
  const latestMeasurement: Measurement | undefined = scanResult && scanResult.success 
    ? scanResult.measurement 
    : (assignedWorker ? measurements.find(m => m && m.workerId === assignedWorker.workerId) : undefined) || measurements[0];

  const currentExposure = typeof latestMeasurement?.estimatedExposure === 'number' ? latestMeasurement.estimatedExposure : 4.2;
  const healthAssessment = assessHealthImpact(currentExposure);

  const handleExecuteScan = async (method: 'nfc' | 'camera') => {
    if (!activeDevice || !assignedWorker) return;
    setIsScanning(true);
    setActiveScanMethod(method);
    setScanResult(null);

    const readingMethod: ReadingMethod = method === 'nfc' ? 'nfc_primary' : 'camera_secondary';
    const payload = generateSimulatedScanPayload(activeScenarioId);
    payload.deviceId = activeDevice.deviceId;

    const result = await NFCMeasurementService.processScan(
      payload,
      lookupDevice,
      lookupStrip,
      lookupWorker,
      saveMeasurement,
      updateStripStatus,
      updateDeviceLastScan,
      updateWorkerExposure,
      (stepState) => {
        setCurrentStepState(stepState);
      }
    );

    setIsScanning(false);
    setActiveScanMethod(null);

    if (result.success) {
      let cameraData = undefined;
      let crossCheckVerified = undefined;
      let crossCheckDelta = undefined;

      if (method === 'camera') {
        cameraData = processCameraColorScan('#fde68a');
        const check = performHybridCrossCheck(
          { opticalReading: result.measurement.opticalReading, estimatedExposure: result.measurement.estimatedExposure },
          cameraData
        );
        crossCheckVerified = check.crossCheckVerified;
        crossCheckDelta = check.crossCheckDelta;
      }

      const finalMeasurement: Measurement = {
        ...result.measurement,
        workerId: assignedWorker.workerId,
        workerName: assignedWorker.name,
        deviceId: activeDevice.deviceId,
        readingMethod,
        nfcReading: {
          opticalReading: result.measurement.opticalReading,
          estimatedExposure: result.measurement.estimatedExposure,
        },
        cameraReading: cameraData,
        crossCheckVerified,
        crossCheckDelta,
        source: method === 'nfc' ? 'nfc_scan' : 'camera_scan',
      };

      setScanResult({
        ...result,
        measurement: finalMeasurement,
      });
    } else {
      setScanResult(result);
    }
  };

  const handleReplaceStrip = (newStripId: string, batchId: string) => {
    registerChemicalStrip({
      stripId: newStripId,
      batchId,
      manufacturedAt: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      calibrationProfileId: 'CP-03',
      status: 'VALID',
    });
  };

  // Prepare PPM Graph Data
  const graphData = (measurements || [])
    .filter(m => m && ((assignedWorker && m.workerId === assignedWorker.workerId) || (activeDevice && m.deviceId === activeDevice.deviceId)))
    .sort((a, b) => new Date(a.timestamp || Date.now()).getTime() - new Date(b.timestamp || Date.now()).getTime())
    .map(m => ({
      time: m.timestamp ? formatIndianTime(m.timestamp) : '12:00 AM',
      exposure: typeof m.estimatedExposure === 'number' ? m.estimatedExposure : 0,
      worker: m.workerName || m.workerId || 'Worker',
      status: m.exposureStatus || 'LOW',
    }));

  if (!activeDevice || !assignedWorker) {
    return (
      <div className="p-8 text-center font-sans text-slate-600">
        Loading device telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* 3 CORE SUMMARY CARDS: DEVICE DETAILS, STRIP DETAILS, AND SCANNING CTAs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* DETAIL 1: DEVICE DETAILS CARD */}
        <div className="industrial-card p-5 border-2 border-sky-100 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm font-sans">
                    Device {activeDevice.deviceId}
                  </h2>
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600 animate-pulse" />
                    NFC powered
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsDeviceStatusModalOpen(true)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors"
                title="View Device Diagnostics"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Assigned Worker:</span>
                <strong className="text-slate-900 font-semibold">{assignedWorker.name}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Login Mail ID:</span>
                <span className="text-sky-700 font-semibold truncate max-w-[160px]">{userEmail}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Working Health:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Optimal / Ready
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100 text-[11px]">
                <span>Last Activated:</span>
                <strong className="text-slate-800">
                  {activeDevice.lastMeasurementAt ? formatIndianTime(activeDevice.lastMeasurementAt) : 'Just Now'}
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDeviceStatusModalOpen(true)}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition-colors"
          >
            Inspect Device Working Status →
          </button>
        </div>

        {/* DETAIL 2: CHEMICAL STRIP DETAILS CARD */}
        <div className="industrial-card p-5 border-2 border-amber-100 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm font-sans">
                    Strip {activeStrip ? activeStrip.stripId : 'STRIP-2026-000124'}
                  </h2>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Batch: {activeStrip ? activeStrip.batchId : 'B024-H2S'}
                  </span>
                </div>
              </div>

              <StatusPill status={activeStrip ? activeStrip.status : 'VALID'} />
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Chemistry Type:</span>
                <strong className="text-slate-800 font-semibold">AgNO₃ Colorimetric</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Calibration Profile:</span>
                <span className="text-slate-800 font-mono">CP-03 (v3.2.0)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Strip Status:</span>
                <span className="text-emerald-700 font-bold">Ready for Reading</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100 text-[11px]">
                <span>Inserted Date:</span>
                <strong className="text-slate-800">15 Jan 2026, 08:00 AM</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDeviceStatusModalOpen(true)}
            className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-amber-200"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" />
            <span>Insert / Replace Strip</span>
          </button>
        </div>

        {/* DETAIL 3: MEASUREMENT CTAs (NFC TAP & PHOTOGRAPH CAMERA SCAN) */}
        <div className="industrial-card p-5 border-2 border-sky-200 flex flex-col justify-between space-y-4 bg-gradient-to-br from-white to-sky-50/40">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Read Optical Telemetry
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Select Method</span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Receive cumulative H₂S exposure records using primary NFC reader or photograph camera scan.
            </p>

            {/* Scanning Status Indicator */}
            {isScanning && (
              <div className="mt-3 p-3 rounded-xl bg-sky-100/80 border border-sky-300 text-xs space-y-1 text-sky-900 animate-pulse">
                <div className="font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-spin text-sky-600" />
                  <span>{currentStepState?.label || "Processing Telemetry..."}</span>
                </div>
                <div className="text-[11px] text-sky-800">{currentStepState?.detail}</div>
              </div>
            )}
          </div>

          {/* TWO DEDICATED CTAs */}
          <div className="space-y-2 pt-1">
            {/* CTA 1: NFC TAP SCAN */}
            <button
              onClick={() => handleExecuteScan('nfc')}
              disabled={isScanning}
              className="w-full industrial-button-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Radio className={`w-4 h-4 ${isScanning && activeScanMethod === 'nfc' ? 'animate-bounce' : 'animate-pulse'}`} />
              <span>{isScanning && activeScanMethod === 'nfc' ? 'Tapping NFC...' : 'NFC Tap Measurement'}</span>
            </button>

            {/* CTA 2: PHOTOGRAPH CAMERA SCAN */}
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              disabled={isScanning}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Photograph Camera Scan (Scan Demo QR)</span>
            </button>

            {/* CTA 3: VIEW 2 DEMO QR CODES */}
            <button
              onClick={() => setIsDemoQRCodesModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200/90"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Display 2 Demo Scannable QR Codes</span>
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME TELEMETRY RESULT & HEALTH IMPACT CARD */}
      {latestMeasurement && (
        <div className="industrial-card p-5 border-2 border-sky-200 bg-white space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <div className="text-xs text-slate-500 font-medium">Latest Received Exposure Telemetry</div>
              <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-1.5 mt-0.5">
                <span>{(currentExposure ?? 0).toFixed(1)}</span>
                <span className="text-sm font-bold text-slate-500">ppm·h</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-slate-500 hidden sm:block">
                <div>Source: <strong className="text-slate-800 font-semibold uppercase">{latestMeasurement.source}</strong></div>
                <div>Time: {formatIndianTime(latestMeasurement.timestamp)}</div>
              </div>
              <StatusPill status={healthAssessment.status} className="text-xs px-3 py-1.5" />
            </div>
          </div>

          {/* Physiological Health Impact */}
          <div className={`p-4 rounded-xl border space-y-2 text-xs ${
            healthAssessment.alertLevel === 'critical'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : healthAssessment.alertLevel === 'moderate'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              <HeartPulse className="w-4 h-4 shrink-0" />
              <span>WORKER DAMAGE ASSESSMENT: {healthAssessment.riskTitle}</span>
            </div>

            <p className="leading-relaxed">
              <strong>Physiological Impact:</strong> {healthAssessment.physiologicalDamage}
            </p>

            <div className="font-bold pt-1 border-t border-slate-200/80">
              <strong>Recommended Action:</strong> {healthAssessment.recommendedAction}
            </div>
          </div>
        </div>
      )}

      {/* PPM CALCULATOR CUMULATIVE DOSAGE CHART */}
      <div className="industrial-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider font-sans">
                PPM Calculator Chart (Cumulative Exposure Dosage)
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Cumulative H₂S exposure (ppm·h) tracked for Unit {activeDevice.deviceId} since current strip insertion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Low (&lt;10)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Mod (10-25)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Danger (&gt;25)
            </span>
          </div>
        </div>

        {/* Recharts Area Plot */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dosageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'dataMax + 10']} />
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg font-sans text-xs space-y-1">
                        <div className="text-slate-400 font-semibold">{data.time}</div>
                        <div className="text-slate-800">
                          Worker: <strong className="text-sky-600">{data.worker}</strong>
                        </div>
                        <div className="text-slate-800">
                          Cumulative Exposure: <strong className="text-amber-600">{data.exposure} ppm·h</strong>
                        </div>
                        <div className="text-xs text-slate-500 uppercase">
                          Status: <span className="text-emerald-600 font-bold">{data.status}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <ReferenceLine y={10} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'MODERATE LIMIT (10.0)', fill: '#d97706', fontSize: 11 }} />
              <ReferenceLine y={25} stroke="#e11d48" strokeDasharray="3 3" label={{ value: 'TOXIC DANGER LIMIT (25.0)', fill: '#e11d48', fontSize: 11 }} />

              <Area 
                type="monotone" 
                dataKey="exposure" 
                stroke="#0284c7" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#dosageGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* STORED CUMULATIVE DOSAGE AUDIT TABLE */}
      <div className="industrial-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider font-sans">
              Stored Cumulative Dosage Audit Records ({measurements.length})
            </h3>
          </div>

          <button
            onClick={() => exportMeasurementsToCSV(measurements, workers)}
            className="industrial-button-primary flex items-center gap-2 py-2 px-4 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Log</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-xs font-semibold">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Assigned Personnel</th>
                <th className="py-3 px-3">Device / Strip</th>
                <th className="py-3 px-3 text-right">Absorbance</th>
                <th className="py-3 px-3 text-right">Cumulative Dosage</th>
                <th className="py-3 px-3">Damage / Health Impact</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {measurements.map((m) => {
                const impact = assessHealthImpact(m.estimatedExposure);
                const worker = lookupWorker(m.workerId);

                return (
                  <tr key={m.measurementId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 text-slate-600">
                      <div className="font-semibold">{formatIndianDate(m.timestamp)}</div>
                      <div className="text-xs text-slate-400">
                        {formatIndianTime(m.timestamp)}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {worker ? worker.name : m.workerName || 'Rajesh Kumar'}
                      <div className="text-xs text-slate-400 font-normal">{worker ? worker.email : userEmail}</div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700">
                      <div className="font-bold">{m.deviceId}</div>
                      <div className="text-xs text-slate-400">{m.stripId}</div>
                    </td>

                    <td className="py-3.5 px-3 text-right text-slate-600 font-medium">
                      {(m.opticalReading ?? 0).toFixed(3)} AU
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 text-sm">
                      {(m.estimatedExposure ?? 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">{m.exposureUnit}</span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700 max-w-[220px] truncate font-medium" title={impact.physiologicalDamage}>
                      {impact.riskTitle}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <StatusPill status={m.exposureStatus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEVICE STATUS MODAL */}
      <DeviceStatusModal
        isOpen={isDeviceStatusModalOpen}
        onClose={() => setIsDeviceStatusModalOpen(false)}
        device={activeDevice}
        worker={assignedWorker}
        activeStrip={activeStrip}
        onReplaceStrip={handleReplaceStrip}
      />

      {/* Mandatory Scientific Honesty Disclaimer */}
      <ScientificDisclaimer />

      {/* Camera Live Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleRealCameraScanSuccess}
      />

      {/* Demo QR Codes Modal */}
      <DemoQRCodesModal
        isOpen={isDemoQRCodesModalOpen}
        onClose={() => setIsDemoQRCodesModalOpen(false)}
        onSelectPresetScan={handleRealCameraScanSuccess}
      />
    </div>
  );
};

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
import { Measurement, ReadingMethod, Device } from '../types';
import { formatIndianTime, formatIndianDate } from '../utils/dateUtils';
import { CameraScannerModal, ScannedQRResult } from '../components/camera/CameraScannerModal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Radio, 
  Camera, 
  TrendingUp, 
  Download, 
  Clock, 
  Calendar,
  CalendarDays,
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  AlertCircle,
  HeartPulse,
  Stethoscope,
  Activity,
  Timer
} from 'lucide-react';

export const ReadPage: React.FC = () => {
  const { user } = useAuth();
  const { activeScenarioId, isOffline, pendingSyncQueue, clearPendingSync, addToPendingSync } = useDemo();
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
    registerChemicalStrip,
    addIncident
  } = useData();

  // Action flow modal state for Incidents
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentNotes, setIncidentNotes] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [supervisorNotified, setSupervisorNotified] = useState(false);

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

  // Active Strip ID State
  const [activeStripId, setActiveStripId] = useState<string | null>(null);

  const activeStrip = (chemicalStrips && chemicalStrips.length > 0)
    ? (chemicalStrips.find(s => activeStripId ? s.stripId === activeStripId : s.status === 'VALID') || chemicalStrips[0])
    : undefined;

  // Scan states
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanMethod, setActiveScanMethod] = useState<'nfc' | 'camera' | null>(null);
  const [currentStepState, setCurrentStepState] = useState<WorkflowStepState | null>(null);
  const [scanResult, setScanResult] = useState<ScanExecutionResult | null>(null);

  // Time preset for chart: 'today' | 'all'
  const [timePreset, setTimePreset] = useState<'today' | 'all'>('today');

  // Camera Scanner Modal State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [scanBannerMsg, setScanBannerMsg] = useState<{ text: string; type: 'device' | 'safe' | 'hazard' } | null>(null);

  // Handle Camera QR Scan
  const handleRealCameraScanSuccess = (scanned: ScannedQRResult) => {
    const targetDevice: Device = (activeDevice || devices[0]) || {
      deviceId: scanned.deviceId || 'DEV-0081',
      status: 'CONNECTED',
      firmwareVersion: 'v2.4.1',
      createdAt: new Date().toISOString(),
      powerStatus: 'NFC powered'
    };
    const targetWorker = assignedWorker || workers[0] || { workerId: scanned.workerId || 'WRK-00124', name: scanned.workerName || 'Rajesh Kumar' };

    if (scanned.targetType === 'device') {
      const timestamp = scanned.timestamp || new Date().toISOString();
      const devId = scanned.deviceId || targetDevice.deviceId;
      updateDeviceLastScan(devId, timestamp);
      setScanBannerMsg({
        text: `Device ${devId} paired and calibrated`,
        type: 'device'
      });
      return;
    }

    const scannedStripId = scanned.stripId || 'STRIP-2026-000124';
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

    setActiveStripId(scannedStripId);
    const timestamp = scanned.timestamp || new Date().toISOString();
    const isHazard = (scanned.exposurePpmH ?? 0) >= 20;

    const newMeasurement: Measurement = {
      measurementId: `MEAS-CAM-${Date.now().toString().slice(-4)}`,
      deviceId: scanned.deviceId || targetDevice.deviceId,
      stripId: scannedStripId,
      workerId: targetWorker.workerId,
      workerName: targetWorker.name,
      timestamp,
      opticalReading: typeof scanned.opticalReading === 'number' ? scanned.opticalReading : (isHazard ? 0.241 : 0.770),
      estimatedExposure: typeof scanned.exposurePpmH === 'number' ? scanned.exposurePpmH : (isHazard ? 38.6 : 4.2),
      exposureUnit: 'ppm·h',
      exposureStatus: isHazard ? 'HIGH' : (scanned.exposurePpmH >= 10 ? 'MODERATE' : 'LOW'),
      calibrationProfileId: 'CP-03',
      measurementStatus: 'success',
      disclaimer: 'SIH 2026 Camera Telemetry Verification Record',
      readingMethod: 'camera_secondary',
      source: 'camera_scan',
      createdAt: timestamp,
      cameraReading: {
        analyzedColorHex: isHazard ? '#78350f' : '#fef08a',
        rgbAbsorbance: scanned.opticalReading,
        estimatedExposure: scanned.exposurePpmH,
        confidenceScore: 98.4
      }
    };

    if (isOffline) {
      addToPendingSync(newMeasurement);
    }

    saveMeasurement(newMeasurement);
    updateWorkerExposure(targetWorker.workerId, newMeasurement.estimatedExposure, newMeasurement.exposureStatus, newMeasurement.timestamp);
    updateDeviceLastScan(targetDevice.deviceId, newMeasurement.timestamp);
    updateStripStatus(scannedStripId, 'USED', newMeasurement.timestamp);

    if (isHazard) {
      setScanBannerMsg({
        text: `High exposure detected: ${newMeasurement.estimatedExposure.toFixed(1)} ppm·h`,
        type: 'hazard'
      });
      setIsAcknowledged(false);
      setSupervisorNotified(false);
      addIncident({
        workerId: targetWorker.workerId,
        workerName: targetWorker.name,
        deviceId: targetDevice.deviceId,
        timestamp,
        exposurePpmH: newMeasurement.estimatedExposure,
        alertType: 'CRITICAL TOXIC HAZARD',
        actionTaken: 'MANDATORY MEDICAL LEAVE: Immediate Shift Removal',
        supervisorNotified: true,
        acknowledgedByWorker: false,
        notes: `Simulated scan of high-exposure coupon ${scannedStripId}. Alert dispatched.`,
        status: 'OPEN'
      });
    } else {
      setScanBannerMsg({
        text: `Scan recorded: ${newMeasurement.estimatedExposure.toFixed(1)} ppm·h (Safe baseline)`,
        type: 'safe'
      });
    }

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

  // Worker Live Vitals & Past Medical Baseline State
  const [userMedicalCondition, setUserMedicalCondition] = useState<string>('Asthma / Respiratory Hypersensitivity');
  const [userHeartRate, setUserHeartRate] = useState<number>(78);

  const currentExposure = typeof latestMeasurement?.estimatedExposure === 'number' ? latestMeasurement.estimatedExposure : 4.2;
  const healthAssessment = assessHealthImpact(currentExposure, userHeartRate, userMedicalCondition);

  // Scan execution via NFC
  const handleExecuteScan = async (method: 'nfc' | 'camera') => {
    if (!activeDevice || !assignedWorker) return;
    setIsScanning(true);
    setActiveScanMethod(method);
    setScanResult(null);

    const readingMethod: ReadingMethod = method === 'nfc' ? 'nfc_primary' : 'camera_secondary';
    const payload = generateSimulatedScanPayload(activeScenarioId);
    payload.deviceId = activeDevice.deviceId;

    if (activeStrip && ['LOW', 'MODERATE', 'HIGH'].includes(activeScenarioId)) {
      payload.stripId = activeStrip.stripId;
      const stripMeas = (measurements || []).filter(m => m && m.stripId === activeStrip.stripId);
      if (stripMeas.length > 0) {
        const lastTimestamp = new Date(stripMeas[stripMeas.length - 1].timestamp).getTime();
        if (Date.now() - lastTimestamp < 300000) {
          payload.timestamp = new Date(lastTimestamp + 3600000).toISOString();
        }
      }
    }

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

      if (isOffline) {
        addToPendingSync(finalMeasurement);
      }

      setScanResult({
        ...result,
        measurement: finalMeasurement,
      });

      setScanBannerMsg({
        text: `Reading: ${finalMeasurement.estimatedExposure.toFixed(1)} ppm·h recorded`,
        type: finalMeasurement.exposureStatus === 'HIGH' ? 'hazard' : 'safe'
      });
    } else {
      setScanResult(result);
    }
  };

  const handleLogIncidentSubmit = () => {
    if (!assignedWorker || !activeDevice) return;
    addIncident({
      workerId: assignedWorker.workerId,
      workerName: assignedWorker.name,
      deviceId: activeDevice.deviceId,
      timestamp: new Date().toISOString(),
      exposurePpmH: currentExposure,
      alertType: healthAssessment.riskTitle,
      actionTaken: healthAssessment.mandatoryRestPeriod,
      supervisorNotified: true,
      acknowledgedByWorker: true,
      notes: incidentNotes || 'Logged by field operator during shift exposure alert.',
      status: 'OPEN'
    });
    setIsIncidentModalOpen(false);
    setIsAcknowledged(true);
    setSupervisorNotified(true);
  };

  // Filter measurements for chart & records
  const allStripMeasurements = (measurements || [])
    .filter(m => m && activeStrip && m.stripId === activeStrip.stripId)
    .sort((a, b) => new Date(a.timestamp || Date.now()).getTime() - new Date(b.timestamp || Date.now()).getTime());

  const now = new Date();
  const todayDateStr = formatIndianDate(now);
  const todayFullDayName = now.toLocaleDateString('en-IN', { weekday: 'long' });

  const displayedMeasurements = timePreset === 'today'
    ? allStripMeasurements.filter(m => m.timestamp && formatIndianDate(m.timestamp) === todayDateStr)
    : allStripMeasurements;

  // Compute date range string for All Time mode
  const firstDate = allStripMeasurements.length > 0 && allStripMeasurements[0].timestamp
    ? formatIndianDate(allStripMeasurements[0].timestamp)
    : todayDateStr;
  const lastDate = allStripMeasurements.length > 0 && allStripMeasurements[allStripMeasurements.length - 1].timestamp
    ? formatIndianDate(allStripMeasurements[allStripMeasurements.length - 1].timestamp)
    : todayDateStr;
  const allTimeRangeStr = firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`;

  // Helper to format both day and time cleanly for reading items
  const formatDayAndTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Just now';
    const itemDateStr = formatIndianDate(d);
    const timeStr = formatIndianTime(d);
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
    
    if (todayDateStr === itemDateStr) {
      return `Today, ${timeStr}`;
    }
    return `${dayName}, ${itemDateStr} • ${timeStr}`;
  };

  // Chart data with Day and Time
  const graphData = (displayedMeasurements.length > 0 ? displayedMeasurements : allStripMeasurements).map(m => {
    const d = m.timestamp ? new Date(m.timestamp) : new Date();
    const timeStr = formatIndianTime(d);
    const dayStr = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dateStr = formatIndianDate(d);
    const fullDayStr = d.toLocaleDateString('en-IN', { weekday: 'long' });

    // In All Time mode, prepend Day of week so points on different days are instantly distinguishable
    const chartLabel = timePreset === 'all' ? `${dayStr} ${timeStr}` : timeStr;

    return {
      time: chartLabel,
      shortTime: timeStr,
      day: dayStr,
      date: dateStr,
      exposure: typeof m.estimatedExposure === 'number' ? m.estimatedExposure : 0,
      fullDate: `${fullDayStr}, ${dateStr} • ${timeStr}`,
      method: m.source === 'camera_scan' ? 'Camera' : 'NFC',
      status: m.exposureStatus || 'LOW'
    };
  });

  // Shift exposure percentage (20 ppm·h shift safe limit threshold)
  const SHIFT_LIMIT = 20.0;
  const exposurePct = Math.min(100, Math.round((currentExposure / SHIFT_LIMIT) * 100));

  if (!activeDevice || !assignedWorker) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans text-sm">
        Initializing optical dosimeter...
      </div>
    );
  }

  return (
    <div className="space-y-3.5 font-sans animate-in fade-in pb-2">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Dosimeter Reading</h1>
          <p className="text-[11px] text-slate-500">
            {assignedWorker.name} • Unit {activeDevice.deviceId}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {isOffline ? (
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Offline ({pendingSyncQueue.length})
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Connected
            </span>
          )}
        </div>
      </div>

      {/* Real-time Notification Banner */}
      {scanBannerMsg && (
        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
          scanBannerMsg.type === 'hazard' 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            {scanBannerMsg.type === 'hazard' ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold text-[11px]">{scanBannerMsg.text}</span>
          </div>
          <button 
            onClick={() => setScanBannerMsg(null)} 
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline sync reminder */}
      {isOffline && pendingSyncQueue.length > 0 && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-[11px] text-amber-900">
          <span>{pendingSyncQueue.length} readings stored locally</span>
          <button
            onClick={() => clearPendingSync()}
            className="px-2 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded hover:bg-amber-700"
          >
            Sync Now
          </button>
        </div>
      )}

      {/* HERO: Current Exposure Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Shift Exposure
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentExposure.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">ppm·h</span>
            </div>
          </div>
          <StatusPill status={healthAssessment.status} />
        </div>

        {/* Progress against 20 ppm·h limit */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Shift limit: 20 ppm·h</span>
            <span className="font-semibold text-slate-700">{exposurePct}% of safe limit</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                exposurePct >= 80 ? 'bg-rose-500' : exposurePct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${exposurePct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Last read: {latestMeasurement ? formatIndianTime(latestMeasurement.timestamp) : 'Just now'}
          </span>
          <span>Strip: {activeStrip?.stripId || 'STRIP-2026-000124'}</span>
        </div>
      </div>

      {/* SCAN CONTROLS: Clean 2-Action Grid */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {/* Primary Action: NFC Tap */}
          <button
            onClick={() => handleExecuteScan('nfc')}
            disabled={isScanning}
            className="py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-60"
          >
            <Radio className={`w-5 h-5 ${isScanning && activeScanMethod === 'nfc' ? 'animate-spin' : ''}`} />
            <span>{isScanning && activeScanMethod === 'nfc' ? 'Reading NFC...' : 'NFC Tap'}</span>
          </button>

          {/* Secondary Action: Camera QR Scan */}
          <button
            onClick={() => setIsCameraScannerOpen(true)}
            disabled={isScanning}
            className="py-3 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-[0.98] border border-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-60"
          >
            <Camera className="w-5 h-5 text-slate-600" />
            <span>Camera Scan</span>
          </button>
        </div>

        {/* Scan in progress step status */}
        {isScanning && (
          <div className="p-2 bg-sky-50 rounded-xl text-center space-y-0.5 animate-in fade-in">
            <div className="text-xs font-bold text-sky-800">
              {currentStepState?.label || "Communicating with sensor..."}
            </div>
            <div className="text-[10px] text-slate-500">
              {currentStepState?.detail || "Hold dosimeter close to NFC antenna"}
            </div>
          </div>
        )}
      </div>

      {/* HEALTH IMPACT & ESTIMATED REST TIME ANALYZER */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>Health Impact & Rest Analyzer</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            healthAssessment.alertLevel === 'critical' ? 'bg-rose-100 text-rose-800' :
            healthAssessment.alertLevel === 'moderate' ? 'bg-amber-100 text-amber-800' :
            'bg-emerald-100 text-emerald-800'
          }`}>
            {healthAssessment.overallRiskCategory}
          </span>
        </div>

        {/* ESTIMATED REST TIME CALLOUT */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          healthAssessment.isMedicalLeaveRequired 
            ? 'bg-rose-50 border-rose-200 text-rose-950' 
            : healthAssessment.alertLevel === 'moderate' 
            ? 'bg-amber-50 border-amber-200 text-amber-950' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              healthAssessment.isMedicalLeaveRequired ? 'bg-rose-200 text-rose-800' :
              healthAssessment.alertLevel === 'moderate' ? 'bg-amber-200 text-amber-800' :
              'bg-emerald-200 text-emerald-800'
            }`}>
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Estimated Rest Required
              </div>
              <div className="font-extrabold text-xs">
                {healthAssessment.mandatoryRestPeriod}
              </div>
            </div>
          </div>
        </div>

        {/* PERSONAL MEDICAL DATA FACTORS */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              Medical Baseline:
            </span>
            <select
              value={userMedicalCondition}
              onChange={(e) => setUserMedicalCondition(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 max-w-[180px]"
            >
              <option value="Asthma / Respiratory Hypersensitivity">Asthma / Respiratory</option>
              <option value="Pre-existing Cardiac Condition">Cardiac Condition</option>
              <option value="Chronic Bronchitis">Chronic Bronchitis</option>
              <option value="Healthy Baseline (No Conditions)">Healthy Baseline</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              Heart Rate / Exertion:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setUserHeartRate(78)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  userHeartRate <= 85 ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500'
                }`}
              >
                78 BPM (Resting)
              </button>
              <button
                type="button"
                onClick={() => setUserHeartRate(105)}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  userHeartRate > 85 ? 'bg-white text-rose-700 shadow-2xs font-extrabold' : 'text-slate-500'
                }`}
              >
                105 BPM (Exertion)
              </button>
            </div>
          </div>

          {/* PHYSIOLOGICAL DAMAGE & RECOVERY NOTE */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px]">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Personalized Damage Assessment:</span>
              <span className="text-[10px] font-mono text-slate-500">{healthAssessment.medicalConditionFactor.split(':')[0]}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {healthAssessment.physiologicalDamage}
            </p>
            <div className="text-[10px] text-sky-700 font-medium pt-0.5">
              💡 {healthAssessment.heartRateFactor}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Hazard Alert Action (Only when elevated) */}
      {(healthAssessment.isMedicalLeaveRequired || currentExposure >= 15) && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-rose-950 font-bold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{healthAssessment.riskTitle}</span>
            </span>
            <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-medium">Alert</span>
          </div>
          <p className="text-[11px] text-rose-800 leading-snug">
            {healthAssessment.recommendedAction}
          </p>
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={() => setIsAcknowledged(true)}
              className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                isAcknowledged ? 'bg-emerald-600 text-white' : 'bg-white border border-rose-300 text-rose-900 hover:bg-rose-100'
              }`}
            >
              {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
            </button>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
            >
              {supervisorNotified ? 'Incident Logged' : 'Log Incident'}
            </button>
          </div>
        </div>
      )}

      {/* Exposure Trend Chart */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Exposure Trend</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <CalendarDays className="w-3 h-3 text-sky-600 shrink-0" />
              <span>
                {timePreset === 'today'
                  ? `${todayFullDayName}, ${todayDateStr} • Today's Shift`
                  : `${allTimeRangeStr} • Multi-Day History`}
              </span>
            </div>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
            <button
              onClick={() => setTimePreset('today')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                timePreset === 'today' ? 'bg-white text-sky-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Today's shift readings"
            >
              <Clock className="w-3 h-3 text-sky-600" />
              <span>Today</span>
            </button>
            <button
              onClick={() => setTimePreset('all')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                timePreset === 'all' ? 'bg-white text-sky-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="All-time historical readings"
            >
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>All Time</span>
            </button>
          </div>
        </div>

        {/* Minimal Area Chart */}
        <div className="h-40 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="cleanSkyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" stroke="#cbd5e1" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis stroke="#cbd5e1" tick={{ fontSize: 9, fill: '#64748b' }} domain={[0, 'dataMax + 5']} />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-[10px] shadow-lg space-y-0.5">
                        <div className="font-extrabold text-xs text-sky-300">{d.exposure} ppm·h</div>
                        <div className="text-slate-300 text-[9px] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-sky-400" />
                          <span>{d.fullDate}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="exposure" 
                stroke="#0284c7" 
                strokeWidth={2}
                dot={{ r: 3, fill: '#0284c7' }}
                fillOpacity={1} 
                fill="url(#cleanSkyGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Readings List */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="font-bold text-xs text-slate-900">Recent Readings</span>
          <button
            onClick={() => exportMeasurementsToCSV(allStripMeasurements, workers)}
            className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {displayedMeasurements.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              No readings recorded yet
            </div>
          ) : (
            displayedMeasurements.slice(-3).reverse().map((m) => (
              <div 
                key={m.measurementId} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-all text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    {m.source === 'camera_scan' ? <Camera className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      {(m.estimatedExposure ?? 0).toFixed(1)} <span className="text-[10px] font-normal text-slate-500">ppm·h</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span>{formatDayAndTime(m.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <StatusPill status={m.exposureStatus} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Incident Log Modal */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Log Safety Incident</span>
              </h3>
              <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-xl space-y-0.5 text-slate-700">
                <div>Worker: <strong>{assignedWorker?.name}</strong></div>
                <div>Recorded: <strong>{currentExposure.toFixed(1)} ppm·h</strong></div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Notes / Symptoms:</label>
                <textarea
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Location or symptoms noted..."
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 h-18"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogIncidentSubmit}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Submit Incident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Live Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleRealCameraScanSuccess}
      />
    </div>
  );
};

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
import { Measurement, ReadingMethod, Device } from '../types';
import { formatIndianTime, formatIndianDate, formatIndianDateTime } from '../utils/dateUtils';
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
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  Radio, 
  Camera, 
  TrendingUp, 
  Download, 
  Activity,
  HeartPulse,
  Clock,
  Calendar,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Cpu,
  ShieldAlert
} from 'lucide-react';

const DAY_COLOR_PALETTE: Record<number, { bg: string; fill: string; stroke: string; text: string; badge: string; dotFill: string }> = {
  0: { bg: 'bg-sky-50/80', fill: '#e0f2fe', stroke: '#7dd3fc', text: 'text-sky-800', badge: 'bg-sky-100 text-sky-800 border-sky-300', dotFill: '#0284c7' },
  1: { bg: 'bg-emerald-50/80', fill: '#d1fae5', stroke: '#6ee7b7', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dotFill: '#059669' },
  2: { bg: 'bg-amber-50/80', fill: '#fef3c7', stroke: '#fcd34d', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800 border-amber-300', dotFill: '#d97706' },
  3: { bg: 'bg-purple-50/80', fill: '#f3e8ff', stroke: '#c084fc', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-800 border-purple-300', dotFill: '#7c3aed' },
  4: { bg: 'bg-rose-50/80', fill: '#ffe4e6', stroke: '#fecdd3', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-800 border-rose-300', dotFill: '#e11d48' },
};

export const ReadPage: React.FC = () => {
  const { user } = useAuth();
  const { activeScenarioId } = useDemo();
  const { isOffline, isDevMode, pendingSyncQueue, clearPendingSync, addToPendingSync } = useDemo();
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

  // Action flow modal state for Mandatory Shift Removal
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

  // Preset Mode: 'today' | 'from_start'
  const [presetMode, setPresetMode] = useState<'today' | 'from_start'>('from_start');

  // Zoomed Specific Date (when user clicks a day or zooms into a specific date)
  const [zoomedDate, setZoomedDate] = useState<string | null>(null);

  // Explicit Show Date in Chart Toggle
  const [showDateOnXAxis, setShowDateOnXAxis] = useState<boolean>(true);

  // Camera Scanner & Demo QR Modals State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [isDemoQRCodesModalOpen, setIsDemoQRCodesModalOpen] = useState<boolean>(false);
  const [scanBannerMsg, setScanBannerMsg] = useState<{ text: string; type: 'device' | 'safe' | 'hazard' } | null>(null);

  // Worker Live Vitals & Past Medical History State
  const [userHeartRate, setUserHeartRate] = useState<number>(78);
  const [userMedicalCondition, setUserMedicalCondition] = useState<string>('Asthma / Respiratory Hypersensitivity');

  // Handle Real Camera QR Code Scan Result (Camera scanner or photo upload)
  const handleRealCameraScanSuccess = (scanned: ScannedQRResult) => {
    const targetDevice: Device = (activeDevice || devices[0]) || {
      deviceId: scanned.deviceId || 'DEV-0081',
      status: 'ONLINE',
      firmwareVersion: 'v2.4.1',
      createdAt: new Date().toISOString(),
      powerStatus: 'AC_CONNECTED'
    };
    const targetWorker = assignedWorker || workers[0] || { workerId: scanned.workerId || 'WRK-00124', name: scanned.workerName || 'Rajesh Kumar' };

    // SCENARIO 1: DEVICE QR SCANNED
    if (scanned.targetType === 'device') {
      const timestamp = scanned.timestamp || new Date().toISOString();
      const devId = scanned.deviceId || targetDevice.deviceId;
      updateDeviceLastScan(devId, timestamp);
      setScanBannerMsg({
        text: `Optical Reader Unit ${devId} Paired Successfully! Optical sensor calibrated & ready.`,
        type: 'device'
      });
      return;
    }

    // SCENARIO 2: CHEMICAL STRIP QR SCANNED
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
    const isHazard = (scanned.exposurePpmH ?? 0) >= 25;

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

    // Live visual reaction feedback and incident triggering
    if (isHazard) {
      setScanBannerMsg({
        text: `Strip ${scannedStripId} Scanned: ${newMeasurement.estimatedExposure} ppm·h (HIGH) — MANDATORY MEDICAL SHIFT REMOVAL ACTIVE!`,
        type: 'hazard'
      });
      setIsAcknowledged(false);
      setSupervisorNotified(false);
      // Auto-dispatch open incident to Supervisor Dashboard
      addIncident({
        workerId: targetWorker.workerId,
        workerName: targetWorker.name,
        deviceId: targetDevice.deviceId,
        timestamp,
        exposurePpmH: newMeasurement.estimatedExposure,
        alertType: 'CRITICAL TOXIC HAZARD',
        actionTaken: 'MANDATORY MEDICAL LEAVE: Immediate 24-Hour Shift Removal',
        supervisorNotified: true,
        acknowledgedByWorker: false,
        notes: `Simulated scan of high-exposure toxic coupon ${scannedStripId}. Real-time plant alert dispatched.`,
        status: 'OPEN'
      });
    } else {
      setScanBannerMsg({
        text: `Strip ${scannedStripId} Scanned: ${newMeasurement.estimatedExposure} ppm·h (LOW) — Safe nominal baseline recorded.`,
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

  const currentExposure = typeof latestMeasurement?.estimatedExposure === 'number' ? latestMeasurement.estimatedExposure : 4.2;
  const healthAssessment = assessHealthImpact(currentExposure, userHeartRate, userMedicalCondition);

  const isAsthmaCondition = userMedicalCondition.toLowerCase().includes('asthma') || userMedicalCondition.toLowerCase().includes('respiratory');

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
      notes: incidentNotes || 'Logged by field operator during mandatory shift removal warning.',
      status: 'OPEN'
    });
    setIsIncidentModalOpen(false);
    setIsAcknowledged(true);
    setSupervisorNotified(true);
  };

  // ONE GRAPH PER STRIP: Filter measurements strictly for active strip
  const allStripMeasurements = (measurements || [])
    .filter(m => m && activeStrip && m.stripId === activeStrip.stripId)
    .sort((a, b) => new Date(a.timestamp || Date.now()).getTime() - new Date(b.timestamp || Date.now()).getTime());

  // Extract all available unique dates
  const availableDates = Array.from(new Set(
    allStripMeasurements.map(m => m.timestamp ? formatIndianDate(m.timestamp) : '')
  )).filter(Boolean);

  const todayDateStr = availableDates.length > 0 ? availableDates[availableDates.length - 1] : '';

  // Determine active dataset based on Presets and Zoom State
  let currentStripMeasurements = [...allStripMeasurements];

  if (zoomedDate) {
    // Zoomed into specific day -> view hourly breakdown for that day
    currentStripMeasurements = currentStripMeasurements.filter(m => {
      if (!m.timestamp) return false;
      const dStr = formatIndianDate(m.timestamp);
      return dStr === zoomedDate;
    });
  } else if (presetMode === 'today' && todayDateStr) {
    // Today preset -> view today's measurements only
    currentStripMeasurements = currentStripMeasurements.filter(m => {
      if (!m.timestamp) return false;
      const dStr = formatIndianDate(m.timestamp);
      return dStr === todayDateStr;
    });
  }

  // Build Date Color Index Map for mild pastel day differentiation
  const dateColorMap = new Map<string, number>();
  availableDates.forEach((d, idx) => {
    dateColorMap.set(d, idx % 5);
  });

  // Format Graph Data: Ensure unique X-axis time/date labels without duplicates
  const timeSeenMap = new Map<string, number>();

  let graphData = currentStripMeasurements.map(m => {
    const dateObj = m.timestamp ? new Date(m.timestamp) : new Date();
    const timeOnly = formatIndianTime(dateObj);
    const timeWithSec = formatIndianTime(dateObj, true);
    const dateShort = formatIndianDate(dateObj);
    const fullDateStr = formatIndianDateTime(dateObj);

    const colorIdx = dateColorMap.get(dateShort) ?? 0;
    const dayColor = DAY_COLOR_PALETTE[colorIdx];

    let label = '';
    if (zoomedDate || presetMode === 'today') {
      label = timeOnly;
    } else if (showDateOnXAxis) {
      label = `${dateShort} ${timeOnly}`;
    } else {
      const count = (timeSeenMap.get(timeOnly) || 0) + 1;
      timeSeenMap.set(timeOnly, count);
      label = count > 1 ? timeWithSec : timeOnly;
    }

    return {
      time: label,
      exposure: typeof m.estimatedExposure === 'number' ? m.estimatedExposure : 0,
      worker: m.workerName || m.workerId || 'Worker',
      status: m.exposureStatus || 'LOW',
      method: m.source === 'camera_scan' || m.readingMethod === 'camera_secondary' ? 'Camera Scan' : 'NFC Primary',
      fullDate: fullDateStr,
      dateOnly: dateShort,
      dayColor,
    };
  });

  // Calculate Reference Area Bands for Mild Pastel Day Differentiation
  const dayBands: { date: string; startLabel: string; endLabel: string; color: typeof DAY_COLOR_PALETTE[0] }[] = [];
  if (!zoomedDate && graphData.length > 0) {
    let currentBandDate = '';
    let bandStartLabel = '';
    let bandEndLabel = '';
    let bandColor = DAY_COLOR_PALETTE[0];

    graphData.forEach((item, idx) => {
      if (item.dateOnly !== currentBandDate) {
        if (currentBandDate) {
          dayBands.push({
            date: currentBandDate,
            startLabel: bandStartLabel,
            endLabel: bandEndLabel,
            color: bandColor,
          });
        }
        currentBandDate = item.dateOnly;
        bandStartLabel = item.time;
        bandEndLabel = item.time;
        bandColor = item.dayColor;
      } else {
        bandEndLabel = item.time;
      }

      if (idx === graphData.length - 1 && currentBandDate) {
        dayBands.push({
          date: currentBandDate,
          startLabel: bandStartLabel,
          endLabel: bandEndLabel,
          color: bandColor,
        });
      }
    });
  }

  if (!activeDevice || !assignedWorker) {
    return (
      <div className="p-8 text-center font-sans text-slate-500">
        Loading optical scanner...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans animate-in fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Read Optical Telemetry</h1>
          <p className="text-xs text-slate-500 font-sans">NFC Tap & Camera Photo Scanner</p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* OFFLINE PENDING SYNC STATUS BADGE */}
          {isOffline ? (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Offline ({pendingSyncQueue.length} pending)</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live Network
            </span>
          )}
          <span className="text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
            Unit: {activeDevice.deviceId}
          </span>
        </div>
      </div>

      {/* REAL-TIME LIVE QR SCAN FEEDBACK BANNER */}
      {scanBannerMsg && (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-sans shadow-sm animate-in fade-in ${
          scanBannerMsg.type === 'hazard' 
            ? 'bg-rose-100 border-2 border-rose-400 text-rose-950' 
            : scanBannerMsg.type === 'device' 
            ? 'bg-sky-50 border border-sky-300 text-sky-950' 
            : 'bg-emerald-50 border border-emerald-300 text-emerald-950'
        }`}>
          <div className="flex items-center gap-2">
            {scanBannerMsg.type === 'hazard' ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
            ) : scanBannerMsg.type === 'device' ? (
              <Cpu className="w-5 h-5 text-sky-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span className="font-bold leading-tight">{scanBannerMsg.text}</span>
          </div>
          <button 
            onClick={() => setScanBannerMsg(null)} 
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* OFFLINE PENDING SYNC QUEUE NOTIFICATION BANNER */}
      {isOffline && pendingSyncQueue.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>{pendingSyncQueue.length} readings</strong> stored locally offline. Will auto-sync on network reconnect.</span>
          </div>
          <button
            onClick={() => clearPendingSync()}
            className="px-2 py-1 bg-amber-600 text-white font-bold text-[10px] rounded hover:bg-amber-700"
          >
            Force Sync
          </button>
        </div>
      )}

      {/* SCANNING ACTION CTAs CARD */}
      <div className="industrial-card p-4 space-y-4 border-2 border-sky-200 bg-white">
        <div className="text-center space-y-1">
          <div className="text-xs text-slate-500">Target Personnel: <strong className="text-slate-900">{assignedWorker.name}</strong></div>
          <div className="text-[11px] text-slate-400">Assigned Email: {userEmail}</div>
        </div>

        {/* Animated Scanner Ring */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
            isScanning 
              ? 'border-sky-500 shadow-lg shadow-sky-500/20 animate-pulse' 
              : 'border-slate-200'
          }`}>
            <div className={`absolute inset-2 rounded-full border-2 border-dashed ${isScanning ? 'border-sky-400 animate-spin' : 'border-slate-200'}`} />
            <div className="absolute inset-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              {activeScanMethod === 'camera' ? (
                <Camera className={`w-10 h-10 ${isScanning ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
              ) : (
                <Radio className={`w-10 h-10 ${isScanning ? 'text-sky-600 animate-bounce' : 'text-slate-400'}`} />
              )}
            </div>
          </div>

          {isScanning && (
            <div className="mt-3 text-center space-y-0.5">
              <div className="text-xs font-bold text-sky-700">{currentStepState?.label || "Processing Telemetry..."}</div>
              <div className="text-[11px] text-slate-500">{currentStepState?.detail}</div>
            </div>
          )}
        </div>

        {/* DEDICATED CTAs */}
        <div className="space-y-2 pt-1">
          {/* CTA 1: NFC TAP MEASUREMENT */}
          <button
            onClick={() => handleExecuteScan('nfc')}
            disabled={isScanning}
            className="w-full industrial-button-primary py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <Radio className={`w-4 h-4 ${isScanning && activeScanMethod === 'nfc' ? 'animate-bounce' : 'animate-pulse'}`} />
            <span>{isScanning && activeScanMethod === 'nfc' ? 'Tapping NFC Device...' : 'NFC Tap Measurement'}</span>
          </button>

          {/* CTA 2: PHOTOGRAPH CAMERA SCAN */}
          <button
            onClick={() => setIsCameraScannerOpen(true)}
            disabled={isScanning}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Camera className="w-4 h-4 text-white" />
            <span>Photograph Camera Scan (Scan Strip or Device QR)</span>
          </button>
        </div>
      </div>

      {/* LATEST RESULT & REGULATORY REFERENCE ANCHORS CARD */}
      {latestMeasurement && (
        <div className="industrial-card p-4 bg-white space-y-3 border-2 border-sky-100 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <span>Cumulative Dosage Result</span>
                <span className="text-[10px] text-sky-700 font-normal underline">(Shift-Cumulative 8h Dose)</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 flex items-baseline gap-1">
                <span>{(currentExposure ?? 0).toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-500">ppm·h</span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <StatusPill status={healthAssessment.status} />
              <div className="text-[9px] text-slate-400 font-mono">Shift TWA: ~{(currentExposure / 8).toFixed(2)} ppm</div>
            </div>
          </div>

          {/* REGULATORY EXPOSURE LIMIT REFERENCE ANCHORS */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[10px] font-sans">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[9px] flex items-center justify-between">
              <span>Regulatory Gas Exposure Limit Reference Anchors</span>
              <span className="text-sky-700 font-mono">OSHA / NIOSH Standards</span>
            </div>

            <div className="grid grid-cols-3 gap-1 text-center font-semibold">
              <div className={`p-1.5 rounded-lg border ${currentExposure >= 10 ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="font-bold">OSHA PEL</div>
                <div className="text-[9px]">10 ppm (8h TWA)</div>
              </div>

              <div className={`p-1.5 rounded-lg border ${currentExposure >= 15 ? 'bg-amber-200 border-amber-400 text-amber-950 font-bold' : 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="font-bold">OSHA STEL</div>
                <div className="text-[9px]">15 ppm (15-min)</div>
              </div>

              <div className={`p-1.5 rounded-lg border ${currentExposure >= 25 ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold' : 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="font-bold">NIOSH IDLH</div>
                <div className="text-[9px]">100 ppm Ceiling</div>
              </div>
            </div>
          </div>

          {/* WORKER TELEMETRY VITALS & ASTHMA RISK MULTIPLIER EXPLANATION */}
          <div className="p-2.5 bg-sky-50/70 rounded-xl border border-sky-200 space-y-2 text-xs font-sans">
            <div className="text-[10px] text-sky-900 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Worker Risk Profile & Asthma Safety Factor</span>
              <span className="text-sky-700 font-mono">ID: {assignedWorker?.workerId || 'WRK-00124'}</span>
            </div>

            {/* Past Medical Condition Selector */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Medical Baseline:
              </span>
              <select
                value={userMedicalCondition}
                onChange={(e) => setUserMedicalCondition(e.target.value)}
                className="bg-white border border-slate-200 text-[10px] font-bold text-slate-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-sky-500 max-w-[170px]"
              >
                <option value="Asthma / Respiratory Hypersensitivity">Asthma / Respiratory</option>
                <option value="Pre-existing Cardiac Condition">Cardiac Condition</option>
                <option value="Chronic Bronchitis">Chronic Bronchitis</option>
                <option value="Healthy Baseline (No Conditions)">Healthy Baseline</option>
              </select>
            </div>

            {/* ASTHMA ADJUSTMENT CALCULATION EXPLANATION BANNER */}
            <div className="p-2 bg-white rounded-lg border border-sky-200 text-[10px] text-slate-700 space-y-0.5">
              <div className="font-bold text-sky-900 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-sky-600" />
                <span>Risk Model Safety Factor: {isAsthmaCondition ? '0.8x Applied' : '1.0x Baseline'}</span>
              </div>
              <p className="text-slate-500 leading-tight">
                {isAsthmaCondition 
                  ? 'Worker profile has logged Asthma. Personal shift exposure limit is reduced by 20% (16.0 ppm·h vs Standard 20.0 ppm·h) to prevent bronchial hyper-reactivity.' 
                  : 'Nominal physiological tolerance model applied for healthy baseline operator.'}
              </p>
            </div>
          </div>

          {/* EXPLICIT ACTION FLOW FOR MANDATORY MEDICAL SHIFT REMOVAL */}
          {healthAssessment.isMedicalLeaveRequired || healthAssessment.alertLevel === 'critical' || healthAssessment.alertLevel === 'moderate' ? (
            <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2.5 text-xs font-sans">
              <div className="flex items-center justify-between text-rose-950 font-extrabold">
                <span className="flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>{healthAssessment.riskTitle}</span>
                </span>
                <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-mono">ACTION REQUIRED</span>
              </div>

              <p className="text-[11px] text-rose-900 leading-tight">
                {healthAssessment.recommendedAction}
              </p>

              {/* THREE EXPLICIT ACTION BUTTONS */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {/* 1. ACKNOWLEDGE BUTTON */}
                <button
                  onClick={() => setIsAcknowledged(true)}
                  className={`py-2 px-2 rounded-lg font-bold text-[10px] border flex items-center justify-center gap-1 transition-all ${
                    isAcknowledged ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-rose-900 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                </button>

                {/* 2. NOTIFY SUPERVISOR BUTTON */}
                <button
                  onClick={() => setSupervisorNotified(true)}
                  className={`py-2 px-2 rounded-lg font-bold text-[10px] border flex items-center justify-center gap-1 transition-all ${
                    supervisorNotified ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-rose-900 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <Activity className="w-3 h-3 text-sky-600" />
                  <span>{supervisorNotified ? 'Supervisor Sent' : 'Notify Supervisor'}</span>
                </button>

                {/* 3. LOG INCIDENT BUTTON */}
                <button
                  onClick={() => setIsIncidentModalOpen(true)}
                  className="py-2 px-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all shadow-2xs"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Log Incident</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* INCIDENT LOGGING MODAL */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 font-sans shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Log Safety Incident Record</span>
              </h3>
              <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div>Worker: <strong>{assignedWorker?.name}</strong></div>
                <div>Exposure: <strong>{currentExposure.toFixed(1)} ppm·h</strong></div>
                <div>Action: <strong>{healthAssessment.mandatoryRestPeriod}</strong></div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Incident Details & Symptoms:</label>
                <textarea
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Describe location, symptoms (eye irritation, headache, nausea), or leak source..."
                  className="w-full mt-1 p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 h-20"
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
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm"
              >
                Submit Incident Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONE GRAPH PER STRIP (WITH TODAY, FROM START PRESETS & MILD PASTEL DAY COLORS) */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-sky-600" />
            <span>PPM Calculator Chart</span>
          </div>

          {/* Only 2 Needed Presets: Today (Today's shift) vs From Start (Full strip lifetime) */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-sans">
            <button
              onClick={() => { setPresetMode('today'); setZoomedDate(null); }}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                presetMode === 'today' && !zoomedDate ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => { setPresetMode('from_start'); setZoomedDate(null); }}
              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                presetMode === 'from_start' && !zoomedDate ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              From Start
            </button>
          </div>
        </div>

        {/* ACTIVE ZOOM OR DATE SELECTION NOTIFICATION BANNER */}
        {zoomedDate ? (
          <div className="p-2 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs font-sans animate-in fade-in">
            <div className="flex items-center gap-1.5 text-sky-900 font-bold">
              <ZoomIn className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Zoomed into: <strong className="text-sky-900 underline">{zoomedDate}</strong> (Hourly View)</span>
            </div>
            <button
              onClick={() => setZoomedDate(null)}
              className="px-2 py-1 rounded-md bg-white border border-sky-300 text-sky-800 text-[10px] font-bold hover:bg-sky-100 flex items-center gap-1 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Zoom</span>
            </button>
          </div>
        ) : (
          /* MILD PASTEL DAY COLOR LEGEND BAR (TAP ANY DAY TO ZOOM INTO HOURLY BREAKDOWN) */
          <div className="space-y-1.5 pt-0.5">
            <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Day Colors (Tap day to zoom into hourly view):</span>
              <button
                onClick={() => setShowDateOnXAxis(prev => !prev)}
                className="text-sky-700 font-bold hover:underline"
              >
                {showDateOnXAxis ? 'Hide X-Date' : 'Show X-Date'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px] font-sans">
              {availableDates.map((d, idx) => {
                const color = DAY_COLOR_PALETTE[idx % 5];
                return (
                  <button
                    key={d}
                    onClick={() => setZoomedDate(d)}
                    className={`px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 transition-all hover:scale-105 shadow-2xs ${color.badge}`}
                    title={`Zoom into ${d} hourly breakdown`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.dotFill }} />
                    <span>{d}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recharts Area Plot with Mild Pastel Day Bands and Explicit Data Point Dots */}
        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="mobileGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 'dataMax + 10']} />
              
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-md text-[11px] space-y-1 font-sans">
                        <div className="text-slate-400 font-semibold">{data.fullDate || data.time}</div>
                        <div className="text-slate-900 font-extrabold text-xs">{data.exposure} ppm·h</div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-sky-700 text-[10px] font-bold bg-sky-50 px-1.5 py-0.5 rounded">{data.method}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            data.status === 'HIGH' ? 'bg-rose-100 text-rose-800' : data.status === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>{data.status}</span>
                        </div>
                        <div className="text-[10px] text-sky-600 pt-1 border-t border-slate-100 italic">
                          💡 Tap point to zoom into {data.dateOnly} hourly view
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Render Mild Pastel Reference Area Background Bands per Day */}
              {dayBands.map((band) => (
                <ReferenceArea
                  key={band.date}
                  x1={band.startLabel}
                  x2={band.endLabel}
                  fill={band.color.fill}
                  fillOpacity={0.45}
                  stroke={band.color.stroke}
                  strokeDasharray="2 2"
                />
              ))}
              
              <ReferenceLine y={10} stroke="#d97706" strokeDasharray="3 3" />
              <ReferenceLine y={25} stroke="#e11d48" strokeDasharray="3 3" />

              <Area 
                type="monotone" 
                dataKey="exposure" 
                stroke="#0284c7" 
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#0369a1', stroke: '#ffffff', strokeWidth: 2 }}
                fillOpacity={1} 
                fill="url(#mobileGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>Active Strip: <strong className="text-slate-800 font-mono">{activeStrip ? activeStrip.stripId : 'STRIP-2026-000124'}</strong></span>
          <span className="text-sky-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-600" />
            {zoomedDate ? `Zoomed: ${zoomedDate}` : presetMode === 'today' ? 'Today (Hourly View)' : 'From Start (Strip Lifetime)'}
          </span>
        </div>
      </div>

      {/* PROPER STORED AUDIT RECORDS TABLE / LIST */}
      <div className="industrial-card p-4 space-y-3 bg-white border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Stored Audit Records ({currentStripMeasurements.length})</span>
          </div>

          <button
            onClick={() => exportMeasurementsToCSV(currentStripMeasurements, workers)}
            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Export CSV Log"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>

        {/* Clean Structured Stored Audit List with max height scroll container */}
        <div className="space-y-2.5 text-xs font-sans max-h-80 overflow-y-auto pr-1">
          {currentStripMeasurements.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs italic">
              No audit records stored yet for this strip.
            </div>
          ) : (
            currentStripMeasurements.slice().reverse().map((m) => {
              const impact = assessHealthImpact(m.estimatedExposure);
              const isCamera = m.source === 'camera_scan' || m.readingMethod === 'camera_secondary';

              return (
                <div key={m.measurementId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:bg-slate-100/80 transition-colors shadow-2xs">
                  {/* Top Row: Exposure, Scan Source, and Status Pill */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-extrabold text-slate-900 text-base">
                        {(m.estimatedExposure ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{m.exposureUnit || 'ppm·h'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                        isCamera ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {isCamera ? <Camera className="w-3 h-3 text-amber-600" /> : <Radio className="w-3 h-3 text-sky-600" />}
                        {isCamera ? 'Camera Scan' : 'NFC Primary'}
                      </span>
                      <StatusPill status={m.exposureStatus} />
                    </div>
                  </div>

                  {/* Middle Row: Date, Absorbance, Strip ID */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-b border-slate-200/60 py-1.5">
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <Clock className="w-3 h-3 text-sky-600 shrink-0" />
                      <span>{formatIndianDateTime(m.timestamp)}</span>
                    </div>

                    <div className="text-right">
                      Absorbance: <strong className="text-slate-800 font-mono">{(m.opticalReading ?? 0).toFixed(3)} AU</strong>
                    </div>
                  </div>

                  {/* Bottom Row: Health Damage Assessment */}
                  <div className="text-[11px] text-slate-700 font-semibold truncate flex items-center justify-between">
                    <span>{impact.riskTitle}</span>
                    <span className="text-slate-400 text-[10px] font-mono">{m.stripId}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ScientificDisclaimer compact />

      {/* Camera Live Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleRealCameraScanSuccess}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { useData } from '../../context/DataContext';
import { generateSimulatedScanPayload } from '../../services/simulationService';
import { NFCMeasurementService, WorkflowStepState, ScanExecutionResult } from '../../services/nfcMeasurementService';
import { processCameraColorScan, performHybridCrossCheck, CAMERA_COLOR_PRESETS } from '../../services/cameraScanService';
import { MeasurementResultCard } from './MeasurementResultCard';
import { StripVisualizer } from './StripVisualizer';
import { StatusPill } from '../common/StatusPill';
import { ReadingMethod, Measurement, CameraReadingData } from '../../types';
import { 
  Radio, 
  Camera, 
  Layers, 
  RotateCcw, 
  Zap, 
  AlertCircle, 
  CheckCheck,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const NFCScannerWidget: React.FC = () => {
  const { activeScenarioId, hardwareConnectionStatus } = useDemo();
  const { 
    lookupDevice, 
    lookupStrip, 
    lookupWorker, 
    saveMeasurement, 
    updateStripStatus, 
    updateDeviceLastScan, 
    updateWorkerExposure 
  } = useData();

  // Scan Mode Selection
  const [readingMethod, setReadingMethod] = useState<ReadingMethod>('hybrid_dual');
  const [selectedCameraHex, setSelectedCameraHex] = useState<string>('#fde68a');

  const [isScanning, setIsScanning] = useState(false);
  const [currentStepState, setCurrentStepState] = useState<WorkflowStepState | null>(null);
  const [scanResult, setScanResult] = useState<ScanExecutionResult | null>(null);

  const selectedScenarioPayload = generateSimulatedScanPayload(activeScenarioId);
  const targetDevice = lookupDevice(selectedScenarioPayload.deviceId);
  const targetStrip = lookupStrip(selectedScenarioPayload.stripId);

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    const payload = generateSimulatedScanPayload(activeScenarioId);

    // 1. Process NFC Reading (Primary)
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

    if (result.success) {
      // 2. Process Camera Reading if Secondary or Hybrid mode selected
      let cameraData: CameraReadingData | undefined = undefined;
      let crossCheckVerified: boolean | undefined = undefined;
      let crossCheckDelta: number | undefined = undefined;

      if (readingMethod === 'camera_secondary' || readingMethod === 'hybrid_dual') {
        cameraData = processCameraColorScan(selectedCameraHex);

        const check = performHybridCrossCheck(
          { opticalReading: result.measurement.opticalReading, estimatedExposure: result.measurement.estimatedExposure },
          cameraData
        );
        crossCheckVerified = check.crossCheckVerified;
        crossCheckDelta = check.crossCheckDelta;
      }

      // Update measurement with hybrid data
      const finalMeasurement: Measurement = {
        ...result.measurement,
        readingMethod,
        nfcReading: {
          opticalReading: result.measurement.opticalReading,
          estimatedExposure: result.measurement.estimatedExposure,
        },
        cameraReading: cameraData,
        crossCheckVerified,
        crossCheckDelta,
        source: readingMethod === 'nfc_primary' ? 'nfc_scan' : readingMethod === 'camera_secondary' ? 'camera_scan' : 'hybrid',
      };

      setScanResult({
        ...result,
        measurement: finalMeasurement,
      });
    } else {
      setScanResult(result);
    }
  };

  const handleReset = () => {
    setIsScanning(false);
    setCurrentStepState(null);
    setScanResult(null);
  };

  // Render completed result card
  if (scanResult && scanResult.success) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <MeasurementResultCard
          measurement={scanResult.measurement}
          device={scanResult.device}
          strip={scanResult.strip}
          worker={scanResult.worker}
          onResetScan={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* PHYSICAL WORKFLOW STEPPER BAR */}
      <div className="industrial-card p-4">
        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
          Dosimeter Physical Operating Workflow
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono text-[11px]">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
            <span className="font-bold text-sky-600 block">1. Insert Strip</span>
            <span className="text-[10px] text-slate-500">Disposable coupon</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
            <span className="font-bold text-sky-600 block">2. Wear & Exposure</span>
            <span className="text-[10px] text-slate-500">H₂S color change</span>
          </div>
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-300 text-sky-900 font-bold shadow-2xs">
            <span className="block">3. Primary NFC</span>
            <span className="text-[10px] text-sky-700">Optical reader tap</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold">
            <span className="block">4. Camera Check</span>
            <span className="text-[10px] text-amber-700">Color photo backup</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 col-span-2 sm:col-span-1">
            <span className="font-bold text-emerald-600 block">5. Replace Strip</span>
            <span className="text-[10px] text-slate-500">Reusable device</span>
          </div>
        </div>
      </div>

      {/* READING METHOD TOGGLE (NFC PRIMARY vs CAMERA SECONDARY vs HYBRID DUAL) */}
      <div className="industrial-card p-4 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
          Select Measurement Method
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          {/* Option 1: Dual Hybrid */}
          <button
            type="button"
            onClick={() => setReadingMethod('hybrid_dual')}
            className={`p-3.5 rounded-xl border text-left transition-all space-y-1 ${
              readingMethod === 'hybrid_dual'
                ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-2xs font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-sky-700">
                <Layers className="w-4 h-4 text-sky-600" />
                Hybrid Dual Scan
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-sky-200/60 text-sky-800 rounded">RECOMMENDED</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Primary NFC optical scan + Camera colorimetry cross-check verification.
            </p>
          </button>

          {/* Option 2: Primary NFC */}
          <button
            type="button"
            onClick={() => setReadingMethod('nfc_primary')}
            className={`p-3.5 rounded-xl border text-left transition-all space-y-1 ${
              readingMethod === 'nfc_primary'
                ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-2xs font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Radio className="w-4 h-4 text-sky-600" />
                NFC Optical Only
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">PRIMARY</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Controlled photodiode quantitative measurement powered by NFC RF field.
            </p>
          </button>

          {/* Option 3: Camera Secondary */}
          <button
            type="button"
            onClick={() => setReadingMethod('camera_secondary')}
            className={`p-3.5 rounded-xl border text-left transition-all space-y-1 ${
              readingMethod === 'camera_secondary'
                ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-amber-800">
                <Camera className="w-4 h-4 text-amber-600" />
                Camera Photo Scan
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">BACKUP</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Photograph strip color gradient through reader window when NFC unavailable.
            </p>
          </button>
        </div>

        {/* Camera Color Preset Selector if Camera or Hybrid selected */}
        {(readingMethod === 'camera_secondary' || readingMethod === 'hybrid_dual') && (
          <div className="pt-2 border-t border-slate-100 space-y-2 font-mono text-xs">
            <span className="text-slate-600 text-[11px]">Camera Color Calibration Sample:</span>
            <div className="flex flex-wrap gap-2">
              {CAMERA_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setSelectedCameraHex(preset.hex)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                    selectedCameraHex === preset.hex
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-slate-400" style={{ backgroundColor: preset.hex }} />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Central Measurement Scanner Card */}
      <div className="industrial-card p-6 md:p-8 relative overflow-hidden text-center space-y-6">
        {/* Top Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 font-semibold uppercase tracking-wider">
              {readingMethod === 'nfc_primary' ? 'NFC Antenna Active' : readingMethod === 'camera_secondary' ? 'Camera Colorimetry Mode' : 'Hybrid Dual Scan Active'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Link: <strong className="text-sky-600">{hardwareConnectionStatus}</strong></span>
            <span>Power: <strong className="text-amber-600">NFC Harvested</strong></span>
          </div>
        </div>

        {/* Center Ring Animation */}
        <div className="py-6 flex flex-col items-center justify-center relative">
          <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
            isScanning 
              ? 'border-sky-500 shadow-lg shadow-sky-500/20 animate-pulse' 
              : 'border-slate-200 hover:border-sky-400/50 shadow-sm'
          }`}>
            <div className={`absolute inset-2 rounded-full border-2 border-dashed ${isScanning ? 'border-sky-400/60 animate-spin' : 'border-slate-200'}`} />
            <div className="absolute inset-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              {readingMethod === 'camera_secondary' ? (
                <Camera className={`w-16 h-16 transition-colors duration-300 ${isScanning ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
              ) : (
                <Radio className={`w-16 h-16 transition-colors duration-300 ${isScanning ? 'text-sky-600 animate-bounce' : 'text-slate-400'}`} />
              )}
            </div>

            {isScanning && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-sky-400/20 to-transparent animate-spin" />
            )}
          </div>

          {/* Status Text */}
          <div className="mt-6 space-y-1">
            <h2 className="text-xl font-mono font-bold text-slate-900">
              {isScanning 
                ? (currentStepState?.label || "Processing Telemetry...") 
                : readingMethod === 'camera_secondary' ? "Ready for Camera Strip Photograph" : "Ready to Measure H₂S Exposure"}
            </h2>
            <p className="text-xs font-mono text-slate-500 max-w-md mx-auto">
              {isScanning 
                ? (currentStepState?.detail || "Capturing measurements...")
                : readingMethod === 'camera_secondary'
                ? "Align smartphone camera with dosimeter opening to analyze strip color density."
                : "Hold battery-free NFC reader device against smartphone antenna."}
            </p>
          </div>

          {/* Progress Bar */}
          {isScanning && currentStepState && (
            <div className="w-full max-w-md mt-6 space-y-2">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Step {currentStepState.step} of {currentStepState.totalSteps}</span>
                <span className="text-sky-600 font-bold">{Math.round((currentStepState.step / 7) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${(currentStepState.step / 7) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {scanResult && scanResult.success === false && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono text-left space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Measurement Rejected ({scanResult.errorCode})</span>
            </div>
            <p>{scanResult.errorMessage}</p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleReset}
                className="industrial-button-secondary flex items-center gap-1.5 py-1 text-xs text-rose-700 border-rose-300 hover:bg-rose-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Dismiss & Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* Device & Strip Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-left font-mono text-xs">
          {/* Device Status */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Device Unit</div>
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>{selectedScenarioPayload.deviceId}</span>
              <StatusPill status={targetDevice ? targetDevice.status : 'UNREGISTERED'} />
            </div>
            <div className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>Power: NFC powered</span>
            </div>
          </div>

          {/* Strip Status */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Chemical Strip</div>
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span className="truncate max-w-[120px]">{selectedScenarioPayload.stripId}</span>
              <StatusPill status={targetStrip ? targetStrip.status : 'INVALID'} />
            </div>
            <div className="text-[10px] text-slate-500">
              Batch: {targetStrip?.batchId || 'N/A'}
            </div>
          </div>

          {/* Mode */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Scan Mode</div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>{readingMethod.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Preset: {activeScenarioId}
            </div>
          </div>
        </div>

        {/* Primary Scan Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="industrial-button-primary w-full sm:w-auto px-8 py-3 text-base flex items-center justify-center gap-2 shadow-md shadow-sky-600/20"
          >
            {readingMethod === 'camera_secondary' ? (
              <Camera className="w-5 h-5" />
            ) : (
              <Radio className="w-5 h-5 animate-pulse" />
            )}
            <span>
              {isScanning 
                ? 'Processing Measurement...' 
                : readingMethod === 'camera_secondary' ? 'Execute Camera Color Scan' : 'Simulate NFC Tap & Scan'}
            </span>
          </button>
        </div>
      </div>

      {/* Chemical Strip Coupon Preview */}
      <StripVisualizer 
        strip={targetStrip} 
        opticalReading={selectedScenarioPayload.opticalReading}
      />
    </div>
  );
};

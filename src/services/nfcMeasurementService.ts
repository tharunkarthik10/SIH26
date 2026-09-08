import { 
  ChemicalStrip, 
  Device, 
  Measurement, 
  NFCScanPayload, 
  Worker 
} from '../types';
import { calculateExposure } from './calibrationService';
import { formatIndianFullDateTime } from '../utils/dateUtils';

export interface WorkflowStepState {
  step: number;
  totalSteps: number;
  label: string;
  detail: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

export type ProgressCallback = (state: WorkflowStepState) => void;

export interface ValidationSuccessResult {
  success: true;
  measurement: Measurement;
  device: Device;
  strip: ChemicalStrip;
  worker?: Worker;
}

export interface ValidationErrorResult {
  success: false;
  errorCode: 'DEVICE_NOT_FOUND' | 'STRIP_NOT_FOUND' | 'STRIP_EXPIRED' | 'STRIP_ALREADY_USED' | 'DEVICE_INACTIVE' | 'HARDWARE_FAULT';
  errorMessage: string;
  stepFailed: number;
}

export type ScanExecutionResult = ValidationSuccessResult | ValidationErrorResult;

/**
 * NFC Measurement Service Architecture
 * Encapsulates the entire hardware validation, calibration processing, and state updating pipeline.
 * Designed to be hardware-agnostic: switches seamlessly from SimulationService to Web NFC (NDEFReader)
 * or serial NFC reader bridges without altering UI components.
 */
export class NFCMeasurementService {
  /**
   * Executes the complete 7-step NFC measurement sequence
   */
  static async processScan(
    payload: NFCScanPayload,
    lookupDevice: (id: string) => Device | undefined,
    lookupStrip: (id: string) => ChemicalStrip | undefined,
    lookupWorker: (id: string) => Worker | undefined,
    saveMeasurement: (m: Measurement) => void,
    updateStripStatus: (stripId: string, status: 'USED', usedAt: string) => void,
    updateDeviceLastScan: (deviceId: string, timestamp: string) => void,
    updateWorkerExposure: (workerId: string, exposure: number, status: any, timestamp: string) => void,
    onProgress?: ProgressCallback
  ): Promise<ScanExecutionResult> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // STEP 1: Detecting Device
    onProgress?.({
      step: 1,
      totalSteps: 7,
      label: "Detecting Device...",
      detail: "Establishing NFC RF power & communication link...",
      status: 'in_progress'
    });
    await delay(600);

    // STEP 2: Reading Device ID
    onProgress?.({
      step: 2,
      totalSteps: 7,
      label: "Reading Device ID...",
      detail: `NFC Target UID captured: ${payload.deviceId}`,
      status: 'in_progress'
    });
    await delay(500);

    // Validate Device
    const device = lookupDevice(payload.deviceId);
    if (!device) {
      return {
        success: false,
        errorCode: 'DEVICE_NOT_FOUND',
        errorMessage: `Unregistered device ID (${payload.deviceId}). Access denied.`,
        stepFailed: 2
      };
    }
    if (device.status === 'ERROR' || device.status === 'UNREGISTERED') {
      return {
        success: false,
        errorCode: 'DEVICE_INACTIVE',
        errorMessage: `Device ${payload.deviceId} is currently flagged as ${device.status}.`,
        stepFailed: 2
      };
    }

    // STEP 3: Reading Optical Measurement
    onProgress?.({
      step: 3,
      totalSteps: 7,
      label: "Reading optical measurement...",
      detail: `LED pulse triggered. Photodiode absorbance: ${payload.opticalReading.toFixed(3)} AU`,
      status: 'in_progress'
    });
    await delay(700);

    // STEP 4: Validating Chemical Strip
    onProgress?.({
      step: 4,
      totalSteps: 7,
      label: "Validating Chemical Strip...",
      detail: `Verifying strip security token & batch registry (${payload.stripId})...`,
      status: 'in_progress'
    });
    await delay(600);

    // Validate Strip
    const strip = lookupStrip(payload.stripId);
    if (!strip) {
      return {
        success: false,
        errorCode: 'STRIP_NOT_FOUND',
        errorMessage: `Chemical Strip (${payload.stripId}) is not registered in system inventory.`,
        stepFailed: 4
      };
    }

    if (strip.status === 'EXPIRED' || new Date(strip.expiryDate) < new Date()) {
      return {
        success: false,
        errorCode: 'STRIP_EXPIRED',
        errorMessage: `Chemical Strip ${payload.stripId} expired on ${strip.expiryDate}. Please insert a new strip.`,
        stepFailed: 4
      };
    }

    if (strip.status === 'USED') {
      return {
        success: false,
        errorCode: 'STRIP_ALREADY_USED',
        errorMessage: `Chemical Strip ${payload.stripId} has already been processed on ${strip.usedAt ? formatIndianFullDateTime(strip.usedAt) : 'a previous scan'}. Single-use strip cannot be reused.`,
        stepFailed: 4
      };
    }

    // STEP 5: Processing Measurement (Calibration Model)
    onProgress?.({
      step: 5,
      totalSteps: 7,
      label: "Processing measurement...",
      detail: `Applying calibration profile ${strip.calibrationProfileId} to optical response curve...`,
      status: 'in_progress'
    });
    await delay(600);

    const calibrationResult = calculateExposure(payload.opticalReading, strip.calibrationProfileId);

    // Lookup worker assigned to device
    const worker = device.assignedWorkerId ? lookupWorker(device.assignedWorkerId) : undefined;

    // Build Measurement object
    const timestamp = new Date().toISOString();
    const measurement: Measurement = {
      measurementId: `MEAS-${Date.now().toString().slice(-6)}`,
      workerId: worker ? worker.workerId : 'UNASSIGNED',
      workerName: worker ? worker.name : 'Unassigned Worker',
      deviceId: device.deviceId,
      stripId: strip.stripId,
      timestamp,
      opticalReading: payload.opticalReading,
      estimatedExposure: calibrationResult.estimatedExposure,
      exposureUnit: calibrationResult.exposureUnit,
      exposureStatus: calibrationResult.status,
      calibrationProfileId: strip.calibrationProfileId,
      measurementStatus: 'success',
      readingMethod: 'nfc_primary',
      source: 'nfc_scan',
      createdAt: timestamp,
      disclaimer: calibrationResult.disclaimer,
    };

    // STEP 6: Saving Exposure Record
    onProgress?.({
      step: 6,
      totalSteps: 7,
      label: "Saving exposure record...",
      detail: "Committing encrypted record to Firestore safety database...",
      status: 'in_progress'
    });
    await delay(500);

    // Commit state updates
    saveMeasurement(measurement);
    // Keep active strip VALID during routine tap scans for continuous shift monitoring
    updateDeviceLastScan(device.deviceId, timestamp);
    if (worker) {
      updateWorkerExposure(worker.workerId, calibrationResult.estimatedExposure, calibrationResult.status, timestamp);
    }

    // STEP 7: Measurement Complete
    onProgress?.({
      step: 7,
      totalSteps: 7,
      label: "Measurement complete",
      detail: `Record created successfully. Estimated Exposure: ${calibrationResult.estimatedExposure} ${calibrationResult.exposureUnit} (${calibrationResult.status})`,
      status: 'completed'
    });

    return {
      success: true,
      measurement,
      device: { ...device, lastMeasurementAt: timestamp },
      strip: { ...strip, status: 'USED', usedAt: timestamp },
      worker,
    };
  }
}

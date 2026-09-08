export type Role = 'Admin' | 'Supervisor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  photoURL?: string;
}

export type WorkerStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Worker {
  workerId: string;
  name: string;
  email: string; // Login email assigned by Supervisor
  employeeCode: string;
  department: string;
  assignedDeviceId?: string;
  status: WorkerStatus;
  createdAt: string;
  latestExposure?: {
    estimatedExposure: number;
    exposureStatus: ExposureStatus;
    timestamp: string;
  };
}

export type DeviceStatus = 'CONNECTED' | 'REGISTERED' | 'UNREGISTERED' | 'ERROR' | 'MAINTENANCE';

export interface StripReplacementRecord {
  recordId: string;
  stripId: string;
  batchId: string;
  insertedAt: string;
  removedAt?: string;
  status: StripStatus;
  replacedByEmail: string;
  totalObservedExposure?: number; // in ppm·h
  opticalAbsorbance?: number; // in AU
  usageDurationText?: string; // e.g. "45 days, 0 hours"
}

export interface Device {
  deviceId: string;
  status: DeviceStatus;
  assignedWorkerId?: string;
  assignedWorkerEmail?: string; // Email ID assigned by supervisor
  firmwareVersion: string;
  lastMeasurementAt?: string;
  createdAt: string;
  powerStatus: 'NFC powered'; // Battery-free design requirement
  stripHistory?: StripReplacementRecord[];
}

export type StripStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'USED' | 'INVALID';

export interface ChemicalStrip {
  stripId: string;
  batchId: string;
  manufacturedAt: string;
  expiryDate: string;
  calibrationProfileId: string;
  status: StripStatus;
  usedAt?: string;
  createdAt: string;
}

export type ExposureStatus = 'LOW' | 'MODERATE' | 'HIGH';

export type ReadingMethod = 'nfc_primary' | 'camera_secondary' | 'hybrid_dual';

export interface NFCReadingData {
  opticalReading: number; // photodiode absorbance (0.0 to 1.0)
  estimatedExposure: number; // in ppm·h
}

export interface CameraReadingData {
  analyzedColorHex: string; // RGB hex captured from strip photo
  rgbAbsorbance: number; // optical color density calculated from RGB
  estimatedExposure: number; // in ppm·h
  confidenceScore: number; // percentage (e.g. 96.5%)
}

export interface Measurement {
  measurementId: string;
  workerId: string;
  workerName?: string;
  deviceId: string;
  stripId: string;
  timestamp: string;
  opticalReading: number; // primary photodiode or optical absorbance
  estimatedExposure: number; // final cumulative exposure in ppm·h (based primarily on NFC)
  exposureUnit: string; // "ppm·h"
  exposureStatus: ExposureStatus;
  calibrationProfileId: string;
  measurementStatus: 'success' | 'failed' | 'validation_error';
  readingMethod: ReadingMethod;
  nfcReading?: NFCReadingData;
  cameraReading?: CameraReadingData;
  crossCheckVerified?: boolean;
  crossCheckDelta?: number;
  source: 'nfc_scan' | 'camera_scan' | 'hybrid';
  createdAt: string;
  disclaimer: string;
}

export interface CalibrationProfile {
  calibrationProfileId: string;
  version: string;
  description: string;
  modelType: 'demo_curve' | 'linear_regression' | 'polynomial_deg2';
  status: 'ACTIVE' | 'ARCHIVED' | 'EXPERIMENTAL';
  createdAt: string;
  slope?: number;
  intercept?: number;
  rSquared?: number;
}

export interface NFCScanPayload {
  deviceId: string;
  stripId: string;
  opticalReading: number;
  timestamp: string;
  measurementStatus: 'success' | 'hardware_error';
}

export type SimulationScenarioId = 
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'EXPIRED_STRIP'
  | 'INVALID_STRIP'
  | 'INVALID_DEVICE'
  | 'USED_STRIP';

export interface SimulationScenario {
  id: SimulationScenarioId;
  label: string;
  description: string;
  payload: NFCScanPayload;
  expectedResult: 'SUCCESS' | 'EXPIRED' | 'INVALID' | 'USED' | 'DEVICE_ERROR';
}

export interface ActivityLogItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'measurement' | 'strip' | 'device' | 'worker';
  severity?: 'info' | 'warning' | 'danger' | 'success';
}

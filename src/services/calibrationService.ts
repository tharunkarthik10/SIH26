import { ExposureStatus } from '../types';

export interface CalibrationResult {
  estimatedExposure: number; // ppm·h cumulative exposure
  exposureUnit: string; // 'ppm·h'
  status: ExposureStatus;
  disclaimer: string;
  calibrationProfileId: string;
  calculatedAt: string;
}

export const SCIENTIFIC_HONESTY_DISCLAIMER = 
  "Demo value — calibration model pending experimental validation.";

/**
 * Industrial Calibration Model Abstraction
 * Converts photodiode optical response (absorbance/reflectance ratio 0.0 - 1.0)
 * to estimated cumulative H₂S exposure in ppm·h.
 * 
 * NOTE: For MVP demo purposes, this uses a prototype calibration curve (CP-03).
 * Will be replaced by experimentally derived Beer-Lambert or ML regression models.
 */
export const calculateExposure = (
  opticalReading: number,
  calibrationProfileId: string = 'CP-03'
): CalibrationResult => {
  // Clamp optical reading between 0.0 and 1.0
  const normalizedReading = Math.max(0, Math.min(1, opticalReading));
  
  let estimatedExposurePpmH = 0;

  // Demo mathematical mapping: Lower optical reading = Higher darkening/colorimetric change = Higher exposure
  // Formula prototype (CP-03): Exposure = (1.0 - opticalReading)^1.5 * 65.0
  if (calibrationProfileId === 'CP-01') {
    // Basic linear demo profile
    estimatedExposurePpmH = (1.0 - normalizedReading) * 50.0;
  } else if (calibrationProfileId === 'CP-02') {
    // Polynomial deg2 demo profile
    const delta = 1.0 - normalizedReading;
    estimatedExposurePpmH = (delta * 40.0) + (delta * delta * 25.0);
  } else {
    // Default CP-03 (Standard SIH Demo Curve)
    const delta = 1.0 - normalizedReading;
    estimatedExposurePpmH = Math.pow(delta, 1.35) * 58.4;
  }

  // Round to 1 decimal place
  const finalExposure = Math.round(estimatedExposurePpmH * 10) / 10;

  // Determine exposure status thresholds (OSHA/NIOSH H₂S cumulative dose guidelines)
  // LOW: < 10.0 ppm·h
  // MODERATE: 10.0 - 25.0 ppm·h
  // HIGH: > 25.0 ppm·h
  let status: ExposureStatus = 'LOW';
  if (finalExposure >= 25.0) {
    status = 'HIGH';
  } else if (finalExposure >= 10.0) {
    status = 'MODERATE';
  } else {
    status = 'LOW';
  }

  return {
    estimatedExposure: finalExposure,
    exposureUnit: 'ppm·h',
    status,
    disclaimer: SCIENTIFIC_HONESTY_DISCLAIMER,
    calibrationProfileId,
    calculatedAt: new Date().toISOString(),
  };
};

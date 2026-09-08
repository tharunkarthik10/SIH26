import { NFCScanPayload, SimulationScenario, SimulationScenarioId } from '../types';

export const SIMULATION_SCENARIOS: Record<SimulationScenarioId, SimulationScenario> = {
  LOW: {
    id: 'LOW',
    label: 'Low H₂S Exposure',
    description: 'Simulates normal baseline worker exposure (Optical response ~0.84, ~4.2 ppm·h).',
    expectedResult: 'SUCCESS',
    payload: {
      deviceId: 'DEV-0081',
      stripId: 'STRIP-2026-000124',
      opticalReading: 0.842,
      timestamp: new Date().toISOString(),
      measurementStatus: 'success',
    },
  },
  MODERATE: {
    id: 'MODERATE',
    label: 'Moderate H₂S Exposure',
    description: 'Simulates elevated exposure requiring supervisor alert (Optical response ~0.55, ~16.8 ppm·h).',
    expectedResult: 'SUCCESS',
    payload: {
      deviceId: 'DEV-0081',
      stripId: 'STRIP-2026-000125',
      opticalReading: 0.554,
      timestamp: new Date().toISOString(),
      measurementStatus: 'success',
    },
  },
  HIGH: {
    id: 'HIGH',
    label: 'High Exposure Warning (DANGER)',
    description: 'Simulates hazardous exposure level requiring immediate evacuation (Optical response ~0.24, ~41.5 ppm·h).',
    expectedResult: 'SUCCESS',
    payload: {
      deviceId: 'DEV-0081',
      stripId: 'STRIP-2026-000126',
      opticalReading: 0.241,
      timestamp: new Date().toISOString(),
      measurementStatus: 'success',
    },
  },
  EXPIRED_STRIP: {
    id: 'EXPIRED_STRIP',
    label: 'Expired Chemical Strip',
    description: 'Simulates scanning a chemical strip that has passed its shelf expiry date.',
    expectedResult: 'EXPIRED',
    payload: {
      deviceId: 'DEV-0081',
      stripId: 'STRIP-2024-EXP999',
      opticalReading: 0.780,
      timestamp: new Date().toISOString(),
      measurementStatus: 'success',
    },
  },
  USED_STRIP: {
    id: 'USED_STRIP',
    label: 'Already Used Strip',
    description: 'Simulates scanning a disposable strip that was already processed previously.',
    expectedResult: 'USED',
    payload: {
      deviceId: 'DEV-0081',
      stripId: 'STRIP-2026-USED001',
      opticalReading: 0.620,
      timestamp: new Date().toISOString(),
      measurementStatus: 'success',
    },
  },
  INVALID_STRIP: {
    id: 'INVALID_STRIP',
    label: 'Unregistered / Counterfeit Strip',
    description: 'Simulates scanning an unrecognized chemical strip ID not found in database.',
    expectedResult: 'INVALID',
    payload: {
      deviceId: 'DEV-0081',
      stripId: 'STRIP-UNKNOWN-0000',
      opticalReading: 0.710,
      timestamp: new Date().toISOString(),
      measurementStatus: 'success',
    },
  },
  INVALID_DEVICE: {
    id: 'INVALID_DEVICE',
    label: 'Unregistered NFC Reader Device',
    description: 'Simulates receiving NFC scan from an unauthorized or unprovisioned hardware device.',
    expectedResult: 'DEVICE_ERROR',
    payload: {
      deviceId: 'DEV-UNKNOWN-9999',
      stripId: 'STRIP-2026-000124',
      opticalReading: 0.810,
      timestamp: new Date().toISOString(),
      measurementStatus: 'success',
    },
  },
};

/**
 * Generates simulated NFC scan payload based on selected scenario
 */
export const generateSimulatedScanPayload = (
  scenarioId: SimulationScenarioId = 'LOW'
): NFCScanPayload => {
  const scenario = SIMULATION_SCENARIOS[scenarioId] || SIMULATION_SCENARIOS.LOW;
  return {
    ...scenario.payload,
    timestamp: new Date().toISOString(),
  };
};

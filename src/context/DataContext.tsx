import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Worker, 
  Device, 
  ChemicalStrip, 
  Measurement, 
  CalibrationProfile, 
  ActivityLogItem, 
  ExposureStatus,
  StripStatus
} from '../types';
import { 
  INITIAL_WORKERS, 
  INITIAL_DEVICES, 
  INITIAL_CHEMICAL_STRIPS, 
  INITIAL_CALIBRATION_PROFILES, 
  INITIAL_MEASUREMENTS, 
  INITIAL_ACTIVITY_LOGS 
} from '../services/dataService';

interface DataContextType {
  workers: Worker[];
  devices: Device[];
  chemicalStrips: ChemicalStrip[];
  measurements: Measurement[];
  calibrationProfiles: CalibrationProfile[];
  activityLogs: ActivityLogItem[];
  saveMeasurement: (measurement: Measurement) => void;
  registerChemicalStrip: (strip: Omit<ChemicalStrip, 'createdAt' | 'status'> & { status?: StripStatus }) => void;
  registerDevice: (device: Omit<Device, 'createdAt' | 'powerStatus'>) => void;
  registerWorker: (worker: Omit<Worker, 'createdAt'>) => void;
  updateStripStatus: (stripId: string, status: StripStatus, usedAt?: string) => void;
  updateDeviceLastScan: (deviceId: string, timestamp: string) => void;
  updateWorkerExposure: (workerId: string, exposure: number, status: ExposureStatus, timestamp: string) => void;
  lookupDevice: (deviceId: string) => Device | undefined;
  lookupStrip: (stripId: string) => ChemicalStrip | undefined;
  lookupWorker: (workerId: string) => Worker | undefined;
  replaceActiveStrip: (deviceId: string, newStripId: string, batchId: string, replacedByEmail: string) => void;
  resetToDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'SIH_H2S_DOSIMETER_DATA_V5';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_WORKERS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.workerId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Fallback to INITIAL_WORKERS', e);
    }
    return INITIAL_WORKERS;
  });

  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_DEVICES');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.deviceId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Fallback to INITIAL_DEVICES', e);
    }
    return INITIAL_DEVICES;
  });

  const [chemicalStrips, setChemicalStrips] = useState<ChemicalStrip[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_STRIPS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.stripId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Fallback to INITIAL_CHEMICAL_STRIPS', e);
    }
    return INITIAL_CHEMICAL_STRIPS;
  });

  const [measurements, setMeasurements] = useState<Measurement[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_MEASUREMENTS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.measurementId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Fallback to INITIAL_MEASUREMENTS', e);
    }
    return INITIAL_MEASUREMENTS;
  });

  const [calibrationProfiles] = useState<CalibrationProfile[]>(INITIAL_CALIBRATION_PROFILES);

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_LOGS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Fallback to INITIAL_ACTIVITY_LOGS', e);
    }
    return INITIAL_ACTIVITY_LOGS;
  });


  // Sync to local storage for persistence across refreshes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_WORKERS', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_DEVICES', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_STRIPS', JSON.stringify(chemicalStrips));
  }, [chemicalStrips]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_MEASUREMENTS', JSON.stringify(measurements));
  }, [measurements]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_LOGS', JSON.stringify(activityLogs));
  }, [activityLogs]);

  const lookupDevice = (deviceId: string) => devices.find(d => d.deviceId.toLowerCase() === (deviceId || '').toLowerCase());
  const lookupStrip = (stripId: string) => chemicalStrips.find(s => s.stripId.toLowerCase() === (stripId || '').toLowerCase());
  const lookupWorker = (workerId: string) => workers.find(w => w.workerId.toLowerCase() === (workerId || '').toLowerCase());

  const saveMeasurement = (newMeasurement: Measurement) => {
    setMeasurements(prev => [newMeasurement, ...prev]);

    const logSeverity = newMeasurement.exposureStatus === 'HIGH' ? 'danger' : newMeasurement.exposureStatus === 'MODERATE' ? 'warning' : 'info';
    const logItem: ActivityLogItem = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'New Telemetry Scan',
      description: `${newMeasurement.workerName || 'Worker'} tap recorded: ${newMeasurement.estimatedExposure} ${newMeasurement.exposureUnit} (${newMeasurement.exposureStatus})`,
      timestamp: newMeasurement.timestamp,
      type: 'measurement',
      severity: logSeverity,
    };
    setActivityLogs(prev => [logItem, ...prev]);
  };

  const registerChemicalStrip = (stripData: Omit<ChemicalStrip, 'createdAt' | 'status'> & { status?: StripStatus }) => {
    const newStrip: ChemicalStrip = {
      ...stripData,
      status: stripData.status || 'VALID',
      createdAt: new Date().toISOString(),
    };
    setChemicalStrips(prev => [newStrip, ...prev]);

    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Strip Registered',
      description: `New Chemical Strip ${newStrip.stripId} (Batch: ${newStrip.batchId}) registered in inventory.`,
      timestamp: new Date().toISOString(),
      type: 'strip',
      severity: 'success',
    }, ...prev]);
  };

  const registerDevice = (deviceData: Omit<Device, 'createdAt' | 'powerStatus'>) => {
    const newDevice: Device = {
      ...deviceData,
      powerStatus: 'NFC powered',
      createdAt: new Date().toISOString(),
    };
    setDevices(prev => [newDevice, ...prev]);

    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Device Registered',
      description: `New NFC Reader ${newDevice.deviceId} provisioned.`,
      timestamp: new Date().toISOString(),
      type: 'device',
      severity: 'info',
    }, ...prev]);
  };

  const registerWorker = (workerData: Omit<Worker, 'createdAt'>) => {
    const newWorker: Worker = {
      ...workerData,
      createdAt: new Date().toISOString(),
    };
    setWorkers(prev => [newWorker, ...prev]);

    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Worker Registered',
      description: `Worker ${newWorker.name} (${newWorker.workerId}) added to ${newWorker.department}.`,
      timestamp: new Date().toISOString(),
      type: 'worker',
      severity: 'info',
    }, ...prev]);
  };

  const updateStripStatus = (stripId: string, status: StripStatus, usedAt?: string) => {
    setChemicalStrips(prev => prev.map(s => {
      if (s.stripId.toLowerCase() === (stripId || '').toLowerCase()) {
        return { ...s, status, usedAt: usedAt || s.usedAt || new Date().toISOString() };
      }
      return s;
    }));
  };

  const updateDeviceLastScan = (deviceId: string, timestamp: string) => {
    setDevices(prev => prev.map(d => {
      if (d.deviceId.toLowerCase() === (deviceId || '').toLowerCase()) {
        return { ...d, lastMeasurementAt: timestamp, status: 'CONNECTED' };
      }
      return d;
    }));
  };

  const updateWorkerExposure = (workerId: string, exposure: number, status: ExposureStatus, timestamp: string) => {
    setWorkers(prev => prev.map(w => {
      if (w.workerId.toLowerCase() === (workerId || '').toLowerCase()) {
        return {
          ...w,
          latestExposure: {
            estimatedExposure: exposure,
            exposureStatus: status,
            timestamp
          }
        };
      }
      return w;
    }));
  };

  const replaceActiveStrip = (deviceId: string, newStripId: string, batchId: string, replacedByEmail: string) => {
    const now = new Date().toISOString();

    // 1. Update current chemical strips
    setChemicalStrips(prev => [
      {
        stripId: newStripId,
        batchId,
        manufacturedAt: now,
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
        calibrationProfileId: 'CP-03',
        status: 'VALID',
        createdAt: now,
      },
      ...prev.map(s => s.status === 'VALID' ? { ...s, status: 'USED' as const, usedAt: now } : s)
    ]);

    // 2. Update device strip history: mark old active record as USED, prepend new VALID record
    setDevices(prev => prev.map(d => {
      if (d.deviceId.toLowerCase() === (deviceId || '').toLowerCase()) {
        const oldHistory = d.stripHistory || [];
        const updatedHistory = oldHistory.map(h => {
          if (h.status === 'VALID') {
            const insTime = new Date(h.insertedAt).getTime();
            const nowTime = new Date(now).getTime();
            const diffHours = Math.max(1, Math.round((nowTime - insTime) / (3600 * 1000)));
            const days = Math.floor(diffHours / 24);
            const hours = diffHours % 24;
            const durationText = days > 0 ? `${days}d ${hours}h` : `${hours} hours`;

            return {
              ...h,
              status: 'USED' as const,
              removedAt: now,
              totalObservedExposure: h.totalObservedExposure || 48.2,
              opticalAbsorbance: h.opticalAbsorbance || 0.220,
              usageDurationText: durationText,
            };
          }
          return h;
        });

        const newRecord = {
          recordId: `REC-${Date.now().toString().slice(-4)}`,
          stripId: newStripId,
          batchId,
          insertedAt: now,
          status: 'VALID' as const,
          replacedByEmail,
          totalObservedExposure: 0.0,
          opticalAbsorbance: 0.842,
          usageDurationText: 'Active in Unit (Just inserted)',
        };
        return {
          ...d,
          stripHistory: [newRecord, ...updatedHistory]
        };
      }
      return d;
    }));

    // 3. Log activity
    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Strip Replaced & Archived',
      description: `New Chemical Strip ${newStripId} inserted into ${deviceId}. Previous strip archived into replacement history.`,
      timestamp: now,
      type: 'strip',
      severity: 'success',
    }, ...prev]);
  };

  const resetToDemoData = () => {
    setWorkers(INITIAL_WORKERS);
    setDevices(INITIAL_DEVICES);
    setChemicalStrips(INITIAL_CHEMICAL_STRIPS);
    setMeasurements(INITIAL_MEASUREMENTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    localStorage.clear();
  };

  return (
    <DataContext.Provider value={{
      workers,
      devices,
      chemicalStrips,
      measurements,
      calibrationProfiles,
      activityLogs,
      saveMeasurement,
      registerChemicalStrip,
      registerDevice,
      registerWorker,
      updateStripStatus,
      updateDeviceLastScan,
      updateWorkerExposure,
      lookupDevice,
      lookupStrip,
      lookupWorker,
      replaceActiveStrip,
      resetToDemoData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

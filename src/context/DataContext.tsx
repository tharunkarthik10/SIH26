import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Worker, 
  Device, 
  ChemicalStrip, 
  Measurement, 
  CalibrationProfile, 
  ActivityLogItem, 
  ExposureStatus,
  StripStatus,
  IncidentRecord,
  StripRequisition,
  ServiceTicket,
  WorkerDocument,
  DeviceAssignmentRecord
} from '../types';
import { 
  INITIAL_WORKERS, 
  INITIAL_DEVICES, 
  INITIAL_CHEMICAL_STRIPS, 
  INITIAL_CALIBRATION_PROFILES, 
  INITIAL_MEASUREMENTS, 
  INITIAL_ACTIVITY_LOGS,
  INITIAL_INCIDENTS,
  INITIAL_STRIP_REQUISITIONS,
  INITIAL_SERVICE_TICKETS,
  INITIAL_WORKER_DOCUMENTS,
  INITIAL_DEVICE_ASSIGNMENTS
} from '../services/dataService';

interface DataContextType {
  workers: Worker[];
  devices: Device[];
  chemicalStrips: ChemicalStrip[];
  measurements: Measurement[];
  calibrationProfiles: CalibrationProfile[];
  activityLogs: ActivityLogItem[];
  incidents: IncidentRecord[];
  stripRequisitions: StripRequisition[];
  serviceTickets: ServiceTicket[];
  workerDocuments: WorkerDocument[];
  deviceAssignments: DeviceAssignmentRecord[];
  saveMeasurement: (measurement: Measurement) => void;
  registerChemicalStrip: (strip: Omit<ChemicalStrip, 'createdAt' | 'status'> & { status?: StripStatus }) => void;
  registerDevice: (device: Omit<Device, 'createdAt' | 'powerStatus'>) => void;
  registerWorker: (worker: Omit<Worker, 'createdAt'>) => void;
  updateWorkerProfile: (workerId: string, updates: Partial<Worker>) => void;
  updateStripStatus: (stripId: string, status: StripStatus, usedAt?: string) => void;
  updateDeviceLastScan: (deviceId: string, timestamp: string) => void;
  updateWorkerExposure: (workerId: string, exposure: number, status: ExposureStatus, timestamp: string) => void;
  lookupDevice: (deviceId: string) => Device | undefined;
  lookupStrip: (stripId: string) => ChemicalStrip | undefined;
  lookupWorker: (workerId: string) => Worker | undefined;
  replaceActiveStrip: (deviceId: string, newStripId: string, batchId: string, replacedByEmail: string) => void;
  addIncident: (incident: Omit<IncidentRecord, 'id'>) => void;
  acknowledgeIncident: (incidentId: string) => void;
  requestStripReplacement: (req: Omit<StripRequisition, 'id' | 'requestedAt' | 'status'>) => void;
  createServiceTicket: (ticket: Omit<ServiceTicket, 'id' | 'reportedAt' | 'status'>) => void;
  uploadWorkerDocument: (doc: Omit<WorkerDocument, 'id' | 'uploadedAt' | 'status'>) => void;
  resetToDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'SIH_H2S_DOSIMETER_DATA_V7';

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

  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_INCIDENTS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.warn(e); }
    return INITIAL_INCIDENTS;
  });

  const [stripRequisitions, setStripRequisitions] = useState<StripRequisition[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_REQUISITIONS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.warn(e); }
    return INITIAL_STRIP_REQUISITIONS;
  });

  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_TICKETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.warn(e); }
    return INITIAL_SERVICE_TICKETS;
  });

  const [workerDocuments, setWorkerDocuments] = useState<WorkerDocument[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_DOCUMENTS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { console.warn(e); }
    return INITIAL_WORKER_DOCUMENTS;
  });

  const [deviceAssignments] = useState<DeviceAssignmentRecord[]>(INITIAL_DEVICE_ASSIGNMENTS);

  // Sync state to local storage
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_WORKERS', JSON.stringify(workers)); }, [workers]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_DEVICES', JSON.stringify(devices)); }, [devices]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_STRIPS', JSON.stringify(chemicalStrips)); }, [chemicalStrips]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_MEASUREMENTS', JSON.stringify(measurements)); }, [measurements]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_LOGS', JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_INCIDENTS', JSON.stringify(incidents)); }, [incidents]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_REQUISITIONS', JSON.stringify(stripRequisitions)); }, [stripRequisitions]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_TICKETS', JSON.stringify(serviceTickets)); }, [serviceTickets]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY + '_DOCUMENTS', JSON.stringify(workerDocuments)); }, [workerDocuments]);

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
  };

  const registerWorker = (workerData: Omit<Worker, 'createdAt'>) => {
    const newWorker: Worker = {
      ...workerData,
      createdAt: new Date().toISOString(),
    };
    setWorkers(prev => [newWorker, ...prev]);
  };

  const updateWorkerProfile = (workerId: string, updates: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => w.workerId === workerId ? { ...w, ...updates } : w));
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

    setDevices(prev => prev.map(d => {
      if (d.deviceId.toLowerCase() === (deviceId || '').toLowerCase()) {
        const oldHistory = d.stripHistory || [];
        const updatedHistory = oldHistory.map(h => {
          if (h.status === 'VALID') {
            return {
              ...h,
              status: 'USED' as const,
              removedAt: now,
              totalObservedExposure: h.totalObservedExposure || 48.2,
              opticalAbsorbance: h.opticalAbsorbance || 0.220,
              usageDurationText: 'Completed active shift',
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

    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Strip Replaced & Archived',
      description: `New Chemical Strip ${newStripId} inserted into ${deviceId}.`,
      timestamp: now,
      type: 'strip',
      severity: 'success',
    }, ...prev]);
  };

  const addIncident = (incidentData: Omit<IncidentRecord, 'id'>) => {
    const newInc: IncidentRecord = {
      ...incidentData,
      id: `INC-2026-${(incidents.length + 1).toString().padStart(3, '0')}`,
    };
    setIncidents(prev => [newInc, ...prev]);

    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Incident Recorded',
      description: `Incident ${newInc.id} logged for ${newInc.workerName}: ${newInc.alertType}`,
      timestamp: newInc.timestamp,
      type: 'incident',
      severity: 'danger',
    }, ...prev]);
  };

  const acknowledgeIncident = (incidentId: string) => {
    const now = new Date().toISOString();
    setIncidents(prev => prev.map(inc => inc.id === incidentId ? {
      ...inc,
      status: 'ACKNOWLEDGED',
      acknowledgedByWorker: true,
      acknowledgedAt: now
    } : inc));
  };

  const requestStripReplacement = (req: Omit<StripRequisition, 'id' | 'requestedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const newReq: StripRequisition = {
      ...req,
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      requestedAt: now,
      status: 'PENDING'
    };
    setStripRequisitions(prev => [newReq, ...prev]);

    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Strip Requisition Placed',
      description: `Requisition ${newReq.id} submitted for Strip ${newReq.stripId} (Qty: ${newReq.quantity})`,
      timestamp: now,
      type: 'strip',
      severity: 'warning'
    }, ...prev]);
  };

  const createServiceTicket = (tck: Omit<ServiceTicket, 'id' | 'reportedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const newTicket: ServiceTicket = {
      ...tck,
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      reportedAt: now,
      status: 'OPEN'
    };
    setServiceTickets(prev => [newTicket, ...prev]);

    setActivityLogs(prev => [{
      id: `ACT-${Date.now().toString().slice(-4)}`,
      title: 'Service Ticket Logged',
      description: `Ticket ${newTicket.id} created for ${newTicket.deviceId}: ${newTicket.issueType}`,
      timestamp: now,
      type: 'device',
      severity: 'warning'
    }, ...prev]);
  };

  const uploadWorkerDocument = (doc: Omit<WorkerDocument, 'id' | 'uploadedAt' | 'status'>) => {
    const now = new Date().toISOString();
    const newDoc: WorkerDocument = {
      ...doc,
      id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
      uploadedAt: now,
      status: 'VALID'
    };
    setWorkerDocuments(prev => [newDoc, ...prev]);
  };

  const resetToDemoData = () => {
    setWorkers(INITIAL_WORKERS);
    setDevices(INITIAL_DEVICES);
    setChemicalStrips(INITIAL_CHEMICAL_STRIPS);
    setMeasurements(INITIAL_MEASUREMENTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setIncidents(INITIAL_INCIDENTS);
    setStripRequisitions(INITIAL_STRIP_REQUISITIONS);
    setServiceTickets(INITIAL_SERVICE_TICKETS);
    setWorkerDocuments(INITIAL_WORKER_DOCUMENTS);
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
      incidents,
      stripRequisitions,
      serviceTickets,
      workerDocuments,
      deviceAssignments,
      saveMeasurement,
      registerChemicalStrip,
      registerDevice,
      registerWorker,
      updateWorkerProfile,
      updateStripStatus,
      updateDeviceLastScan,
      updateWorkerExposure,
      lookupDevice,
      lookupStrip,
      lookupWorker,
      replaceActiveStrip,
      addIncident,
      acknowledgeIncident,
      requestStripReplacement,
      createServiceTicket,
      uploadWorkerDocument,
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


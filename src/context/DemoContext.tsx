import React, { createContext, useContext, useState } from 'react';
import { SimulationScenarioId, Measurement } from '../types';

export type TelemetryUnit = 'ppm_h' | 'mg_h_m3';
export type AppLanguage = 'en' | 'hi' | 'gu' | 'mr';

export interface AlarmThresholds {
  low: number;
  moderate: number;
  high: number;
}

interface DemoContextType {
  activeScenarioId: SimulationScenarioId;
  setActiveScenarioId: (id: SimulationScenarioId) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  isDemoBarVisible: boolean;
  setIsDemoBarVisible: (visible: boolean) => void;
  hardwareConnectionStatus: 'SIMULATED' | 'HARDWARE_LINKED' | 'DISCONNECTED';
  setHardwareConnectionStatus: (status: 'SIMULATED' | 'HARDWARE_LINKED' | 'DISCONNECTED') => void;
  isDevMode: boolean;
  setIsDevMode: (dev: boolean) => void;
  pendingSyncQueue: Measurement[];
  addToPendingSync: (measurement: Measurement) => void;
  clearPendingSync: () => void;
  telemetryUnit: TelemetryUnit;
  setTelemetryUnit: (unit: TelemetryUnit) => void;
  appLanguage: AppLanguage;
  setAppLanguage: (lang: AppLanguage) => void;
  alarmThresholds: AlarmThresholds;
  setAlarmThresholds: (thresholds: AlarmThresholds) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScenarioId, setActiveScenarioId] = useState<SimulationScenarioId>('LOW');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isDemoBarVisible, setIsDemoBarVisible] = useState<boolean>(true);
  const [hardwareConnectionStatus, setHardwareConnectionStatus] = useState<'SIMULATED' | 'HARDWARE_LINKED' | 'DISCONNECTED'>('SIMULATED');
  
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return localStorage.getItem('SIH_DEV_MODE') === 'true';
  });

  const [pendingSyncQueue, setPendingSyncQueue] = useState<Measurement[]>([]);
  const [telemetryUnit, setTelemetryUnit] = useState<TelemetryUnit>('ppm_h');
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('en');
  const [alarmThresholds, setAlarmThresholds] = useState<AlarmThresholds>({
    low: 5,
    moderate: 10,
    high: 25
  });

  const toggleDevMode = (dev: boolean) => {
    setIsDevMode(dev);
    localStorage.setItem('SIH_DEV_MODE', String(dev));
  };

  const addToPendingSync = (measurement: Measurement) => {
    setPendingSyncQueue(prev => [measurement, ...prev]);
  };

  const clearPendingSync = () => {
    setPendingSyncQueue([]);
  };

  return (
    <DemoContext.Provider value={{
      activeScenarioId,
      setActiveScenarioId,
      isOffline,
      setIsOffline,
      isDemoBarVisible,
      setIsDemoBarVisible,
      hardwareConnectionStatus,
      setHardwareConnectionStatus,
      isDevMode,
      setIsDevMode: toggleDevMode,
      pendingSyncQueue,
      addToPendingSync,
      clearPendingSync,
      telemetryUnit,
      setTelemetryUnit,
      appLanguage,
      setAppLanguage,
      alarmThresholds,
      setAlarmThresholds
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};


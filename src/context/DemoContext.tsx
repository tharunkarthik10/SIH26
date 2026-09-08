import React, { createContext, useContext, useState } from 'react';
import { SimulationScenarioId } from '../types';

interface DemoContextType {
  activeScenarioId: SimulationScenarioId;
  setActiveScenarioId: (id: SimulationScenarioId) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  isDemoBarVisible: boolean;
  setIsDemoBarVisible: (visible: boolean) => void;
  hardwareConnectionStatus: 'SIMULATED' | 'HARDWARE_LINKED' | 'DISCONNECTED';
  setHardwareConnectionStatus: (status: 'SIMULATED' | 'HARDWARE_LINKED' | 'DISCONNECTED') => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScenarioId, setActiveScenarioId] = useState<SimulationScenarioId>('LOW');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isDemoBarVisible, setIsDemoBarVisible] = useState<boolean>(true);
  const [hardwareConnectionStatus, setHardwareConnectionStatus] = useState<'SIMULATED' | 'HARDWARE_LINKED' | 'DISCONNECTED'>('SIMULATED');

  return (
    <DemoContext.Provider value={{
      activeScenarioId,
      setActiveScenarioId,
      isOffline,
      setIsOffline,
      isDemoBarVisible,
      setIsDemoBarVisible,
      hardwareConnectionStatus,
      setHardwareConnectionStatus
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

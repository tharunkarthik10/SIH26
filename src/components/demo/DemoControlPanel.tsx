import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { SIMULATION_SCENARIOS } from '../../services/simulationService';
import { SimulationScenarioId } from '../../types';
import { Zap } from 'lucide-react';

export const DemoControlPanel: React.FC = () => {
  const { activeScenarioId, setActiveScenarioId } = useDemo();

  const scenarioKeys: SimulationScenarioId[] = [
    'LOW',
    'MODERATE',
    'HIGH',
    'EXPIRED_STRIP',
    'USED_STRIP',
    'INVALID_STRIP',
    'INVALID_DEVICE'
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      <span className="flex items-center gap-1 text-slate-500 font-sans text-xs font-medium shrink-0">
        <Zap className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>Demo Scenario:</span>
      </span>

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {scenarioKeys.map((scenarioId) => {
          const scenario = SIMULATION_SCENARIOS[scenarioId];
          const isActive = activeScenarioId === scenarioId;

          let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
          if (isActive) {
            if (scenarioId === 'LOW') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
            else if (scenarioId === 'MODERATE') badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
            else if (scenarioId === 'HIGH') badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
            else badgeColor = 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
          }

          return (
            <button
              key={scenarioId}
              onClick={() => setActiveScenarioId(scenarioId)}
              className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-all border shrink-0 ${badgeColor}`}
              title={scenario.description}
            >
              {scenario.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

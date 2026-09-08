import React from 'react';
import { NFCScannerWidget } from '../components/measure/NFCScannerWidget';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { Radio, Smartphone } from 'lucide-react';

export const MeasurePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Informational Header Bar */}
      <div className="industrial-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-safety-cyan/10 border border-safety-cyan/30 text-safety-cyan">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-industrial-100 uppercase tracking-wider">
              Optical Reader NFC Telemetry Interface
            </h2>
            <p className="text-xs text-industrial-400 font-mono">
              Simulate or capture live photodiode absorbance data from the passive H₂S dosimeter hardware.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-industrial-300 bg-industrial-950 px-3 py-1.5 rounded-lg border border-industrial-800">
          <Smartphone className="w-4 h-4 text-safety-cyan" />
          <span>Tap Reader to Phone Antenna</span>
        </div>
      </div>

      {/* Main 7-Step Scanner Interface Widget */}
      <NFCScannerWidget />

      {/* Bottom Mandatory Disclaimer */}
      <ScientificDisclaimer />
    </div>
  );
};

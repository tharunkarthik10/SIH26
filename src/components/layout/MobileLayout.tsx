import React, { useState, useEffect } from 'react';
import { Shield, Clock, Wifi, WifiOff, QrCode } from 'lucide-react';
import { BottomNav, MobileTab } from './BottomNav';
import { useDemo } from '../../context/DemoContext';
import { formatIndianTime } from '../../utils/dateUtils';
import { DemoQRCodesModal } from '../demo/DemoQRCodesModal';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { isOffline, setIsOffline, isDevMode } = useDemo();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDemoQrOpen, setIsDemoQrOpen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(formatIndianTime(now, false));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 justify-between items-center">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen flex flex-col shadow-2xl relative pb-20 border-x border-slate-200">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-4 h-14 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-2xs">
              <Shield className="w-4 h-4 font-bold" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 tracking-tight flex items-center gap-1">
                H₂S DOSIMETER
                <span className="text-[9px] px-1.5 py-0.2 bg-sky-100 text-sky-700 rounded font-semibold">SIH '26</span>
              </div>
              <div className="text-[10px] text-slate-500 font-sans">
                Mobile Telemetry App
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {/* Demo QR Button (Gated by Dev Mode) */}
            {isDevMode && (
              <button
                onClick={() => setIsDemoQrOpen(true)}
                className="p-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 transition-all flex items-center gap-1 text-[10px] font-bold px-1.5"
                title="[DEV MODE] View 2 Demo QR Codes"
              >
                <QrCode className="w-3 h-3 text-amber-600" />
                <span>QRs</span>
              </button>
            )}


            {/* Live Clock */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-1 rounded-lg">
              <Clock className="w-3 h-3 text-sky-600" />
              <span>{currentTime || '00:00'}</span>
            </div>

            {/* Network Indicator */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`p-1 rounded-lg border transition-all ${
                isOffline ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}
              title="Toggle simulated network status"
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 space-y-4">
          {children}
        </main>

        {/* Fixed Bottom Mobile Navigation Bar */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <DemoQRCodesModal
        isOpen={isDemoQrOpen}
        onClose={() => setIsDemoQrOpen(false)}
      />
    </div>
  );
};

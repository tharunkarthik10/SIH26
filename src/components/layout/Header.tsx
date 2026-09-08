import React, { useState, useEffect } from 'react';
import { Shield, Wifi, WifiOff, Clock, QrCode } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { useAuth } from '../../context/AuthContext';
import { DemoControlPanel } from '../demo/DemoControlPanel';
import { formatIndianTime } from '../../utils/dateUtils';
import { DemoQRCodesModal } from '../demo/DemoQRCodesModal';

export const Header: React.FC = () => {
  const { isOffline, setIsOffline } = useDemo();
  const { user, switchRole, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDemoQrOpen, setIsDemoQrOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(formatIndianTime(now, true));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5 font-sans">
              H₂S DOSIMETER
              <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-700 rounded-md font-semibold">SIH '26</span>
            </div>
            <div className="text-xs text-slate-500 font-sans">
              Passive Exposure Telemetry
            </div>
          </div>
        </div>

        {/* Center: Inline Demo Presets */}
        <div className="hidden lg:block flex-1 max-w-2xl px-4">
          <DemoControlPanel />
        </div>

        {/* Right: Live Telemetry & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-sans">
          {/* Network Online/Offline Status Indicator */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isOffline
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
            title="Click to toggle simulated network status"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Online</span>
              </>
            )}
          </button>

          {/* Role Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => switchRole('Supervisor')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                user?.role === 'Supervisor' ? 'bg-white text-sky-700 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Supervisor
            </button>
            <button
              onClick={() => switchRole('Admin')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                user?.role === 'Admin' ? 'bg-white text-sky-700 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>{currentTime || '00:00:00'}</span>
          </div>

          {/* Demo QR Codes Modal Trigger */}
          <button
            onClick={() => setIsDemoQrOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all shadow-2xs"
            title="View 2 Demo QR Codes for Mobile Camera Scan"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-600" />
            <span>Demo QRs</span>
          </button>

          <button
            onClick={() => logout()}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Demo Controls Strip */}
      <div className="lg:hidden px-4 py-2 border-t border-slate-100 bg-slate-50">
        <DemoControlPanel />
      </div>

      <DemoQRCodesModal
        isOpen={isDemoQrOpen}
        onClose={() => setIsDemoQrOpen(false)}
      />
    </header>
  );
};

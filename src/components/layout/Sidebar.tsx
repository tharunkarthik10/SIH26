import React from 'react';
import { 
  LayoutDashboard, 
  Radio, 
  Shield, 
  LogOut,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveTab = 
  | 'dashboard' 
  | 'measure' 
  | 'workers' 
  | 'devices' 
  | 'strips' 
  | 'history' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container - Minimal Bright White */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo & Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 bg-slate-50/50">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="font-mono font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                H₂S DOSIMETER
                <span className="text-[9px] px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded-md font-semibold">SIH '26</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Unified Safety Dashboard
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Single Dashboard Suite
            </div>
            
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all bg-sky-50 text-sky-700 font-semibold border border-sky-200/80 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-sky-600" />
                <span>Dosimeter Dashboard</span>
              </div>

              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-sky-100 text-sky-700 border border-sky-200">
                LIVE
              </span>
            </button>
          </nav>
        </div>

        {/* Footer User Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-mono font-bold text-xs flex items-center justify-center border border-sky-200 shrink-0">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'SO'}
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {user?.displayName || 'Safety Officer'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {user?.role || 'Supervisor'}
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

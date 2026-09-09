import React from 'react';
import { Cpu, Tag, Radio, User, Users, FileText, Settings } from 'lucide-react';

export type MobileTab = 'read' | 'strip' | 'device' | 'supervisor' | 'incidents' | 'profile';

interface BottomNavProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: MobileTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'read', label: 'Read', icon: Radio },
    { id: 'strip', label: 'Strip', icon: Tag },
    { id: 'device', label: 'Device', icon: Cpu },
    { id: 'supervisor', label: 'Supervisor', icon: Users },
    { id: 'incidents', label: 'Incidents', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-lg font-sans max-w-md mx-auto">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all rounded-xl ${
                isActive
                  ? 'text-sky-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-sky-100/80 text-sky-700' : ''}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[9px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


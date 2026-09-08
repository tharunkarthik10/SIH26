import React from 'react';
import { ActivityLogItem } from '../../types';
import { Activity, Radio, Tag, Cpu, UserCheck } from 'lucide-react';
import { formatIndianTime } from '../../utils/dateUtils';

interface ActivityFeedProps {
  activityLogs: ActivityLogItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activityLogs }) => {
  const getIcon = (type: ActivityLogItem['type']) => {
    if (type === 'measurement') return Radio;
    if (type === 'strip') return Tag;
    if (type === 'device') return Cpu;
    return UserCheck;
  };

  return (
    <div className="industrial-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider">
            Live Activity Feed
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase">System Telemetry</span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {activityLogs.slice(0, 6).map((item) => {
          const Icon = getIcon(item.type);

          let color = 'text-sky-700 bg-sky-50 border-sky-200';
          if (item.severity === 'danger') color = 'text-rose-700 bg-rose-50 border-rose-200';
          else if (item.severity === 'warning') color = 'text-amber-700 bg-amber-50 border-amber-200';
          else if (item.severity === 'success') color = 'text-emerald-700 bg-emerald-50 border-emerald-200';

          return (
            <div key={item.id} className="flex items-start gap-3 text-xs font-mono p-2.5 rounded-xl bg-slate-50/70 border border-slate-200">
              <div className={`p-2 rounded-lg border shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 truncate">{item.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatIndianTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'danger';
  color?: 'cyan' | 'amber' | 'emerald' | 'rose';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral',
  color = 'cyan'
}) => {
  const colorMap = {
    cyan: 'bg-sky-50 text-sky-600 border-sky-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  return (
    <div className="industrial-card p-5 relative overflow-hidden flex flex-col justify-between space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            {title}
          </div>
          <div className="text-2xl md:text-3xl font-mono font-bold text-slate-900 mt-1">
            {value}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border ${colorMap[color]} shadow-2xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-100">
        <span className="text-slate-500">{subtitle}</span>
        {trend && (
          <span className={`font-semibold ${
            trendType === 'danger' ? 'text-rose-600' : trendType === 'positive' ? 'text-emerald-600' : 'text-slate-600'
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

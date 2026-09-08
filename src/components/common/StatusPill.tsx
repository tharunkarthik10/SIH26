import React from 'react';
import { ExposureStatus, StripStatus, DeviceStatus, WorkerStatus } from '../../types';

type StatusType = ExposureStatus | StripStatus | DeviceStatus | WorkerStatus | string;

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  const upper = String(status).toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';

  // Exposure Statuses
  if (upper === 'LOW') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300/80';
  } else if (upper === 'MODERATE') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300/80';
  } else if (upper === 'HIGH' || upper === 'DANGER') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300/80 animate-pulse font-bold';
  }
  
  // Strip & Device Statuses
  else if (upper === 'VALID' || upper === 'CONNECTED' || upper === 'ACTIVE' || upper === 'REGISTERED') {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-300/80';
  } else if (upper === 'EXPIRING_SOON' || upper === 'MAINTENANCE') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300/80';
  } else if (upper === 'EXPIRED' || upper === 'ERROR' || upper === 'INVALID') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300/80';
  } else if (upper === 'USED' || upper === 'INACTIVE' || upper === 'ON_LEAVE') {
    colorClasses = 'bg-slate-100 text-slate-500 border-slate-300';
  }

  const formatText = (s: string) => {
    return s.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold tracking-wider border shadow-2xs ${colorClasses} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {formatText(upper)}
    </span>
  );
};

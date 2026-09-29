import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { StatusPill } from '../components/common/StatusPill';
import { formatIndianTime } from '../utils/dateUtils';
import { 
  Users, 
  ShieldAlert, 
  Search, 
  CheckCircle2
} from 'lucide-react';

export const SupervisorDashboardPage: React.FC = () => {
  const { workers, devices, incidents, acknowledgeIncident } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');

  const filteredWorkers = (workers || []).filter(w => {
    if (!w) return false;
    const name = (w.name || '').toLowerCase();
    const id = (w.workerId || '').toLowerCase();
    const code = (w.employeeCode || '').toLowerCase();
    const dept = (w.department || '').toLowerCase();
    const query = (searchTerm || '').toLowerCase();

    const matchesSearch = !query || name.includes(query) || id.includes(query) || code.includes(query);
    const matchesDept = selectedDepartment === 'ALL' || dept.includes(selectedDepartment.toLowerCase());
    return matchesSearch && matchesDept;
  });

  const highRiskWorkers = (workers || []).filter(w => w?.latestExposure?.exposureStatus === 'HIGH');
  const moderateWorkers = (workers || []).filter(w => w?.latestExposure?.exposureStatus === 'MODERATE');
  const nominalWorkers = (workers || []).filter(w => !w?.latestExposure || w?.latestExposure?.exposureStatus === 'LOW');

  const openIncidents = (incidents || []).filter(i => i && i.status === 'OPEN');

  return (
    <div className="space-y-3.5 font-sans animate-in fade-in pb-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Plant Safety Overview</span>
          </h1>
          <p className="text-[11px] text-slate-500">
            {workers.length} active workers monitored
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
          Supervisor
        </span>
      </div>

      {/* 3-METRIC STATUS STRIP */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs text-center">
          <span className="text-[10px] text-slate-400 font-medium block">Safe</span>
          <span className="text-lg font-extrabold text-emerald-700">{nominalWorkers.length}</span>
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs text-center">
          <span className="text-[10px] text-slate-400 font-medium block">Rest Needed</span>
          <span className="text-lg font-extrabold text-amber-600">{moderateWorkers.length}</span>
        </div>

        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs text-center">
          <span className="text-[10px] text-slate-400 font-medium block">Critical / Evac</span>
          <span className="text-lg font-extrabold text-rose-600">{highRiskWorkers.length}</span>
        </div>
      </div>

      {/* OPEN INCIDENTS ALERT (Only if unacknowledged incidents exist) */}
      {openIncidents.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-rose-950">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Pending Incident Alerts ({openIncidents.length})</span>
            </span>
            <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-medium">Action</span>
          </div>

          <div className="space-y-1.5">
            {openIncidents.map(inc => (
              <div key={inc.id} className="p-2 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">{inc.workerName}</div>
                  <div className="text-[10px] text-rose-700">{inc.alertType} • {inc.exposurePpmH} ppm·h</div>
                </div>
                <button
                  onClick={() => acknowledgeIncident(inc.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Acknowledge</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH & DEPARTMENT FILTER */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Depts</option>
            <option value="Desulfurization">Desulfurization</option>
            <option value="Chemical Storage">Storage</option>
            <option value="Pipeline">Pipeline</option>
            <option value="Lab">QC Lab</option>
          </select>
        </div>

        {/* WORKER CARDS LIST */}
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-0.5">
          {filteredWorkers.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No workers matching search filter
            </div>
          ) : (
            filteredWorkers.map(worker => {
              const exp = worker.latestExposure?.estimatedExposure ?? 0;
              const status = worker.latestExposure?.exposureStatus ?? 'LOW';
              const assignedDev = (devices || []).find(d => d && d.assignedWorkerId === worker.workerId);

              return (
                <div 
                  key={worker.workerId} 
                  className="p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 space-y-1.5 transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {worker.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {worker.department} • {worker.employeeCode}
                        </div>
                      </div>
                    </div>

                    <StatusPill status={status} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 text-slate-500">
                    <div>
                      Dose: <strong className="text-slate-900">{exp.toFixed(1)} ppm·h</strong>
                    </div>
                    <div>
                      Unit: <span className="font-mono text-sky-700">{assignedDev?.deviceId || 'DEV-0081'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {worker.latestExposure?.timestamp ? formatIndianTime(worker.latestExposure.timestamp) : 'Recent'}
                    </div>
                  </div>

                  {status === 'HIGH' && (
                    <div className="p-1.5 bg-rose-100 rounded-lg text-[10px] text-rose-900 font-bold flex items-center justify-between">
                      <span>MANDATORY REMOVAL ACTIVE</span>
                      <span className="underline">Evacuate</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

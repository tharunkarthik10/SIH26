import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { StatusPill } from '../components/common/StatusPill';
import { formatIndianTime, formatIndianDateTime } from '../utils/dateUtils';
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Tag, 
  Clock, 
  FileText,
  UserCheck,
  Send,
  Building
} from 'lucide-react';

export const SupervisorDashboardPage: React.FC = () => {
  const { workers, devices, chemicalStrips, measurements, incidents, acknowledgeIncident } = useData();
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
    <div className="space-y-4 font-sans animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>Supervisor Plant Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500">Multi-Worker Real-Time Telemetry & Alert Dispatch</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-sky-600 text-white font-bold text-xs shadow-sm">
          Supervisor View
        </span>
      </div>

      {/* PLANT SAFETY OVERVIEW STAT CARDS */}
      <div className="grid grid-cols-3 gap-2 font-sans">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Nominal Workers</div>
          <div className="text-xl font-extrabold text-emerald-900">{nominalWorkers.length}</div>
          <div className="text-[10px] text-emerald-600">Safe Exposure Range</div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
          <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Rest Breaks Needed</div>
          <div className="text-xl font-extrabold text-amber-900">{moderateWorkers.length}</div>
          <div className="text-[10px] text-amber-600">Moderate Accumulation</div>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
          <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Medical Leave / Evac</div>
          <div className="text-xl font-extrabold text-rose-900">{highRiskWorkers.length}</div>
          <div className="text-[10px] text-rose-600">Critical Toxic Hazard</div>
        </div>
      </div>

      {/* OPEN INCIDENTS ALERT DISPATCH BANNER */}
      {openIncidents.length > 0 && (
        <div className="p-3 bg-rose-100 border-2 border-rose-300 rounded-xl space-y-2 text-xs">
          <div className="font-extrabold text-rose-950 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>UNACKNOWLEDGED EMERGENCY INCIDENTS ({openIncidents.length})</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-mono">ACTION REQUIRED</span>
          </div>

          <div className="space-y-1.5">
            {openIncidents.map(inc => (
              <div key={inc.id} className="p-2.5 bg-white rounded-lg border border-rose-200 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-[11px]">{inc.workerName} ({inc.workerId})</div>
                  <div className="text-[10px] text-rose-700">{inc.alertType} — {inc.exposurePpmH} ppm·h</div>
                </div>
                <button
                  onClick={() => acknowledgeIncident(inc.id)}
                  className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Acknowledge</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORKER SEARCH & DEPT FILTER */}
      <div className="industrial-card p-3 space-y-3 bg-white border border-slate-200 text-xs">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search worker by name, ID, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Departments</option>
            <option value="Desulfurization">Desulfurization</option>
            <option value="Chemical Storage">Chemical Storage</option>
            <option value="Pipeline">Pipeline Inspection</option>
            <option value="Lab">Quality Control Lab</option>
          </select>
        </div>

        {/* WORKER MONITORING GRID / CARDS */}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {filteredWorkers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2 font-sans">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700">No personnel found</div>
              <div className="text-[11px] text-slate-500">No workers match the selected query or department filter.</div>
              <button
                onClick={() => { setSearchTerm(''); setSelectedDepartment('ALL'); }}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredWorkers.map(worker => {
              const exp = worker.latestExposure?.estimatedExposure ?? 0;
              const status = worker.latestExposure?.exposureStatus ?? 'LOW';
              const assignedDev = (devices || []).find(d => d && d.assignedWorkerId === worker.workerId);

              return (
                <div key={worker.workerId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:bg-slate-100/80 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{worker.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({worker.workerId})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[200px] whitespace-normal break-words">
                          {worker.department}
                        </div>
                      </div>
                    </div>

                    <StatusPill status={status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] border-t border-b border-slate-200/60 py-1.5 text-slate-600">
                    <div>
                      Exposure: <strong className="text-slate-900 font-bold">{exp.toFixed(1)} ppm·h</strong>
                    </div>
                    <div>
                      Reader: <strong className="text-sky-700 font-mono">{assignedDev?.deviceId || 'DEV-0081'}</strong>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      {worker.latestExposure?.timestamp ? formatIndianTime(worker.latestExposure.timestamp) : 'Recent'}
                    </div>
                  </div>

                  {status === 'HIGH' && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-900 font-bold flex items-center justify-between">
                      <span>MANDATORY MEDICAL REMOVAL ACTIVE</span>
                      <span className="text-rose-700 underline font-mono">EVACUATE SITE</span>
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

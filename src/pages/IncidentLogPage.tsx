import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatIndianDateTime } from '../utils/dateUtils';
import { exportMeasurementsToCSV } from '../services/reportService';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Search, 
  Tag, 
  Wrench,
  Clock,
  Activity
} from 'lucide-react';

export const IncidentLogPage: React.FC = () => {
  const { incidents, stripRequisitions, serviceTickets, activityLogs, workers, acknowledgeIncident } = useData();
  const [activeTab, setActiveTab] = useState<'all' | 'incidents' | 'requisitions' | 'tickets'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const q = (searchTerm || '').toLowerCase().trim();

  const filteredIncidents = (incidents || []).filter(i => {
    if (!i) return false;
    const name = (i.workerName || '').toLowerCase();
    const id = (i.id || '').toLowerCase();
    const alert = (i.alertType || '').toLowerCase();
    return !q || name.includes(q) || id.includes(q) || alert.includes(q);
  });

  const filteredRequisitions = (stripRequisitions || []).filter(r => {
    if (!r) return false;
    const id = (r.id || '').toLowerCase();
    const strip = (r.stripId || '').toLowerCase();
    const reqBy = (r.requestedBy || '').toLowerCase();
    return !q || id.includes(q) || strip.includes(q) || reqBy.includes(q);
  });

  const filteredTickets = (serviceTickets || []).filter(t => {
    if (!t) return false;
    const id = (t.id || '').toLowerCase();
    const dev = (t.deviceId || '').toLowerCase();
    const issue = (t.issueType || '').toLowerCase();
    return !q || id.includes(q) || dev.includes(q) || issue.includes(q);
  });

  const filteredLogs = (activityLogs || []).filter(l => {
    if (!l) return false;
    const title = (l.title || '').toLowerCase();
    const desc = (l.description || '').toLowerCase();
    return !q || title.includes(q) || desc.includes(q);
  });

  return (
    <div className="space-y-3.5 font-sans animate-in fade-in pb-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Audit & Incident Register</span>
          </h1>
          <p className="text-[11px] text-slate-500">
            Compliance event log for safety inspections
          </p>
        </div>

        <button
          onClick={() => exportMeasurementsToCSV([], workers)}
          className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200"
        >
          <Download className="w-3 h-3" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="space-y-2">
        <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white text-sky-700 shadow-2xs font-extrabold' : 'text-slate-500'
            }`}
          >
            All ({activityLogs.length + incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 py-1 rounded-lg transition-all ${
              activeTab === 'incidents' ? 'bg-white text-rose-700 shadow-2xs font-extrabold' : 'text-slate-500'
            }`}
          >
            Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`flex-1 py-1 rounded-lg transition-all ${
              activeTab === 'requisitions' ? 'bg-white text-amber-700 shadow-2xs font-extrabold' : 'text-slate-500'
            }`}
          >
            Strips ({stripRequisitions.length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-1 rounded-lg transition-all ${
              activeTab === 'tickets' ? 'bg-white text-sky-700 shadow-2xs font-extrabold' : 'text-slate-500'
            }`}
          >
            Service ({serviceTickets.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search records by keyword, ID, worker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* AUDIT LOG LIST */}
      <div className="space-y-2">
        {/* Incidents View */}
        {(activeTab === 'all' || activeTab === 'incidents') && filteredIncidents.map(inc => (
          <div key={inc.id} className="p-3 bg-white rounded-2xl border border-rose-200/80 shadow-xs space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{inc.alertType}</div>
                  <div className="text-[10px] text-slate-400">{inc.workerName} • Unit {inc.deviceId}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  inc.status === 'OPEN' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {inc.status}
                </span>
                {inc.status === 'OPEN' && (
                  <button
                    onClick={() => acknowledgeIncident(inc.id)}
                    className="p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white"
                    title="Acknowledge Incident"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl">
              Exposure: <strong className="text-slate-900">{inc.exposurePpmH.toFixed(1)} ppm·h</strong> • Action: {inc.actionTaken}
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              <span>{formatIndianDateTime(inc.timestamp)}</span>
            </div>
          </div>
        ))}

        {/* Strip Requisitions View */}
        {(activeTab === 'all' || activeTab === 'requisitions') && filteredRequisitions.map(req => (
          <div key={req.id} className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Strip Lot Order: {req.stripId}</div>
                  <div className="text-[10px] text-slate-400">Qty: {req.quantity} strips • Priority: {req.urgency}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {req.status}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Requested by: {req.requestedBy.split('@')[0]}</span>
              <span>{formatIndianDateTime(req.requestedAt)}</span>
            </div>
          </div>
        ))}

        {/* Service Tickets View */}
        {(activeTab === 'all' || activeTab === 'tickets') && filteredTickets.map(t => (
          <div key={t.id} className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{t.issueType} (Unit {t.deviceId})</div>
                  <div className="text-[10px] text-slate-400">{t.description}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                {t.status}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>Reported by: {t.reportedBy.split('@')[0]}</span>
              <span>{formatIndianDateTime(t.reportedAt)}</span>
            </div>
          </div>
        ))}

        {/* Activity Logs (When on All) */}
        {activeTab === 'all' && filteredLogs.map(l => (
          <div key={l.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="font-semibold text-slate-800 text-[11px]">{l.title}</div>
                <div className="text-[10px] text-slate-400">{l.description}</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {formatIndianDateTime(l.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

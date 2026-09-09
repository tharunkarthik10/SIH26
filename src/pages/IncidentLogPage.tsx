import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { StatusPill } from '../components/common/StatusPill';
import { formatIndianDateTime } from '../utils/dateUtils';
import { exportMeasurementsToCSV } from '../services/reportService';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Filter, 
  History, 
  Search, 
  ShieldAlert, 
  Tag, 
  Wrench,
  UserCheck
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
    const notes = (i.notes || '').toLowerCase();
    return !q || name.includes(q) || id.includes(q) || alert.includes(q) || notes.includes(q);
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
    const desc = (t.description || '').toLowerCase();
    return !q || id.includes(q) || dev.includes(q) || issue.includes(q) || desc.includes(q);
  });

  const filteredLogs = (activityLogs || []).filter(l => {
    if (!l) return false;
    const title = (l.title || '').toLowerCase();
    const desc = (l.description || '').toLowerCase();
    return !q || title.includes(q) || desc.includes(q);
  });

  const totalFilteredCount = 
    activeTab === 'all' ? (filteredIncidents.length + filteredRequisitions.length + filteredTickets.length + filteredLogs.length) :
    activeTab === 'incidents' ? filteredIncidents.length :
    activeTab === 'requisitions' ? filteredRequisitions.length :
    filteredTickets.length;

  return (
    <div className="space-y-4 font-sans animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <span>Incident & Audit History</span>
          </h1>
          <p className="text-xs text-slate-500">Traceable Event Register for Safety Inspections</p>
        </div>

        <button
          onClick={() => exportMeasurementsToCSV([], workers)}
          className="p-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center gap-1 border border-sky-200"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'all' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Activity ({activityLogs.length + incidents.length})
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'incidents' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Incidents ({incidents.length})
        </button>
        <button
          onClick={() => setActiveTab('requisitions')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'requisitions' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Strips ({stripRequisitions.length})
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'tickets' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Service ({serviceTickets.length})
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter audit log entries by keyword, ID, worker name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* OVERALL EMPTY STATE */}
      {totalFilteredCount === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2 font-sans">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-xs font-bold text-slate-700">No matching audit records</div>
          <div className="text-[11px] text-slate-500">No events found matching "{searchTerm}".</div>
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold"
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* TAB CONTENT: GENERAL ACTIVITY TIMELINE (FOR ALL TAB) */}
      {activeTab === 'all' && filteredLogs.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="flex items-center gap-1.5 text-sky-700">
              <History className="w-4 h-4" />
              <span>Plant Telemetry & Operational Activity Log</span>
            </span>
            <span className="text-[10px] text-slate-400">{filteredLogs.length} Events</span>
          </div>

          <div className="space-y-2">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-sky-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">{log.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{formatIndianDateTime(log.timestamp)}</span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">{log.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INCIDENTS */}
      {(activeTab === 'incidents' || activeTab === 'all') && filteredIncidents.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="flex items-center gap-1.5 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
              <span>Triggered Medical Shift Removals & Gas Alerts</span>
            </span>
            <span className="text-[10px] text-slate-400">{filteredIncidents.length} Records</span>
          </div>

          <div className="space-y-2 text-xs">
            {filteredIncidents.map(inc => (
              <div key={inc.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{inc.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.status === 'ACKNOWLEDGED' || inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatIndianDateTime(inc.timestamp)}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900">{inc.workerName} ({inc.workerId}) — Unit {inc.deviceId}</div>
                  <div className="text-rose-700 font-semibold">{inc.alertType} ({inc.exposurePpmH} ppm·h)</div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">{inc.actionTaken}</div>
                </div>

                {inc.notes && (
                  <div className="text-[10px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                    Supervisor Note: {inc.notes}
                  </div>
                )}

                {inc.status === 'OPEN' && (
                  <button
                    onClick={() => acknowledgeIncident(inc.id)}
                    className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledge Emergency Alert</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STRIP REQUISITIONS */}
      {(activeTab === 'requisitions' || activeTab === 'all') && filteredRequisitions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="flex items-center gap-1.5 text-amber-700">
              <Tag className="w-4 h-4" />
              <span>Strip Replacement Requisitions</span>
            </span>
            <span className="text-[10px] text-slate-400">{filteredRequisitions.length} Requests</span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            {filteredRequisitions.map(req => (
              <div key={req.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{req.id} — Strip {req.stripId}</div>
                  <div className="text-[11px] text-slate-500">Requested by {req.requestedBy} (Qty: {req.quantity})</div>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SERVICE TICKETS */}
      {(activeTab === 'tickets' || activeTab === 'all') && filteredTickets.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="flex items-center gap-1.5 text-sky-700">
              <Wrench className="w-4 h-4" />
              <span>Hardware Reader Service Tickets</span>
            </span>
            <span className="text-[10px] text-slate-400">{filteredTickets.length} Tickets</span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            {filteredTickets.map(tck => (
              <div key={tck.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">{tck.id} — {tck.deviceId}</span>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] rounded">{tck.status}</span>
                </div>
                <div className="text-slate-600 font-medium">{tck.issueType}: {tck.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

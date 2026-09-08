import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { ChemicalStrip } from '../types';
import { StripVisualizer } from '../components/measure/StripVisualizer';
import { StatusPill } from '../components/common/StatusPill';
import { Modal } from '../components/common/Modal';
import { Plus, Search } from 'lucide-react';
import { formatIndianDate } from '../utils/dateUtils';

export const ChemicalStripsPage: React.FC = () => {
  const { chemicalStrips, registerChemicalStrip } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrip, setSelectedStrip] = useState<ChemicalStrip | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Strip Form State
  const [newStripId, setNewStripId] = useState(`STRIP-2026-000${Date.now().toString().slice(-3)}`);
  const [newBatchId, setNewBatchId] = useState('B025-H2S');
  const [newExpiryDate, setNewExpiryDate] = useState('2027-10-01');
  const [newCalibrationProfileId, setNewCalibrationProfileId] = useState('CP-03');

  const filteredStrips = chemicalStrips.filter(s =>
    s.stripId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.batchId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegisterStrip = (e: React.FormEvent) => {
    e.preventDefault();
    registerChemicalStrip({
      stripId: newStripId,
      batchId: newBatchId,
      manufacturedAt: new Date().toISOString(),
      expiryDate: new Date(newExpiryDate).toISOString(),
      calibrationProfileId: newCalibrationProfileId,
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="industrial-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chemical strips by Strip ID or Batch ID..."
            className="industrial-input w-full pl-9"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="industrial-button-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Strip Batch</span>
        </button>
      </div>

      {/* Visual Coupons & Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStrips.map((strip) => (
          <div 
            key={strip.stripId}
            onClick={() => setSelectedStrip(strip)}
            className="cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between font-mono text-xs px-1">
              <span className="font-bold text-slate-900">{strip.stripId}</span>
              <StatusPill status={strip.status} />
            </div>

            <StripVisualizer strip={strip} opticalReading={strip.status === 'USED' ? 0.42 : 0.85} />
          </div>
        ))}
      </div>

      {/* Chemical Strip Detail Inspection Modal */}
      {selectedStrip && (
        <Modal
          isOpen={!!selectedStrip}
          onClose={() => setSelectedStrip(null)}
          title={`Chemical Strip Blueprint: ${selectedStrip.stripId}`}
          subtitle="Disposable Colorimetric Reagent Specification"
          maxWidth="md"
        >
          <div className="space-y-6">
            <StripVisualizer strip={selectedStrip} opticalReading={selectedStrip.status === 'USED' ? 0.38 : 0.88} />

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Batch Identifier</span>
                <span className="text-sky-700 font-bold">{selectedStrip.batchId}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Manufacture Date</span>
                <span className="text-slate-800">{formatIndianDate(selectedStrip.manufacturedAt)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Expiry Date</span>
                <span className="text-slate-900 font-bold">{formatIndianDate(selectedStrip.expiryDate)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Calibration Profile</span>
                <span className="text-amber-700 font-bold">{selectedStrip.calibrationProfileId}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-500">Inventory Status</span>
                <StatusPill status={selectedStrip.status} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Chemical Strip Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Chemical Strip Batch"
        subtitle="Add disposable colorimetric H₂S sensor coupons to inventory"
      >
        <form onSubmit={handleRegisterStrip} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-slate-600">Strip Unique ID</label>
            <input
              type="text"
              value={newStripId}
              onChange={(e) => setNewStripId(e.target.value)}
              className="industrial-input w-full"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600">Manufacture Batch Number</label>
            <input
              type="text"
              value={newBatchId}
              onChange={(e) => setNewBatchId(e.target.value)}
              className="industrial-input w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-600">Shelf Expiry Date</label>
              <input
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="industrial-input w-full"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">Calibration Profile</label>
              <select
                value={newCalibrationProfileId}
                onChange={(e) => setNewCalibrationProfileId(e.target.value)}
                className="industrial-input w-full"
              >
                <option value="CP-03">CP-03 (Standard SIH Demo Curve)</option>
                <option value="CP-02">CP-02 (Polynomial High Humidity)</option>
                <option value="CP-01">CP-01 (Baseline Screening)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="industrial-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="industrial-button-primary"
            >
              Register Strip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

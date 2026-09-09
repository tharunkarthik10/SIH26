import React, { useState } from 'react';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { Modal } from '../common/Modal';
import { ScannedQRResult } from '../camera/CameraScannerModal';
import { QrCode, Sparkles, Cpu, Tag, Download, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';

interface DemoQRCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPresetScan?: (result: ScannedQRResult) => void;
}

export const DEMO_QR_PRESETS = [
  // 1. HARDWARE READER UNIT
  {
    id: 'QR-DEV-0081',
    category: 'device',
    title: 'Reader Unit DEV-0081',
    subtitle: 'NFC Optical Reader Pro (v2.4.1)',
    badgeText: 'Hardware Reader Unit',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    pngPath: '/qr-codes/qr_device_dev001.png',
    payload: {
      type: 'sih_h2s_device',
      targetType: 'device',
      deviceId: 'DEV-0081',
      firmwareVersion: 'v2.4.1',
      powerStatus: 'BATTERY_94%',
      assignedWorkerId: 'WRK-00124',
      assignedWorkerName: 'Rajesh Kumar',
      provisionDate: '2026-01-15T00:00:00Z',
      opticalSensor: '650nm High-Precision Photo-diode',
      calibrationStatus: 'VALID_ISO_17025',
      lastMeasurementAt: new Date().toISOString()
    }
  },
  // 2. CHEMICAL STRIP #1: NOMINAL / SAFE EXPOSURE
  {
    id: 'QR-STRIP-124',
    category: 'strip',
    title: 'Chemical Strip #1 (Safe Shift)',
    subtitle: 'Baseline Background Exposure',
    badgeText: '4.2 ppm·h (LOW / SAFE)',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    pngPath: '/qr-codes/qr_strip_126_nominal.png',
    payload: {
      type: 'sih_h2s_telemetry',
      targetType: 'strip',
      deviceId: 'DEV-0081',
      stripId: 'STRIP-2026-000124',
      batchId: 'B024-H2S',
      exposurePpmH: 4.2,
      opticalReading: 0.770,
      exposureStatus: 'LOW',
      manufacturedAt: '2026-01-10T00:00:00Z',
      expiryDate: '2027-10-01T00:00:00Z',
      calibrationProfileId: 'CP-03',
      workerId: 'WRK-00124',
      workerName: 'Rajesh Kumar',
      timestamp: new Date().toISOString()
    }
  },
  // 3. CHEMICAL STRIP #2: EMERGENCY GAS LEAK / HAZARD
  {
    id: 'QR-STRIP-126',
    category: 'strip',
    title: 'Chemical Strip #2 (Gas Leak Spike)',
    subtitle: 'High Toxic Hazard Exposure',
    badgeText: '38.6 ppm·h (HIGH / EVACUATE)',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    pngPath: '/qr-codes/qr_strip_125_critical.png',
    payload: {
      type: 'sih_h2s_telemetry',
      targetType: 'strip',
      deviceId: 'DEV-0081',
      stripId: 'STRIP-2026-000126',
      batchId: 'B024-H2S',
      exposurePpmH: 38.6,
      opticalReading: 0.241,
      exposureStatus: 'HIGH',
      manufacturedAt: '2026-02-05T00:00:00Z',
      expiryDate: '2027-11-15T00:00:00Z',
      calibrationProfileId: 'CP-03',
      workerId: 'WRK-00124',
      workerName: 'Rajesh Kumar',
      timestamp: new Date().toISOString()
    }
  }
];

export const DemoQRCodesModal: React.FC<DemoQRCodesModalProps> = ({
  isOpen,
  onClose,
  onSelectPresetScan,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'device' | 'strip'>('all');

  const filteredItems = DEMO_QR_PRESETS.filter(item => 
    activeTab === 'all' ? true : item.category === activeTab
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live Demo: 3 Scannable QR Codes"
      subtitle="1 Hardware Reader Unit + 2 Chemical Sensing Strips for Live Interactive Camera/Simulated Telemetry"
      maxWidth="lg"
    >
      <div className="space-y-4 font-sans text-xs">
        
        {/* Banner Explanation */}
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 flex items-start gap-2.5">
          <QrCode className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-xs">Live Interactive QR Testing Hub</div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Scan with your phone's camera, or click <strong>"Simulate Scan"</strong> on any card below to watch the app update its readings, live graph, and safety action alerts in real time!
            </p>
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'all' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 3 QR Codes
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'device' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>1 Reader Device</span>
          </button>
          <button
            onClick={() => setActiveTab('strip')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'strip' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>2 Chemical Strips</span>
          </button>
        </div>

        {/* 3 LABELED QR CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="industrial-card p-3.5 bg-white border-2 border-slate-200 hover:border-sky-400 transition-all flex flex-col justify-between space-y-3 shadow-sm rounded-2xl"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]" title={item.title}>{item.title}</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border shrink-0 ${item.badgeColor}`}>
                    {item.badgeText}
                  </span>
                </div>

                <div className="py-2.5 flex justify-center">
                  <QRCodeDisplay
                    id={item.payload.stripId || item.payload.deviceId}
                    type={item.category as 'device' | 'strip'}
                    size="md"
                    value={item.payload}
                    subText={item.subtitle}
                  />
                </div>

                {/* Metadata Specifications Box */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Target:</span>
                    <strong className="text-slate-900 uppercase font-bold">{item.category}</strong>
                  </div>
                  {item.payload.deviceId && (
                    <div className="flex justify-between text-slate-600">
                      <span>Reader:</span>
                      <strong className="text-slate-900">{item.payload.deviceId}</strong>
                    </div>
                  )}
                  {item.payload.stripId && (
                    <div className="flex justify-between text-slate-600">
                      <span>Strip ID:</span>
                      <strong className="text-slate-900">{item.payload.stripId}</strong>
                    </div>
                  )}
                  {item.payload.exposurePpmH !== undefined && (
                    <div className="flex justify-between text-slate-600">
                      <span>Exposure:</span>
                      <strong className={item.payload.exposureStatus === 'HIGH' ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                        {item.payload.exposurePpmH} ppm·h
                      </strong>
                    </div>
                  )}
                  {item.payload.opticalReading !== undefined && (
                    <div className="flex justify-between text-slate-600">
                      <span>Absorbance:</span>
                      <strong className="text-slate-800">{item.payload.opticalReading.toFixed(3)} AU</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                {/* 1-Click Simulate Button */}
                {onSelectPresetScan && (
                  <button
                    onClick={() => {
                      onSelectPresetScan({
                        deviceId: item.payload.deviceId || 'DEV-0081',
                        stripId: item.payload.stripId || (item.category === 'device' ? 'N/A' : 'STRIP-2026-000124'),
                        exposurePpmH: item.payload.exposurePpmH ?? 4.2,
                        opticalReading: item.payload.opticalReading ?? 0.77,
                        timestamp: new Date().toISOString(),
                        workerId: item.payload.workerId || 'WRK-00124',
                        workerName: item.payload.workerName || 'Rajesh Kumar',
                        source: 'camera_scan',
                        targetType: item.category as 'device' | 'strip',
                        rawData: JSON.stringify(item.payload)
                      });
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs ${
                      item.category === 'device' 
                        ? 'bg-sky-600 hover:bg-sky-700' 
                        : item.payload.exposureStatus === 'HIGH' 
                        ? 'bg-rose-600 hover:bg-rose-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{item.category === 'device' ? '1-Click Pair Device' : `1-Click Scan Strip`}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="industrial-button-secondary py-2 px-4 text-xs font-semibold"
          >
            Close Window
          </button>
        </div>
      </div>
    </Modal>
  );
};

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
  // 2 DEVICE READERS
  {
    id: 'QR-DEV-001',
    category: 'device',
    title: 'Reader Unit DEV-001 (NFC Primary)',
    subtitle: 'Assigned to Rajesh Kumar (v2.4.1)',
    badgeText: 'Reader Unit #1',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    pngPath: '/qr-codes/qr_device_dev001.png',
    payload: {
      type: 'sih_h2s_device',
      deviceId: 'DEV-001',
      firmwareVersion: 'v2.4.1-nfc',
      powerStatus: 'NFC powered',
      assignedWorkerId: 'WRK-1002',
      assignedWorkerName: 'Rajesh Kumar',
      provisionDate: '2026-01-15T00:00:00Z',
      lastMeasurementAt: '2026-09-08T18:30:00Z'
    }
  },
  {
    id: 'QR-DEV-002',
    category: 'device',
    title: 'Reader Unit DEV-002 (NFC Pro)',
    subtitle: 'Assigned to Priya Sharma (v2.5.0)',
    badgeText: 'Reader Unit #2',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    pngPath: '/qr-codes/qr_device_dev002.png',
    payload: {
      type: 'sih_h2s_device',
      deviceId: 'DEV-002',
      firmwareVersion: 'v2.5.0-nfc-pro',
      powerStatus: 'NFC powered',
      assignedWorkerId: 'WRK-1005',
      assignedWorkerName: 'Priya Sharma',
      provisionDate: '2026-02-01T00:00:00Z',
      lastMeasurementAt: '2026-09-08T20:15:00Z'
    }
  },
  // 3 CHEMICAL STRIPS
  {
    id: 'QR-STRIP-124',
    category: 'strip',
    title: 'Chemical Strip STRIP-2026-000124',
    subtitle: 'Moderate H₂S Exposure Telemetry',
    badgeText: '19.6 ppm·h (Moderate)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    pngPath: '/qr-codes/qr_strip_124_moderate.png',
    payload: {
      type: 'sih_h2s_telemetry',
      deviceId: 'DEV-001',
      stripId: 'STRIP-2026-000124',
      batchId: 'B024-H2S',
      exposurePpmH: 19.6,
      opticalReading: 0.42,
      exposureStatus: 'MODERATE',
      manufacturedAt: '2026-01-10T00:00:00Z',
      expiryDate: '2027-10-01T00:00:00Z',
      calibrationProfileId: 'CP-03',
      workerId: 'WRK-1002',
      workerName: 'Rajesh Kumar',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'QR-STRIP-125',
    category: 'strip',
    title: 'Chemical Strip STRIP-2026-000125',
    subtitle: 'Critical Toxic Hazard Telemetry',
    badgeText: '28.4 ppm·h (Critical Hazard)',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    pngPath: '/qr-codes/qr_strip_125_critical.png',
    payload: {
      type: 'sih_h2s_telemetry',
      deviceId: 'DEV-002',
      stripId: 'STRIP-2026-000125',
      batchId: 'B025-H2S-CRIT',
      exposurePpmH: 28.4,
      opticalReading: 0.22,
      exposureStatus: 'HIGH',
      manufacturedAt: '2026-02-05T00:00:00Z',
      expiryDate: '2027-11-15T00:00:00Z',
      calibrationProfileId: 'CP-03',
      workerId: 'WRK-1005',
      workerName: 'Priya Sharma',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'QR-STRIP-126',
    category: 'strip',
    title: 'Chemical Strip STRIP-2026-000126',
    subtitle: 'Nominal Safe Range Telemetry',
    badgeText: '4.2 ppm·h (Safe Baseline)',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    pngPath: '/qr-codes/qr_strip_126_nominal.png',
    payload: {
      type: 'sih_h2s_telemetry',
      deviceId: 'DEV-001',
      stripId: 'STRIP-2026-000126',
      batchId: 'B026-H2S-SAFE',
      exposurePpmH: 4.2,
      opticalReading: 0.85,
      exposureStatus: 'LOW',
      manufacturedAt: '2026-03-01T00:00:00Z',
      expiryDate: '2027-12-31T00:00:00Z',
      calibrationProfileId: 'CP-03',
      workerId: 'WRK-1001',
      workerName: 'Amit Roy',
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
      title="5 Labeled Scannable QR Codes"
      subtitle="2 Reader Device Units + 3 Chemical Sensing Coupons for Mobile Camera Scanning"
      maxWidth="lg"
    >
      <div className="space-y-5 font-sans text-xs">
        
        {/* Banner Explanation */}
        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 flex items-start gap-2.5">
          <QrCode className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-xs">Mobile Camera Scan Testing</div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              Open this page on your laptop/tablet screen. Open <strong>https://portfoliotharun-7bf1b.web.app</strong> on your mobile phone, tap <strong>"Photograph Camera Scan"</strong>, and point your camera at any of the 5 labeled QR codes below!
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
            All 5 QR Codes
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'device' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2 Device Readers</span>
          </button>
          <button
            onClick={() => setActiveTab('strip')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'strip' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>3 Chemical Strips</span>
          </button>
        </div>

        {/* 5 LABELED QR CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="industrial-card p-4 bg-white border-2 border-slate-200 hover:border-sky-400 transition-all flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={item.title}>{item.title}</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border shrink-0 ${item.badgeColor}`}>
                    {item.badgeText}
                  </span>
                </div>

                <div className="py-3 flex justify-center">
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
                    <span>Category:</span>
                    <strong className="text-slate-900 uppercase font-bold">{item.category}</strong>
                  </div>
                  {item.payload.deviceId && (
                    <div className="flex justify-between text-slate-600">
                      <span>Device ID:</span>
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
                      <strong className="text-amber-700 font-bold">{item.payload.exposurePpmH} ppm·h</strong>
                    </div>
                  )}
                  {item.payload.opticalReading !== undefined && (
                    <div className="flex justify-between text-slate-600">
                      <span>Absorbance:</span>
                      <strong className="text-slate-800">{item.payload.opticalReading.toFixed(2)} AU</strong>
                    </div>
                  )}
                  {item.payload.assignedWorkerName && (
                    <div className="flex justify-between text-slate-600">
                      <span>Worker:</span>
                      <strong className="text-sky-700">{item.payload.assignedWorkerName}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                {/* Download PNG Button */}
                <a
                  href={item.pngPath}
                  download={item.pngPath.split('/').pop()}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Labeled PNG</span>
                </a>

                {/* Direct Simulate Button */}
                {onSelectPresetScan && item.category === 'strip' && (
                  <button
                    onClick={() => {
                      onSelectPresetScan({
                        deviceId: item.payload.deviceId || 'DEV-001',
                        stripId: item.payload.stripId || 'STRIP-2026-000124',
                        exposurePpmH: item.payload.exposurePpmH ?? 19.6,
                        opticalReading: item.payload.opticalReading ?? 0.42,
                        timestamp: new Date().toISOString(),
                        workerId: item.payload.workerId,
                        workerName: item.payload.workerName,
                        source: 'camera_scan',
                        rawData: JSON.stringify(item.payload)
                      });
                      onClose();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-sky-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Simulate Scan Payload</span>
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

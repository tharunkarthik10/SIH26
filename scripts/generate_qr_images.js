import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const qrItems = [
  // 2 Device Readers
  {
    filename: 'qr_device_dev001.png',
    label: 'Device Reader DEV-001',
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
    filename: 'qr_device_dev002.png',
    label: 'Device Reader DEV-002',
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
  // 3 Chemical Strips
  {
    filename: 'qr_strip_124_moderate.png',
    label: 'Chemical Coupon STRIP-2026-000124 (Moderate 19.6 ppm*h)',
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
      timestamp: '2026-09-08T18:30:00Z'
    }
  },
  {
    filename: 'qr_strip_125_critical.png',
    label: 'Chemical Coupon STRIP-2026-000125 (Critical 28.4 ppm*h)',
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
      timestamp: '2026-09-08T20:15:00Z'
    }
  },
  {
    filename: 'qr_strip_126_nominal.png',
    label: 'Chemical Coupon STRIP-2026-000126 (Safe 4.2 ppm*h)',
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
      timestamp: '2026-09-08T22:00:00Z'
    }
  }
];

const publicDir = path.resolve(process.cwd(), 'public/qr-codes');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateQRs() {
  console.log('Generating 5 labeled QR Code PNG files...');
  for (const item of qrItems) {
    const filePath = path.join(publicDir, item.filename);
    const content = JSON.stringify(item.payload);
    await QRCode.toFile(filePath, content, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    console.log(`✓ Generated ${item.filename} -> ${filePath}`);
  }
  console.log('All 5 QR Code PNGs generated successfully!');
}

generateQRs().catch(console.error);

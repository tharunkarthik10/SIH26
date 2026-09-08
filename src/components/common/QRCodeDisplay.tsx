import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Cpu, Tag } from 'lucide-react';

interface QRCodeDisplayProps {
  id: string;
  type: 'device' | 'strip';
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subText?: string;
  value?: string | object;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  id,
  type,
  label,
  size = 'md',
  subText,
  value
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  const isDevice = type === 'device';

  const sizeClasses = {
    sm: 'w-28 p-2 text-xs',
    md: 'w-40 p-3 text-xs',
    lg: 'w-52 p-4 text-sm',
    xl: 'w-64 p-5 text-sm'
  }[size];

  const qrBoxSize = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-44 h-44',
    xl: 'w-56 h-56'
  }[size];

  useEffect(() => {
    let rawContent = '';

    if (value) {
      rawContent = typeof value === 'string' ? value : JSON.stringify(value);
    } else {
      // Standard JSON payload embedded inside the QR code for instant parsing by camera
      const payload = {
        type: 'sih_h2s_telemetry',
        id,
        targetType: type,
        deviceId: isDevice ? id : 'DEV-001',
        stripId: isDevice ? 'STRIP-2026-000124' : id,
        exposurePpmH: isDevice ? 19.6 : 14.2,
        opticalReading: isDevice ? 0.42 : 0.55,
        timestamp: new Date().toISOString(),
        workerId: 'WRK-1002',
        workerName: 'Rajesh Kumar'
      };
      rawContent = JSON.stringify(payload);
    }

    QRCode.toDataURL(rawContent, {
      margin: 1,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        setQrDataUrl(url);
        setHasError(false);
      })
      .catch((err) => {
        console.error('Failed to generate real QR code:', err);
        setHasError(true);
      });
  }, [id, type, value, isDevice]);

  return (
    <div className={`industrial-card flex flex-col items-center justify-center text-center bg-white border border-slate-200 shadow-sm ${sizeClasses}`}>
      <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px] uppercase tracking-wider mb-1.5">
        {isDevice ? <Cpu className="w-3.5 h-3.5 text-sky-600" /> : <Tag className="w-3.5 h-3.5 text-amber-600" />}
        <span>{label || (isDevice ? 'Reader Unit QR' : 'Chemical Strip QR')}</span>
      </div>

      {/* Real High-Resolution Scannable QR Code Image */}
      <div className={`${qrBoxSize} bg-white p-1.5 rounded-xl flex items-center justify-center relative shadow-inner border border-slate-200/90 overflow-hidden`}>
        {qrDataUrl && !hasError ? (
          <img 
            src={qrDataUrl} 
            alt={`Scannable QR for ${id}`} 
            className="w-full h-full object-contain rounded-lg transition-transform hover:scale-105" 
          />
        ) : (
          <div className="text-[10px] text-slate-400 font-mono flex flex-col items-center justify-center p-2">
            <span>Rendering QR...</span>
          </div>
        )}
      </div>

      <div className="mt-2 font-mono font-bold text-slate-900 tracking-wider text-xs">
        {id}
      </div>
      {subText && (
        <div className="text-[10px] text-slate-500 font-mono mt-0.5 leading-snug max-w-[200px]">
          {subText}
        </div>
      )}
    </div>
  );
};

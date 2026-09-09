import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, Upload, CheckCircle2, AlertCircle, Sparkles, Volume2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export interface ScannedQRResult {
  deviceId: string;
  stripId: string;
  exposurePpmH: number;
  opticalReading: number;
  timestamp: string;
  workerId?: string;
  workerName?: string;
  source: 'camera_scan';
  rawData?: string;
  targetType?: 'device' | 'strip';
}

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: ScannedQRResult) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Play Web Audio Chime on QR scan success
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.35);

      if (navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {
      // Audio fallback silent
    }
  };

  // Process decoded text string into structured telemetry object
  const processDecodedString = useCallback((codeText: string) => {
    try {
      let parsed: any = null;
      try {
        parsed = JSON.parse(codeText);
      } catch {
        parsed = null;
      }

      let result: ScannedQRResult;

      if (parsed && typeof parsed === 'object') {
        const isDevice = parsed.type === 'sih_h2s_device' || parsed.targetType === 'device';
        result = {
          deviceId: parsed.deviceId || parsed.id || 'DEV-0081',
          stripId: parsed.stripId || (isDevice ? 'N/A' : 'STRIP-2026-000124'),
          exposurePpmH: typeof parsed.exposurePpmH === 'number' ? parsed.exposurePpmH : (typeof parsed.estimatedExposure === 'number' ? parsed.estimatedExposure : 4.2),
          opticalReading: typeof parsed.opticalReading === 'number' ? parsed.opticalReading : (isDevice ? 0.99 : 0.77),
          timestamp: parsed.timestamp || new Date().toISOString(),
          workerId: parsed.workerId || parsed.assignedWorkerId || 'WRK-00124',
          workerName: parsed.workerName || parsed.assignedWorkerName || 'Rajesh Kumar',
          source: 'camera_scan',
          rawData: codeText,
          targetType: isDevice ? 'device' : 'strip'
        };
      } else {
        // Plain string QR code fallback
        const isDeviceStr = codeText.toLowerCase().includes('dev');
        const isStripStr = codeText.toLowerCase().includes('strip');

        result = {
          deviceId: isDeviceStr ? codeText : 'DEV-0081',
          stripId: isStripStr ? codeText : 'STRIP-2026-000124',
          exposurePpmH: 4.2,
          opticalReading: 0.77,
          timestamp: new Date().toISOString(),
          workerId: 'WRK-00124',
          workerName: 'Rajesh Kumar',
          source: 'camera_scan',
          rawData: codeText,
          targetType: isDeviceStr ? 'device' : 'strip'
        };
      }

      playSuccessChime();
      setScannedFeedback(`Successfully scanned: ${result.deviceId} (${result.exposurePpmH} ppm·h)`);

      setTimeout(() => {
        onScanSuccess(result);
        onClose();
      }, 600);

    } catch (err) {
      console.error('Error processing scanned QR code:', err);
    }
  }, [onScanSuccess, onClose]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScannedFeedback(null);

    // Stop any existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access or upload a photo of the QR code.'
          : 'Live camera stream unavailable on this device. You can upload a photo of the Demo QR code below.'
      );
      setIsScanning(false);
    }
  }, [facingMode, stream]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  }, [stream]);

  // Live Canvas 30 FPS Frame Decoding Loop
  useEffect(() => {
    let animId: number;

    const scanFrame = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animId = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          setIsScanning(false); // Stop scanning loop once detected
          processDecodedString(code.data);
          return;
        }
      }

      animId = requestAnimationFrame(scanFrame);
    };

    if (isOpen && isScanning) {
      animId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, isScanning, processDecodedString]);

  // Handle open/close modal lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            processDecodedString(code.data);
          } else {
            alert('No valid H₂S Telemetry QR code found in uploaded image. Please ensure the QR code is clearly visible.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Photograph Camera QR Scanner"
      subtitle="Point mobile camera at Demo QR Code to read telemetry"
      maxWidth="md"
    >
      <div className="space-y-4 font-sans text-xs">
        
        {/* Hidden Canvas for Frame Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Viewport Container */}
        <div className="relative w-full aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800 flex items-center justify-center">
          
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
            muted
            playsInline
          />

          {/* Scanning Overlay Reticle */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              
              {/* Outer Viewfinder Box */}
              <div className="w-56 h-56 border-2 border-emerald-400/90 rounded-2xl relative shadow-lg shadow-emerald-500/10 flex items-center justify-center overflow-hidden">
                
                {/* Corner Targets */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Animated Pulsing Laser Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-md shadow-emerald-400/80 animate-scan-line" />
              </div>

              <span className="mt-3 px-3 py-1 bg-slate-900/80 backdrop-blur text-emerald-400 font-mono text-[10px] rounded-full border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Scanning live camera feed...
              </span>
            </div>
          )}

          {/* Camera Access Error Fallback State */}
          {cameraError && (
            <div className="p-6 text-center text-slate-300 space-y-3 max-w-xs">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{cameraError}</p>
            </div>
          )}

          {/* Scanned Success Overlay */}
          {scannedFeedback && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur flex flex-col items-center justify-center text-white p-6 text-center space-y-2 animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <div className="font-bold text-sm text-emerald-100">{scannedFeedback}</div>
              <div className="text-[10px] text-emerald-300 font-mono">Telemetry successfully retrieved!</div>
            </div>
          )}

          {/* Floating Camera Controls Header */}
          {!cameraError && (
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={toggleFacingMode}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 backdrop-blur border border-slate-700 transition-all"
                title="Switch Camera (Front / Rear)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Controls & Photo Upload Option */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200"
          >
            <Upload className="w-4 h-4 text-sky-600" />
            <span>Upload QR Photo / Screenshot</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-[11px] text-sky-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            <span>How to test mobile camera scan:</span>
          </div>
          <p className="opacity-90">
            Open the <strong>Demo QR Codes</strong> menu in this web app on a laptop/second screen, point your mobile phone camera at it, and the camera will decode the H₂S telemetry instantly!
          </p>
        </div>

      </div>
    </Modal>
  );
};

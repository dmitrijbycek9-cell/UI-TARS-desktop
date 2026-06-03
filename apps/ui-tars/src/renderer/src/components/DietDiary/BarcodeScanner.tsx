import { useEffect, useRef, useState } from 'react';
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from '@zxing/browser';
import { Camera, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';

interface BarcodeScannerProps {
  open: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ open, onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setInitializing(true);

    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    const startScanning = async () => {
      if (!videoRef.current) return;
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (stopped) return;
            if (result) {
              stopped = true;
              controls?.stop();
              onScan(result.getText());
            }
            if (err && err.name !== 'NotFoundException') {
              // NotFoundException fires continuously when no barcode is in frame — ignore it
            }
          },
        );
        controlsRef.current = controls;
        setInitializing(false);
      } catch (e) {
        setInitializing(false);
        if (
          e instanceof Error &&
          (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')
        ) {
          setError('Kamera-Zugriff verweigert. Bitte Berechtigungen prüfen.');
        } else {
          setError('Kamera konnte nicht gestartet werden.');
        }
      }
    };

    startScanning();

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Barcode scannen
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-video object-cover"
            muted
            playsInline
          />

          {/* Scan overlay */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-32">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white" />
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500/70 animate-pulse" />
              </div>
            </div>
          )}

          {initializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Kamera wird gestartet...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
              <div className="flex flex-col items-center gap-3 text-center text-white">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Barcode in den Rahmen halten
          </p>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

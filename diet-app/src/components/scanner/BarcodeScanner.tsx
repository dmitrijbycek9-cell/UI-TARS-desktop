import { useEffect, useRef, useState } from 'react';
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from '@zxing/browser';
import { Spinner } from '@/components/ui';
import { t } from '@/i18n/de';

/** Live-Kamera-Scanner für Strich- und QR-Codes (ZXing). */
export function BarcodeScanner({
  onDetected,
  onError,
}: {
  onDetected: (barcode: string) => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let controls: IScannerControls | null = null;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    async function start() {
      if (!videoRef.current) return;
      try {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => {
            if (result && !cancelled) {
              cancelled = true;
              controls?.stop();
              onDetected(result.getText());
            }
          },
        );
        if (!cancelled) setStarting(false);
      } catch (err) {
        const name = (err as DOMException)?.name;
        if (name === 'NotAllowedError' || name === 'NotReadableError') {
          onError(t.scanner.permissionDenied);
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          onError(t.scanner.noCamera);
        } else {
          onError(t.scanner.permissionDenied);
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        playsInline
      />
      {starting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
          <Spinner className="border-white/40 border-t-white" />
          <p className="text-sm">{t.scanner.starting}</p>
        </div>
      )}
      {/* Sucherrahmen */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-2/3 w-4/5 rounded-xl border-2 border-white/80 shadow-[0_0_0_2000px_rgba(0,0,0,0.25)]" />
      </div>
    </div>
  );
}

import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Field, Input, Spinner } from '@/components/ui';
import { t } from '@/i18n/de';

// zxing ist groß – nur laden, wenn wirklich gescannt wird
const BarcodeScanner = lazy(() =>
  import('@/components/scanner/BarcodeScanner').then((m) => ({
    default: m.BarcodeScanner,
  })),
);

export default function ScannerPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');

  function handleDetected(barcode: string) {
    navigate(`/product/${encodeURIComponent(barcode)}`);
  }

  function handleError(message: string) {
    setError(message);
    setScanning(false);
  }

  function lookupManual() {
    const code = manualCode.trim();
    if (code) navigate(`/product/${encodeURIComponent(code)}`);
  }

  return (
    <div>
      <PageHeader title={t.scanner.title} />
      <div className="space-y-4 p-4">
        {scanning && !error ? (
          <>
            <Card className="!p-3">
              <Suspense
                fallback={
                  <div className="flex aspect-square items-center justify-center rounded-2xl bg-black">
                    <Spinner className="border-white/40 border-t-white" />
                  </div>
                }
              >
                <BarcodeScanner
                  onDetected={handleDetected}
                  onError={handleError}
                />
              </Suspense>
              <p className="mt-3 text-center text-sm text-slate-500">
                {t.scanner.hint}
              </p>
            </Card>
            <p className="text-center text-xs text-slate-400">
              {t.scanner.desktopHint}
            </p>
          </>
        ) : (
          <Card className="space-y-3 text-center">
            <p className="text-4xl">📷</p>
            <p className="text-sm text-slate-600">
              {error ?? t.scanner.permissionDenied}
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setError(null);
                setScanning(true);
              }}
            >
              {t.scanner.scanAgain}
            </Button>
          </Card>
        )}

        <Card className="space-y-3">
          <Field label={t.scanner.enterBarcode}>
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              inputMode="numeric"
              placeholder="z. B. 4311501668412"
              onKeyDown={(e) => e.key === 'Enter' && lookupManual()}
            />
          </Field>
          <Button className="w-full" onClick={lookupManual}>
            {t.scanner.lookup}
          </Button>
        </Card>
      </div>
    </div>
  );
}

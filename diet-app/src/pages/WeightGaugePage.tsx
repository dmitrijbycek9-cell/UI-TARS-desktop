import { useRef, useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Spinner } from '@/components/ui';
import { t } from '@/i18n/de';
import { db } from '@/db/db';
import { useUiStore } from '@/stores/useUiStore';
import {
  estimateWeightFromImage,
  getConfidenceTolerancePercent,
} from '@/lib/googleVision';

export default function WeightGaugePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useUiStore((s) => s.showToast);

  const [apiKey, setApiKey] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(
    'medium',
  );
  const [adjustedWeight, setAdjustedWeight] = useState(100);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    db.settings.get('googleVisionApiKey').then((key) => {
      if (key?.value) setApiKey(key.value);
    });
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      showToast('Kamera nicht verfügbar', 'error');
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  }

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);

    setCapturedImage(imageBase64);
    stopCamera();
    await estimateWeight(imageBase64);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageBase64 = event.target?.result as string;
      setCapturedImage(imageBase64);
      await estimateWeight(imageBase64);
    };
    reader.readAsDataURL(file);
  }

  async function estimateWeight(imageBase64: string) {
    if (!apiKey) {
      showToast(t.gauge.apiKeyRequired, 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await estimateWeightFromImage(imageBase64, apiKey);
      setEstimatedWeight(result.weight);
      setConfidence(result.confidence);
      setAdjustedWeight(result.weight);
      showToast(`Gewicht geschätzt: ${result.weight}g`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t.gauge.apiError;
      showToast(message, 'error');
      setEstimatedWeight(null);
    } finally {
      setLoading(false);
    }
  }

  function resetEstimation() {
    setEstimatedWeight(null);
    setCapturedImage(null);
    setLoading(false);
    startCamera();
  }

  const tolerance = getConfidenceTolerancePercent(confidence);
  const minWeight = Math.max(10, Math.round(estimatedWeight! * (1 - tolerance / 100)));
  const maxWeight = Math.min(500, Math.round(estimatedWeight! * (1 + tolerance / 100)));

  return (
    <div>
      <PageHeader title={t.gauge.title} />
      <div className="space-y-4 p-4 pb-28">
        {!apiKey ? (
          <Card className="space-y-3 text-center">
            <p className="text-sm text-slate-600">{t.gauge.apiKeyRequired}</p>
            <p className="text-xs text-slate-500">
              {t.gauge.setupInstructions}
            </p>
            <Button variant="secondary" className="w-full" onClick={() => {}}>
              {t.common.back}
            </Button>
          </Card>
        ) : estimatedWeight === null ? (
          <Card className="space-y-3">
            {cameraActive ? (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl bg-slate-900"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={stopCamera}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button className="flex-1" onClick={capturePhoto}>
                    {t.gauge.takePicture}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-8">
                <p className="text-3xl">📷</p>
                <p className="text-sm text-slate-600">
                  Fotografiere das Objekt für die Gewichtsschätzung
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Datei
                  </Button>
                  <Button className="flex-1" onClick={startCamera}>
                    {t.gauge.takePicture}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </Card>
        ) : (
          <Card className="space-y-4">
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-xl"
              />
            )}

            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">
                {t.gauge.estimatedWeight}
              </p>
              <p className="text-5xl font-bold text-brand-600">
                {adjustedWeight}g
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {t.gauge.accuracy}
                {tolerance}% ({minWeight}-{maxWeight}g)
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={minWeight}
                max={maxWeight}
                value={adjustedWeight}
                onChange={(e) => setAdjustedWeight(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 text-center">
                {t.gauge.adjustRange}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={resetEstimation}
              >
                {t.common.cancel}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  showToast(`${adjustedWeight}g kopiert`, 'success');
                  navigator.clipboard.writeText(adjustedWeight.toString());
                }}
              >
                {t.gauge.copy}
              </Button>
            </div>
          </Card>
        )}

        {loading && (
          <Card className="flex flex-col items-center justify-center gap-3 py-8">
            <Spinner />
            <p className="text-sm text-slate-600">{t.gauge.estimating}</p>
          </Card>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

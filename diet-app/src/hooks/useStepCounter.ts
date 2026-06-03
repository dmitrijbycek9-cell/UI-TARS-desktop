import { useCallback, useEffect, useRef, useState } from 'react';
import { StepDetector } from '@/lib/steps';

interface DeviceMotionEventConstructor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** Prüft, ob der Browser einen Bewegungssensor (DeviceMotion) bereitstellt. */
export function isMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/**
 * Live-Schrittzähler über den Beschleunigungssensor.
 * Liefert die seit Start gezählten Schritte; persistieren übernimmt der Aufrufer.
 */
export function useStepCounter() {
  const [running, setRunning] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const detector = useRef(new StepDetector());

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
    if (detector.current.process(acc.x, acc.y, acc.z, event.timeStamp)) {
      setSessionSteps((s) => s + 1);
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!isMotionSupported()) {
      setError('Bewegungssensor nicht verfügbar.');
      return;
    }
    // iOS verlangt eine explizite Berechtigung per Nutzergeste
    const DME = window.DeviceMotionEvent as unknown as DeviceMotionEventConstructor;
    if (typeof DME.requestPermission === 'function') {
      try {
        const res = await DME.requestPermission();
        if (res !== 'granted') {
          setError('Zugriff auf den Bewegungssensor wurde abgelehnt.');
          return;
        }
      } catch {
        setError('Zugriff auf den Bewegungssensor wurde abgelehnt.');
        return;
      }
    }
    detector.current.reset();
    window.addEventListener('devicemotion', handleMotion);
    setRunning(true);
  }, [handleMotion]);

  const stop = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setRunning(false);
  }, [handleMotion]);

  useEffect(() => {
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [handleMotion]);

  return { running, sessionSteps, error, start, stop };
}

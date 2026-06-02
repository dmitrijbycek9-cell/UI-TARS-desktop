import { roundTo } from './nutrition';

/** Geschätzte Schrittlänge in Metern aus der Körpergröße. */
export function strideMeters(heightCm: number): number {
  return (heightCm * 0.415) / 100;
}

/** Zurückgelegte Strecke in Kilometern. */
export function stepsToKm(steps: number, heightCm: number): number {
  return roundTo((steps * strideMeters(heightCm)) / 1000, 2);
}

/** Durch Gehen verbrannte Kalorien (~0,5 kcal pro kg pro km). */
export function stepCalories(
  steps: number,
  heightCm: number,
  weightKg: number,
): number {
  const km = stepsToKm(steps, heightCm);
  return roundTo(km * weightKg * 0.5, 0);
}

/**
 * Einfacher Schritt-Detektor auf Basis der Beschleunigungs-Magnitude.
 * Geglättet + adaptive Peak-Erkennung mit Refraktärzeit gegen Doppelzählung.
 */
export class StepDetector {
  private smoothed = 9.81; // Startwert ~ Erdbeschleunigung
  private lastStepAt = 0;
  private wasAbove = false;
  private readonly refractoryMs = 250;
  private readonly alpha = 0.3; // Glättungsfaktor (Tiefpass)
  private readonly thresholdDelta = 1.2; // m/s² über der Baseline

  /** Verarbeitet eine Beschleunigungsmessung; gibt true zurück, wenn ein Schritt erkannt wurde. */
  process(x: number, y: number, z: number, timestamp: number): boolean {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    // gleitender Mittelwert als dynamische Baseline
    this.smoothed = this.smoothed + this.alpha * (magnitude - this.smoothed);
    const threshold = this.smoothed + this.thresholdDelta;

    let stepDetected = false;
    if (magnitude > threshold) {
      if (
        !this.wasAbove &&
        timestamp - this.lastStepAt > this.refractoryMs
      ) {
        stepDetected = true;
        this.lastStepAt = timestamp;
      }
      this.wasAbove = true;
    } else {
      this.wasAbove = false;
    }
    return stepDetected;
  }

  reset(): void {
    this.smoothed = 9.81;
    this.lastStepAt = 0;
    this.wasAbove = false;
  }
}

/** MET-Werte für gängige Trainingsarten. */
export const MET_VALUES: Record<string, number> = {
  Laufen: 9.8,
  Joggen: 7.0,
  Radfahren: 7.5,
  Krafttraining: 5.0,
  Schwimmen: 8.0,
  Yoga: 2.5,
  Gehen: 3.5,
  Wandern: 6.0,
  Tanzen: 5.0,
  Sonstiges: 4.0,
};

export const WORKOUT_TYPES = Object.keys(MET_VALUES);

/** Verbrannte Kalorien über MET: MET × kg × Stunden. */
export function workoutCalories(
  type: string,
  durationMin: number,
  weightKg: number,
): number {
  const met = MET_VALUES[type] ?? MET_VALUES.Sonstiges;
  return roundTo(met * weightKg * (durationMin / 60), 0);
}

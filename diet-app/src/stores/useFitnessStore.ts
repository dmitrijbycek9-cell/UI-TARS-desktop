import { create } from 'zustand';
import { db } from '@/db/db';
import type { StepRecord, Workout } from '@/types';
import { stepCalories } from '@/lib/steps';

interface FitnessState {
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  removeWorkout: (id: string) => Promise<void>;
  setSteps: (
    dateKey: string,
    steps: number,
    goal: number,
    heightCm: number,
    weightKg: number,
  ) => Promise<void>;
}

export const useFitnessStore = create<FitnessState>(() => ({
  async addWorkout(workout) {
    await db.workouts.add({
      ...workout,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    });
  },
  async removeWorkout(id) {
    await db.workouts.delete(id);
  },
  async setSteps(dateKey, steps, goal, heightCm, weightKg) {
    const record: StepRecord = {
      dateKey,
      steps: Math.max(0, Math.round(steps)),
      goal,
      caloriesBurned: stepCalories(steps, heightCm, weightKg),
      updatedAt: Date.now(),
    };
    await db.steps.put(record);
  },
}));

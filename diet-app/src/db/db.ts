import Dexie, { type Table } from 'dexie';
import type {
  DiaryEntry,
  Product,
  Recipe,
  StepRecord,
  UserProfile,
  Workout,
  Setting,
} from '@/types';

export class DietDatabase extends Dexie {
  products!: Table<Product, string>;
  diaryEntries!: Table<DiaryEntry, string>;
  recipes!: Table<Recipe, string>;
  profile!: Table<UserProfile, string>;
  workouts!: Table<Workout, string>;
  steps!: Table<StepRecord, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('dietApp');
    this.version(1).stores({
      products: 'barcode, name',
      diaryEntries: 'id, dateKey, [dateKey+meal]',
      recipes: 'id, name, category, isSeed',
      profile: 'id',
      workouts: 'id, dateKey',
      steps: 'dateKey',
      settings: 'id',
    });
  }
}

export const db = new DietDatabase();

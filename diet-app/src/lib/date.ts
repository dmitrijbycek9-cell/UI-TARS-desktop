import { addDays, format, isToday as dfnsIsToday, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

/** 'YYYY-MM-DD' Schlüssel für einen Tag (lokale Zeit). */
export function dateKeyOf(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayKey(): string {
  return dateKeyOf(new Date());
}

export function shiftKey(key: string, days: number): string {
  return dateKeyOf(addDays(parseISO(key), days));
}

export function isTodayKey(key: string): boolean {
  return dfnsIsToday(parseISO(key));
}

/** Hübsche, deutsche Anzeige eines Datumsschlüssels, z. B. "Mo., 2. Juni 2026". */
export function formatKeyLong(key: string): string {
  return format(parseISO(key), 'EEE, d. MMMM yyyy', { locale: de });
}

export function formatKeyShort(key: string): string {
  return format(parseISO(key), 'd. MMM', { locale: de });
}

import { formatKeyLong, isTodayKey, shiftKey, todayKey } from '@/lib/date';
import { useUiStore } from '@/stores/useUiStore';

export function DateSwitcher() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);
  const isToday = isTodayKey(selectedDate);

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={() => setSelectedDate(shiftKey(selectedDate, -1))}
        className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-200"
        aria-label="Vorheriger Tag"
      >
        ←
      </button>
      <button
        onClick={() => setSelectedDate(todayKey())}
        className="flex-1 text-center"
      >
        <span className="block text-sm font-semibold text-slate-700">
          {isToday ? 'Heute' : formatKeyLong(selectedDate)}
        </span>
        {isToday && (
          <span className="block text-xs text-slate-400">
            {formatKeyLong(selectedDate)}
          </span>
        )}
      </button>
      <button
        onClick={() => setSelectedDate(shiftKey(selectedDate, 1))}
        className="rounded-full px-3 py-1.5 text-slate-500 hover:bg-slate-200"
        aria-label="Nächster Tag"
      >
        →
      </button>
    </div>
  );
}

import { clsx } from 'clsx';
import { useUiStore } from '@/stores/useUiStore';

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[60] flex flex-col items-center gap-2 px-4 pt-safe">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg',
            toast.type === 'success' && 'bg-brand-600 text-white',
            toast.type === 'error' && 'bg-red-600 text-white',
            toast.type === 'info' && 'bg-slate-800 text-white',
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

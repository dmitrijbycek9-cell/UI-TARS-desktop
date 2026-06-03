import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/25 hover:from-brand-600 hover:to-brand-700',
        variant === 'secondary' &&
          'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        variant === 'danger' && 'bg-red-50 text-red-600 hover:bg-red-100',
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'rounded-3xl bg-white/90 p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] ring-1 ring-slate-200/60 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border-0 bg-slate-100 px-3.5 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(inputClass, props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(inputClass, 'appearance-none', props.className)}
    />
  );
}

export function ProgressBar({
  value,
  max,
  className,
  color = 'brand',
}: {
  value: number;
  max: number;
  className?: string;
  color?: 'brand' | 'amber' | 'sky' | 'rose';
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;
  return (
    <div
      className={clsx('h-2.5 w-full overflow-hidden rounded-full bg-slate-200', className)}
    >
      <div
        className={clsx(
          'h-full rounded-full transition-all',
          over && 'bg-red-500',
          !over && color === 'brand' && 'bg-brand-500',
          !over && color === 'amber' && 'bg-amber-500',
          !over && color === 'sky' && 'bg-sky-500',
          !over && color === 'rose' && 'bg-rose-500',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <p className="font-medium text-slate-600">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-400">{children}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600',
        className,
      )}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

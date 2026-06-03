import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 px-4 pb-3 pt-safe backdrop-blur-xl">
      <div className="flex items-center gap-3 pt-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-lg text-slate-500 hover:bg-slate-100"
            aria-label="Zurück"
          >
            ←
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

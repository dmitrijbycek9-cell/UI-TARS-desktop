import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { t } from '@/i18n/de';

const items = [
  { to: '/', label: t.nav.diary, icon: '📖', end: true },
  { to: '/rezepte', label: t.nav.recipes, icon: '🍳', end: false },
  { to: '/scan', label: t.nav.scan, icon: '📷', end: false, center: true },
  { to: '/fitness', label: t.nav.fitness, icon: '🏃', end: false },
  { to: '/profil', label: t.nav.profile, icon: '👤', end: false },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
                isActive ? 'text-brand-600' : 'text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'flex items-center justify-center rounded-full text-lg transition',
                    item.center && 'h-11 w-11 -mt-5 bg-brand-600 text-xl shadow-lg shadow-brand-600/30',
                    item.center && 'text-white',
                    !item.center && isActive && 'scale-110',
                  )}
                >
                  {item.icon}
                </span>
                <span className={clsx(item.center && 'mt-0.5')}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

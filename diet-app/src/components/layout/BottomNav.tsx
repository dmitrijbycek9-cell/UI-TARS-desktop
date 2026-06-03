import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { t } from '@/i18n/de';

const items = [
  { to: '/', label: t.nav.diary, icon: '📖', end: true },
  { to: '/rezepte', label: t.nav.recipes, icon: '🍳', end: false },
  { to: '/scan', label: t.nav.scan, icon: '📷', end: false, center: true },
  { to: '/fitness', label: t.nav.fitness, icon: '🏃', end: false },
  { to: '/waage', label: t.nav.gauge, icon: '⚖️', end: false },
  { to: '/profil', label: t.nav.profile, icon: '👤', end: false },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-white/60 bg-white/80 pb-safe backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
                item.center
                  ? 'text-brand-700'
                  : isActive
                    ? 'text-brand-600'
                    : 'text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'flex items-center justify-center transition',
                    item.center
                      ? 'nav-glow -mt-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-2xl text-white'
                      : clsx(
                          'h-9 w-9 rounded-xl text-lg',
                          isActive && 'scale-110 bg-brand-50',
                        ),
                  )}
                >
                  {item.icon}
                </span>
                <span className={clsx(item.center && 'mt-0.5 font-semibold')}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

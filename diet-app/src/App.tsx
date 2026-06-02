import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toasts } from '@/components/layout/Toasts';

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-50">
      <Toasts />
      <main className="flex-1 pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

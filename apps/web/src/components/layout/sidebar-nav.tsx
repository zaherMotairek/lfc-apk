import { Link, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import type { NavItem } from './nav-config';

type SidebarNavProps = {
  title: string;
  subtitle: string;
  items: NavItem[];
  footer?: React.ReactNode;
};

export function MobileDrawer({
  title,
  subtitle,
  items,
  footer,
  open,
  onClose,
}: SidebarNavProps & { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed bottom-0 left-0 top-0 z-[70] flex w-72 flex-col overflow-y-auto p-5 text-white shadow-2xl md:hidden"
        style={{
          background: 'linear-gradient(180deg, #101418 0%, #1a222d 100%)',
          animation: 'drawer-slide-in 0.22s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="text-lg font-extrabold">{title}</div>
            <div className="mt-1 text-xs text-white/50">{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 text-sm">
          {items.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3 font-semibold text-white'
                  : 'flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 transition hover:bg-white/10 hover:text-white'
              }
            >
              {link.icon ? <span className="text-base">{link.icon}</span> : null}
              {link.label}
            </NavLink>
          ))}
        </nav>
        {footer ? <div className="mt-6 border-t border-white/10 pt-6">{footer}</div> : null}
      </aside>
      <style>{`@keyframes drawer-slide-in{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </>
  );
}

export function SidebarNav({ title, subtitle, items, footer }: SidebarNavProps) {
  return (
    <aside className="kop-gradient-dark flex flex-col p-5 text-white md:min-h-screen">
      <div className="mb-6">
        <div className="text-lg font-extrabold">{title}</div>
        <div className="mt-1 text-xs text-white/50">{subtitle}</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 text-sm">
        {items.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3 font-semibold text-white'
                : 'flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 transition hover:bg-white/10 hover:text-white'
            }
          >
            {link.icon ? <span className="text-base">{link.icon}</span> : null}
            {link.label}
          </NavLink>
        ))}
      </nav>
      {footer ? <div className="mt-6 border-t border-white/10 pt-6">{footer}</div> : null}
    </aside>
  );
}

type MobileTabBarProps = {
  items: NavItem[];
};

export function MobileTabBar({ items }: MobileTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-ink/95 px-1 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(16,20,24,0.35)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {items.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive
                ? 'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl bg-white/10 px-1 py-2 text-[10px] font-semibold text-white'
                : 'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold text-white/60'
            }
          >
            <span className="text-sm">{link.icon}</span>
            <span className="truncate">{link.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

type HorizontalNavProps = {
  items: NavItem[];
};

export function HorizontalNav({ items }: HorizontalNavProps) {
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto border-b border-black/5 bg-surface px-4 py-2 md:hidden">
      {items.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            isActive
              ? 'shrink-0 rounded-full bg-lfc-red px-4 py-2 text-xs font-bold text-white'
              : 'shrink-0 rounded-full bg-black/5 px-4 py-2 text-xs font-semibold text-black/60'
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function NavFooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}

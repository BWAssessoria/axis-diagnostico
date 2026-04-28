'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { LayoutDashboard, TrendingUp, FileText, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const nav = [
  { label: 'Dashboard',  href: '/portal',         icon: LayoutDashboard, exact: true },
  { label: 'Métricas',   href: '/portal/metrics',  icon: TrendingUp },
  { label: 'Relatórios', href: '/portal/reports',  icon: FileText },
];

function NavItem({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{ background: 'var(--bronze)' }}
        />
      )}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
          active ? 'text-[var(--bronze)]' : 'text-muted-foreground group-hover:text-foreground'
        )}
        style={active ? { background: 'var(--bronze-glow)' } : {}}
      >
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="flex-1">{item.label}</span>
      {active && <ChevronRight size={14} className="text-muted-foreground/50" />}
    </Link>
  );
}

export default function PortalSidebar({ clientName }) {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-30"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(240,200,32,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative px-6 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black"
            style={{
              background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
              color: '#fff',
              boxShadow: '0 2px 12px rgba(240,200,32,0.42)',
            }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground leading-none">
              AXIS <span style={{ color: 'var(--bronze)' }}>360</span>
            </p>
            {clientName ? (
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-none truncate max-w-[130px]">
                {clientName}
              </p>
            ) : (
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-none">Portal do cliente</p>
            )}
          </div>
        </div>
      </div>

      <Separator className="mb-4 opacity-50" />

      <div className="px-5 mb-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Menu</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return <NavItem key={item.href} item={item} active={active} />;
        })}
      </nav>

      <div className="px-3 pb-5">
        <Separator className="mb-4 opacity-50" />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
              <LogOut size={16} strokeWidth={2} />
            </span>
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

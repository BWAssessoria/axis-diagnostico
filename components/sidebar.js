'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import {
  LayoutGrid, Package, BarChart2, LogOut,
  UserPlus, Plus, AlertTriangle, RefreshCw,
  ChevronDown, ChevronRight, Zap, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';

const NAV_GROUPS = [
  {
    section: 'Principal',
    items: [
      {
        label: 'Carteira',
        href: '/admin',
        icon: LayoutGrid,
        exact: true,
        children: [
          { label: 'Novo cliente', href: '/admin/clients/new', icon: UserPlus },
        ],
      },
    ],
  },
  {
    section: 'Plataforma',
    items: [
      {
        label: 'Produtos',
        href: '/admin/products',
        icon: Package,
        children: [
          { label: 'Novo produto', href: '/admin/products/new', icon: Plus },
        ],
      },
      {
        label: 'Custos de IA',
        href: '/admin/usage',
        icon: BarChart2,
      },
    ],
  },
  {
    section: 'Ferramentas',
    items: [
      {
        label: 'Anomalias',
        href: '/api/anomaly-check',
        icon: AlertTriangle,
        external: true,
      },
      {
        label: 'Sync PGM Global',
        href: '/api/sync-pgm-all',
        icon: RefreshCw,
        external: true,
      },
    ],
  },
];

function SubItem({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md py-1.5 pl-11 pr-3 text-xs transition-all duration-150',
        active
          ? 'font-medium text-foreground'
          : 'text-muted-foreground/70 hover:text-muted-foreground hover:bg-secondary/40'
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
      {item.label}
    </Link>
  );
}

function NavItem({ item, pathname }) {
  const Icon  = item.icon;
  const exact = item.exact ?? false;
  const active = exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/') || pathname.startsWith(item.href + '?');

  const hasChildren = !!item.children?.length;
  const anyChildActive = item.children?.some((c) => pathname === c.href);
  const [open, setOpen] = useState(active || anyChildActive);

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/60 transition-all duration-150 hover:bg-secondary/40 hover:text-muted-foreground"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
          <Icon size={14} strokeWidth={2} />
        </span>
        <span className="flex-1 text-xs">{item.label}</span>
        <Zap size={10} className="opacity-40" />
      </a>
    );
  }

  return (
    <div>
      <div className="relative">
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full"
            style={{ background: 'var(--bronze)' }}
          />
        )}
        <div className="flex items-center">
          <Link
            href={item.href}
            className={cn(
              'group relative flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                active ? 'text-[var(--bronze)]' : 'text-muted-foreground group-hover:text-foreground'
              )}
              style={active ? { background: 'var(--bronze-glow)' } : {}}
            >
              <Icon size={15} strokeWidth={2} />
            </span>
            <span className="flex-1">{item.label}</span>
          </Link>

          {hasChildren && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="mr-2 flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            >
              {open
                ? <ChevronDown size={12} />
                : <ChevronRight size={12} />
              }
            </button>
          )}
        </div>
      </div>

      {hasChildren && open && (
        <div className="mb-1 mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <SubItem key={child.href} item={child} active={pathname === child.href} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('axis-theme') || 'dark';
    setTheme(saved);
    document.documentElement.classList.toggle('light', saved === 'light');
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('axis-theme', next);
    document.documentElement.classList.toggle('light', next === 'light');
  }

  return (
    <aside className="relative flex h-screen w-60 shrink-0 flex-col border-r border-white/[0.06]" style={{ background: 'var(--bg-surface)' }}>
      {/* Top gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-25"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(240,200,32,0.15) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <div className="relative px-5 pb-5 pt-6">
        <Link href="/admin" className="flex items-center gap-2.5">
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
            <p className="text-sm font-bold leading-none tracking-tight text-foreground">
              AXIS <span style={{ color: 'var(--bronze)' }}>360</span>
            </p>
            <p className="mt-0.5 text-[10px] leading-none text-muted-foreground/60">
              Painel de gestão
            </p>
          </div>
        </Link>
      </div>

      <Separator className="mb-3 opacity-30" />

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.section} className={gi > 0 ? 'mt-5' : ''}>
            <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5">
        <Separator className="mb-3 opacity-30" />
        <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'var(--bronze-glow)', color: 'var(--bronze)', border: '1px solid var(--bronze-border)' }}
          >
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">Admin</p>
            <p className="truncate text-[10px] text-muted-foreground/60">AXIS 360</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-muted-foreground"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            {theme === 'dark' ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
          </span>
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>

        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-muted-foreground"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
              <LogOut size={14} strokeWidth={2} />
            </span>
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

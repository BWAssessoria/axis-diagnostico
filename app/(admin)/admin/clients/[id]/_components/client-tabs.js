'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ClientTabs({ id, tab, analysesCount, hasDiagnostic, hasPlan, hasAnalytics }) {
  const tabs = [
    { key: 'dashboard',  label: 'Dashboard',    show: hasAnalytics },
    { key: 'diagnostic', label: 'Diagnóstico',  badge: hasDiagnostic ? null : '!' },
    { key: 'plano',      label: 'Plano'                                             },
    { key: 'metrics',    label: 'Métricas'                                          },
    { key: 'analyses',   label: 'Análises',     badge: analysesCount > 0 ? analysesCount : null },
    { key: 'uploads',    label: 'Uploads'                                           },
  ].filter((t) => t.show !== false);

  return (
    <div
      className="flex items-end gap-0.5"
      style={{ borderBottom: '1px solid var(--axis-border)' }}
    >
      {tabs.map((t) => {
        const active = tab === t.key;
        return (
          <Link
            key={t.key}
            href={`/admin/clients/${id}?tab=${t.key}`}
            className={cn(
              'relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70'
            )}
          >
            {t.label}
            {t.badge && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={
                  t.badge === '!'
                    ? { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                    : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
                }
              >
                {t.badge}
              </span>
            )}
            {/* Active underline */}
            {active && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: 'var(--bronze)', marginBottom: '-1px' }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

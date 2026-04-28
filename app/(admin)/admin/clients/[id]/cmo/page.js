import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CmoChat from '../_components/cmo-chat';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

const BRL = (v) => v != null
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  : '—';
const PCT = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
const MONTHS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default async function CmoPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('business_name, owner_name, products(name)')
    .eq('id', id)
    .single();

  if (!client) notFound();

  const now = new Date();
  const [{ data: current }, { data: metrics }, { data: memoryRow }] = await Promise.all([
    supabase.from('metrics_monthly').select('*')
      .eq('client_id', id).eq('month', now.getMonth() + 1).eq('year', now.getFullYear())
      .maybeSingle(),
    supabase.from('metrics_monthly').select('month, year, fat_total, meta_mensal_pct')
      .eq('client_id', id).order('year', { ascending: false }).order('month', { ascending: false }).limit(4),
    supabase.from('cmo_memory').select('content').eq('client_id', id).maybeSingle(),
  ]);

  if (!process.env.ANTHROPIC_API_KEY) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={`/admin/clients/${id}`} className="transition-colors hover:text-foreground">{client.business_name}</Link>
          <ChevronRight size={14} className="opacity-40" />
          <span className="text-foreground">Agente CMO</span>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
          <p className="font-semibold text-yellow-400">Chave da API não configurada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione <code className="rounded bg-secondary px-1 py-0.5 text-yellow-300">ANTHROPIC_API_KEY</code> no arquivo{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-yellow-300">.env.local</code> para ativar o Agente CMO.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="transition-colors hover:text-foreground">Carteira</Link>
        <ChevronRight size={14} className="opacity-40" />
        <Link href={`/admin/clients/${id}`} className="transition-colors hover:text-foreground">{client.business_name}</Link>
        <ChevronRight size={14} className="opacity-40" />
        <span className="text-foreground">Agente CMO</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agente CMO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.business_name}
            {client.products?.name && (
              <> · <span style={{ color: 'var(--bronze)' }}>{client.products.name}</span></>
            )}
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5"
          style={{ border: '1px solid var(--bronze-border)', background: 'var(--bronze-glow)' }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--bronze)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--bronze)' }}>Claude Sonnet 4.6</span>
        </div>
      </div>

      {/* KPIs rápidos */}
      {(current || metrics?.length > 0) && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-border/60 p-4" style={{ background: 'var(--bg-surface)' }}>
            <p className="text-xs text-muted-foreground">Faturamento {MONTHS[now.getMonth() + 1]}</p>
            <p className="mt-1.5 text-lg font-bold text-foreground">{BRL(current?.fat_total)}</p>
            {current?.meta_mensal && <p className="text-xs text-muted-foreground">Meta: {BRL(current.meta_mensal)}</p>}
          </div>
          <div className="rounded-xl border border-border/60 p-4" style={{ background: 'var(--bg-surface)' }}>
            <p className="text-xs text-muted-foreground">% da meta</p>
            <p className={`mt-1.5 text-lg font-bold ${
              current?.meta_mensal_pct == null ? 'text-foreground' :
              current.meta_mensal_pct >= 1 ? 'text-emerald-400' : 'text-yellow-400'
            }`}>
              {PCT(current?.meta_mensal_pct)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 p-4" style={{ background: 'var(--bg-surface)' }}>
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="mt-1.5 text-lg font-bold text-foreground">{BRL(current?.ticket_medio)}</p>
            {current?.pacientes && <p className="text-xs text-muted-foreground">{current.pacientes} pacientes</p>}
          </div>
          <div className="rounded-xl border border-border/60 p-4" style={{ background: 'var(--bg-surface)' }}>
            <p className="text-xs text-muted-foreground">Tendência</p>
            <div className="mt-1 flex h-8 items-end gap-1">
              {[...(metrics ?? [])].reverse().map((m) => {
                const max = Math.max(...(metrics ?? []).map((x) => x.fat_total ?? 0));
                const pct = max > 0 ? ((m.fat_total ?? 0) / max) * 100 : 0;
                const isCurr = m.month === now.getMonth() + 1 && m.year === now.getFullYear();
                return (
                  <div
                    key={`${m.year}-${m.month}`}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${Math.max(10, pct)}%`,
                      background: isCurr ? 'var(--bronze)' : 'var(--bg-elevated)',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      <CmoChat clientId={id} initialMemory={memoryRow?.content ?? ''} />
    </div>
  );
}

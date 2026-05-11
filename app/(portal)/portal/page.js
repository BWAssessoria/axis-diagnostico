import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

const BRL = (v) => v != null
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  : '—';

const PCT = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';

const MONTHS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default async function PortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (!profile?.client_id) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Conta não vinculada</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre em contato com a equipe AXIS para ativar o seu acesso.</p>
        </div>
      </div>
    );
  }

  const clientId = profile.client_id;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  const [{ data: client }, { data: currentMetrics }, { data: allMetrics }, { data: recentAnalyses }] = await Promise.all([
    supabase.from('clients').select('business_name, owner_name, products(name), start_date').eq('id', clientId).single(),
    supabase.from('metrics_monthly').select('*').eq('client_id', clientId).eq('month', currentMonth).eq('year', currentYear).maybeSingle(),
    supabase.from('metrics_monthly').select('month, year, fat_total').eq('client_id', clientId).order('year', { ascending: false }).order('month', { ascending: false }).limit(6),
    supabase.from('analyses').select('id, title, created_at').eq('client_id', clientId).eq('visible_to_client', true).order('created_at', { ascending: false }).limit(3),
  ]);

  const startDate  = client?.start_date ? new Date(client.start_date) : null;
  const monthsIn   = startDate ? Math.max(1, (now.getFullYear() - startDate.getFullYear()) * 12 + now.getMonth() - startDate.getMonth()) : null;

  const mesAtual = now.getMonth() + 1;
  const mesesRestantes = Math.max(1, 12 - mesAtual);
  const restanteAnual = currentMetrics?.meta_anual && currentMetrics?.meta_anual_fat
    ? Math.max(0, currentMetrics.meta_anual - currentMetrics.meta_anual_fat)
    : null;
  const mediaNecessaria = restanteAnual != null ? restanteAnual / mesesRestantes : null;

  const metaPct = currentMetrics?.meta_mensal_pct;

  const kpis = [
    {
      label: 'Faturamento do mês',
      value: BRL(currentMetrics?.fat_total),
      sub: `Meta: ${BRL(currentMetrics?.meta_mensal)}`,
      color: 'text-foreground',
      style: { border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' },
    },
    {
      label: '% da meta mensal',
      value: PCT(metaPct),
      sub: metaPct >= 1 ? 'Meta batida ✓' : 'Em andamento',
      color: metaPct == null ? 'text-foreground' : metaPct >= 1 ? 'text-emerald-400' : 'text-yellow-400',
      style: metaPct >= 1
        ? { border: '1px solid rgba(16,185,129,.2)', background: 'rgba(16,185,129,.05)' }
        : { border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' },
    },
    {
      label: 'Ticket médio',
      value: BRL(currentMetrics?.ticket_medio),
      sub: `Pacientes: ${currentMetrics?.pacientes ?? '—'}`,
      color: 'text-foreground',
      style: { border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' },
    },
    {
      label: 'Meta anual restante',
      value: BRL(restanteAnual),
      sub: `~${BRL(mediaNecessaria)}/mês até dez`,
      color: 'text-foreground',
      style: { border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' },
    },
  ];

  return (
    <div>
      {/* Saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {client?.owner_name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {client?.business_name}
          {client?.products?.name && <> · <span style={{ color: 'var(--bronze)' }}>{client.products.name}</span></>}
          {monthsIn && <> · {monthsIn} {monthsIn === 1 ? 'mês' : 'meses'} com a AXIS</>}
        </p>
      </div>

      {/* KPIs do mês atual */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl p-5" style={k.style}>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={`mt-1.5 text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Últimos 6 meses */}
        <div className="col-span-2 rounded-xl p-5" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Faturamento — últimos 6 meses</h2>
            <Link href="/portal/metrics" className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--bronze)' }}>Ver tudo →</Link>
          </div>
          {allMetrics?.length > 0 ? (
            <div className="flex h-32 items-end gap-2">
              {[...allMetrics].reverse().map((m) => {
                const max = Math.max(...allMetrics.map((x) => x.fat_total ?? 0));
                const pct = max > 0 ? ((m.fat_total ?? 0) / max) * 100 : 0;
                const isCurrent = m.month === currentMonth && m.year === currentYear;
                return (
                  <div key={`${m.year}-${m.month}`} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground/60">{BRL(m.fat_total)}</span>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max(4, pct)}%`,
                        background: isCurrent ? 'var(--bronze)' : 'var(--bg-elevated)',
                      }}
                    />
                    <span className="text-xs" style={{ color: isCurrent ? 'var(--bronze)' : undefined }}>
                      {isCurrent
                        ? <span className="text-muted-foreground/60">{MONTHS[m.month]}</span>
                        : <span className="text-muted-foreground/60">{MONTHS[m.month]}</span>
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum dado disponível ainda.</p>
          )}
        </div>

        {/* Relatórios recentes */}
        <div className="rounded-xl p-5" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Relatórios</h2>
            <Link href="/portal/reports" className="text-xs transition-colors hover:opacity-80" style={{ color: 'var(--bronze)' }}>Ver todos →</Link>
          </div>
          {recentAnalyses?.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {recentAnalyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/portal/reports/${a.id}`}
                  className="group rounded-xl border border-border/40 p-3 transition-all hover:border-[var(--bronze-border)] hover:bg-[var(--bronze-glow)]"
                >
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum relatório disponível ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

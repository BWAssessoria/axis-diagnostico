import { createClient } from '@/lib/supabase/server';

const BRL = (v) => v != null
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  : '—';

const PCT = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default async function PortalMetricsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('user_profiles').select('client_id').eq('id', user.id).single();

  const { data: metrics } = await supabase
    .from('metrics_monthly')
    .select('*')
    .eq('client_id', profile?.client_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  const now = new Date();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Métricas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Histórico completo de faturamento e performance</p>
      </div>

      {!metrics?.length ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Nenhum dado disponível ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {metrics.map((m) => {
            const isCurrent = m.month === now.getMonth() + 1 && m.year === now.getFullYear();
            const metaPct   = m.meta_mensal_pct;

            return (
              <div
                key={`${m.year}-${m.month}`}
                className="rounded-xl p-6"
                style={isCurrent
                  ? { border: '1px solid rgba(16,185,129,.25)', background: 'rgba(16,185,129,.04)' }
                  : { border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }
                }
              >
                {/* Cabeçalho do mês */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {MONTHS[m.month]} {m.year}
                      {isCurrent && <span className="ml-2 text-sm font-normal text-emerald-400">mês atual</span>}
                    </h2>
                    {m.meta_mensal && (
                      <p className="mt-0.5 text-sm text-muted-foreground">Meta: {BRL(m.meta_mensal)}</p>
                    )}
                  </div>
                  {metaPct != null && (
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${metaPct >= 1 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {PCT(metaPct)}
                      </p>
                      <p className="text-xs text-muted-foreground">da meta</p>
                    </div>
                  )}
                </div>

                {/* Barra de progresso da meta */}
                {metaPct != null && (
                  <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${metaPct >= 1 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(100, metaPct * 100)}%` }}
                    />
                  </div>
                )}

                {/* Grid de KPIs */}
                <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
                  {[
                    { label: 'Faturamento',  value: BRL(m.fat_total) },
                    { label: 'Protocolos',   value: BRL(m.fat_protocolos) },
                    { label: 'Ticket médio', value: BRL(m.ticket_medio) },
                    { label: 'Pacientes',    value: m.pacientes ?? '—' },
                    { label: 'Retorno',      value: m.retorno ?? '—' },
                    { label: 'Margem',       value: PCT(m.margem_pct) },
                  ].map((k) => (
                    <div key={k.label}>
                      <p className="text-xs text-muted-foreground">{k.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{k.value}</p>
                    </div>
                  ))}
                </div>

                {/* Funil (se disponível) */}
                {m.leads != null && (
                  <div className="mt-4 grid grid-cols-4 gap-4 border-t border-border/20 pt-4">
                    {[
                      { label: 'Leads',           value: m.leads },
                      { label: 'Agendamentos',    value: m.agendamentos },
                      { label: 'Comparecimentos', value: m.comparecimentos },
                      { label: 'Vendas',          value: m.vendas },
                    ].map((k) => (
                      <div key={k.label}>
                        <p className="text-xs text-muted-foreground">{k.label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground/80">{k.value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

const BRL = (v) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
}).format(v);

const BENCHMARKS = [
  { from: 'Leads',           to: 'Agendamentos',    verde: (r) => r >= 0.35, amarelo: (r) => r >= 0.20, label: 'top >35% | médio 20–35% | crítico <20%' },
  { from: 'Agendamentos',    to: 'Comparecimentos', verde: (r) => r >= 0.75, amarelo: (r) => r >= 0.60, label: 'top >75% | médio 60–75% | crítico <60%' },
  { from: 'Comparecimentos', to: 'Vendas',          verde: (r) => r >= 0.65, amarelo: (r) => r >= 0.45, label: 'top >65% | médio 45–65% | crítico <45%' },
];

function health(rate, bench) {
  if (bench.verde(rate))   return 'verde';
  if (bench.amarelo(rate)) return 'amarelo';
  return 'vermelho';
}

const BAR_COLOR  = { verde: '#10b981', amarelo: '#eab308', vermelho: '#ef4444', neutro: '#4a3620' };
const TEXT_COLOR = { verde: '#10b981', amarelo: '#eab308', vermelho: '#ef4444', neutro: '#a89487' };
const BADGE_STYLE = {
  verde:    { background: 'rgba(16,185,129,.1)',  color: '#10b981', border: '1px solid rgba(16,185,129,.2)' },
  amarelo:  { background: 'rgba(234,179,8,.1)',   color: '#eab308', border: '1px solid rgba(234,179,8,.2)'  },
  vermelho: { background: 'rgba(239,68,68,.1)',   color: '#ef4444', border: '1px solid rgba(239,68,68,.2)'  },
  neutro:   { background: 'var(--bg-elevated)',   color: 'var(--text-secondary)', border: '1px solid var(--border)' },
};

function avg(arr) {
  const valid = arr.filter((v) => v != null && v > 0);
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
}

export default function FunnelView({ metrics }) {
  if (!metrics?.length) return null;

  const recent = metrics.slice(0, 3);
  const latest = metrics[0];

  const leads           = avg(recent.map((m) => m.leads));
  const agendamentos    = avg(recent.map((m) => m.agendamentos));
  const comparecimentos = avg(recent.map((m) => m.comparecimentos));
  const vendas          = avg(recent.map((m) => m.vendas));
  const ticket          = latest?.ticket_medio ?? null;

  if (!leads || (!agendamentos && !comparecimentos && !vendas)) return null;

  const stages = [
    { label: 'Leads',           value: leads           },
    { label: 'Agendamentos',    value: agendamentos    },
    { label: 'Comparecimentos', value: comparecimentos },
    { label: 'Vendas',          value: vendas          },
  ].filter((s) => s.value != null);

  if (stages.length < 2) return null;

  const maxVal = stages[0].value;

  function lostRevenue(lost, stageIdx) {
    if (!ticket || lost <= 0) return null;
    let rate = 1;
    for (let i = stageIdx + 1; i < stages.length - 1; i++) {
      const curr = stages[i].value;
      const next = stages[i + 1]?.value;
      if (curr && next) rate *= next / curr;
    }
    return lost * ticket * rate;
  }

  const totalLost       = ticket && vendas ? (leads - vendas) * ticket : null;
  const potentialRevenue= ticket && leads  ? leads * ticket            : null;
  const actualRevenue   = ticket && vendas ? vendas * ticket           : null;

  return (
    <div className="mb-6 rounded-xl p-5" style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Funil de Conversão</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Média dos últimos {recent.length} meses</p>
        </div>
        {totalLost != null && (
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receita não convertida</p>
            <p className="text-lg font-bold text-red-400">{BRL(totalLost)}</p>
            {potentialRevenue && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>de {BRL(potentialRevenue)} potencial</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1">
        {stages.map((stage, idx) => {
          const pct     = (stage.value / maxVal) * 100;
          const next    = stages[idx + 1];
          const bench   = BENCHMARKS[idx];
          const conv    = next && stage.value ? next.value / stage.value : null;
          const h       = conv && bench ? health(conv, bench) : 'neutro';
          const dropped = next ? stage.value - next.value : 0;
          const lostRev = next ? lostRevenue(dropped, idx) : null;

          return (
            <div key={stage.label}>
              <div className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-right">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{stage.label}</p>
                </div>
                <div className="flex-1">
                  <div className="relative h-9 rounded-md" style={{ background: 'var(--bg-elevated)' }}>
                    <div
                      className="h-full rounded-md transition-all"
                      style={{
                        width: `${Math.max(pct, 3)}%`,
                        backgroundColor: idx === 0 ? 'var(--bg-surface)' : BAR_COLOR[h],
                        opacity: 0.85,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center pl-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stage.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="w-32 shrink-0">
                  {conv != null && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={BADGE_STYLE[h]}
                    >
                      {(conv * 100).toFixed(0)}% conv.
                    </span>
                  )}
                </div>
              </div>

              {next && (
                <div className="flex items-start gap-3 py-1">
                  <div className="w-28 shrink-0" />
                  <div className="flex-1 pl-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>↓</span>
                      <span className="text-xs" style={{ color: dropped > 0 ? 'var(--text-muted)' : 'var(--border)' }}>
                        {dropped > 0 ? `${dropped} perdidos` : 'nenhuma perda'}
                      </span>
                      {lostRev != null && lostRev > 0 && (
                        <span className="text-xs font-medium text-red-400">≈ {BRL(lostRev)} em receita</span>
                      )}
                    </div>
                    {bench && (
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{bench.label}</p>
                    )}
                  </div>
                  <div className="w-32 shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: revenue realized vs potential */}
      {actualRevenue != null && potentialRevenue != null && (
        <div
          className="mt-4 flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Receita realizada ({vendas} vendas)</span>
              <span>{((actualRevenue / potentialRevenue) * 100).toFixed(0)}% do potencial</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(actualRevenue / potentialRevenue) * 100}%`, background: 'var(--bronze)' }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold" style={{ color: 'var(--bronze)' }}>{BRL(actualRevenue)}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>de {BRL(potentialRevenue)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

const MES = ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];

export function ClientGrowthChart({ clientCount }) {
  const values = [1, 1, 2, 2, 2, 2, Math.max(clientCount, 1)];

  const W = 260, H = 60;
  const maxV = Math.max(...values);
  const minV = 0;
  const range = maxV - minV || 1;

  const pts = values.map((v, i) => ({
    x: parseFloat(((i / (values.length - 1)) * W).toFixed(2)),
    y: parseFloat((H - ((v - minV) / range) * H * 0.88 - 2).toFixed(2)),
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const last = pts[pts.length - 1];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--axis-border)' }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        Crescimento da Carteira
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-black text-foreground">{clientCount}</span>
        <span className="text-xs text-muted-foreground">clientes ativos</span>
      </div>

      <div className="mt-4 w-full">
        <svg width="100%" viewBox={`0 0 ${W} ${H + 18}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F0C820" stopOpacity="0.28" />
              <stop offset="95%" stopColor="#F0C820" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#growthGrad)" />
          <path d={line} fill="none" stroke="#F0C820" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last.x} cy={last.y} r="3" fill="#F0C820" />
          {MES.map((m, i) => {
            const x = parseFloat(((i / (MES.length - 1)) * W).toFixed(2));
            const anchor = i === 0 ? 'start' : i === MES.length - 1 ? 'end' : 'middle';
            return (
              <text key={m} x={x} y={H + 14} textAnchor={anchor} fontSize="9" fill="#4A4860">
                {m}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function LeadFunnelWidget({ total, leads, ativos, comPlano }) {
  const safe = Math.max(total, 1);
  const steps = [
    { label: 'Contatos totais',  value: total,    pct: 100,                         color: '#6E6C84' },
    { label: 'Leads ativos',     value: leads,    pct: (leads    / safe) * 100,     color: '#60a5fa' },
    { label: 'Clientes ativos',  value: ativos,   pct: (ativos   / safe) * 100,     color: '#22c55e' },
    { label: 'Com plano gerado', value: comPlano, pct: (comPlano / safe) * 100,     color: '#F0C820' },
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--axis-border)' }}
    >
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        Pipeline de Conversão
      </p>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.label}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                {step.label}
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">{step.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(step.pct, step.value > 0 ? 6 : 0)}%`, background: step.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

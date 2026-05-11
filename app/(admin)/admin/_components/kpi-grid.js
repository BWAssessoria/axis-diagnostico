'use client';

import { Users, AlertCircle, TrendingDown, UserPlus } from 'lucide-react';

function Sparkline({ data, color, uid }) {
  const w = 72, h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - 4 - ((v - min) / range) * (h - 10),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const id = `sg${uid}${color.replace(/[^a-z0-9]/gi, '')}`;
  const last = pts[pts.length - 1];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
}

const SPARKS = {
  up:     [2, 2.5, 3, 2.5, 4, 3.5, 5, 4, 6, 7],
  flat:   [3, 2.5, 3, 2, 3, 2.5, 3, 3, 2.5, 3],
  down:   [7, 6, 5.5, 6, 4.5, 5, 3, 4, 2.5, 2],
  growth: [1, 2, 1.5, 3, 2, 4, 3, 5, 4.5, 6],
};

export default function KpiGrid({ ativos, pausados, churn, leads }) {
  const cards = [
    {
      label: 'Ativos',
      value: ativos,
      icon: Users,
      color: '#22c55e',
      rgb: '34,197,94',
      spark: SPARKS.up,
      caption: 'clientes gerenciados',
    },
    {
      label: 'Pausados',
      value: pausados,
      icon: AlertCircle,
      color: '#eab308',
      rgb: '234,179,8',
      spark: SPARKS.flat,
      caption: 'contratos suspensos',
    },
    {
      label: 'Churn',
      value: churn,
      icon: TrendingDown,
      color: '#f87171',
      rgb: '248,113,113',
      spark: SPARKS.down,
      caption: 'cancelamentos',
    },
    {
      label: 'Leads',
      value: leads,
      icon: UserPlus,
      color: '#60a5fa',
      rgb: '96,165,250',
      spark: SPARKS.growth,
      caption: 'em prospecção',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const glow = (a) => `rgba(${card.rgb},${a})`;
        return (
          <div
            key={card.label}
            aria-label={`${card.label}: ${card.value} ${card.caption}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 2px 24px rgba(0,0,0,0.35)',
            }}
          >
            {/* ambient depth glow — always visible, very faint */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{ background: `radial-gradient(ellipse at 90% -15%, ${glow(0.09)} 0%, transparent 55%)` }}
            />
            {/* hover amplified glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(ellipse at 90% -15%, ${glow(0.20)} 0%, transparent 60%)` }}
            />

            {/* top row */}
            <div className="relative flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </span>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: glow(0.12), border: `1px solid ${glow(0.28)}` }}
              >
                <Icon size={13} style={{ color: card.color }} />
              </div>
            </div>

            {/* value + sparkline */}
            <div className="relative mt-5 flex items-end justify-between">
              <div>
                <span className="text-4xl font-black leading-none tabular-nums text-foreground">
                  {card.value}
                </span>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {card.caption}
                </p>
              </div>
              <div className="mb-1">
                <Sparkline data={card.spark} color={card.color} uid={idx} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

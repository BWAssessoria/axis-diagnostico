'use client';

import {
  ComposedChart, AreaChart, BarChart,
  Area, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

// ── Formatadores ──────────────────────────────────────────────────────────────
const BRL = (v) => v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const PCT  = (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
const PCTV = (v) => v == null ? '—' : `${(v * 100).toFixed(0)}%`;

const HEALTH_COLOR = { verde: '#10b981', amarelo: '#eab308', vermelho: '#ef4444', sem_dados: '#6b5a4f' };
const HEALTH_BG = {
  verde:     { border: '1px solid rgba(16,185,129,.2)',  background: 'rgba(16,185,129,.06)',  color: '#10b981' },
  amarelo:   { border: '1px solid rgba(234,179,8,.2)',   background: 'rgba(234,179,8,.06)',   color: '#eab308' },
  vermelho:  { border: '1px solid rgba(239,68,68,.2)',   background: 'rgba(239,68,68,.06)',   color: '#ef4444' },
  sem_dados: { border: '1px solid var(--axis-border)',   background: 'var(--bg-surface)',     color: 'var(--text-muted)' },
};
const INSIGHT_STYLE = {
  positivo:    { border: '1px solid rgba(16,185,129,.2)',  background: 'rgba(16,185,129,.05)',  color: '#6ee7b7' },
  critico:     { border: '1px solid rgba(239,68,68,.2)',   background: 'rgba(239,68,68,.05)',   color: '#fca5a5' },
  alerta:      { border: '1px solid rgba(234,179,8,.2)',   background: 'rgba(234,179,8,.05)',   color: '#fde68a' },
  oportunidade:{ border: '1px solid var(--bronze-border)', background: 'var(--bronze-glow)',    color: 'var(--bronze)' },
  informativo: { border: '1px solid var(--axis-border)',   background: 'var(--bg-surface)',     color: 'var(--text-secondary)' },
};
const INSIGHT_ICON = { positivo: '↑', critico: '⚠', alerta: '!', oportunidade: '◈', informativo: 'i' };

// ── Tooltip customizado ───────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-foreground/70">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="leading-5">
          {p.name}: {formatter ? formatter(p.value, p.dataKey) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, health = 'sem_dados', delta }) {
  const s = HEALTH_BG[health] ?? HEALTH_BG.sem_dados;
  return (
    <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]" style={s}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xl font-bold" style={{ color: s.color }}>{value}</p>
      {delta != null && (
        <p className={`mt-0.5 text-xs font-medium ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}% vs. mês ant.
        </p>
      )}
      {sub && <p className="mt-0.5 text-xs text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

// ── Seção com título ──────────────────────────────────────────────────────────
function Section({ title, children, className = '' }) {
  return (
    <Card className={`gap-0 overflow-hidden p-0 ${className}`}>
      <div className="border-b border-border/30 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

// ── Barra de benchmark ────────────────────────────────────────────────────────
function BenchmarkBar({ label, value, target, health }) {
  if (value == null) return null;
  const pct     = Math.min(value / target, 1.5);
  const targetX = (1 / 1.5) * 100;
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-foreground/70">{label}</span>
        <span style={{ color: HEALTH_COLOR[health] }} className="font-semibold">
          {PCTV(value)} <span className="text-muted-foreground">/ meta {PCTV(target)}</span>
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, backgroundColor: HEALTH_COLOR[health] }}
        />
        <div className="absolute top-0 h-full w-px bg-white/20" style={{ left: `${targetX}%` }} />
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function AnalyticsDashboard({ data, clientName }) {
  const { summary, timeSeries, forecast, funnel, marketing, insights, benchmarkComparison, protocolEvolution } = data;

  const revenueChartData = timeSeries.map((m) => ({
    name:     m.label,
    receita:  m.revenue,
    meta:     m.target,
    media3m:  m.movAvg3 ? Math.round(m.movAvg3) : null,
    protocolo:m.revenueProtocol,
    avulso:   m.revenueAvulso,
  }));

  const forecastData = forecast ? [
    { name: 'Proj. +1', receita: forecast.nextMonth, proj: true },
    { name: 'Proj. +2', receita: forecast.month2,    proj: true },
    { name: 'Proj. +3', receita: forecast.month3,    proj: true },
  ] : [];

  const fullRevenueData = [...revenueChartData, ...forecastData];

  const protocData = protocolEvolution.filter(
    (m) => m.revenueProtocol != null || m.revenueAvulso != null
  );

  const funnelData = [
    { name: 'Leads',           value: funnel.leads,           health: 'neutro' },
    { name: 'Agendamentos',    value: funnel.agendamentos,    health: funnel.healthLA },
    { name: 'Comparecimentos', value: funnel.comparecimentos, health: funnel.healthAC },
    { name: 'Vendas',          value: funnel.vendas,          health: funnel.healthCV },
  ].filter((d) => d.value != null);

  const FUNNEL_COLORS = { neutro: '#6E6C84', verde: '#10b981', amarelo: '#eab308', vermelho: '#ef4444' };

  const axisColor   = 'var(--text-muted)';
  const gridColor   = 'var(--axis-border)';
  const legendStyle = { fontSize: 11, color: '#9896B0', paddingTop: 8 };

  return (
    <div className="space-y-5">

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Faturamento"  value={BRL(summary.currentRevenue)} health={summary.targetHealth} delta={summary.momGrowth} sub={`Média 3m: ${BRL(summary.movAvg3)}`} />
        <KpiCard label="% da Meta"    value={PCT(summary.targetPct)}      health={summary.targetHealth} sub={`Meta: ${BRL(summary.target)}`} />
        <KpiCard label="Ticket Médio" value={BRL(summary.ticket)}         health="sem_dados" sub={summary.ltv ? `LTV est.: ${BRL(summary.ltv)}` : undefined} />
        <KpiCard label="Protocolo"    value={PCT(summary.protocPct)}      health={summary.protocHealth} sub="meta: acima de 50%" />
        <KpiCard label="Retorno"      value={PCT(summary.retencao)}       health={summary.retencaoHealth} sub="meta: acima de 45%" />
        <KpiCard label="Margem"       value={PCT(summary.margem)}         health={summary.margemHealth} sub="meta: acima de 40%" />
      </div>

      {/* ── Receita + Meta + Média Móvel ──────────────────────────────────── */}
      <Section title={`Faturamento Mensal — ${data.meta.firstPeriod} a ${data.meta.lastPeriod}`}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={fullRevenueData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={42} />
            <Tooltip content={<DarkTooltip formatter={(v) => BRL(v)} />} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="receita" name="Faturamento" radius={[3, 3, 0, 0]} maxBarSize={36}>
              {fullRevenueData.map((d, i) => (
                <Cell key={i}
                  fill={
                    d.proj ? '#3b82f6'
                    : d.meta && d.receita >= d.meta ? '#10b981'
                    : d.meta && d.receita >= d.meta * 0.75 ? '#eab308'
                    : '#ef4444'
                  }
                  opacity={d.proj ? 0.5 : 0.85}
                />
              ))}
            </Bar>
            <Line dataKey="meta" name="Meta" stroke="var(--bronze)" strokeWidth={1.5}
              strokeDasharray="4 3" dot={false} connectNulls />
            <Line dataKey="media3m" name="Média 3m" stroke="#60a5fa" strokeWidth={2}
              dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
        {forecast && (
          <div className="mt-3 flex flex-wrap gap-3 border-t border-border/30 pt-3 text-xs text-muted-foreground">
            <span>Tendência: <span className={`font-medium ${forecast.slope >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{forecast.slope >= 0 ? '+' : ''}{BRL(forecast.slope)}/mês</span></span>
            <span>R² = {(forecast.r2 * 100).toFixed(0)}% <span className="text-muted-foreground/60">({forecast.confidence} confiança)</span></span>
            {forecast.annualGap != null && (
              <span>Projeção anual: <span className={`font-medium ${forecast.onTrack ? 'text-emerald-400' : 'text-yellow-400'}`}>{forecast.onTrack ? 'no ritmo' : `${BRL(forecast.annualGap)} abaixo da meta`}</span></span>
            )}
          </div>
        )}
      </Section>

      {/* ── Protocolo vs Avulso ───────────────────────────────────────────── */}
      {protocData.length > 1 && (
        <Section title="Evolução Protocolo vs. Avulso">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={protocData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gProtocolo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F0C820" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F0C820" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gAvulso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={42} />
              <Tooltip content={<DarkTooltip formatter={(v) => BRL(v)} />} />
              <Legend wrapperStyle={legendStyle} />
              <Area dataKey="revenueProtocol" name="Protocolo" stackId="a"
                stroke="#F0C820" fill="url(#gProtocolo)" strokeWidth={2} />
              <Area dataKey="revenueAvulso" name="Avulso" stackId="a"
                stroke="#8b5cf6" fill="url(#gAvulso)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ── Funil de Conversão ──────────────────────────────────────────── */}
        {funnelData.length >= 2 && (
          <Section title="Funil de Conversão — Média 3 meses">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} layout="vertical"
                margin={{ top: 0, right: 48, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100}
                  tick={{ fill: '#9896B0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip formatter={(v) => v?.toLocaleString('pt-BR')} />} />
                <Bar dataKey="value" name="Volume" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {funnelData.map((d, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[d.health] ?? FUNNEL_COLORS.neutro} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/30 pt-3">
              {[
                { label: 'Lead→Agend.',  value: funnel.convLeadAgend,  health: funnel.healthLA, lost: funnel.lostRevenueLA },
                { label: 'Agend.→Comp.', value: funnel.convAgendComp,  health: funnel.healthAC, lost: funnel.lostRevenueAC },
                { label: 'Comp.→Venda',  value: funnel.convCompVenda,  health: funnel.healthCV, lost: funnel.lostRevenueCV },
              ].filter((s) => s.value != null).map((s) => (
                <div key={s.label} className="text-center">
                  <p style={{ color: HEALTH_COLOR[s.health] }} className="text-lg font-bold">{PCTV(s.value)}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  {s.lost != null && s.lost > 0 && <p className="text-xs text-red-400/70">{BRL(s.lost)} perdidos</p>}
                </div>
              ))}
            </div>
            {funnel.totalLostRevenue != null && funnel.totalLostRevenue > 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Total não convertido: <span className="font-semibold text-red-400">{BRL(funnel.totalLostRevenue)}/mês</span>
              </p>
            )}
          </Section>
        )}

        {/* ── Benchmarks ─────────────────────────────────────────────────── */}
        <Section title="Comparativo com Benchmarks do Setor">
          {Object.entries(benchmarkComparison).map(([key, b]) => {
            const labels = {
              convLeadAgend: 'Lead → Agendamento',
              convAgendComp: 'Show rate',
              convCompVenda: 'Consulta → Venda',
              retencao:      'Taxa de Retorno',
              protocPct:     '% Protocolo',
            };
            return (
              <BenchmarkBar key={key} label={labels[key] ?? key} value={b.value} target={b.target} health={b.health} />
            );
          })}
          {marketing.cpl != null && (
            <div className="mt-4 border-t border-border/30 pt-3">
              <div className="flex justify-between text-xs text-foreground/70">
                <span>CPL médio</span>
                <span className={`font-semibold ${
                  marketing.cplHealth === 'verde' ? 'text-emerald-400' :
                  marketing.cplHealth === 'amarelo' ? 'text-yellow-400' : 'text-red-400'
                }`}>{BRL(marketing.cpl)}</span>
              </div>
              {marketing.cac != null && (
                <div className="mt-1 flex justify-between text-xs text-foreground/70">
                  <span>CAC médio</span>
                  <span className="font-semibold text-foreground">{BRL(marketing.cac)}</span>
                </div>
              )}
              {marketing.roas != null && (
                <div className="mt-1 flex justify-between text-xs text-foreground/70">
                  <span>ROAS</span>
                  <span className="font-semibold text-foreground">{marketing.roas}×</span>
                </div>
              )}
            </div>
          )}
        </Section>
      </div>

      {/* ── Insights Automáticos ──────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Insights automáticos
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {insights.map((ins, i) => {
              const s = INSIGHT_STYLE[ins.type] ?? INSIGHT_STYLE.informativo;
              return (
                <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm" style={s}>
                  <span className="mt-0.5 shrink-0 font-bold">{INSIGHT_ICON[ins.type]}</span>
                  <span>{ins.msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

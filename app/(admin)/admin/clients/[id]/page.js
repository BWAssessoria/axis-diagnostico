import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ClientTabs from './_components/client-tabs';
import DiagnosticView from './_components/diagnostic-view';
import MetricsTab from './_components/metrics-tab';
import UploadsTab from './_components/uploads-tab';
import GeneratePlanButton from './_components/generate-plan-button';
import MonthlyAnalysisButton from './_components/monthly-analysis-button';
import PlanTracker from './_components/plan-tracker';
import { syncPlanActions } from '@/app/actions/plan-actions';
import { parseActionsFromPlan } from '@/lib/plan-parser';
import { computeClientAnalytics } from '@/lib/analytics';
import { computeHealthScore, healthScoreStatus } from '@/lib/health-score';
import AnalyticsDashboard from './_components/analytics-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Pencil, ChevronRight, TrendingDown } from 'lucide-react';

const statusLabel = { active: 'Ativo', paused: 'Pausado', churned: 'Churn', lead: 'Lead' };
const statusVariant = { active: 'default', paused: 'secondary', churned: 'destructive', lead: 'outline' };

export default async function ClientDetailPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp?.tab ?? 'diagnostic';

  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('*, products(name, slug)')
    .eq('id', id)
    .single();

  if (!client) notFound();

  const { data: diagnostic } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: metricsData } = await supabase
    .from('metrics_monthly')
    .select('*')
    .eq('client_id', id)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, title, content, created_at, visible_to_client')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  const strategicPlan = analyses?.find((a) => a.title?.startsWith('Plano Estratégico'));

  // Carrega ações do plano; sincroniza se ainda não existirem
  let planActions = [];
  if (strategicPlan) {
    const { data: existing } = await supabase
      .from('plan_actions')
      .select('*')
      .eq('analysis_id', strategicPlan.id)
      .order('position');

    if (existing?.length) {
      planActions = existing;
    } else {
      const parsed = parseActionsFromPlan(strategicPlan.content ?? '');
      if (parsed.length) {
        await syncPlanActions(id, strategicPlan.id, parsed);
        const { data: fresh } = await supabase
          .from('plan_actions').select('*').eq('analysis_id', strategicPlan.id).order('position');
        planActions = fresh ?? [];
      }
    }
  }

  const { data: uploadsData } = await supabase
    .from('client_uploads')
    .select('*')
    .eq('client_id', id)
    .order('uploaded_at', { ascending: false });

  // ── Analytics BI ──────────────────────────────────────────────────────────
  const analytics = metricsData?.length
    ? computeClientAnalytics(metricsData, diagnostic?.answers ?? {})
    : null;

  // ── Shadow Revenue (Receita Perdida em No-shows) ──────────────────────────
  const latestMetric  = metricsData?.[0] ?? null;

  const shadowRevenue = (() => {
    if (!latestMetric?.agendamentos || !latestMetric?.ticket_medio) return null;
    const noShows = Math.max(0, (latestMetric.agendamentos ?? 0) - (latestMetric.comparecimentos ?? 0));
    return noShows > 0 ? noShows * latestMetric.ticket_medio : null;
  })();

  // ── Health Score ──────────────────────────────────────────────────────────
  const healthScore = computeHealthScore({
    latestMetric:  latestMetric,
    last3Metrics:  metricsData?.slice(0, 3) ?? [],
    pendingActions: planActions.filter((a) => a.status === 'pendente').length,
    totalActions:   planActions.length,
  });
  const healthStatus = healthScoreStatus(healthScore);

  // ── Benchmarks da carteira ────────────────────────────────────────────────
  const { data: activeClients } = await supabase
    .from('clients').select('id').eq('status', 'active');

  let benchmarks = null;
  if (activeClients?.length >= 3) {
    const batchMetrics = await Promise.all(
      activeClients.map((c) =>
        supabase.from('metrics_monthly')
          .select('agendamentos, comparecimentos, vendas, ticket_medio')
          .eq('client_id', c.id)
          .order('year', { ascending: false }).order('month', { ascending: false })
          .limit(1).maybeSingle()
      )
    );
    const pool = batchMetrics.map((r) => r.data).filter(Boolean);
    const p90 = (arr) => {
      const v = arr.filter((x) => x != null && x > 0).sort((a, b) => a - b);
      return v.length >= 3 ? v[Math.floor(v.length * 0.9)] : null;
    };
    benchmarks = {
      show_rate:  p90(pool.map((m) => m.agendamentos  > 0 ? m.comparecimentos / m.agendamentos  : null)),
      conv_venda: p90(pool.map((m) => m.comparecimentos > 0 ? m.vendas / m.comparecimentos : null)),
      ticket:     p90(pool.map((m) => m.ticket_medio)),
      n:          pool.length,
    };
  }

  const oldestMetric  = metricsData?.at(-1) ?? null;
  const currentRevenue = latestMetric?.fat_total ?? null;
  const entryRevenue   = oldestMetric?.fat_total ?? null;
  const roiPct = currentRevenue && entryRevenue && entryRevenue !== currentRevenue
    ? ((currentRevenue - entryRevenue) / entryRevenue) * 100
    : null;

  // Ciclo de contrato
  const daysOnContract = client.start_date
    ? Math.floor((Date.now() - new Date(client.start_date)) / 86400000)
    : null;
  const daysLeftGPS = null;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin" className="transition-colors hover:text-foreground">Carteira</Link>
        <ChevronRight size={14} className="opacity-40" />
        <span className="text-foreground">{client.business_name}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">{client.business_name}</h1>
            <Badge variant={statusVariant[client.status] ?? 'outline'}>
              {statusLabel[client.status]}
            </Badge>
            {daysLeftGPS !== null && (
              <Badge variant={daysLeftGPS <= 7 ? 'destructive' : 'secondary'}>
                {daysLeftGPS === 0 ? 'Sprint encerrado' : `${daysLeftGPS}d restantes`}
              </Badge>
            )}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: healthStatus.bg, color: healthStatus.color, border: `1px solid ${healthStatus.ring}` }}
              title={`Health Score: ${healthScore}/100`}
            >
              Health {healthScore} · {healthStatus.label}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {client.owner_name}
            {client.phone && <> · {client.phone}</>}
            {client.email && <> · {client.email}</>}
          </p>
          {client.products && (
            <p className="mt-1 text-sm text-muted-foreground">
              Produto: <span style={{ color: 'var(--bronze)' }} className="font-medium">{client.products.name}</span>
              {daysOnContract != null && <span className="ml-2 opacity-60">· {daysOnContract} dias com a AXIS</span>}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 gap-2">
            <Link href={`/admin/clients/${id}/edit`}>
              <Pencil size={14} />
              Editar
            </Link>
          </Button>
          <Button asChild size="sm" className="h-9 gap-2 font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)', boxShadow: '0 4px 14px rgba(240,200,32,0.35)' }}>
            <Link href={`/admin/clients/${id}/cmo`}>
              <Bot size={14} />
              Agente CMO
            </Link>
          </Button>
        </div>
      </div>

      {/* Prova de Resultado */}
      <RevenueEvolutionCard
        metricsData={metricsData ?? []}
        diagnosticAnswers={diagnostic?.answers ?? {}}
        daysOnContract={daysOnContract}
      />

      {/* Shadow Revenue Alert */}
      {shadowRevenue != null && shadowRevenue >= 1000 && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3.5"
          style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}
        >
          <TrendingDown size={16} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              Receita perdida em no-shows:{' '}
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(shadowRevenue)}
              {' '}este mês
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/70">
              {latestMetric.agendamentos - (latestMetric.comparecimentos ?? 0)} pacientes agendados não compareceram ·
              ticket médio {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(latestMetric.ticket_medio)}
            </p>
          </div>
        </div>
      )}

      {/* Cards rápidos do diagnóstico */}
      {diagnostic?.answers && (
        <QuickStats
          answers={diagnostic.answers}
          currentRevenue={currentRevenue}
          roiPct={roiPct}
          metricMonth={latestMetric ? `${latestMetric.month}/${latestMetric.year}` : null}
        />
      )}

      {/* Tabs */}
      <ClientTabs id={id} tab={tab} analysesCount={analyses?.length ?? 0} hasDiagnostic={!!diagnostic} hasPlan={!!strategicPlan} hasAnalytics={!!analytics} />

      {/* Conteúdo da aba */}
      <div className="mt-6">
        {tab === 'dashboard' && analytics && (
          <AnalyticsDashboard data={analytics} clientName={client.business_name} />
        )}

        {tab === 'diagnostic' && (
          diagnostic
            ? (
              <div>
                <div className="mb-4 flex justify-end">
                  <GeneratePlanButton clientId={id} hasDiagnostic={true} />
                </div>
                <DiagnosticView answers={diagnostic.answers} createdAt={diagnostic.created_at} />
              </div>
            )
            : (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <p className="text-sm text-muted-foreground">Nenhum diagnóstico preenchido ainda.</p>
              </div>
            )
        )}

        {tab === 'plano' && (
          <PlanTracker
            actions={planActions}
            planTitle={strategicPlan?.title ?? ''}
            planDate={strategicPlan ? new Date(strategicPlan.created_at).toLocaleDateString('pt-BR') : ''}
          />
        )}

        {tab === 'analyses' && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <MonthlyAnalysisButton clientId={id} />
              <Button asChild size="sm" className="h-9 gap-2 font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)', boxShadow: '0 4px 14px rgba(240,200,32,0.35)' }}>
                <Link href={`/admin/clients/${id}/analyses/new`}>+ Nova análise</Link>
              </Button>
            </div>
            {analyses?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-20 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma análise registrada ainda.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {analyses.map((a) => (
                  <Link
                    key={a.id}
                    href={`/admin/clients/${id}/analyses/${a.id}`}
                    className="group flex items-center justify-between rounded-xl px-5 py-4 transition-all duration-150 hover:bg-secondary/40"
                    style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
                  >
                    <div>
                      <p className="font-medium text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString('pt-BR')}
                        {a.visible_to_client && <span className="ml-2" style={{ color: 'var(--bronze)' }}>· Visível ao cliente</span>}
                      </p>
                    </div>
                    <span className="text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--bronze)' }}>
                      Abrir →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'metrics' && (
          <MetricsTab
            clientId={id}
            hasSheets={!!client.sheets_url}
            metrics={metricsData ?? []}
            diagnosticAnswers={diagnostic?.answers ?? null}
            benchmarks={benchmarks}
          />
        )}

        {tab === 'uploads' && (
          <UploadsTab clientId={id} uploads={uploadsData ?? []} />
        )}
      </div>
    </div>
  );
}

const BRL_FMT = (v) => v != null
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  : null;

const BRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);
const MONTHS_PT = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const parseMoney = (v) => { if (!v) return 0; const n = String(v).replace(/[^\d.,]/g,'').replace(/\./g,'').replace(',','.'); return parseFloat(n) || 0; };

function RevenueEvolutionCard({ metricsData, diagnosticAnswers, daysOnContract }) {
  const diagFat = parseMoney(diagnosticAnswers?.fat_atual);
  const sorted  = [...metricsData].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  const hasReal = sorted.length > 0;

  if (!diagFat && !hasReal) return null;

  // Build point series: diagnostic baseline → real months → 3-month projection
  const points = [];
  if (diagFat > 0) points.push({ label: 'Diag.', value: diagFat, projected: false });
  for (const m of sorted) {
    if (m.fat_total) points.push({ label: MONTHS_PT[m.month], value: parseFloat(m.fat_total), projected: false });
  }

  const lastReal = points.filter(p => !p.projected).at(-1);
  if (lastReal) {
    const lastM = sorted.at(-1);
    let py = lastM?.year ?? new Date().getFullYear();
    let pm = lastM?.month ?? new Date().getMonth() + 1;
    for (let i = 1; i <= 3; i++) {
      pm++; if (pm > 12) { pm = 1; py++; }
      points.push({ label: MONTHS_PT[pm], value: lastReal.value * Math.pow(1.10, i), projected: true });
    }
  }

  if (points.length < 2) return null;

  const realPoints  = points.filter(p => !p.projected);
  const firstReal   = realPoints[0];
  const lastRealPt  = realPoints.at(-1);
  const growth      = realPoints.length >= 2 ? ((lastRealPt.value - firstReal.value) / firstReal.value) * 100 : null;

  const W = 360, H = 72;
  const allVals = points.map(p => p.value);
  const maxV = Math.max(...allVals), minV = Math.min(...allVals) * 0.88;
  const range = maxV - minV || 1;
  const toY   = (v) => H - ((v - minV) / range) * H * 0.84 - 2;
  const toX   = (i) => parseFloat(((i / (points.length - 1)) * W).toFixed(2));

  const pts       = points.map((p, i) => ({ x: toX(i), y: toY(p.value), projected: p.projected }));
  const realPts   = pts.filter((_, i) => !points[i].projected);
  const realLine  = realPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  const realArea  = `${realLine} L${realPts.at(-1).x} ${H} L${realPts[0].x} ${H} Z`;
  const projStart = realPts.at(-1);
  const projPts   = [projStart, ...pts.filter((_, i) => points[i].projected)];
  const projLine  = projPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

  return (
    <div className="mb-8 overflow-hidden rounded-2xl" style={{ border: '1px solid var(--bronze-border)', background: 'var(--bg-surface)' }}>
      <div className="flex items-start justify-between gap-6 px-6 pt-6 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--bronze)', opacity: 0.75 }}>
            Prova de Resultado AXIS
          </p>
          <h3 className="mt-1 text-xl font-black text-foreground">
            {growth != null && growth > 0
              ? `+${growth.toFixed(0)}% de crescimento`
              : lastRealPt ? BRL(lastRealPt.value) + '/mês' : 'Evolução de faturamento'}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {daysOnContract ? `${daysOnContract} dias com a AXIS` : ''}
            {!hasReal ? ' · projeção com Método Axis (+10%/mês)' : ''}
          </p>
        </div>
        {firstReal !== lastRealPt && (
          <div className="flex shrink-0 gap-6 text-right">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entrada</p>
              <p className="mt-0.5 text-base font-bold text-foreground">{BRL(firstReal.value)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atual</p>
              <p className="mt-0.5 text-base font-bold" style={{ color: 'var(--bronze)' }}>{BRL(lastRealPt.value)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-5">
        <svg width="100%" viewBox={`0 0 ${W} ${H + 22}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0C820" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F0C820" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={realArea} fill="url(#revGrad)" />
          <path d={realLine} fill="none" stroke="#F0C820" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={projLine} fill="none" stroke="#F0C820" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" opacity="0.40" />
          {realPts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === realPts.length - 1 ? 3.5 : 2} fill="#F0C820" opacity={i === realPts.length - 1 ? 1 : 0.65} />
          ))}
          {points.map((point, i) => (
            <text key={i} x={toX(i)} y={H + 15} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              fontSize="9" fill={point.projected ? '#484F58' : '#8B949E'} fontStyle={point.projected ? 'italic' : 'normal'}>
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function QuickStats({ answers, currentRevenue, roiPct, metricMonth }) {
  const diagnosticItems = [
    { label: 'Fat. declarado (diag.)', value: answers.fat_atual, sub: null },
    { label: 'Meta mensal',            value: answers.meta,      sub: null },
    { label: 'Margem',                 value: answers.margem,    sub: null },
    { label: 'Ticket médio',           value: answers.ticket,    sub: null },
    { label: 'Conv. Lead → Aval',      value: answers.conv_aval ? `${answers.conv_aval}/10` : null, sub: null },
    { label: 'Conv. Aval → Proc',      value: answers.conv_proc ? `${answers.conv_proc}/10` : null, sub: null },
  ].filter((i) => i.value);

  const revenueCard = currentRevenue != null ? {
    label: `Faturamento real${metricMonth ? ` (${metricMonth})` : ''}`,
    value: BRL_FMT(currentRevenue),
    highlight: true,
    roi: roiPct,
  } : null;

  if (diagnosticItems.length === 0 && !revenueCard) return null;

  return (
    <div className="mb-8 grid grid-cols-3 gap-3 lg:grid-cols-6">
      {revenueCard && (
        <div
          className="relative overflow-hidden rounded-xl p-4"
          style={{ border: '1px solid var(--bronze-border)', background: 'linear-gradient(135deg, rgba(240,200,32,0.16) 0%, rgba(240,200,32,0.05) 100%)' }}
        >
          <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-10" style={{ background: 'var(--bronze)' }} />
          <p className="text-xs text-muted-foreground">{revenueCard.label}</p>
          <p className="mt-2 text-lg font-bold" style={{ color: 'var(--bronze)' }}>{revenueCard.value}</p>
          {revenueCard.roi != null && (
            <p className={`mt-0.5 text-xs font-semibold ${revenueCard.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {revenueCard.roi >= 0 ? '▲' : '▼'} {Math.abs(revenueCard.roi).toFixed(0)}% desde início
            </p>
          )}
        </div>
      )}
      {diagnosticItems.map((item) => (
        <div
          key={item.label}
          className="rounded-xl p-4"
          style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-lg font-bold text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  TrendingDown,
  AlertCircle,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  Bell,
  Sparkles,
} from 'lucide-react';
import KpiGrid from './_components/kpi-grid';
import { ClientGrowthChart, LeadFunnelWidget } from './_components/portfolio-widgets';
import RecalcularHealthButton from './_components/recalcular-health-button';
import { healthScoreStatus } from '@/lib/health-score';

const statusLabel = { active: 'Ativo', paused: 'Pausado', churned: 'Churn', lead: 'Lead' };
const statusVariant = { active: 'default', paused: 'secondary', churned: 'destructive', lead: 'outline' };

function DonutMini({ pct, color }) {
  const r = 10, cx = 13, cy = 13;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct, 1) * circ;
  const over = pct > 1 ? Math.min((pct - 1), 0.5) * circ : 0;
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray={`${filled.toFixed(2)} ${(circ - filled).toFixed(2)}`}
        strokeLinecap="round" />
      {over > 0 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${over.toFixed(2)} ${(circ - over).toFixed(2)}`}
          strokeLinecap="round" opacity="0.35" />
      )}
    </svg>
  );
}

export default async function AdminPage({ searchParams }) {
  const supabase = await createClient();
  const sp = await searchParams;
  const tab = sp?.tab ?? 'clients';

  const [{ data: all }, { data: plans }, { data: allMetrics }, { data: lastAnalyses }] = await Promise.all([
    supabase.from('clients').select('id, business_name, owner_name, status, start_date, health_score, products(name, slug)').order('created_at', { ascending: false }),
    supabase.from('analyses').select('client_id, title').like('title', 'Plano Estratégico%'),
    supabase.from('metrics_monthly').select('client_id, meta_mensal_pct, fat_total, month, year').order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('analyses').select('client_id, created_at').order('created_at', { ascending: false }),
  ]);

  const clientsWithPlan = new Set(plans?.map((p) => p.client_id) ?? []);

  const latestMetric = {};
  const secondMetric = {};
  for (const m of allMetrics ?? []) {
    if (!latestMetric[m.client_id]) { latestMetric[m.client_id] = m; continue; }
    if (!secondMetric[m.client_id]) { secondMetric[m.client_id] = m; }
  }

  const lastAnalysis = {};
  for (const a of lastAnalyses ?? []) {
    if (!lastAnalysis[a.client_id]) lastAnalysis[a.client_id] = a;
  }

  function getHealth(clientId) {
    const m = latestMetric[clientId];
    if (!m || m.meta_mensal_pct == null) return 'sem_dados';
    if (m.meta_mensal_pct >= 0.9) return 'verde';
    if (m.meta_mensal_pct >= 0.65) return 'amarelo';
    return 'vermelho';
  }

  const clients = all?.filter((c) => c.status !== 'lead') ?? [];
  const leads   = all?.filter((c) => c.status === 'lead') ?? [];
  const rows    = tab === 'leads' ? leads : clients;

  const ativos   = clients.filter((c) => c.status === 'active').length;
  const pausados = clients.filter((c) => c.status === 'paused').length;
  const churn    = clients.filter((c) => c.status === 'churned').length;
  const semPlano = clients.filter((c) => c.status === 'active' && !clientsWithPlan.has(c.id)).length;

  const now = Date.now();
  const DAY = 86400000;
  const alerts = [];

  for (const c of clients.filter((cl) => cl.status === 'active')) {
    const la = lastAnalysis[c.id];
    const lm = latestMetric[c.id];
    const sm = secondMetric[c.id];

    if (c.health_score != null && c.health_score < 40)
      alerts.push({ type: 'churn_risk', client: c, msg: `Health Score ${c.health_score}/100 — alto risco de churn` });

    if (!la || (now - new Date(la.created_at).getTime()) > 30 * DAY)
      alerts.push({ type: 'sem_analise', client: c, msg: 'Sem análise há 30+ dias' });

    if (lm?.meta_mensal_pct != null && sm?.meta_mensal_pct != null && lm.meta_mensal_pct < 0.8 && sm.meta_mensal_pct < 0.8)
      alerts.push({ type: 'meta_perdida', client: c, msg: `Meta abaixo de 80% por 2 meses (${(lm.meta_mensal_pct * 100).toFixed(0)}% / ${(sm.meta_mensal_pct * 100).toFixed(0)}%)` });

    if (c.products?.slug?.includes('starter') && lm?.meta_mensal_pct >= 1 && sm?.meta_mensal_pct >= 1)
      alerts.push({ type: 'upsell', client: c, msg: 'Meta atingida 2 meses — candidato a upsell para Scale' });

    if (c.products?.slug?.includes('gps') && c.start_date && (now - new Date(c.start_date).getTime()) > 30 * DAY && lm?.meta_mensal_pct >= 1)
      alerts.push({ type: 'upsell', client: c, msg: 'GPS acima da meta — propor PAE' });
  }

  const totalAlerts = alerts.length + (semPlano > 0 ? 1 : 0);

  return (
    <div>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Carteira</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral de clientes e leads</p>
        </div>
        <div className="flex items-center gap-2">
          <RecalcularHealthButton clientIds={clients.filter(c => c.status === 'active').map(c => c.id)} />
          <Button
            asChild
            size="sm"
            className="h-9 gap-2 px-5 font-semibold"
            style={{
              background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
              boxShadow: '0 4px 18px rgba(240,200,32,0.35)',
              color: '#1a1400',
            }}
          >
            <Link href="/admin/clients/new">
              <UserPlus size={15} />
              Novo cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI Grid (client component com sparklines) ──────────────────── */}
      <div className="mb-6">
        <KpiGrid ativos={ativos} pausados={pausados} churn={churn} leads={leads.length} />
      </div>

      {/* ── Widgets de carteira ──────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <LeadFunnelWidget
          total={clients.length + leads.length}
          leads={leads.length}
          ativos={ativos}
          comPlano={clientsWithPlan.size}
        />
        <ClientGrowthChart clientCount={ativos} />
      </div>

      {/* ── Prioridades da Carteira ─────────────────────────────────────── */}
      {(totalAlerts > 0 && tab !== 'leads') && (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2.5">
            <Bell size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Prioridades da Carteira</h2>
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
              style={{ background: 'var(--bronze-glow)', color: 'var(--bronze)' }}
            >
              {totalAlerts}
            </span>
          </div>

          <div className="space-y-2">

            {/* Risco de churn */}
            {alerts.filter(a => a.type === 'churn_risk').map((a, i) => (
              <div
                key={`cr${i}`}
                className="flex items-center gap-4 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Risco de Churn</p>
                  <p className="mt-0.5 text-sm text-foreground/80">
                    <span className="font-semibold text-red-300">{a.client.business_name}</span>
                    {' — '}{a.msg}
                  </p>
                </div>
                <Link
                  href={`/admin/clients/${a.client.id}`}
                  className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Ver cliente
                </Link>
              </div>
            ))}

            {/* Meta perdida */}
            {alerts.filter(a => a.type === 'meta_perdida').map((a, i) => (
              <div
                key={`mp${i}`}
                className="flex items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                  <TrendingDown size={14} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Alerta de performance</p>
                  <p className="mt-0.5 text-sm text-foreground/80">
                    <span className="font-semibold text-red-300">{a.client.business_name}</span>
                    {' — '}{a.msg}
                  </p>
                </div>
                <Link
                  href={`/admin/clients/${a.client.id}`}
                  className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Ver cliente
                </Link>
              </div>
            ))}

            {/* Sem análise */}
            {alerts.filter(a => a.type === 'sem_analise').map((a, i) => (
              <div
                key={`sa${i}`}
                className="flex items-center gap-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle size={14} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wide">Notificação de atenção</p>
                  <p className="mt-0.5 text-sm text-foreground/80">
                    <span className="font-semibold text-yellow-300">{a.client.business_name}</span>
                    {' — '}{a.msg}
                  </p>
                </div>
                <Link
                  href={`/admin/clients/${a.client.id}?tab=analyses`}
                  className="shrink-0 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition-colors hover:bg-yellow-500/20"
                >
                  Analisar
                </Link>
              </div>
            ))}

            {/* Upsell */}
            {alerts.filter(a => a.type === 'upsell').map((a, i) => (
              <div
                key={`up${i}`}
                className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                style={{ border: '1px solid var(--bronze-border)', background: 'rgba(240,200,32,0.06)' }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(240,200,32,0.12)', border: '1px solid var(--bronze-border)' }}
                >
                  <TrendingUp size={14} style={{ color: 'var(--bronze)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--bronze)', opacity: 0.8 }}>
                    Oportunidade de upsell
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/80">
                    <span className="font-semibold" style={{ color: 'var(--bronze)' }}>{a.client.business_name}</span>
                    {' — '}{a.msg}
                  </p>
                </div>
                <Link
                  href={`/admin/clients/${a.client.id}`}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    border: '1px solid var(--bronze-border)',
                    background: 'rgba(240,200,32,0.10)',
                    color: 'var(--bronze)',
                  }}
                >
                  Ver cliente
                </Link>
              </div>
            ))}

            {/* Sem plano */}
            {semPlano > 0 && (
              <div
                className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                style={{ border: '1px solid var(--bronze-border)', background: 'rgba(240,200,32,0.06)' }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(240,200,32,0.12)', border: '1px solid var(--bronze-border)' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--bronze)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--bronze)', opacity: 0.8 }}>
                    Ação necessária
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/80">
                    <span className="font-semibold" style={{ color: 'var(--bronze)' }}>
                      {semPlano} cliente{semPlano > 1 ? 's' : ''}
                    </span>
                    {' sem Plano Estratégico — prossiga para a aba Diagnóstico para gerar.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tabela ──────────────────────────────────────────────────────── */}
      <div>
        <div>
          {/* Tabs */}
          <div
            className="mb-5 flex gap-1 rounded-xl p-1 w-fit"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--axis-border)' }}
          >
            {[
              { key: 'clients', label: `Clientes (${clients.length})` },
              { key: 'leads',   label: `Leads (${leads.length})`      },
            ].map((t) => (
              <Link
                key={t.key}
                href={`/admin?tab=${t.key}`}
                className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150"
                style={
                  tab === t.key
                    ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                {t.label}
              </Link>
            ))}
          </div>

          {rows.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed border-border py-20 text-center"
              style={{ background: 'var(--bg-surface)' }}
            >
              <Users size={32} className="mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {tab === 'leads' ? 'Nenhum lead cadastrado.' : 'Nenhum cliente cadastrado ainda.'}
              </p>
              <Link href="/admin/clients/new" className="mt-2 inline-block text-sm hover:underline" style={{ color: 'var(--bronze)' }}>
                Cadastrar primeiro →
              </Link>
            </div>
          ) : (
            <Card className="overflow-hidden p-0 gap-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    {['Empresa', 'Responsável', 'Produto', 'Status', 'Saúde', 'Plano', ''].map((h) => (
                      <TableHead
                        key={h}
                        className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => {
                    const h = getHealth(c.id);
                    const m = latestMetric[c.id];
                    const pctNum = m?.meta_mensal_pct;
                    const pctStr = pctNum != null ? `${(pctNum * 100).toFixed(0)}%` : null;
                    const healthCfg = {
                      verde:    { color: '#4ade80', text: 'text-emerald-400' },
                      amarelo:  { color: '#facc15', text: 'text-yellow-400'  },
                      vermelho: { color: '#f87171', text: 'text-red-400'     },
                    }[h];

                    return (
                      <TableRow
                        key={c.id}
                        className="border-b border-border/20 transition-colors hover:bg-secondary/20"
                      >
                        <TableCell className="px-5 py-5 font-semibold text-foreground max-w-[180px]">
                          <span className="block truncate" title={c.business_name}>{c.business_name}</span>
                        </TableCell>
                        <TableCell className="px-5 py-5 text-sm text-muted-foreground max-w-[130px]">
                          <span className="block truncate" title={c.owner_name}>{c.owner_name}</span>
                        </TableCell>
                        <TableCell className="px-5 py-5 text-sm text-muted-foreground">{c.products?.name ?? '—'}</TableCell>
                        <TableCell className="px-5 py-5">
                          <Badge variant={statusVariant[c.status] ?? 'outline'} className="text-xs">
                            {statusLabel[c.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-5">
                          {c.health_score != null ? (() => {
                            const hs = healthScoreStatus(c.health_score);
                            return (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                                style={{ color: hs.color, background: hs.bg, boxShadow: `0 0 0 1px ${hs.ring}` }}
                              >
                                {c.health_score}
                                <span className="font-medium opacity-75">{hs.label}</span>
                              </span>
                            );
                          })() : healthCfg && pctNum != null ? (
                            <span className={`flex items-center gap-2 text-xs font-semibold ${healthCfg.text}`}>
                              <DonutMini pct={pctNum} color={healthCfg.color} />
                              {pctStr}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-5">
                          {clientsWithPlan.has(c.id)
                            ? <span className="text-xs font-semibold" style={{ color: 'var(--bronze)' }}>✦ Gerado</span>
                            : <span className="text-xs text-muted-foreground/30">—</span>
                          }
                        </TableCell>
                        <TableCell className="px-5 py-5 text-right">
                          <Link
                            href={`/admin/clients/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1 text-xs font-semibold transition-all hover:border-[var(--bronze-border)] hover:text-[var(--bronze)]"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Ver <ArrowUpRight size={11} />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}

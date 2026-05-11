'use client';

import { useState } from 'react';
import FunnelView from './funnel-view';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';

const BRL = (v) => v != null
  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  : '—';

const MONTHS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function parseInvestment(raw) {
  if (!raw) return null;
  const cleaned = raw.toString()
    .replace(/R\$\s*/gi, '')
    .replace(/\/m[êe]s/gi, '')
    .replace(/[.\s]/g, '')
    .replace(',', '.')
    .trim();
  const val = parseFloat(cleaned);
  return isNaN(val) || val <= 0 ? null : val;
}

function KpiCard({ label, value, sub, colorClass, style }) {
  return (
    <div className="rounded-xl border border-white/[0.07] p-4" style={{ background: 'var(--bg-surface)', ...style }}>
      <p className="axis-label mb-1.5">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${colorClass}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

const PCT = (v) => v != null ? `${(v * 100).toFixed(1)}%` : null;

function BenchmarkBanner({ benchmarks, latest }) {
  if (!benchmarks || benchmarks.n < 3) return null;

  const clientShowRate  = latest?.agendamentos  > 0 ? latest.comparecimentos / latest.agendamentos  : null;
  const clientConvVenda = latest?.comparecimentos > 0 ? latest.vendas / latest.comparecimentos : null;

  const items = [
    { label: 'Show rate',        clientVal: clientShowRate,  p90: benchmarks.show_rate,  fmt: (v) => `${(v * 100).toFixed(0)}%` },
    { label: 'Conv. vendas',     clientVal: clientConvVenda, p90: benchmarks.conv_venda, fmt: (v) => `${(v * 100).toFixed(0)}%` },
    { label: 'Ticket médio',     clientVal: latest?.ticket_medio, p90: benchmarks.ticket, fmt: (v) => BRL(v) },
  ].filter((i) => i.p90 != null);

  if (!items.length) return null;

  return (
    <div className="mb-5 rounded-xl border border-white/[0.06] p-4" style={{ background: 'var(--bg-surface)' }}>
      <p className="axis-label mb-3">Benchmarks da carteira — Top 10% ({benchmarks.n} clínicas ativas)</p>
      <div className="flex flex-wrap gap-4">
        {items.map((item) => {
          const isAbove = item.clientVal != null && item.clientVal >= item.p90;
          return (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground/60">{item.label}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--bronze)' }}>
                Top 10%: {item.fmt(item.p90)}
              </span>
              {item.clientVal != null && (
                <span className={`text-[10px] font-medium ${isAbove ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
                  Este cliente: {item.fmt(item.clientVal)} {isAbove ? '▲' : '▼'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MetricsTab({ clientId, hasSheets, metrics: initialMetrics, diagnosticAnswers, benchmarks }) {
  const [metrics, setMetrics] = useState(initialMetrics ?? []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function sync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/sync-pgm/${clientId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: data.message });
        window.location.reload();
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setLoading(false);
    }
  }

  const investMensal = parseInvestment(diagnosticAnswers?.investimento_mkt);
  const latest = metrics[0] ?? null;
  const last3   = metrics.slice(0, 3);

  const cpl = investMensal && latest?.leads > 0
    ? investMensal / latest.leads : null;
  const cac = investMensal && latest?.vendas > 0
    ? investMensal / latest.vendas : null;

  const avg3 = (field) => {
    const vals = last3.map((m) => m[field]).filter((v) => v != null && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const avgLeads = avg3('leads');
  const avgVendas = avg3('vendas');
  const avgCpl = investMensal && avgLeads ? investMensal / avgLeads : null;
  const avgCac = investMensal && avgVendas ? investMensal / avgVendas : null;

  const protocPct = latest?.fat_total > 0 && latest?.fat_protocolos != null
    ? (latest.fat_protocolos / latest.fat_total) * 100 : null;
  const retornoPct = latest?.pacientes > 0 && latest?.retorno != null
    ? (latest.retorno / latest.pacientes) * 100 : null;

  const hasKpis = investMensal || protocPct != null || retornoPct != null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {metrics.length > 0
            ? `${metrics.length} meses registrados`
            : 'Nenhum dado sincronizado ainda.'}
        </p>
        <Button
          onClick={sync}
          disabled={loading || !hasSheets}
          title={!hasSheets ? 'Cadastre o link da PGM no perfil do cliente' : ''}
          size="sm"
          className="h-9 gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Sincronizando...' : 'Sincronizar PGM'}
        </Button>
      </div>

      {!hasSheets && (
        <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
          Cadastre o link da planilha PGM nas configurações do cliente para habilitar a sincronização.
        </div>
      )}

      {message && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
            : 'border-red-500/20 bg-red-500/5 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* KPIs derivados */}
      {metrics.length > 0 && hasKpis && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Indicadores derivados — {latest ? `${MONTHS[latest.month]}/${latest.year}` : ''}
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cpl != null && (
              <KpiCard
                label="CPL — custo por lead"
                value={BRL(cpl)}
                sub={avgCpl ? `Média 3m: ${BRL(avgCpl)}` : 'Ref: R$15–R$60 estética'}
                colorClass="text-blue-400"
                style={{ borderColor: 'rgba(59,130,246,.2)', background: 'rgba(59,130,246,.05)' }}
              />
            )}
            {cac != null && (
              <KpiCard
                label="CAC — custo por venda"
                value={BRL(cac)}
                sub={avgCac ? `Média 3m: ${BRL(avgCac)}` : undefined}
                colorClass="text-violet-400"
                style={{ borderColor: 'rgba(139,92,246,.2)', background: 'rgba(139,92,246,.05)' }}
              />
            )}
            {protocPct != null && (
              <KpiCard
                label="% Protocolo no fat."
                value={`${protocPct.toFixed(0)}%`}
                sub={protocPct >= 50 ? 'Acima de 50% — ótimo' : 'Meta: acima de 50%'}
                colorClass={protocPct >= 50 ? 'text-emerald-400' : 'text-yellow-400'}
                style={protocPct >= 50
                  ? { borderColor: 'rgba(16,185,129,.2)', background: 'rgba(16,185,129,.05)' }
                  : { borderColor: 'rgba(234,179,8,.2)', background: 'rgba(234,179,8,.05)' }}
              />
            )}
            {retornoPct != null && (
              <KpiCard
                label="Taxa de retorno"
                value={`${retornoPct.toFixed(0)}%`}
                sub={retornoPct >= 40 ? 'Recorrência saudável' : 'Atenção à recorrência'}
                colorClass={retornoPct >= 40 ? 'text-emerald-400' : 'text-yellow-400'}
                style={retornoPct >= 40
                  ? { borderColor: 'rgba(16,185,129,.2)', background: 'rgba(16,185,129,.05)' }
                  : { borderColor: 'rgba(234,179,8,.2)', background: 'rgba(234,179,8,.05)' }}
              />
            )}
          </div>
          {!investMensal && diagnosticAnswers && (
            <p className="mt-2 text-xs text-muted-foreground/50">
              CPL e CAC indisponíveis — preencha o campo "Investimento em marketing" no diagnóstico.
            </p>
          )}
          {investMensal && (
            <p className="mt-2 text-xs text-muted-foreground/50">
              CPL e CAC calculados com base no investimento declarado no diagnóstico ({BRL(investMensal)}/mês).
            </p>
          )}
        </div>
      )}

      {/* Benchmarks */}
      <BenchmarkBanner benchmarks={benchmarks} latest={metrics[0] ?? null} />

      {/* Funil de conversão */}
      <FunnelView metrics={metrics} />

      {metrics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Clique em "Sincronizar PGM" para importar os dados da planilha.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.07]" style={{ maxHeight: 560, overflowY: 'auto' }}>
          <Table>
            <TableHeader className="sticky top-0 z-10" style={{ background: 'var(--bg-surface)' }}>
              <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                {[
                  { label: 'Mês',         align: 'left'  },
                  { label: 'Faturamento', align: 'right' },
                  { label: '% Prot.',     align: 'right' },
                  { label: 'Protocolos',  align: 'right' },
                  { label: 'Avulso',      align: 'right' },
                  { label: 'Ticket Médio',align: 'right' },
                  { label: 'Pacientes',   align: 'right' },
                  { label: 'Retorno',     align: 'right' },
                  { label: 'Leads',       align: 'right' },
                  { label: 'Vendas',      align: 'right' },
                  { label: '% Meta',      align: 'right' },
                ].map((h) => (
                  <TableHead key={h.label} className={`whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${h.align === 'right' ? 'text-right' : ''}`}>
                    {h.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => {
                const now = new Date();
                const isCurrent = m.month === now.getMonth() + 1 && m.year === now.getFullYear();
                const mProtocPct = m.fat_total > 0 && m.fat_protocolos != null
                  ? (m.fat_protocolos / m.fat_total) * 100 : null;
                return (
                  <TableRow
                    key={`${m.year}-${m.month}`}
                    className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${isCurrent ? 'bg-emerald-500/5' : ''}`}
                  >
                    <TableCell className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {MONTHS[m.month]}/{m.year}
                      {isCurrent && <span className="ml-2 text-[10px] text-emerald-400">atual</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">{BRL(m.fat_total)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {mProtocPct != null ? (
                        <span className={`font-medium ${mProtocPct >= 50 ? 'text-emerald-400' : mProtocPct >= 25 ? 'text-yellow-400' : 'text-muted-foreground/50'}`}>
                          {mProtocPct.toFixed(0)}%
                        </span>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{BRL(m.fat_protocolos)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{BRL(m.fat_avulso)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-foreground/80">{BRL(m.ticket_medio)}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.pacientes ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.retorno ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.leads ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.vendas ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {m.meta_mensal_pct != null ? (
                        <span className={`font-semibold ${
                          m.meta_mensal_pct >= 1 ? 'text-emerald-400' :
                          m.meta_mensal_pct >= 0.75 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {PCT(m.meta_mensal_pct)}
                        </span>
                      ) : <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

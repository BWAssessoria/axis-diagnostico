import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Zap, BarChart2 } from 'lucide-react';

const TYPE_LABEL = {
  strategic_plan:   'Plano Estratégico',
  monthly_analysis: 'Análise Mensal',
  cmo:              'Agente CMO',
};

const MODEL_SHORT = {
  'claude-sonnet-4-6':         'Sonnet 4.6',
  'claude-haiku-4-5-20251001': 'Haiku 4.5',
};

const fmt      = (usd) => usd === 0 ? '$0,0000' : `$${usd.toFixed(4)}`;
const fmtTotal = (usd) => `$${usd.toFixed(2)}`;

export default async function UsagePage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('usage_logs')
    .select('*, clients(business_name)')
    .order('created_at', { ascending: false });

  const all = logs ?? [];

  const totalUsd    = all.reduce((s, r) => s + Number(r.cost_usd), 0);
  const totalTokens = all.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth    = all.filter((r) => new Date(r.created_at) >= startOfMonth);
  const thisMonthUsd = thisMonth.reduce((s, r) => s + Number(r.cost_usd), 0);

  const byType = {};
  for (const r of all) {
    if (!byType[r.type]) byType[r.type] = { count: 0, cost: 0 };
    byType[r.type].count++;
    byType[r.type].cost += Number(r.cost_usd);
  }

  const byModel = {};
  for (const r of all) {
    if (!byModel[r.model]) byModel[r.model] = { count: 0, cost: 0 };
    byModel[r.model].count++;
    byModel[r.model].cost += Number(r.cost_usd);
  }

  const byClient = {};
  for (const r of all) {
    const name = r.clients?.business_name ?? '(sem cliente)';
    if (!byClient[name]) byClient[name] = { count: 0, cost: 0 };
    byClient[name].count++;
    byClient[name].cost += Number(r.cost_usd);
  }
  const topClients = Object.entries(byClient)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10);

  const recent = all.slice(0, 50);

  const summaryCards = [
    {
      label: 'Custo total',
      value: fmtTotal(totalUsd),
      sub: `${all.length} gerações`,
      icon: DollarSign,
      color: 'text-foreground',
      bg: 'bg-secondary/40',
      border: 'border-border/60',
    },
    {
      label: 'Este mês',
      value: fmtTotal(thisMonthUsd),
      sub: `${thisMonth.length} gerações`,
      icon: BarChart2,
      color: 'text-[var(--bronze)]',
      bg: 'bg-transparent',
      border: 'border-[var(--bronze-border)]',
      style: { background: 'var(--bronze-glow)' },
    },
    {
      label: 'Tokens processados',
      value: `${(totalTokens / 1000).toFixed(1)}k`,
      sub: 'input + output',
      icon: Zap,
      color: 'text-foreground',
      bg: 'bg-secondary/40',
      border: 'border-border/60',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Custos de IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consumo de tokens e custo por geração — Anthropic API</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-xl border p-5 ${s.bg} ${s.border}`}
              style={s.style}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <Icon size={15} className={s.color} />
              </div>
              <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-6">
        {/* Por tipo */}
        <Card className="p-0 gap-0">
          <CardHeader className="border-b border-border/30 px-5 py-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Por tipo de geração
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {Object.keys(byType).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byType)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([type, d]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{TYPE_LABEL[type] ?? type}</p>
                        <p className="text-xs text-muted-foreground">{d.count} gerações</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: 'var(--bronze)' }}>{fmtTotal(d.cost)}</p>
                        <p className="text-xs text-muted-foreground">
                          {totalUsd > 0 ? `${((d.cost / totalUsd) * 100).toFixed(0)}%` : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por modelo */}
        <Card className="p-0 gap-0">
          <CardHeader className="border-b border-border/30 px-5 py-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Por modelo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {Object.keys(byModel).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byModel)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([model, d]) => (
                    <div key={model} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{MODEL_SHORT[model] ?? model}</p>
                        <p className="text-xs text-muted-foreground">{d.count} chamadas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: 'var(--bronze)' }}>{fmtTotal(d.cost)}</p>
                        <p className="text-xs text-muted-foreground">
                          {totalUsd > 0 ? `${((d.cost / totalUsd) * 100).toFixed(0)}%` : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Por cliente */}
      <Card className="mb-8 p-0 gap-0">
        <CardHeader className="border-b border-border/30 px-5 py-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Por cliente (top 10)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {topClients.map(([name, d]) => {
                const pct = totalUsd > 0 ? (d.cost / totalUsd) * 100 : 0;
                return (
                  <div key={name} className="flex items-center gap-4">
                    <div className="w-44 shrink-0">
                      <p className="truncate text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{d.count} gerações</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%`, background: 'var(--bronze)' }}
                        />
                      </div>
                    </div>
                    <p className="w-16 text-right text-sm font-semibold" style={{ color: 'var(--bronze)' }}>
                      {fmtTotal(d.cost)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log table */}
      <Card className="overflow-hidden p-0 gap-0">
        <CardHeader className="border-b border-border/30 px-5 py-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico recente
          </CardTitle>
        </CardHeader>
        {recent.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma geração registrada ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/40">
                {['Data', 'Cliente', 'Tipo', 'Modelo', 'Tokens (in/out)', 'Custo'].map((h) => (
                  <TableHead key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r) => (
                <TableRow key={r.id} className="border-b border-border/20 hover:bg-secondary/20">
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm font-medium text-foreground">
                    {r.clients?.business_name ?? '—'}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {TYPE_LABEL[r.type] ?? r.type}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge
                      variant={r.model.includes('haiku') ? 'secondary' : 'outline'}
                      className="text-xs"
                      style={!r.model.includes('haiku') ? {
                        borderColor: 'var(--bronze-border)',
                        background: 'var(--bronze-glow)',
                        color: 'var(--bronze)',
                      } : {}}
                    >
                      {MODEL_SHORT[r.model] ?? r.model}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {r.input_tokens.toLocaleString('pt-BR')} / {r.output_tokens.toLocaleString('pt-BR')}
                    {r.cache_read_tokens > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground/60">
                        +{r.cache_read_tokens.toLocaleString('pt-BR')} cache
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--bronze)' }}>
                    {fmt(Number(r.cost_usd))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

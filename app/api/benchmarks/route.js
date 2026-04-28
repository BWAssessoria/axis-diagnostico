/**
 * GET /api/benchmarks
 * Retorna os valores de percentil 90 (Top 10%) da carteira ativa
 * para show-rate, conversão de vendas, faturamento e ticket médio.
 *
 * Cache: 1 hora (dados não mudam com frequência)
 */

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function p90(values) {
  const valid = values.filter((v) => v != null && isFinite(v) && v > 0);
  if (valid.length < 3) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.90)] ?? sorted.at(-1);
}

function median(values) {
  const valid = values.filter((v) => v != null && isFinite(v) && v > 0);
  if (!valid.length) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  // IDs dos clientes ativos
  const { data: clients } = await supabase
    .from('clients')
    .select('id')
    .eq('status', 'active');

  if (!clients?.length) return Response.json({ n: 0, benchmarks: {} });

  // Última métrica de cada cliente (sequencial para não estourar conexões)
  const allMetrics = [];
  for (const c of clients) {
    const { data } = await supabase
      .from('metrics_monthly')
      .select('fat_total, agendamentos, comparecimentos, vendas, ticket_medio')
      .eq('client_id', c.id)
      .order('year',  { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) allMetrics.push(data);
  }

  const showRates  = allMetrics.map((m) =>
    m.agendamentos  > 0 ? m.comparecimentos / m.agendamentos  : null);
  const convVendas = allMetrics.map((m) =>
    m.comparecimentos > 0 ? m.vendas / m.comparecimentos : null);
  const fatTotals  = allMetrics.map((m) => m.fat_total);
  const tickets    = allMetrics.map((m) => m.ticket_medio);

  return Response.json(
    {
      n: allMetrics.length,
      benchmarks: {
        show_rate:  { p90: p90(showRates),  median: median(showRates)  },
        conv_venda: { p90: p90(convVendas), median: median(convVendas) },
        fat_total:  { p90: p90(fatTotals),  median: median(fatTotals)  },
        ticket:     { p90: p90(tickets),    median: median(tickets)     },
      },
    },
    { headers: { 'Cache-Control': 'private, max-age=3600' } }
  );
}

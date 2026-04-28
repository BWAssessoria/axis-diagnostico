/**
 * GET /api/anomaly-check
 * Avalia todos os clientes ativos e retorna alertas de anomalias.
 *
 * Proteção: header Authorization: Bearer <CRON_SECRET>
 *
 * Uso com Vercel Cron (vercel.json):
 *   { "path": "/api/anomaly-check", "schedule": "0 8 * * 1" }
 */

import { createClient } from '@/lib/supabase/server';
import { detectAnomalies } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const MONTHS = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
  }

  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('status', 'active');

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!clients?.length) return Response.json({ alerts: [], checked: 0 });

  const alerts = [];

  for (const client of clients) {
    const { data: metrics } = await supabase
      .from('metrics_monthly')
      .select('month,year,fat_total,leads,agendamentos,comparecimentos,vendas,meta_mensal_pct')
      .eq('client_id', client.id)
      .order('year',  { ascending: true })
      .order('month', { ascending: true })
      .limit(6);

    if (!metrics?.length) continue;

    const timeSeries = metrics.map((m) => ({
      month:  m.month,
      year:   m.year,
      label:  `${MONTHS[m.month]}/${m.year}`,
      revenue:        m.fat_total  ?? 0,
      leads:          m.leads      ?? null,
      convLeadAgend:  (m.leads > 0 && m.agendamentos   != null) ? m.agendamentos   / m.leads          : null,
      convAgendComp:  (m.agendamentos  > 0 && m.comparecimentos != null) ? m.comparecimentos / m.agendamentos  : null,
      convCompVenda:  (m.comparecimentos > 0 && m.vendas != null) ? m.vendas / m.comparecimentos : null,
      targetPct:      m.meta_mensal_pct ?? null,
    }));

    const anomalies = detectAnomalies(timeSeries);
    if (anomalies.length > 0) {
      alerts.push({ clientId: client.id, client: client.business_name, anomalies });
    }
  }

  const criticals = alerts.filter((a) => a.anomalies.some((x) => x.type === 'critico'));

  return Response.json({
    success:        true,
    checked:        clients.length,
    totalAlerts:    alerts.length,
    totalCriticals: criticals.length,
    alerts,
    timestamp: new Date().toISOString(),
  });
}

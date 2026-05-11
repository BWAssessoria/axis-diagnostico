/**
 * GET /api/sync-pgm-all
 * Sincroniza PGM de todos os clientes ativos com sheets_url cadastrado.
 *
 * Proteção: header Authorization: Bearer <CRON_SECRET>
 *
 * Uso com Vercel Cron (vercel.json):
 *   { "path": "/api/sync-pgm-all", "schedule": "0 3 * * *" }
 *
 * Uso manual:
 *   curl -H "Authorization: Bearer <seu_secret>" https://seu-dominio.com/api/sync-pgm-all
 */

import { createClient } from '@/lib/supabase/server';
import {
  fetchSheet, extractSheetId,
  parseDash, parsePainel, parseCronograma,
} from '@/lib/pgm-parser';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // ── Autenticação por secret ───────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
  }

  const supabase = await createClient();

  // ── Busca clientes ativos com sheets_url ──────────────────────────────────
  const { data: clients, error: clientsErr } = await supabase
    .from('clients')
    .select('id, business_name, sheets_url')
    .eq('status', 'active')
    .not('sheets_url', 'is', null);

  if (clientsErr) return Response.json({ error: clientsErr.message }, { status: 500 });
  if (!clients?.length) return Response.json({ synced: 0, message: 'Nenhum cliente ativo com PGM.' });

  const results = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  // ── Processa cada cliente sequencialmente ─────────────────────────────────
  for (const client of clients) {
    const sheetId = extractSheetId(client.sheets_url);
    if (!sheetId) {
      results.push({ client: client.business_name, status: 'skip', reason: 'URL inválida' });
      continue;
    }

    try {
      const [dashGviz, painelGviz, cronGviz] = await Promise.all([
        fetchSheet(sheetId, 'Dash', 1),
        fetchSheet(sheetId, 'Painel', 0).catch(() => null),
        fetchSheet(sheetId, 'Cronograma GPS', 0).catch(() => null),
      ]);

      const dashRecords = parseDash(dashGviz);
      if (!dashRecords.length) {
        results.push({ client: client.business_name, status: 'skip', reason: 'Dash vazio' });
        continue;
      }

      const painel     = painelGviz ? parsePainel(painelGviz)     : {};
      const cronograma = cronGviz   ? parseCronograma(cronGviz)   : {};

      const records = dashRecords.map((r) => {
        const isCurrent = r.month === currentMonth && r.year === currentYear;
        return {
          client_id:      client.id,
          month:          r.month,
          year:           r.year,
          fat_total:      r.fat_total,
          fat_protocolos: r.fat_protocolos,
          fat_avulso:     r.fat_avulso,
          pacientes:      r.pacientes,
          retorno:        r.retorno,
          ticket_medio:   r.ticket_medio,
          golden_face:    r.golden_face,
          harmonizacao:   r.harmonizacao,
          glow_skin:      r.glow_skin,
          preen_botox:    r.preen_botox,
          outros_proc:    r.outros_proc,
          source:         'sheets',
          ...(isCurrent ? {
            leads:               painel.leads,
            agendamentos:        painel.agendamentos,
            comparecimentos:     painel.comparecimentos,
            vendas:              painel.vendas,
            margem_pct:          painel.margem_pct,
            protocolos_vendidos: painel.protocolos_vendidos,
            meta_mensal:         cronograma.meta_mensal,
            meta_mensal_fat:     cronograma.meta_mensal_fat,
            meta_mensal_pct:     cronograma.meta_mensal_pct,
            meta_anual:          cronograma.meta_anual,
            meta_anual_fat:      cronograma.meta_anual_fat,
            meta_anual_pct:      cronograma.meta_anual_pct,
          } : {}),
        };
      });

      const { error } = await supabase
        .from('metrics_monthly')
        .upsert(records, { onConflict: 'client_id,month,year' });

      if (error) throw error;

      await supabase.from('pgm_cache').delete().eq('client_id', client.id);

      results.push({ client: client.business_name, status: 'ok', synced: records.length });
    } catch (err) {
      results.push({ client: client.business_name, status: 'error', reason: err.message });
    }
  }

  const ok    = results.filter((r) => r.status === 'ok').length;
  const errs  = results.filter((r) => r.status === 'error').length;
  const skips = results.filter((r) => r.status === 'skip').length;

  return Response.json({
    success: true,
    summary: { total: clients.length, ok, errors: errs, skipped: skips },
    results,
    timestamp: now.toISOString(),
  });
}

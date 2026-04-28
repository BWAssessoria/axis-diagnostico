/**
 * POST /api/webhooks/daily-nudges
 * Varre tarefas do plano estratégico com prazo vencido e retorna
 * payload estruturado para futura integração com WhatsApp API ou similar.
 *
 * Proteção: Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron (vercel.json):
 *   { "path": "/api/webhooks/daily-nudges", "schedule": "0 9 * * *" }
 */

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }
  }

  const supabase = await createClient();
  const today    = new Date().toISOString().split('T')[0];

  const { data: overdueActions, error } = await supabase
    .from('plan_actions')
    .select(`
      id, action_text, due_date, assignee, status, phase,
      client_id,
      clients ( business_name, phone, owner_name )
    `)
    .lte('due_date', today)
    .not('status', 'eq', 'concluida')
    .not('due_date', 'is', null);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Agrupa por cliente
  const byClient = {};
  for (const action of (overdueActions ?? [])) {
    const cid = action.client_id;
    if (!byClient[cid]) {
      byClient[cid] = {
        clientId:       cid,
        businessName:   action.clients?.business_name ?? '—',
        ownerName:      action.clients?.owner_name    ?? '—',
        phone:          action.clients?.phone         ?? null,
        overdueActions: [],
      };
    }
    byClient[cid].overdueActions.push({
      id:       action.id,
      text:     action.action_text,
      due_date: action.due_date,
      assignee: action.assignee,
      phase:    action.phase,
      daysLate: Math.floor((Date.now() - new Date(action.due_date + 'T00:00:00')) / 86400000),
    });
  }

  const nudges = Object.values(byClient).sort(
    (a, b) => b.overdueActions.length - a.overdueActions.length
  );

  return Response.json({
    success:      true,
    date:         today,
    totalClients: nudges.length,
    totalActions: (overdueActions ?? []).length,
    nudges,
    // ── TODO: Integração futura ───────────────────────────────────────────
    // Para cada nudge, chame a WhatsApp Business API ou outro canal:
    //   await sendWhatsApp(nudge.phone, buildMessage(nudge));
    // Ou dispare um e-mail, Slack, ou webhook externo.
    _note: 'Payload pronto. Implemente o envio na seção TODO acima.',
  });
}

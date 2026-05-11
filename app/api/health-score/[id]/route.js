/**
 * POST /api/health-score/[id]
 * Recalcula e salva o health_score de um cliente.
 * Pode ser chamado manualmente ou via Cron.
 */

import { createClient }      from '@/lib/supabase/server';
import { computeHealthScore } from '@/lib/health-score';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const [{ data: metrics }, { data: actions }] = await Promise.all([
    supabase
      .from('metrics_monthly')
      .select('meta_mensal_pct, updated_at, created_at')
      .eq('client_id', id)
      .order('year',  { ascending: false })
      .order('month', { ascending: false })
      .limit(3),
    supabase
      .from('plan_actions')
      .select('status')
      .eq('client_id', id),
  ]);

  const pendingActions = (actions ?? []).filter((a) => a.status === 'pendente').length;
  const totalActions   = (actions ?? []).length;

  const score = computeHealthScore({
    latestMetric:  metrics?.[0] ?? null,
    last3Metrics:  metrics ?? [],
    pendingActions,
    totalActions,
  });

  const { error } = await supabase
    .from('clients')
    .update({ health_score: score })
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ score, clientId: id });
}

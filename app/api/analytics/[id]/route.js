import { createClient } from '@/lib/supabase/server';
import { computeClientAnalytics } from '@/lib/analytics';

export async function GET(request, { params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const [{ data: metrics }, { data: diagnostic }] = await Promise.all([
    supabase
      .from('metrics_monthly')
      .select('*')
      .eq('client_id', id)
      .order('year', { ascending: false })
      .order('month', { ascending: false }),
    supabase
      .from('diagnostics')
      .select('answers')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!metrics?.length) {
    return Response.json({ error: 'Sem dados de métricas para este cliente.' }, { status: 404 });
  }

  const analytics = computeClientAnalytics(metrics, diagnostic?.answers ?? {});

  return Response.json(analytics, {
    headers: { 'Cache-Control': 'private, max-age=300' }, // 5 min cache
  });
}

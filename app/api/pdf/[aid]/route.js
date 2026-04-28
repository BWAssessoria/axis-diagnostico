/**
 * GET /api/pdf/[aid]
 * Gera e retorna o PDF de uma análise.
 * Requer autenticação via cookie de sessão Supabase.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { createClient }   from '@/lib/supabase/server';
import AnalysisPdf        from '@/app/(admin)/admin/clients/[id]/analyses/[aid]/_pdf-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { aid } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Não autorizado', { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return new Response('Acesso negado', { status: 403 });

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('id, client_id, title, content, created_at')
    .eq('id', aid)
    .single();

  if (error || !analysis) return new Response('Análise não encontrada', { status: 404 });

  const { data: client } = await supabase
    .from('clients')
    .select('business_name')
    .eq('id', analysis.client_id)
    .single();

  const buffer = await renderToBuffer(
    <AnalysisPdf
      title={analysis.title}
      clientName={client?.business_name ?? '—'}
      content={analysis.content}
      createdAt={analysis.created_at}
    />
  );

  const filename = `${analysis.title.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').replace(/\s+/g, '_')}.pdf`;

  return new Response(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}

/**
 * GET /api/pdf/diagnostic/[id]
 * Gera e retorna o PDF do diagnóstico de um cliente.
 */

import { renderToBuffer }  from '@react-pdf/renderer';
import { createClient }    from '@/lib/supabase/server';
import DiagnosticPdf       from '@/app/(admin)/admin/clients/[id]/_components/_diagnostic-pdf-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Não autorizado', { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return new Response('Acesso negado', { status: 403 });

  const { data: client } = await supabase
    .from('clients')
    .select('business_name')
    .eq('id', id)
    .single();

  if (!client) return new Response('Cliente não encontrado', { status: 404 });

  const { data: diagnostic } = await supabase
    .from('diagnostics')
    .select('answers, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!diagnostic) return new Response('Diagnóstico não encontrado', { status: 404 });

  const buffer = await renderToBuffer(
    <DiagnosticPdf
      clientName={client.business_name}
      answers={diagnostic.answers ?? {}}
      createdAt={diagnostic.created_at}
    />
  );

  const slug = client.business_name.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').replace(/\s+/g, '_');
  const filename = `Diagnostico_360_${slug}.pdf`;

  return new Response(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}

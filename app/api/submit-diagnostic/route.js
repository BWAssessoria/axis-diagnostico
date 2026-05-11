import { createClient } from '@supabase/supabase-js';

// Service role key bypasses RLS — safe here because this is a server route,
// the key is never exposed to the browser.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId');
  if (!clienteId) return Response.json({ error: 'clienteId required' }, { status: 400 });

  const { data, error } = await supabase
    .from('clients')
    .select('id, business_name, owner_name, phone')
    .eq('id', clienteId)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  // Normalize to the field names the form expects
  return Response.json({
    id: data.id,
    nome_clinica: data.business_name,
    responsavel: data.owner_name,
    whatsapp: data.phone,
    cidade: '',
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { answers, clienteId } = body;

  if (!answers) {
    return Response.json({ error: 'answers required' }, { status: 400 });
  }

  const entry = { ...answers, _ts: new Date().toISOString() };

  if (clienteId) {
    // New diagnostic for an existing client
    const { error } = await supabase
      .from('diagnostics')
      .insert({ client_id: clienteId, answers: entry });

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ ok: true });
  }

  // New lead: create client record + first diagnostic
  const { data: novoCliente, error: errC } = await supabase
    .from('clients')
    .insert({
      business_name: answers.nome_clinica,
      owner_name: answers.nome,
      phone: answers.whatsapp,
      status: 'lead',
    })
    .select('id')
    .single();

  if (errC) return Response.json({ error: errC.message }, { status: 400 });

  const { error: errD } = await supabase
    .from('diagnostics')
    .insert({ client_id: novoCliente.id, answers: entry });

  if (errD) return Response.json({ error: errD.message }, { status: 400 });

  return Response.json({ ok: true });
}

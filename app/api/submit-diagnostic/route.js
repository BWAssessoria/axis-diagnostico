import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId');
  if (!clienteId) return Response.json({ error: 'clienteId required' }, { status: 400 });

  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome_clinica, responsavel, cidade, whatsapp')
    .eq('id', clienteId)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { answers, clienteId, periodoNovo } = body;

  if (!answers) {
    return Response.json({ error: 'answers required' }, { status: 400 });
  }

  const entry = { ...answers, _ts: new Date().toISOString() };

  if (clienteId) {
    // New diagnostic version for an existing client
    const { data: diags } = await supabase
      .from('diagnosticos')
      .select('versao')
      .eq('cliente_id', clienteId)
      .order('versao', { ascending: false })
      .limit(1);

    const proxVersao = (diags?.[0]?.versao || 0) + 1;

    const { error } = await supabase.from('diagnosticos').insert({
      cliente_id: clienteId,
      data: entry,
      periodo: periodoNovo || 'atualização',
      versao: proxVersao,
    });

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ ok: true });
  }

  // New client + initial diagnostic
  const { data: novoCliente, error: errC } = await supabase
    .from('clientes')
    .insert({
      nome_clinica: answers.nome_clinica,
      responsavel: answers.nome,
      cidade: answers.cidade_estado,
      whatsapp: answers.whatsapp,
    })
    .select('id')
    .single();

  if (errC) return Response.json({ error: errC.message }, { status: 400 });

  const { error: errD } = await supabase.from('diagnosticos').insert({
    cliente_id: novoCliente.id,
    data: entry,
    periodo: 'inicial',
    versao: 1,
  });

  if (errD) return Response.json({ error: errD.message }, { status: 400 });

  return Response.json({ ok: true });
}

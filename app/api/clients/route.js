import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: clientes }, { data: diags }] = await Promise.all([
    sb().from('clientes')
      .select('id, created_at, nome_clinica, responsavel, cidade, whatsapp, meta')
      .order('created_at', { ascending: false }),
    sb().from('diagnosticos')
      .select('id, cliente_id, created_at, data, periodo, versao')
      .order('created_at', { ascending: false }),
  ]);

  const byCliente = {};
  for (const d of diags || []) {
    if (!byCliente[d.cliente_id]) byCliente[d.cliente_id] = [];
    byCliente[d.cliente_id].push(d);
  }

  const clients = (clientes || []).map(c => {
    const ds     = byCliente[c.id] || [];
    const latest = ds[0]?.data || {};
    return {
      _clienteId:   c.id,
      _created_at:  c.created_at,
      _diagCount:   ds.length,
      _latestDiagId: ds[0]?.id,
      meta_info:    c.meta || {},
      nome_clinica: latest.nome_clinica || c.nome_clinica,
      responsavel:  c.responsavel,
      cidade_estado: latest.cidade_estado || c.cidade,
      whatsapp:     latest.whatsapp || c.whatsapp,
      ...latest,
    };
  });

  return NextResponse.json({ clients });
}

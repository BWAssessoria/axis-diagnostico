import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req, { params }) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const [{ data: cliente, error: cErr }, { data: diagnosticos }] = await Promise.all([
    sb().from('clientes').select('*').eq('id', id).single(),
    sb().from('diagnosticos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
  ]);

  if (cErr || !cliente) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ cliente, diagnosticos: diagnosticos || [] });
}

export async function PATCH(req, { params }) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { meta } = await req.json();

  const { error } = await sb().from('clientes').update({ meta }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { error } = await sb().from('clientes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession, hashPassword, generateSalt } from '@/lib/auth';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(req, { params }) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem editar contas' }, { status: 403 });
  }
  const { id } = await params;
  const { nome, email, role, password, ativo, is_admin } = await req.json();

  const update = {
    nome:     nome?.trim(),
    email:    email?.trim().toLowerCase() || null,
    role,
    ativo:    ativo !== undefined ? ativo : true,
    is_admin: !!is_admin,
  };

  if (password?.trim()) {
    const salt = generateSalt();
    update.senha_salt = salt;
    update.senha_hash = hashPassword(password.trim(), salt);
  }

  const { error } = await sb().from('membros').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem remover membros' }, { status: 403 });
  }
  const { id } = await params;

  const { error } = await sb().from('membros').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

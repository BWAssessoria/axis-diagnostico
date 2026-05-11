import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession, hashPassword, generateSalt } from '@/lib/auth';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  if (!getSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await sb()
    .from('membros')
    .select('id, nome, email, role, ativo, is_admin, created_at')
    .order('created_at', { ascending: true });

  return NextResponse.json({ membros: data || [] });
}

export async function POST(req) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem criar contas' }, { status: 403 });
  }

  const { nome, email, role, password, is_admin } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const membro = {
    nome:     nome.trim(),
    email:    email?.trim().toLowerCase() || null,
    role:     role || 'Consultor',
    ativo:    true,
    is_admin: !!is_admin,
  };

  if (password?.trim()) {
    const salt = generateSalt();
    membro.senha_salt = salt;
    membro.senha_hash = hashPassword(password.trim(), salt);
  }

  const { data, error } = await sb().from('membros').insert(membro).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ membro: data });
}

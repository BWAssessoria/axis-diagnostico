import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession, createSessionCookie, clearSessionCookie, hashPassword } from '@/lib/auth';

const sb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET — verifica sessão atual
export async function GET(req) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, name: session.name, role: session.role });
}

// POST — login (senha admin OU email+senha de membro)
export async function POST(req) {
  try {
    const body = await req.json();
    const { password, email } = body;
    let session = null;

    if (!email && password) {
      // Admin master password
      const adminPass = process.env.ADMIN_PASSWORD;
      if (adminPass && password === adminPass) {
        session = { role: 'admin', name: 'Admin' };
      }
    } else if (email && password) {
      // Membro da equipe
      const { data: m } = await sb()
        .from('membros')
        .select('id, nome, role, is_admin, senha_hash, senha_salt, ativo')
        .eq('email', email.toLowerCase().trim())
        .eq('ativo', true)
        .single();

      if (m?.senha_hash && m?.senha_salt) {
        const hash = hashPassword(password, m.senha_salt);
        if (hash === m.senha_hash) {
          session = { role: m.is_admin ? 'admin' : 'member', memberId: m.id, name: m.nome };
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const cookie = createSessionCookie(session);
    const res = NextResponse.json({ ok: true, name: session.name, role: session.role });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE — logout
export async function DELETE() {
  const cookie = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

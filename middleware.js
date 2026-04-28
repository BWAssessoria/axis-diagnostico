import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — não remova esta linha
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas públicas — acessíveis sem login
  const publicRoutes = ['/login'];
  if (publicRoutes.includes(pathname)) {
    if (user) {
      const role = await getUserRole(supabase, user.id);
      const dest = role === 'admin' ? '/admin' : '/portal';
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return supabaseResponse;
  }

  // Sem sessão → /login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Raiz "/" redireciona para o painel correto (impede acesso ao legado)
  if (pathname === '/') {
    const role = await getUserRole(supabase, user.id);
    const dest = role === 'admin' ? '/admin' : '/portal';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Proteção de rotas por papel
  const role = await getUserRole(supabase, user.id);

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/portal', request.url));
  }

  if (pathname.startsWith('/portal') && role !== 'client') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return supabaseResponse;
}

async function getUserRole(supabase, userId) {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role ?? 'client';
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

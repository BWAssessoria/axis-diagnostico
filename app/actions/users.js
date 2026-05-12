'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/assert-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function listUsers() {
  const { supabase } = await assertAdmin();

  const admin = createAdminClient();
  const [{ data: authData }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    supabase.from('user_profiles').select('id, role, client_id, clients(business_name)'),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (authData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    profile: profileMap[u.id] ?? null,
  }));
}

export async function createUser(prevState, formData) {
  await assertAdmin();

  const email     = formData.get('email')?.trim();
  const password  = formData.get('password');
  const role      = formData.get('role');
  const clientId  = formData.get('client_id') || null;
  const fullName  = formData.get('full_name')?.trim() || '';

  if (!email || !password || !role) {
    return { error: 'E-mail, senha e papel são obrigatórios.' };
  }
  if (password.length < 6) {
    return { error: 'Senha deve ter no mínimo 6 caracteres.' };
  }
  if (role === 'client' && !clientId) {
    return { error: 'Selecione o cliente vinculado ao portal.' };
  }

  const admin = createAdminClient();

  const { data, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) return { error: authError.message };

  const { error: profileError } = await admin
    .from('user_profiles')
    .insert({ id: data.user.id, role, client_id: clientId, full_name: fullName });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: 'Erro ao criar perfil. Tente novamente.' };
  }

  revalidatePath('/admin/settings/users');
  return { success: `Acesso criado para ${email}.` };
}

export async function deleteUser(userId) {
  await assertAdmin();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath('/admin/settings/users');
  return { success: true };
}

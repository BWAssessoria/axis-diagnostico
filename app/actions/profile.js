'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function getAuthedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');
  return { supabase, user };
}

export async function updateName(prevState, formData) {
  const { supabase } = await getAuthedUser();
  const full_name = formData.get('full_name')?.trim();
  if (!full_name) return { error: 'Nome não pode ser vazio.' };

  const { error } = await supabase.auth.updateUser({ data: { full_name } });
  if (error) return { error: error.message };

  // Sync to user_profiles table
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('user_profiles').update({ full_name }).eq('id', user.id);

  revalidatePath('/admin/settings/profile');
  return { success: 'Nome atualizado.' };
}

export async function updateEmail(prevState, formData) {
  const { supabase } = await getAuthedUser();
  const email = formData.get('email')?.trim();
  if (!email) return { error: 'E-mail não pode ser vazio.' };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };

  return { success: 'Verifique o novo e-mail para confirmar a alteração.' };
}

export async function updatePassword(prevState, formData) {
  const { supabase } = await getAuthedUser();
  const password = formData.get('password');
  const confirm  = formData.get('confirm');

  if (!password) return { error: 'Digite a nova senha.' };
  if (password.length < 6) return { error: 'Senha deve ter no mínimo 6 caracteres.' };
  if (password !== confirm) return { error: 'As senhas não conferem.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: 'Senha atualizada com sucesso.' };
}

export async function uploadAvatar(prevState, formData) {
  const { supabase, user } = await getAuthedUser();

  const file = formData.get('avatar');
  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado.' };
  if (file.size > 2 * 1024 * 1024) return { error: 'Arquivo deve ter no máximo 2 MB.' };

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) return { error: 'Formato inválido. Use JPG, PNG ou WebP.' };

  const ext  = file.name.split('.').pop().toLowerCase();
  const path = `${user.id}/avatar.${ext}`;

  // Try creating the bucket if it doesn't exist (idempotent)
  try {
    const admin = createAdminClient();
    await admin.storage.createBucket('avatars', { public: true });
  } catch (_) {}

  const { error: upError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (upError) return { error: upError.message };

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: metaError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });
  if (metaError) return { error: metaError.message };

  revalidatePath('/admin/settings/profile');
  return { success: 'Foto atualizada.', url: avatarUrl };
}

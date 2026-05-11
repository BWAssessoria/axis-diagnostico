'use server';

import { redirect } from 'next/navigation';
import { assertAdmin } from '@/lib/assert-admin';

export async function createAnalysis(clientId, prevState, formData) {
  const { supabase, user } = await assertAdmin();

  const payload = {
    client_id:         clientId,
    title:             formData.get('title'),
    content:           formData.get('content'),
    visible_to_client: formData.get('visible_to_client') === 'on',
    author_id:         user.id,
  };

  if (!payload.title?.trim()) return { error: 'Título é obrigatório.' };
  if (!payload.content?.trim()) return { error: 'Conteúdo é obrigatório.' };

  const { data, error } = await supabase
    .from('analyses')
    .insert(payload)
    .select('id')
    .single();

  if (error) return { error: 'Erro ao salvar análise.' };

  redirect(`/admin/clients/${clientId}/analyses/${data.id}`);
}

export async function updateAnalysis(clientId, analysisId, prevState, formData) {
  const { supabase } = await assertAdmin();

  const payload = {
    title:             formData.get('title'),
    content:           formData.get('content'),
    visible_to_client: formData.get('visible_to_client') === 'on',
  };

  if (!payload.title?.trim()) return { error: 'Título é obrigatório.' };
  if (!payload.content?.trim()) return { error: 'Conteúdo é obrigatório.' };

  const { error } = await supabase
    .from('analyses')
    .update(payload)
    .eq('id', analysisId)
    .eq('client_id', clientId);

  if (error) return { error: 'Erro ao salvar.' };
  return { success: true };
}

export async function deleteAnalysis(clientId, analysisId) {
  const { supabase } = await assertAdmin();
  await supabase.from('analyses').delete().eq('id', analysisId).eq('client_id', clientId);
  redirect(`/admin/clients/${clientId}?tab=analyses`);
}

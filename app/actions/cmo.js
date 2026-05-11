'use server';

import { assertAdmin } from '@/lib/assert-admin';
import { revalidatePath } from 'next/cache';

export async function saveMemory(clientId, content) {
  const { supabase } = await assertAdmin();

  const { error } = await supabase
    .from('cmo_memory')
    .upsert({ client_id: clientId, content, updated_at: new Date().toISOString() }, { onConflict: 'client_id' });

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}/cmo`);
  return { success: true };
}

export async function saveAnalysisFromCmo(clientId, title, content) {
  const { supabase, user } = await assertAdmin();

  const { error } = await supabase.from('analyses').insert({
    client_id:         clientId,
    title,
    content,
    visible_to_client: false,
    author_id:         user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

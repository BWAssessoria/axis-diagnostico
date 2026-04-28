'use server';

import { assertAdmin } from '@/lib/assert-admin';
import { revalidatePath } from 'next/cache';

export async function createUploadRecord(clientId, { type, label, fileName, fileUrl }) {
  const { supabase, user } = await assertAdmin();

  const { error } = await supabase.from('client_uploads').insert({
    client_id: clientId,
    type,
    label: label || null,
    file_name: fileName,
    file_url: fileUrl,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

export async function deleteUpload(id, clientId, storagePath) {
  const { supabase } = await assertAdmin();

  if (storagePath) {
    await supabase.storage.from('client-uploads').remove([storagePath]);
  }

  const { error } = await supabase.from('client_uploads').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

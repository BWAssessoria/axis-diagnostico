'use server';

import { assertAdmin } from '@/lib/assert-admin';
import { revalidatePath } from 'next/cache';

export async function createProductAsset(productId, { label, fileName, fileUrl, fileType }) {
  const { supabase } = await assertAdmin();
  const { error } = await supabase.from('product_assets').insert({
    product_id: productId,
    label:     label    || null,
    file_name: fileName || null,
    file_url:  fileUrl,
    file_type: fileType || 'pdf',
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

export async function deleteProductAsset(id, productId, storagePath) {
  const { supabase } = await assertAdmin();
  if (storagePath && !storagePath.startsWith('http')) {
    await supabase.storage.from('product-assets').remove([storagePath]);
  }
  const { error } = await supabase.from('product_assets').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}

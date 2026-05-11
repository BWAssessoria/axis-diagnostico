'use server';

import { redirect } from 'next/navigation';
import { assertAdmin } from '@/lib/assert-admin';

export async function updateProduct(id, stages, prevState, formData) {
  const { supabase } = await assertAdmin();

  const payload = {
    name:        formData.get('name'),
    description: formData.get('description') || null,
    methodology: formData.get('methodology') || null,
    active:      formData.get('active') === 'on',
    stages,
  };

  if (!payload.name) return { error: 'Nome é obrigatório.' };

  const { error } = await supabase.from('products').update(payload).eq('id', id);
  if (error) return { error: 'Erro ao salvar.' };

  return { success: true };
}

export async function createProduct(prevState, formData) {
  const { supabase } = await assertAdmin();

  const payload = {
    name:        formData.get('name'),
    slug:        formData.get('slug'),
    description: formData.get('description') || null,
    methodology: formData.get('methodology') || null,
    active:      true,
    stages:      [],
  };

  if (!payload.name || !payload.slug) return { error: 'Nome e slug são obrigatórios.' };

  const { data, error } = await supabase.from('products').insert(payload).select('id').single();
  if (error) return { error: 'Erro ao criar produto.' };

  redirect(`/admin/products/${data.id}`);
}

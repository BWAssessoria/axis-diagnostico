'use server';

import { redirect } from 'next/navigation';
import { assertAdmin } from '@/lib/assert-admin';

export async function updateClient(id, prevState, formData) {
  const { supabase } = await assertAdmin();

  const payload = {
    business_name: formData.get('business_name'),
    owner_name:    formData.get('owner_name'),
    email:         formData.get('email')      || null,
    phone:         formData.get('phone')      || null,
    segment:       formData.get('segment')    || null,
    product_id:    formData.get('product_id') || null,
    status:        formData.get('status')     || 'active',
    start_date:    formData.get('start_date') || null,
    sheets_url:    formData.get('sheets_url') || null,
    notes:         formData.get('notes')      || null,
  };

  if (!payload.business_name || !payload.owner_name) {
    return { error: 'Nome da empresa e responsável são obrigatórios.' };
  }

  const { error } = await supabase.from('clients').update(payload).eq('id', id);
  if (error) return { error: 'Erro ao salvar.' };

  return { success: true };
}

export async function createClient(prevState, formData) {
  const { supabase } = await assertAdmin();

  const payload = {
    business_name: formData.get('business_name'),
    owner_name:    formData.get('owner_name'),
    email:         formData.get('email')      || null,
    phone:         formData.get('phone')      || null,
    segment:       formData.get('segment')    || null,
    product_id:    formData.get('product_id') || null,
    status:        formData.get('status')     || 'active',
    start_date:    formData.get('start_date') || null,
    sheets_url:    formData.get('sheets_url') || null,
    notes:         formData.get('notes')      || null,
  };

  if (!payload.business_name || !payload.owner_name) {
    return { error: 'Nome da empresa e responsável são obrigatórios.' };
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select('id')
    .single();

  if (error) return { error: 'Erro ao salvar cliente. Tente novamente.' };

  redirect(`/admin/clients/${data.id}`);
}

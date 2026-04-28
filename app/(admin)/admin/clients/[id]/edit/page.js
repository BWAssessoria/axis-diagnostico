import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditClientForm from './_edit-client-form';

export default async function EditClientPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: products }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('products').select('id, name').eq('active', true).order('name'),
  ]);

  if (!client) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Editar cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">{client.business_name}</p>
      </div>
      <EditClientForm client={client} products={products ?? []} />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import NewClientForm from './new-client-form';

export const metadata = { title: 'Novo Cliente — AXIS 360' };

export default async function NewClientPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('active', true)
    .order('name');

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preencha os dados para cadastrar um novo cliente na carteira.</p>
      </div>
      <NewClientForm products={products ?? []} />
    </div>
  );
}

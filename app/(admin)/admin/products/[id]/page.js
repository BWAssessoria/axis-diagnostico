import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductForm from './_product-form';

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Editar produto</h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm product={product} />
    </div>
  );
}

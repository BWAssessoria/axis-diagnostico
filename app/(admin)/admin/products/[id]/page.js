import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductDetailTabs from './_product-detail-tabs';

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: assets }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('product_assets').select('*').eq('product_id', id).order('created_at', { ascending: false }),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Editar produto</h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductDetailTabs product={product} assets={assets ?? []} />
    </div>
  );
}

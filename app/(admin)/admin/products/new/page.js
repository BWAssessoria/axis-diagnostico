import NewProductForm from './_new-product-form';

export const metadata = { title: 'Novo Produto — AXIS 360' };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Novo Produto</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cadastre um novo produto ou metodologia AXIS</p>
      </div>
      <NewProductForm />
    </div>
  );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Plus } from 'lucide-react';

export const metadata = { title: 'Produtos — AXIS 360' };

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, clients(count)')
    .order('name');

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos & Metodologias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os produtos e metodologias da AXIS</p>
        </div>
        <Button asChild size="sm" className="h-9 gap-2 font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)', boxShadow: '0 4px 14px rgba(240,200,32,0.35)' }}>
          <Link href="/admin/products/new">
            <Plus size={14} />
            Novo produto
          </Link>
        </Button>
      </div>

      {!products?.length ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <Package size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => (
            <Card key={p.id} className="gap-0 overflow-hidden p-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-foreground">{p.name}</h2>
                      <Badge variant={p.active ? 'default' : 'secondary'} className="text-xs">
                        {p.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>

                    {/* Etapas — stepper horizontal */}
                    {p.stages?.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                          Jornada de implementação
                        </p>
                        <div className="overflow-x-auto pb-1">
                          <div className="flex min-w-max items-start">
                            {p.stages.map((s, i) => (
                              <div key={s.order} className="flex flex-1 flex-col" style={{ minWidth: 88 }}>
                                {/* node + connectors */}
                                <div className="flex items-center">
                                  <div
                                    className="h-px flex-1"
                                    style={{ background: i === 0 ? 'transparent' : 'var(--axis-border)' }}
                                  />
                                  <div
                                    className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                    style={{ background: 'var(--bronze-glow)', color: 'var(--bronze)', border: '1px solid var(--bronze-border)' }}
                                  >
                                    {s.order}
                                  </div>
                                  <div
                                    className="h-px flex-1"
                                    style={{ background: i === p.stages.length - 1 ? 'transparent' : 'var(--axis-border)' }}
                                  />
                                </div>
                                {/* label */}
                                <div className="mt-2.5 px-1 text-center">
                                  <p className="text-[11px] font-medium leading-tight text-foreground/80">{s.title}</p>
                                  {s.description && (
                                    <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground/60">{s.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button asChild variant="outline" size="sm" className="ml-4 h-8 shrink-0">
                    <Link href={`/admin/products/${p.id}`}>Editar</Link>
                  </Button>
                </div>

                {p.methodology && (
                  <p className="mt-4 border-t border-border/20 pt-4 text-xs leading-relaxed text-muted-foreground">
                    {p.methodology}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

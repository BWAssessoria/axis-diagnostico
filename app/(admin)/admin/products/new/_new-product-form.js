'use client';

import { useActionState } from 'react';
import { createProduct } from '@/app/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const textareaClass = [
  'resize-y rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5',
  'text-sm text-foreground placeholder:text-muted-foreground/40 outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30 transition-colors',
].join(' ');

export default function NewProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl p-8" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-foreground">Nome *</Label>
          <Input name="name" required placeholder="Ex: PAE Premium"
            className="h-10 border-border/60 bg-secondary/30 placeholder:text-muted-foreground/40 focus-visible:border-ring/50 focus-visible:ring-ring/30" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-foreground">Slug *</Label>
          <Input name="slug" required placeholder="Ex: pae_premium"
            className="h-10 border-border/60 bg-secondary/30 placeholder:text-muted-foreground/40 focus-visible:border-ring/50 focus-visible:ring-ring/30" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">Descrição</Label>
        <Input name="description" placeholder="Descrição curta do produto"
          className="h-10 border-border/60 bg-secondary/30 placeholder:text-muted-foreground/40 focus-visible:border-ring/50 focus-visible:ring-ring/30" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">Metodologia</Label>
        <textarea name="methodology" rows={4} placeholder="Descreva a metodologia deste produto..." className={textareaClass} />
      </div>

      {state?.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-border/30 pt-2">
        <Button asChild variant="outline" size="sm" className="h-9">
          <Link href="/admin/products">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          size="sm"
          className="h-9 font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
            boxShadow: '0 4px 14px rgba(240,200,32,0.35)',
          }}
        >
          {isPending ? 'Criando...' : 'Criar produto'}
        </Button>
      </div>
    </form>
  );
}

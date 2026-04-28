'use client';

import { useActionState, useState } from 'react';
import { updateProduct } from '@/app/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const textareaClass = [
  'resize-y rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5',
  'text-sm text-foreground placeholder:text-muted-foreground/40 outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30 transition-colors',
].join(' ');

const stageInputClass = [
  'rounded-lg border border-border/60 bg-background px-2.5 py-1.5',
  'text-sm text-foreground placeholder:text-muted-foreground/40 outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/20 transition-colors',
].join(' ');

export default function ProductForm({ product }) {
  const [stages, setStages] = useState(product.stages ?? []);
  const action = updateProduct.bind(null, product.id, stages);
  const [state, formAction, isPending] = useActionState(action, { error: null });

  function addStage() {
    setStages([...stages, { order: stages.length + 1, title: '', description: '' }]);
  }

  function removeStage(i) {
    setStages(stages.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  function updateStage(i, field, value) {
    setStages(stages.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl p-8" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">Nome do produto *</Label>
        <Input name="name" defaultValue={product.name} required
          className="h-10 border-border/60 bg-secondary/30 placeholder:text-muted-foreground/40 focus-visible:border-ring/50 focus-visible:ring-ring/30" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">Descrição</Label>
        <Input name="description" defaultValue={product.description ?? ''}
          className="h-10 border-border/60 bg-secondary/30 placeholder:text-muted-foreground/40 focus-visible:border-ring/50 focus-visible:ring-ring/30" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">Metodologia</Label>
        <textarea name="methodology" rows={4} defaultValue={product.methodology ?? ''} className={textareaClass} />
      </div>

      {/* Etapas */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">Etapas da metodologia</Label>
          <button
            type="button"
            onClick={addStage}
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--bronze)' }}
          >
            + Adicionar etapa
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {stages.map((stage, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-border/40 p-3"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: 'var(--bronze-glow)', color: 'var(--bronze)', border: '1px solid var(--bronze-border)' }}
              >
                {stage.order}
              </span>
              <div className="flex flex-1 flex-col gap-2">
                <input
                  value={stage.title}
                  onChange={(e) => updateStage(i, 'title', e.target.value)}
                  placeholder="Título da etapa"
                  className={stageInputClass}
                />
                <input
                  value={stage.description}
                  onChange={(e) => updateStage(i, 'description', e.target.value)}
                  placeholder="Descrição"
                  className={stageInputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeStage(i)}
                className="mt-0.5 text-muted-foreground/40 transition-colors hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          id="active"
          name="active"
          defaultChecked={product.active}
          className="h-4 w-4 rounded border-border"
          style={{ accentColor: 'var(--bronze)' }}
        />
        <Label htmlFor="active" className="cursor-pointer text-sm text-foreground">Produto ativo</Label>
      </label>

      {state?.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-400">
          Salvo com sucesso!
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
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

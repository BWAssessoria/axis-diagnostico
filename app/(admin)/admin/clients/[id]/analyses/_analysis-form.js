'use client';

import { useActionState } from 'react';
import { createAnalysis, updateAnalysis } from '@/app/actions/analyses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const TEMPLATES = [
  {
    label: 'Análise mensal',
    title: 'Análise Mensal — {mês}/{ano}',
    content: `## Resultado do mês

**Faturamento:** R$
**Meta:** R$
**% da meta:** %

## Pontos positivos

-

## Pontos de atenção

-

## Direcionamento para o próximo mês

**Tráfego:**
**Estratégia:**
**Sucesso do Cliente:** `,
  },
  {
    label: 'Diagnóstico comercial',
    title: 'Diagnóstico Comercial',
    content: `## Funil de vendas

**Leads no período:**
**Agendamentos:**
**Comparecimentos:**
**Vendas fechadas:**

## Gargalo identificado

## Recomendação`,
  },
  {
    label: 'Revisão de estratégia',
    title: 'Revisão Estratégica',
    content: `## Contexto

## O que está funcionando

## O que precisa mudar

## Próximos 30 dias

1.
2.
3. `,
  },
];

export default function AnalysisForm({ clientId, analysis }) {
  const isEdit = !!analysis;
  const action = isEdit
    ? updateAnalysis.bind(null, clientId, analysis.id)
    : createAnalysis.bind(null, clientId);

  const [state, formAction, isPending] = useActionState(action, { error: null });

  function applyTemplate(tpl) {
    const now = new Date();
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const title   = tpl.title.replace('{mês}', months[now.getMonth()]).replace('{ano}', now.getFullYear());
    document.getElementById('analysis-title').value   = title;
    document.getElementById('analysis-content').value = tpl.content;
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl p-8"
      style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
    >
      {/* Templates rápidos */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Templates rápidos</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-foreground/70 transition-all hover:border-[var(--bronze-border)] hover:text-[var(--bronze)] hover:bg-[var(--bronze-glow)]"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border/30" />

      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="analysis-title" className="text-sm font-medium text-foreground">Título *</Label>
        <Input
          id="analysis-title"
          name="title"
          required
          defaultValue={analysis?.title ?? ''}
          placeholder="Ex: Análise Mensal — Abril/2026"
          className="h-10 border-border/60 bg-secondary/30 placeholder:text-muted-foreground/40 focus-visible:border-ring/50 focus-visible:ring-ring/30"
        />
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="analysis-content" className="text-sm font-medium text-foreground">
          Conteúdo *
          <span className="ml-2 font-normal text-muted-foreground/60">(suporta Markdown)</span>
        </Label>
        <textarea
          id="analysis-content"
          name="content"
          required
          rows={18}
          defaultValue={analysis?.content ?? ''}
          placeholder="Escreva a análise aqui..."
          className="resize-y rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-ring/50 focus:ring-1 focus:ring-ring/30 transition-colors"
        />
      </div>

      {/* Visibilidade */}
      <label
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 px-4 py-3 transition-colors hover:bg-secondary/30"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <input
          type="checkbox"
          name="visible_to_client"
          defaultChecked={analysis?.visible_to_client ?? false}
          className="h-4 w-4 rounded border-border"
          style={{ accentColor: 'var(--bronze)' }}
        />
        <div>
          <p className="text-sm font-medium text-foreground">Visível ao cliente</p>
          <p className="text-xs text-muted-foreground">O cliente poderá ler esta análise no portal</p>
        </div>
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
          <Link href={`/admin/clients/${clientId}?tab=analyses`}>Cancelar</Link>
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
          {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar análise'}
        </Button>
      </div>
    </form>
  );
}

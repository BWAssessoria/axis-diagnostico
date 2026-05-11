'use client';

import { useActionState } from 'react';
import { createClient } from '@/app/actions/clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const initialState = { error: null };

const selectClass = [
  'rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5',
  'text-sm text-foreground outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30',
  'transition-colors',
].join(' ');

const textareaClass = [
  'w-full resize-y rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5',
  'text-sm text-foreground placeholder:text-muted-foreground/40 outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30',
  'transition-colors',
].join(' ');

export default function NewClientForm({ products }) {
  const [state, formAction, isPending] = useActionState(createClient, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl p-8" style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome da empresa *" name="business_name" placeholder="Clínica Exemplo" required />
        <Field label="Nome do responsável *" name="owner_name" placeholder="Dra. Ana Silva" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="E-mail" name="email" type="email" placeholder="contato@clinica.com.br" />
        <Field label="Telefone" name="phone" placeholder="(11) 99999-9999" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-foreground">Produto contratado</Label>
          <select name="product_id" className={selectClass}>
            <option value="">Selecionar produto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-foreground">Status</Label>
          <select name="status" defaultValue="active" className={selectClass}>
            <option value="lead">Lead</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Data de início" name="start_date" type="date" />
        <Field label="Link da planilha PGM" name="sheets_url" placeholder="https://docs.google.com/..." />
      </div>

      <Field label="Segmento" name="segment" placeholder="Clínica de estética avançada" />

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-foreground">Observações internas</Label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Informações relevantes sobre o cliente..."
          className={textareaClass}
        />
      </div>

      {state?.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-border/30 pt-2">
        <Button asChild variant="outline" size="sm" className="h-9">
          <Link href="/admin">Cancelar</Link>
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
          {isPending ? 'Salvando...' : 'Salvar cliente'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, name, type = 'text', placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} className="text-sm font-medium text-foreground">{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-10 border-border/60 bg-secondary/30 placeholder:text-muted-foreground/40 focus-visible:border-ring/50 focus-visible:ring-ring/30"
      />
    </div>
  );
}

'use client';

import { useActionState, useState, useEffect } from 'react';
import { createUser } from '@/app/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, X } from 'lucide-react';

const selectClass = [
  'w-full rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5',
  'text-sm text-foreground outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/30',
  'transition-colors',
].join(' ');

export default function CreateUserForm({ clients }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('admin');
  const [state, formAction, isPending] = useActionState(createUser, null);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state]);

  return (
    <div>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ background: 'var(--bronze)', color: '#000' }}
        >
          <UserPlus size={14} />
          Novo acesso
        </button>
      )}

      {open && (
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--axis-border)', background: 'var(--bg-elevated)' }}>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Criar novo acesso</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <X size={16} />
            </button>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome completo</Label>
                <Input name="full_name" placeholder="Ex: João Silva" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">E-mail *</Label>
                <Input name="email" type="email" placeholder="email@exemplo.com" required className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Senha inicial *</Label>
                <Input name="password" type="password" placeholder="Mín. 6 caracteres" required className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Papel *</Label>
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={selectClass}
                >
                  <option value="admin">Admin (sistema interno)</option>
                  <option value="client">Cliente (portal)</option>
                </select>
              </div>
            </div>

            {role === 'client' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Vincular ao cliente *</Label>
                <select name="client_id" required className={selectClass}>
                  <option value="">Selecione um cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
              </div>
            )}

            {state?.error && (
              <p className="rounded-lg px-3 py-2 text-xs font-medium text-destructive" style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)' }}>
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="rounded-lg px-3 py-2 text-xs font-medium text-green-400" style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }}>
                {state.success}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Criando...' : 'Criar acesso'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialState = { error: null };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="h-10 bg-background/60 border-border/70 placeholder:text-muted-foreground/50 focus-visible:border-[var(--bronze)] focus-visible:ring-[var(--bronze)]/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-10 bg-background/60 border-border/70 placeholder:text-muted-foreground/50 focus-visible:border-[var(--bronze)] focus-visible:ring-[var(--bronze)]/20"
        />
      </div>

      {state?.error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="mt-1 h-10 w-full text-sm font-semibold text-white disabled:opacity-60"
        style={{
          background: isPending
            ? 'var(--bronze-dim)'
            : 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
          boxShadow: isPending ? 'none' : '0 4px 16px rgba(240,200,32,0.38)',
        }}
      >
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}

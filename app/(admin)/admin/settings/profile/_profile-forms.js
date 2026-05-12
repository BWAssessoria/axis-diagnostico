'use client';

import { useActionState, useRef, useState } from 'react';
import { updateName, updateEmail, updatePassword, uploadAvatar } from '@/app/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Check, AlertCircle } from 'lucide-react';

function StatusMsg({ state }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-red-400">
        <AlertCircle size={12} /> {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-green-400">
        <Check size={12} /> {state.success}
      </p>
    );
  }
  return null;
}

function FormSection({ title, description, children }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
    >
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Avatar upload ──────────────────────────────────────────────────────────────
export function AvatarForm({ currentUrl, initial }) {
  const [state, formAction, isPending] = useActionState(uploadAvatar, null);
  const [preview, setPreview] = useState(currentUrl || null);
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <FormSection title="Foto de perfil" description="JPG, PNG ou WebP. Máximo 2 MB.">
      <form action={formAction} className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl font-bold"
            style={{ background: 'var(--bronze-glow)', color: 'var(--bronze)', border: '2px solid var(--bronze-border)' }}
          >
            {preview ? (
              <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--bronze)' }}
          >
            <Camera size={11} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            name="avatar"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Escolher foto
          </Button>
          {preview && preview !== currentUrl && (
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar foto'}
            </Button>
          )}
          <StatusMsg state={state} />
        </div>
      </form>
    </FormSection>
  );
}

// ── Name form ──────────────────────────────────────────────────────────────────
export function NameForm({ currentName }) {
  const [state, formAction, isPending] = useActionState(updateName, null);

  return (
    <FormSection title="Nome de exibição">
      <form action={formAction} className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nome completo</Label>
          <Input
            name="full_name"
            defaultValue={currentName}
            placeholder="Seu nome"
            className="h-9 text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending} className="shrink-0">
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
      <div className="mt-2">
        <StatusMsg state={state} />
      </div>
    </FormSection>
  );
}

// ── Email form ─────────────────────────────────────────────────────────────────
export function EmailForm({ currentEmail }) {
  const [state, formAction, isPending] = useActionState(updateEmail, null);

  return (
    <FormSection title="E-mail" description="Após salvar, você receberá um link de confirmação no novo endereço.">
      <form action={formAction} className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Endereço de e-mail</Label>
          <Input
            name="email"
            type="email"
            defaultValue={currentEmail}
            placeholder="email@exemplo.com"
            className="h-9 text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={isPending} className="shrink-0">
          {isPending ? 'Salvando...' : 'Atualizar'}
        </Button>
      </form>
      <div className="mt-2">
        <StatusMsg state={state} />
      </div>
    </FormSection>
  );
}

// ── Password form ──────────────────────────────────────────────────────────────
export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, null);

  return (
    <FormSection title="Senha" description="Use uma senha forte com pelo menos 6 caracteres.">
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nova senha</Label>
            <Input name="password" type="password" placeholder="••••••••" className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Confirmar senha</Label>
            <Input name="confirm" type="password" placeholder="••••••••" className="h-9 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Salvando...' : 'Alterar senha'}
          </Button>
          <StatusMsg state={state} />
        </div>
      </form>
    </FormSection>
  );
}

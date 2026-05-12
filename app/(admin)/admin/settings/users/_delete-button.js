'use client';

import { useState } from 'react';
import { deleteUser } from '@/app/actions/users';
import { Trash2 } from 'lucide-react';

export default function DeleteUserButton({ userId, email }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteUser(userId);
    setLoading(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded px-2 py-0.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          {loading ? '...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-0.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Remover ${email}`}
      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
    >
      <Trash2 size={13} />
    </button>
  );
}

'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function RecalcularHealthButton({ clientIds }) {
  const [state, setState] = useState('idle'); // idle | loading | done
  const [progress, setProgress] = useState(0);

  async function recalcular() {
    if (state === 'loading') return;
    setState('loading');
    setProgress(0);

    for (let i = 0; i < clientIds.length; i++) {
      await fetch(`/api/health-score/${clientIds[i]}`, { method: 'POST' });
      setProgress(i + 1);
    }

    setState('done');
    setTimeout(() => {
      setState('idle');
      window.location.reload();
    }, 1200);
  }

  return (
    <button
      onClick={recalcular}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-white/[0.14] hover:text-foreground disabled:opacity-50"
    >
      <RefreshCw size={12} className={state === 'loading' ? 'animate-spin' : ''} />
      {state === 'loading'
        ? `Recalculando… ${progress}/${clientIds.length}`
        : state === 'done'
        ? '✓ Atualizado'
        : 'Recalcular scores'}
    </button>
  );
}

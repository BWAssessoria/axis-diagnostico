'use client';

import { deleteAnalysis } from '@/app/actions/analyses';

export default function DeleteButton({ clientId, analysisId }) {
  const action = deleteAnalysis.bind(null, clientId, analysisId);

  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => { if (!confirm('Remover esta análise?')) e.preventDefault(); }}
        className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
      >
        Remover
      </button>
    </form>
  );
}

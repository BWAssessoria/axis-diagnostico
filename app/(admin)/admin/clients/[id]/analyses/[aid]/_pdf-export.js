'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';

export default function PdfExportButton({ analysisId }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pdf/${analysisId}`);
      if (!res.ok) throw new Error('Erro ao gerar PDF');

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = res.headers.get('content-disposition')
        ?.match(/filename="(.+)"/)?.[1] ?? 'analise.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      title="Exportar como PDF"
      className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
    >
      <FileDown size={13} />
      {loading ? 'Gerando...' : 'Exportar PDF'}
    </button>
  );
}

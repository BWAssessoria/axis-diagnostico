'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MonthlyAnalysisButton({ clientId }) {
  const router = useRouter();
  const [state, setState]       = useState('idle');
  const [preview, setPreview]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [preview]);

  async function generate() {
    setState('loading');
    setPreview('');
    setShowModal(true);

    try {
      const res = await fetch(`/api/monthly-analysis/${clientId}`, { method: 'POST' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Erro ao gerar análise');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setPreview((p) => p + decoder.decode(value, { stream: true }));
      }
      setState('done');
    } catch (err) {
      setPreview(err.message);
      setState('error');
    }
  }

  function finish() {
    setShowModal(false);
    setState('idle');
    setPreview('');
    router.push(`/admin/clients/${clientId}?tab=analyses`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={generate}
        disabled={state === 'loading'}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        style={{ border: '1px solid rgba(59,130,246,.3)', background: 'rgba(59,130,246,.1)', color: '#60a5fa' }}
      >
        📊 {state === 'loading' ? 'Gerando análise...' : 'Análise do Mês'}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            className="flex w-full max-w-3xl flex-col rounded-2xl shadow-2xl"
            style={{ maxHeight: '85vh', border: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <span>📊</span>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Análise Mensal Inteligente</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {state === 'loading' && 'Comparando PGM atual com o Plano Estratégico...'}
                    {state === 'done'    && 'Análise gerada e salva.'}
                    {state === 'error'   && 'Ocorreu um erro.'}
                  </p>
                </div>
              </div>
              {state === 'loading' && <div className="h-2 w-2 animate-ping rounded-full bg-blue-400" />}
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed"
              style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}
            >
              {preview || <span style={{ color: 'var(--text-muted)' }}>Iniciando análise...</span>}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              {state === 'loading' && (
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm transition"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Fechar
                </button>
              )}
              {(state === 'done' || state === 'error') && (
                <button
                  onClick={finish}
                  className="rounded-lg px-6 py-2 text-sm font-semibold text-white transition"
                  style={{ background: 'var(--bronze)' }}
                >
                  {state === 'done' ? 'Ver Análise →' : 'Fechar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

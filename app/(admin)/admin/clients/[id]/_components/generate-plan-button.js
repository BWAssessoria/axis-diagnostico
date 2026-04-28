'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratePlanButton({ clientId, hasDiagnostic }) {
  const router = useRouter();
  const [state, setState] = useState('idle');
  const [preview, setPreview] = useState('');
  const [showModal, setShowModal] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [preview]);

  async function generate() {
    if (!hasDiagnostic) return;
    setState('loading');
    setPreview('');
    setShowModal(true);

    try {
      const res = await fetch(`/api/strategic-plan/${clientId}`, { method: 'POST' });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Erro ao gerar plano');
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
        disabled={!hasDiagnostic || state === 'loading'}
        title={!hasDiagnostic ? 'Preencha o diagnóstico 360 primeiro' : 'Gerar Plano Estratégico com IA'}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
        style={
          hasDiagnostic
            ? { border: '1px solid var(--bronze-border)', background: 'var(--bronze-glow)', color: 'var(--bronze)' }
            : { border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'not-allowed' }
        }
      >
        <span>✦</span>
        {state === 'loading' ? 'Gerando plano...' : 'Gerar Plano Estratégico'}
      </button>

      {/* Modal de geração */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            className="flex w-full max-w-3xl flex-col rounded-2xl shadow-2xl"
            style={{ maxHeight: '85vh', border: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <span style={{ color: 'var(--bronze)' }}>✦</span>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Gerador de Plano Estratégico</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {state === 'loading' && 'Claude está analisando os dados e gerando o plano...'}
                    {state === 'done'    && 'Plano gerado e salvo em Análises.'}
                    {state === 'error'   && 'Ocorreu um erro durante a geração.'}
                  </p>
                </div>
              </div>
              {state === 'loading' && (
                <div className="h-2 w-2 animate-ping rounded-full" style={{ background: 'var(--bronze)' }} />
              )}
            </div>

            {/* Preview do plano (streaming) */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed"
              style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}
            >
              {preview || (
                <span style={{ color: 'var(--text-muted)' }}>Iniciando geração...</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              {state === 'loading' && (
                <button
                  onClick={() => { setShowModal(false); setState('idle'); }}
                  className="rounded-lg px-4 py-2 text-sm transition"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Fechar (geração continua em segundo plano)
                </button>
              )}
              {(state === 'done' || state === 'error') && (
                <button
                  onClick={finish}
                  className="rounded-lg px-6 py-2 text-sm font-semibold text-white transition"
                  style={{ background: 'var(--bronze)' }}
                >
                  {state === 'done' ? 'Ver Plano em Análises →' : 'Fechar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

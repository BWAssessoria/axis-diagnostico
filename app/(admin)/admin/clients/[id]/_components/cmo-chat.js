'use client';

import { useState, useRef, useEffect } from 'react';
import { saveMemory, saveAnalysisFromCmo } from '@/app/actions/cmo';
import { Button } from '@/components/ui/button';
import { Bot, Send, RotateCcw, Sparkles, Brain } from 'lucide-react';

const PRESETS = [
  { label: 'Revisão mensal',         prompt: 'Faça uma revisão completa do mês atual: faturamento vs. meta, funil de vendas com comparação de benchmarks, ticket médio, e as 3 ações prioritárias para o próximo mês.' },
  { label: 'Auditoria do funil',     prompt: 'Audite o funil de vendas etapa por etapa (leads → agendamentos → comparecimentos → vendas). Compare com benchmarks de mercado, identifique onde estão as maiores perdas e sugira ações específicas para cada gargalo.' },
  { label: 'Plano 30 dias',          prompt: 'Monte um plano de ação para os próximos 30 dias com foco em maximizar faturamento. Priorize as 3 alavancas de maior impacto imediato considerando o momento atual da clínica e a sazonalidade.' },
  { label: 'Tendência e meta anual', prompt: 'Analise a tendência de faturamento dos últimos meses. Estamos no ritmo certo para bater a meta anual? Se não, qual seria o crescimento necessário? O que precisa mudar?' },
  { label: 'Reativação e recorrência', prompt: 'Analise o padrão de retorno dos pacientes. Quantos são recorrentes? Há sinais de churn? Sugira uma estratégia concreta de reativação e recorrência para os próximos 60 dias.' },
  { label: 'Diagnóstico de crescimento', prompt: 'Qual é o maior limitante de crescimento desta clínica agora? Considere todos os dados disponíveis — funil, ticket, capacidade, canais — e aponte o bottleneck principal com evidências dos dados.' },
];

function AiProse({ content }) {
  return (
    <div className="space-y-2 text-sm leading-7 text-foreground/85">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return (
          <p key={i} className="mt-4 text-[13px] font-semibold tracking-tight text-foreground first:mt-0">{line.slice(4)}</p>
        );
        if (line.startsWith('## ')) return (
          <p key={i} className="mt-5 text-sm font-bold tracking-tight text-foreground first:mt-0">{line.slice(3)}</p>
        );
        if (line.startsWith('# ')) return (
          <p key={i} className="mt-5 text-base font-bold tracking-tight text-foreground first:mt-0">{line.slice(2)}</p>
        );
        if (/^\d+\.\s/.test(line)) return (
          <div key={i} className="flex gap-2.5">
            <span className="mt-0.5 text-xs font-semibold tabular-nums" style={{ color: 'var(--bronze)', minWidth: 16 }}>
              {line.match(/^\d+/)[0]}.
            </span>
            <span className="flex-1">{line.replace(/^\d+\.\s*/, '')}</span>
          </div>
        );
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} className="flex gap-2.5">
            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--bronze)' }} />
            <span className="flex-1">{line.slice(2)}</span>
          </div>
        );
        if (line.startsWith('> ')) return (
          <p key={i} className="pl-4 italic text-muted-foreground/80" style={{ borderLeft: '2px solid rgba(240,200,32,0.3)' }}>
            {line.slice(2)}
          </p>
        );
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

function MessageBubble({ msg, onSaveAnalysis }) {
  const isUser = msg.role === 'user';
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function handleSave() {
    const title = `CMO — ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    setSaving(true);
    await onSaveAnalysis(title, msg.content);
    setSaving(false);
    setSaved(true);
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[72%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed text-foreground"
          style={{ background: 'var(--bronze-glow)', border: '1px solid var(--bronze-border)' }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="w-full max-w-3xl rounded-2xl rounded-tl-sm px-5 py-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <AiProse content={msg.content} />
      </div>
      {msg.content && (
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="ml-1 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: saved ? 'var(--bronze)' : 'var(--text-muted)' }}
        >
          {saved ? '✓ Salvo nas análises' : saving ? 'Salvando...' : '↓ Salvar como análise'}
        </button>
      )}
    </div>
  );
}

export default function CmoChat({ clientId, initialMemory = '' }) {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [memory, setMemory]         = useState(initialMemory);
  const [showMemory, setShowMemory] = useState(false);
  const [savingMem, setSavingMem]   = useState(false);
  const [extracting, setExtracting] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const prompt = text ?? input.trim();
    if (!prompt || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: prompt };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/cmo/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: full };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: `Erro: ${err.message}` };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleExtractMemory() {
    if (!messages.length) return;
    setExtracting(true);
    try {
      const res = await fetch(`/api/cmo/${clientId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, currentMemory: memory }),
      });
      const data = await res.json();
      if (data.memory) setMemory(data.memory);
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  }

  async function handleSaveMemory() {
    setSavingMem(true);
    await saveMemory(clientId, memory);
    setSavingMem(false);
  }

  async function handleSaveAnalysis(title, content) {
    await saveAnalysisFromCmo(clientId, title, content);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Memória estratégica */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--axis-border)', background: 'var(--bg-surface)' }}
      >
        <button
          onClick={() => setShowMemory((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium transition-colors hover:bg-secondary/30"
        >
          <span className="flex items-center gap-2 text-foreground/80">
            <Brain size={14} style={{ color: 'var(--bronze)' }} />
            Memória estratégica do cliente
            {memory && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: 'var(--bronze-glow)', color: 'var(--bronze)', border: '1px solid var(--bronze-border)' }}
              >
                ativa
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">{showMemory ? '▲' : '▼'}</span>
        </button>

        {showMemory && (
          <div className="border-t border-border/30 px-5 pb-4 pt-3">
            <textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              rows={8}
              placeholder="A memória acumula aprendizados sobre o cliente entre sessões. Use 'Extrair insights' após uma conversa para atualizar automaticamente, ou edite manualmente."
              className="w-full resize-y rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mt-2.5 flex justify-end gap-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtractMemory}
                  disabled={extracting}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Sparkles size={12} />
                  {extracting ? 'Extraindo...' : 'Extrair insights'}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveMemory}
                disabled={savingMem}
                className="h-8 gap-1.5 text-xs font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
                  boxShadow: '0 2px 8px rgba(240,200,32,0.35)',
                }}
              >
                {savingMem ? 'Salvando...' : 'Salvar memória'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Presets */}
      {messages.length === 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Análises rápidas</p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => send(p.prompt)}
                disabled={loading}
                className="group rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150 disabled:opacity-40 hover:scale-[1.01] hover:border-[var(--bronze-border)] hover:bg-[var(--bg-elevated)]"
                style={{ borderColor: 'var(--axis-border)', background: 'var(--bg-surface)' }}
              >
                <span className="block font-medium text-foreground">{p.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {p.prompt.slice(0, 70)}…
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat window */}
      <div
        className="flex h-[calc(100vh-460px)] min-h-[400px] flex-col gap-3 overflow-y-auto rounded-xl p-4"
        style={{ border: '1px solid var(--axis-border)', background: 'var(--bg)' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'var(--bronze-glow)', border: '1px solid var(--bronze-border)' }}
              >
                <Bot size={22} style={{ color: 'var(--bronze)' }} />
              </div>
              <p className="text-sm text-muted-foreground">Selecione uma análise ou faça uma pergunta.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onSaveAnalysis={handleSaveAnalysis} />
          ))
        )}
        {loading && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start" role="status" aria-label="Carregando resposta">
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-elevated)' }}>
              <span className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages([])}
            className="h-10 shrink-0 gap-1.5 text-xs"
          >
            <RotateCcw size={12} />
            Limpar
          </Button>
        )}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Faça uma pergunta… (Enter para enviar, Shift+Enter para nova linha)"
          aria-label="Mensagem para o CMO"
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border/60 bg-secondary/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-ring/50 focus:outline-none focus:ring-1 focus:ring-ring/30 transition-colors"
        />
        <Button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          aria-label="Enviar mensagem"
          size="sm"
          className="h-10 shrink-0 gap-1.5 font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--bronze) 0%, var(--bronze-dim) 100%)',
            boxShadow: '0 4px 14px rgba(240,200,32,0.35)',
          }}
        >
          <Send size={14} />
          {loading ? '...' : 'Enviar'}
        </Button>
      </div>
    </div>
  );
}

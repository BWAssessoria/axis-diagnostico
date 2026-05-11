'use client';

import { useState, useTransition } from 'react';
import { updateAction } from '@/app/actions/plan-actions';

// ── Status ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pendente:     { label: 'A fazer',      color: 'text-muted-foreground', dot: 'bg-muted-foreground/40', col: 'border-white/[0.06]' },
  em_andamento: { label: 'Em andamento', color: 'text-yellow-400',       dot: 'bg-yellow-400',          col: 'border-yellow-500/20' },
  concluida:    { label: 'Concluída',    color: 'text-emerald-400',      dot: 'bg-emerald-400',         col: 'border-emerald-500/20' },
  bloqueada:    { label: 'Bloqueada',    color: 'text-red-400',          dot: 'bg-red-400',             col: 'border-red-500/20' },
};

const KANBAN_ORDER = ['pendente', 'em_andamento', 'concluida', 'bloqueada'];

// ── Pilar ─────────────────────────────────────────────────────────────────────
const PILAR_CONFIG = {
  posicionamento: { label: 'Posicionamento', color: 'text-blue-400',   dot: 'bg-blue-400',   border: 'border-blue-500/20',   bar: 'bg-blue-500'   },
  comercial:      { label: 'Comercial',      color: 'text-purple-400', dot: 'bg-purple-400', border: 'border-purple-500/20', bar: 'bg-purple-500' },
  trafego:        { label: 'Tráfego',        color: 'text-orange-400', dot: 'bg-orange-400', border: 'border-orange-500/20', bar: 'bg-orange-500' },
  protocolo:      { label: 'Protocolo',      color: 'text-amber-400',  dot: 'bg-amber-400',  border: 'border-amber-500/20',  bar: 'bg-amber-500'  },
  outros:         { label: 'Outros',         color: 'text-muted-foreground', dot: 'bg-muted-foreground/40', border: 'border-white/[0.07]', bar: 'bg-muted-foreground/40' },
};

const PILAR_ORDER = ['posicionamento', 'comercial', 'trafego', 'protocolo', 'outros'];

const ASSIGNEE_LABEL = { consultor: 'Consultor', cliente: 'Cliente', ambos: 'Ambos' };

const inputClass = [
  'w-full rounded-lg border border-white/[0.08] bg-background px-2.5 py-1.5',
  'text-xs text-foreground placeholder:text-muted-foreground/40 outline-none',
  'focus:border-ring/50 focus:ring-1 focus:ring-ring/20 transition-colors',
].join(' ');

// ── Helpers ───────────────────────────────────────────────────────────────────
function dueDateDisplay(dateStr, status) {
  if (!dateStr || status === 'concluida') return null;
  const d   = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - now) / 86400000);
  if (diff < 0)   return { text: 'vencida', color: 'text-red-400' };
  if (diff === 0) return { text: 'hoje',    color: 'text-red-400' };
  if (diff <= 7)  return { text: `${diff}d`, color: 'text-yellow-400' };
  return { text: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), color: 'text-muted-foreground/40' };
}

function pilarHealthColor(pct) {
  if (pct >= 70) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500' };
  if (pct >= 40) return { text: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  bar: 'bg-yellow-500'  };
  return          { text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    bar: 'bg-red-500'    };
}

// ── ActionCard ────────────────────────────────────────────────────────────────
function ActionCard({ action }) {
  const [status,      setStatus]      = useState(action.status ?? 'pendente');
  const [notes,       setNotes]       = useState(action.notes ?? '');
  const [dueDate,     setDueDate]     = useState(action.due_date ?? '');
  const [assignee,    setAssignee]    = useState(action.assignee ?? '');
  const [showDetails, setShowDetails] = useState(false);
  const [isPending,   startTransition] = useTransition();

  const dd = dueDateDisplay(dueDate, status);

  function moveTo(next) {
    setStatus(next);
    startTransition(() => updateAction(action.id, { status: next, notes, dueDate, assignee }));
  }

  function saveDetails() {
    startTransition(() => updateAction(action.id, { status, notes, dueDate, assignee }));
    setShowDetails(false);
  }

  return (
    <div
      className="rounded-xl border p-3 transition-all"
      style={{ background: 'var(--bg-elevated)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <p className={`text-[13px] leading-snug ${status === 'concluida' ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
        {action.action_text}
      </p>

      {/* Chips */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {action.phase && (
          <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {action.phase}
          </span>
        )}
        {/* Status chip */}
        <span className={`text-[9px] font-medium ${STATUS_CONFIG[status]?.color ?? 'text-muted-foreground'}`}>
          {STATUS_CONFIG[status]?.label ?? status}
        </span>
        {assignee && (
          <span className="rounded px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/70" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {ASSIGNEE_LABEL[assignee] ?? assignee}
          </span>
        )}
        {dd && (
          <span className={`text-[9px] font-medium ${dd.color}`}>⏱ {dd.text}</span>
        )}
      </div>

      {notes && !showDetails && (
        <p className="mt-1.5 text-[11px] italic text-muted-foreground/50 line-clamp-1">"{notes}"</p>
      )}

      {/* Footer */}
      <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.05] pt-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[10px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          {showDetails ? '− fechar' : '+ detalhes'}
        </button>
        <div className="ml-auto flex gap-1">
          {KANBAN_ORDER.indexOf(status) > 0 && (
            <button onClick={() => moveTo(KANBAN_ORDER[KANBAN_ORDER.indexOf(status) - 1])} disabled={isPending}
              className="rounded px-1.5 py-0.5 text-[9px] text-muted-foreground/50 transition-colors hover:bg-white/[0.05] hover:text-muted-foreground disabled:opacity-30">←</button>
          )}
          {KANBAN_ORDER.indexOf(status) < KANBAN_ORDER.length - 1 && (
            <button onClick={() => moveTo(KANBAN_ORDER[KANBAN_ORDER.indexOf(status) + 1])} disabled={isPending}
              className="rounded px-1.5 py-0.5 text-[9px] text-muted-foreground/50 transition-colors hover:bg-white/[0.05] hover:text-muted-foreground disabled:opacity-30">→</button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-3 border-t border-white/[0.05] pt-3">
          <div>
            <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Observação</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas..." rows={2} className={inputClass + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Prazo</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Responsável</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
                <option value="">— sem definição —</option>
                <option value="consultor">Consultor</option>
                <option value="cliente">Cliente</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveDetails} disabled={isPending} className="text-xs font-medium text-emerald-400 transition-opacity hover:opacity-70 disabled:opacity-40">
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setShowDetails(false)} className="text-xs text-muted-foreground transition-colors hover:text-foreground">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────
function KanbanColumn({ statusKey, actions }) {
  const cfg   = STATUS_CONFIG[statusKey];
  const items = actions.filter((a) => (a.status ?? 'pendente') === statusKey);

  return (
    <div className={`flex flex-col rounded-xl border ${cfg.col} min-h-[200px]`} style={{ background: 'var(--bg-surface)' }}>
      <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
        </div>
        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-[10px] text-muted-foreground/30">Nenhuma ação</p>
          </div>
        ) : (
          items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((action) => (
            <ActionCard key={action.id} action={action} />
          ))
        )}
      </div>
    </div>
  );
}

// ── PilarSection ──────────────────────────────────────────────────────────────
function PilarSection({ pilarKey, actions }) {
  const cfg        = PILAR_CONFIG[pilarKey] ?? PILAR_CONFIG.outros;
  const concluidas = actions.filter((a) => a.status === 'concluida').length;
  const pct        = actions.length > 0 ? Math.round((concluidas / actions.length) * 100) : 0;
  const hc         = pilarHealthColor(pct);

  return (
    <div className={`rounded-xl border ${cfg.border}`} style={{ background: 'var(--bg-surface)' }}>
      {/* Pilar header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-muted-foreground/40">
            {actions.length} ação{actions.length !== 1 ? 'ões' : ''}
          </span>
        </div>
        {/* Health score */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full transition-all duration-500 ${hc.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold tabular-nums ${hc.bg} ${hc.border} ${hc.text}`}>
            {pct}%
          </span>
        </div>
      </div>
      {/* Actions grid */}
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}

// ── PlanTracker (main) ────────────────────────────────────────────────────────
export default function PlanTracker({ actions, planTitle, planDate }) {
  const [view, setView] = useState('kanban'); // 'kanban' | 'pilar'

  if (!actions?.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.07] py-16 text-center">
        <p className="text-muted-foreground">Nenhum plano estratégico gerado ainda.</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Vá para a aba Diagnóstico e clique em "Gerar Plano Estratégico".</p>
      </div>
    );
  }

  const total      = actions.length;
  const concluidas = actions.filter((a) => a.status === 'concluida').length;
  const pct        = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const overdue    = actions.filter((a) => {
    if (!a.due_date || a.status === 'concluida') return false;
    return new Date(a.due_date + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0));
  }).length;

  // Group by pilar for pilar view
  const byPilar = {};
  for (const a of actions) {
    const key = a.pilar ?? 'outros';
    if (!byPilar[key]) byPilar[key] = [];
    byPilar[key].push(a);
  }
  const activePilares = PILAR_ORDER.filter((p) => byPilar[p]?.length);

  return (
    <div>
      {/* Header */}
      <div className="mb-5 rounded-xl border border-white/[0.07] p-4" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground/70">{planTitle}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/40">{planDate}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-foreground">{pct}%</p>
            <p className="text-xs text-muted-foreground">
              {concluidas}/{total} concluídas
              {overdue > 0 && <span className="ml-2 text-red-400">· {overdue} vencida{overdue > 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>

        {/* View toggle */}
        <div className="mt-4 flex gap-1 border-t border-white/[0.05] pt-3">
          {[
            { key: 'kanban', label: 'Kanban'   },
            { key: 'pilar',  label: 'Por Pilar' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                view === v.key
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={view === v.key ? { background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KANBAN_ORDER.map((statusKey) => (
            <KanbanColumn key={statusKey} statusKey={statusKey} actions={actions} />
          ))}
        </div>
      )}

      {/* Pilar view */}
      {view === 'pilar' && (
        <div className="flex flex-col gap-4">
          {activePilares.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.07] py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma ação com pilar definido.</p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Gere um novo plano — as ações serão classificadas automaticamente por pilar.
              </p>
            </div>
          ) : (
            activePilares.map((p) => (
              <PilarSection key={p} pilarKey={p} actions={byPilar[p]} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

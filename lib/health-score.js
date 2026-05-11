/**
 * Motor de Health Score — AXIS 360
 * Retorna score 0-100 baseado em:
 *   1. Recência das métricas  (30 pts)
 *   2. Histórico de meta      (40 pts)
 *   3. Ações pendentes        (30 pts)
 */

export function computeHealthScore({ latestMetric, last3Metrics, pendingActions, totalActions }) {
  let score = 0;

  // ── 1. Recência das métricas ──────────────────────────────────────────────
  const ref = latestMetric?.updated_at ?? latestMetric?.created_at ?? null;
  if (ref) {
    const days = Math.floor((Date.now() - new Date(ref)) / 86400000);
    if      (days <= 30) score += 30;
    else if (days <= 60) score += 15;
    else if (days <= 90) score += 5;
  }

  // ── 2. Histórico de meta (últimos 3 meses) ────────────────────────────────
  const withMeta = (last3Metrics ?? []).filter((m) => m.meta_mensal_pct != null);
  if (withMeta.length > 0) {
    const hit = withMeta.filter((m) => m.meta_mensal_pct >= 1).length;
    score += Math.round((hit / Math.min(withMeta.length, 3)) * 40);
  } else {
    score += 20; // sem dados de meta → neutro
  }

  // ── 3. Ações pendentes no plano ───────────────────────────────────────────
  if (totalActions > 0) {
    const ratio = pendingActions / totalActions;
    if      (ratio < 0.30) score += 30;
    else if (ratio < 0.60) score += 15;
  } else {
    score += 15; // sem plano → neutro
  }

  return Math.min(100, Math.max(0, score));
}

export function healthScoreStatus(score) {
  if (score >= 80) return { label: 'Saudável',        color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   ring: 'rgba(34,197,94,0.25)'   };
  if (score >= 60) return { label: 'Atenção',          color: '#eab308', bg: 'rgba(234,179,8,0.12)',  ring: 'rgba(234,179,8,0.25)'   };
  if (score >= 40) return { label: 'Em risco',         color: '#f97316', bg: 'rgba(249,115,22,0.12)', ring: 'rgba(249,115,22,0.25)'  };
  return                   { label: 'Risco de Churn',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  ring: 'rgba(239,68,68,0.25)'   };
}

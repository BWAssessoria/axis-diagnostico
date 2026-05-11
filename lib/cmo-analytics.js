const BRL = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—';
const PCT = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
const MONTHS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function growth(curr, prev) {
  if (!curr || !prev) return null;
  return (curr - prev) / prev;
}

function classifyFunnel(rate, thresholdHigh, thresholdLow) {
  if (rate == null) return '❓ sem dado';
  if (rate >= thresholdHigh) return `✅ ${PCT(rate)} (acima da média)`;
  if (rate >= thresholdLow)  return `⚠️ ${PCT(rate)} (abaixo do ideal)`;
  return `🔴 ${PCT(rate)} (crítico — exige ação imediata)`;
}

export function computeAnalytics(metrics) {
  if (!metrics?.length) return '(sem métricas registradas no banco)';

  const sorted = [...metrics].sort((a, b) =>
    (a.year * 12 + a.month) - (b.year * 12 + b.month)
  );

  const lines = [];

  // ── Tendência de faturamento ──────────────────────────────────────────────
  lines.push('### Tendência de faturamento (banco de dados)');
  const fatData = sorted.filter((m) => m.fat_total != null);
  for (let i = 0; i < fatData.length; i++) {
    const m = fatData[i];
    const prev = fatData[i - 1];
    const g = prev ? growth(m.fat_total, prev.fat_total) : null;
    const label = `${MONTHS[m.month]}/${m.year}`;
    const meta = m.meta_mensal ? ` | Meta: ${BRL(m.meta_mensal)} (${PCT(m.meta_mensal_pct)})` : '';
    const trend = g != null ? ` | ${g >= 0 ? '▲' : '▼'} ${PCT(Math.abs(g))} vs mês anterior` : '';
    lines.push(`- ${label}: ${BRL(m.fat_total)}${meta}${trend}`);
  }

  // ── Média móvel (últimos 3 meses) ─────────────────────────────────────────
  const last3 = fatData.slice(-3).filter((m) => m.fat_total);
  if (last3.length >= 2) {
    const avg = last3.reduce((s, m) => s + m.fat_total, 0) / last3.length;
    lines.push(`- **Média últimos ${last3.length} meses: ${BRL(avg)}**`);
  }
  lines.push('');

  // ── Funil de vendas (mês mais recente com dados) ──────────────────────────
  const withFunnel = sorted.filter((m) => m.leads != null).slice(-1)[0];
  if (withFunnel) {
    const label = `${MONTHS[withFunnel.month]}/${withFunnel.year}`;
    lines.push(`### Funil de vendas — ${label}`);

    const convLA = withFunnel.leads && withFunnel.agendamentos
      ? withFunnel.agendamentos / withFunnel.leads : null;
    const convAC = withFunnel.agendamentos && withFunnel.comparecimentos
      ? withFunnel.comparecimentos / withFunnel.agendamentos : null;
    const convCV = withFunnel.comparecimentos && withFunnel.vendas
      ? withFunnel.vendas / withFunnel.comparecimentos : null;
    const convGlobal = withFunnel.leads && withFunnel.vendas
      ? withFunnel.vendas / withFunnel.leads : null;

    lines.push(`- Leads: ${withFunnel.leads ?? '—'}`);
    lines.push(`- Agendamentos: ${withFunnel.agendamentos ?? '—'} → Conversão: ${classifyFunnel(convLA, 0.35, 0.20)}`);
    lines.push(`  > Benchmark: top clínicas 35-50%, média 20-35%, abaixo de 20% = crítico`);
    lines.push(`- Comparecimentos: ${withFunnel.comparecimentos ?? '—'} → No-show: ${classifyFunnel(convAC, 0.70, 0.55)}`);
    lines.push(`  > Benchmark: top clínicas >70% de presença, abaixo de 55% = problema grave`);
    lines.push(`- Vendas: ${withFunnel.vendas ?? '—'} → Conversão consulta: ${classifyFunnel(convCV, 0.65, 0.45)}`);
    lines.push(`  > Benchmark: top clínicas 65-80%, abaixo de 45% = problema de consulta/proposta`);
    lines.push(`- **Conversão global lead→venda: ${convGlobal != null ? PCT(convGlobal) : '—'}**`);
    lines.push(`  > Benchmark: top clínicas 15-25% global, abaixo de 8% = funil quebrado`);
    lines.push('');
  }

  // ── Ticket médio e pacientes ──────────────────────────────────────────────
  const ticketData = sorted.filter((m) => m.ticket_medio != null).slice(-3);
  if (ticketData.length) {
    lines.push('### Ticket médio e volume');
    for (const m of ticketData) {
      const pacLabel = m.pacientes ? ` | ${m.pacientes} pacientes` : '';
      const retLabel = m.retorno != null ? ` | Retorno: ${m.retorno}` : '';
      lines.push(`- ${MONTHS[m.month]}/${m.year}: ${BRL(m.ticket_medio)}${pacLabel}${retLabel}`);
    }
    lines.push('');
  }

  // ── Meta anual ────────────────────────────────────────────────────────────
  const withMeta = sorted.filter((m) => m.meta_anual != null).slice(-1)[0];
  if (withMeta?.meta_anual) {
    const restante = Math.max(0, withMeta.meta_anual - (withMeta.meta_anual_fat ?? 0));
    const now = new Date();
    const mesesRestantes = Math.max(1, 12 - now.getMonth());
    const mediaNec = restante / mesesRestantes;
    lines.push('### Meta anual');
    lines.push(`- Meta anual: ${BRL(withMeta.meta_anual)}`);
    lines.push(`- Realizado até agora: ${BRL(withMeta.meta_anual_fat)} (${PCT(withMeta.meta_anual_pct)})`);
    lines.push(`- Restante: ${BRL(restante)} em ${mesesRestantes} meses = média necessária: ${BRL(mediaNec)}/mês`);
    const last3avg = fatData.slice(-3).reduce((s, m) => s + (m.fat_total ?? 0), 0) / Math.max(1, fatData.slice(-3).length);
    if (last3avg > 0) {
      const viavel = last3avg >= mediaNec;
      lines.push(`- Média atual dos últimos 3 meses: ${BRL(last3avg)} → Meta anual ${viavel ? '✅ viável no ritmo atual' : '🔴 INVIÁVEL no ritmo atual — precisa crescer'}`);
    }
    lines.push('');
  }

  // ── Anomalias automáticas ─────────────────────────────────────────────────
  const anomalias = [];
  const last2 = fatData.slice(-2);
  if (last2.length === 2 && last2[1].fat_total && last2[0].fat_total) {
    const g = growth(last2[1].fat_total, last2[0].fat_total);
    if (g != null && g < -0.10) anomalias.push(`🔴 Queda de ${PCT(Math.abs(g))} no faturamento no último mês`);
    if (g != null && g > 0.20)  anomalias.push(`🟢 Crescimento forte de ${PCT(g)} no último mês`);
  }
  if (withFunnel) {
    const convLA = withFunnel.leads && withFunnel.agendamentos ? withFunnel.agendamentos / withFunnel.leads : null;
    if (convLA != null && convLA < 0.15) anomalias.push('🔴 Taxa lead→agendamento abaixo de 15% — processo de atendimento comprometido');
    if (withFunnel.comparecimentos != null && withFunnel.agendamentos && withFunnel.comparecimentos / withFunnel.agendamentos < 0.50)
      anomalias.push('🔴 Mais de 50% de no-show — problema grave de confirmação e engajamento');
  }

  if (anomalias.length) {
    lines.push('### ⚡ Alertas automáticos');
    anomalias.forEach((a) => lines.push(`- ${a}`));
    lines.push('');
  }

  return lines.join('\n');
}

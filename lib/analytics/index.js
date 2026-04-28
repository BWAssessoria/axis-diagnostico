/**
 * Motor analítico AXIS 360
 * Recebe metrics_monthly[] (ordem desc, mais recente primeiro) + diagnostic answers
 * Retorna objeto analítico completo pronto para visualização (Looker/BI level)
 */

// ── Regressão linear simples (OLS) ────────────────────────────────────────────
function linearRegression(values) {
  const n = values.length;
  if (n < 3) return null;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  if (den === 0) return null;
  const slope     = num / den;
  const intercept = yMean - slope * xMean;
  const yHat = values.map((_, i) => intercept + slope * i);
  const ssTot = values.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = values.reduce((s, y, i) => s + (y - yHat[i]) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return {
    slope,
    intercept,
    r2,
    predict: (x) => Math.max(0, intercept + slope * x),
    confidence: r2 > 0.82 ? 'alta' : r2 > 0.55 ? 'media' : 'baixa',
  };
}

// ── Média móvel ────────────────────────────────────────────────────────────────
function movingAvg(arr, window) {
  return arr.map((_, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1).filter((v) => v != null);
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
  });
}

// ── Parseia investimento declarado no diagnóstico ─────────────────────────────
function parseInvestment(raw) {
  if (!raw) return null;
  const v = parseFloat(
    raw.toString().replace(/R\$\s*/gi, '').replace(/\/m[êe]s/gi, '')
      .replace(/\./g, '').replace(',', '.').trim()
  );
  return isNaN(v) || v <= 0 ? null : v;
}

// ── Sazonalidade estética Brasil (índice relativo ao ano médio) ───────────────
const SAZONALIDADE = {
  1: 0.88, 2: 0.92, 3: 1.05, 4: 1.08, 5: 1.05, 6: 0.96,
  7: 0.90, 8: 1.00, 9: 1.08, 10: 1.12, 11: 1.10, 12: 0.95,
};

const MONTHS_PT = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function healthColor(value, benchmarks) {
  if (value == null) return 'sem_dados';
  if (value >= benchmarks.verde)   return 'verde';
  if (value >= benchmarks.amarelo) return 'amarelo';
  return 'vermelho';
}

const BENCH = {
  convLeadAgend:  { verde: 0.35, amarelo: 0.20 },
  convAgendComp:  { verde: 0.75, amarelo: 0.60 },
  convCompVenda:  { verde: 0.65, amarelo: 0.45 },
  convLeadVenda:  { verde: 0.15, amarelo: 0.08 },
  retencao:       { verde: 0.45, amarelo: 0.30 },
  margemPct:      { verde: 0.40, amarelo: 0.25 },
  protocPct:      { verde: 0.50, amarelo: 0.25 },
  crescimentoMoM: { verde: 0.08, amarelo: 0.03 },
};

const BRL_FMT = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});

// ── FUNÇÃO PRINCIPAL ──────────────────────────────────────────────────────────
export function computeClientAnalytics(rawMetrics, diagnosticAnswers = {}) {
  const asc = [...rawMetrics].reverse(); // cronológico: [oldest … newest]
  const n   = asc.length;
  if (n === 0) return null;

  // ── 1. SÉRIE TEMPORAL ENRIQUECIDA ─────────────────────────────────────────
  const revenues = asc.map((m) => m.fat_total ?? 0);
  const movAvg3  = movingAvg(revenues, 3);
  const movAvg6  = movingAvg(revenues, 6);

  const timeSeries = asc.map((m, i) => {
    const prev        = i > 0 ? asc[i - 1] : null;
    const momGrowth   = prev?.fat_total > 0
      ? (m.fat_total - prev.fat_total) / prev.fat_total : null;
    const yoyEntry    = asc.find((x) => x.month === m.month && x.year === m.year - 1);
    const yoyGrowth   = yoyEntry?.fat_total > 0
      ? (m.fat_total - yoyEntry.fat_total) / yoyEntry.fat_total : null;
    const sazonFactor      = SAZONALIDADE[m.month] ?? 1;
    const desazionalizado  = m.fat_total ? m.fat_total / sazonFactor : null;
    const protocPct = m.fat_total > 0 && m.fat_protocolos != null
      ? m.fat_protocolos / m.fat_total : null;
    const convLeadAgend = m.leads > 0 && m.agendamentos != null ? m.agendamentos / m.leads : null;
    const convAgendComp = m.agendamentos > 0 && m.comparecimentos != null ? m.comparecimentos / m.agendamentos : null;
    const convCompVenda = m.comparecimentos > 0 && m.vendas != null ? m.vendas / m.comparecimentos : null;
    const convLeadVenda = m.leads > 0 && m.vendas != null ? m.vendas / m.leads : null;
    const retencao      = m.pacientes > 0 && m.retorno != null ? m.retorno / m.pacientes : null;

    return {
      month: m.month, year: m.year, label: `${MONTHS_PT[m.month]}/${m.year}`,
      revenue: m.fat_total ?? 0,
      revenueProtocol:  m.fat_protocolos ?? null,
      revenueAvulso:    m.fat_avulso ?? null,
      protocPct, movAvg3: movAvg3[i], movAvg6: movAvg6[i],
      momGrowth, yoyGrowth, desazionalizado, sazonFactor,
      target: m.meta_mensal ?? null,
      targetPct: m.meta_mensal_pct ?? null,
      targetAnual: m.meta_anual ?? null,
      targetAnualPct: m.meta_anual_pct ?? null,
      patients: m.pacientes ?? null,
      returning: m.retorno ?? null,
      newPatients: m.pacientes != null && m.retorno != null ? m.pacientes - m.retorno : null,
      retencao, ticket: m.ticket_medio ?? null,
      leads: m.leads ?? null, agendamentos: m.agendamentos ?? null,
      comparecimentos: m.comparecimentos ?? null, vendas: m.vendas ?? null,
      convLeadAgend, convAgendComp, convCompVenda, convLeadVenda,
      protocolosVendidos: m.protocolos_vendidos ?? null,
      margem: m.margem_pct ?? null,
    };
  });

  const latest = timeSeries[n - 1];
  const last3  = timeSeries.slice(-3);
  const last6  = timeSeries.slice(-6);

  // ── 2. PROJEÇÃO ────────────────────────────────────────────────────────────
  const revForReg = asc.slice(-8).map((m) => m.fat_total ?? 0);
  const reg = linearRegression(revForReg);
  const nReg = revForReg.length;
  let forecast = null;

  if (reg) {
    const now = new Date();
    const currentYear  = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nm = (offset) => ((currentMonth - 1 + offset) % 12) + 1;

    const revenueThisYear = asc
      .filter((m) => m.year === currentYear)
      .reduce((s, m) => s + (m.fat_total ?? 0), 0);
    const monthsLeft = 12 - currentMonth;
    let projAnual = revenueThisYear;
    for (let i = 0; i < monthsLeft; i++) {
      projAnual += reg.predict(nReg + i) * (SAZONALIDADE[nm(i + 1)] ?? 1);
    }

    const targetAnual = latest.targetAnual ?? null;
    const gapAnual    = targetAnual ? targetAnual - projAnual : null;

    forecast = {
      nextMonth:  Math.round(reg.predict(nReg)     * (SAZONALIDADE[nm(1)] ?? 1)),
      month2:     Math.round(reg.predict(nReg + 1) * (SAZONALIDADE[nm(2)] ?? 1)),
      month3:     Math.round(reg.predict(nReg + 2) * (SAZONALIDADE[nm(3)] ?? 1)),
      annualProjection: Math.round(projAnual),
      annualTarget:     targetAnual,
      annualGap:        gapAnual ? Math.round(gapAnual) : null,
      onTrack:          gapAnual != null ? gapAnual <= 0 : null,
      slope:            Math.round(reg.slope),
      r2:               parseFloat(reg.r2.toFixed(3)),
      confidence:       reg.confidence,
    };
  }

  // ── 3. FUNIL CONSOLIDADO ───────────────────────────────────────────────────
  const avg3 = (field) => {
    const vals = last3.map((m) => m[field]).filter((v) => v != null && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const fLeads = avg3('leads'), fAgend = avg3('agendamentos');
  const fComp  = avg3('comparecimentos'), fVendas = avg3('vendas');
  const fTicket = avg3('ticket');
  const fConvLA = fLeads  && fAgend  ? fAgend  / fLeads  : null;
  const fConvAC = fAgend  && fComp   ? fComp   / fAgend  : null;
  const fConvCV = fComp   && fVendas ? fVendas / fComp   : null;
  const fConvLV = fLeads  && fVendas ? fVendas / fLeads  : null;

  const lostRev = (dropped, convAfter) =>
    fTicket && dropped > 0 ? Math.round(dropped * fTicket * (convAfter ?? 1)) : null;

  const dLA = fLeads && fAgend  ? fLeads - fAgend  : null;
  const dAC = fAgend && fComp   ? fAgend - fComp   : null;
  const dCV = fComp  && fVendas ? fComp  - fVendas : null;
  const lostLA = dLA != null ? lostRev(dLA, (fConvAC ?? 1) * (fConvCV ?? 1)) : null;
  const lostAC = dAC != null ? lostRev(dAC, fConvCV ?? 1) : null;
  const lostCV = dCV != null ? lostRev(dCV, 1) : null;
  const totalLostRevenue = [lostLA, lostAC, lostCV].reduce(
    (s, v) => (v != null ? s + v : s), 0
  ) || null;

  const funnel = {
    leads: fLeads ? Math.round(fLeads) : null,
    agendamentos: fAgend ? Math.round(fAgend) : null,
    comparecimentos: fComp ? Math.round(fComp) : null,
    vendas: fVendas ? Math.round(fVendas) : null,
    ticket: fTicket ? Math.round(fTicket) : null,
    convLeadAgend: fConvLA, convAgendComp: fConvAC,
    convCompVenda: fConvCV, convLeadVenda: fConvLV,
    healthLA: fConvLA ? healthColor(fConvLA, BENCH.convLeadAgend)  : 'sem_dados',
    healthAC: fConvAC ? healthColor(fConvAC, BENCH.convAgendComp) : 'sem_dados',
    healthCV: fConvCV ? healthColor(fConvCV, BENCH.convCompVenda)  : 'sem_dados',
    lostRevenueLA: lostLA, lostRevenueAC: lostAC, lostRevenueCV: lostCV,
    totalLostRevenue,
    potentialRevenue: fLeads && fTicket ? Math.round(fLeads * fTicket) : null,
    actualRevenue:    fVendas && fTicket ? Math.round(fVendas * fTicket) : null,
  };

  // ── 4. MARKETING ──────────────────────────────────────────────────────────
  const investMensal = parseInvestment(diagnosticAnswers?.investimento_mkt);
  const cpl  = investMensal && fLeads  ? investMensal / fLeads  : null;
  const cac  = investMensal && fVendas ? investMensal / fVendas : null;
  const roas = investMensal && latest.revenue ? latest.revenue / investMensal : null;
  const marketing = {
    investmentDeclared: investMensal,
    cpl:  cpl  ? Math.round(cpl)  : null,
    cac:  cac  ? Math.round(cac)  : null,
    roas: roas ? parseFloat(roas.toFixed(1)) : null,
    cplHealth: cpl ? (cpl <= 30 ? 'verde' : cpl <= 60 ? 'amarelo' : 'vermelho') : 'sem_dados',
  };

  // ── 5. LTV ────────────────────────────────────────────────────────────────
  const avgRetencao = avg3('retencao');
  const ticketRef   = last6.map((m) => m.ticket).filter(Boolean);
  const avgTicket6  = ticketRef.length
    ? ticketRef.reduce((a, b) => a + b, 0) / ticketRef.length : null;
  const ltv = avgTicket6 && avgRetencao && avgRetencao < 1
    ? Math.round(avgTicket6 / (1 - avgRetencao)) : null;

  // ── 6. SUMMARY ────────────────────────────────────────────────────────────
  const prevPeriod = n >= 2 ? timeSeries[n - 2] : null;
  const summary = {
    currentRevenue: latest.revenue,
    prevRevenue:    prevPeriod?.revenue ?? null,
    momGrowth:      latest.momGrowth,
    momGrowthHealth: latest.momGrowth != null
      ? healthColor(latest.momGrowth, BENCH.crescimentoMoM) : 'sem_dados',
    movAvg3: movAvg3[n - 1], movAvg6: movAvg6[n - 1],
    target: latest.target, targetPct: latest.targetPct,
    targetHealth: latest.targetPct != null
      ? (latest.targetPct >= 1 ? 'verde' : latest.targetPct >= 0.75 ? 'amarelo' : 'vermelho')
      : 'sem_dados',
    patients: latest.patients, newPatients: latest.newPatients,
    returning: latest.returning, retencao: latest.retencao,
    retencaoHealth: latest.retencao != null
      ? healthColor(latest.retencao, BENCH.retencao) : 'sem_dados',
    ticket: latest.ticket, ltv,
    protocPct: latest.protocPct,
    protocHealth: latest.protocPct != null
      ? healthColor(latest.protocPct, BENCH.protocPct) : 'sem_dados',
    revenueProtocol: latest.revenueProtocol,
    revenueAvulso:   latest.revenueAvulso,
    margem: latest.margem,
    margemHealth: latest.margem != null
      ? healthColor(latest.margem, BENCH.margemPct) : 'sem_dados',
  };

  // ── 7. INSIGHTS AUTOMÁTICOS ───────────────────────────────────────────────
  const insights = [];

  if (forecast?.slope != null) {
    const slopeStr = BRL_FMT.format(Math.abs(forecast.slope));
    if (forecast.slope > 500) {
      insights.push({ type: 'positivo', area: 'receita',
        msg: `Tendência de crescimento de +${slopeStr}/mês (confiança ${forecast.confidence})` });
    } else if (forecast.slope < -500) {
      insights.push({ type: 'critico', area: 'receita',
        msg: `Tendência de queda de ${slopeStr}/mês — requer ação imediata` });
    }
  }

  const gargalo = [
    { key: 'healthLA', label: 'Lead→Agendamento',  value: fConvLA, bench: '35%' },
    { key: 'healthAC', label: 'Show rate',          value: fConvAC, bench: '75%' },
    { key: 'healthCV', label: 'Consulta→Venda',     value: fConvCV, bench: '65%' },
  ].find((s) => funnel[s.key] === 'vermelho');

  if (gargalo) insights.push({ type: 'critico', area: 'funil',
    msg: `Gargalo crítico: ${gargalo.label} em ${gargalo.value != null ? (gargalo.value * 100).toFixed(0) + '%' : '—'} (ref. top: ${gargalo.bench})` });

  if (latest.protocPct != null && latest.protocPct < 0.25) insights.push({
    type: 'oportunidade', area: 'protocolo',
    msg: `Apenas ${(latest.protocPct * 100).toFixed(0)}% de protocolo — maior ticket disponível` });

  if (forecast?.annualGap != null && forecast.annualGap > 0) insights.push({
    type: 'alerta', area: 'meta',
    msg: `Projeção anual ${BRL_FMT.format(forecast.annualGap)} abaixo da meta no ritmo atual` });

  if (summary.retencao != null && summary.retencao < 0.30) insights.push({
    type: 'critico', area: 'retencao',
    msg: `Retorno em ${(summary.retencao * 100).toFixed(0)}% — alta dependência de novos leads` });

  if (totalLostRevenue && funnel.potentialRevenue && funnel.actualRevenue) {
    const convPct = funnel.actualRevenue / funnel.potentialRevenue;
    if (convPct < 0.30) insights.push({ type: 'oportunidade', area: 'funil',
      msg: `Funil converte ${(convPct * 100).toFixed(0)}% do potencial — melhorar conversões pode adicionar ${BRL_FMT.format(totalLostRevenue)}/mês sem novos leads` });
  }

  if (latest.momGrowth != null && latest.momGrowth < -0.10) {
    const sazon = SAZONALIDADE[latest.month] ?? 1;
    insights.push({ type: sazon < 0.95 ? 'informativo' : 'alerta', area: 'sazonalidade',
      msg: sazon < 0.95
        ? `Queda de ${(Math.abs(latest.momGrowth) * 100).toFixed(0)}% compatível com sazonalidade típica de ${MONTHS_PT[latest.month]}`
        : `Queda de ${(Math.abs(latest.momGrowth) * 100).toFixed(0)}% em mês sem sazonalidade negativa — investigar causa estrutural` });
  }

  // ── 8. BENCHMARK COMPARISON ──────────────────────────────────────────────
  const benchmarkComparison = {
    convLeadAgend: { value: fConvLA, health: funnel.healthLA, target: BENCH.convLeadAgend.verde, gap: fConvLA != null ? BENCH.convLeadAgend.verde - fConvLA : null },
    convAgendComp: { value: fConvAC, health: funnel.healthAC, target: BENCH.convAgendComp.verde, gap: fConvAC != null ? BENCH.convAgendComp.verde - fConvAC : null },
    convCompVenda: { value: fConvCV, health: funnel.healthCV, target: BENCH.convCompVenda.verde, gap: fConvCV != null ? BENCH.convCompVenda.verde - fConvCV : null },
    retencao:      { value: summary.retencao, health: summary.retencaoHealth, target: BENCH.retencao.verde, gap: summary.retencao != null ? BENCH.retencao.verde - summary.retencao : null },
    protocPct:     { value: latest.protocPct, health: summary.protocHealth, target: BENCH.protocPct.verde, gap: latest.protocPct != null ? BENCH.protocPct.verde - latest.protocPct : null },
  };

  return {
    summary,
    timeSeries,
    forecast,
    funnel,
    marketing,
    ltv,
    insights,
    benchmarkComparison,
    protocolEvolution: timeSeries.map((m) => ({
      label: m.label, protocPct: m.protocPct,
      revenueProtocol: m.revenueProtocol, revenueAvulso: m.revenueAvulso, revenue: m.revenue,
    })),
    meta: {
      totalMonths: n,
      firstPeriod: timeSeries[0]?.label,
      lastPeriod:  latest.label,
      hasLeadsData:   fLeads != null,
      hasFunnelData:  fConvLA != null || fConvAC != null || fConvCV != null,
    },
  };
}

// ── DETECÇÃO DE ANOMALIAS ─────────────────────────────────────────────────────
/**
 * Detecta anomalias graves comparando os últimos 2 meses da série temporal.
 * Retorna array de alertas — vazio se nenhuma anomalia encontrada.
 */
export function detectAnomalies(timeSeries) {
  if (!timeSeries || timeSeries.length < 2) return [];

  const anomalies = [];
  const latest = timeSeries[timeSeries.length - 1];
  const prev   = timeSeries[timeSeries.length - 2];

  // Queda de receita > 20% (ajustada pela sazonalidade)
  if (latest.revenue > 0 && prev.revenue > 0) {
    const drop = (prev.revenue - latest.revenue) / prev.revenue;
    if (drop > 0.20) {
      const sazonDrop = Math.max(0,
        ((SAZONALIDADE[prev.month] ?? 1) - (SAZONALIDADE[latest.month] ?? 1))
        / (SAZONALIDADE[prev.month] ?? 1)
      );
      const adjustedDrop = drop - sazonDrop;
      if (adjustedDrop > 0.15) {
        anomalies.push({
          type: 'critico', metric: 'receita',
          current: latest.revenue, previous: prev.revenue,
          changePct: -drop,
          msg: `Queda de ${(drop * 100).toFixed(0)}% na receita vs. mês anterior (além da sazonalidade esperada)`,
        });
      }
    }
  }

  // Show rate caiu > 20 pontos percentuais
  if (latest.convAgendComp != null && prev.convAgendComp != null) {
    const drop = prev.convAgendComp - latest.convAgendComp;
    if (drop > 0.20) {
      anomalies.push({
        type: 'critico', metric: 'show_rate',
        current: latest.convAgendComp, previous: prev.convAgendComp,
        changePct: -(drop / prev.convAgendComp),
        msg: `Show rate caiu ${(drop * 100).toFixed(0)}pp — de ${(prev.convAgendComp * 100).toFixed(0)}% para ${(latest.convAgendComp * 100).toFixed(0)}%`,
      });
    }
  }

  // Leads caíram > 25%
  if (latest.leads != null && prev.leads != null && prev.leads > 0) {
    const drop = (prev.leads - latest.leads) / prev.leads;
    if (drop > 0.25) {
      anomalies.push({
        type: 'alerta', metric: 'leads',
        current: latest.leads, previous: prev.leads,
        changePct: -drop,
        msg: `Leads caíram ${(drop * 100).toFixed(0)}% — de ${prev.leads} para ${latest.leads}`,
      });
    }
  }

  // Conversão lead→agendamento caiu > 15pp
  if (latest.convLeadAgend != null && prev.convLeadAgend != null) {
    const drop = prev.convLeadAgend - latest.convLeadAgend;
    if (drop > 0.15) {
      anomalies.push({
        type: 'alerta', metric: 'conv_lead_agend',
        current: latest.convLeadAgend, previous: prev.convLeadAgend,
        changePct: -(drop / prev.convLeadAgend),
        msg: `Conv. lead→agendamento caiu ${(drop * 100).toFixed(0)}pp — de ${(prev.convLeadAgend * 100).toFixed(0)}% para ${(latest.convLeadAgend * 100).toFixed(0)}%`,
      });
    }
  }

  // Meta mensal abaixo de 60% (nível crítico)
  if (latest.targetPct != null && latest.targetPct < 0.60) {
    anomalies.push({
      type: 'critico', metric: 'meta',
      current: latest.targetPct, previous: null, changePct: null,
      msg: `Meta em ${(latest.targetPct * 100).toFixed(0)}% — nível crítico (ref.: mínimo 60%)`,
    });
  }

  return anomalies;
}

// ── BENCHMARKING DE PERCENTIL ─────────────────────────────────────────────────
/**
 * Calcula a posição percentil de um cliente em relação à carteira inteira.
 * Exemplo: computePercentile(clienteMargem, todasAsMargens)
 *
 * @param {number} value - Valor do cliente
 * @param {number[]} allValues - Pool de valores de todos os clientes ativos
 * @returns {{ percentile, position, label, health, median, average } | null}
 */
export function computePercentile(value, allValues) {
  if (value == null || !allValues?.length) return null;
  const valid  = allValues.filter((v) => v != null && isFinite(v));
  if (!valid.length) return null;

  const sorted    = [...valid].sort((a, b) => a - b);
  const below     = sorted.filter((v) => v < value).length;
  const percentile = Math.round((below / sorted.length) * 100);
  const mid        = Math.floor(sorted.length / 2);
  const median     = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  return {
    percentile,
    position: `${below + 1}º de ${sorted.length}`,
    label:
      percentile >= 75 ? 'top 25%' :
      percentile >= 50 ? 'acima da média' :
      percentile >= 25 ? 'abaixo da média' : 'bottom 25%',
    health:
      percentile >= 75 ? 'verde' :
      percentile >= 50 ? 'amarelo' : 'vermelho',
    median: parseFloat(median.toFixed(4)),
    average: parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(4)),
  };
}

// ─── HELPERS ───────────────────────────────────────────────────────────
export const pm = v => {
  if (!v) return 0;
  const n = String(v).replace(/[^\d.,]/g,"").replace(/\./g,"").replace(",",".");
  return parseFloat(n) || 0;
};
export const fmtR = v => v > 0 ? `R$ ${v.toLocaleString("pt-BR")}` : "—";

export const nivelFn = pct => {
  if (pct >= 80) return { label:"Excelente", color:"#00C853", bg:"#E8F9EF" };
  if (pct >= 60) return { label:"Bom",       color:"#2196F3", bg:"#E3F2FD" };
  if (pct >= 40) return { label:"Atenção",   color:"#FF9800", bg:"#FFF8E1" };
  return             { label:"Crítico",   color:"#E53935", bg:"#FFEBEE" };
};

// ─── SCORE DE SAÚDE DO NEGÓCIO ─────────────────────────────────────────
export function analyze(a) {
  const sc  = { comercial:0, marketing:0, operacional:0, financeiro:0 };
  const max = { comercial:10, marketing:10, operacional:10, financeiro:10 };

  // COMERCIAL
  const tr = a.tempo_resp || "";
  if (tr.includes("Menos de 5")) sc.comercial += 3;
  else if (tr.includes("5 a 30")) sc.comercial += 2;
  else if (tr.includes("30 min")) sc.comercial += 1;

  const ca = a.conv_aval || "";
  if (ca.includes("Mais de 8")) sc.comercial += 2;
  else if (ca.includes("7 a 8")) sc.comercial += 1.5;
  else if (ca.includes("5 a 6")) sc.comercial += 1;
  else if (ca.includes("3 a 4")) sc.comercial += 0.5;

  const cp = a.conv_proc || "";
  if (cp.includes("Mais de 8")) sc.comercial += 2;
  else if (cp.includes("7 a 8")) sc.comercial += 1.5;
  else if (cp.includes("5 a 6")) sc.comercial += 1;
  else if (cp.includes("3 a 4")) sc.comercial += 0.5;

  if ((a.follow_up||"").includes("sempre")) sc.comercial += 1;
  else if ((a.follow_up||"").includes("vezes")) sc.comercial += 0.5;

  if ((a.crm||"").includes("CRM")) sc.comercial += 1;
  else if ((a.crm||"").includes("Planilha")) sc.comercial += 0.7;
  else if ((a.crm||"").includes("caderno")) sc.comercial += 0.3;

  if ((a.reativacao||"").includes("regularmente")) sc.comercial += 1;
  else if ((a.reativacao||"").includes("vez em quando")) sc.comercial += 0.5;

  // MARKETING
  if (a.trafego && !a.trafego.toLowerCase().includes("não") && a.trafego.trim().length > 2) sc.marketing += 2;

  const freq = a.freq_posts || "";
  if (!(a.conteudo||"").includes("Ninguém") && !(a.conteudo||"").includes("parado")) {
    if (freq.includes("5 ou mais")) sc.marketing += 2;
    else if (freq.includes("3 a 4")) sc.marketing += 1.5;
    else if (freq.includes("1 a 2")) sc.marketing += 1;
    else sc.marketing += 0.3;
  }

  const lp = a.landing_page || "";
  if (lp.includes("landing page")) sc.marketing += 2;
  else if (lp.includes("WhatsApp")) sc.marketing += 1;
  else if (lp.includes("Instagram")) sc.marketing += 0.5;

  if ((a.pixel_meta||"").includes("ativo e configurado")) sc.marketing += 1;
  else if ((a.pixel_meta||"").includes("não sei se está")) sc.marketing += 0.5;

  if (a.instagram && a.instagram.length > 5) sc.marketing += 1;
  if (a.gmn && !a.gmn.toLowerCase().includes("não tenho") && a.gmn.length > 3) sc.marketing += 1;

  if ((a.estrategia_conteudo||"").includes("calendário")) sc.marketing += 1;
  else if ((a.estrategia_conteudo||"").includes("alguma lógica")) sc.marketing += 0.5;

  // OPERACIONAL
  const cap = parseInt(a.capacidade) || 0;
  if (cap >= 20) sc.operacional += 3;
  else if (cap >= 15) sc.operacional += 2;
  else if (cap >= 8) sc.operacional += 1;

  const dias = parseInt(a.dias_atendimento) || 0;
  if (dias >= 5) sc.operacional += 2;
  else if (dias >= 3) sc.operacional += 1;

  if (a.equipe && a.equipe.length > 80) sc.operacional += 2;
  else if (a.equipe && a.equipe.length > 40) sc.operacional += 1;

  if ((a.autorizacao_pacientes||"").includes("termo")) sc.operacional += 2;
  else if ((a.autorizacao_pacientes||"").includes("verbalmente")) sc.operacional += 1;

  if ((a.disponibilidade_conteudo||"").includes("sem problema")) sc.operacional += 1;
  else if ((a.disponibilidade_conteudo||"").includes("1 a 2")) sc.operacional += 0.5;

  // FINANCEIRO
  const fatA = pm(a.fat_atual), tick = pm(a.ticket);
  if (fatA >= 80000) sc.financeiro += 3;
  else if (fatA >= 50000) sc.financeiro += 2.5;
  else if (fatA >= 30000) sc.financeiro += 2;
  else if (fatA >= 15000) sc.financeiro += 1;

  if (tick >= 5000) sc.financeiro += 3;
  else if (tick >= 3000) sc.financeiro += 2;
  else if (tick >= 2000) sc.financeiro += 1.5;
  else if (tick >= 1000) sc.financeiro += 1;

  if (a.margem && !a.margem.toLowerCase().includes("não sei")) sc.financeiro += 1;

  const inv = a.investimento_mkt || "";
  if (inv.includes("Mais de 15")) sc.financeiro += 2;
  else if (inv.includes("7% e 15")) sc.financeiro += 1.5;
  else if (inv.includes("3% e 7")) sc.financeiro += 1;
  else if (inv.includes("Menos de 3")) sc.financeiro += 0.5;

  if ((a.fat_tendencia||"").includes("Crescendo")) sc.financeiro += 1;
  else if ((a.fat_tendencia||"").includes("Estável")) sc.financeiro += 0.5;

  Object.keys(sc).forEach(k => { sc[k] = Math.min(Math.round(sc[k]*10)/10, max[k]); });

  const total = Object.values(sc).reduce((a,b) => a+b, 0);
  const maxT  = Object.values(max).reduce((a,b) => a+b, 0);
  const saude = Math.round(total / maxT * 100);

  return { scores: sc, maxS: max, saude };
}

// ─── ICP SCORING ───────────────────────────────────────────────────────
export function analyzeICP(a) {
  let score = 0;
  const criterios = [];

  const fat    = pm(a.fat_atual);
  const tick   = pm(a.ticket);
  const meta   = pm(a.meta);
  const hof    = a.hof_foco || "";
  const inv    = a.investimento_mkt || "";
  const tend   = a.fat_tendencia || "";
  const equipe = a.equipe || "";
  const exp    = a.exp_ruim || "";
  const disp   = a.disponibilidade_conteudo || "";

  // Faturamento (30 pts)
  if (fat >= 150000)     { score += 30; criterios.push({ok:true,    txt:"Faturamento ≥ R$150k/mês — perfil Pro"}); }
  else if (fat >= 80000) { score += 26; criterios.push({ok:true,    txt:"Faturamento ≥ R$80k/mês — perfil Growth"}); }
  else if (fat >= 50000) { score += 22; criterios.push({ok:true,    txt:"Faturamento ≥ R$50k/mês — perfil Starter"}); }
  else if (fat >= 30000) { score += 16; criterios.push({ok:true,    txt:"Faturamento ≥ R$30k/mês — perfil Implementação"}); }
  else if (fat >= 15000) { score += 8;  criterios.push({ok:"parcial",txt:"Faturamento entre R$15k–30k — abaixo do ideal"}); }
  else if (fat > 0)      { score += 3;  criterios.push({ok:false,   txt:"Faturamento < R$15k — muito abaixo do ICP"}); }
  else                   {              criterios.push({ok:false,   txt:"Faturamento não informado"}); }

  // Foco HOF (15 pts)
  if (hof.includes("Exclusivamente HOF"))  { score += 15; criterios.push({ok:true,    txt:"Exclusivamente HOF — fit máximo com a AXIS"}); }
  else if (hof.includes("HOF + outros"))   { score += 10; criterios.push({ok:true,    txt:"HOF + outros procedimentos — bom fit"}); }
  else if (hof.includes("nova pra mim"))   { score += 3;  criterios.push({ok:false,   txt:"HOF é área nova — fit baixo ainda"}); }
  else                                     { score += 5;  criterios.push({ok:"parcial",txt:"Especialidade não especificada"}); }

  // Ticket médio (15 pts)
  if (tick >= 5000)      { score += 15; criterios.push({ok:true,    txt:`Ticket médio ${fmtR(tick)} — posicionamento premium`}); }
  else if (tick >= 3000) { score += 11; criterios.push({ok:true,    txt:`Ticket médio ${fmtR(tick)} — saudável`}); }
  else if (tick >= 2000) { score += 7;  criterios.push({ok:"parcial",txt:`Ticket ${fmtR(tick)} — abaixo do ideal para HOF premium`}); }
  else if (tick > 0)     { score += 3;  criterios.push({ok:false,   txt:`Ticket ${fmtR(tick)} — muito baixo`}); }

  // Meta / Ambição (10 pts)
  if (fat > 0 && meta > 0) {
    const c = meta / fat;
    if (c >= 2)        { score += 10; criterios.push({ok:true,    txt:`Meta ${fmtR(meta)} — ambição de +${Math.round((c-1)*100)}% crescimento`}); }
    else if (c >= 1.5) { score += 7;  criterios.push({ok:true,    txt:`Meta ${fmtR(meta)} — crescimento sólido`}); }
    else if (c >= 1.2) { score += 4;  criterios.push({ok:"parcial",txt:`Meta ${fmtR(meta)} — crescimento moderado`}); }
    else               { score += 1;  criterios.push({ok:false,   txt:`Meta ${fmtR(meta)} — crescimento muito tímido`}); }
  }

  // Investimento marketing (10 pts)
  if (inv.includes("Mais de 15"))    { score += 10; criterios.push({ok:true,    txt:"Investe >15% em marketing — mentalidade de crescimento"}); }
  else if (inv.includes("7% e 15"))  { score += 8;  criterios.push({ok:true,    txt:"Investe 7–15% em marketing — proporção saudável"}); }
  else if (inv.includes("3% e 7"))   { score += 5;  criterios.push({ok:"parcial",txt:"Investe 3–7% em marketing — abaixo do ideal"}); }
  else if (inv.includes("Menos de 3")) { score += 2; criterios.push({ok:false,  txt:"Investe <3% em marketing — precisa aumentar"}); }
  else if (inv.includes("Nada"))     {               criterios.push({ok:false,  txt:"Sem investimento em marketing"}); }

  // Equipe (10 pts)
  if (equipe.length > 120)     { score += 10; criterios.push({ok:true,    txt:"Equipe bem estruturada — operação escalável"}); }
  else if (equipe.length > 60) { score += 6;  criterios.push({ok:true,    txt:"Equipe com papéis definidos"}); }
  else if (equipe.length > 20) { score += 3;  criterios.push({ok:"parcial",txt:"Equipe pequena — gargalo potencial"}); }
  else                         {              criterios.push({ok:false,   txt:"Operação solitária — alta dependência da profissional"}); }

  // Bônus (5 pts)
  if (tend.includes("Crescendo")) { score += 3; criterios.push({ok:true, txt:"Faturamento em crescimento — momento ideal para parceria"}); }
  if (disp.includes("sem problema")) { score += 2; criterios.push({ok:true, txt:"Disponível para produção de conteúdo"}); }
  if (exp && exp.toLowerCase() !== "primeira vez" && exp.toLowerCase() !== "nunca" && exp.length > 5) {
    score += 3; criterios.push({ok:"parcial", txt:"Já contratou agência — sabe o que quer"});
  }

  const icpPct = Math.min(Math.round(score), 100);

  let produto, plano, prodCor, prodDesc;
  if (fat >= 150000)      { produto="Assessoria"; plano="Pro";     prodCor="#9C27B0"; prodDesc="Clínica madura com alto volume. Foco em otimização de ROI, múltiplos canais, expansão."; }
  else if (fat >= 80000)  { produto="Assessoria"; plano="Growth";  prodCor="#2196F3"; prodDesc="Boa base estabelecida. Pronta para escalar com tráfego estruturado e CRM avançado."; }
  else if (fat >= 50000)  { produto="Assessoria"; plano="Starter"; prodCor="#00C853"; prodDesc="Base funcional. Precisa de consistência e processo para dobrar o faturamento."; }
  else if (fat >= 15000)  { produto="Implementação"; plano=null;   prodCor="#FF4500"; prodDesc="Clínica em crescimento. Precisa estruturar funil, CRM, landing page e tráfego pago antes de escalar."; }
  else                    { produto="Não Qualificado"; plano=null; prodCor="#E53935"; prodDesc="Faturamento abaixo do mínimo para ROI positivo com assessoria."; }

  return { icpPct, criterios, produto, plano, prodCor, prodDesc };
}

// ─── RECOMENDAÇÕES PAC ─────────────────────────────────────────────────
export function getPacRecomendacoes(produto, plano, data) {
  const fat = pm(data.fat_atual);
  const tick = pm(data.ticket);
  const tem_crm = (data.crm||"").includes("CRM");
  const tem_gmn = data.gmn && !data.gmn.toLowerCase().includes("não tenho") && data.gmn.length > 3;

  if (produto === "Implementação") return [
    { tag:"FUNDAÇÃO",   acao:"Estruturar funil comercial completo: script WhatsApp, cadência de follow-up e CRM básico (Kommo)." },
    { tag:"CAPTAÇÃO",   acao:"Criar landing page dedicada ao procedimento carro-chefe com pixel Meta configurado." },
    { tag:"TRÁFEGO",    acao:"Lançar campanhas Meta Ads com budget mínimo de R$2.500/mês focado em leads para avaliação." },
    { tag:"REPUTAÇÃO",  acao: tem_gmn ? "Ativar estratégia de captação de avaliações no Google Meu Negócio." : "Criar e verificar Google Meu Negócio. Meta: 20 avaliações em 60 dias." },
    { tag:"CONTEÚDO",   acao:"Implementar calendário editorial com 4 pilares: educação, prova social, bastidores e CTA." },
    { tag:"MÉTRICA",    acao:`KPI principal: CPL < 25% do ticket (${fmtR(Math.round(tick*0.25))}). Monitorar conversão semanalmente.` },
  ];

  if (plano === "Starter") return [
    { tag:"OTIMIZAÇÃO", acao:"Otimizar campanhas existentes: testar criativos e segmentações. Escalar budget com base no melhor CPL." },
    { tag:"CRM",        acao: tem_crm ? "Aprofundar uso do CRM: automações de follow-up e relatórios de conversão." : "Implementar CRM (Kommo). Mapear e automatizar funil completo." },
    { tag:"REATIVAÇÃO", acao:`Campanha de reativação da base: converter 15–20% dos inativos dos últimos 18 meses.` },
    { tag:"GOOGLE ADS", acao:"Testar Google Ads para termos de alta intenção local. Budget inicial: R$1.200/mês." },
    { tag:"CONTEÚDO",   acao:"Gravar conteúdo em lote 1x/mês. Meta: 5 posts/semana + stories diários." },
    { tag:"INDICAÇÃO",  acao:"Lançar programa de indicação. Meta: 10% dos novos pacientes via indicação." },
  ];

  if (plano === "Growth") return [
    { tag:"ESCALA",     acao:`Budget Meta Ads: R$6.000–10.000/mês. Distribuir entre conversão (60%), remarketing (30%) e awareness (10%).` },
    { tag:"LOOKALIKE",  acao:"Criar audiências lookalike a partir dos melhores clientes. Escalar agressivamente." },
    { tag:"AUTOMAÇÃO",  acao:"Implementar automações avançadas: sequência 7 dias para leads, NPS pós-procedimento, protocolo de recompra." },
    { tag:"SEO LOCAL",  acao:"Estratégia SEO local + Google Ads para dominar termos de busca da cidade." },
    { tag:"INFLUÊNCIA", acao:"Estruturar programa de médicos parceiros e influenciadores locais. 2–3 parcerias/mês." },
    { tag:"EXPANSÃO",   acao:"Avaliar expansão: novos procedimentos de alto ticket ou segunda unidade." },
  ];

  return [
    { tag:"MULTI-CANAL", acao:"Diversificar: Meta Ads + Google Ads + SEO + Email + WhatsApp Marketing integrados." },
    { tag:"BRAND EQUITY",acao:"Investir em autoridade: eventos, masterclasses, feiras e publicações especializadas." },
    { tag:"DADOS",       acao:"Implementar BI para KPIs em tempo real: CPL, LTV, churn, NPS." },
    { tag:"EXPANSÃO",    acao:"Plano estratégico de expansão: segunda unidade, franquia ou licenciamento de metodologia." },
  ];
}

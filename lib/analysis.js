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
  else if (fatA >= 10000) sc.financeiro += 1;

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

  // Faturamento (30 pts) — mínimo R$12k (odontologista) / R$15k (biomédico)
  if (fat >= 80000)      { score += 30; criterios.push({ok:true,    txt:"Faturamento ≥ R$80k/mês — perfil avançado Método Axis"}); }
  else if (fat >= 40000) { score += 22; criterios.push({ok:true,    txt:"Faturamento ≥ R$40k/mês — perfil sólido Método Axis"}); }
  else if (fat >= 20000) { score += 15; criterios.push({ok:true,    txt:"Faturamento ≥ R$20k/mês — perfil em crescimento"}); }
  else if (fat >= 12000) { score += 8;  criterios.push({ok:"parcial",txt:"Faturamento entre R$12k–20k — elegível para Método Axis"}); }
  else if (fat > 0)      { score += 2;  criterios.push({ok:false,   txt:"Faturamento < R$12k — fora do ICP (mín. R$12k odontologista / R$15k biomédico)"}); }
  else                   {              criterios.push({ok:false,   txt:"Faturamento não informado"}); }

  // Foco HOF / Estética Avançada (15 pts)
  if (hof.includes("Exclusivamente HOF"))  { score += 15; criterios.push({ok:true,    txt:"Exclusivamente estética avançada — fit máximo com o Método Axis"}); }
  else if (hof.includes("HOF + outros"))   { score += 10; criterios.push({ok:true,    txt:"Estética avançada + outros procedimentos — bom fit"}); }
  else if (hof.includes("nova pra mim"))   { score += 3;  criterios.push({ok:false,   txt:"Estética avançada é área nova — fit baixo ainda"}); }
  else                                     { score += 5;  criterios.push({ok:"parcial",txt:"Especialidade não especificada"}); }

  // Ticket médio (15 pts)
  if (tick >= 5000)      { score += 15; criterios.push({ok:true,    txt:`Ticket médio ${fmtR(tick)} — posicionamento premium`}); }
  else if (tick >= 3000) { score += 11; criterios.push({ok:true,    txt:`Ticket médio ${fmtR(tick)} — saudável`}); }
  else if (tick >= 2000) { score += 7;  criterios.push({ok:"parcial",txt:`Ticket ${fmtR(tick)} — abaixo do ideal para estética avançada`}); }
  else if (tick > 0)     { score += 3;  criterios.push({ok:false,   txt:`Ticket ${fmtR(tick)} — muito baixo, precisa de engenharia de protocolo`}); }

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
  else                         {              criterios.push({ok:false,   txt:"Operação solo — alta dependência da profissional"}); }

  // Bônus (5 pts)
  if (tend.includes("Crescendo")) { score += 3; criterios.push({ok:true, txt:"Faturamento em crescimento — momento ideal para parceria"}); }
  if (disp.includes("sem problema")) { score += 2; criterios.push({ok:true, txt:"Disponível para produção de conteúdo"}); }

  const icpPct = Math.min(Math.round(score), 100);

  // Produto AXIS
  let produto, plano = null, prodCor, prodDesc;
  if (fat >= 12000) {
    produto = "Método Axis"; prodCor = "#FF4500";
    if (fat >= 80000)      prodDesc = "Clínica com operação madura. Pronta para escala com múltiplos canais, autoridade de marca e processos avançados.";
    else if (fat >= 40000) prodDesc = "Base comercial estabelecida. O trabalho é de otimização, automação e escala inteligente de captação.";
    else if (fat >= 20000) prodDesc = "Clínica em crescimento com oportunidades claras. O Método Axis estrutura captação, conteúdo e comercial de forma integrada.";
    else                   prodDesc = "Perfil inicial do Método Axis. Foco em construir processo comercial, presença digital e protocolo de valor.";
  } else if (fat > 0) {
    produto = "Fora do ICP"; prodCor = "#999";
    prodDesc = "Faturamento abaixo do mínimo do ICP (R$12k odontologista / R$15k biomédico) — fora do perfil de assessoria Método Axis.";
  } else {
    produto = "A Qualificar"; prodCor = "#999";
    prodDesc = "Faturamento não informado. Necessário qualificar antes de recomendar produto.";
  }

  return { icpPct, criterios, produto, plano, prodCor, prodDesc };
}

// ─── RECOMENDAÇÕES AXIS EDUCACIONAL ────────────────────────────────────
export function getPacRecomendacoes(produto, plano, data) {
  const fat  = pm(data.fat_atual);
  const tick = pm(data.ticket);
  const tem_crm = (data.crm||"").includes("CRM");
  const tem_gmn = data.gmn && !data.gmn.toLowerCase().includes("não tenho") && data.gmn.length > 3;

  // Método Axis — único produto de assessoria
  return [
    { tag:"CONTEÚDO",   acao:`Pack de ${data.conteudo?.includes("10") ? "10" : "10"} posts/mês + Reels + Stories + Destaques organizados. Calendário editorial com pilares: educação, prova social, bastidores e CTA.` },
    { tag:"GMN",        acao: tem_gmn ? "Posts semanais no Google Meu Negócio + estratégia de captação de avaliações. Meta: posição top 3 nas buscas locais." : "Criar e otimizar Google Meu Negócio com foco em SEO local. Canal com maior intenção de compra para estética avançada." },
    { tag:"TRÁFEGO",    acao:"Gestão de campanhas Meta Ads: criativos de conversão, otimização semanal de CPL e escalada de budget nos anúncios vencedores." },
    { tag:"COMERCIAL",  acao: tem_crm ? "Aprofundar uso do CRM: automações de follow-up e relatórios de conversão semanais." : "Implementar CRM com funil comercial completo. Automação de resposta ao lead em até 5 minutos." },
    { tag:"SEO LOCAL",  acao:"Estratégia de SEO local: posts GMN + avaliações + consistência de NAP. Resultado orgânico crescente mês a mês." },
    { tag:"RELATÓRIO",  acao:"Reunião quinzenal de 20min + relatório mensal de performance com CPL, alcance, engajamento e leads gerados." },
  ];
}

// ─── DIAGNÓSTICO AXIS ──────────────────────────────────────────────────
export function buildDiagnostico(a, produto, plano) {
  const fat  = pm(a.fat_atual);
  const tick = pm(a.ticket);

  // ── META SMART (Método Axis) ──────────────────────────────────────
  const meta90  = Math.round(fat * 1.30 / 1000) * 1000;
  const meta180 = Math.round(fat * 1.60 / 1000) * 1000;
  const meta90desc  = "Canais estruturados, campanhas otimizadas e processo comercial funcionando com previsibilidade";
  const meta180desc = "Crescimento consistente com múltiplos canais ativos, autoridade digital consolidada e base de pacientes fidelizada";

  // ── AXIS PROTOCOL ENGINEERING ─────────────────────────────────────
  const carro = (a.carro_chefe || "").toLowerCase();
  const procs = (a.procedimentos || "").toLowerCase();
  const temBotox  = carro.includes("botox") || carro.includes("toxina")  || procs.includes("botox");
  const temFiller = carro.includes("filler") || carro.includes("preenchi") || procs.includes("preenchi");
  const temBioest = carro.includes("bioesti") || carro.includes("sculptra") || carro.includes("radiesse");
  const temLaser  = carro.includes("laser")  || procs.includes("laser");
  const temCorpo  = carro.includes("corporal") || carro.includes("lipo") || procs.includes("corporal");
  const tickProt  = t => fmtR(tick > 0 ? Math.round(tick * t / 500) * 500 : 0);

  const protocolos = [];
  if (temBotox && temFiller) {
    protocolos.push({
      nome:"Protocolo Renovação Total",
      base:"Toxina botulínica + preenchimento labial + rinomodelação",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(3.2),
      narrativa:"Da consulta avulsa ao protocolo completo de rejuvenescimento facial",
      comunicacao:"\"Não venda Botox. Venda a versão mais jovem e confiante de si mesma.\""
    });
    protocolos.push({
      nome:"Protocolo Expressão Plena",
      base:"Toxina + filler malar + preenchimento de olheiras",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(2.8),
      narrativa:"Resultado harmônico completo em um único protocolo personalizado",
      comunicacao:"\"Harmonização completa do olhar — o tratamento que transforma olheiras em estrutura.\""
    });
  } else if (temBotox) {
    protocolos.push({
      nome:"Protocolo Rejuvenescimento Inteligente",
      base:"Toxina botulínica estratégica + skinbooster",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(3.2),
      narrativa:"Do resultado pontual ao programa completo de manutenção e rejuvenescimento",
      comunicacao:"\"Não é Botox. É o Protocolo Rejuvenescimento Inteligente — resultado em 7 dias, manutenção em 6 meses.\""
    });
  } else if (temFiller) {
    protocolos.push({
      nome:"Protocolo Harmonia Facial",
      base:"Preenchimento labial + malar + mandíbula",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(3.0),
      narrativa:"Harmonização facial completa com resultado natural e duradouro",
      comunicacao:"\"Não venda preenchimento. Venda a face que a paciente sempre quis ter.\""
    });
  } else if (temBioest) {
    protocolos.push({
      nome:"Protocolo Colágeno Premium",
      base:"Bioestimulador + skinbooster + nutrição cutânea",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(2.5),
      narrativa:"Regeneração profunda com resultados que crescem ao longo do tempo",
      comunicacao:"\"Não é um produto. É um programa de renovação celular — resultado visível, progressivo e duradouro.\""
    });
  } else if (temLaser) {
    protocolos.push({
      nome:"Protocolo Pele Perfeita",
      base:"Laser fracionado + peeling + manutenção mensal",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(3.0),
      narrativa:"Tratamento progressivo para pele uniforme, luminosa e sem manchas",
      comunicacao:"\"A pele que você quer não acontece em uma sessão. Acontece no Protocolo Pele Perfeita.\""
    });
  } else if (temCorpo) {
    protocolos.push({
      nome:"Protocolo Corpo Redefinido",
      base:"Procedimento corporal + drenagem + manutenção",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(2.8),
      narrativa:"Programa completo de remodelação corporal com resultados visíveis e duradouros",
      comunicacao:"\"Não venda uma sessão. Venda o resultado que a paciente vai fotografar e mostrar pra todo mundo.\""
    });
  } else {
    protocolos.push({
      nome:"Protocolo Transformação Premium",
      base:a.carro_chefe || "Procedimento carro-chefe + complementos personalizados",
      ticket_avulso: fmtR(tick), ticket_protocolo: tickProt(3.0),
      narrativa:"Do procedimento isolado ao programa completo de transformação",
      comunicacao:"\"Não venda procedimentos. Venda resultados — o Protocolo Transformação é essa diferença.\""
    });
  }
  protocolos.push({
    nome:"Protocolo Manutenção VIP",
    base:"Programa trimestral de manutenção personalizada",
    ticket_avulso: fmtR(Math.round(tick * 0.6)),
    ticket_protocolo: fmtR(Math.round(tick * 1.8)),
    narrativa:"Converter pacientes pontuais em clientes recorrentes de alto valor",
    comunicacao:"\"Paciente VIP: agenda garantida, desconto especial, resultado sempre em dia.\""
  });

  // ── PLANOS DE AÇÃO — 3 horizontes (90 / 180 / 365 dias) ─────────
  const _onboarding = {
    fase:"Semanas 1–2", cor:"#FF4500",
    titulo:"Onboarding & Diagnóstico",
    objetivo:"Alinhar estratégia, mapear ativos e configurar todos os acessos.",
    acoes:[
      "Reunião de onboarding (1h–1h30): metas, ICP da clínica, diferencial e posicionamento",
      "Auditoria completa: Instagram, GMN, anúncios ativos, CRM e processo comercial",
      "Configurar acessos: gerenciador Meta, Google Analytics, GMN e CRM",
      "Definir calendário editorial e temas de autoridade para os próximos 30 dias",
    ]
  };
  const _fundacao = {
    fase:"Mês 1", cor:"#FF7043",
    titulo:"Fundação Digital",
    objetivo:"Estruturar presença, processo comercial e lançar primeiras campanhas.",
    acoes:[
      "Otimizar perfil no Instagram: bio, foto, destaques e publicações iniciais",
      "Otimizar Google Meu Negócio: categorias, fotos, posts e captação de avaliações",
      "Lançar campanhas Meta Ads com foco em leads para avaliação presencial",
      "Configurar CRM e script comercial — resposta ao lead em até 5 minutos",
    ]
  };
  const _conteudo = {
    fase:"Mês 2–3", cor:"#FF9800",
    titulo:"Conteúdo & Otimização",
    objetivo:"Gerar fluxo constante de conteúdo e otimizar aquisição com dados reais.",
    acoes:[
      "Entregar pack mensal: 10 posts + Reels + Stories + Destaques organizados",
      "Reunião quinzenal de 20min: análise de métricas e ajustes de estratégia",
      "Otimização de campanhas — CPL, CTR e taxa de conversão semana a semana",
      "SEO local: posts GMN semanais e estratégia contínua de avaliações",
    ]
  };
  const _escala = {
    fase:"Mês 4–6", cor:"#00C853",
    titulo:"Escala & Autoridade",
    objetivo:"Consolidar canais, escalar o que funciona e construir autoridade de marca.",
    acoes:[
      "Compra de mídia otimizada: escalar budget nos criativos vencedores com dados reais",
      "Relatório mensal completo de performance: leads, CPL, alcance e engajamento",
      "Protocolo de reativação de base: campanhas WhatsApp para pacientes inativos",
      "Conteúdo de autoridade: casos reais com dados, antes/depois e depoimentos estruturados",
    ]
  };
  const planos = {
    p90: [
      _onboarding,
      { ..._fundacao, fase:"Mês 1–2", objetivo:"Estruturar presença, lançar captação e consolidar o processo comercial rapidamente." },
      {
        fase:"Mês 3", cor:"#00C853",
        titulo:"Resultados & Encerramento",
        objetivo:"Mensurar resultados do ciclo, ajustar e definir próximos passos com o cliente.",
        acoes:[
          "Revisão completa de métricas: CPL, taxa de conversão, ticket médio real vs. meta",
          "Ajustar criativos e campanhas com base nos dados reais dos 90 dias",
          "Coletar cases e depoimentos — base de prova social para os próximos meses",
          "Reunião de resultado: conquistas, aprendizados e proposta de renovação/expansão",
        ]
      },
    ],
    p180: [
      _onboarding,
      _fundacao,
      _conteudo,
      { ..._escala, fase:"Mês 4–6" },
    ],
    p365: [
      _onboarding,
      _fundacao,
      _conteudo,
      _escala,
      {
        fase:"Mês 7–12", cor:"#2196F3",
        titulo:"Consolidação & Expansão",
        objetivo:"Construir autoridade de longo prazo, diversificar canais e escalar receita recorrente.",
        acoes:[
          "Programa de indicação estruturado: clientes VIP como canal de aquisição previsível",
          "Expansão para novos formatos: YouTube Shorts, TikTok e presença multiplataforma",
          "Automações avançadas de CRM: nurturing, reativação e upsell de protocolos premium",
          "Revisão semestral de estratégia: posicionamento, mix de serviços e metas do próximo ciclo",
        ]
      },
    ],
  };

  // ── PRIORIDADES DA EQUIPE DE ENTREGA ─────────────────────────────
  const prioridades = [];
  const tem_crm      = (a.crm||"").includes("CRM");
  const tem_pixel    = (a.pixel_meta||"").includes("ativo e configurado");
  const tem_lp       = (a.landing_page||"").includes("landing page");
  const tem_gmn      = a.gmn && !a.gmn.toLowerCase().includes("não tenho") && a.gmn.length > 3;
  const tem_followup = (a.follow_up||"").includes("sempre");
  const tem_trafego  = a.trafego && !a.trafego.toLowerCase().includes("não") && a.trafego.trim().length > 2;
  const tem_reat     = (a.reativacao||"").includes("regularmente");

  if (!tem_crm)      prioridades.push({ nivel:"CRÍTICA",  cor:"#E53935", area:"Comercial", acao:"Implementar CRM (Kommo). A clínica está perdendo leads por falta de gestão comercial estruturada." });
  if (!tem_pixel)    prioridades.push({ nivel:"CRÍTICA",  cor:"#E53935", area:"Marketing", acao:"Instalar e configurar Pixel Meta + Conversions API. Sem pixel ativo, campanhas pagas são cegas." });
  if (!tem_followup) prioridades.push({ nivel:"ALTA",     cor:"#FF9800", area:"Comercial", acao:"Implementar follow-up em até 5 minutos. Leads sem resposta rápida convertem 80% menos." });
  if (!tem_lp)       prioridades.push({ nivel:"ALTA",     cor:"#FF9800", area:"Marketing", acao:"Criar landing page dedicada ao protocolo carro-chefe. Enviar tráfego para Instagram queima budget." });
  if (!tem_gmn)      prioridades.push({ nivel:"ALTA",     cor:"#FF9800", area:"Presença",  acao:"Criar e verificar Google Meu Negócio. Pacientes de estética avançada buscam no Google — sem GMN, invisível." });
  if (!tem_trafego)  prioridades.push({ nivel:"MÉDIA",    cor:"#2196F3", area:"Marketing", acao:"Iniciar tráfego pago estruturado. Crescimento orgânico tem teto — Meta Ads bem feito é previsível." });
  if (!tem_reat)     prioridades.push({ nivel:"MÉDIA",    cor:"#2196F3", area:"Comercial", acao:"Ativar reativação de base. Pacientes inativos custam 5x menos do que novos pacientes." });
  if (prioridades.length < 3) {
    prioridades.push({ nivel:"MÉDIA",  cor:"#2196F3", area:"Conteúdo",  acao:"Estruturar calendário editorial com 4 pilares: educação, prova social, bastidores e CTA direto." });
    prioridades.push({ nivel:"BAIXA",  cor:"#00C853", area:"Reputação", acao:"Protocolo de captação de avaliações Google após cada procedimento. Meta: 20 avaliações/mês." });
  }

  return { metaSmart:{ meta90, meta180, meta90desc, meta180desc }, protocolos, planos, prioridades };
}

// ─── CMO AGENT — ANÁLISE ESTRATÉGICA ──────────────────────────────────
export function buildCMOAnalysis(a, scores, produto, plano) {
  const fat  = pm(a.fat_atual);
  const tick = pm(a.ticket);
  const meta = pm(a.meta);
  const cap  = parseInt(a.capacidade) || 0;
  const dias = parseInt(a.dias_atendimento) || 0;

  const tem_crm      = (a.crm||"").includes("CRM");
  const tem_pixel    = (a.pixel_meta||"").includes("ativo e configurado");
  const tem_lp       = (a.landing_page||"").includes("landing page");
  const tem_gmn      = a.gmn && !a.gmn.toLowerCase().includes("não tenho") && a.gmn.length > 3;
  const tem_trafego  = a.trafego && !a.trafego.toLowerCase().includes("não") && a.trafego.trim().length > 2;
  const tem_followup = (a.follow_up||"").includes("sempre");
  const receita_pot  = cap * dias * 4 * tick;
  const gap_receita  = receita_pot > fat ? receita_pot - fat : 0;
  const tend         = a.fat_tendencia || "";
  const conv_aval    = a.conv_aval || "";
  const inv          = a.investimento_mkt || "";
  const hof          = a.hof_foco || "";
  const carro        = a.carro_chefe || "";

  // ── SWOT ─────────────────────────────────────────────────────────
  const pontos_fortes = [];
  const pontos_fracos = [];
  const oportunidades = [];
  const riscos        = [];

  // Forças
  if (fat >= 80000) pontos_fortes.push(`Faturamento de ${fmtR(fat)}/mês demonstra operação com tração real — a clínica já provou que consegue gerar receita.`);
  else if (fat >= 40000) pontos_fortes.push(`Faturamento de ${fmtR(fat)}/mês indica que a base comercial existe — o próximo salto é de processo e canal, não de produto.`);
  else if (fat >= 12000) pontos_fortes.push(`Faturamento de ${fmtR(fat)}/mês já supera o mínimo para o Método Axis — há base para crescer com estratégia.`);
  if (tick >= 3000) pontos_fortes.push(`Ticket médio de ${fmtR(tick)} é competitivo. Há espaço para criar protocolos premium a 2–3x esse valor sem perder volume.`);
  if (tend.includes("Crescendo")) pontos_fortes.push("Faturamento em trajetória de crescimento — o momento é de aceleração, não de correção de rota.");
  if (tem_gmn) pontos_fortes.push("Presença no Google Meu Negócio ativa. Canal de aquisição orgânica local já estabelecido.");
  if (tem_trafego) pontos_fortes.push("Já investe em tráfego pago. A fundação está lançada — o trabalho é otimizar e escalar, não começar do zero.");
  if (hof.includes("Exclusivamente HOF")) pontos_fortes.push("Especialização exclusiva em estética avançada é um diferencial de posicionamento — facilita a construção de autoridade e protocolos de alto ticket.");
  if (scores.comercial >= 7) pontos_fortes.push("Processo comercial acima da média. Conversão e velocidade de resposta são ativos que poucos concorrentes têm.");
  if (cap >= 20) pontos_fortes.push(`Capacidade operacional de ${cap} pacientes/semana. A estrutura aguenta crescimento sem gargalo imediato.`);

  // Fraquezas
  if (!tem_crm) pontos_fracos.push("Ausência de CRM é o maior buraco no balde: leads chegam e saem sem rastreamento. Cada lead perdido é receita jogada fora.");
  if (!tem_pixel) pontos_fracos.push("Pixel Meta não configurado. Sem dados de conversão, campanhas pagas são apostas — impossível otimizar o que não se mede.");
  if (!tem_lp) pontos_fracos.push("Sem landing page dedicada, o tráfego pago vai para o Instagram — ambiente de distração que reduz conversão em 60–70%.");
  if (!tem_followup) pontos_fracos.push("Follow-up inconsistente é perda de receita recorrente. Leads que não respondem na hora precisam de pelo menos 5 touchpoints para converter.");
  if (tick < 2000 && tick > 0) pontos_fracos.push(`Ticket médio de ${fmtR(tick)} está abaixo do potencial para estética avançada. A clínica provavelmente vende procedimentos avulsos, não transformações.`);
  if (scores.marketing < 5) pontos_fracos.push("Score de marketing baixo indica ausência de estratégia de conteúdo consistente. Sem autoridade digital, o crescimento depende de sorte.");
  if (conv_aval.includes("3 a 4") || conv_aval.includes("1 a 2")) pontos_fracos.push("Taxa de conversão lead→avaliação abaixo de 50% sugere script de qualificação fraco ou tempo de resposta alto.");
  if (inv.includes("Menos de 3") || inv.includes("Nada")) pontos_fracos.push("Investimento em marketing abaixo de 3% do faturamento é insuficiente para crescimento. Negócios que param de investir param de crescer.");

  // Oportunidades
  if (gap_receita > 0) oportunidades.push(`Capacidade ociosa identificada: potencial de ${fmtR(gap_receita)}/mês em receita adicional sem contratar ninguém — apenas preenchendo a agenda atual.`);
  if (fat > 0 && meta > fat) oportunidades.push(`Meta declarada de ${fmtR(meta)} representa +${Math.round((meta/fat-1)*100)}% de crescimento — ambição alinhada com o que o Método Axis entrega.`);
  if (!tem_trafego) oportunidades.push("Tráfego pago ainda não explorado. Para o perfil da clínica, Meta Ads bem estruturado costuma entregar CPL entre R$30–80 — ROI de 10–20x sobre o investimento.");
  if (tem_gmn && !tem_trafego) oportunidades.push("Google Meu Negócio ativo é ponto de partida para Google Ads local — palavras como 'harmonização facial [cidade]' têm alta intenção de compra.");
  if (tick > 0 && tick < 4000) oportunidades.push(`Protocolo nomeado pode elevar o ticket de ${fmtR(tick)} para ${fmtR(Math.round(tick*3/500)*500)} — sem aumentar custo operacional. Essa alavanca sozinha pode dobrar o faturamento.`);
  if (a.reativacao && !a.reativacao.includes("regularmente")) oportunidades.push("Base de pacientes existente é ativo subutilizado. Campanha de reativação bem feita converte 15–25% dos inativos em 30 dias.");
  oportunidades.push("Estética avançada é mercado em crescimento acelerado no Brasil. A janela para posicionamento de autoridade local ainda está aberta na maioria das cidades.");

  // Riscos
  if (!tem_crm && tem_trafego) riscos.push("Investir em tráfego sem CRM é como encher um balde furado — leads chegam mas se perdem por falta de gestão.");
  if (tend.includes("Caindo")) riscos.push("Faturamento em queda é sinal amarelo. Sem intervenção imediata em captação, a tendência tende a se agravar.");
  if (scores.comercial < 4) riscos.push("Processo comercial crítico: a clínica pode estar gerando demanda mas perdendo no atendimento. Leads sem conversão = dinheiro queimado.");
  if (inv.includes("Nada") && !tem_trafego) riscos.push("Sem investimento em marketing, o crescimento depende 100% de indicação — canal importante mas imprevisível e não escalável.");
  if (cap < 10 && fat >= 40000) riscos.push("Capacidade operacional baixa pode ser gargalo para crescimento. Escalar marketing sem aumentar capacidade gera frustração de pacientes.");
  riscos.push("Concorrência crescente em estética avançada. Clínicas sem posicionamento claro de protocolo premium perdem para quem comunica transformação, não procedimento.");

  // ── DIAGNÓSTICO MACRO ─────────────────────────────────────────────
  let situacao, situacaoDesc, cor_situacao;
  const scoreTotal = Object.values(scores).reduce((a,b) => a+b, 0);
  if (scoreTotal >= 28) {
    situacao = "Operação Madura"; cor_situacao = "#00C853";
    situacaoDesc = `${a.nome_clinica||"A clínica"} opera com fundamentos sólidos. O diagnóstico aponta uma operação que já provou seu modelo — o trabalho agora é de escala inteligente, otimização de canais e construção de autoridade de marca.`;
  } else if (scoreTotal >= 18) {
    situacao = "Em Crescimento"; cor_situacao = "#2196F3";
    situacaoDesc = `${a.nome_clinica||"A clínica"} tem tração e crescimento, mas enfrenta lacunas de processo que limitam o próximo salto. O diagnóstico aponta oportunidades claras em comercial e marketing — com as alavancas certas, o crescimento pode ser 2–3x o atual.`;
  } else if (scoreTotal >= 10) {
    situacao = "Estruturação Necessária"; cor_situacao = "#FF9800";
    situacaoDesc = `${a.nome_clinica||"A clínica"} tem potencial real, mas opera sem os sistemas básicos que garantem previsibilidade de receita. O diagnóstico identifica lacunas críticas — CRM, tráfego, processo comercial — que precisam ser resolvidas antes de qualquer escala.`;
  } else {
    situacao = "Ponto de Partida"; cor_situacao = "#E53935";
    situacaoDesc = `${a.nome_clinica||"A clínica"} está no início da jornada de estruturação. O diagnóstico aponta a necessidade de construir a fundação primeiro — sem ela, qualquer investimento em marketing se perde.`;
  }

  // ── POSICIONAMENTO DE MERCADO ─────────────────────────────────────
  let posicionamento;
  if (tick >= 4000 && hof.includes("HOF")) {
    posicionamento = { nivel:"Premium", desc:"A clínica já opera no tier premium de estética avançada. A estratégia deve reforçar autoridade e exclusividade — não competir por preço, mas por resultado e experiência.", acao:"Criar conteúdo de cases com dados reais. Proibir desconto. Criar lista de espera como posicionamento." };
  } else if (tick >= 2000) {
    posicionamento = { nivel:"Intermediário", desc:"A clínica está no meio-termo — nem o mais barato, nem o premium. Essa é a posição mais arriscada. Precisa escolher um lado.", acao:"Criar 1 protocolo nomeado de alto ticket. Comunicar resultado, não procedimento. Aumentar ticket médio 30–50% nos próximos 90 dias." };
  } else {
    posicionamento = { nivel:"Comoditizado", desc:"Com ticket abaixo de R$2.000, a clínica compete por preço — o mercado mais cruel e menos rentável.", acao:"Engenharia de protocolo urgente. Criar âncora de valor alta antes de qualquer campanha paga. O posicionamento muda a matemática do negócio." };
  }

  // ── ALAVANCAS DE CRESCIMENTO ──────────────────────────────────────
  const alavancas = [];
  if (tick > 0 && tick < 4000) {
    alavancas.push({
      titulo:"Alavanca #1 — Ticket Médio",
      potencial:`+${fmtR(Math.round(tick * 2))} de receita mensal sem novos pacientes`,
      como:"Criar 1 protocolo nomeado a 3x o ticket atual. Represar procedimentos avulsos. Treinar equipe para venda de transformação, não procedimento.",
      prazo: "Primeiro mês do Método Axis",
    });
  }
  if (!tem_trafego || inv.includes("Menos de 3")) {
    alavancas.push({
      titulo:"Alavanca #2 — Captação Estruturada",
      potencial:`${fmtR(Math.round(fat * 0.4))} em receita adicional com CPL < 25% do ticket`,
      como:"Meta Ads com landing page dedicada + pixel configurado. Script de qualificação em 5 minutos. Follow-up de 7 dias automatizado no CRM.",
      prazo: "Meses 1–2 do Método Axis",
    });
  }
  if (a.reativacao && !a.reativacao.includes("regularmente")) {
    alavancas.push({
      titulo:"Alavanca #3 — Reativação de Base",
      potencial:`15–25% dos pacientes inativos reconvertidos = ${fmtR(Math.round(fat * 0.15))}+ em receita imediata`,
      como:"Campanha via WhatsApp para inativos dos últimos 18 meses. Oferta de avaliação gratuita ou protocolo de retorno. Baixo custo, alto retorno.",
      prazo:"30 dias — execução imediata",
    });
  }
  if (!tem_gmn) {
    alavancas.push({
      titulo:"Alavanca #4 — Presença Local",
      potencial:"20–40 leads orgânicos/mês sem custo de mídia",
      como:"Criar e otimizar Google Meu Negócio. Estratégia de captação de avaliações. Posts semanais para SEO local.",
      prazo:"30 dias para configurar, 60–90 dias para resultados",
    });
  }
  if (alavancas.length < 3) {
    alavancas.push({
      titulo:"Alavanca — Programa de Indicação",
      potencial:"10–15% dos novos pacientes via indicação estruturada",
      como:"Criar benefício claro para quem indica (desconto, brinde, protocolo de manutenção). Tornar o programa visível e rastreável.",
      prazo:"2 semanas para lançar",
    });
  }

  // ── VISÃO ESTRATÉGICA CMO ─────────────────────────────────────────
  const alavancaPrincipal = tick > 0 && tick < 3000
    ? `elevar o ticket médio de ${fmtR(tick)} através de protocolos nomeados — essa mudança sozinha pode aumentar o faturamento em 40–60% sem novos pacientes`
    : !tem_trafego
    ? "estruturar tráfego pago com landing page dedicada — o fluxo de leads qualificados que o negócio precisa para crescer de forma previsível"
    : "otimizar a conversão de leads existentes com CRM e follow-up estruturado — a receita que já chega mas se perde por falta de processo";

  const visao = `${a.nome_clinica||"A clínica"} está no ponto certo para o Método Axis. Com faturamento de ${fmtR(fat)}, a operação já tem tração real — o trabalho agora é de estratégia, consistência e ampliação de canais.\n\nO Método Axis atua em três frentes simultâneas: presença digital (conteúdo + SEO local + GMN), captação (tráfego pago + conversão + CRM) e autoridade de marca (Reels, stories, cases com dados). Não é uma entrega avulsa — é uma operação integrada de marketing que você não precisaria de um time interno para ter.\n\nA maior alavanca de curto prazo é ${alavancaPrincipal}. Com o Método Axis estruturando essas frentes, a meta de ${fmtR(meta90)} em 90 dias é matemática — não otimismo.`;

  return { situacao, situacaoDesc, cor_situacao, posicionamento, pontos_fortes, pontos_fracos, oportunidades, riscos, alavancas, visao };
}

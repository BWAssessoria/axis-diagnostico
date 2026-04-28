import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { fetchSheet, extractSheetId, gvizToTable, gvizToRaw } from '@/lib/pgm-parser';
import { computeAnalytics } from '@/lib/cmo-analytics';
import { logUsage } from '@/lib/usage';

function buildContext({ client, diagnostic, analyses, metrics, memory, pgm }) {
  const lines = [];

  // ── Perfil do cliente ─────────────────────────────────────────────────────
  lines.push(`## CLIENTE: ${client.business_name}`);
  lines.push(`Responsável: ${client.owner_name}`);
  if (client.products?.name) lines.push(`Produto AXIS: ${client.products.name}`);
  if (client.start_date) {
    const months = Math.round((Date.now() - new Date(client.start_date)) / (1000 * 60 * 60 * 24 * 30));
    lines.push(`Tempo com a AXIS: ${months} meses`);
  }
  lines.push('');

  // ── Memória acumulada ─────────────────────────────────────────────────────
  if (memory?.trim()) {
    lines.push('## MEMÓRIA ESTRATÉGICA DO CLIENTE (sessões anteriores)');
    lines.push(memory);
    lines.push('');
  }

  // ── Diagnóstico inicial — TODOS os campos ────────────────────────────────
  if (diagnostic?.answers) {
    const a = diagnostic.answers;
    const FIELD_LABELS = {
      nome: 'Nome', nome_clinica: 'Clínica', cidade_estado: 'Cidade/Estado',
      tempo_clinica: 'Tempo de clínica', fat_atual: 'Faturamento atual declarado',
      fat_6m: 'Histórico 6 meses declarado', maior_fat: 'Maior faturamento já atingido',
      fat_tendencia: 'Tendência de faturamento', meta: 'Meta mensal',
      resultado_renovacao: 'Meta para renovar contrato', margem: 'Margem declarada',
      ticket: 'Ticket médio declarado', capacidade: 'Capacidade de pacientes/mês',
      pac_desejados: 'Pacientes desejados/mês', dias_atend: 'Dias de atendimento',
      equipe: 'Estrutura da equipe', quem_fecha: 'Quem fecha vendas',
      quem_resp: 'Quem responde leads', tempo_resp: 'Tempo de resposta leads',
      conv_aval: 'Conversão lead→avaliação', conv_proc: 'Conversão avaliação→procedimento',
      tempo_fechamento: 'Tempo médio de fechamento', motivo_perda: 'Motivo de perda de leads',
      objecoes: 'Principais objeções', follow_up: 'Faz follow-up',
      reativacao: 'Estratégia de reativação', script_whats: 'Script WhatsApp',
      carro_chefe: 'Serviço carro-chefe', vender_mais: 'O que quer vender mais',
      procedimentos: 'Procedimentos e preços', hof_foco: 'Foco HOF',
      diferencial: 'Diferencial competitivo', diferenciais: 'Diferenciais',
      origem: 'Principal origem de pacientes', trafego: 'Investe em tráfego pago',
      investimento_mkt: 'Investimento em marketing', google_ads: 'Google Ads',
      pixel_meta: 'Pixel Meta', instagram: 'Instagram (seguidores)',
      tiktok: 'TikTok', influencer: 'Influenciadores',
      freq_posts: 'Frequência de posts', conteudo: 'Quem produz conteúdo',
      estrategia_conteudo: 'Estratégia de conteúdo', nivel_mkt: 'Nível de marketing',
      tempo_mkt: 'Horas/semana em marketing', aparecer_conteudo: 'Disposição para aparecer',
      gmn: 'Google Meu Negócio', site: 'Site', landing_page: 'Landing page',
      crm: 'CRM / controle de pacientes', pagamento: 'Formas de pagamento',
      sazonalidade: 'Sazonalidade percebida', exp_ruim: 'Experiência ruim anterior',
      medo_assessoria: 'Maior medo com assessoria', max_leads: 'Máximo de leads já gerados',
      o_que_fez: 'O que já tentou', expect_90d: 'Expectativa 90 dias',
      algo_mais: 'Observações adicionais',
    };
    lines.push('## DIAGNÓSTICO COMPLETO (respostas do cliente)');
    lines.push('> Estes são dados AUTO-DECLARADOS pelo cliente. Compare com a PGM para identificar divergências.');
    lines.push('');
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      if (a[key] != null && a[key] !== '' && !key.startsWith('_')) {
        lines.push(`- **${label}:** ${a[key]}`);
      }
    }
    // Captura campos não mapeados para não perder nada
    const mapped = new Set(Object.keys(FIELD_LABELS));
    for (const [key, val] of Object.entries(a)) {
      if (!mapped.has(key) && !key.startsWith('_') && val != null && val !== '') {
        lines.push(`- **${key}:** ${val}`);
      }
    }
    lines.push('');
  }

  // ── Analytics pré-computados (banco de dados) ─────────────────────────────
  const analyticsText = computeAnalytics(metrics);
  if (analyticsText) {
    lines.push('## ANÁLISE COMPUTADA DOS DADOS (banco de dados)');
    lines.push(analyticsText);
  }

  // ── Dados ao vivo da PGM ──────────────────────────────────────────────────
  if (pgm?.dash) {
    lines.push('## PGM — HISTÓRICO MENSAL (aba Dash — fonte primária)');
    lines.push(pgm.dash);
    lines.push('');
  }
  if (pgm?.painel) {
    lines.push('## PGM — PAINEL ATUAL (funil, metas, indicadores do período)');
    lines.push(pgm.painel);
    lines.push('');
  }
  if (pgm?.cronograma) {
    lines.push('## PGM — CRONOGRAMA GPS (metas e planejamento)');
    lines.push(pgm.cronograma);
    lines.push('');
  }
  if (pgm?.registro) {
    lines.push('## PGM — REGISTRO (log de atendimentos e procedimentos)');
    lines.push(pgm.registro);
    lines.push('');
  }
  if (pgm?.leads) {
    lines.push('## PGM — LEADS (base detalhada de leads)');
    lines.push(pgm.leads);
    lines.push('');
  }
  if (pgm?.semana) {
    lines.push('## PGM — SEMANA A SEMANA (acompanhamento semanal)');
    lines.push(pgm.semana);
    lines.push('');
  }

  // ── Plano Estratégico (carregado com prioridade máxima) ──────────────────
  const strategicPlan = analyses?.find((a) => a.title?.startsWith('Plano Estratégico'));
  if (strategicPlan?.content) {
    lines.push('## PLANO ESTRATÉGICO ATIVO (norte de todas as análises)');
    lines.push('> Este é o plano acordado com o cliente. Toda recomendação deve ser consistente com ele.');
    lines.push(strategicPlan.content.slice(0, 3000) + (strategicPlan.content.length > 3000 ? '\n...[plano truncado]' : ''));
    lines.push('');
  }

  // ── Análises anteriores (excluindo o plano estratégico) ───────────────────
  const otherAnalyses = analyses?.filter((a) => !a.title?.startsWith('Plano Estratégico')) ?? [];
  if (otherAnalyses.length) {
    lines.push('## ANÁLISES REGISTRADAS PELA EQUIPE AXIS');
    for (const a of otherAnalyses.slice(0, 3)) {
      lines.push(`### ${a.title} (${new Date(a.created_at).toLocaleDateString('pt-BR')})`);
      if (a.content) lines.push(a.content.slice(0, 500) + (a.content.length > 500 ? '...' : ''));
      lines.push('');
    }
  }

  return lines.join('\n');
}

const SYSTEM_PROMPT = `Você é o Agente CMO da AXIS 360 — o mais completo estrategista de marketing para clínicas de estética avançada do Brasil.

## Sua identidade e missão
Você combina experiência profunda em marketing de performance, gestão de clínicas médicas e estéticas, psicologia de consumo de alto ticket e metodologias de crescimento escalável. Sua missão é transformar dados em decisões que geram faturamento real.

## Conhecimento profundo do mercado

### Benchmarks reais de clínicas de estética (Brasil)
- Conversão lead → agendamento: top performers 35-50% | média 20-35% | crítico abaixo de 20%
- Comparecimento (show rate): top performers 75-85% | média 60-75% | crítico abaixo de 55%
- Conversão consulta → procedimento: top performers 65-80% | média 45-65% | crítico abaixo de 45%
- Conversão global lead → venda: top performers 18-30% | média 10-18% | crítico abaixo de 8%
- Taxa de retorno (recorrência em 90 dias): top performers 45-60% | média 30-45% | crítico abaixo de 25%
- Ticket médio clínicas nível médio-alto: R$ 1.500–3.500 | alto ticket: R$ 3.500–8.000
- Crescimento saudável: 8-15% MoM em fase de crescimento | 3-8% em fase madura
- Margem operacional saudável: 25-40% | excelente: acima de 40%

### Sazonalidade no Brasil (medicina estética)
- Pico 1 — OUT/NOV: preparação para o verão → procedimentos corporais, harmonização facial, bioestimuladores
- Pico 2 — FEV/MAR: pós-carnaval, preparação para o outono → fios de PDO, lasers, rejuvenescimento
- Vale 1 — JUN/JUL: inverno → queda de 15-25% na demanda em geral (mas laser e tratamentos profundos sobem)
- Vale 2 — AGO: final do inverno, menor mês do ano para muitas clínicas
- Dezembro: demanda moderada por festas, mas agenda compromissada
- Janeiro: baixo (férias) mas recuperação acelerada

### Fontes de pacientes e canais (prioridade por ROI)
1. Indicação de pacientes (CAC zero, maior conversão) → deve ser estimulada ativamente
2. Instagram orgânico + stories/reels de resultados → fundamental para autoridade
3. Google Meu Negócio + SEO local → alta intenção de compra
4. WhatsApp marketing (base de pacientes) → reativação e upsell
5. Tráfego pago (Meta Ads + Google Ads) → escala, mas exige processo de atendimento estruturado
6. Parcerias locais (academias, salões, médicos) → volume qualificado

### Ciclo de vida do paciente
- Novo paciente: alta necessidade de confiança, experiência na consulta é decisiva
- Paciente recorrente: cross-sell de protocolos, programa de fidelidade, antes/depois documentado
- Paciente inativo (>90 dias sem retorno): campanha de reativação via WhatsApp com oferta específica
- Embaixadora: paciente apaixonada → programa de indicação com incentivo real

### Erros mais comuns em clínicas que não crescem
- Atendimento de leads lento (>1h para responder = queda de 50% na conversão)
- Consulta sem proposta estruturada (apresentação de valor, plano de tratamento, financiamento)
- Sem processo de confirmação de consulta (no-show alto)
- Sem nutrição de leads frios (leads que não converteram imediatamente)
- Dependência de um único canal de aquisição
- Sem programa de reativação de pacientes inativos
- Agenda mal gerida (janelas abertas = receita perdida)
- Precificação por procedimento isolado em vez de protocolos (derruba ticket médio)

### Alavancas de crescimento rápido (30-90 dias)
1. Processo de atendimento de leads no WhatsApp (script + tempo de resposta)
2. Reativação de pacientes inativos (lista base × oferta personalizada)
3. Protocolo de upsell na consulta (plano de tratamento completo vs. procedimento avulso)
4. Confirmação ativa de consultas 24h antes (reduz no-show em 30-50%)
5. Programa de indicação com incentivo real para pacientes atuais
6. Otimização de Google Meu Negócio (fotos, respostas, categorias)

## Produtos AXIS e seus escopos (use para calibrar recomendações)

### AXIS GPS (sprint 45 dias — R$4.000)
Para clínicas até R$35k/mês ou downsell do PAE. 4 pilares:
- Diagnóstico 360 | Método AXIS Protocol (1-2 protocolos) | Posicionamento Instagram + GMN | Estrutura Comercial (script WhatsApp)
- Não inclui mídia paga. Aquisição é 100% orgânica.
- Meta: ao final dos 45 dias o cliente sabe o que vender, por quanto e para quem.

### PAE Starter (mensal — R$2.800/mês)
Para clínicas R$35k–R$70k/mês. Inclui: Meta Ads, posicionamento, estrutura comercial, 1 encontro/mês.
- NÃO inclui Método AXIS Protocol nem AXIS Academy.
- Meta: fim da dependência de indicação — leads chegando de forma previsível.

### PAE Scale (mensal — R$3.800/mês)
Para clínicas acima R$70k/mês. Inclui tudo do Starter + Método AXIS Protocol (2-3 protocolos), AXIS Academy mensal, treinamento secretária, gestor de tráfego no WPP, 2 encontros/mês.
- Meta: mais pacientes + cada paciente valendo muito mais. Um paciente de protocolo vale 5–12x mais que procedimento avulso.

## Método AXIS Protocol (GPS e Scale)
Construir protocolos de alto valor com nome proprietário (não comparável com concorrente):
- Exemplo: em vez de "botox R$800" → "Protocolo Beleza Real" (toxina + bioestimulador + skinbooster) por R$6.200
- O protocolo é integrado nas campanhas de mídia (anúncio fala no resultado, não no procedimento)
- Revisão trimestral de performance dos protocolos

## Casos reais de resultado AXIS (use como referência para calibrar expectativas)
- Cliente GPS (biomédica): R$28k→R$73k (+163%) em 45 dias com os MESMOS 80 leads. Alavanca: protocolo + script
- Cliente Scale (HOF, Belo Horizonte): R$85k→R$210k (+147%) em 6 meses. Ticket R$1.250→R$6.400 (+412%). Alavanca: protocolo R$8.200 integrado nas campanhas

## Linguagem de transformação (use sempre — nunca fale em entregáveis)
- NÃO: "tráfego pago" → SIM: "leads qualificados chegando de forma previsível todo mês"
- NÃO: "script de atendimento" → SIM: "a secretária para de perder leads e começa a converter"
- NÃO: "Google Meu Negócio" → SIM: "você aparece antes do concorrente quando o paciente busca no mapa"
- NÃO: listar entregáveis → SIM: descrever a transformação no negócio do cliente

## ICPs do mercado
- Dentista HOF: maior medo = agenda irregular. Falar em previsibilidade, nunca em "tráfego pago"
- Clínica 2+ profissionais: dor = marketing sem métricas. Falar em CAC, CPL, escala
- Médico Estético Premium: medo = imagem arriscada. Falar em autoridade e compliance CFO
- Biomédico: entra pelo GPS. Alto potencial mas sem estrutura mínima ainda

## Como você analisa

### Passo 1 — Cruzamento diagnóstico vs. PGM (OBRIGATÓRIO)
Sempre compare o que o cliente DECLAROU no diagnóstico com o que a PGM MOSTRA na prática.
Divergências são os insights mais valiosos. Exemplos:
- Cliente declarou ticket de R$800 → PGM mostra R$450: queda de ticket não percebida
- Cliente declarou 30% de margem → PGM mostra prejuízo: custo oculto ou precificação errada
- Cliente disse que faz follow-up sempre → PGM mostra leads caindo: processo quebrado
- Cliente declarou faturamento estável → PGM mostra queda de 3 meses: negação do problema

### Passo 2 — Identificação do gargalo principal
Onde está a maior perda no funil? Qual etapa, se otimizada, tem maior impacto no faturamento?

### Passo 3 — Hipóteses (SEMPRE 2-3 antes de concluir)
Para qualquer problema identificado, gere 2-3 hipóteses explicativas. Exemplo:
- Hipótese 1: leads de baixa qualidade (problema de aquisição)
- Hipótese 2: atendimento no WhatsApp lento ou sem script (problema de processo)
- Hipótese 3: proposta de valor fraca na consulta (problema de vendas)
Ordene da mais provável para menos provável com justificativa nos dados.

### Passo 4 — Plano de ação priorizado
3 ações concretas, ordenadas por impacto/esforço, com prazo sugerido.

## Formato de resposta para análises completas
Use esta estrutura quando fizer análise completa (revisão mensal, auditoria de funil, etc.):

**📊 Situação Atual**
[O que os dados mostram de fato]

**🔍 Diagnóstico**
[Cruzamento diagnóstico vs. PGM + gargalo principal identificado]

**💡 Hipóteses**
[2-3 hipóteses ordenadas por probabilidade]

**🎯 Plano de Ação**
[3 ações prioritárias com prazo e impacto esperado]

Para perguntas diretas e conversas, responda de forma mais fluida sem necessariamente seguir o template.

## Regras de resposta
- Sempre em português brasileiro
- Seja denso e direto — cada parágrafo deve ter um insight ou ação, sem frases de preenchimento
- Prefira bullet points a parágrafos longos
- Máximo 3 itens por seção — priorize, não liste tudo
- Use os números exatos dos dados fornecidos — nunca invente
- Interprete tabelas brutas da planilha (colunas separadas por | ou tabulações)
- Quando faltar dado, cite em uma linha só o que falta e siga em frente
- Reconheça pontos positivos brevemente — foco é no que mover
- Use a memória acumulada para não repetir o que já foi diagnosticado — avance na conversa
- Nunca termine a resposta no meio de uma frase ou seção — conclua sempre`;

export async function POST(request, { params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Não autorizado', { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return new Response('Acesso negado', { status: 403 });

  const { message, history = [] } = await request.json();
  if (!message?.trim()) return new Response('Mensagem vazia', { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY não configurada.', { status: 500 });
  }

  const [{ data: client }, { data: diagnostic }, { data: analyses }, { data: metrics }, { data: memoryRow }] = await Promise.all([
    supabase.from('clients').select('*, products(name)').eq('id', id).single(),
    supabase.from('diagnostics').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('analyses').select('id, title, content, created_at').eq('client_id', id).order('created_at', { ascending: false }).limit(6),
    supabase.from('metrics_monthly').select('*').eq('client_id', id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('cmo_memory').select('content').eq('client_id', id).maybeSingle(),
  ]);

  if (!client) return new Response('Cliente não encontrado', { status: 404 });

  // Busca PGM — usa cache de 10 min para evitar re-fetch a cada mensagem
  let pgm = null;
  if (client.sheets_url) {
    const sheetId = extractSheetId(client.sheets_url);
    if (sheetId) {
      const TEN_MIN_AGO = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from('pgm_cache')
        .select('tabs, fetched_at')
        .eq('client_id', id)
        .gte('fetched_at', TEN_MIN_AGO)
        .maybeSingle();

      if (cached?.tabs) {
        pgm = cached.tabs;
      } else {
        const [dashGviz, painelGviz, cronGviz, registroGviz, leadsGviz, semanaGviz] = await Promise.allSettled([
          fetchSheet(sheetId, 'Dash', 1),
          fetchSheet(sheetId, 'Painel', 0),
          fetchSheet(sheetId, 'Cronograma GPS', 0),
          fetchSheet(sheetId, 'Registro', 1),
          fetchSheet(sheetId, 'Leads', 1),
          fetchSheet(sheetId, 'Semana a Semana', 0),
        ]);

        pgm = {
          dash:       dashGviz.status     === 'fulfilled' ? gvizToTable(dashGviz.value, 24)  : null,
          painel:     painelGviz.status   === 'fulfilled' ? gvizToRaw(painelGviz.value, 40)  : null,
          cronograma: cronGviz.status     === 'fulfilled' ? gvizToRaw(cronGviz.value, 30)    : null,
          registro:   registroGviz.status === 'fulfilled' ? gvizToTable(registroGviz.value, 25) : null,
          leads:      leadsGviz.status    === 'fulfilled' ? gvizToTable(leadsGviz.value, 30) : null,
          semana:     semanaGviz.status   === 'fulfilled' ? gvizToRaw(semanaGviz.value, 20)  : null,
        };

        // Salva no cache
        await supabase.from('pgm_cache').upsert(
          { client_id: id, tabs: pgm, fetched_at: new Date().toISOString() },
          { onConflict: 'client_id' }
        );
      }
    }
  }

  const context = buildContext({
    client,
    diagnostic,
    analyses,
    metrics,
    memory: memoryRow?.content ?? '',
    pgm,
  });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Route to Haiku for simple factual questions; Sonnet for analysis
  const isComplex = (() => {
    const msg = message.toLowerCase();
    const complexKeywords = [
      'analise', 'analisa', 'auditoria', 'estratégia', 'estrategia',
      'plano de ação', 'plano de acao', 'diagnóstico', 'diagnostico',
      'recomenda', 'como melhorar', 'o que fazer', 'tendência', 'tendencia',
      'projeção', 'projecao', 'gargalo', 'comparar', 'identific',
      'revisão', 'revisao', 'mensal', 'resumo geral', 'análise', 'funil',
      'conversão', 'conversao', 'crescimento', 'faturamento', 'meta',
    ];
    return message.length > 120 || complexKeywords.some((k) => msg.includes(k));
  })();
  const model = isComplex ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
  const maxTokens = isComplex ? 3000 : 1200;

  const recentHistory = history.slice(-8);
  const messages = [
    ...recentHistory,
    { role: 'user', content: message },
  ];

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: maxTokens,
          system: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'text', text: `DADOS COMPLETOS DO CLIENTE:\n\n${context}`, cache_control: { type: 'ephemeral' } },
          ],
          messages,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        const finalMsg = await stream.finalMessage();
        await logUsage(supabase, { clientId: id, type: 'cmo', model, usage: finalMsg.usage });
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[Erro: ${err.message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

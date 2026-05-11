import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { logUsage } from '@/lib/usage';

const FIELD_LABELS = {
  nome: 'Nome', nome_clinica: 'Clínica', cidade_estado: 'Cidade/Estado',
  tempo_clinica: 'Tempo de clínica', fat_atual: 'Faturamento atual declarado',
  fat_6m: 'Histórico 6 meses', maior_fat: 'Maior faturamento já atingido',
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
  crm: 'CRM', pagamento: 'Formas de pagamento',
  sazonalidade: 'Sazonalidade percebida', exp_ruim: 'Experiência ruim anterior',
  medo_assessoria: 'Maior medo com assessoria', max_leads: 'Máximo de leads já gerados',
  o_que_fez: 'O que já tentou', expect_90d: 'Expectativa 90 dias',
  algo_mais: 'Observações adicionais',
};

// ── Product scope definitions ─────────────────────────────────────────────────
function getProductScope(slug) {
  const scopes = {
    gps: {
      title: 'AXIS GPS — Sprint Estratégico 45 Dias',
      scope: `Sprint de 45 dias com 4 pilares:
1. Diagnóstico 360 (dados já coletados)
2. Método AXIS Protocol: construir 1-2 protocolos de alto valor com nome proprietário, preço e argumento de venda em consulta
3. Posicionamento Estratégico: Instagram (stories/reels orientados a conversão) + Google Meu Negócio
4. Estrutura Comercial: script WhatsApp qualificador + playbook de atendimento da secretária

NÃO inclui mídia paga. Aquisição é via Instagram orgânico, Google Meu Negócio e indicação estruturada.
Perfil típico: faturamento até R$35k/mês ou downsell do PAE.`,
      planFormat: `## 📍 Situação Atual
[Análise honesta dos dados — sem eufemismos. O que os números mostram de fato.]

## 🔍 Diagnóstico Principal
[O ÚNICO gargalo central que está travando o crescimento. Por que é este e não outro.]

## 💡 Hipóteses (2-3 causas prováveis)
- Hipótese 1 (mais provável): ...
- Hipótese 2: ...
- Hipótese 3: ...

## 🧪 Protocolos Sugeridos (1-2 propostas)
Com base nos procedimentos e perfil do cliente, sugira protocolos de alto valor:

**[Nome proprietário — ex: "Protocolo Beleza Real"]**
Composição: [procedimentos combinados]
Preço sugerido: R$[X.XXX]
Por que esse preço: [baseado em margem + valor percebido]
Argumento de venda em consulta: "[como apresentar ao paciente sem falar em procedimento avulso]"

## 🗓️ Plano de Ação — 45 Dias
Prefixe cada ação com o pilar entre colchetes: [posicionamento] [comercial] [protocolo]
GPS NÃO usa [trafego] — este produto não inclui mídia paga.

**Semana 1-2: [tema — ex: Estrutura Comercial]**
- [comercial] Ação concreta 1 (responsável: quem | prazo: quando)
- [protocolo] Ação concreta 2 (responsável: quem | prazo: quando)

**Semana 3-4: [tema — ex: Posicionamento e Protocolos]**
- [posicionamento] ...
- [protocolo] ...

**Semana 5-6: [tema — ex: Ajustes e Consolidação]**
- [comercial] ...
- [posicionamento] ...

## 📊 KPIs — Baseline e Metas 45 Dias
| Indicador | Hoje (declarado) | Meta 45 dias | Benchmark do setor |
|---|---|---|---|
| Ticket médio | R$X | R$X | R$1.500–R$4.500 |
| Conv. Lead → Consulta | X% | X% | 35–50% top performers |
| Posição GMN (buscas locais) | sem dados | aparecer no top 3 | — |

## ⚠️ Riscos e Como Mitigar
1. **[Risco]**: [como mitigar especificamente]
2. **[Risco]**: ...`,
    },
    starter: {
      title: 'PAE Starter — Assessoria Mensal',
      scope: `Assessoria mensal recorrente (contrato 12 meses):
1. Diagnóstico 360 (dados coletados, revisado mensalmente)
2. Compra de Mídia Digital: gerenciamento de Meta Ads (Instagram + Facebook)
3. Posicionamento Estratégico: comunicação digital orientada para conversão
4. Estrutura Comercial: script WhatsApp + playbook de atendimento

NÃO inclui Método AXIS Protocol nem AXIS Academy.
Perfil típico: faturamento R$35k–R$70k/mês. Quer encerrar dependência de indicação.
Meta central: leads qualificados chegando de forma previsível todo mês.`,
      planFormat: `## 📍 Situação Atual
[Análise honesta dos dados — o que os números mostram de fato sobre faturamento, funil e aquisição.]

## 🔍 Diagnóstico Principal
[O gargalo central — onde está a maior perda no funil? Aquisição, conversão ou recorrência?]

## 💡 Hipóteses (2-3 causas prováveis)
- Hipótese 1 (mais provável): ...
- Hipótese 2: ...
- Hipótese 3: ...

## 🎯 Prioridades Estratégicas — Primeiros 90 Dias
Prefixe cada ação com o pilar entre colchetes: [posicionamento] [comercial] [trafego]

**Mês 1: Estruturação do Funil**
- [comercial] Ação 1 (responsável / prazo)
- [trafego] Ação 2 (responsável / prazo)

**Mês 2: Operação e Otimização de Mídia**
- [trafego] ...
- [posicionamento] ...

**Mês 3: Escala e Ajuste de CAC**
- [trafego] ...
- [comercial] ...

## 📊 KPIs — Baseline e Metas 90 Dias
| Indicador | Hoje (declarado) | Meta Mês 1 | Meta Mês 3 | Benchmark |
|---|---|---|---|---|
| Faturamento mensal | R$X | R$X | R$X | — |
| Leads/mês (Meta Ads) | — | X | X | — |
| CPL (custo por lead) | — | R$X | R$X | R$15–R$60 estética |
| Conv. Lead → Agendamento | X% | X% | X% | 35–50% top |
| Show rate | X% | X% | X% | 75–85% top |

## ⚠️ Riscos e Como Mitigar
1. **[Risco]**: [como mitigar]
2. **[Risco]**: ...`,
    },
    scale: {
      title: 'PAE Scale — Assessoria Mensal Completa',
      scope: `Assessoria mensal completa recorrente (contrato 12 meses) — todos os 4 pilares AXIS:
1. Diagnóstico 360 (dados coletados, revisado mensalmente)
2. Compra de Mídia Digital: Meta Ads + Google Ads (conforme estratégia)
3. Método AXIS Protocol: construir 2-3 protocolos de alto valor integrados nas campanhas + revisão trimestral
4. AXIS Academy: conteúdo mensal específico (treinamento secretária, playbook de protocolos, estratégias de ticket)

Também inclui: 2 encontros/mês, gestor de tráfego no grupo WPP.
Perfil típico: faturamento acima de R$70k/mês. Tem estrutura, quer escalar com protocolo.
Meta central: mais pacientes + cada paciente valendo muito mais (protocolo vs. procedimento avulso).
Um paciente de protocolo vale 5–12x mais que um de procedimento avulso.`,
      planFormat: `## 📍 Situação Atual
[Análise honesta dos dados — faturamento, funil, ticket médio, canais e gargalos visíveis.]

## 🔍 Diagnóstico Principal
[O gargalo central — ticket baixo por procedimento avulso? Funil de aquisição? Conversão em consulta?]

## 💡 Hipóteses (2-3 causas prováveis)
- Hipótese 1 (mais provável): ...
- Hipótese 2: ...
- Hipótese 3: ...

## 🧪 Protocolos Sugeridos (2-3 propostas) — PRIORIDADE MÁXIMA
Com base nos procedimentos e perfil do cliente:

**[Nome proprietário — ex: "Protocolo Harmonia Premium"]**
Composição: [procedimentos combinados estrategicamente]
Preço sugerido: R$[X.XXX]
Integração nas campanhas: [como anunciar o resultado, não o procedimento]
Argumento de venda em consulta: "[como apresentar ao paciente]"

## 🎯 Plano de Ação — Primeiros 90 Dias
Prefixe cada ação com o pilar entre colchetes: [protocolo] [trafego] [comercial] [posicionamento]
Scale PRIORIZA [protocolo] — pelo menos 30% das ações devem ser deste pilar.

**Mês 1: Onboarding Scale + Construção de Protocolos**
- [protocolo] Ação 1 (responsável / prazo)
- [comercial] Ação 2 (responsável / prazo)
- [trafego] Ação 3 (responsável / prazo)

**Mês 2: Integração de Protocolos nas Campanhas**
- [protocolo] ...
- [trafego] ...

**Mês 3: Escala e Otimização**
- [protocolo] ...
- [trafego] ...
- [comercial] ...

## 📚 AXIS Academy — Prioridades dos Primeiros 3 Meses
- Mês 1: [tema mais urgente — ex: Treinamento comercial da secretária para script de protocolo]
- Mês 2: [ex: Como não dar desconto — apresentação de valor em consulta]
- Mês 3: [ex: Estratégias de ancoragem e upsell pós-protocolo]

## 📊 KPIs — Baseline e Metas 90 Dias
| Indicador | Hoje (declarado) | Meta Mês 1 | Meta Mês 3 | Benchmark Scale |
|---|---|---|---|---|
| Faturamento mensal | R$X | R$X | R$X | — |
| Ticket médio | R$X | R$X | R$X | R$4.500–R$12k c/ protocolo |
| Conv. Consulta → Protocolo | X% | X% | X% | 60–80% top |
| Leads/mês | X | X | X | — |
| Conv. Lead → Agendamento | X% | X% | X% | 35–50% top |

## ⚠️ Riscos e Como Mitigar
1. **[Risco]**: [como mitigar especificamente]
2. **[Risco]**: ...`,
    },
  };

  const normalized = slug?.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized?.includes('gps'))     return scopes.gps;
  if (normalized?.includes('starter')) return scopes.starter;
  if (normalized?.includes('scale'))   return scopes.scale;
  return scopes.scale;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildDiagnosticText(answers) {
  const lines  = [];
  const mapped = new Set(Object.keys(FIELD_LABELS));
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    if (answers[key] != null && answers[key] !== '' && !key.startsWith('_')) {
      lines.push(`- **${label}:** ${answers[key]}`);
    }
  }
  for (const [key, val] of Object.entries(answers)) {
    if (!mapped.has(key) && !key.startsWith('_') && val != null && val !== '') {
      lines.push(`- **${key}:** ${val}`);
    }
  }
  return lines.join('\n');
}

function buildAssetsText(assets) {
  if (!assets?.length) return '';
  return assets.map((a) => {
    const name = a.label || a.file_name || a.file_url;
    const ref  = a.file_type === 'link' ? ` → ${a.file_url}` : ' (PDF de metodologia)';
    return `- [${a.file_type.toUpperCase()}] ${name}${ref}`;
  }).join('\n');
}

function buildProductRules(slug) {
  const normalized = slug?.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized?.includes('gps')) {
    return `## REGRA CRÍTICA — GPS
Este cliente contratou o GPS, que NÃO inclui tráfego pago.
- PROIBIDO sugerir ações com pilar [trafego] (Meta Ads, Google Ads, mídia paga).
- Se o cliente mencionar interesse em tráfego, redirecione: "isso é possível com upgrade para PAE Starter".
- Foque exclusivamente em: [posicionamento] (orgânico, GMN, Instagram), [comercial] (script, secretária) e [protocolo] (Método AXIS).`;
  }
  if (normalized?.includes('scale')) {
    return `## REGRA CRÍTICA — Scale
Este cliente contratou o PAE Scale — o nível máximo da AXIS.
- O Método AXIS Protocol é o diferencial central deste produto. PRIORIZE [protocolo] em todas as seções.
- Mínimo de 30% das ações do Plano de Ação devem ter pilar [protocolo].
- Sempre sugira 2-3 protocolos de alto ticket com nome proprietário, composição e preço (R$4.500–R$12.000).
- Um paciente de protocolo vale 5–12× um de procedimento avulso — comunique isso no plano.`;
  }
  return '';
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request, { params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Não autorizado', { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return new Response('Acesso negado', { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY não configurada.', { status: 500 });
  }

  const [
    { data: client },
    { data: diagnostic },
    { data: metrics },
  ] = await Promise.all([
    supabase.from('clients').select('*, products(name, slug)').eq('id', id).single(),
    supabase.from('diagnostics').select('*').eq('client_id', id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('metrics_monthly').select('*').eq('client_id', id)
      .order('year', { ascending: false }).order('month', { ascending: false }).limit(12),
  ]);

  if (!client)              return new Response('Cliente não encontrado', { status: 404 });
  if (!diagnostic?.answers) return new Response('Diagnóstico 360 não preenchido. Preencha antes de gerar o plano.', { status: 422 });

  // Fetch product_assets for Knowledge Hub context
  const { data: productAssets } = client.product_id
    ? await supabase.from('product_assets').select('*').eq('product_id', client.product_id)
    : { data: null };

  const productScope  = getProductScope(client.products?.slug ?? client.products?.name ?? '');
  const productSlug   = client.products?.slug ?? '';
  const productRules  = buildProductRules(productSlug);
  const assetsText    = buildAssetsText(productAssets);

  // Últimos 3 meses de métricas reais
  let metricsText = '';
  if (metrics?.length) {
    const MONTHS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    metricsText = metrics.slice(0, 3).map((m) =>
      `${MONTHS[m.month]}/${m.year}: fat=R$${m.fat_total?.toLocaleString('pt-BR') ?? '—'} | ticket=R$${m.ticket_medio?.toLocaleString('pt-BR') ?? '—'} | pacientes=${m.pacientes ?? '—'} | meta=${m.meta_mensal_pct != null ? `${(m.meta_mensal_pct * 100).toFixed(0)}%` : '—'}`
    ).join('\n');
  }

  const contextPrompt = `# CLIENTE: ${client.business_name}
Responsável: ${client.owner_name}
Produto AXIS contratado: ${client.products?.name ?? 'Não especificado'}
${client.start_date ? `Data de início: ${new Date(client.start_date).toLocaleDateString('pt-BR')}` : ''}

## ESCOPO DO PRODUTO
${productScope.scope}

## DIAGNÓSTICO 360 — RESPOSTAS DO CLIENTE
> Dados auto-declarados. Use-os como base e aponte divergências se identificar inconsistências.
${buildDiagnosticText(diagnostic.answers)}

${metricsText ? `## DADOS REAIS DO BANCO (PGM sincronizada)\n${metricsText}` : ''}

${assetsText ? `## MATERIAIS DE METODOLOGIA DO PRODUTO (Knowledge Hub)\n> Use como referência de boas práticas e protocolos do produto.\n${assetsText}` : ''}

---

## SUA TAREFA
Gere o Plano Estratégico Inicial para este cliente usando exatamente o formato abaixo.
Seja específico, honesto e acionável. Use os dados do cliente — nunca invente.
OBRIGATÓRIO: prefixe cada ação do Plano de Ação com o pilar correto entre colchetes: [posicionamento] [comercial] [trafego] [protocolo]

${productScope.planFormat}`;

  const systemPrompt = `Você é o Agente Estrategista da AXIS 360, responsável por gerar o Plano Estratégico Inicial de cada cliente.

## Sua missão
Gerar um plano honesto, específico e acionável que identifique o gargalo central e defina as ações prioritárias dentro do escopo do produto contratado.

## Metodologia AXIS — Linguagem de transformação
- NÃO diga "tráfego pago" → DIGA "leads qualificados chegando de forma previsível"
- NÃO diga "script de atendimento" → DIGA "a secretária para de perder leads e começa a converter"
- NÃO diga "Método AXIS Protocol" → DIGA "a clínica para de vender botox e começa a vender protocolo de R$9.800"
- NÃO diga "Google Meu Negócio" → DIGA "autoridade local — você aparece antes do concorrente no mapa"

## Pilar de cada ação (OBRIGATÓRIO)
Toda ação na seção "Plano de Ação" DEVE começar com a tag do pilar entre colchetes:
- [posicionamento] → marca, GMN, Instagram orgânico, conteúdo, autoridade local
- [comercial]      → script WhatsApp, secretária, follow-up, CRM, conversão em consulta
- [trafego]        → Meta Ads, Google Ads, mídia paga, campanhas (apenas PAE Starter e Scale)
- [protocolo]      → Método AXIS Protocol, criação/nomeação de protocolos, pricing, treinamento de venda de protocolo

${productRules}

## Benchmarks do setor
- Conv. lead → agendamento: top 35–50% | média 20–35% | crítico <20%
- Show rate: top 75–85% | média 60–75% | crítico <55%
- Conv. consulta → procedimento: top 65–80% | média 45–65% | crítico <45%
- Conv. consulta → protocolo (Scale): top 60–80%
- Ticket médio com protocolo: R$4.500–R$12.000 | sem protocolo: R$800–R$2.500
- Crescimento mensal saudável: 8–15% em crescimento | 3–8% em fase madura

## Casos reais AXIS (referência interna — não cite os nomes)
- Cliente GPS (biomédica, R$28k→R$73k em 45 dias): mesmos 80 leads, ticket R$1.400→R$3.200 (+129%). Alavanca: protocolos + script de atendimento
- Cliente Scale (HOF, R$85k→R$210k em 6 meses): ticket R$1.250→R$6.400 (+412%). Alavanca: Protocolo Beleza Mineira R$8.200 integrado nas campanhas

## Regras gerais
- Sempre em português brasileiro
- Use dados exatos do cliente — nunca invente números
- Identifique O gargalo principal, não uma lista genérica de problemas
- Ações específicas (o quê, quando, quem)
- Para GPS e Scale: sempre inclua protocolos sugeridos com nome, composição e preço
- Nunca termine no meio de uma seção`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder   = new TextEncoder();
  let   fullText  = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const MODEL  = 'claude-sonnet-4-6';
        const stream = anthropic.messages.stream({
          model:      MODEL,
          max_tokens: 4000,
          system:     systemPrompt,
          messages:   [{ role: 'user', content: contextPrompt }],
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        const finalMsg = await stream.finalMessage();
        await logUsage(supabase, { clientId: id, type: 'strategic_plan', model: MODEL, usage: finalMsg.usage });

        const now   = new Date();
        const title = `Plano Estratégico — ${productScope.title} — ${now.toLocaleDateString('pt-BR')}`;
        await supabase.from('analyses').insert({
          client_id:         id,
          title,
          content:           fullText,
          visible_to_client: false,
          author_id:         user.id,
        });
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[Erro ao gerar plano: ${err.message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

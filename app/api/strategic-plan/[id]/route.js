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
  const metodoAxis = {
    title: 'Método Axis — Assessoria Mensal',
    scope: `Assessoria mensal recorrente para biomédicos e odontologistas com foco em harmonização facial.
ICP: biomédico ≥ R$15k/mês ou odontologista ≥ R$12k/mês, perfil solo, 26–45 anos, foco em harmonização.
Planos: 3, 6 ou 12 meses. Ticket de contrato: R$2.500–R$3.500/mês.

3 fases de entrega:
1. Pré-onboarding: Construção de Protocolos, Implementações de suporte, Acessos (área de membros, Facebook, sistema de gestão)
2. Onboarding: Call de onboarding + Regras Importantes
3. Entrega Contínua: Construção de Audiência e Aquisição, Funil de Conversão, Análise de Métricas

Pilares de entrega: presença digital (conteúdo + GMN + SEO local), captação (Meta Ads + CRM + comercial) e autoridade de marca (protocolos nomeados de alto ticket + cases com dados).
Meta central: leads qualificados chegando de forma previsível + cada paciente valendo mais com protocolo de alto ticket.`,
    planFormat: `## 📍 Situação Atual
[Análise honesta dos dados — faturamento declarado, funil, ticket, canais ativos e gargalos visíveis.]

## 🔍 Diagnóstico Principal
[O ÚNICO gargalo central que está travando o crescimento. Por que é este e não outro.]

## 💡 Hipóteses (2-3 causas prováveis)
- Hipótese 1 (mais provável): ...
- Hipótese 2: ...
- Hipótese 3: ...

## 🧪 Protocolos Sugeridos (1-2 propostas) — PRIORIDADE MÁXIMA
Com base nos procedimentos e perfil do cliente, sugira protocolos de alto valor com nome proprietário:

**[Nome proprietário — ex: "Protocolo Harmonia Completa"]**
Composição: [procedimentos combinados]
Preço sugerido: R$[X.XXX]
Argumento de venda em consulta: "[como apresentar ao paciente — resultado, não procedimento]"
Integração nas campanhas: [como anunciar o resultado no anúncio]

## 🗓️ Plano de Ação — Primeiros 90 Dias
Prefixe cada ação com o pilar entre colchetes: [posicionamento] [comercial] [trafego] [protocolo]

**Mês 1 — Pré-onboarding + Fundação**
- [protocolo] Ação 1 (responsável / prazo)
- [comercial] Ação 2 (responsável / prazo)
- [posicionamento] Ação 3 (responsável / prazo)

**Mês 2 — Onboarding + Captação Estruturada**
- [trafego] ...
- [comercial] ...
- [posicionamento] ...

**Mês 3 — Entrega Contínua + Otimização**
- [trafego] ...
- [protocolo] ...
- [comercial] ...

## 📊 KPIs — Baseline e Metas 90 Dias
| Indicador | Hoje (declarado) | Meta Mês 1 | Meta Mês 3 | Benchmark |
|---|---|---|---|---|
| Faturamento mensal | R$X | R$X | R$X | — |
| Ticket médio | R$X | R$X | R$X | R$2.500–R$6.000 c/ protocolo |
| Leads/mês (Meta Ads) | — | X | X | — |
| CPL (custo por lead) | — | R$X | R$X | R$30–R$80 estética |
| Conv. Lead → Agendamento | X% | X% | X% | 35–50% top |
| Show rate | X% | X% | X% | 75–85% top |

## ⚠️ Riscos e Como Mitigar
1. **[Risco]**: [como mitigar especificamente]
2. **[Risco]**: ...`,
  };

  return metodoAxis;
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

function buildProductRules() {
  return `## REGRA CRÍTICA — Método Axis
Este cliente contratou o Método Axis — assessoria completa de marketing para estética avançada.
- SEMPRE inclua pelo menos 1 protocolo de alto ticket com nome proprietário, composição e preço.
- Mínimo de 30% das ações do Plano de Ação devem ter pilar [protocolo].
- Use todos os 4 pilares: [posicionamento], [comercial], [trafego] e [protocolo].
- Nunca venda procedimentos — venda transformações. Nunca cite "tráfego pago" — cite "leads qualificados chegando de forma previsível".`;
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

  const productScope  = getProductScope(client.products?.slug ?? '');
  const productRules  = buildProductRules();
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
- [trafego]        → Meta Ads, Google Ads, mídia paga, campanhas (Método Axis inclui tráfego pago)
- [protocolo]      → criação/nomeação de protocolos de alto ticket, pricing, treinamento de venda em consulta

${productRules}

## Benchmarks do setor
- Conv. lead → agendamento: top 35–50% | média 20–35% | crítico <20%
- Show rate: top 75–85% | média 60–75% | crítico <55%
- Conv. consulta → procedimento: top 65–80% | média 45–65% | crítico <45%
- Conv. consulta → protocolo (Scale): top 60–80%
- Ticket médio com protocolo: R$4.500–R$12.000 | sem protocolo: R$800–R$2.500
- Crescimento mensal saudável: 8–15% em crescimento | 3–8% em fase madura

## Casos reais AXIS (referência interna — não cite os nomes)
- Biomédica, R$28k→R$73k (+163%) com os mesmos 80 leads. Alavanca: protocolo nomeado + script de atendimento (ticket R$1.400→R$3.200)
- Odontologista HOF, R$85k→R$210k (+147%) em 6 meses. Ticket R$1.250→R$6.400 (+412%). Alavanca: Protocolo R$8.200 integrado nas campanhas Meta Ads

## Regras gerais
- Sempre em português brasileiro
- Use dados exatos do cliente — nunca invente números
- Identifique O gargalo principal, não uma lista genérica de problemas
- Ações específicas (o quê, quando, quem)
- Sempre inclua protocolos sugeridos com nome proprietário, composição e preço
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

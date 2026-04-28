import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { fetchSheet, extractSheetId, gvizToTable, gvizToRaw } from '@/lib/pgm-parser';
import { logUsage } from '@/lib/usage';

const MONTHS_PT = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export async function POST(request, { params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Não autorizado', { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return new Response('Acesso negado', { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY)
    return new Response('ANTHROPIC_API_KEY não configurada.', { status: 500 });

  const [{ data: client }, { data: analyses }, { data: metrics }] = await Promise.all([
    supabase.from('clients').select('*, products(name, slug)').eq('id', id).single(),
    supabase.from('analyses').select('id, title, content, created_at').eq('client_id', id).order('created_at', { ascending: false }).limit(8),
    supabase.from('metrics_monthly').select('*').eq('client_id', id).order('year', { ascending: false }).order('month', { ascending: false }).limit(6),
  ]);

  if (!client) return new Response('Cliente não encontrado', { status: 404 });

  const strategicPlan = analyses?.find((a) => a.title?.startsWith('Plano Estratégico'));
  if (!strategicPlan) return new Response('Nenhum Plano Estratégico encontrado. Gere o plano antes da análise mensal.', { status: 422 });

  // Busca PGM ao vivo
  let pgmText = '';
  if (client.sheets_url) {
    const sheetId = extractSheetId(client.sheets_url);
    if (sheetId) {
      const [dashGviz, painelGviz] = await Promise.allSettled([
        fetchSheet(sheetId, 'Dash', 1),
        fetchSheet(sheetId, 'Painel', 0),
      ]);
      if (dashGviz.status === 'fulfilled') pgmText += `### PGM — Histórico Mensal\n${gvizToTable(dashGviz.value, 12)}\n\n`;
      if (painelGviz.status === 'fulfilled') pgmText += `### PGM — Painel Atual\n${gvizToRaw(painelGviz.value, 30)}\n\n`;
    }
  }

  // Dados estruturados dos últimos 3 meses
  const MONTHS = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const metricsText = (metrics ?? []).slice(0, 3).map((m) =>
    `${MONTHS[m.month]}/${m.year}: fat=R$${m.fat_total?.toLocaleString('pt-BR') ?? '—'} | ticket=R$${m.ticket_medio?.toLocaleString('pt-BR') ?? '—'} | pacientes=${m.pacientes ?? '—'} | meta=${m.meta_mensal ? `R$${m.meta_mensal.toLocaleString('pt-BR')}` : '—'} | %meta=${m.meta_mensal_pct != null ? `${(m.meta_mensal_pct * 100).toFixed(0)}%` : '—'}`
  ).join('\n');

  const now = new Date();
  const monthLabel = `${MONTHS_PT[now.getMonth() + 1]} ${now.getFullYear()}`;

  const contextPrompt = `# ANÁLISE MENSAL — ${client.business_name} — ${monthLabel}
Produto: ${client.products?.name ?? '—'}

## PLANO ESTRATÉGICO ATIVO (norte desta análise)
${strategicPlan.content}

## MÉTRICAS REAIS (banco de dados — últimos 3 meses)
${metricsText || 'Sem dados sincronizados.'}

${pgmText ? `## DADOS AO VIVO DA PGM\n${pgmText}` : ''}

---

Gere a Análise Mensal de ${monthLabel} usando o formato abaixo. Compare o que o plano previa com o que os dados mostram de fato. Seja direto e acionável.

## 📊 Resultado de ${monthLabel} vs. Plano
[Comparação direta: o plano previa X, a realidade entregou Y. Use os números exatos.]

## ✅ O que avançou
[Máximo 3 pontos — o que de fato evoluiu em relação ao mês anterior e ao plano]

## ⚠️ O que está em risco
[O que não está andando conforme o plano. Identifique a causa, não apenas o sintoma.]

## 🎯 Prioridades para o Próximo Mês
1. [Ação prioritária 1 — específica, com responsável e prazo]
2. [Ação prioritária 2]
3. [Ação prioritária 3]

## 💬 Resumo Executivo (para compartilhar com o cliente)
[2-3 frases em linguagem de transformação — o que melhorou, o que vem a seguir. Sem jargão técnico.]`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const MODEL = 'claude-sonnet-4-6';
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 2500,
          system: `Você é o Agente Estrategista da AXIS 360, gerando a análise mensal de um cliente. Seja honesto, específico e acionável. Use linguagem de transformação (não de entregáveis). Sempre em português brasileiro. Nunca termine no meio de uma seção.`,
          messages: [{ role: 'user', content: contextPrompt }],
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        const finalMsg = await stream.finalMessage();
        await logUsage(supabase, { clientId: id, type: 'monthly_analysis', model: MODEL, usage: finalMsg.usage });

        await supabase.from('analyses').insert({
          client_id: id,
          title: `Análise Mensal — ${monthLabel}`,
          content: fullText,
          visible_to_client: false,
          author_id: user.id,
        });
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

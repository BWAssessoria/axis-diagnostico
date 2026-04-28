import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(request, { params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return Response.json({ error: 'Acesso negado' }, { status: 403 });

  const { messages, currentMemory = '' } = await request.json();
  if (!messages?.length) return Response.json({ error: 'Sem conversa' }, { status: 400 });

  const conversation = messages
    .map((m) => `${m.role === 'user' ? 'Consultor AXIS' : 'Agente CMO'}: ${m.content}`)
    .join('\n\n');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Você é um assistente que extrai insights estratégicos de conversas do Agente CMO.

Memória atual do cliente:
${currentMemory || '(vazia)'}

Nova conversa:
${conversation}

Sua tarefa: atualizar a memória do cliente com os insights mais importantes desta conversa.
A memória deve ser um documento vivo e acumulativo que registra:
- Padrões identificados no negócio (positivos e negativos)
- Estratégias recomendadas e seu status (pendente/em andamento/implementado)
- Características únicas do cliente (perfil, mercado, diferenciais)
- Alertas e riscos que precisam de atenção contínua
- Aprendizados sobre o que funciona ou não para este cliente

Retorne APENAS o novo conteúdo da memória atualizada, sem comentários adicionais.
Use bullet points e seções claras. Máximo 800 palavras.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const newMemory = response.content[0]?.text ?? '';

  const { error } = await supabase
    .from('cmo_memory')
    .upsert(
      { client_id: id, content: newMemory, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true, memory: newMemory });
}

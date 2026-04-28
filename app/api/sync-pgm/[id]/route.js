import { createClient } from '@/lib/supabase/server';
import { fetchSheet, extractSheetId, parseDash, parsePainel, parseCronograma } from '@/lib/pgm-parser';

export async function POST(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  // Busca cliente
  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, sheets_url')
    .eq('id', id)
    .single();

  if (!client) return Response.json({ error: 'Cliente não encontrado.' }, { status: 404 });
  if (!client.sheets_url) return Response.json({ error: 'Cliente sem link de PGM cadastrado.' }, { status: 400 });

  const sheetId = extractSheetId(client.sheets_url);
  if (!sheetId) return Response.json({ error: 'URL da planilha inválida.' }, { status: 400 });

  try {
    // Busca as 3 abas em paralelo
    const [dashGviz, painelGviz, cronGviz] = await Promise.all([
      fetchSheet(sheetId, 'Dash', 1),
      fetchSheet(sheetId, 'Painel', 0).catch(() => null),
      fetchSheet(sheetId, 'Cronograma GPS', 0).catch(() => null),
    ]);

    const dashRecords = parseDash(dashGviz);
    const painel      = painelGviz  ? parsePainel(painelGviz)       : {};
    const cronograma  = cronGviz    ? parseCronograma(cronGviz)      : {};

    if (dashRecords.length === 0) {
      return Response.json({ error: 'Nenhum dado encontrado na aba Dash.' }, { status: 422 });
    }

    // Mês atual para o painel (funil) e cronograma (metas)
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();

    // Upsert de cada registro mensal
    const records = dashRecords.map((r) => {
      const isCurrent = r.month === currentMonth && r.year === currentYear;
      return {
        client_id:          client.id,
        month:              r.month,
        year:               r.year,
        fat_total:          r.fat_total,
        fat_protocolos:     r.fat_protocolos,
        fat_avulso:         r.fat_avulso,
        pacientes:          r.pacientes,
        retorno:            r.retorno,
        ticket_medio:       r.ticket_medio,
        golden_face:        r.golden_face,
        harmonizacao:       r.harmonizacao,
        glow_skin:          r.glow_skin,
        preen_botox:        r.preen_botox,
        outros_proc:        r.outros_proc,
        // Funil e metas só para o mês atual
        ...(isCurrent ? {
          leads:               painel.leads,
          agendamentos:        painel.agendamentos,
          comparecimentos:     painel.comparecimentos,
          vendas:              painel.vendas,
          margem_pct:          painel.margem_pct,
          protocolos_vendidos: painel.protocolos_vendidos,
          meta_mensal:         cronograma.meta_mensal,
          meta_mensal_fat:     cronograma.meta_mensal_fat,
          meta_mensal_pct:     cronograma.meta_mensal_pct,
          meta_anual:          cronograma.meta_anual,
          meta_anual_fat:      cronograma.meta_anual_fat,
          meta_anual_pct:      cronograma.meta_anual_pct,
        } : {}),
        source: 'sheets',
      };
    });

    const { error } = await supabase
      .from('metrics_monthly')
      .upsert(records, { onConflict: 'client_id,month,year' });

    if (error) throw error;

    // Invalida cache PGM do CMO para forçar re-fetch na próxima consulta
    await supabase.from('pgm_cache').delete().eq('client_id', client.id);

    return Response.json({
      success: true,
      synced:  records.length,
      message: `${records.length} meses sincronizados com sucesso.`,
    });

  } catch (err) {
    console.error('[sync-pgm]', err);
    return Response.json({ error: err.message ?? 'Erro ao sincronizar.' }, { status: 500 });
  }
}

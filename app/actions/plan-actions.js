'use server';

import { assertAdmin } from '@/lib/assert-admin';

export async function syncPlanActions(clientId, analysisId, actions) {
  const { supabase } = await assertAdmin();
  await supabase.from('plan_actions').delete().eq('analysis_id', analysisId);
  if (actions.length === 0) return;
  await supabase.from('plan_actions').insert(
    actions.map((a) => ({ client_id: clientId, analysis_id: analysisId, ...a }))
  );
}

export async function updateAction(actionId, { status, notes, dueDate, assignee }) {
  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from('plan_actions')
    .update({
      status,
      notes:    notes    ?? null,
      due_date: dueDate  || null,
      assignee: assignee || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateActionStatus(actionId, status, notes) {
  return updateAction(actionId, { status, notes });
}

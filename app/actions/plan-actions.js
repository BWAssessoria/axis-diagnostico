'use server';

import { assertAdmin } from '@/lib/assert-admin';

// ── Monday.com integration stub ───────────────────────────────────────────────
// Prepares a webhook payload for Monday.com. The actual POST fires only when
// MONDAY_WEBHOOK_URL is set. Failures are non-blocking.
async function syncToMonday(actionId, eventType = 'action_updated') {
  if (!process.env.MONDAY_WEBHOOK_URL) return;
  const payload = {
    source:    'axis360',
    event:     eventType,
    action_id: actionId,
    timestamp: new Date().toISOString(),
  };
  try {
    await fetch(process.env.MONDAY_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch {
    // Monday sync must never break the main flow
  }
}

// ── Public actions ────────────────────────────────────────────────────────────
export async function syncPlanActions(clientId, analysisId, actions) {
  const { supabase } = await assertAdmin();
  await supabase.from('plan_actions').delete().eq('analysis_id', analysisId);
  if (actions.length === 0) return;
  await supabase.from('plan_actions').insert(
    actions.map((a) => ({ client_id: clientId, analysis_id: analysisId, ...a }))
  );
}

export async function createAction(clientId, analysisId, { actionText, phase, position, pilar }) {
  const { supabase } = await assertAdmin();
  const { data, error } = await supabase
    .from('plan_actions')
    .insert({
      client_id:   clientId,
      analysis_id: analysisId,
      action_text: actionText,
      phase:       phase    || null,
      position:    position ?? 0,
      pilar:       pilar    || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  await syncToMonday(data.id, 'action_created');
  return { success: true, id: data.id };
}

export async function updateAction(actionId, { status, notes, dueDate, assignee }) {
  const { supabase } = await assertAdmin();
  const { error } = await supabase
    .from('plan_actions')
    .update({
      status,
      notes:      notes    ?? null,
      due_date:   dueDate  || null,
      assignee:   assignee || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId);

  if (error) return { error: error.message };

  await syncToMonday(actionId, 'action_updated');
  return { success: true };
}

export async function updateActionStatus(actionId, status, notes) {
  return updateAction(actionId, { status, notes });
}

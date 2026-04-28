export function parseActionsFromPlan(content) {
  const actions = [];
  let currentPhase = null;
  let position = 0;
  let inPlanSection = false;

  for (const raw of content.split('\n')) {
    const line = raw.trim();

    if (line.match(/^##\s+.*[Pp]lano de [Aa]ção/)) { inPlanSection = true; continue; }
    if (inPlanSection && line.startsWith('## ')) { inPlanSection = false; continue; }
    if (!inPlanSection) continue;

    const phaseMatch = line.match(/^\*\*(.+?)\*\*\s*$/) || line.match(/^\*\*(.+?):?\*\*/);
    if (phaseMatch) { currentPhase = phaseMatch[1].replace(/:$/, '').trim(); continue; }

    const actionMatch = line.match(/^[-*]\s+(.+)/);
    if (actionMatch) {
      actions.push({ phase: currentPhase, action_text: actionMatch[1].trim(), position: position++ });
    }
  }
  return actions;
}

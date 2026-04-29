const VALID_PILARES = ['posicionamento', 'comercial', 'trafego', 'protocolo'];

export function parseActionsFromPlan(content) {
  const actions     = [];
  let currentPhase  = null;
  let position      = 0;
  let inPlanSection = false;

  for (const raw of content.split('\n')) {
    const line = raw.trim();

    if (line.match(/^##\s+.*[Pp]lano de [Aa]ção/)) { inPlanSection = true;  continue; }
    if (inPlanSection && line.startsWith('## '))    { inPlanSection = false; continue; }
    if (!inPlanSection) continue;

    const phaseMatch = line.match(/^\*\*(.+?)\*\*\s*$/) || line.match(/^\*\*(.+?):?\*\*/);
    if (phaseMatch) { currentPhase = phaseMatch[1].replace(/:$/, '').trim(); continue; }

    const actionMatch = line.match(/^[-*]\s+(.+)/);
    if (actionMatch) {
      let actionText = actionMatch[1].trim();
      let pilar      = null;

      // Extract [pilar] tag prefix — e.g. "[comercial] Treinar secretária..."
      const pilarMatch = actionText.match(/^\[([^\]]+)\]\s*/);
      if (pilarMatch && VALID_PILARES.includes(pilarMatch[1].toLowerCase())) {
        pilar      = pilarMatch[1].toLowerCase();
        actionText = actionText.slice(pilarMatch[0].length);
      }

      actions.push({ phase: currentPhase, action_text: actionText, position: position++, pilar });
    }
  }
  return actions;
}

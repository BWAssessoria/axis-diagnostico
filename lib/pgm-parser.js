// Busca uma aba do Google Sheets via gviz/tq (server-side, sem JSONP)
export async function fetchSheet(sheetId, sheetName, headers = 1) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&headers=${headers}&t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Falha ao buscar aba "${sheetName}": ${res.status}`);

  const text = await res.text();
  // Resposta: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const json = text.replace(/^[^{]*/, '').replace(/\);?\s*$/, '');
  return JSON.parse(json);
}

// Extrai o Sheet ID de uma URL do Google Sheets
export function extractSheetId(url) {
  const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

// Converte valor gviz para número
function toNum(cell) {
  if (!cell) return null;
  if (typeof cell.v === 'number') return cell.v;
  if (typeof cell.v === 'string') {
    const n = parseFloat(cell.v.replace(/[^0-9,.-]/g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  return null;
}

// Converte valor gviz para string BRL → número
function parseBRL(cell) {
  if (!cell) return null;
  const s = typeof cell.v === 'string' ? cell.v : cell.f ?? '';
  const n = parseFloat(s.replace(/[^0-9,]/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

// Acessa célula por índice (row, col), base 0
function cell(rows, row, col) {
  return rows?.[row]?.c?.[col] ?? null;
}

// ─── Parser: aba "Dash" ───────────────────────────────────────────────────────
// Estrutura: headers na linha 0, dados mensais nas linhas seguintes
// Colunas: Mês | Fat.Total | Fat.Protocolos | Fat.Avulso | Pacientes | Retorno
//          | TicketMédio | Golden Face | Harmonização | Glow Skin | Preen.Mento+Botox | Outros
export function parseDash(gviz) {
  const cols = gviz.table.cols.map((c) => c.label?.trim() ?? '');
  const rows = gviz.table.rows ?? [];

  const idx = (names) => {
    for (const n of names) {
      const i = cols.findIndex((c) => c.toLowerCase().includes(n.toLowerCase()));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iMes      = idx(['mês', 'mes']);
  const iFatTotal = idx(['fat. total', 'fat.total', 'faturamento total']);
  const iFatProt  = idx(['fat. prot', 'fat.prot', 'protocolos']);
  const iFatAvul  = idx(['avulso']);
  const iPac      = idx(['paciente']);
  const iRet      = idx(['retorno']);
  const iTicket   = idx(['ticket', 'ticke']);
  const iGolden   = idx(['golden']);
  const iHarm     = idx(['harmoni']);
  const iGlow     = idx(['glow']);
  const iPreen    = idx(['preen', 'botox']);
  const iOutros   = idx(['outros']);

  const records = [];

  for (const row of rows) {
    const mesCell = iMes >= 0 ? row.c?.[iMes] : null;
    if (!mesCell?.v) continue;

    // Extrai mês e ano da data gviz (ex: "Date(2026,3,1)" = abril 2026)
    let month, year;
    if (typeof mesCell.v === 'string' && mesCell.v.startsWith('Date(')) {
      const parts = mesCell.v.replace('Date(', '').replace(')', '').split(',');
      year  = parseInt(parts[0]);
      month = parseInt(parts[1]) + 1; // gviz usa 0-based
    } else if (mesCell.f) {
      // Tenta parse do texto formatado (ex: "jan/2026")
      const months = { jan:1, fev:2, mar:3, abr:4, mai:5, jun:6, jul:7, ago:8, set:9, out:10, nov:11, dez:12 };
      const parts = mesCell.f.toLowerCase().split('/');
      month = months[parts[0]?.slice(0, 3)];
      year  = parseInt(parts[1]);
    }

    if (!month || !year) continue;

    const get = (i) => i >= 0 ? toNum(row.c?.[i]) : null;

    records.push({
      month,
      year,
      fat_total:      get(iFatTotal),
      fat_protocolos: get(iFatProt),
      fat_avulso:     get(iFatAvul),
      pacientes:      get(iPac)   ? Math.round(get(iPac))   : null,
      retorno:        get(iRet)   ? Math.round(get(iRet))   : null,
      ticket_medio:   get(iTicket),
      golden_face:    get(iGolden),
      harmonizacao:   get(iHarm),
      glow_skin:      get(iGlow),
      preen_botox:    get(iPreen),
      outros_proc:    get(iOutros),
    });
  }

  return records;
}

// ─── Parser: aba "Painel" ─────────────────────────────────────────────────────
// headers=0, dados posicionais
export function parsePainel(gviz) {
  const rows = gviz.table.rows ?? [];
  return {
    leads:               toNum(cell(rows, 2, 2)),
    agendamentos:        toNum(cell(rows, 4, 10)),
    comparecimentos:     toNum(cell(rows, 6, 10)),
    vendas:              toNum(cell(rows, 8, 11)),
    margem_pct:          toNum(cell(rows, 14, 5)),
    protocolos_vendidos: toNum(cell(rows, 12, 2)),
  };
}

// ─── Converte gviz para texto legível pelo CMO ────────────────────────────────
// Aba com cabeçalho (headers=1): usa labels das colunas
export function gvizToTable(gviz, maxRows = 80) {
  const cols = gviz.table.cols ?? [];
  const rows = gviz.table.rows ?? [];

  const colLabels = cols.map((c) => c.label?.trim() ?? '');
  const hasHeaders = colLabels.some(Boolean);

  const lines = [];
  if (hasHeaders) {
    lines.push(colLabels.join(' | '));
    lines.push(colLabels.map(() => '---').join(' | '));
  }

  let count = 0;
  for (const row of rows) {
    if (count >= maxRows) break;
    const vals = (row.c ?? []).map((c) => {
      if (!c || c.v == null) return '';
      return c.f ?? String(c.v);
    });
    const line = vals.join(' | ').trim();
    if (line.replace(/\|/g, '').trim()) { lines.push(line); count++; }
  }
  return lines.join('\n');
}

// Aba sem cabeçalho (headers=0): dump posicional linha×coluna
export function gvizToRaw(gviz, maxRows = 80) {
  const rows = gviz.table.rows ?? [];
  const lines = [];
  let count = 0;
  for (const row of rows) {
    if (count >= maxRows) break;
    const vals = (row.c ?? []).map((c) => {
      if (!c || c.v == null) return '';
      return c.f ?? String(c.v);
    });
    const line = vals.join('\t').trim();
    if (line) { lines.push(line); count++; }
  }
  return lines.join('\n');
}

// ─── Parser: aba "Cronograma GPS" ─────────────────────────────────────────────
// headers=0, dados posicionais
export function parseCronograma(gviz) {
  const rows = gviz.table.rows ?? [];
  return {
    meta_mensal:     parseBRL(cell(rows, 6, 2)),
    meta_mensal_fat: toNum(cell(rows, 6, 4)),
    meta_mensal_pct: toNum(cell(rows, 6, 6)),
    meta_anual:      parseBRL(cell(rows, 7, 2)),
    meta_anual_fat:  toNum(cell(rows, 7, 4)),
    meta_anual_pct:  toNum(cell(rows, 7, 6)),
  };
}

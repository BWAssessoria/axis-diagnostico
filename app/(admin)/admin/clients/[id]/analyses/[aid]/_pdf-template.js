import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const GOLD  = '#C9A227';
const DARK  = '#1A1C2C';
const GREY  = '#6B6B8C';
const LINE  = '#E8E8F0';
const HEADBG = '#FDFBF5';

const s = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
  },
  // ── Header ──────────────────────────────────────
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brandBlock: { flexDirection: 'column' },
  brandName:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 1 },
  brandSub:   { fontSize: 8,  color: GREY, letterSpacing: 0.5, marginTop: 2 },
  dateText:   { fontSize: 8,  color: GREY, textAlign: 'right' },
  divider:    { height: 1, backgroundColor: LINE, marginBottom: 20 },
  // ── Title block ─────────────────────────────────
  titleBlock: { marginBottom: 24 },
  clientName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  docTitle:   { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4, lineHeight: 1.25 },
  // ── Section ─────────────────────────────────────
  section:     { marginBottom: 18 },
  sectionHead: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingBottom: 5,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D0',
  },
  subHead: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 6,
    marginBottom: 4,
  },
  para:      { fontSize: 9.5, color: DARK, lineHeight: 1.65, marginBottom: 5 },
  boldPara:  { fontSize: 9.5, color: DARK, lineHeight: 1.65, marginBottom: 5, fontFamily: 'Helvetica-Bold' },
  bullet:    { fontSize: 9.5, color: DARK, lineHeight: 1.65, marginBottom: 4 },
  bulletDot: { color: GOLD, fontFamily: 'Helvetica-Bold' },
  // ── Table ───────────────────────────────────────
  table:       { marginBottom: 10, borderWidth: 0.5, borderColor: LINE, borderRadius: 3 },
  tableRow:    { flexDirection: 'row' },
  tableHead:   { backgroundColor: HEADBG },
  tableCell:   { flex: 1, fontSize: 8, color: DARK, paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: LINE },
  tableCellHL: { flex: 1, fontSize: 8, color: GOLD, fontFamily: 'Helvetica-Bold', paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 0.5, borderRightColor: LINE },
  // ── Footer ──────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerLeft:  { fontSize: 7.5, color: '#AAAABC' },
  footerRight: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: GOLD },
});

// ── Text cleaning helpers ─────────────────────────────────────────────────────

// Remove pilar tags e marcadores markdown inline para renderização limpa no PDF
function cleanText(text) {
  return (text ?? '')
    .normalize('NFC')
    .replace(/^\[(posicionamento|comercial|trafego|protocolo)\]\s*/i, '') // pilar tags
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold**
    .replace(/\*([^*]+)\*/g,     '$1')   // *italic*
    .replace(/`([^`]+)`/g,       '$1')   // `code`
    .replace(/^#+\s*/,           '')     // heading hashes leftover
    .trim();
}

// Detecta se uma linha é inteiramente negrito: **texto**
function isFullBold(text) {
  return /^\*\*[^*]+\*\*:?$/.test(text.trim());
}

// Strip emoji from section headings (react-pdf Helvetica não suporta emoji)
function stripEmoji(str) {
  return str
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu,   '')
    .replace(/[\u{2700}-\u{27BF}]/gu,   '')
    .normalize('NFC')
    .trim();
}

// ── Markdown tokenizer ────────────────────────────────────────────────────────
function parseContent(md) {
  const tokens = [];
  const lines  = (md ?? '').normalize('NFC').split('\n');

  let tableBuffer = [];

  function flushTable() {
    if (!tableBuffer.length) return;
    tokens.push({ type: 'table', rows: tableBuffer });
    tableBuffer = [];
  }

  for (const raw of lines) {
    const trimmed = raw.trim();

    // Table row: | cell | cell |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Skip separator rows |---|---|
      if (/^\|\s*[-:| ]+\s*\|$/.test(trimmed)) continue;
      const cells = trimmed.split('|').slice(1, -1).map((c) => cleanText(c));
      tableBuffer.push(cells);
      continue;
    }
    flushTable();

    if (!trimmed) continue;

    if (trimmed.startsWith('## ')) {
      tokens.push({ type: 'heading', text: trimmed.slice(3).replace(/^#+\s*/, '').trim() });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      tokens.push({ type: 'subheading', text: cleanText(trimmed.slice(4)) });
      continue;
    }
    if (/^(\d+)\.\s/.test(trimmed)) {
      tokens.push({ type: 'numbered', text: cleanText(trimmed.replace(/^\d+\.\s*/, '')) });
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      tokens.push({ type: 'bullet', text: cleanText(trimmed.slice(2)) });
      continue;
    }
    if (isFullBold(trimmed)) {
      tokens.push({ type: 'boldpara', text: cleanText(trimmed) });
      continue;
    }
    tokens.push({ type: 'para', text: cleanText(trimmed) });
  }
  flushTable();

  return tokens;
}

// ── Group tokens into sections ────────────────────────────────────────────────
function groupSections(tokens) {
  const sections = [];
  let current    = null;

  for (const tok of tokens) {
    if (tok.type === 'heading') {
      current = { heading: tok.text, items: [] };
      sections.push(current);
    } else if (current) {
      current.items.push(tok);
    } else {
      if (!sections.length) sections.push({ heading: null, items: [] });
      sections[0].items.push(tok);
    }
  }
  return sections;
}

// ── Item renderer ─────────────────────────────────────────────────────────────
function renderItem(item, key) {
  if (item.type === 'bullet' || item.type === 'numbered') {
    return (
      <View key={key} style={{ flexDirection: 'row', marginBottom: 4 }}>
        <Text style={[s.bulletDot, { width: 14, fontSize: 9.5 }]}>
          {item.type === 'numbered' ? `${key + 1}.` : '•'}
        </Text>
        <Text style={[s.bullet, { flex: 1 }]}>{item.text}</Text>
      </View>
    );
  }
  if (item.type === 'subheading') {
    return <Text key={key} style={s.subHead}>{item.text}</Text>;
  }
  if (item.type === 'boldpara') {
    return <Text key={key} style={s.boldPara}>{item.text}</Text>;
  }
  if (item.type === 'table') {
    return (
      <View key={key} style={s.table}>
        {item.rows.map((row, ri) => (
          <View
            key={ri}
            style={[s.tableRow, ri === 0 && s.tableHead, ri < item.rows.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: LINE }]}
          >
            {row.map((cell, ci) => (
              <Text key={ci} style={ri === 0 ? s.tableCellHL : s.tableCell}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  }
  return <Text key={key} style={s.para}>{item.text}</Text>;
}

// ── PDF component ─────────────────────────────────────────────────────────────
export default function AnalysisPdf({ title, clientName, content, createdAt }) {
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  const tokens   = parseContent(content);
  const sections = groupSections(tokens);

  return (
    <Document title={title} author="AXIS 360" subject={`Análise — ${clientName}`}>
      <Page size="A4" style={s.page}>
        {/* Brand header */}
        <View style={s.headerRow} fixed>
          <View style={s.brandBlock}>
            <Text style={s.brandName}>AXIS 360</Text>
            <Text style={s.brandSub}>Plataforma de Crescimento para Clínicas</Text>
          </View>
          <Text style={s.dateText}>{dateStr}</Text>
        </View>
        <View style={s.divider} fixed />

        {/* Document title */}
        <View style={s.titleBlock}>
          <Text style={s.clientName}>{(clientName ?? '').normalize('NFC')}</Text>
          <Text style={s.docTitle}>{(title ?? '').normalize('NFC')}</Text>
        </View>

        {/* Content sections */}
        {sections.map((sec, si) => (
          <View key={si} style={s.section}>
            {sec.heading && (
              <Text style={s.sectionHead}>{stripEmoji(sec.heading)}</Text>
            )}
            {sec.items.map((item, ii) =>
              item.type === 'table'
                ? renderItem(item, ii)
                : renderItem(item, ii)
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>Documento gerado automaticamente pelo AXIS 360 · Confidencial</Text>
          <Text style={s.footerRight}>AXIS 360</Text>
        </View>
      </Page>
    </Document>
  );
}

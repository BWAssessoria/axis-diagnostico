import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const GOLD  = '#C9A227';
const DARK  = '#1A1C2C';
const GREY  = '#6B6B8C';
const LIGHT = '#F4F4FA';
const LINE  = '#E8E8F0';

const s = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
  },
  // ── Header ────────────────────────────────
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brandBlock: { flexDirection: 'column' },
  brandName:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 1 },
  brandSub:   { fontSize: 8,  color: GREY, letterSpacing: 0.5, marginTop: 2 },
  dateText:   { fontSize: 8,  color: GREY, textAlign: 'right' },
  divider:    { height: 1, backgroundColor: LINE, marginBottom: 20 },
  // ── Title block ───────────────────────────
  titleBlock: { marginBottom: 24 },
  clientName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title:      { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4, lineHeight: 1.25 },
  // ── Section ───────────────────────────────
  section:    { marginBottom: 18 },
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
  para:     { fontSize: 9.5, color: DARK, lineHeight: 1.65, marginBottom: 5 },
  bullet:   { fontSize: 9.5, color: DARK, lineHeight: 1.65, marginBottom: 4, paddingLeft: 10 },
  bulletDot:{ color: GOLD, fontFamily: 'Helvetica-Bold' },
  // ── Footer ────────────────────────────────
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

// ── Markdown parser ───────────────────────────────────────────────────────────
// Converts analysis markdown into flat { type, text } tokens.
function parseContent(md) {
  const tokens = [];
  const lines  = (md ?? '').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      tokens.push({ type: 'heading', text: line.slice(3).replace(/[#]+/g, '').trim() });
    } else if (/^(\d+)\.\s/.test(line)) {
      tokens.push({ type: 'numbered', text: line.replace(/^\d+\.\s*/, '') });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      tokens.push({ type: 'bullet', text: line.slice(2) });
    } else {
      tokens.push({ type: 'para', text: line });
    }
  }
  return tokens;
}

// Groups flat tokens into sections (heading → its children)
function groupSections(tokens) {
  const sections = [];
  let current = null;
  for (const tok of tokens) {
    if (tok.type === 'heading') {
      current = { heading: tok.text, items: [] };
      sections.push(current);
    } else if (current) {
      current.items.push(tok);
    } else {
      // Content before first heading → preamble section
      if (!sections.length) sections.push({ heading: null, items: [] });
      sections[0].items.push(tok);
    }
  }
  return sections;
}

// Strip emoji from section headings for PDF
function stripEmoji(str) {
  return str.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[\u{2600}-\u{27BF}]/gu, '').trim();
}

export default function AnalysisPdf({ title, clientName, content, createdAt }) {
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  const tokens   = parseContent(content);
  const sections = groupSections(tokens);

  return (
    <Document
      title={title}
      author="AXIS 360"
      subject={`Análise — ${clientName}`}
    >
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
          <Text style={s.clientName}>{clientName}</Text>
          <Text style={s.title}>{title}</Text>
        </View>

        {/* Content sections */}
        {sections.map((sec, si) => (
          <View key={si} style={s.section} wrap={false}>
            {sec.heading && (
              <Text style={s.sectionHead}>{stripEmoji(sec.heading)}</Text>
            )}
            {sec.items.map((item, ii) => {
              if (item.type === 'bullet' || item.type === 'numbered') {
                return (
                  <View key={ii} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <Text style={[s.bulletDot, { width: 14 }]}>
                      {item.type === 'numbered' ? `${ii + 1}.` : '•'}
                    </Text>
                    <Text style={[s.bullet, { flex: 1, paddingLeft: 0 }]}>{item.text}</Text>
                  </View>
                );
              }
              return <Text key={ii} style={s.para}>{item.text}</Text>;
            })}
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

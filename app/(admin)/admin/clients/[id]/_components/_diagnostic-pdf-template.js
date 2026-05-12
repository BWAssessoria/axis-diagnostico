import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const GOLD   = '#C9A227';
const DARK   = '#1A1C2C';
const GREY   = '#6B6B8C';
const LINE   = '#E8E8F0';
const LBLBG  = '#F7F5FF';

const s = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
  },
  // Header
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brandName:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 1 },
  brandSub:   { fontSize: 8, color: GREY, letterSpacing: 0.5, marginTop: 2 },
  dateText:   { fontSize: 8, color: GREY, textAlign: 'right' },
  divider:    { height: 1, backgroundColor: LINE, marginBottom: 20 },
  // Title block
  titleBlock: { marginBottom: 24 },
  clientName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GOLD, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  docTitle:   { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4, lineHeight: 1.25 },
  docSub:     { fontSize: 9, color: GREY },
  // Tab section heading
  tabHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 10,
    marginTop: 16,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: GOLD,
  },
  // Subsection
  subSection: { marginBottom: 12 },
  subTitle:   {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GOLD,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0E8D0',
  },
  // Field row (short)
  fieldRow:   { flexDirection: 'row', marginBottom: 5, minHeight: 16 },
  fieldLabel: { width: 160, fontSize: 8, color: GREY, paddingTop: 1, flexShrink: 0 },
  fieldValue: { flex: 1, fontSize: 9, color: DARK, lineHeight: 1.55 },
  // Field long (full width)
  fieldLongBlock: { marginBottom: 8 },
  fieldLabelLong: { fontSize: 8, color: GREY, marginBottom: 3 },
  fieldValueLong: { fontSize: 9, color: DARK, lineHeight: 1.65, backgroundColor: LBLBG, padding: 6, borderRadius: 3 },
  // Empty
  emptyText: { fontSize: 8, color: '#AAAABC', fontStyle: 'italic', marginBottom: 6 },
  // Footer
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
  // Progress bar
  progressRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  progressBar:  { flex: 1, height: 4, backgroundColor: '#F0EFF8', borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: GOLD },
  progressTxt:  { fontSize: 8, color: GREY, width: 60, textAlign: 'right' },
});

const ALL_SECTIONS = [
  {
    tab: 'Clínica',
    sections: [
      {
        title: 'Clínica',
        fields: [
          { key: 'nome_clinica',     label: 'Nome da clínica' },
          { key: 'cidade_estado',    label: 'Cidade / Estado' },
          { key: 'whatsapp',         label: 'WhatsApp' },
          { key: 'tempo_clinica',    label: 'Tempo de funcionamento' },
          { key: 'hof_foco',         label: 'Foco em HOF' },
          { key: 'dias_atendimento', label: 'Dias de atendimento' },
          { key: 'capacidade',       label: 'Capacidade semanal' },
          { key: 'equipe',           label: 'Equipe', long: true },
        ],
      },
    ],
  },
  {
    tab: 'Financeiro',
    sections: [
      {
        title: 'Faturamento',
        fields: [
          { key: 'fat_atual',        label: 'Faturamento atual' },
          { key: 'maior_fat',        label: 'Maior faturamento' },
          { key: 'meta',             label: 'Meta mensal 2026' },
          { key: 'margem',           label: 'Margem nos procedimentos' },
          { key: 'fat_tendencia',    label: 'Tendência' },
          { key: 'investimento_mkt', label: 'Investimento em marketing' },
          { key: 'fat_6m',           label: 'Últimos 6 meses', long: true },
          { key: 'sazonalidade',     label: 'Sazonalidade', long: true },
          { key: 'o_que_fez',        label: 'O que fez de diferente', long: true },
          { key: 'o_que_falta',      label: 'O que falta', long: true },
        ],
      },
      {
        title: 'Serviços & Precificação',
        fields: [
          { key: 'carro_chefe',       label: 'Procedimento carro-chefe' },
          { key: 'ticket',            label: 'Ticket médio' },
          { key: 'pagamento',         label: 'Formas de pagamento' },
          { key: 'orcamento_formato', label: 'Formato de orçamento' },
          { key: 'conforto_preco',    label: 'Conforto com preço' },
          { key: 'procedimentos',     label: 'Procedimentos e preços', long: true },
          { key: 'vender_mais',       label: 'Quer vender mais', long: true },
        ],
      },
    ],
  },
  {
    tab: 'Operação',
    sections: [
      {
        title: 'Comercial',
        fields: [
          { key: 'quem_resp',         label: 'Quem responde o WhatsApp' },
          { key: 'tempo_resp',        label: 'Tempo de resposta' },
          { key: 'max_leads',         label: 'Máx. leads recebidos/mês' },
          { key: 'conv_aval',         label: 'Conversão lead → avaliação' },
          { key: 'conv_proc',         label: 'Conversão avaliação → proc.' },
          { key: 'quem_fecha',        label: 'Quem fecha a venda' },
          { key: 'tempo_fechamento',  label: 'Tempo de fechamento' },
          { key: 'script_whats',      label: 'Script de WhatsApp' },
          { key: 'follow_up',         label: 'Follow-up' },
          { key: 'reativacao',        label: 'Reativação de pacientes' },
          { key: 'crm',               label: 'CRM / controle de leads' },
          { key: 'motivo_perda',      label: 'Principal motivo de perda' },
          { key: 'objecoes',          label: 'Objeções mais comuns' },
        ],
      },
    ],
  },
  {
    tab: 'Marketing',
    sections: [
      {
        title: 'Marketing & Presença Digital',
        fields: [
          { key: 'instagram',           label: 'Instagram' },
          { key: 'freq_posts',          label: 'Frequência de posts' },
          { key: 'conteudo',            label: 'Quem produz conteúdo' },
          { key: 'aparecer_conteudo',   label: 'Aparece no conteúdo' },
          { key: 'estrategia_conteudo', label: 'Estratégia de conteúdo' },
          { key: 'identidade_visual',   label: 'Identidade visual' },
          { key: 'origem',              label: 'Principal origem de leads' },
          { key: 'trafego',             label: 'Tráfego pago' },
          { key: 'google_ads',          label: 'Google Ads' },
          { key: 'pixel_meta',          label: 'Pixel Meta' },
          { key: 'landing_page',        label: 'Landing page' },
          { key: 'site',                label: 'Site' },
          { key: 'gmn',                 label: 'Google Meu Negócio' },
          { key: 'influencer',          label: 'Influenciador' },
          { key: 'captacao_aval',       label: 'Captação de avaliações' },
          { key: 'campanha_indicacao',  label: 'Campanha de indicação' },
          { key: 'nivel_mkt',           label: 'Nível de conhecimento em MKT' },
          { key: 'tempo_mkt',           label: 'Tempo dedicado a MKT/dia' },
        ],
      },
      {
        title: 'Visão & Expectativas',
        fields: [
          { key: 'pac_desejados',       label: 'Pacientes desejados/semana' },
          { key: 'vol_ticket',          label: 'Volume vs. ticket alto' },
          { key: 'diferencial',         label: 'Diferencial percebido' },
          { key: 'resultado_renovacao', label: 'Resultado esperado renovação' },
          { key: 'medo_assessoria',     label: 'Maior medo na assessoria' },
          { key: 'exp_ruim',            label: 'Experiência ruim anterior', long: true },
          { key: 'expect_90d',          label: 'Expectativa 90 dias', long: true },
          { key: 'algo_mais',           label: 'Algo mais a acrescentar', long: true },
        ],
      },
    ],
  },
];

const ALL_FIELDS = ALL_SECTIONS.flatMap((t) => t.sections.flatMap((s) => s.fields));

function safe(str) {
  return (str ?? '').normalize('NFC');
}

export default function DiagnosticPdf({ clientName, answers, createdAt }) {
  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  const filled  = ALL_FIELDS.filter((f) => answers[f.key]).length;
  const total   = ALL_FIELDS.length;
  const pct     = total > 0 ? Math.round((filled / total) * 100) : 0;
  const barW    = `${pct}%`;

  return (
    <Document title="Diagnóstico 360" author="AXIS 360" subject={`Diagnóstico — ${clientName}`}>
      <Page size="A4" style={s.page}>
        {/* Brand header */}
        <View style={s.headerRow} fixed>
          <View>
            <Text style={s.brandName}>AXIS 360</Text>
            <Text style={s.brandSub}>Plataforma de Crescimento para Clínicas</Text>
          </View>
          <Text style={s.dateText}>{dateStr}</Text>
        </View>
        <View style={s.divider} fixed />

        {/* Title */}
        <View style={s.titleBlock}>
          <Text style={s.clientName}>{safe(clientName)}</Text>
          <Text style={s.docTitle}>Diagnóstico 360</Text>
          <Text style={s.docSub}>Respostas do formulário de entrada — {filled}/{total} campos preenchidos ({pct}%)</Text>
        </View>

        {/* Progress */}
        <View style={s.progressRow}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: barW }]} />
          </View>
          <Text style={s.progressTxt}>{pct}% completo</Text>
        </View>

        {/* Sections */}
        {ALL_SECTIONS.map((tab) => {
          const tabFilled = tab.sections.flatMap((sec) => sec.fields).filter((f) => answers[f.key]);
          if (tabFilled.length === 0) return null;

          return (
            <View key={tab.tab}>
              <Text style={s.tabHeading}>{tab.tab}</Text>

              {tab.sections.map((section) => {
                const secFilled = section.fields.filter((f) => answers[f.key]);
                if (secFilled.length === 0) return null;

                return (
                  <View key={section.title} style={s.subSection}>
                    <Text style={s.subTitle}>{safe(section.title)}</Text>

                    {secFilled.map((field) => {
                      const value = safe(answers[field.key]);
                      if (field.long) {
                        return (
                          <View key={field.key} style={s.fieldLongBlock}>
                            <Text style={s.fieldLabelLong}>{field.label}</Text>
                            <Text style={s.fieldValueLong}>{value}</Text>
                          </View>
                        );
                      }
                      return (
                        <View key={field.key} style={s.fieldRow}>
                          <Text style={s.fieldLabel}>{field.label}</Text>
                          <Text style={s.fieldValue}>{value}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>Documento gerado automaticamente pelo AXIS 360 · Confidencial</Text>
          <Text style={s.footerRight}>AXIS 360</Text>
        </View>
      </Page>
    </Document>
  );
}

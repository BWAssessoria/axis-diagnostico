'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';

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
          { key: 'conv_proc',         label: 'Conversão avaliação → procedimento' },
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

// Flatten all fields for progress calculation
const ALL_FIELDS = ALL_SECTIONS.flatMap((t) => t.sections.flatMap((s) => s.fields));

export default function DiagnosticView({ answers, createdAt, clientId }) {
  const [activeTab, setActiveTab] = useState(0);
  const [exporting, setExporting] = useState(false);

  async function handleExportPdf() {
    setExporting(true);
    try {
      const res = await fetch(`/api/pdf/diagnostic/${clientId}`);
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = res.headers.get('content-disposition')
        ?.match(/filename="(.+)"/)?.[1] ?? 'diagnostico.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  }

  const totalFields  = ALL_FIELDS.length;
  const filledFields = ALL_FIELDS.filter((f) => answers[f.key]).length;
  const pct          = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  const dateStr = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-5 rounded-xl border border-white/[0.07] p-4" style={{ background: 'var(--bg-surface)' }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="axis-label">Diagnóstico preenchido</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground">{pct}% <span className="font-normal text-muted-foreground">({filledFields}/{totalFields} campos)</span></span>
            {clientId && (
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
              >
                <FileDown size={12} />
                {exporting ? 'Gerando...' : 'PDF'}
              </button>
            )}
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : 'var(--bronze)',
            }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">Preenchido em {dateStr}</p>
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.07] p-1" style={{ background: 'var(--bg-surface)' }}>
        {ALL_SECTIONS.map((tab, i) => {
          const tabFields  = tab.sections.flatMap((s) => s.fields);
          const tabFilled  = tabFields.filter((f) => answers[f.key]).length;
          const isActive   = activeTab === i;
          return (
            <button
              key={tab.tab}
              onClick={() => setActiveTab(i)}
              className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
              style={isActive ? { background: 'var(--bg-elevated)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' } : {}}
            >
              {tab.tab}
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: isActive ? 'rgba(240,200,32,0.12)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? 'var(--bronze)' : 'var(--text-muted)',
                }}
              >
                {tabFilled}/{tabFields.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-3">
        {ALL_SECTIONS[activeTab].sections.map((section) => {
          const filled = section.fields.filter((f) => answers[f.key]);
          if (filled.length === 0) return (
            <div key={section.title} className="rounded-xl border border-dashed border-white/[0.07] py-8 text-center">
              <p className="text-xs text-muted-foreground/50">Nenhum campo preenchido em "{section.title}"</p>
            </div>
          );
          return (
            <div key={section.title} className="overflow-hidden rounded-xl border border-white/[0.07]" style={{ background: 'var(--bg-surface)' }}>
              <div className="border-b border-white/[0.05] px-5 py-3">
                <h3 className="axis-section-title">{section.title}</h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {filled.map((field) => (
                  <div
                    key={field.key}
                    className={`px-5 py-3 ${field.long ? '' : 'flex items-start gap-4'}`}
                  >
                    <span className={`text-xs text-muted-foreground/70 ${field.long ? 'mb-1.5 block' : 'w-52 shrink-0 pt-0.5'}`}>
                      {field.label}
                    </span>
                    <span className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {answers[field.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

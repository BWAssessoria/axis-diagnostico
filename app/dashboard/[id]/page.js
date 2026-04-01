"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft, CheckCircle2, AlertCircle, XCircle, Building2,
  BarChart3, Target, Megaphone, Settings2, Sparkles, Zap,
  Activity, TrendingUp, DollarSign, MapPin, Phone, Users,
  BadgeCheck, ChevronRight, Shield, Brain, Trash2, Edit3,
  Download, FileText, TrendingDown, Minus, X, Save, Info,
  Lightbulb, AlertTriangle
} from "lucide-react";
import {
  analyze, analyzeICP, getPacRecomendacoes,
  buildDiagnostico, buildCMOAnalysis, nivelFn, fmtR, pm
} from "@/lib/analysis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── PALETA ────────────────────────────────────────────────────────────
const O="#FF4500",OL="#FFF4F0",OB="#FFD4C4";
const G="#00C853",GL="#E8F9EF";
const R="#E53935",RL="#FFEBEE";
const Y="#FF9800",YL="#FFF8E1";
const B="#2196F3",BL="#E3F2FD";
const T="#1A1A1A",T2="#6B6B6B",T3="#999";
const BD="#E8E8E8",BG="#F4F5F7",C="#FFFFFF",DK="#1A1A1A";

// ─── TOOLTIPS DAS MÉTRICAS ─────────────────────────────────────────────
const METRIC_TIPS = {
  saude:       "Score geral de saúde do negócio (0–100%). Média ponderada dos 4 pilares: Comercial, Marketing, Operacional e Financeiro.",
  icp:         "Índice de Compatibilidade com o Perfil AXIS (0–100%). Avalia o fit do cliente com os produtos da AXIS com base em 7 critérios.",
  comercial:   "Score do processo comercial: velocidade de resposta ao lead, taxas de conversão, follow-up, CRM e reativação de base.",
  marketing:   "Score de presença digital: tráfego pago, conteúdo, landing page, pixel Meta, Instagram e Google Meu Negócio.",
  operacional: "Score da operação: capacidade de atendimento, dias de trabalho, estrutura de equipe e gestão de pacientes.",
  financeiro:  "Score financeiro: faturamento atual, ticket médio, margem, investimento em marketing e tendência de crescimento.",
  fat_atual:   "Faturamento mensal bruto atual declarado pelo cliente no mapeamento.",
  ticket:      "Valor médio recebido por paciente por procedimento ou visita. Alavanca mais poderosa para crescimento sem novos pacientes.",
  meta:        "Meta de faturamento declarada pelo cliente. Indica ambição e alinhamento com crescimento.",
  produto:     "Produto AXIS recomendado com base no faturamento atual e perfil do negócio.",
  cpl:         "Custo por Lead — quanto custa gerar um contato qualificado. Benchmarck saudável: < 25% do ticket médio.",
  cvr_aval:    "Taxa de conversão de Lead em Avaliação presencial. Acima de 50% é saudável. Abaixo indica problema no script ou tempo de resposta.",
  cvr_proc:    "Taxa de conversão de Avaliação em Procedimento fechado. Acima de 70% indica equipe comercial e protocolo de vendas eficientes.",
};

// ─── COMPONENTES BASE ──────────────────────────────────────────────────
function Bar({ pct, color, height=8 }) {
  return (
    <div style={{height,background:"#EEE",borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:10,transition:"width 0.8s ease"}}/>
    </div>
  );
}

function Ring({ v, max, color, size=60 }) {
  const pct = max===0 ? 0 : Math.round(v/max*100);
  const r = size/2-6, circ = 2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EEE" strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={circ-(circ*pct/100)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.8s ease"}}/>
      </svg>
      <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size/4,fontWeight:700,color}}>{pct}%</span>
    </div>
  );
}

function Tip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      <Info size={11} color={T3} style={{marginLeft:4,cursor:"help",flexShrink:0}}/>
      {show && (
        <span style={{
          position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",
          background:"#1A1A1A",color:"#fff",fontSize:11,lineHeight:1.5,padding:"8px 12px",
          borderRadius:8,whiteSpace:"normal",width:220,zIndex:999,
          boxShadow:"0 4px 20px rgba(0,0,0,0.25)",pointerEvents:"none",
        }}>
          {text}
          <span style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",
            borderLeft:"5px solid transparent",borderRight:"5px solid transparent",
            borderTop:"5px solid #1A1A1A"}}/>
        </span>
      )}
    </span>
  );
}

const AREAS = [
  {k:"comercial",  label:"Comercial",   tipKey:"comercial",  Icon:Target,   color:"#E91E63"},
  {k:"marketing",  label:"Marketing",   tipKey:"marketing",  Icon:Megaphone,color:B},
  {k:"operacional",label:"Operacional", tipKey:"operacional",Icon:Settings2,color:Y},
  {k:"financeiro", label:"Financeiro",  tipKey:"financeiro", Icon:BarChart3, color:G},
];

const ALL_FIELDS = {
  clinica: ["nome","nome_clinica","cidade_estado","whatsapp","equipe","dias_atendimento","capacidade","tempo_clinica","hof_foco"],
  fat:     ["fat_atual","maior_fat","meta","margem","fat_tendencia","investimento_mkt","sazonalidade"],
  serv:    ["procedimentos","carro_chefe","ticket","pagamento"],
  com:     ["quem_resp","tempo_resp","max_leads","conv_aval","conv_proc","follow_up","crm","reativacao","motivo_perda"],
  mkt:     ["instagram","origem","trafego","site","conteudo","freq_posts","landing_page","pixel_meta","gmn"],
  visao:   ["pac_desejados","vol_ticket","expect_90d","exp_ruim","algo_mais"],
};
const SEC_LABELS = {
  clinica:"🏥 Clínica", fat:"📊 Faturamento", serv:"💎 Serviços",
  com:"🎯 Comercial", mkt:"📱 Marketing", visao:"🚀 Visão"
};
const FIELD_LABELS = {
  nome:"Nome",nome_clinica:"Clínica",cidade_estado:"Cidade",whatsapp:"WhatsApp",
  equipe:"Equipe",dias_atendimento:"Dias/semana",capacidade:"Capacidade/semana",
  tempo_clinica:"Tempo de operação",hof_foco:"Foco HOF",
  fat_atual:"Fat. atual",maior_fat:"Maior fat.",meta:"Meta",margem:"Margem",
  fat_tendencia:"Tendência",investimento_mkt:"Invest. marketing",sazonalidade:"Sazonalidade",
  procedimentos:"Procedimentos",carro_chefe:"Carro-chefe",ticket:"Ticket médio",pagamento:"Pagamento",
  quem_resp:"Quem responde",tempo_resp:"Tempo resposta",max_leads:"Max leads/mês",
  conv_aval:"Conv. lead→aval",conv_proc:"Conv. aval→proc",follow_up:"Follow-up",
  crm:"CRM",reativacao:"Reativação",motivo_perda:"Principal perda",
  instagram:"Instagram",origem:"Origem pacientes",trafego:"Tráfego pago",
  site:"Site",conteudo:"Conteúdo",freq_posts:"Freq. posts",
  landing_page:"Landing page",pixel_meta:"Pixel Meta",gmn:"Google Meu Negócio",
  pac_desejados:"Pacientes/mês desejados",vol_ticket:"Volume vs ticket",
  expect_90d:"Expectativa 90 dias",exp_ruim:"Exp. anterior",algo_mais:"Observações",
};

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────
export default function ClientePage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id;
  const printRef = useRef(null);

  const [cliente,    setCliente]    = useState(null);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [diagIdx,    setDiagIdx]    = useState(0); // índice do diagnóstico selecionado
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [tab,        setTab]        = useState("visao");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [editFields, setEditFields] = useState({});
  const [saving,     setSaving]     = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfMode,    setPdfMode]    = useState(false);

  // data = dados do diagnóstico selecionado (shortcut)
  const data = diagnosticos[diagIdx]?.data || null;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        // Buscar cliente
        const { data: cRow, error: cErr } = await supabase
          .from("clientes").select("*").eq("id", id).single();
        if (cErr || !cRow) { setError("Cliente não encontrado."); setLoading(false); return; }
        setCliente(cRow);
        setEditFields({
          plano_contratado:   cRow.meta?.plano_contratado   || "",
          plano_recomendado:  cRow.meta?.plano_recomendado  || "",
          meta_interna:       cRow.meta?.meta_interna       || "",
          notas_estrategicas: cRow.meta?.notas_estrategicas || "",
          proxima_sessao:     cRow.meta?.proxima_sessao     || "",
        });
        // Buscar todos os diagnósticos (mais recente primeiro)
        const { data: diags, error: dErr } = await supabase
          .from("diagnosticos").select("*").eq("cliente_id", id)
          .order("created_at", { ascending: false });
        if (!dErr && diags) setDiagnosticos(diags);
      } catch { setError("Erro ao carregar dados."); }
      setLoading(false);
    })();
  }, [id]);

  const analysis = useMemo(() => data ? analyze(data)    : null, [data]);
  const icp      = useMemo(() => data ? analyzeICP(data) : null, [data]);
  const diag     = useMemo(() => (data && icp) ? buildDiagnostico(data, icp.produto, icp.plano) : null, [data, icp]);
  const cmo      = useMemo(() => (data && analysis && icp) ? buildCMOAnalysis(data, analysis.scores, icp.produto, icp.plano) : null, [data, analysis, icp]);

  // ── HANDLERS ──────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    await supabase.from("clientes").delete().eq("id", id); // CASCADE deleta diagnosticos
    router.push("/dashboard");
  }

  async function handleSaveEdit() {
    setSaving(true);
    const newMeta = { ...cliente.meta, ...editFields };
    await supabase.from("clientes").update({ meta: newMeta }).eq("id", id);
    setCliente(prev => ({ ...prev, meta: newMeta }));
    setSaving(false);
    setShowEdit(false);
  }

  async function handlePDF() {
    setPdfLoading(true);
    setPdfMode(true);
    // Aguarda o DOM renderizar todas as abas
    await new Promise(r => setTimeout(r, 500));
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const el = printRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#F4F5F7" });
      const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const imgW = W;
      const imgH = (canvas.height * imgW) / canvas.width;
      let pos = 0;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, imgW, imgH);
      while (pos + imgH > H) {
        pos -= H;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, imgW, imgH);
      }
      pdf.save(`diagnostico-${(cliente.nome_clinica||"cliente").replace(/\s/g,"-").toLowerCase()}.pdf`);
    } finally {
      setPdfMode(false);
      setPdfLoading(false);
    }
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${OB}`,borderTopColor:O,animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
        <p style={{color:T3,fontSize:13}}>Carregando dados do cliente...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || (!loading && !cliente)) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <AlertCircle size={40} color={R} style={{marginBottom:16}}/>
        <p style={{color:T,fontSize:16,fontWeight:700}}>{error || "Cliente não encontrado"}</p>
        <button onClick={()=>router.push("/dashboard")} style={{marginTop:16,padding:"10px 20px",background:O,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600}}>
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${OB}`,borderTopColor:O,animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
        <p style={{color:T3,fontSize:13}}>Carregando diagnóstico...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { scores, maxS, saude } = analysis;
  const saudeCor = nivelFn(saude).color;
  const diagAtual = diagnosticos[diagIdx];
  const dt = diagAtual?.created_at ? new Date(diagAtual.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}) : "—";
  const pac = getPacRecomendacoes(icp.produto, icp.plano, data);

  const TABS = [
    { id:"visao",      label:"Visão Geral" },
    { id:"icp",        label:"ICP & Produto" },
    { id:"diagnostico",label:"Diagnóstico CMO" },
    { id:"dados",      label:"Dados Completos" },
  ];
  const tabBtn = (t) => ({
    padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer",
    fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all 0.2s",
    background: tab===t.id ? O : "transparent",
    color:      tab===t.id ? "#fff" : T2,
  });

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{height:3,background:`linear-gradient(90deg,${O},#FF7043,#FF9800)`}}/>

      {/* TOPBAR */}
      <div style={{background:C,borderBottom:`1px solid ${BD}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>router.push("/dashboard")}
          style={{background:"none",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",color:T2,padding:"6px 10px",borderRadius:8,display:"flex",alignItems:"center",gap:6,fontFamily:"inherit"}}
          onMouseEnter={e=>e.currentTarget.style.color=O} onMouseLeave={e=>e.currentTarget.style.color=T2}>
          <ArrowLeft size={15}/> Dashboard
        </button>
        <span style={{fontWeight:900,fontSize:16,letterSpacing:1}}>
          <span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span>
          <span style={{color:T3,fontSize:10,fontWeight:700,letterSpacing:2,marginLeft:6}}>360</span>
        </span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:T3,marginRight:4}}>{dt}</span>
          <button onClick={handlePDF} disabled={pdfLoading}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",border:`1px solid ${BD}`,borderRadius:8,background:C,cursor:"pointer",fontSize:12,fontWeight:600,color:T2,fontFamily:"inherit",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=B;e.currentTarget.style.color=B;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.color=T2;}}>
            {pdfLoading ? <div style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${BL}`,borderTopColor:B,animation:"spin 0.8s linear infinite"}}/> : <Download size={13}/>}
            PDF
          </button>
          <button onClick={()=>setShowEdit(true)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",border:`1px solid ${BD}`,borderRadius:8,background:C,cursor:"pointer",fontSize:12,fontWeight:600,color:T2,fontFamily:"inherit",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=O;e.currentTarget.style.color=O;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.color=T2;}}>
            <Edit3 size={13}/> Editar
          </button>
          <button onClick={()=>setShowDelete(true)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",border:`1px solid ${RL}`,borderRadius:8,background:C,cursor:"pointer",fontSize:12,fontWeight:600,color:R,fontFamily:"inherit",transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.background=RL}
            onMouseLeave={e=>e.currentTarget.style.background=C}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINTÁVEL */}
      <div ref={printRef} style={{maxWidth:960,margin:"0 auto",padding:"28px 24px 80px"}}>

        {/* HERO CARD */}
        <div style={{background:C,borderRadius:20,padding:"28px 32px",marginBottom:20,border:`1px solid ${BD}`,boxShadow:"0 2px 16px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T3,marginBottom:6,textTransform:"uppercase"}}>Prontuário do Cliente</div>
              <div style={{fontSize:28,fontWeight:900,color:T,marginBottom:8,letterSpacing:-0.5}}>{cliente.nome_clinica||"Clínica"}</div>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",marginBottom:10}}>
                {cliente.responsavel  && <span style={{fontSize:13,color:T2,display:"flex",alignItems:"center",gap:5}}><Users size={13} color={T3}/>{cliente.responsavel}</span>}
                {cliente.cidade       && <span style={{fontSize:13,color:T2,display:"flex",alignItems:"center",gap:5}}><MapPin size={13} color={T3}/>{cliente.cidade}</span>}
                {cliente.whatsapp     && <span style={{fontSize:13,color:T2,display:"flex",alignItems:"center",gap:5}}><Phone size={13} color={T3}/>{cliente.whatsapp}</span>}
              </div>
              {/* Campos estratégicos */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {cliente.meta?.plano_contratado && (
                  <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:OL,color:O}}>
                    Contratado: {cliente.meta.plano_contratado}
                  </span>
                )}
                {cliente.meta?.proxima_sessao && (
                  <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:BL,color:B}}>
                    Próxima sessão: {cliente.meta.proxima_sessao}
                  </span>
                )}
              </div>
              {cliente.meta?.notas_estrategicas && (
                <div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:"#FFFBF0",border:"1px solid #FFE082",fontSize:12,color:"#8D6E00",lineHeight:1.6}}>
                  <b>Notas:</b> {cliente.meta.notas_estrategicas}
                </div>
              )}
              {/* Seletor de histórico de diagnósticos */}
              {diagnosticos.length > 1 && (
                <div style={{marginTop:14,padding:"12px 14px",borderRadius:12,background:BG,border:`1px solid ${BD}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:T3,letterSpacing:1,marginBottom:8}}>HISTÓRICO DE DIAGNÓSTICOS ({diagnosticos.length})</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {diagnosticos.map((d,i) => (
                      <button key={d.id} onClick={()=>setDiagIdx(i)}
                        style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${i===diagIdx?O:BD}`,background:i===diagIdx?OL:C,color:i===diagIdx?O:T2,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                        {d.periodo==="inicial"?"Diagnóstico Inicial":d.periodo} · {new Date(d.created_at).toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}
                        {i===0&&<span style={{marginLeft:4,fontSize:9,background:O,color:"#fff",borderRadius:4,padding:"1px 5px"}}>Atual</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:20,alignItems:"center"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:T3,marginBottom:6,letterSpacing:0.8,fontWeight:600}}>
                  <Tip text={METRIC_TIPS.saude}>SAÚDE</Tip>
                </div>
                <Ring v={Object.values(scores).reduce((a,b)=>a+b,0)} max={Object.values(maxS).reduce((a,b)=>a+b,0)} color={saudeCor} size={76}/>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:T3,marginBottom:6,letterSpacing:0.8,fontWeight:600}}>
                  <Tip text={METRIC_TIPS.icp}>ICP SCORE</Tip>
                </div>
                <Ring v={icp.icpPct} max={100} color={icp.prodCor} size={76}/>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:20}}>
            {[
              {tipKey:"fat_atual", label:"Fat. Atual",   val:data.fat_atual||"—", color:G, Icon:TrendingUp},
              {tipKey:"ticket",    label:"Ticket Médio", val:data.ticket||"—",    color:B, Icon:DollarSign},
              {tipKey:"meta",      label:"Meta",         val:data.meta||"—",      color:O, Icon:Target},
              {tipKey:"produto",   label:"Produto AXIS", val:`${icp.produto}${icp.plano?` ${icp.plano}`:""}`, color:icp.prodCor, Icon:BadgeCheck},
            ].map(({Icon,tipKey,...st})=>(
              <div key={st.label} style={{padding:"14px 16px",borderRadius:12,background:BG,border:`1px solid ${BD}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <Icon size={13} color={st.color} strokeWidth={1.8}/>
                  <span style={{fontSize:11,color:T3}}><Tip text={METRIC_TIPS[tipKey]}>{st.label}</Tip></span>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:st.color}}>{st.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        {!pdfMode && (
          <div style={{display:"flex",gap:3,marginBottom:16,background:C,borderRadius:12,padding:4,border:`1px solid ${BD}`,width:"fit-content",flexWrap:"wrap"}}>
            {TABS.map(t => <button key={t.id} onClick={()=>setTab(t.id)} style={tabBtn(t)}>{t.label}</button>)}
          </div>
        )}

        {/* ── TAB: VISÃO GERAL ─────────────────────────────────────── */}
        {(tab==="visao" || pdfMode) && (
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn 0.3s ease"}}>
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>SCORES POR ÁREA</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {AREAS.map(({Icon,tipKey,...ar})=>{
                  const pct = Math.round(scores[ar.k]/maxS[ar.k]*100);
                  const nv  = nivelFn(pct);
                  return (
                    <div key={ar.k}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                        <span style={{fontSize:13,fontWeight:600,color:T,display:"flex",alignItems:"center",gap:7}}>
                          <Icon size={14} color={ar.color} strokeWidth={1.8}/>
                          <Tip text={METRIC_TIPS[tipKey]}>{ar.label}</Tip>
                        </span>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:nv.bg,color:nv.color}}>{nv.label}</span>
                          <span style={{fontSize:14,fontWeight:800,color:ar.color,minWidth:36,textAlign:"right"}}>{pct}%</span>
                        </div>
                      </div>
                      <Bar pct={pct} color={ar.color} height={7}/>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>RESUMO OPERACIONAL — EQUIPE DE ENTREGA</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  {tipKey:"cvr_aval",   label:"Conv. lead → avaliação", val:data.conv_aval||"—"},
                  {tipKey:"cvr_proc",   label:"Conv. avaliação → proc.", val:data.conv_proc||"—"},
                  {label:"Tempo resposta ao lead",  val:data.tempo_resp||"—"},
                  {label:"CRM utilizado",            val:data.crm||"—"},
                  {label:"Faz follow-up?",           val:data.follow_up||"—"},
                  {label:"Reativação de base",       val:data.reativacao||"—"},
                  {label:"Tráfego pago",             val:data.trafego||"—"},
                  {label:"Landing page",             val:data.landing_page||"—"},
                  {label:"Pixel Meta",               val:data.pixel_meta||"—"},
                  {label:"Google Meu Negócio",       val:data.gmn||"—"},
                ].map((it,i) => (
                  <div key={i} style={{padding:"11px 14px",borderRadius:10,background:BG,border:`1px solid ${BD}`}}>
                    <div style={{fontSize:10,color:T3,marginBottom:3}}>
                      {it.tipKey ? <Tip text={METRIC_TIPS[it.tipKey]}>{it.label}</Tip> : it.label}
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T,lineHeight:1.4}}>{it.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: ICP & PRODUTO ───────────────────────────────────── */}
        {(tab==="icp" || pdfMode) && (
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn 0.3s ease"}}>
          {pdfMode && <div style={{padding:"10px 0 6px",borderTop:`2px solid ${OB}`,marginTop:8}}><span style={{fontSize:11,fontWeight:800,letterSpacing:2,color:O}}>ICP &amp; PRODUTO</span></div>}
            <div style={{background:C,borderRadius:20,padding:28,border:`1.5px solid ${icp.prodCor}33`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap",marginBottom:24}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T3,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                    <Sparkles size={12} color={icp.prodCor}/>ICP SCORE · AXIS CLINIC BRASIL
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <span style={{fontSize:52,fontWeight:900,color:icp.prodCor,lineHeight:1}}>{icp.icpPct}%</span>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:T}}>{icp.produto}{icp.plano?` — ${icp.plano}`:""}</div>
                      <div style={{fontSize:13,color:T2,marginTop:4,maxWidth:340,lineHeight:1.5}}>{icp.prodDesc}</div>
                    </div>
                  </div>
                </div>
                <Ring v={icp.icpPct} max={100} color={icp.prodCor} size={100}/>
              </div>
              <Bar pct={icp.icpPct} color={icp.prodCor} height={10}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:20}}>
                {[
                  {label:"Implementação", range:"R$15k–50k", color:O, active:icp.produto==="Implementação"},
                  {label:"Starter",       range:"R$50k–80k", color:G, active:icp.produto==="Assessoria"&&icp.plano==="Starter"},
                  {label:"Scale",         range:"R$80k+",    color:B, active:icp.produto==="Assessoria"&&icp.plano==="Scale"},
                ].map(p => (
                  <div key={p.label} style={{padding:"12px",borderRadius:10,textAlign:"center",border:`1.5px solid ${p.active?p.color:BD}`,background:p.active?`${p.color}10`:BG}}>
                    <div style={{fontSize:12,fontWeight:700,color:p.active?p.color:T3,marginBottom:2}}>{p.label}</div>
                    <div style={{fontSize:10,color:T3}}>{p.range}</div>
                    {p.active && <div style={{fontSize:10,fontWeight:700,color:p.color,marginTop:4}}>← Este cliente</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:14}}>CRITÉRIOS AVALIADOS</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {icp.criterios.map((cr,i) => {
                  const bg   = cr.ok===true ? GL : cr.ok==="parcial" ? YL : RL;
                  const clr  = cr.ok===true ? G  : cr.ok==="parcial" ? Y  : R;
                  const Icon = cr.ok===true ? CheckCircle2 : cr.ok==="parcial" ? AlertCircle : XCircle;
                  return (
                    <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 14px",borderRadius:10,background:bg}}>
                      <Icon size={15} color={clr} strokeWidth={2} style={{flexShrink:0}}/>
                      <span style={{fontSize:13,color:T,lineHeight:1.4}}>{cr.txt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Axis Educacional */}
            <div style={{background:"linear-gradient(135deg,#1A1A2E,#0F3460)",borderRadius:20,padding:28}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:OB,marginBottom:16,display:"flex",alignItems:"center",gap:6}}>
                <Zap size={12} color={O}/>RECOMENDAÇÃO DE ENTREGA — AXIS EDUCACIONAL
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {pac.map((item,i) => (
                  <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.08)"}}>
                    <div style={{fontSize:10,fontWeight:700,color:OB,marginBottom:5,letterSpacing:0.5}}>{item.tag}</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>{item.acao}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: DIAGNÓSTICO CMO ─────────────────────────────────── */}
        {(tab==="diagnostico" || pdfMode) && diag && cmo && (
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn 0.3s ease"}}>
          {pdfMode && <div style={{padding:"10px 0 6px",borderTop:`2px solid ${OB}`,marginTop:8}}><span style={{fontSize:11,fontWeight:800,letterSpacing:2,color:O}}>DIAGNÓSTICO CMO</span></div>}

            {/* CMO AGENT HEADER */}
            <div style={{background:"linear-gradient(135deg,#0A0A1A,#1A1A3E)",borderRadius:20,padding:28,border:"1px solid rgba(255,69,0,0.2)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#FF4500,#FF7043)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Brain size={22} color="#fff"/>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.4)",marginBottom:3}}>AXIS CMO AGENT · ANÁLISE ESTRATÉGICA</div>
                  <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{data.nome_clinica||"Cliente"}</div>
                </div>
                <div style={{marginLeft:"auto",padding:"6px 14px",borderRadius:20,background:`${cmo.cor_situacao}22`,border:`1px solid ${cmo.cor_situacao}44`}}>
                  <span style={{fontSize:12,fontWeight:700,color:cmo.cor_situacao}}>{cmo.situacao}</span>
                </div>
              </div>

              <div style={{fontSize:14,color:"rgba(255,255,255,0.8)",lineHeight:1.8,marginBottom:20,borderLeft:"3px solid #FF4500",paddingLeft:16}}>
                {cmo.situacaoDesc}
              </div>

              {/* Posicionamento */}
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:"16px 20px",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"rgba(255,255,255,0.4)",marginBottom:10}}>POSICIONAMENTO DE MERCADO ATUAL</div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,
                    background: cmo.posicionamento.nivel==="Premium" ? "#00C85322" : cmo.posicionamento.nivel==="Intermediário" ? "#FF980022" : "#E5393522",
                    color: cmo.posicionamento.nivel==="Premium" ? G : cmo.posicionamento.nivel==="Intermediário" ? Y : R,
                    border: `1px solid ${cmo.posicionamento.nivel==="Premium" ? G+"44" : cmo.posicionamento.nivel==="Intermediário" ? Y+"44" : R+"44"}`
                  }}>{cmo.posicionamento.nivel}</span>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.75)"}}>{cmo.posicionamento.desc}</span>
                </div>
                <div style={{fontSize:12,color:OB,fontStyle:"italic"}}>{cmo.posicionamento.acao}</div>
              </div>
            </div>

            {/* VISÃO ESTRATÉGICA */}
            <div style={{background:C,borderRadius:20,padding:28,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16,display:"flex",alignItems:"center",gap:6}}>
                <Lightbulb size={13} color={O}/>VISÃO ESTRATÉGICA DO CMO
              </div>
              {cmo.visao.split("\n\n").map((p,i) => (
                <p key={i} style={{fontSize:14,color:T,lineHeight:1.8,marginBottom:i < cmo.visao.split("\n\n").length-1 ? 14 : 0}}>{p}</p>
              ))}
            </div>

            {/* SWOT SIMPLIFICADO */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {titulo:"Pontos Fortes",   items:cmo.pontos_fortes,  cor:G,  bg:GL,  Icon:CheckCircle2,  label:"FORÇA"},
                {titulo:"Pontos Fracos",   items:cmo.pontos_fracos,  cor:R,  bg:RL,  Icon:XCircle,       label:"FRAQUEZA"},
                {titulo:"Oportunidades",   items:cmo.oportunidades,  cor:B,  bg:BL,  Icon:TrendingUp,    label:"OPORTUNIDADE"},
                {titulo:"Riscos",          items:cmo.riscos,         cor:Y,  bg:YL,  Icon:AlertTriangle, label:"RISCO"},
              ].map(sec => (
                <div key={sec.titulo} style={{background:C,borderRadius:16,padding:20,border:`1.5px solid ${sec.cor}22`}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:sec.cor,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                    <sec.Icon size={12} color={sec.cor}/>{sec.label}S
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {sec.items.slice(0,4).map((item,i) => (
                      <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                        <div style={{width:5,height:5,borderRadius:"50%",background:sec.cor,marginTop:6,flexShrink:0}}/>
                        <span style={{fontSize:12,color:T2,lineHeight:1.6}}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ALAVANCAS DE CRESCIMENTO */}
            <div style={{background:C,borderRadius:20,padding:28,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                <Zap size={13} color={O}/>ALAVANCAS DE CRESCIMENTO
              </div>
              <div style={{fontSize:12,color:T3,marginBottom:18}}>As 3 ações com maior impacto no faturamento no menor prazo possível.</div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {cmo.alavancas.map((al,i) => (
                  <div key={i} style={{borderRadius:14,border:`1px solid ${BD}`,overflow:"hidden"}}>
                    <div style={{padding:"12px 18px",background:`linear-gradient(90deg,${O}12,${C})`,borderBottom:`1px solid ${BD}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:800,color:T}}>{al.titulo}</span>
                      <span style={{fontSize:11,fontWeight:700,color:G,background:GL,padding:"2px 10px",borderRadius:20}}>{al.potencial}</span>
                    </div>
                    <div style={{padding:"12px 18px",display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"end"}}>
                      <div style={{fontSize:12,color:T2,lineHeight:1.6}}>{al.como}</div>
                      <div style={{fontSize:10,fontWeight:700,color:T3,whiteSpace:"nowrap",background:BG,padding:"4px 10px",borderRadius:8}}>{al.prazo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* META SMART */}
            {diag.metaSmart.meta90 !== null && (
              <div style={{background:C,borderRadius:20,padding:28,border:`1px solid ${BD}`}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:18,display:"flex",alignItems:"center",gap:6}}>
                  <Target size={12} color={O}/>META SMART — ESCOPO DE PLANEJAMENTO
                </div>
                <div style={{fontSize:12,color:T3,marginBottom:16}}>Metas de referência para planejamento e acompanhamento. O prazo do contrato (6 ou 12 meses) é definido separadamente.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {label:"Referência 90 dias", val:fmtR(diag.metaSmart.meta90),  desc:diag.metaSmart.meta90desc,  cor:O, badge:"Curto Prazo"},
                    {label:"Referência 180 dias",val:fmtR(diag.metaSmart.meta180), desc:diag.metaSmart.meta180desc, cor:B, badge:"Médio Prazo"},
                  ].map(m => (
                    <div key={m.label} style={{borderRadius:16,padding:"22px 24px",background:`linear-gradient(135deg,${m.cor}15,${m.cor}05)`,border:`1.5px solid ${m.cor}33`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <span style={{fontSize:10,fontWeight:700,color:m.cor,letterSpacing:1}}>{m.label.toUpperCase()}</span>
                        <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${m.cor}22`,color:m.cor}}>{m.badge}</span>
                      </div>
                      <div style={{fontSize:32,fontWeight:900,color:m.cor,letterSpacing:-1,marginBottom:10}}>{m.val}</div>
                      <div style={{fontSize:12,color:T2,lineHeight:1.6}}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {diag.metaSmart.meta45 !== null && (
              <div style={{background:C,borderRadius:20,padding:28,border:`1px solid ${BD}`}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                  <Target size={12} color={O}/>META GPS — VITÓRIA DOS 45 DIAS
                </div>
                <div style={{borderRadius:16,padding:"22px 24px",background:`linear-gradient(135deg,${O}15,${O}05)`,border:`1.5px solid ${O}33`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:10,fontWeight:700,color:O,letterSpacing:1}}>META FATURAMENTO — FIM DO SPRINT</span>
                    <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${O}22`,color:O}}>45 dias</span>
                  </div>
                  <div style={{fontSize:36,fontWeight:900,color:O,letterSpacing:-1,marginBottom:10}}>{fmtR(diag.metaSmart.meta45)}</div>
                  <div style={{fontSize:13,color:T2,lineHeight:1.6}}>{diag.metaSmart.meta45desc}</div>
                </div>
              </div>
            )}

            {/* AXIS PROTOCOL ENGINEERING */}
            <div style={{background:C,borderRadius:20,padding:28,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                <Sparkles size={12} color={O}/>AXIS PROTOCOL ENGINEERING
              </div>
              <div style={{fontSize:12,color:T3,marginBottom:18}}>Transforme procedimentos avulsos em protocolos nomeados de transformação — 3× o ticket médio atual.</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {diag.protocolos.map((p,i) => (
                  <div key={i} style={{borderRadius:16,border:`1px solid ${BD}`,overflow:"hidden"}}>
                    <div style={{padding:"16px 20px",background:`linear-gradient(90deg,${OL},${C})`,borderBottom:`1px solid ${BD}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                      <span style={{fontSize:14,fontWeight:800,color:T}}>{p.nome}</span>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <span style={{fontSize:11,color:T3}}>Avulso: <b style={{color:T}}>{p.ticket_avulso}</b></span>
                        <ChevronRight size={14} color={OB}/>
                        <span style={{fontSize:13,fontWeight:800,color:O}}>Protocolo: {p.ticket_protocolo}</span>
                      </div>
                    </div>
                    <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{fontSize:12,color:T2}}><b style={{color:T3,fontSize:11}}>BASE: </b>{p.base}</div>
                      <div style={{fontSize:12,color:T2}}><b style={{color:T3,fontSize:11}}>NARRATIVA: </b>{p.narrativa}</div>
                      <div style={{fontSize:12,color:O,fontStyle:"italic",borderLeft:`3px solid ${OB}`,paddingLeft:12}}>{p.comunicacao}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PLANO DE EXECUÇÃO */}
            <div style={{background:C,borderRadius:20,padding:28,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                <Zap size={12} color={O}/>PLANO DE EXECUÇÃO — {icp.produto==="Implementação"?"AXIS GPS · 45 DIAS":icp.plano==="Starter"?"ASSESSORIA STARTER · 90 DIAS":"ASSESSORIA SCALE · 180 DIAS"}
              </div>
              <div style={{fontSize:12,color:T3,marginBottom:20}}>
                {icp.produto==="Implementação"
                  ? "4 encontros estratégicos · entrega produtizada · sprint de 45 dias"
                  : icp.plano==="Starter"
                  ? "3 fases de evolução · crescimento consistente · referência de 90 dias"
                  : "3 fases de escala · multi-canal · referência de 180 dias"}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {diag.planoExecucao.map((fase,i) => (
                  <div key={i} style={{borderRadius:14,border:`1px solid ${BD}`,overflow:"hidden"}}>
                    <div style={{padding:"12px 18px",background:fase.cor,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.7)",letterSpacing:1}}>{fase.fase}</div>
                        <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{fase.titulo}</div>
                      </div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.85)",maxWidth:280,textAlign:"right"}}>{fase.objetivo}</div>
                    </div>
                    <div style={{padding:"14px 18px"}}>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {fase.acoes.map((acao,j) => (
                          <div key={j} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:fase.cor,marginTop:5,flexShrink:0}}/>
                            <span style={{fontSize:13,color:T,lineHeight:1.6}}>{acao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRIORIDADES DA EQUIPE */}
            <div style={{background:"linear-gradient(135deg,#1A1A2E,#0F3460)",borderRadius:20,padding:28}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:OB,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                <Shield size={12} color={O}/>PRIORIDADES DA EQUIPE DE ENTREGA
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:18}}>Ações ordenadas por urgência — executar nesta sequência para máximo impacto.</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {diag.prioridades.map((p,i) => (
                  <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.08)",display:"flex",gap:14,alignItems:"flex-start"}}>
                    <div style={{flexShrink:0}}>
                      <div style={{width:28,height:28,borderRadius:8,background:p.cor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{i+1}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                        <span style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20,background:`${p.cor}33`,color:p.cor,letterSpacing:0.5}}>{p.nivel}</span>
                        <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)"}}>{p.area}</span>
                      </div>
                      <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>{p.acao}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB: DADOS COMPLETOS ─────────────────────────────────── */}
        {(tab==="dados" || pdfMode) && (
          <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fadeIn 0.3s ease"}}>
          {pdfMode && <div style={{padding:"10px 0 6px",borderTop:`2px solid ${OB}`,marginTop:8}}><span style={{fontSize:11,fontWeight:800,letterSpacing:2,color:O}}>DADOS COMPLETOS</span></div>}
            {Object.entries(ALL_FIELDS).map(([sec,fields]) => {
              const filled = fields.filter(f => data[f] && String(data[f]).trim() !== "");
              if (!filled.length) return null;
              return (
                <div key={sec} style={{background:C,borderRadius:16,padding:24,border:`1px solid ${BD}`}}>
                  <div style={{fontSize:13,fontWeight:700,color:O,marginBottom:14}}>{SEC_LABELS[sec]||sec}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {filled.map(f => (
                      <div key={f} style={{display:"flex",gap:12,paddingBottom:8,borderBottom:`1px solid ${BG}`}}>
                        <div style={{fontSize:11,color:T3,width:180,flexShrink:0,paddingTop:2}}>{FIELD_LABELS[f]||f}</div>
                        <div style={{fontSize:13,color:T,lineHeight:1.6,flex:1,whiteSpace:"pre-wrap"}}>{data[f]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: CONFIRMAR DELETE ───────────────────────────────── */}
      {showDelete && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:C,borderRadius:20,padding:32,maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:44,height:44,borderRadius:12,background:RL,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Trash2 size={20} color={R}/>
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:T}}>Remover cliente?</div>
                <div style={{fontSize:13,color:T3}}>Esta ação não pode ser desfeita.</div>
              </div>
            </div>
            <div style={{padding:"14px 16px",borderRadius:12,background:RL,marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:R}}>{cliente?.nome_clinica||"Cliente"}</div>
              <div style={{fontSize:12,color:R,opacity:0.8}}>Todos os diagnósticos do prontuário serão removidos permanentemente.</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowDelete(false)}
                style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${BD}`,background:C,cursor:"pointer",fontSize:13,fontWeight:600,color:T2,fontFamily:"inherit"}}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:R,cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {deleting ? <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/> : <Trash2 size={14}/>}
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR CAMPOS ESTRATÉGICOS ────────────────────── */}
      {showEdit && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:C,borderRadius:20,padding:32,maxWidth:520,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:10,background:OL,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Edit3 size={16} color={O}/>
                </div>
                <div style={{fontSize:16,fontWeight:800,color:T}}>Campos Estratégicos</div>
              </div>
              <button onClick={()=>setShowEdit(false)} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:T3}}>
                <X size={18}/>
              </button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {[
                {key:"plano_contratado",  label:"Plano Contratado",   placeholder:"Ex: Assessoria Starter — 6 meses", type:"text"},
                {key:"plano_recomendado", label:"Plano Recomendado",   placeholder:"Ex: Assessoria Scale",             type:"text"},
                {key:"meta_interna",      label:"Meta Interna (equipe)",placeholder:"Ex: R$80.000/mês em 6 meses",    type:"text"},
                {key:"proxima_sessao",    label:"Próxima Sessão",       placeholder:"Ex: 15/04/2026",                  type:"text"},
                {key:"notas_estrategicas",label:"Notas Estratégicas",   placeholder:"Observações internas da equipe...",type:"textarea"},
              ].map(f => (
                <div key={f.key}>
                  <label style={{fontSize:11,fontWeight:700,color:T2,letterSpacing:0.5,display:"block",marginBottom:6}}>{f.label.toUpperCase()}</label>
                  {f.type === "textarea" ? (
                    <textarea rows={3} value={editFields[f.key]||""} placeholder={f.placeholder}
                      onChange={e=>setEditFields(p=>({...p,[f.key]:e.target.value}))}
                      style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${BD}`,fontFamily:"inherit",fontSize:13,color:T,resize:"vertical",outline:"none",background:BG,boxSizing:"border-box"}}/>
                  ) : (
                    <input type="text" value={editFields[f.key]||""} placeholder={f.placeholder}
                      onChange={e=>setEditFields(p=>({...p,[f.key]:e.target.value}))}
                      style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${BD}`,fontFamily:"inherit",fontSize:13,color:T,outline:"none",background:BG,boxSizing:"border-box"}}/>
                  )}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginTop:24}}>
              <button onClick={()=>setShowEdit(false)}
                style={{flex:1,padding:"12px",borderRadius:10,border:`1px solid ${BD}`,background:C,cursor:"pointer",fontSize:13,fontWeight:600,color:T2,fontFamily:"inherit"}}>
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:O,cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {saving ? <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/> : <Save size={14}/>}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

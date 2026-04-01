"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft, CheckCircle2, AlertCircle, XCircle, Building2,
  BarChart3, Target, Megaphone, Settings2, Sparkles, Zap,
  Activity, TrendingUp, DollarSign, MapPin, Phone, Users,
  BadgeCheck, ChevronRight, Shield
} from "lucide-react";
import { analyze, analyzeICP, getPacRecomendacoes, nivelFn, fmtR, pm } from "@/lib/analysis";

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

function Bar({ pct, color, height=8 }) {
  return (
    <div style={{height,background:"#EEE",borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:10,transition:"width 0.8s ease"}}/>
    </div>
  );
}

function Ring({ v, max, color, size=60 }) {
  const pct = max===0 ? 0 : Math.round(v/max*100);
  const r = size/2-6, c = 2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EEE" strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={c} strokeDashoffset={c-(c*pct/100)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.8s ease"}}/>
      </svg>
      <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size/4,fontWeight:700,color}}>{pct}%</span>
    </div>
  );
}

const AREAS = [
  {k:"comercial",  label:"Comercial",   Icon:Target,   color:"#E91E63"},
  {k:"marketing",  label:"Marketing",   Icon:Megaphone,color:B},
  {k:"operacional",label:"Operacional", Icon:Settings2,color:Y},
  {k:"financeiro", label:"Financeiro",  Icon:BarChart3, color:G},
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
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState("visao");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: rows, error: err } = await supabase
          .from("mapeamentos")
          .select("data")
          .eq("id", id)
          .single();
        if (err || !rows) { setError("Cliente não encontrado."); }
        else { setData(rows.data); }
      } catch (e) {
        setError("Erro ao carregar dados.");
      }
      setLoading(false);
    })();
  }, [id]);

  const analysis = useMemo(() => data ? analyze(data)     : null, [data]);
  const icp      = useMemo(() => data ? analyzeICP(data)  : null, [data]);

  if (loading) return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid ${OB}`,borderTopColor:O,animation:"spin 0.8s linear infinite",margin:"0 auto 16px"}}/>
        <p style={{color:T3,fontSize:13}}>Carregando dados do cliente...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !data) return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:40}}>
        <AlertCircle size={40} color={R} style={{marginBottom:16}}/>
        <p style={{color:T,fontSize:16,fontWeight:700}}>{error || "Cliente não encontrado"}</p>
        <button onClick={()=>router.push("/dashboard")} style={{marginTop:16,padding:"10px 20px",background:O,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );

  const { scores, maxS, saude } = analysis;
  const saudeCor = nivelFn(saude).color;
  const dt = data._ts ? new Date(data._ts).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}) : "—";

  const TABS = [
    { id:"visao", label:"Visão Geral" },
    { id:"icp",   label:"ICP & Produto" },
    { id:"dados", label:"Dados Completos" },
  ];

  const tabBtn = (t) => ({
    padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer",
    fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all 0.2s",
    background: tab===t.id ? O : "transparent",
    color:      tab===t.id ? "#fff" : T2,
  });

  const pac = getPacRecomendacoes(icp.produto, icp.plano, data);

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit"}}>
      <div style={{height:3,background:`linear-gradient(90deg,${O},#FF7043,#FF9800)`}}/>

      {/* TOPBAR */}
      <div style={{background:C,borderBottom:`1px solid ${BD}`,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>router.push("/dashboard")}
          style={{background:"none",border:"none",fontSize:13,fontWeight:600,cursor:"pointer",color:T2,padding:"6px 10px",borderRadius:8,display:"flex",alignItems:"center",gap:6,fontFamily:"inherit"}}
          onMouseEnter={e=>e.currentTarget.style.color=O}
          onMouseLeave={e=>e.currentTarget.style.color=T2}>
          <ArrowLeft size={15}/> Dashboard
        </button>
        <span style={{fontWeight:900,fontSize:16,letterSpacing:1}}>
          <span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span>
          <span style={{color:T3,fontSize:10,fontWeight:700,letterSpacing:2,marginLeft:6}}>360</span>
        </span>
        <span style={{fontSize:12,color:T3}}>{dt}</span>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px 80px"}}>

        {/* HERO CARD */}
        <div style={{background:C,borderRadius:20,padding:"28px 32px",marginBottom:20,border:`1px solid ${BD}`,boxShadow:"0 2px 16px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T3,marginBottom:6,textTransform:"uppercase"}}>Cliente</div>
              <div style={{fontSize:28,fontWeight:900,color:T,marginBottom:6,letterSpacing:-0.5}}>{data.nome_clinica||"Clínica"}</div>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                {data.nome     && <span style={{fontSize:13,color:T2,display:"flex",alignItems:"center",gap:5}}><Users size={13} color={T3}/>{data.nome}</span>}
                {data.cidade_estado && <span style={{fontSize:13,color:T2,display:"flex",alignItems:"center",gap:5}}><MapPin size={13} color={T3}/>{data.cidade_estado}</span>}
                {data.whatsapp && <span style={{fontSize:13,color:T2,display:"flex",alignItems:"center",gap:5}}><Phone size={13} color={T3}/>{data.whatsapp}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:20,alignItems:"center"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:T3,marginBottom:6,letterSpacing:0.8,fontWeight:600}}>SAÚDE</div>
                <Ring v={Object.values(scores).reduce((a,b)=>a+b,0)} max={Object.values(maxS).reduce((a,b)=>a+b,0)} color={saudeCor} size={76}/>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:T3,marginBottom:6,letterSpacing:0.8,fontWeight:600}}>ICP SCORE</div>
                <Ring v={icp.icpPct} max={100} color={icp.prodCor} size={76}/>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:20}}>
            {[
              {label:"Fat. Atual",    val:data.fat_atual||"—", color:G,         Icon:TrendingUp},
              {label:"Ticket Médio",  val:data.ticket||"—",    color:B,         Icon:DollarSign},
              {label:"Meta 2026",     val:data.meta||"—",      color:O,         Icon:Target},
              {label:"Produto AXIS",  val:`${icp.produto}${icp.plano?` ${icp.plano}`:""}`, color:icp.prodCor, Icon:BadgeCheck},
            ].map(({Icon,...st})=>(
              <div key={st.label} style={{padding:"14px 16px",borderRadius:12,background:BG,border:`1px solid ${BD}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                  <Icon size={13} color={st.color} strokeWidth={1.8}/>
                  <span style={{fontSize:11,color:T3}}>{st.label}</span>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:st.color}}>{st.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:3,marginBottom:16,background:C,borderRadius:12,padding:4,border:`1px solid ${BD}`,width:"fit-content"}}>
          {TABS.map(t => <button key={t.id} onClick={()=>setTab(t.id)} style={tabBtn(t)}>{t.label}</button>)}
        </div>

        {/* ── TAB: VISÃO GERAL ─────────────────────────────────────── */}
        {tab==="visao" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>SCORES POR ÁREA</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {AREAS.map(({Icon,...ar})=>{
                  const pct = Math.round(scores[ar.k]/maxS[ar.k]*100);
                  const nv  = nivelFn(pct);
                  return (
                    <div key={ar.k}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                        <span style={{fontSize:13,fontWeight:600,color:T,display:"flex",alignItems:"center",gap:7}}>
                          <Icon size={14} color={ar.color} strokeWidth={1.8}/>{ar.label}
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

            {/* Resumo para equipe */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>RESUMO OPERACIONAL — EQUIPE DE ENTREGA</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  {label:"Tempo resposta ao lead",  val:data.tempo_resp||"—"},
                  {label:"Conv. lead → avaliação",   val:data.conv_aval||"—"},
                  {label:"Conv. avaliação → proc.",  val:data.conv_proc||"—"},
                  {label:"CRM utilizado",             val:data.crm||"—"},
                  {label:"Faz follow-up?",            val:data.follow_up||"—"},
                  {label:"Reativação de base",        val:data.reativacao||"—"},
                  {label:"Tráfego pago",              val:data.trafego||"—"},
                  {label:"Landing page",              val:data.landing_page||"—"},
                  {label:"Pixel Meta",                val:data.pixel_meta||"—"},
                  {label:"Google Meu Negócio",        val:data.gmn||"—"},
                ].map(it => (
                  <div key={it.label} style={{padding:"11px 14px",borderRadius:10,background:BG,border:`1px solid ${BD}`}}>
                    <div style={{fontSize:10,color:T3,marginBottom:3}}>{it.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:T,lineHeight:1.4}}>{it.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: ICP & PRODUTO ───────────────────────────────────── */}
        {tab==="icp" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* ICP Card */}
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

              {/* Escala de produtos */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:20}}>
                {[
                  {label:"Implementação", range:"R$15k–50k",  color:O,         active:icp.produto==="Implementação"},
                  {label:"Starter",       range:"R$50k–80k",  color:G,         active:icp.produto==="Assessoria"&&icp.plano==="Starter"},
                  {label:"Growth",        range:"R$80k–150k", color:B,         active:icp.produto==="Assessoria"&&icp.plano==="Growth"},
                  {label:"Pro",           range:"R$150k+",    color:"#9C27B0", active:icp.produto==="Assessoria"&&icp.plano==="Pro"},
                ].map(p => (
                  <div key={p.label} style={{padding:"12px",borderRadius:10,textAlign:"center",border:`1.5px solid ${p.active?p.color:BD}`,background:p.active?`${p.color}10`:BG}}>
                    <div style={{fontSize:12,fontWeight:700,color:p.active?p.color:T3,marginBottom:2}}>{p.label}</div>
                    <div style={{fontSize:10,color:T3}}>{p.range}</div>
                    {p.active && <div style={{fontSize:10,fontWeight:700,color:p.color,marginTop:4}}>← Este cliente</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Critérios */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:14}}>CRITÉRIOS AVALIADOS</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {icp.criterios.map((cr,i) => {
                  const bg  = cr.ok===true ? GL : cr.ok==="parcial" ? YL : RL;
                  const clr = cr.ok===true ? G  : cr.ok==="parcial" ? Y  : R;
                  const Icon= cr.ok===true ? CheckCircle2 : cr.ok==="parcial" ? AlertCircle : XCircle;
                  return (
                    <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 14px",borderRadius:10,background:bg}}>
                      <Icon size={15} color={clr} strokeWidth={2} style={{flexShrink:0}}/>
                      <span style={{fontSize:13,color:T,lineHeight:1.4}}>{cr.txt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PAC */}
            <div style={{background:"linear-gradient(135deg,#1A1A2E,#0F3460)",borderRadius:20,padding:28}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:OB,marginBottom:16,display:"flex",alignItems:"center",gap:6}}>
                <Zap size={12} color={O}/>RECOMENDAÇÃO DE ENTREGA — PAC
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

        {/* ── TAB: DADOS COMPLETOS ─────────────────────────────────── */}
        {tab==="dados" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
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
    </div>
  );
}

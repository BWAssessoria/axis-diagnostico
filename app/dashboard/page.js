"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TEAM_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "axis2026";

// ─── PALETA ────────────────────────────────────────────────────────────
const O="#FF4500", OL="#FFF4F0", OB="#FFD4C4";
const G="#00C853", GL="#E8F9EF";
const R="#E53935", RL="#FFEBEE";
const Y="#FF9800", YL="#FFF8E1";
const B="#2196F3", BL="#E3F2FD";
const T="#1A1A1A", T2="#6B6B6B", T3="#999";
const BD="#E8E8E8", BG="#F4F5F7", C="#FFFFFF", DK="#1A1A1A";

// ─── HELPERS ───────────────────────────────────────────────────────────
const pm = v => { if(!v) return 0; const n=String(v).replace(/[^\d.,]/g,"").replace(/\./g,"").replace(",","."); return parseFloat(n)||0; };
const fmtR = v => v>0 ? `R$ ${v.toLocaleString("pt-BR")}` : "—";
const nivelFn = pct => {
  if(pct>=80) return {label:"Excelente",color:G,bg:GL};
  if(pct>=60) return {label:"Bom",color:B,bg:BL};
  if(pct>=40) return {label:"Atenção",color:Y,bg:YL};
  return {label:"Crítico",color:R,bg:RL};
};

// ─── ENGINE DE SCORE (mesma lógica do page.js) ─────────────────────────
function analyze(a) {
  const sc={comercial:0,marketing:0,operacional:0,financeiro:0};
  const max={comercial:10,marketing:10,operacional:10,financeiro:10};

  const tr=a.tempo_resp||"";
  if(tr.includes("Menos de 5")) sc.comercial+=3;
  else if(tr.includes("5 a 30")) sc.comercial+=2;
  else if(tr.includes("30 min")) sc.comercial+=1;
  const ca=a.conv_aval||"";
  if(ca.includes("Mais de 8")) sc.comercial+=2; else if(ca.includes("7 a 8")) sc.comercial+=1.5; else if(ca.includes("5 a 6")) sc.comercial+=1; else if(ca.includes("3 a 4")) sc.comercial+=0.5;
  const cp=a.conv_proc||"";
  if(cp.includes("Mais de 8")) sc.comercial+=2; else if(cp.includes("7 a 8")) sc.comercial+=1.5; else if(cp.includes("5 a 6")) sc.comercial+=1; else if(cp.includes("3 a 4")) sc.comercial+=0.5;
  if((a.follow_up||"").includes("sempre")) sc.comercial+=1; else if((a.follow_up||"").includes("vezes")) sc.comercial+=0.5;
  if((a.crm||"").includes("CRM")) sc.comercial+=1; else if((a.crm||"").includes("Planilha")) sc.comercial+=0.7; else if((a.crm||"").includes("caderno")) sc.comercial+=0.3;
  if((a.reativacao||"").includes("regularmente")) sc.comercial+=1; else if((a.reativacao||"").includes("vez em quando")) sc.comercial+=0.5;

  if(a.trafego&&!a.trafego.toLowerCase().includes("não")&&a.trafego.trim().length>2) sc.marketing+=2;
  const freq=a.freq_posts||"";
  if(!(a.conteudo||"").includes("Ninguém")&&!(a.conteudo||"").includes("parado")) {
    if(freq.includes("5 ou mais")) sc.marketing+=2; else if(freq.includes("3 a 4")) sc.marketing+=1.5; else if(freq.includes("1 a 2")) sc.marketing+=1; else sc.marketing+=0.3;
  }
  const lp=a.landing_page||"";
  if(lp.includes("landing page")) sc.marketing+=2; else if(lp.includes("WhatsApp")) sc.marketing+=1; else if(lp.includes("Instagram")) sc.marketing+=0.5;
  if((a.pixel_meta||"").includes("ativo e configurado")) sc.marketing+=1; else if((a.pixel_meta||"").includes("não sei se está")) sc.marketing+=0.5;
  if(a.instagram&&a.instagram.length>5) sc.marketing+=1;
  if(a.gmn&&!a.gmn.toLowerCase().includes("não tenho")&&a.gmn.length>3) sc.marketing+=1;
  if((a.estrategia_conteudo||"").includes("calendário")) sc.marketing+=1; else if((a.estrategia_conteudo||"").includes("alguma lógica")) sc.marketing+=0.5;

  const cap=parseInt(a.capacidade)||0;
  if(cap>=20) sc.operacional+=3; else if(cap>=15) sc.operacional+=2; else if(cap>=8) sc.operacional+=1;
  const dias=parseInt(a.dias_atendimento)||0;
  if(dias>=5) sc.operacional+=2; else if(dias>=3) sc.operacional+=1;
  if(a.equipe&&a.equipe.length>80) sc.operacional+=2; else if(a.equipe&&a.equipe.length>40) sc.operacional+=1;
  if((a.autorizacao_pacientes||"").includes("termo")) sc.operacional+=2; else if((a.autorizacao_pacientes||"").includes("verbalmente")) sc.operacional+=1;
  if((a.disponibilidade_conteudo||"").includes("sem problema")) sc.operacional+=1; else if((a.disponibilidade_conteudo||"").includes("1 a 2")) sc.operacional+=0.5;

  const fatA=pm(a.fat_atual), tick=pm(a.ticket);
  if(fatA>=80000) sc.financeiro+=3; else if(fatA>=50000) sc.financeiro+=2.5; else if(fatA>=30000) sc.financeiro+=2; else if(fatA>=15000) sc.financeiro+=1;
  if(tick>=5000) sc.financeiro+=3; else if(tick>=3000) sc.financeiro+=2; else if(tick>=2000) sc.financeiro+=1.5; else if(tick>=1000) sc.financeiro+=1;
  if(a.margem&&!a.margem.toLowerCase().includes("não sei")) sc.financeiro+=1;
  const inv=a.investimento_mkt||"";
  if(inv.includes("Mais de 15")) sc.financeiro+=2; else if(inv.includes("7% e 15")) sc.financeiro+=1.5; else if(inv.includes("3% e 7")) sc.financeiro+=1; else if(inv.includes("Menos de 3")) sc.financeiro+=0.5;
  if((a.fat_tendencia||"").includes("Crescendo")) sc.financeiro+=1; else if((a.fat_tendencia||"").includes("Estável")) sc.financeiro+=0.5;

  Object.keys(sc).forEach(k=>{sc[k]=Math.min(Math.round(sc[k]*10)/10,max[k]);});
  const total=Object.values(sc).reduce((a,b)=>a+b,0);
  const maxT=Object.values(max).reduce((a,b)=>a+b,0);
  const saude=Math.round(total/maxT*100);
  return {scores:sc, maxS:max, saude};
}

// ─── ICP SCORING ───────────────────────────────────────────────────────
// ICP AXIS: Clínica HOF com faturamento ≥ R$30k, time estruturado, vontade de crescer
// Produto de Implementação: faturamento 15k–50k, precisa estruturar funil/processos
// Produto de Assessoria: faturamento ≥50k, já tem base, quer escalar
//   - Plano Starter: 50k–80k
//   - Plano Growth: 80k–150k
//   - Plano Pro: 150k+

function analyzeICP(a) {
  let score = 0;
  const criterios = [];

  const fat = pm(a.fat_atual);
  const tick = pm(a.ticket);
  const meta = pm(a.meta);
  const hof = a.hof_foco||"";
  const inv = a.investimento_mkt||"";
  const tend = a.fat_tendencia||"";
  const equipe = a.equipe||"";
  const exp = a.exp_ruim||"";
  const nivel = a.nivel_mkt||"";
  const tempo = a.tempo_clinica||"";
  const disp = a.disponibilidade_conteudo||"";

  // ── Faturamento (30 pontos) ──
  if(fat>=150000)     { score+=30; criterios.push({ok:true,  txt:"Faturamento ≥ R$150k/mês — perfil Pro"}); }
  else if(fat>=80000) { score+=26; criterios.push({ok:true,  txt:"Faturamento ≥ R$80k/mês — perfil Growth"}); }
  else if(fat>=50000) { score+=22; criterios.push({ok:true,  txt:"Faturamento ≥ R$50k/mês — perfil Starter"}); }
  else if(fat>=30000) { score+=16; criterios.push({ok:true,  txt:"Faturamento ≥ R$30k/mês — perfil Implementação"}); }
  else if(fat>=15000) { score+=8;  criterios.push({ok:"parcial", txt:"Faturamento entre R$15k–30k — abaixo do ideal"}); }
  else if(fat>0)      { score+=3;  criterios.push({ok:false, txt:"Faturamento < R$15k — muito abaixo do ICP"}); }
  else                {            criterios.push({ok:false, txt:"Faturamento não informado"}); }

  // ── Foco HOF (15 pontos) ──
  if(hof.includes("Exclusivamente HOF"))   { score+=15; criterios.push({ok:true,  txt:"Exclusivamente HOF — fit máximo com a AXIS"}); }
  else if(hof.includes("HOF + outros"))    { score+=10; criterios.push({ok:true,  txt:"HOF + outros procedimentos — bom fit"}); }
  else if(hof.includes("nova pra mim"))    { score+=3;  criterios.push({ok:false, txt:"HOF é área nova — fit baixo ainda"}); }
  else                                     { score+=5;  criterios.push({ok:"parcial", txt:"Especialidade não especificada"}); }

  // ── Ticket médio (15 pontos) ──
  if(tick>=5000)      { score+=15; criterios.push({ok:true,  txt:`Ticket médio ${fmtR(tick)} — posicionamento premium`}); }
  else if(tick>=3000) { score+=11; criterios.push({ok:true,  txt:`Ticket médio ${fmtR(tick)} — saudável`}); }
  else if(tick>=2000) { score+=7;  criterios.push({ok:"parcial", txt:`Ticket ${fmtR(tick)} — abaixo do ideal para HOF premium`}); }
  else if(tick>0)     { score+=3;  criterios.push({ok:false, txt:`Ticket ${fmtR(tick)} — muito baixo`}); }

  // ── Ambição / Meta (10 pontos) ──
  if(fat>0&&meta>0) {
    const crescimento=meta/fat;
    if(crescimento>=2)        { score+=10; criterios.push({ok:true,  txt:`Meta de ${fmtR(meta)} — ambição de +${Math.round((crescimento-1)*100)}% de crescimento`}); }
    else if(crescimento>=1.5) { score+=7;  criterios.push({ok:true,  txt:`Meta de ${fmtR(meta)} — crescimento sólido esperado`}); }
    else if(crescimento>=1.2) { score+=4;  criterios.push({ok:"parcial", txt:`Meta de ${fmtR(meta)} — crescimento moderado`}); }
    else                      { score+=1;  criterios.push({ok:false, txt:`Meta de ${fmtR(meta)} — crescimento muito tímido`}); }
  }

  // ── Investimento em Marketing (10 pontos) ──
  if(inv.includes("Mais de 15"))   { score+=10; criterios.push({ok:true,  txt:"Investe >15% do fat. em mkt — mentalidade de crescimento"}); }
  else if(inv.includes("7% e 15")) { score+=8;  criterios.push({ok:true,  txt:"Investe 7–15% em mkt — proporção saudável"}); }
  else if(inv.includes("3% e 7"))  { score+=5;  criterios.push({ok:"parcial", txt:"Investe 3–7% em mkt — abaixo do ideal para escala"}); }
  else if(inv.includes("Menos de 3"))  { score+=2;  criterios.push({ok:false, txt:"Investe <3% em mkt — precisa aumentar"}); }
  else if(inv.includes("Nada"))    {             criterios.push({ok:false, txt:"Sem investimento em mkt — obstáculo para resultados"}); }

  // ── Equipe estruturada (10 pontos) ──
  if(equipe.length>120)       { score+=10; criterios.push({ok:true,  txt:"Equipe bem estruturada — operação escalável"}); }
  else if(equipe.length>60)   { score+=6;  criterios.push({ok:true,  txt:"Equipe com papéis definidos"}); }
  else if(equipe.length>20)   { score+=3;  criterios.push({ok:"parcial", txt:"Equipe pequena ou solo — gargalo potencial"}); }
  else                        {            criterios.push({ok:false, txt:"Operação solitária — alta dependência da profissional"}); }

  // ── Maturidade digital (5 pontos) ──
  if(tend.includes("Crescendo")) { score+=3; criterios.push({ok:true, txt:"Faturamento em crescimento — momento ideal para parceria"}); }
  if(disp.includes("sem problema")) { score+=2; criterios.push({ok:true, txt:"Disponível para produção de conteúdo"}); }

  // ── Experiência prévia com agência (5 pontos bônus de fit cultural) ──
  if(exp&&exp.toLowerCase()!=="primeira vez"&&exp.toLowerCase()!=="nunca"&&exp.length>5) {
    score+=3;
    criterios.push({ok:"parcial", txt:"Já contratou agência — entende o modelo, sabe o que quer"});
  }

  const icpPct = Math.min(Math.round(score), 100);

  // ── Produto recomendado ──
  let produto, plano, prodCor, prodDesc;
  if(fat>=150000) {
    produto="Assessoria"; plano="Pro"; prodCor="#9C27B0";
    prodDesc="Clínica madura com alto volume. Foco em otimização de ROI, múltiplos canais, expansão.";
  } else if(fat>=80000) {
    produto="Assessoria"; plano="Growth"; prodCor=B;
    prodDesc="Boa base estabelecida. Pronta para escalar com tráfego estruturado e CRM avançado.";
  } else if(fat>=50000) {
    produto="Assessoria"; plano="Starter"; prodCor=G;
    prodDesc="Base funcional. Precisa de consistência e processo para dobrar o faturamento.";
  } else if(fat>=15000) {
    produto="Implementação"; plano=null; prodCor=O;
    prodDesc="Clínica em crescimento. Precisa estruturar funil, CRM, landing page e tráfego pago antes de escalar.";
  } else {
    produto="Não Qualificado"; plano=null; prodCor=R;
    prodDesc="Faturamento abaixo do mínimo para ROI positivo com assessoria. Recomendar modelo de entrada.";
  }

  return { icpPct, criterios, produto, plano, prodCor, prodDesc };
}

// ─── BAR COMPONENT ─────────────────────────────────────────────────────
function Bar({pct, color, height=8}) {
  return (
    <div style={{height,background:"#EEE",borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:10,transition:"width 0.8s ease"}}/>
    </div>
  );
}

// ─── RING COMPONENT ────────────────────────────────────────────────────
function Ring({v,max,color,size=60}){
  const pct=max===0?0:Math.round(v/max*100), r=size/2-6, c=2*Math.PI*r;
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EEE" strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={c} strokeDashoffset={c-(c*pct/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s ease"}}/>
      </svg>
      <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size/4,fontWeight:700,color}}>{pct}%</span>
    </div>
  );
}

// ─── FICHA INDIVIDUAL DO CLIENTE ───────────────────────────────────────
function ClienteDetalhe({data, onBack}) {
  const {scores, maxS, saude} = useMemo(()=>analyze(data),[data]);
  const icp = useMemo(()=>analyzeICP(data),[data]);
  const [tab, setTab] = useState("visao");
  const saudeCor = nivelFn(saude).color;
  const dt = data._ts ? new Date(data._ts).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}) : "—";

  const AREAS = [
    {k:"comercial",  label:"Comercial",   emoji:"🎯", color:"#E91E63"},
    {k:"marketing",  label:"Marketing",   emoji:"📱", color:B},
    {k:"operacional",label:"Operacional", emoji:"⚙️", color:Y},
    {k:"financeiro", label:"Financeiro",  emoji:"📊", color:G},
  ];

  const TABS = [
    {id:"visao",  label:"Visão Geral"},
    {id:"icp",    label:"ICP & Produto"},
    {id:"dados",  label:"Dados Completos"},
  ];

  const tabBtn = (t) => ({
    padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer",
    fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all 0.2s",
    background: tab===t.id ? O : "transparent",
    color: tab===t.id ? "#fff" : T2,
  });

  const sections_labels = {
    clinica:"🏥 Clínica", fat:"📊 Faturamento", serv:"💎 Serviços",
    com:"🎯 Comercial", mkt:"📱 Marketing", visao:"🚀 Visão"
  };
  const allFields = {
    clinica:["nome","nome_clinica","cidade_estado","whatsapp","equipe","dias_atendimento","capacidade","tempo_clinica","hof_foco"],
    fat:["fat_atual","maior_fat","meta","margem","fat_tendencia","investimento_mkt","sazonalidade"],
    serv:["procedimentos","carro_chefe","ticket","pagamento"],
    com:["quem_resp","tempo_resp","max_leads","conv_aval","conv_proc","follow_up","crm","reativacao","motivo_perda"],
    mkt:["instagram","origem","trafego","site","conteudo","freq_posts","landing_page","pixel_meta","gmn"],
    visao:["pac_desejados","vol_ticket","expect_90d","exp_ruim","algo_mais"],
  };
  const fieldLabel = {
    nome:"Nome",nome_clinica:"Clínica",cidade_estado:"Cidade",whatsapp:"WhatsApp",
    equipe:"Equipe",dias_atendimento:"Dias/semana",capacidade:"Capacidade/semana",
    tempo_clinica:"Tempo de operação",hof_foco:"Foco HOF",
    fat_atual:"Fat. atual",maior_fat:"Maior fat.",meta:"Meta",margem:"Margem",
    fat_tendencia:"Tendência",investimento_mkt:"Invest. marketing",sazonalidade:"Sazonalidade",
    procedimentos:"Procedimentos",carro_chefe:"Carro-chefe",ticket:"Ticket médio",pagamento:"Pagamento",
    quem_resp:"Quem responde",tempo_resp:"Tempo de resposta",max_leads:"Max leads/mês",
    conv_aval:"Conv. lead→aval",conv_proc:"Conv. aval→proc",follow_up:"Follow-up",
    crm:"CRM",reativacao:"Reativação",motivo_perda:"Principal perda",
    instagram:"Instagram",origem:"Origem pacientes",trafego:"Tráfego pago",
    site:"Site",conteudo:"Conteúdo",freq_posts:"Freq. posts",
    landing_page:"Landing page",pixel_meta:"Pixel Meta",gmn:"Google Meu Negócio",
    pac_desejados:"Pacientes/mês desejados",vol_ticket:"Volume vs ticket",
    expect_90d:"Expectativa 90 dias",exp_ruim:"Exp. anterior",algo_mais:"Observações",
  };

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit"}}>
      <div style={{height:4,background:`linear-gradient(90deg,${O},#FF7043)`}}/>

      {/* TOPBAR */}
      <div style={{background:C,borderBottom:`1px solid ${BD}`,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",fontSize:14,fontWeight:600,cursor:"pointer",color:O,padding:0,fontFamily:"inherit"}}>← Voltar</button>
        <span style={{fontWeight:800,fontSize:16,letterSpacing:1.5}}><span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span></span>
        <span style={{fontSize:12,color:T3}}>{dt}</span>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px 80px"}}>
        {/* HERO */}
        <div style={{background:C,borderRadius:20,padding:"28px 32px",marginBottom:20,border:`1px solid ${BD}`}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:28,fontWeight:900,color:T,marginBottom:4}}>{data.nome_clinica||"Clínica"}</div>
              <div style={{fontSize:14,color:T2}}>{data.nome}{data.cidade_estado?` · ${data.cidade_estado}`:""}{data.whatsapp?` · ${data.whatsapp}`:""}</div>
            </div>
            <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:11,color:T3,marginBottom:6,letterSpacing:0.5}}>SAÚDE</div>
                <Ring v={Object.values(scores).reduce((a,b)=>a+b,0)} max={Object.values(maxS).reduce((a,b)=>a+b,0)} color={saudeCor} size={72}/>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:11,color:T3,marginBottom:6,letterSpacing:0.5}}>ICP SCORE</div>
                <Ring v={icp.icpPct} max={100} color={icp.prodCor} size={72}/>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:24}}>
            {[
              {label:"Fat. Atual",val:data.fat_atual||"—",color:G},
              {label:"Ticket Médio",val:data.ticket||"—",color:B},
              {label:"Meta 2026",val:data.meta||"—",color:O},
              {label:"Produto AXIS",val:`${icp.produto}${icp.plano?" "+icp.plano:""}`,color:icp.prodCor},
            ].map(st=>(
              <div key={st.label} style={{padding:"14px 16px",borderRadius:12,background:BG,border:`1px solid ${BD}`}}>
                <div style={{fontSize:11,color:T3,marginBottom:4}}>{st.label}</div>
                <div style={{fontSize:15,fontWeight:800,color:st.color}}>{st.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:4,marginBottom:16,background:C,borderRadius:12,padding:4,border:`1px solid ${BD}`,width:"fit-content"}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={tabBtn(t)}>{t.label}</button>)}
        </div>

        {/* TAB: VISÃO GERAL */}
        {tab==="visao"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Scores por área */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>SCORES POR ÁREA</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {AREAS.map(ar=>{
                  const pct=Math.round(scores[ar.k]/maxS[ar.k]*100);
                  const nv=nivelFn(pct);
                  return(
                    <div key={ar.k}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:14,fontWeight:600,color:T}}>{ar.emoji} {ar.label}</span>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:nv.bg,color:nv.color}}>{nv.label}</span>
                          <span style={{fontSize:14,fontWeight:800,color:ar.color}}>{pct}%</span>
                        </div>
                      </div>
                      <Bar pct={pct} color={ar.color} height={8}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo rápido para equipe */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>RESUMO OPERACIONAL — EQUIPE DE ENTREGA</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {label:"Tempo de resposta ao lead",val:data.tempo_resp||"—"},
                  {label:"Conv. lead → avaliação",val:data.conv_aval||"—"},
                  {label:"Conv. avaliação → procedimento",val:data.conv_proc||"—"},
                  {label:"CRM utilizado",val:data.crm||"—"},
                  {label:"Faz follow-up?",val:data.follow_up||"—"},
                  {label:"Reativação de base",val:data.reativacao||"—"},
                  {label:"Tráfego pago",val:data.trafego||"—"},
                  {label:"Landing page",val:data.landing_page||"—"},
                  {label:"Pixel Meta",val:data.pixel_meta||"—"},
                  {label:"Google Meu Negócio",val:data.gmn||"—"},
                ].map(it=>(
                  <div key={it.label} style={{padding:"12px 14px",borderRadius:10,background:BG,border:`1px solid ${BD}`}}>
                    <div style={{fontSize:11,color:T3,marginBottom:3}}>{it.label}</div>
                    <div style={{fontSize:13,fontWeight:600,color:T}}>{it.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ICP & PRODUTO */}
        {tab==="icp"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* ICP Score card */}
            <div style={{background:C,borderRadius:20,padding:28,border:`1.5px solid ${icp.prodCor}33`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap",marginBottom:24}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:T3,marginBottom:8}}>ICP SCORE · AXIS CLINIC BRASIL</div>
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
                  {label:"Implementação",range:"R$15k–50k",color:O,active:icp.produto==="Implementação"},
                  {label:"Assessoria Starter",range:"R$50k–80k",color:G,active:icp.produto==="Assessoria"&&icp.plano==="Starter"},
                  {label:"Assessoria Growth",range:"R$80k–150k",color:B,active:icp.produto==="Assessoria"&&icp.plano==="Growth"},
                  {label:"Assessoria Pro",range:"R$150k+",color:"#9C27B0",active:icp.produto==="Assessoria"&&icp.plano==="Pro"},
                ].map(p=>(
                  <div key={p.label} style={{padding:"12px",borderRadius:10,textAlign:"center",border:`1.5px solid ${p.active?p.color:BD}`,background:p.active?`${p.color}10`:BG}}>
                    <div style={{fontSize:11,fontWeight:700,color:p.active?p.color:T3,marginBottom:2}}>{p.label}</div>
                    <div style={{fontSize:10,color:T3}}>{p.range}</div>
                    {p.active&&<div style={{fontSize:10,fontWeight:700,color:p.color,marginTop:4}}>← Este cliente</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Critérios avaliados */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>CRITÉRIOS AVALIADOS</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {icp.criterios.map((cr,i)=>{
                  const bg=cr.ok===true?GL:cr.ok==="parcial"?YL:RL;
                  const clr=cr.ok===true?G:cr.ok==="parcial"?Y:R;
                  const icon=cr.ok===true?"✓":cr.ok==="parcial"?"~":"✗";
                  return(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 14px",borderRadius:10,background:bg}}>
                      <span style={{color:clr,fontWeight:800,fontSize:14,flexShrink:0,width:20,textAlign:"center"}}>{icon}</span>
                      <span style={{fontSize:13,color:T,lineHeight:1.5}}>{cr.txt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recomendação PAC */}
            <div style={{background:"linear-gradient(135deg,#1A1A2E,#16213E)",borderRadius:20,padding:28,color:"#fff"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:OB,marginBottom:16}}>RECOMENDAÇÃO DE ENTREGA — PAC</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {getPacRecomendacoes(icp.produto, icp.plano, data).map((item,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.08)"}}>
                    <div style={{fontSize:11,fontWeight:700,color:OB,marginBottom:4,letterSpacing:0.5}}>{item.tag}</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>{item.acao}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: DADOS COMPLETOS */}
        {tab==="dados"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {Object.entries(allFields).map(([sec,fields])=>{
              const filled=fields.filter(f=>data[f]&&String(data[f]).trim()!=="");
              if(!filled.length) return null;
              return(
                <div key={sec} style={{background:C,borderRadius:16,padding:24,border:`1px solid ${BD}`}}>
                  <div style={{fontSize:13,fontWeight:700,color:O,marginBottom:14}}>{sections_labels[sec]||sec}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {filled.map(f=>(
                      <div key={f} style={{display:"flex",gap:12,paddingBottom:8,borderBottom:`1px solid ${BG}`}}>
                        <div style={{fontSize:11,color:T3,width:180,flexShrink:0,paddingTop:2}}>{fieldLabel[f]||f}</div>
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

// ─── RECOMENDAÇÕES PAC POR PRODUTO ─────────────────────────────────────
function getPacRecomendacoes(produto, plano, data) {
  const fat=pm(data.fat_atual);
  const tick=pm(data.ticket);
  const tem_trafego=data.trafego&&!data.trafego.toLowerCase().includes("não")&&data.trafego.trim().length>2;
  const tem_lp=(data.landing_page||"").includes("landing page");
  const tem_crm=(data.crm||"").includes("CRM");
  const tem_gmn=data.gmn&&!data.gmn.toLowerCase().includes("não tenho")&&data.gmn.length>3;

  if(produto==="Implementação") return [
    {tag:"FUNDAÇÃO", acao:"Estruturar funil comercial completo: script WhatsApp, cadência de follow-up e CRM básico (Kommo)."},
    {tag:"CAPTAÇÃO", acao:"Criar landing page dedicada ao procedimento carro-chefe com pixel Meta configurado."},
    {tag:"TRÁFEGO", acao:"Lançar campanhas Meta Ads com budget mínimo de R$2.500/mês focado em geração de leads para avaliação."},
    {tag:"REPUTAÇÃO", acao:tem_gmn?"Ativar estratégia de captação de avaliações no Google Meu Negócio.":"Criar e verificar Google Meu Negócio. Meta: 20 avaliações em 60 dias."},
    {tag:"CONTEÚDO", acao:"Implementar calendário editorial com 4 pilares: educação, prova social, bastidores e chamada para ação."},
    {tag:"MÉTRICA", acao:`KPI principal: CPL < 25% do ticket (${fmtR(Math.round(tick*0.25))}). Monitorar conversão lead→avaliação→procedimento semanalmente.`},
  ];

  if(plano==="Starter") return [
    {tag:"OTIMIZAÇÃO", acao:tem_trafego?"Otimizar campanhas existentes: testar novos criativos e segmentações. Escalar budget com base no melhor CPL.":"Estruturar Meta Ads com budget R$3.000–5.000/mês. Foco em conversão de leads qualificados."},
    {tag:"CRM", acao:tem_crm?"Aprofundar uso do CRM: automações de follow-up e relatórios de conversão por etapa.":"Implementar CRM (Kommo). Mapear e automatizar funil completo."},
    {tag:"REATIVAÇÃO", acao:`Campanha de reativação da base: meta de converter 15–20% dos pacientes inativos (últimos 18 meses) em R$${Math.round(fat*0.1/1000)}k de receita extra.`},
    {tag:"GOOGLE ADS", acao:"Testar Google Ads para termos de alta intenção local. Budget inicial: R$1.200/mês. CPL tende a ser menor para procedimentos de alto ticket."},
    {tag:"CONTEÚDO", acao:"Gravar conteúdo em lote 1x/mês. Meta: 5 posts/semana + stories diários. Focar em antes/depois e depoimentos reais."},
    {tag:"INDICAÇÃO", acao:"Lançar programa de indicação estruturado: paciente indica e ganha benefício. Meta: 10% dos novos pacientes via indicação."},
  ];

  if(plano==="Growth") return [
    {tag:"ESCALA", acao:`Budget Meta Ads: R$6.000–10.000/mês. Distribuir entre conversão (60%), remarketing (30%) e awareness (10%).`},
    {tag:"LOOKALIKE", acao:"Criar audiências lookalike a partir dos melhores clientes (ex: pacientes que realizaram harmonização completa). Escalar agressivamente."},
    {tag:"AUTOMAÇÃO", acao:"Implementar automações avançadas de follow-up: sequência de 7 dias para leads não convertidos, NPS pós-procedimento, protocolo de recompra."},
    {tag:"SEO LOCAL", acao:"Iniciar estratégia de SEO local + Google Ads para dominar os termos de busca da cidade. Meta: aparecer nas 3 primeiras posições."},
    {tag:"INFLUÊNCIA", acao:"Estruturar programa de médicos parceiros e influenciadores locais. 2–3 parcerias ativas por mês."},
    {tag:"EXPANSÃO", acao:data.algo_mais&&data.algo_mais.toLowerCase().includes("unidade")?"Avaliar viabilidade de segunda unidade: plano de operação, capacidade e break-even.":"Avaliar expansão: novos procedimentos de alto ticket ou nova unidade para absorver demanda excedente."},
  ];

  return [
    {tag:"MULTI-CANAL", acao:"Diversificar canais: Meta Ads + Google Ads + SEO + Email Marketing + WhatsApp Marketing integrados."},
    {tag:"BRAND EQUITY", acao:"Investir em autoridade de marca: eventos, masterclasses, presença em feiras e publicações especializadas."},
    {tag:"DADOS", acao:"Implementar dashboards de BI para acompanhamento de KPIs em tempo real: CPL, LTV, churn, NPS."},
    {tag:"EXPANSÃO", acao:"Plano estratégico de expansão: segunda unidade, franquia ou licenciamento de metodologia."},
  ];
}

// ─── DASHBOARD PRINCIPAL ───────────────────────────────────────────────
function DashboardMain({clients, onSelectClient}) {
  const [tab, setTab] = useState("clientes");
  const [search, setSearch] = useState("");

  const filtered = clients.filter(c => {
    if(!search) return true;
    const q=search.toLowerCase();
    return (c.nome_clinica||"").toLowerCase().includes(q)||(c.nome||"").toLowerCase().includes(q)||(c.cidade_estado||"").toLowerCase().includes(q);
  });

  const stats = useMemo(()=>{
    if(!clients.length) return null;
    const saudeMedia = Math.round(clients.reduce((s,c)=>{
      const r=analyze(c); const t=Object.values(r.scores).reduce((a,b)=>a+b,0); const m=Object.values(r.maxS).reduce((a,b)=>a+b,0); return s+(t/m*100);
    },0)/clients.length);
    const icpMedia = Math.round(clients.reduce((s,c)=>s+analyzeICP(c).icpPct,0)/clients.length);
    const fatTotal = clients.reduce((s,c)=>s+pm(c.fat_atual),0);
    const assCount = clients.filter(c=>analyzeICP(c).produto==="Assessoria").length;
    const implCount = clients.filter(c=>analyzeICP(c).produto==="Implementação").length;
    return {saudeMedia,icpMedia,fatTotal,assCount,implCount};
  },[clients]);

  const TABS = [{id:"clientes",label:"Clientes"},{id:"analytics",label:"Analytics"}];
  const tabBtn = (t) => ({
    padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",
    fontFamily:"inherit",fontSize:13,fontWeight:600,transition:"all 0.2s",
    background:tab===t.id?O:"transparent", color:tab===t.id?"#fff":T2,
  });

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit"}}>
      <div style={{height:4,background:`linear-gradient(90deg,${O},#FF7043)`}}/>
      {/* TOPBAR */}
      <div style={{background:C,borderBottom:`1px solid ${BD}`,padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontWeight:800,fontSize:20,letterSpacing:1.5}}><span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span></span>
          <span style={{fontSize:12,fontWeight:600,color:T3,letterSpacing:1}}>· DASHBOARD</span>
        </div>
        <div style={{display:"flex",gap:4,background:"#F0F0F0",borderRadius:10,padding:3}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={tabBtn(t)}>{t.label}</button>)}
        </div>
        <a href="/" style={{fontSize:13,color:T2,textDecoration:"none",padding:"7px 14px",borderRadius:8,border:`1px solid ${BD}`,background:C}}>← Voltar ao site</a>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"28px 24px 80px"}}>

        {/* STATS CARDS */}
        {stats&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:28}}>
            {[
              {label:"Total Leads",val:clients.length,color:T,icon:"📋"},
              {label:"Saúde Média",val:stats.saudeMedia+"%",color:G,icon:"📊"},
              {label:"ICP Médio",val:stats.icpMedia+"%",color:B,icon:"🎯"},
              {label:"Assessoria",val:stats.assCount,color:O,icon:"🏆"},
              {label:"Implementação",val:stats.implCount,color:Y,icon:"🔧"},
            ].map(st=>(
              <div key={st.label} style={{background:C,borderRadius:14,padding:"16px 18px",border:`1px solid ${BD}`,textAlign:"center"}}>
                <div style={{fontSize:22}}>{st.icon}</div>
                <div style={{fontSize:24,fontWeight:900,color:st.color,marginTop:6}}>{st.val}</div>
                <div style={{fontSize:11,color:T2,marginTop:2}}>{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: CLIENTES */}
        {tab==="clientes"&&(
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:12,flexWrap:"wrap"}}>
              <h2 style={{fontSize:18,fontWeight:800,color:T,margin:0}}>
                {filtered.length} {filtered.length===1?"cliente":"clientes"}
              </h2>
              <input
                value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar por nome, clínica ou cidade..."
                style={{padding:"9px 16px",borderRadius:10,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,width:280,outline:"none",background:C}}
              />
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[...filtered].reverse().map(c=>{
                const res=analyze(c);
                const total=Object.values(res.scores).reduce((a,b)=>a+b,0);
                const maxT=Object.values(res.maxS).reduce((a,b)=>a+b,0);
                const saude=Math.round(total/maxT*100);
                const nv=nivelFn(saude);
                const icp=analyzeICP(c);
                const dt=c._ts?new Date(c._ts).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):"—";
                return(
                  <div key={c._id} onClick={()=>onSelectClient(c)}
                    style={{background:C,borderRadius:14,padding:"18px 24px",border:`1px solid ${BD}`,cursor:"pointer",display:"flex",alignItems:"center",gap:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",transition:"all 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)";e.currentTarget.style.borderColor=OB;}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";e.currentTarget.style.borderColor=BD;}}>
                    {/* Avatar */}
                    <div style={{width:44,height:44,borderRadius:12,background:OL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:O,flexShrink:0}}>
                      {(c.nome_clinica||"?")[0].toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:15,fontWeight:700,color:T}}>{c.nome_clinica}</span>
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:nv.bg,color:nv.color}}>Saúde {saude}%</span>
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:`${icp.prodCor}18`,color:icp.prodCor}}>
                          ICP {icp.icpPct}%{icp.plano?` · ${icp.plano}`:""}
                        </span>
                      </div>
                      <div style={{fontSize:12,color:T2,marginTop:3}}>{c.nome}{c.cidade_estado?` · ${c.cidade_estado}`:""}</div>
                    </div>
                    {/* Dados financeiros */}
                    <div style={{flexShrink:0,textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:700,color:G}}>{c.fat_atual||"—"}</div>
                      <div style={{fontSize:11,color:T3,marginTop:2}}>{icp.produto}{icp.plano?` ${icp.plano}`:""}</div>
                    </div>
                    <div style={{fontSize:11,color:T3,flexShrink:0}}>{dt}</div>
                    <svg width={16} height={16} viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" stroke={T3} strokeWidth={2} fill="none"/></svg>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB: ANALYTICS */}
        {tab==="analytics"&&stats&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Distribuição por produto */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>DISTRIBUIÇÃO POR PRODUTO</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[
                  {label:"Implementação",count:clients.filter(c=>analyzeICP(c).produto==="Implementação").length,color:O},
                  {label:"Starter",count:clients.filter(c=>{const i=analyzeICP(c);return i.produto==="Assessoria"&&i.plano==="Starter";}).length,color:G},
                  {label:"Growth",count:clients.filter(c=>{const i=analyzeICP(c);return i.produto==="Assessoria"&&i.plano==="Growth";}).length,color:B},
                  {label:"Pro",count:clients.filter(c=>{const i=analyzeICP(c);return i.produto==="Assessoria"&&i.plano==="Pro";}).length,color:"#9C27B0"},
                ].map(p=>(
                  <div key={p.label} style={{padding:"16px",borderRadius:12,background:BG,border:`1.5px solid ${p.color}33`,textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:900,color:p.color}}>{p.count}</div>
                    <div style={{fontSize:12,color:T2,marginTop:4}}>{p.label}</div>
                    <div style={{fontSize:11,color:T3,marginTop:2}}>{clients.length?Math.round(p.count/clients.length*100):0}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saúde média por área */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>SAÚDE MÉDIA POR ÁREA</div>
              {["comercial","marketing","operacional","financeiro"].map(k=>{
                const cfg={comercial:{label:"Comercial",color:"#E91E63",emoji:"🎯"},marketing:{label:"Marketing",color:B,emoji:"📱"},operacional:{label:"Operacional",color:Y,emoji:"⚙️"},financeiro:{label:"Financeiro",color:G,emoji:"📊"}};
                const avg=clients.length?Math.round(clients.reduce((s,c)=>{const r=analyze(c);return s+Math.round(r.scores[k]/r.maxS[k]*100);},0)/clients.length):0;
                return(
                  <div key={k} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:13,fontWeight:600,color:T}}>{cfg[k].emoji} {cfg[k].label}</span>
                      <span style={{fontSize:13,fontWeight:700,color:cfg[k].color}}>{avg}%</span>
                    </div>
                    <Bar pct={avg} color={cfg[k].color} height={8}/>
                  </div>
                );
              })}
            </div>

            {/* Top leads por ICP */}
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>TOP LEADS POR ICP SCORE</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[...clients].sort((a,b)=>analyzeICP(b).icpPct-analyzeICP(a).icpPct).slice(0,5).map((c,i)=>{
                  const icp=analyzeICP(c);
                  return(
                    <div key={c._id} onClick={()=>onSelectClient(c)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,background:BG,cursor:"pointer",border:`1px solid ${BD}`}}>
                      <span style={{fontSize:14,fontWeight:800,color:T3,width:20}}>{i+1}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:T}}>{c.nome_clinica}</div>
                        <div style={{fontSize:11,color:T2}}>{c.cidade_estado}</div>
                      </div>
                      <span style={{fontSize:14,fontWeight:800,color:icp.prodCor}}>{icp.icpPct}%</span>
                      <span style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:`${icp.prodCor}18`,color:icp.prodCor,fontWeight:600}}>{icp.produto}{icp.plano?` ${icp.plano}`:""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(()=>{
    (async()=>{
      try {
        const {data,error}=await supabase.from("mapeamentos").select("*").order("created_at",{ascending:false});
        if(!error&&data) setClients(data.map(r=>r.data));
      } catch(e) { setClients([]); }
      setLoading(false);
    })();
  },[]);

  const handleLogin = () => {
    if(pass===TEAM_PASS) { setAuthed(true); setPassErr(false); }
    else setPassErr(true);
  };

  if(selected) return <ClienteDetalhe data={selected} onBack={()=>setSelected(null)}/>;
  if(authed) return <DashboardMain clients={clients} onSelectClient={setSelected}/>;

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C,borderRadius:24,padding:"48px 40px",maxWidth:380,width:"100%",border:`1px solid ${BD}`,boxShadow:"0 8px 48px rgba(0,0,0,0.08)",textAlign:"center"}}>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:36,fontWeight:900,letterSpacing:2,marginBottom:6}}>
            <span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span>
          </div>
          <div style={{fontSize:13,color:T3,letterSpacing:1}}>DASHBOARD INTERNO</div>
        </div>
        <input
          type="password" value={pass}
          onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          placeholder="Senha de acesso"
          style={{width:"100%",boxSizing:"border-box",padding:"13px 16px",marginBottom:12,borderRadius:12,border:`1.5px solid ${passErr?R:BD}`,background:"#FAFAFA",color:T,fontFamily:"inherit",fontSize:15,outline:"none"}}
          autoFocus
        />
        <button onClick={handleLogin} style={{width:"100%",padding:"13px",background:O,color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:15}}>
          Entrar
        </button>
        {passErr&&<p style={{color:R,fontSize:13,marginTop:12}}>Senha incorreta</p>}
        {loading&&<p style={{color:T3,fontSize:12,marginTop:12}}>Carregando dados...</p>}
      </div>
    </div>
  );
}

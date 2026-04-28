"use client";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Users, BarChart3, Target, Settings2, Activity, BadgeCheck,
  Search, ArrowLeft, Shield, AlertCircle, Trophy, Sparkles,
  TrendingUp, ChevronRight, UserPlus, Pencil, Trash2, Check, X,
  UserCheck, UserX, Mail, LogOut
} from "lucide-react";
import { analyze, analyzeICP, nivelFn, fmtR, pm } from "@/lib/analysis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const TEAM_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "axis2026";

// ─── PALETA ────────────────────────────────────────────────────────────
const O="#FF4500",OL="#FFF4F0",OB="#FFD4C4";
const G="#00C853",GL="#E8F9EF";
const R="#E53935",RL="#FFEBEE";
const Y="#FF9800",YL="#FFF8E1";
const B="#2196F3",BL="#E3F2FD";
const T="#1A1A1A",T2="#6B6B6B",T3="#999";
const BD="#E8E8E8",BG="#F4F5F7",C="#FFFFFF",DK="#1A1A1A";

const ROLES = ["Gestor","Consultor","CS","SDR","Analista","Financeiro","Outro"];

function Bar({ pct, color, height=8 }) {
  return (
    <div style={{height,background:"#EEE",borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:10,transition:"width 0.8s ease"}}/>
    </div>
  );
}

// ─── ABA EQUIPE ────────────────────────────────────────────────────────
function EquipeTab() {
  const [membros,    setMembros]    = useState([]);
  const [loading,   setLoading]    = useState(true);
  const [showForm,  setShowForm]   = useState(false);
  const [editId,    setEditId]     = useState(null);
  const [saving,    setSaving]     = useState(false);
  const [confirmDel,setConfirmDel] = useState(null);

  const emptyForm = { nome:"", email:"", role:"Consultor" };
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("membros").select("*").order("created_at", { ascending: true });
    setMembros(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setForm(emptyForm); setEditId(null); setShowForm(true); }
  function openEdit(m) { setForm({ nome: m.nome, email: m.email||"", role: m.role }); setEditId(m.id); setShowForm(true); }
  function cancelForm() { setShowForm(false); setEditId(null); setForm(emptyForm); }

  async function handleSave() {
    if (!form.nome.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("membros").update({ nome: form.nome.trim(), email: form.email.trim()||null, role: form.role }).eq("id", editId);
    } else {
      await supabase.from("membros").insert({ nome: form.nome.trim(), email: form.email.trim()||null, role: form.role, ativo: true });
    }
    setSaving(false);
    cancelForm();
    load();
  }

  async function toggleAtivo(m) {
    await supabase.from("membros").update({ ativo: !m.ativo }).eq("id", m.id);
    setMembros(prev => prev.map(x => x.id===m.id ? {...x, ativo: !x.ativo} : x));
  }

  async function handleDelete(id) {
    await supabase.from("membros").delete().eq("id", id);
    setConfirmDel(null);
    load();
  }

  const ativos   = membros.filter(m => m.ativo);
  const inativos = membros.filter(m => !m.ativo);

  const roleCor = { Gestor:O, Consultor:B, CS:G, SDR:"#9C27B0", Analista:Y, Financeiro:"#00BCD4", Outro:T3 };

  function MemberCard({ m }) {
    const cor = roleCor[m.role] || T3;
    return (
      <div style={{background:C,borderRadius:14,padding:"14px 18px",border:`1px solid ${BD}`,display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{width:40,height:40,borderRadius:10,background:`${cor}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:cor,flexShrink:0}}>
          {m.nome[0].toUpperCase()}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:14,fontWeight:700,color:m.ativo?T:T3}}>{m.nome}</span>
            <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:`${cor}18`,color:cor}}>{m.role}</span>
            {!m.ativo && <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:RL,color:R}}>Inativo</span>}
          </div>
          {m.email && (
            <div style={{fontSize:12,color:T3,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
              <Mail size={10}/>{m.email}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={()=>toggleAtivo(m)} title={m.ativo?"Desativar":"Ativar"}
            style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${BD}`,background:C,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12,color:m.ativo?R:G}}>
            {m.ativo ? <UserX size={13}/> : <UserCheck size={13}/>}
            {m.ativo ? "Desativar" : "Ativar"}
          </button>
          <button onClick={()=>openEdit(m)} title="Editar"
            style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${BD}`,background:C,cursor:"pointer",color:T2}}>
            <Pencil size={13}/>
          </button>
          {confirmDel===m.id ? (
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontSize:12,color:R,fontWeight:600}}>Confirmar?</span>
              <button onClick={()=>handleDelete(m.id)} style={{padding:"4px 8px",borderRadius:6,border:"none",background:R,color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700}}>Sim</button>
              <button onClick={()=>setConfirmDel(null)} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${BD}`,background:C,cursor:"pointer",fontSize:11}}>Não</button>
            </div>
          ) : (
            <button onClick={()=>setConfirmDel(m.id)} title="Remover"
              style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${BD}`,background:C,cursor:"pointer",color:R}}>
              <Trash2 size={13}/>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:17,fontWeight:800,color:T,margin:0}}>{membros.length} {membros.length===1?"membro":"membros"}</h2>
          <div style={{fontSize:12,color:T3,marginTop:2}}>{ativos.length} ativos · {inativos.length} inativos</div>
        </div>
        <button onClick={openNew}
          style={{padding:"9px 18px",borderRadius:10,border:"none",background:O,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 12px ${O}44`}}>
          <UserPlus size={14}/>Adicionar membro
        </button>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div style={{background:C,borderRadius:16,padding:"20px 22px",border:`1.5px solid ${OB}`,marginBottom:20,boxShadow:`0 4px 20px ${O}18`}}>
          <div style={{fontSize:13,fontWeight:700,color:T,marginBottom:16}}>{editId?"Editar membro":"Novo membro"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"end"}}>
            <div>
              <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:4}}>Nome *</div>
              <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}
                placeholder="Nome completo"
                style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,outline:"none"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:4}}>E-mail</div>
              <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                placeholder="email@exemplo.com"
                style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,outline:"none"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:4}}>Cargo</div>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
                style={{padding:"10px 12px",borderRadius:9,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,outline:"none",background:C,cursor:"pointer"}}>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
            <button onClick={cancelForm}
              style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${BD}`,background:C,cursor:"pointer",fontSize:13,fontFamily:"inherit",color:T2,display:"flex",alignItems:"center",gap:5}}>
              <X size={13}/>Cancelar
            </button>
            <button onClick={handleSave} disabled={saving||!form.nome.trim()}
              style={{padding:"8px 18px",borderRadius:8,border:"none",background:form.nome.trim()?O:"#CCC",color:"#fff",cursor:form.nome.trim()?"pointer":"not-allowed",fontSize:13,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
              <Check size={13}/>{saving?"Salvando...":"Salvar"}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{textAlign:"center",padding:"48px 0",color:T3,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <Activity size={15} color={T3} style={{animation:"spin 1s linear infinite"}}/>Carregando equipe...
        </div>
      )}

      {/* Membros ativos */}
      {!loading && ativos.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:10}}>ATIVOS</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ativos.map(m=><MemberCard key={m.id} m={m}/>)}
          </div>
        </div>
      )}

      {/* Membros inativos */}
      {!loading && inativos.length > 0 && (
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T3,marginBottom:10}}>INATIVOS</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {inativos.map(m=><MemberCard key={m.id} m={m}/>)}
          </div>
        </div>
      )}

      {!loading && membros.length===0 && (
        <div style={{textAlign:"center",padding:"60px 0",color:T3}}>
          <Users size={32} color={BD} style={{marginBottom:12}}/>
          <div style={{fontSize:14,fontWeight:600}}>Nenhum membro cadastrado</div>
          <div style={{fontSize:12,marginTop:4}}>Clique em "Adicionar membro" para começar</div>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ───────────────────────────────────────────────
function DashboardMain({ clients, loading, onLogout }) {
  const [tab,    setTab]    = useState("clientes");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.nome_clinica||"").toLowerCase().includes(q)
        || (c.responsavel||"").toLowerCase().includes(q)
        || (c.cidade_estado||"").toLowerCase().includes(q);
  }), [clients, search]);

  const stats = useMemo(() => {
    if (!clients.length) return null;
    const saudeMedia = Math.round(clients.reduce((s,c) => {
      const r=analyze(c); const t=Object.values(r.scores).reduce((a,b)=>a+b,0); const m=Object.values(r.maxS).reduce((a,b)=>a+b,0); return s+(t/m*100);
    },0) / clients.length);
    const icpMedia  = Math.round(clients.reduce((s,c) => s+analyzeICP(c).icpPct, 0) / clients.length);
    const assCount  = clients.filter(c => analyzeICP(c).produto==="Assessoria").length;
    const implCount = clients.filter(c => analyzeICP(c).produto==="Implementação").length;
    return { saudeMedia, icpMedia, assCount, implCount };
  }, [clients]);

  const TABS = [
    { id:"clientes",  label:"Clientes",  Icon:Users },
    { id:"analytics", label:"Analytics", Icon:BarChart3 },
    { id:"equipe",    label:"Equipe",    Icon:UserCheck },
  ];
  const tabBtn = (t) => ({
    padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer",
    fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all 0.2s",
    background: tab===t.id ? O : "transparent",
    color:      tab===t.id ? "#fff" : T2,
    display:"flex", alignItems:"center", gap:6,
  });

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit"}}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{height:3,background:`linear-gradient(90deg,${O},#FF7043,#FF9800)`}}/>

      {/* TOPBAR */}
      <div style={{background:C,borderBottom:`1px solid ${BD}`,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 8px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontWeight:900,fontSize:18,letterSpacing:1}}>
            <span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span>
          </span>
          <span style={{fontSize:10,fontWeight:700,color:T3,letterSpacing:2}}>DASHBOARD</span>
        </div>
        <div style={{display:"flex",gap:3,background:"#F0F0F2",borderRadius:10,padding:3}}>
          {TABS.map(t => <button key={t.id} onClick={()=>setTab(t.id)} style={tabBtn(t)}><t.Icon size={14} strokeWidth={1.8}/>{t.label}</button>)}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <a href="/" style={{fontSize:13,color:T2,textDecoration:"none",padding:"7px 14px",borderRadius:9,border:`1px solid ${BD}`,background:C,display:"flex",alignItems:"center",gap:6}}>
            <ArrowLeft size={14}/>Voltar ao site
          </a>
          <button onClick={onLogout}
            style={{fontSize:13,color:R,padding:"7px 14px",borderRadius:9,border:`1px solid ${RL}`,background:C,cursor:"pointer",fontFamily:"inherit",fontWeight:600,display:"flex",alignItems:"center",gap:6,transition:"all 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.background=RL}
            onMouseLeave={e=>e.currentTarget.style.background=C}>
            <LogOut size={14}/>Sair
          </button>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"28px 24px 80px"}}>

        {/* STATS — só nas abas de clientes e analytics */}
        {stats && tab !== "equipe" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:28}}>
            {[
              {label:"Total Leads",    val:clients.length,        color:T,  Icon:Users,      bg:"#F0F0F2"},
              {label:"Saúde Média",    val:stats.saudeMedia+"%",  color:G,  Icon:Activity,   bg:GL},
              {label:"ICP Médio",      val:stats.icpMedia+"%",    color:B,  Icon:Target,     bg:BL},
              {label:"Assessoria",     val:stats.assCount,        color:O,  Icon:BadgeCheck, bg:OL},
              {label:"Implementação",  val:stats.implCount,       color:Y,  Icon:Settings2,  bg:YL},
            ].map(({Icon,...st}) => (
              <div key={st.label} style={{background:C,borderRadius:14,padding:"16px 18px",border:`1px solid ${BD}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{width:36,height:36,borderRadius:10,background:st.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                  <Icon size={17} color={st.color} strokeWidth={1.8}/>
                </div>
                <div style={{fontSize:22,fontWeight:900,color:st.color,lineHeight:1}}>{st.val}</div>
                <div style={{fontSize:11,color:T3,marginTop:4,fontWeight:500}}>{st.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: CLIENTES ──────────────────────────────────────────── */}
        {tab==="clientes" && (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:12,flexWrap:"wrap"}}>
              <h2 style={{fontSize:17,fontWeight:800,color:T,margin:0}}>
                {loading ? "Carregando..." : `${filtered.length} ${filtered.length===1?"cliente":"clientes"}`}
              </h2>
              <div style={{position:"relative",width:280}}>
                <Search size={14} color={T3} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                <input
                  value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Buscar por nome, clínica ou cidade..."
                  style={{padding:"9px 16px 9px 34px",borderRadius:10,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,width:"100%",outline:"none",background:C,boxSizing:"border-box"}}
                />
              </div>
            </div>

            {loading && (
              <div style={{textAlign:"center",padding:"60px 0",color:T3,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <Activity size={16} color={T3} style={{animation:"spin 1s linear infinite"}}/>Carregando clientes...
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {!loading && filtered.map(c => {
                const res   = analyze(c);
                const total = Object.values(res.scores).reduce((a,b)=>a+b,0);
                const maxT  = Object.values(res.maxS).reduce((a,b)=>a+b,0);
                const saude = Math.round(total/maxT*100);
                const nv    = nivelFn(saude);
                const icp   = analyzeICP(c);
                const dt    = c._created_at ? new Date(c._created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}) : "—";
                const planoContratado = c.meta_info?.plano_contratado;

                return (
                  <a key={c._clienteId} href={`/dashboard/${c._clienteId}`}
                    style={{background:C,borderRadius:14,padding:"16px 22px",border:`1px solid ${BD}`,display:"flex",alignItems:"center",gap:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",transition:"all 0.2s",textDecoration:"none",cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.09)";e.currentTarget.style.borderColor=OB;}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";e.currentTarget.style.borderColor=BD;}}>
                    <div style={{width:42,height:42,borderRadius:11,background:OL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:O,flexShrink:0}}>
                      {(c.nome_clinica||"?")[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:14,fontWeight:700,color:T}}>{c.nome_clinica}</span>
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:nv.bg,color:nv.color}}>Saúde {saude}%</span>
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:`${icp.prodCor}18`,color:icp.prodCor}}>
                          ICP {icp.icpPct}%{icp.plano?` · ${icp.plano}`:""}
                        </span>
                        {planoContratado && <span style={{fontSize:11,fontWeight:600,padding:"2px 9px",borderRadius:20,background:OL,color:O}}>{planoContratado}</span>}
                        {c._diagCount > 1 && <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:BL,color:B}}>{c._diagCount} diagnósticos</span>}
                      </div>
                      <div style={{fontSize:12,color:T3,marginTop:3}}>
                        {c.responsavel}{c.cidade_estado?` · ${c.cidade_estado}`:""}
                      </div>
                    </div>
                    <div style={{flexShrink:0,textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:700,color:G}}>{c.fat_atual||"—"}</div>
                      <div style={{fontSize:11,color:T3,marginTop:2}}>{icp.produto}{icp.plano?` ${icp.plano}`:""}</div>
                    </div>
                    <span style={{fontSize:11,color:T3,flexShrink:0}}>{dt}</span>
                    <ChevronRight size={16} color={T3} strokeWidth={1.8}/>
                  </a>
                );
              })}
            </div>
          </>
        )}

        {/* ── TAB: ANALYTICS ─────────────────────────────────────────── */}
        {tab==="analytics" && stats && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>DISTRIBUIÇÃO POR PRODUTO</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  {label:"Implementação", color:O, count:clients.filter(c=>analyzeICP(c).produto==="Implementação").length},
                  {label:"Starter",       color:G, count:clients.filter(c=>{const i=analyzeICP(c);return i.produto==="Assessoria"&&i.plano==="Starter";}).length},
                  {label:"Scale",         color:B, count:clients.filter(c=>{const i=analyzeICP(c);return i.produto==="Assessoria"&&i.plano==="Scale";}).length},
                ].map(p => (
                  <div key={p.label} style={{padding:"16px",borderRadius:12,background:BG,border:`1.5px solid ${p.color}33`,textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:900,color:p.color}}>{p.count}</div>
                    <div style={{fontSize:12,color:T2,marginTop:4}}>{p.label}</div>
                    <div style={{fontSize:11,color:T3,marginTop:2}}>{clients.length?Math.round(p.count/clients.length*100):0}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:16}}>SAÚDE MÉDIA POR ÁREA</div>
              {[
                {k:"comercial",  label:"Comercial",   Icon:Target,    color:"#E91E63"},
                {k:"marketing",  label:"Marketing",   Icon:Sparkles,  color:B},
                {k:"operacional",label:"Operacional", Icon:Settings2, color:Y},
                {k:"financeiro", label:"Financeiro",  Icon:TrendingUp,color:G},
              ].map(({Icon,...cfg}) => {
                const avg = clients.length ? Math.round(clients.reduce((s,c) => {
                  const r=analyze(c); return s+Math.round(r.scores[cfg.k]/r.maxS[cfg.k]*100);
                },0)/clients.length) : 0;
                return (
                  <div key={cfg.k} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:600,color:T,display:"flex",alignItems:"center",gap:7}}>
                        <Icon size={14} color={cfg.color} strokeWidth={1.8}/>{cfg.label}
                      </span>
                      <span style={{fontSize:13,fontWeight:700,color:cfg.color}}>{avg}%</span>
                    </div>
                    <Bar pct={avg} color={cfg.color} height={7}/>
                  </div>
                );
              })}
            </div>

            <div style={{background:C,borderRadius:20,padding:24,border:`1px solid ${BD}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                <Trophy size={12} color={Y}/>TOP LEADS POR ICP SCORE
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {[...clients].sort((a,b)=>analyzeICP(b).icpPct-analyzeICP(a).icpPct).slice(0,5).map((c,i)=>{
                  const icp = analyzeICP(c);
                  return (
                    <a key={c._clienteId} href={`/dashboard/${c._clienteId}`}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:10,background:BG,textDecoration:"none",border:`1px solid ${BD}`,transition:"border-color 0.2s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=OB}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=BD}>
                      <span style={{fontSize:13,fontWeight:800,color:T3,width:20,textAlign:"center"}}>{i+1}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:T}}>{c.nome_clinica}</div>
                        <div style={{fontSize:11,color:T3}}>{c.cidade_estado}</div>
                      </div>
                      <span style={{fontSize:14,fontWeight:800,color:icp.prodCor}}>{icp.icpPct}%</span>
                      <span style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:`${icp.prodCor}18`,color:icp.prodCor,fontWeight:600}}>
                        {icp.produto}{icp.plano?` ${icp.plano}`:""}
                      </span>
                      <ChevronRight size={14} color={T3} strokeWidth={1.8}/>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: EQUIPE ────────────────────────────────────────────── */}
        {tab==="equipe" && <EquipeTab/>}

      </div>
    </div>
  );
}

// ─── APP COM LOGIN ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const [authed,  setAuthed]  = useState(false);
  const [pass,    setPass]    = useState("");
  const [passErr, setPassErr] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("axis-authed") === "1") {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: clientesData, error: cErr } = await supabase
          .from("clientes")
          .select("id, created_at, nome_clinica, responsavel, cidade, whatsapp, meta")
          .order("created_at", { ascending: false });
        if (cErr || !clientesData) { setLoading(false); return; }

        const { data: diagsData } = await supabase
          .from("diagnosticos")
          .select("id, cliente_id, created_at, data, periodo, versao")
          .order("created_at", { ascending: false });

        const diagsByCliente = {};
        (diagsData || []).forEach(d => {
          if (!diagsByCliente[d.cliente_id]) diagsByCliente[d.cliente_id] = [];
          diagsByCliente[d.cliente_id].push(d);
        });

        const merged = clientesData.map(c => {
          const diags = diagsByCliente[c.id] || [];
          const latest = diags[0];
          return {
            _clienteId: c.id,
            _created_at: c.created_at,
            _diagCount: diags.length,
            _latestDiagId: latest?.id,
            nome_clinica: c.nome_clinica,
            responsavel: c.responsavel,
            cidade_estado: c.cidade,
            whatsapp: c.whatsapp,
            meta_info: c.meta,
            ...(latest?.data || {}),
          };
        });
        setClients(merged);
      } catch(e) { setClients([]); }
      setLoading(false);
    })();
  }, []);

  const handleLogin = () => {
    if (pass === TEAM_PASS) {
      sessionStorage.setItem("axis-authed", "1");
      setAuthed(true); setPassErr(false);
    } else {
      setPassErr(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("axis-authed");
    setAuthed(false);
    setPass("");
  };

  if (authed) return <DashboardMain clients={clients} loading={loading} onLogout={handleLogout}/>;

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C,borderRadius:24,padding:"44px 38px",maxWidth:360,width:"100%",border:`1px solid ${BD}`,boxShadow:"0 8px 48px rgba(0,0,0,0.08)",textAlign:"center"}}>
        <div style={{width:52,height:52,borderRadius:14,background:OL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Shield size={24} color={O}/>
        </div>
        <div style={{fontSize:30,fontWeight:900,letterSpacing:1,marginBottom:4}}>
          <span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span>
        </div>
        <div style={{fontSize:11,color:T3,letterSpacing:2,fontWeight:600,marginBottom:28}}>DASHBOARD INTERNO</div>
        <input
          type="password" value={pass}
          onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          placeholder="Senha de acesso"
          style={{width:"100%",boxSizing:"border-box",padding:"13px 16px",marginBottom:10,borderRadius:12,border:`1.5px solid ${passErr?R:BD}`,background:"#FAFAFA",color:T,fontFamily:"inherit",fontSize:14,outline:"none"}}
          autoFocus
        />
        <button onClick={handleLogin}
          style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${O},#FF6030)`,color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:14,boxShadow:`0 4px 16px ${O}44`}}>
          Entrar
        </button>
        {passErr && <p style={{color:R,fontSize:12,marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><AlertCircle size={12}/>Senha incorreta</p>}
        {loading && <p style={{color:T3,fontSize:12,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Activity size={12} color={T3}/>Carregando...</p>}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Users, BarChart3, Target, Settings2, Activity, BadgeCheck,
  Search, ArrowLeft, Shield, AlertCircle, Trophy, Sparkles,
  TrendingUp, ChevronRight, UserPlus, Pencil, Trash2, Check, X,
  UserCheck, UserX, Mail, LogOut, Star, Moon, Sun, Lock, Key
} from "lucide-react";
import { analyze, analyzeICP, nivelFn, fmtR } from "@/lib/analysis";

// ─── CORES FIXAS ──────────────────────────────────────────────────────────
const O="#FF4500", G="#00C853", R="#E53935", Y="#FF9800", B="#2196F3";

function mk(dark) {
  return {
    O, G, R, Y, B,
    OL: dark?"#2D1500":"#FFF4F0", OB: dark?"#4D2500":"#FFD4C4",
    GL: dark?"#002A10":"#E8F9EF",
    RL: dark?"#2A0000":"#FFEBEE",
    YL: dark?"#2D1600":"#FFF8E1",
    BL: dark?"#001840":"#E3F2FD",
    T:  dark?"#F0EFF8":"#1A1A1A",
    T2: dark?"#9896B0":"#6B6B6B",
    T3: dark?"#4A4860":"#999999",
    BD: dark?"#23253A":"#E8E8E8",
    BG: dark?"#0C0E18":"#F4F5F7",
    C:  dark?"#131520":"#FFFFFF",
    IB: dark?"#1A1C2C":"#F5F5F5",
    DK: dark?"#F0EFF8":"#1A1A1A",
  };
}

const ROLES = ["Gestor","Consultor","CS","SDR","Analista","Financeiro","Outro"];

function Bar({ pct, color, height=8 }) {
  return (
    <div style={{height,background:"#EEE",borderRadius:10,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:10,transition:"width 0.8s ease"}}/>
    </div>
  );
}

// ─── ABA EQUIPE ────────────────────────────────────────────────────────────
function EquipeTab({ dark, userRole }) {
  const {O,OL,OB,G,GL,R,RL,Y,YL,B,BL,T,T2,T3,BD,BG,C} = mk(dark);
  const [membros,    setMembros]    = useState([]);
  const [loading,   setLoading]    = useState(true);
  const [showForm,  setShowForm]   = useState(false);
  const [editId,    setEditId]     = useState(null);
  const [saving,    setSaving]     = useState(false);
  const [confirmDel,setConfirmDel] = useState(null);
  const [err,       setErr]        = useState("");

  const isAdmin = userRole === "admin";
  const emptyForm = { nome:"", email:"", role:"Consultor", password:"", is_admin:false };
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/membros");
    const d   = res.ok ? await res.json() : null;
    setMembros(d?.membros || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew()  { setErr(""); setForm(emptyForm); setEditId(null); setShowForm(true); }
  function openEdit(m){ setErr(""); setForm({ nome:m.nome, email:m.email||"", role:m.role, password:"", is_admin:!!m.is_admin }); setEditId(m.id); setShowForm(true); }
  function cancelForm(){ setShowForm(false); setEditId(null); setForm(emptyForm); setErr(""); }

  async function handleSave() {
    if (!form.nome.trim()) { setErr("Nome é obrigatório"); return; }
    setSaving(true); setErr("");
    const url    = editId ? `/api/membros/${editId}` : "/api/membros";
    const method = editId ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const d      = await res.json();
    if (!res.ok) { setErr(d.error || "Erro ao salvar"); setSaving(false); return; }
    setSaving(false);
    cancelForm();
    load();
  }

  async function toggleAtivo(m) {
    await fetch(`/api/membros/${m.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ nome:m.nome, email:m.email, role:m.role, ativo:!m.ativo, is_admin:!!m.is_admin }),
    });
    setMembros(prev => prev.map(x => x.id===m.id ? {...x, ativo:!x.ativo} : x));
  }

  async function handleDelete(id) {
    await fetch(`/api/membros/${id}`, { method:"DELETE" });
    setConfirmDel(null);
    load();
  }

  const ativos   = membros.filter(m => m.ativo);
  const inativos = membros.filter(m => !m.ativo);
  const roleCor  = { Gestor:O, Consultor:B, CS:G, SDR:"#9C27B0", Analista:Y, Financeiro:"#00BCD4", Outro:T3 };

  function MemberCard({ m }) {
    const cor = roleCor[m.role] || T3;
    return (
      <div style={{background:C,borderRadius:14,padding:"14px 18px",border:`1px solid ${BD}`,display:"flex",alignItems:"center",gap:14,boxShadow:`0 1px 4px rgba(0,0,0,${dark?0.2:0.04})`}}>
        <div style={{width:40,height:40,borderRadius:10,background:`${cor}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:cor,flexShrink:0}}>
          {m.nome[0].toUpperCase()}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:14,fontWeight:700,color:m.ativo?T:T3}}>{m.nome}</span>
            <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:`${cor}22`,color:cor}}>{m.role}</span>
            {m.is_admin && <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:OL,color:O}}>Admin</span>}
            {!m.ativo && <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:RL,color:R}}>Inativo</span>}
            {m.email && m.senha_hash === undefined && !m.email.includes("@") ? null : m.email && (
              <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:GL,color:G,display:"flex",alignItems:"center",gap:3}}>
                <Key size={8}/>Login ativo
              </span>
            )}
          </div>
          {m.email && (
            <div style={{fontSize:12,color:T3,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
              <Mail size={10}/>{m.email}
            </div>
          )}
        </div>
        {isAdmin && (
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={()=>toggleAtivo(m)} title={m.ativo?"Desativar":"Ativar"}
              style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${BD}`,background:C,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12,color:m.ativo?R:G,fontFamily:"inherit"}}>
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
                <button onClick={()=>setConfirmDel(null)} style={{padding:"4px 8px",borderRadius:6,border:`1px solid ${BD}`,background:C,cursor:"pointer",fontSize:11,color:T}}>Não</button>
              </div>
            ) : (
              <button onClick={()=>setConfirmDel(m.id)} title="Remover"
                style={{padding:"6px 8px",borderRadius:8,border:`1px solid ${BD}`,background:C,cursor:"pointer",color:R}}>
                <Trash2 size={13}/>
              </button>
            )}
          </div>
        )}
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
        {isAdmin && (
          <button onClick={openNew}
            style={{padding:"9px 18px",borderRadius:10,border:"none",background:O,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 12px ${O}44`}}>
            <UserPlus size={14}/>Adicionar membro
          </button>
        )}
      </div>

      {/* Formulário de criação/edição */}
      {showForm && (
        <div style={{background:C,borderRadius:16,padding:"20px 22px",border:`1.5px solid ${OB}`,marginBottom:20,boxShadow:`0 4px 20px ${O}18`}}>
          <div style={{fontSize:13,fontWeight:700,color:T,marginBottom:16}}>{editId?"Editar membro":"Novo membro"}</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:4}}>Nome *</div>
              <input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))}
                placeholder="Nome completo"
                style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,background:C,outline:"none"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:4}}>E-mail (para login)</div>
              <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                placeholder="email@exemplo.com"
                style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,background:C,outline:"none"}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:4}}>Cargo</div>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
                style={{width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,background:C,outline:"none",cursor:"pointer"}}>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:T3,fontWeight:600,marginBottom:4}}>{editId?"Nova senha (deixe em branco para não alterar)":"Senha de acesso"}</div>
              <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                placeholder={editId?"••••••••• (sem alteração)":"Definir senha de login"}
                style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,background:C,outline:"none"}}/>
            </div>
          </div>

          {/* Toggle Admin */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,padding:"10px 14px",borderRadius:10,background:form.is_admin?OL:BG,border:`1px solid ${form.is_admin?OB:BD}`,cursor:"pointer"}}
            onClick={()=>setForm(f=>({...f,is_admin:!f.is_admin}))}>
            <div style={{width:36,height:20,borderRadius:10,background:form.is_admin?O:BD,position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:form.is_admin?18:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:form.is_admin?O:T}}>Acesso Admin</div>
              <div style={{fontSize:11,color:T3}}>Permite gerenciar membros e acessar todos os dados</div>
            </div>
          </div>

          {err && <div style={{fontSize:12,color:R,marginBottom:10,display:"flex",alignItems:"center",gap:4}}><AlertCircle size={12}/>{err}</div>}

          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
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

      {!loading && ativos.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T2,marginBottom:10}}>ATIVOS</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{ativos.map(m=><MemberCard key={m.id} m={m}/>)}</div>
        </div>
      )}

      {!loading && inativos.length > 0 && (
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,color:T3,marginBottom:10}}>INATIVOS</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{inativos.map(m=><MemberCard key={m.id} m={m}/>)}</div>
        </div>
      )}

      {!loading && membros.length===0 && (
        <div style={{textAlign:"center",padding:"60px 0",color:T3}}>
          <Users size={32} color={BD} style={{marginBottom:12}}/>
          <div style={{fontSize:14,fontWeight:600,color:T}}>Nenhum membro cadastrado</div>
          {isAdmin && <div style={{fontSize:12,marginTop:4}}>Clique em "Adicionar membro" para começar</div>}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ───────────────────────────────────────────────────
function DashboardMain({ clients, loading, dark, toggleDark, onLogout, userRole, userName }) {
  const {O,OL,OB,G,GL,R,RL,Y,YL,B,BL,T,T2,T3,BD,BG,C,DK} = mk(dark);
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
    const saudeMedia  = Math.round(clients.reduce((s,c) => {
      const r=analyze(c); const t=Object.values(r.scores).reduce((a,b)=>a+b,0); const m=Object.values(r.maxS).reduce((a,b)=>a+b,0); return s+(t/m*100);
    },0) / clients.length);
    const icpMedia    = Math.round(clients.reduce((s,c) => s+analyzeICP(c).icpPct, 0) / clients.length);
    const axisCount   = clients.filter(c => analyzeICP(c).produto==="Método Axis").length;
    const foraCount   = clients.filter(c => ["Fora do ICP","A Qualificar"].includes(analyzeICP(c).produto)).length;
    const embaixCount = clients.filter(c => c.meta_info?.tipo_cliente==="embaixador").length;
    return { saudeMedia, icpMedia, axisCount, foraCount, embaixCount };
  }, [clients]);

  const TABS = [
    { id:"clientes",  label:"Clientes",  Icon:Users },
    { id:"analytics", label:"Analytics", Icon:BarChart3 },
    { id:"equipe",    label:"Equipe",    Icon:UserCheck },
  ];
  const tabBtn = t => ({
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
      <div style={{background:C,borderBottom:`1px solid ${BD}`,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:10,boxShadow:`0 1px 8px rgba(0,0,0,${dark?0.3:0.04})`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontWeight:900,fontSize:18,letterSpacing:1}}>
            <span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span>
          </span>
          <span style={{fontSize:10,fontWeight:700,color:T3,letterSpacing:2}}>DASHBOARD</span>
        </div>
        <div style={{display:"flex",gap:3,background:dark?"#1A1C2C":"#F0F0F2",borderRadius:10,padding:3}}>
          {TABS.map(t => <button key={t.id} onClick={()=>setTab(t.id)} style={tabBtn(t)}><t.Icon size={14} strokeWidth={1.8}/>{t.label}</button>)}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {userName && <span style={{fontSize:12,color:T3}}>Olá, <b style={{color:T}}>{userName}</b></span>}
          <button onClick={toggleDark} title={dark?"Modo claro":"Modo escuro"}
            style={{padding:"7px 10px",borderRadius:9,border:`1px solid ${BD}`,background:C,cursor:"pointer",color:T2,display:"flex",alignItems:"center"}}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
          <a href="/" style={{fontSize:13,color:T2,textDecoration:"none",padding:"7px 14px",borderRadius:9,border:`1px solid ${BD}`,background:C,display:"flex",alignItems:"center",gap:6}}>
            <ArrowLeft size={14}/>Formulário
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

        {/* STATS */}
        {stats && tab !== "equipe" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:28}}>
            {[
              {label:"Total Clientes", val:clients.length,         color:T,  Icon:Users,      bg:dark?"#1A1C2C":"#F0F0F2"},
              {label:"Saúde Média",    val:stats.saudeMedia+"%",   color:G,  Icon:Activity,   bg:dark?"#002A10":GL},
              {label:"ICP Médio",      val:stats.icpMedia+"%",     color:B,  Icon:Target,     bg:dark?"#001840":BL},
              {label:"Método Axis",    val:stats.axisCount,        color:O,  Icon:BadgeCheck, bg:OL},
              {label:"Embaixadores",   val:stats.embaixCount,      color:Y,  Icon:Star,       bg:YL},
            ].map(({Icon,...st}) => (
              <div key={st.label} style={{background:C,borderRadius:14,padding:"16px 18px",border:`1px solid ${BD}`,boxShadow:`0 1px 4px rgba(0,0,0,${dark?0.2:0.04})`}}>
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
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Buscar por nome, clínica ou cidade..."
                  style={{padding:"9px 16px 9px 34px",borderRadius:10,border:`1.5px solid ${BD}`,fontSize:13,fontFamily:"inherit",color:T,width:"100%",outline:"none",background:C,boxSizing:"border-box"}}/>
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
                const tipoCliente = c.meta_info?.tipo_cliente || "cliente";
                const planoContratado = c.meta_info?.plano_contratado;

                return (
                  <a key={c._clienteId} href={`/dashboard/${c._clienteId}`}
                    style={{background:C,borderRadius:14,padding:"16px 22px",border:`1px solid ${tipoCliente==="embaixador"?"#FFD54F":BD}`,display:"flex",alignItems:"center",gap:16,boxShadow:`0 1px 4px rgba(0,0,0,${dark?0.2:0.04})`,transition:"all 0.2s",textDecoration:"none",cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,${dark?0.4:0.09})`;e.currentTarget.style.borderColor=tipoCliente==="embaixador"?"#FFC107":OB;}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 1px 4px rgba(0,0,0,${dark?0.2:0.04})`;e.currentTarget.style.borderColor=tipoCliente==="embaixador"?"#FFD54F":BD;}}>
                    <div style={{width:42,height:42,borderRadius:11,background:tipoCliente==="embaixador"?YL:OL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:tipoCliente==="embaixador"?Y:O,flexShrink:0}}>
                      {(c.nome_clinica||"?")[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:14,fontWeight:700,color:T}}>{c.nome_clinica}</span>
                        {tipoCliente==="embaixador"
                          ? <span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:YL,color:Y}}><Star size={9} fill={Y} color={Y}/>Embaixador</span>
                          : <span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:BL,color:B}}><UserCheck size={9}/>Cliente</span>
                        }
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:nv.bg,color:nv.color}}>Saúde {saude}%</span>
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20,background:`${icp.prodCor}22`,color:icp.prodCor}}>ICP {icp.icpPct}%</span>
                        {planoContratado && <span style={{fontSize:11,fontWeight:600,padding:"2px 9px",borderRadius:20,background:OL,color:O}}>{planoContratado}</span>}
                        {c._diagCount > 1 && <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:BL,color:B}}>{c._diagCount} diagnósticos</span>}
                      </div>
                      <div style={{fontSize:12,color:T3,marginTop:3}}>
                        {c.responsavel}{c.cidade_estado?` · ${c.cidade_estado}`:""}
                      </div>
                    </div>
                    <div style={{flexShrink:0,textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:700,color:G}}>{c.fat_atual||"—"}</div>
                      <div style={{fontSize:11,color:T3,marginTop:2}}>{icp.produto}</div>
                    </div>
                    <span style={{fontSize:11,color:T3,flexShrink:0}}>{dt}</span>
                    <ChevronRight size={16} color={T3} strokeWidth={1.8}/>
                  </a>
                );
              })}
              {!loading && filtered.length===0 && (
                <div style={{textAlign:"center",padding:"60px 0",color:T3}}>
                  <Users size={32} color={BD} style={{marginBottom:12}}/>
                  <div style={{fontSize:14,fontWeight:600,color:T}}>Nenhum cliente encontrado</div>
                  <div style={{fontSize:12,marginTop:4}}>Tente outro termo de busca</div>
                </div>
              )}
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
                  {label:"Método Axis",  color:O, count:clients.filter(c=>analyzeICP(c).produto==="Método Axis").length},
                  {label:"Embaixadores", color:Y, count:clients.filter(c=>c.meta_info?.tipo_cliente==="embaixador").length},
                  {label:"Fora do ICP",  color:T3,count:clients.filter(c=>["Fora do ICP","A Qualificar"].includes(analyzeICP(c).produto)).length},
                ].map(p => (
                  <div key={p.label} style={{padding:"16px",borderRadius:12,background:BG,border:`1.5px solid ${p.color}44`,textAlign:"center"}}>
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
                <Trophy size={12} color={Y}/>TOP POR ICP SCORE
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {[...clients].sort((a,b)=>analyzeICP(b).icpPct-analyzeICP(a).icpPct).slice(0,5).map((c,i)=>{
                  const icp=analyzeICP(c);
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
                      <span style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:`${icp.prodCor}22`,color:icp.prodCor,fontWeight:600}}>{icp.produto}</span>
                      <ChevronRight size={14} color={T3} strokeWidth={1.8}/>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: EQUIPE ────────────────────────────────────────────── */}
        {tab==="equipe" && <EquipeTab dark={dark} userRole={userRole}/>}

      </div>
    </div>
  );
}

// ─── APP COM LOGIN ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [authed,   setAuthed]   = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginMode,setLoginMode]= useState("admin"); // "admin" | "member"
  const [pass,     setPass]     = useState("");
  const [email,    setEmail]    = useState("");
  const [passErr,  setPassErr]  = useState("");
  const [loggingIn,setLoggingIn]= useState(false);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [dark,     setDark]     = useState(false);

  // Lê tema salvo e verifica sessão existente
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDark(localStorage.getItem("axis-theme") === "dark");
    }
    fetch("/api/auth")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.authenticated) { setAuthed(true); setUserName(d.name||""); setUserRole(d.role||""); }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  // Carrega clientes quando autenticado
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch("/api/clients")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.clients) setClients(d.clients); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authed]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (typeof window !== "undefined") localStorage.setItem("axis-theme", next ? "dark" : "light");
  }

  async function handleLogin() {
    setPassErr(""); setLoggingIn(true);
    const body = loginMode === "admin"
      ? { password: pass }
      : { email: email.trim(), password: pass };
    try {
      const res = await fetch("/api/auth", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const d   = await res.json();
      if (res.ok) { setAuthed(true); setUserName(d.name||""); setUserRole(d.role||""); }
      else setPassErr(d.error || "Credenciais inválidas");
    } catch { setPassErr("Erro de conexão"); }
    setLoggingIn(false);
  }

  async function handleLogout() {
    await fetch("/api/auth", { method:"DELETE" });
    setAuthed(false); setClients([]); setPass(""); setEmail(""); setUserName(""); setUserRole("");
  }

  if (checking) {
    return (
      <div style={{minHeight:"100vh",background:dark?"#0C0E18":"#F4F5F7",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:32,height:32,borderRadius:"50%",border:"3px solid #FFD4C4",borderTopColor:"#FF4500",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const {O,OL,OB,G,GL,R,RL,Y,YL,B,BL,T,T2,T3,BD,BG,C,DK} = mk(dark);

  if (authed) return <DashboardMain clients={clients} loading={loading} dark={dark} toggleDark={toggleDark} onLogout={handleLogout} userRole={userRole} userName={userName}/>;

  // ── TELA DE LOGIN ──
  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{background:C,borderRadius:24,padding:"44px 38px",maxWidth:380,width:"100%",border:`1px solid ${BD}`,boxShadow:`0 8px 48px rgba(0,0,0,${dark?0.4:0.08})`,textAlign:"center"}}>

        {/* Logo */}
        <div style={{width:52,height:52,borderRadius:14,background:OL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Shield size={24} color={O}/>
        </div>
        <div style={{fontSize:30,fontWeight:900,letterSpacing:1,marginBottom:4}}>
          <span style={{color:O}}>A</span><span style={{color:DK}}>XIS</span>
        </div>
        <div style={{fontSize:11,color:T3,letterSpacing:2,fontWeight:600,marginBottom:28}}>DASHBOARD INTERNO</div>

        {/* Toggle Admin / Equipe */}
        <div style={{display:"flex",background:dark?"#1A1C2C":"#F0F0F2",borderRadius:10,padding:3,marginBottom:20,gap:2}}>
          {[["admin","Admin"],["member","Equipe"]].map(([mode,label]) => (
            <button key={mode} onClick={()=>{setLoginMode(mode);setPassErr("");}}
              style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,transition:"all 0.2s",
                background:loginMode===mode?O:"transparent",
                color:loginMode===mode?"#fff":T2}}>
              {label}
            </button>
          ))}
        </div>

        {/* Campos */}
        {loginMode==="member" && (
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            placeholder="Seu e-mail"
            style={{width:"100%",boxSizing:"border-box",padding:"13px 16px",marginBottom:8,borderRadius:12,border:`1.5px solid ${passErr?R:BD}`,background:BG,color:T,fontFamily:"inherit",fontSize:14,outline:"none"}}
            autoFocus={loginMode==="member"}/>
        )}
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          placeholder={loginMode==="admin"?"Senha admin":"Sua senha"}
          style={{width:"100%",boxSizing:"border-box",padding:"13px 16px",marginBottom:10,borderRadius:12,border:`1.5px solid ${passErr?R:BD}`,background:BG,color:T,fontFamily:"inherit",fontSize:14,outline:"none"}}
          autoFocus={loginMode==="admin"}/>

        <button onClick={handleLogin} disabled={loggingIn}
          style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${O},#FF6030)`,color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:14,boxShadow:`0 4px 16px ${O}44`,opacity:loggingIn?0.7:1}}>
          {loggingIn ? "Entrando..." : "Entrar"}
        </button>

        {passErr && (
          <p style={{color:R,fontSize:12,marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <AlertCircle size={12}/>{passErr}
          </p>
        )}

        {/* Toggle tema */}
        <button onClick={toggleDark}
          style={{marginTop:20,background:"none",border:"none",cursor:"pointer",color:T3,display:"flex",alignItems:"center",gap:5,fontSize:12,margin:"20px auto 0",fontFamily:"inherit"}}>
          {dark ? <Sun size={13}/> : <Moon size={13}/>}
          {dark ? "Modo claro" : "Modo escuro"}
        </button>
      </div>
    </div>
  );
}

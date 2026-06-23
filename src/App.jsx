import { useState, useEffect, useRef, useCallback } from "react";

/* ─── PALETA ─── */
const C = {
  b50:"#f0f5ff", b100:"#dce8ff", b200:"#b8d0ff", b300:"#85aeff",
  b400:"#4f83f7", b500:"#2d63e8", b600:"#1e4fd4", b700:"#1a3eab",
  b800:"#1a3282", b900:"#111e52", b950:"#0a1230",
  ink:"#0d1626", ink2:"#2a3a5c", ink3:"#4a5f82", ink4:"#7a90b0", ink5:"#a8bcd4",
  border:"#dce8ff", border2:"#b8d0ff", surface:"#f8faff", white:"#ffffff",
};

/* ─── ESTILOS GLOBAIS ─── */
const G = {
  screen: { position:"fixed", inset:0, display:"flex" },
  card: { background:C.white, border:`1px solid ${C.border}`, borderRadius:14,
    padding:"1.125rem 1.25rem", boxShadow:`0 1px 3px rgba(30,79,212,0.07),0 4px 16px rgba(30,79,212,0.05)` },
  label: { fontSize:11, fontWeight:600, color:C.b600, textTransform:"uppercase",
    letterSpacing:"0.6px", display:"flex", alignItems:"center", gap:6, marginBottom:"0.75rem" },
  inputBase: { width:"100%", padding:"9px 11px", border:`1px solid ${C.border}`, borderRadius:9,
    background:C.white, color:C.ink, fontSize:13, fontFamily:"Roboto, sans-serif",
    outline:"none", boxSizing:"border-box" },
  btn: { display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"11px 18px", border:"none", borderRadius:9, cursor:"pointer",
    fontSize:13.5, fontWeight:500, fontFamily:"Roboto, sans-serif",
    background:`linear-gradient(135deg,${C.b500},${C.b700})`, color:C.white,
    boxShadow:"0 4px 16px rgba(45,99,232,0.35)", transition:"opacity 0.2s" },
  btnSec: { display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
    border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer",
    fontSize:12.5, fontWeight:500, fontFamily:"Roboto, sans-serif",
    background:C.surface, color:C.ink3 },
};

/* ─── CREDENCIAIS DEMO ─── */
const USERS = [
  { email:"demo@livus.vet", senha:"demo123", nome:"Dr. Demo" },
  { email:"vet@clinica.com", senha:"123456", nome:"Dra. Ana Paula" },
];

/* ─── ÍCONES SVG ─── */
const Icon = ({ d, size=15, color="currentColor", sw=1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

const LogoMark = ({ size=32 }) => (
  <div style={{ width:size, height:size, borderRadius:size*0.3,
    background:`linear-gradient(135deg,${C.b500},${C.b700})`,
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 3px 10px rgba(45,99,232,0.4)", flexShrink:0 }}>
    <svg width={size*0.55} height={size*0.55} viewBox="0 0 22 22" fill="none">
      <path d="M11 2C7.5 2 4.5 4.7 4.5 8.2c0 2.6 1.5 4.8 3.7 6L11 18.5l2.8-4.3c2.2-1.2 3.7-3.4 3.7-6C17.5 4.7 14.5 2 11 2z" stroke="white" strokeWidth="1.4"/>
      <circle cx="11" cy="8.2" r="2.3" fill="white"/>
    </svg>
  </div>
);

const Spin = ({ color=C.b500, size=18 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%",
    border:`2px solid ${C.b100}`, borderTopColor:color,
    animation:"spin 0.7s linear infinite", flexShrink:0 }}/>
);

/* ─── HOOK: PDF ─── */
function usePdf() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setName(file.name); setLoading(true); setText(""); setPreview("");
    try {
      const ab = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
      let txt = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        txt += c.items.map(s => s.str).join(" ") + "\n";
      }
      const full = txt.trim().slice(0, 6000);
      setText(full);
      setPreview(full.slice(0, 320) + (full.length > 320 ? "…" : ""));
    } catch(e) { setPreview("Erro ao ler PDF."); }
    setLoading(false);
  }, []);

  const clear = useCallback(() => { setText(""); setName(""); setPreview(""); }, []);
  return { text, name, preview, loading, load, clear };
}

/* ═══════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════ */
export default function App() {
  const [pdfjsReady, setPdfjsReady] = useState(!!window.pdfjsLib);
  const [screen, setScreen] = useState("login"); // login | app | result
  useEffect(() => {
    if (window.pdfjsLib) { setPdfjsReady(true); return; }
    const s1 = document.createElement("script");
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s1.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfjsReady(true);
    };
    document.head.appendChild(s1);
  }, []);

  const [user, setUser] = useState(null);
  const [historico, setHistorico] = useState(() =>
    JSON.parse(localStorage.getItem("livus_hist_v3") || "[]")
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(null);

  const saveHist = (list) => {
    setHistorico(list);
    localStorage.setItem("livus_hist_v3", JSON.stringify(list));
  };

  const onLogin = (u) => { setUser(u); setScreen("app"); };
  const onLogout = () => { setUser(null); setScreen("login"); };

  const onResult = (entry) => { setActiveResult(entry); setScreen("result"); };
  const onBack = () => setScreen("app");

  const onDelete = (id) => saveHist(historico.filter(h => h.id !== id));

  const onNew = (entry) => {
    const list = [entry, ...historico];
    saveHist(list);
    setSheetOpen(false);
    setActiveResult(entry);
    setScreen("result");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Roboto', sans-serif; }
        body { background: ${C.b950}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${C.b400} !important; }
        select { appearance: none; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.b200}; border-radius: 10px; }
      `}</style>

      {screen === "login" && <LoginScreen onLogin={onLogin} />}
      {screen === "app" && (
        <>
          <AppScreen user={user} historico={historico} onLogout={onLogout}
            onOpenSheet={() => setSheetOpen(true)} onResult={onResult} onDelete={onDelete} />
          <SideSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onDone={onNew} />
        </>
      )}
      {screen === "result" && activeResult && (
        <ResultScreen entry={activeResult} onBack={onBack} />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGIN SCREEN
═══════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("demo@livus.vet");
  const [senha, setSenha] = useState("demo123");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErro(""); setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const u = USERS.find(u => u.email === email && u.senha === senha);
    if (u) { onLogin(u); }
    else { setErro("E-mail ou senha incorretos."); setLoading(false); }
  };

  return (
    <div style={{ ...G.screen, alignItems:"center", justifyContent:"center",
      background:C.b950, overflow:"hidden" }}>
      {/* BG */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:`radial-gradient(ellipse 80% 60% at 20% 10%, rgba(45,99,232,0.35) 0%, transparent 60%),
          radial-gradient(ellipse 60% 80% at 85% 80%, rgba(79,131,247,0.2) 0%, transparent 55%)`}} />
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        backgroundImage:`linear-gradient(rgba(79,131,247,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(79,131,247,0.06) 1px, transparent 1px)`,
        backgroundSize:"48px 48px" }} />

      <div style={{ position:"relative", zIndex:1, background:"rgba(255,255,255,0.04)",
        border:"1px solid rgba(79,131,247,0.2)", borderRadius:24,
        backdropFilter:"blur(24px)", padding:"2.75rem 2.5rem",
        width:"100%", maxWidth:420, boxShadow:`0 20px 60px rgba(10,18,48,0.18)`,
        animation:"fadeUp 0.5s ease" }}>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"2rem" }}>
          <LogoMark size={42}/>
          <div>
            <div style={{ fontSize:24, color:C.white, letterSpacing:"-0.5px", fontWeight:500 }}>LIVUS</div>
            <div style={{ fontSize:12, color:"rgba(168,188,212,0.7)", marginTop:1 }}>Diagnóstico veterinário com IA</div>
          </div>
        </div>

        <h1 style={{ fontSize:26, color:C.white, fontWeight:500, marginBottom:6, letterSpacing:"-0.3px" }}>
          Bem-vindo de volta
        </h1>
        <p style={{ fontSize:13.5, color:C.ink5, marginBottom:"2rem", lineHeight:1.5 }}>
          Acesse sua conta para continuar
        </p>

        <LField label="E-MAIL" dark>
          <input style={{ ...G.inputBase, background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(79,131,247,0.2)", color:C.white }}
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handle()} placeholder="vet@clinica.com"/>
        </LField>
        <LField label="SENHA" dark>
          <input type="password" style={{ ...G.inputBase, background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(79,131,247,0.2)", color:C.white }}
            value={senha} onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handle()} placeholder="••••••••"/>
        </LField>

        {erro && <p style={{ fontSize:12.5, color:"#ff6b6b", marginBottom:"0.75rem" }}>{erro}</p>}

        <button onClick={handle} disabled={loading}
          style={{ ...G.btn, width:"100%", marginTop:"0.5rem",
            opacity: loading ? 0.8 : 1 }}>
          {loading ? <Spin color={C.white} size={16}/> : null}
          {loading ? "Entrando…" : "Entrar na plataforma"}
        </button>

        <p style={{ fontSize:11.5, color:"rgba(168,188,212,0.45)", textAlign:"center",
          marginTop:"1rem", lineHeight:1.5 }}>
          Credenciais demo: demo@livus.vet / demo123
        </p>
      </div>
    </div>
  );
}

function LField({ label, children, dark }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block", fontSize:12, fontWeight:500,
        color: dark ? C.ink5 : C.ink4, marginBottom:6, letterSpacing:"0.3px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   APP SCREEN
═══════════════════════════════════════════════════════ */
function AppScreen({ user, historico, onLogout, onOpenSheet, onResult, onDelete }) {
  const [search, setSearch] = useState("");
  const initials = n => (!n || n === "não informado") ? "?" : n.trim().slice(0,2).toUpperCase();

  const lista = historico.filter(h => {
    if (!search) return true;
    const txt = (h.paciente.nome + h.paciente.especie +
      (h.resultado.diferenciais?.map(d => d.nome).join(" ") || "")).toLowerCase();
    return txt.includes(search.toLowerCase());
  });

  return (
    <div style={{ ...G.screen, flexDirection:"column", background:C.surface }}>
      {/* Topbar */}
      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 1.75rem", flexShrink:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <LogoMark size={32}/>
          <div>
            <div style={{ fontSize:19, color:C.b900, fontWeight:500, letterSpacing:"-0.4px" }}>LIVUS</div>
            <div style={{ fontSize:11, color:C.ink4, marginTop:1 }}>Diagnóstico veterinário com IA</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.b400},${C.b600})`,
            color:C.white, fontSize:12, fontWeight:500,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {initials(user?.nome)}
          </div>
          <span style={{ fontSize:13, color:C.ink2, fontWeight:500 }}>{user?.nome}</span>
          <button onClick={onLogout} style={{ ...G.btnSec, fontSize:12 }}>Sair</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"2rem 1.75rem" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.5rem" }}>
          <div>
            <h1 style={{ fontSize:24, color:C.b900, fontWeight:500, letterSpacing:"-0.4px" }}>
              Histórico de análises
            </h1>
            <p style={{ fontSize:13, color:C.ink4, marginTop:4 }}>
              {historico.length} análise{historico.length !== 1 ? "s" : ""} salva{historico.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onOpenSheet} style={{ ...G.btn, flexShrink:0 }}>
            <Icon d="M12 5v14M5 12h14" sw={2.2}/>
            Nova análise
          </button>
        </div>

        {/* Search */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          background:C.white, border:`1px solid ${C.border}`, borderRadius:9,
          padding:"0 14px", marginBottom:"1.25rem" }}>
          <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" color={C.ink5}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, espécie ou diagnóstico..."
            style={{ flex:1, padding:"10px 0", background:"none", border:"none",
              fontSize:13.5, color:C.ink, fontFamily:"Roboto, sans-serif", outline:"none" }}/>
        </div>

        {/* Grid */}
        {lista.length === 0 ? (
          <div style={{ textAlign:"center", padding:"5rem 1rem" }}>
            <div style={{ width:60, height:60, borderRadius:"50%",
              background:C.b50, border:`1px solid ${C.border2}`,
              display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
              <Icon d="M12 8v4l3 3M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" color={C.b300} size={24} sw={1.5}/>
            </div>
            <h3 style={{ fontSize:15, color:C.ink2, marginBottom:8 }}>
              {historico.length === 0 ? "Nenhuma análise ainda" : "Nenhum resultado encontrado"}
            </h3>
            <p style={{ fontSize:13.5, color:C.ink4, lineHeight:1.6 }}>
              {historico.length === 0
                ? 'Clique em "Nova análise" para começar.'
                : "Tente outro termo de busca."}
            </p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:"1rem" }}>
            {lista.map(h => (
              <HCard key={h.id} h={h} onView={() => onResult(h)} onDelete={() => onDelete(h.id)}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HCard({ h, onView, onDelete }) {
  const [hov, setHov] = useState(false);
  const initials = n => (!n || n === "não informado") ? "?" : n.trim().slice(0,2).toUpperCase();
  const difs = h.resultado.diferenciais?.slice(0,2) || [];

  return (
    <div onClick={onView}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:C.white, border:`1px solid ${hov ? C.b300 : C.border}`,
        borderRadius:14, padding:"1.125rem 1.25rem", cursor:"pointer",
        boxShadow: hov ? `0 8px 32px rgba(30,79,212,0.13)` : `0 1px 3px rgba(30,79,212,0.07)`,
        transform: hov ? "translateY(-2px)" : "none", transition:"all 0.2s" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:"0.875rem" }}>
        <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0,
          background:`linear-gradient(135deg,${C.b400},${C.b600})`,
          color:C.white, fontSize:14, fontWeight:500,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {initials(h.paciente.nome)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, color:C.ink, marginBottom:3 }}>
            {h.paciente.nome || "Paciente"}
          </div>
          <div style={{ fontSize:12, color:C.ink4 }}>
            {h.paciente.especie || "—"} · {h.paciente.raca || "—"} · {h.paciente.idade || "—"}
          </div>
        </div>
        <div style={{ fontSize:11, color:C.ink5, whiteSpace:"nowrap" }}>{h.data}</div>
      </div>
      <div style={{ fontSize:12.5, color:C.ink3, lineHeight:1.55, marginBottom:"0.625rem" }}>
        {(h.paciente.queixa || "").slice(0,100)}{(h.paciente.queixa||"").length > 100 ? "…" : ""}
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"0.75rem" }}>
        {difs.map((d,i) => (
          <span key={i} style={{ background:C.b50, border:`1px solid ${C.border2}`,
            borderRadius:20, padding:"3px 10px", fontSize:11.5, color:C.b700 }}>
            {d.nome}
          </span>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={e => { e.stopPropagation(); onView(); }}
          style={{ ...G.btnSec, fontSize:11.5, padding:"5px 12px" }}>
          Ver análise
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ ...G.btnSec, fontSize:11.5, padding:"5px 12px", color:"#a32d2d" }}>
          Remover
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SIDE SHEET
═══════════════════════════════════════════════════════ */
function SideSheet({ open, onClose, onDone }) {
  const pdf = usePdf();
  const fileRef = useRef();
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({ nome:"", especie:"", raca:"", idade:"", sexo:"", peso:"", queixa:"" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const ready = pdf.text && form.especie && form.queixa.trim();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const reset = () => {
    pdf.clear();
    setForm({ nome:"", especie:"", raca:"", idade:"", sexo:"", peso:"", queixa:"" });
    setErro(""); setLoading(false);
  };

  const close = () => { if (!loading) { onClose(); reset(); } };

  const gerar = async () => {
    setLoading(true); setErro("");
    const paciente = {
      nome: form.nome || "não informado",
      especie: form.especie,
      raca: form.raca || "não informada",
      idade: form.idade || "não informada",
      sexo: form.sexo || "não informado",
      peso: form.peso || "não informado",
      queixa: form.queixa.trim(),
    };

    // Limpa o texto do PDF para não quebrar o JSON (remove caracteres de controle)
    const pdfSafe = pdf.text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ").slice(0, 4000);

    const prompt = `Você é o LIVUS, sistema de apoio ao diagnóstico laboratorial veterinário.

PACIENTE: Nome: ${paciente.nome} | Espécie: ${paciente.especie} | Raça: ${paciente.raca} | Idade: ${paciente.idade} | Sexo: ${paciente.sexo} | Peso: ${paciente.peso} kg
QUEIXA: ${paciente.queixa}
EXAME (${pdf.name}): ${pdfSafe}

Retorne SOMENTE um objeto JSON, sem markdown, sem texto fora do JSON, sem quebras de linha dentro de strings. Use este schema exato:
{"resumo":"string","interpretacao":"string","diferenciais":[{"n":1,"nome":"string","just":"string"},{"n":2,"nome":"string","just":"string"},{"n":3,"nome":"string","just":"string"}],"complementares":["string","string","string"],"refs":["string","string"]}`;

    try {
      const res = await fetch("/api/diagnostico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
},
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1400,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }
      const fullText = data.content
        .map(b => b.type === "text" ? b.text : "")
        .filter(Boolean).join("");

      // Extrai apenas o bloco JSON da resposta
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta sem JSON válido");

      // Sanitiza: remove caracteres de controle que quebram o JSON.parse
      const sanitized = jsonMatch[0]
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
        .replace(/\n/g, " ").replace(/\r/g, " ").replace(/\t/g, " ");

      const r = JSON.parse(sanitized);
      const entry = { id: Date.now(), data: new Date().toLocaleDateString("pt-BR"), paciente, resultado: r };
      reset();
      onDone(entry);
    } catch(e) {
      console.error("LIVUS API error:", e);
      setErro(`Erro: ${e.message}`);
    }
    setLoading(false);
  };

  const inp = (field, opts={}) => ({
    value: form[field],
    onChange: e => set(field, e.target.value),
    style: { ...G.inputBase, ...opts.style },
    ...opts,
  });

  return (
    <>
      {/* Overlay */}
      <div onClick={close} style={{ position:"fixed", inset:0, zIndex:200,
        background:"rgba(10,18,48,0.5)", backdropFilter:"blur(3px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none",
        transition:"opacity 0.3s" }}/>

      {/* Sheet */}
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:520, maxWidth:"95vw",
        background:C.white, zIndex:201, display:"flex", flexDirection:"column",
        boxShadow:"-8px 0 48px rgba(10,18,48,0.18)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.35s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Head */}
        <div style={{ padding:"1.375rem 1.75rem 1.125rem", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span style={{ fontSize:18, color:C.b900, fontWeight:500 }}>Nova análise</span>
          <button onClick={close} disabled={loading}
            style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`,
              background:C.surface, cursor:"pointer", fontSize:18, color:C.ink4,
              display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"1.375rem 1.75rem", display:"flex", flexDirection:"column", gap:"1.125rem" }}>

          {/* Upload */}
          <SheetSection icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" label="Exame laboratorial (PDF)">
            <div onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pdf.load(e.dataTransfer.files[0]); }}
              onClick={() => !pdf.name && fileRef.current.click()}
              style={{ border:`1.5px dashed ${drag ? C.b400 : C.border2}`,
                borderRadius:10, padding:"1.75rem 1rem", textAlign:"center",
                cursor: pdf.name ? "default" : "pointer",
                background: drag ? C.b50 : C.white, transition:"all 0.2s" }}>
              {pdf.loading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:C.b600 }}>
                  <Spin/> Lendo PDF...
                </div>
              ) : (
                <>
                  <div style={{ width:42, height:42, borderRadius:"50%", background:C.b50,
                    border:`1px solid ${C.border2}`, display:"flex", alignItems:"center",
                    justifyContent:"center", margin:"0 auto 0.625rem" }}>
                    <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" color={C.b500} size={18}/>
                  </div>
                  <div style={{ fontSize:13.5, fontWeight:500, color:C.ink, marginBottom:3 }}>Arraste o PDF aqui</div>
                  <div style={{ fontSize:12, color:C.ink4 }}>ou clique para selecionar · PDF até 10 MB</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display:"none" }}
              onChange={e => pdf.load(e.target.files[0])}/>

            {pdf.name && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:"0.625rem",
                background:C.b50, border:`1px solid ${C.border2}`, borderRadius:9, padding:"7px 10px" }}>
                <div style={{ width:28, height:28, borderRadius:7, background:C.b100,
                  color:C.b700, fontSize:10, fontWeight:600,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>PDF</div>
                <span style={{ flex:1, fontSize:12.5, color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pdf.name}</span>
                <span onClick={() => { pdf.clear(); fileRef.current.value=""; }}
                  style={{ width:22, height:22, borderRadius:"50%", display:"flex",
                    alignItems:"center", justifyContent:"center", cursor:"pointer",
                    color:C.ink4, fontSize:16, lineHeight:1 }}>×</span>
              </div>
            )}
            {pdf.preview && (
              <div style={{ marginTop:"0.5rem", background:C.white, border:`1px solid ${C.border}`,
                borderRadius:8, padding:"7px 10px", fontSize:11, color:C.ink4,
                fontFamily:"monospace", lineHeight:1.5, maxHeight:65, overflowY:"auto",
                whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{pdf.preview}</div>
            )}
          </SheetSection>

          {/* Paciente */}
          <SheetSection icon="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" label="Dados do paciente">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.625rem", marginBottom:"0.625rem" }}>
              <div>
                <label style={{ display:"block", fontSize:11.5, color:C.ink4, marginBottom:5 }}>Nome</label>
                <input {...inp("nome")} placeholder="Ex: Thor"/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11.5, color:C.ink4, marginBottom:5 }}>Espécie *</label>
                <select {...inp("especie")} style={{ ...G.inputBase }}>
                  <option value="">Selecionar...</option>
                  <option>Cão</option><option>Gato</option><option>Equino</option><option>Ave</option><option>Outro</option>
                </select>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.625rem", marginBottom:"0.625rem" }}>
              <div>
                <label style={{ display:"block", fontSize:11.5, color:C.ink4, marginBottom:5 }}>Raça</label>
                <input {...inp("raca")} placeholder="Ex: Labrador"/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11.5, color:C.ink4, marginBottom:5 }}>Idade</label>
                <input {...inp("idade")} placeholder="Ex: 4 anos"/>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.625rem" }}>
              <div>
                <label style={{ display:"block", fontSize:11.5, color:C.ink4, marginBottom:5 }}>Sexo</label>
                <select {...inp("sexo")} style={{ ...G.inputBase }}>
                  <option value="">Selecionar...</option>
                  <option>Macho inteiro</option><option>Macho castrado</option>
                  <option>Fêmea inteira</option><option>Fêmea castrada</option>
                </select>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11.5, color:C.ink4, marginBottom:5 }}>Peso (kg)</label>
                <input {...inp("peso")} type="number" placeholder="28.5"/>
              </div>
            </div>
          </SheetSection>

          {/* Queixa */}
          <SheetSection icon="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" label="Queixa principal *" accent>
            <label style={{ display:"block", fontSize:11.5, color:C.b600, fontWeight:500, marginBottom:5 }}>
              Sinais clínicos, duração e contexto
            </label>
            <textarea {...inp("queixa", { style: { ...G.inputBase, resize:"vertical", minHeight:90, lineHeight:1.5,
              borderColor: C.b200, background: C.b50 }})}
              placeholder="Ex: Cão com letargia há 5 dias, mucosas pálidas, hiporexia e perda de peso progressiva..."/>
          </SheetSection>
        </div>

        {/* Footer */}
        <div style={{ padding:"1.125rem 1.75rem", borderTop:`1px solid ${C.border}`, flexShrink:0, background:C.white }}>
          {erro && (
            <div style={{ fontSize:12.5, color:"#a32d2d", background:"#fff5f5",
              border:"1px solid #fcc", borderRadius:8, padding:"8px 12px", marginBottom:"0.75rem" }}>
              {erro}
            </div>
          )}
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0.875rem 1rem",
              background:C.b50, border:`1px solid ${C.border2}`, borderRadius:9,
              fontSize:13, color:C.b700, marginBottom:"0.75rem" }}>
              <Spin/>
              Analisando exame e gerando diagnóstico clínico...
            </div>
          )}
          <button onClick={gerar} disabled={!ready || loading}
            style={{ ...G.btn, width:"100%", opacity: (!ready || loading) ? 0.5 : 1,
              cursor: (!ready || loading) ? "not-allowed" : "pointer" }}>
            {!loading && <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" color="white" sw={2}/>}
            {loading ? "Gerando…" : "Gerar diagnóstico"}
          </button>
        </div>
      </div>
    </>
  );
}

function SheetSection({ icon, label, children, accent }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"1rem 1.125rem" }}>
      <div style={{ ...G.label, color: accent ? C.b600 : C.b600 }}>
        <Icon d={icon} size={13} color={C.b500} sw={2}/>
        {label}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RESULT SCREEN
═══════════════════════════════════════════════════════ */
function ResultScreen({ entry, onBack }) {
  const { paciente: p, resultado: r, data } = entry;
  const initials = n => (!n || n === "não informado") ? "?" : n.trim().slice(0,2).toUpperCase();

  return (
    <div style={{ ...G.screen, flexDirection:"column", background:C.surface, overflowY:"auto" }}>
      {/* Topbar */}
      <div style={{ height:56, background:C.white, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 1.75rem", position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
        <button onClick={onBack} style={{ ...G.btnSec }}>
          <Icon d="M15 18l-6-6 6-6" sw={2}/>
          Voltar ao histórico
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <LogoMark size={26}/>
          <span style={{ fontSize:17, color:C.b900, fontWeight:500 }}>LIVUS</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:820, margin:"0 auto", padding:"2rem 1.75rem", width:"100%" }}>

        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg,${C.b800},${C.b950})`,
          borderRadius:20, padding:"2rem 2.25rem", marginBottom:"1.5rem",
          position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200,
            borderRadius:"50%", background:"radial-gradient(circle,rgba(79,131,247,0.25) 0%,transparent 70%)",
            pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative", zIndex:1 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", flexShrink:0,
              background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)",
              color:C.white, fontSize:18, fontWeight:600,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {initials(p.nome)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:20, color:C.white, fontWeight:500 }}>{p.nome || "Paciente"}</div>
              <div style={{ fontSize:13, color:"rgba(168,188,212,0.8)", marginTop:3 }}>
                {p.especie} · {p.raca} · {p.idade} · {p.sexo} {p.peso !== "não informado" ? `· ${p.peso} kg` : ""}
              </div>
            </div>
            <div style={{ fontSize:12, color:"rgba(168,188,212,0.6)" }}>Análise em {data}</div>
          </div>
          <div style={{ marginTop:"1.125rem", paddingTop:"1.125rem",
            borderTop:"1px solid rgba(255,255,255,0.1)", position:"relative", zIndex:1 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.b300, textTransform:"uppercase",
              letterSpacing:"0.5px", marginBottom:5 }}>Queixa principal</div>
            <div style={{ fontSize:13.5, color:"rgba(255,255,255,0.82)", lineHeight:1.55 }}>{p.queixa}</div>
          </div>
        </div>

        {/* Cards grid 2 col */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
          <RCard label="Resumo dos achados" icon="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z">
            <div style={{ fontSize:13.5, color:C.ink, lineHeight:1.65 }}>{r.resumo}</div>
          </RCard>
          <RCard label="Interpretação clínica" icon="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z">
            <div style={{ fontSize:13.5, color:C.ink, lineHeight:1.65 }}>{r.interpretacao}</div>
          </RCard>
        </div>

        {/* Diferenciais full width */}
        <div style={{ marginBottom:"1rem" }}>
          <RCard label="Diagnósticos diferenciais" icon="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11">
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {r.diferenciais?.map(d => (
                <div key={d.n} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                    background:C.b100, color:C.b700, fontSize:11, fontWeight:600,
                    display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                    {d.n}
                  </div>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:500, color:C.ink }}>{d.nome}</div>
                    <div style={{ fontSize:12, color:C.ink4, lineHeight:1.45, marginTop:2 }}>{d.just}</div>
                  </div>
                </div>
              ))}
            </div>
          </RCard>
        </div>

        {/* Complementares + Refs */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
          <RCard label="Exames complementares" icon="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M12 18v-6M9 15h6">
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {r.complementares?.map((e,i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.b400, flexShrink:0, marginTop:6 }}/>
                  <div style={{ fontSize:13, color:C.ink, lineHeight:1.5 }}>{e}</div>
                </div>
              ))}
            </div>
          </RCard>
          <RCard label="Referências bibliográficas" icon="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z">
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {r.refs?.map((ref,i) => (
                <div key={i} style={{ fontSize:12, color:C.ink4, lineHeight:1.5,
                  paddingBottom:5, borderBottom: i < r.refs.length-1 ? `1px solid ${C.border}` : "none" }}>
                  {ref}
                </div>
              ))}
            </div>
          </RCard>
        </div>

        {/* Disclaimer */}
        <div style={{ background:C.b50, border:`1px solid ${C.border2}`, borderRadius:10,
          padding:"0.875rem 1.125rem", display:"flex", gap:9, alignItems:"flex-start" }}>
          <Icon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01" color={C.b500} size={16} sw={1.7}/>
          <p style={{ fontSize:12, color:C.b700, lineHeight:1.6 }}>
            Sistema de apoio diagnóstico. Resultados gerados por inteligência artificial e devem ser interpretados
            por médico veterinário habilitado. A decisão clínica final é de exclusiva responsabilidade do profissional.
          </p>
        </div>
      </div>
    </div>
  );
}

function RCard({ label, icon, children }) {
  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14,
      padding:"1.125rem 1.25rem",
      boxShadow:"0 1px 3px rgba(30,79,212,0.06),0 4px 16px rgba(30,79,212,0.04)" }}>
      <div style={{ ...G.label }}>
        <Icon d={icon} size={13} color={C.b500} sw={2}/>
        {label}
      </div>
      {children}
    </div>
  );
}

// v4 - Supabase auth + DB
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

/* ─── PALETA ─── */
const C = {
  // Purples
  p50:  "#f5f0ff",
  p100: "#ede5ff",
  p200: "#d9ccff",
  p300: "#b89dff",
  p400: "#9b6fff",
  p500: "#7132F5",
  p600: "#6020e0",
  p700: "#4e18b8",
  p800: "#3c1290",
  p900: "#28096b",
  // Cyan accent
  cyan: "#00c8d4",
  cyanLight: "#e0fafb",
  // Orange-red CTA accent
  orange: "#ff6b35",
  orangeLight: "#fff0ea",
  // Neutrals
  ink:    "#0d0e14",
  ink2:   "#23253a",
  ink3:   "#4a4d6a",
  ink4:   "#7b7e9a",
  ink5:   "#a8aac0",
  // Surfaces
  surface:  "#f7f7fc",
  surface2: "#eeeef7",
  white:    "#ffffff",
  border:   "#e4e4f0",
  border2:  "#d0d0e8",
};

/* ─── ESTILOS GLOBAIS ─── */
const G = {
  screen: { position: "fixed", inset: 0, display: "flex" },
  card: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "1.25rem 1.375rem",
    boxShadow: "0 1px 3px rgba(113,50,245,0.06), 0 6px 24px rgba(113,50,245,0.05)",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: C.p500,
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: "0.875rem",
  },
  inputBase: {
    width: "100%",
    padding: "10px 13px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    background: C.white,
    color: C.ink,
    fontSize: 13.5,
    fontFamily: "Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.18s",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "11px 22px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "Inter, sans-serif",
    background: `linear-gradient(135deg, ${C.p500}, ${C.p700})`,
    color: C.white,
    boxShadow: "0 4px 18px rgba(113,50,245,0.32)",
    transition: "opacity 0.18s, box-shadow 0.18s",
    letterSpacing: "-0.1px",
  },
  btnSec: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    border: `1.5px solid ${C.border2}`,
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "Inter, sans-serif",
    background: C.white,
    color: C.ink3,
    transition: "border-color 0.18s, background 0.18s",
  },
};


/* ─── ÍCONES SVG ─── */
const Icon = ({ d, size = 15, color = "currentColor", sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const LogoMark = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    background: `linear-gradient(135deg, ${C.p400}, ${C.p700})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 3px 12px rgba(113,50,245,0.35)", flexShrink: 0,
  }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 22 22" fill="none">
      <path d="M11 2C7.5 2 4.5 4.7 4.5 8.2c0 2.6 1.5 4.8 3.7 6L11 18.5l2.8-4.3c2.2-1.2 3.7-3.4 3.7-6C17.5 4.7 14.5 2 11 2z"
        stroke="white" strokeWidth="1.4" />
      <circle cx="11" cy="8.2" r="2.3" fill="white" />
    </svg>
  </div>
);

const Spin = ({ color = C.p500, size = 18 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    border: `2px solid ${C.p100}`, borderTopColor: color,
    animation: "spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

/* ─── HOOK: PDF (multi) ─── */
async function extractPdfText(file) {
  const ab = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
  let txt = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
    const pg = await pdf.getPage(i);
    const c = await pg.getTextContent();
    txt += c.items.map(s => s.str).join(" ") + "\n";
  }
  return txt.trim().slice(0, 6000);
}

function usePdfs() {
  const [pdfs, setPdfs] = useState([]); // [{ name, text }]
  const [loading, setLoading] = useState(false);

  const add = useCallback(async (files) => {
    const arr = Array.from(files).filter(f => f.type === "application/pdf");
    if (!arr.length) return;
    setLoading(true);
    const results = await Promise.all(arr.map(async f => ({
      name: f.name,
      text: await extractPdfText(f).catch(() => ""),
    })));
    setPdfs(prev => {
      const existing = new Set(prev.map(p => p.name));
      return [...prev, ...results.filter(r => !existing.has(r.name))];
    });
    setLoading(false);
  }, []);

  const remove = useCallback((name) => setPdfs(prev => prev.filter(p => p.name !== name)), []);
  const clear  = useCallback(() => setPdfs([]), []);

  const combinedText = pdfs.map((p, i) => `[PDF ${i + 1}: ${p.name}]\n${p.text}`).join("\n\n");

  return { pdfs, loading, add, remove, clear, combinedText };
}

/* ═══════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════ */
export default function App() {
  const [pdfjsReady, setPdfjsReady] = useState(!!window.pdfjsLib);
  const [screen, setScreen]         = useState("login");
  const [user, setUser]             = useState(null);
  const [historico, setHistorico]   = useState([]);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

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

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); setScreen("app"); }
      setLoadingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "SIGNED_IN")  { setUser(session.user); setScreen("app"); }
      if (ev === "SIGNED_OUT") { setUser(null); setScreen("login"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load analyses from DB whenever user changes
  useEffect(() => {
    if (!user) { setHistorico([]); return; }
    supabase
      .from("analises")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setHistorico(data.map(row => ({
          id: row.id, data: row.data, paciente: row.paciente, resultado: row.resultado,
        })));
      });
  }, [user]);

  const onLogin   = (u) => { setUser(u); setScreen("app"); };
  const onLogout  = async () => { await supabase.auth.signOut(); };
  const onResult  = (entry) => { setActiveResult(entry); setScreen("result"); };
  const onBack    = () => setScreen("app");
  const onDelete  = async (id) => {
    await supabase.from("analises").delete().eq("id", id);
    setHistorico(h => h.filter(x => x.id !== id));
  };
  const onNew = async (entry) => {
    const { data, error } = await supabase.from("analises").insert({
      user_id:   user.id,
      data:      entry.data,
      paciente:  entry.paciente,
      resultado: entry.resultado,
    }).select().single();
    if (!error && data) {
      const saved = { id: data.id, data: data.data, paciente: data.paciente, resultado: data.resultado };
      setHistorico(h => [saved, ...h]);
      setSheetOpen(false);
      setActiveResult(saved);
      setScreen("result");
    }
  };

  if (loadingSession) return (
    <div style={{ ...G.screen, alignItems: "center", justifyContent: "center", background: C.p900 }}>
      <Spin color={C.p300} size={32} />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background: ${C.surface}; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${C.p400} !important;
          box-shadow: 0 0 0 3px rgba(113,50,245,0.1) !important;
        }
        select { appearance: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.p200}; border-radius: 10px; }
        input::placeholder, textarea::placeholder { color: ${C.ink5}; }
        .dark-input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      {screen === "login"     && <LoginScreen onLogin={onLogin} onGoRegister={() => setScreen("register")} />}
      {screen === "register"  && <RegisterScreen onDone={() => setScreen("login")} onGoLogin={() => setScreen("login")} />}
      {screen === "app"       && (
        <>
          <AppScreen user={user} historico={historico} onLogout={onLogout}
            onOpenSheet={() => setSheetOpen(true)} onResult={onResult} onDelete={onDelete}
            onOpenKnowledge={() => setScreen("knowledge")} />
          <SideSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onDone={onNew} />
        </>
      )}
      {screen === "knowledge" && <KnowledgeScreen onBack={() => setScreen("app")} />}
      {screen === "result"    && activeResult && (
        <ResultScreen entry={activeResult} onBack={onBack} />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   AUTH BG WRAPPER (shared by Login + Register)
═══════════════════════════════════════════════════════ */
function AuthBg({ children }) {
  return (
    <div style={{ ...G.screen, alignItems: "center", justifyContent: "center", background: C.p900, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 65% 55% at 15% 5%,  rgba(155,111,255,0.28) 0%, transparent 65%),
          radial-gradient(ellipse 50% 60% at 90% 95%, rgba(0,200,212,0.15)   0%, transparent 60%),
          radial-gradient(ellipse 40% 35% at 80% 15%, rgba(113,50,245,0.18)  0%, transparent 55%)
        `,
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />
      <div style={{
        position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 22,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        padding: "2.75rem 2.5rem",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 80px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08) inset",
        animation: "fadeUp 0.45s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2.25rem" }}>
          <LogoMark size={44} />
          <div>
            <div style={{ fontSize: 22, color: C.white, letterSpacing: "-0.6px", fontWeight: 700 }}>LIVUS</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Diagnóstico veterinário com IA</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGIN SCREEN
═══════════════════════════════════════════════════════ */
function LoginScreen({ onLogin, onGoRegister }) {
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  const [erro, setErro]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErro(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) { setErro(error.message); setLoading(false); return; }
    onLogin(data.user);
  };

  return (
    <AuthBg>
      <h1 style={{ fontSize: 26, color: C.white, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.5px" }}>
        Bem-vindo de volta
      </h1>
      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)", marginBottom: "2rem", lineHeight: 1.5 }}>
        Acesse sua conta para continuar
      </p>

      <LField label="E-MAIL" dark>
        <input className="dark-input" style={{
          ...G.inputBase, background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)", color: C.white,
        }}
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()}
          placeholder="vet@clinica.com" />
      </LField>
      <LField label="SENHA" dark>
        <input className="dark-input" type="password" style={{
          ...G.inputBase, background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)", color: C.white,
        }}
          value={senha} onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()}
          placeholder="••••••••" />
      </LField>

      {erro && <p style={{ fontSize: 12.5, color: "#ff8080", marginBottom: "0.75rem" }}>{erro}</p>}

      <button onClick={handle} disabled={loading}
        style={{ ...G.btn, width: "100%", marginTop: "0.5rem", opacity: loading ? 0.75 : 1 }}>
        {loading ? <Spin color={C.white} size={16} /> : null}
        {loading ? "Entrando…" : "Entrar na plataforma"}
      </button>

      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "1.5rem" }}>
        Não tem conta?{" "}
        <span onClick={onGoRegister} style={{ color: C.cyan, cursor: "pointer", fontWeight: 600 }}>
          Cadastre-se
        </span>
      </p>
    </AuthBg>
  );
}

/* ═══════════════════════════════════════════════════════
   REGISTER SCREEN
═══════════════════════════════════════════════════════ */
function RegisterScreen({ onDone, onGoLogin }) {
  const [nome, setNome]     = useState("");
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro]     = useState("");
  const [ok, setOk]         = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErro("");
    if (!nome.trim()) { setErro("Informe seu nome."); return; }
    if (senha.length < 6) { setErro("A senha precisa ter ao menos 6 caracteres."); return; }
    if (senha !== confirma) { setErro("As senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: senha,
      options: { data: { nome: nome.trim() } },
    });
    setLoading(false);
    if (error) { setErro(error.message); return; }
    setOk(true);
  };

  if (ok) return (
    <AuthBg>
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(0,200,212,0.15)", border: "2px solid rgba(0,200,212,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
        }}>
          <Icon d="M20 6L9 17l-5-5" color={C.cyan} size={24} sw={2.5} />
        </div>
        <h2 style={{ fontSize: 22, color: C.white, fontWeight: 700, marginBottom: 10 }}>Conta criada!</h2>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: "1.75rem" }}>
          Verifique seu e-mail para confirmar o cadastro, depois faça login.
        </p>
        <button onClick={onGoLogin} style={{ ...G.btn, width: "100%" }}>
          Ir para o login
        </button>
      </div>
    </AuthBg>
  );

  return (
    <AuthBg>
      <h1 style={{ fontSize: 26, color: C.white, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.5px" }}>
        Criar conta
      </h1>
      <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.5)", marginBottom: "2rem", lineHeight: 1.5 }}>
        Preencha os dados abaixo para se cadastrar
      </p>

      <LField label="NOME COMPLETO" dark>
        <input className="dark-input" style={{
          ...G.inputBase, background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)", color: C.white,
        }}
          value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Dr. João Silva" />
      </LField>
      <LField label="E-MAIL" dark>
        <input className="dark-input" style={{
          ...G.inputBase, background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)", color: C.white,
        }}
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="vet@clinica.com" />
      </LField>
      <LField label="SENHA" dark>
        <input className="dark-input" type="password" style={{
          ...G.inputBase, background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)", color: C.white,
        }}
          value={senha} onChange={e => setSenha(e.target.value)}
          placeholder="Mínimo 6 caracteres" />
      </LField>
      <LField label="CONFIRMAR SENHA" dark>
        <input className="dark-input" type="password" style={{
          ...G.inputBase, background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)", color: C.white,
        }}
          value={confirma} onChange={e => setConfirma(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle()}
          placeholder="••••••••" />
      </LField>

      {erro && <p style={{ fontSize: 12.5, color: "#ff8080", marginBottom: "0.75rem" }}>{erro}</p>}

      <button onClick={handle} disabled={loading}
        style={{ ...G.btn, width: "100%", marginTop: "0.5rem", opacity: loading ? 0.75 : 1 }}>
        {loading ? <Spin color={C.white} size={16} /> : null}
        {loading ? "Criando conta…" : "Criar conta"}
      </button>

      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "1.5rem" }}>
        Já tem conta?{" "}
        <span onClick={onGoLogin} style={{ color: C.cyan, cursor: "pointer", fontWeight: 600 }}>
          Fazer login
        </span>
      </p>
    </AuthBg>
  );
}

function LField({ label, dark, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontSize: 11.5, fontWeight: 600,
        color: dark ? "rgba(255,255,255,0.5)" : C.ink3,
        marginBottom: 6, letterSpacing: "0.3px",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   APP SCREEN
═══════════════════════════════════════════════════════ */
function AppScreen({ user, historico, onLogout, onOpenSheet, onResult, onDelete, onOpenKnowledge }) {
  const [search, setSearch] = useState("");
  const initials = n => (!n || n === "não informado") ? "?" : n.trim().slice(0, 2).toUpperCase();

  const lista = historico.filter(h => {
    if (!search) return true;
    const txt = (h.paciente.nome + h.paciente.especie +
      (h.resultado.diferenciais?.map(d => d.nome).join(" ") || "")).toLowerCase();
    return txt.includes(search.toLowerCase());
  });

  return (
    <div style={{ ...G.screen, flexDirection: "column", background: C.surface }}>
      {/* Topbar */}
      <div style={{
        height: 60, background: C.white,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", flexShrink: 0, zIndex: 100,
        boxShadow: "0 1px 0 rgba(113,50,245,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={34} />
          <div>
            <div style={{ fontSize: 18, color: C.ink, fontWeight: 700, letterSpacing: "-0.5px" }}>LIVUS</div>
            <div style={{ fontSize: 10.5, color: C.ink5, marginTop: 0.5 }}>Diagnóstico veterinário com IA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
            color: C.white, fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {initials(user?.user_metadata?.nome || user?.email)}
          </div>
          <span style={{ fontSize: 13.5, color: C.ink2, fontWeight: 500 }}>{user?.user_metadata?.nome || user?.email}</span>
          {user?.email === "danccuriel@gmail.com" && (
            <button onClick={onOpenKnowledge} style={{ ...G.btnSec, fontSize: 12.5, padding: "7px 14px" }}>
              <Icon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01" size={13} color={C.ink3} />
              Base de Conhecimento
            </button>
          )}
          <button onClick={onLogout} style={{ ...G.btnSec, fontSize: 12.5, padding: "7px 14px" }}>Sair</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2.25rem 2rem" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
          <div>
            <h1 style={{ fontSize: 26, color: C.ink, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Histórico de análises
            </h1>
            <p style={{ fontSize: 13.5, color: C.ink4, marginTop: 5 }}>
              {historico.length} análise{historico.length !== 1 ? "s" : ""} salva{historico.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onOpenSheet} style={{ ...G.btn, flexShrink: 0 }}>
            <Icon d="M12 5v14M5 12h14" sw={2.5} color={C.white} />
            Nova análise
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.white, border: `1.5px solid ${C.border}`,
          borderRadius: 10, padding: "0 14px", marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(113,50,245,0.04)",
        }}>
          <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" color={C.ink5} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, espécie ou diagnóstico..."
            style={{
              flex: 1, padding: "11px 0", background: "none", border: "none",
              fontSize: 13.5, color: C.ink, fontFamily: "Inter, sans-serif", outline: "none",
            }} />
        </div>

        {/* Grid */}
        {lista.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: C.p50, border: `1.5px solid ${C.p100}`,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem",
            }}>
              <Icon d="M12 8v4l3 3M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" color={C.p300} size={26} sw={1.5} />
            </div>
            <h3 style={{ fontSize: 16, color: C.ink2, marginBottom: 8, fontWeight: 600 }}>
              {historico.length === 0 ? "Nenhuma análise ainda" : "Nenhum resultado encontrado"}
            </h3>
            <p style={{ fontSize: 13.5, color: C.ink4, lineHeight: 1.6 }}>
              {historico.length === 0
                ? 'Clique em "Nova análise" para começar.'
                : "Tente outro termo de busca."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "1rem" }}>
            {lista.map(h => (
              <HCard key={h.id} h={h} onView={() => onResult(h)} onDelete={() => onDelete(h.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HCard({ h, onView, onDelete }) {
  const [hov, setHov] = useState(false);
  const initials = n => (!n || n === "não informado") ? "?" : n.trim().slice(0, 2).toUpperCase();
  const difs = h.resultado.diferenciais?.slice(0, 2) || [];

  return (
    <div onClick={onView}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: C.white,
        border: `1.5px solid ${hov ? C.p300 : C.border}`,
        borderRadius: 16, padding: "1.25rem 1.375rem", cursor: "pointer",
        boxShadow: hov
          ? "0 8px 32px rgba(113,50,245,0.13)"
          : "0 1px 3px rgba(113,50,245,0.05)",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all 0.2s ease",
      }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "0.875rem" }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
          color: C.white, fontSize: 14, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {initials(h.paciente.nome)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, marginBottom: 3 }}>
            {h.paciente.nome || "Paciente"}
          </div>
          <div style={{ fontSize: 12.5, color: C.ink4 }}>
            {h.paciente.especie || "—"} · {h.paciente.raca || "—"} · {h.paciente.idade || "—"}
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.ink5, whiteSpace: "nowrap" }}>{h.data}</div>
      </div>

      <div style={{ fontSize: 13, color: C.ink3, lineHeight: 1.55, marginBottom: "0.75rem" }}>
        {(h.paciente.queixa || "").slice(0, 100)}{(h.paciente.queixa || "").length > 100 ? "…" : ""}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "0.875rem" }}>
        {difs.map((d, i) => (
          <span key={i} style={{
            background: C.p50, border: `1px solid ${C.p100}`,
            borderRadius: 20, padding: "3px 10px", fontSize: 11.5, color: C.p600, fontWeight: 500,
          }}>
            {d.nome}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={e => { e.stopPropagation(); onView(); }}
          style={{ ...G.btnSec, fontSize: 12, padding: "6px 13px" }}>
          Ver análise
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ ...G.btnSec, fontSize: 12, padding: "6px 13px", color: "#b91c1c", borderColor: "#fca5a5" }}>
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
  const pdfs = usePdfs();
  const fileRef = useRef();
  const [drag, setDrag] = useState(false);
  const [form, setForm] = useState({ nome: "", especie: "", raca: "", idade: "", sexo: "", peso: "", queixa: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const ready = pdfs.pdfs.length > 0 && form.especie && form.queixa.trim();
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const reset = () => {
    pdfs.clear();
    setForm({ nome: "", especie: "", raca: "", idade: "", sexo: "", peso: "", queixa: "" });
    setErro(""); setLoading(false);
  };

  const close = () => { if (!loading) { onClose(); reset(); } };

  const gerar = async () => {
    setLoading(true); setErro("");
    const paciente = {
      nome:    form.nome    || "não informado",
      especie: form.especie,
      raca:    form.raca    || "não informada",
      idade:   form.idade   || "não informada",
      sexo:    form.sexo    || "não informado",
      peso:    form.peso    || "não informado",
      queixa:  form.queixa.trim(),
    };

    const pdfSafe = pdfs.combinedText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .slice(0, 8000);

    const prompt = `Você é o LIVUS, sistema de apoio ao diagnóstico laboratorial veterinário.

PACIENTE: Nome: ${paciente.nome} | Espécie: ${paciente.especie} | Raça: ${paciente.raca} | Idade: ${paciente.idade} | Sexo: ${paciente.sexo} | Peso: ${paciente.peso} kg
QUEIXA: ${paciente.queixa}
EXAMES LABORATORIAIS:
${pdfSafe}

Retorne SOMENTE um objeto JSON, sem markdown, sem texto fora do JSON, sem quebras de linha dentro de strings. Use este schema exato:
{"resumo":"string","interpretacao":"string","diferenciais":[{"n":1,"nome":"string","just":"string"},{"n":2,"nome":"string","just":"string"},{"n":3,"nome":"string","just":"string"}],"complementares":["string","string","string"],"refs":["string","string"]}`;

    try {
      const res = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1400,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`);

      const fullText = data.content
        .map(b => b.type === "text" ? b.text : "")
        .filter(Boolean).join("");

      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Resposta sem JSON válido");

      const sanitized = jsonMatch[0]
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
        .replace(/\n/g, " ").replace(/\r/g, " ").replace(/\t/g, " ");

      const r = JSON.parse(sanitized);
      const entry = { id: Date.now(), data: new Date().toLocaleDateString("pt-BR"), paciente, resultado: r };
      reset();
      onDone(entry);
    } catch (e) {
      console.error("LIVUS API error:", e);
      setErro(`Erro: ${e.message}`);
    }
    setLoading(false);
  };

  const inp = (field, opts = {}) => ({
    value: form[field],
    onChange: e => set(field, e.target.value),
    style: { ...G.inputBase, ...opts.style },
    ...opts,
  });

  return (
    <>
      <div onClick={close} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(13,14,20,0.35)", backdropFilter: "blur(4px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none",
        transition: "opacity 0.3s",
      }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 520, maxWidth: "95vw",
        background: C.white, zIndex: 201,
        display: "flex", flexDirection: "column",
        boxShadow: "-12px 0 56px rgba(113,50,245,0.1), -2px 0 8px rgba(113,50,245,0.06)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* accent top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.p500}, ${C.cyan})`, flexShrink: 0 }} />

        {/* Head */}
        <div style={{
          padding: "1.375rem 1.75rem 1.125rem",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <span style={{ fontSize: 18, color: C.ink, fontWeight: 700 }}>Nova análise</span>
            <div style={{ fontSize: 12, color: C.ink5, marginTop: 2 }}>Preencha os dados do paciente</div>
          </div>
          <button onClick={close} disabled={loading} style={{
            width: 34, height: 34, borderRadius: 9,
            border: `1.5px solid ${C.border}`, background: C.surface,
            cursor: "pointer", fontSize: 18, color: C.ink4,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.125rem" }}>

          {/* Upload */}
          <SheetSection icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" label="Exames laboratoriais (PDF)">
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pdfs.add(e.dataTransfer.files); }}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${drag ? C.p400 : C.border2}`,
                borderRadius: 12, padding: "1.5rem 1rem", textAlign: "center",
                cursor: "pointer",
                background: drag ? C.p50 : C.surface,
                transition: "all 0.2s",
              }}>
              {pdfs.loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: C.p600 }}>
                  <Spin /> Lendo PDF...
                </div>
              ) : (
                <>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: C.p50, border: `1.5px solid ${C.p100}`,
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem",
                  }}>
                    <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" color={C.p500} size={18} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Arraste os PDFs aqui</div>
                  <div style={{ fontSize: 12, color: C.ink4 }}>ou clique para selecionar · múltiplos PDFs permitidos</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="application/pdf" multiple style={{ display: "none" }}
              onChange={e => { pdfs.add(e.target.files); e.target.value = ""; }} />

            {pdfs.pdfs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "0.75rem" }}>
                {pdfs.pdfs.map(p => (
                  <div key={p.name} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: C.p50, border: `1px solid ${C.p100}`, borderRadius: 10, padding: "8px 10px",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, background: C.p100,
                      color: C.p700, fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>PDF</div>
                    <span style={{ flex: 1, fontSize: 12.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    <span onClick={() => pdfs.remove(p.name)}
                      style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.ink4, fontSize: 16 }}>
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SheetSection>

          {/* Paciente */}
          <SheetSection icon="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" label="Dados do paciente">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <SField label="Nome"><input {...inp("nome")} placeholder="Ex: Thor" /></SField>
              <SField label="Espécie *">
                <select {...inp("especie")} style={{ ...G.inputBase }}>
                  <option value="">Selecionar...</option>
                  <option>Cão</option><option>Gato</option><option>Equino</option><option>Ave</option><option>Outro</option>
                </select>
              </SField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <SField label="Raça"><input {...inp("raca")} placeholder="Ex: Labrador" /></SField>
              <SField label="Idade"><input {...inp("idade")} placeholder="Ex: 4 anos" /></SField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <SField label="Sexo">
                <select {...inp("sexo")} style={{ ...G.inputBase }}>
                  <option value="">Selecionar...</option>
                  <option>Macho inteiro</option><option>Macho castrado</option>
                  <option>Fêmea inteira</option><option>Fêmea castrada</option>
                </select>
              </SField>
              <SField label="Peso (kg)"><input {...inp("peso")} type="number" placeholder="28.5" /></SField>
            </div>
          </SheetSection>

          {/* Queixa */}
          <SheetSection icon="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" label="Queixa principal *" accent>
            <label style={{ display: "block", fontSize: 12, color: C.p600, fontWeight: 500, marginBottom: 6 }}>
              Sinais clínicos, duração e contexto
            </label>
            <textarea {...inp("queixa", {
              style: {
                ...G.inputBase, resize: "vertical", minHeight: 95, lineHeight: 1.55,
                borderColor: C.p200, background: C.p50,
              }
            })}
              placeholder="Ex: Cão com letargia há 5 dias, mucosas pálidas, hiporexia e perda de peso progressiva..." />
          </SheetSection>
        </div>

        {/* Footer */}
        <div style={{ padding: "1.25rem 1.75rem", borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.white }}>
          {erro && (
            <div style={{
              fontSize: 12.5, color: "#b91c1c", background: "#fef2f2",
              border: "1px solid #fca5a5", borderRadius: 9, padding: "9px 13px", marginBottom: "0.875rem",
            }}>{erro}</div>
          )}
          {loading && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0.875rem 1rem",
              background: C.p50, border: `1px solid ${C.p100}`, borderRadius: 10,
              fontSize: 13, color: C.p700, marginBottom: "0.875rem",
            }}>
              <Spin />
              Analisando exame e gerando diagnóstico clínico...
            </div>
          )}
          <button onClick={gerar} disabled={!ready || loading}
            style={{
              ...G.btn, width: "100%",
              opacity: (!ready || loading) ? 0.45 : 1,
              cursor: (!ready || loading) ? "not-allowed" : "pointer",
            }}>
            {!loading && <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" color="white" sw={2} />}
            {loading ? "Gerando…" : "Gerar diagnóstico"}
          </button>
        </div>
      </div>
    </>
  );
}

function SField({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: C.ink4, fontWeight: 500, marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function SheetSection({ icon, label, children, accent }) {
  return (
    <div style={{
      background: C.surface, border: `1.5px solid ${C.border}`,
      borderRadius: 14, padding: "1.125rem 1.25rem",
    }}>
      <div style={{ ...G.label, color: accent ? C.p500 : C.p500 }}>
        <Icon d={icon} size={13} color={C.p500} sw={2} />
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
  const initials = n => (!n || n === "não informado") ? "?" : n.trim().slice(0, 2).toUpperCase();

  return (
    <div style={{ ...G.screen, flexDirection: "column", background: C.surface, overflowY: "auto" }}>
      {/* Topbar */}
      <div style={{
        height: 60, background: C.white, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
        boxShadow: "0 1px 0 rgba(113,50,245,0.06)",
      }}>
        <button onClick={onBack} style={{ ...G.btnSec }}>
          <Icon d="M15 18l-6-6 6-6" sw={2} />
          Voltar ao histórico
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <LogoMark size={28} />
          <span style={{ fontSize: 17, color: C.ink, fontWeight: 700, letterSpacing: "-0.4px" }}>LIVUS</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "2.25rem 1.75rem", width: "100%" }}>

        {/* Hero card */}
        <div style={{
          background: `linear-gradient(135deg, ${C.p500} 0%, ${C.p800} 100%)`,
          borderRadius: 20, padding: "2.25rem 2.5rem", marginBottom: "1.5rem",
          position: "relative", overflow: "hidden",
        }}>
          {/* decorative circles */}
          <div style={{
            position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,200,212,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: 30, width: 160, height: 160, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
            <div style={{
              width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)",
              color: C.white, fontSize: 18, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {initials(p.nome)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 21, color: C.white, fontWeight: 700, letterSpacing: "-0.3px" }}>{p.nome || "Paciente"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
                {p.especie} · {p.raca} · {p.idade} · {p.sexo}{p.peso !== "não informado" ? ` · ${p.peso} kg` : ""}
              </div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "rgba(255,255,255,0.75)",
            }}>
              Análise em {data}
            </div>
          </div>

          <div style={{
            marginTop: "1.25rem", paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.12)", position: "relative", zIndex: 1,
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(0,200,212,0.9)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
              Queixa principal
            </div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>{p.queixa}</div>
          </div>
        </div>

        {/* 2-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <RCard label="Resumo dos achados" icon="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z">
            <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.65 }}>{r.resumo}</p>
          </RCard>
          <RCard label="Interpretação clínica" icon="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z">
            <p style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.65 }}>{r.interpretacao}</p>
          </RCard>
        </div>

        {/* Diferenciais full width */}
        <div style={{ marginBottom: "1rem" }}>
          <RCard label="Diagnósticos diferenciais" icon="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {r.diferenciais?.map(d => (
                <div key={d.n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${C.p400}, ${C.p600})`,
                    color: C.white, fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
                  }}>
                    {d.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{d.nome}</div>
                    <div style={{ fontSize: 12.5, color: C.ink4, lineHeight: 1.5, marginTop: 3 }}>{d.just}</div>
                  </div>
                </div>
              ))}
            </div>
          </RCard>
        </div>

        {/* Complementares + Refs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <RCard label="Exames complementares" icon="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M12 18v-6M9 15h6">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {r.complementares?.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.p400, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>{e}</div>
                </div>
              ))}
            </div>
          </RCard>
          <RCard label="Referências bibliográficas" icon="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {r.refs?.map((ref, i) => (
                <div key={i} style={{
                  fontSize: 12, color: C.ink4, lineHeight: 1.5,
                  paddingBottom: 6, borderBottom: i < r.refs.length - 1 ? `1px solid ${C.border}` : "none",
                }}>
                  {ref}
                </div>
              ))}
            </div>
          </RCard>
        </div>

        {/* Disclaimer */}
        <div style={{
          background: C.p50, border: `1.5px solid ${C.p100}`, borderRadius: 12,
          padding: "1rem 1.25rem", display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Icon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01" color={C.p500} size={17} sw={1.7} />
          <p style={{ fontSize: 12.5, color: C.p700, lineHeight: 1.65 }}>
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
    <div style={{
      background: C.white, border: `1.5px solid ${C.border}`,
      borderRadius: 16, padding: "1.25rem 1.375rem",
      boxShadow: "0 1px 3px rgba(113,50,245,0.05), 0 4px 16px rgba(113,50,245,0.04)",
    }}>
      <div style={{ ...G.label }}>
        <Icon d={icon} size={13} color={C.p500} sw={2} />
        {label}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KNOWLEDGE SCREEN
═══════════════════════════════════════════════════════ */
function KnowledgeScreen({ onBack }) {
  const [files, setFiles]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag]       = useState(false);
  const [msg, setMsg]         = useState("");
  const fileRef = useRef();

  useEffect(() => { loadFiles(); }, []);

  const authHeader = async () => {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  };

  const loadFiles = async () => {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    if (data.files) setFiles(data.files);
  };

  const upload = async (fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.type === "application/pdf");
    if (!pdfs.length) return;
    setUploading(true); setMsg("");

    for (const file of pdfs) {
      setMsg(`Processando ${file.name}…`);
      try {
        const ab = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
        let txt = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const pg = await pdf.getPage(i);
          const c = await pg.getTextContent();
          txt += c.items.map(s => s.str).join(" ") + "\n";
        }
        const res = await fetch("/api/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...await authHeader() },
          body: JSON.stringify({ filename: file.name, text: txt.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro no upload");
        setMsg(`✓ ${file.name} — ${data.chunks} chunks indexados`);
      } catch (e) {
        setMsg(`Erro em ${file.name}: ${e.message}`);
      }
    }
    setUploading(false);
    loadFiles();
  };

  const remove = async (filename) => {
    await fetch("/api/knowledge", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...await authHeader() },
      body: JSON.stringify({ filename }),
    });
    setFiles(f => f.filter(x => x.name !== filename));
  };

  return (
    <div style={{ ...G.screen, flexDirection: "column", background: C.surface }}>
      {/* Topbar */}
      <div style={{
        height: 60, background: C.white, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", flexShrink: 0, zIndex: 100,
        boxShadow: "0 1px 0 rgba(113,50,245,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ ...G.btnSec }}>
            <Icon d="M15 18l-6-6 6-6" sw={2} />
            Voltar
          </button>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div style={{ fontSize: 16, color: C.ink, fontWeight: 700 }}>Base de Conhecimento</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={28} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2.25rem 2rem", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: 24, color: C.ink, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Materiais de referência
          </h1>
          <p style={{ fontSize: 13.5, color: C.ink4, marginTop: 5, lineHeight: 1.6 }}>
            Suba livros e artigos veterinários. O sistema vai buscar automaticamente os trechos mais relevantes em cada análise.
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
          onClick={() => !uploading && fileRef.current.click()}
          style={{
            border: `2px dashed ${drag ? C.p400 : C.border2}`,
            borderRadius: 16, padding: "2.5rem 1rem", textAlign: "center",
            cursor: uploading ? "default" : "pointer",
            background: drag ? C.p50 : C.white,
            transition: "all 0.2s", marginBottom: "1.5rem",
          }}>
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Spin size={24} />
              <div style={{ fontSize: 13.5, color: C.p600, fontWeight: 500 }}>{msg}</div>
            </div>
          ) : (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: C.p50, border: `1.5px solid ${C.p100}`,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
              }}>
                <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" color={C.p500} size={22} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 5 }}>
                Arraste PDFs aqui
              </div>
              <div style={{ fontSize: 13, color: C.ink4 }}>
                ou clique para selecionar · múltiplos arquivos · inglês e português
              </div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="application/pdf" multiple style={{ display: "none" }}
          onChange={e => { upload(e.target.files); e.target.value = ""; }} />

        {!uploading && msg && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: "1.25rem",
            background: msg.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${msg.startsWith("✓") ? "#86efac" : "#fca5a5"}`,
            fontSize: 13, color: msg.startsWith("✓") ? "#166534" : "#b91c1c",
          }}>{msg}</div>
        )}

        {/* File list */}
        {files.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: C.ink4, fontSize: 13.5 }}>
            Nenhum material indexado ainda.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              {files.length} arquivo{files.length !== 1 ? "s" : ""} indexado{files.length !== 1 ? "s" : ""}
            </div>
            {files.map(f => (
              <div key={f.name} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: C.white, border: `1.5px solid ${C.border}`,
                borderRadius: 12, padding: "1rem 1.25rem",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: C.p50,
                  border: `1.5px solid ${C.p100}`, color: C.p600, fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>PDF</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.ink5, marginTop: 2 }}>{f.chunks} chunks indexados</div>
                </div>
                <button onClick={() => remove(f.name)} style={{
                  ...G.btnSec, fontSize: 12, padding: "6px 13px",
                  color: "#b91c1c", borderColor: "#fca5a5", flexShrink: 0,
                }}>
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: "2rem", background: C.p50, border: `1.5px solid ${C.p100}`,
          borderRadius: 12, padding: "1rem 1.25rem", display: "flex", gap: 10,
        }}>
          <Icon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01" color={C.p500} size={17} sw={1.7} />
          <p style={{ fontSize: 12.5, color: C.p700, lineHeight: 1.65 }}>
            Os trechos mais relevantes de cada material são incluídos automaticamente no contexto de cada análise. Quanto mais materiais indexados, mais fundamentadas serão as respostas.
          </p>
        </div>
      </div>
    </div>
  );
}

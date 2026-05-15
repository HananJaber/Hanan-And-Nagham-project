import { useState, useRef } from "react";
import { AMBER, AMBER_D, SKY, SKY_D, EMERALD, EMERALD_D, ROSE, ROSE_D } from "./constants/colors";
import Chatbot from "./components/Chatbot";
import GPSMap from "./components/GPSMap";
import RegistrationWizard from "./components/RegistrationWizard";
import RiderDashboard from "./components/RiderDashboard";
import DriverDashboard from "./components/DriverDashboard";
import ManagerDashboard from "./components/ManagerDashboard";
import InfoPages from "./components/InfoPages";

export default function App() {
  const [view, setView] = useState("landing"); // landing | modal | info
  const [infoPage, setInfoPage] = useState("about");
  const [modalScreen, setModalScreen] = useState("roles");
  const [role, setRole] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [loginRole, setLoginRole] = useState("rider");
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, msg });
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: "" }), 2800);
  };

  const openModal = (screen, r = null) => {
    setModalScreen(screen);
    if (r) setRole(r);
    setView("modal");
  };

  const openInfoPage = (pg) => {
    setInfoPage(pg);
    setView("info");
  };

  const handleRegComplete = () => {
    setLoggedIn(true);
    showToast("✅ تم إنشاء الحساب بنجاح! مرحباً بك 🎉");
    setModalScreen("dashboard");
  };

  const handleLogin = () => {
    setLoggedIn(true);
    setRole(loginRole);
    showToast("✅ مرحباً بعودتك!");
    setModalScreen("dashboard");
  };

  return (
    <div style={{ fontFamily: "Cairo, sans-serif", direction: "rtl", background: "#fafaf9", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-20px) scale(1.05)}}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
      `}</style>

      {/* TOAST */}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: `translateX(-50%) translateY(${toast.show ? 0 : 12}px)`, zIndex: 999, background: "#1e293b", color: "#fff", padding: "10px 22px", borderRadius: 100, fontSize: 13, fontWeight: 700, opacity: toast.show ? 1 : 0, transition: "all .3s", pointerEvents: "none", whiteSpace: "nowrap" }}>{toast.msg}</div>

      {/* CHATBOT */}
      <Chatbot role={role || "rider"} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <button
        onClick={() => setChatOpen(v => !v)}
        style={{ position: "fixed", bottom: 24, left: 24, width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 18px rgba(245,158,11,.5)", zIndex: 590, transition: "all .25s" }}
        onMouseOver={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseOut={e => e.currentTarget.style.transform = "none"}>
        🤖
      </button>

      {/* INFO PAGES */}
      {view === "info" && (
        <>
          <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "rgba(250,250,249,.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,.07)" }}>
            <button onClick={() => setView("landing")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🚌</div>
              <div>
                <div style={{ fontWeight: 900, color: AMBER_D, fontSize: 15, lineHeight: 1 }}>مواصلاتي</div>
                <div style={{ fontSize: 8, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>MAWASALATI PS</div>
              </div>
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => openModal("login")} style={{ padding: "7px 16px", borderRadius: 100, border: "1.5px solid #e2e8f0", background: "transparent", fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#334155" }}>تسجيل الدخول</button>
              <button onClick={() => openModal("roles")} style={{ padding: "7px 16px", borderRadius: 100, border: "none", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, color: "#fff", fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>إنشاء حساب</button>
            </div>
          </nav>
          <InfoPages activePage={infoPage} setActivePage={setInfoPage} openModal={openModal} />
        </>
      )}

      {/* LANDING */}
      {view === "landing" && (
        <>
          <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "rgba(250,250,249,.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 12px rgba(245,158,11,.4)" }}>🚌</div>
              <div>
                <div style={{ fontWeight: 900, color: AMBER_D, lineHeight: 1, fontSize: 16 }}>مواصلاتي</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>MAWASALATI PS</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {[["about", "من نحن"], ["why", "لماذا مواصلاتي"], ["contact", "تواصل معنا"]].map(([pg, label]) => (
                <button key={pg} onClick={() => openInfoPage(pg)}
                  style={{ padding: "7px 14px", borderRadius: 100, border: "none", background: "transparent", fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#475569" }}
                  onMouseOver={e => e.target.style.color = AMBER_D}
                  onMouseOut={e => e.target.style.color = "#475569"}>
                  {label}
                </button>
              ))}
              <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer"
                style={{ padding: "7px 14px", borderRadius: 100, background: "#fef3c7", border: "1px solid #fde68a", color: AMBER_D, fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                🗺️ أحوال الطرق
              </a>
              <button onClick={() => openModal("login")} style={{ padding: "8px 18px", borderRadius: 100, border: "1.5px solid #e2e8f0", background: "transparent", fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#334155" }}>تسجيل الدخول</button>
              <button onClick={() => openModal("roles")} style={{ padding: "8px 18px", borderRadius: 100, border: "none", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, color: "#fff", fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(245,158,11,.4)" }}>إنشاء حساب</button>
            </div>
          </nav>

          {/* Hero */}
          <section style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "4rem 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0,rgba(245,158,11,.13),transparent 60%)" }} />
            {[{ s: 300, c: AMBER, t: -60, r: -60 }, { s: 250, c: SKY, b: -40, l: -60, delay: "4s" }, { s: 200, c: EMERALD, b: 80, r: "15%", delay: "8s" }].map((b, i) => (
              <div key={i} style={{ position: "absolute", width: b.s, height: b.s, borderRadius: "50%", background: b.c, filter: "blur(80px)", opacity: .25, top: b.t, right: b.r, bottom: b.b, left: b.l, animation: `drift 12s ${b.delay || "0s"} ease-in-out infinite` }} />
            ))}
            <div style={{ position: "relative", zIndex: 1, maxWidth: 640, animation: "fadeUp .7s ease both" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)", color: AMBER_D, padding: "5px 16px", borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 24 }}>🚌 منصة النقل الذكي في فلسطين</div>
              <div style={{ width: 96, height: 96, borderRadius: 24, background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 50, boxShadow: `0 16px 48px rgba(245,158,11,.45),0 0 0 12px rgba(245,158,11,.1)` }}>🚌</div>
              <h1 style={{ fontSize: "clamp(2.2rem,6vw,3.6rem)", fontWeight: 900, color: AMBER_D, lineHeight: 1.05, margin: "0 0 12px" }}>مواصلاتي <span style={{ color: "#0f172a" }}>PS</span></h1>
              <p style={{ fontSize: 16, color: "#64748b", margin: "0 0 32px", lineHeight: 1.7 }}>تنقّل بذكاء في فلسطين — تتبع GPS حي، تسجيل ذكي لكل دور، ومساعد AI يجيب على كل أسئلتك</p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => openModal("roles")} style={{ padding: "13px 30px", borderRadius: 100, border: "none", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, color: "#fff", fontFamily: "Cairo, sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(245,158,11,.45)" }}>ابدأ الآن مجاناً</button>
                <button onClick={() => openInfoPage("about")} style={{ padding: "13px 30px", borderRadius: 100, border: "1.5px solid #e2e8f0", background: "transparent", color: "#334155", fontFamily: "Cairo, sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>استكشف الأدوار →</button>
              </div>
              <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
                {[["5000+", "راكب نشط"], ["200+", "سائق مسجّل"], ["30+", "شركة نقل"], ["12", "مدينة فلسطينية"]].map(([n, l]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: AMBER_D }}>{n}</div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Roles section */}
          <section style={{ padding: "5rem 24px", background: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: AMBER, marginBottom: 6 }}>اختر دورك</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>منصة لكل طرف في رحلة التنقل</h2>
            <p style={{ color: "#64748b", marginBottom: 40 }}>خدمات مخصصة — راكب، سائق، أو مدير</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, maxWidth: 860, margin: "0 auto" }}>
              {[
                { role: "rider", icon: "👤", title: "الراكب", desc: "احجز رحلتك، تابع موقع المركبة بـGPS مباشر، وادفع بسهولة", color: SKY, dark: SKY_D, bg: "#e0f2fe", pill: "للمواطنين" },
                { role: "driver", icon: "🚗", title: "السائق", desc: "أدر رحلاتك وخطك، تلقّ طلبات فورًا، وتابع الحواجز", color: EMERALD, dark: EMERALD_D, bg: "#d1fae5", pill: "للسائقين" },
                { role: "manager", icon: "🏢", title: "مدير شركة", desc: "راقب الأسطول بالكامل، أدر السائقين، وحلّل الأداء", color: ROSE, dark: ROSE_D, bg: "#ffe4e6", pill: "للإدارة" },
              ].map(r => (
                <div key={r.role}
                  style={{ borderRadius: 20, padding: "28px 20px", background: r.bg, textAlign: "center", cursor: "pointer", transition: "all .3s", border: "2px solid transparent" }}
                  onMouseOver={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,.12)"; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ width: 70, height: 70, borderRadius: 18, background: `linear-gradient(135deg,${r.color},${r.dark})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 32, boxShadow: `0 8px 24px ${r.color}44` }}>{r.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 8, background: `${r.color}22`, color: r.dark, marginBottom: 10, display: "inline-block" }}>{r.pill}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: r.dark, marginBottom: 8 }}>{r.title}</h3>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>{r.desc}</p>
                  <button onClick={() => openModal("register", r.role)} style={{ background: `linear-gradient(135deg,${r.color},${r.dark})`, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 100, fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ادخل كـ{r.title} →</button>
                </div>
              ))}
            </div>
          </section>

          {/* Landing footer */}
          <footer style={{ background: "#1e293b", color: "#fff", padding: "2rem 24px 1.5rem", fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🚌</div>
                <span style={{ fontWeight: 900, color: AMBER, fontSize: 14 }}>مواصلاتي PS</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>— صُنع بـ❤️ في فلسطين 🇵🇸</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[["about", "من نحن"], ["why", "لماذا مواصلاتي"], ["contact", "تواصل معنا"]].map(([pg, label]) => (
                  <button key={pg} onClick={() => openInfoPage(pg)}
                    style={{ background: "rgba(255,255,255,.07)", border: "0.5px solid rgba(255,255,255,.15)", padding: "4px 12px", borderRadius: 100, fontSize: 12, color: "#94a3b8", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif" }}
                    onMouseOver={e => e.target.style.color = AMBER}
                    onMouseOut={e => e.target.style.color = "#94a3b8"}>
                    {label}
                  </button>
                ))}
                <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer"
                  style={{ background: "rgba(245,158,11,.15)", border: "0.5px solid rgba(245,158,11,.4)", padding: "4px 12px", borderRadius: 100, fontSize: 12, color: AMBER, fontWeight: 700, textDecoration: "none" }}>
                  🗺️ ع وين رايح؟ ↗
                </a>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* MODAL */}
      {view === "modal" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadeIn .25s ease" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 440, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp .35s cubic-bezier(.34,1.2,.64,1)" }}>
            <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 2, margin: "12px auto 4px", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 6px", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 900 }}>
                {modalScreen === "roles" && "مواصلاتي PS"}
                {modalScreen === "login" && "تسجيل الدخول"}
                {modalScreen === "register" && (role === "rider" ? "تسجيل الراكب" : role === "driver" ? "تسجيل السائق" : "تسجيل المدير")}
                {modalScreen === "dashboard" && (role === "rider" ? "واجهة الراكب" : role === "driver" ? "واجهة السائق" : "لوحة المدير")}
              </span>
              <button onClick={() => setView("landing")} style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 24px" }}>
              {/* Role picker */}
              {modalScreen === "roles" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 68, height: 68, borderRadius: 18, background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "8px auto 12px", fontSize: 34, boxShadow: "0 8px 24px rgba(245,158,11,.35)" }}>🚌</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: AMBER_D, marginBottom: 4 }}>مرحباً بك! 👋</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>اختر نوع حسابك للمتابعة</div>
                  {[
                    { r: "rider", icon: "👤", l: "راكب", d: "ابحث واحجز رحلتك بسهولة", bg: "#e0f2fe", c: SKY, cd: SKY_D },
                    { r: "driver", icon: "🚗", l: "سائق / شركة مواصلات", d: "أدر رحلاتك وخطوطك", bg: "#d1fae5", c: EMERALD, cd: EMERALD_D },
                    { r: "manager", icon: "🏢", l: "مدير مكتب / شركة", d: "راقب الأسطول وحلّل الأداء", bg: "#ffe4e6", c: ROSE, cd: ROSE_D },
                  ].map(m => (
                    <button key={m.r} onClick={() => openModal("register", m.r)}
                      style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", borderRadius: 14, border: `2px solid ${m.c}33`, background: m.bg, marginBottom: 10, fontFamily: "Cairo, sans-serif", cursor: "pointer", transition: "all .2s" }}
                      onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseOut={e => e.currentTarget.style.transform = "none"}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${m.c},${m.cd})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{m.icon}</div>
                      <div style={{ textAlign: "right", flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: m.cd }}>{m.l}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{m.d}</div>
                      </div>
                      <span style={{ color: "#94a3b8", fontSize: 18 }}>←</span>
                    </button>
                  ))}
                  <button onClick={() => openModal("login")} style={{ background: "none", border: "none", color: AMBER_D, fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>لديك حساب؟ تسجيل الدخول</button>
                </div>
              )}

              {/* Login */}
              {modalScreen === "login" && (
                <div>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>تسجيل الدخول</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>مرحباً بعودتك! 👋</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 10 }}>اختر دورك</div>
                  <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 16 }}>
                    {["rider", "driver", "manager"].map(r => (
                      <button key={r} onClick={() => setLoginRole(r)}
                        style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: loginRole === r ? "#fff" : "transparent", color: loginRole === r ? "#0f172a" : "#64748b", boxShadow: loginRole === r ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
                        {r === "rider" ? "راكب" : r === "driver" ? "سائق" : "مدير"}
                      </button>
                    ))}
                  </div>
                  {[["رقم الهاتف", "phone", "059xxxxxxx", "ltr", "tel"], ["كلمة المرور", "password", "••••••••", "rtl", "password"]].map(([l, k, ph, d, t]) => (
                    <div key={k} style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>{l}</label>
                      <input type={t} placeholder={ph} dir={d} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontFamily: "Cairo, sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = AMBER} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                    </div>
                  ))}
                  <button onClick={handleLogin} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif", marginTop: 8 }}>دخول</button>
                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <button onClick={() => setModalScreen("roles")} style={{ background: "none", border: "none", color: AMBER_D, fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ليس لديك حساب؟ سجّل الآن</button>
                  </div>
                </div>
              )}

              {/* Registration */}
              {modalScreen === "register" && role && (
                <RegistrationWizard role={role} onComplete={handleRegComplete} />
              )}

              {/* Dashboards */}
              {modalScreen === "dashboard" && loggedIn && (
                <div>
                  {role === "rider" && <RiderDashboard showToast={showToast} />}
                  {role === "driver" && <DriverDashboard showToast={showToast} />}
                  {role === "manager" && <ManagerDashboard showToast={showToast} />}
                </div>
              )}
            </div>

            {/* Bottom nav (dashboard only) */}
            {modalScreen === "dashboard" && (
              <div style={{ display: "flex", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
                {[{ icon: "🏠", l: "الرئيسية" }, { icon: "🗺", l: "التتبع" }, { icon: "💳", l: "المدفوعات" }, { icon: "⭐", l: "تقييم" }].map((item, i) => (
                  <button key={item.l}
                    onClick={() => { if (i === 3) showToast("⭐ شكراً على تقييمك!"); else showToast(`📌 ${item.l}`); }}
                    style={{ flex: 1, padding: "10px 6px 8px", border: "none", background: i === 0 ? "#fef3c7" : "transparent", cursor: "pointer", fontFamily: "Cairo, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? AMBER_D : "#64748b" }}>{item.l}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

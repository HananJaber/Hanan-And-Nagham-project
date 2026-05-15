import { useState, useRef, useEffect } from "react";
import { AMBER, AMBER_D } from "../constants/colors";
import { getBotResponse } from "../utils/api";

export default function Chatbot({ role, isOpen, onClose }) {
  const [msgs, setMsgs] = useState([{ from: "bot", text: "أهلاً! أنا مساعد مواصلاتي الذكي 🤖\nكيف أساعدك اليوم؟" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);

  const quickReplies = ["💺 المقاعد المتاحة الآن", "🕐 مواعيد الرحلات", "🛡️ حالة الحواجز", "💳 طرق الدفع", "📍 تتبع رحلتي", "📞 التواصل مع الدعم"];

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  const send = async (text) => {
    const t = text || input.trim();
    if (!t) return;
    setInput("");
    setMsgs(m => [...m, { from: "user", text: t }]);
    setLoading(true);
    const reply = await getBotResponse(t, role);
    setLoading(false);
    setMsgs(m => [...m, { from: "bot", text: reply }]);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 440, margin: "0 auto", zIndex: 600, background: "#fff", borderRadius: "20px 20px 0 0", boxShadow: "0 -4px 40px rgba(0,0,0,.15)", maxHeight: "70vh", display: "flex", flexDirection: "column", fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, padding: "12px 16px", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 14 }}>مساعد مواصلاتي</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} /> متصل الآن — يعمل بالذكاء الاصطناعي
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "12px 14px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === "bot" ? "flex-start" : "flex-end", maxWidth: "82%" }}>
            <div style={{ padding: "9px 13px", borderRadius: m.from === "bot" ? "4px 14px 14px 14px" : "14px 4px 14px 14px", background: m.from === "bot" ? "#f1f5f9" : `linear-gradient(135deg,${AMBER},${AMBER_D})`, color: m.from === "bot" ? "#0f172a" : "#fff", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, padding: "0 4px" }}>الآن</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", background: "#f1f5f9", padding: "9px 13px", borderRadius: "4px 14px 14px 14px", fontSize: 13, color: "#64748b" }}>⏳ جارٍ الكتابة...</div>
        )}
      </div>

      {/* Quick replies */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "6px 14px", borderTop: "1px solid #f1f5f9" }}>
        {quickReplies.map(q => (
          <button key={q} onClick={() => send(q)}
            style={{ whiteSpace: "nowrap", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "5px 10px", borderRadius: 20, fontFamily: "Cairo, sans-serif", fontSize: 11, fontWeight: 700, color: "#334155", cursor: "pointer", transition: "all .2s" }}
            onMouseOver={e => { e.target.style.background = "#fef3c7"; e.target.style.borderColor = AMBER; e.target.style.color = AMBER_D; }}
            onMouseOut={e => { e.target.style.background = "#f1f5f9"; e.target.style.borderColor = "#e2e8f0"; e.target.style.color = "#334155"; }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "8px 14px 12px", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="اكتب رسالتك..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 24, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontFamily: "Cairo, sans-serif", fontSize: 13, outline: "none", direction: "rtl" }}
          onFocus={e => e.target.style.borderColor = AMBER}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        />
        <button onClick={() => send()} style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>➤</button>
      </div>
    </div>
  );
}

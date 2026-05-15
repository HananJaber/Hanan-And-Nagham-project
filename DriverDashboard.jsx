import { useState } from "react";
import { AMBER, AMBER_D, SKY, SKY_D, EMERALD, EMERALD_D, ROSE, ROSE_D } from "../constants/colors";

export default function DriverDashboard({ showToast }) {
  const [activeTab, setActiveTab] = useState("trip");
  const [status, setStatus] = useState("في الطريق");
  const [checkpoints, setCheckpoints] = useState({
    قلنديا: "open", حوارة: "closed", "بيت إيل": "open", الكونتينر: "closed", عوارة: "open"
  });

  const tabs = [{ id: "trip", l: "🛣 الرحلة" }, { id: "route", l: "📋 الخط" }, { id: "checkpoints", l: "🛡 الحواجز" }, { id: "history", l: "📊 السجل" }];
  const statuses = ["في الطريق 🚐", "يلتقط ركاباً 🛑", "ممتلئ 🔴", "متاح 🟢"];

  return (
    <div>
      {/* Driver header card */}
      <div style={{ background: `linear-gradient(135deg,${EMERALD},${EMERALD_D})`, borderRadius: 14, padding: "14px 16px", marginBottom: 14, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>خ.ر</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>خالد رمضان</div>
            <div style={{ fontSize: 12, opacity: .85 }}>🚐 سرفيس · ح-5678 · رام الله ← البيرة</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          {[["3", "رحلات اليوم"], ["75 ₪", "الإيرادات"], ["4.9 ⭐", "التقييم"]].map(([v, l]) => (
            <div key={l}><div style={{ fontWeight: 900, fontSize: 18 }}>{v}</div><div style={{ fontSize: 11, opacity: .8 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* Status buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {statuses.map(s => (
          <button key={s}
            onClick={() => { setStatus(s); showToast("✅ تم تحديث حالتك: " + s); }}
            style={{ flex: 1, minWidth: "fit-content", padding: "8px 10px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: status === s ? `linear-gradient(135deg,${EMERALD},${EMERALD_D})` : "#f1f5f9", color: status === s ? "#fff" : "#475569", transition: "all .2s" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 14 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: activeTab === t.id ? "#fff" : "transparent", color: activeTab === t.id ? "#0f172a" : "#64748b", boxShadow: activeTab === t.id ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Trip tab */}
      {activeTab === "trip" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>الركاب الحاليون (3)</div>
          {[
            { n: "محمد عباس", d: "→ البيرة", c: SKY, p: "5 ₪" },
            { n: "فاطمة نصر", d: "→ البيرة", c: EMERALD, p: "5 ₪" },
            { n: "سامر حسين", d: "→ البيرة", c: ROSE, p: "5 ₪" },
          ].map(p => (
            <div key={p.n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: 10, padding: "10px 12px", marginBottom: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${p.c},${p.c}cc)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{p.n[0]}.{p.n[2]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.n}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{p.d}</div>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: EMERALD_D }}>{p.p}</span>
            </div>
          ))}
          <button
            onClick={() => showToast("✅ تم إرسال إشعار تأخير للركاب")}
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1.5px solid #e2e8f0", background: "transparent", color: "#475569", fontFamily: "Cairo, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
            📢 إبلاغ عن تأخير
          </button>
        </div>
      )}

      {/* Route tab */}
      {activeTab === "route" && (
        <div>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>خط السير الرئيسي</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: "#e0f2fe", color: SKY_D }}>نشط</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>رام الله ← البيرة</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>نقاط الوقوف: المنارة · حي البيرة · الشمالي</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["07:00", "09:00", "11:00", "13:00", "15:00", "17:00"].map(t => (
                <span key={t} style={{ background: "#fef3c7", color: AMBER_D, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8 }}>{t}</span>
              ))}
            </div>
            <div style={{ fontSize: 13, color: EMERALD_D, fontWeight: 700, marginTop: 10 }}>سعر المقعد: 5 ₪ · الطفل: 2 ₪</div>
          </div>
        </div>
      )}

      {/* Checkpoints tab */}
      {activeTab === "checkpoints" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>حدّث حالة الحواجز الآن</div>
          {Object.entries(checkpoints).map(([name, st]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: "1px solid #e2e8f0" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => { setCheckpoints(c => ({ ...c, [name]: "open" })); showToast(`✅ ${name}: مفتوح`); }}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: st === "open" ? EMERALD_D : "#d1fae5", color: st === "open" ? "#fff" : EMERALD_D }}>
                  مفتوح
                </button>
                <button
                  onClick={() => { setCheckpoints(c => ({ ...c, [name]: "closed" })); showToast(`🔴 ${name}: مغلق`); }}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: st === "closed" ? ROSE_D : "#ffe4e6", color: st === "closed" ? "#fff" : ROSE_D }}>
                  مغلق
                </button>
              </div>
            </div>
          ))}
          <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: AMBER_D, textDecoration: "none", marginTop: 8 }}>
            🔗 عرض جميع الحواجز — ع وين رايح؟
          </a>
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[["75 ₪", "اليوم", AMBER_D], ["490 ₪", "الأسبوع", EMERALD_D], ["3", "رحلات اليوم", SKY_D], ["4.9 ⭐", "متوسط التقييم", ROSE_D]].map(([v, l, c]) => (
              <div key={l} style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

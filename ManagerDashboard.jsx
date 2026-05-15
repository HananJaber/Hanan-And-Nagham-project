import { useState } from "react";
import { AMBER, AMBER_D, SKY, SKY_D, EMERALD, EMERALD_D, ROSE, ROSE_D } from "../constants/colors";

export default function ManagerDashboard({ showToast }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [{ id: "overview", l: "📊 نظرة عامة" }, { id: "drivers", l: "👥 السائقون" }, { id: "complaints", l: "📩 الشكاوى" }];

  const drivers = [
    { name: "أحمد محمود", initials: "أ.م", vehicle: "🚌 حافلة · ح-1234", status: "avail", route: "رام الله ← نابلس · 3 ركاب · 4.9⭐" },
    { name: "خالد رمضان", initials: "خ.ر", vehicle: "🚐 سرفيس · ح-5678", status: "busy", route: "رام الله ← البيرة · ممتلئ 6/6 · 4.7⭐" },
    { name: "يوسف عمر", initials: "ي.ع", vehicle: "🚕 تاكسي · ح-9012", status: "away", route: "في المحطة — جاهز للانطلاق · 5.0⭐" },
  ];

  const complaints = [
    { name: "محمد عباس", status: "new", text: "السائق تأخر 30 دقيقة بدون إشعار" },
    { name: "فاطمة نصر", status: "pending", text: "الحافلة كانت ممتلئة ولم أُعلَم مسبقاً" },
    { name: "أحمد سلامة", status: "done", text: "مشكلة في الدفع الإلكتروني — تم حلها" },
  ];

  const statusInfo = {
    avail: { l: "متاح", bg: "#d1fae5", c: EMERALD_D },
    busy: { l: "في رحلة", bg: "#fef3c7", c: "#92400e" },
    away: { l: "انتظار", bg: "#f1f5f9", c: "#475569" },
  };

  const complaintStatus = {
    new: { l: "جديدة", bg: "#ffe4e6", c: ROSE_D },
    pending: { l: "قيد المعالجة", bg: "#fef3c7", c: AMBER_D },
    done: { l: "محلولة", bg: "#d1fae5", c: EMERALD_D },
  };

  return (
    <div>
      {/* Manager header card */}
      <div style={{ background: `linear-gradient(135deg,${ROSE},${ROSE_D})`, borderRadius: 14, padding: "14px 16px", marginBottom: 14, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>س.ح</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>سامر حسين</div>
            <div style={{ fontSize: 12, opacity: .85 }}>🏢 شركة النقل الفلسطيني · رام الله</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          {[["8", "سائقون نشطون"], ["680 ₪", "إيرادات اليوم"], ["4.8 ⭐", "متوسط التقييم"]].map(([v, l]) => (
            <div key={l}><div style={{ fontWeight: 900, fontSize: 18 }}>{v}</div><div style={{ fontSize: 11, opacity: .8 }}>{l}</div></div>
          ))}
        </div>
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

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["24", "رحلات اليوم", AMBER_D], ["142", "ركاب اليوم", SKY_D], ["680 ₪", "إيرادات اليوم", EMERALD_D], ["2", "شكاوى جديدة", ROSE_D], ["128", "رحلات الأسبوع", AMBER_D], ["3,840 ₪", "إيرادات الأسبوع", "#8B5CF6"]].map(([v, l, c]) => (
            <div key={l} style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: c }}>{v}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Drivers tab */}
      {activeTab === "drivers" && drivers.map(d => (
        <div key={d.name} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${ROSE},${ROSE_D})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>{d.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{d.vehicle}</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: statusInfo[d.status].bg, color: statusInfo[d.status].c, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusInfo[d.status].c, display: "inline-block" }} />
              {statusInfo[d.status].l}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{d.route}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => showToast(`📞 جارٍ الاتصال بـ${d.name}...`)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 11, fontWeight: 700, background: "#d1fae5", color: EMERALD_D }}>📞 اتصال</button>
            <button onClick={() => showToast(`💬 تم فتح المحادثة مع ${d.name}`)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 11, fontWeight: 700, background: "#e0f2fe", color: SKY_D }}>💬 رسالة</button>
            <button onClick={() => showToast(`✅ تم إسناد رحلة لـ${d.name}`)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 11, fontWeight: 700, background: "#fef3c7", color: AMBER_D }}>📋 إسناد</button>
          </div>
        </div>
      ))}

      {/* Complaints tab */}
      {activeTab === "complaints" && complaints.map(c => (
        <div key={c.name} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 8, background: complaintStatus[c.status].bg, color: complaintStatus[c.status].c }}>{complaintStatus[c.status].l}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, lineHeight: 1.6 }}>{c.text}</div>
          {c.status !== "done" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => showToast("✉️ تم إرسال الرد")} style={{ flex: 1, padding: "6px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: "#e0f2fe", color: SKY_D }}>رد</button>
              <button onClick={() => showToast("✅ تم حل الشكوى")} style={{ flex: 1, padding: "6px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: "#d1fae5", color: EMERALD_D }}>حل</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

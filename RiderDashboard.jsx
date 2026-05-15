import { AMBER, AMBER_D, SKY, SKY_D, EMERALD, EMERALD_D, ROSE, ROSE_D } from "../constants/colors";
import GPSMap from "./GPSMap";

export default function RiderDashboard({ showToast }) {
  const trips = [
    { id: 1, driver: "أحمد محمود", initials: "أ.م", color: SKY, type: "bus", label: "🚌 حافلة", route: "رام الله ← بيرزيت ← نابلس", time: "25 د.", seats: "7/20", price: "20 ₪", fill: 65, rating: 4.9, trips: 124 },
    { id: 2, driver: "خالد رمضان", initials: "خ.ر", color: EMERALD, type: "service", label: "🚐 سرفيس", route: "رام الله ← البيرة", time: "10 د.", seats: "1/6", price: "5 ₪", fill: 83, rating: 4.7, trips: 87 },
    { id: 3, driver: "يوسف عمر", initials: "ي.ع", color: AMBER, type: "taxi", label: "🚕 تاكسي", route: "أي وجهة (سيأتي إليك)", time: "الآن", seats: null, price: "عداد", fill: null, rating: 5.0, trips: 210 },
  ];

  return (
    <div>
      <GPSMap role="rider" />
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", marginBottom: 14, cursor: "pointer" }}
        onClick={() => showToast("🔍 ابحث عن وجهتك...")}
        onMouseOver={e => e.currentTarget.style.borderColor = AMBER}
        onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
        <span style={{ fontSize: 16 }}>🔍</span>
        <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>وين بدك تروح؟</span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>الرحلات المتاحة ({trips.length})</div>

      {trips.map(t => (
        <div key={t.id}
          style={{ background: "#f8fafc", borderRadius: 12, padding: "14px", border: "1px solid #e2e8f0", marginBottom: 10, cursor: "pointer", transition: "all .2s" }}
          onMouseOver={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseOut={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${t.color},${t.color}cc)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>{t.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{t.driver}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>⭐ {t.rating} · {t.trips} رحلة</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: t.type === "bus" ? "#e0f2fe" : t.type === "service" ? "#d1fae5" : "#fef3c7", color: t.type === "bus" ? SKY_D : t.type === "service" ? EMERALD_D : AMBER_D }}>{t.label}</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t.route}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>⏱ {t.time}</span>
              {t.seats && <span style={{ fontSize: 12, color: "#64748b" }}>💺 {t.seats}</span>}
              <span style={{ fontSize: 12, color: "#64748b" }}>💰 {t.price}</span>
            </div>
            <button
              onClick={() => showToast(`🎉 تم الحجز مع ${t.driver}!`)}
              style={{ background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              احجز الآن
            </button>
          </div>
          {t.fill != null && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${t.fill}%`, borderRadius: 2, background: t.fill > 80 ? `linear-gradient(90deg,${ROSE},${ROSE_D})` : `linear-gradient(90deg,${AMBER},${AMBER_D})` }} />
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{t.fill > 80 ? "⚠️ مقاعد نادرة — تسرع!" : `${Math.round(20 * t.fill / 100)} مقعداً محجوزاً`}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

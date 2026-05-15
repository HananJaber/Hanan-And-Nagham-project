import { useState } from "react";
import { AMBER, AMBER_D, SKY, SKY_D, EMERALD, EMERALD_D, ROSE, ROSE_D } from "../constants/colors";

const cardStyle = {
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14,
  padding: "18px 20px", transition: "all .2s",
};

export default function InfoPages({ activePage, setActivePage, openModal }) {
  const [faqOpen, setFaqOpen] = useState(null);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", subject: "", msg: "" });

  const submitForm = () => {
    if (!formData.name || !formData.phone) { alert("يرجى ملء الاسم ورقم الهاتف على الأقل"); return; }
    setFormSent(true);
    setFormData({ name: "", phone: "", email: "", subject: "", msg: "" });
    setTimeout(() => setFormSent(false), 4000);
  };

  const navBtnStyle = (pg) => ({
    padding: "7px 14px", borderRadius: 100, border: "none",
    background: activePage === pg ? "#fef3c7" : "transparent",
    color: activePage === pg ? AMBER_D : "#64748b",
    fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700,
    cursor: "pointer", transition: "all .2s",
  });

  const inpStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", background: "#f8fafc",
    fontFamily: "Cairo, sans-serif", fontSize: 14, outline: "none",
    boxSizing: "border-box", direction: "rtl", color: "#0f172a",
    transition: "border-color .2s",
  };

  const faqItems = [
    { q: "كيف أسجّل كسائق؟", a: "انقر على «إنشاء حساب» واختر دور السائق. ستحتاج رخصة القيادة وبيانات المركبة ورقم هاتف فلسطيني. العملية تستغرق أقل من 5 دقائق." },
    { q: "هل الخدمة متاحة في كل المدن؟", a: "نغطي حالياً: رام الله، نابلس، جنين، الخليل، بيت لحم، طولكرم، قلقيلية، أريحا وغيرها. نعمل على التوسع المستمر." },
    { q: "كيف أعرف حالة الحواجز؟", a: "داخل التطبيق يوجد قسم «الحواجز» محدَّث من السائقين مباشرة. كما يمكنك زيارة موقع «ع وين رايح؟» للخريطة الكاملة." },
    { q: "ما طرق الدفع المتاحة؟", a: "نقدي عند الركوب، دفع إلكتروني (كليك، بطاقة)، أو محفظة رقمية داخل التطبيق. جميع المدفوعات آمنة ومشفّرة." },
    { q: "هل بياناتي الشخصية محمية؟", a: "نعم، بياناتك مشفّرة ولا تُشارَك مع أي طرف ثالث. ملتزمون بسياسة خصوصية صارمة." },
  ];

  return (
    <div style={{ fontFamily: "Cairo, sans-serif", direction: "rtl", background: "#fafaf9", minHeight: "100vh" }}>
      {/* Sub-nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", gap: 4, alignItems: "center", height: 46, overflowX: "auto" }}>
        {[["about", "من نحن"], ["why", "لماذا مواصلاتي"], ["contact", "تواصل معنا"]].map(([pg, label]) => (
          <button key={pg} style={navBtnStyle(pg)} onClick={() => setActivePage(pg)}>{label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer"
          style={{ padding: "6px 14px", borderRadius: 100, background: "#fef3c7", border: "1px solid #fde68a", color: AMBER_D, fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
          🗺️ ع وين رايح؟
        </a>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 24px 4rem" }}>

        {/* ── من نحن ── */}
        {activePage === "about" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ display: "inline-block", background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "4px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>🇵🇸 من نحن</div>
              <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, marginBottom: 10 }}>قصتنا — من فلسطين للعالم</h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>مواصلاتي PS منصة تقنية فلسطينية أُسِّست عام 2023 من فريق عاش تحديات التنقل اليومي من الداخل — فقرر حلّها.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: "2rem" }}>
              {[
                { icon: "🎯", title: "رؤيتنا", color: "#fef3c7", desc: "التنقل الآمن والمنظّم حق أساسي — نسعى لتحويل النقل من نظام متفرّق إلى شبكة ذكية تربط كل مدن فلسطين", border: AMBER },
                { icon: "🚀", title: "مهمتنا", color: "#d1fae5", desc: "أدوات رقمية تربط الراكب بالسائق وشركات النقل مع مراعاة الواقع الفلسطيني — حواجز، طرق بديلة، تحديات يومية", border: EMERALD },
                { icon: "💡", title: "قيمنا", color: "#e0f2fe", desc: "شفافية تامة، خدمة محلية بلهجة تفهمها، وتطوير مستمر بناءً على ملاحظات المجتمع الفلسطيني", border: SKY },
              ].map(c => (
                <div key={c.title} style={{ ...cardStyle, borderTop: `3px solid ${c.border}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{c.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>{c.title}</div>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{c.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, borderRadius: 16, padding: "1.4rem", marginBottom: "2rem", textAlign: "center", color: "#fff", gap: 0 }}>
              {[["2023", "سنة التأسيس"], ["12", "مدينة مغطّاة"], ["50K+", "رحلة مكتملة"], ["98%", "رضا المستخدمين"]].map(([n, l]) => (
                <div key={l} style={{ borderLeft: "1px solid rgba(255,255,255,.2)", padding: "0 10px" }}>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>{n}</div>
                  <div style={{ fontSize: 11, opacity: .85, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: AMBER, textTransform: "uppercase", marginBottom: 10 }}>الفريق المؤسّس</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: "2rem" }}>
              {[
                { i: "أ.ع", n: "أحمد عبد الرحمن", r: "المدير التنفيذي", c: AMBER },
                { i: "س.ح", n: "سارة حسين", r: "مديرة التقنية", c: SKY },
                { i: "م.ن", n: "محمد ناصر", r: "مدير العمليات", c: EMERALD },
                { i: "ل.ق", n: "لينا قاسم", r: "مديرة تجربة المستخدم", c: ROSE },
              ].map(m => (
                <div key={m.n} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(135deg,${m.c},${m.c}cc)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, margin: "0 auto 10px" }}>{m.i}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 3 }}>{m.n}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{m.r}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 16, padding: "20px 22px", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ fontSize: 36, flexShrink: 0 }}>🇵🇸</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#92400e", marginBottom: 6 }}>صُنع بالكامل في فلسطين</div>
                <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.7, marginBottom: 12 }}>من خوارزمية الحواجز إلى اللهجة الفلسطينية في المساعد الذكي — فريقنا يعيش نفس التحديات يومياً.</p>
                <button onClick={() => setActivePage("contact")} style={{ background: AMBER, color: "#fff", border: "none", padding: "8px 20px", borderRadius: 100, fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>تواصل معنا ←</button>
              </div>
            </div>
          </div>
        )}

        {/* ── لماذا مواصلاتي ── */}
        {activePage === "why" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ display: "inline-block", background: "#dcfce7", border: "1px solid #86efac", color: "#14532d", padding: "4px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>⭐ لماذا مواصلاتي</div>
              <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, marginBottom: 10 }}>لأن التنقل في فلسطين يستحق الأفضل</h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>لا نبني تطبيق نقل عادي — نبني أداة مصمَّمة خصيصًا لتحديات الواقع الفلسطيني</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: "2rem" }}>
              {[
                { icon: "🛰️", bg: "#e0f2fe", title: "تتبع GPS حي", desc: "تابع موقع مركبتك لحظةً بلحظة — بلا انتظار في المجهول" },
                { icon: "🛡️", bg: "#fef3c7", title: "خريطة الحواجز الحية", desc: "بيانات محدّثة للحواجز والطرق البديلة من السائقين في الوقت الفعلي" },
                { icon: "🤖", bg: "#d1fae5", title: "مساعد AI بالعربية", desc: "اسأل عن الأسعار والمواعيد وحالة الطرق — يجيبك بلهجة تفهمها" },
                { icon: "💳", bg: "#ffe4e6", title: "دفع مرن", desc: "نقدي، إلكتروني، أو محفظة رقمية — اختر ما يناسبك" },
                { icon: "📊", bg: "#ede9fe", title: "لوحة تحكم الشركات", desc: "تتبع الأسطول وإدارة السائقين والإيرادات في مكان واحد" },
                { icon: "⭐", bg: "#fef9c3", title: "تقييم شفاف", desc: "تقييم حقيقي من الركاب يضمن جودة الخدمة ويكافئ المتميزين" },
                { icon: "🔒", bg: "#ecfdf5", title: "أمان وخصوصية", desc: "بياناتك مشفّرة ولا تُشارَك مع أي طرف ثالث" },
                { icon: "🚀", bg: "#f0fdf4", title: "تطوير مستمر", desc: "فريق محلي يضيف ميزات جديدة كل شهر بناءً على ملاحظات المجتمع" },
              ].map(w => (
                <div key={w.title} style={{ ...cardStyle, display: "flex", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: w.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{w.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4 }}>{w.title}</div>
                    <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkpoint table */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: AMBER, textTransform: "uppercase", marginBottom: 8 }}>حالة الحواجز — مرتبط بـ ع وين رايح؟</div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["الحاجز", "المنطقة", "الحالة", "التأثير"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, borderBottom: "2px solid #e2e8f0" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["قلنديا", "رام الله – القدس", "slow", "تأخير 20–40 دقيقة"],
                      ["حوارة", "نابلس الجنوب", "closed", "طريق بديل عبر حواره"],
                      ["بيت إيل", "رام الله الشمال", "open", "مرور طبيعي"],
                      ["الكونتينر", "بيت لحم – رام الله", "closed", "إغلاق مؤقت"],
                      ["عوارة", "نابلس الجنوب", "open", "مرور طبيعي"],
                    ].map(([name, area, st, effect]) => (
                      <tr key={name} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{name}</td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{area}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: st === "open" ? "#d1fae5" : st === "closed" ? "#fee2e2" : "#fef3c7", color: st === "open" ? "#065f46" : st === "closed" ? "#991b1b" : "#92400e" }}>
                            {st === "open" ? "مفتوح" : st === "closed" ? "مغلق" : "بطيء"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{effect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, background: "#fffbeb", border: "2px solid #F59E0B", borderRadius: 16, padding: "18px 20px", textDecoration: "none", marginBottom: "2rem", cursor: "pointer" }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>🗺️</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#92400e", marginBottom: 4 }}>ع وين رايح؟ — أحوال الطرق في فلسطين</div>
                <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>الموقع الأشمل لأحوال الطرق والحواجز — محدَّث لحظةً بلحظة من مجتمع السائقين.</p>
                <span style={{ display: "inline-block", marginTop: 8, background: AMBER, color: "#fff", padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>🔗 افتح ع وين رايح؟ ←</span>
              </div>
            </a>

            {/* Comparison table */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: AMBER, textTransform: "uppercase", marginBottom: 8 }}>مقارنة</div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["الميزة", "مواصلاتي PS", "الطريقة التقليدية"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, borderBottom: "2px solid #e2e8f0" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["تتبع GPS", "✓ حي ومباشر", "✗ غير متاح"],
                    ["حالة الحواجز", "✓ لحظي تلقائي", "✗ سماع شفهي"],
                    ["الحجز المسبق", "✓ تطبيق", "✗ وقوف بالطريق"],
                    ["الدفع", "✓ متعدد الطرق", "✗ نقدي فقط"],
                    ["تقييم السائق", "✓ شفاف", "✗ غير موجود"],
                  ].map(([feat, pro, trad]) => (
                    <tr key={feat} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>{feat}</td>
                      <td style={{ padding: "10px 14px", color: EMERALD_D, fontWeight: 700 }}>{pro}</td>
                      <td style={{ padding: "10px 14px", color: ROSE_D, fontWeight: 700 }}>{trad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── تواصل معنا ── */}
        {activePage === "contact" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ display: "inline-block", background: "#dbeafe", border: "1px solid #93c5fd", color: "#1e40af", padding: "4px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>✉️ تواصل معنا</div>
              <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, marginBottom: 10 }}>نحن هنا — دائماً</h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.75, maxWidth: 500, margin: "0 auto" }}>سؤال، شراكة، شكوى أو اقتراح — فريقنا يرد خلال ساعتين في وقت العمل</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: "2rem" }}>
              {/* Contact info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "📍", label: "المقر الرئيسي", val: "رام الله — المدينة التقنية", sub: "شارع الإرسال، برج الابتكار، ط3", href: "https://maps.google.com/?q=رام+الله+فلسطين" },
                  { icon: "📞", label: "الدعم الفني", val: "1800-MAWASALATI", sub: "6 صباحاً – 10 مساءً · 7 أيام", href: "tel:+97021800000" },
                  { icon: "✉️", label: "البريد الإلكتروني", val: "info@mawasalati.ps", sub: "شراكات: partners@mawasalati.ps", href: "mailto:info@mawasalati.ps" },
                  { icon: "💬", label: "واتساب — ردّ سريع", val: "+970 59 000 0000", sub: "اضغط للمحادثة الآن", href: "https://wa.me/97059000000" },
                ].map(item => (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                    style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", textDecoration: "none", transition: "border-color .2s" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = AMBER}
                    onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.val}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{item.sub}</div>
                    </div>
                  </a>
                ))}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "📘 فيسبوك", bg: "#dbeafe", border: "#93c5fd", color: "#1d4ed8", href: "https://facebook.com" },
                    { label: "🐦 تويتر X", bg: "#e0f2fe", border: "#7dd3fc", color: SKY_D, href: "https://x.com" },
                    { label: "📸 إنستغرام", bg: "#fce7f3", border: "#f9a8d4", color: "#be185d", href: "https://instagram.com" },
                    { label: "💬 واتساب", bg: "#dcfce7", border: "#86efac", color: "#15803d", href: "https://wa.me/97059000000" },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                      style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: s.bg, border: `1px solid ${s.border}`, color: s.color, textDecoration: "none" }}
                      onMouseOver={e => e.currentTarget.style.opacity = ".75"}
                      onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                      {s.label}
                    </a>
                  ))}
                </div>
                <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer"
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px", textDecoration: "none" }}
                  onMouseOver={e => e.currentTarget.style.borderColor = AMBER}
                  onMouseOut={e => e.currentTarget.style.borderColor = "#fde68a"}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🗺️</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>حالة الحواجز والطرق</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: AMBER_D }}>ع وين رايح؟ ←</div>
                    <div style={{ fontSize: 11, color: "#78350f", marginTop: 1 }}>اضغط لفتح الخريطة الحية</div>
                  </div>
                </a>
              </div>

              {/* Contact form */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22 }}>
                <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 16 }}>أرسل رسالتك</div>
                {[
                  { label: "الاسم الكامل *", key: "name", placeholder: "محمد أحمد", type: "text" },
                  { label: "رقم الهاتف *", key: "phone", placeholder: "059xxxxxxx", type: "tel" },
                  { label: "البريد الإلكتروني", key: "email", placeholder: "example@mail.com", type: "email" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={formData[f.key]}
                      onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                      style={inpStyle}
                      onFocus={e => e.target.style.borderColor = AMBER}
                      onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                  </div>
                ))}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>موضوع الرسالة</label>
                  <select value={formData.subject} onChange={e => setFormData(d => ({ ...d, subject: e.target.value }))}
                    style={inpStyle}
                    onFocus={e => e.target.style.borderColor = AMBER}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}>
                    <option value="">اختر الموضوع</option>
                    <option>دعم فني</option>
                    <option>شراكة أو تعاون</option>
                    <option>شكوى أو اقتراح</option>
                    <option>الانضمام لفريقنا</option>
                    <option>استفسار عام</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>رسالتك</label>
                  <textarea placeholder="اكتب رسالتك هنا..." value={formData.msg}
                    onChange={e => setFormData(d => ({ ...d, msg: e.target.value }))}
                    style={{ ...inpStyle, minHeight: 85, resize: "vertical" }}
                    onFocus={e => e.target.style.borderColor = AMBER}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
                </div>
                <button onClick={submitForm}
                  style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${AMBER},${AMBER_D})`, color: "#fff", fontFamily: "Cairo, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  onMouseOver={e => e.target.style.transform = "translateY(-1px)"}
                  onMouseOut={e => e.target.style.transform = "none"}>
                  إرسال الرسالة ✉️
                </button>
                {formSent && (
                  <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#065f46", fontWeight: 700, textAlign: "center", marginTop: 10 }}>
                    ✅ تم الإرسال بنجاح! سنتواصل معك قريباً.
                  </div>
                )}
              </div>
            </div>

            {/* Quick contact cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: "2rem" }}>
              {[
                { icon: "💬", bg: "#dcfce7", btnBg: "#22c55e", label: "واتساب", sub: "ردّ خلال دقائق", btn: "فتح واتساب ←", href: "https://wa.me/97059000000" },
                { icon: "✉️", bg: "#dbeafe", btnBg: "#3b82f6", label: "إيميل", sub: "للمراسلات الرسمية", btn: "إرسال إيميل ←", href: "mailto:info@mawasalati.ps" },
                { icon: "🗺️", bg: "#fef3c7", btnBg: AMBER, label: "أحوال الطرق", sub: "الحواجز حياً", btn: "افتح الخريطة ←", href: "https://aweenrayeh.com/" },
              ].map(c => (
                <div key={c.label} style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 10px" }}>{c.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{c.label}</div>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{c.sub}</p>
                  <a href={c.href} target="_blank" rel="noreferrer"
                    style={{ display: "inline-block", background: c.btnBg, color: "#fff", padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    {c.btn}
                  </a>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: AMBER, textTransform: "uppercase", marginBottom: 10 }}>الأسئلة الشائعة</div>
            {faqItems.map((item, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{ width: "100%", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: faqOpen === i ? "#fffbeb" : "#fff", border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 13, fontWeight: 700, color: faqOpen === i ? AMBER_D : "#0f172a", transition: "background .2s" }}>
                  <span>{item.q}</span>
                  <span style={{ transform: faqOpen === i ? "rotate(90deg)" : "none", transition: "transform .3s", color: "#94a3b8", fontSize: 16 }}>›</span>
                </button>
                {faqOpen === i && (
                  <div style={{ padding: "0 16px 14px", fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{item.a}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: "#1e293b", color: "#fff", padding: "2.5rem 24px 1.5rem", fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 28, marginBottom: "2rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🚌</div>
                <div style={{ fontWeight: 900, color: AMBER, fontSize: 14 }}>مواصلاتي PS</div>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>منصة النقل الذكي الفلسطينية — تربط الراكب والسائق وشركات النقل بتقنية حديثة</p>
              <div style={{ display: "flex", gap: 6 }}>
                {[["📘", "https://facebook.com"], ["🐦", "https://x.com"], ["📸", "https://instagram.com"], ["💬", "https://wa.me/97059000000"]].map(([icon, href]) => (
                  <a key={icon} href={href} target="_blank" rel="noreferrer"
                    style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, textDecoration: "none" }}
                    onMouseOver={e => e.currentTarget.style.background = "rgba(245,158,11,.3)"}
                    onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}>
                    {icon}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>الصفحات</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["about", "من نحن"], ["why", "لماذا مواصلاتي"], ["contact", "تواصل معنا"]].map(([pg, label]) => (
                  <button key={pg} onClick={() => setActivePage(pg)}
                    style={{ background: "none", border: "none", color: "#94a3b8", fontFamily: "Cairo, sans-serif", fontSize: 12, cursor: "pointer", textAlign: "right", padding: 0 }}
                    onMouseOver={e => e.target.style.color = AMBER}
                    onMouseOut={e => e.target.style.color = "#94a3b8"}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>للمستخدمين</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "#94a3b8" }}>
                <span>تسجيل راكب</span>
                <span>تسجيل سائق</span>
                <span>لوحة الشركات</span>
                <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer" style={{ color: AMBER, textDecoration: "none" }}>خريطة الحواجز ↗</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>الدعم</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["contact", "الأسئلة الشائعة"], ["contact", "راسلنا"]].map(([pg, label]) => (
                  <button key={label} onClick={() => setActivePage(pg)}
                    style={{ background: "none", border: "none", color: "#94a3b8", fontFamily: "Cairo, sans-serif", fontSize: 12, cursor: "pointer", textAlign: "right", padding: 0 }}
                    onMouseOver={e => e.target.style.color = AMBER}
                    onMouseOut={e => e.target.style.color = "#94a3b8"}>
                    {label}
                  </button>
                ))}
                <a href="https://wa.me/97059000000" target="_blank" rel="noreferrer" style={{ color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>واتساب</a>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>سياسة الخصوصية</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 12, color: "#64748b" }}>© 2025 مواصلاتي PS — صُنع بـ❤️ في فلسطين 🇵🇸</p>
            <div style={{ display: "flex", gap: 6 }}>
              {["🔒 آمن ومشفّر", "🇵🇸 فلسطيني 100%"].map(b => (
                <span key={b} style={{ background: "rgba(255,255,255,.07)", border: "0.5px solid rgba(255,255,255,.15)", padding: "3px 10px", borderRadius: 100, fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{b}</span>
              ))}
              <a href="https://aweenrayeh.com/" target="_blank" rel="noreferrer"
                style={{ background: "rgba(245,158,11,.15)", border: "0.5px solid rgba(245,158,11,.4)", padding: "3px 10px", borderRadius: 100, fontSize: 11, color: AMBER, fontWeight: 700, textDecoration: "none" }}>
                🗺️ ع وين رايح؟ ↗
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

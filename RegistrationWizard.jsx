import { useState, useRef } from "react";
import { AMBER, AMBER_D, SKY, SKY_D, EMERALD, EMERALD_D, ROSE, ROSE_D } from "../constants/colors";

export default function RegistrationWizard({ role, onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "", city: "رام الله",
    password: "", confirmPass: "", vehicleType: "bus", plate: "", brand: "",
    year: "", seats: "", color: "", license: "", licenseType: "C",
    routeFrom: "", routeTo: "", stops: "", firstTrip: "07:00", lastTrip: "18:00",
    pricePerSeat: "", companyName: "", regNo: "", numVehicles: "",
    accessLevel: "مدير عام", otp: ["", "", "", ""],
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setOtp = (i, v) => setForm(f => { const o = [...f.otp]; o[i] = v; return { ...f, otp: o }; });

  const roleColor = role === "rider" ? SKY : role === "driver" ? EMERALD : ROSE;
  const roleColorD = role === "rider" ? SKY_D : role === "driver" ? EMERALD_D : ROSE_D;

  const validate = (fields) => {
    const e = {};
    fields.forEach(f => { if (!form[f] || form[f] === "") e[f] = "هذا الحقل مطلوب"; });
    if (fields.includes("phone") && form.phone && !/^05\d{8}$/.test(form.phone)) e.phone = "رقم غير صحيح";
    if (fields.includes("password") && form.password && form.password.length < 6) e.password = "6 أحرف على الأقل";
    if (fields.includes("confirmPass") && form.password !== form.confirmPass) e.confirmPass = "كلمتا المرور لا تتطابقان";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const steps = {
    rider: [
      { title: "معلوماتك الشخصية", fields: ["firstName", "lastName", "phone", "email", "city"], validate: () => validate(["firstName", "lastName", "phone"]) },
      { title: "كلمة المرور والتفضيلات", fields: ["password", "confirmPass"], validate: () => validate(["password", "confirmPass"]) },
      { title: "رمز التحقق", fields: ["otp"], validate: () => true },
    ],
    driver: [
      { title: "المعلومات الشخصية", fields: ["firstName", "lastName", "phone"], validate: () => validate(["firstName", "lastName", "phone"]) },
      { title: "معلومات المركبة", fields: ["plate", "brand", "year", "seats", "color", "license", "licenseType"], validate: () => validate(["plate", "brand", "seats"]) },
      { title: "خط السير والأسعار", fields: ["routeFrom", "routeTo", "stops", "firstTrip", "lastTrip", "pricePerSeat"], validate: () => validate(["routeFrom", "routeTo", "pricePerSeat"]) },
      { title: "رمز التحقق", fields: ["otp"], validate: () => true },
    ],
    manager: [
      { title: "معلومات الشركة", fields: ["companyName", "regNo", "city", "numVehicles"], validate: () => validate(["companyName", "numVehicles"]) },
      { title: "حساب المدير", fields: ["firstName", "lastName", "phone", "email", "password", "confirmPass", "accessLevel"], validate: () => validate(["firstName", "lastName", "phone", "password", "confirmPass"]) },
      { title: "رمز التحقق", fields: ["otp"], validate: () => true },
    ],
  };

  const currentSteps = steps[role];
  const currentStep = currentSteps[step];
  const isLastStep = step === currentSteps.length - 1;

  const handleNext = () => {
    if (currentStep.validate()) {
      if (isLastStep) onComplete(form);
      else setStep(s => s + 1);
    }
  };

  const inp = (label, key, opts = {}) => (
    <div key={key} style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>{label}</label>
      <input
        {...opts}
        value={form[key]}
        onChange={e => { set(key, e.target.value); setErrors(er => ({ ...er, [key]: "" })); }}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${errors[key] ? ROSE : "#e2e8f0"}`, background: "#f8fafc", fontFamily: "Cairo, sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box", direction: opts.dir || "rtl" }}
        onFocus={e => { e.target.style.borderColor = roleColor; e.target.style.boxShadow = `0 0 0 3px ${roleColor}22`; }}
        onBlur={e => { e.target.style.borderColor = errors[key] ? ROSE : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
      />
      {errors[key] && <div style={{ fontSize: 11, color: ROSE_D, marginTop: 3 }}>{errors[key]}</div>}
    </div>
  );

  const sel = (label, key, options) => (
    <div key={key} style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>{label}</label>
      <select value={form[key]} onChange={e => set(key, e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontFamily: "Cairo, sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }}>
        {options.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
      </select>
    </div>
  );

  const row2 = (children) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;

  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const otpJump = (i, v) => {
    setOtp(i, v);
    if (v && i < 3) otpRefs[i + 1].current?.focus();
  };

  const renderFields = () => {
    if (currentStep.fields[0] === "otp") {
      return (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📱</div>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 4 }}>رمز التحقق</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>أدخل الرمز المرسل إلى {form.phone || "هاتفك"}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            {[0, 1, 2, 3].map(i => (
              <input key={i} ref={otpRefs[i]} maxLength={1} value={form.otp[i]}
                onChange={e => otpJump(i, e.target.value)}
                style={{ width: 54, height: 58, borderRadius: 12, border: `2px solid ${roleColor}44`, textAlign: "center", fontSize: 24, fontWeight: 700, fontFamily: "Cairo, sans-serif", outline: "none", background: "#f8fafc" }}
                onFocus={e => { e.target.style.borderColor = roleColor; e.target.style.boxShadow = `0 0 0 3px ${roleColor}22`; }}
                onBlur={e => { e.target.style.borderColor = `${roleColor}44`; e.target.style.boxShadow = "none"; }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>لم يصلك الرمز؟ <button onClick={() => {}} style={{ background: "none", border: "none", color: roleColorD, fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12 }}>إعادة إرسال</button></div>
        </div>
      );
    }

    if (role === "rider") {
      if (step === 0) return <>{row2([inp("الاسم الأول", "firstName", { placeholder: "أحمد" }), inp("الاسم الأخير", "lastName", { placeholder: "محمد" })])}{inp("رقم الهاتف", "phone", { placeholder: "059xxxxxxx", dir: "ltr", type: "tel" })}{inp("البريد الإلكتروني", "email", { placeholder: "example@mail.com", dir: "ltr", type: "email" })}{sel("المدينة", "city", ["رام الله", "نابلس", "جنين", "الخليل", "بيت لحم", "طولكرم"])}</>;
      if (step === 1) return <>{inp("كلمة المرور", "password", { type: "password", placeholder: "••••••••" })}{inp("تأكيد كلمة المرور", "confirmPass", { type: "password", placeholder: "••••••••" })}{sel("وسيلة التنقل المفضلة", "vehicleType", [{ v: "bus", l: "🚌 حافلة" }, { v: "service", l: "🚐 سرفيس" }, { v: "taxi", l: "🚕 تاكسي" }])}</>;
    }

    if (role === "driver") {
      if (step === 0) return <>{row2([inp("الاسم الأول", "firstName", { placeholder: "خالد" }), inp("الاسم الأخير", "lastName", { placeholder: "رمضان" })])}{inp("رقم الهاتف", "phone", { placeholder: "059xxxxxxx", dir: "ltr", type: "tel" })}<div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>نوع المركبة</label><div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>{[{ v: "bus", l: "🚌 حافلة" }, { v: "service", l: "🚐 سرفيس" }, { v: "taxi", l: "🚕 تاكسي" }].map(t => <button key={t.v} onClick={() => set("vehicleType", t.v)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontSize: 12, fontWeight: 700, background: form.vehicleType === t.v ? "#fff" : "transparent", color: form.vehicleType === t.v ? "#0f172a" : "#64748b", boxShadow: form.vehicleType === t.v ? "0 1px 4px rgba(0,0,0,.12)" : "none", transition: "all .2s" }}>{t.l}</button>)}</div></div></>;
      if (step === 1) return <>{inp("رقم اللوحة", "plate", { placeholder: "ح-1234-م", dir: "ltr" })}{row2([inp("الماركة", "brand", { placeholder: "مرسيدس" }), inp("السنة", "year", { placeholder: "2020", dir: "ltr" })])}{row2([inp("عدد المقاعد", "seats", { placeholder: "7", type: "number" }), inp("اللون", "color", { placeholder: "أبيض" })])}{inp("رقم رخصة القيادة", "license", { placeholder: "DL-XXXXXXXX", dir: "ltr" })}{sel("نوع الرخصة", "licenseType", [{ v: "B", l: "B - سيارة خاصة" }, { v: "C", l: "C - سرفيس/تاكسي" }, { v: "D", l: "D - حافلة" }])}</>;
      if (step === 2) return <>{inp("من (نقطة البداية)", "routeFrom", { placeholder: "رام الله" })}{inp("إلى (نقطة النهاية)", "routeTo", { placeholder: "نابلس" })}{inp("نقاط الوقوف (افصل بفاصلة)", "stops", { placeholder: "بيرزيت، كفر ثلث، سبسطية" })}{row2([<div key="a"><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>أول رحلة</label><input type="time" value={form.firstTrip} onChange={e => set("firstTrip", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontFamily: "Cairo, sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>, <div key="b"><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>آخر رحلة</label><input type="time" value={form.lastTrip} onChange={e => set("lastTrip", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontFamily: "Cairo, sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>])}{inp("سعر المقعد (₪)", "pricePerSeat", { placeholder: "20", type: "number" })}</>;
    }

    if (role === "manager") {
      if (step === 0) return <>{inp("اسم الشركة / المكتب", "companyName", { placeholder: "شركة النقل الفلسطيني" })}{inp("رقم السجل التجاري", "regNo", { placeholder: "XXXXXXXXXX", dir: "ltr" })}{sel("المدينة", "city", ["رام الله", "نابلس", "جنين", "الخليل", "بيت لحم", "طولكرم"])}{inp("عدد المركبات", "numVehicles", { placeholder: "10", type: "number" })}</>;
      if (step === 1) return <>{row2([inp("الاسم الأول", "firstName", { placeholder: "سامر" }), inp("الاسم الأخير", "lastName", { placeholder: "حسين" })])}{inp("رقم الهاتف", "phone", { placeholder: "059xxxxxxx", dir: "ltr", type: "tel" })}{inp("البريد الإلكتروني", "email", { placeholder: "manager@company.ps", dir: "ltr", type: "email" })}{inp("كلمة المرور", "password", { type: "password", placeholder: "••••••••" })}{inp("تأكيد كلمة المرور", "confirmPass", { type: "password", placeholder: "••••••••" })}{sel("مستوى الصلاحية", "accessLevel", ["مدير عام", "مشرف عمليات", "محاسب"])}</>;
    }

    return null;
  };

  return (
    <div style={{ fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
        {currentSteps.map((_, i) => (
          <div key={i} style={{ height: 6, borderRadius: 3, background: i < step ? EMERALD : i === step ? roleColor : "#e2e8f0", width: i === step ? 24 : 10, transition: "all .3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#94a3b8" }}>خطوة {step + 1} من {currentSteps.length}</span>
        <span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ color: roleColorD }}>{currentStep.title}</span>
      </div>
      {renderFields()}
      <button onClick={handleNext}
        style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${roleColor},${roleColorD})`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif", marginTop: 8, boxShadow: `0 4px 16px ${roleColor}44`, transition: "all .2s" }}
        onMouseOver={e => e.target.style.transform = "translateY(-1px)"}
        onMouseOut={e => e.target.style.transform = "none"}>
        {isLastStep ? "✓ تحقق وادخل" : "التالي ←"}
      </button>
      {step > 0 && (
        <button onClick={() => setStep(s => s - 1)}
          style={{ width: "100%", padding: "11px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "transparent", color: "#475569", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif", marginTop: 8 }}>
          → رجوع
        </button>
      )}
    </div>
  );
}

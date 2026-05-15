import { useRef, useEffect, useCallback } from "react";
import { AMBER, AMBER_D, SKY, SKY_D, EMERALD } from "../constants/colors";

export default function GPSMap({ role }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef({ x: 80, y: 110, dir: 1 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#e8f4f8";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(14,165,233,.1)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 35) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 35) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(W, 110); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, H); ctx.stroke();
    ctx.strokeStyle = "rgba(255,220,100,.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(W, 110); ctx.stroke();
    ctx.setLineDash([]);
    const dp = posRef.current;
    const rp = { x: 200, y: 110 };
    ctx.strokeStyle = "rgba(14,165,233,.55)";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(dp.x, dp.y); ctx.lineTo(rp.x, rp.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(14,165,233,.2)";
    ctx.beginPath(); ctx.arc(rp.x, rp.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0EA5E9";
    ctx.beginPath(); ctx.arc(rp.x, rp.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(rp.x, rp.y, 4, 0, Math.PI * 2); ctx.fill();
    const vColor = role === "driver" ? "#10B981" : role === "manager" ? "#F43F5E" : "#F59E0B";
    ctx.fillStyle = vColor;
    ctx.beginPath();
    ctx.roundRect(dp.x - 14, dp.y - 10, 28, 20, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "13px serif";
    ctx.textAlign = "center";
    ctx.fillText(role === "driver" ? "🚐" : role === "manager" ? "📊" : "🚌", dp.x, dp.y + 5);
    ctx.fillStyle = "#E11D48";
    ctx.font = "18px serif";
    ctx.fillText("📍", 340, 88);
    ctx.fillStyle = "rgba(245,158,11,.9)";
    ctx.font = "bold 8px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("أنت هنا", rp.x, rp.y - 28);
  }, [role]);

  useEffect(() => {
    const animate = () => {
      const p = posRef.current;
      p.x += p.dir * 0.7;
      if (p.x > 155) p.dir = -1;
      if (p.x < 40) p.dir = 1;
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    draw();
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <canvas ref={canvasRef} width={400} height={180} style={{ width: "100%", display: "block", background: "#e8f4f8" }} />
      <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: SKY_D, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: EMERALD, display: "inline-block", animation: "blink 1.5s infinite" }} />
        GPS مباشر
      </div>
      <div style={{ position: "absolute", bottom: 10, right: 10, background: AMBER_D, color: "#fff", padding: "4px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
        📍 رام الله — المنارة
      </div>
    </div>
  );
}

// BorsaRadar — AI Yatırım Simülasyonu
// Her AI'a 100.000 TL sanal bakiye, gerçek fiyatlarla al/sat yarışması
import { useState, useEffect, useCallback, useRef, memo } from "react";
import Head from "next/head";

const BASLANGIC_BAKIYE = 100000;
const AI_LIST = [
  { id: "claude", isim: "Claude Haiku", logo: "✦", renk: "#c07ae0", bg: "#180e26", bd: "#3a1e60", tanim: "Anthropic — Analitik & temkinli" },
  { id: "gpt",    isim: "GPT-4o Mini",  logo: "⬡", renk: "#10a37f", bg: "#061a14", bd: "#0e3a2a", tanim: "OpenAI — Dengeli & veri odaklı" },
  { id: "llama",  isim: "Llama 3.3",    logo: "🦙", renk: "#4a8af0", bg: "#0a1428", bd: "#1a3466", tanim: "Groq/Meta — Agresif & hızlı" },
];

const md = t => {
  if (!t) return "";
  return t.replace(/\*\*(.+?)\*\*/g, "<strong style='color:#f0f4f0'>$1</strong>")
    .replace(/\n/g, "<br/>");
};

const para = (n, decimals = 0) => {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const paraTL = (n) => `₺${para(n, 0)}`;
const pct = (n) => `${n >= 0 ? "+" : ""}${n?.toFixed(2) || "0.00"}%`;
const renk = (n) => n >= 0 ? "#50dd90" : "#ff7070";
const tarih = () => new Date().toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const Dots = memo(({ color = "#4a9a6a", size = 6 }) => (
  <span style={{ display: "inline-flex", gap: 4, alignItems: "center", verticalAlign: "middle" }}>
    {[0, 1, 2].map(i => <span key={i} style={{ width: size, height: size, borderRadius: "50%", background: color, display: "inline-block", animation: `dp 1.3s ${i * .22}s infinite` }} />)}
  </span>
));

// ─── PORTFÖY KARTI ────────────────────────────────────────────────────────────
const PortfoyKarti = memo(({ ai, portfoy, bakiye, loglar, yukl, onKarar, onFiyatGuncelle }) => {
  const portfoyDeger = portfoy.reduce((s, p) => s + p.adet * (p.guncelFiyat || p.alisFiyat), 0);
  const toplamDeger = bakiye + portfoyDeger;
  const getiri = toplamDeger - BASLANGIC_BAKIYE;
  const getiriPct = (getiri / BASLANGIC_BAKIYE) * 100;
  const sonLog = loglar[loglar.length - 1];

  return (
    <div style={{ background: ai.bg, border: `2px solid ${ai.bd}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
      {/* Başlık */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, color: ai.renk }}>{ai.logo}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: ai.renk }}>{ai.isim}</div>
            <div style={{ fontSize: 10, color: ai.renk + "80" }}>{ai.tanim}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: renk(getiri), fontFamily: "monospace" }}>{paraTL(toplamDeger)}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: renk(getiri) }}>{pct(getiriPct)} ({getiri >= 0 ? "+" : ""}{paraTL(Math.abs(getiri))})</div>
        </div>
      </div>

      {/* Özet bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "#00000030", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ fontSize: 9, color: ai.renk + "80", marginBottom: 2 }}>NAKİT</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#c0d8e4", fontFamily: "monospace" }}>{paraTL(bakiye)}</div>
        </div>
        <div style={{ flex: 1, background: "#00000030", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ fontSize: 9, color: ai.renk + "80", marginBottom: 2 }}>PORTFÖY</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#c0d8e4", fontFamily: "monospace" }}>{paraTL(portfoyDeger)}</div>
        </div>
        <div style={{ flex: 1, background: "#00000030", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ fontSize: 9, color: ai.renk + "80", marginBottom: 2 }}>İŞLEMLER</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#c0d8e4", fontFamily: "monospace" }}>{loglar.length}</div>
        </div>
      </div>

      {/* Pozisyonlar */}
      {portfoy.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {portfoy.map((p, i) => {
            const plPct = p.guncelFiyat ? ((p.guncelFiyat - p.alisFiyat) / p.alisFiyat * 100) : 0;
            const plTL = p.guncelFiyat ? ((p.guncelFiyat - p.alisFiyat) * p.adet) : 0;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#00000025", borderRadius: 5, marginBottom: 4, border: `1px solid ${plTL >= 0 ? "#2a5a3a" : "#5a2a2a"}` }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#80d0a0", fontFamily: "monospace" }}>{p.sembol}</span>
                  <span style={{ fontSize: 10, color: "#4a7060", marginLeft: 8 }}>{para(p.adet, 4)} adet @ ₺{para(p.alisFiyat, 2)}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: renk(plTL), fontFamily: "monospace" }}>{pct(plPct)}</div>
                  <div style={{ fontSize: 10, color: renk(plTL) }}>{plTL >= 0 ? "+" : ""}{paraTL(plTL)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Son karar */}
      {sonLog && (
        <div style={{ padding: "8px 10px", background: "#00000030", borderRadius: 6, marginBottom: 10, borderLeft: `3px solid ${sonLog.islem === "AL" ? "#50dd90" : sonLog.islem === "SAT" ? "#ff7070" : "#ffcc44"}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: sonLog.islem === "AL" ? "#50dd90" : sonLog.islem === "SAT" ? "#ff7070" : "#ffcc44", fontFamily: "monospace" }}>{sonLog.islem}</span>
            {sonLog.sembol && <span style={{ fontSize: 11, color: "#80b0c0", fontFamily: "monospace" }}>{sonLog.sembol}</span>}
            {sonLog.fiyat && (
              <span style={{ fontSize: 11, fontFamily: "monospace", color: sonLog.islem === "AL" ? "#50dd90" : "#ff9060", background: "#00000030", padding: "1px 6px", borderRadius: 3 }}>
                @ {sonLog.para === "USD" ? "$" : "₺"}{para(sonLog.fiyat, sonLog.fiyat > 100 ? 2 : 4)}
              </span>
            )}
            {sonLog.miktar_tl && <span style={{ fontSize: 10, color: "#4a6070" }}>{paraTL(sonLog.miktar_tl)}</span>}
            <span style={{ fontSize: 9, color: "#2a4050", marginLeft: "auto" }}>{sonLog.tarih}</span>
          </div>
          <div style={{ fontSize: 10, color: "#6a9090", lineHeight: 1.5 }}>{sonLog.gerekce}</div>
        </div>
      )}

      {/* Butonlar */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onKarar(ai.id)} disabled={yukl}
          style={{ flex: 1, padding: "10px", background: ai.bg, border: `1px solid ${ai.renk}50`, borderRadius: 8, color: ai.renk, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
          {yukl ? <><Dots color={ai.renk} size={5} /> Karar veriyor...</> : "🤖 AI Karar Ver"}
        </button>
        <button onClick={() => onFiyatGuncelle(ai.id)}
          style={{ padding: "10px 14px", background: "#0a1828", border: "1px solid #1e3a50", borderRadius: 8, color: "#4a8090", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
          ↻ Fiyat
        </button>
      </div>
    </div>
  );
});

// ─── LOG TABLOSU ──────────────────────────────────────────────────────────────
const LogTablosu = memo(({ loglar, aiRenkler }) => {
  if (!loglar.length) return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#2a4050" }}>
      <div style={{ fontSize: 32, opacity: .1, marginBottom: 8 }}>📋</div>
      <div style={{ fontSize: 13 }}>Henüz işlem yok</div>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1e3040", color: "#3a6070", textAlign: "left" }}>
            {["Tarih", "AI", "İşlem", "Sembol", "Adet", "Al/Sat Fiyatı", "Tutar", "K/Z", "Gerekçe"].map(h => (
              <th key={h} style={{ padding: "8px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...loglar].reverse().map((log, i) => {
            const ai = aiRenkler[log.aiId];
            const iRenk = log.islem === "AL" ? "#50dd90" : log.islem === "SAT" ? "#ff7070" : "#ffcc44";
            return (
              <tr key={i} style={{ borderBottom: "1px solid #1a2530", transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1a2530"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "8px 10px", color: "#3a5060", whiteSpace: "nowrap" }}>{log.tarih}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ color: ai?.renk, fontWeight: 700 }}>{ai?.logo} {ai?.isim}</span>
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ color: iRenk, fontWeight: 800, fontFamily: "monospace", background: iRenk + "15", padding: "2px 8px", borderRadius: 4 }}>{log.islem}</span>
                </td>
                <td style={{ padding: "8px 10px", color: "#80d0a0", fontFamily: "monospace", fontWeight: 700 }}>{log.sembol || "—"}</td>
                <td style={{ padding: "8px 10px", color: "#8090a0", fontFamily: "monospace", fontSize: 10 }}>
                  {log.adet ? para(log.adet, log.adet < 1 ? 4 : 2) : "—"}
                </td>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {log.fiyat
                    ? <span style={{ color: log.islem === "AL" ? "#50dd90" : log.islem === "SAT" ? "#ff9060" : "#c0d8e4", fontWeight: 700 }}>
                        {log.para === "USD" ? "$" : "₺"}{para(log.fiyat, log.fiyat > 100 ? 2 : 4)}
                      </span>
                    : "—"}
                </td>
                <td style={{ padding: "8px 10px", color: "#c0d8e4", fontFamily: "monospace", whiteSpace: "nowrap" }}>{log.miktar_tl ? paraTL(log.miktar_tl) : "—"}</td>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {log.plTL != null
                    ? <span style={{ color: log.plTL >= 0 ? "#50dd90" : "#ff7070", fontWeight: 700 }}>
                        {log.plTL >= 0 ? "+" : ""}{paraTL(log.plTL)}
                      </span>
                    : <span style={{ color: "#3a5060" }}>—</span>}
                </td>
                <td style={{ padding: "8px 10px", color: "#6a9090", maxWidth: 240, lineHeight: 1.4 }}>{log.gerekce}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

// ─── PERFORMANS GRAFİĞİ (SVG) ─────────────────────────────────────────────────
const PerformansGrafik = memo(({ anlık }) => {
  if (!anlık || anlık.length < 2) return (
    <div style={{ textAlign: "center", padding: "30px", color: "#2a4050", fontSize: 12 }}>
      Grafik için en az 2 veri noktası gerekli.<br />AI karar verdikçe dolacak.
    </div>
  );

  const genislik = 600, yukseklik = 160, pad = 40;
  const xs = genislik - pad * 2;
  const ys = yukseklik - pad;
  const vals = anlık.flatMap(d => AI_LIST.map(ai => d[ai.id] || 0));
  const minV = Math.min(...vals, BASLANGIC_BAKIYE) * 0.995;
  const maxV = Math.max(...vals, BASLANGIC_BAKIYE) * 1.005;
  const xScale = i => pad + (i / (anlık.length - 1)) * xs;
  const yScale = v => yukseklik - pad / 2 - ((v - minV) / (maxV - minV)) * ys;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${genislik} ${yukseklik}`} style={{ width: "100%", minWidth: 300, height: yukseklik }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(r => {
          const y = yukseklik - pad / 2 - r * ys;
          const val = minV + r * (maxV - minV);
          return (
            <g key={r}>
              <line x1={pad} y1={y} x2={genislik - pad} y2={y} stroke="#1a2530" strokeWidth={1} />
              <text x={pad - 4} y={y + 3} fill="#2a4050" fontSize={9} textAnchor="end">{paraTL(val)}</text>
            </g>
          );
        })}
        {/* Başlangıç çizgisi */}
        <line x1={pad} y1={yScale(BASLANGIC_BAKIYE)} x2={genislik - pad} y2={yScale(BASLANGIC_BAKIYE)}
          stroke="#3a5060" strokeWidth={1} strokeDasharray="4,4" />
        {/* AI çizgileri */}
        {AI_LIST.map(ai => {
          const pts = anlık.map((d, i) => `${xScale(i)},${yScale(d[ai.id] || BASLANGIC_BAKIYE)}`).join(" ");
          return (
            <g key={ai.id}>
              <polyline points={pts} fill="none" stroke={ai.renk} strokeWidth={2} strokeLinejoin="round" />
              {anlık.map((d, i) => d[ai.id] != null && (
                <circle key={i} cx={xScale(i)} cy={yScale(d[ai.id])} r={3} fill={ai.renk} />
              ))}
            </g>
          );
        })}
        {/* Etiketler */}
        {AI_LIST.map(ai => {
          const son = anlık.at(-1)?.[ai.id];
          if (!son) return null;
          return <text key={ai.id} x={genislik - pad + 4} y={yScale(son) + 3} fill={ai.renk} fontSize={9}>{ai.logo}</text>;
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "4px 0 8px" }}>
        {AI_LIST.map(ai => (
          <div key={ai.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: ai.renk }}>
            <span style={{ width: 20, height: 2, background: ai.renk, display: "inline-block" }} />
            {ai.isim}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#3a5060" }}>
          <span style={{ width: 20, height: 1, background: "#3a5060", display: "inline-block", borderTop: "1px dashed #3a5060" }} />
          Başlangıç
        </div>
      </div>
    </div>
  );
});

// ─── LİDERLER TABLOSU ─────────────────────────────────────────────────────────
const LiderTablosu = memo(({ durumlar }) => {
  const sirali = [...AI_LIST].sort((a, b) => {
    const da = durumlar[a.id], db = durumlar[b.id];
    const ta = (da?.bakiye || BASLANGIC_BAKIYE) + (da?.portfoy || []).reduce((s, p) => s + p.adet * (p.guncelFiyat || p.alisFiyat), 0);
    const tb = (db?.bakiye || BASLANGIC_BAKIYE) + (db?.portfoy || []).reduce((s, p) => s + p.adet * (p.guncelFiyat || p.alisFiyat), 0);
    return tb - ta;
  });

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
      {sirali.map((ai, rank) => {
        const d = durumlar[ai.id] || {};
        const portfoyD = (d.portfoy || []).reduce((s, p) => s + p.adet * (p.guncelFiyat || p.alisFiyat), 0);
        const toplam = (d.bakiye ?? BASLANGIC_BAKIYE) + portfoyD;
        const getiri = toplam - BASLANGIC_BAKIYE;
        const getiriPct = (getiri / BASLANGIC_BAKIYE) * 100;
        const medals = ["🥇", "🥈", "🥉"];
        return (
          <div key={ai.id} style={{ flex: 1, minWidth: 160, background: ai.bg, border: `2px solid ${rank === 0 ? ai.renk : ai.bd}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{medals[rank]}</span>
              <span style={{ fontSize: 14, color: ai.renk }}>{ai.logo} {ai.isim}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: renk(getiri), fontFamily: "monospace", marginBottom: 2 }}>{paraTL(toplam)}</div>
            <div style={{ fontSize: 12, color: renk(getiri), fontWeight: 600 }}>{pct(getiriPct)}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 10, color: "#3a5060" }}>
              <span>💼 {(d.portfoy || []).length} pozisyon</span>
              <span>📋 {(d.loglar || []).length} işlem</span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function SimulasyonSayfasi() {
  // Her AI'ın durumu: { bakiye, portfoy: [{sembol, adet, alisFiyat, guncelFiyat}], loglar: [] }
  const [durumlar, setDurumlar] = useState(() => {
    const baslangic = {};
    AI_LIST.forEach(ai => {
      baslangic[ai.id] = { bakiye: BASLANGIC_BAKIYE, portfoy: [], loglar: [] };
    });
    return baslangic;
  });

  const [anlık, setAnlık] = useState([]); // performans geçmişi
  const [yukl, setYukl] = useState({}); // hangi AI yüklenyor
  const [fiyatYukl, setFiyatYukl] = useState({});
  const [aktifTab, setAktifTab] = useState("genel"); // genel | loglar | grafik | manuel
  const [aktifAI, setAktifAI] = useState("claude");
  const [haberler, setHaberler] = useState([]);
  const [fiyatlar, setFiyatlar] = useState([]);
  const [sifirlaniyor, setSifirlaniyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  const aiRenkMap = Object.fromEntries(AI_LIST.map(ai => [ai.id, ai]));

  // ─── localStorage yükleme ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const d = localStorage.getItem("br_sim_durum");
      if (d) setDurumlar(JSON.parse(d));
    } catch {}
    try {
      const a = localStorage.getItem("br_sim_anlik");
      if (a) setAnlık(JSON.parse(a));
    } catch {}
    // Haberleri ve fiyatları çek
    fetch("/api/news").then(r => r.json()).then(d => { if (d.haberler) setHaberler(d.haberler.slice(0, 10)); }).catch(() => {});
    fetch("/api/prices").then(r => r.json()).then(d => { if (d.fiyatlar) setFiyatlar(d.fiyatlar); }).catch(() => {});
  }, []);

  // ─── localStorage kaydetme ──────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem("br_sim_durum", JSON.stringify(durumlar)); } catch {}
  }, [durumlar]);

  useEffect(() => {
    try { localStorage.setItem("br_sim_anlik", JSON.stringify(anlık.slice(-200))); } catch {}
  }, [anlık]);

  // ─── Anlık snapshot ekle ────────────────────────────────────────────────
  const snapshotEkle = useCallback((yeniDurumlar) => {
    const snapshot = { ts: Date.now(), zaman: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) };
    AI_LIST.forEach(ai => {
      const d = yeniDurumlar[ai.id];
      if (!d) return;
      const portfoyD = d.portfoy.reduce((s, p) => s + p.adet * (p.guncelFiyat || p.alisFiyat), 0);
      snapshot[ai.id] = d.bakiye + portfoyD;
    });
    setAnlık(prev => [...prev, snapshot]);
  }, []);

  // ─── Fiyat güncelle ─────────────────────────────────────────────────────
  const fiyatGuncelle = useCallback(async (aiId) => {
    const portfoy = durumlar[aiId]?.portfoy || [];
    if (!portfoy.length) { setMesaj({ tip: "bilgi", text: `${aiId}: Portföy boş, güncellenecek pozisyon yok.` }); return; }

    setFiyatYukl(p => ({ ...p, [aiId]: true }));
    const yeniPortfoy = [...portfoy];

    await Promise.allSettled(yeniPortfoy.map(async (pos, i) => {
      try {
        const r = await fetch(`/api/sim-fiyat?sembol=${encodeURIComponent(pos.sembol)}`);
        const d = await r.json();
        if (d.fiyat) yeniPortfoy[i] = { ...pos, guncelFiyat: d.fiyat };
      } catch {}
    }));

    setDurumlar(prev => {
      const yeni = { ...prev, [aiId]: { ...prev[aiId], portfoy: yeniPortfoy } };
      snapshotEkle(yeni);
      return yeni;
    });
    setFiyatYukl(p => ({ ...p, [aiId]: false }));
  }, [durumlar, snapshotEkle]);

  // ─── Tüm fiyatları güncelle ─────────────────────────────────────────────
  const tumFiyatGuncelle = useCallback(async () => {
    for (const ai of AI_LIST) await fiyatGuncelle(ai.id);
    setMesaj({ tip: "basari", text: "Tüm fiyatlar güncellendi!" });
    setTimeout(() => setMesaj(null), 3000);
  }, [fiyatGuncelle]);

  // ─── AI Karar ver ───────────────────────────────────────────────────────
  const aiKararVer = useCallback(async (aiId) => {
    setYukl(p => ({ ...p, [aiId]: true }));
    setMesaj({ tip: "bilgi", text: `${AI_LIST.find(a => a.id === aiId)?.isim} karar veriyor...` });

    try {
      // Önce güncel fiyatları çek
      await fiyatGuncelle(aiId);
      const d = durumlar[aiId];

      const r = await fetch("/api/sim-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiKim: aiId,
          portfoy: d.portfoy,
          bakiye: d.bakiye,
          haberler,
          fiyatlar,
        }),
      });
      const res = await r.json();
      if (!res.ok) throw new Error(res.error || "AI yanıt vermedi");

      const karar = res.karar;

      // Gerçek anlık fiyatı çek — AL veya SAT işlemlerinde
      let gercekFiyat = null;
      let paraBirimi = "TRY";
      if ((karar.islem === "AL" || karar.islem === "SAT") && karar.sembol) {
        try {
          const fr = await fetch(`/api/sim-fiyat?sembol=${encodeURIComponent(karar.sembol)}`);
          const fd = await fr.json();
          if (fd.fiyat) {
            gercekFiyat = fd.fiyat;
            paraBirimi = fd.para || "TRY";
          }
        } catch {}
      }

      const log = {
        ...karar,
        aiId,
        tarih: tarih(),
        id: Date.now(),
        fiyat: gercekFiyat,
        para: paraBirimi,
      };

      // İşlemi gerçekleştir
      setDurumlar(prev => {
        const durum = { ...prev[aiId] };
        durum.loglar = [...durum.loglar, log];

        if (karar.islem === "AL" && karar.sembol && karar.miktar_tl > 0) {
          if (durum.bakiye < karar.miktar_tl) {
            log.gerekce += ` [YETERSİZ BAKİYE — ${paraTL(durum.bakiye)} mevcut]`;
          } else if (!gercekFiyat) {
            log.gerekce += ` [FİYAT ALINAMADI — işlem iptal]`;
          } else {
            const adet = karar.miktar_tl / gercekFiyat;
            const mevcut = durum.portfoy.find(p => p.sembol === karar.sembol.toUpperCase());
            if (mevcut) {
              // Ortalama maliyet güncelle
              const yeniAdet = mevcut.adet + adet;
              const yeniMaliyet = (mevcut.alisFiyat * mevcut.adet + gercekFiyat * adet) / yeniAdet;
              durum.portfoy = durum.portfoy.map(p => p.sembol === karar.sembol.toUpperCase()
                ? { ...p, adet: yeniAdet, alisFiyat: parseFloat(yeniMaliyet.toFixed(4)), guncelFiyat: gercekFiyat }
                : p
              );
            } else {
              durum.portfoy = [...durum.portfoy, {
                sembol: karar.sembol.toUpperCase(),
                adet,
                alisFiyat: gercekFiyat,
                guncelFiyat: gercekFiyat,
                para: paraBirimi,
              }];
            }
            durum.bakiye -= karar.miktar_tl;
            log.adet = adet;
          }
        } else if (karar.islem === "SAT" && karar.sembol) {
          const pos = durum.portfoy.find(p => p.sembol === karar.sembol.toUpperCase());
          if (!pos) {
            log.gerekce += ` [POZİSYON YOK — ${karar.sembol} portföyde değil]`;
          } else {
            const satisFiyati = gercekFiyat || pos.guncelFiyat || pos.alisFiyat;
            log.fiyat = satisFiyati;
            log.alisFiyati = pos.alisFiyat; // alış referansı için sakla
            let satAdet = pos.adet;
            if (karar.miktar_tl && karar.miktar_tl < pos.adet * satisFiyati) {
              satAdet = karar.miktar_tl / satisFiyati;
            }
            const gelir = satAdet * satisFiyati;
            const plTL = (satisFiyati - pos.alisFiyat) * satAdet;
            durum.bakiye += gelir;
            log.miktar_tl = gelir;
            log.plTL = plTL; // kâr/zarar
            log.adet = satAdet;
            const kalanAdet = pos.adet - satAdet;
            if (kalanAdet < 0.0001) {
              durum.portfoy = durum.portfoy.filter(p => p.sembol !== karar.sembol.toUpperCase());
            } else {
              durum.portfoy = durum.portfoy.map(p => p.sembol === karar.sembol.toUpperCase()
                ? { ...p, adet: kalanAdet, guncelFiyat: satisFiyati }
                : p
              );
            }
          }
        }
        // TUT — sadece log
        const yeniDurumlar = { ...prev, [aiId]: durum };
        snapshotEkle(yeniDurumlar);
        return yeniDurumlar;
      });

      setMesaj({ tip: "basari", text: `${AI_LIST.find(a => a.id === aiId)?.isim}: ${karar.islem}${karar.sembol ? " " + karar.sembol : ""} — ${karar.gerekce?.slice(0, 80)}...` });
    } catch (e) {
      setMesaj({ tip: "hata", text: `${aiId} hata: ${e.message}` });
    }
    setYukl(p => ({ ...p, [aiId]: false }));
    setTimeout(() => setMesaj(null), 6000);
  }, [durumlar, haberler, fiyatlar, fiyatGuncelle, snapshotEkle]);

  // ─── Tüm AI'lar karar versin ────────────────────────────────────────────
  const tumunuCalistir = useCallback(async () => {
    for (const ai of AI_LIST) {
      await aiKararVer(ai.id);
      await new Promise(r => setTimeout(r, 1500)); // rate limit için bekle
    }
    setMesaj({ tip: "basari", text: "Tüm AI'lar karar verdi! Performans güncellendi." });
  }, [aiKararVer]);

  // ─── Sıfırla ────────────────────────────────────────────────────────────
  const sifirla = useCallback(() => {
    if (!confirm("Tüm simülasyon verisi silinecek! Emin misin?")) return;
    const baslangic = {};
    AI_LIST.forEach(ai => { baslangic[ai.id] = { bakiye: BASLANGIC_BAKIYE, portfoy: [], loglar: [] }; });
    setDurumlar(baslangic);
    setAnlık([]);
    localStorage.removeItem("br_sim_durum");
    localStorage.removeItem("br_sim_anlik");
    setMesaj({ tip: "basari", text: "Simülasyon sıfırlandı. Herkes yeniden ₺100.000 ile başlıyor!" });
    setTimeout(() => setMesaj(null), 4000);
  }, []);

  // ─── Manuel işlem ───────────────────────────────────────────────────────
  const [manuelAI, setManuelAI] = useState("claude");
  const [manuelIslem, setManuelIslem] = useState("AL");
  const [manuelSembol, setManuelSembol] = useState("");
  const [manuelTutar, setManuelTutar] = useState("");

  const manuelIslemYap = useCallback(async () => {
    if (!manuelSembol || !manuelTutar) return;
    const tutar = parseFloat(manuelTutar);
    if (isNaN(tutar) || tutar <= 0) return;

    setYukl(p => ({ ...p, [manuelAI]: true }));
    try {
      // Gerçek anlık fiyat çek
      const r = await fetch(`/api/sim-fiyat?sembol=${encodeURIComponent(manuelSembol)}`);
      const fd = await r.json();
      const fiyat = fd.fiyat;
      const paraBirimi = fd.para || "TRY";
      if (!fiyat) throw new Error(fd.error || "Fiyat alınamadı — sembol geçersiz olabilir");

      const s = manuelSembol.toUpperCase();
      const sembolGercek = fd.yahooSembol?.replace(".IS","") || s; // .IS olmadan göster
      const adet = manuelIslem === "AL" ? tutar / fiyat : null;

      const log = {
        aiId: manuelAI,
        islem: manuelIslem,
        sembol: sembolGercek,
        miktar_tl: tutar,
        fiyat,
        para: paraBirimi,
        adet: manuelIslem === "AL" ? adet : null,
        gerekce: "Manuel işlem",
        strateji: "Manuel",
        tarih: tarih(),
        id: Date.now(),
        manuel: true,
      };

      setDurumlar(prev => {
        const durum = { ...prev[manuelAI] };
        if (manuelIslem === "AL") {
          if (durum.bakiye < tutar) throw new Error(`Yetersiz bakiye — ${paraTL(durum.bakiye)} mevcut`);
          const mevcut = durum.portfoy.find(p => p.sembol === sembolGercek);
          if (mevcut) {
            const yeniAdet = mevcut.adet + adet;
            const yeniM = (mevcut.alisFiyat * mevcut.adet + fiyat * adet) / yeniAdet;
            durum.portfoy = durum.portfoy.map(p => p.sembol === sembolGercek
              ? { ...p, adet: yeniAdet, alisFiyat: parseFloat(yeniM.toFixed(4)), guncelFiyat: fiyat, para: paraBirimi }
              : p
            );
          } else {
            durum.portfoy = [...durum.portfoy, { sembol: sembolGercek, adet, alisFiyat: fiyat, guncelFiyat: fiyat, para: paraBirimi }];
          }
          durum.bakiye -= tutar;
        } else {
          const pos = durum.portfoy.find(p => p.sembol === sembolGercek);
          if (!pos) throw new Error(`Pozisyon yok — ${sembolGercek} portföyde değil`);
          const satAdet = Math.min(pos.adet, tutar / fiyat);
          const gelir = satAdet * fiyat;
          const plTL = (fiyat - pos.alisFiyat) * satAdet;
          log.adet = satAdet;
          log.miktar_tl = gelir;
          log.plTL = plTL;
          log.alisFiyati = pos.alisFiyat;
          durum.bakiye += gelir;
          const kalan = pos.adet - satAdet;
          durum.portfoy = kalan < 0.0001
            ? durum.portfoy.filter(p => p.sembol !== sembolGercek)
            : durum.portfoy.map(p => p.sembol === sembolGercek ? { ...p, adet: kalan, guncelFiyat: fiyat } : p);
        }
        durum.loglar = [...durum.loglar, log];
        const yeni = { ...prev, [manuelAI]: durum };
        snapshotEkle(yeni);
        return yeni;
      });

      const semPara = paraBirimi === "USD" ? "$" : "₺";
      setManuelSembol(""); setManuelTutar("");
      setMesaj({ tip: "basari", text: `✅ Manuel: ${manuelIslem} ${sembolGercek} @ ${semPara}${para(fiyat, fiyat > 100 ? 2 : 4)} | ${paraTL(tutar)}` });
    } catch (e) {
      setMesaj({ tip: "hata", text: `❌ Manuel işlem hatası: ${e.message}` });
    }
    setYukl(p => ({ ...p, [manuelAI]: false }));
    setTimeout(() => setMesaj(null), 5000);
  }, [manuelAI, manuelIslem, manuelSembol, manuelTutar, snapshotEkle]);

  // Tüm loglar birleşik
  const tumLoglar = AI_LIST.flatMap(ai =>
    (durumlar[ai.id]?.loglar || []).map(l => ({ ...l, aiId: ai.id }))
  ).sort((a, b) => b.id - a.id);

  const tumIslemSayisi = tumLoglar.length;
  const simBaslangic = anlık[0]?.zaman;

  const CSS = `
    @keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
    @keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    html,body{margin:0;padding:0;background:#0f1318;color:#d4dde6;font-family:'Inter',sans-serif}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a3a4a;border-radius:4px}
    textarea:focus,input:focus{outline:none}
    .tab{background:none;border:none;font-family:'Inter',sans-serif;cursor:pointer;font-size:12px;font-weight:500;padding:10px 16px;color:#4a6a7a;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
    .tab.on{color:#d8eef4;border-bottom-color:#4a9a7a}
    .btn-p{background:#142a1e;border:1px solid #3a7a5a;color:#6abf90;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:6px}
    .btn-p:disabled{opacity:.3;cursor:not-allowed}
    .inp{background:#161d24;border:1px solid #243040;color:#d4dde6;border-radius:6px;padding:9px 12px;font-size:13px;font-family:'Inter',sans-serif;width:100%}
    .inp:focus{border-color:#3a7a5a}
    .mesaj-basari{background:#0a2010;border:1px solid #3a8a50;border-radius:8px;padding:10px 16px;color:#70dd90;font-size:12px;animation:fadein .3s ease}
    .mesaj-hata{background:#200808;border:1px solid #8a3a3a;border-radius:8px;padding:10px 16px;color:#ff8080;font-size:12px;animation:fadein .3s ease}
    .mesaj-bilgi{background:#0a1828;border:1px solid #2a5a80;border-radius:8px;padding:10px 16px;color:#70a8d0;font-size:12px;animation:fadein .3s ease}
  `;

  return (
    <>
      <Head>
        <title>AI Yatırım Simülasyonu — BorsaRadar</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{CSS}</style>

      <div style={{ minHeight: "100vh", background: "#0f1318", color: "#d4dde6" }}>
        {/* HEADER */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #1a2530", background: "#0b0f14", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ color: "#4a7060", fontSize: 12, textDecoration: "none" }}>← BorsaRadar</a>
            <div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#e0eef0" }}>AI</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4aaa70" }}>Simülasyon</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: "#2a4050" }}>
              <span>💰 ₺100.000 × 3 AI</span>
              {simBaslangic && <span>· Başlangıç: {simBaslangic}</span>}
              <span>· {tumIslemSayisi} toplam işlem</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={tumFiyatGuncelle} className="btn-p" style={{ fontSize: 12, padding: "8px 14px", borderColor: "#1e4060", color: "#4a8090", background: "#0a1428" }}>
              ↻ Fiyat Güncelle
            </button>
            <button onClick={tumunuCalistir} disabled={Object.values(yukl).some(v => v)} className="btn-p" style={{ fontSize: 12, padding: "8px 14px" }}>
              {Object.values(yukl).some(v => v) ? <><Dots size={5} /> Çalışıyor...</> : "▶ 3 AI Karar Ver"}
            </button>
            <button onClick={sifirla} style={{ padding: "8px 14px", background: "#200808", border: "1px solid #3a1010", borderRadius: 8, color: "#cc6060", fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
              🔄 Sıfırla
            </button>
          </div>
        </div>

        {/* MESAJ */}
        {mesaj && (
          <div style={{ padding: "8px 20px" }}>
            <div className={`mesaj-${mesaj.tip}`}>{mesaj.text}</div>
          </div>
        )}

        {/* SEKMELEr */}
        <div style={{ borderBottom: "1px solid #1a2530", background: "#0b0f14", display: "flex", overflowX: "auto" }}>
          {[["genel", "🏆 Genel"], ["grafik", "📈 Grafik"], ["loglar", "📋 Tüm Loglar"], ["manuel", "✏️ Manuel İşlem"]].map(([k, l]) => (
            <button key={k} className={`tab${aktifTab === k ? " on" : ""}`} onClick={() => setAktifTab(k)}>{l}</button>
          ))}
        </div>

        {/* İÇERİK */}
        <div style={{ padding: "16px 20px", maxWidth: 1200, margin: "0 auto" }}>

          {/* GENEL — Liderler + Portföy kartları */}
          {aktifTab === "genel" && (
            <div style={{ animation: "fadein .3s ease" }}>
              <LiderTablosu durumlar={durumlar} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
                {AI_LIST.map(ai => (
                  <PortfoyKarti
                    key={ai.id}
                    ai={ai}
                    portfoy={durumlar[ai.id]?.portfoy || []}
                    bakiye={durumlar[ai.id]?.bakiye ?? BASLANGIC_BAKIYE}
                    loglar={durumlar[ai.id]?.loglar || []}
                    yukl={yukl[ai.id] || fiyatYukl[ai.id]}
                    onKarar={aiKararVer}
                    onFiyatGuncelle={fiyatGuncelle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* GRAFİK */}
          {aktifTab === "grafik" && (
            <div style={{ animation: "fadein .3s ease" }}>
              <div style={{ background: "#0d1520", border: "1px solid #1e3040", borderRadius: 10, padding: "16px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4a8090", marginBottom: 12 }}>Performans Geçmişi</div>
                <PerformansGrafik anlık={anlık} />
              </div>

              {/* Detaylı istatistikler */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {AI_LIST.map(ai => {
                  const d = durumlar[ai.id] || {};
                  const loglar = d.loglar || [];
                  const portfoyD = (d.portfoy || []).reduce((s, p) => s + p.adet * (p.guncelFiyat || p.alisFiyat), 0);
                  const toplam = (d.bakiye ?? BASLANGIC_BAKIYE) + portfoyD;
                  const getiri = toplam - BASLANGIC_BAKIYE;
                  const allar = loglar.filter(l => l.islem === "AL").length;
                  const satlar = loglar.filter(l => l.islem === "SAT").length;
                  const tutlar = loglar.filter(l => l.islem === "TUT").length;
                  return (
                    <div key={ai.id} style={{ background: ai.bg, border: `1px solid ${ai.bd}`, borderRadius: 10, padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ color: ai.renk, fontSize: 18 }}>{ai.logo}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: ai.renk }}>{ai.isim}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          ["Toplam Getiri", pct((getiri / BASLANGIC_BAKIYE) * 100), renk(getiri)],
                          ["Net Kâr/Zarar", (getiri >= 0 ? "+" : "") + paraTL(getiri), renk(getiri)],
                          ["Nakit", paraTL(d.bakiye ?? BASLANGIC_BAKIYE), "#c0d8e4"],
                          ["Portföy", paraTL(portfoyD), "#c0d8e4"],
                          ["AL işlemi", allar, "#50dd90"],
                          ["SAT işlemi", satlar, "#ff7070"],
                          ["TUT kararı", tutlar, "#ffcc44"],
                          ["Toplam", loglar.length, "#80a0b0"],
                        ].map(([label, val, color]) => (
                          <div key={label} style={{ background: "#00000025", borderRadius: 5, padding: "6px 8px" }}>
                            <div style={{ fontSize: 9, color: "#3a5060", marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LOGLAR */}
          {aktifTab === "loglar" && (
            <div style={{ animation: "fadein .3s ease" }}>
              {/* AI filtre */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#3a6070" }}>Filtre:</span>
                {["hepsi", ...AI_LIST.map(a => a.id)].map(id => (
                  <button key={id} onClick={() => setAktifAI(id)}
                    style={{ padding: "5px 12px", background: aktifAI === id ? "#0e2a1a" : "#101820", border: `1px solid ${aktifAI === id ? "#3a7a5a" : "#1e2d38"}`, borderRadius: 6, color: aktifAI === id ? "#6abf90" : "#4a6070", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                    {id === "hepsi" ? "🌐 Tümü" : `${AI_LIST.find(a => a.id === id)?.logo} ${AI_LIST.find(a => a.id === id)?.isim}`}
                  </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#2a4050" }}>{tumLoglar.length} toplam işlem</span>
              </div>
              <div style={{ background: "#0d1520", border: "1px solid #1e3040", borderRadius: 10, overflow: "hidden" }}>
                <LogTablosu
                  loglar={aktifAI === "hepsi" ? tumLoglar : tumLoglar.filter(l => l.aiId === aktifAI)}
                  aiRenkler={aiRenkMap}
                />
              </div>
            </div>
          )}

          {/* MANUEL */}
          {aktifTab === "manuel" && (
            <div style={{ animation: "fadein .3s ease", maxWidth: 560 }}>
              <div style={{ background: "#0d1520", border: "1px solid #1e3040", borderRadius: 10, padding: "20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#4a8090", marginBottom: 4 }}>✏️ Manuel İşlem</div>
                <div style={{ fontSize: 12, color: "#2a4050", marginBottom: 20 }}>Bir AI adına manuel al/sat işlemi yap</div>

                {/* AI Seç */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "#3a6070", marginBottom: 6 }}>AI Seç</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {AI_LIST.map(ai => (
                      <button key={ai.id} onClick={() => setManuelAI(ai.id)}
                        style={{ flex: 1, padding: "8px 6px", background: manuelAI === ai.id ? ai.bg : "#101820", border: `2px solid ${manuelAI === ai.id ? ai.renk : "#1e2d38"}`, borderRadius: 8, color: manuelAI === ai.id ? ai.renk : "#4a6070", fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "center" }}>
                        {ai.logo}<br /><span style={{ fontSize: 10 }}>{ai.isim}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mevcut Durum */}
                <div style={{ background: "#101820", border: "1px solid #1c2c38", borderRadius: 6, padding: "8px 12px", marginBottom: 14, fontSize: 11 }}>
                  <span style={{ color: "#4a7080" }}>Nakit: </span>
                  <span style={{ color: "#70d0a0", fontFamily: "monospace", fontWeight: 700 }}>{paraTL(durumlar[manuelAI]?.bakiye ?? BASLANGIC_BAKIYE)}</span>
                  {durumlar[manuelAI]?.portfoy?.length > 0 && (
                    <span style={{ color: "#3a5060", marginLeft: 12 }}>
                      Pozisyonlar: {durumlar[manuelAI].portfoy.map(p => p.sembol).join(", ")}
                    </span>
                  )}
                </div>

                {/* İşlem */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {["AL", "SAT"].map(islem => (
                    <button key={islem} onClick={() => setManuelIslem(islem)}
                      style={{ flex: 1, padding: "10px", background: manuelIslem === islem ? (islem === "AL" ? "#0a2010" : "#200808") : "#101820", border: `2px solid ${manuelIslem === islem ? (islem === "AL" ? "#3a8a50" : "#8a3a3a") : "#1e2d38"}`, borderRadius: 8, color: manuelIslem === islem ? (islem === "AL" ? "#50dd90" : "#ff7070") : "#4a6070", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "monospace" }}>
                      {islem}
                    </button>
                  ))}
                </div>

                <input className="inp" placeholder="Sembol (TUPRS, NVDA, GLD...)" value={manuelSembol} onChange={e => setManuelSembol(e.target.value.toUpperCase())} style={{ marginBottom: 10 }} />
                <input className="inp" placeholder="Tutar (₺)" type="number" value={manuelTutar} onChange={e => setManuelTutar(e.target.value)} style={{ marginBottom: 16 }} />

                <button onClick={manuelIslemYap} disabled={!manuelSembol || !manuelTutar || yukl[manuelAI]} className="btn-p" style={{ width: "100%", padding: "12px" }}>
                  {yukl[manuelAI] ? <><Dots size={5} /> İşlem yapılıyor...</> : `${AI_LIST.find(a => a.id === manuelAI)?.logo} ${manuelIslem} ${manuelSembol || "?"} — ₺${manuelTutar || "?"}`}
                </button>

                <div style={{ marginTop: 16, padding: "10px 12px", background: "#101820", border: "1px solid #1c2c38", borderRadius: 6, fontSize: 11, color: "#2a4050", lineHeight: 1.7 }}>
                  <strong style={{ color: "#3a6070" }}>Nasıl çalışır?</strong><br />
                  Gerçek Yahoo Finance fiyatları kullanılır.<br />
                  Fiyat alınamazsa işlem yapılmaz.<br />
                  Tüm işlemler log tablosuna kaydedilir.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

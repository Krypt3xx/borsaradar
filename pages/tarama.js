// BorsaRadar — BIST Tarama Sayfası v1
import { useState, useCallback, useEffect, memo } from "react";
import Head from "next/head";
import Link from "next/link";

const CSS = `
@keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
*{box-sizing:border-box}
html,body{background:#0f1318;color:#d4dde6;font-family:'Inter',sans-serif;margin:0;padding:0}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f1318}::-webkit-scrollbar-thumb{background:#2a3a4a;border-radius:4px}
.inp{background:#161d24;border:1px solid #243040;color:#d4dde6;border-radius:6px;padding:8px 12px;font-size:13px;font-family:'Inter',sans-serif;width:100%}
.inp:focus{outline:none;border-color:#3a7a5a}
.btn{background:#142a1e;border:1px solid #3a7a5a;color:#6abf90;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:8px;transition:all .15s}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn:hover:not(:disabled){background:#1e3a28;border-color:#5aaa80}
.card{background:#101820;border:1px solid #1c2c38;border-radius:10px;padding:16px}
.badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:.03em}
.sb{height:5px;border-radius:3px;background:#1a2530;overflow:hidden}
.sbf{height:100%;border-radius:3px}
select{background:#161d24;border:1px solid #243040;color:#d4dde6;border-radius:6px;padding:8px 10px;font-size:12px;font-family:'Inter',sans-serif;cursor:pointer}
select:focus{outline:none;border-color:#3a7a5a}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
@media(max-width:600px){.row{grid-template-columns:1fr}}
.seg{display:flex;border-radius:6px;overflow:hidden;border:1px solid #1e2d38}
.seg button{flex:1;padding:7px 12px;font-size:11px;font-weight:600;font-family:'Inter',sans-serif;border:none;cursor:pointer;transition:all .12s}
.tab-hdr{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
`;

const Dots = memo(function Dots({ color, size }) {
  var c = color || "#4a9a6a", s = size || 6;
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", verticalAlign: "middle" }}>
      {[0, 1, 2].map(function (i) {
        return <span key={i} style={{ width: s, height: s, borderRadius: "50%", background: c, display: "inline-block", animation: "dp 1.3s " + (i * 0.22) + "s infinite" }} />;
      })}
    </span>
  );
});

function rsiRenk(rsi) {
  if (rsi === null) return "#4a6070";
  if (rsi <= 30) return "#50dd90";
  if (rsi <= 40) return "#80cc70";
  if (rsi >= 70) return "#ff7070";
  if (rsi >= 60) return "#ff9060";
  return "#c0d8e4";
}

function HisseKarti({ h, onAnaliz }) {
  var rR = rsiRenk(h.rsi);
  var dipYakin = h.uzaklikDip !== null && h.uzaklikDip <= 10;
  var zirveYakin = h.uzaklikZirve !== null && h.uzaklikZirve >= -10;
  var hacimsSpike = h.hacimSpike >= 2;
  var pozitifGun = h.gunlukDegisim >= 0;

  return (
    <div className="card" style={{ animation: "fadein .2s ease", borderColor: dipYakin ? "#3a8a50" : hacimsSpike ? "#5a4a2a" : "#1c2c38" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#70d8a0", fontFamily: "monospace", letterSpacing: "-.01em" }}>{h.sembol}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#c0e0e8", fontFamily: "monospace", marginTop: 2 }}>
            ₺{h.fiyat}
            <span style={{ fontSize: 11, fontWeight: 600, color: pozitifGun ? "#44aa70" : "#cc5555", marginLeft: 6 }}>
              {pozitifGun ? "▲" : "▼"} {Math.abs(h.gunlukDegisim)}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          {dipYakin && <span className="badge" style={{ background: "#0a2010", color: "#50dd90", border: "1px solid #3a8a50" }}>52H DİP</span>}
          {zirveYakin && <span className="badge" style={{ background: "#200808", color: "#ff9060", border: "1px solid #803030" }}>ZİRVE</span>}
          {hacimsSpike && <span className="badge" style={{ background: "#1a1000", color: "#ffcc44", border: "1px solid #5a4a10" }}>HACİM {h.hacimSpike}x</span>}
        </div>
      </div>

      {/* RSI */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#4a7080", marginBottom: 3 }}>
          <span>RSI (14)</span>
          <span style={{ color: rR, fontWeight: 700 }}>{h.rsi !== null ? h.rsi : "—"}</span>
        </div>
        <div className="sb">
          <div className="sbf" style={{ width: (h.rsi || 50) + "%", background: rR }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#2a4050", marginTop: 2 }}>
          <span style={{ color: "#50dd90" }}>30 Aşırı Sat</span>
          <span style={{ color: "#ff7070" }}>70 Aşırı Al</span>
        </div>
      </div>

      {/* 52 Hafta */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "#0a1520", border: "1px solid #1e3040", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ fontSize: 9, color: "#3a6070" }}>52H Dipten</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: h.uzaklikDip <= 10 ? "#50dd90" : "#c0d8e4", fontFamily: "monospace" }}>
            +{h.uzaklikDip}%
          </div>
        </div>
        <div style={{ flex: 1, background: "#0a1520", border: "1px solid #1e3040", borderRadius: 6, padding: "6px 10px" }}>
          <div style={{ fontSize: 9, color: "#3a6070" }}>52H Zirveye</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: h.uzaklikZirve >= -10 ? "#ff9060" : "#c0d8e4", fontFamily: "monospace" }}>
            {h.uzaklikZirve}%
          </div>
        </div>
        {h.pk !== null && (
          <div style={{ flex: 1, background: "#0a1520", border: "1px solid #1e3040", borderRadius: 6, padding: "6px 10px" }}>
            <div style={{ fontSize: 9, color: "#3a6070" }}>P/K</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: h.pk < 10 ? "#50dd90" : h.pk < 20 ? "#ffcc44" : "#c0d8e4", fontFamily: "monospace" }}>
              {h.pk}x
            </div>
          </div>
        )}
      </div>

      {/* Hacim */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#3a5060", marginBottom: 10, padding: "5px 8px", background: "#0c1620", borderRadius: 5 }}>
        <span>Hacim: <strong style={{ color: hacimsSpike ? "#ffcc44" : "#6a8a90" }}>{(h.sonHacim / 1000000).toFixed(1)}M</strong></span>
        <span>Ort 20g: <strong style={{ color: "#4a7080" }}>{(h.hacimOrt20 / 1000000).toFixed(1)}M</strong></span>
        <span>Spike: <strong style={{ color: hacimsSpike ? "#ffcc44" : "#4a7080" }}>{h.hacimSpike}x</strong></span>
      </div>

      {/* Analiz Butonu */}
      <button onClick={function () { onAnaliz(h.sembol); }}
        style={{ width: "100%", padding: "8px", fontSize: 11, fontWeight: 600, background: "#0a1828", border: "1px solid #2a5060", borderRadius: 6, color: "#5090b0", cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
        🤖 3 AI ile Analiz Et
      </button>
    </div>
  );
}

export default function TaramaPage() {
  var _yk = useState(false), yukl = _yk[0], setYukl = _yk[1];
  var _so = useState(null), sonuc = _so[0], setSonuc = _so[1];
  var _er = useState(""), hata = _er[0], setHata = _er[1];
  var _ilk = useState(true), ilk = _ilk[0], setIlk = _ilk[1];

  // Filtreler
  var _lis = useState("bist100"), liste = _lis[0], setListe = _lis[1];
  var _rsi = useState("asiri_satim"), rsiMod = _rsi[0], setRsiMod = _rsi[1];
  var _hac = useState("1.5"), hacimMin = _hac[0], setHacimMin = _hac[1];
  var _dip = useState("20"), dip52hMax = _dip[0], setDip52hMax = _dip[1];
  var _pk = useState("25"), pkMax = _pk[0], setPkMax = _pk[1];
  var _sir = useState("rsi"), sirala = _sir[0], setSirala = _sir[1];

  var tara = useCallback(function () {
    setYukl(true);
    setSonuc(null);
    setHata("");
    setIlk(false);
    fetch("/api/tarama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        liste: liste,
        rsiMod: rsiMod,
        hacimMin: parseFloat(hacimMin) || 1.5,
        dip52hMax: parseFloat(dip52hMax) || 20,
        pkMax: parseFloat(pkMax) || 25,
        sirala: sirala,
        limit: 60,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.hata || "Hata");
        setSonuc(d);
        setYukl(false);
      })
      .catch(function (e) { setHata(e.message); setYukl(false); });
  }, [liste, rsiMod, hacimMin, dip52hMax, pkMax, sirala]);

  function onAnaliz(sembol) {
    window.location.href = "/?analiz=" + encodeURIComponent(sembol);
  }

  var rsiAciklama = rsiMod === "asiri_satim"
    ? "RSI ≤ 35 — Aşırı satılmış, dönüş fırsatı"
    : rsiMod === "asiri_alim"
    ? "RSI ≥ 65 — Aşırı alınmış, düzeltme riski"
    : "RSI filtresi kapalı";

  return (
    <>
      <Head>
        <title>BIST Tarama — BorsaRadar</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#0f1318", color: "#d4dde6", fontFamily: "'Inter',sans-serif" }}>
        <style>{CSS}</style>

        {/* HEADER */}
        <div style={{ background: "#0b0f14", borderBottom: "1px solid #1a2530", padding: "0 20px", height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#e0eef0" }}>Borsa</span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#4aaa70" }}>Radar</span>
            </Link>
            <span style={{ color: "#2a4050" }}>›</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#5090b0" }}>🔍 BIST Tarama</span>
          </div>
          <div style={{ fontSize: 11, color: "#2a4050" }}>
            {sonuc && "Taranan: " + sonuc.tarandiSayi + " · Veri: " + sonuc.veriAlinanSayi + " · Sonuç: " + sonuc.filtrelenenSayi}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>

          {/* FİLTRE PANELİ */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5090b0", marginBottom: 14 }}>⚙️ Tarama Kriterleri</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>

              {/* Liste */}
              <div>
                <div style={{ fontSize: 10, color: "#4a7080", marginBottom: 5, fontWeight: 600 }}>HİSSE LİSTESİ</div>
                <div className="seg">
                  {[["bist50", "BIST-50"], ["bist100", "BIST-100"], ["tumBist", "Tümü"]].map(function (item) {
                    return (
                      <button key={item[0]} onClick={function () { setListe(item[0]); }}
                        style={{ background: liste === item[0] ? "#1a3a28" : "#101820", color: liste === item[0] ? "#6abf90" : "#3a6050" }}>
                        {item[1]}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 9, color: "#2a4050", marginTop: 4 }}>
                  {liste === "bist50" ? "50 hisse · ~2 dk" : liste === "bist100" ? "100 hisse · ~3 dk" : "200+ hisse · ~6 dk"}
                </div>
              </div>

              {/* RSI */}
              <div>
                <div style={{ fontSize: 10, color: "#4a7080", marginBottom: 5, fontWeight: 600 }}>RSI SİNYALİ</div>
                <div className="seg">
                  {[["asiri_satim", "Aşırı Sat"], ["asiri_alim", "Aşırı Al"], ["hepsi", "Hepsi"]].map(function (item) {
                    return (
                      <button key={item[0]} onClick={function () { setRsiMod(item[0]); }}
                        style={{ background: rsiMod === item[0] ? "#1a3a28" : "#101820", color: rsiMod === item[0] ? "#6abf90" : "#3a6050" }}>
                        {item[1]}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 9, color: "#3a6060", marginTop: 4 }}>{rsiAciklama}</div>
              </div>

              {/* Hacim Spike */}
              <div>
                <div style={{ fontSize: 10, color: "#4a7080", marginBottom: 5, fontWeight: 600 }}>MİN. HACİM SPİKE</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input className="inp" type="number" value={hacimMin} step="0.5" min="1" max="10"
                    onChange={function (e) { setHacimMin(e.target.value); }}
                    style={{ width: 80, padding: "7px 10px" }} />
                  <span style={{ fontSize: 12, color: "#4a7080" }}>× ort.</span>
                </div>
                <div style={{ fontSize: 9, color: "#2a4050", marginTop: 4 }}>Ortalamanın kaç katı hacim</div>
              </div>

              {/* 52H Dip */}
              <div>
                <div style={{ fontSize: 10, color: "#4a7080", marginBottom: 5, fontWeight: 600 }}>52H DİPTEN MAX %</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input className="inp" type="number" value={dip52hMax} step="5" min="0" max="100"
                    onChange={function (e) { setDip52hMax(e.target.value); }}
                    style={{ width: 80, padding: "7px 10px" }} />
                  <span style={{ fontSize: 12, color: "#4a7080" }}>%</span>
                </div>
                <div style={{ fontSize: 9, color: "#2a4050", marginTop: 4 }}>Dipten bu kadar uzakta ara</div>
              </div>

              {/* P/K */}
              <div>
                <div style={{ fontSize: 10, color: "#4a7080", marginBottom: 5, fontWeight: 600 }}>MAX P/K</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input className="inp" type="number" value={pkMax} step="1" min="0" max="200"
                    onChange={function (e) { setPkMax(e.target.value); }}
                    style={{ width: 80, padding: "7px 10px" }} />
                  <span style={{ fontSize: 12, color: "#4a7080" }}>×</span>
                </div>
                <div style={{ fontSize: 9, color: "#2a4050", marginTop: 4 }}>Düşük = ucuz hisse</div>
              </div>

              {/* Sıralama */}
              <div>
                <div style={{ fontSize: 10, color: "#4a7080", marginBottom: 5, fontWeight: 600 }}>SIRALAMA</div>
                <select value={sirala} onChange={function (e) { setSirala(e.target.value); }} style={{ width: "100%" }}>
                  <option value="rsi">RSI (düşükten yükseğe)</option>
                  <option value="hacimSpike">Hacim Spike (yüksekten)</option>
                  <option value="uzaklikDip">52H Dip Yakınlığı</option>
                  <option value="pk">P/K (düşükten)</option>
                  <option value="gunlukDegisim">Günlük Değişim</option>
                </select>
              </div>

            </div>

            {/* TARA BUTONU */}
            <button className="btn" onClick={tara} disabled={yukl} style={{ width: "100%", padding: "13px", fontSize: 14 }}>
              {yukl
                ? <><Dots color="#6abf90" size={6} /> Taranıyor... ({liste === "bist50" ? "~2dk" : liste === "bist100" ? "~3dk" : "~6dk"})</>
                : "🔍 Taramayı Başlat"}
            </button>

            {/* İlerleme bilgisi */}
            {yukl && (
              <div style={{ marginTop: 10, padding: "8px 12px", background: "#0a1520", borderRadius: 6, fontSize: 11, color: "#4a7080", lineHeight: 1.8 }}>
                ⏳ Yahoo Finance'ten veri çekiliyor...<br />
                Hisseler 8'erli gruplar halinde işleniyor. Sayfa açık kalsın.
              </div>
            )}
          </div>

          {/* HATA */}
          {hata && (
            <div style={{ background: "#180808", border: "1px solid #401818", borderRadius: 8, padding: "12px 16px", color: "#e07070", fontSize: 13, marginBottom: 16 }}>
              ⚠ {hata}
            </div>
          )}

          {/* SONUÇ YOK */}
          {!ilk && !yukl && sonuc && sonuc.filtrelenenSayi === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#2a4050" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: .2 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Kriterlere uyan hisse bulunamadı</div>
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>Filtreleri genişlet:<br />RSI eşiğini artır · Hacim spike'ı düşür · P/K limitini yükselt</div>
            </div>
          )}

          {/* İLK EKRAN */}
          {ilk && !yukl && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#2a4050" }}>
              <div style={{ fontSize: 50, marginBottom: 16, opacity: .15 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#3a7060", marginBottom: 10 }}>BIST Tarama Otomasyonu</div>
              <div style={{ fontSize: 13, color: "#2a5050", lineHeight: 2, maxWidth: 400, margin: "0 auto" }}>
                500+ BIST hissesini <strong style={{ color: "#4a8a70" }}>4 kritere</strong> göre filtreler:<br />
                RSI · Hacim Spike · 52H Dip/Zirve · P/K Oranı<br />
                <span style={{ color: "#3a6a5a" }}>Manuel tarama yerine saniyeler içinde sonuç.</span>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { l: "Aşırı Satılmış", d: "RSI ≤ 35 + Hacim Artışı", emoji: "📉" },
                  { l: "52H Dip Yakını", d: "Tarihsel dip bölgesinde", emoji: "🎯" },
                  { l: "Ucuz Hisseler", d: "P/K < 15 olanlar", emoji: "💎" },
                ].map(function (item) {
                  return (
                    <div key={item.l} style={{ background: "#101820", border: "1px solid #1c2c38", borderRadius: 8, padding: "12px 16px", width: 140, textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{item.emoji}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4a8090", marginBottom: 4 }}>{item.l}</div>
                      <div style={{ fontSize: 10, color: "#2a4050" }}>{item.d}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SONUÇLAR */}
          {sonuc && sonuc.filtrelenenSayi > 0 && (
            <div>
              {/* Özet */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "#4a8090", fontWeight: 600 }}>
                  {sonuc.filtrelenenSayi} hisse bulundu
                </div>
                <div style={{ fontSize: 11, color: "#2a5040" }}>
                  {sonuc.veriAlinanSayi} / {sonuc.tarandiSayi} hisseden veri alındı
                </div>
                <div style={{ fontSize: 11, color: "#2a4050", marginLeft: "auto" }}>
                  {new Date(sonuc.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Grid */}
              <div className="row">
                {sonuc.sonuclar.map(function (h) {
                  return <HisseKarti key={h.sembol} h={h} onAnaliz={onAnaliz} />;
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: "1px solid #1a2530", padding: "16px 20px", fontSize: 10, color: "#1e3040", textAlign: "center", marginTop: 40 }}>
          Veriler Yahoo Finance • Yatırım tavsiyesi değildir • BorsaRadar v21
        </div>
      </div>
    </>
  );
}

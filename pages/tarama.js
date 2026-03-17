// BorsaRadar — BIST Tarama Sayfası v2
import { useState, useCallback, memo } from "react";
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
.card{background:#101820;border:1px solid #1c2c38;border-radius:10px;padding:14px}
.badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;letter-spacing:.03em}
.sb{height:5px;border-radius:3px;background:#1a2530;overflow:hidden}
.sbf{height:100%;border-radius:3px}
select{background:#161d24;border:1px solid #243040;color:#d4dde6;border-radius:6px;padding:8px 10px;font-size:12px;font-family:'Inter',sans-serif;cursor:pointer}
select:focus{outline:none;border-color:#3a7a5a}
.row{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px}
@media(max-width:600px){.row{grid-template-columns:1fr}}
.seg{display:flex;border-radius:6px;overflow:hidden;border:1px solid #1e2d38}
.seg button{flex:1;padding:7px 10px;font-size:11px;font-weight:600;font-family:'Inter',sans-serif;border:none;cursor:pointer;transition:all .12s}
.tog{display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 0}
.tog-box{width:36px;height:20px;border-radius:10px;border:1px solid #2a4050;position:relative;transition:background .15s;flex-shrink:0}
.tog-dot{width:14px;height:14px;border-radius:50%;background:#fff;position:absolute;top:2px;transition:left .15s}
`;

const Dots = memo(function Dots({ color, size }) {
  var c = color || "#4a9a6a", s = size || 6;
  return (
    <span style={{ display:"inline-flex",gap:4,alignItems:"center",verticalAlign:"middle" }}>
      {[0,1,2].map(function(i){
        return <span key={i} style={{width:s,height:s,borderRadius:"50%",background:c,display:"inline-block",animation:"dp 1.3s "+(i*.22)+"s infinite"}}/>;
      })}
    </span>
  );
});

function Toggle({ acik, onChange, label, aciklama }) {
  return (
    <div className="tog" onClick={function(){onChange(!acik);}}>
      <div className="tog-box" style={{background:acik?"#1a4a2a":"#101820"}}>
        <div className="tog-dot" style={{left:acik?"18px":"2px",background:acik?"#6abf90":"#3a5060"}}/>
      </div>
      <div>
        <div style={{fontSize:12,color:acik?"#c0e0c8":"#4a6070",fontWeight:600}}>{label}</div>
        {aciklama&&<div style={{fontSize:10,color:"#2a4050"}}>{aciklama}</div>}
      </div>
    </div>
  );
}

function rsiRenk(rsi) {
  if (rsi===null) return "#4a6070";
  if (rsi<=25) return "#30ff80";
  if (rsi<=35) return "#50dd90";
  if (rsi<=45) return "#80cc70";
  if (rsi>=75) return "#ff5050";
  if (rsi>=65) return "#ff7070";
  if (rsi>=55) return "#ff9060";
  return "#c0d8e4";
}

function HisseKarti({ h, onAnaliz }) {
  var rR = rsiRenk(h.rsi);
  var dipYakin = h.uzaklikDip !== null && h.uzaklikDip <= 15;
  var zirveYakin = h.uzaklikZirve !== null && h.uzaklikZirve >= -8;
  var hacimBuyuk = h.hacimSpike >= 2;
  var pozitif = h.gunlukDegisim >= 0;
  return (
    <div className="card" style={{animation:"fadein .2s ease",borderColor:dipYakin?"#2a6a40":hacimBuyuk?"#5a4a20":"#1c2c38"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#70d8a0",fontFamily:"monospace"}}>{h.sembol}</div>
          <div style={{fontSize:13,fontWeight:700,color:"#c0e0e8",fontFamily:"monospace",marginTop:2}}>
            ₺{h.fiyat}
            <span style={{fontSize:11,fontWeight:600,color:pozitif?"#44aa70":"#cc5555",marginLeft:6}}>
              {pozitif?"▲":"▼"}{Math.abs(h.gunlukDegisim)}%
            </span>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
          {dipYakin&&<span className="badge" style={{background:"#0a2010",color:"#50dd90",border:"1px solid #3a8a50"}}>52H DİP</span>}
          {zirveYakin&&<span className="badge" style={{background:"#200808",color:"#ff9060",border:"1px solid #803030"}}>ZİRVE</span>}
          {hacimBuyuk&&<span className="badge" style={{background:"#1a1000",color:"#ffcc44",border:"1px solid #5a4a10"}}>{h.hacimSpike}× HACİM</span>}
        </div>
      </div>

      <div style={{marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#4a7080",marginBottom:3}}>
          <span>RSI (14)</span>
          <span style={{color:rR,fontWeight:700}}>{h.rsi!==null?h.rsi:"—"}</span>
        </div>
        <div className="sb">
          <div className="sbf" style={{width:(Math.min(h.rsi||50,100))+"%",background:rR}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a4050",marginTop:2}}>
          <span style={{color:"#50dd90"}}>30 Aşırı Sat</span>
          <span style={{color:"#ff7070"}}>70 Aşırı Al</span>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:70,background:"#0a1520",border:"1px solid #1e3040",borderRadius:5,padding:"5px 8px"}}>
          <div style={{fontSize:9,color:"#3a6070"}}>52H Dipten</div>
          <div style={{fontSize:13,fontWeight:700,color:dipYakin?"#50dd90":"#c0d8e4",fontFamily:"monospace"}}>+{h.uzaklikDip}%</div>
        </div>
        <div style={{flex:1,minWidth:70,background:"#0a1520",border:"1px solid #1e3040",borderRadius:5,padding:"5px 8px"}}>
          <div style={{fontSize:9,color:"#3a6070"}}>Zirveye</div>
          <div style={{fontSize:13,fontWeight:700,color:zirveYakin?"#ff9060":"#c0d8e4",fontFamily:"monospace"}}>{h.uzaklikZirve}%</div>
        </div>
        {h.pk!==null&&(
          <div style={{flex:1,minWidth:55,background:"#0a1520",border:"1px solid #1e3040",borderRadius:5,padding:"5px 8px"}}>
            <div style={{fontSize:9,color:"#3a6070"}}>P/K</div>
            <div style={{fontSize:13,fontWeight:700,color:h.pk<10?"#50dd90":h.pk<20?"#ffcc44":"#c0d8e4",fontFamily:"monospace"}}>{h.pk}×</div>
          </div>
        )}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#3a5060",padding:"5px 8px",background:"#0c1620",borderRadius:5,marginBottom:8}}>
        <span>Son: <b style={{color:hacimBuyuk?"#ffcc44":"#6a8a90"}}>{(h.sonHacim/1e6).toFixed(1)}M</b></span>
        <span>Ort20: <b style={{color:"#4a7080"}}>{(h.hacimOrt20/1e6).toFixed(1)}M</b></span>
        <span>Spike: <b style={{color:hacimBuyuk?"#ffcc44":"#4a7080"}}>{h.hacimSpike}×</b></span>
      </div>

      <button onClick={function(){onAnaliz(h.sembol);}}
        style={{width:"100%",padding:"7px",fontSize:11,fontWeight:600,background:"#0a1828",border:"1px solid #2a5060",borderRadius:6,color:"#5090b0",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
        🤖 3 AI ile Analiz Et
      </button>
    </div>
  );
}

// ─── PRESET TARAMALAR ─────────────────────────────────────────────────────────
var PRESETLER = [
  {
    id:"dipFirsat",label:"💎 Dip Fırsatı",
    aciklama:"RSI ≤ 35 + 52H dipten ≤%25",
    params:{rsiMod:"asiri_satim",rsiMax:35,useHacim:false,hacimMin:1,useDip:true,dip52hMax:25,usePk:false,pkMax:null,sirala:"rsi"},
  },
  {
    id:"hacimPatlama",label:"🔥 Hacim Patlaması",
    aciklama:"Hacim ≥ 3× ortalama",
    params:{rsiMod:"hepsi",rsiMax:null,useHacim:true,hacimMin:3,useDip:false,dip52hMax:null,usePk:false,pkMax:null,sirala:"hacimSpike",azalan:true},
  },
  {
    id:"ucuzHisse",label:"💵 Ucuz Hisse",
    aciklama:"P/K ≤ 10 olanlar",
    params:{rsiMod:"hepsi",rsiMax:null,useHacim:false,hacimMin:1,useDip:false,dip52hMax:null,usePk:true,pkMax:10,sirala:"pk"},
  },
  {
    id:"dipZirve",label:"📈 Zirve Kırma",
    aciklama:"52H zirvesine ≤%5 kalmış",
    params:{rsiMod:"hepsi",rsiMax:null,useHacim:false,hacimMin:1,useDip:false,dip52hMax:null,usePk:false,pkMax:null,sirala:"uzaklikZirve",azalan:true},
  },
];

export default function TaramaPage() {
  var _yk=useState(false),yukl=_yk[0],setYukl=_yk[1];
  var _so=useState(null),sonuc=_so[0],setSonuc=_so[1];
  var _er=useState(""),hata=_er[0],setHata=_er[1];
  var _ilk=useState(true),ilk=_ilk[0],setIlk=_ilk[1];
  var _pre=useState(null),aktifPreset=_pre[0],setAktifPreset=_pre[1];
  var _ilerlog=useState([]),ilerLog=_ilerlog[0],setIlerLog=_ilerlog[1];

  // Filtre state'leri
  var _lis=useState("bist100"),liste=_lis[0],setListe=_lis[1];
  var _rmd=useState("asiri_satim"),rsiMod=_rmd[0],setRsiMod=_rmd[1];
  var _rmax=useState("35"),rsiMax=_rmax[0],setRsiMax=_rmax[1];
  var _uhac=useState(false),useHacim=_uhac[0],setUseHacim=_uhac[1];
  var _hmin=useState("2"),hacimMin=_hmin[0],setHacimMin=_hmin[1];
  var _udip=useState(true),useDip=_udip[0],setUseDip=_udip[1];
  var _dmax=useState("30"),dip52hMax=_dmax[0],setDip52hMax=_dmax[1];
  var _upk=useState(false),usePk=_upk[0],setUsePk=_upk[1];
  var _pkmax=useState("20"),pkMax=_pkmax[0],setPkMax=_pkmax[1];
  var _sir=useState("rsi"),sirala=_sir[0],setSirala=_sir[1];

  function uygulePreset(p) {
    setAktifPreset(p.id);
    var pa = p.params;
    setRsiMod(pa.rsiMod);
    if (pa.rsiMax !== null) setRsiMax(String(pa.rsiMax));
    setUseHacim(pa.useHacim);
    if (pa.hacimMin) setHacimMin(String(pa.hacimMin));
    setUseDip(pa.useDip);
    if (pa.dip52hMax !== null) setDip52hMax(String(pa.dip52hMax));
    setUsePk(pa.usePk);
    if (pa.pkMax !== null) setPkMax(String(pa.pkMax));
    setSirala(pa.sirala || "rsi");
  }

  var tara = useCallback(function() {
    setYukl(true);
    setSonuc(null);
    setHata("");
    setIlk(false);
    setIlerLog(["Hisse listesi hazırlanıyor..."]);

    var body = {
      liste: liste,
      rsiMod: rsiMod,
      rsiMax: rsiMod === "asiri_satim" ? (parseFloat(rsiMax) || 35) : (rsiMod === "asiri_alim" ? null : null),
      rsiMin: rsiMod === "asiri_alim" ? (100 - (parseFloat(rsiMax) || 35)) : null,
      hacimMin: useHacim ? (parseFloat(hacimMin) || 2) : null,
      dip52hMax: useDip ? (parseFloat(dip52hMax) || 30) : null,
      pkMax: usePk ? (parseFloat(pkMax) || 20) : null,
      sirala: sirala,
      azalan: sirala === "hacimSpike" || sirala === "uzaklikZirve",
      limit: 80,
    };

    setTimeout(function(){setIlerLog(["Yahoo Finance'e bağlanılıyor..."]);}, 1000);
    setTimeout(function(){setIlerLog(["Veri çekiliyor... (batch 1/12)"]);}, 3000);
    setTimeout(function(){setIlerLog(["Veri çekiliyor... (batch 4/12)"]);}, 8000);
    setTimeout(function(){setIlerLog(["Veri çekiliyor... (batch 8/12)"]);}, 15000);
    setTimeout(function(){setIlerLog(["Filtreler uygulanıyor..."]);}, 20000);

    fetch("/api/tarama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d.ok) throw new Error(d.hata || "API hatası");
        setSonuc(d);
        setYukl(false);
        setIlerLog([]);
      })
      .catch(function(e){
        setHata(e.message);
        setYukl(false);
        setIlerLog([]);
      });
  }, [liste, rsiMod, rsiMax, useHacim, hacimMin, useDip, dip52hMax, usePk, pkMax, sirala]);

  function onAnaliz(sembol) {
    window.location.href = "/?analiz=" + encodeURIComponent(sembol);
  }

  return (
    <>
      <Head>
        <title>BIST Tarama — BorsaRadar</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet"/>
      </Head>
      <div style={{minHeight:"100vh",background:"#0f1318",color:"#d4dde6",fontFamily:"'Inter',sans-serif"}}>
        <style>{CSS}</style>

        {/* HEADER */}
        <div style={{background:"#0b0f14",borderBottom:"1px solid #1a2530",padding:"0 20px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Link href="/" style={{textDecoration:"none"}}>
              <span style={{fontSize:"1rem",fontWeight:800,color:"#e0eef0"}}>Borsa</span>
              <span style={{fontSize:"1rem",fontWeight:800,color:"#4aaa70"}}>Radar</span>
            </Link>
            <span style={{color:"#2a4050"}}>›</span>
            <span style={{fontSize:13,fontWeight:700,color:"#5090b0"}}>🔍 BIST Tarama</span>
          </div>
          {sonuc&&(
            <div style={{fontSize:11,color:"#3a7060"}}>
              <b style={{color:"#6abf90"}}>{sonuc.filtrelenenSayi}</b> sonuç · {sonuc.veriAlinanSayi}/{sonuc.tarandiSayi} hisse
              <span style={{color:"#2a4050",marginLeft:8}}>{new Date(sonuc.zaman).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</span>
            </div>
          )}
        </div>

        <div style={{maxWidth:1100,margin:"0 auto",padding:"18px 16px"}}>

          {/* PRESETLER */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
            {PRESETLER.map(function(p){
              return(
                <button key={p.id} onClick={function(){uygulePreset(p);}}
                  style={{padding:"8px 14px",fontSize:11,fontWeight:600,background:aktifPreset===p.id?"#1a3a28":"#101820",border:"1px solid "+(aktifPreset===p.id?"#3a8a50":"#1c2c38"),borderRadius:8,color:aktifPreset===p.id?"#6abf90":"#4a7080",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  {p.label}
                  <div style={{fontSize:9,color:aktifPreset===p.id?"#3a7050":"#2a4050",marginTop:2}}>{p.aciklama}</div>
                </button>
              );
            })}
          </div>

          {/* FİLTRE PANELİ */}
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#5090b0",marginBottom:12}}>⚙️ Filtreler</div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>

              {/* Liste */}
              <div>
                <div style={{fontSize:10,color:"#4a7080",marginBottom:5,fontWeight:600}}>HİSSE LİSTESİ</div>
                <div className="seg">
                  {[["bist50","BIST-50"],["bist100","BIST-100"],["tumBist","Tümü"]].map(function(item){
                    return(
                      <button key={item[0]} onClick={function(){setListe(item[0]);}}
                        style={{background:liste===item[0]?"#1a3a28":"#101820",color:liste===item[0]?"#6abf90":"#3a6050"}}>
                        {item[1]}
                      </button>
                    );
                  })}
                </div>
                <div style={{fontSize:9,color:"#2a4050",marginTop:3}}>
                  {liste==="bist50"?"~50 hisse, ~1dk":liste==="bist100"?"~100 hisse, ~2dk":"~200 hisse, ~4dk"}
                </div>
              </div>

              {/* RSI */}
              <div>
                <div style={{fontSize:10,color:"#4a7080",marginBottom:5,fontWeight:600}}>RSI FİLTRESİ</div>
                <div className="seg" style={{marginBottom:6}}>
                  {[["hepsi","Kapalı"],["asiri_satim","Aşırı Sat"],["asiri_alim","Aşırı Al"]].map(function(item){
                    return(
                      <button key={item[0]} onClick={function(){setRsiMod(item[0]);}}
                        style={{background:rsiMod===item[0]?"#1a3a28":"#101820",color:rsiMod===item[0]?"#6abf90":"#3a6050",fontSize:10}}>
                        {item[1]}
                      </button>
                    );
                  })}
                </div>
                {rsiMod!=="hepsi"&&(
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:10,color:"#4a6070"}}>{rsiMod==="asiri_satim"?"RSI ≤":"RSI ≥"}</span>
                    <input className="inp" type="number" value={rsiMax} step="5" min="10" max="90"
                      onChange={function(e){setRsiMax(e.target.value);}}
                      style={{width:60,padding:"5px 8px",fontSize:12}}/>
                  </div>
                )}
                {rsiMod==="hepsi"&&<div style={{fontSize:10,color:"#2a4050",marginTop:3}}>RSI filtresi devre dışı</div>}
              </div>

              {/* Hacim */}
              <div>
                <div style={{fontSize:10,color:"#4a7080",marginBottom:5,fontWeight:600}}>HACİM SPİKE</div>
                <Toggle acik={useHacim} onChange={setUseHacim} label={useHacim?"Aktif":"Kapalı"} aciklama={useHacim?"Anormal hacim arar":null}/>
                {useHacim&&(
                  <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
                    <span style={{fontSize:10,color:"#4a6070"}}>Min ≥</span>
                    <input className="inp" type="number" value={hacimMin} step="0.5" min="1.2" max="10"
                      onChange={function(e){setHacimMin(e.target.value);}}
                      style={{width:60,padding:"5px 8px",fontSize:12}}/>
                    <span style={{fontSize:10,color:"#4a6070"}}>× ort</span>
                  </div>
                )}
              </div>

              {/* 52H Dip */}
              <div>
                <div style={{fontSize:10,color:"#4a7080",marginBottom:5,fontWeight:600}}>52H DİP YAKINI</div>
                <Toggle acik={useDip} onChange={setUseDip} label={useDip?"Aktif":"Kapalı"} aciklama={useDip?"Tarihsel dip bölgesinde":null}/>
                {useDip&&(
                  <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
                    <span style={{fontSize:10,color:"#4a6070"}}>Dipten max %</span>
                    <input className="inp" type="number" value={dip52hMax} step="5" min="0" max="100"
                      onChange={function(e){setDip52hMax(e.target.value);}}
                      style={{width:60,padding:"5px 8px",fontSize:12}}/>
                  </div>
                )}
              </div>

              {/* P/K */}
              <div>
                <div style={{fontSize:10,color:"#4a7080",marginBottom:5,fontWeight:600}}>P/K ORANI</div>
                <Toggle acik={usePk} onChange={setUsePk} label={usePk?"Aktif":"Kapalı"} aciklama={usePk?"Ucuz hisse filtresi":null}/>
                {usePk&&(
                  <div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
                    <span style={{fontSize:10,color:"#4a6070"}}>Max P/K ≤</span>
                    <input className="inp" type="number" value={pkMax} step="2" min="1" max="200"
                      onChange={function(e){setPkMax(e.target.value);}}
                      style={{width:60,padding:"5px 8px",fontSize:12}}/>
                  </div>
                )}
                {usePk&&<div style={{fontSize:9,color:"#2a4050",marginTop:4}}>P/K verisi olmayan hisseler elenmez</div>}
              </div>

              {/* Sıralama */}
              <div>
                <div style={{fontSize:10,color:"#4a7080",marginBottom:5,fontWeight:600}}>SIRALAMA</div>
                <select value={sirala} onChange={function(e){setSirala(e.target.value);}} style={{width:"100%"}}>
                  <option value="rsi">RSI (düşükten ↑)</option>
                  <option value="hacimSpike">Hacim Spike (yüksekten ↓)</option>
                  <option value="uzaklikDip">52H Dipten uzaklık ↑</option>
                  <option value="uzaklikZirve">Zirveye yakınlık ↓</option>
                  <option value="pk">P/K (düşükten ↑)</option>
                  <option value="gunlukDegisim">Günlük Değişim</option>
                </select>
              </div>

            </div>

            {/* Aktif filtre özeti */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:12,paddingTop:10,borderTop:"1px solid #1a2530"}}>
              <span style={{fontSize:10,color:"#3a5060"}}>Aktif:</span>
              {rsiMod!=="hepsi"&&<span className="badge" style={{background:"#0a1e14",color:"#50cc80",border:"1px solid #2a6a40"}}>RSI {rsiMod==="asiri_satim"?"≤":"≥"}{rsiMax}</span>}
              {useHacim&&<span className="badge" style={{background:"#1a1000",color:"#ffcc44",border:"1px solid #4a3a00"}}>Hacim ≥{hacimMin}×</span>}
              {useDip&&<span className="badge" style={{background:"#0a2010",color:"#50dd90",border:"1px solid #2a6a40"}}>Dipten ≤%{dip52hMax}</span>}
              {usePk&&<span className="badge" style={{background:"#1a0e28",color:"#c090f0",border:"1px solid #4a2a70"}}>P/K ≤{pkMax}</span>}
              {rsiMod==="hepsi"&&!useHacim&&!useDip&&!usePk&&<span style={{fontSize:10,color:"#cc7040"}}>⚠ Filtre yok — tüm hisseler listelenecek</span>}
            </div>

            <button className="btn" onClick={tara} disabled={yukl} style={{width:"100%",padding:"12px",fontSize:13,marginTop:14}}>
              {yukl?<><Dots color="#6abf90" size={6}/> Taranıyor...</>:"🔍 Taramayı Başlat"}
            </button>
          </div>

          {/* İLERLEME */}
          {yukl&&ilerLog.length>0&&(
            <div style={{background:"#0a1520",border:"1px solid #1e3040",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:11,color:"#4a7080"}}>
              {ilerLog[ilerLog.length-1]}
            </div>
          )}

          {/* HATA */}
          {hata&&(
            <div style={{background:"#180808",border:"1px solid #401818",borderRadius:8,padding:"12px 16px",color:"#e07070",fontSize:13,marginBottom:16}}>
              ⚠ {hata}
            </div>
          )}

          {/* SONUÇ YOK */}
          {!ilk&&!yukl&&sonuc&&sonuc.filtrelenenSayi===0&&(
            <div style={{textAlign:"center",padding:"40px 20px",background:"#101820",border:"1px solid #1c2c38",borderRadius:10}}>
              <div style={{fontSize:36,marginBottom:10,opacity:.2}}>🔍</div>
              <div style={{fontSize:14,fontWeight:700,color:"#4a7060",marginBottom:8}}>Kriterlere uyan hisse bulunamadı</div>
              <div style={{fontSize:12,color:"#2a5050",lineHeight:1.9,marginBottom:14}}>
                {sonuc.veriAlinanSayi} hisseden veri alındı.<br/>
                Filtreler çok kısıtlayıcı olabilir:
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",fontSize:11,color:"#3a6060"}}>
                {rsiMod!=="hepsi"&&<span>→ RSI eşiğini {rsiMod==="asiri_satim"?"artır (35→45)":"azalt (65→55)"}</span>}
                {useDip&&<span>→ Dip uzaklığını artır ({dip52hMax}→{parseInt(dip52hMax)+20})</span>}
                {useHacim&&<span>→ Hacim spike'ı azalt ({hacimMin}→{Math.max(1.2,parseFloat(hacimMin)-0.5)})</span>}
                {usePk&&<span>→ P/K limitini artır veya kapat</span>}
              </div>
              <div style={{marginTop:16,fontSize:11,color:"#2a4050"}}>
                Aktif filtreler: {sonuc.aktifFiltreler&&Object.entries(sonuc.aktifFiltreler).map(function(e){return e[0]+": "+e[1];}).join(" · ")}
              </div>
            </div>
          )}

          {/* İLK EKRAN */}
          {ilk&&!yukl&&(
            <div style={{textAlign:"center",padding:"50px 20px",color:"#2a4050"}}>
              <div style={{fontSize:48,marginBottom:14,opacity:.15}}>🔍</div>
              <div style={{fontSize:17,fontWeight:700,color:"#3a7060",marginBottom:10}}>BIST Tarama Otomasyonu</div>
              <div style={{fontSize:12,color:"#2a5050",lineHeight:2,maxWidth:380,margin:"0 auto"}}>
                Bir preset seç ya da kendi kriterlerini ayarla.<br/>
                RSI · Hacim Spike · 52H Dip/Zirve · P/K
              </div>
            </div>
          )}

          {/* SONUÇLAR */}
          {sonuc&&sonuc.filtrelenenSayi>0&&(
            <div>
              <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{fontSize:14,color:"#4a9a70",fontWeight:700}}>
                  {sonuc.filtrelenenSayi} hisse bulundu
                </div>
                <div style={{fontSize:11,color:"#2a5040"}}>
                  {sonuc.veriAlinanSayi}/{sonuc.tarandiSayi} hisseden veri alındı
                </div>
              </div>
              <div className="row">
                {sonuc.sonuclar.map(function(h){
                  return <HisseKarti key={h.sembol} h={h} onAnaliz={onAnaliz}/>;
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{borderTop:"1px solid #1a2530",padding:"14px 20px",fontSize:10,color:"#1e3040",textAlign:"center",marginTop:40}}>
          Veriler Yahoo Finance · Yatırım tavsiyesi değildir · BorsaRadar v21
        </div>
      </div>
    </>
  );
}

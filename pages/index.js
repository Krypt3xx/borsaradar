import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const KRENK = { "JEOPOLİTİK":"#ff6b6b","ENERJİ":"#ffa500","MERKEZ BANKASI":"#00e5ff","TEKNOLOJİ":"#a78bfa","TÜRKİYE":"#ff4444","EMTİA":"#ffd700","KRİPTO":"#f59e0b","GENEL":"#4a8a8a" };
const ERENK = { "YÜKSEK":"#ff4444","ORTA":"#ffa500","DÜŞÜK":"#4a8a4a" };
const KATEGORI_MAP = {
  "JEOPOLİTİK":["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","tension","attack","turkey","syria","gaza"],
  "ENERJİ":["oil","crude","gas","opec","energy","pipeline","brent","wti","petrol","doğalgaz","barrel","lng"],
  "MERKEZ BANKASI":["fed","federal reserve","rate","interest","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb"],
  "TEKNOLOJİ":["nvidia","apple","google","microsoft","amazon","meta","ai","chip","semiconductor","openai","tsmc","tesla"],
  "TÜRKİYE":["turkey","turkish","lira","istanbul","ankara","bist","türkiye","türk","erdoğan"],
  "EMTİA":["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","platinum"],
  "KRİPTO":["bitcoin","crypto","ethereum","blockchain","btc","eth","kripto","coinbase"],
};
const kategoriBul = t => { const s=t.toLowerCase(); for(const[k,ws]of Object.entries(KATEGORI_MAP))if(ws.some(w=>s.includes(w)))return k; return"GENEL"; };
const etkiBul = t => { const s=t.toLowerCase(); if(["war","attack","crash","crisis","surge","plunge","record","collapse","emergency"].some(w=>s.includes(w)))return"YÜKSEK"; if(["rise","fall","gain","loss","cut","hike","deal","meeting","report"].some(w=>s.includes(w)))return"ORTA"; return"DÜŞÜK"; };
const yonBul = t => { const s=t.toLowerCase(); const p=["rise","gain","surge","jump","rally","growth","boost","profit","soar"].filter(w=>s.includes(w)).length; const n=["fall","drop","crash","plunge","decline","loss","crisis","default","tumble"].filter(w=>s.includes(w)).length; return p>n?"POZİTİF":n>p?"NEGATİF":"KARISIK"; };
const zamanFmt = d => { try{ const m=(Date.now()-new Date(d).getTime())/60000; if(m<60)return`${Math.floor(m)} dk önce`; if(m<1440)return`${Math.floor(m/60)} sa önce`; return`${Math.floor(m/1440)} gün önce`; }catch{return"az önce";} };

function md(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g,"<strong style='color:#e8f4e8'>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em style='color:#aaccaa'>$1</em>")
    .replace(/^## (.+)$/gm,'<div class="h2">$1</div>')
    .replace(/^### (.+)$/gm,'<div class="h3">$1</div>')
    .replace(/^- (.+)$/gm,'<div class="li"><span>▸</span><span>$1</span></div>')
    .replace(/\n\n/g,'<div style="height:8px"></div>')
    .replace(/\n/g,"<br/>");
}

const Dots = () => (
  <span style={{display:"inline-flex",gap:3,alignItems:"center",verticalAlign:"middle"}}>
    {[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:"#00ff88",display:"inline-block",animation:`dp 1.2s ease-in-out ${i*.2}s infinite`}}/>)}
  </span>
);

const fmtFiyat = (f, sembol) => {
  if (!f) return "—";
  if (sembol === "BTC-USD") return `$${f.toLocaleString("tr-TR",{maximumFractionDigits:0})}`;
  if (["^GSPC","^IXIC"].includes(sembol)) return f.toLocaleString("tr-TR",{maximumFractionDigits:0});
  if (["USDTRY=X","EURTRY=X"].includes(sembol)) return f.toFixed(2);
  return f.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function BorsaRadar() {
  // News
  const [haberler,    setHaberler]    = useState([]);
  const [haberYukl,   setHaberYukl]   = useState(false);
  const [haberHata,   setHaberHata]   = useState("");
  // Prices
  const [fiyatlar,    setFiyatlar]    = useState([]);
  const [fiyatYukl,   setFiyatYukl]   = useState(false);
  // Calendar
  const [takvim,      setTakvim]      = useState([]);
  // Analysis
  const [secilen,     setSecilen]     = useState(null);
  const [analiz,      setAnaliz]      = useState("");
  const [analizYuk,   setAnalizYuk]   = useState(false);
  const [analizBaslik,setAnalizBaslik]= useState("");
  // History & Portfolio
  const [gecmis,      setGecmis]      = useState([]);
  const [portfoy,     setPortfoy]     = useState([]);
  const [yeniHisse,   setYeniHisse]   = useState({sembol:"",adet:"",maliyet:""});
  // UI
  const [solTab,      setSolTab]      = useState("akis"); // akis | manuel | portfoy
  const [sagTab,      setSagTab]      = useState("analiz"); // analiz | gecmis | takvim
  const [manuel,      setManuel]      = useState("");
  const [goster,      setGoster]      = useState(false);
  const [cd,          setCd]          = useState(300);
  const [sonGun,      setSonGun]      = useState(null);
  const cdRef = useRef(null);

  // ── Fiyatlar ──
  const fiyatYukle = useCallback(async () => {
    setFiyatYukl(true);
    try {
      const r = await fetch("/api/prices");
      const d = await r.json();
      if (d.fiyatlar) setFiyatlar(d.fiyatlar);
    } catch {}
    setFiyatYukl(false);
  }, []);

  // ── Haberler ──
  const haberleriYukle = useCallback(async () => {
    setHaberYukl(true); setHaberHata(""); setCd(300);
    try {
      const r = await fetch("/api/news");
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      if (d.haberler?.length > 0) { setHaberler(d.haberler); setSonGun(new Date().toLocaleTimeString("tr-TR")); }
      else setHaberHata("Haber çekilemedi.");
    } catch(e) { setHaberHata(`Hata: ${e.message}`); }
    setHaberYukl(false);
  }, []);

  // ── Takvim ──
  const takvimYukle = useCallback(async () => {
    try {
      const r = await fetch("/api/calendar");
      const d = await r.json();
      if (d.olaylar) setTakvim(d.olaylar);
    } catch {}
  }, []);

  // ── Analiz ──
  const analizEt = useCallback(async (metin, baslik) => {
    if (!metin || analizYuk) return;
    setAnalizYuk(true); setAnaliz(""); setGoster(true); setSagTab("analiz");
    setAnalizBaslik(baslik || metin.slice(0,80));
    try {
      const r = await fetch("/api/analyze", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ metin }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      const txt = d.text || "Analiz alınamadı.";
      // Geçmişe ekle
      const yeniKayit = {
        id: Date.now(),
        baslik: baslik || metin.slice(0,70),
        analiz: txt,
        zaman: new Date().toLocaleTimeString("tr-TR"),
        tarih: new Date().toLocaleDateString("tr-TR"),
      };
      setGecmis(prev => [yeniKayit, ...prev.slice(0,19)]);
      // Typewriter
      let i=0;
      const iv = setInterval(()=>{ i+=18; setAnaliz(txt.slice(0,i)); if(i>=txt.length){setAnaliz(txt);clearInterval(iv);} },8);
    } catch(e) { setAnaliz(`❌ Hata: ${e.message}`); }
    setAnalizYuk(false);
  }, [analizYuk]);

  // ── Init ──
  useEffect(() => {
    haberleriYukle();
    fiyatYukle();
    takvimYukle();
    const r1 = setInterval(haberleriYukle, 5*60*1000);
    const r2 = setInterval(fiyatYukle, 60*1000);
    cdRef.current = setInterval(() => setCd(c => c>0?c-1:300), 1000);
    // Portföyü localStorage'dan yükle
    try { const p=localStorage.getItem("portfoy"); if(p) setPortfoy(JSON.parse(p)); } catch {}
    try { const g=localStorage.getItem("analizGecmis"); if(g) setGecmis(JSON.parse(g)); } catch {}
    return () => { clearInterval(r1); clearInterval(r2); clearInterval(cdRef.current); };
  }, []);

  // Portföy değişince kaydet
  useEffect(() => { try{ localStorage.setItem("portfoy", JSON.stringify(portfoy)); }catch{} }, [portfoy]);
  useEffect(() => { try{ localStorage.setItem("analizGecmis", JSON.stringify(gecmis.slice(0,20))); }catch{} }, [gecmis]);

  const hisseEkle = () => {
    if (!yeniHisse.sembol || !yeniHisse.adet || !yeniHisse.maliyet) return;
    setPortfoy(prev => [...prev, { ...yeniHisse, id: Date.now(), sembol: yeniHisse.sembol.toUpperCase() }]);
    setYeniHisse({sembol:"",adet:"",maliyet:""});
  };

  const fmtCD = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return (
    <>
      <Head>
        <title>BorsaRadar — 7/24 Finansal Analiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#04080f",color:"#b8ccd8",fontFamily:"'Courier New',monospace",overflow:"hidden"}}>
        <style>{`
          @keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}
          @keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
          @keyframes scan{0%{top:-2px}100%{top:100vh}}
          @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
          .hi{transition:all .12s;cursor:pointer}
          .hi:hover{background:#0a1820!important;border-color:#00ff8855!important}
          .hi.sel{background:#071a0f!important;border-color:#00ff88!important}
          ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#04080f}::-webkit-scrollbar-thumb{background:#00ff8833;border-radius:2px}
          textarea:focus,input:focus{outline:none}
          .tb{background:none;border:none;font-family:'Courier New',monospace;cursor:pointer;letter-spacing:.1em;font-size:10px;padding:8px 12px;transition:all .15s;text-transform:uppercase;color:#2a5a3a;border-bottom:2px solid transparent}
          .tb.on{color:#00ff88;border-bottom:2px solid #00ff88}
          .qt{background:#080e16;border:1px solid #0a2030;color:#3a6a8a;padding:3px 8px;border-radius:2px;font-size:10px;cursor:pointer;font-family:inherit;transition:all .15s}
          .qt:hover{border-color:#00ff8855;color:#00ff88}
          .h2{color:#00e5ff;font-size:.9rem;font-weight:700;margin:16px 0 7px;padding-bottom:3px;border-bottom:1px solid #0a2a1a}
          .h3{color:#00ff88;font-size:.83rem;margin:10px 0 5px;border-left:2px solid #00ff88;padding-left:7px}
          .li{display:flex;gap:7px;margin:4px 0;line-height:1.5}
          .li span:first-child{color:#00ff88;flex-shrink:0}
          .inp{background:#060c12;border:1px solid #0a2a1a;color:#c8d8c8;border-radius:3px;padding:6px 8px;font-size:11px;font-family:'Courier New',monospace;width:100%}
          .btn-green{background:#0a2a1a;border:1px solid #00ff88;color:#00ff88;padding:6px 14px;border-radius:3px;font-size:11px;cursor:pointer;font-family:inherit;letter-spacing:.1em;font-weight:700}
          .btn-green:disabled{opacity:.4;cursor:not-allowed}
        `}</style>

        <div style={{position:"fixed",left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#00ff8815,transparent)",animation:"scan 12s linear infinite",pointerEvents:"none",zIndex:999}}/>

        {/* ── HEADER ── */}
        <div style={{padding:"8px 14px",borderBottom:"1px solid #0a1a14",background:"#030709",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:"1.15rem",fontWeight:900,letterSpacing:".15em",color:"#fff",textShadow:"0 0 20px #00ff8855"}}>
              BORSA<span style={{color:"#00ff88"}}>RADAR</span>
            </span>
            <span style={{fontSize:9,color:"#1a5a3a",letterSpacing:".2em",borderLeft:"1px solid #0a2a1a",paddingLeft:10}}>7/24 CANLI</span>
            {sonGun && <span style={{fontSize:9,color:"#1a4a2a"}}>· {sonGun}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:9,color:"#1a4a2a"}}>↻ {fmtCD(cd)}</span>
            <button onClick={haberleriYukle} disabled={haberYukl} className="btn-green" style={{padding:"4px 10px",fontSize:10}}>
              {haberYukl?<Dots/>:"↻ YENİLE"}
            </button>
          </div>
        </div>

        {/* ── FİYAT ŞERİDİ ── */}
        <div style={{borderBottom:"1px solid #0a1a14",background:"#030b07",overflow:"hidden",height:28,flexShrink:0,position:"relative"}}>
          {fiyatlar.length === 0 ? (
            <div style={{display:"flex",alignItems:"center",height:"100%",paddingLeft:14,fontSize:10,color:"#1a4a2a"}}>
              {fiyatYukl ? <><Dots/><span style={{marginLeft:8}}>Fiyatlar yükleniyor...</span></> : "Fiyat verisi bekleniyor"}
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",height:"100%",overflow:"hidden"}}>
              <div style={{display:"flex",animation:"ticker 30s linear infinite",whiteSpace:"nowrap"}}>
                {[...fiyatlar,...fiyatlar].map((f,i)=>(
                  <span key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0 20px",fontSize:11,borderRight:"1px solid #0a1a14"}}>
                    <span style={{color:"#4a8a6a",letterSpacing:".05em"}}>{f.isim}</span>
                    <span style={{color:"#c8d8c8",fontWeight:700}}>{fmtFiyat(f.fiyat, f.sembol)}</span>
                    <span style={{color:f.degisim>=0?"#00ff88":"#ff4444",fontSize:10}}>
                      {f.degisim>=0?"▲":"▼"}{Math.abs(f.degisim||0).toFixed(2)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

          {/* LEFT PANEL */}
          <div style={{width:300,flexShrink:0,borderRight:"1px solid #0a1a14",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:"1px solid #0a1a14",background:"#030709",flexShrink:0}}>
              <button className={`tb${solTab==="akis"?" on":""}`} onClick={()=>setSolTab("akis")}>◉ Akış</button>
              <button className={`tb${solTab==="manuel"?" on":""}`} onClick={()=>setSolTab("manuel")}>✎ Manuel</button>
              <button className={`tb${solTab==="portfoy"?" on":""}`} onClick={()=>setSolTab("portfoy")}>◈ Portföy</button>
            </div>

            {/* HABER AKIŞI */}
            {solTab==="akis" && (
              <div style={{flex:1,overflowY:"auto",padding:5}}>
                {haberYukl && haberler.length===0 && (
                  <div style={{padding:24,textAlign:"center",color:"#1a5a3a"}}>
                    <div style={{marginBottom:8}}><Dots/></div>
                    <div style={{fontSize:11}}>Haberler yükleniyor...</div>
                  </div>
                )}
                {haberHata && (
                  <div style={{padding:12,color:"#ff6644",fontSize:11,textAlign:"center"}}>
                    ⚠ {haberHata}
                    <br/><button onClick={haberleriYukle} className="btn-green" style={{marginTop:6,padding:"3px 10px",fontSize:10}}>Tekrar Dene</button>
                  </div>
                )}
                {haberler.map((h,i)=>(
                  <div key={h.id} className={`hi${secilen?.id===h.id?" sel":""}`}
                    onClick={()=>{ setSecilen(h); analizEt(h.baslik+(h.ozet?" — "+h.ozet:""), h.baslik); }}
                    style={{background:"#060c12",border:"1px solid #0a1820",borderRadius:3,padding:"7px 8px",marginBottom:3,animation:`fi .2s ease ${Math.min(i*.02,.4)}s both`}}
                  >
                    <div style={{display:"flex",gap:3,marginBottom:3,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:8,padding:"1px 4px",borderRadius:2,background:KRENK[h.kategori]+"22",color:KRENK[h.kategori]||"#888",border:`1px solid ${KRENK[h.kategori]||"#444"}22`,flexShrink:0}}>{h.kategori}</span>
                      <span style={{fontSize:8,padding:"1px 4px",borderRadius:2,background:ERENK[h.etki]+"22",color:ERENK[h.etki]||"#888",border:`1px solid ${ERENK[h.etki]||"#444"}22`,flexShrink:0}}>{h.etki}</span>
                      <span style={{fontSize:9,marginLeft:"auto",color:h.yon==="POZİTİF"?"#00ff88":h.yon==="NEGATİF"?"#ff4444":"#ffa500",flexShrink:0}}>{h.yon==="POZİTİF"?"▲":h.yon==="NEGATİF"?"▼":"◆"}</span>
                    </div>
                    <div style={{fontSize:11,color:secilen?.id===h.id?"#d0eed0":"#8ab0a0",lineHeight:1.35,marginBottom:2}}>{h.baslik}</div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a5a3a"}}>
                      <span>{h.kaynak}</span><span>{h.zaman}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MANUEL */}
            {solTab==="manuel" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:10,gap:8,overflow:"auto"}}>
                <div style={{fontSize:10,color:"#2a5a3a",letterSpacing:".1em"}}>▸ KENDİ HABERİNİ GİR</div>
                <textarea value={manuel} onChange={e=>setManuel(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey&&manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));} }}
                  placeholder={"Haber yaz...\n\nÖrn: Hürmüz Boğazı kapandı\nÖrn: Fed 50 baz puan artırdı"}
                  style={{flex:1,minHeight:100,background:"#060c12",border:"1px solid #0a2a1a",color:"#c8d8c8",borderRadius:3,padding:8,fontSize:11,resize:"none",fontFamily:"inherit",lineHeight:1.6}}
                />
                <button onClick={()=>{ if(manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));}}} disabled={!manuel.trim()||analizYuk} className="btn-green">
                  ◈ ANALİZ ET
                </button>
                <div style={{fontSize:9,color:"#1a3a2a"}}>Hızlı örnekler:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                  {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","İran-İsrail savaşı","Altın rekor","Petrol 120$","BTC 100k","Deprem İstanbul","Rusya doğalgaz kesti"].map(t=>(
                    <button key={t} className="qt" onClick={()=>{ setManuel(t);setSecilen(null);analizEt(t,t); }}>{t}</button>
                  ))}
                </div>
              </div>
            )}

            {/* PORTFÖY */}
            {solTab==="portfoy" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:10,gap:8,overflow:"auto"}}>
                <div style={{fontSize:10,color:"#2a5a3a",letterSpacing:".1em"}}>▸ PORTFÖY TAKİBİ</div>

                {/* Hisse ekle */}
                <div style={{background:"#060c12",border:"1px solid #0a2a1a",borderRadius:3,padding:8,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{fontSize:9,color:"#2a5a3a",letterSpacing:".1em"}}>YENİ HİSSE EKLE</div>
                  <input className="inp" placeholder="Sembol (TUPRS, NVDA...)" value={yeniHisse.sembol} onChange={e=>setYeniHisse(p=>({...p,sembol:e.target.value.toUpperCase()}))}/>
                  <div style={{display:"flex",gap:4}}>
                    <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={e=>setYeniHisse(p=>({...p,adet:e.target.value}))} style={{flex:1}}/>
                    <input className="inp" placeholder="Maliyet ₺" type="number" value={yeniHisse.maliyet} onChange={e=>setYeniHisse(p=>({...p,maliyet:e.target.value}))} style={{flex:1}}/>
                  </div>
                  <button onClick={hisseEkle} className="btn-green" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet}>
                    + EKLE
                  </button>
                </div>

                {/* Liste */}
                {portfoy.length === 0 ? (
                  <div style={{textAlign:"center",color:"#1a3a2a",fontSize:11,marginTop:16}}>
                    Portföyünüz boş.<br/>Hisse ekleyerek başlayın.
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {portfoy.map(h=>(
                      <div key={h.id} style={{background:"#060c12",border:"1px solid #0a1820",borderRadius:3,padding:"7px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:12,color:"#00ff88",fontWeight:700,letterSpacing:".1em"}}>{h.sembol}</div>
                          <div style={{fontSize:10,color:"#3a6a4a"}}>{h.adet} adet · ₺{Number(h.maliyet).toLocaleString("tr-TR")} maliyet</div>
                        </div>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <button onClick={()=>analizEt(`${h.sembol} hisse analizi yap, son gelişmeleri değerlendir`, h.sembol)} style={{background:"#0a1f14",border:"1px solid #00ff8830",color:"#00ff88",padding:"3px 7px",borderRadius:2,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>ANALİZ</button>
                          <button onClick={()=>setPortfoy(p=>p.filter(x=>x.id!==h.id))} style={{background:"#1a0a0a",border:"1px solid #ff444430",color:"#ff4444",padding:"3px 7px",borderRadius:2,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>SİL</button>
                        </div>
                      </div>
                    ))}
                    <div style={{fontSize:9,color:"#1a3a2a",marginTop:4,textAlign:"center"}}>
                      Toplam {portfoy.length} pozisyon · Portföy otomatik kaydedilir
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
            {/* Sağ tablar */}
            <div style={{display:"flex",borderBottom:"1px solid #0a1a14",background:"#030709",flexShrink:0}}>
              <button className={`tb${sagTab==="analiz"?" on":""}`} onClick={()=>setSagTab("analiz")}>◈ Analiz</button>
              <button className={`tb${sagTab==="gecmis"?" on":""}`} onClick={()=>setSagTab("gecmis")}>
                📋 Geçmiş {gecmis.length>0&&<span style={{background:"#0a2a1a",borderRadius:2,padding:"0 4px",marginLeft:4,color:"#00ff88",fontSize:9}}>{gecmis.length}</span>}
              </button>
              <button className={`tb${sagTab==="takvim"?" on":""}`} onClick={()=>setSagTab("takvim")}>📅 Takvim</button>
              {analizBaslik && sagTab==="analiz" && (
                <div style={{flex:1,display:"flex",alignItems:"center",paddingRight:12,overflow:"hidden"}}>
                  <span style={{fontSize:10,color:"#3a6a5a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginLeft:8}}>
                    {analizBaslik}
                  </span>
                </div>
              )}
              {analizYuk && <span style={{display:"flex",alignItems:"center",paddingRight:12,marginLeft:"auto"}}><Dots/></span>}
            </div>

            {/* ANALİZ */}
            {sagTab==="analiz" && (
              <div style={{flex:1,overflowY:"auto",padding:16}}>
                {!goster && !analizYuk && (
                  <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#1a3a2a",textAlign:"center",gap:10}}>
                    <div style={{fontSize:44,opacity:.1}}>◈</div>
                    <div style={{fontSize:13}}>Sol panelden bir haber seç</div>
                    <div style={{fontSize:11,color:"#152a1a"}}>veya Manuel sekmesinden haber yaz</div>
                    <div style={{fontSize:10,color:"#0f2010",marginTop:6}}>Haberler her 5 dk · Fiyatlar her 1 dk yenilenir</div>
                  </div>
                )}
                {analizYuk && !analiz && (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:10,color:"#2a6a4a"}}>
                    <Dots/><div style={{fontSize:12,letterSpacing:".1em"}}>ANALİZ EDİLİYOR...</div>
                    <div style={{fontSize:10,color:"#1a4a2a"}}>GPT-4o-mini değerlendiriyor</div>
                  </div>
                )}
                {analiz && (
                  <div style={{animation:"fi .3s ease"}}>
                    <div style={{fontSize:13,lineHeight:1.9,color:"#9ab8a8"}} dangerouslySetInnerHTML={{__html:md(analiz)}}/>
                    {analizYuk && <Dots/>}
                  </div>
                )}
              </div>
            )}

            {/* GEÇMİŞ */}
            {sagTab==="gecmis" && (
              <div style={{flex:1,overflowY:"auto",padding:10}}>
                {gecmis.length===0 ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1a3a2a",fontSize:12}}>
                    Henüz analiz yapılmadı
                  </div>
                ) : (
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:10,color:"#2a5a3a",letterSpacing:".1em"}}>▸ ANALİZ GEÇMİŞİ</span>
                      <button onClick={()=>setGecmis([])} style={{background:"#1a0a0a",border:"1px solid #ff444430",color:"#ff4444",padding:"2px 8px",borderRadius:2,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>Temizle</button>
                    </div>
                    {gecmis.map(g=>(
                      <div key={g.id} style={{background:"#060c12",border:"1px solid #0a1820",borderRadius:3,padding:"8px 10px",marginBottom:6,cursor:"pointer"}}
                        onClick={()=>{ setAnaliz(g.analiz); setAnalizBaslik(g.baslik); setGoster(true); setSagTab("analiz"); }}
                      >
                        <div style={{fontSize:11,color:"#8ab0a0",marginBottom:4,lineHeight:1.3}}>{g.baslik}</div>
                        <div style={{fontSize:9,color:"#2a5a3a"}}>{g.tarih} · {g.zaman} · tıkla açmak için</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAKVİM */}
            {sagTab==="takvim" && (
              <div style={{flex:1,overflowY:"auto",padding:10}}>
                <div style={{fontSize:10,color:"#2a5a3a",letterSpacing:".1em",marginBottom:8}}>▸ EKONOMİK TAKVİM</div>
                {takvim.length===0 ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",color:"#1a3a2a",fontSize:11}}>
                    <Dots/>
                  </div>
                ) : (
                  takvim.map(o=>{
                    const tarih = new Date(o.tarih);
                    const gecti = tarih < new Date();
                    return (
                      <div key={o.id} style={{background:"#060c12",border:`1px solid ${o.onem==="YÜKSEK"?"#ff444420":"#0a1820"}`,borderRadius:3,padding:"8px 10px",marginBottom:5,
                        opacity:gecti?0.45:1,cursor:"pointer"}}
                        onClick={()=>analizEt(`${o.baslik} yaklaşıyor, piyasa etkileri neler olabilir?`, o.baslik)}
                      >
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3}}>
                              {o.ulke && <span style={{fontSize:12}}>{o.ulke}</span>}
                              <span style={{fontSize:8,padding:"1px 5px",borderRadius:2,background:ERENK[o.onem]+"22",color:ERENK[o.onem],border:`1px solid ${ERENK[o.onem]}22`}}>{o.onem}</span>
                              {gecti && <span style={{fontSize:8,color:"#3a5a3a"}}>✓ TAMAMLANDI</span>}
                            </div>
                            <div style={{fontSize:11,color:"#a0c0a0",lineHeight:1.3,marginBottom:2}}>{o.baslik}</div>
                            {o.ozet && <div style={{fontSize:10,color:"#3a5a3a"}}>{o.ozet}</div>}
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:10,color:"#4a8a5a"}}>{tarih.toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}</div>
                            <div style={{fontSize:9,color:"#2a5a3a"}}>{tarih.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</div>
                          </div>
                        </div>
                        <div style={{fontSize:9,color:"#1a3a2a",marginTop:3}}>tıkla → analiz et</div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{padding:"4px 14px",borderTop:"1px solid #0a1a14",background:"#030709",display:"flex",justifyContent:"space-between",fontSize:9,color:"#1a3a2a",flexShrink:0,flexWrap:"wrap",gap:4}}>
          <span>BBC · Reuters · CNBC · Yahoo Finance · WSJ | Fiyatlar: Yahoo Finance</span>
          <span>⚠ Yatırım tavsiyesi değildir</span>
        </div>
      </div>
    </>
  );
}

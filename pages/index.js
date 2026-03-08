import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ─── DATA HELPERS ────────────────────────────────────────────────────────────
const KATEGORI_MAP = {
  "JEOPOLİTİK":    ["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","tension","attack","turkey","syria","gaza"],
  "ENERJİ":        ["oil","crude","gas","opec","energy","pipeline","brent","wti","petrol","doğalgaz","barrel","lng"],
  "MERKEZ BANKASI":["fed","federal reserve","rate","interest","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb"],
  "TEKNOLOJİ":     ["nvidia","apple","google","microsoft","amazon","meta","ai","chip","semiconductor","openai","tsmc","tesla"],
  "TÜRKİYE":       ["turkey","turkish","lira","istanbul","ankara","bist","türkiye","türk","erdoğan"],
  "EMTİA":         ["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","platinum"],
  "KRİPTO":        ["bitcoin","crypto","ethereum","blockchain","btc","eth","kripto","coinbase"],
};
const kategoriBul = t => { const s=t.toLowerCase(); for(const[k,ws]of Object.entries(KATEGORI_MAP))if(ws.some(w=>s.includes(w)))return k; return"GENEL"; };
const etkiBul = t => { const s=t.toLowerCase(); if(["war","attack","crash","crisis","surge","plunge","record","collapse","emergency"].some(w=>s.includes(w)))return"YÜKSEK"; if(["rise","fall","gain","loss","cut","hike","deal","meeting","report"].some(w=>s.includes(w)))return"ORTA"; return"DÜŞÜK"; };
const yonBul = t => { const s=t.toLowerCase(); const p=["rise","gain","surge","jump","rally","growth","boost","profit","soar"].filter(w=>s.includes(w)).length; const n=["fall","drop","crash","plunge","decline","loss","crisis","default","tumble"].filter(w=>s.includes(w)).length; return p>n?"POZİTİF":n>p?"NEGATİF":"KARISIK"; };
const zamanFmt = d => { try{ const m=(Date.now()-new Date(d).getTime())/60000; if(m<60)return`${Math.floor(m)} dk`; if(m<1440)return`${Math.floor(m/60)} sa`; return`${Math.floor(m/1440)} gün`; }catch{return"?";} };

// Kategori renkleri — pastel, göz yormaz
const KRENK = {
  "JEOPOLİTİK": { bg:"#2d1515", border:"#6b3030", text:"#f0a0a0" },
  "ENERJİ":     { bg:"#2d1e00", border:"#6b4800", text:"#ffb74d" },
  "MERKEZ BANKASI":{ bg:"#001a2d", border:"#004a7a", text:"#80c8f0" },
  "TEKNOLOJİ":  { bg:"#1a1030", border:"#4a3080", text:"#c0a8f0" },
  "TÜRKİYE":    { bg:"#2d0808", border:"#700000", text:"#ff8a80" },
  "EMTİA":      { bg:"#2a2000", border:"#665000", text:"#ffd54f" },
  "KRİPTO":     { bg:"#1e1500", border:"#5a3e00", text:"#ffcc02" },
  "GENEL":      { bg:"#151a20", border:"#2a3a4a", text:"#8aacbe" },
};
const ERENK = {
  "YÜKSEK": { bg:"#2d0a0a", text:"#ff6b6b", border:"#6b1a1a" },
  "ORTA":   { bg:"#2a1a00", text:"#ffa040", border:"#6b4400" },
  "DÜŞÜK":  { bg:"#0a1f0a", text:"#60b060", border:"#1a4a1a" },
};

const fmtFiyat = (f, sembol) => {
  if (!f) return "—";
  if (sembol==="BTC-USD") return `$${f.toLocaleString("tr-TR",{maximumFractionDigits:0})}`;
  if (["^GSPC","^IXIC"].includes(sembol)) return f.toLocaleString("tr-TR",{maximumFractionDigits:0});
  if (["USDTRY=X","EURTRY=X"].includes(sembol)) return f.toFixed(2)+"₺";
  if (sembol==="GC=F") return `$${f.toFixed(0)}`;
  if (sembol==="BZ=F") return `$${f.toFixed(1)}`;
  return f.toFixed(2);
};

function md(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g,"<strong style='color:#f0f4f0;font-weight:600'>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em style='color:#b8d0c0'>$1</em>")
    .replace(/^## (.+)$/gm,'<div class="mh2">$1</div>')
    .replace(/^### (.+)$/gm,'<div class="mh3">$1</div>')
    .replace(/^- (.+)$/gm,'<div class="mli"><span class="mbull">▸</span><span>$1</span></div>')
    .replace(/\n\n/g,'<div style="height:10px"></div>')
    .replace(/\n/g,"<br/>");
}

const Dots = ({color="#52a87c"}) => (
  <span style={{display:"inline-flex",gap:4,alignItems:"center",verticalAlign:"middle"}}>
    {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:color,display:"inline-block",animation:`dp 1.3s ease-in-out ${i*.22}s infinite`}}/>)}
  </span>
);

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function BorsaRadar() {
  const [haberler,    setHaberler]    = useState([]);
  const [haberYukl,   setHaberYukl]   = useState(false);
  const [haberHata,   setHaberHata]   = useState("");
  const [fiyatlar,    setFiyatlar]    = useState([]);
  const [takvim,      setTakvim]      = useState([]);
  const [secilen,     setSecilen]     = useState(null);
  const [analiz,      setAnaliz]      = useState("");
  const [analizYuk,   setAnalizYuk]   = useState(false);
  const [analizBaslik,setAnalizBaslik]= useState("");
  const [gecmis,      setGecmis]      = useState([]);
  const [portfoy,     setPortfoy]     = useState([]);
  const [yeniHisse,   setYeniHisse]   = useState({sembol:"",adet:"",maliyet:""});
  const [solTab,      setSolTab]      = useState("akis");
  const [sagTab,      setSagTab]      = useState("analiz");
  const [manuel,      setManuel]      = useState("");
  const [goster,      setGoster]      = useState(false);
  const [cd,          setCd]          = useState(300);
  const [sonGun,      setSonGun]      = useState(null);
  const cdRef = useRef(null);

  const fiyatYukle = useCallback(async () => {
    try { const r=await fetch("/api/prices"); const d=await r.json(); if(d.fiyatlar)setFiyatlar(d.fiyatlar); } catch {}
  }, []);

  const haberleriYukle = useCallback(async () => {
    setHaberYukl(true); setHaberHata(""); setCd(300);
    try {
      const r=await fetch("/api/news");
      if(!r.ok) throw new Error(`${r.status}`);
      const d=await r.json();
      if(d.haberler?.length>0){ setHaberler(d.haberler); setSonGun(new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})); }
      else setHaberHata("Haber çekilemedi.");
    } catch(e){ setHaberHata(`Bağlantı hatası: ${e.message}`); }
    setHaberYukl(false);
  }, []);

  const takvimYukle = useCallback(async () => {
    try { const r=await fetch("/api/calendar"); const d=await r.json(); if(d.olaylar)setTakvim(d.olaylar); } catch {}
  }, []);

  const analizEt = useCallback(async (metin, baslik) => {
    if(!metin||analizYuk) return;
    setAnalizYuk(true); setAnaliz(""); setGoster(true); setSagTab("analiz");
    setAnalizBaslik(baslik||metin.slice(0,80));
    try {
      const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin})});
      const d=await r.json();
      if(d.error) throw new Error(d.error);
      const txt=d.text||"Analiz alınamadı.";
      setGecmis(prev=>[{id:Date.now(),baslik:baslik||metin.slice(0,70),analiz:txt,zaman:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),tarih:new Date().toLocaleDateString("tr-TR")},...prev.slice(0,19)]);
      let i=0; const iv=setInterval(()=>{ i+=20; setAnaliz(txt.slice(0,i)); if(i>=txt.length){setAnaliz(txt);clearInterval(iv);} },7);
    } catch(e){ setAnaliz(`❌ ${e.message}`); }
    setAnalizYuk(false);
  }, [analizYuk]);

  useEffect(()=>{
    haberleriYukle(); fiyatYukle(); takvimYukle();
    const r1=setInterval(haberleriYukle,5*60*1000);
    const r2=setInterval(fiyatYukle,60*1000);
    cdRef.current=setInterval(()=>setCd(c=>c>0?c-1:300),1000);
    try{ const p=localStorage.getItem("br_portfoy"); if(p)setPortfoy(JSON.parse(p)); }catch{}
    try{ const g=localStorage.getItem("br_gecmis"); if(g)setGecmis(JSON.parse(g)); }catch{}
    return()=>{ clearInterval(r1); clearInterval(r2); clearInterval(cdRef.current); };
  },[]);

  useEffect(()=>{ try{localStorage.setItem("br_portfoy",JSON.stringify(portfoy));}catch{} },[portfoy]);
  useEffect(()=>{ try{localStorage.setItem("br_gecmis",JSON.stringify(gecmis.slice(0,20)));}catch{} },[gecmis]);

  const hisseEkle = () => {
    if(!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet) return;
    setPortfoy(prev=>[...prev,{...yeniHisse,id:Date.now(),sembol:yeniHisse.sembol.toUpperCase()}]);
    setYeniHisse({sembol:"",adet:"",maliyet:""});
  };

  const fmtCD = s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return (
    <>
      <Head>
        <title>BorsaRadar — 7/24 Finansal Analiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      </Head>

      <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#0f1318",color:"#d4dde6",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
        <style>{`
          @keyframes dp{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
          @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

          * { box-sizing: border-box; }

          /* Scrollbar */
          ::-webkit-scrollbar{width:4px}
          ::-webkit-scrollbar-track{background:#0f1318}
          ::-webkit-scrollbar-thumb{background:#2a3a4a;border-radius:4px}
          ::-webkit-scrollbar-thumb:hover{background:#3a5a6a}

          /* Tab butonları */
          .tab{background:none;border:none;font-family:'Inter',sans-serif;cursor:pointer;
               font-size:12px;font-weight:500;padding:10px 14px;letter-spacing:.01em;
               color:#5a7a8a;border-bottom:2px solid transparent;transition:all .15s}
          .tab:hover{color:#8aaabb}
          .tab.on{color:#e0eeee;border-bottom:2px solid #4a9a7a}

          /* Haber kartları */
          .hcard{transition:background .12s,border-color .12s;cursor:pointer;border-radius:6px}
          .hcard:hover{background:#1a2530!important;border-color:#3a5a6a!important}
          .hcard.sel{background:#132218!important;border-color:#4a9a6a!important}

          /* Etiket */
          .badge{display:inline-flex;align-items:center;font-size:10px;font-weight:600;
                 padding:2px 7px;border-radius:4px;letter-spacing:.02em;line-height:1.4}

          /* Analiz içeriği */
          .mh2{font-size:14px;font-weight:700;color:#90cce0;margin:20px 0 10px;
               padding-bottom:6px;border-bottom:1px solid #1e3040;letter-spacing:.01em}
          .mh3{font-size:13px;font-weight:600;color:#70bb90;margin:14px 0 6px;
               padding-left:10px;border-left:3px solid #4a9a6a}
          .mli{display:flex;gap:10px;margin:6px 0;line-height:1.6;font-size:13px;color:#bccdd8}
          .mbull{color:#4a9a6a;flex-shrink:0;margin-top:1px}

          /* Form elemanları */
          .inp{background:#161d24;border:1px solid #2a3a4a;color:#d4dde6;
               border-radius:6px;padding:8px 10px;font-size:13px;
               font-family:'Inter',sans-serif;width:100%;transition:border-color .15s}
          .inp:focus{border-color:#4a9a6a;outline:none}
          .inp::placeholder{color:#3a5060}

          textarea.inp{resize:none;line-height:1.6}

          /* Butonlar */
          .btn-primary{background:#1a3a2a;border:1px solid #4a9a6a;color:#7ecca0;
                       padding:9px 18px;border-radius:6px;font-size:13px;font-weight:600;
                       cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:.02em;
                       transition:all .15s}
          .btn-primary:hover{background:#1f4a32;border-color:#5aaa7a;color:#90ddb0}
          .btn-primary:disabled{opacity:.35;cursor:not-allowed}

          .btn-sm{padding:4px 10px;border-radius:4px;font-size:11px;font-weight:500;
                  cursor:pointer;font-family:'Inter',sans-serif;border:1px solid;transition:all .15s}

          /* Hızlı tag */
          .qtag{background:#161d24;border:1px solid #263040;color:#607080;padding:5px 10px;
                border-radius:5px;font-size:11px;font-weight:500;cursor:pointer;
                font-family:'Inter',sans-serif;transition:all .15s}
          .qtag:hover{background:#1a2a34;border-color:#4a7a8a;color:#90b8c8}

          /* Fiyat şeridi */
          .price-chip{display:inline-flex;align-items:center;gap:8px;
                      padding:0 18px;font-size:12px;border-right:1px solid #1a2530}
        `}</style>

        {/* ── HEADER ── */}
        <div style={{
          padding:"0 18px", height:48, borderBottom:"1px solid #1a2530",
          background:"#0c1015", display:"flex", alignItems:"center",
          justifyContent:"space-between", flexShrink:0,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{display:"flex",alignItems:"baseline",gap:2}}>
              <span style={{fontSize:"1.25rem",fontWeight:800,color:"#e8f4ee",letterSpacing:"-.01em"}}>Borsa</span>
              <span style={{fontSize:"1.25rem",fontWeight:800,color:"#4aaa70",letterSpacing:"-.01em"}}>Radar</span>
            </div>
            <div style={{width:1,height:18,background:"#1a2530"}}/>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#4aaa70",display:"inline-block",boxShadow:"0 0 6px #4aaa7088"}}/>
              <span style={{fontSize:12,color:"#5a8a70",fontWeight:500}}>Canlı</span>
            </div>
            {sonGun && <span style={{fontSize:11,color:"#3a5a50"}}>· Son güncelleme {sonGun}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:11,color:"#3a5060",fontFamily:"'JetBrains Mono',monospace"}}>↻ {fmtCD(cd)}</span>
            <button onClick={haberleriYukle} disabled={haberYukl} className="btn-primary" style={{padding:"6px 14px",fontSize:12}}>
              {haberYukl ? <Dots/> : "Yenile"}
            </button>
          </div>
        </div>

        {/* ── FİYAT ŞERİDİ ── */}
        <div style={{height:34,borderBottom:"1px solid #1a2530",background:"#0c1015",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center"}}>
          {fiyatlar.length===0 ? (
            <div style={{paddingLeft:18,fontSize:11,color:"#3a5060",display:"flex",alignItems:"center",gap:8}}>
              <Dots color="#3a5060"/><span>Piyasa verileri yükleniyor...</span>
            </div>
          ) : (
            <div style={{display:"flex",animation:"ticker 35s linear infinite",whiteSpace:"nowrap",alignItems:"center",height:"100%"}}>
              {[...fiyatlar,...fiyatlar].map((f,i)=>(
                <span key={i} className="price-chip">
                  <span style={{color:"#607888",fontWeight:500,fontSize:11}}>{f.isim}</span>
                  <span style={{color:"#c8dce8",fontWeight:600,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{fmtFiyat(f.fiyat,f.sembol)}</span>
                  <span style={{
                    color:f.degisim>=0?"#50bb80":"#e06060",
                    fontSize:11,fontWeight:600,
                    background:f.degisim>=0?"#0a2a1a":"#2a0a0a",
                    padding:"1px 5px",borderRadius:3,
                  }}>
                    {f.degisim>=0?"+":" "}{(f.degisim||0).toFixed(2)}%
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── BODY ── */}
        <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

          {/* ── SOL PANEL ── */}
          <div style={{width:320,flexShrink:0,borderRight:"1px solid #1a2530",display:"flex",flexDirection:"column",overflow:"hidden",background:"#0c1015"}}>
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,paddingLeft:4}}>
              <button className={`tab${solTab==="akis"?" on":""}`} onClick={()=>setSolTab("akis")}>Haber Akışı</button>
              <button className={`tab${solTab==="manuel"?" on":""}`} onClick={()=>setSolTab("manuel")}>Manuel</button>
              <button className={`tab${solTab==="portfoy"?" on":""}`} onClick={()=>setSolTab("portfoy")}>
                Portföy {portfoy.length>0&&<span style={{background:"#1a3a2a",color:"#70bb90",borderRadius:3,padding:"0 5px",fontSize:10,marginLeft:3,fontWeight:600}}>{portfoy.length}</span>}
              </button>
            </div>

            {/* HABER AKIŞI */}
            {solTab==="akis" && (
              <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
                {haberYukl && haberler.length===0 && (
                  <div style={{padding:32,textAlign:"center",color:"#3a6050"}}>
                    <div style={{marginBottom:12}}><Dots/></div>
                    <div style={{fontSize:13,fontWeight:500,color:"#5a8a70",marginBottom:4}}>Haberler yükleniyor</div>
                    <div style={{fontSize:11,color:"#3a5050"}}>BBC · Reuters · CNBC · Yahoo Finance</div>
                  </div>
                )}
                {haberHata && (
                  <div style={{margin:10,padding:12,background:"#1a0a0a",border:"1px solid #4a1a1a",borderRadius:6,color:"#e08080",fontSize:12,lineHeight:1.5}}>
                    ⚠ {haberHata}
                    <br/><button onClick={haberleriYukle} className="btn-sm" style={{marginTop:8,borderColor:"#4a2020",color:"#e08080",background:"#220a0a"}}>Tekrar Dene</button>
                  </div>
                )}
                {haberler.map((h,i)=>{
                  const kr=KRENK[h.kategori]||KRENK["GENEL"];
                  const er=ERENK[h.etki]||ERENK["DÜŞÜK"];
                  return (
                    <div key={h.id} className={`hcard${secilen?.id===h.id?" sel":""}`}
                      onClick={()=>{ setSecilen(h); analizEt(h.baslik+(h.ozet?" — "+h.ozet:""),h.baslik); }}
                      style={{background:"#111820",border:"1px solid #1e2d38",padding:"10px 11px",marginBottom:5,
                        animation:`fadein .2s ease ${Math.min(i*.02,.4)}s both`}}
                    >
                      <div style={{display:"flex",gap:5,marginBottom:7,alignItems:"center",flexWrap:"wrap"}}>
                        <span className="badge" style={{background:kr.bg,color:kr.text,border:`1px solid ${kr.border}`}}>{h.kategori}</span>
                        <span className="badge" style={{background:er.bg,color:er.text,border:`1px solid ${er.border}`}}>{h.etki}</span>
                        <span style={{marginLeft:"auto",fontSize:13,fontWeight:700,
                          color:h.yon==="POZİTİF"?"#50bb80":h.yon==="NEGATİF"?"#e06060":"#cc8830"}}>
                          {h.yon==="POZİTİF"?"▲":h.yon==="NEGATİF"?"▼":"◆"}
                        </span>
                      </div>
                      <div style={{fontSize:12,color:secilen?.id===h.id?"#c8eedd":"#a8c4cc",lineHeight:1.5,marginBottom:6,fontWeight:secilen?.id===h.id?500:400}}>
                        {h.baslik}
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#3a5868"}}>
                        <span style={{fontWeight:500}}>{h.kaynak}</span>
                        <span>{zamanFmt(h.tarih)} önce</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MANUEL */}
            {solTab==="manuel" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#5a8a70",letterSpacing:".02em"}}>Haber veya gelişme gir</div>
                <textarea className="inp" value={manuel} onChange={e=>setManuel(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey&&manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));} }}
                  style={{flex:1,minHeight:120}}
                  placeholder={"Analiz etmek istediğin haberi yaz...\n\nÖrn: Hürmüz Boğazı kapandı\nÖrn: Fed 50 baz puan artırdı\nÖrn: NVIDIA yeni nesil GPU duyurdu"}
                />
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#3a5060"}}>Ctrl + Enter</span>
                  <button onClick={()=>{ if(manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));}}} disabled={!manuel.trim()||analizYuk} className="btn-primary">
                    {analizYuk ? <><Dots/> Analiz ediliyor</> : "Analiz Et →"}
                  </button>
                </div>
                <div style={{borderTop:"1px solid #1a2530",paddingTop:10}}>
                  <div style={{fontSize:11,color:"#3a5060",marginBottom:7,fontWeight:500}}>Hızlı örnekler</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","İran-İsrail savaşı","Altın rekor","Petrol 120$","BTC 100k","Deprem İstanbul","Rusya gaz kesti"].map(t=>(
                      <button key={t} className="qtag" onClick={()=>{ setManuel(t);setSecilen(null);analizEt(t,t); }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PORTFÖY */}
            {solTab==="portfoy" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#5a8a70"}}>Portföy Takibi</div>

                <div style={{background:"#111820",border:"1px solid #1e2d38",borderRadius:8,padding:12,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#3a6050",letterSpacing:".03em",textTransform:"uppercase"}}>Yeni Pozisyon</div>
                  <input className="inp" placeholder="Sembol — TUPRS, NVDA, EREGL..." value={yeniHisse.sembol} onChange={e=>setYeniHisse(p=>({...p,sembol:e.target.value.toUpperCase()}))}/>
                  <div style={{display:"flex",gap:6}}>
                    <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={e=>setYeniHisse(p=>({...p,adet:e.target.value}))} style={{flex:1}}/>
                    <input className="inp" placeholder="Maliyet ₺" type="number" value={yeniHisse.maliyet} onChange={e=>setYeniHisse(p=>({...p,maliyet:e.target.value}))} style={{flex:1}}/>
                  </div>
                  <button onClick={hisseEkle} className="btn-primary" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>
                    + Portföye Ekle
                  </button>
                </div>

                {portfoy.length===0 ? (
                  <div style={{textAlign:"center",color:"#3a5060",fontSize:12,marginTop:20,lineHeight:1.7}}>
                    Portföyünüz boş.<br/>Hisse ekleyerek takibe başlayın.
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {portfoy.map(h=>(
                      <div key={h.id} style={{background:"#111820",border:"1px solid #1e2d38",borderRadius:6,padding:"10px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:14,color:"#7adda8",fontWeight:700,fontFamily:"'JetBrains Mono',monospace",letterSpacing:".03em"}}>{h.sembol}</div>
                          <div style={{fontSize:11,color:"#3a6050",marginTop:2}}>{Number(h.adet).toLocaleString("tr-TR")} adet · ₺{Number(h.maliyet).toLocaleString("tr-TR")} maliyet</div>
                        </div>
                        <div style={{display:"flex",gap:5}}>
                          <button className="btn-sm" style={{borderColor:"#2a5a3a",color:"#70bb90",background:"#0f2a1a"}}
                            onClick={()=>analizEt(`${h.sembol} hissesi için son gelişmeleri ve piyasa durumunu analiz et, al/sat önerisi ver`,h.sembol)}>
                            Analiz
                          </button>
                          <button className="btn-sm" style={{borderColor:"#4a1a1a",color:"#e08080",background:"#1a0808"}}
                            onClick={()=>setPortfoy(p=>p.filter(x=>x.id!==h.id))}>
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{fontSize:10,color:"#2a4050",marginTop:4,textAlign:"center"}}>
                      {portfoy.length} pozisyon · Otomatik kaydedilir
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SAĞ PANEL ── */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",background:"#0c1015",flexShrink:0,paddingLeft:4}}>
              <button className={`tab${sagTab==="analiz"?" on":""}`} onClick={()=>setSagTab("analiz")}>Analiz</button>
              <button className={`tab${sagTab==="gecmis"?" on":""}`} onClick={()=>setSagTab("gecmis")}>
                Geçmiş {gecmis.length>0&&<span style={{background:"#1a3a2a",color:"#70bb90",borderRadius:3,padding:"0 5px",fontSize:10,marginLeft:3,fontWeight:600}}>{gecmis.length}</span>}
              </button>
              <button className={`tab${sagTab==="takvim"?" on":""}`} onClick={()=>setSagTab("takvim")}>Ekonomik Takvim</button>
              {analizBaslik && sagTab==="analiz" && (
                <div style={{flex:1,display:"flex",alignItems:"center",paddingRight:14,overflow:"hidden"}}>
                  <span style={{fontSize:11,color:"#3a6050",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginLeft:10,fontStyle:"italic"}}>
                    {analizBaslik}
                  </span>
                </div>
              )}
              {analizYuk && <span style={{display:"flex",alignItems:"center",paddingRight:14,marginLeft:"auto"}}><Dots/></span>}
            </div>

            {/* ANALİZ PANELI */}
            {sagTab==="analiz" && (
              <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
                {!goster && !analizYuk && (
                  <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,textAlign:"center"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",background:"#111820",border:"2px solid #1e2d38",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📡</div>
                    <div style={{fontSize:15,fontWeight:600,color:"#4a7060"}}>Analiz bekleniyor</div>
                    <div style={{fontSize:13,color:"#2a4050",lineHeight:1.6,maxWidth:280}}>Sol panelden bir habere tıkla<br/>ya da Manuel sekmesinden kendi haberini yaz</div>
                  </div>
                )}
                {analizYuk && !analiz && (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:14}}>
                    <Dots/><div style={{fontSize:13,fontWeight:500,color:"#4a8a6a"}}>Analiz ediliyor...</div>
                    <div style={{fontSize:11,color:"#2a5040"}}>GPT-4o-mini piyasa verilerini değerlendiriyor</div>
                  </div>
                )}
                {analiz && (
                  <div style={{animation:"fadein .3s ease",maxWidth:780}}>
                    <div style={{fontSize:13,lineHeight:1.85,color:"#b0c8d4"}} dangerouslySetInnerHTML={{__html:md(analiz)}}/>
                    {analizYuk && <span style={{marginTop:8,display:"inline-block"}}><Dots/></span>}
                  </div>
                )}
              </div>
            )}

            {/* GEÇMİŞ */}
            {sagTab==="gecmis" && (
              <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
                {gecmis.length===0 ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#2a4050",fontSize:13}}>Henüz analiz yapılmadı</div>
                ) : (
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <span style={{fontSize:13,fontWeight:600,color:"#4a7060"}}>Analiz Geçmişi</span>
                      <button className="btn-sm" onClick={()=>setGecmis([])} style={{borderColor:"#3a1a1a",color:"#e08080",background:"#1a0808"}}>Temizle</button>
                    </div>
                    {gecmis.map(g=>(
                      <div key={g.id}
                        onClick={()=>{ setAnaliz(g.analiz); setAnalizBaslik(g.baslik); setGoster(true); setSagTab("analiz"); }}
                        style={{background:"#111820",border:"1px solid #1e2d38",borderRadius:6,padding:"10px 12px",marginBottom:6,cursor:"pointer",transition:"all .12s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="#3a5a6a"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2d38"}
                      >
                        <div style={{fontSize:13,color:"#90b8c8",marginBottom:5,lineHeight:1.4,fontWeight:500}}>{g.baslik}</div>
                        <div style={{fontSize:10,color:"#3a5060"}}>{g.tarih} · {g.zaman} · tekrar görüntülemek için tıkla</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAKVİM */}
            {sagTab==="takvim" && (
              <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#4a7060",marginBottom:12}}>Yaklaşan Ekonomik Olaylar</div>
                {takvim.length===0 ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%"}}><Dots/></div>
                ) : (
                  takvim.map(o=>{
                    const tarih=new Date(o.tarih);
                    const gecti=tarih<new Date();
                    const er=ERENK[o.onem]||ERENK["DÜŞÜK"];
                    return (
                      <div key={o.id}
                        onClick={()=>analizEt(`${o.baslik} yaklaşıyor, olası piyasa etkileri neler?`,o.baslik)}
                        style={{background:gecti?"#0c1015":"#111820",border:`1px solid ${o.onem==="YÜKSEK"&&!gecti?"#3a2020":"#1e2d38"}`,borderRadius:6,padding:"11px 13px",marginBottom:6,cursor:"pointer",opacity:gecti?.5:1,transition:"all .12s"}}
                        onMouseEnter={e=>{ if(!gecti)e.currentTarget.style.borderColor="#3a5a6a"; }}
                        onMouseLeave={e=>{ if(!gecti)e.currentTarget.style.borderColor=o.onem==="YÜKSEK"?"#3a2020":"#1e2d38"; }}
                      >
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                              {o.ulke&&<span style={{fontSize:14}}>{o.ulke}</span>}
                              <span className="badge" style={{background:er.bg,color:er.text,border:`1px solid ${er.border}`}}>{o.onem}</span>
                              {gecti&&<span style={{fontSize:10,color:"#3a5a50",fontWeight:500}}>✓ Tamamlandı</span>}
                            </div>
                            <div style={{fontSize:13,color:gecti?"#4a6070":"#a0c0cc",fontWeight:500,lineHeight:1.4,marginBottom:3}}>{o.baslik}</div>
                            {o.ozet&&<div style={{fontSize:11,color:"#3a5860"}}>{o.ozet}</div>}
                          </div>
                          <div style={{textAlign:"right",flexShrink:0,paddingTop:2}}>
                            <div style={{fontSize:12,fontWeight:600,color:"#5a8880",fontFamily:"'JetBrains Mono',monospace"}}>
                              {tarih.toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}
                            </div>
                          </div>
                        </div>
                        {!gecti&&<div style={{fontSize:10,color:"#2a5040",marginTop:6}}>→ tıkla ve analiz et</div>}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{height:26,borderTop:"1px solid #1a2530",background:"#0c1015",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",flexShrink:0}}>
          <span style={{fontSize:10,color:"#2a4050"}}>Kaynaklar: BBC · Reuters · CNBC · Yahoo Finance · WSJ</span>
          <span style={{fontSize:10,color:"#2a4050"}}>⚠ Yatırım tavsiyesi değildir</span>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ─── RSS SOURCES ────────────────────────────────────────────────────────────
const RSS_SOURCES = [
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",             kaynak: "BBC Business" },
  { url: "https://feeds.reuters.com/reuters/businessNews",             kaynak: "Reuters" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",      kaynak: "CNBC Markets" },
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US", kaynak: "Yahoo Finance" },
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",              kaynak: "WSJ Markets" },
  { url: "https://www.investing.com/rss/news_25.rss",                  kaynak: "Investing.com" },
];

// ─── CLASSIFICATION ──────────────────────────────────────────────────────────
const KATEGORI_MAP = {
  "JEOPOLİTİK": ["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","tension","attack","turkey","syria","gaza","savaş","gerilim","tehdit"],
  "ENERJİ":     ["oil","crude","gas","opec","energy","pipeline","brent","wti","petrol","doğalgaz","barrel","lng","solar","wind"],
  "MERKEZ BANKASI": ["fed","federal reserve","rate","interest","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb","monetary"],
  "TEKNOLOJİ":  ["nvidia","apple","google","microsoft","amazon","meta","ai","chip","semiconductor","tech","openai","tsmc","alphabet","tesla"],
  "TÜRKİYE":   ["turkey","turkish","lira","istanbul","ankara","bist","türkiye","türk","erdoğan","borsa"],
  "EMTİA":      ["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","platinum","alumin"],
  "KRİPTO":     ["bitcoin","crypto","ethereum","blockchain","btc","eth","kripto","coinbase","defi","stablecoin"],
};
const ETKİ_YUKSEK = ["war","attack","crash","crisis","surge","plunge","record","ban","default","collapse","emergency","catastroph","spike","soar"];
const ETKİ_ORTA   = ["rise","fall","gain","loss","cut","hike","deal","meeting","report","data","decision","change","shift"];

const kategoriBul  = t => { const s = t.toLowerCase(); for (const [k,ws] of Object.entries(KATEGORI_MAP)) if (ws.some(w=>s.includes(w))) return k; return "GENEL"; };
const etkiBul      = t => { const s = t.toLowerCase(); if (ETKİ_YUKSEK.some(w=>s.includes(w))) return "YÜKSEK"; if (ETKİ_ORTA.some(w=>s.includes(w))) return "ORTA"; return "DÜŞÜK"; };
const yonBul       = t => {
  const s = t.toLowerCase();
  const p = ["rise","gain","surge","jump","high","rally","up ","growth","boost","profit","record high","artış","yüksel","rekor"].filter(w=>s.includes(w)).length;
  const n = ["fall","drop","crash","plunge"," low","decline","loss","cut ","crisis","default","düşüş","kayıp","kriz","geril"].filter(w=>s.includes(w)).length;
  return p > n ? "POZİTİF" : n > p ? "NEGATİF" : "KARISIK";
};
const zamanFmt = d => { try { const m=(Date.now()-new Date(d).getTime())/60000; if(m<60) return `${Math.floor(m)} dk önce`; if(m<1440) return `${Math.floor(m/60)} sa önce`; return `${Math.floor(m/1440)} gün önce`; } catch { return "az önce"; } };

// ─── CLAUDE SYSTEM PROMPT ────────────────────────────────────────────────────
const SYSTEM = `Sen dünyaca tanınmış bir finansal analist ve borsa stratejistisin. Goldman Sachs seviyesinde analiz yapıyorsun.

Kullanıcı sana bir haber verir. Şunları yap:

## ZİNCİR ANALİZ
Olay → Birincil etki → İkincil etki → Piyasa yansıması (ok işaretiyle göster)

## HİSSE & VARLIK ÖNERİLERİ
Her öneri için şu formatı kullan:
**[SEMBOL]** 📈 AL / 📉 SAT | Hedef: %±XX | Güven: %XX | Neden: kısa açıklama

BIST hisseleri önce (TUPRS, THYAO, EREGL, ASELS, GARAN, BIMAS, SISE, KCHOL, TCELL, PETKM, AKBNK vb.)
Sonra global (NVDA, XOM, CVX, GLD, USO, TLT vb.)

## DÖVİZ & EMTİA GÖRÜŞÜ
USD/TRY, EUR/TRY, Altın (XAU/USD), Petrol (Brent) beklentileri

## SENARYO ANALİZİ
🟢 Boğa senaryosu (%X olasılık): açıklama
🔴 Ayı senaryosu (%X olasılık): açıklama

## ÖZET VE EN GÜÇLÜ ÖNERİ
2-3 cümle özet + en güçlü 1-2 pozisyon

Türkçe yaz. Net ve somut rakamlar kullan. Spekülatif ise belirt.
⚠️ Bu analiz yatırım tavsiyesi değildir.`;

// ─── COLORS ──────────────────────────────────────────────────────────────────
const KRENK = { "JEOPOLİTİK":"#ff6b6b","ENERJİ":"#ffa500","MERKEZ BANKASI":"#00e5ff","TEKNOLOJİ":"#a78bfa","TÜRKİYE":"#ff4444","EMTİA":"#ffd700","KRİPTO":"#f59e0b","GENEL":"#4a8a8a" };
const ERENK = { "YÜKSEK":"#ff4444","ORTA":"#ffa500","DÜŞÜK":"#4a8a4a" };

// ─── MARKDOWN PARSER ─────────────────────────────────────────────────────────
function md(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#e8f4e8'>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em style='color:#aaccaa'>$1</em>")
    .replace(/^## (.+)$/gm,   '<div class="h2">$1</div>')
    .replace(/^### (.+)$/gm,  '<div class="h3">$1</div>')
    .replace(/^- (.+)$/gm,    '<div class="li"><span>▸</span><span>$1</span></div>')
    .replace(/\n\n/g,          '<div style="height:8px"></div>')
    .replace(/\n/g,            "<br/>");
}

// ─── DOTS LOADER ─────────────────────────────────────────────────────────────
const Dots = () => (
  <span style={{display:"inline-flex",gap:3,alignItems:"center",verticalAlign:"middle"}}>
    {[0,1,2].map(i=>(
      <span key={i} style={{width:5,height:5,borderRadius:"50%",background:"#00ff88",display:"inline-block",animation:`dp 1.2s ease-in-out ${i*.2}s infinite`}}/>
    ))}
  </span>
);

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function BorsaRadar() {
  const [haberler,  setHaberler]  = useState([]);
  const [yukl,      setYukl]      = useState(false);
  const [hata,      setHata]      = useState("");
  const [secilen,   setSecilen]   = useState(null);
  const [analiz,    setAnaliz]    = useState("");
  const [analizYuk, setAnalizYuk] = useState(false);
  const [manuel,    setManuel]    = useState("");
  const [tab,       setTab]       = useState("akis");
  const [goster,    setGoster]    = useState(false);
  const [cd,        setCd]        = useState(300);
  const [sonGun,    setSonGun]    = useState(null);
  const cdRef = useRef(null);

  // ── RSS yükleme ──
  const rssYukle = useCallback(async () => {
    setYukl(true); setHata(""); setCd(300);
    const arr = [];
    await Promise.allSettled(RSS_SOURCES.map(async ({url, kaynak}) => {
      try {
        const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const r = await fetch(proxy, { signal: AbortSignal.timeout(9000) });
        const j = await r.json();
        const doc = new DOMParser().parseFromString(j.contents||"", "text/xml");
        Array.from(doc.querySelectorAll("item")).slice(0,8).forEach((item,i) => {
          const baslik = item.querySelector("title")?.textContent?.trim()||"";
          const ozet   = item.querySelector("description")?.textContent?.replace(/<[^>]+>/g,"").trim().slice(0,200)||"";
          const tarih  = item.querySelector("pubDate")?.textContent||"";
          if (baslik) arr.push({
            id: `${kaynak}-${i}`, baslik, ozet, kaynak, tarih,
            zaman: zamanFmt(tarih),
            kategori: kategoriBul(baslik+" "+ozet),
            etki: etkiBul(baslik+" "+ozet),
            yon: yonBul(baslik+" "+ozet),
          });
        });
      } catch {}
    }));
    arr.sort((a,b)=>{ try{return new Date(b.tarih)-new Date(a.tarih);}catch{return 0;} });
    if (arr.length > 0) { setHaberler(arr.slice(0,50)); setSonGun(new Date().toLocaleTimeString("tr-TR")); setHata(""); }
    else setHata("RSS kaynakları yanıt vermedi. Ağ bağlantısını kontrol edin veya tekrar deneyin.");
    setYukl(false);
  }, []);

  // ── Claude analiz ──
  const analizEt = useCallback(async (metin) => {
    if (!metin || analizYuk) return;
    setAnalizYuk(true); setAnaliz(""); setGoster(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1500, system:SYSTEM, messages:[{role:"user",content:`Analiz et:\n\n"${metin}"`}] }),
      });
      const data = await res.json();
      const txt = data.content?.map(b=>b.text||"").join("")||"Analiz alınamadı.";
      let i=0;
      const iv = setInterval(()=>{ i+=16; setAnaliz(txt.slice(0,i)); if(i>=txt.length){setAnaliz(txt);clearInterval(iv);} },8);
    } catch { setAnaliz("❌ Sunucu bağlantı hatası."); }
    finally { setAnalizYuk(false); }
  }, [analizYuk]);

  // ── Init ──
  useEffect(()=>{
    rssYukle();
    const refresh = setInterval(rssYukle, 5*60*1000);
    cdRef.current = setInterval(()=>setCd(c=>c>0?c-1:300),1000);
    return ()=>{ clearInterval(refresh); clearInterval(cdRef.current); };
  },[]);

  const fmtCD = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return (
    <>
      <Head>
        <title>BorsaRadar — 7/24 Finansal Analiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="description" content="Gerçek zamanlı haber akışı ile otomatik borsa analizi"/>
      </Head>

      <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#04080f",color:"#b8ccd8",fontFamily:"'Courier New',monospace",overflow:"hidden"}}>
        <style>{`
          @keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}
          @keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
          @keyframes scan{0%{top:-2px}100%{top:100vh}}
          .hi{transition:all .12s;cursor:pointer}
          .hi:hover{background:#0a1820!important;border-color:#00ff8855!important}
          .hi.sel{background:#071a0f!important;border-color:#00ff88!important}
          ::-webkit-scrollbar{width:3px}
          ::-webkit-scrollbar-track{background:#04080f}
          ::-webkit-scrollbar-thumb{background:#00ff8833;border-radius:2px}
          textarea:focus{outline:none}
          .tb{background:none;border:none;font-family:'Courier New',monospace;cursor:pointer;letter-spacing:.1em;font-size:11px;padding:9px 14px;transition:all .15s;text-transform:uppercase;color:#2a5a3a;border-bottom:2px solid transparent}
          .tb.on{color:#00ff88;border-bottom:2px solid #00ff88}
          .qt{background:#080e16;border:1px solid #0a2030;color:#3a6a8a;padding:4px 9px;border-radius:2px;font-size:10px;cursor:pointer;font-family:inherit;transition:all .15s}
          .qt:hover{border-color:#00ff8855;color:#00ff88}
          .h2{color:#00e5ff;font-size:.9rem;font-weight:700;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #0a2a1a}
          .h3{color:#00ff88;font-size:.85rem;margin:12px 0 6px;border-left:2px solid #00ff88;padding-left:8px}
          .li{display:flex;gap:8px;margin:5px 0;line-height:1.5}
          .li span:first-child{color:#00ff88;flex-shrink:0}
        `}</style>

        {/* Scanline */}
        <div style={{position:"fixed",left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#00ff8815,transparent)",animation:"scan 12s linear infinite",pointerEvents:"none",zIndex:999}}/>

        {/* HEADER */}
        <div style={{padding:"9px 16px",borderBottom:"1px solid #0a1a14",background:"#030709",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:"1.2rem",fontWeight:900,letterSpacing:".15em",color:"#fff",textShadow:"0 0 20px #00ff8855"}}>
              BORSA<span style={{color:"#00ff88"}}>RADAR</span>
            </span>
            <span style={{fontSize:9,color:"#1a5a3a",letterSpacing:".2em",borderLeft:"1px solid #0a2a1a",paddingLeft:10}}>7/24 CANLI</span>
            {sonGun && <span style={{fontSize:9,color:"#1a4a2a"}}>· {sonGun}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:10,color:"#1a4a2a"}}>↻ {fmtCD(cd)}</span>
            <button onClick={rssYukle} disabled={yukl} style={{background:"#0a1f14",border:"1px solid #00ff8835",color:"#00ff88",padding:"5px 12px",borderRadius:3,fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:".08em"}}>
              {yukl ? <Dots/> : "↻ YENİLE"}
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

          {/* LEFT — Haber paneli */}
          <div style={{width:310,flexShrink:0,borderRight:"1px solid #0a1a14",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Sub-tabs */}
            <div style={{display:"flex",borderBottom:"1px solid #0a1a14",background:"#030709",flexShrink:0}}>
              <button className={`tb${tab==="akis"?" on":""}`} onClick={()=>setTab("akis")}>◉ Akış</button>
              <button className={`tb${tab==="manuel"?" on":""}`} onClick={()=>setTab("manuel")}>✎ Manuel</button>
              {haberler.length>0 && <span style={{fontSize:9,color:"#1a4a2a",marginLeft:"auto",alignSelf:"center",paddingRight:10}}>{haberler.length} haber</span>}
            </div>

            {/* Haber listesi */}
            {tab==="akis" ? (
              <div style={{flex:1,overflowY:"auto",padding:5}}>
                {yukl && haberler.length===0 && (
                  <div style={{padding:30,textAlign:"center",color:"#1a5a3a"}}>
                    <div style={{marginBottom:10}}><Dots/></div>
                    <div style={{fontSize:11,marginBottom:4}}>Haberler yükleniyor...</div>
                    <div style={{fontSize:9,color:"#1a3a2a"}}>BBC · Reuters · CNBC · Yahoo · WSJ</div>
                  </div>
                )}
                {hata && (
                  <div style={{padding:14,color:"#ff6644",fontSize:11,textAlign:"center",lineHeight:1.6}}>
                    {hata}
                    <br/>
                    <button onClick={rssYukle} style={{marginTop:8,background:"#1a0a0a",border:"1px solid #ff4444",color:"#ff4444",padding:"3px 10px",borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:10}}>Tekrar Dene</button>
                  </div>
                )}
                {haberler.map((h,i)=>(
                  <div key={h.id} className={`hi${secilen?.id===h.id?" sel":""}`}
                    onClick={()=>{ setSecilen(h); setTab("akis"); analizEt(h.baslik+(h.ozet?" — "+h.ozet:"")); }}
                    style={{background:"#060c12",border:"1px solid #0a1820",borderRadius:3,padding:"8px 9px",marginBottom:4,animation:`fi .2s ease ${Math.min(i*.025,.5)}s both`}}
                  >
                    <div style={{display:"flex",gap:4,marginBottom:4,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:8,padding:"1px 5px",borderRadius:2,background:KRENK[h.kategori]+"22",color:KRENK[h.kategori]||"#888",border:`1px solid ${KRENK[h.kategori]||"#444"}33`,letterSpacing:".03em",flexShrink:0}}>{h.kategori}</span>
                      <span style={{fontSize:8,padding:"1px 4px",borderRadius:2,background:ERENK[h.etki]+"22",color:ERENK[h.etki]||"#888",border:`1px solid ${ERENK[h.etki]||"#444"}33`,flexShrink:0}}>{h.etki}</span>
                      <span style={{fontSize:10,marginLeft:"auto",color:h.yon==="POZİTİF"?"#00ff88":h.yon==="NEGATİF"?"#ff4444":"#ffa500",flexShrink:0}}>{h.yon==="POZİTİF"?"▲":h.yon==="NEGATİF"?"▼":"◆"}</span>
                    </div>
                    <div style={{fontSize:11,color:secilen?.id===h.id?"#d0eed0":"#8ab0a0",lineHeight:1.4,marginBottom:3}}>{h.baslik}</div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a5a3a"}}>
                      <span>{h.kaynak}</span><span>{h.zaman}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Manuel giriş */
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:10,gap:8,overflow:"auto"}}>
                <div style={{fontSize:10,color:"#2a5a3a",letterSpacing:".12em"}}>▸ KENDİ HABERİNİ GİR</div>
                <textarea value={manuel} onChange={e=>setManuel(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey&&manuel.trim()){setSecilen(null);analizEt(manuel);} }}
                  placeholder={"Haber veya gelişme yaz...\n\nÖrn: Hürmüz Boğazı kapandı\nÖrn: Fed 50 baz puan artırdı\nÖrn: NVIDIA yeni GPU tanıttı"}
                  style={{flex:1,minHeight:120,background:"#060c12",border:"1px solid #0a2a1a",color:"#c8d8c8",borderRadius:3,padding:10,fontSize:12,resize:"none",fontFamily:"inherit",lineHeight:1.6}}
                />
                <button onClick={()=>{ if(manuel.trim()){setSecilen(null);analizEt(manuel);} }} disabled={!manuel.trim()||analizYuk}
                  style={{background:"#0a2a1a",border:"1px solid #00ff88",color:"#00ff88",padding:"8px",borderRadius:3,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:".12em",fontWeight:700,opacity:(!manuel.trim()||analizYuk)?0.5:1}}>
                  ◈ ANALİZ ET
                </button>
                <div style={{fontSize:9,color:"#1a3a2a",marginTop:4}}>Hızlı örnekler:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","İran-İsrail savaşı","Altın rekor","Petrol 120$","BTC 100k","Deprem İstanbul","Çin-Tayvan","Türkiye seçim","Rusya doğalgaz kesti"].map(t=>(
                    <button key={t} className="qt" onClick={()=>{ setManuel(t); setSecilen(null); analizEt(t); }}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Analiz paneli */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
            {/* Başlık çubuğu */}
            <div style={{padding:"7px 14px",borderBottom:"1px solid #0a1a14",background:"#030709",flexShrink:0,display:"flex",alignItems:"center",gap:8,minHeight:34}}>
              {secilen ? (
                <>
                  <span style={{fontSize:8,padding:"2px 5px",borderRadius:2,background:KRENK[secilen.kategori]+"22",color:KRENK[secilen.kategori],border:`1px solid ${KRENK[secilen.kategori]}44`,flexShrink:0}}>{secilen.kategori}</span>
                  <span style={{fontSize:11,color:"#6a9a8a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{secilen.baslik}</span>
                </>
              ) : (
                <span style={{fontSize:10,color:"#1a3a2a",letterSpacing:".12em"}}>◈ ANALİZ PANELİ</span>
              )}
              {analizYuk && <span style={{marginLeft:"auto",flexShrink:0}}><Dots/></span>}
            </div>

            {/* İçerik */}
            <div style={{flex:1,overflowY:"auto",padding:18}}>
              {!goster && !analizYuk && (
                <div style={{height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#1a3a2a",textAlign:"center",gap:10}}>
                  <div style={{fontSize:48,opacity:.1}}>◈</div>
                  <div style={{fontSize:14}}>Sol panelden bir haber seç</div>
                  <div style={{fontSize:11,color:"#152a1a"}}>veya Manuel sekmesinden kendi haberini yaz</div>
                  <div style={{fontSize:10,color:"#0f2010",marginTop:8}}>Haberler her 5 dakikada otomatik yenilenir</div>
                </div>
              )}
              {analizYuk && !analiz && (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12,color:"#2a6a4a"}}>
                  <Dots/>
                  <div style={{fontSize:12,letterSpacing:".12em"}}>ANALİZ EDİLİYOR...</div>
                  <div style={{fontSize:10,color:"#1a4a2a"}}>Piyasa verileri değerlendiriliyor</div>
                </div>
              )}
              {analiz && (
                <div style={{animation:"fi .3s ease"}}>
                  <div style={{fontSize:13,lineHeight:1.9,color:"#9ab8a8"}} dangerouslySetInnerHTML={{__html:md(analiz)}}/>
                  {analizYuk && <Dots/>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{padding:"5px 14px",borderTop:"1px solid #0a1a14",background:"#030709",display:"flex",justifyContent:"space-between",fontSize:9,color:"#1a3a2a",flexShrink:0,flexWrap:"wrap",gap:4}}>
          <span>Kaynaklar: BBC · Reuters · CNBC · Yahoo Finance · WSJ · Investing.com</span>
          <span>⚠ Bu uygulama yatırım tavsiyesi vermez</span>
        </div>
      </div>
    </>
  );
}

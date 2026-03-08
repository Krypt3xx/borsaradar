import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";


const KRENK = {
  "JEOPOLİTİK":"#ff6b6b","ENERJİ":"#ffa500","MERKEZ BANKASI":"#00e5ff",
  "TEKNOLOJİ":"#a78bfa","TÜRKİYE":"#ff4444","EMTİA":"#ffd700",
  "KRİPTO":"#f59e0b","GENEL":"#4a8a8a",
};
const ERENK = { "YÜKSEK":"#ff4444","ORTA":"#ffa500","DÜŞÜK":"#4a8a4a" };

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

const Dots = () => (
  <span style={{display:"inline-flex",gap:3,alignItems:"center",verticalAlign:"middle"}}>
    {[0,1,2].map(i=>(
      <span key={i} style={{width:5,height:5,borderRadius:"50%",background:"#00ff88",
        display:"inline-block",animation:`dp 1.2s ease-in-out ${i*.2}s infinite`}}/>
    ))}
  </span>
);

export default function BorsaRadar() {
  const [haberler,    setHaberler]    = useState([]);
  const [yukl,        setYukl]        = useState(false);
  const [hata,        setHata]        = useState("");
  const [kaynakBilgi, setKaynakBilgi] = useState(null);
  const [secilen,     setSecilen]     = useState(null);
  const [analiz,      setAnaliz]      = useState("");
  const [analizYuk,   setAnalizYuk]   = useState(false);
  const [manuel,      setManuel]      = useState("");
  const [tab,         setTab]         = useState("akis");
  const [goster,      setGoster]      = useState(false);
  const [cd,          setCd]          = useState(300);
  const [sonGun,      setSonGun]      = useState(null);
  const cdRef = useRef(null);

  const haberleriYukle = useCallback(async () => {
    setYukl(true); setHata(""); setCd(300);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error(`Sunucu hatası: ${res.status}`);
      const data = await res.json();
      if (data.haberler?.length > 0) {
        setHaberler(data.haberler);
        setSonGun(new Date().toLocaleTimeString("tr-TR"));
        setKaynakBilgi(`${data.kaynak_sayisi}/${data.toplam_kaynak} kaynak`);
        setHata("");
      } else {
        setHata("Hiç haber çekilemedi. Kaynaklar geçici olarak erişilemez olabilir.");
      }
    } catch (e) {
      setHata(`Yükleme hatası: ${e.message}`);
    } finally {
      setYukl(false);
    }
  }, []);

  const analizEt = useCallback(async (metin) => {
    if (!metin || analizYuk) return;
    setAnalizYuk(true); setAnaliz(""); setGoster(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ metin }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const txt = data.text || "Analiz alınamadı.";
      let i = 0;
      const iv = setInterval(() => {
        i += 18; setAnaliz(txt.slice(0,i));
        if (i >= txt.length) { setAnaliz(txt); clearInterval(iv); }
      }, 8);
    } catch (e) {
      setAnaliz(`❌ Hata: ${e.message}`);
    } finally {
      setAnalizYuk(false);
    }
  }, [analizYuk]);

  useEffect(() => {
    haberleriYukle();
    const refresh = setInterval(haberleriYukle, 5 * 60 * 1000);
    cdRef.current = setInterval(() => setCd(c => c > 0 ? c - 1 : 300), 1000);
    return () => { clearInterval(refresh); clearInterval(cdRef.current); };
  }, []);

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
          @keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
          @keyframes scan{0%{top:-2px}100%{top:100vh}}
          .hi{transition:all .12s;cursor:pointer}
          .hi:hover{background:#0a1820!important;border-color:#00ff8855!important}
          .hi.sel{background:#071a0f!important;border-color:#00ff88!important}
          ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#04080f}
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

        <div style={{position:"fixed",left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#00ff8815,transparent)",animation:"scan 12s linear infinite",pointerEvents:"none",zIndex:999}}/>

        {/* HEADER */}
        <div style={{padding:"9px 16px",borderBottom:"1px solid #0a1a14",background:"#030709",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:"1.2rem",fontWeight:900,letterSpacing:".15em",color:"#fff",textShadow:"0 0 20px #00ff8855"}}>
              BORSA<span style={{color:"#00ff88"}}>RADAR</span>
            </span>
            <span style={{fontSize:9,color:"#1a5a3a",letterSpacing:".2em",borderLeft:"1px solid #0a2a1a",paddingLeft:10}}>7/24 CANLI</span>
            {sonGun && <span style={{fontSize:9,color:"#1a4a2a"}}>· {sonGun}</span>}
            {kaynakBilgi && <span style={{fontSize:9,color:"#1a3a2a"}}>· {kaynakBilgi}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:10,color:"#1a4a2a"}}>↻ {fmtCD(cd)}</span>
            <button onClick={haberleriYukle} disabled={yukl}
              style={{background:"#0a1f14",border:"1px solid #00ff8835",color:"#00ff88",padding:"5px 12px",borderRadius:3,fontSize:10,cursor:"pointer",fontFamily:"inherit",letterSpacing:".08em"}}>
              {yukl ? <Dots/> : "↻ YENİLE"}
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

          {/* LEFT */}
          <div style={{width:310,flexShrink:0,borderRight:"1px solid #0a1a14",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:"1px solid #0a1a14",background:"#030709",flexShrink:0}}>
              <button className={`tb${tab==="akis"?" on":""}`} onClick={()=>setTab("akis")}>◉ Akış</button>
              <button className={`tb${tab==="manuel"?" on":""}`} onClick={()=>setTab("manuel")}>✎ Manuel</button>
              {haberler.length>0 && <span style={{fontSize:9,color:"#1a4a2a",marginLeft:"auto",alignSelf:"center",paddingRight:10}}>{haberler.length} haber</span>}
            </div>

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
                    ⚠ {hata}
                    <br/>
                    <button onClick={haberleriYukle} style={{marginTop:8,background:"#1a0a0a",border:"1px solid #ff4444",color:"#ff4444",padding:"3px 10px",borderRadius:3,cursor:"pointer",fontFamily:"inherit",fontSize:10}}>
                      Tekrar Dene
                    </button>
                  </div>
                )}
                {haberler.map((h,i)=>(
                  <div key={h.id} className={`hi${secilen?.id===h.id?" sel":""}`}
                    onClick={()=>{ setSecilen(h); analizEt(h.baslik+(h.ozet?" — "+h.ozet:"")); }}
                    style={{background:"#060c12",border:"1px solid #0a1820",borderRadius:3,padding:"8px 9px",marginBottom:4,animation:`fi .2s ease ${Math.min(i*.025,.5)}s both`}}
                  >
                    <div style={{display:"flex",gap:4,marginBottom:4,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:8,padding:"1px 5px",borderRadius:2,background:KRENK[h.kategori]+"22",color:KRENK[h.kategori]||"#888",border:`1px solid ${KRENK[h.kategori]||"#444"}33`,letterSpacing:".03em",flexShrink:0}}>{h.kategori}</span>
                      <span style={{fontSize:8,padding:"1px 4px",borderRadius:2,background:ERENK[h.etki]+"22",color:ERENK[h.etki]||"#888",border:`1px solid ${ERENK[h.etki]||"#444"}33`,flexShrink:0}}>{h.etki}</span>
                      <span style={{fontSize:10,marginLeft:"auto",flexShrink:0,color:h.yon==="POZİTİF"?"#00ff88":h.yon==="NEGATİF"?"#ff4444":"#ffa500"}}>{h.yon==="POZİTİF"?"▲":h.yon==="NEGATİF"?"▼":"◆"}</span>
                    </div>
                    <div style={{fontSize:11,lineHeight:1.4,marginBottom:3,color:secilen?.id===h.id?"#d0eed0":"#8ab0a0"}}>{h.baslik}</div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a5a3a"}}>
                      <span>{h.kaynak}</span><span>{h.zaman}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:10,gap:8,overflow:"auto"}}>
                <div style={{fontSize:10,color:"#2a5a3a",letterSpacing:".12em"}}>▸ KENDİ HABERİNİ GİR</div>
                <textarea value={manuel} onChange={e=>setManuel(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey&&manuel.trim()){setSecilen(null);analizEt(manuel);} }}
                  placeholder={"Haber yaz...\n\nÖrn: Hürmüz Boğazı kapandı\nÖrn: Fed 50 baz puan artırdı"}
                  style={{flex:1,minHeight:120,background:"#060c12",border:"1px solid #0a2a1a",color:"#c8d8c8",borderRadius:3,padding:10,fontSize:12,resize:"none",fontFamily:"inherit",lineHeight:1.6}}
                />
                <button onClick={()=>{ if(manuel.trim()){setSecilen(null);analizEt(manuel);}}} disabled={!manuel.trim()||analizYuk}
                  style={{background:"#0a2a1a",border:"1px solid #00ff88",color:"#00ff88",padding:"8px",borderRadius:3,fontSize:11,cursor:"pointer",fontFamily:"inherit",letterSpacing:".12em",fontWeight:700,opacity:(!manuel.trim()||analizYuk)?0.5:1}}>
                  ◈ ANALİZ ET
                </button>
                <div style={{fontSize:9,color:"#1a3a2a",marginTop:2}}>Hızlı örnekler:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","İran-İsrail savaşı","Altın rekor","Petrol 120$","BTC 100k","Deprem İstanbul","Rusya doğalgaz kesti","Çin-Tayvan","Türkiye seçim"].map(t=>(
                    <button key={t} className="qt" onClick={()=>{ setManuel(t);setSecilen(null);analizEt(t); }}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
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
          <span>Kaynaklar: BBC · Reuters · CNBC · Yahoo Finance · WSJ · Bloomberg</span>
          <span>⚠ Yatırım tavsiyesi değildir</span>
        </div>
      </div>
    </>
  );
}

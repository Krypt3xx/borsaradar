import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const KATEGORI_MAP = {
  "JEOPOLİTİK":    ["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","tension","attack","turkey","syria","savaş","gerilim","tehdit","çatışma","kriz"],
  "ENERJİ":        ["oil","crude","gas","opec","energy","brent","wti","petrol","doğalgaz","barrel","lng","enerji","yakıt"],
  "MERKEZ BANKASI":["fed","federal reserve","rate","interest","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb","merkez bankası","ppk","politika faizi"],
  "TEKNOLOJİ":     ["nvidia","apple","google","microsoft","amazon","meta","ai","chip","semiconductor","openai","tsmc","tesla","yapay zeka","teknoloji"],
  "TÜRKİYE":       ["turkey","turkish","lira","istanbul","ankara","bist","borsa","erdoğan","türkiye","hazine","bütçe","tüfe","dolar","kur"],
  "SİYASET":       ["seçim","muhalefet","iktidar","parti","meclis","milletvekili","bakanlık","cumhurbaşkanı","hükümet","anayasa","yasa","kanun"],
  "EMTİA":         ["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","platinum","emtia"],
  "KRİPTO":        ["bitcoin","crypto","ethereum","blockchain","btc","eth","kripto","coinbase"],
  "PİYASA":        ["borsa","hisse","endeks","bist","rally","düşüş","yükseliş","kapanış","işlem hacmi","piyasa"],
};
const kategoriBul = t => { const s=t.toLowerCase(); for(const[k,ws]of Object.entries(KATEGORI_MAP))if(ws.some(w=>s.includes(w)))return k; return"GENEL"; };
const etkiBul = t => { const s=t.toLowerCase(); if(["war","attack","crash","crisis","surge","plunge","record","collapse","çöküş","rekor","kriz","savaş","alarm","kritik"].some(w=>s.includes(w)))return"YÜKSEK"; if(["rise","fall","gain","loss","cut","hike","deal","meeting","report","yükseldi","düştü","arttı","karar","açıkladı"].some(w=>s.includes(w)))return"ORTA"; return"DÜŞÜK"; };
const yonBul = t => { const s=t.toLowerCase(); const p=["rise","gain","surge","jump","rally","yüksel","arttı","rekor","büyüme"].filter(w=>s.includes(w)).length; const n=["fall","drop","crash","plunge","decline","düş","geriledi","kayıp","kriz","daralma"].filter(w=>s.includes(w)).length; return p>n?"POZİTİF":n>p?"NEGATİF":"KARISIK"; };
const zamanFmt = d => { try{ const m=(Date.now()-new Date(d).getTime())/60000; if(m<60)return`${Math.floor(m)} dk`; if(m<1440)return`${Math.floor(m/60)} sa`; return`${Math.floor(m/1440)} gün`; }catch{return"?";} };

const fmtFiyat = (f, sembol) => {
  if (!f) return "—";
  if (sembol==="BTC-USD") return `$${Math.round(f).toLocaleString("tr-TR")}`;
  if (["^GSPC","^IXIC"].includes(sembol)) return f.toLocaleString("tr-TR",{maximumFractionDigits:0});
  if (["USDTRY=X","EURTRY=X","GBPTRY=X"].includes(sembol)) return `₺${f.toFixed(2)}`;
  if (sembol==="GC=F") return `$${Math.round(f).toLocaleString()}`;
  if (sembol==="BZ=F") return `$${f.toFixed(1)}`;
  if (sembol==="XU100.IS") return f.toLocaleString("tr-TR",{maximumFractionDigits:0});
  return f.toFixed(2);
};

// Renk tanımları
const KRENK = {
  "JEOPOLİTİK": { bg:"#2a1010", border:"#5a2a2a", text:"#f0a0a0" },
  "ENERJİ":     { bg:"#261800", border:"#5a3a00", text:"#ffb74d" },
  "MERKEZ BANKASI":{ bg:"#001828", border:"#003a66", text:"#80c8f0" },
  "TEKNOLOJİ":  { bg:"#160e2a", border:"#3e2870", text:"#c0a8f0" },
  "TÜRKİYE":    { bg:"#280808", border:"#660000", text:"#ff8a80" },
  "SİYASET":    { bg:"#1a1428", border:"#3a2a5a", text:"#b0a0d8" },
  "EMTİA":      { bg:"#221c00", border:"#554800", text:"#ffd54f" },
  "KRİPTO":     { bg:"#1c1400", border:"#4a3800", text:"#ffcc02" },
  "PİYASA":     { bg:"#0c1e18", border:"#1a4a38", text:"#6dcca8" },
  "GENEL":      { bg:"#121a22", border:"#263444", text:"#8aacbe" },
};
const ERENK = {
  "YÜKSEK": { bg:"#280808", text:"#ff7070", border:"#601818" },
  "ORTA":   { bg:"#261800", text:"#ff9944", border:"#5a3c00" },
  "DÜŞÜK":  { bg:"#081a08", text:"#5aaa5a", border:"#164016" },
};

// AI renk teması
const AI_TEMA = {
  claude: { isim:"Claude Haiku",  renk:"#c07ae0", bg:"#180e26", border:"#3a1e60", logo:"✦", alt:"Anthropic" },
  gpt:    { isim:"GPT-4o Mini",   renk:"#10a37f", bg:"#061a14", border:"#0e3a2a", logo:"⬡", alt:"OpenAI" },
  gemini: { isim:"Llama 3.3 70B", renk:"#4a8af0", bg:"#0a1428", border:"#1a3466", logo:"🦙", alt:"Groq · Ücretsiz" },
};

function md(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g,"<strong style='color:#f0f4f0;font-weight:600'>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em style='color:#b8d0c0'>$1</em>")
    .replace(/^## (.+)$/gm,'<div class="mh2">$1</div>')
    .replace(/^### (.+)$/gm,'<div class="mh3">$1</div>')
    .replace(/^- (.+)$/gm,'<div class="mli"><span class="mbull">▸</span><span>$1</span></div>')
    .replace(/\n\n/g,'<div style="height:10px"></div>')
    .replace(/\n/g,"<br/>");
}

const Dots = ({color="#4a9a6a",size=6}) => (
  <span style={{display:"inline-flex",gap:4,alignItems:"center",verticalAlign:"middle"}}>
    {[0,1,2].map(i=><span key={i} style={{width:size,height:size,borderRadius:"50%",background:color,display:"inline-block",animation:`dp 1.3s ease-in-out ${i*.22}s infinite`}}/>)}
  </span>
);

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function BorsaRadar() {
  const [haberler,     setHaberler]     = useState([]);
  const [haberYukl,    setHaberYukl]    = useState(false);
  const [haberHata,    setHaberHata]    = useState("");
  const [haberFiltre,  setHaberFiltre]  = useState("TÜMÜ"); // TÜMÜ | TR | EN
  const [fiyatlar,     setFiyatlar]     = useState([]);
  const [takvim,       setTakvim]       = useState([]);
  const [secilen,      setSecilen]      = useState(null);

  // 3-AI analiz sonuçları
  const [analizler,    setAnalizler]    = useState({ claude:null, gpt:null, gemini:null });
  const [analizYukl,   setAnalizYukl]   = useState({ claude:false, gpt:false, gemini:false });
  const [analizBaslik, setAnalizBaslik] = useState("");
  const [aktifAI,      setAktifAI]      = useState("claude"); // hangi AI sekmesi açık

  const [gecmis,       setGecmis]       = useState([]);
  const [portfoy,      setPortfoy]      = useState([]);
  const [yeniHisse,    setYeniHisse]    = useState({sembol:"",adet:"",maliyet:""});
  const [solTab,       setSolTab]       = useState("akis");
  const [sagTab,       setSagTab]       = useState("analiz");
  const [manuel,       setManuel]       = useState("");
  const [goster,       setGoster]       = useState(false);
  const [cd,           setCd]           = useState(300);
  const [sonGun,       setSonGun]       = useState(null);
  const cdRef = useRef(null);

  // Korelasyon hafızası
  const [korelasyon,   setKorelasyon]   = useState({});
  // Sabah bülteni
  const [bulten,       setBulten]       = useState({llama:null,gpt:null,claude:null});
  const [bultenYukl,   setBultenYukl]   = useState(false);
  const [bultenAktif,  setBultenAktif]  = useState("llama");
  // Teknik analiz
  const [teknikSembol, setTeknikSembol] = useState("");
  const [teknikVeri,   setTeknikVeri]   = useState(null);
  const [teknikYukl,   setTeknikYukl]   = useState(false);
  const [teknikHata,   setTeknikHata]   = useState("");

  const fiyatYukle = useCallback(async () => {
    try {
      const r = await fetch("/api/prices");
      const d = await r.json();
      if (d.fiyatlar?.length) setFiyatlar(d.fiyatlar);
    } catch {}
  }, []);

  const haberleriYukle = useCallback(async () => {
    setHaberYukl(true); setHaberHata(""); setCd(300);
    try {
      const r = await fetch("/api/news");
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await r.json();
      if (d.haberler?.length > 0) {
        setHaberler(d.haberler);
        setSonGun(new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}));
      } else setHaberHata("Haber alınamadı.");
    } catch(e) { setHaberHata(`Bağlantı hatası: ${e.message}`); }
    setHaberYukl(false);
  }, []);

  const takvimYukle = useCallback(async () => {
    try { const r=await fetch("/api/calendar"); const d=await r.json(); if(d.olaylar)setTakvim(d.olaylar); } catch {}
  }, []);

  // 3 AI'ı paralel çalıştır, sonuçları ayrı ayrı stream et
  const analizEt = useCallback(async (metin, baslik) => {
    if (!metin || Object.values(analizYukl).some(v=>v)) return;
    setGoster(true); setSagTab("analiz");
    setAnalizBaslik(baslik || metin.slice(0,80));
    setAnalizler({ claude:null, gpt:null, gemini:null });
    setAnalizYukl({ claude:true, gpt:true, gemini:true });
    setAktifAI("claude");

    try {
      const r = await fetch("/api/analyze-multi", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ metin }),
      });
      const d = await r.json();

      // Sonuçları göster
      setAnalizler({
        claude: d.claude?.text || (d.claude?.error ? `❌ ${d.claude.error}` : null),
        gpt:    d.gpt?.text    || (d.gpt?.error    ? `❌ ${d.gpt.error}`    : null),
        gemini: d.gemini?.text || (d.gemini?.error ? `❌ ${d.gemini.error}` : null),
      });

      // Geçmişe ekle
      const kayit = {
        id: Date.now(),
        baslik: baslik || metin.slice(0,70),
        analizler: {
          claude: d.claude?.text,
          gpt:    d.gpt?.text,
          gemini: d.gemini?.text,
        },
        zaman: new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),
        tarih: new Date().toLocaleDateString("tr-TR"),
      };
      setGecmis(prev => [kayit, ...prev.slice(0,19)]);
      // Korelasyon güncelle
      const kategori = secilen?.kategori || kategoriBul(metin);
      const tumAnaliz = [d.claude?.text, d.gpt?.text, d.gemini?.text].filter(Boolean).join(" ");
      korelasyonGuncelle(kategori, tumAnaliz);
    } catch(e) {
      setAnalizler({ claude:`❌ ${e.message}`, gpt:`❌ ${e.message}`, gemini:`❌ ${e.message}` });
    }
    setAnalizYukl({ claude:false, gpt:false, gemini:false });
  }, [analizYukl]);

  // Korelasyon: analiz sonucundan hisse sembollerini çıkar ve kaydet
  const korelasyonGuncelle = useCallback((kategori, analizMetni) => {
    if (!kategori || !analizMetni) return;
    const bistSemboller = ["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM"];
    const bulunan = bistSemboller.filter(s => analizMetni.includes(s));
    if (!bulunan.length) return;
    const yon = analizMetni.includes("📈 AL") ? 1 : analizMetni.includes("📉 SAT") ? -1 : 0;
    setKorelasyon(prev => {
      const yeni = { ...prev };
      bulunan.forEach(s => {
        if (!yeni[kategori]) yeni[kategori] = {};
        if (!yeni[kategori][s]) yeni[kategori][s] = { al:0, sat:0, toplam:0 };
        yeni[kategori][s].toplam++;
        if (yon === 1) yeni[kategori][s].al++;
        if (yon === -1) yeni[kategori][s].sat++;
      });
      return yeni;
    });
  }, []);

  // Sabah bülteni üret
  const bultenUret = useCallback(async () => {
    if (!haberler.length || bultenYukl) return;
    setBultenYukl(true);
    setBulten({llama:null,gpt:null,claude:null});
    setSagTab("bulten");
    try {
      const r = await fetch("/api/bulten", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ haberler }),
      });
      const d = await r.json();
      setBulten({
        llama:  d.llama?.text  || (d.llama?.error  ? `❌ ${d.llama.error}`  : null),
        gpt:    d.gpt?.text    || (d.gpt?.error    ? `❌ ${d.gpt.error}`    : null),
        claude: d.claude?.text || (d.claude?.error ? `❌ ${d.claude.error}` : null),
      });
    } catch(e) { setBulten({llama:`❌ ${e.message}`,gpt:null,claude:null}); }
    setBultenYukl(false);
  }, [haberler, bultenYukl]);

  // Teknik analiz
  const teknikAnalizEt = useCallback(async (sembol) => {
    if (!sembol || teknikYukl) return;
    setTeknikYukl(true); setTeknikVeri(null); setTeknikHata("");
    try {
      const r = await fetch(`/api/teknik?sembol=${encodeURIComponent(sembol)}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setTeknikVeri(d);
    } catch(e) { setTeknikHata(e.message); }
    setTeknikYukl(false);
  }, [teknikYukl]);

  useEffect(() => {
    haberleriYukle(); fiyatYukle(); takvimYukle();
    const r1 = setInterval(haberleriYukle, 5*60*1000);
    const r2 = setInterval(fiyatYukle, 60*1000);
    cdRef.current = setInterval(() => setCd(c => c>0?c-1:300), 1000);
    try { const p=localStorage.getItem("br_portfoy"); if(p) setPortfoy(JSON.parse(p)); } catch {}
    try { const g=localStorage.getItem("br_gecmis");  if(g) setGecmis(JSON.parse(g));  } catch {}
    try { const k=localStorage.getItem("br_korel");   if(k) setKorelasyon(JSON.parse(k)); } catch {}
    return () => { clearInterval(r1); clearInterval(r2); clearInterval(cdRef.current); };
  }, []);

  useEffect(() => { try{localStorage.setItem("br_portfoy", JSON.stringify(portfoy));}catch{} }, [portfoy]);
  useEffect(() => { try{localStorage.setItem("br_gecmis",  JSON.stringify(gecmis.slice(0,20)));}catch{} }, [gecmis]);
  useEffect(() => { try{localStorage.setItem("br_korel",   JSON.stringify(korelasyon));}catch{} }, [korelasyon]);

  const hisseEkle = () => {
    if (!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet) return;
    setPortfoy(prev => [...prev, { ...yeniHisse, id:Date.now(), sembol:yeniHisse.sembol.toUpperCase() }]);
    setYeniHisse({sembol:"",adet:"",maliyet:""});
  };

  const fmtCD = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const analizDevam = Object.values(analizYukl).some(v=>v);

  const filtreliHaberler = haberler.filter(h => {
    if (haberFiltre === "TR") return h.dil === "tr";
    if (haberFiltre === "EN") return h.dil === "en";
    return true;
  });

  return (
    <>
      <Head>
        <title>BorsaRadar — 7/24 Finansal Analiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      </Head>

      <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#0f1318",color:"#d4dde6",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
        <style>{`
          @keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
          @keyframes fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
          @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          *{box-sizing:border-box}
          ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f1318}
          ::-webkit-scrollbar-thumb{background:#2a3a4a;border-radius:4px}
          textarea:focus,input:focus{outline:none}
          .tab{background:none;border:none;font-family:'Inter',sans-serif;cursor:pointer;
               font-size:12px;font-weight:500;padding:9px 14px;color:#4a6a7a;
               border-bottom:2px solid transparent;transition:all .15s}
          .tab:hover{color:#7a9aaa}
          .tab.on{color:#d8eef4;border-bottom-color:#4a9a7a}
          .hcard{border-radius:6px;transition:all .12s;cursor:pointer}
          .hcard:hover{background:#1a2530!important;border-color:#3a5a6a!important}
          .hcard.sel{background:#112218!important;border-color:#4a9a6a!important}
          .badge{display:inline-flex;align-items:center;font-size:10px;font-weight:600;
                 padding:2px 7px;border-radius:4px;letter-spacing:.02em;line-height:1.4}
          .mh2{font-size:13px;font-weight:700;color:#7ab8d0;margin:18px 0 8px;
               padding-bottom:5px;border-bottom:1px solid #1e3040}
          .mh3{font-size:12px;font-weight:600;color:#68aa88;margin:12px 0 5px;
               padding-left:9px;border-left:2px solid #3a8a5a}
          .mli{display:flex;gap:9px;margin:5px 0;line-height:1.65;font-size:12.5px;color:#b0c8d4}
          .mbull{color:#3a8a5a;flex-shrink:0}
          .inp{background:#161d24;border:1px solid #243040;color:#d4dde6;
               border-radius:6px;padding:8px 10px;font-size:12px;
               font-family:'Inter',sans-serif;width:100%;transition:border-color .15s}
          .inp:focus{border-color:#3a7a5a}
          .inp::placeholder{color:#304050}
          .btn-p{background:#142a1e;border:1px solid #3a7a5a;color:#6abf90;
                 padding:9px 18px;border-radius:6px;font-size:13px;font-weight:600;
                 cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s}
          .btn-p:hover{background:#1a3626;border-color:#4a9a6a;color:#80d0a8}
          .btn-p:disabled{opacity:.3;cursor:not-allowed}
          .btn-sm{padding:4px 10px;border-radius:4px;font-size:11px;font-weight:500;
                  cursor:pointer;font-family:'Inter',sans-serif;border:1px solid;transition:all .12s}
          .qtag{background:#141c24;border:1px solid #222e3a;color:#4a6a7a;padding:5px 10px;
                border-radius:5px;font-size:11px;font-weight:500;cursor:pointer;
                font-family:'Inter',sans-serif;transition:all .15s}
          .qtag:hover{background:#1a2a34;border-color:#3a6a7a;color:#80aabb}
          .price-chip{display:inline-flex;align-items:center;gap:8px;padding:0 16px;
                      font-size:11.5px;border-right:1px solid #1a2530;white-space:nowrap}
          .filtre-btn{background:none;border:1px solid #1e2e3a;border-radius:4px;
                      color:#3a5a6a;padding:3px 10px;font-size:10px;font-weight:600;
                      cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s}
          .filtre-btn.on{background:#0e2030;border-color:#3a6a8a;color:#70a8c8}
          .ai-tab{background:none;border:none;cursor:pointer;padding:9px 16px;
                  font-family:'Inter',sans-serif;font-size:12px;font-weight:600;
                  border-bottom:2px solid transparent;transition:all .15s}
        `}</style>

        {/* HEADER */}
        <div style={{height:46,padding:"0 18px",borderBottom:"1px solid #1a2530",background:"#0b0f14",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{display:"flex",alignItems:"baseline",gap:1}}>
              <span style={{fontSize:"1.2rem",fontWeight:800,color:"#e0eef0",letterSpacing:"-.02em"}}>Borsa</span>
              <span style={{fontSize:"1.2rem",fontWeight:800,color:"#4aaa70",letterSpacing:"-.02em"}}>Radar</span>
            </div>
            <div style={{width:1,height:16,background:"#1e2e3a"}}/>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"#3aaa60",display:"inline-block",boxShadow:"0 0 6px #3aaa6088"}}/>
              <span style={{fontSize:11,color:"#4a8a60",fontWeight:500}}>Canlı</span>
            </div>
            {sonGun && <span style={{fontSize:10,color:"#2a4a40"}}>· {sonGun}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:10,color:"#2a4050",fontFamily:"'JetBrains Mono',monospace"}}>↻ {fmtCD(cd)}</span>
            <button onClick={haberleriYukle} disabled={haberYukl} className="btn-p" style={{padding:"5px 14px",fontSize:11}}>
              {haberYukl ? <Dots size={5}/> : "↻ Yenile"}
            </button>
          </div>
        </div>

        {/* FİYAT ŞERİDİ */}
        <div style={{height:32,borderBottom:"1px solid #1a2530",background:"#0b0f14",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center"}}>
          {fiyatlar.length === 0 ? (
            <div style={{paddingLeft:18,fontSize:11,color:"#2a4050",display:"flex",alignItems:"center",gap:8}}>
              <Dots color="#2a4050" size={5}/><span>Piyasa verileri yükleniyor...</span>
            </div>
          ) : (
            <div style={{display:"flex",animation:"ticker 40s linear infinite",alignItems:"center",height:"100%"}}>
              {[...fiyatlar,...fiyatlar].map((f,i)=>(
                <span key={i} className="price-chip">
                  <span style={{color:"#4a6878",fontWeight:500}}>{f.isim}</span>
                  <span style={{color:"#c0d8e4",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{fmtFiyat(f.fiyat,f.sembol)}</span>
                  {f.degisim !== undefined && f.degisim !== 0 && (
                    <span style={{color:f.degisim>=0?"#44aa70":"#cc5555",fontSize:10,fontWeight:600,
                      background:f.degisim>=0?"#09200f":"#200909",padding:"1px 5px",borderRadius:3}}>
                      {f.degisim>=0?"+":""}{(f.degisim||0).toFixed(2)}%
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BODY */}
        <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

          {/* SOL PANEL */}
          <div style={{width:310,flexShrink:0,borderRight:"1px solid #1a2530",display:"flex",flexDirection:"column",overflow:"hidden",background:"#0b0f14"}}>
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,paddingLeft:2}}>
              <button className={`tab${solTab==="akis"?" on":""}`} onClick={()=>setSolTab("akis")}>Haberler</button>
              <button className={`tab${solTab==="manuel"?" on":""}`} onClick={()=>setSolTab("manuel")}>Manuel</button>
              <button className={`tab${solTab==="portfoy"?" on":""}`} onClick={()=>setSolTab("portfoy")}>
                Portföy{portfoy.length>0&&<span style={{background:"#0e2a1a",color:"#5aaa7a",borderRadius:3,padding:"0 5px",marginLeft:4,fontSize:10}}>{portfoy.length}</span>}
              </button>
            </div>

            {/* HABERLER */}
            {solTab==="akis" && (
              <>
                {/* Filtre */}
                <div style={{padding:"6px 10px",borderBottom:"1px solid #1a2530",display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                  {["TÜMÜ","TR","EN"].map(f=>(
                    <button key={f} className={`filtre-btn${haberFiltre===f?" on":""}`} onClick={()=>setHaberFiltre(f)}>{f}</button>
                  ))}
                  <span style={{fontSize:10,color:"#2a4050",marginLeft:"auto"}}>{filtreliHaberler.length} haber</span>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"6px 8px"}}>
                  {haberYukl && haberler.length===0 && (
                    <div style={{padding:28,textAlign:"center",color:"#2a5040"}}>
                      <div style={{marginBottom:10}}><Dots/></div>
                      <div style={{fontSize:13,fontWeight:500,color:"#4a7060",marginBottom:4}}>Haberler yükleniyor</div>
                      <div style={{fontSize:10,color:"#2a4040"}}>Bloomberg HT · Hürriyet · Reuters · CNBC...</div>
                    </div>
                  )}
                  {haberHata && (
                    <div style={{margin:8,padding:12,background:"#180808",border:"1px solid #401818",borderRadius:6,color:"#e07070",fontSize:12,lineHeight:1.5}}>
                      ⚠ {haberHata}
                      <br/><button onClick={haberleriYukle} className="btn-sm" style={{marginTop:8,borderColor:"#401818",color:"#e07070",background:"#1e0808"}}>Tekrar dene</button>
                    </div>
                  )}
                  {filtreliHaberler.map((h,i)=>{
                    const kr=KRENK[h.kategori]||KRENK["GENEL"];
                    const er=ERENK[h.etki]||ERENK["DÜŞÜK"];
                    return (
                      <div key={h.id} className={`hcard${secilen?.id===h.id?" sel":""}`}
                        onClick={()=>{ setSecilen(h); analizEt(h.baslik+(h.ozet?" — "+h.ozet:""),h.baslik); }}
                        style={{background:"#101820",border:"1px solid #1c2c38",padding:"9px 10px",marginBottom:4,
                          animation:`fadein .18s ease ${Math.min(i*.018,.4)}s both`}}
                      >
                        <div style={{display:"flex",gap:4,marginBottom:6,alignItems:"center",flexWrap:"wrap"}}>
                          <span className="badge" style={{background:kr.bg,color:kr.text,border:`1px solid ${kr.border}`}}>{h.kategori}</span>
                          <span className="badge" style={{background:er.bg,color:er.text,border:`1px solid ${er.border}`}}>{h.etki}</span>
                          {h.dil==="tr" && <span className="badge" style={{background:"#1a0808",color:"#e05050",border:"1px solid #3a1010"}}>🇹🇷 TR</span>}
                          <span style={{marginLeft:"auto",fontSize:13,fontWeight:700,
                            color:h.yon==="POZİTİF"?"#44aa70":h.yon==="NEGATİF"?"#cc5555":"#cc8830"}}>
                            {h.yon==="POZİTİF"?"▲":h.yon==="NEGATİF"?"▼":"◆"}
                          </span>
                        </div>
                        <div style={{fontSize:12,color:secilen?.id===h.id?"#c0eedd":"#90b0bc",lineHeight:1.5,marginBottom:5,fontWeight:secilen?.id===h.id?500:400}}>
                          {h.baslik}
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#304858"}}>
                          <span style={{fontWeight:500}}>{h.kaynak}</span>
                          <span>{zamanFmt(h.tarih)} önce</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* MANUEL */}
            {solTab==="manuel" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#4a8060"}}>Haber veya gelişme gir</div>
                <textarea className="inp" value={manuel} onChange={e=>setManuel(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey&&manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));} }}
                  style={{flex:1,minHeight:110,resize:"none",lineHeight:1.6}}
                  placeholder={"3 AI aynı anda analiz eder...\n\nÖrn: Hürmüz Boğazı kapandı\nÖrn: TCMB faizi 500 baz puan indirdi\nÖrn: Türkiye erken seçime gidiyor"}
                />
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#2a4050"}}>Ctrl + Enter</span>
                  <button onClick={()=>{ if(manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));} }}
                    disabled={!manuel.trim()||analizDevam} className="btn-p">
                    {analizDevam ? <><Dots size={5}/> Analiz ediliyor</> : "3 AI ile Analiz Et →"}
                  </button>
                </div>
                <div style={{borderTop:"1px solid #1a2530",paddingTop:10}}>
                  <div style={{fontSize:10,color:"#2a4050",marginBottom:7,fontWeight:500}}>Hızlı örnekler</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","İran-İsrail savaşı","Altın rekor","Petrol 120$","BTC 100k","Deprem İstanbul","Türkiye seçim","Rusya gaz kesti","Çin-Tayvan"].map(t=>(
                      <button key={t} className="qtag" onClick={()=>{ setManuel(t);setSecilen(null);analizEt(t,t); }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PORTFÖY */}
            {solTab==="portfoy" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#4a8060"}}>Portföy Takibi</div>
                <div style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:8,padding:12,display:"flex",flexDirection:"column",gap:7}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#2a5040",textTransform:"uppercase",letterSpacing:".04em"}}>Yeni Pozisyon</div>
                  <input className="inp" placeholder="Sembol — TUPRS, NVDA, EREGL..." value={yeniHisse.sembol} onChange={e=>setYeniHisse(p=>({...p,sembol:e.target.value.toUpperCase()}))}/>
                  <div style={{display:"flex",gap:6}}>
                    <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={e=>setYeniHisse(p=>({...p,adet:e.target.value}))} style={{flex:1}}/>
                    <input className="inp" placeholder="Maliyet ₺" type="number" value={yeniHisse.maliyet} onChange={e=>setYeniHisse(p=>({...p,maliyet:e.target.value}))} style={{flex:1}}/>
                  </div>
                  <button onClick={hisseEkle} className="btn-p" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>+ Ekle</button>
                </div>
                {portfoy.length===0 ? (
                  <div style={{textAlign:"center",color:"#2a4050",fontSize:12,marginTop:16,lineHeight:1.8}}>Portföyünüz boş.<br/>Hisse ekleyerek başlayın.</div>
                ) : portfoy.map(h=>(
                  <div key={h.id} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"9px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:14,color:"#70d8a0",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{h.sembol}</div>
                      <div style={{fontSize:10,color:"#2a5040",marginTop:2}}>{Number(h.adet).toLocaleString("tr-TR")} adet · ₺{Number(h.maliyet).toLocaleString("tr-TR")}</div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="btn-sm" style={{borderColor:"#1e4a2a",color:"#5aaa70",background:"#0a1e12"}}
                        onClick={()=>analizEt(`${h.sembol} hissesini 3 farklı yapay zeka ile analiz et, al/sat önerisi ver`,h.sembol)}>Analiz</button>
                      <button className="btn-sm" style={{borderColor:"#3a1010",color:"#cc6060",background:"#150808"}}
                        onClick={()=>setPortfoy(p=>p.filter(x=>x.id!==h.id))}>Sil</button>
                    </div>
                  </div>
                ))}
                {portfoy.length>0 && <div style={{fontSize:10,color:"#1e3040",textAlign:"center"}}>{portfoy.length} pozisyon · Otomatik kaydedilir</div>}
              </div>
            )}
          </div>

          {/* SAĞ PANEL */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
            {/* Sağ üst tab bar */}
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",background:"#0b0f14",flexShrink:0,paddingLeft:2}}>
              <button className={`tab${sagTab==="analiz"?" on":""}`} onClick={()=>setSagTab("analiz")}>
                3 AI Analiz {analizDevam&&<Dots size={4} color="#4a9a6a"/>}
              </button>
              <button className={`tab${sagTab==="teknik"?" on":""}`} onClick={()=>setSagTab("teknik")}>📊 Teknik</button>
              <button className={`tab${sagTab==="bulten"?" on":""}`} onClick={()=>setSagTab("bulten")}>
                📰 Bülten {bultenYukl&&<Dots size={4} color="#ffa040"/>}
              </button>
              <button className={`tab${sagTab==="korelasyon"?" on":""}`} onClick={()=>setSagTab("korelasyon")}>🔗 Korelasyon</button>
              <button className={`tab${sagTab==="gecmis"?" on":""}`} onClick={()=>setSagTab("gecmis")}>
                Geçmiş{gecmis.length>0&&<span style={{background:"#0e2a1a",color:"#5aaa7a",borderRadius:3,padding:"0 5px",marginLeft:4,fontSize:10}}>{gecmis.length}</span>}
              </button>
              <button className={`tab${sagTab==="takvim"?" on":""}`} onClick={()=>setSagTab("takvim")}>Takvim</button>
            </div>

            {/* 3 AI ANALİZ PANELİ */}
            {sagTab==="analiz" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                {!goster && !analizDevam ? (
                  <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,textAlign:"center",padding:24}}>
                    <div style={{display:"flex",gap:12}}>
                      {Object.values(AI_TEMA).map(ai=>(
                        <div key={ai.isim} style={{width:52,height:52,borderRadius:12,background:ai.bg,border:`2px solid ${ai.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:ai.renk}}>{ai.logo}</div>
                      ))}
                    </div>
                    <div style={{fontSize:15,fontWeight:600,color:"#3a6050"}}>3 AI aynı anda analiz eder</div>
                    <div style={{fontSize:12,color:"#1e3040",lineHeight:1.7,maxWidth:320}}>
                      Claude · ChatGPT · Gemini<br/>Sol panelden haber seç veya Manuel sekmesine geç
                    </div>
                  </div>
                ) : (
                  <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                    {/* AI seçici tab */}
                    <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1520"}}>
                      {Object.entries(AI_TEMA).map(([key,ai])=>(
                        <button key={key} className="ai-tab"
                          onClick={()=>setAktifAI(key)}
                          style={{
                            color: aktifAI===key ? ai.renk : "#3a5060",
                            borderBottomColor: aktifAI===key ? ai.renk : "transparent",
                            display:"flex", flexDirection:"column", alignItems:"flex-start", padding:"7px 14px",
                          }}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span>{ai.logo}</span>
                            <span>{ai.isim}</span>
                            {analizYukl[key] && <Dots color={ai.renk} size={4}/>}
                            {!analizYukl[key] && analizler[key] && <span style={{fontSize:10,color:"#3a7050"}}>✓</span>}
                          </div>
                          <div style={{fontSize:9,color: aktifAI===key ? ai.renk+"99" : "#1e3040", marginTop:1, letterSpacing:".02em"}}>{ai.alt}</div>
                        </button>
                      ))}
                      {analizBaslik && (
                        <div style={{flex:1,display:"flex",alignItems:"center",overflow:"hidden",paddingRight:12}}>
                          <span style={{fontSize:10,color:"#2a4050",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginLeft:8,fontStyle:"italic"}}>{analizBaslik}</span>
                        </div>
                      )}
                    </div>

                    {/* Seçili AI analizi */}
                    <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
                      {analizYukl[aktifAI] && !analizler[aktifAI] ? (
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
                          <Dots color={AI_TEMA[aktifAI].renk}/>
                          <div style={{fontSize:13,fontWeight:500,color:AI_TEMA[aktifAI].renk}}>{AI_TEMA[aktifAI].isim} analiz ediyor...</div>
                        </div>
                      ) : analizler[aktifAI] ? (
                        <div style={{animation:"fadein .3s ease",maxWidth:800}}>
                          <div style={{
                            display:"flex",alignItems:"center",gap:8,marginBottom:16,
                            padding:"8px 12px",borderRadius:6,
                            background:AI_TEMA[aktifAI].bg,border:`1px solid ${AI_TEMA[aktifAI].border}`,
                          }}>
                            <span style={{fontSize:16,color:AI_TEMA[aktifAI].renk}}>{AI_TEMA[aktifAI].logo}</span>
                            <span style={{fontSize:12,fontWeight:600,color:AI_TEMA[aktifAI].renk}}>{AI_TEMA[aktifAI].isim} Analizi</span>
                          </div>
                          <div style={{fontSize:13,lineHeight:1.85,color:"#a8c4cc"}} dangerouslySetInnerHTML={{__html:md(analizler[aktifAI])}}/>
                        </div>
                      ) : (
                        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",color:"#1e3040",fontSize:12}}>
                          Diğer sekmeye geç veya analiz başlat
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TEKNİK ANALİZ */}
            {sagTab==="teknik" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"10px 14px",borderBottom:"1px solid #1a2530",flexShrink:0,display:"flex",gap:8,alignItems:"center"}}>
                  <input className="inp" style={{flex:1,maxWidth:180}}
                    placeholder="Sembol gir: TUPRS, NVDA..."
                    value={teknikSembol}
                    onChange={e=>setTeknikSembol(e.target.value.toUpperCase())}
                    onKeyDown={e=>e.key==="Enter"&&teknikAnalizEt(teknikSembol)}
                  />
                  <button className="btn-p" onClick={()=>teknikAnalizEt(teknikSembol)} disabled={!teknikSembol||teknikYukl} style={{padding:"7px 14px",fontSize:12}}>
                    {teknikYukl?<Dots size={5}/>:"Analiz Et"}
                  </button>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {["TUPRS","THYAO","EREGL","GARAN","NVDA"].map(s=>(
                      <button key={s} className="qtag" onClick={()=>{setTeknikSembol(s);teknikAnalizEt(s);}} style={{fontSize:10,padding:"4px 8px"}}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>
                  {teknikHata && <div style={{color:"#e07070",fontSize:12,padding:12,background:"#180808",border:"1px solid #3a1010",borderRadius:6}}>❌ {teknikHata}</div>}
                  {teknikYukl && <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots/><div style={{fontSize:13,color:"#4a8a6a"}}>Teknik veriler hesaplanıyor...</div></div>}
                  {teknikVeri && (() => {
                    const t = teknikVeri;
                    const rsiRenk = t.rsi>70?"#ff7070":t.rsi<30?"#50dd90":"#80cccc";
                    const macdRenk = t.macd.histogram>0?"#50dd90":"#ff7070";
                    const maxF = Math.max(...t.grafik.fiyatlar);
                    const minF = Math.min(...t.grafik.fiyatlar);
                    return (
                      <div style={{animation:"fadein .3s ease"}}>
                        {/* Fiyat + Trend */}
                        <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"flex-end"}}>
                          <div>
                            <div style={{fontSize:10,color:"#3a6050",fontWeight:600,textTransform:"uppercase",letterSpacing:".05em"}}>{t.sembol}</div>
                            <div style={{fontSize:24,fontWeight:700,color:"#e0f0e8",fontFamily:"'JetBrains Mono',monospace"}}>{t.fiyat?.toFixed(2)}</div>
                          </div>
                          <div style={{padding:"4px 10px",borderRadius:5,fontSize:12,fontWeight:700,
                            background:t.trend==="YÜKSELİŞ TRENDI"?"#0a2a14":t.trend==="DÜŞÜŞ TRENDI"?"#2a0a0a":"#1a1a2a",
                            color:t.trend==="YÜKSELİŞ TRENDI"?"#50dd90":t.trend==="DÜŞÜŞ TRENDI"?"#ff7070":"#8090cc",
                            border:`1px solid ${t.trend==="YÜKSELİŞ TRENDI"?"#1a5a30":t.trend==="DÜŞÜŞ TRENDI"?"#5a1a1a":"#2a2a5a"}`
                          }}>{t.trend}</div>
                        </div>

                        {/* Mini grafik SVG */}
                        <div style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:6,padding:"10px 12px",marginBottom:12}}>
                          <div style={{fontSize:10,color:"#3a6050",marginBottom:6,fontWeight:600}}>SON 30 GÜN</div>
                          <svg width="100%" height="70" viewBox={`0 0 ${t.grafik.fiyatlar.length} 70`} preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4a9a6a" stopOpacity="0.3"/>
                                <stop offset="100%" stopColor="#4a9a6a" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            {(() => {
                              const pts = t.grafik.fiyatlar.map((v,i)=>`${i},${70-((v-minF)/(maxF-minF||1))*65}`).join(" ");
                              const son = t.grafik.fiyatlar.length-1;
                              const alanPts = `0,70 ${pts} ${son},70`;
                              return (<>
                                <polygon points={alanPts} fill="url(#grad)"/>
                                <polyline points={pts} fill="none" stroke="#4a9a6a" strokeWidth="1.5"/>
                              </>);
                            })()}
                          </svg>
                        </div>

                        {/* RSI + MACD + MA kartları */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                          {/* RSI */}
                          <div style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:6,padding:"10px 12px"}}>
                            <div style={{fontSize:9,color:"#3a6050",fontWeight:700,marginBottom:5,textTransform:"uppercase"}}>RSI (14)</div>
                            <div style={{fontSize:22,fontWeight:700,color:rsiRenk,fontFamily:"'JetBrains Mono',monospace"}}>{t.rsi}</div>
                            <div style={{fontSize:10,color:rsiRenk,marginTop:3}}>{t.rsiYorum}</div>
                            <div style={{marginTop:6,height:4,borderRadius:2,background:"#1e2d38",overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${t.rsi}%`,background:rsiRenk,borderRadius:2}}/>
                            </div>
                          </div>
                          {/* MACD */}
                          <div style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:6,padding:"10px 12px"}}>
                            <div style={{fontSize:9,color:"#3a6050",fontWeight:700,marginBottom:5,textTransform:"uppercase"}}>MACD</div>
                            <div style={{fontSize:14,fontWeight:700,color:macdRenk,fontFamily:"'JetBrains Mono',monospace"}}>{t.macd.deger?.toFixed(3)}</div>
                            <div style={{fontSize:9,color:"#3a6050",marginTop:2}}>Sinyal: {t.macd.signal?.toFixed(3)}</div>
                            <div style={{fontSize:10,color:macdRenk,marginTop:3}}>{t.macdYorum}</div>
                          </div>
                          {/* MA */}
                          <div style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:6,padding:"10px 12px"}}>
                            <div style={{fontSize:9,color:"#3a6050",fontWeight:700,marginBottom:5,textTransform:"uppercase"}}>ORTALMALAR</div>
                            <div style={{fontSize:11,color:"#80b8c8",fontFamily:"'JetBrains Mono',monospace"}}>MA20: {t.ma20}</div>
                            {t.ma50&&<div style={{fontSize:11,color:"#80b8c8",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>MA50: {t.ma50}</div>}
                            <div style={{fontSize:9,color:"#3a6050",marginTop:4}}>Hacim: {t.hacim.yorum}</div>
                          </div>
                        </div>

                        {/* Destek / Direnç */}
                        <div style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:6,padding:"12px 14px"}}>
                          <div style={{fontSize:10,color:"#3a6050",fontWeight:600,marginBottom:8,textTransform:"uppercase"}}>Destek & Direnç Seviyeleri</div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {[
                              {label:"Direnç 2",val:t.seviyeler.direnc2,renk:"#ff6060"},
                              {label:"Direnç 1",val:t.seviyeler.direnc1,renk:"#ff9060"},
                              {label:"Pivot",   val:t.seviyeler.pivot,  renk:"#80c0cc"},
                              {label:"Destek 1",val:t.seviyeler.destek1,renk:"#60cc80"},
                              {label:"Destek 2",val:t.seviyeler.destek2,renk:"#40aa60"},
                            ].map(({label,val,renk})=>(
                              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 8px",borderRadius:4,background:label.includes("Pivot")?"#141e2a":"transparent"}}>
                                <span style={{fontSize:11,color:renk,fontWeight:600}}>{label}</span>
                                <span style={{fontSize:12,color:"#c0d8e0",fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* SABAH BÜLTENİ */}
            {sagTab==="bulten" && (
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"8px 14px",borderBottom:"1px solid #1a2530",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:"#8a7040"}}>📰 Sabah Bülteni</div>
                    <div style={{fontSize:10,color:"#3a4030"}}>{haberler.length} haber analiz edilecek</div>
                  </div>
                  <button className="btn-p" onClick={bultenUret} disabled={bultenYukl||!haberler.length}
                    style={{padding:"7px 16px",fontSize:12,borderColor:"#5a6030",color:"#aab860",background:"#1a1e08"}}>
                    {bultenYukl?<><Dots color="#aab860" size={5}/> Hazırlanıyor...</>:"🌅 Bülten Üret"}
                  </button>
                </div>
                {/* AI seç */}
                <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1208"}}>
                  {[
                    {key:"llama",  isim:"Llama 3.3",    logo:"🦙", renk:"#c07ae0"},
                    {key:"gpt",    isim:"GPT-4o Mini",  logo:"⬡",  renk:"#10a37f"},
                    {key:"claude", isim:"Claude Haiku", logo:"✦",  renk:"#4a8af0"},
                  ].map(ai=>(
                    <button key={ai.key} className="ai-tab"
                      onClick={()=>setBultenAktif(ai.key)}
                      style={{color:bultenAktif===ai.key?ai.renk:"#3a5060",borderBottomColor:bultenAktif===ai.key?ai.renk:"transparent",padding:"7px 14px"}}>
                      {ai.logo} {ai.isim}
                      {bultenYukl&&<span style={{marginLeft:5}}><Dots color={ai.renk} size={4}/></span>}
                      {!bultenYukl&&bulten[ai.key]&&<span style={{marginLeft:5,fontSize:9,color:"#3a7050"}}>✓</span>}
                    </button>
                  ))}
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
                  {!bulten.llama&&!bultenYukl&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center"}}>
                      <div style={{fontSize:36,opacity:.15}}>📰</div>
                      <div style={{fontSize:14,fontWeight:600,color:"#5a6040"}}>Günlük Sabah Bülteni</div>
                      <div style={{fontSize:12,color:"#2a3020",lineHeight:1.7,maxWidth:300}}>
                        Yukarıdaki "Bülten Üret" butonuna bas.<br/>3 AI son haberleri analiz edip<br/>sabah brifingini hazırlayacak.
                      </div>
                    </div>
                  )}
                  {bultenYukl&&!bulten[bultenAktif]&&(
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
                      <Dots color="#aab860"/><div style={{fontSize:13,color:"#8a9050"}}>Sabah bülteni hazırlanıyor...</div>
                    </div>
                  )}
                  {bulten[bultenAktif]&&(
                    <div style={{animation:"fadein .3s ease",maxWidth:800}}>
                      <div style={{fontSize:13,lineHeight:1.9,color:"#a8c4b0"}} dangerouslySetInnerHTML={{__html:md(bulten[bultenAktif])}}/>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KORELASYON */}
            {sagTab==="korelasyon" && (
              <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#3a7080"}}>🔗 Korelasyon Hafızası</div>
                    <div style={{fontSize:10,color:"#2a4050",marginTop:2}}>Her analizde otomatik öğrenir — haber türü → hangi hisse önerildi</div>
                  </div>
                  <button className="btn-sm" onClick={()=>setKorelasyon({})} style={{borderColor:"#301010",color:"#cc6060",background:"#140808",fontSize:10}}>Sıfırla</button>
                </div>
                {Object.keys(korelasyon).length === 0 ? (
                  <div style={{textAlign:"center",padding:40,color:"#1e3040",fontSize:12,lineHeight:1.8}}>
                    Henüz korelasyon verisi yok.<br/>Haber analiz yaptıkça sistem otomatik öğrenir.<br/>
                    <span style={{color:"#2a4a4a"}}>Her analizde "hangi kategori haberi → hangi hisse önerildi"<br/>istatistiği burada birikir.</span>
                  </div>
                ) : (
                  Object.entries(korelasyon).map(([kategori, hisseler])=>{
                    const kr = KRENK[kategori]||KRENK["GENEL"];
                    const sirali = Object.entries(hisseler).sort((a,b)=>b[1].toplam-a[1].toplam);
                    return (
                      <div key={kategori} style={{background:"#101820",border:`1px solid ${kr.border}`,borderRadius:7,padding:"11px 13px",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                          <span className="badge" style={{background:kr.bg,color:kr.text,border:`1px solid ${kr.border}`,fontSize:11}}>{kategori}</span>
                          <span style={{fontSize:10,color:"#3a5060"}}>{sirali.length} hisse · {Object.values(hisseler).reduce((a,b)=>a+b.toplam,0)} analiz</span>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {sirali.map(([sembol, data])=>{
                            const alOran = data.toplam > 0 ? Math.round(data.al/data.toplam*100) : 0;
                            return (
                              <div key={sembol}
                                onClick={()=>{setTeknikSembol(sembol);setSagTab("teknik");teknikAnalizEt(sembol);}}
                                style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",cursor:"pointer",transition:"border-color .12s",minWidth:90}}
                                onMouseEnter={e=>e.currentTarget.style.borderColor="#3a6070"}
                                onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2d38"}
                              >
                                <div style={{fontSize:12,fontWeight:700,color:"#70d8a0",fontFamily:"'JetBrains Mono',monospace"}}>{sembol}</div>
                                <div style={{fontSize:9,color:"#3a6050",marginTop:2}}>{data.toplam}x analiz</div>
                                <div style={{display:"flex",gap:4,marginTop:4}}>
                                  <span style={{fontSize:9,color:"#50cc80",background:"#0a2010",padding:"1px 5px",borderRadius:3}}>AL {alOran}%</span>
                                  <span style={{fontSize:9,color:"#cc5050",background:"#200808",padding:"1px 5px",borderRadius:3}}>SAT {100-alOran}%</span>
                                </div>
                                <div style={{marginTop:5,height:3,borderRadius:2,background:"#200808",overflow:"hidden"}}>
                                  <div style={{height:"100%",width:`${alOran}%`,background:"#50cc80",borderRadius:2}}/>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* GEÇMİŞ */}
            {sagTab==="gecmis" && (
              <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
                {gecmis.length===0 ? (
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1e3040",fontSize:13}}>Henüz analiz yapılmadı</div>
                ) : (
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <span style={{fontSize:13,fontWeight:600,color:"#3a6050"}}>Analiz Geçmişi</span>
                      <button className="btn-sm" onClick={()=>setGecmis([])} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Temizle</button>
                    </div>
                    {gecmis.map(g=>(
                      <div key={g.id}
                        onClick={()=>{
                          setAnalizler(g.analizler||{claude:g.analiz,gpt:null,gemini:null});
                          setAnalizBaslik(g.baslik);
                          setGoster(true);
                          setSagTab("analiz");
                        }}
                        style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer",transition:"border-color .12s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="#2a4a5a"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="#1c2c38"}
                      >
                        <div style={{fontSize:12,color:"#80aab8",marginBottom:4,lineHeight:1.4,fontWeight:500}}>{g.baslik}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",gap:5}}>
                            {Object.entries(AI_TEMA).map(([k,ai])=>(
                              <span key={k} style={{fontSize:9,color:(g.analizler?.[k])?ai.renk:"#2a3a4a",fontWeight:600}}>
                                {ai.logo} {ai.isim}
                              </span>
                            ))}
                          </div>
                          <span style={{fontSize:10,color:"#2a4050"}}>{g.tarih} {g.zaman}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAKVİM */}
            {sagTab==="takvim" && (
              <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#3a6050",marginBottom:12}}>Ekonomik Takvim</div>
                {takvim.length===0 ? (
                  <div style={{display:"flex",justifyContent:"center",marginTop:40}}><Dots/></div>
                ) : takvim.map(o=>{
                  const tarih=new Date(o.tarih);
                  const gecti=tarih<new Date();
                  const er=ERENK[o.onem]||ERENK["DÜŞÜK"];
                  return (
                    <div key={o.id}
                      onClick={()=>analizEt(`${o.baslik} yaklaşıyor, 3 AI ile piyasa etkilerini analiz et`,o.baslik)}
                      style={{background:gecti?"#0c1015":"#101820",border:`1px solid ${o.onem==="YÜKSEK"&&!gecti?"#381a1a":"#1c2c38"}`,borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer",opacity:gecti?.45:1,transition:"border-color .12s"}}
                      onMouseEnter={e=>{ if(!gecti)e.currentTarget.style.borderColor="#2a4a5a"; }}
                      onMouseLeave={e=>{ if(!gecti)e.currentTarget.style.borderColor=o.onem==="YÜKSEK"?"#381a1a":"#1c2c38"; }}
                    >
                      <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                            {o.ulke&&<span style={{fontSize:13}}>{o.ulke}</span>}
                            <span className="badge" style={{background:er.bg,color:er.text,border:`1px solid ${er.border}`}}>{o.onem}</span>
                            {gecti&&<span style={{fontSize:10,color:"#2a4a40",fontWeight:500}}>✓ Tamamlandı</span>}
                          </div>
                          <div style={{fontSize:12,color:gecti?"#3a5060":"#90b4c0",fontWeight:500,lineHeight:1.4,marginBottom:2}}>{o.baslik}</div>
                          {o.ozet&&<div style={{fontSize:10,color:"#2a4050"}}>{o.ozet}</div>}
                        </div>
                        <div style={{flexShrink:0,textAlign:"right",paddingTop:2}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#3a7060",fontFamily:"'JetBrains Mono',monospace"}}>
                            {tarih.toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}
                          </div>
                        </div>
                      </div>
                      {!gecti&&<div style={{fontSize:9,color:"#1e3a30",marginTop:5}}>→ 3 AI ile analiz et</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{height:24,borderTop:"1px solid #1a2530",background:"#0b0f14",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",flexShrink:0}}>
          <span style={{fontSize:9,color:"#1e3040"}}>Bloomberg HT · Hürriyet · AA · Sabah · BBC · Reuters · CNBC · WSJ | Fiyatlar: Yahoo Finance</span>
          <span style={{fontSize:9,color:"#1e3040"}}>⚠ Yatırım tavsiyesi değildir</span>
        </div>
      </div>
    </>
  );
}

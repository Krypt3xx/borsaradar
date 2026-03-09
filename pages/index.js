import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const KATEGORI_MAP = {
  "JEOPOLİTİK":["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","tension","attack","turkey","syria","savaş","gerilim","tehdit","çatışma","kriz"],
  "ENERJİ":["oil","crude","gas","opec","energy","brent","wti","petrol","doğalgaz","barrel","lng","enerji","yakıt"],
  "MERKEZ BANKASI":["fed","federal reserve","rate","interest","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb","merkez bankası","ppk","politika faizi"],
  "TEKNOLOJİ":["nvidia","apple","google","microsoft","amazon","meta","ai","chip","semiconductor","openai","tsmc","tesla","yapay zeka","teknoloji"],
  "TÜRKİYE":["turkey","turkish","lira","istanbul","ankara","bist","borsa","erdoğan","türkiye","hazine","bütçe","tüfe","dolar","kur"],
  "SİYASET":["seçim","muhalefet","iktidar","parti","meclis","milletvekili","bakanlık","cumhurbaşkanı","hükümet","anayasa","yasa","kanun"],
  "EMTİA":["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","platinum","emtia"],
  "KRİPTO":["bitcoin","crypto","ethereum","blockchain","btc","eth","kripto","coinbase"],
  "PİYASA":["borsa","hisse","endeks","bist","rally","düşüş","yükseliş","kapanış","işlem hacmi","piyasa"],
};
const kategoriBul = t => { const s=t.toLowerCase(); for(const[k,ws]of Object.entries(KATEGORI_MAP))if(ws.some(w=>s.includes(w)))return k; return"GENEL"; };
const etkiBul = t => { const s=t.toLowerCase(); if(["war","attack","crash","crisis","surge","plunge","record","collapse","çöküş","rekor","kriz","savaş","alarm","kritik"].some(w=>s.includes(w)))return"YÜKSEK"; if(["rise","fall","gain","loss","cut","hike","deal","meeting","report","yükseldi","düştü","arttı","karar","açıkladı"].some(w=>s.includes(w)))return"ORTA"; return"DÜŞÜK"; };
const yonBul = t => { const s=t.toLowerCase(); const p=["rise","gain","surge","jump","rally","yüksel","arttı","rekor","büyüme"].filter(w=>s.includes(w)).length; const n=["fall","drop","crash","plunge","decline","düş","geriledi","kayıp","kriz","daralma"].filter(w=>s.includes(w)).length; return p>n?"POZİTİF":n>p?"NEGATİF":"KARISIK"; };
const zamanFmt = d => { try{ const m=(Date.now()-new Date(d).getTime())/60000; if(m<60)return`${Math.floor(m)}dk`; if(m<1440)return`${Math.floor(m/60)}sa`; return`${Math.floor(m/1440)}g`; }catch{return"?";} };
const fmtFiyat = (f, sembol) => { if(!f)return"—"; if(sembol==="BTC-USD")return`$${Math.round(f).toLocaleString("tr-TR")}`; if(["^GSPC","^IXIC"].includes(sembol))return f.toLocaleString("tr-TR",{maximumFractionDigits:0}); if(["USDTRY=X","EURTRY=X","GBPTRY=X"].includes(sembol))return`₺${f.toFixed(2)}`; if(sembol==="GC=F")return`$${Math.round(f).toLocaleString()}`; if(sembol==="BZ=F")return`$${f.toFixed(1)}`; if(sembol==="XU100.IS")return f.toLocaleString("tr-TR",{maximumFractionDigits:0}); return f.toFixed(2); };

const KRENK = {
  "JEOPOLİTİK":{bg:"#2a1010",border:"#5a2a2a",text:"#f0a0a0"},
  "ENERJİ":{bg:"#261800",border:"#5a3a00",text:"#ffb74d"},
  "MERKEZ BANKASI":{bg:"#001828",border:"#003a66",text:"#80c8f0"},
  "TEKNOLOJİ":{bg:"#160e2a",border:"#3e2870",text:"#c0a8f0"},
  "TÜRKİYE":{bg:"#280808",border:"#660000",text:"#ff8a80"},
  "SİYASET":{bg:"#1a1428",border:"#3a2a5a",text:"#b0a0d8"},
  "EMTİA":{bg:"#221c00",border:"#554800",text:"#ffd54f"},
  "KRİPTO":{bg:"#1c1400",border:"#4a3800",text:"#ffcc02"},
  "PİYASA":{bg:"#0c1e18",border:"#1a4a38",text:"#6dcca8"},
  "GENEL":{bg:"#121a22",border:"#263444",text:"#8aacbe"},
};
const ERENK = {
  "YÜKSEK":{bg:"#280808",text:"#ff7070",border:"#601818"},
  "ORTA":{bg:"#261800",text:"#ff9944",border:"#5a3c00"},
  "DÜŞÜK":{bg:"#081a08",text:"#5aaa5a",border:"#164016"},
};
const AI_TEMA = {
  claude:{isim:"Claude",renk:"#c07ae0",bg:"#180e26",border:"#3a1e60",logo:"✦",alt:"Anthropic"},
  gpt:{isim:"GPT-4o Mini",renk:"#10a37f",bg:"#061a14",border:"#0e3a2a",logo:"⬡",alt:"OpenAI"},
  gemini:{isim:"Llama 3.3",renk:"#4a8af0",bg:"#0a1428",border:"#1a3466",logo:"🦙",alt:"Groq"},
};

function md(text) {
  if(!text)return"";
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

// ─── ANA BILEŞEN ──────────────────────────────────────────────────────────────
export default function BorsaRadar() {
  // Haberler
  const [haberler,setHaberler] = useState([]);
  const [haberYukl,setHaberYukl] = useState(false);
  const [haberHata,setHaberHata] = useState("");
  const [haberFiltre,setHaberFiltre] = useState("TÜMÜ");
  const [fiyatlar,setFiyatlar] = useState([]);
  const [takvim,setTakvim] = useState([]);
  const [secilen,setSecilen] = useState(null);
  const [cd,setCd] = useState(300);
  const [sonGun,setSonGun] = useState(null);
  const cdRef = useRef(null);

  // 3-AI analiz
  const [analizler,setAnalizler] = useState({claude:null,gpt:null,gemini:null});
  const [analizYukl,setAnalizYukl] = useState({claude:false,gpt:false,gemini:false});
  const [analizBaslik,setAnalizBaslik] = useState("");
  const [aktifAI,setAktifAI] = useState("claude");
  const [goster,setGoster] = useState(false);

  // Korelasyon
  const [korelasyon,setKorelasyon] = useState({});

  // Bülten
  const [bulten,setBulten] = useState({llama:null,gpt:null,claude:null});
  const [bultenYukl,setBultenYukl] = useState(false);
  const [bultenAktif,setBultenAktif] = useState("llama");

  // Teknik
  const [teknikSembol,setTeknikSembol] = useState("");
  const [teknikVeri,setTeknikVeri] = useState(null);
  const [teknikYukl,setTeknikYukl] = useState(false);
  const [teknikHata,setTeknikHata] = useState("");

  // Rapor
  const [raporTip,setRaporTip] = useState("gunluk");
  const [raporVeri,setRaporVeri] = useState(null);
  const [raporYukl,setRaporYukl] = useState(false);
  const [raporAktifAI,setRaporAktifAI] = useState("llama");
  const [haftalikHaberler,setHaftalikHaberler] = useState([]);
  const [dovizKurlari,setDovizKurlari] = useState(null);

  // Portföy + manuel
  const [gecmis,setGecmis] = useState([]);
  const [portfoy,setPortfoy] = useState([]);
  const [yeniHisse,setYeniHisse] = useState({sembol:"",adet:"",maliyet:""});
  const [manuel,setManuel] = useState("");

  // Mobil navigasyon — ana ekranlar
  // "haberler" | "analiz" | "teknik" | "rapor" | "diger"
  const [aktifEkran,setAktifEkran] = useState("haberler");
  // Analiz alt sekmeleri
  const [analizAltSekme,setAnalizAltSekme] = useState("3ai"); // "3ai"|"bulten"|"gecmis"
  // Diğer alt sekmeleri  
  const [digerAltSekme,setDigerAltSekme] = useState("portfoy"); // "portfoy"|"korelasyon"|"takvim"|"manuel"

  // Masaüstü mi kontrol
  const [isMasaustu,setIsMasaustu] = useState(false);
  const [solTab,setSolTab] = useState("akis");
  const [sagTab,setSagTab] = useState("analiz");

  useEffect(()=>{
    const kontrol = ()=>setIsMasaustu(window.innerWidth>=900);
    kontrol();
    window.addEventListener("resize",kontrol);
    return()=>window.removeEventListener("resize",kontrol);
  },[]);

  // ─── API CALLS ──────────────────────────────────────────────────────────────
  const fiyatYukle = useCallback(async()=>{
    try{const r=await fetch("/api/prices");const d=await r.json();if(d.fiyatlar?.length)setFiyatlar(d.fiyatlar);}catch{}
  },[]);

  const haberleriYukle = useCallback(async()=>{
    setHaberYukl(true);setHaberHata("");setCd(300);
    try{
      const r=await fetch("/api/news");
      if(!r.ok)throw new Error(`${r.status}`);
      const d=await r.json();
      if(d.haberler?.length>0){setHaberler(d.haberler);setSonGun(new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}));}
      else setHaberHata("Haber alınamadı.");
    }catch(e){setHaberHata(`Bağlantı hatası: ${e.message}`);}
    setHaberYukl(false);
  },[]);

  const takvimYukle = useCallback(async()=>{
    try{const r=await fetch("/api/calendar");const d=await r.json();if(d.olaylar)setTakvim(d.olaylar);}catch{}
  },[]);

  const dovizYukle = useCallback(async()=>{
    try{const r=await fetch("/api/doviz");const d=await r.json();if(d.kurlar?.USDTRY)setDovizKurlari(d);}catch{}
  },[]);

  const analizEt = useCallback(async(metin,baslik)=>{
    if(!metin||Object.values(analizYukl).some(v=>v))return;
    setGoster(true);
    if(isMasaustu)setSagTab("analiz"); else setAktifEkran("analiz");
    setAnalizBaslik(baslik||metin.slice(0,80));
    setAnalizler({claude:null,gpt:null,gemini:null});
    setAnalizYukl({claude:true,gpt:true,gemini:true});
    setAktifAI("claude");
    try{
      const r=await fetch("/api/analyze-multi",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin})});
      const d=await r.json();
      setAnalizler({
        claude:d.claude?.text||(d.claude?.error?`❌ ${d.claude.error}`:null),
        gpt:d.gpt?.text||(d.gpt?.error?`❌ ${d.gpt.error}`:null),
        gemini:d.gemini?.text||(d.gemini?.error?`❌ ${d.gemini.error}`:null),
      });
      const kayit={id:Date.now(),baslik:baslik||metin.slice(0,70),analizler:{claude:d.claude?.text,gpt:d.gpt?.text,gemini:d.gemini?.text},zaman:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),tarih:new Date().toLocaleDateString("tr-TR")};
      setGecmis(prev=>[kayit,...prev.slice(0,19)]);
      const kat=secilen?.kategori||kategoriBul(metin);
      const tumAnaliz=[d.claude?.text,d.gpt?.text,d.gemini?.text].filter(Boolean).join(" ");
      const bistSemboller=["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM"];
      const bulunan=bistSemboller.filter(s=>tumAnaliz.includes(s));
      if(bulunan.length){
        const yon=tumAnaliz.includes("📈 AL")?1:tumAnaliz.includes("📉 SAT")?-1:0;
        setKorelasyon(prev=>{const yeni={...prev};bulunan.forEach(s=>{if(!yeni[kat])yeni[kat]={};if(!yeni[kat][s])yeni[kat][s]={al:0,sat:0,toplam:0};yeni[kat][s].toplam++;if(yon===1)yeni[kat][s].al++;if(yon===-1)yeni[kat][s].sat++;});return yeni;});
      }
    }catch(e){setAnalizler({claude:`❌ ${e.message}`,gpt:`❌ ${e.message}`,gemini:`❌ ${e.message}`});}
    setAnalizYukl({claude:false,gpt:false,gemini:false});
  },[analizYukl,secilen,isMasaustu]);

  const bultenUret = useCallback(async()=>{
    if(!haberler.length||bultenYukl)return;
    setBultenYukl(true);setBulten({llama:null,gpt:null,claude:null});
    if(isMasaustu)setSagTab("bulten"); else{setAktifEkran("analiz");setAnalizAltSekme("bulten");}
    try{
      const r=await fetch("/api/bulten",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({haberler})});
      const d=await r.json();
      setBulten({llama:d.llama?.text||(d.llama?.error?`❌ ${d.llama.error}`:null),gpt:d.gpt?.text||(d.gpt?.error?`❌ ${d.gpt.error}`:null),claude:d.claude?.text||(d.claude?.error?`❌ ${d.claude.error}`:null)});
    }catch(e){setBulten({llama:`❌ ${e.message}`,gpt:null,claude:null});}
    setBultenYukl(false);
  },[haberler,bultenYukl,isMasaustu]);

  const teknikAnalizEt = useCallback(async(sembol)=>{
    if(!sembol||teknikYukl)return;
    setTeknikYukl(true);setTeknikVeri(null);setTeknikHata("");
    try{const r=await fetch(`/api/teknik?sembol=${encodeURIComponent(sembol)}`);const d=await r.json();if(d.error)throw new Error(d.error);setTeknikVeri(d);}
    catch(e){setTeknikHata(e.message);}
    setTeknikYukl(false);
  },[teknikYukl]);

  const raporUret = useCallback(async()=>{
    if(!haberler.length||raporYukl)return;
    setRaporYukl(true);setRaporVeri(null);
    if(isMasaustu)setSagTab("rapor"); else setAktifEkran("rapor");
    try{
      const r=await fetch("/api/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({haberler,tip:raporTip,haftalikHaberler:raporTip==="haftalik"?haftalikHaberler:[]})});
      const d=await r.json();setRaporVeri(d);setRaporAktifAI("llama");
    }catch(e){setRaporVeri({hata:e.message});}
    setRaporYukl(false);
  },[haberler,raporTip,haftalikHaberler,raporYukl,isMasaustu]);

  useEffect(()=>{
    haberleriYukle();fiyatYukle();takvimYukle();dovizYukle();
    const r1=setInterval(haberleriYukle,5*60*1000);
    const r2=setInterval(fiyatYukle,60*1000);
    const r3=setInterval(dovizYukle,2*60*1000);
    cdRef.current=setInterval(()=>setCd(c=>c>0?c-1:300),1000);
    try{const p=localStorage.getItem("br_portfoy");if(p)setPortfoy(JSON.parse(p));}catch{}
    try{const g=localStorage.getItem("br_gecmis");if(g)setGecmis(JSON.parse(g));}catch{}
    try{const k=localStorage.getItem("br_korel");if(k)setKorelasyon(JSON.parse(k));}catch{}
    try{const h=localStorage.getItem("br_haftalik");if(h)setHaftalikHaberler(JSON.parse(h));}catch{}
    return()=>{clearInterval(r1);clearInterval(r2);clearInterval(r3);clearInterval(cdRef.current);};
  },[]);

  useEffect(()=>{try{localStorage.setItem("br_portfoy",JSON.stringify(portfoy));}catch{}},[portfoy]);
  useEffect(()=>{try{localStorage.setItem("br_gecmis",JSON.stringify(gecmis.slice(0,20)));}catch{}},[gecmis]);
  useEffect(()=>{try{localStorage.setItem("br_korel",JSON.stringify(korelasyon));}catch{}},[korelasyon]);
  useEffect(()=>{try{localStorage.setItem("br_haftalik",JSON.stringify(haftalikHaberler.slice(-200)));}catch{}},[haftalikHaberler]);

  const hisseEkle=()=>{if(!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet)return;setPortfoy(prev=>[...prev,{...yeniHisse,id:Date.now(),sembol:yeniHisse.sembol.toUpperCase()}]);setYeniHisse({sembol:"",adet:"",maliyet:""});};
  const fmtCD=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const analizDevam=Object.values(analizYukl).some(v=>v);
  const filtreliHaberler=haberler.filter(h=>haberFiltre==="TR"?h.dil==="tr":haberFiltre==="EN"?h.dil==="en":true);

  // ─── PAYLAŞILAN İÇERİK BLOKLAR ────────────────────────────────────────────
  const HaberListesi = ()=>(
    <>
      <div style={{padding:"6px 10px",borderBottom:"1px solid #1a2530",display:"flex",gap:5,alignItems:"center",flexShrink:0,background:"#0b0f14"}}>
        {["TÜMÜ","TR","EN"].map(f=>(
          <button key={f} className={`filtre-btn${haberFiltre===f?" on":""}`} onClick={()=>setHaberFiltre(f)}>{f}</button>
        ))}
        <span style={{fontSize:10,color:"#2a4050",marginLeft:"auto"}}>{filtreliHaberler.length} haber</span>
        <button onClick={haberleriYukle} disabled={haberYukl} className="btn-sm" style={{borderColor:"#1e3a2a",color:"#4a8a60",background:"#0a1810",padding:"3px 10px"}}>
          {haberYukl?<Dots size={4}/>:"↻"}
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 8px",WebkitOverflowScrolling:"touch"}}>
        {haberYukl&&haberler.length===0&&(<div style={{padding:28,textAlign:"center",color:"#2a5040"}}><div style={{marginBottom:10}}><Dots/></div><div style={{fontSize:13,fontWeight:500,color:"#4a7060",marginBottom:4}}>Haberler yükleniyor</div><div style={{fontSize:10,color:"#2a4040"}}>Bloomberg HT · Hürriyet · Reuters · CNBC...</div></div>)}
        {haberHata&&(<div style={{margin:8,padding:12,background:"#180808",border:"1px solid #401818",borderRadius:6,color:"#e07070",fontSize:12,lineHeight:1.5}}>⚠ {haberHata}<br/><button onClick={haberleriYukle} className="btn-sm" style={{marginTop:8,borderColor:"#401818",color:"#e07070",background:"#1e0808"}}>Tekrar dene</button></div>)}
        {filtreliHaberler.map((h,i)=>{
          const kr=KRENK[h.kategori]||KRENK["GENEL"];
          const er=ERENK[h.etki]||ERENK["DÜŞÜK"];
          return(
            <div key={h.id} className={`hcard${secilen?.id===h.id?" sel":""}`}
              onClick={()=>{setSecilen(h);analizEt(h.baslik+(h.ozet?" — "+h.ozet:""),h.baslik);}}
              style={{background:"#101820",border:"1px solid #1c2c38",padding:"10px 10px",marginBottom:5,animation:`fadein .18s ease ${Math.min(i*.018,.4)}s both`}}>
              <div style={{display:"flex",gap:4,marginBottom:6,alignItems:"center",flexWrap:"wrap"}}>
                <span className="badge" style={{background:kr.bg,color:kr.text,border:`1px solid ${kr.border}`}}>{h.kategori}</span>
                <span className="badge" style={{background:er.bg,color:er.text,border:`1px solid ${er.border}`}}>{h.etki}</span>
                {h.dil==="tr"&&<span className="badge" style={{background:"#1a0808",color:"#e05050",border:"1px solid #3a1010"}}>🇹🇷</span>}
                <span style={{marginLeft:"auto",fontSize:14,fontWeight:700,color:h.yon==="POZİTİF"?"#44aa70":h.yon==="NEGATİF"?"#cc5555":"#cc8830"}}>{h.yon==="POZİTİF"?"▲":h.yon==="NEGATİF"?"▼":"◆"}</span>
              </div>
              <div style={{fontSize:13,color:secilen?.id===h.id?"#c0eedd":"#90b0bc",lineHeight:1.5,marginBottom:5,fontWeight:secilen?.id===h.id?500:400}}>{h.baslik}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#304858"}}>
                <span style={{fontWeight:500}}>{h.kaynak}</span>
                <span>{zamanFmt(h.tarih)} önce</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const AnalizPaneli = ()=>(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {!goster&&!analizDevam?(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,textAlign:"center",padding:24}}>
          <div style={{display:"flex",gap:12}}>{Object.values(AI_TEMA).map(ai=>(<div key={ai.isim} style={{width:52,height:52,borderRadius:12,background:ai.bg,border:`2px solid ${ai.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:ai.renk}}>{ai.logo}</div>))}</div>
          <div style={{fontSize:15,fontWeight:600,color:"#3a6050"}}>3 AI aynı anda analiz eder</div>
          <div style={{fontSize:12,color:"#1e3040",lineHeight:1.7,maxWidth:320}}>Claude · ChatGPT · Llama<br/>Haber seç veya Manuel gir</div>
        </div>
      ):(
        <>
          <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1520",overflowX:"auto"}}>
            {Object.entries(AI_TEMA).map(([key,ai])=>(
              <button key={key} className="ai-tab" onClick={()=>setAktifAI(key)}
                style={{color:aktifAI===key?ai.renk:"#3a5060",borderBottomColor:aktifAI===key?ai.renk:"transparent",display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"8px 14px",minWidth:80}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span>{ai.logo}</span><span style={{fontSize:11}}>{ai.isim}</span>
                  {analizYukl[key]&&<Dots color={ai.renk} size={4}/>}
                  {!analizYukl[key]&&analizler[key]&&<span style={{fontSize:10,color:"#3a7050"}}>✓</span>}
                </div>
                <div style={{fontSize:8,color:aktifAI===key?ai.renk+"99":"#1e3040",marginTop:1}}>{ai.alt}</div>
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px",WebkitOverflowScrolling:"touch"}}>
            {analizYukl[aktifAI]&&!analizler[aktifAI]?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots color={AI_TEMA[aktifAI].renk}/><div style={{fontSize:13,fontWeight:500,color:AI_TEMA[aktifAI].renk}}>{AI_TEMA[aktifAI].isim} analiz ediyor...</div></div>
            ):analizler[aktifAI]?(
              <div style={{animation:"fadein .3s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,padding:"8px 12px",borderRadius:6,background:AI_TEMA[aktifAI].bg,border:`1px solid ${AI_TEMA[aktifAI].border}`}}>
                  <span style={{fontSize:16,color:AI_TEMA[aktifAI].renk}}>{AI_TEMA[aktifAI].logo}</span>
                  <span style={{fontSize:12,fontWeight:600,color:AI_TEMA[aktifAI].renk}}>{AI_TEMA[aktifAI].isim}</span>
                  {analizBaslik&&<span style={{fontSize:10,color:"#2a4050",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginLeft:4,fontStyle:"italic"}}>{analizBaslik}</span>}
                </div>
                <div style={{fontSize:13,lineHeight:1.85,color:"#a8c4cc"}} dangerouslySetInnerHTML={{__html:md(analizler[aktifAI])}}/>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",color:"#1e3040",fontSize:12}}>Diğer sekmeye geç veya analiz başlat</div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const BultenPaneli = ()=>(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 14px",borderBottom:"1px solid #1a2530",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0b0f14"}}>
        <div><div style={{fontSize:12,fontWeight:600,color:"#8a7040"}}>📰 Sabah Bülteni</div><div style={{fontSize:10,color:"#3a4030"}}>{haberler.length} haber</div></div>
        <button className="btn-p" onClick={bultenUret} disabled={bultenYukl||!haberler.length} style={{padding:"7px 14px",fontSize:12,borderColor:"#5a6030",color:"#aab860",background:"#1a1e08"}}>
          {bultenYukl?<><Dots color="#aab860" size={5}/></>:"🌅 Üret"}
        </button>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1208",overflowX:"auto"}}>
        {[{key:"llama",isim:"Llama",logo:"🦙",renk:"#c07ae0"},{key:"gpt",isim:"GPT-4o",logo:"⬡",renk:"#10a37f"},{key:"claude",isim:"Claude",logo:"✦",renk:"#4a8af0"}].map(ai=>(
          <button key={ai.key} className="ai-tab" onClick={()=>setBultenAktif(ai.key)} style={{color:bultenAktif===ai.key?ai.renk:"#3a5060",borderBottomColor:bultenAktif===ai.key?ai.renk:"transparent",padding:"7px 14px"}}>
            {ai.logo} {ai.isim}
            {bultenYukl&&<span style={{marginLeft:5}}><Dots color={ai.renk} size={4}/></span>}
            {!bultenYukl&&bulten[ai.key]&&<span style={{marginLeft:5,fontSize:9,color:"#3a7050"}}>✓</span>}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px",WebkitOverflowScrolling:"touch"}}>
        {!bulten.llama&&!bultenYukl&&(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center"}}><div style={{fontSize:36,opacity:.15}}>📰</div><div style={{fontSize:14,fontWeight:600,color:"#5a6040"}}>Sabah Bülteni</div><div style={{fontSize:12,color:"#2a3020",lineHeight:1.7}}>3 AI son haberleri analiz edip<br/>sabah brifingini hazırlar.</div></div>)}
        {bultenYukl&&!bulten[bultenAktif]&&(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots color="#aab860"/><div style={{fontSize:13,color:"#8a9050"}}>Hazırlanıyor...</div></div>)}
        {bulten[bultenAktif]&&(<div style={{animation:"fadein .3s ease"}}><div style={{fontSize:13,lineHeight:1.9,color:"#a8c4b0"}} dangerouslySetInnerHTML={{__html:md(bulten[bultenAktif])}}/></div>)}
      </div>
    </div>
  );

  const TeknikPaneli = ()=>{
    const bistSemb=["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM","SAHOL","KOZAL","MGROS","ULKER","ARCLK"];
    const xSemb=["XU100","XU050","XU030"];
    const tvSembol=xSemb.includes(teknikSembol)?`BIST:${teknikSembol}`:bistSemb.includes(teknikSembol)?`BIST:${teknikSembol}`:teknikSembol.includes(":")?teknikSembol:teknikSembol;
    const t=teknikVeri;
    const rsiRenk=t?(t.rsi>70?"#ff7070":t.rsi<30?"#50dd90":"#80cccc"):"#80cccc";
    const macdRenk=t?(t.macd.histogram>0?"#50dd90":"#ff7070"):"#80cccc";
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"8px 12px",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14"}}>
          <div style={{display:"flex",gap:8,marginBottom:7}}>
            <input className="inp" style={{flex:1}} placeholder="TUPRS, NVDA, XU100..." value={teknikSembol} onChange={e=>setTeknikSembol(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&teknikAnalizEt(teknikSembol)}/>
            <button className="btn-p" onClick={()=>teknikAnalizEt(teknikSembol)} disabled={!teknikSembol||teknikYukl} style={{padding:"8px 16px",fontSize:12,flexShrink:0}}>{teknikYukl?<Dots size={5}/>:"Göster"}</button>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["TUPRS","THYAO","EREGL","GARAN","XU100","NVDA","GLD"].map(s=>(
              <button key={s} className="qtag" onClick={()=>{setTeknikSembol(s);teknikAnalizEt(s);}} style={{fontSize:11,padding:"5px 10px"}}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
          {!teknikSembol&&!teknikVeri&&(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center",color:"#1e3040"}}><div style={{fontSize:36,opacity:.1}}>📊</div><div style={{fontSize:14,fontWeight:600,color:"#3a6050"}}>Teknik Analiz</div><div style={{fontSize:12,color:"#2a4050",lineHeight:1.7}}>TradingView grafiği + RSI, MACD, Destek/Direnç</div></div>)}
          {teknikYukl&&(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots/><div style={{fontSize:13,color:"#4a8a6a"}}>Yükleniyor...</div></div>)}
          {(teknikVeri||(teknikSembol&&!teknikYukl))&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
              <div style={{flex:1,minHeight:0,position:"relative"}}>
                <iframe key={tvSembol} src={`https://www.tradingview.com/widgetembed/?frameElementId=tv&symbol=${encodeURIComponent(tvSembol)}&interval=D&hidesidetoolbar=1&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=0f1318&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies&theme=dark&style=1&timezone=Europe%2FIstanbul&withdateranges=1&hidevolume=0&locale=tr`} style={{width:"100%",height:"100%",border:"none",display:"block"}} allowFullScreen/>
              </div>
              {teknikHata&&(<div style={{padding:"6px 12px",background:"#140e0a",borderTop:"1px solid #2a1a0a",fontSize:11,color:"#cc8844"}}>⚠ {teknikHata}</div>)}
              {t&&(
                <div style={{flexShrink:0,borderTop:"1px solid #1a2530",background:"#0b0f14",padding:"8px 10px",overflowX:"auto"}}>
                  <div style={{display:"flex",gap:6,minWidth:"max-content"}}>
                    <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",minWidth:80}}>
                      <div style={{fontSize:9,color:"#3a6050",fontWeight:600,textTransform:"uppercase"}}>Fiyat</div>
                      <div style={{fontSize:15,fontWeight:700,color:"#e0f0e8",fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{t.fiyat}</div>
                      <div style={{fontSize:9,fontWeight:600,marginTop:2,color:t.trend==="YÜKSELİŞ"?"#50dd90":t.trend==="DÜŞÜŞ"?"#ff7070":"#8090cc"}}>{t.trend==="YÜKSELİŞ"?"▲":t.trend==="DÜŞÜŞ"?"▼":"◆"} {t.trend}</div>
                    </div>
                    <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",minWidth:80}}>
                      <div style={{fontSize:9,color:"#3a6050",fontWeight:600,textTransform:"uppercase"}}>RSI 14</div>
                      <div style={{fontSize:15,fontWeight:700,color:rsiRenk,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{t.rsi}</div>
                      <div style={{fontSize:9,color:rsiRenk,marginTop:2}}>{t.rsiYorum}</div>
                    </div>
                    <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",minWidth:90}}>
                      <div style={{fontSize:9,color:"#3a6050",fontWeight:600,textTransform:"uppercase"}}>MACD</div>
                      <div style={{fontSize:12,fontWeight:700,color:macdRenk,fontFamily:"'JetBrains Mono',monospace",marginTop:2}}>{t.macd.deger}</div>
                      <div style={{fontSize:9,color:macdRenk,marginTop:2}}>{t.macdYorum}</div>
                    </div>
                    <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",minWidth:130}}>
                      <div style={{fontSize:9,color:"#3a6050",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>D&S</div>
                      <div style={{display:"flex",gap:6}}>
                        {[{l:"D2",v:t.seviyeler.direnc2,c:"#ff6060"},{l:"D1",v:t.seviyeler.direnc1,c:"#ff9060"},{l:"P",v:t.seviyeler.pivot,c:"#80c0cc"},{l:"S1",v:t.seviyeler.destek1,c:"#60cc80"},{l:"S2",v:t.seviyeler.destek2,c:"#40aa60"}].map(({l,v,c})=>(
                          <div key={l} style={{textAlign:"center"}}><div style={{fontSize:8,color:c,fontWeight:700}}>{l}</div><div style={{fontSize:9,color:"#c0d8e0",fontFamily:"'JetBrains Mono',monospace"}}>{v}</div></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const RaporPaneli = ()=>(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 12px",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:0,borderRadius:6,overflow:"hidden",border:"1px solid #1e2d38"}}>
            <button onClick={()=>setRaporTip("gunluk")} style={{padding:"6px 12px",fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",background:raporTip==="gunluk"?"#0e2a1a":"#101820",color:raporTip==="gunluk"?"#6abf90":"#3a6050",border:"none",cursor:"pointer"}}>📊 Günlük</button>
            <button onClick={()=>setRaporTip("haftalik")} style={{padding:"6px 12px",fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",background:raporTip==="haftalik"?"#0e2a1a":"#101820",color:raporTip==="haftalik"?"#6abf90":"#3a6050",border:"none",borderLeft:"1px solid #1e2d38",cursor:"pointer"}}>📅 Haftalık</button>
          </div>
          <button className="btn-p" onClick={raporUret} disabled={raporYukl||!haberler.length} style={{padding:"7px 14px",fontSize:12,flex:1}}>
            {raporYukl?<><Dots size={5}/> Hazırlanıyor...</>:"🚀 Rapor Üret"}
          </button>
        </div>
        {dovizKurlari?.kurlar?.USDTRY&&(<div style={{fontSize:10,color:"#2a5040"}}>💱 USD/TRY {dovizKurlari.kurlar.USDTRY} · EUR/TRY {dovizKurlari.kurlar.EURTRY} · Altın ${dovizKurlari.kurlar.ALTIN}</div>)}
      </div>
      {raporVeri&&(
        <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0c1410",overflowX:"auto"}}>
          {[{key:"llama",isim:"Llama",logo:"🦙",renk:"#c07ae0"},{key:"gpt",isim:"GPT-4o",logo:"⬡",renk:"#10a37f"},{key:"claude",isim:"Claude",logo:"✦",renk:"#4a8af0"}].map(ai=>(
            <button key={ai.key} className="ai-tab" onClick={()=>setRaporAktifAI(ai.key)} style={{color:raporAktifAI===ai.key?ai.renk:"#3a5060",borderBottomColor:raporAktifAI===ai.key?ai.renk:"transparent",padding:"7px 12px"}}>
              {ai.logo} {ai.isim}
              {!raporYukl&&raporVeri[ai.key]?.text&&<span style={{marginLeft:4,fontSize:9,color:"#3a7050"}}>✓</span>}
              {!raporYukl&&raporVeri[ai.key]?.error&&<span style={{marginLeft:4,fontSize:9,color:"#cc5050"}}>✗</span>}
            </button>
          ))}
        </div>
      )}
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px",WebkitOverflowScrolling:"touch"}}>
        {!raporVeri&&!raporYukl&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:14,textAlign:"center"}}>
            <div style={{fontSize:36,opacity:.08}}>📋</div>
            <div style={{fontSize:14,fontWeight:600,color:"#4a6040"}}>Profesyonel Piyasa Raporu</div>
            <div style={{fontSize:12,color:"#2a4030",lineHeight:1.8,maxWidth:320}}>
              <strong style={{color:"#5a8050"}}>Günlük:</strong> Günün haberleri + canlı piyasa + döviz kurlarıyla Goldman Sachs kalitesinde brifing.<br/><br/>
              <strong style={{color:"#5a8050"}}>Haftalık:</strong> 7 günlük birikmiş haberler, portföy stratejisi, gelecek hafta takvimi.
            </div>
            {dovizKurlari?.kurlar&&(<div style={{background:"#0d1520",border:"1px solid #1e3a28",borderRadius:6,padding:"10px 14px",fontSize:11,color:"#4a8060"}}>
              <div style={{fontWeight:600,marginBottom:4,color:"#5aaa70"}}>💱 Canlı Kurlar Hazır</div>
              USD/TRY: <strong style={{color:"#80d090"}}>{dovizKurlari.kurlar.USDTRY}</strong> · EUR/TRY: <strong style={{color:"#80d090"}}>{dovizKurlari.kurlar.EURTRY}</strong>
              <div style={{fontSize:9,color:"#2a5030",marginTop:2}}>Kaynak: {dovizKurlari.kurlar.kaynak}</div>
            </div>)}
          </div>
        )}
        {raporYukl&&(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70%",gap:14}}><Dots color="#f0b040"/><div style={{fontSize:13,fontWeight:600,color:"#b09030"}}>{raporTip==="haftalik"?"Haftalık rapor...":"Gün sonu raporu..."}</div><div style={{fontSize:11,color:"#604020",textAlign:"center",lineHeight:1.7}}>{haberler.length} haber analiz ediliyor.<br/>30-60 saniye sürebilir.</div></div>)}
        {raporVeri&&!raporYukl&&(()=>{
          const aktif=raporVeri[raporAktifAI];
          if(!aktif)return null;
          if(aktif.error)return(<div style={{padding:12,background:"#180808",border:"1px solid #3a1010",borderRadius:6,color:"#e07070",fontSize:12}}>❌ {aktif.error}</div>);
          return(
            <div style={{animation:"fadein .3s ease"}}>
              {raporVeri.piyasa?.endeksler&&(<div style={{background:"#0d1520",border:"1px solid #1e3040",borderRadius:6,padding:"10px 12px",marginBottom:14,overflowX:"auto"}}>
                <div style={{fontSize:9,fontWeight:600,color:"#3a6050",textTransform:"uppercase",marginBottom:7}}>Canlı Veriler</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {Object.entries(raporVeri.piyasa.endeksler).map(([isim,v])=>(<div key={isim} style={{background:"#101820",borderRadius:4,padding:"3px 8px",fontSize:10}}><span style={{color:"#4a6878"}}>{isim}</span><span style={{color:"#c0d8e4",fontWeight:600,marginLeft:4,fontFamily:"'JetBrains Mono',monospace"}}>{typeof v.fiyat==="number"?v.fiyat.toLocaleString("tr-TR",{maximumFractionDigits:0}):v.fiyat}</span>{v.degisim!==undefined&&<span style={{color:Number(v.degisim)>=0?"#44aa70":"#cc5555",marginLeft:3,fontSize:9}}>{Number(v.degisim)>=0?"+":""}{v.degisim}%</span>}</div>))}
                </div>
              </div>)}
              <div style={{fontSize:13,lineHeight:2,color:"#a8c4cc"}} dangerouslySetInnerHTML={{__html:md(aktif.text)}}/>
            </div>
          );
        })()}
      </div>
    </div>
  );

  const DigerPaneli = ()=>(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
        {[["portfoy","💼 Portföy"],["manuel","✏️ Manuel"],["korelasyon","🔗 Korelasyon"],["takvim","📅 Takvim"],["gecmis","🕐 Geçmiş"]].map(([k,l])=>(
          <button key={k} className={`tab${digerAltSekme===k?" on":""}`} onClick={()=>setDigerAltSekme(k)} style={{whiteSpace:"nowrap",fontSize:11}}>{l}</button>
        ))}
      </div>

      {digerAltSekme==="portfoy"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          <div style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:8,padding:12,marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:600,color:"#2a5040",textTransform:"uppercase",letterSpacing:".04em",marginBottom:8}}>Yeni Pozisyon</div>
            <input className="inp" placeholder="Sembol — TUPRS, NVDA..." value={yeniHisse.sembol} onChange={e=>setYeniHisse(p=>({...p,sembol:e.target.value.toUpperCase()}))} style={{marginBottom:6}}/>
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={e=>setYeniHisse(p=>({...p,adet:e.target.value}))} style={{flex:1}}/>
              <input className="inp" placeholder="Maliyet ₺" type="number" value={yeniHisse.maliyet} onChange={e=>setYeniHisse(p=>({...p,maliyet:e.target.value}))} style={{flex:1}}/>
            </div>
            <button onClick={hisseEkle} className="btn-p" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>+ Ekle</button>
          </div>
          {portfoy.length===0?(<div style={{textAlign:"center",color:"#2a4050",fontSize:12,marginTop:16,lineHeight:1.8}}>Portföyünüz boş.<br/>Hisse ekleyerek başlayın.</div>):portfoy.map(h=>(
            <div key={h.id} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:15,color:"#70d8a0",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{h.sembol}</div><div style={{fontSize:10,color:"#2a5040",marginTop:2}}>{Number(h.adet).toLocaleString("tr-TR")} adet · ₺{Number(h.maliyet).toLocaleString("tr-TR")}</div></div>
              <div style={{display:"flex",gap:5}}>
                <button className="btn-sm" style={{borderColor:"#1e4a2a",color:"#5aaa70",background:"#0a1e12",padding:"6px 12px"}} onClick={()=>analizEt(`${h.sembol} hissesini analiz et, al/sat önerisi ver`,h.sembol)}>Analiz</button>
                <button className="btn-sm" style={{borderColor:"#3a1010",color:"#cc6060",background:"#150808",padding:"6px 12px"}} onClick={()=>setPortfoy(p=>p.filter(x=>x.id!==h.id))}>Sil</button>
              </div>
            </div>
          ))}
          {portfoy.length>0&&<div style={{fontSize:10,color:"#1e3040",textAlign:"center",marginTop:8}}>{portfoy.length} pozisyon · Otomatik kaydedilir</div>}
        </div>
      )}

      {digerAltSekme==="manuel"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#4a8060"}}>Haber veya gelişme gir</div>
          <textarea className="inp" value={manuel} onChange={e=>setManuel(e.target.value)} style={{flex:1,minHeight:120,resize:"none",lineHeight:1.6}} placeholder={"3 AI aynı anda analiz eder...\n\nÖrn: TCMB faizi 500 baz puan indirdi\nÖrn: Hürmüz Boğazı kapandı"}/>
          <button onClick={()=>{if(manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));}}} disabled={!manuel.trim()||analizDevam} className="btn-p" style={{width:"100%",padding:"12px"}}>
            {analizDevam?<><Dots size={5}/> Analiz ediliyor</>:"3 AI ile Analiz Et →"}
          </button>
          <div style={{borderTop:"1px solid #1a2530",paddingTop:10}}>
            <div style={{fontSize:10,color:"#2a4050",marginBottom:7,fontWeight:500}}>Hızlı örnekler</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","İran-İsrail savaşı","Altın rekor","Petrol 120$","BTC 100k"].map(t=>(
                <button key={t} className="qtag" onClick={()=>{setManuel(t);setSecilen(null);analizEt(t,t);}}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {digerAltSekme==="korelasyon"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div><div style={{fontSize:13,fontWeight:600,color:"#3a7080"}}>🔗 Korelasyon Hafızası</div><div style={{fontSize:10,color:"#2a4050",marginTop:2}}>Haber türü → hisse ilişkisi öğrenir</div></div>
            <button className="btn-sm" onClick={()=>setKorelasyon({})} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Sıfırla</button>
          </div>
          {Object.keys(korelasyon).length===0?(
            <div style={{textAlign:"center",padding:40,color:"#1e3040",fontSize:12,lineHeight:1.8}}>Henüz veri yok.<br/>Haber analiz yaptıkça otomatik öğrenir.</div>
          ):Object.entries(korelasyon).map(([kategori,hisseler])=>{
            const kr=KRENK[kategori]||KRENK["GENEL"];
            const sirali=Object.entries(hisseler).sort((a,b)=>b[1].toplam-a[1].toplam);
            return(
              <div key={kategori} style={{background:"#101820",border:`1px solid ${kr.border}`,borderRadius:7,padding:"10px 12px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                  <span className="badge" style={{background:kr.bg,color:kr.text,border:`1px solid ${kr.border}`}}>{kategori}</span>
                  <span style={{fontSize:10,color:"#3a5060"}}>{sirali.length} hisse</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {sirali.map(([sembol,data])=>{
                    const alOran=data.toplam>0?Math.round(data.al/data.toplam*100):0;
                    return(
                      <div key={sembol} onClick={()=>{setTeknikSembol(sembol);if(!isMasaustu){setAktifEkran("teknik");}else setSagTab("teknik");teknikAnalizEt(sembol);}} style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",cursor:"pointer",minWidth:80}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#70d8a0",fontFamily:"'JetBrains Mono',monospace"}}>{sembol}</div>
                        <div style={{fontSize:9,color:"#3a6050",marginTop:2}}>{data.toplam}x</div>
                        <div style={{display:"flex",gap:3,marginTop:3}}>
                          <span style={{fontSize:8,color:"#50cc80",background:"#0a2010",padding:"1px 4px",borderRadius:2}}>AL {alOran}%</span>
                          <span style={{fontSize:8,color:"#cc5050",background:"#200808",padding:"1px 4px",borderRadius:2}}>SAT {100-alOran}%</span>
                        </div>
                        <div style={{marginTop:4,height:3,borderRadius:2,background:"#200808",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${alOran}%`,background:"#50cc80",borderRadius:2}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {digerAltSekme==="takvim"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#3a6050",marginBottom:10}}>Ekonomik Takvim</div>
          {takvim.length===0?(<div style={{display:"flex",justifyContent:"center",marginTop:40}}><Dots/></div>):takvim.map(o=>{
            const tarih=new Date(o.tarih);const gecti=tarih<new Date();const er=ERENK[o.onem]||ERENK["DÜŞÜK"];
            return(
              <div key={o.id} onClick={()=>analizEt(`${o.baslik} yaklaşıyor, piyasa etkilerini analiz et`,o.baslik)}
                style={{background:gecti?"#0c1015":"#101820",border:`1px solid ${o.onem==="YÜKSEK"&&!gecti?"#381a1a":"#1c2c38"}`,borderRadius:6,padding:"10px 12px",marginBottom:6,cursor:"pointer",opacity:gecti?.45:1}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                      {o.ulke&&<span style={{fontSize:13}}>{o.ulke}</span>}
                      <span className="badge" style={{background:er.bg,color:er.text,border:`1px solid ${er.border}`}}>{o.onem}</span>
                      {gecti&&<span style={{fontSize:10,color:"#2a4a40"}}>✓ Tamamlandı</span>}
                    </div>
                    <div style={{fontSize:12,color:gecti?"#3a5060":"#90b4c0",fontWeight:500,lineHeight:1.4}}>{o.baslik}</div>
                    {o.ozet&&<div style={{fontSize:10,color:"#2a4050",marginTop:2}}>{o.ozet}</div>}
                  </div>
                  <div style={{flexShrink:0,textAlign:"right",paddingTop:2}}>
                    <div style={{fontSize:11,fontWeight:600,color:"#3a7060",fontFamily:"'JetBrains Mono',monospace"}}>{tarih.toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {digerAltSekme==="gecmis"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          {gecmis.length===0?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1e3040",fontSize:13}}>Henüz analiz yapılmadı</div>
          ):(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:600,color:"#3a6050"}}>Analiz Geçmişi</span>
                <button className="btn-sm" onClick={()=>setGecmis([])} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Temizle</button>
              </div>
              {gecmis.map(g=>(
                <div key={g.id} onClick={()=>{setAnalizler(g.analizler||{claude:g.analiz,gpt:null,gemini:null});setAnalizBaslik(g.baslik);setGoster(true);if(!isMasaustu){setAktifEkran("analiz");}else setSagTab("analiz");}}
                  style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer"}}>
                  <div style={{fontSize:12,color:"#80aab8",marginBottom:4,lineHeight:1.4,fontWeight:500}}>{g.baslik}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:5}}>
                      {Object.entries(AI_TEMA).map(([k,ai])=>(<span key={k} style={{fontSize:9,color:(g.analizler?.[k])?ai.renk:"#2a3a4a",fontWeight:600}}>{ai.logo}</span>))}
                    </div>
                    <span style={{fontSize:10,color:"#2a4050"}}>{g.tarih} {g.zaman}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );

  // ─── MASAÜSTÜ LAYOUT ──────────────────────────────────────────────────────
  const MasaustuLayout = ()=>(
    <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
      {/* Sol panel */}
      <div style={{width:310,flexShrink:0,borderRight:"1px solid #1a2530",display:"flex",flexDirection:"column",overflow:"hidden",background:"#0b0f14"}}>
        <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,paddingLeft:2}}>
          <button className={`tab${solTab==="akis"?" on":""}`} onClick={()=>setSolTab("akis")}>Haberler</button>
          <button className={`tab${solTab==="manuel"?" on":""}`} onClick={()=>setSolTab("manuel")}>Manuel</button>
          <button className={`tab${solTab==="portfoy"?" on":""}`} onClick={()=>setSolTab("portfoy")}>
            Portföy{portfoy.length>0&&<span style={{background:"#0e2a1a",color:"#5aaa7a",borderRadius:3,padding:"0 5px",marginLeft:4,fontSize:10}}>{portfoy.length}</span>}
          </button>
        </div>
        {solTab==="akis"&&<HaberListesi/>}
        {solTab==="manuel"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#4a8060"}}>Haber veya gelişme gir</div>
            <textarea className="inp" value={manuel} onChange={e=>setManuel(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey&&manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));}}} style={{flex:1,minHeight:110,resize:"none",lineHeight:1.6}} placeholder={"3 AI aynı anda analiz eder...\n\nÖrn: TCMB faizi 500 baz puan indirdi"}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,color:"#2a4050"}}>Ctrl + Enter</span>
              <button onClick={()=>{if(manuel.trim()){setSecilen(null);analizEt(manuel,manuel.slice(0,70));}}} disabled={!manuel.trim()||analizDevam} className="btn-p">
                {analizDevam?<><Dots size={5}/> Analiz ediliyor</>:"3 AI ile Analiz Et →"}
              </button>
            </div>
            <div style={{borderTop:"1px solid #1a2530",paddingTop:10}}>
              <div style={{fontSize:10,color:"#2a4050",marginBottom:7}}>Hızlı örnekler</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","İran-İsrail savaşı","Altın rekor","BTC 100k","Deprem İstanbul"].map(t=>(
                  <button key={t} className="qtag" onClick={()=>{setManuel(t);setSecilen(null);analizEt(t,t);}}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        {solTab==="portfoy"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
            <div style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:8,padding:12,display:"flex",flexDirection:"column",gap:7}}>
              <div style={{fontSize:10,fontWeight:600,color:"#2a5040",textTransform:"uppercase"}}>Yeni Pozisyon</div>
              <input className="inp" placeholder="Sembol — TUPRS, NVDA..." value={yeniHisse.sembol} onChange={e=>setYeniHisse(p=>({...p,sembol:e.target.value.toUpperCase()}))}/>
              <div style={{display:"flex",gap:6}}>
                <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={e=>setYeniHisse(p=>({...p,adet:e.target.value}))} style={{flex:1}}/>
                <input className="inp" placeholder="Maliyet ₺" type="number" value={yeniHisse.maliyet} onChange={e=>setYeniHisse(p=>({...p,maliyet:e.target.value}))} style={{flex:1}}/>
              </div>
              <button onClick={hisseEkle} className="btn-p" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>+ Ekle</button>
            </div>
            {portfoy.length===0?(<div style={{textAlign:"center",color:"#2a4050",fontSize:12,marginTop:16}}>Portföyünüz boş.</div>):portfoy.map(h=>(
              <div key={h.id} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"9px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:14,color:"#70d8a0",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{h.sembol}</div><div style={{fontSize:10,color:"#2a5040",marginTop:2}}>{Number(h.adet).toLocaleString("tr-TR")} adet · ₺{Number(h.maliyet).toLocaleString("tr-TR")}</div></div>
                <div style={{display:"flex",gap:5}}>
                  <button className="btn-sm" style={{borderColor:"#1e4a2a",color:"#5aaa70",background:"#0a1e12"}} onClick={()=>analizEt(`${h.sembol} hissesini analiz et, al/sat önerisi ver`,h.sembol)}>Analiz</button>
                  <button className="btn-sm" style={{borderColor:"#3a1010",color:"#cc6060",background:"#150808"}} onClick={()=>setPortfoy(p=>p.filter(x=>x.id!==h.id))}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Sağ panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <div style={{display:"flex",borderBottom:"1px solid #1a2530",background:"#0b0f14",flexShrink:0,paddingLeft:2,overflowX:"auto"}}>
          <button className={`tab${sagTab==="analiz"?" on":""}`} onClick={()=>setSagTab("analiz")}>3 AI Analiz {analizDevam&&<Dots size={4} color="#4a9a6a"/>}</button>
          <button className={`tab${sagTab==="teknik"?" on":""}`} onClick={()=>setSagTab("teknik")}>📊 Teknik</button>
          <button className={`tab${sagTab==="rapor"?" on":""}`} onClick={()=>setSagTab("rapor")}>📋 Rapor {raporYukl&&<Dots size={4} color="#f0b040"/>}</button>
          <button className={`tab${sagTab==="bulten"?" on":""}`} onClick={()=>setSagTab("bulten")}>📰 Bülten {bultenYukl&&<Dots size={4} color="#ffa040"/>}</button>
          <button className={`tab${sagTab==="korelasyon"?" on":""}`} onClick={()=>setSagTab("korelasyon")}>🔗 Korelasyon</button>
          <button className={`tab${sagTab==="gecmis"?" on":""}`} onClick={()=>setSagTab("gecmis")}>Geçmiş{gecmis.length>0&&<span style={{background:"#0e2a1a",color:"#5aaa7a",borderRadius:3,padding:"0 5px",marginLeft:4,fontSize:10}}>{gecmis.length}</span>}</button>
          <button className={`tab${sagTab==="takvim"?" on":""}`} onClick={()=>setSagTab("takvim")}>Takvim</button>
        </div>
        {sagTab==="analiz"&&<AnalizPaneli/>}
        {sagTab==="teknik"&&<TeknikPaneli/>}
        {sagTab==="rapor"&&<RaporPaneli/>}
        {sagTab==="bulten"&&<BultenPaneli/>}
        {sagTab==="korelasyon"&&(
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div><div style={{fontSize:13,fontWeight:600,color:"#3a7080"}}>🔗 Korelasyon Hafızası</div><div style={{fontSize:10,color:"#2a4050",marginTop:2}}>Haber türü → hisse ilişkisi</div></div>
              <button className="btn-sm" onClick={()=>setKorelasyon({})} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Sıfırla</button>
            </div>
            {Object.keys(korelasyon).length===0?(<div style={{textAlign:"center",padding:40,color:"#1e3040",fontSize:12,lineHeight:1.8}}>Henüz veri yok.<br/>Analiz yaptıkça öğrenir.</div>):Object.entries(korelasyon).map(([kategori,hisseler])=>{const kr=KRENK[kategori]||KRENK["GENEL"];const sirali=Object.entries(hisseler).sort((a,b)=>b[1].toplam-a[1].toplam);return(<div key={kategori} style={{background:"#101820",border:`1px solid ${kr.border}`,borderRadius:7,padding:"10px 12px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}><span className="badge" style={{background:kr.bg,color:kr.text,border:`1px solid ${kr.border}`}}>{kategori}</span><span style={{fontSize:10,color:"#3a5060"}}>{sirali.length} hisse</span></div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{sirali.map(([sembol,data])=>{const alOran=data.toplam>0?Math.round(data.al/data.toplam*100):0;return(<div key={sembol} onClick={()=>{setTeknikSembol(sembol);setSagTab("teknik");teknikAnalizEt(sembol);}} style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",cursor:"pointer",minWidth:80}}><div style={{fontSize:12,fontWeight:700,color:"#70d8a0",fontFamily:"'JetBrains Mono',monospace"}}>{sembol}</div><div style={{fontSize:9,color:"#3a6050",marginTop:2}}>{data.toplam}x</div><div style={{display:"flex",gap:3,marginTop:3}}><span style={{fontSize:8,color:"#50cc80",background:"#0a2010",padding:"1px 4px",borderRadius:2}}>AL {alOran}%</span><span style={{fontSize:8,color:"#cc5050",background:"#200808",padding:"1px 4px",borderRadius:2}}>SAT {100-alOran}%</span></div><div style={{marginTop:4,height:3,borderRadius:2,background:"#200808",overflow:"hidden"}}><div style={{height:"100%",width:`${alOran}%`,background:"#50cc80",borderRadius:2}}/></div></div>);})}</div></div>);})}
          </div>
        )}
        {sagTab==="gecmis"&&(
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
            {gecmis.length===0?(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1e3040",fontSize:13}}>Henüz analiz yapılmadı</div>):(<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontSize:13,fontWeight:600,color:"#3a6050"}}>Analiz Geçmişi</span><button className="btn-sm" onClick={()=>setGecmis([])} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Temizle</button></div>{gecmis.map(g=>(<div key={g.id} onClick={()=>{setAnalizler(g.analizler||{claude:g.analiz,gpt:null,gemini:null});setAnalizBaslik(g.baslik);setGoster(true);setSagTab("analiz");}} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer"}}><div style={{fontSize:12,color:"#80aab8",marginBottom:4,lineHeight:1.4,fontWeight:500}}>{g.baslik}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",gap:5}}>{Object.entries(AI_TEMA).map(([k,ai])=>(<span key={k} style={{fontSize:9,color:(g.analizler?.[k])?ai.renk:"#2a3a4a",fontWeight:600}}>{ai.logo} {ai.isim}</span>))}</div><span style={{fontSize:10,color:"#2a4050"}}>{g.tarih} {g.zaman}</span></div></div>))}</>)}
          </div>
        )}
        {sagTab==="takvim"&&(
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#3a6050",marginBottom:12}}>Ekonomik Takvim</div>
            {takvim.length===0?(<div style={{display:"flex",justifyContent:"center",marginTop:40}}><Dots/></div>):takvim.map(o=>{const tarih=new Date(o.tarih);const gecti=tarih<new Date();const er=ERENK[o.onem]||ERENK["DÜŞÜK"];return(<div key={o.id} onClick={()=>analizEt(`${o.baslik} yaklaşıyor, piyasa etkilerini analiz et`,o.baslik)} style={{background:gecti?"#0c1015":"#101820",border:`1px solid ${o.onem==="YÜKSEK"&&!gecti?"#381a1a":"#1c2c38"}`,borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer",opacity:gecti?.45:1}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><div style={{flex:1}}><div style={{display:"flex",gap:5,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>{o.ulke&&<span style={{fontSize:13}}>{o.ulke}</span>}<span className="badge" style={{background:er.bg,color:er.text,border:`1px solid ${er.border}`}}>{o.onem}</span>{gecti&&<span style={{fontSize:10,color:"#2a4a40"}}>✓</span>}</div><div style={{fontSize:12,color:gecti?"#3a5060":"#90b4c0",fontWeight:500,lineHeight:1.4}}>{o.baslik}</div></div><div style={{flexShrink:0,textAlign:"right"}}><div style={{fontSize:11,fontWeight:600,color:"#3a7060",fontFamily:"'JetBrains Mono',monospace"}}>{tarih.toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}</div></div></div></div>);})}
          </div>
        )}
      </div>
    </div>
  );

  // ─── MOBİL LAYOUT ──────────────────────────────────────────────────────────
  const MobilLayout = ()=>(
    <>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {aktifEkran==="haberler"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <HaberListesi/>
            {dovizKurlari?.kurlar?.USDTRY&&(
              <div style={{padding:"5px 10px",background:"#0a0e12",borderTop:"1px solid #1a2530",fontSize:10,color:"#2a5040",flexShrink:0,display:"flex",gap:8,flexWrap:"wrap"}}>
                <span>💱 USD/TRY <strong style={{color:"#50aa70"}}>{dovizKurlari.kurlar.USDTRY}</strong></span>
                <span>EUR/TRY <strong style={{color:"#50aa70"}}>{dovizKurlari.kurlar.EURTRY}</strong></span>
                <span>Au ${dovizKurlari.kurlar.ALTIN}</span>
              </div>
            )}
          </div>
        )}
        {aktifEkran==="analiz"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
              <button className={`tab${analizAltSekme==="3ai"?" on":""}`} onClick={()=>setAnalizAltSekme("3ai")} style={{whiteSpace:"nowrap"}}>3 AI {analizDevam&&<Dots size={4} color="#4a9a6a"/>}</button>
              <button className={`tab${analizAltSekme==="bulten"?" on":""}`} onClick={()=>setAnalizAltSekme("bulten")} style={{whiteSpace:"nowrap"}}>📰 Bülten {bultenYukl&&<Dots size={4} color="#ffa040"/>}</button>
              <button className={`tab${analizAltSekme==="gecmis"?" on":""}`} onClick={()=>setAnalizAltSekme("gecmis")} style={{whiteSpace:"nowrap"}}>🕐 Geçmiş{gecmis.length>0&&<span style={{background:"#0e2a1a",color:"#5aaa7a",borderRadius:3,padding:"0 4px",marginLeft:3,fontSize:9}}>{gecmis.length}</span>}</button>
            </div>
            {analizAltSekme==="3ai"&&<AnalizPaneli/>}
            {analizAltSekme==="bulten"&&<BultenPaneli/>}
            {analizAltSekme==="gecmis"&&(
              <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
                {gecmis.length===0?(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1e3040",fontSize:13}}>Henüz analiz yapılmadı</div>):(<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:13,fontWeight:600,color:"#3a6050"}}>Geçmiş</span><button className="btn-sm" onClick={()=>setGecmis([])} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Temizle</button></div>{gecmis.map(g=>(<div key={g.id} onClick={()=>{setAnalizler(g.analizler||{});setAnalizBaslik(g.baslik);setGoster(true);setAnalizAltSekme("3ai");}} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer"}}><div style={{fontSize:12,color:"#80aab8",marginBottom:4,lineHeight:1.4,fontWeight:500}}>{g.baslik}</div><div style={{display:"flex",justifyContent:"space-between"}}><div style={{display:"flex",gap:4}}>{Object.entries(AI_TEMA).map(([k,ai])=>(<span key={k} style={{fontSize:9,color:(g.analizler?.[k])?ai.renk:"#2a3a4a"}}>{ai.logo}</span>))}</div><span style={{fontSize:10,color:"#2a4050"}}>{g.zaman}</span></div></div>))}</>)}
              </div>
            )}
          </div>
        )}
        {aktifEkran==="teknik"&&<TeknikPaneli/>}
        {aktifEkran==="rapor"&&<RaporPaneli/>}
        {aktifEkran==="diger"&&<DigerPaneli/>}
      </div>

      {/* Alt Navigasyon */}
      <div style={{height:62,borderTop:"1px solid #1a2530",background:"#090d12",display:"flex",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {[
          {id:"haberler",label:"Haberler",icon:"📡",badge:haberler.length>0?haberler.length:null},
          {id:"analiz",label:"Analiz",icon:"🤖",badge:analizDevam?"●":null,badgeColor:"#4a9a6a"},
          {id:"teknik",label:"Teknik",icon:"📊",badge:null},
          {id:"rapor",label:"Rapor",icon:"📋",badge:raporYukl?"●":null,badgeColor:"#f0b040"},
          {id:"diger",label:"Diğer",icon:"⚙️",badge:portfoy.length>0?portfoy.length:null},
        ].map(({id,label,icon,badge,badgeColor})=>(
          <button key={id} onClick={()=>setAktifEkran(id)} style={{
            flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,
            background:"none",border:"none",cursor:"pointer",position:"relative",
            color:aktifEkran===id?"#4aaa70":"#3a5060",transition:"color .15s",fontFamily:"'Inter',sans-serif",
            paddingTop:8,
          }}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{fontSize:9,fontWeight:600,letterSpacing:".02em"}}>{label}</span>
            {badge&&<span style={{position:"absolute",top:5,right:"50%",transform:"translateX(12px)",background:badgeColor||"#2a6050",color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:8,fontWeight:700,minWidth:14,textAlign:"center"}}>{badge}</span>}
            {aktifEkran===id&&<span style={{position:"absolute",bottom:0,left:"25%",right:"25%",height:2,background:"#4aaa70",borderRadius:1}}/>}
          </button>
        ))}
      </div>
    </>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>BorsaRadar — 7/24 Finansal Analiz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
        <meta name="theme-color" content="#0f1318"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      </Head>

      <div style={{height:"100dvh",display:"flex",flexDirection:"column",background:"#0f1318",color:"#d4dde6",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
        <style>{`
          @keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
          @keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
          @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
          *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
          ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0f1318}
          ::-webkit-scrollbar-thumb{background:#2a3a4a;border-radius:4px}
          textarea:focus,input:focus{outline:none}
          .tab{background:none;border:none;font-family:'Inter',sans-serif;cursor:pointer;font-size:12px;font-weight:500;padding:10px 13px;color:#4a6a7a;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
          .tab:hover{color:#7a9aaa}.tab.on{color:#d8eef4;border-bottom-color:#4a9a7a}
          .hcard{border-radius:6px;transition:background .12s;cursor:pointer}
          .hcard:hover{background:#1a2530!important;border-color:#3a5a6a!important}
          .hcard.sel{background:#112218!important;border-color:#4a9a6a!important}
          .badge{display:inline-flex;align-items:center;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;letter-spacing:.02em;line-height:1.4}
          .mh2{font-size:13px;font-weight:700;color:#7ab8d0;margin:18px 0 8px;padding-bottom:5px;border-bottom:1px solid #1e3040}
          .mh3{font-size:12px;font-weight:600;color:#68aa88;margin:12px 0 5px;padding-left:9px;border-left:2px solid #3a8a5a}
          .mli{display:flex;gap:9px;margin:5px 0;line-height:1.65;font-size:12.5px;color:#b0c8d4}
          .mbull{color:#3a8a5a;flex-shrink:0}
          .inp{background:#161d24;border:1px solid #243040;color:#d4dde6;border-radius:6px;padding:10px 12px;font-size:14px;font-family:'Inter',sans-serif;width:100%;transition:border-color .15s}
          .inp:focus{border-color:#3a7a5a}.inp::placeholder{color:#304050}
          .btn-p{background:#142a1e;border:1px solid #3a7a5a;color:#6abf90;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;text-align:center}
          .btn-p:active{background:#1a3626}.btn-p:disabled{opacity:.3;cursor:not-allowed}
          .btn-sm{padding:6px 12px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;border:1px solid;transition:all .12s}
          .qtag{background:#141c24;border:1px solid #222e3a;color:#4a6a7a;padding:7px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s}
          .qtag:active{background:#1a2a34}.price-chip{display:inline-flex;align-items:center;gap:8px;padding:0 14px;font-size:11.5px;border-right:1px solid #1a2530;white-space:nowrap}
          .filtre-btn{background:none;border:1px solid #1e2e3a;border-radius:6px;color:#3a5a6a;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s}
          .filtre-btn.on{background:#0e2030;border-color:#3a6a8a;color:#70a8c8}
          .ai-tab{background:none;border:none;cursor:pointer;padding:9px 14px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
        `}</style>

        {/* HEADER */}
        <div style={{height:isMasaustu?46:50,padding:"0 14px",borderBottom:"1px solid #1a2530",background:"#0b0f14",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,paddingTop:"env(safe-area-inset-top)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",alignItems:"baseline",gap:1}}>
              <span style={{fontSize:"1.15rem",fontWeight:800,color:"#e0eef0",letterSpacing:"-.02em"}}>Borsa</span>
              <span style={{fontSize:"1.15rem",fontWeight:800,color:"#4aaa70",letterSpacing:"-.02em"}}>Radar</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#3aaa60",display:"inline-block",boxShadow:"0 0 6px #3aaa6088"}}/>
              <span style={{fontSize:10,color:"#4a8a60",fontWeight:500}}>Canlı</span>
            </div>
            {sonGun&&<span style={{fontSize:10,color:"#2a4a40"}}>· {sonGun}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {isMasaustu&&<span style={{fontSize:10,color:"#2a4050",fontFamily:"'JetBrains Mono',monospace"}}>↻ {fmtCD(cd)}</span>}
            {!isMasaustu&&(
              <button onClick={bultenUret} disabled={bultenYukl||!haberler.length} className="btn-sm" style={{borderColor:"#5a6030",color:"#aab860",background:"#1a1e08",padding:"5px 10px",fontSize:11}}>
                {bultenYukl?<Dots size={4} color="#aab860"/>:"📰"}
              </button>
            )}
            {!isMasaustu&&(
              <button onClick={raporUret} disabled={raporYukl||!haberler.length} className="btn-sm" style={{borderColor:"#3a7a5a",color:"#6abf90",background:"#0a1e12",padding:"5px 10px",fontSize:11}}>
                {raporYukl?<Dots size={4}/>:"📋"}
              </button>
            )}
            <button onClick={haberleriYukle} disabled={haberYukl} className="btn-p" style={{padding:"6px 14px",fontSize:11}}>
              {haberYukl?<Dots size={5}/>:"↻"}
            </button>
          </div>
        </div>

        {/* FİYAT ŞERİDİ */}
        <div style={{height:30,borderBottom:"1px solid #1a2530",background:"#0b0f14",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center"}}>
          {fiyatlar.length===0?(
            <div style={{paddingLeft:14,fontSize:10,color:"#2a4050",display:"flex",alignItems:"center",gap:6}}><Dots color="#2a4050" size={4}/><span>Yükleniyor...</span></div>
          ):(
            <div style={{display:"flex",animation:"ticker 40s linear infinite",alignItems:"center",height:"100%"}}>
              {[...fiyatlar,...fiyatlar].map((f,i)=>(
                <span key={i} className="price-chip">
                  <span style={{color:"#4a6878",fontWeight:500}}>{f.isim}</span>
                  <span style={{color:"#c0d8e4",fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{fmtFiyat(f.fiyat,f.sembol)}</span>
                  {f.degisim!==undefined&&f.degisim!==0&&(<span style={{color:f.degisim>=0?"#44aa70":"#cc5555",fontSize:9,fontWeight:600,background:f.degisim>=0?"#09200f":"#200909",padding:"1px 4px",borderRadius:3}}>{f.degisim>=0?"+":""}{(f.degisim||0).toFixed(2)}%</span>)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BODY */}
        {isMasaustu?<MasaustuLayout/>:<MobilLayout/>}

        {/* FOOTER — sadece masaüstünde */}
        {isMasaustu&&(
          <div style={{height:24,borderTop:"1px solid #1a2530",background:"#0b0f14",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",flexShrink:0}}>
            <span style={{fontSize:9,color:"#1e3040"}}>Bloomberg HT · Hürriyet · AA · Reuters · CNBC · WSJ | Yahoo Finance</span>
            <span style={{fontSize:9,color:"#1e3040"}}>⚠ Yatırım tavsiyesi değildir</span>
          </div>
        )}
      </div>
    </>
  );
}

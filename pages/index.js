// BorsaRadar v21 — sıfırdan yeniden yazıldı
import { useState, useEffect, useCallback, useRef, memo } from "react";
import Head from "next/head";

// ─── SABİTLER ─────────────────────────────────────────────────────────────────
const KAT_MAP={
  "JEOPOLİTİK":["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","savaş","gerilim","çatışma","kriz"],
  "ENERJİ":["oil","crude","gas","opec","energy","brent","wti","petrol","doğalgaz","barrel","lng","enerji"],
  "MERKEZ BANKASI":["fed","federal reserve","rate","interest","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb","merkez bankası"],
  "TEKNOLOJİ":["nvidia","apple","google","microsoft","amazon","meta","ai","chip","semiconductor","openai","tsmc","tesla","yapay zeka"],
  "TÜRKİYE":["turkey","turkish","lira","istanbul","ankara","bist","borsa","erdoğan","türkiye","hazine","tüfe"],
  "EMTİA":["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","emtia"],
  "KRİPTO":["bitcoin","crypto","ethereum","blockchain","btc","eth","kripto"],
  "PİYASA":["borsa","hisse","endeks","bist","rally","düşüş","yükseliş","kapanış","piyasa"],
};
const kategoriBul=t=>{const s=t.toLowerCase();for(const[k,ws]of Object.entries(KAT_MAP))if(ws.some(w=>s.includes(w)))return k;return"GENEL";};
const zamanFmt=d=>{try{const m=(Date.now()-new Date(d).getTime())/60000;if(m<60)return Math.floor(m)+"dk";if(m<1440)return Math.floor(m/60)+"sa";return Math.floor(m/1440)+"g";}catch{return"?";}};
const fmtFiyat=(f,s)=>{if(!f)return"—";if(s==="BTC-USD")return"$"+Math.round(f).toLocaleString("tr-TR");if(["^GSPC","^IXIC"].includes(s))return f.toLocaleString("tr-TR",{maximumFractionDigits:0});if(["USDTRY=X","EURTRY=X","GBPTRY=X"].includes(s))return"₺"+f.toFixed(2);if(s==="GC=F")return"$"+Math.round(f).toLocaleString();if(s==="BZ=F")return"$"+f.toFixed(1);if(s==="XU100.IS")return f.toLocaleString("tr-TR",{maximumFractionDigits:0});return f.toFixed(2);};
const md=t=>{if(!t)return"";return t.replace(/\*\*(.+?)\*\*/g,"<strong style='color:#f0f4f0;font-weight:600'>$1</strong>").replace(/\*(.+?)\*/g,"<em style='color:#b8d0c0'>$1</em>").replace(/^## (.+)$/gm,'<div class="mh2">$1</div>').replace(/^### (.+)$/gm,'<div class="mh3">$1</div>').replace(/^- (.+)$/gm,'<div class="mli"><span class="mbull">▸</span><span>$1</span></div>').replace(/\n\n/g,'<div style="height:10px"></div>').replace(/\n/g,"<br/>");};
const KR={"JEOPOLİTİK":{bg:"#2a1010",bd:"#5a2a2a",tx:"#f0a0a0"},"ENERJİ":{bg:"#261800",bd:"#5a3a00",tx:"#ffb74d"},"MERKEZ BANKASI":{bg:"#001828",bd:"#003a66",tx:"#80c8f0"},"TEKNOLOJİ":{bg:"#160e2a",bd:"#3e2870",tx:"#c0a8f0"},"TÜRKİYE":{bg:"#280808",bd:"#660000",tx:"#ff8a80"},"EMTİA":{bg:"#221c00",bd:"#554800",tx:"#ffd54f"},"KRİPTO":{bg:"#1c1400",bd:"#4a3800",tx:"#ffcc02"},"PİYASA":{bg:"#0c1e18",bd:"#1a4a38",tx:"#6dcca8"},"GENEL":{bg:"#121a22",bd:"#263444",tx:"#8aacbe"}};
const ER={"YÜKSEK":{bg:"#280808",tx:"#ff7070",bd:"#601818"},"ORTA":{bg:"#261800",tx:"#ff9944",bd:"#5a3c00"},"DÜŞÜK":{bg:"#081a08",tx:"#5aaa5a",bd:"#164016"}};
const AIT={claude:{isim:"Claude",renk:"#c07ae0",bg:"#180e26",bd:"#3a1e60",logo:"✦",alt:"Anthropic"},gpt:{isim:"GPT-4o Mini",renk:"#10a37f",bg:"#061a14",bd:"#0e3a2a",logo:"⬡",alt:"OpenAI"},gemini:{isim:"Llama 3.3",renk:"#4a8af0",bg:"#0a1428",bd:"#1a3466",logo:"🦙",alt:"Groq"}};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS=`
@keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
@keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{overflow:hidden;height:100%}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0f1318}::-webkit-scrollbar-thumb{background:#2a3a4a;border-radius:4px}
textarea:focus,input:focus{outline:none}
.tab{background:none;border:none;font-family:'Inter',sans-serif;cursor:pointer;font-size:12px;font-weight:500;padding:10px 13px;color:#4a6a7a;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
.tab:hover{color:#7a9aaa}.tab.on{color:#d8eef4;border-bottom-color:#4a9a7a}
.hcard{border-radius:6px;cursor:pointer;transition:background .1s,border-color .1s}.hcard:hover{background:#1a2530!important;border-color:#3a5a6a!important}.hcard.sel{background:#112218!important;border-color:#4a9a6a!important}
.badge{display:inline-flex;align-items:center;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;letter-spacing:.02em;line-height:1.4}
.mh2{font-size:13px;font-weight:700;color:#7ab8d0;margin:18px 0 8px;padding-bottom:5px;border-bottom:1px solid #1e3040}
.mh3{font-size:12px;font-weight:600;color:#68aa88;margin:12px 0 5px;padding-left:9px;border-left:2px solid #3a8a5a}
.mli{display:flex;gap:9px;margin:5px 0;line-height:1.65;font-size:12.5px;color:#b0c8d4}.mbull{color:#3a8a5a;flex-shrink:0}
.inp{background:#161d24;border:1px solid #243040;color:#d4dde6;border-radius:6px;padding:10px 12px;font-size:14px;font-family:'Inter',sans-serif;width:100%;transition:border-color .15s}
.inp:focus{border-color:#3a7a5a}.inp::placeholder{color:#304050}
.btn-p{background:#142a1e;border:1px solid #3a7a5a;color:#6abf90;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.btn-p:disabled{opacity:.3;cursor:not-allowed}
.btn-sm{padding:6px 12px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;border:1px solid;transition:all .12s}
.qtag{background:#141c24;border:1px solid #222e3a;color:#4a6a7a;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif}
.price-chip{display:inline-flex;align-items:center;gap:8px;padding:0 14px;font-size:11.5px;border-right:1px solid #1a2530;white-space:nowrap}
.fb{background:none;border:1px solid #1e2e3a;border-radius:6px;color:#3a5a6a;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif}
.fb.on{background:#0e2030;border-color:#3a6a8a;color:#70a8c8}
.aitab{background:none;border:none;cursor:pointer;padding:8px 14px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap}
.sb{height:4px;border-radius:2px;background:#1a2530;overflow:hidden}
.sbf{height:100%;border-radius:2px;transition:width .5s}
.layout{flex:1;display:flex;overflow:hidden;min-height:0}
.sol{width:310px;flex-shrink:0;border-right:1px solid #1a2530;display:flex;flex-direction:column;overflow:hidden;background:#0b0f14}
.sag{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.mob-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.mob-nav{height:58px;border-top:1px solid #1a2530;background:#090d12;display:flex;flex-shrink:0;padding-bottom:env(safe-area-inset-bottom)}
.desk-footer{height:24px;border-top:1px solid #1a2530;background:#0b0f14;display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0}
@media(min-width:900px){
  .layout{display:flex}
  .mob-body,.mob-nav{display:none!important}
  .desk-footer{display:flex!important}
}
@media(max-width:899px){
  .layout{display:none!important}
  .mob-body{display:flex}
  .mob-nav{display:flex}
  .desk-footer{display:none!important}
  .desk-haber-cd,.desk-only{display:none!important}
  .mob-quick{display:flex!important}
}
.mob-quick{display:none;align-items:center;gap:7px}
`;

// ─── YARDIMCI ─────────────────────────────────────────────────────────────────
const Dots=memo(function Dots({color,size}){
  const c=color||"#4a9a6a",s=size||6;
  return(
    <span style={{display:"inline-flex",gap:4,alignItems:"center",verticalAlign:"middle"}}>
      {[0,1,2].map(function(i){return <span key={i} style={{width:s,height:s,borderRadius:"50%",background:c,display:"inline-block",animation:"dp 1.3s "+(i*.22)+"s infinite"}}/>;})
      }
    </span>
  );
});

// ─── HABER LİSTESİ ────────────────────────────────────────────────────────────
const HaberListesi=memo(function HaberListesi({haberler,yukl,hata,filtre,setFiltre,secilenId,onClick,onYenile}){
  const liste=haberler.filter(function(h){return filtre==="TR"?h.dil==="tr":filtre==="EN"?h.dil==="en":true;});
  return(
    <>
      <div style={{padding:"6px 10px",borderBottom:"1px solid #1a2530",display:"flex",gap:5,alignItems:"center",flexShrink:0,background:"#0b0f14"}}>
        {["TÜMÜ","TR","EN"].map(function(f){return <button key={f} className={"fb"+(filtre===f?" on":"")} onClick={function(){setFiltre(f);}}>{f}</button>;})
        }
        <span style={{fontSize:10,color:"#2a4050",marginLeft:"auto"}}>{liste.length}</span>
        <button onClick={onYenile} className="btn-sm" style={{borderColor:"#1e3a2a",color:"#4a8a60",background:"#0a1810",padding:"4px 10px"}}>{yukl?<Dots size={4}/>:"↻"}</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 8px",WebkitOverflowScrolling:"touch"}}>
        {yukl&&liste.length===0&&<div style={{padding:28,textAlign:"center"}}><Dots/><div style={{marginTop:10,fontSize:12,color:"#4a7060"}}>Yükleniyor...</div></div>}
        {hata&&!yukl&&<div style={{margin:8,padding:12,background:"#180808",border:"1px solid #401818",borderRadius:6,color:"#e07070",fontSize:12}}>⚠ {hata}</div>}
        {liste.map(function(h,i){
          var kr=KR[h.kategori]||KR["GENEL"],er=ER[h.etki]||ER["DÜŞÜK"];
          return(
            <div key={h.id} className={"hcard"+(secilenId===h.id?" sel":"")} onClick={function(){onClick(h);}}
              style={{background:"#101820",border:"1px solid #1c2c38",padding:"10px",marginBottom:5,animation:"fadein .18s ease "+(Math.min(i*.015,.35))+"s both"}}>
              <div style={{display:"flex",gap:4,marginBottom:5,alignItems:"center",flexWrap:"wrap"}}>
                <span className="badge" style={{background:kr.bg,color:kr.tx,border:"1px solid "+kr.bd}}>{h.kategori}</span>
                <span className="badge" style={{background:er.bg,color:er.tx,border:"1px solid "+er.bd}}>{h.etki}</span>
                {h.dil==="tr"&&<span className="badge" style={{background:"#1a0808",color:"#e05050",border:"1px solid #3a1010"}}>TR</span>}
                <span style={{marginLeft:"auto",fontSize:14,fontWeight:700,color:h.yon==="POZİTİF"?"#44aa70":h.yon==="NEGATİF"?"#cc5555":"#cc8830"}}>{h.yon==="POZİTİF"?"▲":h.yon==="NEGATİF"?"▼":"◆"}</span>
              </div>
              <div style={{fontSize:13,color:secilenId===h.id?"#c0eedd":"#90b0bc",lineHeight:1.5,marginBottom:4,fontWeight:secilenId===h.id?500:400}}>{h.baslik}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#304858"}}>
                <span>{h.kaynak}</span><span>{zamanFmt(h.tarih)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
});

// ─── TAHMİN EKLE BUTONU ───────────────────────────────────────────────────────
const TahminEkleButon=memo(function TahminEkleButon({aiId,analizMetni,onEkle}){
  var _s=useState(false),acik=_s[0],setAcik=_s[1];
  var _sm=useState(""),sembol=_sm[0],setSembol=_sm[1];
  var _y=useState("AL"),yon=_y[0],setYon=_y[1];
  var _h=useState(""),hedef=_h[0],setHedef=_h[1];
  var _l=useState(false),yukl=_l[0],setYukl=_l[1];

  var ekle=useCallback(function(){
    if(!sembol)return;
    setYukl(true);
    fetch("/api/sim-fiyat?sembol="+encodeURIComponent(sembol))
      .then(function(r){return r.json();})
      .then(function(d){
        setYukl(false);
        var girisFiyat=d&&d.fiyat?d.fiyat:null;
        var para=d&&d.para?d.para:"TRY";
        if(onEkle)onEkle(sembol,yon,hedef?parseFloat(hedef):null,aiId,analizMetni?String(analizMetni).slice(0,100):null,girisFiyat,para);
        setSembol("");setHedef("");setAcik(false);
      })
      .catch(function(){
        setYukl(false);
        if(onEkle)onEkle(sembol,yon,hedef?parseFloat(hedef):null,aiId,null,null,"TRY");
        setSembol("");setHedef("");setAcik(false);
      });
  },[sembol,yon,hedef,aiId,analizMetni,onEkle]);

  if(!acik){
    return(
      <button onClick={function(){setAcik(true);}} style={{fontSize:10,padding:"4px 10px",background:"#1a2d1a",border:"1px solid #3a6a3a",borderRadius:5,color:"#60cc80",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
        📌 Takibe Al
      </button>
    );
  }
  return(
    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
      <input placeholder="SEMBOL" value={sembol} onChange={function(e){setSembol(e.target.value.toUpperCase());}}
        style={{width:70,fontSize:11,padding:"3px 6px",background:"#0a1520",border:"1px solid #2a4050",borderRadius:4,color:"#c0d8e4",outline:"none",fontFamily:"monospace"}}/>
      <select value={yon} onChange={function(e){setYon(e.target.value);}}
        style={{fontSize:11,padding:"3px 6px",background:"#0a1520",border:"1px solid #2a4050",borderRadius:4,color:yon==="AL"?"#50dd90":"#ff7070",outline:"none"}}>
        <option value="AL">AL</option>
        <option value="SAT">SAT</option>
      </select>
      <input placeholder="Hedef%" value={hedef} onChange={function(e){setHedef(e.target.value);}}
        style={{width:55,fontSize:11,padding:"3px 6px",background:"#0a1520",border:"1px solid #2a4050",borderRadius:4,color:"#c0d8e4",outline:"none"}}/>
      <button onClick={ekle} disabled={!sembol||yukl}
        style={{fontSize:10,padding:"4px 10px",background:"#1a3a20",border:"1px solid #3a7a40",borderRadius:4,color:"#60dd80",cursor:"pointer"}}>
        {yukl?"...":"✓ Ekle"}
      </button>
      <button onClick={function(){setAcik(false);}}
        style={{fontSize:10,padding:"4px 8px",background:"none",border:"1px solid #2a3a40",borderRadius:4,color:"#3a5060",cursor:"pointer"}}>✕</button>
    </div>
  );
});

// ─── ANALİZ PANELİ ────────────────────────────────────────────────────────────
const AnalizPaneli=memo(function AnalizPaneli({analizler,analizYukl,baslik,aktif,setAktif,goster,onTahminEkle}){
  if(!goster&&!Object.values(analizYukl).some(function(v){return v;})){
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,textAlign:"center",padding:24}}>
        <div style={{display:"flex",gap:12}}>{Object.values(AIT).map(function(ai){return <div key={ai.isim} style={{width:52,height:52,borderRadius:12,background:ai.bg,border:"2px solid "+ai.bd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:ai.renk}}>{ai.logo}</div>;})}</div>
        <div style={{fontSize:15,fontWeight:600,color:"#3a6050"}}>3 AI Paralel Analiz</div>
        <div style={{fontSize:12,color:"#2a4050",lineHeight:1.7}}>Haber seç · Manuel gir · Portföy analizi</div>
      </div>
    );
  }
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1520",overflowX:"auto"}}>
        {Object.entries(AIT).map(function(entry){
          var key=entry[0],ai=entry[1];
          return(
            <button key={key} className="aitab" onClick={function(){setAktif(key);}}
              style={{color:aktif===key?ai.renk:"#3a5060",borderBottomColor:aktif===key?ai.renk:"transparent",display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"8px 14px",minWidth:80}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                {ai.logo} <span style={{fontSize:11}}>{ai.isim}</span>
                {analizYukl[key]&&<Dots color={ai.renk} size={4}/>}
                {!analizYukl[key]&&analizler[key]&&<span style={{fontSize:9,color:"#3a7050"}}>✓</span>}
              </div>
              <div style={{fontSize:8,color:aktif===key?ai.renk+"99":"#1e3040",marginTop:1}}>{ai.alt}</div>
            </button>
          );
        })}
        {baslik&&<div style={{flex:1,display:"flex",alignItems:"center",overflow:"hidden",paddingRight:10}}><span style={{fontSize:10,color:"#2a4050",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginLeft:8,fontStyle:"italic"}}>{baslik}</span></div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",WebkitOverflowScrolling:"touch"}}>
        {analizYukl[aktif]&&!analizler[aktif]?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}>
            <Dots color={AIT[aktif].renk}/>
            <div style={{fontSize:13,fontWeight:500,color:AIT[aktif].renk}}>{AIT[aktif].isim} analiz ediyor...</div>
          </div>
        ):analizler[aktif]?(
          <div style={{animation:"fadein .3s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:16,padding:"8px 12px",borderRadius:6,background:AIT[aktif].bg,border:"1px solid "+AIT[aktif].bd}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16,color:AIT[aktif].renk}}>{AIT[aktif].logo}</span>
                <span style={{fontSize:12,fontWeight:600,color:AIT[aktif].renk}}>{AIT[aktif].isim}</span>
              </div>
              {onTahminEkle&&<TahminEkleButon aiId={aktif} analizMetni={analizler[aktif]} onEkle={onTahminEkle}/>}
            </div>
            <div style={{fontSize:13,lineHeight:1.85,color:"#a8c4cc"}} dangerouslySetInnerHTML={{__html:md(analizler[aktif])}}/>
          </div>
        ):(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",color:"#1e3040",fontSize:12}}>Bu AI için analiz bekleniyor...</div>
        )}
      </div>
    </div>
  );
});

// ─── İSTİHBARAT PANELİ ───────────────────────────────────────────────────────
const IstihbaratPaneli=memo(function IstihbaratPaneli(props){
  var duygu=props.duygu||null;
  var duyguYukl=props.duyguYukl||false;
  var onDuyguHesapla=props.onDuyguHesapla;
  var sektor=props.sektor||null;
  var sektorYukl=props.sektorYukl||false;
  var zamanlama=props.zamanlama||null;
  var zamanlamaYukl=props.zamanlamaYukl||false;
  var onZamanlamaHesapla=props.onZamanlamaHesapla;
  var zamanlamaSembol=props.zamanlamaSembol||"";
  var setZamanlamaSembol=props.setZamanlamaSembol;
  var tahminler=props.tahminler||[];
  var onTahminGuncelle=props.onTahminGuncelle;
  var tahminGuncYukl=props.tahminGuncYukl||false;
  var aktifTab=props.aktifTab||"duygu";
  var setAktifTab=props.setAktifTab;
  var haberler=props.haberler||[];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Sekmeler */}
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
        {[["duygu","🧠 Duygu"],["sektor","🗺 Sektör"],["zamanlama","⏱ Zamanlama"],["tahmin","🎯 Tahmin"]].map(function(item){
          return <button key={item[0]} className={"tab"+(aktifTab===item[0]?" on":"")} onClick={function(){setAktifTab(item[0]);}} style={{fontSize:11}}>{item[1]}</button>;
        })}
      </div>

      {/* ── DUYGU ── */}
      {aktifTab==="duygu"&&(
        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:"#4a8090"}}>🧠 Piyasa Duygu Endeksi</div>
            <button onClick={onDuyguHesapla} disabled={duyguYukl||haberler.length===0} className="btn-p" style={{padding:"6px 14px",fontSize:11}}>
              {duyguYukl?<Dots size={4}/>:"Hesapla"}
            </button>
          </div>
          {!duygu&&!duyguYukl&&(
            <div style={{textAlign:"center",padding:40,color:"#2a4050",lineHeight:2,fontSize:12}}>
              <div style={{fontSize:32,opacity:.1,marginBottom:8}}>🧠</div>
              Son haberlerin tonunu analiz eder
            </div>
          )}
          {duyguYukl&&<div style={{display:"flex",justifyContent:"center",padding:40}}><Dots color="#80a8c0"/></div>}
          {duygu&&!duyguYukl&&(
            <div>
              <div style={{background:"#0d1520",border:"1px solid #2a4050",borderRadius:12,padding:20,marginBottom:14,textAlign:"center"}}>
                <div style={{position:"relative",height:14,background:"linear-gradient(to right,#4488ff,#aaaaaa,#ff4444)",borderRadius:7,marginBottom:12}}>
                  <div style={{position:"absolute",top:"50%",left:(duygu.endeks||50)+"%",transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:"50%",background:"#fff",border:"3px solid #0f1318"}}/>
                </div>
                <div style={{fontSize:28,fontWeight:900,color:duygu.renk||"#aaa",fontFamily:"monospace",marginBottom:4}}>{duygu.endeks||0}</div>
                <div style={{fontSize:15,fontWeight:700,color:duygu.renk||"#aaa",marginBottom:6}}>{duygu.etiket||""}</div>
                <div style={{fontSize:11,color:"#8ab0b8",lineHeight:1.6}}>{duygu.aciklama||""}</div>
              </div>
              {duygu.kategoriSkolar&&duygu.kategoriSkolar.length>0&&(
                <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:8,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#4a8090",marginBottom:8}}>Kategori Dağılımı</div>
                  {duygu.kategoriSkolar.slice(0,6).map(function(k){
                    return(
                      <div key={k.kategori||Math.random()} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{width:90,fontSize:10,color:"#4a7080",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k.kategori||""}</div>
                        <div style={{flex:1,height:5,background:"#1a2530",borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:Math.min(100,Math.abs(k.skor||0))+"%",height:"100%",background:(k.skor||0)>0?"#50dd90":"#ff7070",borderRadius:3}}/>
                        </div>
                        <div style={{fontSize:10,color:(k.skor||0)>0?"#50dd90":"#ff7070",fontFamily:"monospace",width:32,textAlign:"right"}}>{(k.skor||0)>0?"+":""}{k.skor||0}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SEKTÖR ── */}
      {aktifTab==="sektor"&&(
        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          {!sektor&&!sektorYukl&&(
            <div style={{textAlign:"center",padding:40,color:"#2a4050",lineHeight:2,fontSize:12}}>
              <div style={{fontSize:32,opacity:.1,marginBottom:8}}>🗺</div>
              Bir haberi analiz et — etkilenen sektörler listelenir
            </div>
          )}
          {sektorYukl&&<div style={{display:"flex",justifyContent:"center",padding:40}}><Dots color="#80c0a0"/></div>}
          {sektor&&!sektorYukl&&(
            <div>
              <div style={{fontSize:11,color:"#4a7080",marginBottom:10}}>
                {sektor.sektorSayisi||0} sektör · {(sektor.onerilenHisseler||[]).length} hisse
              </div>
              {(sektor.onerilenHisseler||[]).map(function(h,i){
                var eRenk=h.etki==="DOĞRUDAN"?"#ff9060":h.etki==="POZİTİF"?"#50dd90":h.etki==="TERS"?"#ff7070":"#ffcc44";
                return(
                  <div key={i} style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:800,color:"#70d8a0",fontFamily:"monospace"}}>{h.sembol||""}</span>
                      <span style={{fontSize:11,color:"#4a6070"}}>{h.isim||""}</span>
                      <span style={{fontSize:9,fontWeight:700,color:eRenk,background:eRenk+"20",padding:"1px 6px",borderRadius:4}}>{h.etki||""}</span>
                    </div>
                    <div style={{fontSize:11,color:"#5a8090",lineHeight:1.5}}>{h.aciklama||""}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ZAMANLAMA ── */}
      {aktifTab==="zamanlama"&&(
        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:"#4a8090",marginBottom:6}}>Fiyat Penceresi — Haber fiyatlandı mı?</div>
            <div style={{display:"flex",gap:8}}>
              <input className="inp" style={{flex:1}} placeholder="GARAN, NVDA, BTC-USD..."
                value={zamanlamaSembol}
                onChange={function(e){setZamanlamaSembol(e.target.value.toUpperCase());}}
                onKeyDown={function(e){if(e.key==="Enter"&&zamanlamaSembol)onZamanlamaHesapla(zamanlamaSembol);}}
              />
              <button className="btn-p" onClick={function(){if(zamanlamaSembol)onZamanlamaHesapla(zamanlamaSembol);}} disabled={!zamanlamaSembol||zamanlamaYukl} style={{padding:"8px 14px",fontSize:12,flexShrink:0}}>
                {zamanlamaYukl?<Dots size={5}/>:"Analiz"}
              </button>
            </div>
          </div>
          {zamanlamaYukl&&<div style={{display:"flex",justifyContent:"center",padding:40}}><Dots color="#80b0c0"/></div>}
          {zamanlama&&!zamanlamaYukl&&(
            <div>
              <div style={{background:"#0d1520",border:"1px solid #2a5060",borderRadius:10,padding:14,marginBottom:10,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#3a6070",marginBottom:6}}>
                  {zamanlama.sembol||""} · {zamanlama.para==="USD"?"$":"₺"}{zamanlama.sonFiyat||"—"}
                </div>
                <div style={{fontSize:16,fontWeight:800,color:zamanlama.pencereRenk||"#aaa",marginBottom:10}}>
                  {zamanlama.pencere||"—"}
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                  <div style={{textAlign:"center",padding:"8px 14px",background:"#00000030",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#3a6070"}}>4s Degisim</div>
                    <div style={{fontSize:16,fontWeight:700,color:(zamanlama.degisim4s||0)>=0?"#50dd90":"#ff7070",fontFamily:"monospace"}}>{(zamanlama.degisim4s||0)>=0?"+":""}{zamanlama.degisim4s||0}%</div>
                  </div>
                  <div style={{textAlign:"center",padding:"8px 14px",background:"#00000030",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#3a6070"}}>Hacim/Ort</div>
                    <div style={{fontSize:16,fontWeight:700,color:(zamanlama.hacimOrani||1)>1.5?"#ff9060":"#50dd90",fontFamily:"monospace"}}>{zamanlama.hacimOrani||1}x</div>
                  </div>
                  <div style={{textAlign:"center",padding:"8px 14px",background:"#00000030",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#3a6070"}}>Fiyatlanma</div>
                    <div style={{fontSize:16,fontWeight:700,color:(zamanlama.fiyatlanmaPct||0)>60?"#ff7070":"#50dd90",fontFamily:"monospace"}}>%{zamanlama.fiyatlanmaPct||0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAHMİN ── */}
      {aktifTab==="tahmin"&&(
        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:"#4a8090"}}>🎯 Tahmin Başarı Takibi</div>
            {tahminler.length>0&&(
              <button onClick={onTahminGuncelle} disabled={tahminGuncYukl} className="btn-p" style={{padding:"6px 14px",fontSize:11}}>
                {tahminGuncYukl?<Dots size={4}/>:"↻ Fiyat"}
              </button>
            )}
          </div>
          {tahminler.length===0&&(
            <div style={{textAlign:"center",padding:40,color:"#2a4050",lineHeight:2,fontSize:12}}>
              <div style={{fontSize:32,opacity:.1,marginBottom:8}}>🎯</div>
              Analiz sonucunda 📌 Takibe Al butonunu kullan
            </div>
          )}
          {tahminler.length>0&&(
            <div>
              {tahminler.map(function(t,i){
                if(!t)return null;
                var degisim=(t.girisFiyat&&t.guncelFiyat&&t.girisFiyat>0)?((t.guncelFiyat-t.girisFiyat)/t.girisFiyat*100):null;
                var karsilandi=degisim!=null&&(t.yon==="AL"?degisim>0:degisim<0);
                var renk=t.sonuc==="DOĞRU"?"#50dd90":t.sonuc==="YANLIŞ"?"#ff7070":"#ffcc44";
                return(
                  <div key={t.id||i} style={{background:"#101820",border:"1px solid "+renk+"33",borderRadius:7,padding:"10px 12px",marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:800,color:"#70d8a0",fontFamily:"monospace"}}>{t.sembol||""}</span>
                        <span style={{fontSize:11,color:t.yon==="AL"?"#50dd90":"#ff7070"}}>{t.yon||""}</span>
                        <span style={{fontSize:9,color:renk}}>{t.sonuc||"BEKLEYEN"}</span>
                      </div>
                      <div style={{textAlign:"right"}}>
                        {degisim!=null&&<div style={{fontSize:13,fontWeight:700,color:karsilandi?"#50dd90":"#ff7070",fontFamily:"monospace"}}>{degisim>=0?"+":""}{degisim.toFixed(2)}%</div>}
                        <div style={{fontSize:9,color:"#2a4050"}}>{t.tarih||""}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,fontSize:10,color:"#4a7080",marginTop:4,flexWrap:"wrap"}}>
                      {t.girisFiyat&&<span>Giris: {t.para==="USD"?"$":"₺"}{t.girisFiyat}</span>}
                      {t.guncelFiyat&&t.guncelFiyat!==t.girisFiyat&&<span>Guncel: {t.para==="USD"?"$":"₺"}{t.guncelFiyat}</span>}
                      {t.hedefPct&&<span>Hedef: %{t.hedefPct}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── TEKNİK ANALİZ PANELİ ────────────────────────────────────────────────────
const TeknikPaneli=memo(function TeknikPaneli({sembol,setSembol,veri,yukl,hata,tvSembol,onGoster,aiAnalizler,aiYukl,onAIAnalizEt,tab,setTab}){
  var t=veri;
  var rR=t?(t.rsi>70?"#ff7070":t.rsi<30?"#50dd90":"#80cccc"):"#80cccc";
  var mR=t?(t.macd&&t.macd.histogram>0?"#50dd90":"#ff7070"):"#80cccc";
  var konsensus=(function(){
    if(!aiAnalizler)return null;
    var v=Object.values(aiAnalizler).filter(Boolean);
    if(!v.length)return null;
    var al=v.filter(function(x){return x.karar==="AL";}).length;
    var sat=v.filter(function(x){return x.karar==="SAT";}).length;
    if(al>=2)return{karar:"AL",r:"#50dd90",bg:"#0a2010",bd:"#3a8a50"};
    if(sat>=2)return{karar:"SAT",r:"#ff7070",bg:"#200a0a",bd:"#8a3a3a"};
    return{karar:"BEKLE",r:"#ffcc44",bg:"#181810",bd:"#6a6a30"};
  })();
  var HIZLI=["TUPRS","THYAO","EREGL","GARAN","AKBNK","XU100","NVDA","AAPL","GLD","BTC-USD"];
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 12px",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14"}}>
        <div style={{display:"flex",gap:8,marginBottom:7}}>
          <input className="inp" style={{flex:1}} placeholder="TUPRS, NVDA, XU100..."
            value={sembol} onChange={function(e){setSembol(e.target.value.toUpperCase());}}
            onKeyDown={function(e){if(e.key==="Enter")onGoster(sembol);}}/>
          <button className="btn-p" onClick={function(){onGoster(sembol);}} disabled={!sembol||yukl} style={{padding:"8px 16px",fontSize:12,flexShrink:0}}>
            {yukl?<Dots size={5}/>:"Göster"}
          </button>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {HIZLI.map(function(s){return <button key={s} className="qtag" onClick={function(){setSembol(s);onGoster(s);}} style={{padding:"4px 8px"}}>{s}</button>;})}
        </div>
      </div>
      {!tvSembol&&!yukl&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center",color:"#1e3040"}}>
          <div style={{fontSize:40,opacity:.08}}>📊</div>
          <div style={{fontSize:15,fontWeight:600,color:"#3a6050"}}>Gelişmiş Teknik Analiz</div>
          <div style={{fontSize:12,color:"#2a4050",lineHeight:1.9}}>SVG Grafik · RSI · MACD · Bollinger<br/>Destek/Direnç · 3 AI AL/SAT/BEKLE</div>
        </div>
      )}
      {yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots/><div style={{fontSize:13,color:"#4a8a6a"}}>Veri yükleniyor...</div></div>}
      {tvSembol&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
          <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0c1218",overflowX:"auto"}}>
            {[["grafik","📈 Grafik"],["gostergeler","📊 Göstergeler"],["seviyeler","🎯 Seviyeler"],["ai","🤖 AI Karar"]].map(function(item){
              return <button key={item[0]} className={"tab"+(tab===item[0]?" on":"")} onClick={function(){setTab(item[0]);}} style={{fontSize:11}}>{item[1]}</button>;
            })}
            {konsensus&&(
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",paddingRight:12,gap:6}}>
                <span style={{fontSize:10,color:"#3a5060"}}>Konsensus:</span>
                <span style={{fontSize:13,fontWeight:800,color:konsensus.r,background:konsensus.bg,border:"1px solid "+konsensus.bd,padding:"2px 12px",borderRadius:5}}>{konsensus.karar}</span>
              </div>
            )}
          </div>
          {tab==="grafik"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
              <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
                {t&&t.grafik?(function(){
                  var fiyatlar=t.grafik.fiyatlar||[];
                  var tarihler=t.grafik.tarihler||[];
                  if(fiyatlar.length<2)return <div style={{textAlign:"center",padding:40,color:"#2a4050"}}>Grafik verisi yetersiz</div>;
                  var W=560,H=200,padL=56,padR=14,padT=12,padB=28;
                  var xs=W-padL-padR,ys=H-padT-padB;
                  var minF=Math.min.apply(null,fiyatlar)*0.998,maxF=Math.max.apply(null,fiyatlar)*1.002;
                  var xS=function(i){return padL+(i/(fiyatlar.length-1))*xs;};
                  var yS=function(v){return padT+ys-(((v-minF)/(maxF-minF))*ys);};
                  var pts=fiyatlar.map(function(v,i){return xS(i)+","+yS(v);}).join(" ");
                  var area="M"+xS(0)+","+(H-padB)+" L"+fiyatlar.map(function(v,i){return xS(i)+","+yS(v);}).join(" L")+" L"+xS(fiyatlar.length-1)+","+(H-padB)+" Z";
                  var sonFiyat=fiyatlar[fiyatlar.length-1],ilkFiyat=fiyatlar[0];
                  var yukselis=sonFiyat>=ilkFiyat;
                  var renk=yukselis?"#50dd90":"#ff7070";
                  return(
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"8px 12px",background:"#0d1520",borderRadius:8,border:"1px solid #1e3040"}}>
                        <div>
                          <span style={{fontSize:22,fontWeight:800,color:"#e0f0e8",fontFamily:"monospace"}}>{t.fiyat}</span>
                          <span style={{fontSize:11,color:"#3a6050",marginLeft:8}}>{tvSembol}</span>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:14,fontWeight:700,color:renk}}>{yukselis?"▲":"▼"} {(((sonFiyat-ilkFiyat)/ilkFiyat)*100).toFixed(2)}%</div>
                          <div style={{fontSize:10,color:"#3a5060"}}>Son 30 gün</div>
                        </div>
                      </div>
                      <div style={{background:"#0a1018",border:"1px solid #1a2a38",borderRadius:8,overflow:"hidden",marginBottom:8}}>
                        <svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",display:"block"}}>
                          <defs>
                            <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={renk} stopOpacity="0.25"/>
                              <stop offset="100%" stopColor={renk} stopOpacity="0.02"/>
                            </linearGradient>
                          </defs>
                          {[0,0.25,0.5,0.75,1].map(function(r){
                            var y=padT+r*ys;
                            var val=maxF-r*(maxF-minF);
                            return(
                              <g key={r}>
                                <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#1a2530" strokeWidth={1}/>
                                <text x={padL-4} y={y+3} fill="#2a4050" fontSize={9} textAnchor="end">{val.toFixed(val>100?0:2)}</text>
                              </g>
                            );
                          })}
                          <path d={area} fill="url(#grd)"/>
                          <polyline points={pts} fill="none" stroke={renk} strokeWidth={2} strokeLinejoin="round"/>
                          <circle cx={xS(fiyatlar.length-1)} cy={yS(sonFiyat)} r={4} fill={renk}/>
                        </svg>
                      </div>
                    </div>
                  );
                })():(
                  hata
                  ?<div style={{padding:20,background:"#180808",border:"1px solid #3a1010",borderRadius:8,color:"#e07070",fontSize:12}}>⚠ {hata}</div>
                  :<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:10}}><Dots/><div style={{fontSize:12,color:"#4a8a6a"}}>Grafik yükleniyor...</div></div>
                )}
              </div>
              <div style={{padding:"8px 12px",borderTop:"1px solid #1a2530",background:"#0b0f14",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                <button className="btn-p" onClick={onAIAnalizEt} disabled={aiYukl} style={{flex:1,padding:"9px",fontSize:12,borderColor:"#3a5a80",color:"#80a8e0",background:"#0a1428"}}>
                  {aiYukl?<><Dots color="#80a8e0" size={5}/> Analiz ediliyor...</>:"🤖 3 AI ile AL / SAT / BEKLE"}
                </button>
                {konsensus&&<span style={{fontSize:14,fontWeight:800,color:konsensus.r,background:konsensus.bg,border:"1px solid "+konsensus.bd,padding:"7px 16px",borderRadius:6,flexShrink:0}}>{konsensus.karar}</span>}
              </div>
            </div>
          )}
          {tab==="gostergeler"&&(
            <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
              {t?(
                <>
                  <div style={{background:"#0d1520",border:"1px solid #1e3040",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div><span style={{fontSize:22,fontWeight:800,color:"#e0f0e8",fontFamily:"monospace"}}>{t.fiyat}</span></div>
                      <div style={{fontSize:14,fontWeight:700,color:t.trend==="YÜKSELİŞ"?"#50dd90":t.trend==="DÜŞÜŞ"?"#ff7070":"#8090cc"}}>{t.trend==="YÜKSELİŞ"?"▲ YÜKSELİŞ":t.trend==="DÜŞÜŞ"?"▼ DÜŞÜŞ":"◆ YATAY"}</div>
                    </div>
                    <div className="sb"><div className="sbf" style={{width:(t.guc||50)+"%",background:t.guc>60?"#50dd90":t.guc<40?"#ff7070":"#ffcc44"}}/></div>
                  </div>
                  <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#4a8090"}}>RSI (14)</span>
                      <span style={{fontSize:16,fontWeight:800,color:rR,fontFamily:"monospace"}}>{t.rsi}</span>
                    </div>
                    <div className="sb"><div className="sbf" style={{width:t.rsi+"%",background:rR}}/></div>
                    <div style={{fontSize:10,textAlign:"center",marginTop:4,color:rR}}>{t.rsiYorum}</div>
                  </div>
                  <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#4a8090"}}>MACD</span>
                      <span style={{fontSize:11,fontWeight:600,color:mR}}>{t.macdYorum}</span>
                    </div>
                    <div style={{display:"flex",gap:16,fontSize:11,fontFamily:"monospace"}}>
                      <div><div style={{fontSize:9,color:"#3a5060"}}>MACD</div><div style={{color:"#c0d8e4"}}>{t.macd&&t.macd.deger}</div></div>
                      <div><div style={{fontSize:9,color:"#3a5060"}}>Sinyal</div><div style={{color:"#c0d8e4"}}>{t.macd&&t.macd.sinyal}</div></div>
                      <div><div style={{fontSize:9,color:"#3a5060"}}>Histogram</div><div style={{color:mR}}>{t.macd&&t.macd.histogram}</div></div>
                    </div>
                  </div>
                </>
              ):(
                <div style={{textAlign:"center",color:"#2a4050",padding:40}}>Gösterge verisi yüklenemedi</div>
              )}
            </div>
          )}
          {tab==="seviyeler"&&(
            <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
              {t&&t.seviyeler?(
                <>
                  <div style={{background:"#0d1e28",border:"1px solid #1e4060",borderRadius:8,padding:"12px",marginBottom:14,textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#4a8090",marginBottom:6}}>PIVOT NOKTASI</div>
                    <div style={{fontSize:26,fontWeight:800,color:"#80c0cc",fontFamily:"monospace"}}>{t.seviyeler.pivot}</div>
                  </div>
                  {[{l:"R2 — Güçlü Direnç",v:t.seviyeler.direnc2,c:"#ff6060"},{l:"R1 — Yakın Direnç",v:t.seviyeler.direnc1,c:"#ff9060"}].map(function(item){
                    return(
                      <div key={item.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#1a0808",border:"1px solid "+item.c+"33",borderRadius:6,marginBottom:5}}>
                        <span style={{fontSize:11,color:"#6a4040"}}>{item.l}</span>
                        <span style={{fontSize:16,fontWeight:700,color:item.c,fontFamily:"monospace"}}>{item.v}</span>
                      </div>
                    );
                  })}
                  {[{l:"S1 — Yakın Destek",v:t.seviyeler.destek1,c:"#60cc80"},{l:"S2 — Güçlü Destek",v:t.seviyeler.destek2,c:"#40aa60"}].map(function(item){
                    return(
                      <div key={item.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#081808",border:"1px solid "+item.c+"33",borderRadius:6,marginBottom:5}}>
                        <span style={{fontSize:11,color:"#3a6040"}}>{item.l}</span>
                        <span style={{fontSize:16,fontWeight:700,color:item.c,fontFamily:"monospace"}}>{item.v}</span>
                      </div>
                    );
                  })}
                </>
              ):(
                <div style={{textAlign:"center",color:"#2a4050",padding:40}}>Seviye verisi yüklenemedi</div>
              )}
            </div>
          )}
          {tab==="ai"&&(
            <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
              {!aiAnalizler&&!aiYukl&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70%",gap:16,textAlign:"center"}}>
                  <div style={{fontSize:36,opacity:.1}}>🤖</div>
                  <div style={{fontSize:14,fontWeight:600,color:"#3a6070"}}>3 AI Teknik Değerlendirme</div>
                  <button className="btn-p" onClick={onAIAnalizEt} style={{padding:"12px 28px",fontSize:13,borderColor:"#3a5a80",color:"#80a8e0",background:"#0a1428"}}>
                    🤖 3 AI Kararını Al
                  </button>
                </div>
              )}
              {aiYukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots color="#80a8e0"/><div style={{fontSize:13,color:"#6090b0"}}>3 AI teknik analiz yapıyor...</div></div>}
              {aiAnalizler&&!aiYukl&&(
                <div style={{animation:"fadein .3s ease"}}>
                  {konsensus&&(
                    <div style={{background:konsensus.bg,border:"2px solid "+konsensus.bd,borderRadius:10,padding:"14px",marginBottom:14,textAlign:"center"}}>
                      <div style={{fontSize:10,color:konsensus.r,marginBottom:6,fontWeight:700}}>3 AI KONSENSUS</div>
                      <div style={{fontSize:32,fontWeight:900,color:konsensus.r,fontFamily:"monospace"}}>{konsensus.karar}</div>
                    </div>
                  )}
                  {Object.entries(AIT).map(function(entry){
                    var key=entry[0],ai=entry[1];
                    var a=aiAnalizler[key];
                    if(!a)return null;
                    var r=a.karar==="AL"?"#50dd90":a.karar==="SAT"?"#ff7070":"#ffcc44";
                    var bg=a.karar==="AL"?"#0a2010":a.karar==="SAT"?"#200a0a":"#181810";
                    var bd=a.karar==="AL"?"#3a8a50":a.karar==="SAT"?"#8a3a3a":"#6a6a30";
                    return(
                      <div key={key} style={{background:bg,border:"2px solid "+bd,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{color:ai.renk,fontSize:16}}>{ai.logo}</span>
                            <span style={{fontSize:12,fontWeight:700,color:ai.renk}}>{ai.isim}</span>
                          </div>
                          <span style={{fontSize:18,fontWeight:900,color:r,fontFamily:"monospace"}}>{a.karar}</span>
                        </div>
                        {a.gerekceler&&<div style={{fontSize:11,lineHeight:1.7,color:"#8ab0b8"}}>{a.gerekceler}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── BÜLTEN PANELİ ────────────────────────────────────────────────────────────
const BultenPaneli=memo(function BultenPaneli({bulten,yukl,aktif,setAktif,haberSayisi,onUret}){
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 14px",borderBottom:"1px solid #1a2530",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0b0f14"}}>
        <div><div style={{fontSize:12,fontWeight:600,color:"#8a7040"}}>📰 Sabah Bülteni</div><div style={{fontSize:10,color:"#3a4030"}}>{haberSayisi} haber</div></div>
        <button className="btn-p" onClick={onUret} disabled={yukl||!haberSayisi} style={{padding:"7px 14px",fontSize:12,borderColor:"#5a6030",color:"#aab860",background:"#1a1e08"}}>{yukl?<Dots color="#aab860" size={5}/>:"🌅 Üret"}</button>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1208",overflowX:"auto"}}>
        {[{k:"llama",l:"Llama",logo:"🦙",r:"#c07ae0"},{k:"gpt",l:"GPT-4o",logo:"⬡",r:"#10a37f"},{k:"claude",l:"Claude",logo:"✦",r:"#4a8af0"}].map(function(ai){
          return(
            <button key={ai.k} className="aitab" onClick={function(){setAktif(ai.k);}} style={{color:aktif===ai.k?ai.r:"#3a5060",borderBottomColor:aktif===ai.k?ai.r:"transparent",padding:"7px 14px"}}>
              {ai.logo} {ai.l} {yukl?<Dots color={ai.r} size={4}/>:bulten[ai.k]?<span style={{fontSize:9,color:"#3a7050"}}>✓</span>:null}
            </button>
          );
        })}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",WebkitOverflowScrolling:"touch"}}>
        {!bulten.llama&&!yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center"}}><div style={{fontSize:36,opacity:.15}}>📰</div><div style={{fontSize:14,fontWeight:600,color:"#5a6040"}}>Sabah Bülteni</div></div>}
        {yukl&&!bulten[aktif]&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots color="#aab860"/><div style={{fontSize:13,color:"#8a9050"}}>Hazırlanıyor...</div></div>}
        {bulten[aktif]&&<div style={{animation:"fadein .3s ease"}}><div style={{fontSize:13,lineHeight:1.9,color:"#a8c4b0"}} dangerouslySetInnerHTML={{__html:md(bulten[aktif])}}/></div>}
      </div>
    </div>
  );
});

// ─── RAPOR PANELİ ─────────────────────────────────────────────────────────────
const RaporPaneli=memo(function RaporPaneli({raporVeri,yukl,tip,setTip,aktifAI,setAktifAI,doviz,haberSayisi,onUret}){
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 12px",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:0,borderRadius:6,overflow:"hidden",border:"1px solid #1e2d38"}}>
            <button onClick={function(){setTip("gunluk");}} style={{padding:"6px 12px",fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",background:tip==="gunluk"?"#0e2a1a":"#101820",color:tip==="gunluk"?"#6abf90":"#3a6050",border:"none",cursor:"pointer"}}>📊 Günlük</button>
            <button onClick={function(){setTip("haftalik");}} style={{padding:"6px 12px",fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",background:tip==="haftalik"?"#0e2a1a":"#101820",color:tip==="haftalik"?"#6abf90":"#3a6050",border:"none",borderLeft:"1px solid #1e2d38",cursor:"pointer"}}>📅 Haftalık</button>
          </div>
          <button className="btn-p" onClick={onUret} disabled={yukl||!haberSayisi} style={{padding:"7px 14px",fontSize:12,flex:1}}>{yukl?<><Dots size={5}/> Hazırlanıyor...</>:"🚀 Rapor Üret"}</button>
        </div>
        {doviz&&doviz.kurlar&&doviz.kurlar.USDTRY&&<div style={{fontSize:10,color:"#2a5040"}}>💱 USD/TRY {doviz.kurlar.USDTRY} · EUR/TRY {doviz.kurlar.EURTRY}</div>}
      </div>
      {raporVeri&&(
        <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0c1410",overflowX:"auto"}}>
          {[{k:"llama",l:"Llama",logo:"🦙",r:"#c07ae0"},{k:"gpt",l:"GPT-4o",logo:"⬡",r:"#10a37f"},{k:"claude",l:"Claude",logo:"✦",r:"#4a8af0"}].map(function(ai){
            return(
              <button key={ai.k} className="aitab" onClick={function(){setAktifAI(ai.k);}} style={{color:aktifAI===ai.k?ai.r:"#3a5060",borderBottomColor:aktifAI===ai.k?ai.r:"transparent",padding:"7px 12px"}}>
                {ai.logo} {ai.l}
              </button>
            );
          })}
        </div>
      )}
      <div style={{flex:1,overflowY:"auto",padding:"14px",WebkitOverflowScrolling:"touch"}}>
        {!raporVeri&&!yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center"}}><div style={{fontSize:36,opacity:.08}}>📋</div><div style={{fontSize:14,fontWeight:600,color:"#4a6040"}}>Profesyonel Piyasa Raporu</div></div>}
        {yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70%",gap:12}}><Dots color="#f0b040"/><div style={{fontSize:13,color:"#b09030"}}>Hazırlanıyor...</div></div>}
        {raporVeri&&!yukl&&(function(){
          var a=raporVeri[aktifAI];
          if(!a)return null;
          if(a.error)return <div style={{padding:12,background:"#180808",border:"1px solid #3a1010",borderRadius:6,color:"#e07070",fontSize:12}}>❌ {a.error}</div>;
          return <div style={{animation:"fadein .3s ease"}}><div style={{fontSize:13,lineHeight:2,color:"#a8c4cc"}} dangerouslySetInnerHTML={{__html:md(a.text)}}/></div>;
        })()}
      </div>
    </div>
  );
});

// ─── DİĞER PANELİ ─────────────────────────────────────────────────────────────
const DigerPaneli=memo(function DigerPaneli({sekme,setSekme,portfoy,setPortfoy,yeniHisse,setYeniHisse,hisseEkle,manuel,setManuel,analizDevam,onManuelAnaliz,korelasyon,setKorelasyon,takvim,onTakvimAnaliz,gecmis,setGecmis,onGecmisYukle}){
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
        {[["portfoy","💼"],["manuel","✏️"],["korelasyon","🔗"],["takvim","📅"],["gecmis","🕐"]].map(function(item){
          return <button key={item[0]} className={"tab"+(sekme===item[0]?" on":"")} onClick={function(){setSekme(item[0]);}} style={{fontSize:18}}>{item[1]}</button>;
        })}
      </div>
      {sekme==="portfoy"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          <div style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:8,padding:12,marginBottom:12}}>
            <input className="inp" placeholder="Sembol" value={yeniHisse.sembol} onChange={function(e){setYeniHisse(function(p){return Object.assign({},p,{sembol:e.target.value.toUpperCase()});});}} style={{marginBottom:6}}/>
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={function(e){setYeniHisse(function(p){return Object.assign({},p,{adet:e.target.value});});}} style={{flex:1}}/>
              <input className="inp" placeholder="₺ Maliyet" type="number" value={yeniHisse.maliyet} onChange={function(e){setYeniHisse(function(p){return Object.assign({},p,{maliyet:e.target.value});});}} style={{flex:1}}/>
            </div>
            <button onClick={hisseEkle} className="btn-p" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>+ Ekle</button>
          </div>
          {portfoy.length===0?<div style={{textAlign:"center",color:"#2a4050",fontSize:12,marginTop:16}}>Portföyünüz boş.</div>:portfoy.map(function(h){
            return(
              <div key={h.id} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:15,color:"#70d8a0",fontWeight:700,fontFamily:"monospace"}}>{h.sembol}</div><div style={{fontSize:10,color:"#2a5040",marginTop:2}}>{h.adet} adet · ₺{h.maliyet}</div></div>
                <div style={{display:"flex",gap:5}}>
                  <button className="btn-sm" style={{borderColor:"#1e4a2a",color:"#5aaa70",background:"#0a1e12"}} onClick={function(){onManuelAnaliz(h.sembol+" hissesini analiz et",h.sembol);}}>Analiz</button>
                  <button className="btn-sm" style={{borderColor:"#3a1010",color:"#cc6060",background:"#150808"}} onClick={function(){setPortfoy(function(p){return p.filter(function(x){return x.id!==h.id;});});}}>Sil</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sekme==="manuel"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
          <textarea className="inp" value={manuel} onChange={function(e){setManuel(e.target.value);}} style={{flex:1,minHeight:120,resize:"none",lineHeight:1.6}} placeholder={"3 AI aynı anda analiz eder...\n\nÖrn: TCMB faizi 500 baz puan indirdi"}/>
          <button onClick={function(){if(manuel.trim())onManuelAnaliz(manuel,manuel.slice(0,70));}} disabled={!manuel.trim()||analizDevam} className="btn-p" style={{width:"100%",padding:"12px"}}>{analizDevam?<><Dots size={5}/> Analiz ediliyor</>:"3 AI ile Analiz Et →"}</button>
          <div style={{borderTop:"1px solid #1a2530",paddingTop:10}}>
            <div style={{fontSize:10,color:"#2a4050",marginBottom:7}}>Hızlı örnekler</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","Altın rekor","BTC 100k"].map(function(txt){
                return <button key={txt} className="qtag" onClick={function(){onManuelAnaliz(txt,txt);}}>{txt}</button>;
              })}
            </div>
          </div>
        </div>
      )}
      {sekme==="korelasyon"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:600,color:"#3a7080"}}>🔗 Korelasyon Hafızası</div>
            <button className="btn-sm" onClick={function(){setKorelasyon({});}} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Sıfırla</button>
          </div>
          {Object.keys(korelasyon).length===0?<div style={{textAlign:"center",padding:40,color:"#1e3040",fontSize:12,lineHeight:1.8}}>Henüz veri yok.</div>:Object.entries(korelasyon).map(function(entry){
            var kat=entry[0],hisseler=entry[1];
            var kr=KR[kat]||KR["GENEL"];
            return(
              <div key={kat} style={{background:"#101820",border:"1px solid "+kr.bd,borderRadius:7,padding:"10px 12px",marginBottom:8}}>
                <span className="badge" style={{background:kr.bg,color:kr.tx,border:"1px solid "+kr.bd,marginBottom:8,display:"inline-flex"}}>{kat}</span>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {Object.entries(hisseler).sort(function(a,b){return b[1].toplam-a[1].toplam;}).map(function(he){
                    var s=he[0],d=he[1];
                    var alO=d.toplam>0?Math.round(d.al/d.toplam*100):0;
                    return(
                      <div key={s} style={{background:"#0d1520",border:"1px solid #1e2d38",borderRadius:5,padding:"6px 10px",minWidth:80}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#70d8a0",fontFamily:"monospace"}}>{s}</div>
                        <div style={{fontSize:9,color:"#3a6050"}}>{d.toplam}x</div>
                        <div style={{display:"flex",gap:3,marginTop:3}}>
                          <span style={{fontSize:8,color:"#50cc80",background:"#0a2010",padding:"1px 4px",borderRadius:2}}>AL {alO}%</span>
                          <span style={{fontSize:8,color:"#cc5050",background:"#200808",padding:"1px 4px",borderRadius:2}}>SAT {100-alO}%</span>
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
      {sekme==="takvim"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#3a6050",marginBottom:10}}>Ekonomik Takvim</div>
          {takvim.length===0?<div style={{textAlign:"center",marginTop:40}}><Dots/></div>:takvim.map(function(o){
            var tarih=new Date(o.tarih),gecti=tarih<new Date(),er=ER[o.onem]||ER["DÜŞÜK"];
            return(
              <div key={o.id} onClick={function(){onTakvimAnaliz(o);}} style={{background:gecti?"#0c1015":"#101820",border:"1px solid "+(o.onem==="YÜKSEK"&&!gecti?"#381a1a":"#1c2c38"),borderRadius:6,padding:"10px 12px",marginBottom:6,cursor:"pointer",opacity:gecti?.45:1}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                      {o.ulke&&<span>{o.ulke}</span>}
                      <span className="badge" style={{background:er.bg,color:er.tx,border:"1px solid "+er.bd}}>{o.onem}</span>
                    </div>
                    <div style={{fontSize:12,color:gecti?"#3a5060":"#90b4c0",fontWeight:500}}>{o.baslik}</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:"#3a7060",fontFamily:"monospace",flexShrink:0}}>{tarih.toLocaleDateString("tr-TR",{day:"2-digit",month:"short"})}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sekme==="gecmis"&&(
        <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
          {gecmis.length===0?<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1e3040",fontSize:13}}>Henüz analiz yok</div>:(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:600,color:"#3a6050"}}>Geçmiş</span>
                <button className="btn-sm" onClick={function(){setGecmis([]);}} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Temizle</button>
              </div>
              {gecmis.map(function(g){
                return(
                  <div key={g.id} onClick={function(){onGecmisYukle(g);}} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer"}}>
                    <div style={{fontSize:12,color:"#80aab8",marginBottom:4,lineHeight:1.4,fontWeight:500}}>{g.baslik}</div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <div style={{display:"flex",gap:4}}>
                        {Object.entries(AIT).map(function(entry){
                          var k=entry[0],ai=entry[1];
                          return <span key={k} style={{fontSize:9,color:g.analizler&&g.analizler[k]?ai.renk:"#2a3a4a"}}>{ai.logo}</span>;
                        })}
                      </div>
                      <span style={{fontSize:10,color:"#2a4050"}}>{g.zaman}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ANA BILEŞEN
// ─────────────────────────────────────────────────────────────────────────────
export default function BorsaRadar() {
  var _h=useState([]),haberler=_h[0],setHaberler=_h[1];
  var _hy=useState(false),haberYukl=_hy[0],setHaberYukl=_hy[1];
  var _hht=useState(""),haberHata=_hht[0],setHaberHata=_hht[1];
  var _f=useState("TÜMÜ"),filtre=_f[0],setFiltre=_f[1];
  var _fy=useState([]),fiyatlar=_fy[0],setFiyatlar=_fy[1];
  var _tak=useState([]),takvim=_tak[0],setTakvim=_tak[1];
  var _sec=useState(null),secilenId=_sec[0],setSecilenId=_sec[1];
  var _cd=useState(300),cd=_cd[0],setCd=_cd[1];
  var _sg=useState(null),sonGun=_sg[0],setSonGun=_sg[1];
  var cdRef=useRef(null);

  var _an=useState({claude:null,gpt:null,gemini:null}),analizler=_an[0],setAnalizler=_an[1];
  var _ay=useState({claude:false,gpt:false,gemini:false}),analizYukl=_ay[0],setAnalizYukl=_ay[1];
  var _ab=useState(""),analizBaslik=_ab[0],setAnalizBaslik=_ab[1];
  var _ai=useState("claude"),aktifAI=_ai[0],setAktifAI=_ai[1];
  var _gs=useState(false),goster=_gs[0],setGoster=_gs[1];
  var _kor=useState({}),korelasyon=_kor[0],setKorelasyon=_kor[1];

  var _bu=useState({llama:null,gpt:null,claude:null}),bulten=_bu[0],setBulten=_bu[1];
  var _byl=useState(false),bultenYukl=_byl[0],setBultenYukl=_byl[1];
  var _ba=useState("llama"),bultenAktif=_ba[0],setBultenAktif=_ba[1];

  var _ts=useState(""),tekSembol=_ts[0],setTekSembol=_ts[1];
  var _tv=useState(null),tekVeri=_tv[0],setTekVeri=_tv[1];
  var _tyl=useState(false),tekYukl=_tyl[0],setTekYukl=_tyl[1];
  var _th=useState(""),tekHata=_th[0],setTekHata=_th[1];
  var _tvs=useState(""),tvSembol=_tvs[0],setTvSembol=_tvs[1];
  var _tai=useState(null),tekAI=_tai[0],setTekAI=_tai[1];
  var _tayl=useState(false),tekAIYukl=_tayl[0],setTekAIYukl=_tayl[1];
  var _tt=useState("grafik"),tekTab=_tt[0],setTekTab=_tt[1];

  var _rv=useState(null),raporVeri=_rv[0],setRaporVeri=_rv[1];
  var _ryl=useState(false),raporYukl=_ryl[0],setRaporYukl=_ryl[1];
  var _rt=useState("gunluk"),raporTip=_rt[0],setRaporTip=_rt[1];
  var _ra=useState("llama"),raporAI=_ra[0],setRaporAI=_ra[1];
  var _hf=useState([]),haftalik=_hf[0],setHaftalik=_hf[1];
  var _dv=useState(null),doviz=_dv[0],setDoviz=_dv[1];

  var _gc=useState([]),gecmis=_gc[0],setGecmis=_gc[1];
  var _pf=useState([]),portfoy=_pf[0],setPortfoy=_pf[1];
  var _yh=useState({sembol:"",adet:"",maliyet:""}),yeniHisse=_yh[0],setYeniHisse=_yh[1];
  var _mn=useState(""),manuel=_mn[0],setManuel=_mn[1];

  // İstihbarat state'leri
  var _dg=useState(null),duygu=_dg[0],setDuygu=_dg[1];
  var _dgl=useState(false),duyguYukl=_dgl[0],setDuyguYukl=_dgl[1];
  var _sk=useState(null),sektor=_sk[0],setSektor=_sk[1];
  var _skl=useState(false),sektorYukl=_skl[0],setSektorYukl=_skl[1];
  var _zm=useState(null),zamanlama=_zm[0],setZamanlama=_zm[1];
  var _zml=useState(false),zamanlamaYukl=_zml[0],setZamanlamaYukl=_zml[1];
  var _zms=useState(""),zamanlamaSembol=_zms[0],setZamanlamaSembol=_zms[1];
  var _thn=useState([]),tahminler=_thn[0],setTahminler=_thn[1];
  var _thgl=useState(false),tahminGuncYukl=_thgl[0],setTahminGuncYukl=_thgl[1];
  var _ist=useState("duygu"),istihbaratTab=_ist[0],setIstihbaratTab=_ist[1];

  var _ae=useState("haberler"),aktifEkran=_ae[0],setAktifEkran=_ae[1];
  var _aa=useState("3ai"),analizAlt=_aa[0],setAnalizAlt=_aa[1];
  var _ds=useState("portfoy"),digerSekme=_ds[0],setDigerSekme=_ds[1];
  var _sl=useState("akis"),solTab=_sl[0],setSolTab=_sl[1];
  var _st=useState("analiz"),sagTab=_st[0],setSagTab=_st[1];

  var haberlerRef=useRef([]);haberlerRef.current=haberler;
  var analizYuklRef=useRef({});analizYuklRef.current=analizYukl;
  var tekVeriRef=useRef(null);tekVeriRef.current=tekVeri;
  var tvSembolRef=useRef("");tvSembolRef.current=tvSembol;
  var raporYuklRef=useRef(false);raporYuklRef.current=raporYukl;
  var tekAILock=useRef(false);

  // ─── API ──────────────────────────────────────────────────────────────────
  var fiyatYukle=useCallback(function(){fetch("/api/prices").then(function(r){return r.json();}).then(function(d){if(d.fiyatlar&&d.fiyatlar.length)setFiyatlar(d.fiyatlar);}).catch(function(){});},[]);
  var takvimYukle=useCallback(function(){fetch("/api/calendar").then(function(r){return r.json();}).then(function(d){if(d.olaylar)setTakvim(d.olaylar);}).catch(function(){});},[]);
  var dovizYukle=useCallback(function(){fetch("/api/doviz").then(function(r){return r.json();}).then(function(d){if(d.kurlar&&d.kurlar.USDTRY)setDoviz(d);}).catch(function(){});},[]);

  var haberleriYukle=useCallback(function(gosterYukleme){
    if(gosterYukleme)setHaberYukl(true);
    setHaberHata("");
    fetch("/api/news")
      .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();})
      .then(function(d){
        if(d.haberler&&d.haberler.length>0){
          setHaberler(d.haberler);
          setCd(300);
          setSonGun(new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}));
        }else if(gosterYukleme){setHaberHata("Haber alınamadı.");}
        if(gosterYukleme)setHaberYukl(false);
      })
      .catch(function(e){
        if(gosterYukleme){setHaberHata("Hata: "+e.message);setHaberYukl(false);}
      });
  },[]);

  var analizEt=useCallback(function(metin,baslik){
    if(!metin||Object.values(analizYuklRef.current).some(function(v){return v;}))return;
    setGoster(true);setSagTab("analiz");setAktifEkran("analiz");
    setAnalizBaslik(baslik||metin.slice(0,80));
    setAnalizler({claude:null,gpt:null,gemini:null});
    setAnalizYukl({claude:true,gpt:true,gemini:true});
    setAktifAI("claude");
    fetch("/api/analyze-multi",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin:metin})})
      .then(function(r){return r.json();})
      .then(function(d){
        setAnalizler({
          claude:d.claude&&d.claude.text?d.claude.text:(d.claude&&d.claude.error?"❌ "+d.claude.error:null),
          gpt:d.gpt&&d.gpt.text?d.gpt.text:(d.gpt&&d.gpt.error?"❌ "+d.gpt.error:null),
          gemini:d.gemini&&d.gemini.text?d.gemini.text:(d.gemini&&d.gemini.error?"❌ "+d.gemini.error:null),
        });
        var kayit={id:Date.now(),baslik:baslik||metin.slice(0,70),analizler:{claude:d.claude&&d.claude.text,gpt:d.gpt&&d.gpt.text,gemini:d.gemini&&d.gemini.text},zaman:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),tarih:new Date().toLocaleDateString("tr-TR")};
        setGecmis(function(prev){return [kayit].concat(prev.slice(0,19));});
        var kat=kategoriBul(metin);
        var tum=[d.claude&&d.claude.text,d.gpt&&d.gpt.text,d.gemini&&d.gemini.text].filter(Boolean).join(" ");
        var bistL=["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM"];
        var bul=bistL.filter(function(s){return tum.includes(s);});
        if(bul.length){
          var yon=tum.includes("📈 AL")?1:tum.includes("📉 SAT")?-1:0;
          setKorelasyon(function(prev){
            var y=Object.assign({},prev);
            bul.forEach(function(s){if(!y[kat])y[kat]={};if(!y[kat][s])y[kat][s]={al:0,sat:0,toplam:0};y[kat][s].toplam++;if(yon===1)y[kat][s].al++;if(yon===-1)y[kat][s].sat++;});
            return y;
          });
        }
        // Sektör haritası — non-blocking
        setSektorYukl(true);
        fetch("/api/sektor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin:metin})})
          .then(function(r){return r.json();})
          .then(function(sd){if(sd&&sd.onerilenHisseler&&sd.onerilenHisseler.length){setSektor(sd);}setSektorYukl(false);})
          .catch(function(){setSektorYukl(false);});
        setAnalizYukl({claude:false,gpt:false,gemini:false});
      })
      .catch(function(e){
        setAnalizler({claude:"❌ "+e.message,gpt:"❌ "+e.message,gemini:"❌ "+e.message});
        setAnalizYukl({claude:false,gpt:false,gemini:false});
      });
  },[]);

  var bultenUret=useCallback(function(){
    var h=haberlerRef.current;if(!h.length)return;
    setBultenYukl(true);setBulten({llama:null,gpt:null,claude:null});
    setSagTab("bulten");setAktifEkran("analiz");setAnalizAlt("bulten");
    fetch("/api/bulten",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({haberler:h})})
      .then(function(r){return r.json();})
      .then(function(d){
        setBulten({
          llama:d.llama&&d.llama.text?d.llama.text:(d.llama&&d.llama.error?"❌ "+d.llama.error:null),
          gpt:d.gpt&&d.gpt.text?d.gpt.text:(d.gpt&&d.gpt.error?"❌ "+d.gpt.error:null),
          claude:d.claude&&d.claude.text?d.claude.text:(d.claude&&d.claude.error?"❌ "+d.claude.error:null),
        });
        setBultenYukl(false);
      })
      .catch(function(e){setBulten({llama:"❌ "+e.message,gpt:null,claude:null});setBultenYukl(false);});
  },[]);

  var teknikGoster=useCallback(function(s){
    if(!s)return;
    var sembol=s.trim().toUpperCase();
    setTekSembol(sembol);setTvSembol(sembol);setTekAI(null);setTekTab("grafik");
    setTekYukl(true);setTekVeri(null);setTekHata("");
    fetch("/api/teknik?sembol="+encodeURIComponent(sembol))
      .then(function(r){return r.json();})
      .then(function(d){if(d.error)throw new Error(d.error);setTekVeri(d);setTekYukl(false);})
      .catch(function(e){setTekHata(e.message);setTekYukl(false);});
  },[]);

  var teknikAIAnalizEt=useCallback(function(){
    var tv=tvSembolRef.current;if(!tv||tekAILock.current)return;
    tekAILock.current=true;setTekAIYukl(true);setTekTab("ai");
    var t=tekVeriRef.current;
    var prompt=tv+" hissesi için teknik analiz yap."+(t?" Veriler: Fiyat "+t.fiyat+", RSI "+t.rsi+" ("+t.rsiYorum+"), Trend "+t.trend+".":"")+"\n\nSADECE JSON döndür:\n{\"karar\":\"AL|SAT|BEKLE\",\"guven\":0-100,\"gerekceler\":\"2-3 cümle\"}";
    fetch("/api/analyze-multi",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin:prompt,tip:"teknik"})})
      .then(function(r){return r.json();})
      .then(function(d){
        var parse=function(txt){if(!txt)return null;try{var m=txt.match(/\{[\s\S]*?\}/);return m?JSON.parse(m[0]):null;}catch(e){return{karar:"BEKLE",guven:50,gerekceler:txt.slice(0,200)};}};
        setTekAI({claude:parse(d.claude&&d.claude.text),gpt:parse(d.gpt&&d.gpt.text),gemini:parse(d.gemini&&d.gemini.text)});
        setTekAIYukl(false);tekAILock.current=false;
      })
      .catch(function(e){
        setTekAI({claude:{karar:"BEKLE",gerekceler:"Hata: "+e.message},gpt:null,gemini:null});
        setTekAIYukl(false);tekAILock.current=false;
      });
  },[]);

  var raporUret=useCallback(function(){
    var h=haberlerRef.current;if(!h.length||raporYuklRef.current)return;
    setRaporYukl(true);setRaporVeri(null);setSagTab("rapor");setAktifEkran("rapor");
    fetch("/api/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({haberler:h,tip:raporTip,haftalikHaberler:raporTip==="haftalik"?haftalik:[]})})
      .then(function(r){return r.json();})
      .then(function(d){setRaporVeri(d);setRaporAI("llama");setRaporYukl(false);})
      .catch(function(e){setRaporVeri({hata:e.message});setRaporYukl(false);});
  },[raporTip,haftalik]);

  // İstihbarat handler'ları
  var duyguHesapla=useCallback(function(){
    var h=haberlerRef.current;if(!h.length)return;
    setDuyguYukl(true);setDuygu(null);
    fetch("/api/duygu",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({haberler:h})})
      .then(function(r){return r.json();})
      .then(function(d){setDuygu(d);setDuyguYukl(false);})
      .catch(function(){setDuyguYukl(false);});
  },[]);

  var zamanlamaHesapla=useCallback(function(s){
    if(!s)return;
    setZamanlamaYukl(true);setZamanlama(null);
    fetch("/api/zamanlama",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sembol:s})})
      .then(function(r){return r.json();})
      .then(function(d){if(!d.error)setZamanlama(d);setZamanlamaYukl(false);})
      .catch(function(){setZamanlamaYukl(false);});
  },[]);

  var tahminEkle=useCallback(function(sembol,yon,hedefPct,ai,metin,girisFiyat,para){
    setTahminler(function(prev){
      return [{
        id:Date.now(),
        sembol:String(sembol||"").toUpperCase(),
        yon:yon||"AL",hedefPct:hedefPct||null,ai:ai||null,
        metin:String(metin||"").slice(0,100),
        girisFiyat:girisFiyat||null,guncelFiyat:girisFiyat||null,
        para:para||"TRY",
        tarih:new Date().toLocaleDateString("tr-TR"),
        sonuc:null,
      }].concat(prev.slice(0,99));
    });
  },[]);

  var tahminGuncelle=useCallback(function(){
    var bekleyen=tahminler.filter(function(t){return !t.sonuc;});
    if(!bekleyen.length)return;
    setTahminGuncYukl(true);
    Promise.allSettled(bekleyen.map(function(t){
      return fetch("/api/tahmintakip?sembol="+encodeURIComponent(t.sembol))
        .then(function(r){return r.json();})
        .then(function(d){
          if(!d.fiyat)return;
          setTahminler(function(prev){
            return prev.map(function(x){
              if(x.id!==t.id)return x;
              var degisim=x.girisFiyat?((d.fiyat-x.girisFiyat)/x.girisFiyat*100):null;
              var hedefUlasti=x.hedefPct&&degisim!=null&&(x.yon==="AL"?degisim>=x.hedefPct:degisim<=-x.hedefPct);
              return Object.assign({},x,{guncelFiyat:d.fiyat,sonuc:hedefUlasti?"DOĞRU":null});
            });
          });
        })
        .catch(function(){});
    })).then(function(){setTahminGuncYukl(false);});
  },[tahminler]);

  // ─── MOUNT ────────────────────────────────────────────────────────────────
  useEffect(function(){
    haberleriYukle(true);fiyatYukle();takvimYukle();dovizYukle();
    var r1=setInterval(function(){haberleriYukle(false);},5*60*1000);
    var r2=setInterval(fiyatYukle,60*1000);
    var r3=setInterval(dovizYukle,2*60*1000);
    cdRef.current=setInterval(function(){setCd(function(c){return c>0?c-1:300;});},1000);
    try{var p=localStorage.getItem("br_portfoy");if(p)setPortfoy(JSON.parse(p));}catch(e){}
    try{var g=localStorage.getItem("br_gecmis");if(g)setGecmis(JSON.parse(g));}catch(e){}
    try{var k=localStorage.getItem("br_korel");if(k)setKorelasyon(JSON.parse(k));}catch(e){}
    try{var hf=localStorage.getItem("br_haftalik");if(hf)setHaftalik(JSON.parse(hf));}catch(e){}
    try{var thn=localStorage.getItem("br_tahminler");if(thn)setTahminler(JSON.parse(thn));}catch(e){}
    return function(){clearInterval(r1);clearInterval(r2);clearInterval(r3);clearInterval(cdRef.current);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(function(){try{localStorage.setItem("br_portfoy",JSON.stringify(portfoy));}catch(e){}},[portfoy]);
  useEffect(function(){try{localStorage.setItem("br_gecmis",JSON.stringify(gecmis.slice(0,20)));}catch(e){}},[gecmis]);
  useEffect(function(){try{localStorage.setItem("br_korel",JSON.stringify(korelasyon));}catch(e){}},[korelasyon]);
  useEffect(function(){try{localStorage.setItem("br_haftalik",JSON.stringify(haftalik.slice(-200)));}catch(e){}},[haftalik]);
  useEffect(function(){try{localStorage.setItem("br_tahminler",JSON.stringify(tahminler.slice(0,100)));}catch(e){}},[tahminler]);

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  var hisseEkle=useCallback(function(){
    if(!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet)return;
    setPortfoy(function(prev){return prev.concat([Object.assign({},yeniHisse,{id:Date.now(),sembol:yeniHisse.sembol.toUpperCase()})]);});
    setYeniHisse({sembol:"",adet:"",maliyet:""});
  },[yeniHisse]);
  var onHaberClick=useCallback(function(h){setSecilenId(h.id);analizEt(h.baslik+(h.ozet?" — "+h.ozet:""),h.baslik);},[analizEt]);
  var onManuelAnaliz=useCallback(function(m,b){setManuel(m||"");analizEt(m,b||m.slice(0,70));},[analizEt]);
  var onTakvimAnaliz=useCallback(function(o){analizEt(o.baslik+" yaklaşıyor",o.baslik);},[analizEt]);
  var onGecmisYukle=useCallback(function(g){setAnalizler(g.analizler||{});setAnalizBaslik(g.baslik);setGoster(true);setSagTab("analiz");setAktifEkran("analiz");},[]);
  var analizDevam=Object.values(analizYukl).some(function(v){return v;});
  var fmtCD=function(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");};

  var hProps={haberler:haberler,yukl:haberYukl,hata:haberHata,filtre:filtre,setFiltre:setFiltre,secilenId:secilenId,onClick:onHaberClick,onYenile:function(){haberleriYukle(true);}};
  var aProps={analizler:analizler,analizYukl:analizYukl,baslik:analizBaslik,aktif:aktifAI,setAktif:setAktifAI,goster:goster,onTahminEkle:tahminEkle};
  var tProps={sembol:tekSembol,setSembol:setTekSembol,veri:tekVeri,yukl:tekYukl,hata:tekHata,tvSembol:tvSembol,onGoster:teknikGoster,aiAnalizler:tekAI,aiYukl:tekAIYukl,onAIAnalizEt:teknikAIAnalizEt,tab:tekTab,setTab:setTekTab};
  var bProps={bulten:bulten,yukl:bultenYukl,aktif:bultenAktif,setAktif:setBultenAktif,haberSayisi:haberler.length,onUret:bultenUret};
  var rProps={raporVeri:raporVeri,yukl:raporYukl,tip:raporTip,setTip:setRaporTip,aktifAI:raporAI,setAktifAI:setRaporAI,doviz:doviz,haberSayisi:haberler.length,onUret:raporUret};
  var dProps={sekme:digerSekme,setSekme:setDigerSekme,portfoy:portfoy,setPortfoy:setPortfoy,yeniHisse:yeniHisse,setYeniHisse:setYeniHisse,hisseEkle:hisseEkle,manuel:manuel,setManuel:setManuel,analizDevam:analizDevam,onManuelAnaliz:onManuelAnaliz,korelasyon:korelasyon,setKorelasyon:setKorelasyon,takvim:takvim,onTakvimAnaliz:onTakvimAnaliz,gecmis:gecmis,setGecmis:setGecmis,onGecmisYukle:onGecmisYukle};
  var iProps={duygu:duygu,duyguYukl:duyguYukl,onDuyguHesapla:duyguHesapla,sektor:sektor,sektorYukl:sektorYukl,zamanlama:zamanlama,zamanlamaYukl:zamanlamaYukl,onZamanlamaHesapla:zamanlamaHesapla,zamanlamaSembol:zamanlamaSembol,setZamanlamaSembol:setZamanlamaSembol,tahminler:tahminler,onTahminGuncelle:tahminGuncelle,tahminGuncYukl:tahminGuncYukl,aktifTab:istihbaratTab,setAktifTab:setIstihbaratTab,haberler:haberler};

  return(
    <>
      <Head>
        <title>BorsaRadar — 7/24 Finansal Analiz</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
        <meta name="theme-color" content="#0f1318"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </Head>

      <div style={{height:"100dvh",display:"flex",flexDirection:"column",background:"#0f1318",color:"#d4dde6",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
        <style>{CSS}</style>

        {/* HEADER */}
        <div style={{height:50,padding:"0 14px",borderBottom:"1px solid #1a2530",background:"#0b0f14",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div><span style={{fontSize:"1.15rem",fontWeight:800,color:"#e0eef0",letterSpacing:"-.02em"}}>Borsa</span><span style={{fontSize:"1.15rem",fontWeight:800,color:"#4aaa70",letterSpacing:"-.02em"}}>Radar</span></div>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#3aaa60",display:"inline-block"}}/>
            <span style={{fontSize:10,color:"#4a8a60",fontWeight:500}}>Canlı</span>
            {sonGun&&<span style={{fontSize:10,color:"#2a4a40"}}>· {sonGun}</span>}
            <a href="/simulasyon" style={{fontSize:10,fontWeight:600,color:"#8a5af0",background:"#1a0e28",border:"1px solid #3a1e60",padding:"3px 10px",borderRadius:5,textDecoration:"none"}}>🎮 Sim</a>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div className="mob-quick">
              <button onClick={bultenUret} disabled={bultenYukl||!haberler.length} className="btn-sm" style={{borderColor:"#5a6030",color:"#aab860",background:"#1a1e08",padding:"5px 10px",fontSize:11}}>{bultenYukl?<Dots size={4} color="#aab860"/>:"📰"}</button>
              <button onClick={raporUret} disabled={raporYukl||!haberler.length} className="btn-sm" style={{borderColor:"#3a7a5a",color:"#6abf90",background:"#0a1e12",padding:"5px 10px",fontSize:11}}>{raporYukl?<Dots size={4}/>:"📋"}</button>
            </div>
            <span className="desk-haber-cd" style={{fontSize:10,color:"#2a4050",fontFamily:"monospace"}}>↻ {fmtCD(cd)}</span>
            <button onClick={function(){haberleriYukle(true);}} className="btn-p" style={{padding:"6px 14px",fontSize:11}}>{haberYukl?<Dots size={5}/>:"↻"}</button>
          </div>
        </div>

        {/* FİYAT ŞERİDİ */}
        <div style={{height:30,borderBottom:"1px solid #1a2530",background:"#0b0f14",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center"}}>
          {fiyatlar.length===0?<div style={{paddingLeft:14,fontSize:10,color:"#2a4050",display:"flex",alignItems:"center",gap:6}}><Dots color="#2a4050" size={4}/><span>Piyasa verisi...</span></div>:(
            <div style={{display:"flex",animation:"ticker 40s linear infinite",alignItems:"center",height:"100%"}}>
              {fiyatlar.concat(fiyatlar).map(function(f,i){
                return(
                  <span key={i} className="price-chip">
                    <span style={{color:"#4a6878",fontWeight:500}}>{f.isim}</span>
                    <span style={{color:"#c0d8e4",fontWeight:700,fontFamily:"monospace"}}>{fmtFiyat(f.fiyat,f.sembol)}</span>
                    {f.degisim!=null&&f.degisim!==0&&<span style={{color:f.degisim>=0?"#44aa70":"#cc5555",fontSize:9,fontWeight:600,background:f.degisim>=0?"#09200f":"#200909",padding:"1px 4px",borderRadius:3}}>{f.degisim>=0?"+":""}{(f.degisim||0).toFixed(2)}%</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── MASAÜSTÜ LAYOUT ─── */}
        <div className="layout">
          {/* Sol */}
          <div className="sol">
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,paddingLeft:2}}>
              <button className={"tab"+(solTab==="akis"?" on":"")} onClick={function(){setSolTab("akis");}}>Haberler</button>
              <button className={"tab"+(solTab==="manuel"?" on":"")} onClick={function(){setSolTab("manuel");}}>Manuel</button>
              <button className={"tab"+(solTab==="portfoy"?" on":"")} onClick={function(){setSolTab("portfoy");}}>Portföy{portfoy.length>0&&<span style={{background:"#0e2a1a",color:"#5aaa7a",borderRadius:3,padding:"0 5px",marginLeft:4,fontSize:10}}>{portfoy.length}</span>}</button>
            </div>
            {solTab==="akis"&&<HaberListesi {...hProps}/>}
            {solTab==="manuel"&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
                <textarea className="inp" value={manuel} onChange={function(e){setManuel(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&e.ctrlKey&&manuel.trim())onManuelAnaliz(manuel,manuel.slice(0,70));}} style={{flex:1,minHeight:110,resize:"none",lineHeight:1.6}} placeholder={"Ctrl+Enter ile analiz\n\nÖrn: TCMB faizi indirdi"}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#2a4050"}}>Ctrl+Enter</span>
                  <button onClick={function(){if(manuel.trim())onManuelAnaliz(manuel,manuel.slice(0,70));}} disabled={!manuel.trim()||analizDevam} className="btn-p">{analizDevam?<><Dots size={5}/> Analiz...</>:"Analiz Et →"}</button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingTop:8,borderTop:"1px solid #1a2530"}}>
                  {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB indirdi","Altın rekor","BTC 100k"].map(function(txt){return <button key={txt} className="qtag" style={{fontSize:11}} onClick={function(){onManuelAnaliz(txt,txt);}}>{txt}</button>;})}
                </div>
              </div>
            )}
            {solTab==="portfoy"&&(
              <div style={{flex:1,overflowY:"auto",padding:14}}>
                <div style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:8,padding:12,marginBottom:10}}>
                  <input className="inp" placeholder="Sembol" value={yeniHisse.sembol} onChange={function(e){setYeniHisse(function(p){return Object.assign({},p,{sembol:e.target.value.toUpperCase()});});}} style={{marginBottom:6}}/>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={function(e){setYeniHisse(function(p){return Object.assign({},p,{adet:e.target.value});});}} style={{flex:1}}/>
                    <input className="inp" placeholder="₺ Maliyet" type="number" value={yeniHisse.maliyet} onChange={function(e){setYeniHisse(function(p){return Object.assign({},p,{maliyet:e.target.value});});}} style={{flex:1}}/>
                  </div>
                  <button onClick={hisseEkle} className="btn-p" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>+ Ekle</button>
                </div>
                {portfoy.map(function(h){
                  return(
                    <div key={h.id} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"9px 11px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:14,color:"#70d8a0",fontWeight:700,fontFamily:"monospace"}}>{h.sembol}</div><div style={{fontSize:10,color:"#2a5040"}}>{h.adet} adet · ₺{h.maliyet}</div></div>
                      <div style={{display:"flex",gap:4}}>
                        <button className="btn-sm" style={{borderColor:"#1e4a2a",color:"#5aaa70",background:"#0a1e12"}} onClick={function(){onManuelAnaliz(h.sembol+" analiz et",h.sembol);}}>Analiz</button>
                        <button className="btn-sm" style={{borderColor:"#3a1010",color:"#cc6060",background:"#150808"}} onClick={function(){setPortfoy(function(p){return p.filter(function(x){return x.id!==h.id;});});}}>Sil</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sağ */}
          <div className="sag">
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",background:"#0b0f14",flexShrink:0,paddingLeft:2,overflowX:"auto"}}>
              <button className={"tab"+(sagTab==="analiz"?" on":"")} onClick={function(){setSagTab("analiz");}}>3 AI {analizDevam&&<Dots size={4} color="#4a9a6a"/>}</button>
              <button className={"tab"+(sagTab==="teknik"?" on":"")} onClick={function(){setSagTab("teknik");}}>📊 Teknik</button>
              <button className={"tab"+(sagTab==="rapor"?" on":"")} onClick={function(){setSagTab("rapor");}}>📋 Rapor {raporYukl&&<Dots size={4} color="#f0b040"/>}</button>
              <button className={"tab"+(sagTab==="bulten"?" on":"")} onClick={function(){setSagTab("bulten");}}>📰 Bülten</button>
              <button className={"tab"+(sagTab==="istihbarat"?" on":"")} onClick={function(){setSagTab("istihbarat");}} style={{color:sagTab==="istihbarat"?"#c07ae0":""}}>🧠 İstihbarat</button>
              <button className={"tab"+(sagTab==="diger"?" on":"")} onClick={function(){setSagTab("diger");}}>Diğer</button>
            </div>
            {sagTab==="analiz"&&<AnalizPaneli {...aProps}/>}
            {sagTab==="teknik"&&<TeknikPaneli {...tProps}/>}
            {sagTab==="rapor"&&<RaporPaneli {...rProps}/>}
            {sagTab==="bulten"&&<BultenPaneli {...bProps}/>}
            {sagTab==="istihbarat"&&<IstihbaratPaneli {...iProps}/>}
            {sagTab==="diger"&&<DigerPaneli {...dProps}/>}
          </div>
        </div>

        {/* ─── MOBİL LAYOUT ─── */}
        <div className="mob-body">
          {aktifEkran==="haberler"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <HaberListesi {...hProps}/>
              {doviz&&doviz.kurlar&&doviz.kurlar.USDTRY&&<div style={{padding:"4px 10px",background:"#0a0e12",borderTop:"1px solid #1a2530",fontSize:10,color:"#2a5040",flexShrink:0}}>💱 USD/TRY <strong style={{color:"#50aa70"}}>{doviz.kurlar.USDTRY}</strong> · EUR/TRY <strong style={{color:"#50aa70"}}>{doviz.kurlar.EURTRY}</strong></div>}
            </div>
          )}
          {aktifEkran==="analiz"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
                <button className={"tab"+(analizAlt==="3ai"?" on":"")} onClick={function(){setAnalizAlt("3ai");}}>3 AI {analizDevam&&<Dots size={4} color="#4a9a6a"/>}</button>
                <button className={"tab"+(analizAlt==="bulten"?" on":"")} onClick={function(){setAnalizAlt("bulten");}}>📰 Bülten</button>
                <button className={"tab"+(analizAlt==="gecmis"?" on":"")} onClick={function(){setAnalizAlt("gecmis");}}>🕐 Geçmiş</button>
              </div>
              {analizAlt==="3ai"&&<AnalizPaneli {...aProps}/>}
              {analizAlt==="bulten"&&<BultenPaneli {...bProps}/>}
              {analizAlt==="gecmis"&&(
                <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
                  {gecmis.length===0?<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1e3040"}}>Henüz analiz yok</div>:gecmis.map(function(g){
                    return(
                      <div key={g.id} onClick={function(){onGecmisYukle(g);}} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer"}}>
                        <div style={{fontSize:12,color:"#80aab8",marginBottom:4,fontWeight:500}}>{g.baslik}</div>
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                          <div style={{display:"flex",gap:4}}>{Object.entries(AIT).map(function(entry){var k=entry[0],ai=entry[1];return <span key={k} style={{fontSize:9,color:g.analizler&&g.analizler[k]?ai.renk:"#2a3a4a"}}>{ai.logo}</span>;})}</div>
                          <span style={{fontSize:10,color:"#2a4050"}}>{g.zaman}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {aktifEkran==="teknik"&&<TeknikPaneli {...tProps}/>}
          {aktifEkran==="istihbarat"&&<IstihbaratPaneli {...iProps}/>}
          {aktifEkran==="rapor"&&<RaporPaneli {...rProps}/>}
          {aktifEkran==="diger"&&<DigerPaneli {...dProps}/>}
        </div>

        {/* ALT NAVİGASYON */}
        <div className="mob-nav">
          {[
            {id:"haberler",icon:"📡",label:"Haberler",badge:haberler.length||null},
            {id:"analiz",icon:"🤖",label:"Analiz",badge:analizDevam?"●":null,bc:"#4a9a6a"},
            {id:"teknik",icon:"📊",label:"Teknik"},
            {id:"istihbarat",icon:"🧠",label:"İstihbarat"},
            {id:"diger",icon:"⚙️",label:"Diğer",badge:portfoy.length||null},
          ].map(function(item){
            return(
              <button key={item.id} onClick={function(){setAktifEkran(item.id);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",position:"relative",color:aktifEkran===item.id?"#4aaa70":"#3a5060",fontFamily:"'Inter',sans-serif",paddingTop:6}}>
                <span style={{fontSize:20}}>{item.icon}</span>
                <span style={{fontSize:9,fontWeight:600}}>{item.label}</span>
                {item.badge&&<span style={{position:"absolute",top:4,right:"50%",transform:"translateX(12px)",background:item.bc||"#2a6050",color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:8,fontWeight:700,minWidth:14,textAlign:"center"}}>{item.badge}</span>}
                {aktifEkran===item.id&&<span style={{position:"absolute",bottom:0,left:"20%",right:"20%",height:2,background:"#4aaa70",borderRadius:1}}/>}
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="desk-footer">
          <span style={{fontSize:9,color:"#1e3040"}}>Bloomberg HT · Hürriyet · AA · Reuters · CNBC | Yahoo Finance</span>
          <span style={{fontSize:9,color:"#1e3040"}}>⚠ Yatırım tavsiyesi değildir</span>
        </div>
      </div>
    </>
  );
}

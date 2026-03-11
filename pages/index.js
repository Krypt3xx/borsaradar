// BorsaRadar v20 — istihbarat paneli, CSS media query layout, sıfır re-mount
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
const zamanFmt=d=>{try{const m=(Date.now()-new Date(d).getTime())/60000;if(m<60)return`${Math.floor(m)}dk`;if(m<1440)return`${Math.floor(m/60)}sa`;return`${Math.floor(m/1440)}g`;}catch{return"?";}};
const fmtFiyat=(f,s)=>{if(!f)return"—";if(s==="BTC-USD")return`$${Math.round(f).toLocaleString("tr-TR")}`;if(["^GSPC","^IXIC"].includes(s))return f.toLocaleString("tr-TR",{maximumFractionDigits:0});if(["USDTRY=X","EURTRY=X","GBPTRY=X"].includes(s))return`₺${f.toFixed(2)}`;if(s==="GC=F")return`$${Math.round(f).toLocaleString()}`;if(s==="BZ=F")return`$${f.toFixed(1)}`;if(s==="XU100.IS")return f.toLocaleString("tr-TR",{maximumFractionDigits:0});return f.toFixed(2);};
const toBIST=s=>{const b=["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM","SAHOL","KOZAL","MGROS","ULKER","ARCLK"];const x=["XU100","XU050","XU030"];if(b.includes(s)||x.includes(s))return`BIST:${s}`;if(s.includes(":"))return s;return s;};
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
/* LAYOUT — CSS media query, React state YOK */
.layout{flex:1;display:flex;overflow:hidden;min-height:0}
.sol{width:310px;flex-shrink:0;border-right:1px solid #1a2530;display:flex;flex-direction:column;overflow:hidden;background:#0b0f14}
.sag{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.mob-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0}
.mob-nav{height:58px;border-top:1px solid #1a2530;background:#090d12;display:flex;flex-shrink:0;padding-bottom:env(safe-area-inset-bottom)}
.desk-footer{height:24px;border-top:1px solid #1a2530;background:#0b0f14;display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0}
/* Desktop: sol+sag yan yana görünür, mobil gizli */
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
const Dots=memo(({color="#4a9a6a",size=6})=>(
  <span style={{display:"inline-flex",gap:4,alignItems:"center",verticalAlign:"middle"}}>
    {[0,1,2].map(i=><span key={i} style={{width:size,height:size,borderRadius:"50%",background:color,display:"inline-block",animation:`dp 1.3s ${i*.22}s infinite`}}/>)}
  </span>
));

// ─── HABER LİSTESİ ────────────────────────────────────────────────────────────
const HaberListesi=memo(({haberler,yukl,hata,filtre,setFiltre,secilenId,onClick,onYenile})=>{
  const liste=haberler.filter(h=>filtre==="TR"?h.dil==="tr":filtre==="EN"?h.dil==="en":true);
  return(
    <>
      <div style={{padding:"6px 10px",borderBottom:"1px solid #1a2530",display:"flex",gap:5,alignItems:"center",flexShrink:0,background:"#0b0f14"}}>
        {["TÜMÜ","TR","EN"].map(f=><button key={f} className={`fb${filtre===f?" on":""}`} onClick={()=>setFiltre(f)}>{f}</button>)}
        <span style={{fontSize:10,color:"#2a4050",marginLeft:"auto"}}>{liste.length}</span>
        <button onClick={onYenile} className="btn-sm" style={{borderColor:"#1e3a2a",color:"#4a8a60",background:"#0a1810",padding:"4px 10px"}}>{yukl?<Dots size={4}/>:"↻"}</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"6px 8px",WebkitOverflowScrolling:"touch"}}>
        {yukl&&liste.length===0&&<div style={{padding:28,textAlign:"center"}}><Dots/><div style={{marginTop:10,fontSize:12,color:"#4a7060"}}>Yükleniyor...</div></div>}
        {hata&&!yukl&&<div style={{margin:8,padding:12,background:"#180808",border:"1px solid #401818",borderRadius:6,color:"#e07070",fontSize:12}}>⚠ {hata}</div>}
        {liste.map((h,i)=>{
          const kr=KR[h.kategori]||KR["GENEL"],er=ER[h.etki]||ER["DÜŞÜK"];
          return(
            <div key={h.id} className={`hcard${secilenId===h.id?" sel":""}`} onClick={()=>onClick(h)}
              style={{background:"#101820",border:"1px solid #1c2c38",padding:"10px",marginBottom:5,animation:`fadein .18s ease ${Math.min(i*.015,.35)}s both`}}>
              <div style={{display:"flex",gap:4,marginBottom:5,alignItems:"center",flexWrap:"wrap"}}>
                <span className="badge" style={{background:kr.bg,color:kr.tx,border:`1px solid ${kr.bd}`}}>{h.kategori}</span>
                <span className="badge" style={{background:er.bg,color:er.tx,border:`1px solid ${er.bd}`}}>{h.etki}</span>
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

// ─── ANALİZ PANELİ ────────────────────────────────────────────────────────────
const AnalizPaneli=memo(({analizler,analizYukl,baslik,aktif,setAktif,goster})=>{
  if(!goster&&!Object.values(analizYukl).some(v=>v))return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,textAlign:"center",padding:24}}>
      <div style={{display:"flex",gap:12}}>{Object.values(AIT).map(ai=><div key={ai.isim} style={{width:52,height:52,borderRadius:12,background:ai.bg,border:`2px solid ${ai.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:ai.renk}}>{ai.logo}</div>)}</div>
      <div style={{fontSize:15,fontWeight:600,color:"#3a6050"}}>3 AI Paralel Analiz</div>
      <div style={{fontSize:12,color:"#2a4050",lineHeight:1.7}}>Haber seç · Manuel gir · Portföy analizi</div>
    </div>
  );
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1520",overflowX:"auto"}}>
        {Object.entries(AIT).map(([key,ai])=>(
          <button key={key} className="aitab" onClick={()=>setAktif(key)}
            style={{color:aktif===key?ai.renk:"#3a5060",borderBottomColor:aktif===key?ai.renk:"transparent",display:"flex",flexDirection:"column",alignItems:"flex-start",padding:"8px 14px",minWidth:80}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              {ai.logo} <span style={{fontSize:11}}>{ai.isim}</span>
              {analizYukl[key]&&<Dots color={ai.renk} size={4}/>}
              {!analizYukl[key]&&analizler[key]&&<span style={{fontSize:9,color:"#3a7050"}}>✓</span>}
            </div>
            <div style={{fontSize:8,color:aktif===key?ai.renk+"99":"#1e3040",marginTop:1}}>{ai.alt}</div>
          </button>
        ))}
        {baslik&&<div style={{flex:1,display:"flex",alignItems:"center",overflow:"hidden",paddingRight:10}}><span style={{fontSize:10,color:"#2a4050",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginLeft:8,fontStyle:"italic"}}>{baslik}</span></div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",WebkitOverflowScrolling:"touch"}}>
        {analizYukl[aktif]&&!analizler[aktif]?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots color={AIT[aktif].renk}/><div style={{fontSize:13,fontWeight:500,color:AIT[aktif].renk}}>{AIT[aktif].isim} analiz ediyor...</div></div>
        ):analizler[aktif]?(
          <div style={{animation:"fadein .3s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:16,padding:"8px 12px",borderRadius:6,background:AIT[aktif].bg,border:`1px solid ${AIT[aktif].bd}`}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:16,color:AIT[aktif].renk}}>{AIT[aktif].logo}</span>
                <span style={{fontSize:12,fontWeight:600,color:AIT[aktif].renk}}>{AIT[aktif].isim}</span>
              </div>
              {onTahminEkle&&<TahminEkleButon aiId={aktif} analizMetni={analizler[aktif]} onEkle={onTahminEkle}/>}
            </div>
            <div dangerouslySetInnerHTML={{__html:md(analizler[aktif])}} style={{fontSize:13,lineHeight:1.8,color:"#c0d8e4"}}/>
          </div>
        ):(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",color:"#1e3040",fontSize:12}}>Bu AI için analiz bekleniyor...</div>
        )}
      </div>
    </div>
  );
});

// ─── TEKNİK ANALİZ PANELİ ────────────────────────────────────────────────────
const TeknikPaneli=memo(({sembol,setSembol,veri,yukl,hata,tvSembol,onGoster,aiAnalizler,aiYukl,onAIAnalizEt,tab,setTab})=>{
  const t=veri;
  const rR=t?(t.rsi>70?"#ff7070":t.rsi<30?"#50dd90":"#80cccc"):"#80cccc";
  const mR=t?(t.macd?.histogram>0?"#50dd90":"#ff7070"):"#80cccc";

  const konsensus=(()=>{
    if(!aiAnalizler)return null;
    const v=Object.values(aiAnalizler).filter(Boolean);
    if(!v.length)return null;
    const al=v.filter(x=>x.karar==="AL").length,sat=v.filter(x=>x.karar==="SAT").length;
    if(al>=2)return{karar:"AL",r:"#50dd90",bg:"#0a2010",bd:"#3a8a50"};
    if(sat>=2)return{karar:"SAT",r:"#ff7070",bg:"#200a0a",bd:"#8a3a3a"};
    return{karar:"BEKLE",r:"#ffcc44",bg:"#181810",bd:"#6a6a30"};
  })();

  const HIZLI=["TUPRS","THYAO","EREGL","GARAN","AKBNK","XU100","NVDA","AAPL","GLD","BTC-USD"];

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Arama */}
      <div style={{padding:"8px 12px",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14"}}>
        <div style={{display:"flex",gap:8,marginBottom:7}}>
          <input className="inp" style={{flex:1}} placeholder="TUPRS, NVDA, XU100..."
            value={sembol} onChange={e=>setSembol(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==="Enter"&&onGoster(sembol)}/>
          <button className="btn-p" onClick={()=>onGoster(sembol)} disabled={!sembol||yukl} style={{padding:"8px 16px",fontSize:12,flexShrink:0}}>
            {yukl?<Dots size={5}/>:"Göster"}
          </button>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {HIZLI.map(s=><button key={s} className="qtag" onClick={()=>{setSembol(s);onGoster(s);}} style={{padding:"4px 8px"}}>{s}</button>)}
        </div>
      </div>

      {/* Boş */}
      {!tvSembol&&!yukl&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center",color:"#1e3040"}}>
          <div style={{fontSize:40,opacity:.08}}>📊</div>
          <div style={{fontSize:15,fontWeight:600,color:"#3a6050"}}>Gelişmiş Teknik Analiz</div>
          <div style={{fontSize:12,color:"#2a4050",lineHeight:1.9}}>TradingView Canlı Grafik · RSI · MACD · Bollinger<br/>Destek/Direnç Seviyeleri · İşlem Bölgeleri<br/>3 AI AL/SAT/BEKLE Kararı<br/>Hedef Fiyat · Stop-Loss · Beklenti Süresi</div>
        </div>
      )}
      {yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots/><div style={{fontSize:13,color:"#4a8a6a"}}>Veri yükleniyor...</div></div>}

      {/* İçerik */}
      {tvSembol&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
          {/* Sekmeler */}
          <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0c1218",overflowX:"auto"}}>
            {[["grafik","📈 Grafik"],["gostergeler","📊 Göstergeler"],["seviyeler","🎯 Seviyeler"],["ai","🤖 AI Karar"]].map(([k,l])=>(
              <button key={k} className={`tab${tab===k?" on":""}`} onClick={()=>setTab(k)} style={{fontSize:11}}>{l}</button>
            ))}
            {konsensus&&(
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",paddingRight:12,gap:6}}>
                <span style={{fontSize:10,color:"#3a5060"}}>Konsensus:</span>
                <span style={{fontSize:13,fontWeight:800,color:konsensus.r,background:konsensus.bg,border:`1px solid ${konsensus.bd}`,padding:"2px 12px",borderRadius:5}}>{konsensus.karar}</span>
              </div>
            )}
          </div>

          {/* GRAFIK — SVG tabanlı, kendi çizimimiz */}
          {tab==="grafik"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
              <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
                {t?.grafik?(()=>{
                  const fiyatlar=t.grafik.fiyatlar||[];
                  const tarihler=t.grafik.tarihler||[];
                  if(fiyatlar.length<2)return <div style={{textAlign:"center",padding:40,color:"#2a4050"}}>Grafik verisi yetersiz</div>;
                  const W=560,H=200,padL=56,padR=14,padT=12,padB=28;
                  const xs=W-padL-padR,ys=H-padT-padB;
                  const minF=Math.min(...fiyatlar)*0.998,maxF=Math.max(...fiyatlar)*1.002;
                  const xS=i=>padL+(i/(fiyatlar.length-1))*xs;
                  const yS=v=>padT+ys-(((v-minF)/(maxF-minF))*ys);
                  const pts=fiyatlar.map((v,i)=>`${xS(i)},${yS(v)}`).join(" ");
                  const area=`M${xS(0)},${H-padB} L${fiyatlar.map((v,i)=>`${xS(i)},${yS(v)}`).join(" L")} L${xS(fiyatlar.length-1)},${H-padB} Z`;
                  const sonFiyat=fiyatlar.at(-1),ilkFiyat=fiyatlar[0];
                  const yukselis=sonFiyat>=ilkFiyat;
                  const renk=yukselis?"#50dd90":"#ff7070";
                  const gridYs=[0,0.25,0.5,0.75,1];
                  // MA20 çizgisi (varsa)
                  const ma20pts=t.ma20?fiyatlar.map((_,i)=>`${xS(i)},${yS(t.ma20)}`).join(" "):null;
                  return(
                    <div>
                      {/* Fiyat özet */}
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
                      {/* SVG Grafik */}
                      <div style={{background:"#0a1018",border:"1px solid #1a2a38",borderRadius:8,overflow:"hidden",marginBottom:8}}>
                        <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",display:"block"}}>
                          <defs>
                            <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={renk} stopOpacity="0.25"/>
                              <stop offset="100%" stopColor={renk} stopOpacity="0.02"/>
                            </linearGradient>
                          </defs>
                          {/* Grid yatay çizgiler */}
                          {gridYs.map(r=>{
                            const y=padT+r*ys;
                            const val=maxF-r*(maxF-minF);
                            return(
                              <g key={r}>
                                <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#1a2530" strokeWidth={1}/>
                                <text x={padL-4} y={y+3} fill="#2a4050" fontSize={9} textAnchor="end">{val.toFixed(val>100?0:2)}</text>
                              </g>
                            );
                          })}
                          {/* Grid dikey çizgiler + tarih etiketleri */}
                          {[0,Math.floor(fiyatlar.length/4),Math.floor(fiyatlar.length/2),Math.floor(fiyatlar.length*3/4),fiyatlar.length-1].map(i=>(
                            <g key={i}>
                              <line x1={xS(i)} y1={padT} x2={xS(i)} y2={H-padB} stroke="#1a2530" strokeWidth={1} strokeDasharray="2,4"/>
                              <text x={xS(i)} y={H-padB+14} fill="#2a4050" fontSize={8} textAnchor="middle">{tarihler[i]||""}</text>
                            </g>
                          ))}
                          {/* Alan */}
                          <path d={area} fill="url(#grd)"/>
                          {/* MA20 referans çizgisi */}
                          {ma20pts&&<polyline points={ma20pts} fill="none" stroke="#4a7090" strokeWidth={1} strokeDasharray="4,3"/>}
                          {/* Fiyat çizgisi */}
                          <polyline points={pts} fill="none" stroke={renk} strokeWidth={2} strokeLinejoin="round"/>
                          {/* Son nokta */}
                          <circle cx={xS(fiyatlar.length-1)} cy={yS(sonFiyat)} r={4} fill={renk}/>
                          <circle cx={xS(fiyatlar.length-1)} cy={yS(sonFiyat)} r={7} fill={renk} opacity={0.2}/>
                          {/* MA20 etiketi */}
                          {t.ma20&&<text x={W-padR} y={yS(t.ma20)-3} fill="#4a7090" fontSize={8} textAnchor="end">MA20 {t.ma20}</text>}
                        </svg>
                      </div>
                      {/* Hacim bar'ları varsa — mini gösterge */}
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {[
                          {l:"RSI",v:t.rsi,y:t.rsiYorum,c:t.rsi>70?"#ff7070":t.rsi<30?"#50dd90":"#80cccc"},
                          {l:"MACD",v:t.macd?.deger,y:t.macdYorum,c:t.macd?.histogram>0?"#50dd90":"#ff7070"},
                          {l:"MA20",v:t.ma20,y:t.fiyat>t.ma20?"Fiyat üstünde":"Fiyat altında",c:t.fiyat>t.ma20?"#50dd90":"#ff7070"},
                          t.ma50&&{l:"MA50",v:t.ma50,y:t.fiyat>t.ma50?"Üstünde":"Altında",c:t.fiyat>t.ma50?"#50dd90":"#ff7070"},
                        ].filter(Boolean).map(x=>(
                          <div key={x.l} style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:6,padding:"6px 10px",flex:1,minWidth:80}}>
                            <div style={{fontSize:9,color:"#3a6070",marginBottom:2}}>{x.l}</div>
                            <div style={{fontSize:13,fontWeight:700,color:x.c,fontFamily:"monospace"}}>{typeof x.v==="number"?x.v.toFixed(x.v>100?1:2):x.v}</div>
                            <div style={{fontSize:9,color:x.c,marginTop:1}}>{x.y}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })():(
                  hata
                  ?<div style={{padding:20,background:"#180808",border:"1px solid #3a1010",borderRadius:8,color:"#e07070",fontSize:12}}>⚠ {hata}<br/><button onClick={()=>onGoster(tvSembol)} className="btn-p" style={{marginTop:10,fontSize:11,padding:"6px 14px"}}>Tekrar Dene</button></div>
                  :<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:10}}><Dots/><div style={{fontSize:12,color:"#4a8a6a"}}>Grafik yükleniyor...</div></div>
                )}
              </div>
              <div style={{padding:"8px 12px",borderTop:"1px solid #1a2530",background:"#0b0f14",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                <button className="btn-p" onClick={onAIAnalizEt} disabled={aiYukl} style={{flex:1,padding:"9px",fontSize:12,borderColor:"#3a5a80",color:"#80a8e0",background:"#0a1428"}}>
                  {aiYukl?<><Dots color="#80a8e0" size={5}/> Analiz ediliyor...</>:"🤖 3 AI ile AL / SAT / BEKLE Kararı Al"}
                </button>
                {konsensus&&<span style={{fontSize:14,fontWeight:800,color:konsensus.r,background:konsensus.bg,border:`1px solid ${konsensus.bd}`,padding:"7px 16px",borderRadius:6,flexShrink:0}}>{konsensus.karar}</span>}
              </div>
            </div>
          )}

          {/* GÖSTERGELER */}
          {tab==="gostergeler"&&(
            <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
              {t?(
                <>
                  <div style={{background:"#0d1520",border:"1px solid #1e3040",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div><span style={{fontSize:24,fontWeight:800,color:"#e0f0e8",fontFamily:"monospace"}}>{t.fiyat}</span><span style={{fontSize:11,color:"#3a6050",marginLeft:8}}>{tvSembol}</span></div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:700,color:t.trend==="YÜKSELİŞ"?"#50dd90":t.trend==="DÜŞÜŞ"?"#ff7070":"#8090cc"}}>{t.trend==="YÜKSELİŞ"?"▲ YÜKSELİŞ":t.trend==="DÜŞÜŞ"?"▼ DÜŞÜŞ":"◆ YATAY"}</div>
                        <div style={{fontSize:10,color:"#3a5060"}}>Trend</div>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:"#3a6050",marginBottom:4}}>Teknik Güç</div>
                    <div className="sb"><div className="sbf" style={{width:`${t.guc||50}%`,background:t.guc>60?"#50dd90":t.guc<40?"#ff7070":"#ffcc44"}}/></div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a4050",marginTop:2}}><span>SAT</span><span>NÖTR</span><span>AL</span></div>
                  </div>

                  {/* RSI */}
                  <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#4a8090"}}>RSI (14)</span>
                      <span style={{fontSize:16,fontWeight:800,color:rR,fontFamily:"monospace"}}>{t.rsi}</span>
                    </div>
                    <div className="sb"><div className="sbf" style={{width:`${t.rsi}%`,background:rR}}/></div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9}}>
                      <span style={{color:"#50dd90"}}>30 Aşırı Sat</span>
                      <span style={{fontWeight:600,color:rR}}>{t.rsiYorum}</span>
                      <span style={{color:"#ff7070"}}>70 Aşırı Al</span>
                    </div>
                  </div>

                  {/* MACD */}
                  <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#4a8090"}}>MACD (12,26,9)</span>
                      <span style={{fontSize:11,fontWeight:600,color:mR}}>{t.macdYorum}</span>
                    </div>
                    <div style={{display:"flex",gap:16,fontSize:11,fontFamily:"monospace"}}>
                      <div><div style={{fontSize:9,color:"#3a5060"}}>MACD</div><div style={{color:"#c0d8e4"}}>{t.macd?.deger}</div></div>
                      <div><div style={{fontSize:9,color:"#3a5060"}}>Sinyal</div><div style={{color:"#c0d8e4"}}>{t.macd?.sinyal}</div></div>
                      <div><div style={{fontSize:9,color:"#3a5060"}}>Histogram</div><div style={{color:mR}}>{t.macd?.histogram}</div></div>
                    </div>
                  </div>

                  {/* Hareketli Ortalamalar */}
                  <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px",marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#4a8090",marginBottom:8}}>Hareketli Ortalamalar</div>
                    {[["MA20",t.ma20],["MA50",t.ma50]].filter(([,v])=>v).map(([k,v])=>{
                      const fp=parseFloat(String(t.fiyat).replace(/[^0-9.]/g,""));const mv=parseFloat(v);const ust=fp>mv;
                      return(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,padding:"5px 8px",background:ust?"#08180e":"#180808",borderRadius:4,border:`1px solid ${ust?"#1a4020":"#401010"}`}}>
                          <span style={{fontSize:11,color:"#4a7080"}}>{k}</span>
                          <span style={{fontSize:11,fontFamily:"monospace",color:"#c0d8e4"}}>{v}</span>
                          <span style={{fontSize:10,fontWeight:600,color:ust?"#50dd90":"#ff7070"}}>{ust?"▲ Üstünde":"▼ Altında"}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hacim */}
                  {t.hacim&&(
                    <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#4a8090",marginBottom:6}}>Hacim</div>
                      <div style={{display:"flex",gap:16,fontSize:11,fontFamily:"monospace"}}>
                        <div><div style={{fontSize:9,color:"#3a5060"}}>Son</div><div style={{color:"#c0d8e4"}}>{t.hacim.son?.toLocaleString("tr-TR")}</div></div>
                        <div><div style={{fontSize:9,color:"#3a5060"}}>Ort (20g)</div><div style={{color:"#c0d8e4"}}>{t.hacim.ortalama?.toLocaleString("tr-TR")}</div></div>
                        <div><div style={{fontSize:9,color:"#3a5060"}}>Durum</div><div style={{color:t.hacim.yorum?.includes("YÜKSEK")?"#50dd90":t.hacim.yorum?.includes("DÜŞÜK")?"#ff7070":"#c0d8e4"}}>{t.hacim.yorum}</div></div>
                      </div>
                    </div>
                  )}
                </>
              ):(
                <div style={{textAlign:"center",color:"#2a4050",padding:40,lineHeight:2}}>Gösterge verisi yüklenemedi<br/><button onClick={()=>onGoster(sembol)} className="btn-p" style={{marginTop:12,fontSize:12,padding:"8px 16px"}}>Tekrar Dene</button></div>
              )}
            </div>
          )}

          {/* SEVİYELER */}
          {tab==="seviyeler"&&(
            <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
              {t?.seviyeler?(
                <>
                  <div style={{background:"#0d1e28",border:"1px solid #1e4060",borderRadius:8,padding:"12px",marginBottom:14,textAlign:"center"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#4a8090",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>PIVOT NOKTASI</div>
                    <div style={{fontSize:26,fontWeight:800,color:"#80c0cc",fontFamily:"monospace"}}>{t.seviyeler.pivot}</div>
                    <div style={{fontSize:10,color:"#3a6070",marginTop:4}}>(Yüksek + Düşük + Kapanış) / 3</div>
                  </div>

                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#ff7070",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>DİRENÇ SEVİYELERİ</div>
                    {[{l:"R2 — Güçlü Direnç",v:t.seviyeler.direnc2,c:"#ff6060"},{l:"R1 — Yakın Direnç",v:t.seviyeler.direnc1,c:"#ff9060"}].map(({l,v,c})=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#1a0808",border:`1px solid ${c}33`,borderRadius:6,marginBottom:5}}>
                        <span style={{fontSize:11,color:"#6a4040"}}>{l}</span>
                        <span style={{fontSize:16,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#50dd90",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>DESTEK SEVİYELERİ</div>
                    {[{l:"S1 — Yakın Destek",v:t.seviyeler.destek1,c:"#60cc80"},{l:"S2 — Güçlü Destek",v:t.seviyeler.destek2,c:"#40aa60"}].map(({l,v,c})=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#081808",border:`1px solid ${c}33`,borderRadius:6,marginBottom:5}}>
                        <span style={{fontSize:11,color:"#3a6040"}}>{l}</span>
                        <span style={{fontSize:16,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {t.seviyeler.destek1&&t.seviyeler.direnc1&&(
                    <div style={{background:"#0d1520",border:"1px solid #1e3040",borderRadius:8,padding:"12px",marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#4a8090",marginBottom:10}}>📍 İşlem Bölgeleri</div>
                      <div style={{display:"flex",gap:8}}>
                        <div style={{flex:1,background:"#0a2010",border:"1px solid #3a8a50",borderRadius:6,padding:"10px"}}>
                          <div style={{fontSize:9,color:"#3a7050",fontWeight:700,marginBottom:4}}>ALİŞ BÖLGESİ</div>
                          <div style={{fontSize:13,color:"#50dd90",fontFamily:"monospace",fontWeight:700}}>{t.seviyeler.destek1}–{t.seviyeler.destek2||"?"}</div>
                          <div style={{fontSize:9,color:"#2a5030",marginTop:4}}>Destek bölgesinde al</div>
                        </div>
                        <div style={{flex:1,background:"#1a0808",border:"1px solid #8a3a3a",borderRadius:6,padding:"10px"}}>
                          <div style={{fontSize:9,color:"#6a3030",fontWeight:700,marginBottom:4}}>SATIŞ BÖLGESİ</div>
                          <div style={{fontSize:13,color:"#ff7070",fontFamily:"monospace",fontWeight:700}}>{t.seviyeler.direnc1}–{t.seviyeler.direnc2||"?"}</div>
                          <div style={{fontSize:9,color:"#5a2020",marginTop:4}}>Direnç bölgesinde sat</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mevcut fiyat konumu */}
                  {t.fiyat&&t.seviyeler.destek1&&t.seviyeler.direnc1&&(()=>{
                    const f=t.fiyat,d1=t.seviyeler.destek1,r1=t.seviyeler.direnc1;
                    const uzaklikD=((f-d1)/f*100).toFixed(1);
                    const uzaklikR=((r1-f)/f*100).toFixed(1);
                    return(
                      <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px"}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#4a8090",marginBottom:8}}>📏 Fiyat Konumu</div>
                        <div style={{display:"flex",gap:8}}>
                          <div style={{flex:1,textAlign:"center",padding:"8px",background:"#081808",borderRadius:5}}>
                            <div style={{fontSize:9,color:"#3a7050"}}>Desteğe Uzaklık</div>
                            <div style={{fontSize:16,fontWeight:700,color:"#50dd90",fontFamily:"monospace"}}>%{uzaklikD}</div>
                          </div>
                          <div style={{flex:1,textAlign:"center",padding:"8px",background:"#180808",borderRadius:5}}>
                            <div style={{fontSize:9,color:"#6a3030"}}>Dirence Uzaklık</div>
                            <div style={{fontSize:16,fontWeight:700,color:"#ff9060",fontFamily:"monospace"}}>%{uzaklikR}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ):(
                <div style={{textAlign:"center",color:"#2a4050",padding:40}}>Seviye verisi yüklenemedi</div>
              )}
            </div>
          )}

          {/* AI KARAR */}
          {tab==="ai"&&(
            <div style={{flex:1,overflowY:"auto",padding:"12px",WebkitOverflowScrolling:"touch"}}>
              {!aiAnalizler&&!aiYukl&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70%",gap:16,textAlign:"center"}}>
                  <div style={{fontSize:36,opacity:.1}}>🤖</div>
                  <div style={{fontSize:14,fontWeight:600,color:"#3a6070"}}>3 AI Teknik Değerlendirme</div>
                  <div style={{fontSize:12,color:"#2a4050",lineHeight:1.9}}>
                    Claude · GPT-4o Mini · Llama 3.3<br/>
                    RSI + MACD + Trend + Destek/Direnç → Karar<br/>
                    <strong style={{color:"#4a8090"}}>AL / SAT / BEKLE</strong><br/>
                    Hedef fiyat · Stop-loss · Beklenti süresi · Risk
                  </div>
                  <button className="btn-p" onClick={onAIAnalizEt} style={{padding:"12px 28px",fontSize:13,borderColor:"#3a5a80",color:"#80a8e0",background:"#0a1428"}}>
                    🤖 3 AI Kararını Al
                  </button>
                </div>
              )}
              {aiYukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots color="#80a8e0"/><div style={{fontSize:13,color:"#6090b0"}}>3 AI teknik analiz yapıyor...</div></div>}
              {aiAnalizler&&!aiYukl&&(
                <div style={{animation:"fadein .3s ease"}}>
                  {konsensus&&(
                    <div style={{background:konsensus.bg,border:`2px solid ${konsensus.bd}`,borderRadius:10,padding:"14px",marginBottom:14,textAlign:"center"}}>
                      <div style={{fontSize:10,color:konsensus.r,marginBottom:6,fontWeight:700,letterSpacing:".08em"}}>3 AI KONSENSUS KARARI</div>
                      <div style={{fontSize:32,fontWeight:900,color:konsensus.r,fontFamily:"monospace"}}>{konsensus.karar}</div>
                      <div style={{fontSize:10,color:konsensus.r+"99",marginTop:4}}>
                        {Object.values(aiAnalizler).filter(a=>a?.karar==="AL").length} AL · {Object.values(aiAnalizler).filter(a=>a?.karar==="SAT").length} SAT · {Object.values(aiAnalizler).filter(a=>a?.karar==="BEKLE").length} BEKLE
                      </div>
                    </div>
                  )}

                  {Object.entries(AIT).map(([key,ai])=>{
                    const a=aiAnalizler[key];
                    if(!a)return null;
                    const r=a.karar==="AL"?"#50dd90":a.karar==="SAT"?"#ff7070":"#ffcc44";
                    const bg=a.karar==="AL"?"#0a2010":a.karar==="SAT"?"#200a0a":"#181810";
                    const bd=a.karar==="AL"?"#3a8a50":a.karar==="SAT"?"#8a3a3a":"#6a6a30";
                    return(
                      <div key={key} style={{background:bg,border:`2px solid ${bd}`,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
                        {/* Header */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{color:ai.renk,fontSize:16}}>{ai.logo}</span>
                            <span style={{fontSize:12,fontWeight:700,color:ai.renk}}>{ai.isim}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {a.guven!=null&&<span style={{fontSize:10,color:"#4a6070"}}>%{a.guven} güven</span>}
                            <span style={{fontSize:18,fontWeight:900,color:r,background:"#00000030",padding:"3px 14px",borderRadius:6,fontFamily:"monospace"}}>{a.karar}</span>
                          </div>
                        </div>

                        {/* Hedef & Stop */}
                        {(a.hedef||a.stop)&&(
                          <div style={{display:"flex",gap:8,marginBottom:10}}>
                            {a.hedef&&(
                              <div style={{flex:1,background:"#08200e",border:"1px solid #2a6a3a",borderRadius:6,padding:"8px 10px"}}>
                                <div style={{fontSize:9,color:"#3a7050",fontWeight:700}}>🎯 HEDEF FİYAT</div>
                                <div style={{fontSize:15,fontWeight:700,color:"#50dd90",fontFamily:"monospace",marginTop:2}}>{a.hedef}</div>
                              </div>
                            )}
                            {a.stop&&(
                              <div style={{flex:1,background:"#200808",border:"1px solid #6a2a2a",borderRadius:6,padding:"8px 10px"}}>
                                <div style={{fontSize:9,color:"#6a3030",fontWeight:700}}>🛡️ STOP-LOSS</div>
                                <div style={{fontSize:15,fontWeight:700,color:"#ff7070",fontFamily:"monospace",marginTop:2}}>{a.stop}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Risk/Ödül Oranı */}
                        {a.hedef&&a.stop&&t?.fiyat&&(()=>{
                          const f=parseFloat(t.fiyat),h=parseFloat(a.hedef),s=parseFloat(a.stop);
                          if(isNaN(f)||isNaN(h)||isNaN(s))return null;
                          const kazanc=Math.abs(h-f),risk=Math.abs(f-s);
                          const oran=(kazanc/risk).toFixed(2);
                          const pct_h=((h-f)/f*100).toFixed(1),pct_s=((s-f)/f*100).toFixed(1);
                          return(
                            <div style={{background:"#0a1520",border:"1px solid #1e3040",borderRadius:6,padding:"8px 10px",marginBottom:10,display:"flex",gap:12,alignItems:"center"}}>
                              <div style={{flex:1}}><div style={{fontSize:9,color:"#3a6050"}}>Risk/Ödül</div><div style={{fontSize:14,fontWeight:700,color:parseFloat(oran)>=2?"#50dd90":"#ffcc44",fontFamily:"monospace"}}>1:{oran}</div></div>
                              <div style={{flex:1}}><div style={{fontSize:9,color:"#50dd90"}}>Potansiyel Kazanç</div><div style={{fontSize:12,color:"#50dd90",fontFamily:"monospace"}}>%{pct_h}</div></div>
                              <div style={{flex:1}}><div style={{fontSize:9,color:"#ff7070"}}>Maks Risk</div><div style={{fontSize:12,color:"#ff7070",fontFamily:"monospace"}}>%{pct_s}</div></div>
                            </div>
                          );
                        })()}

                        {/* Süre */}
                        {a.sure&&<div style={{fontSize:11,color:"#4a8090",marginBottom:8}}>⏱ Beklenti: <strong style={{color:"#80b8c8"}}>{a.sure}</strong></div>}

                        {/* Gerekçe */}
                        {a.gerekceler&&<div style={{fontSize:11,lineHeight:1.7,color:"#8ab0b8",borderTop:"1px solid #1a2530",paddingTop:8}}>{a.gerekceler}</div>}

                        {/* Risk */}
                        {a.risk&&<div style={{fontSize:10,color:"#8a6040",marginTop:8,padding:"5px 8px",background:"#180e08",border:"1px solid #3a2010",borderRadius:4}}>⚠ Risk: {a.risk}</div>}

                        {/* Güven bar */}
                        {a.guven!=null&&<div style={{marginTop:8}}><div className="sb"><div className="sbf" style={{width:`${a.guven}%`,background:r}}/></div></div>}
                      </div>
                    );
                  })}

                  <div style={{marginTop:8,padding:"8px 12px",background:"#0d1218",border:"1px solid #1a2030",borderRadius:6,fontSize:10,color:"#2a4050",lineHeight:1.6}}>
                    ⚠ AI analizleri bilgi amaçlıdır, yatırım tavsiyesi değildir. Kendi araştırmanızla destekleyin.
                  </div>
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
const BultenPaneli=memo(({bulten,yukl,aktif,setAktif,haberSayisi,onUret})=>(
  <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{padding:"8px 14px",borderBottom:"1px solid #1a2530",flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0b0f14"}}>
      <div><div style={{fontSize:12,fontWeight:600,color:"#8a7040"}}>📰 Sabah Bülteni</div><div style={{fontSize:10,color:"#3a4030"}}>{haberSayisi} haber</div></div>
      <button className="btn-p" onClick={onUret} disabled={yukl||!haberSayisi} style={{padding:"7px 14px",fontSize:12,borderColor:"#5a6030",color:"#aab860",background:"#1a1e08"}}>{yukl?<Dots color="#aab860" size={5}/>:"🌅 Üret"}</button>
    </div>
    <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0d1208",overflowX:"auto"}}>
      {[{k:"llama",l:"Llama",logo:"🦙",r:"#c07ae0"},{k:"gpt",l:"GPT-4o",logo:"⬡",r:"#10a37f"},{k:"claude",l:"Claude",logo:"✦",r:"#4a8af0"}].map(ai=>(
        <button key={ai.k} className="aitab" onClick={()=>setAktif(ai.k)} style={{color:aktif===ai.k?ai.r:"#3a5060",borderBottomColor:aktif===ai.k?ai.r:"transparent",padding:"7px 14px"}}>
          {ai.logo} {ai.l} {yukl?<Dots color={ai.r} size={4}/>:bulten[ai.k]?<span style={{fontSize:9,color:"#3a7050"}}>✓</span>:null}
        </button>
      ))}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"16px",WebkitOverflowScrolling:"touch"}}>
      {!bulten.llama&&!yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center"}}><div style={{fontSize:36,opacity:.15}}>📰</div><div style={{fontSize:14,fontWeight:600,color:"#5a6040"}}>Sabah Bülteni</div><div style={{fontSize:12,color:"#2a3020",lineHeight:1.7}}>3 AI son haberleri analiz eder.</div></div>}
      {yukl&&!bulten[aktif]&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60%",gap:12}}><Dots color="#aab860"/><div style={{fontSize:13,color:"#8a9050"}}>Hazırlanıyor...</div></div>}
      {bulten[aktif]&&<div style={{animation:"fadein .3s ease"}}><div style={{fontSize:13,lineHeight:1.9,color:"#a8c4b0"}} dangerouslySetInnerHTML={{__html:md(bulten[aktif])}}/></div>}
    </div>
  </div>
));

// ─── RAPOR PANELİ ─────────────────────────────────────────────────────────────
const RaporPaneli=memo(({raporVeri,yukl,tip,setTip,aktifAI,setAktifAI,doviz,haberSayisi,onUret})=>(
  <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{padding:"8px 12px",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14"}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:0,borderRadius:6,overflow:"hidden",border:"1px solid #1e2d38"}}>
          <button onClick={()=>setTip("gunluk")} style={{padding:"6px 12px",fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",background:tip==="gunluk"?"#0e2a1a":"#101820",color:tip==="gunluk"?"#6abf90":"#3a6050",border:"none",cursor:"pointer"}}>📊 Günlük</button>
          <button onClick={()=>setTip("haftalik")} style={{padding:"6px 12px",fontSize:11,fontWeight:600,fontFamily:"'Inter',sans-serif",background:tip==="haftalik"?"#0e2a1a":"#101820",color:tip==="haftalik"?"#6abf90":"#3a6050",border:"none",borderLeft:"1px solid #1e2d38",cursor:"pointer"}}>📅 Haftalık</button>
        </div>
        <button className="btn-p" onClick={onUret} disabled={yukl||!haberSayisi} style={{padding:"7px 14px",fontSize:12,flex:1}}>{yukl?<><Dots size={5}/> Hazırlanıyor...</>:"🚀 Rapor Üret"}</button>
      </div>
      {doviz?.kurlar?.USDTRY&&<div style={{fontSize:10,color:"#2a5040"}}>💱 USD/TRY {doviz.kurlar.USDTRY} · EUR/TRY {doviz.kurlar.EURTRY}</div>}
    </div>
    {raporVeri&&<div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,padding:"0 4px",background:"#0c1410",overflowX:"auto"}}>
      {[{k:"llama",l:"Llama",logo:"🦙",r:"#c07ae0"},{k:"gpt",l:"GPT-4o",logo:"⬡",r:"#10a37f"},{k:"claude",l:"Claude",logo:"✦",r:"#4a8af0"}].map(ai=>(
        <button key={ai.k} className="aitab" onClick={()=>setAktifAI(ai.k)} style={{color:aktifAI===ai.k?ai.r:"#3a5060",borderBottomColor:aktifAI===ai.k?ai.r:"transparent",padding:"7px 12px"}}>{ai.logo} {ai.l} {!yukl&&raporVeri[ai.k]?.text?<span style={{marginLeft:4,fontSize:9,color:"#3a7050"}}>✓</span>:null}</button>
      ))}
    </div>}
    <div style={{flex:1,overflowY:"auto",padding:"14px",WebkitOverflowScrolling:"touch"}}>
      {!raporVeri&&!yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,textAlign:"center"}}><div style={{fontSize:36,opacity:.08}}>📋</div><div style={{fontSize:14,fontWeight:600,color:"#4a6040"}}>Profesyonel Piyasa Raporu</div></div>}
      {yukl&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70%",gap:12}}><Dots color="#f0b040"/><div style={{fontSize:13,color:"#b09030"}}>Hazırlanıyor...</div></div>}
      {raporVeri&&!yukl&&(()=>{const a=raporVeri[aktifAI];if(!a)return null;if(a.error)return<div style={{padding:12,background:"#180808",border:"1px solid #3a1010",borderRadius:6,color:"#e07070",fontSize:12}}>❌ {a.error}</div>;return<div style={{animation:"fadein .3s ease"}}><div style={{fontSize:13,lineHeight:2,color:"#a8c4cc"}} dangerouslySetInnerHTML={{__html:md(a.text)}}/></div>;})()}
    </div>
  </div>
));

// ─── DİĞER PANELİ ─────────────────────────────────────────────────────────────
// ─── İSTİHBARAT PANELİ ───────────────────────────────────────────────────────
const IstihbaratPaneli = memo(function IstihbaratPaneli(props) {
  const duygu           = props.duygu       || null;
  const duyguYukl       = props.duyguYukl   || false;
  const onDuyguHesapla  = props.onDuyguHesapla;
  const sektor          = props.sektor      || null;
  const sektorYukl      = props.sektorYukl  || false;
  const zamanlama       = props.zamanlama   || null;
  const zamanlamaYukl   = props.zamanlamaYukl || false;
  const onZamanlamaHesapla = props.onZamanlamaHesapla;
  const zamanlamaSembol = props.zamanlamaSembol || "";
  const setZamanlamaSembol = props.setZamanlamaSembol;
  const tahminler       = props.tahminler   || [];
  const aktifTab        = props.aktifTab    || "duygu";
  const setAktifTab     = props.setAktifTab;
  const haberler        = props.haberler    || [];

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
        {[["duygu","🧠 Duygu"],["sektor","🗺 Sektör"],["zamanlama","⏱ Zamanlama"]].map(function(item) {
          return <button key={item[0]} className={"tab"+(aktifTab===item[0]?" on":"")} onClick={function(){setAktifTab(item[0]);}} style={{fontSize:11}}>{item[1]}</button>;
        })}
      </div>

      {aktifTab==="duygu" && (
        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:"#4a8090"}}>🧠 Piyasa Duygu Endeksi</div>
            <button onClick={onDuyguHesapla} disabled={duyguYukl || haberler.length===0} className="btn-p" style={{padding:"6px 14px",fontSize:11}}>
              {duyguYukl ? <Dots size={4}/> : "Hesapla"}
            </button>
          </div>
          {(!duygu && !duyguYukl) && (
            <div style={{textAlign:"center",padding:40,color:"#2a4050",lineHeight:2,fontSize:12}}>
              <div style={{fontSize:32,opacity:.1,marginBottom:8}}>🧠</div>
              Son haberlerin tonunu analiz eder
            </div>
          )}
          {duyguYukl && <div style={{display:"flex",justifyContent:"center",padding:40}}><Dots color="#80a8c0"/></div>}
          {(duygu && !duyguYukl) && (
            <div>
              <div style={{background:"#0d1520",border:"1px solid #2a4050",borderRadius:12,padding:20,marginBottom:14,textAlign:"center"}}>
                <div style={{position:"relative",height:14,background:"linear-gradient(to right,#4488ff,#aaaaaa,#ff4444)",borderRadius:7,marginBottom:12}}>
                  <div style={{position:"absolute",top:"50%",left:String(duygu.endeks||50)+"%",transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:"50%",background:"#fff",border:"3px solid #0f1318"}}/>
                </div>
                <div style={{fontSize:28,fontWeight:900,color:String(duygu.renk||"#aaa"),fontFamily:"monospace",marginBottom:4}}>{duygu.endeks||0}</div>
                <div style={{fontSize:15,fontWeight:700,color:String(duygu.renk||"#aaa"),marginBottom:6}}>{String(duygu.etiket||"")}</div>
                <div style={{fontSize:11,color:"#8ab0b8",lineHeight:1.6}}>{String(duygu.aciklama||"")}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {aktifTab==="sektor" && (
        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          {(!sektor && !sektorYukl) && (
            <div style={{textAlign:"center",padding:40,color:"#2a4050",lineHeight:2,fontSize:12}}>
              <div style={{fontSize:32,opacity:.1,marginBottom:8}}>🗺</div>
              Bir haberi analiz et — etkilenen sektörler listelenir
            </div>
          )}
          {sektorYukl && <div style={{display:"flex",justifyContent:"center",padding:40}}><Dots color="#80c0a0"/></div>}
          {(sektor && !sektorYukl) && (
            <div>
              <div style={{fontSize:11,color:"#4a7080",marginBottom:10}}>
                {String(sektor.sektorSayisi||0)} sektör · {String((sektor.onerilenHisseler||[]).length)} hisse
              </div>
              {(sektor.onerilenHisseler||[]).map(function(h,i) {
                var eRenk = h.etki==="DOĞRUDAN"?"#ff9060":h.etki==="POZİTİF"?"#50dd90":h.etki==="TERS"?"#ff7070":"#ffcc44";
                return (
                  <div key={i} style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:800,color:"#70d8a0",fontFamily:"monospace"}}>{String(h.sembol||"")}</span>
                      <span style={{fontSize:11,color:"#4a6070"}}>{String(h.isim||"")}</span>
                      <span style={{fontSize:9,fontWeight:700,color:eRenk,background:eRenk+"20",padding:"1px 6px",borderRadius:4}}>{String(h.etki||"")}</span>
                    </div>
                    <div style={{fontSize:11,color:"#5a8090",lineHeight:1.5}}>{String(h.aciklama||"")}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {aktifTab==="zamanlama" && (
        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:"#4a8090",marginBottom:6}}>Fiyat Penceresi — Haber fiyatlandı mı?</div>
            <div style={{display:"flex",gap:8}}>
              <input className="inp" style={{flex:1}} placeholder="GARAN, NVDA, BTC-USD..."
                value={zamanlamaSembol} onChange={function(e){setZamanlamaSembol(e.target.value.toUpperCase());}}
                onKeyDown={function(e){if(e.key==="Enter"&&zamanlamaSembol)onZamanlamaHesapla(zamanlamaSembol);}}/>
              <button className="btn-p" onClick={function(){if(zamanlamaSembol)onZamanlamaHesapla(zamanlamaSembol);}} disabled={!zamanlamaSembol||zamanlamaYukl} style={{padding:"8px 14px",fontSize:12,flexShrink:0}}>
                {zamanlamaYukl ? <Dots size={5}/> : "Analiz"}
              </button>
            </div>
          </div>
          {zamanlamaYukl && <div style={{display:"flex",justifyContent:"center",padding:40}}><Dots color="#80b0c0"/></div>}
          {(zamanlama && !zamanlamaYukl) && (
            <div>
              <div style={{background:"#0d1520",border:"1px solid #2a5060",borderRadius:10,padding:14,marginBottom:10,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#3a6070",marginBottom:6}}>
                  {String(zamanlama.sembol||"")} · {zamanlama.para==="USD"?"$":"₺"}{String(zamanlama.sonFiyat||"—")}
                </div>
                <div style={{fontSize:16,fontWeight:800,color:String(zamanlama.pencereRenk||"#aaa"),marginBottom:10}}>
                  {String(zamanlama.pencere||"—")}
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                  <div style={{textAlign:"center",padding:"8px 14px",background:"#00000030",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#3a6070"}}>4s Değişim</div>
                    <div style={{fontSize:16,fontWeight:700,color:(zamanlama.degisim4s||0)>=0?"#50dd90":"#ff7070",fontFamily:"monospace"}}>{(zamanlama.degisim4s||0)>=0?"+":""}{String(zamanlama.degisim4s||0)}%</div>
                  </div>
                  <div style={{textAlign:"center",padding:"8px 14px",background:"#00000030",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#3a6070"}}>Hacim/Ort</div>
                    <div style={{fontSize:16,fontWeight:700,color:(zamanlama.hacimOrani||1)>1.5?"#ff9060":"#50dd90",fontFamily:"monospace"}}>{String(zamanlama.hacimOrani||1)}x</div>
                  </div>
                  <div style={{textAlign:"center",padding:"8px 14px",background:"#00000030",borderRadius:6}}>
                    <div style={{fontSize:9,color:"#3a6070"}}>Fiyatlanma</div>
                    <div style={{fontSize:16,fontWeight:700,color:(zamanlama.fiyatlanmaPct||0)>60?"#ff7070":"#50dd90",fontFamily:"monospace"}}>%{String(zamanlama.fiyatlanmaPct||0)}</div>
                  </div>
                </div>
              </div>
              <div style={{background:"#101820",border:"1px solid #1e2d38",borderRadius:7,padding:"10px 12px",fontSize:11,color:"#6a9090",lineHeight:1.7}}>
                Fiyatlanma 70+ ise piyasa haberi zaten biliyor<br/>
                Fiyatlanma 30- ise pencere hala acik<br/>
                Hacim 2x+ ise buyuk oyuncular hareket ediyor
              </div>
            </div>
          )}
        </div>
      )}

        <div style={{flex:1,overflowY:"auto",padding:12,WebkitOverflowScrolling:"touch"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            {tahminler.length > 0 && (
              </button>
            )}
          </div>
          {tahminler.length === 0 && (
            <div style={{textAlign:"center",padding:40,color:"#2a4050",lineHeight:2,fontSize:12}}>
              <div style={{fontSize:32,opacity:.1,marginBottom:8}}>🎯</div>
              Analiz sonucunda 📌 Takibe Al butonunu kullan
            </div>
          )}
          {tahminler.length > 0 && (
            <div>
              {tahminler.map(function(t,i) {
                if (!t) return null;
                var degisim = (t.girisFiyat && t.guncelFiyat && t.girisFiyat > 0)
                  ? ((t.guncelFiyat - t.girisFiyat) / t.girisFiyat * 100) : null;
                var karsilandi = degisim != null && (t.yon==="AL" ? degisim>0 : degisim<0);
                var renk = t.sonuc==="DOĞRU"?"#50dd90":t.sonuc==="YANLIŞ"?"#ff7070":"#ffcc44";
                return (
                  <div key={t.id||i} style={{background:"#101820",border:"1px solid "+renk+"33",borderRadius:7,padding:"10px 12px",marginBottom:6}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:800,color:"#70d8a0",fontFamily:"monospace"}}>{String(t.sembol||"")}</span>
                        <span style={{fontSize:11,color:t.yon==="AL"?"#50dd90":"#ff7070"}}>{String(t.yon||"")}</span>
                        <span style={{fontSize:9,color:renk}}>{String(t.sonuc||"BEKLEYEN")}</span>
                      </div>
                      <div style={{textAlign:"right"}}>
                        {degisim!=null && <div style={{fontSize:13,fontWeight:700,color:karsilandi?"#50dd90":"#ff7070",fontFamily:"monospace"}}>{degisim>=0?"+":""}{degisim.toFixed(2)}%</div>}
                        <div style={{fontSize:9,color:"#2a4050"}}>{String(t.tarih||"")}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10,fontSize:10,color:"#4a7080",marginTop:4,flexWrap:"wrap"}}>
                      {t.girisFiyat && <span>Giriş: {t.para==="USD"?"$":"₺"}{t.girisFiyat}</span>}
                      {t.guncelFiyat && t.guncelFiyat!==t.girisFiyat && <span>Güncel: {t.para==="USD"?"$":"₺"}{t.guncelFiyat}</span>}
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


const DigerPaneli=memo(({sekme,setSekme,portfoy,setPortfoy,yeniHisse,setYeniHisse,hisseEkle,manuel,setManuel,analizDevam,onManuelAnaliz,korelasyon,setKorelasyon,takvim,onTakvimAnaliz,gecmis,setGecmis,onGecmisYukle})=>(
  <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
      {[["portfoy","💼"],["manuel","✏️"],["korelasyon","🔗"],["takvim","📅"],["gecmis","🕐"]].map(([k,l])=>(
        <button key={k} className={`tab${sekme===k?" on":""}`} onClick={()=>setSekme(k)} style={{fontSize:18}}>{l}</button>
      ))}
    </div>
    {sekme==="portfoy"&&(
      <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
        <div style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:8,padding:12,marginBottom:12}}>
          <input className="inp" placeholder="Sembol" value={yeniHisse.sembol} onChange={e=>setYeniHisse(p=>({...p,sembol:e.target.value.toUpperCase()}))} style={{marginBottom:6}}/>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={e=>setYeniHisse(p=>({...p,adet:e.target.value}))} style={{flex:1}}/>
            <input className="inp" placeholder="₺ Maliyet" type="number" value={yeniHisse.maliyet} onChange={e=>setYeniHisse(p=>({...p,maliyet:e.target.value}))} style={{flex:1}}/>
          </div>
          <button onClick={hisseEkle} className="btn-p" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>+ Ekle</button>
        </div>
        {portfoy.length===0?<div style={{textAlign:"center",color:"#2a4050",fontSize:12,marginTop:16}}>Portföyünüz boş.</div>:portfoy.map(h=>(
          <div key={h.id} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:15,color:"#70d8a0",fontWeight:700,fontFamily:"monospace"}}>{h.sembol}</div><div style={{fontSize:10,color:"#2a5040",marginTop:2}}>{h.adet} adet · ₺{h.maliyet}</div></div>
            <div style={{display:"flex",gap:5}}>
              <button className="btn-sm" style={{borderColor:"#1e4a2a",color:"#5aaa70",background:"#0a1e12"}} onClick={()=>onManuelAnaliz(`${h.sembol} hissesini analiz et`,h.sembol)}>Analiz</button>
              <button className="btn-sm" style={{borderColor:"#3a1010",color:"#cc6060",background:"#150808"}} onClick={()=>setPortfoy(p=>p.filter(x=>x.id!==h.id))}>Sil</button>
            </div>
          </div>
        ))}
      </div>
    )}
    {sekme==="manuel"&&(
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
        <textarea className="inp" value={manuel} onChange={e=>setManuel(e.target.value)} style={{flex:1,minHeight:120,resize:"none",lineHeight:1.6}} placeholder={"3 AI aynı anda analiz eder...\n\nÖrn: TCMB faizi 500 baz puan indirdi"}/>
        <button onClick={()=>{if(manuel.trim())onManuelAnaliz(manuel,manuel.slice(0,70));}} disabled={!manuel.trim()||analizDevam} className="btn-p" style={{width:"100%",padding:"12px"}}>{analizDevam?<><Dots size={5}/> Analiz ediliyor</>:"3 AI ile Analiz Et →"}</button>
        <div style={{borderTop:"1px solid #1a2530",paddingTop:10}}>
          <div style={{fontSize:10,color:"#2a4050",marginBottom:7}}>Hızlı örnekler</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB faiz indirdi","Altın rekor","BTC 100k"].map(t=>(
              <button key={t} className="qtag" onClick={()=>onManuelAnaliz(t,t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    )}
    {sekme==="korelasyon"&&(
      <div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:600,color:"#3a7080"}}>🔗 Korelasyon Hafızası</div>
          <button className="btn-sm" onClick={()=>setKorelasyon({})} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Sıfırla</button>
        </div>
        {Object.keys(korelasyon).length===0?<div style={{textAlign:"center",padding:40,color:"#1e3040",fontSize:12,lineHeight:1.8}}>Henüz veri yok.</div>:Object.entries(korelasyon).map(([kat,hisseler])=>{
          const kr=KR[kat]||KR["GENEL"];
          return(
            <div key={kat} style={{background:"#101820",border:`1px solid ${kr.bd}`,borderRadius:7,padding:"10px 12px",marginBottom:8}}>
              <span className="badge" style={{background:kr.bg,color:kr.tx,border:`1px solid ${kr.bd}`,marginBottom:8,display:"inline-flex"}}>{kat}</span>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {Object.entries(hisseler).sort((a,b)=>b[1].toplam-a[1].toplam).map(([s,d])=>{
                  const alO=d.toplam>0?Math.round(d.al/d.toplam*100):0;
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
        {takvim.length===0?<div style={{textAlign:"center",marginTop:40}}><Dots/></div>:takvim.map(o=>{
          const tarih=new Date(o.tarih),gecti=tarih<new Date(),er=ER[o.onem]||ER["DÜŞÜK"];
          return(
            <div key={o.id} onClick={()=>onTakvimAnaliz(o)} style={{background:gecti?"#0c1015":"#101820",border:`1px solid ${o.onem==="YÜKSEK"&&!gecti?"#381a1a":"#1c2c38"}`,borderRadius:6,padding:"10px 12px",marginBottom:6,cursor:"pointer",opacity:gecti?.45:1}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                    {o.ulke&&<span>{o.ulke}</span>}
                    <span className="badge" style={{background:er.bg,color:er.tx,border:`1px solid ${er.bd}`}}>{o.onem}</span>
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
              <button className="btn-sm" onClick={()=>setGecmis([])} style={{borderColor:"#301010",color:"#cc6060",background:"#140808"}}>Temizle</button>
            </div>
            {gecmis.map(g=>(
              <div key={g.id} onClick={()=>onGecmisYukle(g)} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer"}}>
                <div style={{fontSize:12,color:"#80aab8",marginBottom:4,lineHeight:1.4,fontWeight:500}}>{g.baslik}</div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{display:"flex",gap:4}}>{Object.entries(AIT).map(([k,ai])=><span key={k} style={{fontSize:9,color:(g.analizler?.[k])?ai.renk:"#2a3a4a"}}>{ai.logo}</span>)}</div>
                  <span style={{fontSize:10,color:"#2a4050"}}>{g.zaman}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    )}
  </div>
));

// ─────────────────────────────────────────────────────────────────────────────
// ANA BILEŞEN
// ─────────────────────────────────────────────────────────────────────────────
export default function BorsaRadar() {
  const [haberler,setHaberler]         = useState([]);
  // haberYukl sadece ilk yükleme için — interval güncellemesi sessiz
  const [haberYukl,setHaberYukl]       = useState(false);
  const [haberHata,setHaberHata]       = useState("");
  const [filtre,setFiltre]             = useState("TÜMÜ");
  const [fiyatlar,setFiyatlar]         = useState([]);
  const [takvim,setTakvim]             = useState([]);
  const [secilenId,setSecilenId]       = useState(null);
  const [cd,setCd]                     = useState(300);
  const [sonGun,setSonGun]             = useState(null);
  const cdRef=useRef(null);
  const ilkYuklemeRef=useRef(true); // interval'da UI'ı sarsmamak için

  const [analizler,setAnalizler]       = useState({claude:null,gpt:null,gemini:null});
  const [analizYukl,setAnalizYukl]     = useState({claude:false,gpt:false,gemini:false});
  const [analizBaslik,setAnalizBaslik] = useState("");
  const [aktifAI,setAktifAI]           = useState("claude");
  const [goster,setGoster]             = useState(false);
  const [korelasyon,setKorelasyon]     = useState({});

  const [bulten,setBulten]             = useState({llama:null,gpt:null,claude:null});
  const [bultenYukl,setBultenYukl]     = useState(false);
  const [bultenAktif,setBultenAktif]   = useState("llama");

  const [tekSembol,setTekSembol]       = useState("");
  const [tekVeri,setTekVeri]           = useState(null);
  const [tekYukl,setTekYukl]           = useState(false);
  const [tekHata,setTekHata]           = useState("");
  const [tvSembol,setTvSembol]         = useState("");
  const [tekAI,setTekAI]               = useState(null);
  const [tekAIYukl,setTekAIYukl]       = useState(false);
  const [tekTab,setTekTab]             = useState("grafik");

  const [raporVeri,setRaporVeri]       = useState(null);
  const [raporYukl,setRaporYukl]       = useState(false);
  const [raporTip,setRaporTip]         = useState("gunluk");
  const [raporAI,setRaporAI]           = useState("llama");
  const [haftalik,setHaftalik]         = useState([]);
  const [doviz,setDoviz]               = useState(null);

  const [gecmis,setGecmis]             = useState([]);
  const [portfoy,setPortfoy]           = useState([]);
  const [yeniHisse,setYeniHisse]       = useState({sembol:"",adet:"",maliyet:""});
  const [manuel,setManuel]             = useState("");
  // ─── İstihbarat state'leri ────────────────────────────────────────────────
  const [duygu,setDuygu]               = useState(null);
  const [duyguYukl,setDuyguYukl]       = useState(false);
  const [sektor,setSektor]             = useState(null);
  const [sektorYukl,setSektorYukl]     = useState(false);
  const [zamanlama,setZamanlama]       = useState(null);
  const [zamanlamaYukl,setZamanlamaYukl] = useState(false);
  const [zamanlamaSembol,setZamanlamaSembol] = useState("");
  const [tahminler,setTahminler]       = useState([]);
  const [tahminGuncYukl,setTahminGuncYukl] = useState(false);
  const [istihbaratTab,setIstihbaratTab] = useState("duygu");

  const [aktifEkran,setAktifEkran]     = useState("haberler");
  const [analizAlt,setAnalizAlt]       = useState("3ai");
  const [digerSekme,setDigerSekme]     = useState("portfoy");
  const [solTab,setSolTab]             = useState("akis");
  const [sagTab,setSagTab]             = useState("analiz");

  // refs
  const haberlerRef=useRef([]);haberlerRef.current=haberler;
  const analizYuklRef=useRef({});analizYuklRef.current=analizYukl;
  const tekVeriRef=useRef(null);tekVeriRef.current=tekVeri;
  const tvSembolRef=useRef("");tvSembolRef.current=tvSembol;
  const raporYuklRef=useRef(false);raporYuklRef.current=raporYukl;
  const tekLock=useRef(false);
  const tekAILock=useRef(false);

  // ─── API ──────────────────────────────────────────────────────────────────
  const fiyatYukle=useCallback(async()=>{try{const r=await fetch("/api/prices");const d=await r.json();if(d.fiyatlar?.length)setFiyatlar(d.fiyatlar);}catch{}},[]);
  const takvimYukle=useCallback(async()=>{try{const r=await fetch("/api/calendar");const d=await r.json();if(d.olaylar)setTakvim(d.olaylar);}catch{}},[]);
  const dovizYukle=useCallback(async()=>{try{const r=await fetch("/api/doviz");const d=await r.json();if(d.kurlar?.USDTRY)setDoviz(d);}catch{}},[]);

  const haberleriYukle=useCallback(async(gosterYukleme=false)=>{
    // interval çağrılarında UI sarsmadan sessizce güncelle
    if(gosterYukleme)setHaberYukl(true);
    setHaberHata("");
    try{
      const r=await fetch("/api/news");
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const d=await r.json();
      if(d.haberler?.length>0){
        setHaberler(d.haberler);
        setCd(300);
        setSonGun(new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}));
      }else if(gosterYukleme){setHaberHata("Haber alınamadı.");}
    }catch(e){if(gosterYukleme)setHaberHata(`Hata: ${e.message}`);}
    if(gosterYukleme)setHaberYukl(false);
  },[]);

  const analizEt=useCallback(async(metin,baslik)=>{
    if(!metin||Object.values(analizYuklRef.current).some(v=>v))return;
    setGoster(true);setSagTab("analiz");setAktifEkran("analiz");
    setAnalizBaslik(baslik||metin.slice(0,80));
    setAnalizler({claude:null,gpt:null,gemini:null});
    setAnalizYukl({claude:true,gpt:true,gemini:true});
    setAktifAI("claude");
    try{
      const r=await fetch("/api/analyze-multi",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin})});
      const d=await r.json();
      setAnalizler({claude:d.claude?.text||(d.claude?.error?`❌ ${d.claude.error}`:null),gpt:d.gpt?.text||(d.gpt?.error?`❌ ${d.gpt.error}`:null),gemini:d.gemini?.text||(d.gemini?.error?`❌ ${d.gemini.error}`:null)});
      // Sektör haritası — non-blocking, hata ana akışı etkilemez
      setSektorYukl(true);
      fetch("/api/sektor",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin})})
        .then(r=>r.json()).then(sd=>{if(sd&&sd.onerilenHisseler&&sd.onerilenHisseler.length)setSektor(sd);setSektorYukl(false);})
        .catch(()=>setSektorYukl(false));
      const kayit={id:Date.now(),baslik:baslik||metin.slice(0,70),analizler:{claude:d.claude?.text,gpt:d.gpt?.text,gemini:d.gemini?.text},zaman:new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}),tarih:new Date().toLocaleDateString("tr-TR")};
      setGecmis(prev=>[kayit,...prev.slice(0,19)]);
      const kat=kategoriBul(metin);
      const tum=[d.claude?.text,d.gpt?.text,d.gemini?.text].filter(Boolean).join(" ");
      const bistL=["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM"];
      const bul=bistL.filter(s=>tum.includes(s));
      if(bul.length){const yon=tum.includes("📈 AL")?1:tum.includes("📉 SAT")?-1:0;setKorelasyon(prev=>{const y={...prev};bul.forEach(s=>{if(!y[kat])y[kat]={};if(!y[kat][s])y[kat][s]={al:0,sat:0,toplam:0};y[kat][s].toplam++;if(yon===1)y[kat][s].al++;if(yon===-1)y[kat][s].sat++;});return y;});}
    }catch(e){setAnalizler({claude:`❌ ${e.message}`,gpt:`❌ ${e.message}`,gemini:`❌ ${e.message}`});}
    setAnalizYukl({claude:false,gpt:false,gemini:false});
  },[]);

  const bultenUret=useCallback(async()=>{
    const h=haberlerRef.current;if(!h.length)return;
    setBultenYukl(true);setBulten({llama:null,gpt:null,claude:null});
    setSagTab("bulten");setAktifEkran("analiz");setAnalizAlt("bulten");
    try{const r=await fetch("/api/bulten",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({haberler:h})});const d=await r.json();setBulten({llama:d.llama?.text||(d.llama?.error?`❌ ${d.llama.error}`:null),gpt:d.gpt?.text||(d.gpt?.error?`❌ ${d.gpt.error}`:null),claude:d.claude?.text||(d.claude?.error?`❌ ${d.claude.error}`:null)});}
    catch(e){setBulten({llama:`❌ ${e.message}`,gpt:null,claude:null});}
    setBultenYukl(false);
  },[]);

  const teknikGoster=useCallback(async(s)=>{
    if(!s)return;
    const sembol=s.trim().toUpperCase();
    setTekSembol(sembol);
    setTvSembol(sembol);
    setTekAI(null);
    setTekTab("grafik");
    setTekYukl(true);
    setTekVeri(null);
    setTekHata("");
    try{
      const r=await fetch(`/api/teknik?sembol=${encodeURIComponent(sembol)}`);
      const d=await r.json();
      if(d.error)throw new Error(d.error);
      setTekVeri(d);
    }catch(e){setTekHata(e.message);}
    setTekYukl(false);
  },[]);

  const teknikAIAnalizEt=useCallback(async()=>{
    const tv=tvSembolRef.current;if(!tv||tekAILock.current)return;
    tekAILock.current=true;setTekAIYukl(true);setTekTab("ai");
    const t=tekVeriRef.current;
    const prompt=`${tv} hissesi için teknik analiz yap.${t?` Veriler: Fiyat ${t.fiyat}, RSI ${t.rsi} (${t.rsiYorum}), MACD ${t.macdYorum}, Trend ${t.trend}, Destek1 ${t.seviyeler?.destek1}, Direnc1 ${t.seviyeler?.direnc1}, MA20 ${t.ma20}.`:""}\n\nSADECE JSON döndür:\n{"karar":"AL|SAT|BEKLE","guven":0-100,"hedef":"hedef fiyat","stop":"stop-loss seviyesi","sure":"örn: 2-4 hafta","gerekceler":"2-3 cümle teknik gerekçe","risk":"ana risk"}`;
    try{
      const r=await fetch("/api/analyze-multi",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({metin:prompt,tip:"teknik"})});
      const d=await r.json();
      const parse=txt=>{if(!txt)return null;try{const m=txt.match(/\{[\s\S]*?\}/);return m?JSON.parse(m[0]):null;}catch{return{karar:"BEKLE",guven:50,gerekceler:txt.slice(0,200)};}};
      setTekAI({claude:parse(d.claude?.text),gpt:parse(d.gpt?.text),gemini:parse(d.gemini?.text)});
    }catch(e){setTekAI({claude:{karar:"BEKLE",gerekceler:`Hata: ${e.message}`},gpt:null,gemini:null});}
    setTekAIYukl(false);tekAILock.current=false;
  },[]);


    const raporUret=useCallback(async()=>{
    const h=haberlerRef.current;if(!h.length||raporYuklRef.current)return;
    setRaporYukl(true);setRaporVeri(null);setSagTab("rapor");setAktifEkran("rapor");
    try{const r=await fetch("/api/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({haberler:h,tip:raporTip,haftalikHaberler:raporTip==="haftalik"?haftalik:[]})});const d=await r.json();setRaporVeri(d);setRaporAI("llama");}
    catch(e){setRaporVeri({hata:e.message});}
    setRaporYukl(false);
  },[raporTip,haftalik]);

  // ─── MOUNT ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    // İlk yükleme — yükleniyor göster
    haberleriYukle(true);fiyatYukle();takvimYukle();dovizYukle();
    // Interval — sessiz güncelleme (gosterYukleme=false)
    const r1=setInterval(()=>haberleriYukle(false),5*60*1000);
    const r2=setInterval(fiyatYukle,60*1000);
    const r3=setInterval(dovizYukle,2*60*1000);
    cdRef.current=setInterval(()=>setCd(c=>c>0?c-1:300),1000);
    try{const p=localStorage.getItem("br_portfoy");if(p)setPortfoy(JSON.parse(p));}catch{}
    try{const g=localStorage.getItem("br_gecmis");if(g)setGecmis(JSON.parse(g));}catch{}
    try{const k=localStorage.getItem("br_korel");if(k)setKorelasyon(JSON.parse(k));}catch{}
    try{const t=localStorage.getItem("br_tahminler");if(t)setTahminler(JSON.parse(t));}catch{}
    try{const h=localStorage.getItem("br_haftalik");if(h)setHaftalik(JSON.parse(h));}catch{}
    return()=>{clearInterval(r1);clearInterval(r2);clearInterval(r3);clearInterval(cdRef.current);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{try{localStorage.setItem("br_portfoy",JSON.stringify(portfoy));}catch{}},[portfoy]);
  useEffect(()=>{try{localStorage.setItem("br_gecmis",JSON.stringify(gecmis.slice(0,20)));}catch{}},[gecmis]);
  useEffect(()=>{try{localStorage.setItem("br_korel",JSON.stringify(korelasyon));}catch{}},[korelasyon]);
  useEffect(()=>{try{localStorage.setItem("br_haftalik",JSON.stringify(haftalik.slice(-200)));}catch{}},[haftalik]);
  useEffect(()=>{try{localStorage.setItem("br_tahminler",JSON.stringify(tahminler.slice(0,100)));}catch{}},[tahminler]);

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  const hisseEkle=useCallback(()=>{if(!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet)return;setPortfoy(prev=>[...prev,{...yeniHisse,id:Date.now(),sembol:yeniHisse.sembol.toUpperCase()}]);setYeniHisse({sembol:"",adet:"",maliyet:""});},[yeniHisse]);
  const onHaberClick=useCallback(h=>{setSecilenId(h.id);analizEt(h.baslik+(h.ozet?" — "+h.ozet:""),h.baslik);},[analizEt]);
  const onManuelAnaliz=useCallback((m,b)=>{setManuel(m||"");analizEt(m,b||m.slice(0,70));},[analizEt]);
  const onTakvimAnaliz=useCallback(o=>analizEt(`${o.baslik} yaklaşıyor`,o.baslik),[analizEt]);
  const onGecmisYukle=useCallback(g=>{setAnalizler(g.analizler||{});setAnalizBaslik(g.baslik);setGoster(true);setSagTab("analiz");setAktifEkran("analiz");},[]);
  const analizDevam=Object.values(analizYukl).some(v=>v);
  const fmtCD=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const hProps={haberler,yukl:haberYukl,hata:haberHata,filtre,setFiltre,secilenId,onClick:onHaberClick,onYenile:()=>haberleriYukle(true)};
  const aProps={analizler,analizYukl,baslik:analizBaslik,aktif:aktifAI,setAktif:setAktifAI,goster:tahminEkle};
  const iProps={
    duygu,duyguYukl,onDuyguHesapla:duyguHesapla,
    sektor,sektorYukl,
    zamanlama,zamanlamaYukl,onZamanlamaHesapla:zamanlamaHesapla,zamanlamaSembol,setZamanlamaSembol,
    aktifTab:istihbaratTab,setAktifTab:setIstihbaratTab,
    haberler,
  };
  const tProps={sembol:tekSembol,setSembol:setTekSembol,veri:tekVeri,yukl:tekYukl,hata:tekHata,tvSembol,onGoster:teknikGoster,aiAnalizler:tekAI,aiYukl:tekAIYukl,onAIAnalizEt:teknikAIAnalizEt,tab:tekTab,setTab:setTekTab};
  const bProps={bulten,yukl:bultenYukl,aktif:bultenAktif,setAktif:setBultenAktif,haberSayisi:haberler.length,onUret:bultenUret};
  const rProps={raporVeri,yukl:raporYukl,tip:raporTip,setTip:setRaporTip,aktifAI:raporAI,setAktifAI:setRaporAI,doviz,haberSayisi:haberler.length,onUret:raporUret};
  const dProps={sekme:digerSekme,setSekme:setDigerSekme,portfoy,setPortfoy,yeniHisse,setYeniHisse,hisseEkle,manuel,setManuel,analizDevam,onManuelAnaliz,korelasyon,setKorelasyon,takvim,onTakvimAnaliz,gecmis,setGecmis,onGecmisYukle};

  return(
    <>
      <Head>
        <title>BorsaRadar — 7/24 Finansal Analiz</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
        <meta name="theme-color" content="#0f1318"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </Head>

      <div style={{height:"100dvh",display:"flex",flexDirection:"column",background:"#0f1318",color:"#d4dde6",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
        <style>{CSS}</style>

        {/* HEADER */}
        <div style={{height:50,padding:"0 14px",borderBottom:"1px solid #1a2530",background:"#0b0f14",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div><span style={{fontSize:"1.15rem",fontWeight:800,color:"#e0eef0",letterSpacing:"-.02em"}}>Borsa</span><span style={{fontSize:"1.15rem",fontWeight:800,color:"#4aaa70",letterSpacing:"-.02em"}}>Radar</span></div>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#3aaa60",display:"inline-block",boxShadow:"0 0 6px #3aaa6088"}}/>
            <span style={{fontSize:10,color:"#4a8a60",fontWeight:500}}>Canlı</span>
            {sonGun&&<span style={{fontSize:10,color:"#2a4a40"}}>· {sonGun}</span>}
            <a href="/simulasyon" style={{fontSize:10,fontWeight:600,color:"#8a5af0",background:"#1a0e28",border:"1px solid #3a1e60",padding:"3px 10px",borderRadius:5,textDecoration:"none",letterSpacing:".02em"}}>🎮 Sim</a>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            {/* Mobil hızlı butonlar — CSS ile gösterilir */}
            <div className="mob-quick">
              <button onClick={bultenUret} disabled={bultenYukl||!haberler.length} className="btn-sm" style={{borderColor:"#5a6030",color:"#aab860",background:"#1a1e08",padding:"5px 10px",fontSize:11}}>{bultenYukl?<Dots size={4} color="#aab860"/>:"📰"}</button>
              <button onClick={raporUret} disabled={raporYukl||!haberler.length} className="btn-sm" style={{borderColor:"#3a7a5a",color:"#6abf90",background:"#0a1e12",padding:"5px 10px",fontSize:11}}>{raporYukl?<Dots size={4}/>:"📋"}</button>
            </div>
            <span className="desk-haber-cd" style={{fontSize:10,color:"#2a4050",fontFamily:"monospace"}}>↻ {fmtCD(cd)}</span>
            <button onClick={()=>haberleriYukle(true)} className="btn-p" style={{padding:"6px 14px",fontSize:11}}>{haberYukl?<Dots size={5}/>:"↻"}</button>
          </div>
        </div>

        {/* FİYAT ŞERİDİ */}
        <div style={{height:30,borderBottom:"1px solid #1a2530",background:"#0b0f14",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center"}}>
          {fiyatlar.length===0?<div style={{paddingLeft:14,fontSize:10,color:"#2a4050",display:"flex",alignItems:"center",gap:6}}><Dots color="#2a4050" size={4}/><span>Piyasa verisi...</span></div>:(
            <div style={{display:"flex",animation:"ticker 40s linear infinite",alignItems:"center",height:"100%"}}>
              {[...fiyatlar,...fiyatlar].map((f,i)=>(
                <span key={i} className="price-chip">
                  <span style={{color:"#4a6878",fontWeight:500}}>{f.isim}</span>
                  <span style={{color:"#c0d8e4",fontWeight:700,fontFamily:"monospace"}}>{fmtFiyat(f.fiyat,f.sembol)}</span>
                  {f.degisim!=null&&f.degisim!==0&&<span style={{color:f.degisim>=0?"#44aa70":"#cc5555",fontSize:9,fontWeight:600,background:f.degisim>=0?"#09200f":"#200909",padding:"1px 4px",borderRadius:3}}>{f.degisim>=0?"+":""}{(f.degisim||0).toFixed(2)}%</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── MASAÜSTÜ LAYOUT (CSS ile gösterilir, React state YOK) ─── */}
        <div className="layout">
          {/* Sol */}
          <div className="sol">
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,paddingLeft:2}}>
              <button className={`tab${solTab==="akis"?" on":""}`} onClick={()=>setSolTab("akis")}>Haberler</button>
              <button className={`tab${solTab==="manuel"?" on":""}`} onClick={()=>setSolTab("manuel")}>Manuel</button>
              <button className={`tab${solTab==="portfoy"?" on":""}`} onClick={()=>setSolTab("portfoy")}>Portföy{portfoy.length>0&&<span style={{background:"#0e2a1a",color:"#5aaa7a",borderRadius:3,padding:"0 5px",marginLeft:4,fontSize:10}}>{portfoy.length}</span>}</button>
            </div>
            {solTab==="akis"&&<HaberListesi {...hProps}/>}
            {solTab==="manuel"&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",padding:14,gap:10,overflow:"auto"}}>
                <textarea className="inp" value={manuel} onChange={e=>setManuel(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey&&manuel.trim())onManuelAnaliz(manuel,manuel.slice(0,70));}} style={{flex:1,minHeight:110,resize:"none",lineHeight:1.6}} placeholder={"Ctrl+Enter ile analiz\n\nÖrn: TCMB faizi indirdi"}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#2a4050"}}>Ctrl+Enter</span>
                  <button onClick={()=>{if(manuel.trim())onManuelAnaliz(manuel,manuel.slice(0,70));}} disabled={!manuel.trim()||analizDevam} className="btn-p">{analizDevam?<><Dots size={5}/> Analiz...</>:"Analiz Et →"}</button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingTop:8,borderTop:"1px solid #1a2530"}}>
                  {["Hürmüz kapandı","Fed faiz artırdı","NVIDIA rekor","TCMB indirdi","Altın rekor","BTC 100k"].map(t=><button key={t} className="qtag" style={{fontSize:11}} onClick={()=>onManuelAnaliz(t,t)}>{t}</button>)}
                </div>
              </div>
            )}
            {solTab==="portfoy"&&(
              <div style={{flex:1,overflowY:"auto",padding:14}}>
                <div style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:8,padding:12,marginBottom:10}}>
                  <input className="inp" placeholder="Sembol" value={yeniHisse.sembol} onChange={e=>setYeniHisse(p=>({...p,sembol:e.target.value.toUpperCase()}))} style={{marginBottom:6}}/>
                  <div style={{display:"flex",gap:6,marginBottom:6}}>
                    <input className="inp" placeholder="Adet" type="number" value={yeniHisse.adet} onChange={e=>setYeniHisse(p=>({...p,adet:e.target.value}))} style={{flex:1}}/>
                    <input className="inp" placeholder="₺ Maliyet" type="number" value={yeniHisse.maliyet} onChange={e=>setYeniHisse(p=>({...p,maliyet:e.target.value}))} style={{flex:1}}/>
                  </div>
                  <button onClick={hisseEkle} className="btn-p" disabled={!yeniHisse.sembol||!yeniHisse.adet||!yeniHisse.maliyet} style={{width:"100%"}}>+ Ekle</button>
                </div>
                {portfoy.map(h=>(
                  <div key={h.id} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"9px 11px",marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:14,color:"#70d8a0",fontWeight:700,fontFamily:"monospace"}}>{h.sembol}</div><div style={{fontSize:10,color:"#2a5040"}}>{h.adet} adet · ₺{h.maliyet}</div></div>
                    <div style={{display:"flex",gap:4}}>
                      <button className="btn-sm" style={{borderColor:"#1e4a2a",color:"#5aaa70",background:"#0a1e12"}} onClick={()=>onManuelAnaliz(`${h.sembol} analiz et`,h.sembol)}>Analiz</button>
                      <button className="btn-sm" style={{borderColor:"#3a1010",color:"#cc6060",background:"#150808"}} onClick={()=>setPortfoy(p=>p.filter(x=>x.id!==h.id))}>Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Sağ */}
          <div className="sag">
            <div style={{display:"flex",borderBottom:"1px solid #1a2530",background:"#0b0f14",flexShrink:0,paddingLeft:2,overflowX:"auto"}}>
              <button className={`tab${sagTab==="analiz"?" on":""}`} onClick={()=>setSagTab("analiz")}>3 AI {analizDevam&&<Dots size={4} color="#4a9a6a"/>}</button>
              <button className={`tab${sagTab==="teknik"?" on":""}`} onClick={()=>setSagTab("teknik")}>📊 Teknik</button>
              <button className={`tab${sagTab==="rapor"?" on":""}`} onClick={()=>setSagTab("rapor")}>📋 Rapor {raporYukl&&<Dots size={4} color="#f0b040"/>}</button>
              <button className={`tab${sagTab==="bulten"?" on":""}`} onClick={()=>setSagTab("bulten")}>📰 Bülten {bultenYukl&&<Dots size={4} color="#ffa040"/>}</button>
              <button className={`tab${sagTab==="istihbarat"?" on":""}`} onClick={()=>setSagTab("istihbarat")} style={{color:sagTab==="istihbarat"?"#c07ae0":""}}>🧠 İstihbarat</button>
              <button className={`tab${sagTab==="diger"?" on":""}`} onClick={()=>setSagTab("diger")}>Diğer</button>
            </div>
            {sagTab==="analiz"&&<AnalizPaneli {...aProps}/>}
            {sagTab==="teknik"&&<TeknikPaneli {...tProps}/>}
            {sagTab==="rapor"&&<RaporPaneli {...rProps}/>}
            {sagTab==="bulten"&&<BultenPaneli {...bProps}/>}
            {sagTab==="istihbarat"&&<IstihbaratPaneli {...iProps}/>}
            {sagTab==="diger"&&<DigerPaneli {...dProps}/>}
          </div>
        </div>

        {/* ─── MOBİL LAYOUT (CSS ile gösterilir) ─── */}
        <div className="mob-body">
          {aktifEkran==="haberler"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <HaberListesi {...hProps}/>
              {doviz?.kurlar?.USDTRY&&<div style={{padding:"4px 10px",background:"#0a0e12",borderTop:"1px solid #1a2530",fontSize:10,color:"#2a5040",flexShrink:0}}>💱 USD/TRY <strong style={{color:"#50aa70"}}>{doviz.kurlar.USDTRY}</strong> · EUR/TRY <strong style={{color:"#50aa70"}}>{doviz.kurlar.EURTRY}</strong></div>}
            </div>
          )}
          {aktifEkran==="analiz"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:"1px solid #1a2530",flexShrink:0,background:"#0b0f14",overflowX:"auto"}}>
                <button className={`tab${analizAlt==="3ai"?" on":""}`} onClick={()=>setAnalizAlt("3ai")}>3 AI {analizDevam&&<Dots size={4} color="#4a9a6a"/>}</button>
                <button className={`tab${analizAlt==="bulten"?" on":""}`} onClick={()=>setAnalizAlt("bulten")}>📰 Bülten</button>
                <button className={`tab${analizAlt==="gecmis"?" on":""}`} onClick={()=>setAnalizAlt("gecmis")}>🕐 Geçmiş</button>
              </div>
              {analizAlt==="3ai"&&<AnalizPaneli {...aProps}/>}
              {analizAlt==="bulten"&&<BultenPaneli {...bProps}/>}
              {analizAlt==="gecmis"&&<div style={{flex:1,overflowY:"auto",padding:14,WebkitOverflowScrolling:"touch"}}>{gecmis.length===0?<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#1e3040"}}>Henüz analiz yok</div>:gecmis.map(g=><div key={g.id} onClick={()=>onGecmisYukle(g)} style={{background:"#101820",border:"1px solid #1c2c38",borderRadius:6,padding:"10px 12px",marginBottom:5,cursor:"pointer"}}><div style={{fontSize:12,color:"#80aab8",marginBottom:4,fontWeight:500}}>{g.baslik}</div><div style={{display:"flex",justifyContent:"space-between"}}><div style={{display:"flex",gap:4}}>{Object.entries(AIT).map(([k,ai])=><span key={k} style={{fontSize:9,color:(g.analizler?.[k])?ai.renk:"#2a3a4a"}}>{ai.logo}</span>)}</div><span style={{fontSize:10,color:"#2a4050"}}>{g.zaman}</span></div></div>)}</div>}
            </div>
          )}
          {aktifEkran==="teknik"&&<TeknikPaneli {...tProps}/>
          {aktifEkran==="istihbarat"&&<IstihbaratPaneli {...iProps}/>}
          {aktifEkran==="rapor"&&<RaporPaneli {...rProps}/>}
          {aktifEkran==="diger"&&<DigerPaneli {...dProps}/>}
        </div>

        {/* ALT NAVİGASYON */}
        <div className="mob-nav">
          {[{id:"haberler",icon:"📡",label:"Haberler",badge:haberler.length||null},{id:"analiz",icon:"🤖",label:"Analiz",badge:analizDevam?"●":null,bc:"#4a9a6a"},{id:"teknik",icon:"📊",label:"Teknik"},{id:"istihbarat",icon:"🧠",label:"İstihbarat"},{id:"rapor",icon:"📋",label:"Rapor",badge:raporYukl?"●":null,bc:"#f0b040"},{id:"diger",icon:"⚙️",label:"Diğer",badge:portfoy.length||null}].map(({id,icon,label,badge,bc})=>(
            <button key={id} onClick={()=>setAktifEkran(id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",position:"relative",color:aktifEkran===id?"#4aaa70":"#3a5060",fontFamily:"'Inter',sans-serif",paddingTop:6}}>
              <span style={{fontSize:20}}>{icon}</span>
              <span style={{fontSize:9,fontWeight:600}}>{label}</span>
              {badge&&<span style={{position:"absolute",top:4,right:"50%",transform:"translateX(12px)",background:bc||"#2a6050",color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:8,fontWeight:700,minWidth:14,textAlign:"center"}}>{badge}</span>}
              {aktifEkran===id&&<span style={{position:"absolute",bottom:0,left:"20%",right:"20%",height:2,background:"#4aaa70",borderRadius:1}}/>}
            </button>
          ))}
        </div>

        {/* FOOTER — masaüstü */}
        <div className="desk-footer">
          <span style={{fontSize:9,color:"#1e3040"}}>Bloomberg HT · Hürriyet · AA · Reuters · CNBC | Yahoo Finance</span>
          <span style={{fontSize:9,color:"#1e3040"}}>⚠ Yatırım tavsiyesi değildir</span>
        </div>
      </div>
    </>
  );
}

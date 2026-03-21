// BorsaRadar — Kripto Bot Dashboard
import { useState, useEffect, useCallback, memo } from "react";
import Head from "next/head";
import Link from "next/link";

const CSS = `
@keyframes dp{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
*{box-sizing:border-box}
html,body{background:#090d12;color:#d4dde6;font-family:'Inter',sans-serif;margin:0;padding:0}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#090d12}::-webkit-scrollbar-thumb{background:#1e3040;border-radius:4px}
.card{background:#0d1520;border:1px solid #1a2d3e;border-radius:10px;padding:14px}
.badge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 9px;border-radius:4px}
.btn{background:#0e2a1e;border:1px solid #2a7a4a;color:#50cc80;padding:9px 20px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:7px;transition:all .15s}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn-red{background:#2a0e0e;border-color:#7a2a2a;color:#cc5050}
.sb{height:4px;border-radius:2px;background:#1a2d3e;overflow:hidden}
.sbf{height:100%;border-radius:2px}
.live-dot{width:7px;height:7px;border-radius:50%;background:#3aaa60;display:inline-block;animation:pulse 2s infinite}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.grid4{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
@media(max-width:700px){.grid2,.grid3{grid-template-columns:1fr}.grid4{grid-template-columns:1fr}}
`;

const PARITE_RENK = {
  BTCUSDT:{renk:"#f7931a",bg:"#1a0e00",isim:"BTC"},
  ETHUSDT:{renk:"#627eea",bg:"#0a0e1a",isim:"ETH"},
  SOLUSDT:{renk:"#9945ff",bg:"#0e0a1a",isim:"SOL"},
  BNBUSDT:{renk:"#f3ba2f",bg:"#1a1400",isim:"BNB"},
};

const Dots = memo(function Dots({color,size}){
  var c=color||"#4a9a6a",s=size||6;
  return(
    <span style={{display:"inline-flex",gap:4,alignItems:"center",verticalAlign:"middle"}}>
      {[0,1,2].map(function(i){
        return <span key={i} style={{width:s,height:s,borderRadius:"50%",background:c,display:"inline-block",animation:"dp 1.3s "+(i*.22)+"s infinite"}}/>;
      })}
    </span>
  );
});

function KararRenk(karar) {
  if (!karar) return "#4a6070";
  if (karar==="AL" || karar==="TUTE") return "#50dd90";
  if (karar==="SAT") return "#ff7070";
  return "#ffcc44";
}

function PozisyonKarti({sembol, poz, canliF}) {
  var pr = PARITE_RENK[sembol] || {renk:"#aaa",bg:"#111",isim:sembol};
  var canli = canliF || poz.girisFiyat;
  var deger = poz.adet * canli;
  var kz = deger - poz.girisUSDT;
  var kzPct = (kz/poz.girisUSDT*100);
  var pozitif = kz >= 0;
  var slPct = Math.round(((canli-poz.stopLoss)/poz.girisFiyat)*100*10)/10;
  var tpPct = Math.round(((poz.takeProfit-canli)/poz.girisFiyat)*100*10)/10;
  return(
    <div className="card" style={{borderColor:pozitif?"#1a4a2a":"#4a1a1a",animation:"fadein .3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:pr.bg,border:"1px solid "+pr.renk+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:pr.renk}}>{pr.isim}</div>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:pr.renk,fontFamily:"monospace"}}>{sembol.replace("USDT","")}/USDT</div>
            <div style={{fontSize:10,color:"#3a6070"}}>Açık Pozisyon</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:17,fontWeight:800,color:pozitif?"#50dd90":"#ff7070",fontFamily:"monospace"}}>
            {pozitif?"+":""}{kz.toFixed(2)}$
          </div>
          <div style={{fontSize:11,fontWeight:700,color:pozitif?"#50dd90":"#ff7070"}}>{pozitif?"+":""}{kzPct.toFixed(2)}%</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{flex:1,background:"#0a1520",border:"1px solid #1e3040",borderRadius:6,padding:"6px 10px"}}>
          <div style={{fontSize:9,color:"#3a6070"}}>Giriş</div>
          <div style={{fontSize:12,fontWeight:700,color:"#c0d8e4",fontFamily:"monospace"}}>${poz.girisFiyat.toLocaleString()}</div>
        </div>
        <div style={{flex:1,background:"#0a1520",border:"1px solid #1e3040",borderRadius:6,padding:"6px 10px"}}>
          <div style={{fontSize:9,color:"#3a6070"}}>Şimdiki</div>
          <div style={{fontSize:12,fontWeight:700,color:pozitif?"#50dd90":"#ff7070",fontFamily:"monospace"}}>${canli.toLocaleString()}</div>
        </div>
        <div style={{flex:1,background:"#0a1520",border:"1px solid #1e3040",borderRadius:6,padding:"6px 10px"}}>
          <div style={{fontSize:9,color:"#3a6070"}}>Değer</div>
          <div style={{fontSize:12,fontWeight:700,color:"#c0d8e4",fontFamily:"monospace"}}>${deger.toFixed(0)}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,fontSize:10}}>
        <div style={{flex:1,background:"#200a0a",border:"1px solid #501a1a",borderRadius:5,padding:"5px 8px"}}>
          <div style={{color:"#6a3030"}}>🛡 Stop-Loss</div>
          <div style={{color:"#ff7070",fontFamily:"monospace",fontWeight:700}}>${poz.stopLoss.toLocaleString()}</div>
          <div style={{color:"#501a1a"}}>-{Math.abs(slPct)}%</div>
        </div>
        <div style={{flex:1,background:"#0a2010",border:"1px solid #1a5030",borderRadius:5,padding:"5px 8px"}}>
          <div style={{color:"#3a7050"}}>🎯 Take-Profit</div>
          <div style={{color:"#50dd90",fontFamily:"monospace",fontWeight:700}}>${poz.takeProfit.toLocaleString()}</div>
          <div style={{color:"#1a5030"}}>+{tpPct}%</div>
        </div>
      </div>
    </div>
  );
}

function IslemSatiri({islem}) {
  var al = islem.tip==="AL";
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:al?"#0a1e10":"#1e0a0a",border:"1px solid "+(al?"#1a4a28":"#4a1a1a"),borderRadius:6,marginBottom:5,animation:"fadein .2s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,fontWeight:800,color:al?"#50dd90":"#ff7070",background:al?"#0a2a14":"#2a0a0a",padding:"2px 8px",borderRadius:4}}>{islem.tip}</span>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"#90b8c8"}}>{islem.sembol.replace("USDT","")}/USDT</div>
          <div style={{fontSize:10,color:"#3a5060"}}>{new Date(islem.zaman).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</div>
        </div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#c0d8e4",fontFamily:"monospace"}}>${islem.fiyat.toLocaleString()}</div>
        {islem.karZarar!==undefined&&(
          <div style={{fontSize:11,fontWeight:700,color:islem.karZarar>=0?"#50dd90":"#ff7070"}}>
            {islem.karZarar>=0?"+":""}{islem.karZarar.toFixed(2)}$ ({islem.karZararPct}%)
          </div>
        )}
        {islem.neden&&<div style={{fontSize:9,color:"#3a5060"}}>{islem.neden}</div>}
      </div>
    </div>
  );
}

function KararSatiri({karar}) {
  var renk = KararRenk(karar.finalKarar);
  return(
    <div style={{padding:"8px 10px",background:"#0a1520",border:"1px solid #1a2d3e",borderRadius:6,marginBottom:5}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:12,fontWeight:800,color:renk}}>{karar.finalKarar||"BEKLE"}</span>
          <span style={{fontSize:12,color:"#7ab8c8"}}>{karar.sembol&&karar.sembol.replace("USDT","")}/USDT</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div className="sb" style={{width:60}}>
            <div className="sbf" style={{width:karar.puan+"%",background:karar.puan>60?"#50dd90":karar.puan<40?"#ff7070":"#ffcc44"}}/>
          </div>
          <span style={{fontSize:10,color:"#4a7080"}}>{karar.puan}/100</span>
        </div>
      </div>
      {karar.gerekceler&&<div style={{fontSize:11,color:"#6a9aaa",lineHeight:1.5}}>{karar.gerekceler}</div>}
      {karar.sinyaller&&karar.sinyaller.length>0&&(
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:5}}>
          {karar.sinyaller.slice(0,4).map(function(s,i){
            return(
              <span key={i} className="badge" style={{background:s.tip==="AL"?"#0a2010":"#200a0a",color:s.tip==="AL"?"#50cc80":"#cc5050",border:"1px solid "+(s.tip==="AL"?"#2a6030":"#602a2a"),fontSize:9}}>
                {s.aciklama}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function KriptoBotPage() {
  var _d=useState(null),data=_d[0],setData=_d[1];
  var _f=useState({}),canliF=_f[0],setCanliF=_f[1];
  var _y=useState(false),yukl=_y[0],setYukl=_y[1];
  var _r=useState(false),calisıyor=_r[0],setCalisıyor=_r[1];
  var _s=useState("pozisyonlar"),sekme=_s[0],setSekme=_s[1];
  var _err=useState(""),hata=_err[0],setHata=_err[1];
  var _son=useState(null),sonCalistirma=_son[0],setSonCalistirma=_son[1];

  var durumCek = useCallback(function(){
    fetch("/api/kripto-bot")
      .then(function(r){return r.json();})
      .then(function(d){if(d.ok)setData(d.durum);})
      .catch(function(){});
  },[]);

  var canliCek = useCallback(function(){
    fetch("/api/kripto-fiyat")
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.pariteler){
          var f={};
          Object.entries(d.pariteler).forEach(function(e){
            if(e[1].fiyat) f[e[0]]=e[1].fiyat;
          });
          setCanliF(f);
        }
      })
      .catch(function(){});
  },[]);

  var botuCalistir = useCallback(function(){
    if(calisıyor) return;
    setCalisıyor(true);
    setHata("");
    fetch("/api/kripto-bot",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({secret:""})
    })
      .then(function(r){return r.json();})
      .then(function(d){
        setSonCalistirma(d);
        durumCek();
        setCalisıyor(false);
      })
      .catch(function(e){setHata(e.message);setCalisıyor(false);});
  },[calisıyor,durumCek]);

  useEffect(function(){
    durumCek();
    canliCek();
    var t1=setInterval(durumCek,30000);
    var t2=setInterval(canliCek,15000);
    return function(){clearInterval(t1);clearInterval(t2);};
  },[durumCek,canliCek]);

  var kzRenk = data ? (data.toplamKZ>=0?"#50dd90":"#ff7070") : "#aaa";
  var kzPozitif = data && data.toplamKZ >= 0;
  var pozSayi = data ? Object.keys(data.pozisyonlar||{}).length : 0;

  return(
    <>
      <Head>
        <title>Kripto Bot — BorsaRadar</title>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet"/>
      </Head>
      <div style={{minHeight:"100vh",background:"#090d12",color:"#d4dde6",fontFamily:"'Inter',sans-serif"}}>
        <style>{CSS}</style>

        {/* HEADER */}
        <div style={{background:"#0b0f14",borderBottom:"1px solid #1a2530",padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Link href="/" style={{textDecoration:"none"}}>
              <span style={{fontSize:"1rem",fontWeight:800,color:"#e0eef0"}}>Borsa</span>
              <span style={{fontSize:"1rem",fontWeight:800,color:"#4aaa70"}}>Radar</span>
            </Link>
            <span style={{color:"#1e3040"}}>›</span>
            <span style={{fontSize:13,fontWeight:700,color:"#7a60f0"}}>🤖 Kripto Bot</span>
            <span className="live-dot"/>
            <span style={{fontSize:10,color:"#3a6050"}}>Paper Trading</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {data&&(
              <div style={{textAlign:"right",fontSize:11}}>
                <div style={{color:kzRenk,fontWeight:700,fontFamily:"monospace"}}>
                  {kzPozitif?"+":""}{data.toplamKZ.toFixed(2)}$ ({kzPozitif?"+":""}{data.toplamKZPct}%)
                </div>
                <div style={{color:"#2a4050"}}>Toplam K/Z</div>
              </div>
            )}
            <button className="btn" onClick={botuCalistir} disabled={calisıyor}
              style={{padding:"7px 16px",fontSize:12}}>
              {calisıyor?<><Dots color="#50cc80" size={5}/> Analiz...</>:"▶ Bot Çalıştır"}
            </button>
          </div>
        </div>

        <div style={{maxWidth:1000,margin:"0 auto",padding:"16px 14px"}}>

          {/* ÖZET KARTLAR */}
          <div className="grid4" style={{marginBottom:16}}>
            {[
              {
                l:"Portföy Değeri",
                v:data?"$"+data.portfolyoDeger.toFixed(2):"$1,000.00",
                s:"Başlangıç: $1,000",
                renk:"#c0d8e4",
              },
              {
                l:"Nakit",
                v:data?"$"+data.nakit.toFixed(2):"$1,000.00",
                s:"Kullanılabilir USDT",
                renk:"#80c8a0",
              },
              {
                l:"Açık Pozisyon",
                v:pozSayi+" adet",
                s:pozSayi===0?"Bekleniyor":Object.keys(data?.pozisyonlar||{}).map(function(s){return s.replace("USDT","");}).join(", "),
                renk:"#80a8e0",
              },
              {
                l:"İşlem Sayısı",
                v:data?data.islemSayisi+" işlem":"0",
                s:data?"Son: "+(data.sonIslemler[0]?.sembol||"—"):"—",
                renk:"#c0a0f0",
              },
            ].map(function(item){
              return(
                <div key={item.l} className="card">
                  <div style={{fontSize:10,color:"#3a6070",fontWeight:600,marginBottom:4}}>{item.l}</div>
                  <div style={{fontSize:20,fontWeight:900,color:item.renk,fontFamily:"monospace",marginBottom:3}}>{item.v}</div>
                  <div style={{fontSize:10,color:"#2a4050"}}>{item.s}</div>
                </div>
              );
            })}
          </div>

          {/* K/Z GÖSTERGE */}
          {data&&(
            <div className="card" style={{marginBottom:16,borderColor:kzPozitif?"#1a4a2a":"#4a1a1a"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:"#4a8090"}}>📈 Performans</div>
                <div style={{fontSize:10,color:"#2a4050"}}>
                  Başlangıç: {new Date(data.baslamaTarihi).toLocaleDateString("tr-TR")}
                </div>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{flex:1,height:10,background:"#1a2d3e",borderRadius:5,overflow:"hidden"}}>
                  <div style={{
                    height:"100%",
                    width:Math.min(100,Math.abs(data.toplamKZPct)*2)+"%",
                    background:kzPozitif?"#50dd90":"#ff7070",
                    borderRadius:5,
                    transition:"width .5s",
                  }}/>
                </div>
                <div style={{fontSize:24,fontWeight:900,color:kzRenk,fontFamily:"monospace",flexShrink:0}}>
                  {kzPozitif?"+":""}{data.toplamKZPct}%
                </div>
              </div>
              <div style={{display:"flex",gap:16,marginTop:8,fontSize:10,color:"#3a6070"}}>
                <span>Başlangıç: <b style={{color:"#c0d8e4"}}>$1,000</b></span>
                <span>Şimdi: <b style={{color:kzRenk}}>${data.portfolyoDeger.toFixed(2)}</b></span>
                <span>Fark: <b style={{color:kzRenk}}>{kzPozitif?"+":""}{data.toplamKZ.toFixed(2)}$</b></span>
              </div>
            </div>
          )}

          {/* SEKMELER */}
          <div style={{display:"flex",gap:0,borderBottom:"1px solid #1a2d3e",marginBottom:14,overflowX:"auto"}}>
            {[
              ["pozisyonlar","📊 Pozisyonlar"+(pozSayi>0?" ("+pozSayi+")":"")],
              ["islemler","📋 İşlem Geçmişi"],
              ["kararlar","🤖 Bot Kararları"],
            ].map(function(item){
              return(
                <button key={item[0]} onClick={function(){setSekme(item[0]);}}
                  style={{background:"none",border:"none",borderBottom:"2px solid "+(sekme===item[0]?"#7a60f0":"transparent"),padding:"8px 16px",fontSize:12,fontWeight:600,color:sekme===item[0]?"#9a80f0":"#3a5060",cursor:"pointer",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap"}}>
                  {item[1]}
                </button>
              );
            })}
          </div>

          {/* HATA */}
          {hata&&<div style={{background:"#180808",border:"1px solid #401818",borderRadius:8,padding:"10px 14px",color:"#e07070",fontSize:12,marginBottom:12}}>⚠ {hata}</div>}

          {/* POZİSYONLAR */}
          {sekme==="pozisyonlar"&&(
            <div>
              {!data||Object.keys(data.pozisyonlar||{}).length===0?(
                <div style={{textAlign:"center",padding:"50px 20px",color:"#1e3040"}}>
                  <div style={{fontSize:40,opacity:.1,marginBottom:12}}>📊</div>
                  <div style={{fontSize:14,fontWeight:600,color:"#2a5060",marginBottom:8}}>Açık pozisyon yok</div>
                  <div style={{fontSize:12,color:"#1e3040",lineHeight:1.8}}>
                    Bot çalıştır butonu ile analiz başlat<br/>
                    ya da GitHub Actions saatte bir otomatik tetikler
                  </div>
                  <button className="btn" onClick={botuCalistir} disabled={calisıyor} style={{marginTop:16}}>
                    {calisıyor?<><Dots size={5}/> Analiz Ediliyor...</>:"▶ Şimdi Çalıştır"}
                  </button>
                </div>
              ):(
                <div className="grid2">
                  {Object.entries(data.pozisyonlar).map(function(entry){
                    return <PozisyonKarti key={entry[0]} sembol={entry[0]} poz={entry[1]} canliF={canliF[entry[0]]}/>;
                  })}
                </div>
              )}
            </div>
          )}

          {/* İŞLEMLER */}
          {sekme==="islemler"&&(
            <div>
              {!data||!data.sonIslemler||data.sonIslemler.length===0?(
                <div style={{textAlign:"center",padding:40,color:"#1e3040",fontSize:13}}>Henüz işlem yok</div>
              ):(
                <>
                  {/* Özet istatistikler */}
                  {(function(){
                    var satislar = data.sonIslemler.filter(function(i){return i.tip==="SAT" && i.karZarar!==undefined;});
                    if(satislar.length===0) return null;
                    var kazananlar = satislar.filter(function(i){return i.karZarar>=0;});
                    var toplamKZ = satislar.reduce(function(a,b){return a+(b.karZarar||0);},0);
                    return(
                      <div className="grid3" style={{marginBottom:14}}>
                        {[
                          {l:"Kapatılan İşlem",v:satislar.length,renk:"#c0d8e4"},
                          {l:"Kazanma Oranı",v:satislar.length>0?Math.round(kazananlar.length/satislar.length*100)+"%":"—",renk:kazananlar.length/satislar.length>0.5?"#50dd90":"#ff7070"},
                          {l:"Net K/Z",v:(toplamKZ>=0?"+":"")+toplamKZ.toFixed(2)+"$",renk:toplamKZ>=0?"#50dd90":"#ff7070"},
                        ].map(function(item){
                          return(
                            <div key={item.l} className="card">
                              <div style={{fontSize:9,color:"#3a6070",marginBottom:3}}>{item.l}</div>
                              <div style={{fontSize:18,fontWeight:800,color:item.renk,fontFamily:"monospace"}}>{item.v}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {data.sonIslemler.map(function(islem){
                    return <IslemSatiri key={islem.id} islem={islem}/>;
                  })}
                </>
              )}
            </div>
          )}

          {/* KARARLAR */}
          {sekme==="kararlar"&&(
            <div>
              {!data||!data.sonKararlar||data.sonKararlar.length===0?(
                <div style={{textAlign:"center",padding:40,color:"#1e3040",fontSize:13}}>Henüz karar yok</div>
              ):(
                data.sonKararlar.map(function(log,li){
                  return(
                    <div key={li} style={{marginBottom:14}}>
                      <div style={{fontSize:10,color:"#2a5060",marginBottom:6,padding:"4px 8px",background:"#0a1520",borderRadius:4,display:"inline-block"}}>
                        🕐 {new Date(log.zaman).toLocaleString("tr-TR",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"})}
                        {log.islemler&&log.islemler.length>0&&<span style={{marginLeft:8,color:"#50cc80"}}>✓ {log.islemler.length} işlem</span>}
                      </div>
                      {log.kararlar&&log.kararlar.map(function(k,ki){
                        return <KararSatiri key={ki} karar={k}/>;
                      })}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Son çalıştırma sonucu */}
          {sonCalistirma&&(
            <div className="card" style={{marginTop:16,borderColor:"#2a4a6a"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#5090b0",marginBottom:8}}>Son Çalıştırma Sonucu</div>
              <div style={{fontSize:11,color:"#4a8090"}}>
                {sonCalistirma.kararSayisi} parite analiz edildi · {sonCalistirma.islemSayisi} işlem yapıldı
              </div>
              <div style={{fontSize:11,color:"#3a7060",marginTop:4,fontFamily:"monospace"}}>
                Portföy: ${sonCalistirma.portfolyoDeger} · Nakit: ${sonCalistirma.nakit} · K/Z: {sonCalistirma.toplamKZ>=0?"+":""}{sonCalistirma.toplamKZ}$
              </div>
            </div>
          )}

        </div>

        <div style={{borderTop:"1px solid #1a2530",padding:"12px 20px",fontSize:10,color:"#1e3040",textAlign:"center",marginTop:30}}>
          Veriler Binance API · Sanal para ile simülasyon · Gerçek yatırım tavsiyesi değildir · BorsaRadar
        </div>
      </div>
    </>
  );
}

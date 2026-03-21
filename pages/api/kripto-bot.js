// /api/kripto-bot.js — Kripto Bot v3
// Çoklu kaynak: Binance → CoinGecko → fallback
export const config = { maxDuration: 60 };

var BASLANGIC   = 1000;
var STOP_PCT    = 0.08;
var TP_PCT      = 0.15;
var MAX_POZ_PCT = 0.30;
var MIN_SKOR    = 52;
var PARITELER   = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"];

var CG_IDS = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  SOLUSDT: "solana",
  BNBUSDT: "binancecoin",
};

// ─── STATE ────────────────────────────────────────────────────────────────────
function yeniBakliye() {
  return {
    baslangic: BASLANGIC, nakit: BASLANGIC,
    pozisyonlar: {}, islemler: [], kararlar: [],
    basTarihi: new Date().toISOString(),
    guncelleme: new Date().toISOString(),
    kaynakLog: [],
  };
}
function getDurum() {
  if (!global.__kr) global.__kr = yeniBakliye();
  return global.__kr;
}

// ─── VERİ KAYNAKLARI ─────────────────────────────────────────────────────────

// Kaynak 1: Binance (ana)
async function binanceOHLCV(sembol, interval, limit) {
  var endpoints = [
    "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
  ];
  for (var i = 0; i < endpoints.length; i++) {
    try {
      var url = endpoints[i] + "/api/v3/klines?symbol=" + sembol
        + "&interval=" + interval + "&limit=" + limit;
      var r = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000)
      });
      if (!r.ok) continue;
      var d = await r.json();
      if (!Array.isArray(d) || d.length === 0) continue;
      return d.map(function(k) {
        return { t:+k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] };
      });
    } catch(e) { continue; }
  }
  return null;
}

// Kaynak 2: CoinGecko OHLC (günlük, 1H olmadan)
async function cgOHLC(sembol) {
  var cgId = CG_IDS[sembol];
  if (!cgId) return null;
  try {
    // 7 günlük saatlik verisi
    var url = "https://api.coingecko.com/api/v3/coins/" + cgId
      + "/ohlc?vs_currency=usd&days=7";
    var r = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return null;
    var d = await r.json();
    if (!Array.isArray(d) || d.length < 10) return null;
    // [timestamp, open, high, low, close] — volume yok
    return d.map(function(k) {
      return { t:k[0], o:k[1], h:k[2], l:k[3], c:k[4], v:0 };
    });
  } catch(e) { return null; }
}

// Kaynak 3: CoinGecko basit fiyat
async function cgFiyat(sembol) {
  var cgId = CG_IDS[sembol];
  if (!cgId) return null;
  try {
    var url = "https://api.coingecko.com/api/v3/simple/price?ids=" + cgId
      + "&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true";
    var r = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return null;
    var d = await r.json();
    var data = d[cgId];
    if (!data || !data.usd) return null;
    return { fiyat: data.usd, deg24h: data.usd_24h_change || 0 };
  } catch(e) { return null; }
}

// Kaynak 4: Kraken (BTC/ETH için)
async function krakenOHLCV(sembol) {
  var krakenPair = { BTCUSDT:"XBTUSD", ETHUSDT:"ETHUSD" }[sembol];
  if (!krakenPair) return null;
  try {
    var url = "https://api.kraken.com/0/public/OHLC?pair=" + krakenPair + "&interval=60";
    var r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    var d = await r.json();
    if (d.error && d.error.length) return null;
    var key = Object.keys(d.result || {}).find(function(k){ return k !== "last"; });
    if (!key) return null;
    var bars = d.result[key];
    return bars.slice(-200).map(function(k) {
      return { t:+k[0]*1000, o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[6] };
    });
  } catch(e) { return null; }
}

// Ana veri çekici — sırayla dene
async function veriCek(sembol) {
  var kaynak = "?";
  var bars = null;

  // 1. Binance
  bars = await binanceOHLCV(sembol, "1h", 200);
  if (bars && bars.length >= 50) { kaynak = "Binance"; }

  // 2. Kraken (BTC/ETH için)
  if (!bars) {
    bars = await krakenOHLCV(sembol);
    if (bars && bars.length >= 50) kaynak = "Kraken";
  }

  // 3. CoinGecko OHLC
  if (!bars) {
    bars = await cgOHLC(sembol);
    if (bars && bars.length >= 20) kaynak = "CoinGecko";
  }

  if (!bars || bars.length < 20) return null;

  // 4H simüle: 1H barları 4'er grupla
  var bars4h = [];
  for (var i = 0; i < bars.length - 3; i += 4) {
    var grp = bars.slice(i, i+4);
    bars4h.push({
      t: grp[0].t,
      o: grp[0].o,
      h: Math.max.apply(null, grp.map(function(b){return b.h;})),
      l: Math.min.apply(null, grp.map(function(b){return b.l;})),
      c: grp[grp.length-1].c,
      v: grp.reduce(function(a,b){return a+b.v;}, 0),
    });
  }

  return { bars1h: bars, bars4h: bars4h, kaynak: kaynak };
}

// ─── GÖSTERGELER ─────────────────────────────────────────────────────────────
function rsi(cl, p) {
  p = p || 14;
  if (cl.length < p+1) return 50;
  var g=0, l=0;
  for (var i=1; i<=p; i++) { var d=cl[i]-cl[i-1]; d>0?g+=d:l-=d; }
  var ag=g/p, al=l/p;
  for (var j=p+1; j<cl.length; j++) {
    var d2=cl[j]-cl[j-1];
    ag=(ag*(p-1)+(d2>0?d2:0))/p;
    al=(al*(p-1)+(d2<0?-d2:0))/p;
  }
  return al===0?100:Math.round((100-100/(1+ag/al))*10)/10;
}

function ema(cl, p) {
  if (cl.length < p) return cl[cl.length-1]||0;
  var k=2/(p+1), e=cl.slice(0,p).reduce(function(a,b){return a+b;},0)/p;
  for (var i=p; i<cl.length; i++) e=cl[i]*k+e*(1-k);
  return Math.round(e*100)/100;
}

function macdHist(cl) {
  if (cl.length < 27) return 0;
  var e12=ema(cl,12), e26=ema(cl,26);
  var macdLine = e12-e26;
  // basit signal: son 9 MACD değerinin ortalaması
  var macdVals = [];
  for (var i = Math.max(26, cl.length-20); i < cl.length; i++) {
    var s = cl.slice(0, i+1);
    macdVals.push(ema(s,12) - ema(s,26));
  }
  if (macdVals.length < 9) return 0;
  var signal = macdVals.slice(-9).reduce(function(a,b){return a+b;},0)/9;
  return Math.round((macdLine-signal)*100)/100;
}

function bbPctB(cl, p) {
  p = p||20;
  if (cl.length < p) return 0.5;
  var sl=cl.slice(-p);
  var mean=sl.reduce(function(a,b){return a+b;},0)/p;
  var std=Math.sqrt(sl.reduce(function(a,b){return a+Math.pow(b-mean,2);},0)/p);
  if (std===0) return 0.5;
  var son=cl[cl.length-1];
  return Math.min(1.2, Math.max(-0.2, (son-(mean-2*std))/(4*std)));
}

function hacimSpike(bars) {
  if (bars.length < 21) return 1;
  var vols = bars.slice(-21,-1).map(function(b){return b.v;}).filter(function(v){return v>0;});
  if (!vols.length) return 1;
  var ort = vols.reduce(function(a,b){return a+b;},0)/vols.length;
  var son = bars[bars.length-1].v;
  return ort>0 ? Math.round((son/ort)*100)/100 : 1;
}

// ─── TEKNİK PUAN ─────────────────────────────────────────────────────────────
function teknikPuanla(bars1h, bars4h) {
  var cl1 = bars1h.map(function(b){return b.c;});
  var cl4 = bars4h.map(function(b){return b.c;});
  var son  = cl1[cl1.length-1];

  var r1   = rsi(cl1);
  var r4   = rsi(cl4);
  var mh   = macdHist(cl1);
  var bb   = bbPctB(cl1);
  var e20  = ema(cl1, 20);
  var e50  = ema(cl1, 50);
  var hs   = hacimSpike(bars1h);

  var once24idx = Math.max(0, cl1.length-25);
  var deg24 = cl1[once24idx]>0
    ? Math.round(((son-cl1[once24idx])/cl1[once24idx])*10000)/100 : 0;
  var once5idx = Math.max(0, cl1.length-6);
  var mom5 = cl1[once5idx]>0
    ? Math.round(((son-cl1[once5idx])/cl1[once5idx])*10000)/100 : 0;

  var puan = 50;
  var sinyaller = [];

  if (r1 <= 25)      { puan+=20; sinyaller.push("RSI aşırı sat ("+r1+")"); }
  else if (r1 <= 35) { puan+=12; sinyaller.push("RSI satım bölgesi ("+r1+")"); }
  else if (r1 >= 75) { puan-=20; sinyaller.push("RSI aşırı alım ("+r1+")"); }
  else if (r1 >= 65) { puan-=12; sinyaller.push("RSI alım bölgesi ("+r1+")"); }

  if (r4 <= 40)      { puan+=8;  sinyaller.push("RSI4H düşük ("+r4+")"); }
  else if (r4 >= 60) { puan-=8;  sinyaller.push("RSI4H yüksek ("+r4+")"); }

  if (mh > 0)  { puan+=10; sinyaller.push("MACD bullish (+"+mh+")"); }
  else if (mh < 0) { puan-=10; sinyaller.push("MACD bearish ("+mh+")"); }

  if (bb < 0.1)       { puan+=15; sinyaller.push("BB alt banda değdi"); }
  else if (bb < 0.25) { puan+=7;  sinyaller.push("BB alt bant yakını"); }
  else if (bb > 0.9)  { puan-=15; sinyaller.push("BB üst banda değdi"); }
  else if (bb > 0.75) { puan-=7;  sinyaller.push("BB üst bant yakını"); }

  if (son > e20 && e20 > e50) { puan+=8;  sinyaller.push("EMA üst trend"); }
  else if (son < e20 && e20 < e50) { puan-=8; sinyaller.push("EMA alt trend"); }

  if (hs >= 2 && deg24 > 0) { puan+=10; sinyaller.push("Hacim spike "+hs+"×"); }
  if (hs >= 2 && deg24 < 0) { puan -= 8; sinyaller.push("Hacim spike düşüşte"); }

  if (mom5 > 3)       { puan+=8;  sinyaller.push("Momentum +"+mom5+"%"); }
  else if (mom5 < -3) { puan-=8;  sinyaller.push("Momentum "+mom5+"%"); }

  puan = Math.max(0, Math.min(100, Math.round(puan)));

  return {
    puan: puan,
    sinyaller: sinyaller,
    gosterge: {
      fiyat:son, rsi1h:r1, rsi4h:r4,
      macdHist:mh, bbPctB:Math.round(bb*100)/100,
      ema20:e20, ema50:e50, hacimSpike:hs,
      mom5:mom5, deg24:deg24,
    },
  };
}

// ─── AI KARAR ────────────────────────────────────────────────────────────────
async function aiKarar(sembol, g, puan, sinyaller) {
  // API key yoksa skor bazlı
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      karar: puan >= 62 ? "AL" : puan <= 38 ? "SAT" : "BEKLE",
      guven: puan,
      gerekceler: "Teknik skor: "+puan+"/100 | "+sinyaller.slice(0,2).join(", "),
    };
  }
  var prompt = sembol+" analiz:\n"
    +"Fiyat: $"+g.fiyat+" | 24H: "+g.deg24+"%\n"
    +"RSI1H: "+g.rsi1h+" | RSI4H: "+g.rsi4h+" | MACD: "+g.macdHist+"\n"
    +"BB%B: "+g.bbPctB+" | EMA20: "+g.ema20+" | EMA50: "+g.ema50+"\n"
    +"HacimSpike: "+g.hacimSpike+"× | Mom5: "+g.mom5+"%\n"
    +"TeknikSkor: "+puan+"/100\n"
    +"Sinyaller: "+sinyaller.join(", ")+"\n\n"
    +"SADECE JSON:\n"
    +'{"karar":"AL|SAT|BEKLE","guven":0-100,"gerekceler":"tek cumle"}';
  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key":process.env.ANTHROPIC_API_KEY,
        "anthropic-version":"2023-06-01",
      },
      body:JSON.stringify({
        model:"claude-haiku-4-5-20251001",
        max_tokens:120,
        messages:[{role:"user",content:prompt}],
      }),
      signal:AbortSignal.timeout(15000),
    });
    var d = await r.json();
    var txt=(d.content&&d.content[0]&&d.content[0].text)||"";
    var m=txt.match(/\{[\s\S]*?\}/);
    if (m) {
      var p2 = JSON.parse(m[0]);
      if (p2.karar) return p2;
    }
  } catch(e) {}
  // fallback
  return {
    karar: puan>=62?"AL":puan<=38?"SAT":"BEKLE",
    guven: puan,
    gerekceler: "Skor bazlı: "+puan+"/100",
  };
}

// ─── İŞLEM ───────────────────────────────────────────────────────────────────
function ac(dur, sembol, fiyat, usdt) {
  if (dur.nakit < 10) return null;
  if (usdt > dur.nakit) usdt = dur.nakit * 0.98;
  var adet = usdt/fiyat;
  dur.nakit = Math.round((dur.nakit-usdt)*100)/100;
  dur.pozisyonlar[sembol] = {
    adet:adet, girisUSDT:Math.round(usdt*100)/100,
    girisFiyat:fiyat, guncelFiyat:fiyat,
    acanZaman:new Date().toISOString(),
    stopLoss:Math.round(fiyat*(1-STOP_PCT)*100)/100,
    takeProfit:Math.round(fiyat*(1+TP_PCT)*100)/100,
  };
  var islem={id:Date.now(),tip:"AL",sembol:sembol,fiyat:fiyat,
    usdt:Math.round(usdt*100)/100,adet:Math.round(adet*1e7)/1e7,
    zaman:new Date().toISOString(),
    stopLoss:dur.pozisyonlar[sembol].stopLoss,
    takeProfit:dur.pozisyonlar[sembol].takeProfit};
  dur.islemler.unshift(islem);
  return islem;
}

function kapat(dur, sembol, fiyat, neden) {
  var poz=dur.pozisyonlar[sembol];
  if (!poz) return null;
  var gelir=poz.adet*fiyat;
  var kz=gelir-poz.girisUSDT;
  dur.nakit=Math.round((dur.nakit+gelir)*100)/100;
  var islem={id:Date.now(),tip:"SAT",sembol:sembol,fiyat:fiyat,
    usdt:Math.round(gelir*100)/100,adet:Math.round(poz.adet*1e7)/1e7,
    zaman:new Date().toISOString(),karZarar:Math.round(kz*100)/100,
    karZararPct:Math.round((kz/poz.girisUSDT)*10000)/100,
    neden:neden,girisFiyat:poz.girisFiyat};
  dur.islemler.unshift(islem);
  delete dur.pozisyonlar[sembol];
  return islem;
}

function stopTakip(dur, sembol, fiyat) {
  var poz=dur.pozisyonlar[sembol];
  if (!poz) return null;
  poz.guncelFiyat=fiyat;
  if (fiyat<=poz.stopLoss)   return kapat(dur,sembol,fiyat,"🛡 Stop-Loss");
  if (fiyat>=poz.takeProfit) return kapat(dur,sembol,fiyat,"🎯 Take-Profit");
  return null;
}

function portfolyo(dur) {
  var d=dur.nakit;
  Object.values(dur.pozisyonlar).forEach(function(p){
    d+=p.adet*(p.guncelFiyat||p.girisFiyat);
  });
  return Math.round(d*100)/100;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  var dur = getDurum();

  if (req.method==="GET") {
    var pd=portfolyo(dur), kz=pd-BASLANGIC;
    return res.json({
      ok:true,
      durum:{
        nakit:Math.round(dur.nakit*100)/100,
        portfolyoDeger:pd,
        toplamKZ:Math.round(kz*100)/100,
        toplamKZPct:Math.round((kz/BASLANGIC)*10000)/100,
        pozisyonlar:dur.pozisyonlar,
        sonIslemler:dur.islemler.slice(0,20),
        sonKararlar:dur.kararlar.slice(0,10),
        baslamaTarihi:dur.basTarihi,
        sonGuncelleme:dur.guncelleme,
        islemSayisi:dur.islemler.length,
        kaynakLog:dur.kaynakLog.slice(0,5),
      },
    });
  }

  if (req.method!=="POST") return res.status(405).end();

  var kararLog={zaman:new Date().toISOString(),kararlar:[],islemler:[],kaynaklar:{}};
  var hatalar=[];

  for (var i=0; i<PARITELER.length; i++) {
    var sembol=PARITELER[i];
    try {
      var veri = await veriCek(sembol);
      if (!veri) {
        hatalar.push(sembol+": tüm kaynaklar başarısız");
        continue;
      }

      kararLog.kaynaklar[sembol] = veri.kaynak;
      var fiyat = veri.bars1h[veri.bars1h.length-1].c;

      // Stop/Take kontrolü
      if (dur.pozisyonlar[sembol]) {
        var oto = stopTakip(dur, sembol, fiyat);
        if (oto) {
          kararLog.islemler.push(oto);
          kararLog.kararlar.push({sembol,fiyat,finalKarar:"SAT (Oto)",puan:0,gerekceler:oto.neden,sinyaller:[]});
          continue;
        }
      }

      var teknik = teknikPuanla(veri.bars1h, veri.bars4h);
      var puan   = teknik.puan;
      var g      = teknik.gosterge;
      var ai     = await aiKarar(sembol, g, puan, teknik.sinyaller);

      var acikPoz = !!dur.pozisyonlar[sembol];
      var final   = "BEKLE";

      if (!acikPoz && ai.karar==="AL" && puan>=MIN_SKOR) final="AL";
      else if (acikPoz && ai.karar==="SAT" && puan<=(100-MIN_SKOR)) final="SAT";
      else if (acikPoz) final="TUT";

      var yapilan = null;
      if (final==="AL") {
        var kullan = Math.min(dur.nakit*MAX_POZ_PCT, dur.nakit*0.95);
        yapilan = ac(dur, sembol, fiyat, kullan);
        if (yapilan) kararLog.islemler.push(yapilan);
      } else if (final==="SAT" && acikPoz) {
        yapilan = kapat(dur, sembol, fiyat, ai.gerekceler);
        if (yapilan) kararLog.islemler.push(yapilan);
      }

      kararLog.kararlar.push({
        sembol, fiyat, puan,
        kaynak: veri.kaynak,
        aiKarar:ai.karar, aiGuven:ai.guven,
        finalKarar:final, gerekceler:ai.gerekceler,
        sinyaller:teknik.sinyaller.slice(0,5),
        islem:yapilan||null,
      });

    } catch(e) {
      hatalar.push(sembol+": "+e.message);
    }
  }

  dur.kararlar.unshift(kararLog);
  if (dur.kararlar.length>50) dur.kararlar=dur.kararlar.slice(0,50);
  dur.guncelleme=new Date().toISOString();
  dur.kaynakLog.unshift({zaman:dur.guncelleme, kaynaklar:kararLog.kaynaklar});
  if (dur.kaynakLog.length>10) dur.kaynakLog=dur.kaynakLog.slice(0,10);
  global.__kr=dur;

  var pd=portfolyo(dur), kz=pd-BASLANGIC;
  res.json({
    ok:true,
    kararSayisi:kararLog.kararlar.length,
    islemSayisi:kararLog.islemler.length,
    kararlar:kararLog.kararlar,
    islemler:kararLog.islemler,
    portfolyoDeger:pd,
    nakit:Math.round(dur.nakit*100)/100,
    toplamKZ:Math.round(kz*100)/100,
    hatalar:hatalar,
    kaynaklar:kararLog.kaynaklar,
  });
}

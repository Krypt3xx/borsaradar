// /api/kripto-bot.js — Kripto Bot v2
// Teknik veriyi direkt Binance'ten çeker (iç API çağrısı yok)
export const config = { maxDuration: 60 };

var BASLANGIC   = 1000;
var STOP_PCT    = 0.08;
var TP_PCT      = 0.15;
var MAX_POZ_PCT = 0.30;
var MIN_SKOR    = 52;
var PARITELER   = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"];

// ─── STATE ────────────────────────────────────────────────────────────────────
function yeniBakliye() {
  return {
    baslangic: BASLANGIC,
    nakit: BASLANGIC,
    pozisyonlar: {},
    islemler: [],
    kararlar: [],
    basTarihi: new Date().toISOString(),
    guncelleme: new Date().toISOString(),
  };
}
function getDurum() {
  if (!global.__kr) global.__kr = yeniBakliye();
  return global.__kr;
}

// ─── BİNANCE VERİ ÇEK ────────────────────────────────────────────────────────
async function ohlcv(sembol, interval, limit) {
  var url = "https://api.binance.com/api/v3/klines?symbol=" + sembol
    + "&interval=" + interval + "&limit=" + limit;
  var r = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error("Binance " + r.status);
  var d = await r.json();
  return d.map(function(k) {
    return { t:+k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] };
  });
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
  if (cl.length < p) return cl[cl.length-1];
  var k=2/(p+1), e=cl.slice(0,p).reduce(function(a,b){return a+b;},0)/p;
  for (var i=p; i<cl.length; i++) e=cl[i]*k+e*(1-k);
  return Math.round(e*100)/100;
}

function macdHist(cl) {
  if (cl.length < 26) return 0;
  var e12=ema(cl,12), e26=ema(cl,26);
  var line=e12-e26;
  var sig=ema(cl.slice(-9).map(function(_,i){
    var s=cl.slice(0,cl.length-8+i);
    return ema(s,12)-ema(s,26);
  }), 9);
  return Math.round((line-sig)*100)/100;
}

function bbPctB(cl, p) {
  p = p||20;
  if (cl.length < p) return 0.5;
  var sl=cl.slice(-p);
  var mean=sl.reduce(function(a,b){return a+b;},0)/p;
  var std=Math.sqrt(sl.reduce(function(a,b){return a+Math.pow(b-mean,2);},0)/p);
  if (std===0) return 0.5;
  var son=cl[cl.length-1];
  return Math.round(((son-(mean-2*std))/(4*std))*100)/100;
}

function hacimSpike(bars) {
  if (bars.length < 21) return 1;
  var ort=bars.slice(-21,-1).reduce(function(a,b){return a+b.v;},0)/20;
  return ort>0?Math.round((bars[bars.length-1].v/ort)*100)/100:1;
}

function mom5(cl) {
  if (cl.length < 6) return 0;
  var son=cl[cl.length-1], once=cl[cl.length-6];
  return Math.round(((son-once)/once)*10000)/100;
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
  var e20  = ema(cl1,20);
  var e50  = ema(cl1,50);
  var e200 = ema(cl1.length>=200?cl1:cl1, Math.min(200,cl1.length));
  var hs   = hacimSpike(bars1h);
  var m5   = mom5(cl1);
  var deg24 = cl1.length>=25 ? Math.round(((son-cl1[cl1.length-25])/cl1[cl1.length-25])*10000)/100 : 0;

  var puan = 50;
  var aciklamalar = [];

  // RSI 1H
  if (r1 <= 25)      { puan+=20; aciklamalar.push("RSI aşırı sat ("+r1+")"); }
  else if (r1 <= 35) { puan+=12; aciklamalar.push("RSI satım bölgesi ("+r1+")"); }
  else if (r1 >= 75) { puan-=20; aciklamalar.push("RSI aşırı alım ("+r1+")"); }
  else if (r1 >= 65) { puan-=12; aciklamalar.push("RSI alım bölgesi ("+r1+")"); }

  // RSI 4H
  if (r4 <= 40)      { puan+=8;  aciklamalar.push("RSI4H düşük ("+r4+")"); }
  else if (r4 >= 60) { puan-=8;  aciklamalar.push("RSI4H yüksek ("+r4+")"); }

  // MACD
  if (mh > 0)  { puan+=10; aciklamalar.push("MACD bullish"); }
  else if (mh < 0) { puan-=10; aciklamalar.push("MACD bearish"); }

  // Bollinger
  if (bb < 0.1)       { puan+=15; aciklamalar.push("BB alt banda değdi"); }
  else if (bb < 0.25) { puan+=7;  aciklamalar.push("BB alt bant yakını"); }
  else if (bb > 0.9)  { puan-=15; aciklamalar.push("BB üst banda değdi"); }
  else if (bb > 0.75) { puan-=7;  aciklamalar.push("BB üst bant yakını"); }

  // EMA trend
  if (son > e20 && e20 > e50) { puan+=8;  aciklamalar.push("EMA üst trend"); }
  else if (son < e20 && e20 < e50) { puan-=8; aciklamalar.push("EMA alt trend"); }
  if (son > e200) { puan+=5; aciklamalar.push("EMA200 üstünde"); }
  else            { puan-=5; aciklamalar.push("EMA200 altında"); }

  // Hacim
  if (hs >= 2 && deg24 > 0) { puan+=10; aciklamalar.push("Hacim spike "+hs+"× + pozitif"); }
  if (hs >= 2 && deg24 < 0) { puan-=10; aciklamalar.push("Hacim spike "+hs+"× + negatif"); }

  // Momentum
  if (m5 > 3)       { puan+=8;  aciklamalar.push("Mom5 güçlü +"+m5+"%"); }
  else if (m5 < -3) { puan-=8;  aciklamalar.push("Mom5 zayıf "+m5+"%"); }

  puan = Math.max(0, Math.min(100, puan));

  return {
    puan: puan,
    aciklamalar: aciklamalar,
    gosterge: { fiyat:son, rsi1h:r1, rsi4h:r4, macdHist:mh, bbPctB:bb, ema20:e20, ema50:e50, hacimSpike:hs, mom5:m5, deg24:deg24 },
  };
}

// ─── AI KARAR ────────────────────────────────────────────────────────────────
async function aiKarar(sembol, g, puan) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // API key yoksa skor bazlı karar
    return {
      karar: puan >= 60 ? "AL" : puan <= 40 ? "SAT" : "BEKLE",
      guven: puan,
      gerekceler: "Teknik skor: " + puan + "/100",
    };
  }
  var prompt = sembol + " teknik analiz:\n"
    + "Fiyat: $" + g.fiyat + " | 24H: " + g.deg24 + "%\n"
    + "RSI 1H: " + g.rsi1h + " | RSI 4H: " + g.rsi4h + "\n"
    + "MACD hist: " + g.macdHist + " | BB %B: " + g.bbPctB + "\n"
    + "EMA20: " + g.ema20 + " | EMA50: " + g.ema50 + "\n"
    + "Hacim Spike: " + g.hacimSpike + "× | Mom5: " + g.mom5 + "%\n"
    + "Teknik Skor: " + puan + "/100\n\n"
    + "SADECE JSON, başka hiçbir şey yazma:\n"
    + '{"karar":"AL|SAT|BEKLE","guven":0-100,"gerekceler":"1 cümle"}';
  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:150,messages:[{role:"user",content:prompt}]}),
      signal:AbortSignal.timeout(12000),
    });
    var d = await r.json();
    var txt = (d.content&&d.content[0]&&d.content[0].text)||"";
    var m = txt.match(/\{[\s\S]*?\}/);
    if (m) {
      var parsed = JSON.parse(m[0]);
      if (parsed.karar && parsed.guven !== undefined) return parsed;
    }
  } catch(e) {}
  // Fallback
  return {
    karar: puan >= 60 ? "AL" : puan <= 40 ? "SAT" : "BEKLE",
    guven: puan,
    gerekceler: "Teknik skor bazlı karar: " + puan + "/100",
  };
}

// ─── İŞLEM FONKS. ─────────────────────────────────────────────────────────────
function ac(dur, sembol, fiyat, usdt) {
  if (dur.nakit < 10) return null;
  if (usdt > dur.nakit) usdt = dur.nakit * 0.98;
  var adet = usdt / fiyat;
  dur.nakit = Math.round((dur.nakit - usdt) * 100) / 100;
  dur.pozisyonlar[sembol] = {
    adet: adet,
    girisUSDT: Math.round(usdt*100)/100,
    girisFiyat: fiyat,
    guncelFiyat: fiyat,
    acanZaman: new Date().toISOString(),
    stopLoss: Math.round(fiyat*(1-STOP_PCT)*100)/100,
    takeProfit: Math.round(fiyat*(1+TP_PCT)*100)/100,
  };
  var islem = { id:Date.now(), tip:"AL", sembol:sembol, fiyat:fiyat,
    usdt:Math.round(usdt*100)/100, adet:Math.round(adet*1e7)/1e7,
    zaman:new Date().toISOString(),
    stopLoss:dur.pozisyonlar[sembol].stopLoss,
    takeProfit:dur.pozisyonlar[sembol].takeProfit };
  dur.islemler.unshift(islem);
  return islem;
}

function kapat(dur, sembol, fiyat, neden) {
  var poz = dur.pozisyonlar[sembol];
  if (!poz) return null;
  var gelir = poz.adet * fiyat;
  var kz = gelir - poz.girisUSDT;
  var kzPct = Math.round((kz/poz.girisUSDT)*10000)/100;
  dur.nakit = Math.round((dur.nakit + gelir)*100)/100;
  var islem = { id:Date.now(), tip:"SAT", sembol:sembol, fiyat:fiyat,
    usdt:Math.round(gelir*100)/100, adet:Math.round(poz.adet*1e7)/1e7,
    zaman:new Date().toISOString(), karZarar:Math.round(kz*100)/100,
    karZararPct:kzPct, neden:neden||"Bot kararı", girisFiyat:poz.girisFiyat };
  dur.islemler.unshift(islem);
  delete dur.pozisyonlar[sembol];
  return islem;
}

function stopTakip(dur, sembol, fiyat) {
  var poz = dur.pozisyonlar[sembol];
  if (!poz) return null;
  poz.guncelFiyat = fiyat;
  if (fiyat <= poz.stopLoss)   return kapat(dur, sembol, fiyat, "🛡 Stop-Loss tetiklendi");
  if (fiyat >= poz.takeProfit) return kapat(dur, sembol, fiyat, "🎯 Take-Profit tetiklendi");
  return null;
}

function portfolyo(dur) {
  var deger = dur.nakit;
  Object.values(dur.pozisyonlar).forEach(function(p){
    deger += p.adet * (p.guncelFiyat || p.girisFiyat);
  });
  return Math.round(deger*100)/100;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  var dur = getDurum();

  // GET — durum
  if (req.method === "GET") {
    var pDeger = portfolyo(dur);
    var kz = pDeger - BASLANGIC;
    return res.json({
      ok: true,
      durum: {
        nakit: Math.round(dur.nakit*100)/100,
        portfolyoDeger: pDeger,
        toplamKZ: Math.round(kz*100)/100,
        toplamKZPct: Math.round((kz/BASLANGIC)*10000)/100,
        pozisyonlar: dur.pozisyonlar,
        sonIslemler: dur.islemler.slice(0,20),
        sonKararlar: dur.kararlar.slice(0,10),
        baslamaTarihi: dur.basTarihi,
        sonGuncelleme: dur.guncelleme,
        islemSayisi: dur.islemler.length,
      },
    });
  }

  if (req.method !== "POST") return res.status(405).end();

  // POST — karar döngüsü
  var kararLog = { zaman:new Date().toISOString(), kararlar:[], islemler:[] };
  var hatalar = [];

  for (var i=0; i<PARITELER.length; i++) {
    var sembol = PARITELER[i];
    try {
      // Binance'ten direkt veri çek
      var bars1h = await ohlcv(sembol, "1h", 200);
      var bars4h = await ohlcv(sembol, "4h", 100);
      if (!bars1h.length || !bars4h.length) { hatalar.push(sembol+": veri yok"); continue; }

      var fiyat = bars1h[bars1h.length-1].c;

      // Stop/Take kontrol — açık pozisyon varsa
      if (dur.pozisyonlar[sembol]) {
        var otomatik = stopTakip(dur, sembol, fiyat);
        if (otomatik) {
          kararLog.islemler.push(otomatik);
          kararLog.kararlar.push({ sembol:sembol, fiyat:fiyat, finalKarar:"SAT (Otomatik)", puan:0, gerekceler:otomatik.neden, sinyaller:[] });
          continue;
        }
      }

      // Teknik analiz
      var teknik = teknikPuanla(bars1h, bars4h);
      var puan   = teknik.puan;
      var g      = teknik.gosterge;

      // AI karar
      var ai = await aiKarar(sembol, g, puan);

      // Final karar
      var final = "BEKLE";
      var acikPoz = !!dur.pozisyonlar[sembol];

      if (!acikPoz && ai.karar==="AL" && puan>=MIN_SKOR) {
        final = "AL";
      } else if (acikPoz && ai.karar==="SAT" && puan<=(100-MIN_SKOR)) {
        final = "SAT";
      } else if (acikPoz && ai.karar==="AL") {
        final = "TUT";
      }

      // İşlem yap
      var yapılanIslem = null;
      if (final==="AL") {
        var kullanUSDT = Math.min(dur.nakit*MAX_POZ_PCT, dur.nakit*0.95);
        yapılanIslem = ac(dur, sembol, fiyat, kullanUSDT);
        if (yapılanIslem) kararLog.islemler.push(yapılanIslem);
      } else if (final==="SAT" && acikPoz) {
        yapılanIslem = kapat(dur, sembol, fiyat, ai.gerekceler);
        if (yapılanIslem) kararLog.islemler.push(yapılanIslem);
      }

      kararLog.kararlar.push({
        sembol: sembol,
        fiyat: fiyat,
        puan: puan,
        aiKarar: ai.karar,
        aiGuven: ai.guven,
        finalKarar: final,
        gerekceler: ai.gerekceler,
        sinyaller: teknik.aciklamalar.slice(0,5),
        islem: yapılanIslem || null,
      });

    } catch(e) {
      hatalar.push(sembol+": "+e.message);
    }
  }

  dur.kararlar.unshift(kararLog);
  if (dur.kararlar.length > 50) dur.kararlar = dur.kararlar.slice(0,50);
  dur.guncelleme = new Date().toISOString();
  global.__kr = dur;

  var pDeger = portfolyo(dur);
  var kz = pDeger - BASLANGIC;

  res.json({
    ok: true,
    kararSayisi: kararLog.kararlar.length,
    islemSayisi: kararLog.islemler.length,
    kararlar: kararLog.kararlar,
    islemler: kararLog.islemler,
    portfolyoDeger: pDeger,
    nakit: Math.round(dur.nakit*100)/100,
    toplamKZ: Math.round(kz*100)/100,
    hatalar: hatalar,
  });
}

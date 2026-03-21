// /api/kripto-fiyat.js — Binance gerçek OHLCV verisi
// Teknik göstergeler hesaplayarak döner

export const config = { maxDuration: 30 };

const PARITELER = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"];

const BINANCE = "https://api.binance.com";

async function ohlcvCek(sembol, interval, limit) {
  var url = BINANCE + "/api/v3/klines?symbol=" + sembol
    + "&interval=" + (interval||"1h") + "&limit=" + (limit||200);
  var r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error("Binance HTTP " + r.status);
  var data = await r.json();
  // [openTime, open, high, low, close, volume, ...]
  return data.map(function(k) {
    return {
      t: k[0],
      o: parseFloat(k[1]),
      h: parseFloat(k[2]),
      l: parseFloat(k[3]),
      c: parseFloat(k[4]),
      v: parseFloat(k[5]),
    };
  });
}

function rsi(closes, period) {
  var p = period || 14;
  if (closes.length < p + 1) return null;
  var gains = 0, losses = 0;
  for (var i = 1; i <= p; i++) {
    var d = closes[i] - closes[i-1];
    if (d > 0) gains += d; else losses -= d;
  }
  var ag = gains/p, al = losses/p;
  for (var j = p+1; j < closes.length; j++) {
    var d2 = closes[j] - closes[j-1];
    ag = (ag*(p-1) + (d2>0?d2:0))/p;
    al = (al*(p-1) + (d2<0?-d2:0))/p;
  }
  if (al === 0) return 100;
  return Math.round((100 - 100/(1+ag/al)) * 10)/10;
}

function ema(closes, period) {
  if (closes.length < period) return null;
  var k = 2/(period+1);
  var e = closes.slice(0,period).reduce(function(a,b){return a+b;},0)/period;
  for (var i = period; i < closes.length; i++) {
    e = closes[i]*k + e*(1-k);
  }
  return Math.round(e*100)/100;
}

function macd(closes) {
  if (closes.length < 26) return null;
  var e12 = ema(closes, 12);
  var e26 = ema(closes, 26);
  if (!e12 || !e26) return null;
  var macdLine = Math.round((e12 - e26)*100)/100;
  // Signal için son 9 bar MACD serisini hesapla
  var macdSeries = [];
  for (var i = closes.length-9; i < closes.length; i++) {
    var slice = closes.slice(0, i+1);
    var em12 = ema(slice, 12);
    var em26 = ema(slice, 26);
    if (em12 && em26) macdSeries.push(em12-em26);
  }
  var signal = macdSeries.length > 0
    ? Math.round(macdSeries.reduce(function(a,b){return a+b;},0)/macdSeries.length * 100)/100
    : 0;
  return {
    macd: macdLine,
    signal: signal,
    histogram: Math.round((macdLine - signal)*100)/100,
  };
}

function bollinger(closes, period, std) {
  var p = period || 20;
  var s = std || 2;
  if (closes.length < p) return null;
  var slice = closes.slice(-p);
  var mean = slice.reduce(function(a,b){return a+b;},0)/p;
  var variance = slice.reduce(function(a,b){return a+Math.pow(b-mean,2);},0)/p;
  var stddev = Math.sqrt(variance);
  var upper = Math.round((mean + s*stddev)*100)/100;
  var lower = Math.round((mean - s*stddev)*100)/100;
  var mid   = Math.round(mean*100)/100;
  var son   = closes[closes.length-1];
  // %B: 0=alt band, 1=üst band
  var pctB  = stddev > 0 ? Math.round(((son-lower)/(upper-lower))*100)/100 : 0.5;
  return { upper, mid, lower, pctB };
}

function hacimAnaliz(bars) {
  if (bars.length < 21) return null;
  var sonHacim = bars[bars.length-1].v;
  var ort20 = bars.slice(-21,-1).reduce(function(a,b){return a+b.v;},0)/20;
  var spike = ort20 > 0 ? Math.round((sonHacim/ort20)*100)/100 : 1;
  // Son 5 barda artış trendi var mı?
  var son5v = bars.slice(-5).map(function(b){return b.v;});
  var artis = son5v[4] > son5v[0];
  return { sonHacim, ort20: Math.round(ort20), spike, artis };
}

function momentum(closes) {
  if (closes.length < 14) return null;
  var son = closes[closes.length-1];
  var once14 = closes[closes.length-14];
  var mom14 = Math.round(((son-once14)/once14)*10000)/100; // %
  var son = closes[closes.length-1];
  var once5 = closes[closes.length-6] || closes[0];
  var mom5  = Math.round(((son-once5)/once5)*10000)/100;
  return { mom14, mom5 };
}

// ICT: Fair Value Gap (FVG) tespiti
function ictFVG(bars) {
  if (bars.length < 3) return null;
  var gaps = [];
  for (var i = 1; i < bars.length-1; i++) {
    var prev = bars[i-1], curr = bars[i], next = bars[i+1];
    // Bullish FVG: prev.high < next.low
    if (prev.h < next.l) {
      gaps.push({ tip:"BULLISH", ust:next.l, alt:prev.h, indeks:i });
    }
    // Bearish FVG: prev.low > next.high
    if (prev.l > next.h) {
      gaps.push({ tip:"BEARISH", ust:prev.l, alt:next.h, indeks:i });
    }
  }
  // Son 10 bardaki gap'ler — fiyat içinde mi?
  var sonFiyat = bars[bars.length-1].c;
  var yakinGaplar = gaps.slice(-5).map(function(g) {
    var icinde = sonFiyat >= g.alt && sonFiyat <= g.ust;
    return { tip:g.tip, ust:g.ust, alt:g.alt, icinde:icinde };
  });
  return yakinGaplar.length > 0 ? yakinGaplar[yakinGaplar.length-1] : null;
}

// ICT: Order Block tespiti
function ictOrderBlock(bars) {
  if (bars.length < 5) return null;
  var son = bars[bars.length-1];
  // Son güçlü hareket öncesinin son bearish/bullish mumu = order block
  var obBullish = null, obBearish = null;
  for (var i = bars.length-5; i >= 0 && i < bars.length-1; i++) {
    var b = bars[i];
    if (!obBullish && b.c < b.o) { // bearish mum — bullish OB adayı
      obBullish = { tip:"BULLISH_OB", ust:b.h, alt:b.l, close:b.c };
    }
    if (!obBearish && b.c > b.o) { // bullish mum — bearish OB adayı
      obBearish = { tip:"BEARISH_OB", ust:b.h, alt:b.l, close:b.c };
    }
    if (obBullish && obBearish) break;
  }
  var sonFiyat = son.c;
  var aktif = null;
  if (obBullish && sonFiyat >= obBullish.alt && sonFiyat <= obBullish.ust) aktif = obBullish;
  if (obBearish && sonFiyat >= obBearish.alt && sonFiyat <= obBearish.ust) aktif = obBearish;
  return aktif;
}

async function pariteTeknik(sembol) {
  try {
    var bars1h = await ohlcvCek(sembol, "1h", 200);
    var bars4h = await ohlcvCek(sembol, "4h", 100);
    if (bars1h.length < 50) return null;

    var closes1h = bars1h.map(function(b){return b.c;});
    var closes4h = bars4h.map(function(b){return b.c;});

    var sonFiyat = closes1h[closes1h.length-1];
    var prevFiyat = closes1h[closes1h.length-2];
    var gunlukDeg = Math.round(((sonFiyat-prevFiyat)/prevFiyat)*10000)/100;

    // 24h değişim (24 bar önce)
    var once24 = closes1h[closes1h.length-25] || closes1h[0];
    var deg24h  = Math.round(((sonFiyat-once24)/once24)*10000)/100;

    var teknik = {
      sembol: sembol,
      fiyat: sonFiyat,
      gunlukDeg: gunlukDeg,
      deg24h: deg24h,

      // 1H göstergeler
      rsi1h:  rsi(closes1h),
      macd1h: macd(closes1h),
      bb1h:   bollinger(closes1h),
      ema20:  ema(closes1h, 20),
      ema50:  ema(closes1h, 50),
      ema200: ema(closes1h, 200),
      hacim:  hacimAnaliz(bars1h),
      mom:    momentum(closes1h),

      // 4H göstergeler (trend konfirmasyonu)
      rsi4h:  rsi(closes4h),
      macd4h: macd(closes4h),

      // ICT
      fvg:    ictFVG(bars1h.slice(-20)),
      ob:     ictOrderBlock(bars1h.slice(-10)),

      // Ham veriler (son 50 bar)
      bars: bars1h.slice(-50).map(function(b){
        return { t:b.t, o:b.o, h:b.h, l:b.l, c:b.c, v:b.v };
      }),
    };

    return teknik;
  } catch(e) {
    return { sembol:sembol, hata:e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
  var sembol = req.query.sembol;
  if (sembol) {
    var t = await pariteTeknik(sembol.toUpperCase());
    return res.json(t || { hata:"Veri alınamadı" });
  }
  // Tüm pariteler
  var sonuclar = await Promise.allSettled(
    PARITELER.map(function(s){return pariteTeknik(s);})
  );
  var data = {};
  sonuclar.forEach(function(r,i){
    if (r.status==="fulfilled" && r.value) {
      data[PARITELER[i]] = r.value;
    }
  });
  res.json({ ok:true, zaman:Date.now(), pariteler:data });
}

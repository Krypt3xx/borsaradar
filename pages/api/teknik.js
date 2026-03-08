// Teknik analiz — Yahoo Finance'den OHLCV çek, RSI + MACD + Destek/Direnç hesapla
export default async function handler(req, res) {
  const { sembol } = req.query;
  if (!sembol) return res.status(400).json({error:"sembol gerekli"});

  res.setHeader("Cache-Control","s-maxage=300,stale-while-revalidate=60");

  try {
    // 60 günlük günlük veri
    const bitis  = Math.floor(Date.now()/1000);
    const baslangic = bitis - 60*24*3600;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sembol)}?interval=1d&period1=${baslangic}&period2=${bitis}`;

    const r = await fetch(url, {
      headers:{"User-Agent":"Mozilla/5.0","Referer":"https://finance.yahoo.com"},
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`Yahoo ${r.status}`);
    const d = await r.json();

    const chart  = d.chart?.result?.[0];
    if (!chart)  throw new Error("Veri bulunamadı");

    const timestamps = chart.timestamp || [];
    const q = chart.indicators?.quote?.[0] || {};
    const kapanislar = q.close  || [];
    const yukseklist = q.high   || [];
    const dusukler   = q.low    || [];
    const hacimler   = q.volume || [];

    if (kapanislar.length < 14) throw new Error("Yetersiz veri");

    // ── RSI (14) ──────────────────────────────────────────────────────────
    function hesaplaRSI(prices, period=14) {
      let gains=0, losses=0;
      for (let i=1; i<=period; i++) {
        const diff = prices[i]-prices[i-1];
        if (diff>=0) gains+=diff; else losses-=diff;
      }
      let avgGain=gains/period, avgLoss=losses/period;
      for (let i=period+1; i<prices.length; i++) {
        const diff = prices[i]-prices[i-1];
        avgGain = (avgGain*(period-1)+(diff>0?diff:0))/period;
        avgLoss = (avgLoss*(period-1)+(diff<0?-diff:0))/period;
      }
      if (avgLoss===0) return 100;
      return 100-(100/(1+avgGain/avgLoss));
    }

    // ── MACD (12,26,9) ────────────────────────────────────────────────────
    function ema(prices, period) {
      const k=2/(period+1);
      let e=prices[0];
      return prices.map(p=>{ e=p*k+e*(1-k); return e; });
    }
    function hesaplaMACD(prices) {
      const ema12=ema(prices,12), ema26=ema(prices,26);
      const macdLine=ema12.map((v,i)=>v-ema26[i]);
      const signal=ema(macdLine,9);
      const histogram=macdLine.map((v,i)=>v-signal[i]);
      return { macd:macdLine.at(-1), signal:signal.at(-1), histogram:histogram.at(-1) };
    }

    // ── Destek / Direnç (pivot) ───────────────────────────────────────────
    function destekDirenc(highs, lows, closes) {
      const son20H = highs.slice(-20).filter(Boolean);
      const son20L = lows.slice(-20).filter(Boolean);
      const son20C = closes.slice(-20).filter(Boolean);
      const pivot = (Math.max(...son20H)+Math.min(...son20L)+son20C.at(-1))/3;
      return {
        direnc1: parseFloat((2*pivot-Math.min(...son20L)).toFixed(2)),
        direnc2: parseFloat((pivot+(Math.max(...son20H)-Math.min(...son20L))).toFixed(2)),
        destek1: parseFloat((2*pivot-Math.max(...son20H)).toFixed(2)),
        destek2: parseFloat((pivot-(Math.max(...son20H)-Math.min(...son20L))).toFixed(2)),
        pivot:   parseFloat(pivot.toFixed(2)),
      };
    }

    // ── Hareketli Ortalamalar ─────────────────────────────────────────────
    const gecerliKapanislar = kapanislar.filter(Boolean);
    const ma20 = gecerliKapanislar.slice(-20).reduce((a,b)=>a+b,0)/20;
    const ma50 = gecerliKapanislar.length>=50 ? gecerliKapanislar.slice(-50).reduce((a,b)=>a+b,0)/50 : null;
    const sonFiyat = gecerliKapanislar.at(-1);
    const sonHacim = hacimler.filter(Boolean).at(-1)||0;
    const ortalHacim = hacimler.filter(Boolean).slice(-20).reduce((a,b)=>a+b,0)/20;

    const rsi = hesaplaRSI(gecerliKapanislar);
    const { macd, signal, histogram } = hesaplaMACD(gecerliKapanislar);
    const seviyeler = destekDirenc(yukseklist, dusukler, kapanislar);

    // RSI yorumu
    const rsiYorum = rsi>70?"AŞIRI ALIM ⚠️":rsi>60?"GÜÇLÜ 📈":rsi<30?"AŞIRI SATIM 🔥":rsi<40?"ZAYIF 📉":"NÖTR ◆";
    // MACD yorumu
    const macdYorum = histogram>0&&macd>signal?"YUKARI MOMENTUM 📈":histogram<0&&macd<signal?"AŞAĞI MOMENTUM 📉":"SINIRDA ◆";
    // Trend
    const trend = sonFiyat>ma20&&(ma50===null||ma20>ma50)?"YÜKSELİŞ TRENDI":sonFiyat<ma20&&(ma50===null||ma20<ma50)?"DÜŞÜŞ TRENDI":"YATAY";
    // Hacim yorumu
    const hacimYorum = sonHacim > ortalHacim*1.5 ? "YÜKSEK 🔥" : sonHacim < ortalHacim*0.5 ? "DÜŞÜK" : "NORMAL";

    // Son 30 günlük kapanış (grafik için)
    const sonOtuz = gecerliKapanislar.slice(-30);
    const tarihler = timestamps.slice(-30).map(t=>new Date(t*1000).toLocaleDateString("tr-TR",{month:"short",day:"numeric"}));

    res.status(200).json({
      sembol,
      fiyat: sonFiyat,
      rsi: parseFloat(rsi.toFixed(1)),
      rsiYorum,
      macd: { deger:parseFloat(macd.toFixed(4)), signal:parseFloat(signal.toFixed(4)), histogram:parseFloat(histogram.toFixed(4)) },
      macdYorum,
      ma20: parseFloat(ma20.toFixed(2)),
      ma50: ma50 ? parseFloat(ma50.toFixed(2)) : null,
      trend,
      seviyeler,
      hacim: { son:sonHacim, ortalama:Math.round(ortalHacim), yorum:hacimYorum },
      grafik: { fiyatlar:sonOtuz.map(v=>parseFloat(v.toFixed(2))), tarihler },
    });
  } catch(e) {
    res.status(500).json({error: e.message});
  }
}

// Teknik veri — Yahoo Finance v8 chart endpoint (daha güvenilir)
export default async function handler(req, res) {
  const { sembol } = req.query;
  if (!sembol) return res.status(400).json({ error: "sembol gerekli" });

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  // Yahoo sembol dönüşümü: BIST hisseleri .IS eki alır
  const bistSemboller = ["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM","SAHOL","KOZAL","MGROS","ULKER","ARCLK","VESBE","TSKB","HALKB","VAKBN","SKBNK"];
  const yahooSembol = bistSemboller.includes(sembol.toUpperCase()) ? `${sembol}.IS` : sembol;

  const bitis = Math.floor(Date.now() / 1000);
  const baslangic = bitis - 90 * 24 * 3600; // 90 günlük veri

  // Birden fazla endpoint dene
  const endpoints = [
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSembol)}?interval=1d&period1=${baslangic}&period2=${bitis}&includePrePost=false`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSembol)}?interval=1d&period1=${baslangic}&period2=${bitis}`,
    `https://query1.finance.yahoo.com/v7/finance/download/${encodeURIComponent(yahooSembol)}?period1=${baslangic}&period2=${bitis}&interval=1d`,
  ];

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com",
    "Origin": "https://finance.yahoo.com",
  };

  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;

      const d = await r.json();
      const chart = d.chart?.result?.[0];
      if (!chart) continue;

      const timestamps = chart.timestamp || [];
      const q = chart.indicators?.quote?.[0] || {};
      const kapanislar = (q.close || []).map(v => v ?? null);
      const yukseklist = (q.high  || []).map(v => v ?? null);
      const dusukler   = (q.low   || []).map(v => v ?? null);
      const hacimler   = (q.volume|| []).map(v => v ?? 0);

      const gecerli = kapanislar.filter(Boolean);
      if (gecerli.length < 14) continue;

      // RSI (14)
      function rsiHesapla(prices, period = 14) {
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
          const d = prices[i] - prices[i-1];
          d >= 0 ? gains += d : losses -= d;
        }
        let ag = gains/period, al = losses/period;
        for (let i = period+1; i < prices.length; i++) {
          const d = prices[i] - prices[i-1];
          ag = (ag*(period-1) + Math.max(d, 0)) / period;
          al = (al*(period-1) + Math.max(-d, 0)) / period;
        }
        return al === 0 ? 100 : parseFloat((100 - 100/(1+ag/al)).toFixed(1));
      }

      // EMA
      function ema(prices, period) {
        const k = 2/(period+1);
        let e = prices[0];
        return prices.map(p => { e = p*k + e*(1-k); return e; });
      }

      // MACD (12, 26, 9)
      function macdHesapla(prices) {
        const e12 = ema(prices, 12), e26 = ema(prices, 26);
        const line = e12.map((v,i) => v - e26[i]);
        const sig  = ema(line, 9);
        const hist = line.map((v,i) => v - sig[i]);
        return {
          deger:     parseFloat(line.at(-1).toFixed(4)),
          signal:    parseFloat(sig.at(-1).toFixed(4)),
          histogram: parseFloat(hist.at(-1).toFixed(4)),
        };
      }

      // Pivot destek/direnç
      function pivotHesapla(highs, lows, closes) {
        const h20 = highs.filter(Boolean).slice(-20);
        const l20 = lows.filter(Boolean).slice(-20);
        const maxH = Math.max(...h20), minL = Math.min(...l20);
        const pivot = (maxH + minL + closes.filter(Boolean).at(-1)) / 3;
        return {
          direnc2: parseFloat((pivot + (maxH - minL)).toFixed(2)),
          direnc1: parseFloat((2*pivot - minL).toFixed(2)),
          pivot:   parseFloat(pivot.toFixed(2)),
          destek1: parseFloat((2*pivot - maxH).toFixed(2)),
          destek2: parseFloat((pivot - (maxH - minL)).toFixed(2)),
        };
      }

      const rsi = rsiHesapla(gecerli);
      const macd = macdHesapla(gecerli);
      const seviyeler = pivotHesapla(yukseklist, dusukler, kapanislar);

      const ma20 = parseFloat((gecerli.slice(-20).reduce((a,b)=>a+b,0)/20).toFixed(2));
      const ma50 = gecerli.length >= 50 ? parseFloat((gecerli.slice(-50).reduce((a,b)=>a+b,0)/50).toFixed(2)) : null;
      const sonFiyat = parseFloat(gecerli.at(-1).toFixed(2));
      const hacimSon = hacimler.filter(Boolean).at(-1) || 0;
      const hacimOrt = Math.round(hacimler.filter(Boolean).slice(-20).reduce((a,b)=>a+b,0)/20);

      const trend = sonFiyat>ma20 && (!ma50||ma20>ma50) ? "YÜKSELİŞ" : sonFiyat<ma20 && (!ma50||ma20<ma50) ? "DÜŞÜŞ" : "YATAY";
      const rsiYorum = rsi>70?"AŞIRI ALIM ⚠️":rsi>60?"GÜÇLÜ 📈":rsi<30?"AŞIRI SATIM 🔥":rsi<40?"ZAYIF 📉":"NÖTR ◆";
      const macdYorum = macd.histogram>0&&macd.deger>macd.signal?"YUKARI 📈":macd.histogram<0&&macd.deger<macd.signal?"AŞAĞI 📉":"SINIRDA ◆";

      // Teknik güç skoru (0-100)
      let guc = 50;
      if (rsi > 50) guc += (rsi - 50) * 0.5; else guc -= (50 - rsi) * 0.5;
      if (macd.histogram > 0) guc += 10; else guc -= 10;
      if (sonFiyat > ma20) guc += 10; else guc -= 10;
      if (ma50 && sonFiyat > ma50) guc += 5; else if (ma50) guc -= 5;
      guc = Math.max(0, Math.min(100, Math.round(guc)));

      return res.status(200).json({
        sembol: sembol.toUpperCase(),
        yahooSembol,
        fiyat: sonFiyat,
        rsi, rsiYorum,
        macd, macdYorum,
        ma20, ma50, trend,
        seviyeler,
        hacim: { son: hacimSon, ortalama: hacimOrt, yorum: hacimSon>hacimOrt*1.5?"YÜKSEK 🔥":hacimSon<hacimOrt*0.5?"DÜŞÜK":"NORMAL" },
        guc,
        grafik: {
          fiyatlar: gecerli.slice(-30).map(v => parseFloat(v.toFixed(2))),
          tarihler: timestamps.slice(-30).map(t => new Date(t*1000).toLocaleDateString("tr-TR",{month:"short",day:"numeric"})),
        },
      });
    } catch { continue; }
  }

  return res.status(404).json({ error: `"${sembol}" için veri bulunamadı. BIST hisseleri için sadece sembol yazın (TUPRS değil TUPRS.IS gerekmez). Global için: NVDA, AAPL, GLD` });
}

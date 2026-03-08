// Fiyat verisi - Yahoo Finance v8 API (daha güvenilir) + fallback
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");

  const semboller = ["USDTRY=X", "EURTRY=X", "GBPTRY=X", "GC=F", "BZ=F", "BTC-USD", "^GSPC", "^IXIC", "XU100.IS"];
  const isimler = {
    "USDTRY=X":"USD/TRY","EURTRY=X":"EUR/TRY","GBPTRY=X":"GBP/TRY",
    "GC=F":"Altın","BZ=F":"Brent","BTC-USD":"BTC",
    "^GSPC":"S&P500","^IXIC":"NASDAQ","XU100.IS":"BIST100",
  };

  // Birden fazla endpoint dene
  const endpoints = [
    `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${semboller.join(",")}&crumb=`,
    `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${semboller.join(",")}`,
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${semboller.join(",")}`,
  ];

  // Döviz kuru için TCMB fallback
  const tcmbFallback = async () => {
    try {
      const r = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
        signal: AbortSignal.timeout(5000),
      });
      const d = await r.json();
      return d.rates?.TRY || null;
    } catch { return null; }
  };

  for (const url of endpoints) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Referer": "https://finance.yahoo.com",
        },
        signal: AbortSignal.timeout(7000),
      });

      if (!r.ok) continue;
      const data = await r.json();
      const quotes = data?.quoteResponse?.result || data?.result || [];
      if (!quotes.length) continue;

      let fiyatlar = quotes.map(q => ({
        sembol: q.symbol,
        isim: isimler[q.symbol] || q.symbol,
        fiyat: q.regularMarketPrice,
        degisim: q.regularMarketChangePercent,
        fark: q.regularMarketChange,
      })).filter(f => f.fiyat);

      // USD/TRY yoksa veya 0'sa fallback kullan
      const usdtry = fiyatlar.find(f => f.sembol === "USDTRY=X");
      if (!usdtry || usdtry.fiyat < 10) {
        const kur = await tcmbFallback();
        if (kur) {
          if (usdtry) usdtry.fiyat = kur;
          else fiyatlar.unshift({ sembol:"USDTRY=X", isim:"USD/TRY", fiyat:kur, degisim:0, fark:0 });
        }
      }

      return res.status(200).json({ fiyatlar, kaynak:"yahoo", zaman: new Date().toISOString() });
    } catch {}
  }

  // Tüm Yahoo denemeleri başarısız → sadece döviz kurunu dön
  try {
    const r = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    const rates = d.rates || {};
    const fiyatlar = [
      { sembol:"USDTRY=X", isim:"USD/TRY", fiyat:rates.TRY||0, degisim:0, fark:0 },
      { sembol:"EURTRY=X", isim:"EUR/TRY", fiyat:(rates.TRY||0)/(rates.EUR||1), degisim:0, fark:0 },
    ].filter(f => f.fiyat > 0);
    return res.status(200).json({ fiyatlar, kaynak:"exchangerate-api", zaman: new Date().toISOString() });
  } catch(e) {
    return res.status(500).json({ error: e.message, fiyatlar:[] });
  }
}

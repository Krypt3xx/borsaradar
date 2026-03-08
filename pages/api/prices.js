// Canlı fiyat verileri - ücretsiz kaynaklardan
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");

  try {
    // Yahoo Finance'den USD/TRY, altın, petrol, BTC, S&P500
    const semboller = ["USDTRY=X", "GC=F", "BZ=F", "BTC-USD", "^GSPC", "^IXIC", "EURTRY=X"];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${semboller.join(",")}&fields=symbol,regularMarketPrice,regularMarketChangePercent,regularMarketChange`;

    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });

    if (!r.ok) throw new Error(`Yahoo Finance: ${r.status}`);
    const data = await r.json();
    const quotes = data?.quoteResponse?.result || [];

    const isimler = {
      "USDTRY=X": "USD/TRY",
      "EURTRY=X": "EUR/TRY",
      "GC=F":     "Altın",
      "BZ=F":     "Brent",
      "BTC-USD":  "BTC",
      "^GSPC":    "S&P500",
      "^IXIC":    "NASDAQ",
    };

    const fiyatlar = quotes.map(q => ({
      sembol: q.symbol,
      isim: isimler[q.symbol] || q.symbol,
      fiyat: q.regularMarketPrice,
      degisim: q.regularMarketChangePercent,
      fark: q.regularMarketChange,
    }));

    res.status(200).json({ fiyatlar, zaman: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

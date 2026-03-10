// Gerçek zamanlı fiyat — simülasyon için
// BIST otomatik: .IS ekliyse kullan, yoksa önce .IS dene sonra global
export default async function handler(req, res) {
  const { sembol } = req.query;
  if (!sembol) return res.status(400).json({ error: "sembol gerekli" });

  const s = sembol.toUpperCase().trim();

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://finance.yahoo.com",
    "Origin": "https://finance.yahoo.com",
  };

  // Deneme sırası: .IS ekli BIST sembolü önce, sonra global
  const denemeler = s.endsWith(".IS") ? [s] : [`${s}.IS`, s];

  for (const yahooSembol of denemeler) {
    const urls = [
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSembol)}?interval=1m&range=5d`,
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSembol)}?interval=1d&range=5d`,
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
        if (!r.ok) continue;
        const d = await r.json();
        const result = d.chart?.result?.[0];
        if (!result) continue;

        const q = result.indicators?.quote?.[0];
        const closes = (q?.close || []).filter(v => v != null && v > 0);
        if (!closes.length) continue;

        const fiyat = parseFloat(closes.at(-1).toFixed(4));
        const prevClose = closes.length > 1 ? parseFloat(closes.at(-2).toFixed(4)) : fiyat;
        const degisim = parseFloat(((fiyat - prevClose) / prevClose * 100).toFixed(2));
        const para = result.meta?.currency || (yahooSembol.endsWith(".IS") ? "TRY" : "USD");
        const guncelZaman = result.meta?.regularMarketTime
          ? new Date(result.meta.regularMarketTime * 1000).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

        return res.status(200).json({
          sembol: s,
          yahooSembol,
          fiyat,
          prevClose,
          degisim,
          para,
          guncelZaman,
          ts: Date.now(),
        });
      } catch { continue; }
    }
  }

  return res.status(404).json({
    error: `"${s}" fiyatı alınamadı. BIST için: AEFES, TUPRS, GARAN | Global: NVDA, AAPL, GLD, BTC-USD`
  });
}

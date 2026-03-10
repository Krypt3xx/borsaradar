// Gerçek zamanlı fiyat çekici — simülasyon için
export default async function handler(req, res) {
  const { sembol } = req.query;
  if (!sembol) return res.status(400).json({ error: "sembol gerekli" });

  const bistSemboller = ["TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL","TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM","SAHOL","KOZAL","MGROS","ULKER","ARCLK","VESBE","TSKB","HALKB","VAKBN","SKBNK"];
  const yahooSembol = bistSemboller.includes(sembol.toUpperCase()) ? `${sembol}.IS` : sembol;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://finance.yahoo.com",
  };

  const urls = [
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSembol)}?interval=1d&range=5d`,
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
      const closes = (q?.close || []).filter(Boolean);
      if (!closes.length) continue;
      const fiyat = parseFloat(closes.at(-1).toFixed(4));
      const prevClose = closes.length > 1 ? parseFloat(closes.at(-2).toFixed(4)) : fiyat;
      const degisim = parseFloat(((fiyat - prevClose) / prevClose * 100).toFixed(2));
      const para = result.meta?.currency || "USD";
      return res.status(200).json({ sembol: sembol.toUpperCase(), yahooSembol, fiyat, prevClose, degisim, para, ts: Date.now() });
    } catch { continue; }
  }
  return res.status(404).json({ error: `"${sembol}" fiyatı alınamadı` });
}

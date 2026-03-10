// TAHMİN TAKİP SİSTEMİ
// Analiz anındaki fiyatı kaydeder, 24s/7g/30g sonraki fiyatla karşılaştırır
// Başarı oranı, AI performansı ölçer

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Yeni tahmin kaydı oluştur (analiz anında çağrılır)
    const { analizId, aiId, sembol, yon, hedefPct, stopPct, guven, metin } = req.body;
    if (!analizId || !sembol || !yon) return res.status(400).json({ error: "eksik alan" });

    // Anlık fiyatı çek
    const s = sembol.toUpperCase();
    const denemeler = s.endsWith(".IS") ? [s] : [`${s}.IS`, s];
    let girisFiyat = null, para = "TRY";

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Referer": "https://finance.yahoo.com",
    };

    for (const ys of denemeler) {
      try {
        const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ys)}?interval=1d&range=5d`, { headers, signal: AbortSignal.timeout(5000) });
        if (!r.ok) continue;
        const d = await r.json();
        const closes = (d.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(Boolean);
        if (closes.length) { girisFiyat = parseFloat(closes.at(-1).toFixed(4)); para = d.chart?.result?.[0]?.meta?.currency || "TRY"; break; }
      } catch {}
    }

    const kayit = {
      analizId, aiId, sembol: s, yon, hedefPct, stopPct, guven, metin: metin?.slice(0, 120),
      girisFiyat, para,
      tarih: new Date().toISOString(),
      kontroller: { "24s": null, "7g": null, "30g": null },
    };
    return res.status(200).json({ ok: true, kayit });
  }

  if (req.method === "GET") {
    // Bekleyen tahminleri güncelle — fiyatları çek
    const { sembol } = req.query;
    if (!sembol) return res.status(400).json({ error: "sembol gerekli" });

    const s = sembol.toUpperCase();
    const denemeler = s.endsWith(".IS") ? [s] : [`${s}.IS`, s];
    const headers = { "User-Agent": "Mozilla/5.0", "Accept": "application/json", "Referer": "https://finance.yahoo.com" };

    for (const ys of denemeler) {
      try {
        const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ys)}?interval=1d&range=5d`, { headers, signal: AbortSignal.timeout(5000) });
        if (!r.ok) continue;
        const d = await r.json();
        const closes = (d.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter(Boolean);
        if (closes.length) {
          const fiyat = parseFloat(closes.at(-1).toFixed(4));
          return res.status(200).json({ sembol: s, fiyat, ts: Date.now() });
        }
      } catch {}
    }
    return res.status(404).json({ error: "fiyat alınamadı" });
  }

  res.status(405).end();
}

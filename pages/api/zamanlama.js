// ZAMANLAMA SİNYALİ — haber yayınlanma zamanı ile fiyat hareketi arasındaki pencereyi ölçer
// "Haber piyasa tarafından zaten fiyatlandı mı?"
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { sembol, haberTarihi, haberMetin } = req.body;
  if (!sembol) return res.status(400).json({ error: "sembol gerekli" });

  const s = sembol.toUpperCase();
  const denemeler = s.endsWith(".IS") ? [s] : [`${s}.IS`, s];
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://finance.yahoo.com",
  };

  for (const ys of denemeler) {
    try {
      // 5 günlük saatlik veri — intraday hareket
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ys)}?interval=1h&range=5d`;
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(7000) });
      if (!r.ok) continue;
      const d = await r.json();
      const result = d.chart?.result?.[0];
      if (!result) continue;

      const timestamps = result.timestamp || [];
      const closes = (result.indicators?.quote?.[0]?.close || []).map(v => v ?? null);
      const volumes = (result.indicators?.quote?.[0]?.volume || []).map(v => v ?? 0);

      if (closes.length < 4) continue;

      // Son fiyat ve son 4 saatlik değişim
      const sonFiyat = closes.filter(Boolean).at(-1);
      const dort_saat_once = closes.filter(Boolean).at(-5) || sonFiyat;
      const degisim4s = ((sonFiyat - dort_saat_once) / dort_saat_once) * 100;

      // Ortalama hacim vs son hacim
      const sonHacim = volumes.at(-1) || 0;
      const ortHacim = volumes.slice(-24).filter(v => v > 0).reduce((a, b) => a + b, 0) / Math.max(volumes.slice(-24).filter(v => v > 0).length, 1);
      const hacimOrani = ortHacim > 0 ? sonHacim / ortHacim : 1;

      // Fiyatlanma skoru: büyük hareket + yüksek hacim = haberi fiyatlamış
      const hareket = Math.abs(degisim4s);
      let fiyatlanmaPct = 0;
      if (hareket > 3) fiyatlanmaPct = 90;
      else if (hareket > 2) fiyatlanmaPct = 70;
      else if (hareket > 1) fiyatlanmaPct = 50;
      else if (hareket > 0.5) fiyatlanmaPct = 30;
      else fiyatlanmaPct = 10;

      if (hacimOrani > 2) fiyatlanmaPct = Math.min(95, fiyatlanmaPct + 15);
      if (hacimOrani > 3) fiyatlanmaPct = Math.min(95, fiyatlanmaPct + 10);

      // Pencere tahmini
      let pencere, pencereRenk;
      if (fiyatlanmaPct >= 75) {
        pencere = "KAPALMIŞ — Piyasa haberi büyük ölçüde fiyatladı";
        pencereRenk = "#ff7070";
      } else if (fiyatlanmaPct >= 50) {
        pencere = "DARALMIŞ — Kısmen fiyatlandı, kalan potansiyel azalıyor";
        pencereRenk = "#ffcc44";
      } else if (fiyatlanmaPct >= 25) {
        pencere = "AÇIK — Piyasa haberi henüz tam fiyatlamadı";
        pencereRenk = "#80dd90";
      } else {
        pencere = "GENIŞ AÇIK — Güçlü fırsat penceresi mevcut";
        pencereRenk = "#50dd90";
      }

      return res.status(200).json({
        sembol: s,
        sonFiyat,
        degisim4s: parseFloat(degisim4s.toFixed(2)),
        hacimOrani: parseFloat(hacimOrani.toFixed(2)),
        fiyatlanmaPct,
        pencere,
        pencereRenk,
        para: result.meta?.currency || "TRY",
        ts: Date.now(),
      });
    } catch { continue; }
  }

  return res.status(404).json({ error: `"${s}" için zamanlama verisi alınamadı` });
}

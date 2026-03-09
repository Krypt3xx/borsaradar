// Gerçek zamanlı döviz kurları — birden fazla güvenilir kaynak
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=60");

  const kurlar = {};
  const hatalar = [];

  // ── KAYNAK 1: exchangerate.host (ücretsiz, güvenilir) ──────────────────
  try {
    const r = await fetch(
      "https://api.exchangerate.host/latest?base=USD&symbols=TRY,EUR,GBP,JPY,CHF&source=ecb",
      { signal: AbortSignal.timeout(5000) }
    );
    if (r.ok) {
      const d = await r.json();
      if (d.rates?.TRY > 10) {
        kurlar.USDTRY = parseFloat(d.rates.TRY.toFixed(4));
        kurlar.EURTRY = parseFloat((d.rates.TRY / d.rates.EUR).toFixed(4));
        kurlar.GBPTRY = parseFloat((d.rates.TRY / d.rates.GBP).toFixed(4));
        kurlar.kaynak = "exchangerate.host";
      }
    }
  } catch(e) { hatalar.push(`exchangerate.host: ${e.message}`); }

  // ── KAYNAK 2: open.er-api.com (yedek) ──────────────────────────────────
  if (!kurlar.USDTRY) {
    try {
      const r = await fetch(
        "https://open.er-api.com/v6/latest/USD",
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.rates?.TRY > 10) {
          kurlar.USDTRY = parseFloat(d.rates.TRY.toFixed(4));
          kurlar.EURTRY = parseFloat((d.rates.TRY / d.rates.EUR).toFixed(4));
          kurlar.GBPTRY = parseFloat((d.rates.TRY / d.rates.GBP).toFixed(4));
          kurlar.kaynak = "open.er-api.com";
        }
      }
    } catch(e) { hatalar.push(`open.er-api: ${e.message}`); }
  }

  // ── KAYNAK 3: Fixer.io benzeri Frankfurter (ECB verileri) ──────────────
  if (!kurlar.USDTRY) {
    try {
      const r = await fetch(
        "https://api.frankfurter.app/latest?from=USD&to=TRY,EUR,GBP",
        { signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.rates?.TRY > 10) {
          kurlar.USDTRY = parseFloat(d.rates.TRY.toFixed(4));
          const eurUsd = await fetch("https://api.frankfurter.app/latest?from=EUR&to=TRY", { signal: AbortSignal.timeout(4000) });
          if (eurUsd.ok) { const ed = await eurUsd.json(); kurlar.EURTRY = parseFloat(ed.rates.TRY.toFixed(4)); }
          kurlar.kaynak = "frankfurter.app (ECB)";
        }
      }
    } catch(e) { hatalar.push(`frankfurter: ${e.message}`); }
  }

  // ── ALTIN & PETROL: metalpriceapi / commodities ─────────────────────────
  try {
    const r = await fetch(
      "https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU,XAG",
      { signal: AbortSignal.timeout(4000) }
    );
    if (r.ok) {
      const d = await r.json();
      if (d.rates?.XAU) kurlar.ALTIN = parseFloat((1/d.rates.XAU).toFixed(2));
    }
  } catch {}

  // Altın yoksa Yahoo'dan dene
  if (!kurlar.ALTIN) {
    try {
      const r = await fetch(
        "https://query1.finance.yahoo.com/v8/finance/quote?symbols=GC%3DF,BZ%3DF",
        { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://finance.yahoo.com" }, signal: AbortSignal.timeout(6000) }
      );
      if (r.ok) {
        const d = await r.json();
        const q = d?.quoteResponse?.result || [];
        q.forEach(item => {
          if (item.symbol === "GC=F" && item.regularMarketPrice) kurlar.ALTIN = parseFloat(item.regularMarketPrice.toFixed(2));
          if (item.symbol === "BZ=F" && item.regularMarketPrice) kurlar.BRENT = parseFloat(item.regularMarketPrice.toFixed(2));
        });
      }
    } catch {}
  }

  // TL cinsinden altın hesapla
  if (kurlar.ALTIN && kurlar.USDTRY) {
    kurlar.ALTIN_TL = parseFloat((kurlar.ALTIN * kurlar.USDTRY / 31.1035).toFixed(2)); // gram başına TL
  }

  const zaman = new Date();
  res.status(200).json({
    kurlar,
    guncelleme: zaman.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
    hatalar: hatalar.length ? hatalar : undefined,
  });
}

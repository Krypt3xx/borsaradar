// Ekonomik takvim - önemli merkez bankası ve makro olaylar
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");

  // Sabit + dinamik takvim (investing.com RSS'den çek)
  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent("https://www.investing.com/rss/economic_calendar.rss")}`;
    const r = await fetch(proxy, { signal: AbortSignal.timeout(6000) });
    const json = await r.json();
    const xml = json.contents || "";

    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const items = xml.match(itemRegex) || [];

    const olaylar = items.slice(0, 15).map((item, i) => {
      const getTag = tag => {
        const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i"));
        return (m?.[1] || m?.[2] || "").trim();
      };
      const baslik = getTag("title").replace(/&amp;/g,"&");
      const tarih  = getTag("pubDate");
      const ozet   = getTag("description").replace(/<[^>]+>/g,"").trim().slice(0,100);

      const onem = ["fed","fomc","tcmb","faiz","inflation","cpi","gdp","nfp","payroll","interest rate"].some(k => baslik.toLowerCase().includes(k)) ? "YÜKSEK" : "ORTA";

      return { id: `cal-${i}`, baslik, tarih, ozet, onem };
    }).filter(o => o.baslik);

    if (olaylar.length > 0) {
      return res.status(200).json({ olaylar });
    }
  } catch {}

  // Fallback: Bilinen yaklaşan olaylar
  const simdi = new Date();
  const ay = simdi.getMonth();
  const yil = simdi.getFullYear();

  const sabitOlaylar = [
    { id:"c1", baslik:"Fed FOMC Toplantısı", tarih: new Date(yil, ay, 18).toISOString(), ozet:"Faiz kararı ve basın açıklaması", onem:"YÜKSEK", ulke:"🇺🇸" },
    { id:"c2", baslik:"ABD Enflasyon (CPI)", tarih: new Date(yil, ay, 11).toISOString(), ozet:"Tüketici fiyat endeksi açıklaması", onem:"YÜKSEK", ulke:"🇺🇸" },
    { id:"c3", baslik:"TCMB Para Politikası", tarih: new Date(yil, ay, 20).toISOString(), ozet:"Türkiye Merkez Bankası faiz kararı", onem:"YÜKSEK", ulke:"🇹🇷" },
    { id:"c4", baslik:"ABD Tarım Dışı İstihdam", tarih: new Date(yil, ay+1, 5).toISOString(), ozet:"NFP açıklaması, dolar için kritik", onem:"YÜKSEK", ulke:"🇺🇸" },
    { id:"c5", baslik:"Euro Bölgesi Enflasyon", tarih: new Date(yil, ay, 14).toISOString(), ozet:"ECB politikasını etkiler", onem:"ORTA", ulke:"🇪🇺" },
    { id:"c6", baslik:"Türkiye Enflasyon (TÜFE)", tarih: new Date(yil, ay+1, 3).toISOString(), ozet:"Aylık enflasyon verisi", onem:"YÜKSEK", ulke:"🇹🇷" },
    { id:"c7", baslik:"ABD GDP (Büyüme)", tarih: new Date(yil, ay, 25).toISOString(), ozet:"Q4 büyüme verisi revizyonu", onem:"ORTA", ulke:"🇺🇸" },
    { id:"c8", baslik:"ECB Toplantısı", tarih: new Date(yil, ay+1, 12).toISOString(), ozet:"Avrupa Merkez Bankası faiz kararı", onem:"YÜKSEK", ulke:"🇪🇺" },
  ].sort((a,b) => new Date(a.tarih) - new Date(b.tarih));

  res.status(200).json({ olaylar: sabitOlaylar });
}

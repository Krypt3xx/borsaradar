// pages/api/news.js
// RSS'i tarayıcıdan değil Vercel sunucusundan çeker → CORS sorunu olmaz

const RSS_SOURCES = [
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",        kaynak: "BBC Business" },
  { url: "https://feeds.reuters.com/reuters/businessNews",        kaynak: "Reuters" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", kaynak: "CNBC Markets" },
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",         kaynak: "WSJ Markets" },
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US", kaynak: "Yahoo Finance" },
  { url: "https://www.investing.com/rss/news_25.rss",             kaynak: "Investing.com" },
  { url: "https://feeds.bloomberg.com/markets/news.rss",          kaynak: "Bloomberg" },
  { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", kaynak: "CNBC World" },
];

const KATEGORI_MAP = {
  "JEOPOLİTİK":    ["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","tension","attack","turkey","syria","gaza","savaş","gerilim","tehdit","nuclear","threat"],
  "ENERJİ":        ["oil","crude","gas","opec","energy","pipeline","brent","wti","petrol","doğalgaz","barrel","lng","solar","wind","refinery"],
  "MERKEZ BANKASI":["fed","federal reserve","rate hike","rate cut","interest rate","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb","monetary policy","basis point"],
  "TEKNOLOJİ":     ["nvidia","apple","google","microsoft","amazon","meta","artificial intelligence","ai chip","semiconductor","openai","tsmc","alphabet","tesla","chatgpt"],
  "TÜRKİYE":       ["turkey","turkish","lira","istanbul","ankara","bist","borsa","erdoğan","turkish economy","turkey market"],
  "EMTİA":         ["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","platinum","aluminium","iron ore"],
  "KRİPTO":        ["bitcoin","crypto","ethereum","blockchain","btc","eth","coinbase","defi","digital asset","stablecoin"],
};

const ETKİ_YUKSEK = ["war","attack","crash","crisis","surge","plunge","record","ban","default","collapse","emergency","catastrophe","spike","soar","tumble","halt","freeze"];
const ETKİ_ORTA   = ["rise","fall","gain","loss","cut","hike","deal","meeting","report","data","decision","change","warning","concern"];

function kategoriBul(text) {
  const t = text.toLowerCase();
  for (const [k, words] of Object.entries(KATEGORI_MAP)) {
    if (words.some(w => t.includes(w))) return k;
  }
  return "GENEL";
}

function etkiBul(text) {
  const t = text.toLowerCase();
  if (ETKİ_YUKSEK.some(w => t.includes(w))) return "YÜKSEK";
  if (ETKİ_ORTA.some(w => t.includes(w))) return "ORTA";
  return "DÜŞÜK";
}

function yonBul(text) {
  const t = text.toLowerCase();
  const pos = ["rise","gain","surge","jump","rally","growth","boost","profit","record high","soar","climb"].filter(w => t.includes(w)).length;
  const neg = ["fall","drop","crash","plunge","decline","loss","cut","crisis","default","tumble","slump","warn"].filter(w => t.includes(w)).length;
  return pos > neg ? "POZİTİF" : neg > pos ? "NEGATİF" : "KARISIK";
}

function zamanFmt(dateStr) {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
    if (diff < 60) return `${Math.floor(diff)} dk önce`;
    if (diff < 1440) return `${Math.floor(diff / 60)} sa önce`;
    return `${Math.floor(diff / 1440)} gün önce`;
  } catch {
    return "az önce";
  }
}

function parseRSS(xmlText, kaynak) {
  const haberler = [];
  // item taglerini regex ile çıkar (Node.js'de DOM parser yok)
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const items = xmlText.match(itemRegex) || [];

  items.slice(0, 8).forEach((item, i) => {
    const getTag = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([^<]*)<\/${tag}>`, "i"));
      return (m?.[1] || m?.[2] || "").trim();
    };

    const baslik = getTag("title").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#\d+;/g,"");
    const ozet   = getTag("description").replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").trim().slice(0,200);
    const tarih  = getTag("pubDate") || getTag("dc:date") || "";

    if (baslik && baslik.length > 10) {
      haberler.push({
        id: `${kaynak}-${i}`,
        baslik,
        ozet,
        kaynak,
        tarih,
        zaman:    zamanFmt(tarih),
        kategori: kategoriBul(baslik + " " + ozet),
        etki:     etkiBul(baslik + " " + ozet),
        yon:      yonBul(baslik + " " + ozet),
      });
    }
  });

  return haberler;
}

export default async function handler(req, res) {
  // Cache: 5 dk
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async ({ url, kaynak }) => {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BorsaRadar/1.0; +https://borsaradar.app)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      return parseRSS(xml, kaynak);
    })
  );

  const tumHaberler = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value);

  // Tarihe göre sırala
  tumHaberler.sort((a, b) => {
    try { return new Date(b.tarih) - new Date(a.tarih); } catch { return 0; }
  });

  const unique = [];
  const basliklar = new Set();
  for (const h of tumHaberler) {
    const key = h.baslik.slice(0, 40).toLowerCase();
    if (!basliklar.has(key)) {
      basliklar.add(key);
      unique.push(h);
    }
  }

  res.status(200).json({
    haberler: unique.slice(0, 50),
    kaynak_sayisi: results.filter(r => r.status === "fulfilled").length,
    toplam_kaynak: RSS_SOURCES.length,
    guncelleme: new Date().toISOString(),
  });
}

const RSS_SOURCES = [
  // Global
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml",         kaynak: "BBC Business",    dil:"en" },
  { url: "https://feeds.reuters.com/reuters/businessNews",         kaynak: "Reuters",          dil:"en" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",  kaynak: "CNBC Markets",     dil:"en" },
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",          kaynak: "WSJ Markets",      dil:"en" },
  // Türkiye - Ekonomi
  { url: "https://www.bloomberght.com/rss",                        kaynak: "Bloomberg HT",     dil:"tr" },
  { url: "https://www.dunya.com/rss",                              kaynak: "Dünya Gazetesi",   dil:"tr" },
  { url: "https://www.ekonomim.com/rss",                           kaynak: "Ekonomim",         dil:"tr" },
  { url: "https://feeds.haberler.com/ekonomi",                     kaynak: "Haberler Ekonomi", dil:"tr" },
  { url: "https://www.paraanaliz.com/feed/",                       kaynak: "Para Analiz",      dil:"tr" },
  // Türkiye - Genel/Siyaset
  { url: "https://www.hurriyet.com.tr/rss/ekonomi",                kaynak: "Hürriyet Ekonomi", dil:"tr" },
  { url: "https://www.milliyet.com.tr/rss/rssNew/ekonomiRss.xml",  kaynak: "Milliyet Ekonomi", dil:"tr" },
  { url: "https://www.sabah.com.tr/rss/ekonomi.xml",               kaynak: "Sabah Ekonomi",    dil:"tr" },
  { url: "https://www.ntv.com.tr/ekonomi.rss",                     kaynak: "NTV Ekonomi",      dil:"tr" },
  { url: "https://www.aa.com.tr/tr/rss/default?cat=ekonomi",       kaynak: "AA Ekonomi",       dil:"tr" },
];

const KATEGORI_MAP = {
  "JEOPOLİTİK":    ["war","iran","russia","ukraine","israel","nato","military","conflict","sanction","crisis","tension","attack","turkey","syria","gaza","savaş","gerilim","tehdit","nuclear","suriye","irak","çatışma","kriz"],
  "ENERJİ":        ["oil","crude","gas","opec","energy","pipeline","brent","wti","petrol","doğalgaz","barrel","lng","solar","wind","enerji","yakıt","elektrik"],
  "MERKEZ BANKASI":["fed","federal reserve","rate","interest","inflation","ecb","central bank","faiz","enflasyon","powell","lagarde","tcmb","merkez bankası","para politikası","politika faizi","ppk"],
  "TEKNOLOJİ":     ["nvidia","apple","google","microsoft","amazon","meta","ai","chip","semiconductor","openai","tsmc","tesla","yapay zeka","teknoloji","yazılım","chip"],
  "TÜRKİYE":       ["turkey","turkish","lira","istanbul","ankara","bist","borsa","erdoğan","turkish economy","cumhurbaşkanı","hükümet","meclis","akp","chp","dolar","kur","tüfe","enflasyon","türkiye","hazine","bütçe","özel sektör"],
  "SİYASET":       ["seçim","muhalefet","iktidar","parti","koalisyon","meclis","milletvekili","bakanlık","cumhurbaşkanı","başbakan","hükümet","anayasa","yasa","kanun","karar"],
  "EMTİA":         ["gold","silver","copper","wheat","corn","commodity","altın","gümüş","bakır","buğday","platinum","emtia","demir","çelik","alüminyum"],
  "KRİPTO":        ["bitcoin","crypto","ethereum","blockchain","btc","eth","kripto","coinbase","kripto para","dijital varlık"],
  "PİYASA":        ["borsa","hisse","endeks","bist","rally","düşüş","yükseliş","kapanış","açılış","işlem hacmi","piyasa"],
};

const ETKİ_YUKSEK = ["war","attack","crash","crisis","surge","plunge","record","ban","default","collapse","emergency","spike","soar","tumble","çöküş","rekor","kriz","savaş","alarm","acil","kritik","tarihi"];
const ETKİ_ORTA   = ["rise","fall","gain","loss","cut","hike","deal","meeting","report","data","decision","yükseldi","düştü","arttı","azaldı","karar","toplantı","açıkladı","duyurdu"];

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
  const p = ["rise","gain","surge","jump","rally","growth","boost","profit","soar","yüksel","arttı","rekor","kazanç","büyüme"].filter(w=>t.includes(w)).length;
  const n = ["fall","drop","crash","plunge","decline","loss","crisis","default","tumble","düş","geriledi","kayıp","kriz","daralma"].filter(w=>t.includes(w)).length;
  return p>n?"POZİTİF":n>p?"NEGATİF":"KARISIK";
}
function zamanFmt(dateStr) {
  try {
    const diff = (Date.now()-new Date(dateStr).getTime())/60000;
    if(diff<60) return `${Math.floor(diff)} dk önce`;
    if(diff<1440) return `${Math.floor(diff/60)} sa önce`;
    return `${Math.floor(diff/1440)} gün önce`;
  } catch { return "az önce"; }
}

function parseRSS(xmlText, kaynak, dil) {
  const haberler = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const items = xmlText.match(itemRegex) || [];

  items.slice(0, 8).forEach((item, i) => {
    const getTag = (tag) => {
      const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return (m?.[1] || m?.[2] || "").replace(/<[^>]+>/g,"").trim();
    };
    const baslik = getTag("title").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#\d+;/g,"").replace(/&quot;/g,'"').trim();
    const ozet   = getTag("description").replace(/&amp;/g,"&").trim().slice(0,200);
    const tarih  = getTag("pubDate") || getTag("dc:date") || "";

    if (baslik && baslik.length > 8) {
      haberler.push({
        id: `${kaynak}-${i}`,
        baslik, ozet, kaynak, dil, tarih,
        zaman:    zamanFmt(tarih),
        kategori: kategoriBul(baslik+" "+ozet),
        etki:     etkiBul(baslik+" "+ozet),
        yon:      yonBul(baslik+" "+ozet),
      });
    }
  });
  return haberler;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async ({ url, kaynak, dil }) => {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BorsaRadar/1.0)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const xml = await r.text();
      return parseRSS(xml, kaynak, dil);
    })
  );

  const tumHaberler = results
    .filter(r => r.status==="fulfilled")
    .flatMap(r => r.value);

  tumHaberler.sort((a,b) => {
    try { return new Date(b.tarih)-new Date(a.tarih); } catch { return 0; }
  });

  // Duplicate temizle
  const unique = [];
  const basliklar = new Set();
  for (const h of tumHaberler) {
    const key = h.baslik.slice(0,40).toLowerCase().replace(/\s+/g,"");
    if (!basliklar.has(key)) { basliklar.add(key); unique.push(h); }
  }

  const basarili = results.filter(r=>r.status==="fulfilled").length;
  res.status(200).json({
    haberler: unique.slice(0, 60),
    kaynak_sayisi: basarili,
    toplam_kaynak: RSS_SOURCES.length,
    guncelleme: new Date().toISOString(),
  });
}

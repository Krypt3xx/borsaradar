// /api/tarama.js — BIST Tarama Otomasyonu v2
// Düzeltmeler: filtreler opsiyonel, P/K null hisseyi elemez, varsayılanlar gevşetildi
export const config = { maxDuration: 60 };

const BIST = [
  "TUPRS","THYAO","EREGL","ASELS","GARAN","AKBNK","YKBNK","BIMAS","SISE","KCHOL",
  "TCELL","PETKM","FROTO","TOASO","OYAKC","PGSUS","TAVHL","EKGYO","ISCTR","TTKOM",
  "SAHOL","KOZAL","MGROS","ULKER","ARCLK","CCOLA","KRDMD","VESTL","LOGO","ENJSA",
  "AGHOL","AKSEN","ALKIM","ANACM","ASTOR","AVOD","AYEN","BIZIM","BOSSA","BRSAN",
  "BTCIM","BUCIM","BURCE","CIMSA","CLEBI","COKAS","DOHOL","ECILC","EDIP","EGEEN",
  "ENKAI","ERBOS","ETILR","FENER","GSDHO","GUBRF","HALKB","HATEK","HEKTS","HLGYO",
  "IEYHO","IHEVA","IHLAS","INDES","INFO","ISDMR","ISFIN","ISGSY","ISGYO","ISMEN",
  "JANTS","KAPLM","KAREL","KARSN","KATMR","KENT","KERVT","KLKIM","KLMSN","KNFRT",
  "KONYA","KOPOL","KORDS","KOZAA","KRONT","KRSAN","KRSTL","KRVGD","KUTPO","KUYAS",
  "LIDER","LUKSK","MAGEN","MAKIM","MANAS","MARTI","MAVI","MEDTR","MERIT","MERKO",
  "METRO","MIATK","MIPAZ","MKISM","MNDRS","MOBTL","MPARK","MRSHL","MSGYO","NATEN",
  "NETAS","NIBAS","NTHOL","NTTUR","NUGYO","NUHCM","OBASE","ODAS","ONCSM","ORGE",
  "ORMA","OTKAR","OYLUM","PAGYO","PAPIL","PARSN","PETUN","PINSU","PKENT","POLHO",
  "POLTK","PRKAB","PRKME","PRZMA","QNBFB","QNBFL","RALYH","RAYSG","RBURG","RUBNS",
  "RYGYO","RYSAS","SAFKR","SANEL","SANFM","SANKO","SARKY","SASA","SAYAS","SEKUR",
  "SELEC","SELGD","SELVA","SILVR","SKBNK","SKTAS","SMART","SNGYO","SOKM","SONME",
  "SUWEN","TATGD","TATEN","TBORG","TDGYO","TEKTU","TGSAS","TKFEN","TKNSA","TMPOL",
  "TMSN","TRPCS","TSGYO","TSKB","TTRAK","TUKAS","TUREX","TURGG","ULUUN","VAKBN",
  "VAKKO","VANGD","VERTU","VESBE","VESTL","YAPRK","YATAS","YAYLA","YBTAS","YUNSA",
  "YYAPI","ZEDUR","ZOREN","ZRGYO","DARDL","DENGE","DITAS","DPSAS","DURDO","DYOBY",
];

const HDR = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com",
};

function rsiHesapla(prices) {
  var period = 14;
  if (!prices || prices.length < period + 1) return null;
  var gains = 0, losses = 0;
  for (var i = 1; i <= period; i++) {
    var diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  var avgGain = gains / period, avgLoss = losses / period;
  for (var j = period + 1; j < prices.length; j++) {
    var d2 = prices[j] - prices[j - 1];
    avgGain = (avgGain * (period - 1) + (d2 > 0 ? d2 : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d2 < 0 ? -d2 : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  var rsi = 100 - (100 / (1 + avgGain / avgLoss));
  return Math.round(rsi * 10) / 10;
}

async function hisseVeriCek(sembol) {
  var yahooSembol = sembol + ".IS";
  var bitis = Math.floor(Date.now() / 1000);
  var baslangic = bitis - 370 * 24 * 3600;
  var url = "https://query2.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(yahooSembol)
    + "?interval=1d&period1=" + baslangic + "&period2=" + bitis + "&includePrePost=false";
  try {
    var r = await fetch(url, { headers: HDR, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    var data = await r.json();
    var chart = data.chart && data.chart.result && data.chart.result[0];
    if (!chart) return null;
    var q = (chart.indicators && chart.indicators.quote && chart.indicators.quote[0]) || {};
    var rawClose = q.close || [];
    var rawVolume = q.volume || [];

    // Null'ları filtrele ama pozisyon bilgisini koru
    var kapanislar = rawClose.filter(function(v) { return v != null && v > 0; });
    var hacimler = rawVolume.map(function(v) { return v != null ? v : 0; });

    if (kapanislar.length < 20) return null;

    var sonFiyat = kapanislar[kapanislar.length - 1];
    var oncekiFiyat = kapanislar[kapanislar.length - 2] || sonFiyat;
    var gunlukDegisim = oncekiFiyat > 0 ? ((sonFiyat - oncekiFiyat) / oncekiFiyat * 100) : 0;

    // RSI — son 30 kapanış yeterli
    var rsi = rsiHesapla(kapanislar.slice(-30));

    // Hacim spike — son gün / önceki 20 günün ortalaması
    var gecenHacimler = hacimler.slice(-21, -1).filter(function(v) { return v > 0; });
    var hacimOrt20 = gecenHacimler.length > 0
      ? gecenHacimler.reduce(function(a, b) { return a + b; }, 0) / gecenHacimler.length
      : 0;
    var sonHacim = hacimler[hacimler.length - 1] || 0;
    var hacimSpike = hacimOrt20 > 0 ? sonHacim / hacimOrt20 : 0;

    // 52 Hafta dip/zirve (son 252 işlem günü — yaklaşık 1 yıl)
    var yillikFiyatlar = kapanislar.slice(-252);
    var max52h = Math.max.apply(null, yillikFiyatlar);
    var min52h = Math.min.apply(null, yillikFiyatlar);
    // Dipten ne kadar % yukarda? (+0 = tam dipte, +50 = dipten %50 yukarda)
    var uzaklikDip = min52h > 0 ? ((sonFiyat - min52h) / min52h * 100) : 0;
    // Zirveden ne kadar % aşağıda? (-0 = tam zirvede, -50 = zirveden %50 aşağıda)
    var uzaklikZirve = max52h > 0 ? ((sonFiyat - max52h) / max52h * 100) : 0;

    // P/K — ayrı istek, hata olursa null döner (hisseyi ELEMEYİZ)
    var pk = null;
    try {
      var metaUrl = "https://query2.finance.yahoo.com/v10/finance/quoteSummary/"
        + encodeURIComponent(yahooSembol) + "?modules=summaryDetail";
      var mr = await fetch(metaUrl, { headers: HDR, signal: AbortSignal.timeout(6000) });
      if (mr.ok) {
        var md = await mr.json();
        var sumDetail = md.quoteSummary
          && md.quoteSummary.result
          && md.quoteSummary.result[0]
          && md.quoteSummary.result[0].summaryDetail;
        var rawPK = sumDetail && sumDetail.trailingPE && sumDetail.trailingPE.raw;
        if (rawPK && rawPK > 0 && rawPK < 1000) {
          pk = Math.round(rawPK * 10) / 10;
        }
      }
    } catch (e2) { /* P/K alınamazsa null kalır, hisse elenmez */ }

    return {
      sembol: sembol,
      fiyat: Math.round(sonFiyat * 100) / 100,
      gunlukDegisim: Math.round(gunlukDegisim * 100) / 100,
      rsi: rsi,
      hacimSpike: Math.round(hacimSpike * 100) / 100,
      sonHacim: sonHacim,
      hacimOrt20: Math.round(hacimOrt20),
      max52h: Math.round(max52h * 100) / 100,
      min52h: Math.round(min52h * 100) / 100,
      uzaklikZirve: Math.round(uzaklikZirve * 100) / 100,
      uzaklikDip: Math.round(uzaklikDip * 100) / 100,
      pk: pk,
    };
  } catch (e) {
    return null;
  }
}

async function batchIsle(liste, batchSize) {
  var bs = batchSize || 8;
  var sonuclar = [];
  for (var i = 0; i < liste.length; i += bs) {
    var batch = liste.slice(i, i + bs);
    var results = await Promise.allSettled(batch.map(function(s) { return hisseVeriCek(s); }));
    for (var j = 0; j < results.length; j++) {
      if (results[j].status === "fulfilled" && results[j].value) {
        sonuclar.push(results[j].value);
      }
    }
    if (i + bs < liste.length) {
      await new Promise(function(res) { setTimeout(res, 300); });
    }
  }
  return sonuclar;
}

export default async function handler(req, res) {
  // Cache yok — her tarama taze veri çeksin
  res.setHeader("Cache-Control", "no-store");

  var body = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch (e) {}
  } else {
    body = req.query;
  }

  // Varsayılanlar — tek başına anlamlı sonuç verecek kadar geniş
  var liste      = body.liste      || "bist100";
  var rsiMod     = body.rsiMod     || "hepsi";      // default: RSI filtresi kapalı
  var rsiMax     = body.rsiMax     !== undefined ? parseFloat(body.rsiMax)     : null; // null = filtre yok
  var rsiMin     = body.rsiMin     !== undefined ? parseFloat(body.rsiMin)     : null;
  var hacimMin   = body.hacimMin   !== undefined ? parseFloat(body.hacimMin)   : null; // null = filtre yok
  var dip52hMax  = body.dip52hMax  !== undefined ? parseFloat(body.dip52hMax)  : null; // null = filtre yok
  var pkMax      = body.pkMax      !== undefined ? parseFloat(body.pkMax)      : null; // null = filtre yok
  var sirala     = body.sirala     || "rsi";
  var azalan     = body.azalan === true || body.azalan === "true";
  var limit      = parseInt(body.limit) || 60;

  // rsiMod kısayolları
  if (rsiMod === "asiri_satim") { rsiMax = 35; }
  else if (rsiMod === "asiri_alim") { rsiMin = 65; }

  var secilenListe = liste === "bist50" ? BIST.slice(0, 50)
    : liste === "tumBist" ? BIST
    : BIST.slice(0, 100);

  try {
    var tumVeri = await batchIsle(secilenListe, 8);

    var sonuclar = tumVeri.filter(function(h) {
      // RSI — sadece aktifse uygula
      if (rsiMax !== null && h.rsi !== null && h.rsi > rsiMax) return false;
      if (rsiMin !== null && h.rsi !== null && h.rsi < rsiMin) return false;

      // Hacim spike — sadece aktifse uygula
      if (hacimMin !== null && h.hacimSpike < hacimMin) return false;

      // 52H dip — sadece aktifse uygula
      if (dip52hMax !== null && h.uzaklikDip > dip52hMax) return false;

      // P/K — SADECE değer varsa ve limit aşılıyorsa ele; null ise geçir
      if (pkMax !== null && h.pk !== null && h.pk > pkMax) return false;

      return true;
    });

    // Sıralama
    var siralaKey = sirala === "hacimSpike" ? "hacimSpike"
      : sirala === "uzaklikDip" ? "uzaklikDip"
      : sirala === "pk" ? "pk"
      : sirala === "gunlukDegisim" ? "gunlukDegisim"
      : "rsi";

    sonuclar.sort(function(a, b) {
      var av = a[siralaKey], bv = b[siralaKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;   // null'lar sona
      if (bv === null) return -1;
      return azalan ? bv - av : av - bv;
    });

    sonuclar = sonuclar.slice(0, limit);

    res.json({
      ok: true,
      tarandiSayi: secilenListe.length,
      veriAlinanSayi: tumVeri.length,
      filtrelenenSayi: sonuclar.length,
      aktifFiltreler: {
        rsi: rsiMax !== null ? ("≤" + rsiMax) : rsiMin !== null ? ("≥" + rsiMin) : "kapalı",
        hacim: hacimMin !== null ? ("≥" + hacimMin + "x") : "kapalı",
        dip52h: dip52hMax !== null ? ("≤%" + dip52hMax + " dipten") : "kapalı",
        pk: pkMax !== null ? ("≤" + pkMax) : "kapalı",
      },
      zaman: new Date().toISOString(),
      sonuclar: sonuclar,
    });
  } catch (e) {
    res.status(500).json({ ok: false, hata: e.message });
  }
}

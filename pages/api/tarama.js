// /api/tarama.js — BIST Tarama Otomasyonu v1
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
  "LIDER","LOGO","LUKSK","MAGEN","MAKIM","MANAS","MARTI","MAVI","MEDTR","MERIT",
  "MERKO","METRO","MIATK","MIPAZ","MKISM","MNDRS","MOBTL","MPARK","MRSHL","MSGYO",
  "NATEN","NETAS","NIBAS","NTHOL","NTTUR","NUGYO","NUHCM","OBASE","ODAS","ONCSM",
  "ORGE","ORMA","OTKAR","OYLUM","PAGYO","PAMEL","PAPIL","PARSN","PETUN","PINSU",
  "PKENT","POLHO","POLTK","PRKAB","PRKME","PRZMA","QNBFB","QNBFL","RALYH","RAYSG",
  "RBURG","RUBNS","RYGYO","RYSAS","SAFKR","SANEL","SANFM","SANKO","SARKY","SASA",
  "SAYAS","SEKUR","SELEC","SELGD","SELVA","SILVR","SKBNK","SKTAS","SMART","SNGYO",
  "SOKM","SONME","SUWEN","TATGD","TATEN","TBORG","TDGYO","TEKTU","TGSAS","TKFEN",
  "TKNSA","TMPOL","TMSN","TRPCS","TSGYO","TSKB","TTRAK","TUKAS","TUREX","TURGG",
  "ULUUN","ULVAC","VAKBN","VAKKO","VANGD","VERTU","VESBE","VESTL","YAPRK","YATAS",
  "YAYLA","YBTAS","YUNSA","YYAPI","ZEDUR","ZOREN","ZRGYO","DARDL","DENGE","DITAS",
  "DPSAS","DURDO","DYOBY","DZGYO","EGPRO","EKSUN","EMKEL","EMNIS","ENPLU","ESCAR",
];

const HDR = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com",
};

function rsiHesapla(prices, period) {
  var p = period || 14;
  if (prices.length < p + 1) return null;
  var gains = 0, losses = 0;
  for (var i = 1; i <= p; i++) {
    var diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  var avgGain = gains / p, avgLoss = losses / p;
  for (var j = p + 1; j < prices.length; j++) {
    var d2 = prices[j] - prices[j - 1];
    avgGain = (avgGain * (p - 1) + (d2 > 0 ? d2 : 0)) / p;
    avgLoss = (avgLoss * (p - 1) + (d2 < 0 ? -d2 : 0)) / p;
  }
  if (avgLoss === 0) return 100;
  return Math.round(100 - (100 / (1 + avgGain / avgLoss)));
}

async function hisseVeriCek(sembol) {
  var yahooSembol = sembol + ".IS";
  var bitis = Math.floor(Date.now() / 1000);
  var baslangic = bitis - 365 * 24 * 3600;
  var url = "https://query2.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(yahooSembol) + "?interval=1d&period1=" + baslangic + "&period2=" + bitis + "&includePrePost=false";
  try {
    var r = await fetch(url, { headers: HDR, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return null;
    var data = await r.json();
    var chart = data.chart && data.chart.result && data.chart.result[0];
    if (!chart) return null;
    var q = (chart.indicators && chart.indicators.quote && chart.indicators.quote[0]) || {};
    var kapanislar = (q.close || []).filter(function(v) { return v != null && v > 0; });
    var hacimler = (q.volume || []).filter(function(v) { return v != null; });
    if (kapanislar.length < 30) return null;
    var sonFiyat = kapanislar[kapanislar.length - 1];
    var oncekiFiyat = kapanislar[kapanislar.length - 2] || sonFiyat;
    var gunlukDegisim = oncekiFiyat > 0 ? ((sonFiyat - oncekiFiyat) / oncekiFiyat * 100) : 0;
    var rsi = rsiHesapla(kapanislar.slice(-30));
    var hacimSlice = hacimler.slice(-21, -1);
    var hacimOrt20 = hacimSlice.length > 0 ? hacimSlice.reduce(function(a,b){return a+b;},0)/hacimSlice.length : 0;
    var sonHacim = hacimler[hacimler.length - 1] || 0;
    var hacimSpike = hacimOrt20 > 0 ? sonHacim / hacimOrt20 : 1;
    var yillikFiyatlar = kapanislar.slice(-252);
    var max52h = Math.max.apply(null, yillikFiyatlar);
    var min52h = Math.min.apply(null, yillikFiyatlar);
    var uzaklikZirve = max52h > 0 ? ((sonFiyat - max52h) / max52h * 100) : 0;
    var uzaklikDip = min52h > 0 ? ((sonFiyat - min52h) / min52h * 100) : 0;
    // P/K — quoteSummary
    var pk = null;
    try {
      var mr = await fetch("https://query2.finance.yahoo.com/v10/finance/quoteSummary/" + encodeURIComponent(yahooSembol) + "?modules=summaryDetail", { headers: HDR, signal: AbortSignal.timeout(5000) });
      if (mr.ok) {
        var md = await mr.json();
        var summary = md.quoteSummary && md.quoteSummary.result && md.quoteSummary.result[0] && md.quoteSummary.result[0].summaryDetail;
        if (summary && summary.trailingPE && summary.trailingPE.raw && summary.trailingPE.raw > 0) {
          pk = parseFloat(summary.trailingPE.raw.toFixed(2));
        }
      }
    } catch(e2) {}
    return {
      sembol: sembol,
      yahooSembol: yahooSembol,
      fiyat: parseFloat(sonFiyat.toFixed(2)),
      gunlukDegisim: parseFloat(gunlukDegisim.toFixed(2)),
      rsi: rsi,
      hacimSpike: parseFloat(hacimSpike.toFixed(2)),
      sonHacim: sonHacim,
      hacimOrt20: Math.round(hacimOrt20),
      max52h: parseFloat(max52h.toFixed(2)),
      min52h: parseFloat(min52h.toFixed(2)),
      uzaklikZirve: parseFloat(uzaklikZirve.toFixed(2)),
      uzaklikDip: parseFloat(uzaklikDip.toFixed(2)),
      pk: pk,
    };
  } catch(e) {
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
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=300");
  var body = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch(e) {}
  } else {
    body = req.query;
  }
  var liste = body.liste || "bist100";
  var rsiMod = body.rsiMod || "asiri_satim";
  var hacimMin = parseFloat(body.hacimMin) || 1.5;
  var dip52hMax = body.dip52hMax !== undefined ? parseFloat(body.dip52hMax) : 20;
  var pkMax = body.pkMax !== undefined ? parseFloat(body.pkMax) : 25;
  var sirala = body.sirala || "rsi";
  var azalan = body.azalan === true || body.azalan === "true";
  var limit = parseInt(body.limit) || 50;

  var secilenListe = liste === "bist50" ? BIST.slice(0,50)
    : liste === "tumBist" ? BIST
    : BIST.slice(0,100); // bist100 default

  try {
    var tumVeri = await batchIsle(secilenListe, 8);

    var sonuclar = tumVeri.filter(function(h) {
      if (rsiMod === "asiri_satim" && h.rsi !== null && h.rsi > 35) return false;
      if (rsiMod === "asiri_alim" && h.rsi !== null && h.rsi < 65) return false;
      if (hacimMin && h.hacimSpike < hacimMin) return false;
      if (dip52hMax !== null && h.uzaklikDip > dip52hMax) return false;
      if (pkMax !== null && h.pk !== null && h.pk > pkMax) return false;
      return true;
    });

    sonuclar.sort(function(a, b) {
      var av = a[sirala], bv = b[sirala];
      if (av === null) av = azalan ? -Infinity : Infinity;
      if (bv === null) bv = azalan ? -Infinity : Infinity;
      return azalan ? bv - av : av - bv;
    });

    sonuclar = sonuclar.slice(0, limit);

    res.json({
      ok: true,
      tarandiSayi: secilenListe.length,
      veriAlinanSayi: tumVeri.length,
      filtrelenenSayi: sonuclar.length,
      zaman: new Date().toISOString(),
      sonuclar: sonuclar,
    });
  } catch(e) {
    res.status(500).json({ ok: false, hata: e.message });
  }
}

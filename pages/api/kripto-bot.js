// /api/kripto-bot.js — Kripto Bot Karar Motoru
// Teknik + Sentiment + Momentum + Hacim + ICT sinyalleri
// POST /api/kripto-bot → karar üretir, durumu günceller
// GET  /api/kripto-bot → mevcut durumu döner

export const config = { maxDuration: 60 };

// ─── SABITLER ────────────────────────────────────────────────────────────────
var BASLANGIC_BAKIYE = 1000;   // USDT
var STOP_LOSS_PCT    = 0.08;   // %8
var TAKE_PROFIT_PCT  = 0.15;   // %15
var MAX_POZISYON_PCT = 0.30;   // bakiyenin max %30'u tek işlemde
var MIN_SINYAL_SKOR  = 55;     // 0-100, bu skorun üzerinde işlem aç
var PARITELER = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"];

// ─── IN-MEMORY DEPO (Vercel stateless — her cold start sıfırlar)
// Kalıcı depo için: Vercel KV veya external DB kullanın
// Geçici çözüm: global variable (warm instance'lar arası paylaşılır)
var BOT_DURUM = global.__botDurum || null;

function botDurumBas() {
  return {
    baslangicBakiye: BASLANGIC_BAKIYE,
    nakit: BASLANGIC_BAKIYE,
    pozisyonlar: {},   // { BTCUSDT: { adet, girisUSDT, girisFiyat, acilisZamani, stopLoss, takeProfit } }
    islemler: [],      // tüm işlem geçmişi
    kararlar: [],      // bot karar log'u
    baslamaTarihi: new Date().toISOString(),
    sonGuncelleme: new Date().toISOString(),
  };
}

function getDurum() {
  if (!global.__botDurum) {
    global.__botDurum = botDurumBas();
  }
  return global.__botDurum;
}

// ─── TEKNİK PUANLAMA ─────────────────────────────────────────────────────────
function teknikPuanla(t) {
  var puan = 50; // nötr başlangıç
  var sinyaller = [];

  // RSI 1H
  if (t.rsi1h !== null) {
    if (t.rsi1h < 25)      { puan += 20; sinyaller.push({tip:"AL",guc:20,aciklama:"RSI 1H aşırı satım ("+t.rsi1h+")"}); }
    else if (t.rsi1h < 35) { puan += 12; sinyaller.push({tip:"AL",guc:12,aciklama:"RSI 1H satım bölgesi ("+t.rsi1h+")"}); }
    else if (t.rsi1h > 75) { puan -= 20; sinyaller.push({tip:"SAT",guc:20,aciklama:"RSI 1H aşırı alım ("+t.rsi1h+")"}); }
    else if (t.rsi1h > 65) { puan -= 12; sinyaller.push({tip:"SAT",guc:12,aciklama:"RSI 1H alım bölgesi ("+t.rsi1h+")"}); }
  }

  // RSI 4H (trend konfirm)
  if (t.rsi4h !== null) {
    if (t.rsi4h < 40)      { puan += 8;  sinyaller.push({tip:"AL",guc:8,aciklama:"RSI 4H düşük ("+t.rsi4h+")"}); }
    else if (t.rsi4h > 60) { puan -= 8;  sinyaller.push({tip:"SAT",guc:8,aciklama:"RSI 4H yüksek ("+t.rsi4h+")"}); }
  }

  // MACD 1H
  if (t.macd1h) {
    if (t.macd1h.histogram > 0 && t.macd1h.macd > t.macd1h.signal) {
      puan += 10; sinyaller.push({tip:"AL",guc:10,aciklama:"MACD 1H bullish histogram"});
    } else if (t.macd1h.histogram < 0 && t.macd1h.macd < t.macd1h.signal) {
      puan -= 10; sinyaller.push({tip:"SAT",guc:10,aciklama:"MACD 1H bearish histogram"});
    }
  }

  // Bollinger Bands
  if (t.bb1h) {
    if (t.bb1h.pctB < 0.1)       { puan += 15; sinyaller.push({tip:"AL",guc:15,aciklama:"BB alt banda değdi (%B="+t.bb1h.pctB+")"}); }
    else if (t.bb1h.pctB < 0.25) { puan += 7;  sinyaller.push({tip:"AL",guc:7,aciklama:"BB alt bant yakını"}); }
    else if (t.bb1h.pctB > 0.9)  { puan -= 15; sinyaller.push({tip:"SAT",guc:15,aciklama:"BB üst banda değdi (%B="+t.bb1h.pctB+")"}); }
    else if (t.bb1h.pctB > 0.75) { puan -= 7;  sinyaller.push({tip:"SAT",guc:7,aciklama:"BB üst bant yakını"}); }
  }

  // EMA trendi
  if (t.ema20 && t.ema50 && t.fiyat) {
    if (t.fiyat > t.ema20 && t.ema20 > t.ema50) {
      puan += 8; sinyaller.push({tip:"AL",guc:8,aciklama:"EMA20 > EMA50 üst trend"});
    } else if (t.fiyat < t.ema20 && t.ema20 < t.ema50) {
      puan -= 8; sinyaller.push({tip:"SAT",guc:8,aciklama:"EMA20 < EMA50 alt trend"});
    }
  }

  // EMA200 (uzun vadeli trend)
  if (t.ema200 && t.fiyat) {
    if (t.fiyat > t.ema200) { puan += 5; sinyaller.push({tip:"AL",guc:5,aciklama:"Fiyat EMA200 üstünde"}); }
    else                    { puan -= 5; sinyaller.push({tip:"SAT",guc:5,aciklama:"Fiyat EMA200 altında"}); }
  }

  // Hacim
  if (t.hacim) {
    if (t.hacim.spike >= 2 && t.deg24h > 0)  { puan += 10; sinyaller.push({tip:"AL",guc:10,aciklama:"Hacim spike "+t.hacim.spike+"× + pozitif fiyat"}); }
    if (t.hacim.spike >= 2 && t.deg24h < 0)  { puan -= 10; sinyaller.push({tip:"SAT",guc:10,aciklama:"Hacim spike "+t.hacim.spike+"× + negatif fiyat"}); }
    if (t.hacim.artis && t.deg24h > 0)       { puan += 5;  sinyaller.push({tip:"AL",guc:5,aciklama:"Hacim trendde artıyor"}); }
  }

  // Momentum
  if (t.mom) {
    if (t.mom.mom5 > 3)       { puan += 8;  sinyaller.push({tip:"AL",guc:8,aciklama:"5 bar momentum güçlü (+"+t.mom.mom5+"%)"}); }
    else if (t.mom.mom5 < -3) { puan -= 8;  sinyaller.push({tip:"SAT",guc:8,aciklama:"5 bar momentum zayıf ("+t.mom.mom5+"%)"}); }
    if (t.mom.mom14 > 8)      { puan += 5;  sinyaller.push({tip:"AL",guc:5,aciklama:"14 bar momentum (+"+t.mom.mom14+"%)"}); }
    else if (t.mom.mom14 < -8){ puan -= 5;  sinyaller.push({tip:"SAT",guc:5,aciklama:"14 bar momentum ("+t.mom.mom14+"%)"}); }
  }

  // ICT: FVG
  if (t.fvg) {
    if (t.fvg.icinde && t.fvg.tip === "BULLISH") { puan += 12; sinyaller.push({tip:"AL",guc:12,aciklama:"ICT Bullish FVG içinde"}); }
    if (t.fvg.icinde && t.fvg.tip === "BEARISH") { puan -= 12; sinyaller.push({tip:"SAT",guc:12,aciklama:"ICT Bearish FVG içinde"}); }
  }

  // ICT: Order Block
  if (t.ob) {
    if (t.ob.tip === "BULLISH_OB") { puan += 10; sinyaller.push({tip:"AL",guc:10,aciklama:"ICT Bullish Order Block bölgesi"}); }
    if (t.ob.tip === "BEARISH_OB") { puan -= 10; sinyaller.push({tip:"SAT",guc:10,aciklama:"ICT Bearish Order Block bölgesi"}); }
  }

  puan = Math.max(0, Math.min(100, puan));
  return { puan, sinyaller };
}

// ─── AI KARAR ─────────────────────────────────────────────────────────────────
async function aiKarar(sembol, teknik, sentiment) {
  var prompt = sembol + " kripto paritesi için işlem kararı ver.\n\n"
    + "TEKNIK VERILER:\n"
    + "Fiyat: $" + teknik.fiyat + " | 24H Değişim: " + teknik.deg24h + "%\n"
    + "RSI 1H: " + teknik.rsi1h + " | RSI 4H: " + teknik.rsi4h + "\n"
    + "MACD 1H: " + (teknik.macd1h ? "histogram="+teknik.macd1h.histogram : "yok") + "\n"
    + "BB %B: " + (teknik.bb1h ? teknik.bb1h.pctB : "yok") + "\n"
    + "EMA20: " + teknik.ema20 + " | EMA50: " + teknik.ema50 + " | EMA200: " + teknik.ema200 + "\n"
    + "Hacim Spike: " + (teknik.hacim ? teknik.hacim.spike+"×" : "yok") + "\n"
    + "Momentum 5bar: " + (teknik.mom ? teknik.mom.mom5+"%" : "yok") + "\n"
    + "ICT FVG: " + (teknik.fvg ? teknik.fvg.tip+(teknik.fvg.icinde?" (içinde)":"") : "yok") + "\n"
    + "ICT OB: " + (teknik.ob ? teknik.ob.tip : "yok") + "\n"
    + "Sentiment Skoru: " + (sentiment||50) + "/100\n\n"
    + "SADECE JSON döndür, başka hiçbir şey yazma:\n"
    + '{"karar":"AL|SAT|BEKLE","guven":0-100,"gerekceler":"max 2 cümle","risk":"max 1 cümle"}';

  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role:"user", content:prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    var d = await r.json();
    var txt = d.content && d.content[0] && d.content[0].text || "";
    var m = txt.match(/\{[\s\S]*?\}/);
    if (m) return JSON.parse(m[0]);
  } catch(e) {}
  return { karar:"BEKLE", guven:50, gerekceler:"AI yanıt alınamadı", risk:"Belirsiz" };
}

// ─── İŞLEM YÖNETİMİ ──────────────────────────────────────────────────────────
function pozisyonAc(durum, sembol, fiyat, usdt) {
  if (durum.nakit < usdt) usdt = durum.nakit;
  if (usdt < 10) return null; // min 10 USDT
  var adet = usdt / fiyat;
  var stopLoss   = fiyat * (1 - STOP_LOSS_PCT);
  var takeProfit = fiyat * (1 + TAKE_PROFIT_PCT);
  durum.nakit -= usdt;
  durum.pozisyonlar[sembol] = {
    adet: adet,
    girisUSDT: usdt,
    girisFiyat: fiyat,
    acilisZamani: new Date().toISOString(),
    stopLoss: Math.round(stopLoss*100)/100,
    takeProfit: Math.round(takeProfit*100)/100,
  };
  var islem = {
    id: Date.now(),
    tip: "AL",
    sembol: sembol,
    fiyat: fiyat,
    usdt: Math.round(usdt*100)/100,
    adet: Math.round(adet*10000000)/10000000,
    zaman: new Date().toISOString(),
    stopLoss: Math.round(stopLoss*100)/100,
    takeProfit: Math.round(takeProfit*100)/100,
  };
  durum.islemler.unshift(islem);
  return islem;
}

function pozisyonKapat(durum, sembol, fiyat, neden) {
  var poz = durum.pozisyonlar[sembol];
  if (!poz) return null;
  var gelir = poz.adet * fiyat;
  var karZarar = gelir - poz.girisUSDT;
  var karZararPct = Math.round((karZarar/poz.girisUSDT)*10000)/100;
  durum.nakit += gelir;
  var islem = {
    id: Date.now(),
    tip: "SAT",
    sembol: sembol,
    fiyat: fiyat,
    usdt: Math.round(gelir*100)/100,
    adet: Math.round(poz.adet*10000000)/10000000,
    zaman: new Date().toISOString(),
    karZarar: Math.round(karZarar*100)/100,
    karZararPct: karZararPct,
    neden: neden || "Bot kararı",
    girisFiyat: poz.girisFiyat,
    girisTarihi: poz.acilisZamani,
  };
  durum.islemler.unshift(islem);
  delete durum.pozisyonlar[sembol];
  return islem;
}

function stopTakipKontrol(durum, sembol, fiyat) {
  var poz = durum.pozisyonlar[sembol];
  if (!poz) return null;
  if (fiyat <= poz.stopLoss)   return pozisyonKapat(durum, sembol, fiyat, "Stop-Loss tetiklendi");
  if (fiyat >= poz.takeProfit) return pozisyonKapat(durum, sembol, fiyat, "Take-Profit tetiklendi");
  return null;
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  var durum = getDurum();

  // GET: mevcut durumu döner
  if (req.method === "GET") {
    var portfolyoDeger = durum.nakit;
    Object.entries(durum.pozisyonlar).forEach(function(entry) {
      var poz = entry[1];
      portfolyoDeger += poz.adet * (poz.guncelFiyat || poz.girisFiyat);
    });
    var toplamKZ = portfolyoDeger - BASLANGIC_BAKIYE;
    return res.json({
      ok: true,
      durum: {
        nakit: Math.round(durum.nakit*100)/100,
        portfolyoDeger: Math.round(portfolyoDeger*100)/100,
        toplamKZ: Math.round(toplamKZ*100)/100,
        toplamKZPct: Math.round((toplamKZ/BASLANGIC_BAKIYE)*10000)/100,
        pozisyonlar: durum.pozisyonlar,
        sonIslemler: durum.islemler.slice(0,20),
        sonKararlar: durum.kararlar.slice(0,10),
        baslamaTarihi: durum.baslamaTarihi,
        sonGuncelleme: durum.sonGuncelleme,
        islemSayisi: durum.islemler.length,
      },
    });
  }

  // POST: karar döngüsü çalıştır
  if (req.method !== "POST") return res.status(405).end();

  var body = {};
  try { body = await req.json(); } catch(e) {}
  var gizliAnahtar = req.headers["x-bot-secret"] || body.secret;
  if (process.env.BOT_SECRET && gizliAnahtar !== process.env.BOT_SECRET) {
    return res.status(401).json({ hata:"Yetkisiz" });
  }

  // 1. Fiyat + teknik veri çek
  var teknikData = {};
  try {
    var fiyatR = await fetch(
      (process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000")
      + "/api/kripto-fiyat",
      { signal: AbortSignal.timeout(25000) }
    );
    var fiyatD = await fiyatR.json();
    teknikData = fiyatD.pariteler || {};
  } catch(e) {
    return res.status(500).json({ hata:"Fiyat alınamadı: "+e.message });
  }

  var kararLog = {
    zaman: new Date().toISOString(),
    kararlar: [],
    islemler: [],
  };

  // 2. Her parite için işlem döngüsü
  for (var i = 0; i < PARITELER.length; i++) {
    var sembol = PARITELER[i];
    var t = teknikData[sembol];
    if (!t || t.hata || !t.fiyat) continue;

    var fiyat = t.fiyat;

    // Mevcut pozisyon var mı? Stop/Take kontrol et
    if (durum.pozisyonlar[sembol]) {
      durum.pozisyonlar[sembol].guncelFiyat = fiyat;
      var kapanan = stopTakipKontrol(durum, sembol, fiyat);
      if (kapanan) {
        kararLog.islemler.push(kapanan);
        kararLog.kararlar.push({
          sembol: sembol,
          karar: "SAT (Otomatik)",
          fiyat: fiyat,
          neden: kapanan.neden,
          kz: kapanan.karZarar,
        });
        continue;
      }
    }

    // Teknik puan hesapla
    var teknikSonuc = teknikPuanla(t);
    var puan = teknikSonuc.puan;

    // AI karar al
    var ai = await aiKarar(sembol, t, puan);

    // Final karar
    var finalKarar = "BEKLE";
    if (ai.karar === "AL" && puan >= MIN_SINYAL_SKOR && !durum.pozisyonlar[sembol]) {
      finalKarar = "AL";
    } else if (ai.karar === "SAT" && puan <= (100-MIN_SINYAL_SKOR) && durum.pozisyonlar[sembol]) {
      finalKarar = "SAT";
    } else if (ai.karar === "AL" && puan >= MIN_SINYAL_SKOR && durum.pozisyonlar[sembol]) {
      finalKarar = "TUTE"; // pozisyon var, al sinyali = tut
    }

    var kararItem = {
      sembol: sembol,
      fiyat: fiyat,
      puan: puan,
      aiKarar: ai.karar,
      aiGuven: ai.guven,
      finalKarar: finalKarar,
      gerekceler: ai.gerekceler,
      risk: ai.risk,
      sinyaller: teknikSonuc.sinyaller.slice(0,5),
      zaman: new Date().toISOString(),
    };

    // İşlem yap
    if (finalKarar === "AL") {
      var kullanilacakUSDT = Math.min(
        durum.nakit * MAX_POZISYON_PCT,
        durum.nakit * 0.95
      );
      if (kullanilacakUSDT >= 10) {
        var islem = pozisyonAc(durum, sembol, fiyat, kullanilacakUSDT);
        if (islem) {
          kararItem.islem = islem;
          kararLog.islemler.push(islem);
        }
      }
    } else if (finalKarar === "SAT" && durum.pozisyonlar[sembol]) {
      var satIslem = pozisyonKapat(durum, sembol, fiyat, "Bot kararı: "+ai.gerekceler);
      if (satIslem) {
        kararItem.islem = satIslem;
        kararLog.islemler.push(satIslem);
      }
    }

    kararLog.kararlar.push(kararItem);
  }

  durum.kararlar.unshift(kararLog);
  if (durum.kararlar.length > 50) durum.kararlar = durum.kararlar.slice(0,50);
  durum.sonGuncelleme = new Date().toISOString();
  global.__botDurum = durum;

  var portfolyoDeger = durum.nakit;
  Object.values(durum.pozisyonlar).forEach(function(poz) {
    portfolyoDeger += poz.adet * (poz.guncelFiyat || poz.girisFiyat);
  });

  res.json({
    ok: true,
    kararSayisi: kararLog.kararlar.length,
    islemSayisi: kararLog.islemler.length,
    kararlar: kararLog.kararlar,
    islemler: kararLog.islemler,
    portfolyoDeger: Math.round(portfolyoDeger*100)/100,
    nakit: Math.round(durum.nakit*100)/100,
    toplamKZ: Math.round((portfolyoDeger-BASLANGIC_BAKIYE)*100)/100,
  });
}

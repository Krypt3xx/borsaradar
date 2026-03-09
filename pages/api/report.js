// Gün sonu ve haftalık rapor üreticisi
// Haberler + gerçek piyasa verileri + AI analiz = profesyonel rapor

const RAPOR_PROMPT_GUNLUK = `Sen Goldman Sachs Türkiye Masası baş stratejisti ve CIO'sunun (Chief Investment Officer) bizzat hazırladığı gün sonu raporunu yazıyorsun. Bu rapor hedge fonlar, kurumsal yatırımcılar ve yüksek net değerli bireysel yatırımcılar tarafından okunuyor.

Sana verilen:
1. Günün kritik haberleri (kategori + etki + kaynak ile birlikte)
2. Kapanış piyasa verileri (BIST100, döviz, altın, petrol, global endeksler)
3. Tarih ve bağlam

Aşağıdaki formatta DETAYLI gün sonu raporu hazırla:

═══════════════════════════════════════
📊 GÜN SONU RAPORU — [TARİH]
Hazırlayan: BorsaRadar AI Analiz Sistemi
═══════════════════════════════════════

## 🌍 GLOBAL PİYASALAR ÖZETİ
Bugün global piyasaların genel seyri: Her büyük endeks için kapanış ve yön belirt.
- ABD (S&P500, NASDAQ, Dow): ne oldu, neden
- Avrupa (DAX, FTSE, CAC): ne oldu, neden  
- Asya (Nikkei, Hang Seng): ne oldu, neden
- Ortak tema ve anlatı: Bugün piyasaları yönlendiren ana güç neydi?

## 🇹🇷 BORSA İSTANBUL & TL RAPORU
- BIST100 kapanış: Seviye, günlük/haftalık değişim, trend
- En çok yükselen 3 sektör ve neden
- En çok düşen 3 sektör ve neden
- Öne çıkan bireysel hisseler
- USD/TRY kapanış: Yön, teknik görünüm, TCMB beklentisi
- Döviz hareketinin iç piyasaya etkisi

## 📰 GÜNÜN KRİTİK HABERLERİ & PİYASA ETKİLERİ
Her kritik haber için:
**[HABER BAŞLIĞI]** | Kaynak: X | Etki: YÜKSEK/ORTA
→ Doğrudan etkilenen varlıklar ve nasıl etkilendi
→ Zincir etki: hangi sektörler ve neden
→ Fiyatlara ne kadar yansıdı, ne kadar yansımadı (gecikmiş etki)?

## 💡 BUGÜNÜN EN ÖNEMLİ FIRSATLARI
Her öneri için tam işlem planı:
**[SEMBOL]** | 📈 AL veya 📉 SAT veya ⏸ BEKLE
- Giriş seviyesi: X.XX
- Hedef 1: X.XX (%+/-XX) | Hedef 2: X.XX (%+/-XX)
- Stop-loss: X.XX (%−XX)
- Zaman ufku: X gün/hafta
- Güven skoru: %XX
- Katalizör: Neden şimdi?
- Risk: Hangi gelişme bu senaryoyu bozar?

BIST Evrensi: TUPRS, THYAO, EREGL, ASELS, GARAN, AKBNK, YKBNK, BIMAS, SISE, KCHOL, TCELL, PETKM, FROTO, TOASO, OYAKC, PGSUS, TAVHL, KOZAL, MGROS, SAHOL
Global: NVDA, AAPL, MSFT, META, XOM, CVX, GLD, USO, TLT, EEM, ARGT

## 💱 DÖVİZ & EMTİA RAPORU
- USD/TRY: Teknik görünüm, kritik seviyeler, yarın beklentisi
- EUR/TRY: Yön
- Altın (ons/$): Merkez bankası alımları, riskten kaçış mı?
- Brent Petrol: OPEC beklentisi, Türkiye'ye enerji maliyeti etkisi
- Altın/TL (gram): BIST yatırımcısı için önem
- Kripto (BTC): Risk iştahı göstergesi olarak değerlendir

## ⚠️ RİSK RADARINDA BUGÜN
- Beklenmedik gelişme var mı?
- Yarın için takvim: Hangi veri/toplantı piyasayı etkileyebilir?
- Jeopolitik risk seviyesi: DÜŞÜK / ORTA / YÜKSEK — neden?
- TCMB / Fed politika riski

## 🔮 YARIN İÇİN SENARYO ANALİZİ
🟢 Olumlu senaryo (%XX olasılık):
Koşul: ... → BIST beklentisi: ... → En iyi pozisyon: ...

🟡 Baz senaryo (%XX olasılık):
Koşul: ... → BIST beklentisi: ... → Önerilen duruş: ...

🔴 Olumsuz senaryo (%XX olasılık):
Koşul: ... → BIST beklentisi: ... → Korunma stratejisi: ...

## ⚡ YÖNETICI ÖZETİ (3 dakikada oku)
- Bugünün 1 cümle özeti
- Portfolyo için net öneri: ARTIR / AZALT / KORU pozisyonları
- Yarın takip edilecek en kritik 3 gelişme

─────────────────────────────────────
⚠️ Bu rapor yapay zeka tarafından üretilmiş olup yatırım tavsiyesi değildir.
Tüm yatırım kararları kişisel risk toleransınıza göre verilmelidir.
─────────────────────────────────────`;

const RAPOR_PROMPT_HAFTALIK = `Sen dünyaca tanınmış bir makro ekonomist ve portföy yöneticisisin. Bridgewater Associates ve BlackRock'ta çalışmış, şimdi bağımsız strateji danışmanlığı yapıyorsun. Haftalık strateji notunu yazıyorsun.

Sana verilen: Haftanın günlük haber özeti, piyasa verileri, önemli gelişmeler.

Bu notu Türkiye odaklı yatırımcılar için yaz. Format:

═══════════════════════════════════════
📅 HAFTALIK STRATEJİ NOTU
[Tarih Aralığı] — Hafta [No]
BorsaRadar AI Analiz Sistemi
═══════════════════════════════════════

## 📊 HAFTALIK PERFORMANS KARTI
Her varlık için: Haftalık değişim % ve yön
| Varlık | Kapanış | Haftalık Δ | Trend |
Tablo formatında: BIST100, USD/TRY, EUR/TRY, Altın$, Brent, BTC, S&P500, NASDAQ, VIX

## 🌍 HAFTANIN HİKAYESİ
Bu haftayı anlatan ana anlatı neydi? 300-400 kelime derinlemesine analiz.
- Merkez bankaları ne yaptı/söyledi?
- Jeopolitik gelişmeler neydi?
- Ekonomik veriler ne gösterdi?
- Sürpriz gelişmeler nelerdi?

## 🇹🇷 TÜRKİYE EKONOMİSİ HAFTALIK DEĞERLENDİRME
- BIST100 haftalık performans ve sektörel dağılım
- TL'nin seyri ve TCMB politikası
- Enflasyon/faiz dinamiği güncelleme
- Yabancı yatırımcı akışları (tahmini)
- İç siyasi gelişmelerin piyasaya etkisi
- Kredi risk primi (CDS) hareketi

## 📰 HAFTANIN EN ETKİLİ 5 HABERİ
Her biri için: Haber → Anlık etki → Kalıcı etki → Beklenti değişimi

## 💼 PORTFÖY STRATEJİSİ — GELECEK HAFTA
### Agresif Portföy (Yüksek Risk)
Ağırlıklar ve önerilen pozisyonlar, stop-loss ve hedefler ile

### Dengeli Portföy (Orta Risk)
Ağırlıklar ve önerilen pozisyonlar

### Defansif Portföy (Düşük Risk)
Ağırlıklar ve önerilen pozisyonlar

## 🔭 ÖNÜMÜZDEKI HAFTA TAKVİMİ
Gün gün: Hangi kritik veri, toplantı, açıklama var?
Her biri için: Beklenti, sürpriz riski, piyasa etkisi

## ⚠️ HAFTALIK RİSK MATRİSİ
| Risk | Olasılık | Etki | Korunma |
Tablo formatında 5-7 risk faktörü

## 🎯 GELECEK HAFTA İÇİN EN İYİ 5 İŞLEM FİKRİ
Her biri için tam plan: sembol, yön, giriş, hedefler, stop, zaman ufku, katalizör

## ⚡ YÖNETİCİ KARAR ÖZETİ
- Haftanın notu: X/10
- Genel piyasa duruşu: BULLISH / NEUTRAL / BEARISH
- BIST için: ARTIR / KORU / AZALT
- TL için: GÜÇLÜ / NÖTR / ZAYIF beklenti
- Önümüzdeki haftanın kritik eşiği

─────────────────────────────────────
⚠️ Bu analiz yapay zeka tarafından üretilmiş olup yatırım tavsiyesi değildir.
─────────────────────────────────────`;

async function callAI(prompt, metin, tip, apiKey) {
  const messages = [{ role: "user", content: metin }];
  
  if (tip === "groq") {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 3000,
        temperature: 0.65,
        messages: [{ role: "system", content: prompt }, ...messages],
      }),
      signal: AbortSignal.timeout(90000),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Groq ${r.status}`);
    return d.choices?.[0]?.message?.content || "";
  }

  if (tip === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 3000,
        temperature: 0.65,
        messages: [{ role: "system", content: prompt }, ...messages],
      }),
      signal: AbortSignal.timeout(90000),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `GPT ${r.status}`);
    return d.choices?.[0]?.message?.content || "";
  }

  if (tip === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 3000,
        system: prompt,
        messages,
      }),
      signal: AbortSignal.timeout(90000),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Claude ${r.status}`);
    return d.content?.map(b => b.text || "").join("") || "";
  }
}

async function getPiyasaVerileri() {
  const veriler = {};
  try {
    // Döviz — kendi endpoint'imizi çağır
    const dovizR = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://borsa-radar.vercel.app"}/api/doviz`, { signal: AbortSignal.timeout(8000) });
    if (dovizR.ok) {
      const d = await dovizR.json();
      veriler.doviz = d.kurlar;
    }
  } catch {}

  try {
    // Yahoo'dan endeksler
    const semboller = ["^GSPC","^IXIC","^DJI","^FTSE","^GDAXI","^N225","XU100.IS","GC=F","BZ=F","BTC-USD","^VIX"];
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${semboller.join(",")}`,
      { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://finance.yahoo.com" }, signal: AbortSignal.timeout(8000) }
    );
    if (r.ok) {
      const d = await r.json();
      const q = d?.quoteResponse?.result || [];
      const isimler = { "^GSPC":"S&P500","^IXIC":"NASDAQ","^DJI":"Dow Jones","^FTSE":"FTSE100","^GDAXI":"DAX","^N225":"Nikkei","XU100.IS":"BIST100","GC=F":"Altın($)","BZ=F":"Brent","BTC-USD":"Bitcoin","^VIX":"VIX" };
      veriler.endeksler = {};
      q.forEach(item => {
        if (item.regularMarketPrice) {
          veriler.endeksler[isimler[item.symbol] || item.symbol] = {
            fiyat: item.regularMarketPrice,
            degisim: item.regularMarketChangePercent?.toFixed(2),
            degisimTL: item.regularMarketChange?.toFixed(2),
          };
        }
      });
    }
  } catch {}

  return veriler;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { haberler = [], tip = "gunluk", haftalikHaberler = [] } = req.body;
  const GROQ_KEY   = process.env.GROQ_API_KEY;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;

  // Piyasa verilerini çek
  const piyasa = await getPiyasaVerileri();

  const tarih = new Date().toLocaleDateString("tr-TR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Europe/Istanbul"
  });
  const saat = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

  // Piyasa verilerini metne çevir
  const piyasaMetni = piyasa.doviz ? `
CANLI DÖVİZ KURLARI (${saat} itibarıyla):
- USD/TRY: ${piyasa.doviz.USDTRY || "N/A"} (Kaynak: ${piyasa.doviz.kaynak || "?"})
- EUR/TRY: ${piyasa.doviz.EURTRY || "N/A"}
- GBP/TRY: ${piyasa.doviz.GBPTRY || "N/A"}
- Altın (Gram/TL): ${piyasa.doviz.ALTIN_TL || "N/A"} TL
- Altın (Ons/$): ${piyasa.doviz.ALTIN || "N/A"}` : "";

  const endeksMetni = piyasa.endeksler ? `
PİYASA ENDEKSLERİ:
${Object.entries(piyasa.endeksler).map(([isim, v]) =>
  `- ${isim}: ${v.fiyat?.toLocaleString("tr-TR")} (${v.degisim >= 0 ? "+" : ""}${v.degisim}%)`
).join("\n")}` : "";

  // Haberleri formatla
  const formatHaberler = (hList) => hList
    .slice(0, tip === "haftalik" ? 50 : 25)
    .map((h, i) => `${i+1}. [${h.kategori || "GENEL"}] [ETKİ:${h.etki || "?"}] ${h.baslik} — Kaynak: ${h.kaynak || "?"} (${h.zaman || ""})`)
    .join("\n");

  const anaHaberler = tip === "haftalik"
    ? [...haberler, ...haftalikHaberler]
    : haberler;

  const kullanicıMesaji = `
TARİH: ${tarih} — ${saat}
RAPOR TİPİ: ${tip === "haftalik" ? "HAFTALIK STRATEJİ NOTU" : "GÜN SONU RAPORU"}

${piyasaMetni}
${endeksMetni}

${tip === "haftalik" ? "HAFTANIN HABERLERİ" : "GÜNÜN HABERLERİ"} (${anaHaberler.length} haber):
${formatHaberler(anaHaberler)}

Yukarıdaki HABERLERİ ve PİYASA VERİLERİNİ birlikte analiz ederek ${tip === "haftalik" ? "haftalık strateji notunu" : "gün sonu raporunu"} hazırla.
Piyasa verilerindeki GERÇEK rakamları kullan — tahmin yapma, verilen sayıları kullan.
Döviz kurları için yukarıdaki CANLI KURLARI kullan, asla kendi tahmininle kur yazmayacaksın.
`;

  const prompt = tip === "haftalik" ? RAPOR_PROMPT_HAFTALIK : RAPOR_PROMPT_GUNLUK;

  // 3 AI paralel çalıştır
  const [groqR, gptR, claudeR] = await Promise.allSettled([
    GROQ_KEY   ? callAI(prompt, kullanicıMesaji, "groq",     GROQ_KEY)   : Promise.reject(new Error("GROQ_API_KEY eksik")),
    OPENAI_KEY ? callAI(prompt, kullanicıMesaji, "openai",   OPENAI_KEY) : Promise.reject(new Error("OPENAI_API_KEY eksik")),
    CLAUDE_KEY ? callAI(prompt, kullanicıMesaji, "anthropic",CLAUDE_KEY) : Promise.reject(new Error("ANTHROPIC_API_KEY eksik")),
  ]);

  res.status(200).json({
    tip,
    tarih,
    saat,
    piyasa,
    llama: {
      text:  groqR.status === "fulfilled" ? groqR.value : null,
      error: groqR.status === "rejected"  ? groqR.reason?.message : null,
    },
    gpt: {
      text:  gptR.status === "fulfilled" ? gptR.value : null,
      error: gptR.status === "rejected"  ? gptR.reason?.message : null,
    },
    claude: {
      text:  claudeR.status === "fulfilled" ? claudeR.value : null,
      error: claudeR.status === "rejected"  ? claudeR.reason?.message : null,
    },
  });
}

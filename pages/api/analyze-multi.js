// ─── GÜÇLÜ FİNANSAL ANALİZ PROMPT ───────────────────────────────────────────
// Amaç: Haber akışından yön belirlemek, pozisyon almak
const SYSTEM_PROMPT = `Sen 20 yıllık deneyime sahip, makroekonomik analiz ve teknik analizi harmanlayan bir baş yatırım stratejistisin. Goldman Sachs, JPMorgan ve Bridgewater Associates'te çalışmış, özellikle gelişmekte olan piyasalar ve Türkiye konusunda uzmanlaşmışsın.

GÖREV: Verilen haberi çok boyutlu analiz ederek net yön kararı ve işlem fırsatları belirle.

## 1. HABER ETKİ SKORU (1-10)
Önce haberin piyasa üzerindeki olası etkisini 1-10 arası puanla ve gerekçe.

## 2. ZİNCİR ETKİ ANALİZİ
Domino etkisini adım adım göster:
OLAY → [Birincil etki] → [İkincil etki] → [Sektörel yansıma] → [BIST/TL etkisi]

## 3. SEKTÖREL YÖN HARİTASI
Her sektör için: ▲ OLUMLU / ▼ OLUMSUZ / ◆ NÖTR ve kısa neden:
- Enerji & Petrokimya:
- Bankacılık & Finans:
- Savunma & Havacılık:
- Perakende & Tüketim:
- İnşaat & GYO:
- Teknoloji:
- Altın & Emtia:

## 4. SOMUT İŞLEM ÖNERİLERİ
Her öneri için ayrıntılı:
**[SEMBOL]** | Yön: 📈 AL veya 📉 SAT VEYA ⏸ BEKLE
- Hedef: %±XX (1-4 hafta)
- Stop-loss: %±XX  
- Güven: %XX
- Giriş zamanlaması: Hemen / Seans başı / Düzeltme bekle
- Ana katalizör: neden bu hisse?

BIST Öncelikli: TUPRS, THYAO, EREGL, ASELS, GARAN, AKBNK, YKBNK, BIMAS, SISE, KCHOL, TCELL, PETKM, FROTO, TOASO, OYAKC
Global: NVDA, XOM, CVX, GLD, USO, TLT, UUP, EEM

## 5. DÖVİZ & ALTIN POZİSYONU
- USD/TRY: Yön + Hedef seviye
- EUR/TRY: Yön
- Altın (XAU/USD): Yön + Hedef
- Brent Petrol: Yön + Hedef

## 6. RİSK FAKTÖRLER & SENARYO
🟢 Baz senaryo (%XX olasılık): Beklenti ve hedefler
🟡 Boğa senaryosu (%XX olasılık): Ne olursa ne değişir
🔴 Ayı senaryosu (%XX olasılık): En kötü durum ve önlem

## 7. NET KARAR ÖZETİ
⚡ En güçlü 2-3 işlem fırsatı, öncelik sırası ile
⏱ Zaman horizonu: Kısa vade (1 hafta) / Orta vade (1 ay)
📊 Portföy önerisi: Agresif / Defansif / Nötr

Türkçe yaz. Belirsizliği kabul et, spekülatif ise "düşük güven" belirt. Rakamlar gerçekçi olsun.
⚠️ Bu analiz yatırım tavsiyesi değildir, sadece analitik değerlendirmedir.`;

// ── Claude (Anthropic) ─────────────────────────────────────────────────────
async function callClaude(metin, apiKey) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Şu haberi analiz et ve yatırım yönü belirle:\n\n"${metin}"` }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Claude HTTP ${r.status}`);
  return d.content?.map(b => b.text || "").join("") || "";
}

// ── ChatGPT (OpenAI gpt-4o-mini) ───────────────────────────────────────────
async function callGPT(metin, apiKey) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Şu haberi analiz et ve yatırım yönü belirle:\n\n"${metin}"` },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `GPT HTTP ${r.status}`);
  return d.choices?.[0]?.message?.content || "";
}

// ── Groq Llama 3.3 70B (Ücretsiz) ─────────────────────────────────────────
async function callGroq(metin, apiKey) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Şu haberi analiz et ve yatırım yönü belirle:\n\n"${metin}"` },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Groq HTTP ${r.status}`);
  return d.choices?.[0]?.message?.content || "";
}

// ── HANDLER ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { metin } = req.body;
  if (!metin) return res.status(400).json({ error: "metin boş" });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_KEY    = process.env.OPENAI_API_KEY;
  const GROQ_KEY      = process.env.GROQ_API_KEY;

  // Gerçek zamanlı döviz kurunu çek ve prompt'a enjekte et
  let kurBilgisi = "";
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const dovizR = await fetch(`${baseUrl}/api/doviz`, { signal: AbortSignal.timeout(5000) });
    if (dovizR.ok) {
      const d = await dovizR.json();
      if (d.kurlar?.USDTRY) {
        kurBilgisi = `\n\n⚠️ GERÇEK ZAMANLI DÖVİZ KURLARI (${d.guncelleme} itibarıyla — bu rakamları kullan, asla tahmin yapma):\n- USD/TRY: ${d.kurlar.USDTRY}\n- EUR/TRY: ${d.kurlar.EURTRY || "N/A"}\n- GBP/TRY: ${d.kurlar.GBPTRY || "N/A"}\n- Altın (Gram/TL): ${d.kurlar.ALTIN_TL || "N/A"} TL\n- Altın (Ons/$): ${d.kurlar.ALTIN || "N/A"}\n- Kaynak: ${d.kurlar.kaynak}\n`;
      }
    }
  } catch {}

  const metinKurlu = metin + kurBilgisi;

  const [claudeR, gptR, groqR] = await Promise.allSettled([
    ANTHROPIC_KEY
      ? callClaude(metinKurlu, ANTHROPIC_KEY)
      : Promise.reject(new Error("ANTHROPIC_API_KEY eksik — Vercel'e ekle")),
    OPENAI_KEY
      ? callGPT(metinKurlu, OPENAI_KEY)
      : Promise.reject(new Error("OPENAI_API_KEY eksik")),
    GROQ_KEY
      ? callGroq(metinKurlu, GROQ_KEY)
      : Promise.reject(new Error("GROQ_API_KEY eksik — console.groq.com'dan ücretsiz alın")),
  ]);

  res.status(200).json({
    claude: {
      text:  claudeR.status === "fulfilled" ? claudeR.value : null,
      error: claudeR.status === "rejected"  ? claudeR.reason?.message : null,
      model: "Claude Haiku",
    },
    gpt: {
      text:  gptR.status === "fulfilled" ? gptR.value : null,
      error: gptR.status === "rejected"  ? gptR.reason?.message : null,
      model: "GPT-4o Mini",
    },
    gemini: {
      text:  groqR.status === "fulfilled" ? groqR.value : null,
      error: groqR.status === "rejected"  ? groqR.reason?.message : null,
      model: "Llama 3.3 70B",
    },
  });
}
